# Reference Frontend Inventory

**Source Archive:** `SIH-HACKATHON-lastupdate (1).zip`  
**Extracted Root:** `SIH-HACKATHON-lastupdate/frontend`  
**Auditor:** Principal Frontend Architect & Integration Specialist  
**Status:** Complete Technical Baseline  

---

## 1. Executive Summary

This document establishes the exhaustive technical, visual, structural, and component baseline of the reference frontend discovered in `SIH-HACKATHON-lastupdate (1).zip`. The reference application represents the Annapurna / FeedChain food donation and rescue platform designed for the Smart India Hackathon (SIH). It features a distinctive emerald-and-green aesthetic (`bg-green-50`, `bg-green-100`, `text-green-700`, `bg-green-600 hover:bg-green-700`), white elevated card containers (`bg-white shadow-md rounded-lg`), role-specific top navigation bars (`Navbar.tsx`, `volunavbar.tsx`, `adminnavbar.tsx`), animated transitions (`framer-motion`), and floating real-time AI assistance (`Chatbot.tsx`).

---

## 2. Directory & File Inventory

### 2.1 Configuration & Tooling
| Path | Size (Bytes) | Role & Characteristics |
| :--- | :--- | :--- |
| `package.json` | 927 B | Next.js 15.5.3, React 19.1.0, Tailwind v4, Framer Motion, Leaflet, Axios, Radix UI |
| `package-lock.json` | 273 KB | Locked dependency tree matching current FoodShare core |
| `next.config.ts` | 136 B | Standard Next.js config |
| `tailwind.config.ts` | 425 B | Tailwind content paths & gradient extension |
| `postcss.config.js` | 98 B | PostCSS with `@tailwindcss/postcss` and `autoprefixer` |
| `tsconfig.json` | 598 B | Strict TypeScript compiler configuration |
| `eslint.config.mjs` | 511 B | Next.js flat ESLint config |
| `components.json` | 502 B | Shadcn UI configuration file |

### 2.2 Global Styling & Typography
| Path | Style Characteristics |
| :--- | :--- |
| `src/app/globals.css` | Tailwind v4 `@theme inline`, OKLCH design variables (`--background`, `--foreground`, `--primary`, `--card`, `--radius`), dark mode variants, base layer application |
| `src/app/layout.tsx` | Root layout importing Inter font (`next/font/google`), mounting `globals.css`, global metadata, and persistent floating `<Chatbot />` |
| `src/app/styles/globals.css` | Legacy redundant style path (retains standard `@tailwind` directives) |

### 2.3 Pages & Route Structure
| Route | Source File | Visual Structure & Sections |
| :--- | :--- | :--- |
| `/` | `src/app/page.tsx` (311 lines) | **Step 1:** Fullscreen background `signupbg.png`, blurred translucent modal card (`bg-white/95 backdrop-blur-md shadow-2xl rounded-3xl p-10`), role selector buttons with hover scale (Donor, Volunteer, Admin). <br>**Step 2:** Form with Name, Email, Organization, Phone, Password, Location, GPS trigger button, and Submit. |
| `/login` | `src/app/login/page.tsx` (129 lines) | Fullscreen background image `signupbg.png` with gradient overlay `bg-gradient-to-br from-green-50/80 to-green-200/80`. Floating `motion.div` card, Email, Password, submit button `bg-green-600 hover:bg-green-700`, link to `/`. |
| `/donordash` | `src/app/donordash/page.tsx` (174 lines) | Top `Navbar`. Hero banner: *"Together Against Food Waste"* (`bg-green-100`). Geolocation card with GPS coordinates & address lookup. Ready to Donate CTA button (`/donate`). Impact counters: Meals Served, Volunteers, Active Donations. |
| `/donate` | `src/app/donate/page.tsx` (249 lines) | Top `Navbar`. Clean white card (`max-w-2xl bg-white shadow-lg p-8`). Food Details: dynamic multi-food count input (`numFoods`), dropdown selection, servings, prep time. Location Details: GPS auto-detect, Pincode, Area, State. Google Maps embed iframe. |
| `/mydonations` | `src/app/mydonations/page.tsx` (117 lines) | Top `Navbar`. Hero banner: *"My Donations 🍲"*. Card list with status badges (`Pending`, `Accepted`, `Picked`, `Delivered`). Food name, Servings, Prep time, Location, Best before, and Volunteer contact info banner. |
| `/volunteerdash`| `src/app/volunteerdash/page.tsx` (191 lines) | Top `volunavbar`. Hero banner: *"Be a Food Rescue Hero"*. Nearby Food Donations 2-3 column card grid with pickup address, preparation time, servings, and *"Mark as Volunteer Found"* / *"Accept Donation"* action. Impact stats: Meals Picked Up, Distance Covered, Reward Points. Volunteer Rewards badges (🥇 Gold, 🥈 Silver, 🥉 Bronze). |
| `/acceptpage` | `src/app/acceptpage/page.tsx` (132 lines) | Top `volunavbar`. Pickup Tracking header 🚴‍♂️. Donation details card. 3-step order status stepper (`Accepted` $\rightarrow$ `Picked` $\rightarrow$ `Delivered`). Action buttons: *"Picked ✅"* and *"Delivered 🏁"*. Live location map iframe. |
| `/adminpage` | `src/app/adminpage/page.tsx` (257 lines) | Top `adminnavbar`. Hero banner: *"Admin Dashboard"*. Filter bar with search, status dropdown (All, Active, Picked), Analytics button. Stats cards (Active Meals, Picked Meals, Total Donations). 2-column view: live donation card list on left, detailed inspector and force action panel on right. |
| `/notification`| `src/app/notification/page.tsx` (54 lines) | Top `Navbar`. Notifications header. Vertically stacked white notification cards with message text, relative timestamp, and Dismiss action. |
| `/profile` | `src/app/profile/page.tsx` (98 lines) | Top `Navbar`. Profile header. Centered white card with Name, Email, Phone, and Address fields. Inline Edit/Save toggling. |

### 2.4 Navigation Components
| Component | File | Features |
| :--- | :--- | :--- |
| `Navbar` | `src/components/Navbar.tsx` | Green brand logo ("FeedChain"), Radix Tabs (`/donordash`, `/mydonations`, `/notification`, `/profile`), Right dropdown menu with user name, role, email, phone, and logout. |
| `volunavbar` | `src/components/volunavbar.tsx` | Brand logo, Tabs (`/volunteerdash`, `/acceptpage`, `/notification`, `/profile`), Account dropdown menu. |
| `adminnavbar` | `src/components/adminnavbar.tsx` | Brand logo, Tabs (`/adminpage`, `/notification`, `/profile`), Account dropdown menu. |

### 2.5 UI Primitives & Widgets
| Component | File | Dependencies | Purpose |
| :--- | :--- | :--- | :--- |
| `Button` | `src/components/ui/button.tsx` | `@radix-ui/react-slot`, `class-variance-authority` | Standard button with `default`, `outline`, `secondary`, `destructive`, `ghost`, `link` variants |
| `Card` | `src/components/ui/card.tsx` | Standard React `div` with `data-slot` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction` |
| `Input` | `src/components/ui/input.tsx` | HTML input with `data-slot="input"` | Rounded input with focus ring & destructive states |
| `Label` | `src/components/ui/label.tsx` | `@radix-ui/react-label` | Accessible form label |
| `Tabs` | `src/components/ui/tabs.tsx` | `@radix-ui/react-tabs` | Navigational and content tabs |
| `DropdownMenu`| `src/components/ui/dropdown-menu.tsx`| `@radix-ui/react-dropdown-menu` | Account trigger, menu items, separators, labels |
| `DonationCard`| `src/components/DonationCard.tsx` | React state, shelf-life calculation | Card with Countdown timer, dynamic status badge (`Fresh`, `Expiring Soon`, `Expired`), Accept button |
| `Chatbot` | `src/components/Chatbot.tsx` | SVG icons, auto-scrolling message ref | Fixed green circular button (`bottom-5 right-5`), floating chat window (`w-80 h-[450px]`), green header, bubble chat history |

### 2.6 Public Static Assets
| Asset | Dimensions / Type | Usage |
| :--- | :--- | :--- |
| `/images/signupbg.png` | PNG (1.7 MB) | Primary background for Landing (`/`) and Login (`/login`) |
| `/favicon.ico` | ICO | Application browser icon |
| `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | SVG | Default Next.js vector utilities |

---

## 3. Visual & Aesthetic Profile

- **Dominant Palette:**
  - Background: Emerald-tinted clean light (`bg-green-50` / `#f0fdf4`)
  - Accent / Hero: Light sage green (`bg-green-100` / `#dcfce7`)
  - Primary Brand / Headings: Deep forest green (`text-green-700`, `text-green-800` / `#15803d`, `#166534`)
  - Primary Action Buttons: Crisp vibrant green (`bg-green-600 hover:bg-green-700`, `bg-green-700 hover:bg-green-800`)
  - Cards: Crisp pure white (`bg-white shadow-md hover:shadow-lg rounded-xl` / `rounded-lg`)
- **Typography:**
  - Font Family: `Inter`, sans-serif
  - Heading Weight: `font-bold` / `font-extrabold`
  - Body Weight: `font-normal` / `font-medium`
- **Layout Rhythm:**
  - Navbar: Fixed-height top navigation (`px-6 py-4`) with centered tab list and right-aligned user dropdown.
  - Page Structure: Centered column or multi-column grid with generous vertical padding (`py-12`, `py-16`).
  - Motion: Gentle spring entrance animations via `framer-motion` (`initial={{ opacity: 0, y: 30 }}`, `whileHover={{ scale: 1.05 }}`).
