Refactor the current project architecture.

The current implementation incorrectly combines:

the actual mobile application
desktop quick navigation
phone preview frame
design system documentation

inside one responsive page.

This causes the desktop presentation UI to shrink into the mobile viewport.

Do NOT redesign the application itself.

Preserve the existing StockPulse visual identity, components, screens, typography, emerald color system, and existing business logic.

The goal is only to reorganize the project structure.

REQUIRED STRUCTURE

Separate the project into three independent experiences:

MOBILE APPLICATION
PROTOTYPE / QUICK ACCESS
DESIGN SYSTEM
1. MOBILE APPLICATION

Create a dedicated mobile application experience.

This must contain ONLY the actual StockPulse application UI.

Do not include:

desktop sidebar
"Main Screens" navigation
active screen inspector
design system panel
device mockup
phone border
desktop toolbar
prototype documentation
screen selector
platform selector outside the app

The application must render directly inside the browser viewport.

Mobile behavior

When viewed on an iPhone-sized or Android-sized viewport:

width: 100%
min-height: 100dvh
no artificial phone frame
no horizontal scrolling
no desktop shell
no outer page padding
no fixed desktop width
no scaled-down desktop layout

The mobile application itself should occupy the full available viewport.

Example:

Instead of:

Desktop page
→ Phone mockup
→ Mobile app inside phone mockup

Use:

Mobile viewport
→ Mobile app directly

MOBILE WIDTH RULES

The application must support:

iOS reference:
393px width

Android reference:
412px width

Also support normal responsive widths approximately:

360px – 480px

Do not use a fixed 393px application width.

Use:

width: 100%
max-width only when previewed from desktop

On real mobile viewport, remove max-width constraints.

There must be ZERO horizontal overflow.

MOBILE LAYOUT RULES

Ensure all application screens use:

width: 100%
box-sizing: border-box
responsive padding
safe areas
flexible card widths
flexible text wrapping
responsive forms

Avoid fixed pixel widths for main containers.

Cards should normally use:

width: 100%

within the page content area.

Do not allow cards or text to extend beyond the viewport.

SAFE AREA

For iOS support, account for:

env(safe-area-inset-top)
env(safe-area-inset-bottom)
env(safe-area-inset-left)
env(safe-area-inset-right)

The application should work correctly with:

Dynamic Island
iPhone home indicator
Android system bars

Do not manually simulate the iOS status bar when the application is running directly in mobile mode unless it is explicitly part of the prototype screen.

APPLICATION HEADER

The current external StockPulse desktop header must NOT appear inside mobile application mode.

The mobile application should use only its own native mobile navigation.

For example:

Welcome screen:

StockPulse logo
page content

Authenticated screens:

native mobile top navigation
bottom navigation where appropriate

Do not show:

StockPulse | iOS | Android | Admin

as a desktop toolbar above the actual application.

Those controls belong only to Prototype / Quick Access.

MOBILE NAVIGATION

Keep the application navigation separate from developer navigation.

Authenticated mobile application navigation:

Home
Inventory
Scan
Orders
More

Use native-feeling mobile bottom navigation.

Any developer or prototype screen selection controls must never appear inside the mobile app.

2. PROTOTYPE / QUICK ACCESS PAGE

Move the current desktop presentation controls into a separate Prototype Index page.

This page is intended for:

designers
developers
stakeholders
demo navigation

It is NOT part of the production mobile application.

Use a desktop-oriented layout.

Suggested structure:

Left:
Screen navigation

Center:
Device preview

Right:
Preview controls and metadata

QUICK ACCESS SIDEBAR

Move the existing Main Screens list here.

Include shortcuts such as:

Dashboard
Inventory
Stock Count
POS Camera
OCR Review
Orders
POQ
Expiry Alerts

More:
Recipes
Suppliers
Reports
Team
Settings

This navigation must control the previewed screen.

It must NOT be rendered inside actual mobile application mode.

PREVIEW TOOLBAR

Move platform controls here.

Example:

Platform:
[iOS] [Android]

Role:
[Admin]
[Manager]
[Staff]

Device:
[iPhone]
[Android]

These are prototype controls only.

They must never appear in the production mobile UI.

DEVICE PREVIEW

On the Prototype page, it is acceptable to display the app inside a device frame.

Example:

Desktop Prototype Page

Sidebar | Device Preview | Info

The preview may use:

393 × 852 for iOS

412 × 915 for Android

The preview should render the same application components used by the actual mobile experience.

Do not create separate duplicated screen implementations solely for preview mode.

DESKTOP PREVIEW RESPONSIVENESS

The prototype page is desktop-first.

If viewport width becomes too small for the three-column layout:

Do NOT shrink the entire desktop interface into a tiny mobile layout.

Instead:

collapse the sidebar
collapse or hide the inspector
preserve the preview at a usable scale

The Prototype Index itself does not need to become the production mobile application.

3. DESIGN SYSTEM PAGE

Move all design system information to a dedicated page.

Do not display the design system beside every screen.

Create a proper design system documentation page.

Sections:

Foundations
Brand

StockPulse

F&B Inventory Intelligence

Colors

Primary:
Emerald

Semantic:

Healthy / In Stock
Warning / Low Stock
Critical / Expired
Info / Processing
Neutral / Inactive

Show:

color swatch
token name
intended usage
Typography

Show typography scale using the existing font system.

Include:

Display
Page Title
Section Heading
Card Title
Body
Label
Caption
Numeric KPI

Include existing:

DM Sans

and JetBrains Mono where appropriate for technical/numeric values.

Spacing

Document the 8pt grid.

Examples:

4
8
12
16
24
32

Radius

Document card, field, button and sheet radii.

Elevation

Document relevant elevation levels.

Keep elevation subtle.

COMPONENTS

Create a component documentation area containing:

Buttons

Primary
Secondary
Tertiary
Destructive

States:

Default
Pressed
Disabled
Loading

Inputs

Text Field
Numeric Field
Search
Select
Date Input
Quantity Input

Status

Healthy
Warning
Critical
Processing
Neutral

Cards

KPI Card
Inventory Card
Alert Card
Supplier Card
Purchase Order Card
Recipe Card

Navigation

iOS Navigation
Android Top App Bar
Bottom Navigation
Tabs
Segmented Controls

Feedback

Snackbar
Dialog
Bottom Sheet
Loading
Skeleton
Empty State
Error State

DESIGN SYSTEM RESPONSIVENESS

The Design System page is documentation.

It can be desktop-first.

Do not inject the Design System panel into the production application.

ROUTE / PAGE SEPARATION

If routing is supported, organize the application approximately as:

/app
Actual mobile application

/prototype
Desktop quick-access and device preview

/design-system
Design documentation

If separate routes are not supported, create equivalent clearly separated top-level views with no shared desktop wrapper around /app.

CRITICAL ARCHITECTURE RULE

The desktop prototype shell must NOT wrap the mobile application globally.

Incorrect:

AppShell
├── Desktop Header
├── Sidebar
├── Mobile Preview
└── Design System

Correct:

Project

├── Mobile App
│ └── Actual application screens
│
├── Prototype
│ ├── Screen navigation
│ ├── Platform controls
│ └── Mobile App preview
│
└── Design System
├── Foundations
└── Components

SHARED COMPONENT RULE

All three areas may reference the same design tokens and components.

However:

Prototype UI components must be separate from application UI components.

For example:

PrototypeSidebar

is NOT the same thing as:

AppBottomNavigation

PrototypePlatformSwitcher

is NOT part of:

AppHeader

Do not mix developer/demo controls with customer-facing application controls.

EXISTING WELCOME SCREEN

Keep the current welcome screen visual direction:

StockPulse
F&B Inventory Intelligence

"Smarter inventory for your restaurant"

AI POS Scanning
Smart Reordering
Recipe & BOM

Sign In to Your Store
Create Restaurant Account

But fix its mobile layout.

On an actual mobile viewport:

content fills viewport width
no outer device frame
no desktop top toolbar
no horizontal scrollbar
cards remain within screen bounds
buttons remain within screen bounds
page scrolls vertically if necessary
bottom safe area is respected

Do not scale the screen down to make it fit.

Use responsive reflow instead.

FINAL VALIDATION

Test these three scenarios.

Scenario A — iPhone viewport

393 × 852

Expected:

Only StockPulse mobile application is visible.

No:

prototype navigation
design system
desktop toolbar
phone frame

No horizontal scrollbar.

Scenario B — Android viewport

412 × 915

Expected:

Only StockPulse Android application is visible.

Use appropriate Android interaction patterns.

No presentation shell.

Scenario C — Desktop

1440px or wider

Prototype page may display:

Screen navigation | Phone Preview | Inspector

Design System is available separately.

Do NOT alter the existing business workflows or visual identity.

Refactor layout architecture only.