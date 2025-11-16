# GymTrack Frontend

GymTrack is a Vite-powered React SPA for building programs, running workout sessions, and managing athlete preferences. The frontend pairs with the ASP.NET Core API in `../backend` and is optimized for containerized deployment.

## Stack

- React 18 + TypeScript + Vite
- React Router, TanStack Query, Zustand store modules
- Material UI (MUI) + Emotion theming (`src/theme`)
- Tailwind CSS utilities + PostCSS pipeline for rapid layout work
- Custom toast notifications, reusable cards/buttons, and a lightweight icon registry over `react-icons`

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

Additional scripts:

- `npm run lint` – ESLint with TypeScript rules
- `npm run build` – Production build consumed by the .NET host

## UI System Overview

- **Theme:** `src/theme/index.ts` exposes a dark-first MUI theme mirroring the legacy CSS variables. Wrap new components with `ThemeProvider` (already wired in `src/main.tsx`) and prefer the `sx` prop for styling.
- **Buttons & Cards:** `components/ui/Button` and `components/ui/Card` are thin wrappers around `@mui/material/Button` and `Paper`. They keep existing `variant` props and CSS classes for backwards compatibility while unlocking native MUI props (`startIcon`, `elevation`, etc.).
- **Icons:** Use the registry in `components/icons/Icon.tsx` to access whitelisted `react-icons` exports. Example: `<Icon name="dashboard" size={18} />`. Add new icons by extending `iconRegistry` once; tree-shaking ensures unused icons stay out of the bundle.
- **Global styles:** `src/styles/global.css` pulls in Tailwind base/components/utilities, then layers our CSS variables and legacy selectors. Prefer consuming theme tokens or Tailwind utilities for new work and gradually migrate remaining raw selectors to `sx` or utility classes.
- **Tailwind utilities:** Tailwind is fully wired via `tailwind.config.js` (colors mirror the MUI palette). Use utilities for layout/spacing (see `AppLayout` for an example) and fall back to MUI's `sx` prop when a component needs theme awareness or responsive tokens. When combining Tailwind classes dynamically, consider `tailwind-merge`/`clsx` to avoid conflicting utilities.

## Conventions

- Co-locate feature hooks/components under `src/pages/**` when they are page-specific; shared primitives live in `src/components/ui` or `src/components/feedback`.
- Derive API contracts from `src/types/api.ts` and interact with the backend via `src/api/client.ts` + `src/api/requests.ts`.
- Keep forms controlled and validated either with `react-hook-form` or bespoke hooks; surface toast feedback through `ToastProvider`.

For additional context on the end-to-end implementation plan, review `../docs/implementation-plan.md`, `../docs/mui-integration-plan.md`, and `../docs/tailwind-integration-plan.md`.
