# Operational UI tokens

The application UI uses English only. The application uses a dark theme. User-provided names may use any script.

The application uses the shared Tailwind v4 tokens in `src/app/globals.css` for its working screens. Use `rounded-panel` (12px) for content surfaces and dialogs, and `rounded-control` (8px) for controls and interactive rows. The radius scale stays between 6px and 16px; use fully rounded shapes only for dots and compact status badges. Use at least 12px for readable metadata. Use `bg-card`, `border-panel-border`, `shadow-panel`, and `text-link` for dark surfaces and links. The blue link and focus tokens indicate actions and selection; reserve other colors for status and data. Buttons, inputs, and cards use these defaults in `src/components/ui/`.

Color hierarchy: Graphite + Muted Blue uses a near-black neutral canvas and raised graphite surfaces. Muted blue identifies primary actions, focus, and selection; ordinary controls use foreground text. Use `success`, `warning`, and `destructive` for labeled states, and `danger-solid` for destructive button fills with white text. Do not use status colors as decoration.

The older bento reference below describes the original visual direction; the operational UI tokens above take precedence for the application screens.

---

# Build a dashboard web page in the "Bento Grids (Apple-style)" UI style

Platform: Web (responsive, 1440px desktop down to 375px) · Stack: Next.js + shadcn/ui · Mode: dark

## The style in one line
The Apple keynote slide as a web page: big 28–32px rounded white tiles on a #F5F5F7 grey canvas, huge tight headlines and studio-lit product renders.
Design keywords: Apple keynote bento, light grey #F5F5F7 canvas, big rounded white tiles, soft studio shadows, SF-style tight headlines, product render tiles, black “Pro” tile, blue pill links.

## Visual language
The Apple keynote summary slide as a product page: a light grey #F5F5F7 canvas (alternating with pure white sections) holding large white tiles with 28–32px corners, no borders and a barely visible soft shadow. Typography is an SF-like neutral grotesque (Inter) at 600 weight with tight −0.03em tracking — short, huge, centred headlines and quiet grey copy. Colour is rationed: near-black #1D1D1F text, #6E6E73 secondary, Apple blue #0071E3 on the single primary pill, an orange #B64400 'New' eyebrow and a few multicolour icons, plus black 'Pro' tiles lit like a studio product shot (radial highlight, glossy rendered object, deep drop shadow).

## Signature details (must be visible)
- Canvas #F5F5F7 with white #FFFFFF tiles; on white alternate sections the tiles flip to #F5F5F7
- Tile radius 28px (32px for hero stage, bento and CTA), never a border. Tile shadows only from the tokens (sm 4%, md 5%, lg 8% maximum). The deep shadows are only the drop-shadow under the rendered object inside black stage tiles (0 30px 30px rgba(0,0,0,0.7)) and the device-panel shadow in the hero stage. The segmented-control thumb uses 0 1px 4px rgba(0,0,0,0.12)
- Bento sizing: 4 columns, 20px gap, grid-auto-rows minmax(260px, auto), grid-auto-flow dense. Features = black stage 2×2 + 1×1 + 1×1 + 2×1 + 2×1 + 2×1 (columns × rows). Tile padding 32px, title 1.4–1.85rem at the bottom, icon at the top
- Studio product renders: black stage tiles with radial-gradient(70% 60% at 50% 38%, #3A3A3E, #1A1A1C 45%, #000 80%) and a glossy sphere (radial highlight + rim light) with its drop shadow. The stage gradient is only for the hero stage, the 2×2 feature, the first KPI, the CTA and the mobile featured card
- Headlines: Inter 600, −0.03em, one or two short lines, centred, display up to ~5.75rem; h1 at least 1.25× h2.
- Blues: #0071E3 (primary) fills the primary pill and outlines the secondary pill. #0066CC (accent) is only for text links and ghost buttons. On black stage tiles use #2997FF. Primary hover #0077ED. No other blues
- Borders: tiles never have borders. Allowed hairlines: the nav bottom (text at 8%), FAQ row separators, 1px #D2D2D7 inputs and radio cards, and the 1px blue secondary pill
- Colour exceptions, declared as named extras next to the tokens: --orange-text #B64400 (eyebrow and solid badge); icon colours --purple #BF5AF2, --orange #FF9F0A, --green #30D158, --pink #FF375F; stat numerals linear-gradient(100deg, #0071E3, #BF5AF2 70%, #FF375F) clipped to text; switch-on #30D158 on track #E9E9EB; forecast band #BF5AF2 at 14%; stage colours #3A3A3E/#1A1A1C/#000; hover blue #0077ED. Colour appears only in these places
- Orange #B64400 sentence-case eyebrow ('New · …'), no caps or tracking; multicolour SF-Symbols-style 40px line icons with no icon background

## Design tokens — use these exact values
Historical palette (not used by the application):
  - background #F5F5F7
  - surface #FFFFFF
  - surface-2 #FBFBFD
  - text #1D1D1F
  - text-muted #6E6E73
  - primary #0071E3 (text on it #FFFFFF)
  - secondary #1D1D1F (text on it #FFFFFF)
  - accent #0066CC
  - border #E5E5EA
  - success #1D8838 · warning #B25000 · danger #D70015
  - chart series #0071E3, #1D1D1F, #86868B, #BF5AF2, #FF9F0A
Radius: sm 10px, md 14px, lg 28px, xl 32px, pill 980px
Border width: 1px
Shadows: sm `0 1px 3px rgba(0,0,0,0.04)`, md `0 4px 20px rgba(0,0,0,0.05)`, lg `0 18px 50px rgba(0,0,0,0.08)` (where shadows reference var(--c-border) use the border colour)
Spacing: 8px base unit × 1.1 density
Motion: 300ms cubic-bezier(.28,.11,.32,1)

## Typography
- Headings: Inter 500/600/700; body: Inter 400/500/600.
- CSS stack: `"Inter", system-ui, sans-serif`.
- Display size clamp(3rem, 7vw, 5.75rem), heading weight 600, heading tracking -0.03em, sentence-case labels.

## Components
- Global nav: 52px tall, rgba(245,245,247,0.8) with saturate(180%) blur(20px), hairline bottom, 0.82rem links, small blue pill CTA
- Primary button: #0071E3, white 500-weight text, pill (980px); hover #0077ED, no lift. Secondary: transparent with 1px #0071E3 border and blue text, fills blue on hover. Ghost/text links: #0066CC
- Bento feature tiles: 2×2 black stage tile with the glossy sphere render (about half the tile width, near the top, clear of the icon and title) + white tiles with 1.4–1.85rem titles at the bottom and a coloured icon at the top
- Segmented controls/tabs: rgba(0,0,0,0.06) pill track, selected segment white with 0 1px 4px rgba(0,0,0,0.12)
- Inputs: white, 1px #D2D2D7, 12px radius, 50px tall; focus = blue border + 4px rgba(0,113,227,0.24) ring
- iOS switch: 51×31 track #E9E9EB → green #30D158, 27px white knob with soft shadow
- Badges/chips: rgba(0,0,0,0.06) pills; active chip = #1D1D1F with white text
- Pricing: white tiles; the featured plan is a flat #000 tile with #F5F5F7 text, #A1A1A6 muted text and a blue pill (no stage gradient)
- Dashboard: translucent top bar with a pill segmented nav, white 28px tiles on grey, first KPI as a black studio tile, blue primary series and purple forecast band
- FAQ: one large white 32px tile containing rows separated by 1px hairlines, blue '+' toggle
- Trust: 3 white tiles in a row (28px radius, 32px blue icon top-left, 2-line label)
- Showcase: a pill segmented tab control above two white 32px-radius cards, set in a white section where tiles flip to #F5F5F7

## Layout for this web page
Logged-in analytics dashboard: app navigation, page header with date-range control, KPI cards, charts, a data table and an activity feed.
Shell: top navigation bar. Widgets in order: kpis, forecast, compare, donut, table.
Translucent thin nav → centred keynote headline with orange eyebrow, lead in 500-weight grey, two pill buttons. Hero: under the centred copy, a 32px-radius black stage tile (the stage gradient) with the product UI rising from its bottom edge: a #F5F5F7 device panel with 22px top corners, a 6px #2A2A2D bezel and a 0 30px 80px rgba(0,0,0,0.6) shadow, filled with white 18px-radius mini cards. The glossy sphere render belongs to the 2×2 feature tile, the CTA and the mobile featured card, not the hero. Then the feature bento (rows completely filled), a white section with the showcase, four stat tiles with gradient numerals, three trust tiles, pricing tiles with a flat black featured plan, testimonials, one FAQ tile and a black stage CTA tile with a lit render above the headline. Generous 88px section padding; let whitespace and size do the work. Dashboard: translucent top bar with a pill segmented nav, white 28px tiles on grey, first KPI as a black stage tile, #0071E3 primary series and a #BF5AF2 14% forecast band.

## Content
Use realistic product copy (fictional brand) suited to: Hardware and consumer-tech product pages. Use English for UI copy and set the document language to English.

## Do
- Use #F5F5F7 as the page and #FFFFFF tiles with 28–32px radius
- Set headlines at 600 weight with −0.03em tracking and keep them to one or two short lines
- Fill hero tiles with a lit product render: radial highlight on a dark or white field
- Use Apple blue #0071E3 for the primary pill and #0066CC for text links; other colour lives only in icons, the orange eyebrow and gradient stat numerals

## Don't
- No borders on tiles (hairlines only for the nav, FAQ rows and inputs), and no coloured tile fills beyond black/white/grey
- Don’t use hard or dark drop shadows on tiles — keep them ≤ 8% opacity (token lg)
- Don’t crowd a tile with more than one message
- Don’t use playful or rounded display fonts
- Borders on tiles, or coloured tile fills other than white, grey and black (reads as Bento Box Grid)
- Tile shadows darker than 8%, hard shadows, and glassmorphism on tiles
- Small radii (<20px) or square corners on tiles
- Playful, rounded or display fonts; uppercase tracked labels
- Blues other than #0071E3 / #0066CC (and #2997FF on black), or several competing CTA colours
- Crowding a tile with multiple messages or long paragraphs

## Stack notes
Next.js App Router + shadcn/ui. Override the shadcn CSS variables in globals.css (--background, --foreground, --primary, --radius …) with the tokens below, then restyle Button/Card/Input via className so the signature details are visible. Load fonts with next/font/google.

## Acceptance checklist
- Someone who knows the "Bento Grids (Apple-style)" style recognises it at a glance from the signature details.
- Every colour, radius, border and shadow comes from the tokens above.
- Text renders in its intended font with comfortable line-height.
- Text contrast meets WCAG AA (4.5:1 body, 3:1 large text) unless the style explicitly trades this off.
- Interactive elements have hover, focus-visible and pressed states in the style's language.
