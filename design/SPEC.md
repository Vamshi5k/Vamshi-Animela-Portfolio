# VAMSHI.DEV — Design Spec

Status: **approved with conditions** (fonts, film-still portrait, typographic About, two hero buttons, width-axis rule, no live time, poster exclusion). No code is written against this spec yet.

Sources studied:
- `design/references/moodboard.png` (1186×1327)
- `public/images/vamshi-portrait.webp` (900×1600, a pixel-identical lossless copy of `design/references/vamshi-portrait-original.jpeg`). The original JPEG stays in `design/references/` and is not served from `public/`.
- `src/data/*.ts` (content as of commit `e179d76`)

Identity: `#090909` bg · `#171717` surface · `#F2F0EA` text · `#A5FF6B` accent · `#858585` muted.
Personality: cinematic, editorial, experimental, premium, minimal, technical, trustworthy.

## 0. Content reality this design must survive

| Data | Known | Still TODO / empty | Design consequence |
|---|---|---|---|
| Profile | name, 3 roles, Hyderabad, 3 availability modes, ~3 years, 3 languages | headline, bio | Hero must work without a tagline. About is typographic and depends on the bio. |
| Tech | 13 names | — | Marquee material. Text only, no logos. |
| Projects | 4 titles, numbers, features (01–03), Zylo frontend-only | category, tech, summary, hasBackend (01–03), all screenshots, Zylo features | Work must look intentional with **zero screenshots**. Never mock a phone UI. |
| Experience | 1 company, 3 role titles, 3 start dates, current role | end dates (01–02), employment type (03), all descriptions | Timeline may only plot **start** dates as facts. |
| Skills | 6 groups, 21 items | — | Fully known; can be the densest typographic section. |
| Services | 6 titles | all descriptions | Titles must carry the section alone. |
| Clients | 4 names, SR Travels location | category, contribution, tech, screenshots; no verified URLs | A "gallery" with no images yet. Names must carry it; links hidden. |
| Education | B.Tech ECE 2022; 1 certificate; 1 learning entry | — | Learning must never be styled like a certificate. |
| Contact | email, LinkedIn, GitHub | WhatsApp is null (optional, hidden) | No phone number anywhere. |

Pending content is rendered with one consistent placeholder (see §4, "pending plate").

**Copy that must be added to `src/data` before implementation** (UI labels, not facts):
- hero buttons `LET'S WORK TOGETHER` and `EXPLORE MY WORK`;
- section names and kickers;
- `COPY EMAIL` / `COPIED`, `PAUSE` / `PLAY`, `BACK TO TOP`, `PRESENT`;
- the `PENDING — …` labels;
- figure captions and portrait `alt` text (proposed by me, approved by you).

## 1. Layout system

- Desktop (≥1024): 12 columns, 48px outer margin, 24px gutter. Max content width 1440 − 96.
- Tablet (768–1023): 8 columns, 32px margin, 20px gutter.
- Mobile (<768): 4 columns, 20px margin, 12px gutter. Verified at 390 and 375.
- Vertical rhythm: 8px base. Section padding: 160px desktop, 120px tablet, 96px mobile.
- Header: fixed, 56px, transparent over `#090909`. Mono. Left: `VAMSHI.DEV`. Center (desktop only): current section index (see §4). Right: nav items + `LET'S TALK` (from `nav.cta`). Mobile: `VAMSHI.DEV` + `MENU` button opening a full-screen list (Framer Motion, focus-trapped).

## 1a. Section-by-section

Numbered sections carry a section index (§4). The marquee and footer are bands, not sections, and are unnumbered.

| # | Section | Layout composition (grid · focal point) | Typographic treatment | Signature motion | Mobile adaptation |
|---|---|---|---|---|---|
| 00 | **Hero** | **Asymmetric film frame.** Portrait plate in cols 8–12, 3:4, bottom-aligned to the hero baseline, with crop marks at its four corners and a mono caption under it (`FIG. 00 — HYDERABAD, IN · 17.38° N 78.48° E`). Crop per §5. Name stacked in cols 1–7, two lines, bottom-aligned to the same baseline. Roles as a mono line above the name. Below the name: availability line, then **two buttons**: `LET'S WORK TOGETHER` (primary: accent fill, `#090909` text) and `EXPLORE MY WORK` (ghost secondary: 1px `#F2F0EA` outline, text colour, transparent fill; links to `#work`). **Focal point:** the face in the upper third of the plate, read diagonally against the name at bottom-left. | Name: Display XL, Archivo wdth 62 / wght 800, uppercase, line-height 0.82. Roles: Mono S uppercase, separated by ` / `. Headline slot (TODO): Body L, one line under the name. Buttons: Mono S uppercase, 48px tall, square corners, arrow `→` on the primary only. | GSAP intro timeline, once: hairlines scale-x 0→1; name lines rise through a clip mask (each line's box is `overflow: hidden`, text translateY 100%→0); portrait plate reveals by `clip-path: inset(100% 0 0 0)` → `inset(0)`; crop marks and buttons fade in last. Total ≤ 1.4s. Scroll: plate drifts −6% yPercent (desktop, scrubbed). Buttons: Framer Motion hover/press states (primary: background shifts to `#F2F0EA`; ghost: fills `#171717`). | Stack: mono roles → name full width → portrait full-bleed 4:5 (no side margins, crop per §5) → availability → both buttons full width, primary first. No parallax. Intro durations × 0.6. |
| — | **Marquee** | **The only full-bleed horizontal band.** Ignores the grid entirely; one line of type between two hairlines that run edge to edge. A small `PAUSE` toggle sits at the right end of the lower rule. **Focal point:** none by design; it is a rhythm break between hero and work. | 13 tech names from `tech.ts`, Archivo wdth 125 (expanded, **static**) / wght 500, uppercase, Display M size. Separators: muted `/`. | Continuous horizontal loop (GSAP, `transform` only); speed and direction follow scroll velocity (ScrollTrigger `getVelocity`, clamped). Pause button stops it (WCAG 2.2.2). | Smaller size (Heading). Velocity coupling off on touch; constant slow loop. Reduced motion: static wrapped list of all 13 names in the same type (inside the page margins), duplicate set hidden, no PAUSE toggle. |
| 01 | **Selected Work** | **Sticky index + scrolling stage.** Cols 1–4: sticky list of the 4 projects (number + title). Cols 6–12: one panel per project, each ≥ 100vh, scrolling normally. Panel: big number, title, category, features as a mono list, tech, summary, screenshot area. **Focal point:** the active panel's title; the index shows where you are. | Index rows: Mono S number + Body title. Panel number: Display L in muted. Panel title: Display M, wdth 100 (static), may wrap to two lines (`text-wrap: balance`). Features: Mono S list with `—` bullets. Zylo: stamped label `FRONTEND ONLY. NO BACKEND.` (from `projectCopy.frontendOnly`), shown in **both** the index row and the panel. | Active project tracked with ScrollTrigger; the index indicator (a 2px accent bar) moves between rows with a Framer Motion shared `layoutId`. Panel contents enter with a short GSAP stagger. Natural scroll, CSS `position: sticky`; nothing is pinned or hijacked. | Index becomes a sticky horizontal strip `01 02 03 04` under the header (tabs that jump to panels). Panels have natural height, not 100vh. |
| 02 | **Experience** | **Time ruler.** One full-width horizontal ruler (cols 1–12). Month ticks run from Aug 2023 to Nov 2024, spaced proportionally. Three markers sit at the three **start dates** only. After the last start, the ruler continues as an open dashed segment to a **fixed `PRESENT` marker** at the right end. That segment's length is fixed, not proportional, and nothing reads the clock. Role titles hang below their markers; company + location appear once, as a mono label at the ruler's left end. **Focal point:** the current role (React Native Developer) at the `PRESENT` end, the only marker in accent. | Ruler labels: Mono XS. Role titles: Heading. Current role: Display M. Dates: Mono S (`NOV 2024 — PRESENT`). End dates of roles 1–2 are TODO, so they are **not** printed; only starts are. | Ruler draws left→right, scrubbed to the section's scroll progress (GSAP `scrub` on `scaleX`, no pin). Markers appear as the line reaches them. | Ruler turns vertical along the left margin; roles stack to its right with proportional (min 64px) spacing, then the dashed segment to `PRESENT`. No scrub; one draw on enter. |
| 03 | **Expertise** | **Spec-sheet table.** Six ruled rows across the full grid. Col 1–3: group label (mono) and item count. Col 4–12: the group's items flowing inline as one typographic line, separated by ` / `. The Mobile row is set one size larger than the others (React Native is the primary skill). **Focal point:** the Mobile row. | Labels: Mono S uppercase + count `03`. Items: Display M, Archivo wdth 87 / wght 500, static (Mobile row: Display L). | On enter: each row's rule draws, then its text rises through a line mask (GSAP stagger by row). Hover/focus on a row dims the others to muted (Framer Motion, colour only, 200ms). | Label sits above items; items wrap; no hover dimming. |
| 04 | **Services** | **Descending ladder.** Six full-width rows whose titles start one column further right on each row (row 1 at col 1, row 6 at col 6), forming a diagonal staircase down the grid. Titles may wrap to two lines within their span (cols n–12). Each row is a disclosure button that opens its description. **Focal point:** the diagonal itself, ending at the last row near the right edge. | Titles: Display M, Archivo wdth 75 / wght 700, uppercase, static. Row number: Mono S at the far left, always in col 1 (the only thing not stepping). Description: Body, max 56ch. | Framer Motion: open/close animates height and a `+` → `−` rotation; only one row open at a time. On enter: rows slide in from the left by their step offset (GSAP `x`, small distance). | Ladder collapses to 0 / 8 / 16 / 24 / 32 / 40px indents, so the diagonal is still visible. Accordions unchanged. |
| 05 | **Client Gallery** | **Centered credits roll.** The site's only centered composition. Mono kicker, then four client names stacked and centered, each with a mono caption line (location if known; otherwise the pending marker). When a screenshot exists, a small 4:3 plate sits under its name. When `urlVerified` is true, the name becomes a link with `↗`. **Focal point:** the name currently crossing the vertical center of the viewport. | Names: Display L, Archivo wdth 75 / wght 700, **static width**, centered, up to two lines (`text-wrap: balance`; "Sree Annapurna Cloud Kitchen" needs two at desktop). Captions: Mono XS. | **Center-line wipe (no reflow).** Each name is revealed by a horizontal `clip-path` wipe from its center outward as it enters the lower third (GSAP scrub). While it sits in the center band, its colour moves muted → text, and a hairline under it scales-x from the center. Only `clip-path`, `transform` and `color` change, so layout never moves. | Names at Display M. Wipe runs once on enter (no scrub on touch); colour change is static (text colour). |
| 06 | **About** | **Typographic spread: pull quote, column, sidebar.** Row 1: a pull quote (the bio's lead sentence) set in Display L across cols 1–10, hanging-punctuation style, with the section index in the margin. Row 2: the bio body in cols 3–7, and a mono fact sheet in cols 9–12 (location, experience, languages with proficiency, education, credentials, availability) as a definition list with hairlines between entries. **No photograph.** **Focal point:** the pull quote. | Pull quote: Display L, Archivo wdth 87 / wght 500, sentence case, max 3 lines. Body: Body L, max 60ch. Fact sheet: Mono S labels, Body values. Certificate: `CERTIFICATE — ACE WEB ACADEMY`. Learning: `SELF-DIRECTED LEARNING — UDEMY, FREECODECAMP` in muted, never styled like the certificate. While the bio is TODO, the pull quote and body each show a pending plate (`PENDING — BIO`). | Deliberately calm. Fact-sheet hairlines draw in sequence on enter (scale-x); pull-quote lines rise through the line mask once. No scroll-scrubbed text-opacity effects. | Pull quote (Display M) → bio → fact sheet as a 2-column definition list, then 1 column at 375. |
| 07 | **Contact** | **One-line statement.** The email address set across the full content width in a tall, bottom-heavy section. Above it: section kicker and `LET'S TALK` heading. Below it: a row with `COPY EMAIL` (button), LinkedIn ↗, GitHub ↗, location, availability. WhatsApp is hidden while null. **Focal point:** the email address. | Email: Archivo wght 700, lowercase, single line (`white-space: nowrap`). Font size is computed so that the email at **wdth 100 exactly fills the content width** (≈ 90px at 1440, ≈ 25px at 375). The email sits in a fixed-size box of that width and height. Links: Mono S uppercase text (no brand icons; lucide-react 1.x has none). | **The site's only width-axis animation.** At rest the email is set at wdth 75 (narrower, left-aligned inside its fixed box). On hover/focus of the email link it eases to wdth 100, filling the box. The box is sized for the wider state, so nothing reflows and nothing overflows. The underline draws at the same time (Framer Motion). Copy button: label `COPY EMAIL` → `COPIED` with a layout transition. | Touch and reduced motion: static at wdth 100 (fills the width), no width animation; the underline is always visible. Actions stack as full-width rows, each ≥ 48px tall. |
| — | **Footer** | **Colophon strip.** A dense 4-column grid of small mono text: (1) `© YEAR VAMSHI ANIMELA` (2) coordinates `17.38° N 78.48° E` and `HYDERABAD, IN` (3) repeated nav (4) colophon: typefaces and stack, plus `BACK TO TOP`. **No live clock.** **Focal point:** none; it closes the page quietly. No giant cropped wordmark. | Mono XS throughout; one size only. | None. | 2 columns, then 1. |

### Width-axis rule

These rules also go into CLAUDE.md when implementation starts.

- Animating Archivo's `wdth` axis is allowed **only** on large display text (Display M or larger) inside a **fixed-size container sized for the widest state**, so it can never reflow surrounding layout or cause overflow.
- **Never** animate the width of body text, labels or anything that wraps.
- Width animation is **static on touch devices** (`(hover: none)` or `(pointer: coarse)`) and with **prefers-reduced-motion**. It then rests at the state that fills its container.
- Static use of different widths (marquee 125, name 62, titles 75–100) is unrestricted.
- **Current use in this spec: exactly one place, the Contact email hover.** Everything else that moves uses `transform`, `clip-path`, `opacity` or `color`.
- **Risk:** even inside a fixed box, a `font-variation-settings` change re-shapes the text on every frame. **Fallback:** if it costs frames on mid-range devices, or the box measurement isn't stable across font loading, drop the width change and keep only the underline draw.

### Time and cacheComponents (per CLAUDE.md)

- **No live clock.** The footer shows coordinates only.
- **Experience ruler:** ends at a fixed `PRESENT` marker; nothing reads the current date.
- **Footer copyright year:** either a small client component that sets the year after mount, or a value fixed at build time. Whichever is used must follow the Next 16 cacheComponents rules; I'll check `node_modules/next/dist/docs` before implementing it. If it hits a cacheComponents error, that gets reported, not worked around.

## 2. Proof that no two sections share a composition

Each section's composition is defined by four attributes. **No two rows match on all four**, and the pairs most at risk of looking alike are separated below.

| Section | Alignment / axis | Grid use | Dominant element | Scroll behavior |
|---|---|---|---|---|
| Hero | Asymmetric, diagonal | Split 7 / 5 | Photograph | Intro timeline + slight drift |
| Marquee | Horizontal, edge to edge | **Ignores grid** | Moving type line | Continuous loop, velocity-linked |
| Work | Asymmetric, two columns | 4 sticky / 7 scrolling | Sticky index | Sticky + per-panel triggers |
| Experience | Horizontal axis | Full 12, data-proportional | **Ruler** (measured time) | Scrubbed line draw |
| Expertise | Left-anchored rows | Label 3 / content 9 | Dense inline type | Row-by-row reveal |
| Services | **Diagonal** | Stepping column starts | Staircase of titles | Disclosure (Framer) |
| Clients | **Centered** | Center axis only | Names | Scrubbed center-out wipe |
| About | Stacked spread, offset columns | 10 wide, then 5 + 4 | **Pull quote** | Minimal |
| Contact | Full width, bottom-heavy | Single line spanning 12 | **One string** (email) | Hover only |
| Footer | Dense grid | 4 equal columns | Small text | None |

Pairs most at risk:
- **Expertise vs Services** (both lists of six): Expertise is a fixed two-column table read **across** (label → items, dense). Services is a diagonal read **down**, one title per row, interactive. Different alignment, density and interaction.
- **Expertise vs About** (both have a mono label column): Expertise is six equal ruled rows of the same weight. About is one oversized quote followed by asymmetric text columns; its mono column is a sidebar to the right, not a row label on the left.
- **Hero vs About**: Hero is image-led and right-weighted. About has no image and is left-weighted, led by the pull quote.
- **Work vs Clients** (both "show work"): Work is an asymmetric sticky index with long panels. Clients is a centered stack with no sticky element.
- **Marquee vs Clients** (both move type horizontally): the marquee **translates** type continuously; Clients **reveals** type in place with a mask and never translates it.

## 3. Typography

**Decision: replace Geist** (approved). Geist is the `create-next-app` default and Vercel's own brand face, so on a developer portfolio it reads as "template". It also has no width axis.

### Loading (next/font/google, `subsets: ["latin"]`, `display: "swap"`)

Only what the spec uses (§3 scale and §1a) is loaded.

| Role | Typeface | Load exactly | Used for |
|---|---|---|---|
| Display | **Archivo** | variable font, `axes: ["wdth"]` (wght is part of the variable font). Ranges actually used: wdth 62–125, wght 500–800. | Name (62 / 800), marquee (125 / 500), titles (75–100 / 500–700), email (75→100 / 700) |
| Body | **Instrument Sans** | variable font, **wght only** (no `wdth` axis: the spec never uses it). Weights used: 400, 600. | Body, Body L, Heading |
| Mono | **IBM Plex Mono** | static `weight: ["400", "500"]` | Labels, indices, dates, buttons, captions |

All three were checked against next/font's Google font catalogue.

### Why these three

- **Archivo:** one family covers condensed poster caps (the moodboard's hero name), expanded marquee type and normal headings. It is a grotesk with an industrial character, and not one of the overused "AI portfolio" display faces.
- **Instrument Sans:** a slightly narrow, warm grotesk. It reads well at 16–20px and has more character than Inter or Manrope, while staying distinct from Archivo's industrial shapes.
- **IBM Plex Mono:** engineered and precise, which suits "technical / trustworthy". It's less of a code-editor cliché than JetBrains Mono and less retro than Space Mono.

The moodboard's own fonts were rejected for practical reasons:
- **Neue Montreal:** commercial license, and not in next/font's Google catalogue.
- **Clash Display:** not in next/font's Google catalogue, and heavily overused.

### Type scale (fluid, rem at 16px root)

| Token | Size | Face / settings | Line height | Tracking |
|---|---|---|---|---|
| Display XL | `clamp(4.5rem, 15vw, 15rem)` | Archivo wdth 62, wght 800, uppercase | 0.82 | −0.01em |
| Display L | `clamp(2.75rem, 7vw, 7rem)` | Archivo wdth 75–87, wght 500–700 | 0.9 | −0.01em |
| Display M | `clamp(2rem, 4vw, 3.75rem)` | Archivo wdth 75–125, wght 500–700 | 1.0 | −0.005em |
| Heading | `clamp(1.375rem, 2vw, 1.75rem)` | Instrument Sans 600 | 1.2 | 0 |
| Body L | `clamp(1.125rem, 1.4vw, 1.375rem)` | Instrument Sans 400 | 1.5 | 0 |
| Body | `1rem` | Instrument Sans 400 | 1.6 | 0 |
| Mono S | `0.8125rem` | Plex Mono 400/500, uppercase | 1.4 | 0.06em |
| Mono XS | `0.6875rem` | Plex Mono 500, uppercase | 1.4 | 0.08em |

Body text never goes below 16px, and mono labels never carry essential content alone at 11px.

## 4. Recurring motif: the technical plate

One system, used identically everywhere:

1. **Section header rule.** Every numbered section opens with a full-width 1px hairline (`#F2F0EA` at 14% opacity). Directly under it is one Mono XS row: section index on the left (`§01`), section name next to it (`SELECTED WORK`), and on the right a count derived from data (`04 PROJECTS`, `06 GROUPS · 21 SKILLS`, `06 SERVICES`, `04 CLIENTS`, `03 ROLES`). Counts are computed from `src/data` lengths, never typed by hand. A small `+` registration mark sits at each end of the rule.
2. **Item numbers** use a different format from section indices, so the two are never confused: `01 / 04` (Work), `01`–`06` (Services rows).
3. **Crop marks.** Every image (the hero plate, plus client and project screenshots when they exist) gets four L-shaped corner marks 8px outside its edge, plus a mono caption with a figure number (`FIG. 00`, `FIG. 01` …). No image appears without them.
4. **Pending plate.** Any missing image or pending content block is shown as an outlined frame filled with 45° diagonal hatching (the moodboard's hatch element), with crop marks and the Mono XS label `PENDING — <WHAT>` (for example `PENDING — SCREENSHOT`). Hatching is used **only** for this, so it always means "not provided yet". This is the honest placeholder required by the content-integrity rule.
5. **Accent budget.** `#A5FF6B` is used only for: the primary CTA (`LET'S WORK TOGETHER`, and `LET'S TALK` in the header), the active section index in the header, the active item indicator (Work index bar, Experience `PRESENT` marker), focus rings and links on hover. It's never a fill for decoration, never a glow, and appears in at most two places per viewport. (The hero's first viewport has two: the primary button and the header CTA. Nothing else in the hero may use accent.)
6. **Header index.** The header's center shows the current section as `§03 / EXPERTISE`, updated by ScrollTrigger. The section rule and the header index are the same information, at two scales.
7. **Arrow.** `↗` marks external links only (LinkedIn, GitHub, verified client URLs). `→` appears only on the primary hero button. Internal links otherwise use no arrow.

## 5. Portrait treatment

### What the photo actually is
- **Format:** 900×1600 portrait (9:16), apparently a phone or messaging-app export. It has visible film-style grain and an existing cinematic grade: teal-cool shadows, warm highlights, and darkened top corners.
- **Subject:** standing, three-quarter view, head turned toward frame right, looking off-camera. Dark round sunglasses, voluminous wavy dark hair, a denim button-up shirt with rolled sleeves, left hand on hip at the right frame edge (the arm is cut by the frame), and a red braided bracelet near the bottom right.
- **Position:** the head spans roughly x 285–575, y 635–940; the face centre is about 52% across and 51% down. The torso fills the lower 45% of the frame. The top ~38% is empty wall.
- **Lighting:** warm, low window light from frame left. The window-pane shadow pattern falls across the lower-left wall. The face is lit softly and evenly, and the right side of the frame falls into shadow.
- **Background:** a light grey-white wall with about 12 film posters, two hanging caps and a ceiling smoke detector. It is busy, and much **brighter** than the site background.
- **People in the background:**
  - a small photo of two people, upper right, about **x 770–895, y 755–830**, level with the subject's head. **This is the one to exclude.**
  - a printed sports poster with a player, lower left, about x 95–210, y 1015–1180.

### Rules
- **The photo file is never altered.** No re-encoding, grading, retouching, blur or background removal, and nothing touching the face. Only cropping (through CSS framing), scaling, a clip-path reveal and a 1px frame are used.
- **No cutout.** The moodboard's hero figure is a different, edited image. The photo's own grade and grain are already cinematic, so it's presented as a **film still**: a rectangular plate with crop marks and a figure caption.
- **Brightness:** the wall makes the photo the brightest element on the page. Any correction is made **on the frame, in CSS**: a `filter` (for example a small `brightness()` reduction on the `<img>` element) or a vignette overlay on the plate. It's decided only after we review the real hero in screenshots. Nothing is applied by default.
- **Replacement:** you may replace the photo. All crop rectangles below are tied to this 900×1600 file and must be recomputed if it changes.

### Crops: exclude the two-person photo where possible

The two-person photo sits beside the subject's head (x ≥ 770), and the subject's shoulder and arm continue to the right edge (x 900) further down. A rectangle can only exclude it by cutting the frame at **x ≤ 760**. That cuts the right shoulder and arm, and with them the hand and bracelet. The crops below exclude it. The sports poster at lower left can't be excluded at the same time without cutting the subject, so it stays; it is printed poster art, not a private photo.

The crop is applied with an `overflow: hidden` frame and the image scaled and offset inside it (the image is 900/760 = 118.4% of the frame width, anchored left). The file itself is not cropped.

| Viewport | Plate | Source rectangle shown | Result |
|---|---|---|---|
| Desktop ≥1024 | 3:4, cols 8–12 (≈ 560×747 at 1440) | x 0–760, y 590–1600 | Hair has ~45px headroom; face ~23% from top, 62% across (looking into the frame's open right side). Two-person photo excluded. Hand and bracelet excluded. |
| Tablet | 3:4, cols 5–8 of 8 | same as desktop | same |
| Mobile <768 | full-bleed 4:5 (375×469 at 375) | x 0–760, y 590–1540 | Head in upper quarter, cut at the waist. Two-person photo excluded. |

**Resolution cost:** showing 760 source pixels across a 560px desktop plate means about 1.47× upscaling at 2× DPR. On a 3× mobile screen it's about 1.5× on a 375px-wide full-bleed plate. That's visible softness on top of the existing grain, so it's checked in the hero screenshots. If it's not acceptable:
- **Fallback A:** show the full width (x 0–900), which includes the two-person photo, for better sharpness.
- **Fallback B:** a replacement or full-resolution photo (preferred).

### About: no photograph (condition 3)

About is fully typographic (§1a). **Conditional alternative, only if you supply a full-resolution original (≥ 1800px wide):**
- **Desktop:** a narrow 2:3 detail crop of the hand, bracelet and denim (source region x 560–900, y 1060–1600 in today's coordinates, scaled to the new file) in cols 8–9, between the bio column and the fact sheet. The bio narrows to cols 2–7.
- **Mobile:** a 16:9 band after the bio.
- It gets the same crop marks and clip-path reveal as the hero plate.

### Alt text and loading
- `alt` text lives in `src/data` (I'll propose wording and you approve it).
- The hero image is `priority`.

## 6. Risks: where this could drift into a generic AI portfolio

| Generic pattern | Where it could creep in | How it's avoided |
|---|---|---|
| Cut-out portrait + glowing ring + gradient behind the name | Hero (it's literally in the moodboard) | Photo stays a rectangular film still; no glow, no ring, no gradient text. |
| Bento / card grids | Services, Expertise | No cards anywhere. Services is a diagonal ladder, Expertise a ruled table. |
| Phone mockups with invented screens | Work | Forbidden by content integrity. Screenshots appear only when real; until then, the pending plate. |
| Tech-logo marquee | Marquee | Text only, expanded type, velocity-linked, pausable. Logos are never used. |
| Big-number stat counters ("3+ years, 20+ projects") | Hero, About | None. "About three years" appears once, as text, in the fact sheet. |
| Scroll-scrubbed text-opacity reveals | About, bio | Not used. About is intentionally calm. |
| Variable-font "stretch on scroll" gimmick | Clients, Contact | Removed from Clients. Width animation exists once, on hover, in a fixed box (§1a width-axis rule). |
| Cursor followers / magnetic buttons / custom cursors | Everywhere | Not used. Native cursor; hover states only. |
| Smooth-scroll libraries (scroll hijacking) | Global | Not used. Native scroll only, per the MOTION rule. |
| Pulsing green "available" dot | Hero | Availability is a static mono line. |
| Lime used as decoration | Everywhere | Strict accent budget (§4.5). |
| Pill buttons, primary + ghost pair | Hero | Two buttons are kept (condition 4) but are square-cornered, mono, 48px tall, so they read as part of the plate system, not as SaaS. |
| Global grain/noise overlay, glassmorphism | Global | Not used. The photo already has its own grain. |
| Trendy display face (Clash, Syne, Space Grotesk) or serif-italic accents | Type | Archivo + Instrument Sans + Plex Mono; no italic display accents. |
| Cropped giant wordmark in the footer | Footer | Colophon strip instead. |
| Every section "fades up on scroll" | Motion | Each section has one signature motion (table §1a). Generic fade-ups are not allowed. |

## 7. Moodboard elements I'm choosing not to follow

| Moodboard element | Decision | Why |
|---|---|---|
| Hero portrait (cut-out figure, different pose, on black) | Not used | It isn't your actual photo. Recreating it means background removal and edits that risk altering your hair and face. |
| Metallic / chrome gradient on the name | Not used | Breaks the "no decorative gradients" rule. Weight and width carry the name instead. |
| Lime ring, `+` marks floating around the portrait | Ring not used; `+` kept only at rule ends | Random floating elements are banned; the `+` survives as a registration mark with a fixed job. |
| Tagline "I build digital experiences that move businesses forward" | Not used | Invented copy; `profile.headline` is a TODO for you to write. |
| Phone number in the contact card | Not used | `contact.whatsapp` is null and declared "may not be published". |
| Services as a 2×2 icon-card grid | Not used | Generic SaaS layout, banned by the DESIGN rule. |
| Project card with a phone mockup and map UI | Not used | Fake product UI. |
| Project carousel (`01 / 04` with arrows) | Not used | It hides three of four projects. All four are visible; `01 / 04` survives as a numbering format. |
| Dotted globe in contact | Not used | Decorative and random. Coordinates in mono say "Hyderabad" more precisely. |
| 3D glossy shapes, lime glass prisms, rocks ("Visual language") | Not used | Decorative 3D assets unrelated to the content, heavy to load, and they read as stock AI imagery. |
| Lime radial glow, dot grid, concentric rings ("Textures") | Not used | Decorative gradients and textures. |
| Diagonal hatching | **Kept** with one meaning | Used only for pending content (§4.4). |
| `↗` arrow | **Kept** with one meaning | External links only (§4.7). |
| Hero buttons `EXPLORE MY WORK` + `LET'S WORK TOGETHER` | **Kept** (condition 4), roles swapped | `LET'S WORK TOGETHER` is the accent primary, `EXPLORE MY WORK` the ghost secondary. Both labels go into `src/data`. |
| Pill-shaped buttons | Square corners | The site's language is plates, rules and crop marks. Pills read as SaaS. |
| Brand icons (LinkedIn, GitHub) | Text labels | lucide-react 1.x ships no brand icons, and text labels match the mono system. |
| Neue Montreal / Clash Display, Inter / Manrope | Archivo / Instrument Sans / IBM Plex Mono | See §3. |

**Kept from the moodboard:**
- the palette, exactly;
- condensed uppercase name in the hero;
- dark editorial mood;
- mono-labelled section kickers;
- the two hero buttons;
- the vertical experience timeline (on mobile);
- the email-led contact;
- one strong CTA in accent.

## 8. Open items

1. **Hero crop sharpness:** the poster-excluding crop (x 0–760) costs resolution. Decide between it, Fallback A or Fallback B after the first hero screenshots.
2. **Hero brightness:** decide whether a CSS filter or vignette on the frame is needed after the first hero screenshots.
3. **Photo:** you may replace it, or supply a full-resolution original. The latter also unlocks the About detail-crop alternative.
4. **Copy:** add the UI labels listed in §0 to `src/data`, and write `alt` text, before or during implementation.
