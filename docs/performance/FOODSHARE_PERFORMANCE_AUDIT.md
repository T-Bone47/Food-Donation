# FoodShare Interaction Latency, Navigation and Application Performance Audit
**Audit Date:** November 3, 2026  
**Auditor:** Principal Frontend Performance Engineer, Senior Next.js Architect & Backend Performance Engineer  
**Baseline Test Execution Date:** November 3, 2026, 01:22 AM IST  

---

## 1. Executive Summary & Baseline Measurements

An interaction latency audit was performed on the FoodShare full-stack platform (Next.js 15, React 19, Express 5, Supabase PostgreSQL, and Supabase SSE Real-Time).

### Baseline Measured Latencies (Playwright Chromium Instrumentation)

| Interaction / Flow | Target Route | Measured Baseline Latency | Root Bottleneck | Optimization Objective |
| :--- | :--- | :--- | :--- | :--- |
| **1. Custody Tracking Inspection** | `/acceptpage/[id]` | **272 ms** | Full page route transition; missing in-memory data transfer; skeleton flash | **< 30 ms** via instant slide-over sheet modal with cached details |
| **2. Dashboard to My Donations** | `/mydonations` | **293 ms** | `useResource` initial mount with `data: null`, skeleton flash, unshared Axios cache | **< 60 ms** via SWR in-memory caching and route prefetch |
| **3. My Donations back to Dashboard** | `/donordash` | **193 ms** | Component unmount discards in-memory cache; re-fetch over HTTP | **< 40 ms** via cached memory store |
| **4. Navigation to Notifications** | `/notification` | **247 ms** | `useCurrentUser` 1-tick delay in `AppShell`; fresh `useResource` network load | **< 50 ms** via session caching and route prefetch |
| **5. Navigation to Profile** | `/profile` | **245 ms** | AppShell skeleton mount; unmemoized user object | **< 50 ms** via in-memory user cache |
| **6. Navigation to Create Donation** | `/donate` | **352 ms** | Multi-step form asset loading and geocoding setup; route compilation | **< 80 ms** via route prefetch |
| **7. Role Switching (Donor -> Volunteer)**| `/volunteerdash` | **1247 ms** | Sequential auth session request; lack of route prefetching; modal button-only click area | **< 300 ms** via full-card tap, route prefetch, and instant feedback |
| **8. Dashboard Initial Load (Warm)** | `/donordash` | **1270 ms** | 3 parallel HTTP endpoints (`/stats`, `/mine`, `/personal`) over network | **< 400 ms** via resource caching |

---

## 2. Interaction-by-Interaction Deep Dive

### Interaction 1: "Inspect Custody Tracking" / "View Custody Progress"
- **Component & Route:** `frontend/src/app/donordash/page.tsx` -> `frontend/src/app/acceptpage/[id]/page.tsx`
- **Event Handler:** `<Link href={`/acceptpage/${d.id}`}>`
- **Navigation Mechanism:** Next.js Client Route Transition
- **API Calls Triggered:** `GET /api/v1/donations/:id`
- **Root Causes:**
  1. **Route Departure:** The user is taken away from the donor dashboard to `/acceptpage/[id]` to view custody progress, causing disorientation and context loss.
  2. **Discarded In-Memory State:** The donor dashboard already possesses the donation's title, category, quantity, pickup address, and lifecycle status in `donations.data`. `/acceptpage/[id]` does not accept or read this pre-existing state, instead mounting with `data: null` and rendering `<ListSkeleton />`.
  3. **No Immediate Feedback:** Clicking the button provides no pressed or active visual confirmation until Next.js begins the page change.
- **Proposed Correction:**
  - Build an instant, presentation-grade `<CustodyTrackingDrawer />` right on the Donor Dashboard.
  - Clicking "Inspect Custody Tracking" or "View Custody Progress" immediately opens the modal (`< 16 ms`), displaying all known donation attributes instantly.
  - Concurrently fetch detailed custody verification timestamps and courier notes asynchronously in the background.
  - Cache donation details in the global resource cache so `/acceptpage/[id]` direct URL visits also render immediately with zero skeleton flash.

---

### Interaction 2: Local Navigation (`/donordash` <-> `/mydonations` <-> `/notification` <-> `/profile`)
- **Component & Route:** `AppShell.tsx`, `AppSidebar.tsx`, `use-resource.ts`, `session.ts`
- **Navigation Mechanism:** Next.js `<Link>`
- **API Calls Triggered:** `GET /api/v1/donations/mine`, `GET /api/v1/notifications`, `GET /api/v1/auth/me`
- **Root Causes:**
  1. **1-Tick AppShell Delay (`session.ts`):** `useCurrentUser()` initialized `ready: false`. On client route transitions, `AppShell` evaluated `!ready`, temporarily mounting a `<Skeleton />` before rendering children.
  2. **Lack of In-Memory SWR (`use-resource.ts`):** `useResource()` always initialized with `{ data: null, error: null, loading: true }`. When navigating away and returning, existing data was wiped from memory, causing a visible layout jump.
  3. **Axios Short TTL (2.5s):** The client cache was strictly 2.5s and keyed by exact query parameters, causing unnecessary cache misses between limit variations (e.g. limit 10 on dashboard vs limit 12 on mydonations).
- **Proposed Correction:**
  - Maintain an in-memory session reference (`cachedUser`) so `useCurrentUser()` initializes with `ready: true` on subsequent client route navigations.
  - Implement an in-memory SWR cache in `useResource` keyed by resource name/params. If cached data is present, initialize with `data: cachedData, loading: false` and revalidate silently in the background.

---

### Interaction 3: Role Switching (Demo Role Selector)
- **Component:** `DemoRoleSelectorModal.tsx`
- **Event Handler:** `handleSelectRole(role)`
- **API Calls Triggered:** `POST /api/v1/demo/session`
- **Root Causes:**
  1. **Restricted Hit Target:** Only the nested `<Button>` inside each card handled clicks. Clicking the outer card produced zero response, feeling sluggish or broken.
  2. **Uncached Route Navigation:** After obtaining the demo token, `router.push(destination)` navigated to the new role dashboard without prior prefetching, forcing the browser to fetch the bundle and 3 role-specific APIs sequentially.
  3. **No Active Transition State:** The user received no visual indication that the role switch was progressing other than a small spinner on the button.
- **Proposed Correction:**
  - Make the entire role card clickable with `active:scale-[0.98]` tactile depression feedback.
  - Prefetch the destination route upon card hover or focus.
  - Add an immediate banner/progress state in the modal confirming the role transition.

---

### Interaction 4: Create Donation Submission
- **Component & Route:** `frontend/src/app/donate/page.tsx`
- **Event Handler:** `submit(e: FormEvent)`
- **API Calls Triggered:** `POST /api/v1/donations`
- **Root Causes:**
  1. **Button Active State:** The button changed text to `"Publishing donation…"` but lacked an explicit progress/loading bar and did not disable navigation links during the in-flight mutation.
  2. **Cache Invalidation:** After creating a donation, `clearApiCache()` ran, but the donor dashboard was not pre-warmed with the newly created item.
- **Proposed Correction:**
  - Add an inline indeterminate progress meter on the form during submission.
  - Guard against double-clicks with an active submission ref.
  - Optimistically seed the donor donation cache with the new donation response upon success.

---

### Interaction 5: Real-Time SSE Stream Fanout
- **Component:** `realtime.ts`, `donordash/page.tsx`, `volunteerdash/page.tsx`, `ngodash/page.tsx`
- **Root Causes:**
  1. `clearApiCache()` was called unconditionally on every SSE message.
  2. Subscribed dashboards triggered 3 parallel `.reload(true)` requests on every broadcast, even for events unrelated to their scope.
- **Proposed Correction:**
  - Add a 150ms debounced revalidation queue so multiple rapid lifecycle events (e.g., claimed + assigned) trigger only a single consolidated revalidation.
  - Selectively invalidate cache entries rather than wiping the entire cache.

---

## 3. Implementation Plan & Priority

1. **Step 1:** Enhance `session.ts` and `use-resource.ts` with in-memory SWR caching to eliminate navigation skeleton flickers.
2. **Step 2:** Build the instant `<CustodyTrackingModal />` in `donordash/page.tsx` with immediate feedback and asynchronous log retrieval.
3. **Step 3:** Optimize `Button.tsx` and interactive controls with immediate active pressed feedback (`active:scale-[0.98]`).
4. **Step 4:** Optimize `DemoRoleSelectorModal.tsx` with full-card interactivity and route prefetching.
5. **Step 5:** Add performance measurement instrumentation and execute post-optimization benchmarks.

