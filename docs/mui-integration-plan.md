# Frontend UI Library Integration Plan

## 1. Objective
Add first-class support for Material UI (MUI) and `react-icons` inside the Vite + React frontend so new views can leverage a consistent design system, theme primitives, and ready-made iconography without regressions to existing custom components.

## 2. Scope & Dependencies
- **Packages:** `@mui/material`, `@emotion/react`, `@emotion/styled`, `@mui/icons-material` (optional but recommended), `react-icons`.
- **Impacted areas:** `frontend/src/main.tsx`, layout wrappers in `frontend/src/components/layout`, shared UI components in `frontend/src/components/ui`, and global styles under `frontend/src/styles`.
- **Out of scope:** Rewriting every screen to MUI in one pass; only foundational wiring + reference components + migration guidelines.

## 3. Implementation Breakdown

### Task 3.1 – Dependency Installation
- Run `npm install @mui/material @emotion/react @emotion/styled @mui/icons-material react-icons` inside `frontend/`.
- Commit updated `package.json`/`package-lock.json`.
- **Acceptance:** `npm ls @mui/material` resolves, Vite dev server starts without dependency errors.

### Task 3.2 – Theme Definition & Provider Wiring
- Create `frontend/src/theme/index.ts` exporting a `createTheme` result plus palette/typography tokens aligned with existing brand colors.
- Wrap `App` inside `ThemeProvider` and `CssBaseline` in `frontend/src/main.tsx`.
- Expose a typed `useTheme` helper if useful.
- **Acceptance:** App renders with MUI baseline applied; dark/light tokens documented in the theme file.

### Task 3.3 – Global Style Harmonization
- Review `App.css`, `index.css`, and `styles/global.css` for resets conflicting with MUI; remove or scope duplicates (e.g., box-sizing reset already provided by `CssBaseline`).
- Ensure fonts loaded globally align with theme typography.
- **Acceptance:** No duplicate resets, base typography looks consistent in Chrome/Edge.

### Task 3.4 – Shared Component Migration Strategy
- Replace current `components/ui/Button.tsx` and `Card.tsx` implementations with thin wrappers around `@mui/material` equivalents while preserving existing props as a compatibility layer.
- Add storybook-like MDX or README snippet (optional) describing usage and prop mapping.
- Document how to extend variants (e.g., `Button` supports `variant="primary"` mapped to `color="primary"`).
- **Acceptance:** Existing screens compile without prop errors; lint passes; wrappers unit-tested with React Testing Library snapshots.

### Task 3.5 – Icon Abstraction
- Create `frontend/src/components/icons/Icon.tsx` exporting a typed helper that re-exports selected icons from `react-icons` (e.g., `FiUser`, `FiLogOut`) plus guidance on lazy-loading.
- Update at least one screen (e.g., `AppLayout.tsx`) to consume the new icon helper to validate wiring.
- **Acceptance:** Icons render via `react-icons`; build size impact reviewed (ensure tree-shaking by named imports).

### Task 3.6 – Documentation & Developer Experience
- Add a `docs/frontend-ui-library.md` or expand `README.md` describing:
  - How to use the theme, preferred components, icon usage patterns.
  - Steps to add new palette values.
  - Example snippet for integrating MUI form controls.
- **Acceptance:** New doc checked into repo, onboarding devs can follow it without extra context.

## 4. Testing Strategy
- **Unit:** Snapshot tests for updated Button/Card wrappers using RTL + Vitest.
- **Visual smoke:** Run `npm run dev` and manually validate primary screens for layout regressions.
- **Lint/Typecheck:** Ensure `npm run lint` and `npm run typecheck` succeed post-migration.

## 5. Deployment & Rollout
- After local validation, run `npm run build` to confirm Vite production build works with new deps.
- Coordinate release with backend? (No backend impact.)
- Communicate in release notes that MUI + react-icons are now available.

## 6. Risks & Mitigations
- **Bundle size increase:** Use `esbuild` analyzer (`npm run build -- --analyze`) and prefer selective icon imports.
- **Styling conflicts:** Audit overlapping CSS classes; rely on MUI `sx` prop instead of ad-hoc global CSS.
- **Partial migration confusion:** Provide migration guidelines + examples so devs know when to use legacy vs. new components.

## 7. Acceptance Criteria Summary
- Dependencies installed and documented; CI builds succeed.
- Global theme + providers wired with no runtime errors.
- Button/Card components wrap MUI equivalents while keeping current APIs functional.
- At least one layout file demonstrates `react-icons` usage via the new helper.
- Documentation exists explaining how to leverage MUI + icons going forward.
