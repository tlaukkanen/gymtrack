# Frontend Tailwind Integration Plan

## 1. Objective
Enable Tailwind CSS within the Vite/React frontend so developers can use utility classes alongside the existing MUI-based component system without regressions or conflicting global styles.

## 2. Scope & Dependencies
- **Packages:** `tailwindcss`, `postcss`, `autoprefixer`, optional `tailwind-merge` for class conflict resolution.
- **Artifacts:** `tailwind.config.js`, `postcss.config.js`, updated `src/styles/global.css`, and documentation covering usage guidelines with MUI.
- **Impacted areas:** Build tooling, global styles, shared components (`App.tsx`, layout wrappers) that may start using Tailwind classes.
- **Out of scope:** Rewriting every component to Tailwind utilities; focus on enabling the tooling + foundational patterns.

## 3. Implementation Breakdown

### Task 3.1 – Install & Scaffold Tailwind
- Run `npm install -D tailwindcss postcss autoprefixer` inside `frontend/` (add `tailwind-merge` if desired).
- Execute `npx tailwindcss init -p` to generate default config + PostCSS file.
- **Acceptance:** `tailwind.config.js` and `postcss.config.js` exist with repo-specific paths; `package.json` devDependencies updated.

### Task 3.2 – Configure Tailwind Content Paths & Theme Tokens
- Update `tailwind.config.js` `content` array to include `./index.html` and all `src/**/*.{ts,tsx}` files.
- Extend the Tailwind theme to mirror the design tokens already defined in `src/theme/index.ts` (color palette, spacing ramps, fonts).
- Add MUI breakpoint aliases to the Tailwind config for consistency (`sm`, `md`, `lg`, `xl`).
- **Acceptance:** Running `npx tailwindcss -m` (or `npm run dev`) produces utilities aligned with GymTrack palette and typography.

### Task 3.3 – Wire Tailwind Directives Into Global Styles
- Replace or augment `src/styles/global.css` with Tailwind base/components/utilities directives at the top (`@tailwind base;` etc.).
- Re-introduce any custom CSS variables/resets that must persist after the Tailwind base layer using the `@layer base` syntax to avoid specificity wars.
- Ensure CSS order keeps Toast + legacy selectors functional.
- **Acceptance:** Vite dev server shows Tailwind classes working; no duplicate resets from CssBaseline/Tailwind.

### Task 3.4 – Utility Usage Smoke Test
- Update one or two representative components (e.g., `AppLayout` or `DashboardPage`) to leverage Tailwind classes for layout/spacing (without removing existing functionality) to prove the pipeline works.
- Document how to mix Tailwind utilities with MUI's `sx` prop (e.g., prefer Tailwind for quick layout scaffolding, `sx` for theme-dependent styling).
- **Acceptance:** JSX renders with Tailwind classes (inspect via dev tools) and matches previous layout.

### Task 3.5 – Tooling & Productivity Enhancements
- Configure IDE support by committing `.vscode/settings.json` snippet enabling Tailwind IntelliSense (optional but recommended).
- Consider adding `tailwind-merge` helper for components that accept `className` overrides to avoid conflicting utilities.
- **Acceptance:** Devs receive autocomplete + conflict-safe merging guidance documented in README.

### Task 3.6 – Documentation & Guidelines
- Extend `frontend/README.md` (or add `docs/frontend-styling.md`) covering:
  - When to use Tailwind vs. MUI `sx` vs. legacy CSS.
  - How to add new custom utilities or plugin usage.
  - Any conventions for responsive layouts and dark mode handling.
- **Acceptance:** Docs merged; onboarding devs can pick up Tailwind usage without additional context.

## 4. Testing & Validation
- Run `npm run dev` to ensure HMR compiles Tailwind styles.
- Run `npm run build` to confirm Tailwind purging works and production CSS bundle size remains reasonable.
- Spot-check primary routes for regressions (Dashboard, Program Builder, Auth pages).

## 5. Deployment Considerations
- No backend changes; ensure Docker build steps include `npm run build` (already in place).
- Tailwind/PostCSS configs must be part of the container context; confirm `.dockerignore` does not exclude them.

## 6. Risks & Mitigations
- **Style Conflicts:** Tailwind base styles might override MUI defaults. Mitigate by scoping custom base rules with `@layer base` and verifying with Storybook or manual inspection.
- **Bundle Size:** Excess utility usage can bloat CSS if `content` globs are misconfigured. Ensure only project files are included.
- **Mixed Paradigms:** Developers may mix Tailwind and MUI inconsistently. Provide clear guidelines + lint suggestions (consider `@tailwindcss/container-queries` later if needed).

## 7. Acceptance Criteria Summary
- Tailwind dependencies and config files exist; CI build passes.
- `global.css` imports Tailwind layers without breaking existing variables.
- At least one component successfully uses Tailwind utilities, demonstrating compatibility with MUI.
- Documentation explains the styling approach and best practices for mixing Tailwind with the current theme.
