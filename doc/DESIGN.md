---
name: Registry Dashboard — Navy Workspace
description: A calm navy workspace with layered surfaces and clear blue actions.
colors:
  primary: "#4b9bfa"
  primary-hover: "#70b0fc"
  primary-active: "#3989e7"
  primary-foreground: "#081728"
  background: "#121c29"
  foreground: "#edf3fd"
  card: "#1b2737"
  popover: "#233247"
  sidebar: "#0e1723"
  muted-foreground: "#abbad0"
  accent: "#263b55"
  border: "#304158"
  input: "#687e98"
  control: "#152132"
  sidebar-accent: "#203b5d"
  panel-border: "#2a394d"
  sidebar-border: "#263449"
  success: "#49d6ad"
  warning: "#edc56a"
  destructive: "#f28d98"
  danger-solid: "#ac3548"
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
    textColor: "{colors.foreground}"
    rounded: "{rounded.panel}"
    padding: "24px"
  navigation-active:
    backgroundColor: "{colors.sidebar-accent}"
    textColor: "{colors.foreground}"
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

# Design System: Registry Dashboard

## Overview

**Creative North Star: "Navy Workspace"**

A working repository index on a lifted navy canvas: aligned names, cool metadata, layered slate panels and clear blue actions make the inventory easy to scan. The feeling is calm, precise and composed. The interface is dark-only and English-only; user-provided names retain their original text.

Compact controls and clear grouping carry the interface. Tonal surfaces contain forms and inspectors; operational lists use alignment and separators. The existing product branding remains. No shipping raster asset was produced for this visual system.

**Key Characteristics:**
- Navy and cool slate with a clear blue action accent.
- Compact corners, legible metadata and aligned operational rows.
- Quiet surfaces, restrained shadows and visible keyboard focus.
- Honest loading, unknown, failure and empty states.

Source: [global tokens](../src/app/globals.css), [shared components](../src/components/ui/), [shell](../src/components/layout/) and [surface contract](../.impeccable/surfaces/src-app-modern-dashboard-client-tsx.md). The [sidecar](../.impeccable/design.json) adds renderable examples and extensions. The user supplied a navy dashboard reference for color, surface depth and component finish; the registry and namespace workflows retain their existing structure.

## Colors

Cool navy neutrals support a saturated blue action accent. The canvas is lifted slightly above the supplied reference to keep long operational sessions readable. Frontmatter preserves the actual CSS values.

### Primary

**Action Blue** (`primary`) supplies primary fills, links, active icons and focus rings. The hover and active tokens define its interaction sequence; `primary-foreground` provides dark blue button ink.

### Neutral

**Navy Canvas** (`background`) is the page; **Deep Navy Rail** (`sidebar`) distinguishes navigation and the opaque topbar. **Slate Panel** (`card`) contains forms and inspectors. **Raised Slate** (`popover`) also supplies the identical secondary and muted backgrounds. **Slate Selection** (`accent`) marks row hover; `sidebar-accent` marks active navigation. `control` supplies the recessed field and secondary-button fill.

**Cool White** (`foreground`) carries primary text. **Cool Mist** (`muted-foreground`) carries metadata. **Quiet Rule** (`border`) separates lists and controls; `input` is the stronger editable-field stroke. Panel and sidebar strokes supply subtle boundaries without framing every row.

### Status

**Teal** (`success`) means confirmed connection success; **Amber** (`warning`) means checking; **Coral** (`destructive`) marks failures, destructive text and invalid fields. **Deep Rose** (`danger-solid`) fills destructive buttons with white text. Status color accompanies a readable label.

**The One Action Accent Rule.** Use blue for actions, focus and selection; status colors communicate labeled operational states.

## Typography

**Display and Body Font:** Inter with system sans-serif fallbacks. **Mono Font:** JetBrains Mono for endpoints, digests, tag identifiers and compact technical strings.

The type is direct and workmanlike. Headings use tight tracking and balanced wrapping. Body copy uses sentence case; navigation group labels use small uppercase text. Tabular figures support numeric alignment.

### Hierarchy

- **Display:** the overview uses the display token on wider screens and (30px / 36px) on mobile.
- **Headline:** operational titles use the headline token, rising to (30px / 36px) at the small breakpoint.
- **Title:** section headings use the title token; smaller section and card titles use (16px / 24px).
- **Body:** rows and controls use the body token; overview supporting copy rises to (16px / 24px) on wider screens.
- **Label:** metadata uses the label token; navigation uses (13px).
- **Mono:** technical metadata uses the mono token; tag names may use (14px / 20px).

**The Readable Metadata Rule.** Keep ordinary metadata at least (12px); use weight, alignment and cool mist before shrinking text.

## Layout

The desktop shell uses a fixed rail (228px) and sticky topbar (64px). Operational pages center within a maximum (1200px); registry forms narrow to (896px). Main padding progresses from (16px) to (20px), then (28px) horizontally on large screens. Major groups use (24–28px) gaps; standard cards use (24px) padding.

Below (1024px), the rail becomes a navigation sheet (280px). At (640px), stacked headers and controls can align horizontally; breadcrumbs appear from (768px). The overview summary changes from two columns to an inline row; activity changes from one column to two, then three.

Overview repository rows align a flexible name, registry (192px), tag count (64px) and arrow (24px), with (12px) gaps. Mobile hides registry context and narrows the count to (48px), retaining the name, count and arrow. The overview repository index uses one slate panel with a quiet perimeter, inline totals and registry scope above it.

## Elevation & Depth

Depth primarily comes from tonal layers, strokes and spacing. Rows remain flat and change color on hover or keyboard focus. Panels use a small ambient shadow; selected tabs use local elevation; dialogs use stronger overlay separation.

- **Panel:** `0 8px 24px rgb(2 8 18 / 0.16)`.
- **Selected tab:** `0 1px 4px rgba(0, 0, 0, 0.12)`.
- **Dialog:** `0 18px 50px rgb(2 8 18 / 0.45)`.

State transitions generally take (150–200ms). Buttons scale to (0.98) when pressed. Sheets retain their existing enter/exit animation. Global reduced-motion rules reduce transition and animation duration to (0.001ms) and disable smooth scrolling.

**The Quiet Surface Rule.** Give data rows color feedback rather than elevation; reserve shadows for contained surfaces and overlays.

## Shapes

Controls and navigation use compact `control` corners; cards use the slightly softer `panel` radius. Shared dialogs use the modal radius (10px), elevated popover fill and a quiet boundary. Compact badges and status dots retain fully rounded silhouettes. Small inline links use the smaller radius for focus outlines.

Thin boundaries distinguish fields, tables and operational rows. Cards use a subtle inset perimeter that does not change their layout dimensions. Avoid nested frames where spacing and type already explain grouping. Standard line icons are usually (16px), with smaller badge icons.

## Components

### Buttons

Compact and explicit. Primary uses blue with dark ink; outline uses a quiet border and recessed control fill. Secondary uses Raised Slate; ghost gains that fill on hover; link uses blue text and a hover underline. Destructive uses Deep Rose with white text. Default height is (36px), small (32px), large (44px); default padding is (8px 16px), reduced when an icon is present. Focus is a solid (3px) blue ring. Disabled controls reduce opacity to (50%).

### Inputs / Fields

Recessed control fill, stronger input stroke, compact corners, height (40px), padding (8px 14px). Focus turns the border blue and adds a solid (2px) ring. Invalid fields use Coral for border and ring. Placeholders use Cool Mist; disabled fields reduce opacity to (50%).

### Cards / Containers

Panel corners, Slate Panel fill, padding and internal gap (24px), panel shadow and a quiet inset perimeter. Titles are semibold, descriptions use Cool Mist. Use for related form or inspection content; summaries and lists need no automatic card wrapper.

### Navigation

Deep Navy Rail contains the brand, main destinations and registry shortcuts. Active items use Slate Selection, a blue-tinted inset boundary and blue icon. Ordinary items use Cool Mist, becoming cool white on a raised slate hover fill. Item padding is (8px 12px). Mobile reuses the same navigation and closes after navigation.

### Chips / Status

Secondary badges use Raised Slate, cool white text and pill padding (2px 10px). Outline badges use a quiet border; destructive badges use translucent Coral. Connection chips pair a colored dot with “Live,” “Testing” or “Needs attention”; unknown connection state supplies no claimed status.

### Tabs

Default tabs use a translucent secondary track with (4px) padding and compact corners. Active tabs use selection fill, cool white text and selected-tab shadow. Line tabs use a blue bottom border. Triggers use (14px) text and a (2px) focus ring; disabled tabs reduce opacity to (50%).

### Repository Rows

Aligned links with row rules, folder icon, name, registry context, tabular count and arrow. Overview rows use minimum height (64px) and padding (16px 12px). Hover/focus applies Slate Selection and blue emphasis to name, icon and arrow; keyboard focus adds an inset (2px) ring. Loading skeletons, empty copy, incomplete-data notes and unknown-total em dashes preserve the layout hierarchy.

## Do's and Don'ts

### Do:

- **Do** use shared navy, slate and blue tokens across operational screens.
- **Do** distinguish editable fields, clickable rows and primary actions.
- **Do** preserve visible focus, mobile stacking and reduced-motion behavior.
- **Do** label status and distinguish unknown or failed data from confirmed zero.
- **Do** use English interface copy while preserving user-provided names.

### Don't:

- **Don't** introduce local palettes or decorative gradients outside the shared tokens.
- **Don't** introduce light surfaces, oversized pill controls or studio-rendered decoration.
- **Don't** use status colors as decorative accents.
- **Don't** turn every summary or data row into a floating card.
- **Don't** invent registry health, counts or capabilities to fill visual space.
