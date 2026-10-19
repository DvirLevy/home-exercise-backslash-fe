# CLAUDE.md

Frontend of the Backslash graph analysis platform (React + TypeScript + Vite). Read `docs/frontend-prompt.md` (the
brief and the API contract), `docs/plan.md` (decisions, structure, gated tasks) and `docs/design-mockup.html` (design).

## Rules (from the user)

- **Never run `git commit`.** The user commits.
- Work in **gated tasks** (`docs/plan.md`): implement only the approved task, then stop, report and wait.
- **No dependency without a reason**; say why and wait for approval. Check the OpenAPI document
  (`http://localhost:3000/docs/openapi.json`) or `../home-exercise-backslash-be/README.md` before assuming backend
  behaviour; raise gaps instead of working around them.
- TypeScript strict, no `any` at boundaries. Verify before reporting: tests, `npm run typecheck`, `npm run lint`.
- Keep `README.md` current.

## Decisions

- Filters are **read-only**: the app only loads existing filters and picks them for a route query (no builder, no
  Filters tab). Canvas default is **Highlight route** on the whole graph, with a **Route only** toggle; above 1,500
  nodes only the route result is drawn. Theme follows the browser; there is no manual toggle.
- Single `.env` (`VITE_API_BASE_URL`), validated in `src/env.ts`. Docker image on port 8080.

## Commands

`npm run dev` · `npm test` · `npm run typecheck` · `npm run lint` · `npm run build`

## Structure and conventions

`app/ pages/ features/{graph,filters,visualization}/ components/ services/ types/ design-system/ utils/`, tests in
`tests/{unit,component,integration}`. Only `services/` imports axios; components use hooks. Used by one feature → keep it
inside the feature, by two or more → shared folder. Features do not import each other's internals.

## Gotchas

- Axios must serialize arrays as `start=a&start=b` (`paramsSerializer: { indexes: null }`), never `start[]=a`.
- Upload with `FormData` and **no** hand-set `Content-Type`. `If-Match` is `"<version>"` (quoted).
- Inside a `<form>`, every non-submit button needs `type="button"` (a missing one re-submitted the replace form).
- In jsdom tests, `request.formData()` fails (jsdom's `File` is not undici's); use `tests/msw/multipart.ts`.
- MSW 3 option is `onUnhandledFrame`, not `onUnhandledRequest`.
- `src/design-system/ui` is shadcn-style code and is excluded from ESLint.
- React Flow tests (task 2) need `ResizeObserver` and `DOMMatrix` stubs in `tests/setup.ts`.
