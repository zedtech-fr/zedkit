# Design policy

Shipped default for every host. Token values and the role vocabulary belong to the host. This file does not name them.

## Class names

- A class name states a role, a layout job, or a design purpose (`px-page`, `gap-stack`, `text-body`, `content-shrink`). Spelling a number (`min-w-zero`, `p-stack-lg` for every step 4) is still a scale alias. Do not do it.
- Do not add a token or a utility for every numeric step. A shared token exists only when the value is a design decision more than one component uses.
- A structural constraint stays a literal declaration inside the layout class that needs it (`content-shrink { min-width: 0 }`). `min-width: 0` lets a flex or grid item shrink. `inset: 0` pins a layer to its parent. Neither is a spacing token, and neither needs a spelled number.
- Banned as authored design classes: spacing and sizing steps (`p-4`, `mt-4`, `gap-2`, `size-4`), fractions (`w-1/2`), counts (`grid-cols-3`, `col-span-2`), and the default type scale (`text-sm`, `text-xs`, `text-base`, `text-lg`, `text-2xl`).
- When a design value is shared, the number lives in the token (`calc(var(--spacing) * 4)`), so a density change still reaches every role that uses it.
- Two roles may share one value. A second name is right when the purposes can change independently. A name that only spells the number is not a second role.
- The host writes the vocabulary down once. Skills, templates and review notes link to that note. They do not copy the values.

## What this file does not decide

- Exact spacing, type, color, motion or identity values.
- Whether accent and the primary action are the same role. Read the host's code. Do not merge them in a template when the code keeps them apart.
- A stricter target size or duration. State it beside the floor below and label it as the host's rule.

## Floors

- Text contrast 4.5:1. Large text 3:1.
- A control boundary (the resting border of a field) is at least 3:1 against the surface it sits on.
- Focus is visible, at least 2px, and comes from the focus style itself.
- An error is named in text, not by color alone.
- Reduced motion removes displacement.
- No keyboard trap.
- Touch target floor: 24px CSS. A host may require more. Say that number next to this floor. Do not replace the floor with the host's number.
- Durations belong to the host's signature. About 150–250ms is only a fallback for a host that has no duration rule, and it must be labelled a fallback.

## Enforcement

- The host's lint or CI rejects the classes above. Prose does not enforce them.
- If a required check cannot initialize (Tailwind is not resolvable, or the CSS entry is missing), the run fails closed. It does not report success with the check skipped.
- Existing violations may sit in a baseline. The count may only decrease. The baseline is an inventory of what remains, not a verdict that the work is unfinished. When every remaining hit is a named public API or a test fixture, report that constraint and stop. Do not keep editing other files to drive the count to zero.
- Hierarchy, density and which state a screen shows are judged on current pixels, not on old screenshots.

## Setup

The installer copies files and generates a skeleton. It does not read the host's tokens or class conventions. Reading the code is the setup skill. A green validate does not mean the host's written rules match this policy.

If the host text tells people to author numeric or default-scale classes, do not keep that rule. Supersede it with this file.
