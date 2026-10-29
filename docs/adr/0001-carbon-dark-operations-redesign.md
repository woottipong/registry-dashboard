# 0001. Carbon Dark Operations Redesign

- **Status**: Accepted
- **Deciders**: Engineering & Product
- **Consulted**: `PRODUCT.md`, `doc/DESIGN.md`, `src/app/globals.css`

## Context

The initial dashboard used a soft navy palette with decorative elements that did not provide optimal contrast for long operational sessions. Operators needed an interface optimized for fast scanning of dense container catalog data, clear distinction of active endpoints, and unambiguous destructive safeguards.

The user approved the Doorlog dashboard reference as the benchmark: high-contrast Carbon Dark and Slate Black palette, top KPI stat strip, dense repository inventory, and right-hand inspector widgets.

## Decision

1. **Adopt Carbon Dark Operations Palette**:
   - Page canvas: Carbon Matte (`#0d1015`).
   - Cards and panels: Slate Black (`#13171f`).
   - Structural borders: Quiet Rule (`#1e2430`).
   - Primary action: Electric Blue (`#3b82f6`).
   - Status indicators: Emerald (`#22c55e`), Amber (`#f59e0b`), Red (`#ef4444`).
   - Enforce dark-only theme across the entire application; remove light-mode token switching.

2. **Shell Architecture**:
   - Fixed 256px (`lg:w-64`) sidebar rail with structured groups (`Explore`, `Infrastructure`, individual registry endpoints).
   - Sticky 64px (`h-16`) topbar with breadcrumbs, command palette search shortcut (`⌘K` / `Ctrl+K`), and user menu.
   - Standard 1200px maximum content width.

3. **Dashboard Information Hierarchy**:
   - Top KPI stat strip summarizing total registries, repositories, tags, and providers.
   - Asymmetric two-column operational layout: dense repository inventory on the left, distribution progress bars and recent telemetry on the right.

## Consequences

- All UI components must source tokens from `src/app/globals.css` (defined in `doc/DESIGN.md`).
- Simplifies CSS architecture by eliminating light/dark dual token branches and decorative gradients.
- High visual contrast and tabular figure alignment improve data scanning speed for operators.
