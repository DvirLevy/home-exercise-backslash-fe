# Graph Explorer (frontend)

React app for the graph analysis platform: upload microservice graphs, see them as an interactive diagram and ask
which routes lead from one kind of node to another. The backend lives in `../home-exercise-backslash-be`
(API on port 3000, OpenAPI at `http://localhost:3000/docs/openapi.json`).

> **Status:** all three planned tasks are done: graph management, the graph canvas with node details, and the route
> query. See [`docs/plan.md`](docs/plan.md) for the decisions and the task split.

## Quick start

```bash
cd ../home-exercise-backslash-be && docker compose up -d && npm run seed   # backend + sample data
cd ../home-exercise-backslash-fe
npm install
npm run dev                                                                 # http://localhost:5173
```

## Scripts

| Script               | What it does                                   |
| -------------------- | ---------------------------------------------- |
| `npm run dev`        | Vite dev server on port 5173                   |
| `npm run build`      | Type check, then production build into `dist/` |
| `npm run preview`    | Serve the build locally                        |
| `npm test`           | All tests once (Vitest, jsdom)                 |
| `npm run test:watch` | Tests in watch mode                            |
| `npm run typecheck`  | `tsc` without emitting                         |
| `npm run lint`       | ESLint                                         |
| `npm run format`     | Prettier                                       |

## Configuration

A single `.env` file, validated with Zod at startup (the app fails with a clear message if it is wrong).

| Variable            | Default                 | Meaning                                                               |
| ------------------- | ----------------------- | --------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:3000` | Base URL of the backend. Vite bakes it into the bundle at build time. |

The backend only accepts browsers from the origins in its own `CORS_ORIGINS`: `http://localhost:5173` for
`npm run dev` and `http://localhost:8080` for the Docker image.

## Using the app

1. Upload a graph (drop a `.json` on the sidebar), or open one from the list.
2. The whole graph is drawn left to right. Click a node for its details; use the search box to jump to one.
3. In **Find routes**, choose filters for **Start at**, **Pass through** and **End at**. Several filters in one role are
   combined with OR; all roles must hold (AND). The query is in the URL (`?start=public&through=vulnerable&end=sink`),
   so it can be shared.
4. **Highlight route** (default) keeps the whole graph and dims everything off the route; **Route only** draws just the
   matching routes. When a query is applied the view zooms to the route; the "fit view" control still fits everything.
   Above 1,500 nodes only Route only is available, and nothing is drawn until a query is chosen. A route result with
   more than 1,500 nodes is never drawn either: the app asks you to narrow the query.

Filters are read-only here: they are created in the backend and only listed and picked in the app. A filter whose
stored rule no longer compiles is shown as unavailable and cannot be picked.

## Performance

The graph page (React Flow, d3, dagre) is a lazy chunk, prefetched when the browser is idle after the first screen.
Vendor code is split into stable, separately cached chunks (`react`, `router`, `data`, `zod`, `graph-vendor`, see
`vite.config.ts`); the groups are narrow on purpose so graph-only libraries never end up in the first-screen download.
Check the result with `npm run build` (no chunk should exceed 500 kB).

## Docker

```bash
docker compose up --build            # http://localhost:8080
VITE_API_BASE_URL=http://api.example.com docker compose up --build   # another API URL
```

Multi-stage build: Node builds `dist/`, `nginx:alpine` serves it with a fallback to `index.html` and long cache
headers for hashed assets. Because the API URL is compiled in, one image serves one API.

## Architecture

```
src/
  main.tsx · env.ts            entry; Zod-validated environment
  app/                         providers, routes, shell, top bar, health banner
  pages/                       HomePage, GraphPage (thin: read the URL, compose features)
  features/
    graph/                     graph management: list, upload / replace, rename, delete
      components/ hooks/ utils/
    filters/                   route query: read-only filters picked per role (OR inside a role, AND across roles)
      components/ hooks/ utils/  RouteQueryPanel, RoleBox, FilterCombobox, NoRouteState; useFilters, useRoutes,
                               useRouteQuery (URL state); routeQuery (parse / write the URL)
    visualization/             React Flow canvas, custom node, find-node, legend, node details
      components/ utils/       utils: layout (dagre), graphToFlow, nodeStyling (all pure)
  components/                  shared: EmptyState, ErrorAlert, JsonView
  hooks/                       useDelayedFlag (spinners only after ~300 ms)
  services/                    API layer, the only place that uses axios:
                               apiClient, errors, schemas (Zod), queryKeys, one module per resource
  types/                       API types (z.infer of the schemas) and UI types
  design-system/               tokens.css (light + dark), globals.css, ui/ (shadcn components)
  utils/                       cn, format
tests/
  unit/ component/ integration/   mirror the code; msw/ is an in-memory fake backend
```

Rules:

- Only `services/` imports axios. Components reach the API through hooks (TanStack Query).
- Every API response is validated with Zod in `services/`, so a contract mismatch fails in one place.
- Server state lives in TanStack Query only; after a change we invalidate and refetch (no optimistic edits).
  The selected graph is in the URL.
- Theme follows the browser (`prefers-color-scheme`); colours are tokens in `design-system/tokens.css`.
- Pure logic (`utils/`) is plain TypeScript and unit-tested without the DOM.

## Testing

Vitest + React Testing Library in jsdom, API mocked with MSW (`tests/msw/backend.ts` is a small stateful fake of the
backend). Unit tests cover schemas, error normalization, the Axios client (repeated query params, `If-Match`,
multipart upload), file checks and formatting; component tests cover the upload dialog (success, placeholders,
400/413/415, 409 conflict), list, health banner; integration tests drive whole pages through the router.

Canvas tests run React Flow in jsdom with stubs (`ResizeObserver`, `DOMMatrix`, element sizes) in `tests/setup.ts` and
check nodes by their cards and classes, not pixels. `SMOKE=1 npm test` also runs a smoke test against the real backend.

A task is done when the tests pass, `npm run typecheck` and `npm run lint` are clean.
