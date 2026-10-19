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
- React Flow tests need the stubs in `tests/setup.ts` (`ResizeObserver`, `DOMMatrix`, element sizes). Click nodes and the
  pane with `fireEvent.click`: user-event's mouse-down makes d3-zoom throw (`event.view` is missing in jsdom). Edges do
  not render in jsdom (no handle measurements), so test edges through `graphToFlow`.
- jest-dom's `toHaveStyle` cannot resolve `var(--token)`; assert on `element.style.<prop>` instead.
- Canvas: `visualization/utils/graphToFlow` is the only place that builds React Flow nodes and edges; task 3 adds the
  route result (roles, dimming) there. Built-in edges are used, so there is no custom `RouteEdge` component.
