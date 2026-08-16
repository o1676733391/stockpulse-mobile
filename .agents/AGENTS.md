<!-- FIGMA_MAKE_RULES_START -->
# Figma Make → Production Migration Rules

## Purpose

These rules apply whenever production code is created or modified based on
the Figma Make reference implementation.

Figma Make is the approved reference for:

- UI structure
- visual intent
- screen hierarchy
- navigation flows
- interaction behavior
- content/copy
- UI states
- mock/demo data

Figma Make is NOT the production architecture.

---

## Source Location

Figma Make exported code is stored under:

`/source-of-truth/figma-make/`

Treat this directory as READ-ONLY.

Never:

- modify files inside it
- refactor it
- format it
- rename or reorganize it
- install production features into it
- import production dependencies into it

Production code must live outside `/source-of-truth`.

---

## Core Migration Principle

Preserve WHAT the Figma Make implementation does.

Do not blindly preserve HOW it does it.

Migration flow:

Figma Make
→ Inspect
→ Understand UX and behavior
→ Identify reusable concepts
→ Map to production components
→ Reimplement in React Native / Expo
→ Validate against reference

Do NOT perform a direct web-to-native code conversion.

---

## Before Implementation

Before migrating a screen or workflow:

1. Inspect the relevant Figma Make implementation.
2. Identify the complete user flow.
3. Identify all screen states.
4. Identify reusable UI patterns.
5. Identify navigation behavior.
6. Identify mock data and copy.
7. Check existing production components.
8. Check whether required design tokens already exist.

Do not start by generating a new screen from memory.

---

## What Can Be Reused

Reuse or adapt when appropriate:

- screen hierarchy
- information architecture
- labels and copy
- business terminology
- workflow sequence
- navigation intent
- validation behavior
- loading/error/success states
- mock data for development
- framework-independent TypeScript logic
- constants and domain types after review

---

## What Must NOT Be Copied Blindly

Do not directly copy:

- HTML
- DOM structure
- CSS
- browser-specific APIs
- fixed viewport assumptions
- web-only responsive hacks
- prototype routing architecture
- Make-specific dependencies
- absolute positioning used only for visual simulation
- device mockup code
- prototype navigation controls
- design-system documentation UI

Reimplement these using React Native / Expo patterns.

---

## Production Component Mapping

Always check for an existing production component before creating a new one.

Example:

Figma Make Button
→ Production `<Button />`

Figma Make KPI Card
→ `<KpiCard />`

Figma Make Status Badge
→ `<StatusBadge />`

Figma Make Inventory Card
→ `<InventoryCard />`

Figma Make Header
→ `<AppHeader />`

Do not create screen-local copies of shared components.

If an existing component is insufficient, extend it using props or variants
when appropriate instead of duplicating it.

---

## Design System

Figma Make is NOT the authoritative source for design tokens.

Use the approved production/Figma Design System for:

- colors
- typography
- spacing
- radius
- elevation
- icons
- component styling

If Figma Make contains a visual value that conflicts with the approved
Design System, do not silently introduce a new token.

Use the approved token or report the conflict.

---

## Icons and Assets

Do not migrate emoji or text-symbol icons from Figma Make.

Replace them with approved editable vector icons.

Prefer the project's approved icon library.

Do not introduce:

- unverified images
- unlicensed fonts
- random external assets
- unknown icon libraries

Asset licensing must be suitable for commercial production use.

---

## Cross-Platform Requirement

Production implementation targets:

- Android
- iOS

Android is currently the primary development/testing platform.

However, migrated components must remain cross-platform by default.

Do not introduce Android-only architecture for shared business screens.

Use platform-specific implementations only when native behavior genuinely
differs.

---

## Safe Areas

Do not copy simulated device spacing from Figma Make.

Production code must use real system safe areas/insets.

Support:

iOS:
- Dynamic Island
- notch
- status bar
- home indicator

Android:
- punch-hole camera
- waterdrop notch
- display cutouts
- status bar
- gesture navigation
- navigation bar

Never copy hard-coded notch or Dynamic Island offsets from the prototype.

---

## Navigation

Preserve the intended navigation FLOW, not necessarily the prototype's
navigation implementation.

Example:

Dashboard
→ Inventory
→ Inventory Detail
→ Back

should remain functionally equivalent.

Implement production navigation using Expo Router.

Top-level destinations:

- Home
- Inventory
- Scan
- Orders
- More

Secondary screens should use appropriate stack navigation/back behavior.

Do not migrate prototype-only screen selectors or developer navigation.

---

## Mock Data

Mock data from Figma Make may be reused for development and UI validation.

Keep migrated mocks isolated from production services.

Example:

`src/mocks/`

Do not embed permanent mock values directly inside production screens.

Production UI should eventually consume typed service/API interfaces.

---

## Business Logic

Do not assume business logic implemented by Figma Make is authoritative.

When business behavior is involved, validate against approved requirements.

Examples:

- stock variance calculations
- BOM deductions
- POQ calculations
- inventory updates
- BBD behavior
- RBAC permissions

Figma Make may demonstrate the UX, but prototype calculations must not
automatically become production business rules.

---

## Prototype-Only Features

Do NOT migrate prototype presentation features into the production app.

Examples:

- device frames
- iPhone mockups
- Android mockups
- platform switchers
- role demo selectors
- quick-access sidebars
- active-screen inspectors
- design-system panels
- prototype reset controls

These belong to prototype tooling, not customer-facing production UI.

---

## Migration Scope

Migrate incrementally by workflow.

Preferred approach:

Dashboard
→ Inventory
→ Inventory Detail
→ Stock Count
→ Count Summary

Then:

Scan
→ OCR Processing
→ OCR Review
→ Result

Then other workflows.

Do not migrate the entire Figma Make project in one large uncontrolled change.

---

## Change Scope

When migrating one feature:

- modify only relevant production files
- avoid unrelated refactors
- avoid redesigning existing approved screens
- avoid introducing unnecessary dependencies
- keep changes reviewable

Do not use migration as an excuse to rewrite unrelated production code.

---

## Validation

After migrating a screen, validate:

### Visual

- hierarchy matches intended design
- typography uses production tokens
- spacing is consistent
- semantic colors are correct
- icons are approved vectors

### Behavior

- navigation works
- Back behavior works
- loading states work
- empty states work
- error states work
- actions behave as intended

### Mobile

- no horizontal overflow
- safe areas are respected
- keyboard does not break layout
- long content scrolls correctly
- bottom navigation remains usable

### Platform

Test Android first.

Implementation must remain compatible with iOS.

---

## Conflict Resolution

When sources disagree, use this priority:

1. Explicit current product requirement
2. Approved requirements/specification
3. Approved Design System
4. Figma Make reference
5. Existing implementation

Do not silently resolve a significant conflict.

Report it before changing product behavior.

---

## Definition of Done

A migrated feature is complete when:

- production code does not depend on Figma Make code
- `/source-of-truth` remains unchanged
- approved Design System components/tokens are used
- workflow matches approved UX intent
- prototype-only UI has not been migrated
- mock data is isolated
- safe areas work correctly
- Android behavior is validated
- implementation remains iOS-compatible
- relevant loading/error/empty states are handled
- no unnecessary duplicate components were introduced
## Third-Party Compliance During Migration

All dependencies and assets originating from or suggested by the Figma Make
reference are subject to the project's Third-Party Software & Open-Source
Licensing Rules.

Presence in Figma Make does not constitute license approval.

Do not migrate an external library, font, icon, image, or other asset until
its provenance and license have been verified.
<!-- FIGMA_MAKE_RULES_END -->
