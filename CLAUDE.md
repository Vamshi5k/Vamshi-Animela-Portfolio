# VAMSHI.DEV

Personal portfolio of Vamshi Animela, React Native developer, Hyderabad, India.

See also @AGENTS.md: this is Next.js 16. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.

## Stack

- Next.js 16 (App Router, Turbopack), React 19
- TypeScript (strict)
- Tailwind CSS v4, CSS-first: tokens in `src/app/globals.css` (`@theme`), no `tailwind.config.*`. Loaded via `@tailwindcss/turbopack` in `next.config.ts`.
- GSAP with @gsap/react (`useGSAP`), ScrollTrigger
- Framer Motion (the `motion` package, imported from motion/react). Do not install `framer-motion`.
- lucide-react (icons), clsx (class names)
- Package manager: npm

## Scripts

- `npm run typecheck`: `next typegen && tsc --noEmit` (regenerates route types first so stale `.next/types` never break it)
- `npm run lint`: `eslint`
- `npm run build`: `next build`
- `npm run content:todos`: report every TODO, null and empty field in `src/data` (always exits 0)
- `npm run content:check`: same report with `--strict`; exits 1 on any TODO or missing required field (launch gate)

Content gate rules: a `{ todo }` value always fails. A null or empty array fails unless its path is declared optional in `scripts/content-optional.mjs`, the only place optional fields are declared. Do not add entries there without approval.

Components must hide an element whose optional value is null: no empty link, no dead button, no placeholder for it.

## Visual verification

- `npm run shots:prod`: production build, `next start` on port 3100, then `scripts/shots.mjs` against it; the server is always stopped afterwards. Add `-- --reduced` to emulate prefers-reduced-motion.
- `npm run shots -- <url> [--reduced]`: run `scripts/shots.mjs` against an already running server (default http://localhost:3000).
- Full-page screenshots at 1440, 1280, 768, 390 and 375 px go to `design/screenshots/<timestamp>/` (gitignored). Each width gets an overflow check (PASS/FAIL, offending elements listed); any FAIL exits 1.
- Screenshots and the overflow check are run against a production build, not next dev, because the dev indicator and dev behavior pollute results.
- After every UI task, run npm run shots:prod, open the screenshots, and describe what you actually see, including defects. Never claim visual verification without having viewed the images.

`scripts/content-todos.mjs` relies on Node running `.ts` files directly (built-in type stripping, Node >= 24, see `engines` in `package.json`). Data files in `src/data` must therefore only use `import type` from other modules and only erasable TypeScript syntax (no enums, namespaces or parameter properties).

## Folder conventions

- `src/app/`: routes, layouts, `globals.css`. Import alias `@/*` maps to `src/*`.
- `src/components/ui/`: small reusable primitives (buttons, links, tags).
- `src/components/sections/`: page sections, one composition per section.
- `src/components/motion/`: animation wrappers and motion primitives.
- `src/data/`: all copy and content (`*.ts`).
- `src/lib/`: helpers. `src/lib/gsap.ts` registers GSAP plugins once (client only); always import `gsap`, `ScrollTrigger` and `useGSAP` from `@/lib/gsap`.
- `src/hooks/`: custom React hooks.
- `design/`: design references and notes (not shipped).
- `public/images/projects/`, `public/images/clients/`: real image assets only.

## Next.js config notes

- next.config.ts has cacheComponents: true. Anything that reads the current time (for example new Date() for the footer copyright year), reads cookies or headers, or uses random values must be handled according to the Next 16 cacheComponents rules (Suspense boundary, "use cache", or a client component). Check the docs in node_modules/next/dist/docs before using such APIs. If a task hits a cacheComponents error, report it instead of disabling the flag.
- AGENTS.md is rewritten by next dev because of experimental.agentFeedback. Do not hand-edit AGENTS.md and do not commit incidental changes to it unless I ask.
- Keep the existing next.config.ts flags (`cacheComponents`, `partialPrefetching`, `experimental.agentFeedback`).

## Design system

- Spec: `design/SPEC.md`. Tokens: `src/app/globals.css` (`@theme`); type recipes are `type-*` utilities, grid is `layout-grid`.
- Motion tokens live in both `src/lib/motion-tokens.ts` (GSAP) and `globals.css` (`--duration-*`, `--ease-*`); keep them in sync. `/dev/design-system` flags mismatches.
- Fonts: `src/lib/fonts.ts` (Archivo with wdth, Instrument Sans wght only, IBM Plex Mono 400/500; latin). Archivo width is set with `font-stretch` (62%–125%).
- Width-axis rule: animate Archivo's width only on large display text (Display M or larger) inside a fixed-size container sized for the widest state. Never on body text, labels or wrapping text. Static on touch and under prefers-reduced-motion. Currently used only for the Contact email hover.
- Elements animated in by JS carry `data-reveal`; CSS hides them only when scripting is enabled and motion is allowed.

## TODO

- Replace the default Next.js favicon (`src/app/favicon.ico`) once a real icon exists.
- Remove or block `/dev/design-system` (`src/app/dev/`, `src/data/devDesignSystem.ts`) before launch (Prompt 20). It renders in production builds so `shots:prod` can capture it, and is `noindex` only.

## RULES

- CONTENT INTEGRITY: never invent statistics, clients, testimonials, screenshots, URLs, certificates, metrics or achievements. If content is missing, put a clearly marked TODO in the data file and render an honest placeholder. Never fake real product UI.
- All copy lives in src/data/*.ts. Components never hardcode content.
- IDENTITY: background #090909, surface #171717, text #F2F0EA, accent #A5FF6B, muted #858585.
- DESIGN: every section has a distinct composition. No repeated card grids, no generic SaaS layouts, no decorative gradients, no heavy glassmorphism, no random floating elements.
- MOTION: GSAP (via useGSAP, with cleanup) for scroll and timeline work. Framer Motion for UI state and layout transitions. Respect prefers-reduced-motion. No scroll hijacking. Lighter motion on touch devices.
- DEFINITION OF DONE for every task: typecheck, lint and build all pass; no horizontal overflow at 375px; screenshots at 1440, 768 and 390 reviewed; keyboard accessible; summary of changed files; then STOP and wait for my review.
- Only modify files related to the current task.
