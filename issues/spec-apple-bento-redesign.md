# Spec: Apple-style Bento redesign of Registry Dashboard

Labels: `ready-for-agent` (local draft — not yet published to GitHub)

## Problem Statement

Registry Dashboard works, but it looks like an unbranded shadcn starter: grey-blue canvas, hairline borders on every box, a mix of radii (`md`, `lg`, `xl`, `2xl`, `3xl`, 20px, 24px), rectangular buttons, small uppercase tracked labels, and a decorative gradient backdrop behind every page. Nothing on screen says "deliberately designed", and nothing ties the dashboard, repository browser, tag explorer, registry settings and login together as one product.

The target look is defined in `doc/DESIGN.md` ("Bento Grids, Apple-style"). That brief was written for a consumer-hardware marketing page (hero render, pricing, testimonials, FAQ, TH/EN switch). Registry Dashboard is a working tool for operators. The redesign must take the brief's visual language without its marketing content, and must not change routes, navigation structure, data flow or API behaviour.

## Solution

Rebuild the visual layer of every existing screen in the Apple bento language, adapted for an operator tool:

- One flat `#F5F5F7` canvas, borderless white tiles with 28px corners (32px for the stage tile and single-tile pages), shadows no stronger than 8%.
- Inter 600 headlines with −0.03em tracking, quiet `#6E6E73` copy, sentence-case labels everywhere.
- Colour used sparingly: Apple blue `#0071E3` only on the primary pill, `#0066CC` for text links, a few multicolour line icons, state colours only where they mean something.
- **Signature move:** one studio-lit black "stage" tile per screen at most, carrying the most important real number (dashboard), or the call to action when there is no data yet (empty dashboard, login).
- Same sidebar + top bar structure as today, restyled. Same routes, same widgets, plus one new dashboard tile (Recent activity) built from data the app already records.
- Light mode follows the brief exactly; dark mode becomes a matching Apple dark palette.

Thai text renders in Noto Sans Thai with correct line height and no negative tracking. The TH/EN language switch from the brief is a separate follow-up spec.

## User Stories

### Look and feel
1. As an operator, I want every screen to sit on the same flat light-grey canvas with white rounded tiles, so that the product feels like one coherent tool instead of a set of pages.
2. As an operator, I want tiles to have no borders and only a faint shadow, so that the data inside each tile is the strongest thing I see.
3. As an operator, I want page titles to be large, tight and short, so that I know where I am at a glance.
4. As an operator, I want small labels in sentence case instead of uppercase tracked text, so that labels are easier to read and calmer to scan.
5. As an operator, I want exactly one blue filled button per view, so that the primary action is never ambiguous.
6. As an operator, I want text links and ghost actions in a distinct link blue, so that I can tell navigation from the primary action.
7. As an operator, I want colour to appear only for meaning (state, selection, data series, provider icons), so that a red or green mark always signals something real.
8. As an operator who prefers dark mode, I want a dark theme in the same Apple style, so that switching theme does not break the design.
9. As an operator with reduced-motion enabled, I want transitions to be removed, so that the interface does not animate at me.

### Shell
10. As an operator, I want the sidebar to keep the same links (Overview, Repositories, Registry Settings, registry shortcuts) but blend into the canvas, so that navigation stays familiar while looking lighter.
11. As an operator, I want the current page in the sidebar shown as a white pill, so that my location is obvious without heavy colour.
12. As an operator, I want the top bar to be thin and translucent with a blur, so that content scrolls under it without losing breadcrumbs or the user menu.
13. As a mobile operator, I want the sidebar to open as a sheet in the same style, so that navigation works on a phone.

### Dashboard
14. As an operator, I want the dashboard to open with a black studio-lit stage tile showing my most important totals, so that the state of my registries is the first thing I see.
15. As an operator, I want the stage tile to show how repositories are split across registries using real counts, so that I can spot an unusually large or empty registry.
16. As an operator, I want repository and tag totals in their own large-number tiles, so that I can read them in one glance.
17. As an operator, I want a Recent activity tile listing the latest recorded actions (connect, view, inspect, delete), so that I can see what changed without leaving the dashboard.
18. As an operator, I want registry inventory and top repositories in two equal-height tiles with clickable rows, so that I can jump straight into a registry or a repository.
19. As an operator, I want loading states to keep the exact tile shapes as skeletons, so that the layout does not jump when data arrives.
20. As a new user with no registries, I want the dashboard to show a single stage tile with a lit render, a short headline and an "Add registry" pill, so that the first step is obvious and inviting.

### Repositories
21. As an operator, I want registry and namespace filters in one toolbar tile above the list, so that filtering stays in one place.
22. As an operator, I want namespaces shown as a horizontally scrollable chip row with the active chip in near-black, so that switching namespace works with any number of namespaces.
23. As an operator, I want the root namespace to appear as a normal chip, so that the `_root` sentinel never leaks into the UI.
24. As an operator, I want the repository list in a single white tile with hairline row separators and a soft hover, so that dense lists stay scannable.
25. As an operator, I want search and sort controls to look like the rest of the system, so that nothing reads as a leftover default component.

### Tag explorer and manifest
26. As an operator, I want the repository name, registry and tag count in a clean page header, so that I always know which image I am inspecting.
27. As an operator, I want the tag table in a white tile with clear selected rows, so that bulk selection is obvious.
28. As an operator, I want the bulk selection bar to appear as a floating dark pill with the selection count and a red delete action, so that destructive bulk actions are visible but separate from browsing.
29. As an operator, I want the image inspector (layers, config, history, manifest) in tiles with a segmented control to switch views, so that complex detail stays organised.
30. As an operator, I want the pull command in a light inset well with monospace text and a copy pill, so that copying it is one click and easy to read.
31. As an operator, I want digests, tags and repository paths to stay monospace, so that I can compare identifiers precisely.

### Registry settings
32. As an administrator, I want each registry as a white tile with a provider icon, name, URL and connection state, so that I can compare registries at a glance.
33. As an administrator, I want the default registry marked with a near-black chip, so that it stands out without a new colour.
34. As an administrator, I want search and filters for registries in the same toolbar style as repositories, so that the two pages feel related.
35. As an administrator, I want delete confirmations in a rounded alert dialog with a red pill action, so that irreversible actions are clearly marked.
36. As an administrator, I want the add/edit registry form in one large white tile with tall rounded inputs and radio cards for provider and auth type, so that the form feels calm and hard to get wrong.
37. As an administrator, I want inputs to show a blue border and soft blue ring on focus and a red state on validation error, so that I know where I am and what is wrong.

### Login, errors, empty states
38. As a user signing in, I want the login screen to keep its two-column layout, with the brand side as a black stage tile and the form as a white tile, so that the first screen already shows the product's look.
39. As a user, I want error, not-found and empty states to use the same tile, headline and pill language, so that failure states do not look like a different product.

### Accessibility and responsiveness
40. As a keyboard user, I want every button, link, chip, segmented control, row and input to show a visible focus ring, so that I can navigate without a mouse.
41. As a user, I want hover, pressed, selected, disabled and loading states on every interactive element, so that the interface always responds.
42. As a low-vision user, I want body text and controls to meet WCAG AA contrast in both themes, so that I can read everything.
43. As a mobile operator, I want the bento grid to collapse from four columns to two and then one without horizontal scrolling, so that the dashboard works at 375px.
44. As a user reading Thai registry or repository names, I want Thai to render in Noto Sans Thai with comfortable line height and no clipped vowel marks, so that names are legible.

## Implementation Decisions

### Scope and interpretation of the brief
- **Operate-mode adaptation.** From the brief we take tokens, type, radius, shadow, colour rationing, component grammar and the stage tile. We drop hero device panel, feature bento marketing copy, showcase, pricing, testimonials, FAQ, trust tiles and fictional brand copy.
- **Shell stays sidebar + top bar** (user requirement "โครงสร้างเว็บยังเหมือนเดิม"). This overrides the brief's "top navigation bar" shell. The brief's translucent nav treatment is applied to the existing top bar; the brief's segmented-pill nav idea is applied to the sidebar's active state.
- **No invented data.** The brief's forecast band, donut and compare widgets are not built: the app has no time-series data. Dashboard tiles use only registry/repository/tag counts and the activity log that the app already records.
- **Routes, query params, `_root` sentinel, API routes, providers, hooks and query keys are unchanged.**
- **TH/EN switch is out of scope** and gets its own spec. This spec only loads the Thai font and sets Thai typography rules.

### Tokens (single source of truth: the global stylesheet)
- Light: background `#F5F5F7`, surface `#FFFFFF`, surface-2 `#FBFBFD`, text `#1D1D1F`, muted `#6E6E73`, primary `#0071E3` (hover `#0077ED`), link/ghost `#0066CC`, hairline `#E5E5EA`, input border `#D2D2D7`, success `#1D8838`, warning `#B25000`, danger `#D70015`, chart series `#0071E3 #1D1D1F #86868B #BF5AF2 #FF9F0A`.
- Named extras, used only where the brief allows: eyebrow orange `#B64400`; icon colours purple `#BF5AF2`, orange `#FF9F0A`, green `#30D158`, pink `#FF375F`; switch-on `#30D158` on track `#E9E9EB`; stage colours `#3A3A3E / #1A1A1C / #000`; on-black blue `#2997FF`.
- Radius: sm 10px, md 14px, input 12px, tile 28px, stage/single-tile page 32px, pill 980px.
- Shadows: sm `0 1px 3px rgba(0,0,0,0.04)`, md `0 4px 20px rgba(0,0,0,0.05)`, lg `0 18px 50px rgba(0,0,0,0.08)`. Segmented thumb `0 1px 4px rgba(0,0,0,0.12)`. Nothing darker on a tile.
- Motion: `300ms cubic-bezier(.28,.11,.32,1)` for hover/colour/layout; `150ms` for press feedback. No page-load choreography. Reduced-motion rule kept.
- The shadcn variables (`--background`, `--foreground`, `--primary`, `--card`, `--muted`, `--border`, `--ring`, `--radius`, chart and sidebar vars) are remapped to these tokens so untouched shadcn internals inherit the new look.
- The decorative page backdrop (body gradient pseudo-element and the theme backdrop component) and the 700ms colour transitions are removed: the brief requires a flat canvas.
- The legacy Tailwind JS config is not loaded by Tailwind 4 in this project (no `@config` directive). Tokens are not added there; it is left as-is.

### Dark theme (Apple dark)
- Canvas `#000000`, raised canvas `#1C1C1E`, tiles `#1C1C1E` on black (or `#2C2C2E` on `#1C1C1E`), text `#F5F5F7`, muted `#98989D`, primary pill `#0071E3`, links `#2997FF`, hairline `rgba(255,255,255,0.1)`, inputs `#1C1C1E` with `#38383A` border. Danger `#FF453A`, success `#30D158`, warning `#FF9F0A` (dark-mode Apple equivalents).
- The stage tile keeps its gradient in dark mode and is separated from the black canvas by a 1px `rgba(255,255,255,0.08)` inner highlight only (no border, no extra shadow).
- Every dark pair is contrast-checked before merge (see Testing).
- The existing theme toggle and `data-theme` attribute behaviour are preserved; the toggle is restyled as a two-segment sun/moon segmented control.

### Typography
- Load Noto Sans Thai (400/500/600/700, Thai subset) next to Inter via the framework font loader; stack is Inter first, Noto Sans Thai second, then system. JetBrains Mono stays for identifiers, digests, URLs and commands only — KPI numerals move from mono to Inter 600 with tabular figures.
- Fixed rem scale (no fluid type in the app shell): page title 2.25rem / 600 / −0.03em; tile title 1.4rem; KPI numeral 3rem; stage numeral 4.5rem; body 0.9375rem; small 0.8125rem; nav 0.82rem. h1 ≥ 1.25 × tile title.
- Fluid display `clamp(3rem, 7vw, 5.75rem)` only on the empty-dashboard and login headlines.
- Thai: `:lang(th)` and Thai-script content get letter-spacing 0, line-height ≥ 1.7 body / 1.32 display / 1.35 headings; no fake bold or italics. Latin keeps −0.03em on headings.
- Every uppercase tracked label in the app (sidebar section labels, metric labels, "Tag volume", comparison labels) becomes sentence case, 0.8125rem, 500 weight, muted.

### Primitive components (restyled in place, same public props)
- **Button:** `default` = blue pill, white 500 text, hover `#0077ED`, no lift, pressed scale 0.98. `outline` = transparent pill with 1px `#0071E3` border and blue text, fills blue on hover. `ghost`/`link` = `#0066CC` text. `secondary` = `rgba(0,0,0,0.06)` pill with near-black text. `destructive` = `#D70015` pill. Focus = 2px `#0071E3` outline offset 2px. Sizes keep current heights for toolbars; forms use `lg` (44–50px).
- **Card:** no border, no blur, no translucency; surface background, tile radius, shadow sm by default, md on hoverable tiles. Padding 32px desktop / 24px mobile; dense data tiles may use 24px desktop.
- **Input / Select trigger:** white, 1px `#D2D2D7`, 12px radius, 50px in forms and login, 44px in toolbars; focus = blue border + `0 0 0 4px rgba(0,113,227,0.24)`; error = danger border + danger ring at 24%.
- **Tabs:** segmented control — `rgba(0,0,0,0.06)` pill track, white selected thumb with the thumb shadow; a `line` variant is kept for places that need it.
- **Badge:** `rgba(0,0,0,0.06)` pill, near-black text; active/selected = `#1D1D1F` with white text; solid orange `#B64400` reserved for a "New"-style eyebrow badge; success/warning/danger badges use the state colour as text on a 10% tint.
- **Table:** lives flush inside a tile; header row in muted 0.8125rem sentence case, no header background; rows separated by `#E5E5EA` hairlines; hover row `#F5F5F7`; selected row `rgba(0,113,227,0.06)` with a checkbox.
- **Dialog / Alert dialog / Sheet:** 28px radius, no border, shadow lg, overlay `rgba(0,0,0,0.3)`; actions as pills, destructive in danger red.
- **Dropdown, Select content, Command palette, Tooltip, Toast:** 14px radius, surface background, shadow lg, no border; tooltip `#1D1D1F` with white text.
- **Skeleton:** `rgba(0,0,0,0.06)` with the same radius as the element it replaces.
- **Switch:** iOS 51×31 track `#E9E9EB` → `#30D158`, 27px white knob — only where an existing boolean setting is shown as a toggle; multi-select checkboxes stay checkboxes.
- **Nested radius rule:** anything inside a tile uses md (14px) or sm (10px), never the tile radius. Pills stay pills.

### Shell
- Top bar: 52px, `rgba(245,245,247,0.8)` + `saturate(180%) blur(20px)`, hairline bottom at 8% text colour; breadcrumbs 0.82rem; right side theme segmented control + user menu. No new actions added.
- Sidebar: same width and links; background = canvas (no separate panel, no right border); logo + "Registry Dashboard" wordmark; nav items as full-width pills, active = white pill with shadow sm and near-black text, inactive = muted text, hover `rgba(0,0,0,0.04)`; section labels sentence case; registry shortcuts as the same pill rows with a small provider icon.
- Content area: max width ~1200px, 40px top padding desktop, 20px grid gap everywhere.

### Dashboard composition (4-col bento, 20px gap, rows always completely filled)
- Desktop (≥1280px):
  - Stage tile **2×2** — label "Registries", stage numeral (registry count), one line "N providers · default: <name>", and a real-data bar strip of repositories per registry in `#2997FF` / white at decreasing opacity (top 5 + "others"), link "Browse repositories" in `#2997FF`. No glossy sphere here.
  - Repositories **1×1** and Tags **1×1** — icon top (40px line icon: blue folder, purple tag), KPI numeral, caption bottom.
  - Recent activity **2×1** — latest 5 activity items (icon by type, repository/tag in mono, relative time), link "View all" only if a full list already exists; otherwise no link. Empty state: one quiet line.
  - Registry inventory **2×N** and Top repositories **2×N** — equal heights, rows as clickable 14px-radius rows with hover `#F5F5F7`, repo/tag counts right-aligned, thin blue share bar; lists capped with internal scroll.
- Tablet (768–1279px): 2 columns — stage 2×1, KPIs 1×1 each, activity 2×1, inventory and top repos full width.
- Mobile (<768px): single column, stage first, then KPIs side by side if ≥ 360px wide.
- Empty dashboard (no registries): a single 32px black stage tile, CSS-only glossy sphere render (radial highlight + rim light + `0 30px 30px rgba(0,0,0,0.7)` drop shadow) above an orange-free headline "Connect your first registry", one grey lead line, blue "Add registry" pill. This is the brief's "black stage CTA" pattern.
- The existing unused dashboard component set (activity feed, stats cards, chart, top repos, registry list, layout) is evaluated: the activity feed is reused/restyled for the Recent activity tile; components that remain unused after the redesign are removed in the same PR.

### Repositories page
- Header: title + one muted line + (when allowed) outline pill action.
- Toolbar tile: registry select, namespace chip row (scrollable, active chip `#1D1D1F`), search input with icon, sort select.
- Repository list/grouped view in one white tile; grid/card view (if present) uses tiles with md shadow on hover.
- Selected state in the registry selector is expressed with `aria-pressed`/`aria-current` plus the active chip style.

### Tag explorer and manifest
- Header: repository path in mono at tile-title size, registry chip, tag count.
- Tag table tile with search; selection bar = floating `#1D1D1F` pill at the bottom of the viewport with white text, count, "Clear" ghost, danger "Delete" pill (only when the provider can delete — existing capability check kept).
- Inspector tile: segmented control for Layers / Config / History / Manifest; pull command in a `#F5F5F7` inset well (14px radius, mono, copy pill). Not a stage tile — the brief limits the stage gradient to the hero/feature/first KPI/CTA/mobile featured card.

### Registry settings, form, login, errors
- Registry list: 3-col tile grid; provider icon 40px in a named icon colour (Docker Hub = blue, Registry V2 = purple, others orange/green), name as tile title at the bottom, URL mono muted, connection state as a dot + label in state colour, default = black chip, overflow menu for edit/default/delete.
- Registry form: single 32px tile, max ~720px, sections separated by hairlines, provider and auth type as radio cards (1px `#D2D2D7`, selected = 2px `#0071E3` + 4px blue ring), primary "Save" pill + outline "Test connection" pill.
- Login: existing two-column layout kept; left = 32px black stage tile with the logo, display headline and one lead line in `#A1A1A6`; right = white 32px tile with 50px inputs and a full-width blue pill. On mobile the stage tile collapses to a short banner above the form.
- Error / not-found / global-error / empty states: one centred tile, 40px icon, tile-title headline, muted line, one pill action.

### Delivery slices (one PR each, in order)
1. Foundation: tokens (light + dark), fonts, backdrop removal, primitives, shell.
2. Dashboard (including Recent activity tile and empty state).
3. Repositories + tag explorer + image inspector.
4. Registry settings + form + login + error/not-found/empty states.
5. Sweep: remaining hard-coded radii, borders, uppercase labels, off-token colours; detector run; screenshot review.

## Testing Decisions

- **Good tests assert behaviour and semantics, not Tailwind class names.** Selection is asserted via `aria-pressed`, `aria-selected`, `aria-current` or `data-state`, not via `bg-primary`.
- **Seam 1 — existing component tests (Vitest, inside the dev container).** The registry, repository, tag-table and delete-dialog suites must pass unchanged in intent. The one known class-coupled assertion (registry selector "highlight selected registry" checks `bg-primary`) is rewritten to assert the accessible selected state, and the component gains that attribute.
- **Seam 2 — existing Playwright e2e specs** (authentication, dashboard, registry management, repository browsing, search, tag/manifest operations, theme, theme responsiveness). They must stay green; the theme specs guarantee the toggle and `data-theme` behaviour survive the restyle. No new e2e files.
- **Seam 3 — visual review (manual, not committed).** For every route: screenshots at 1440, 768 and 375px in light and dark, including loading, empty and error states and the empty dashboard. Checked against the acceptance checklist below.
- **Mechanical checks:** Impeccable detector over changed UI files once per slice; contrast checks for every text/background pair in both themes (known risks: purple/pink accents are large-text-only at ~3.5:1; `#86868B` must not be used for text on white; dark muted on `#2C2C2E` must be verified).
- **Default verification per slice:** typecheck, lint, unit tests inside the `ui` dev container, plus the relevant e2e specs.

## Acceptance checklist

- Someone who knows Apple's bento style recognises it at a glance on the dashboard, login and empty dashboard.
- Every colour, radius, border and shadow comes from the tokens above; no tile has a border; no tile shadow exceeds 8%.
- At most one filled blue button per view; at most one stage tile per screen.
- No uppercase tracked labels remain.
- Thai and Latin both render in their intended fonts with comfortable line height.
- WCAG AA contrast in light and dark; visible focus, hover, pressed, selected, disabled and loading states on all interactive elements.
- No horizontal scroll at 375px; bento rows completely filled at each breakpoint.
- Routes, query params, API calls and provider capability checks unchanged.

## Out of Scope

- TH/EN language switch and translation of UI strings (separate spec).
- Marketing sections from the brief (hero device panel, showcase, pricing, testimonials, FAQ, trust tiles, stat tiles with gradient numerals).
- Charts that require time-series data (forecast, trends, donut over time).
- Changes to routes, API routes, providers, storage, auth, CSRF or rate limiting.
- New navigation model (top-nav shell) or new top-bar actions.
- Dependency additions or upgrades.

## Further Notes

- `doc/DESIGN.md` is the user's design brief, not a description of the built system. After slice 5, a project-level design record can be documented from the built UI if requested.
- Main risk: tile padding (32px) and 50px inputs reduce density on data-heavy screens. The plan limits large sizes to forms, login and KPI tiles and uses 24px padding / 44px controls on dense data tiles and toolbars; review this on the repositories and tag explorer screenshots before slice 3 merges.
