---
name: Registry Dashboard — Carbon Dark Operations
description: High-contrast Carbon Dark operations layout with deep matte surfaces and clear blue actions.
colors:
  primary: "#3b82f6"
  primary-hover: "#60a5fa"
  primary-active: "#2563eb"
  primary-foreground: "#ffffff"
  background: "#121720"
  foreground: "#f1f5f9"
  card: "#1b2430"
  card-foreground: "#f1f5f9"
  popover: "#222d3d"
  popover-foreground: "#f1f5f9"
  secondary: "#252f40"
  secondary-foreground: "#f1f5f9"
  muted: "#202936"
  muted-foreground: "#a8b6c9"
  accent: "#2b384b"
  accent-foreground: "#f1f5f9"
  destructive: "#ef4444"
  border: "#303c4d"
  input: "#3a4a60"
  control: "#222d3e"
  sidebar: "#10151d"
  sidebar-foreground: "#f1f5f9"
  sidebar-border: "#293443"
  sidebar-accent: "#202a38"
  sidebar-accent-foreground: "#f1f5f9"
  sidebar-primary: "#3b82f6"
  sidebar-ring: "#3b82f6"
  panel-border: "#303c4d"
  success: "#22c55e"
  warning: "#f59e0b"
  danger-solid: "#dc2626"
  white: "#ffffff"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: "40px"
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: "28px"
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "12px"
    lineHeight: "16px"
rounded:
  sm: "4px"
  control: "6px"
  panel: "8px"
  modal: "10px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  control-inline: "14px"
  lg: "16px"
  xl: "20px"
  panel: "24px"
  page-inline: "28px"
  roomy: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
  button-outline:
    backgroundColor: "{colors.control}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "8px 16px"
  button-destructive:
    backgroundColor: "{colors.danger-solid}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "8px 16px"
  input:
    backgroundColor: "{colors.control}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    height: "40px"
    padding: "8px 14px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.panel}"
    padding: "24px"
  navigation-active:
    backgroundColor: "{colors.sidebar-accent}"
    textColor: "{colors.sidebar-accent-foreground}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  badge-secondary:
    backgroundColor: "{colors.popover}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  tabs-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    padding: "4px 14px"
  repository-row:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    padding: "16px 12px"
---

# Design System: Registry Dashboard — Carbon Dark Operations

## Overview

**Creative North Star: Carbon Dark Operations**

A high-contrast container registry operations dashboard inspired by field operations interfaces. A deep matte charcoal canvas (`#121720`), slate cards (`#1b2430`), 1px borders (`#303c4d`), electric blue actions (`#3b82f6`), and vivid operational indicators keep dense catalog data easy to scan. The interface is dark-only and English-only. User-provided names retain their original text.

Compact controls and clear grouping carry the interface. Tonal surfaces contain forms and inspectors. Operational lists use alignment and separators. The existing product branding remains.

**Key Characteristics:**
- Carbon dark matte surfaces with electric blue action accents.
- Compact corners, legible metadata, and aligned operational rows.
- Quiet surfaces, restrained shadows, and visible keyboard focus.
- Honest loading, unknown, failure, and empty states.

Source: [global tokens](../src/app/globals.css), [shared components](../src/components/ui/), [shell layout](../src/components/layout/), [ADR 0001](../docs/adr/0001-carbon-dark-operations-redesign.md), and [PRODUCT.md](../PRODUCT.md).

## Colors

Carbon neutrals support a saturated blue action accent. Frontmatter preserves the actual CSS variables from `src/app/globals.css`.

### Primary

**Electric Blue** (`primary`, `#3b82f6`) supplies primary fills, links, active icons, and focus rings. Hover (`#60a5fa`) and active (`#2563eb`) define interaction feedback. `primary-foreground` (`#ffffff`) supplies white button ink.

### Neutral

**Carbon Canvas** (`background`, `#121720`) is the page canvas. **Deep Obsidian Rail** (`sidebar`, `#10151d`) distinguishes navigation and the opaque topbar. **Slate Card** (`card`, `#1b2430`) contains forms, KPI strips, and inspectors. **Raised Surface** (`popover`, `#222d3d`) supplies dropdowns and popover menus. **Active Accent** (`accent`, `#2b384b`) marks row hover and panel boundaries; `sidebar-accent` (`#202a38`) marks active navigation. `control` (`#222d3e`) supplies recessed field and secondary-button fill.

**Cool White** (`foreground`, `#f1f5f9`) carries primary text. **Muted Slate** (`muted-foreground`, `#a8b6c9`) carries metadata. **Quiet Rule** (`border` and `panel-border`, `#303c4d`) separates lists and controls.

### Status

**Emerald** (`success`, `#22c55e`) marks confirmed connection health and live status. **Amber** (`warning`, `#f59e0b`) marks testing or in-progress states. **Red** (`destructive`, `#ef4444`) marks errors, destructive text, and invalid fields. **Deep Crimson** (`danger-solid`, `#dc2626`) fills destructive action buttons.

**The One Action Accent Rule.** Use blue for actions, focus, and selection. Status colors communicate labeled operational states only.

## Typography

**Display and Body Font:** Inter with system sans-serif fallbacks. **Mono Font:** JetBrains Mono for endpoints, digests, tag identifiers, and compact technical strings.

The typography is direct and workmanlike. Headings use tight tracking and balanced wrapping. Body copy uses sentence case. Navigation group labels use small uppercase text. Tabular figures support numeric alignment.

### Hierarchy

- **Display:** (36px / 40px) with semibold weight for dashboard hero metrics and display headers.
- **Headline:** (28px / 1.2) with semibold weight for page titles.
- **Title:** (20px / 28px) with medium weight for section headers; card titles use (16px / 24px).
- **Body:** (14px / 20px) for rows, descriptions, and controls.
- **Label:** (12px / 16px) with medium weight for metadata labels and badges.
- **Mono:** (12px / 16px) for digests, commands, tags, and endpoints.

**The Readable Metadata Rule.** Keep ordinary metadata at least (12px). Use weight, alignment, and muted slate before shrinking text.

## Layout

The desktop shell uses a fixed 256px rail (`lg:w-64`) and a sticky 64px topbar (`h-16`). Operational pages center within a maximum width of 1200px. Registry forms narrow to 896px. Main padding progresses from 16px on mobile to 20px on tablet and 28px horizontally on large screens.

Below 1024px, the rail becomes a navigation sheet (280px). At 640px, stacked headers and controls align horizontally. Breadcrumbs appear on viewports 768px and wider.

The dashboard layout adopts a unified top KPI stat strip, an asymmetric two-column split (dense repository inventory on the left, distribution progress bars and recent pushed images inspection on the right), and grouped sidebar navigation.

## Elevation & Depth

Depth comes from tonal layers, 1px borders, and subtle spacing. Rows remain flat and change background color on hover or keyboard focus. Panels use a subtle dark ambient shadow. Dialogs use a stronger overlay separation.

- **Panel shadow:** `0 8px 24px rgb(2 8 18 / 0.16)`.
- **Selected thumb shadow:** `0 1px 4px rgba(0, 0, 0, 0.12)`.
- **Dialog overlay shadow:** `0 18px 50px rgb(2 8 18 / 0.45)`.

State transitions take 150ms to 200ms. Buttons scale to 0.98 when pressed. Global reduced-motion rules reduce transition duration and disable smooth scrolling when requested by the user.

**The Quiet Surface Rule.** Give data rows color feedback rather than elevation. Reserve shadows for contained surfaces and modal overlays.

## Shapes

Controls and navigation use compact control corners (6px). Cards and panels use panel corners (8px). Shared dialogs use modal corners (10px). Compact badges and status dots retain fully rounded pill silhouettes (9999px).

Thin 1px borders (`#303c4d`) distinguish fields, tables, and operational rows. Avoid nested frames where spacing and typography explain grouping. Standard line icons use 16px with smaller badge icons at 14px.

## Components

### Buttons

Compact and explicit. Primary uses blue (`#3b82f6`) with white text. Outline uses a quiet border (`#303c4d`) and recessed control fill (`#222d3e`). Secondary uses raised secondary fill (`#252f40`). Ghost gains secondary fill on hover. Destructive uses Deep Crimson (`#dc2626`) with white text. Default height is 36px, small is 32px, large is 44px. Default padding is 8px 16px. Focus shows a solid 2px blue ring.

### Inputs / Fields

Recessed control fill (`#222d3e`), 1px border (`#3a4a60`), compact corners (6px), height 40px, padding 8px 14px. Focus turns the border blue and adds a solid ring. Invalid fields use red for border and ring. Placeholders use muted slate (`#a8b6c9`). Disabled fields reduce opacity to 50%.

### Cards / Containers

Panel corners (8px), slate card fill (`#1b2430`), 1px panel border (`#303c4d`), and 24px padding. Titles are semibold. Descriptions use muted slate. Used for forms, KPI metric tiles, and inspection widgets.

### Navigation

Deep Obsidian Rail (`#10151d`) contains the brand header, main destinations, and individual registry shortcuts. Active items use sidebar accent (`#202a38`), an inset primary ring (`ring-primary/25`), and a blue icon. Inactive items use muted text and gain secondary fill on hover. Item padding is 6px 10px. Mobile navigation renders inside a slide-out sheet.

### Badges / Status Chips

Secondary badges use popover fill (`#222d3d`), cool white text, and pill padding (2px 10px). Outline badges use a quiet border. Connection chips pair a colored dot with live or attention labels. Unknown connection state supplies no claimed status.

### Tabs

Default tabs use a secondary track with 4px padding and compact corners. Active tabs use selection fill, cool white text, and selected-tab shadow. Triggers use 14px text and a 2px focus ring.

### Repository Rows

Aligned rows with 1px border rules, folder icon, repository name, registry badge, tabular tag count, and arrow indicator. Rows use minimum height 60px and padding 12px 16px. Hover applies accent background and blue emphasis. Loading skeletons preserve layout dimensions.

## Guidelines

### Do:

- Use shared Carbon Dark tokens across operational screens.
- Distinguish editable fields, clickable rows, and primary actions.
- Preserve visible focus, mobile responsiveness, and reduced-motion behavior.
- Label status and distinguish unknown or failed data from confirmed zero values.
- Keep interface copy in English while preserving user-provided repository and registry names.

### Don't:

- Introduce light surfaces, soft navy palettes, or decorative gradients.
- Use status colors as decorative accents.
- Turn every data row into a floating card.
- Invent registry health, counts, or capabilities to fill visual space.
