# pError Design System

## 1. Atmosphere & Identity

pError feels like a quiet operations console for personal servers. The signature is warm incident visibility: dense monitoring data sits on calm cream surfaces with dark green command accents, so failures feel actionable rather than noisy.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
| --- | --- | --- | --- | --- |
| Surface/app | `--surface-app` | `#f6f5ef` | `#17211f` | Page background |
| Surface/panel | `--surface-panel` | `#fffdf7` | `#17211f` | Cards and panels |
| Surface/subtle | `--surface-subtle` | `#f7f2e8` | `#17211f` | Event rows, secondary blocks |
| Surface/control | `--surface-control` | `#edf0e6` | `#17211f` | Subtle buttons |
| Text/primary | `--text-primary` | `#17211f` | `#fffdf7` | Main copy and headings |
| Text/secondary | `--text-secondary` | `#66736d` | `#91b9b1` | Captions and metadata |
| Border/default | `--border-default` | `#d9d2c4` | `#33413d` | Panel borders |
| Border/subtle | `--border-subtle` | `#e6dfd0` | `#33413d` | Dividers |
| Accent/primary | `--accent-primary` | `#236b61` | `#e9f8a7` | Primary actions and active nav |
| Accent/teal | `--accent-teal` | `#0c8f7b` | `#91b9b1` | Informational icons |
| Status/error | `--status-error` | `#bb4430` | `#ffe2d7` | Open issue emphasis |
| Status/success | `--status-success` | `#2d6d3a` | `#e6f4d8` | Resolved issue emphasis |

### Rules

- Use cream panels and thin borders for operational calm.
- Use dark green only for navigation, code surfaces, and primary actions.
- Use red sparingly for open issue status and error emphasis.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
| --- | --- | --- | --- | --- | --- |
| Display | `42px` | `800` | `1.1` | `0` | Login title |
| H1 | `34px` | `800` | `1.15` | `0` | Large metrics |
| H2 | `26px` | `800` | `1.25` | `0` | Page title and sidebar brand |
| H3 | `20px` | `800` | `1.35` | `0` | Panel titles |
| Body | `16px` | `400` | `1.6` | `0` | Default content |
| Body/sm | `14px` | `400` | `1.5` | `0` | Cards and metadata |
| Caption | `12px` | `800` | `1.4` | `0` | Labels and badges |

### Font Stack

- Primary: `"Avenir Next", "Gill Sans", "Noto Sans KR", sans-serif`
- Mono: `"SFMono-Regular", "Cascadia Code", "Menlo", monospace`

### Rules

- Korean labels must wrap by phrase, not by oversized display type.
- Numeric metrics should be visually strong and easy to scan.

## 4. Spacing & Layout

### Base Unit

All spacing follows a 4px base unit.

| Token | Value | Usage |
| --- | --- | --- |
| `--space-2` | `8px` | Tight inline groups |
| `--space-3` | `12px` | Form fields and compact rows |
| `--space-4` | `16px` | Default grid gap |
| `--space-5` | `20px` | Metric panels |
| `--space-6` | `24px` | Page rhythm |
| `--space-7` | `28px` | Content area padding |
| `--space-8` | `32px` | Sidebar groups |

### Grid

- Desktop app shell: `248px` sidebar plus flexible content.
- Main dashboard panels use CSS Grid with `16px` gaps.
- Mobile collapses grids to one column under `900px`.

### Rules

- Prefer CSS Grid for dashboard layouts.
- Keep code blocks horizontally scrollable instead of shrinking code to unreadable sizes.

## 5. Components

### Data Panel

- **Structure**: `section.data-panel` or `aside.data-panel`.
- **Spacing**: `18px` padding, `16px` surrounding grid gap.
- **States**: static surface with nested action buttons when needed.
- **Accessibility**: panel headings use semantic heading elements.

### Issue Detail Card

- **Structure**: compact card with label, value, and optional Lucide icon.
- **Spacing**: `14px` to `16px` inner rhythm.
- **States**: supports empty values with muted text.
- **Accessibility**: visible text labels remain present; icons are decorative.

### Code Block

- **Structure**: `pre.code-block`.
- **Spacing**: `16px` padding.
- **States**: horizontal overflow for long stack traces or URLs.
- **Accessibility**: text remains selectable and copyable.

## 6. Motion & Interaction

- Keep interactions direct and restrained.
- Buttons require visible hover/focus affordance from browser and color contrast.
- No decorative animation is required for the operational dashboard.

## 7. Depth & Surface

### Strategy

Borders-only with tonal shifts.

| Type | Value | Usage |
| --- | --- | --- |
| Default | `1px solid #d9d2c4` | Main panels |
| Subtle | `1px solid #e6dfd0` | Dividers and nested cards |

Cards should feel organized, not floating. Avoid nested decorative shadows in dashboard content.
