---
trigger: always_on
---

# Third-Party Software & Open-Source Licensing Rules

## Purpose

These rules apply to all production code, dependencies, libraries, SDKs,
fonts, icons, assets, and other third-party components used by StockPulse.

These requirements are mandatory for production development.

---

## Core Requirement

Only use third-party software or open-source components whose license terms
permit:

- commercial use
- use within the Client's product
- redistribution by the Client

Do not introduce a component when its license is unknown, unclear,
incompatible, or requires commercial licensing that has not been explicitly
approved.

---

## License Verification Before Installation

Before adding any new third-party dependency:

1. Identify the component and official source.
2. Identify its license.
3. Verify that the license permits commercial use.
4. Verify redistribution requirements.
5. Identify attribution or notice requirements.
6. Identify source-disclosure or copyleft obligations.
7. Check whether the license conflicts with Client redistribution.
8. Record the dependency in the Third-Party Software Register.

Do this BEFORE adding the dependency to production code.

Never assume that a package is commercially usable simply because it is:

- available on npm
- available on GitHub
- free of charge
- open source
- included in a Figma/AI-generated prototype

---

## License Preference

Prefer permissive licenses with straightforward commercial redistribution
terms, such as:

- MIT
- BSD-2-Clause
- BSD-3-Clause
- ISC
- Apache-2.0

Other licenses require explicit review before use.

A license being open source does NOT automatically mean it satisfies the
project's contractual requirements.

---

## Restricted / Review-Required Licenses

Do not introduce dependencies under strong copyleft, source-disclosure,
network-copyleft, non-commercial, source-available, or otherwise restrictive
licenses without explicit approval.

Examples requiring review include:

- GPL
- AGPL
- SSPL
- Commons Clause
- BUSL / BSL
- licenses containing Non-Commercial restrictions
- custom or unknown licenses

LGPL and MPL must also be reviewed for the specific usage and distribution
model before adoption.

Do not automatically classify a dependency as safe based only on its license
name.

---

## Unknown License

If a component has:

- no LICENSE file
- conflicting license information
- an unknown/custom license
- unclear redistribution rights

DO NOT use it.

Report:

LICENSE REVIEW REQUIRED

and propose an alternative with a verified compatible license.

---

## Third-Party Software Register

Maintain a complete list of third-party components used by the production
application.

Recommended location:

`docs/compliance/THIRD_PARTY_SOFTWARE.md`

For each component record:

| Field | Required |
|---|---|
| Component | Yes |
| Version | Yes |
| Purpose | Yes |
| Official Source | Yes |
| License | Yes |
| Commercial Use | Yes |
| Redistribution | Yes |
| Attribution / Notice Required | Yes |
| Production Dependency | Yes |
| Notes / Obligations | When applicable |

Example:

| Component | Version | Purpose | License | Commercial Use | Redistribution | Notice |
|---|---|---|---|---|---|---|
| Expo | exact installed version | Mobile framework | MIT | Verified | Verify obligations | See license |
| React Native | exact installed version | Mobile framework | MIT | Verified | Verify obligations | See license |

Do not invent license information.

Use verified information from the dependency's official source or distributed
license file.

---

## Version-Specific Verification

License information must correspond to the version actually used.

Do not assume that a current package version has the same license as a
previous or future version.

When a dependency is upgraded and its licensing terms may have changed,
re-check the license information.

---

## Transitive Dependencies

Third-party compliance is not limited to packages directly listed in
package.json.

Before production release, review relevant transitive dependencies as well.

The final third-party inventory should be generated from the actual dependency
tree / lockfile, not only from manually remembered packages.

---

## Fonts

All fonts must have licenses compatible with commercial application use and
the intended method of distribution/embedding.

Record third-party fonts in the Third-Party Software Register or a dedicated
asset/license register.

Do not use an unverified font simply because it is available in Figma.

---

## Icons

Production UI must use approved vector icons with verified licenses.

Do not use:

- random SVGs from the internet
- copied proprietary icons
- unverified icon packs
- emoji converted into image assets
- icons extracted from commercial products

Record the selected icon library and its license.

---

## Images and Other Assets

Third-party images, illustrations, animations, sounds, templates, and other
assets must also have verified commercial-use and redistribution rights.

Do not migrate an asset from Figma Make into production solely because it
appears in the prototype.

If provenance cannot be established, replace it with an original or
appropriately licensed asset.

---

## Figma Make Migration

Code and assets generated or referenced by Figma Make must NOT automatically
be treated as license-approved.

During migration:

Figma Make reference
→ Identify external dependency/asset
→ Verify provenance and license
→ Record approved third-party component
→ Use in production

If provenance or licensing cannot be verified, do not migrate that dependency
or asset.

Replace it with an approved alternative.

---

## AI-Generated Code

AI-generated suggestions do not override these requirements.

When an AI agent proposes:

`npm install <package>`

the package must pass the same license review before installation.

The agent must not select a library solely because it is technically
convenient.

Prefer an existing approved dependency when it provides the required
functionality.

---

## Adding Dependencies

Before executing:

`npm install`
`npx expo install`
or any equivalent dependency installation command,

check whether the required capability can be implemented using:

1. React Native / Expo built-in capabilities
2. An already-approved dependency
3. A new verified compatible dependency

Avoid unnecessary dependencies.

---

## License Notices

Where a third-party license requires preservation of:

- copyright notices
- license text
- attribution
- NOTICE files

preserve those materials in the repository and production distribution as
required.

Recommended location:

`docs/compliance/licenses/`

Do not remove copyright or license notices from third-party components.

---

## Release Gate

Before any production release:

1. Generate the actual dependency inventory.
2. Review direct dependencies.
3. Review relevant transitive dependencies.
4. Verify licenses.
5. Review third-party assets.
6. Update THIRD_PARTY_SOFTWARE.md.
7. Ensure required notices/attributions are included.
8. Flag unresolved license issues.

A release must not be considered compliance-ready while unresolved
third-party license issues remain.

---

## Contractor Deliverable

The project must maintain sufficient information to provide the Client with
the required list of all third-party components used in the application.

The list must be reproducible from the actual production codebase and should
not depend solely on manual memory.

---

## Agent Behavior

When proposing a new dependency, report:

- Package
- Purpose
- Version
- License
- Why it is needed
- Whether an existing approved dependency can replace it
- Any attribution or redistribution obligations

If licensing cannot be verified:

DO NOT INSTALL.

Flag it for review instead.