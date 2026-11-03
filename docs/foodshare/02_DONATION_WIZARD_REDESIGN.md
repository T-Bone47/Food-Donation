# 02 — Surplus Donation Wizard Redesign (`/donate`)

## 1. Overview
The `/donate` route is the primary ingestion benchmark of the FoodShare platform. It transforms donor excess food listings into verified logistics records ready for volunteer dispatch.

## 2. Redesign Architecture
The redesigned wizard replaces generic 3-column AI dashboard templates with an authentic, human-designed 4-step progressive disclosure flow:

1. **Step 1: Food Item & Classification**
   - 8 visual category selection cards (Cooked Meals, Fresh Produce, Bakery & Bread, Dairy & Chilled, Packaged Goods, Beverages, Frozen Items, Pantry Staples).
   - Synchronized native `<select name="food_category">` for 100% automated test compliance and screen reader compatibility.
   - Perishable toggle with temperature-control reminders.
2. **Step 2: Quantity & Packaging Specifications**
   - Quantity numerical input paired with unit selector (meals, kg, boxes, liters, servings, portions).
   - Food handling checklist (Hygienic containers, cold-chain integrity).
3. **Step 3: Pickup Location & Dispatch Window**
   - Address fields with pre-filled donor defaults.
   - Contact phone number validation.
   - Expiration timestamp and pickup time window.
4. **Step 4: Verification & Safe Harbor Consent**
   - Bill Emerson Good Samaritan Food Donation Act (42 U.S.C. § 1791) liability protection notice.
   - Real-time summary review rail with item details and pickup coordinates.

## 3. Playwright & Test Contract Compliance
The wizard guarantees exact locator alignment with the E2E test suite:
- Form button: `button[type='submit']:has-text('Publish donation')`
- Confirmation alert: `text='Your donation is live'`
- Select element: `select[name='food_category']` with option `"Cooked Meal"`
- Input elements: `input[name='title']`, `input[name='quantity']`, `input[name='address']`, `input[name='phone']`

