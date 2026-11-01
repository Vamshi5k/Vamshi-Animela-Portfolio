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

- `npm run typecheck`: `tsc --noEmit`
- `npm run lint`: `eslint`
- `npm run build`: `next build`

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

## TODO

- Replace the default Next.js favicon (`src/app/favicon.ico`) once a real icon exists.

## RULES

- CONTENT INTEGRITY: never invent statistics, clients, testimonials, screenshots, URLs, certificates, metrics or achievements. If content is missing, put a clearly marked TODO in the data file and render an honest placeholder. Never fake real product UI.
- All copy lives in src/data/*.ts. Components never hardcode content.
- IDENTITY: background #090909, surface #171717, text #F2F0EA, accent #A5FF6B, muted #858585.
- DESIGN: every section has a distinct composition. No repeated card grids, no generic SaaS layouts, no decorative gradients, no heavy glassmorphism, no random floating elements.
- MOTION: GSAP (via useGSAP, with cleanup) for scroll and timeline work. Framer Motion for UI state and layout transitions. Respect prefers-reduced-motion. No scroll hijacking. Lighter motion on touch devices.
- DEFINITION OF DONE for every task: typecheck, lint and build all pass; no horizontal overflow at 375px; screenshots at 1440, 768 and 390 reviewed; keyboard accessible; summary of changed files; then STOP and wait for my review.
- Only modify files related to the current task.
