Design a complete, high-fidelity, production-ready mobile application for an **F&B Inventory Management & Order Optimization platform**.

The application will be distributed on **both iOS and Android**. Create a shared cross-platform design system while adapting platform-specific interaction patterns:

* iOS: follow Apple Human Interface Guidelines, iOS safe areas, native-feeling navigation, sheets, pickers, alerts, and interaction patterns.
* Android: follow Material Design 3 conventions, Android navigation behavior, bottom sheets, dialogs, controls, and system safe areas.
* Do NOT simply create an iPhone design and resize it for Android.
* Create clearly labeled **iOS and Android screen variants** for important screens.
* Primary mobile reference sizes:

  * iOS: iPhone 15/16 Pro, approximately 393 × 852
  * Android: modern Pixel/Samsung reference, approximately 412 × 915
* Ensure layouts can scale appropriately to larger phones and tablets.

The product is used by restaurants and F&B stores to manage inventory, scan POS sales reports, automatically deduct ingredients using recipes/BOMs, track expiration dates, reduce food waste, calculate optimal purchase quantities, receive supplier deliveries, and generate audit reports.

## PRODUCT DESIGN DIRECTION

Create a professional modern B2B SaaS mobile application.

Visual direction:

* Clean
* Operational
* Data-focused
* Trustworthy
* Minimal but not empty
* Optimized for restaurant staff who need to complete tasks quickly
* Large touch targets
* Strong information hierarchy
* High readability
* WCAG-aware contrast
* Light mode as primary
* Design tokens structured so dark mode can be added later

Use a restrained neutral palette with a fresh green/emerald primary accent appropriate for inventory and food operations.

Use semantic colors consistently:

* Green = healthy / completed / in stock
* Amber = warning / low stock / approaching expiration
* Red = critical / expired / major negative variance
* Blue = informational / processing
* Gray = neutral / inactive

Use cards, chips, progress indicators, status badges, compact charts, tables/lists, bottom sheets, and contextual action buttons.

Avoid excessive gradients, decorative illustrations, oversized cards, or consumer-fintech aesthetics.

The application should feel like a serious operational tool that restaurant employees can use every day.

---

# USER ROLES & PERMISSIONS

Design the UI to support role-based access.

### Platform Super Admin

Can oversee:

* Tenant/restaurants
* Account registrations
* Platform health
* Global configuration

### Store Admin / Owner

Full access to:

* Dashboard
* Inventory
* Costs
* Recipes/BOM
* Suppliers
* Goods receipts
* Purchase orders
* Reports
* Historical archives
* User management
* Audit logs

### Manager / Shift Leader

Operational management access including:

* Inventory counts
* POS scans
* Variance review
* Goods receipts
* BBD alerts
* POQ recommendations

### Floor Staff

Restricted operational interface:

* Perform physical stock counts
* Scan POS reports
* Log goods received
* View relevant BBD alerts

Navigation and actions should automatically change depending on the user's role.

---

# INFORMATION ARCHITECTURE

For Store Admin / Manager, use five primary bottom navigation destinations:

1. Home
2. Inventory
3. Scan
4. Orders
5. More

The Scan action may be visually emphasized because POS scanning is a major daily workflow.

"More" contains:

* Recipes
* Suppliers
* Goods Receipts
* Reports
* Archive
* Audit Log
* Team & Roles
* Store Settings
* Account

Staff accounts should see a simplified navigation structure containing only permitted operational features.

---

# 1. AUTHENTICATION & ONBOARDING

Create:

### Splash Screen

* Brand/logo
* Minimal loading state

### Welcome Screen

* Sign in
* Create restaurant account
* Join existing store

### Login

Fields:

* Email
* Password
* Forgot password
* Sign in

Support biometric login:

* Face ID on iOS
* Fingerprint/biometric authentication on Android

### Restaurant Setup

Multi-step onboarding:

Step 1 — Restaurant information

* Restaurant/store name
* Country
* Currency
* Language
* Time zone

Step 2 — Inventory preferences

* Default stock-count schedule
* Daily
* Weekly
* Monthly
* Quarterly

Step 3 — Initial team/admin configuration

Step 4 — Setup completion

Show onboarding progress.

---

# 2. HOME DASHBOARD

Create a mobile operational dashboard answering:

**"What needs my attention today?"**

Header:

* Store selector
* Current store
* Date
* User avatar
* Notifications

Primary KPI cards:

* Total Inventory Value
* Items Low in Stock
* Items Near Expiry
* Inventory Variance
* Pending Purchase Orders

Example values:
Inventory Value: €18,420
Low Stock: 12
Near Expiry: 7
Variance: -2.8%
Pending Orders: 3

### Today's Tasks

Examples:

* Daily stock count — 18 items remaining
* Review 3 POS scans
* 7 products near expiry
* 4 POQ recommendations

Include progress indicators.

### Quick Actions

Large operational buttons:

* Start Stock Count
* Scan POS Report
* Receive Goods
* Create Purchase Order

### Stock Health

Small visual chart:

* Healthy
* Low Stock
* Critical
* Overstock

### Expiration Alerts

Show products such as:

Fresh Salmon
2.5 kg
Expires tomorrow
Critical

Milk
8 L
Expires in 3 days
Warning

Add "View all".

### Recent Activity

Show:

* POS scan completed
* Goods received
* Stock count completed
* Purchase order created

---

# 3. INVENTORY

## Inventory List

Header:
**Inventory**

Include:

* Search
* Filter
* Sort
* Category selector

Filter options:

* All
* Low Stock
* Expiring
* Overstock
* Variance
* Category
* Supplier

Each inventory row/card shows:

* Ingredient name
* SKU
* Category
* Physical Stock ("Is")
* Theoretical Stock ("Should")
* Variance
* Unit
* BBD status
* Stock health status

Example:

Chicken Breast

Physical (Is)
24.5 kg

Theoretical (Should)
27.0 kg

Variance
-2.5 kg (-9.3%)

Status:
Needs Review

Use clear visual differentiation between **Physical / Is** and **Theoretical / Should** because this is a core concept of the product.

---

# 4. INVENTORY ITEM DETAIL

Create a detailed item screen.

Header:
Chicken Breast

Show:

### Stock Overview

Physical Stock
24.5 kg

Theoretical Stock
27.0 kg

Variance
-2.5 kg

Target Stock
35 kg

Safety Stock
5 kg

Recommended Order
15.5 kg

### Inventory Trend

Simple chart showing:

* Physical stock
* Theoretical stock

Time ranges:
7D / 30D / 3M

### Batches

Show batch-level expiration information:

Batch #B1024
10 kg
Expires 14 Mar
3 days remaining

Batch #B1029
14.5 kg
Expires 21 Mar
10 days remaining

### Recent Transactions

Examples:

* POS deduction
* Manual count
* Goods receipt
* Adjustment

Each transaction:

* Date/time
* User
* Quantity change
* Transaction type

Actions:

* Adjust Stock
* Count Item
* View History

---

# 5. STOCK COUNTING

This workflow must be extremely fast because restaurant staff may count many items.

### Stock Count Schedule

Show:

* Daily
* Weekly
* Monthly
* Quarterly

Example:

Daily Stock Count
Today, 10 March

Progress:
42 / 68 items counted

Button:
Continue Count

---

# 6. ACTIVE STOCK COUNT

Create a focused counting interface.

Header:
Daily Stock Count

Progress:
12 / 68

Ingredient:
Chicken Breast

Expected / Should:
27.0 kg

Input:
Physical / Is

[ 24.5 ] kg

Show difference immediately:

Variance
-2.5 kg
-9.3%

Actions:

* Previous
* Save & Next

Support:

* Numeric keyboard
* Quick quantity adjustment
* Barcode scanning if applicable
* Skip item
* Add note

Include a progress bar.

Make this interface usable one-handed.

---

# 7. STOCK COUNT SUMMARY

After counting:

Daily Count Complete

Show:

68 Items Counted

Variance Value:
-€142.80

Items Matching:
49

Minor Variance:
13

Major Variance:
6

Display a list of items requiring investigation.

Example:

Chicken Breast
Should 27 kg
Is 24.5 kg
Variance -2.5 kg

Button:
Review Variances

Secondary:
Complete Count

---

# 8. POS AI OCR SCANNER

This is one of the most important workflows.

Create a dedicated camera experience.

Header:
Scan POS Report

Camera view with receipt/document framing overlay.

Instructions:
"Position the entire POS report inside the frame."

Actions:

* Capture
* Flash
* Import from Gallery

Support:

* Multi-column receipts
* Rotated paper
* Low-light photos
* Creased receipts

After capture show:

Processing POS Report...

Progress steps:

1. Uploading image
2. Reading document
3. Detecting items
4. Calculating sales
5. Mapping recipes

---

# 9. OCR REVIEW

Never automatically commit OCR results without allowing user verification.

Screen:
**Review POS Scan**

Show original receipt thumbnail.

Extracted fields:

Report Date
10 Mar 2026

Detected Items
24

Confidence
94%

Display table/list:

ArtNr | Item | Qty | Confidence

101
Menu 1
24
98%

102
Burger XL
17
96%

103
Menu 3
8
82%

Highlight low-confidence values.

Allow user to:

* Tap to edit
* Correct quantity
* Correct item mapping
* Remove invalid row
* Add missing item

CTA:
**Confirm & Deduct Stock**

Show confirmation:

"This will update theoretical inventory using recipe/BOM mappings."

---

# 10. OCR RESULT / BOM DEDUCTION

After confirmation:

POS Report Processed

24 menu items detected
49 portions sold

Ingredients deducted:

* Chicken: -12.4 kg
* Potatoes: -8.2 kg
* Oil: -1.8 L
* Cheese: -4.1 kg

Show:
Updated theoretical inventory

CTA:
View Inventory Impact

Secondary:
Scan Another Report

---

# 11. RECIPE / BOM MANAGEMENT

Screen:
Recipes

Search and filter recipes.

Recipe cards:

* Menu item
* Selling category
* Number of ingredients
* Cost per serving
* Active status

Example:

Menu 1
4 Ingredients
Cost: €3.42 / serving

---

# 12. RECIPE DETAIL

Header:
Menu 1

Show ingredients:

Chicken Breast
0.20 kg

Potatoes
0.15 kg

Oil
0.02 L

Sauce
0.05 L

Display:
Cost per serving
€3.42

Allow Store Admin:

* Edit recipe
* Add ingredient
* Change quantity
* Duplicate recipe
* Archive recipe

Explain subtly:
"Sales of this menu item automatically deduct these ingredients from theoretical stock."

---

# 13. BBD / EXPIRATION CENTER

Screen:
Expiration

Segmented tabs:

* Critical
* Soon
* All

Summary:
Expired: 2
Next 3 Days: 7
Next 7 Days: 14

Each card:

Fresh Salmon
Batch #B123
4.2 kg
Expires Tomorrow

Estimated Value at Risk:
€68

Actions:

* View Suggestions
* Mark Used
* Adjust

Use strong but accessible urgency indicators.

---

# 14. SMART WASTE-REDUCTION MENU SUGGESTIONS

Screen:
**Waste Reduction**

Header:
Save inventory before it expires

Example recommendation:

Fresh Salmon
4.2 kg available
Expires tomorrow

Suggested promotion:
**Salmon Lunch Special**

Uses:
3.8 kg salmon

Potential utilization:
90%

Estimated stock saved:
€61

Actions:

* View Recipe
* Use Suggestion
* Dismiss

Clearly label these as **system recommendations**, not guaranteed outcomes.

---

# 15. GOODS RECEIPTS

Screen:
Goods Receipts

Show recent supplier deliveries.

Example:

Metro Foods
10 Mar 2026
€842.50
18 Items
Received

Create button:

* New Receipt

---

# 16. NEW GOODS RECEIPT

Multi-step form.

Supplier:
Metro Foods

Invoice Number:
INV-20481

Delivery Date:
10 Mar 2026

Allow:

* Take invoice photo
* Upload invoice

Add items:

Chicken Breast
20 kg
€4.80/kg
BBD: 18 Mar 2026

Potatoes
50 kg
€0.90/kg
BBD: 30 Mar 2026

Show:
Subtotal
Tax
Total

CTA:
**Confirm Goods Receipt**

Explain:
"Received quantities will be added to physical inventory."

---

# 17. POQ — PERFECT ORDER QUANTITY

Screen:
**Reorder Recommendations**

Summary:
18 Items Need Reordering

Group by supplier.

Example:

Metro Foods

Chicken Breast
Physical: 24.5 kg
Target: 35 kg
Safety: 5 kg

Recommended:
15.5 kg

Potatoes
Recommended:
30 kg

Allow:

* Modify recommended quantity
* Select/deselect items

CTA:
Create Purchase Order

Provide an info tooltip explaining:

Recommended Order =
Target Stock − Physical Stock + Safety Stock

Never expose the formula in a confusing technical manner; explain it in simple language.

---

# 18. PURCHASE ORDER

Screen:
New Purchase Order

Supplier:
Metro Foods

Items:
Chicken Breast — 15.5 kg
Potatoes — 30 kg
Oil — 10 L

Estimated Total:
€248.40

Actions:

* Export PDF
* Export Excel
* Share

Share options:

* WhatsApp
* Telegram
* Email
* Native share sheet

CTA:
Save Purchase Order

Status lifecycle:
Draft
Sent
Confirmed
Received

---

# 19. SUPPLIERS

Supplier list.

Each supplier card:

* Supplier name
* Contact
* Number of supplied ingredients
* Open purchase orders
* Last delivery

Supplier Detail:

* Contact information
* Supplied ingredients
* Purchase history
* Current orders

---

# 20. REPORTS

Screen:
Reports

Report types:

* Daily Inventory
* Weekly Inventory
* Monthly Inventory
* Annual Inventory
* Variance Report
* Waste Report
* Goods Receipt Report
* Purchase Report
* Audit Report

Filters:

* Date range
* Store
* Category
* Supplier

Actions:

* Generate PDF
* Export Excel
* Share

---

# 21. ARCHIVE

Create a multi-year historical archive.

Search/filter by:

* Year
* Month
* Report type
* User

Example:

2026

March Inventory Report
PDF / Excel

February Inventory Report
PDF / Excel

January Inventory Report
PDF / Excel

2025
...

---

# 22. AUDIT TRAIL

Screen:
Audit Log

Each event shows:

User
Action
Item
Quantity Delta
Timestamp

Example:

Anna Schmidt
Stock Adjustment

Chicken Breast
-2.5 kg

10 Mar 2026
18:42

Filters:

* User
* Action
* Date
* Inventory item

Audit records should appear immutable/read-only.

---

# 23. NOTIFICATION CENTER

Create notifications for:

* Expiring stock
* Low stock
* Major variance
* Stock count due
* OCR processing completed
* OCR review required
* PO recommendation
* Goods receipt confirmation

Example:

Critical Expiry

Fresh Salmon expires tomorrow.
4.2 kg / €68 at risk.

[View Item]

---

# 24. TEAM & RBAC

Store Admin screen:
Team

Show members:

* Name
* Role
* Status
* Last active

Roles:
Owner
Manager
Shift Leader
Staff

Add Team Member flow.

Role editor should clearly explain permissions.

Example:

Staff

✓ Perform stock counts
✓ Scan POS reports
✓ Record goods receipts
✓ View BBD alerts

✕ Edit recipes
✕ View financial reports
✕ Manage users

---

# 25. SETTINGS

Sections:

Store

* Store information
* Currency
* Language
* Time zone

Inventory

* Count schedules
* Units
* Categories
* Safety stock defaults

Expiration

* Default BBD alert threshold

Notifications

* Push notifications
* Email alerts

Account

* Profile
* Security
* Biometric login

Administration

* Team
* Roles
* Audit Log

---

# EMPTY, LOADING & ERROR STATES

Design complete system states.

Examples:

No Inventory
"Add your first inventory item to start tracking stock."

No Expiring Products
"Nothing is expiring soon."

OCR Failure
"We couldn't confidently read this report."

Actions:

* Retake Photo
* Enter Manually

Offline:
"You're offline. Changes will sync when your connection returns."

Loading:
Use skeleton loaders where appropriate.

Success:
Use subtle confirmation feedback rather than excessive modal dialogs.

---

# CRITICAL USER FLOWS

Prototype these flows.

### Flow A — Daily Inventory Count

Home
→ Start Stock Count
→ Count Items
→ Review Variances
→ Complete Count
→ Dashboard Updated

### Flow B — POS OCR

Home
→ Scan POS
→ Camera
→ OCR Processing
→ Review Extracted Sales
→ Confirm
→ BOM Ingredient Deduction
→ Updated Theoretical Stock

### Flow C — Expiration Prevention

BBD Alert
→ Expiring Item
→ Smart Menu Suggestions
→ Recommended Promotion
→ Mark Recommendation Used

### Flow D — Reordering

Dashboard Low Stock
→ POQ Recommendations
→ Review Quantities
→ Create Purchase Order
→ Export / Share
→ Order Status

### Flow E — Receiving Goods

Purchase Order
→ Receive Goods
→ Add Quantities
→ Enter Batch BBD
→ Add Invoice Photo
→ Confirm
→ Physical Stock Updated

---

# COMPONENT SYSTEM

Build reusable Figma components with Auto Layout and variants.

Components should include:

* iOS navigation bar
* Android top app bar
* Bottom navigation
* Buttons
* Icon buttons
* Text fields
* Numeric quantity fields
* Search bar
* Dropdown/select
* Date picker
* Chips
* Status badges
* Inventory cards
* KPI cards
* Alert cards
* Recipe cards
* Supplier cards
* Purchase-order cards
* Transaction rows
* Progress bars
* Tabs
* Segmented controls
* Bottom sheets
* Dialogs
* Toast/snackbar
* Empty states
* Skeleton loading states
* Camera controls
* OCR confidence indicators
* Charts
* Data rows

Create variants for:

* Default
* Pressed
* Disabled
* Loading
* Success
* Warning
* Error

Use an 8-point spacing system and consistent typography, radii, elevation, iconography, and semantic colors.

---

# PLATFORM-SPECIFIC REQUIREMENTS

## iOS

Use:

* iOS safe areas
* Native-style navigation bars
* iOS sheets
* Native date/time pickers
* Swipe-back behavior
* Face ID terminology
* iOS-style action sheets where appropriate

## Android

Use:

* Material Design 3
* Android system safe areas
* Material top app bars
* Material bottom navigation
* Material bottom sheets
* Material dialogs/snackbars
* Android back navigation
* Fingerprint/Biometric terminology where appropriate

The information architecture and brand should remain consistent between platforms while interaction patterns should feel native.

---

# TABLET RESPONSIVENESS

The proposal also targets larger devices used in stores.

Create representative tablet adaptations for:

* Dashboard
* Inventory
* Active Stock Count
* POS Review
* Purchase Order

On tablets:

* Use two-column layouts where beneficial
* Allow master/detail inventory navigation
* Increase information density
* Avoid simply stretching phone cards across the screen

---

# PROTOTYPE DATA

Populate screens with realistic restaurant inventory data rather than Lorem Ipsum.

Use ingredients such as:

* Chicken Breast
* Fresh Salmon
* Potatoes
* Cooking Oil
* Milk
* Cheese
* Tomatoes
* Lettuce
* Beef
* Flour

Use European/global operational examples where appropriate.

Currency example:
EUR (€)

Units:
kg
g
L
ml
pcs

Include realistic dates, quantities, BBD dates, supplier names, stock variance, OCR confidence scores, and PO quantities.

---

# FIGMA FILE ORGANIZATION

Organize the generated design into clear sections/pages:

1. Cover
2. Foundations
3. Components
4. iOS Screens
5. Android Screens
6. Tablet Screens
7. User Flows
8. Prototype

Name frames semantically, for example:

iOS / Home / Admin
iOS / Inventory / List
iOS / Inventory / Detail
iOS / Stock Count / Active
iOS / OCR / Camera
iOS / OCR / Review
iOS / Expiration / Alerts
iOS / Orders / POQ
Android / Home / Admin
Android / Inventory / List
Android / Stock Count / Active
Android / OCR / Camera
Android / OCR / Review

Create a polished, coherent, clickable prototype rather than disconnected mockups.

Prioritize operational speed, data clarity, minimal taps, accessibility, and error prevention. The final result should look credible enough to demonstrate to restaurant owners, managers, investors, and developers as the UI/UX specification for a production iOS and Android application.
