# QA Rules

QA is meant to catch sprite-production mistakes before export.

## Severity levels

| Severity | Meaning |
|---|---|
| `pass` | No action needed. |
| `warning` | Export can continue if warnings are allowed. Fix before final production. |
| `failure` | Export should be blocked when `blockFailures` is enabled. |

## Core checks

| Check | Purpose | Typical fix |
|---|---|---|
| Empty frame | Finds fully transparent or missing cells. | Remove row/column, mark frame unused, or fix source sheet. |
| Edge touch | Finds sprites touching frame boundaries. | Increase cell size, add padding, or move art inward. |
| Feet drift | Finds foot-anchor movement across animation frames. | Re-align feet/root anchors across frames. |
| Center drift | Finds body center jumps across animation frames. | Adjust frame placement or add pivot metadata. |
| Missing direction | Checks expected direction labels. | Add direction rows or update labels. |
| Bad pivot | Finds pivots outside frame bounds. | Move pivot into the correct cell. |
| Empty part | Finds rig part masks that export no pixels. | Redraw mask or assign it to the correct frame. |
| Broken recipe layer | Finds recipe layers pointing to missing assets. | Replace/remove the missing asset reference. |
| Metadata missing | Finds assets without creator/license/source fields. | Fill metadata before production export. |

## Visual diff checks

Visual QA diff checks frame-to-frame changes:

- bounding-box drift
- center drift
- left/right mirror mismatch
- unusually large silhouette jumps

These checks do not decide if the animation is artistically good. They only point to measurable alignment risk.

## Export gates

The app should support these gate settings:

```json
{
  "blockFailures": true,
  "allowWarnings": true
}
```

Recommended production settings:

```json
{
  "blockFailures": true,
  "allowWarnings": false
}
```

## Report exports

QA reports should be exported as both human-readable Markdown and machine-readable JSON when possible. Reports should include:

- timestamp
- project version
- source image name
- active export profile
- pass/warning/failure counts
- specific row/column/frame references
- recommended fix
