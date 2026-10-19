# Graph Explorer: implementation plan

Agreed with the user during planning. The product, the API contract and the rules are in `docs/frontend-prompt.md`; the
visual design is in `docs/design-mockup.html`. This document records the decisions, the structure and the gated tasks.

## 1. Backend check

- `GET /health` is up; CORS allows `http://localhost:5173` and exposes `ETag`, `Location`, `X-Request-Id`.
- `openapi.json` matches section 3 of the brief. One detail to handle: `GET /routes` can return
  `409 FILTER_UNAVAILABLE` when a query names a filter whose stored rule no longer compiles (possible from a shared URL).

## 2. Decisions

| Topic | Decision |
|---|---|
| Canvas view | Default **Highlight route**: the whole graph, route nodes and edges emphasized, the rest dimmed. A toggle switches to **Route only**. No query = the plain whole graph. |
| Large graphs | Above **1,500 nodes**: Route only is forced; with no query the canvas asks the user to pick filters instead of drawing. Compact nodes when zoomed out. Layout in a Web Worker only if measured slow. |
| Theme | Follows the browser (`prefers-color-scheme`), no manual toggle. Every token has a light and a dark value; AA contrast in both. |
| Filters | **Read-only.** Loaded from `GET …/filters` and picked in the role boxes. No builder, no create/edit/delete, **no Filters tab**. Unavailable filters (`matchCount: null`) are shown disabled. |
| Right panel | Route query on top, node details below. |
| Env | A single `.env` (`VITE_API_BASE_URL`), validated with Zod at startup, documented in the README. |
| Tests | All under `tests/`, split into `unit/`, `component/`, `integration/`. |
| Docker | nginx serving `dist/` on port **8080**. `http://localhost:8080` must be added to the backend's `CORS_ORIGINS` (done by the user). |

### Dependencies beyond the brief's stack

| Package | Why |
|---|---|
| `@dagrejs/dagre` | Left-to-right automatic layout for React Flow |
| `react-router` (v7, library mode) | `/graphs/:id` and the route query in search params |
| `msw` | API mocking in tests, so the real Axios client (query params, `If-Match`, FormData) is exercised |
| `lucide-react`, `sonner`, `cmdk` | Icons, toasts and the combobox used by shadcn/ui |
| `@fontsource/inter`, `@fontsource/jetbrains-mono` | Self-hosted fonts, no CDN dependency in Docker |
| ESLint, Prettier | Lint and formatting |

Not added: `openapi-typescript` (hand-written Zod schemas), `react-dropzone` (native drag events), `date-fns`
(`Intl.RelativeTimeFormat`), any global store.

## 3. Structure

```
home-exercise-backslash-fe/
├─ .env                     VITE_API_BASE_URL
├─ Dockerfile               Node build → nginx:alpine (+ nginx.conf, docker-compose.yml, port 8080)
├─ README.md · CLAUDE.md
├─ src/
│  ├─ main.tsx              mounts <App/>
│  ├─ env.ts                Zod check of import.meta.env, fails with a clear message
│  ├─ app/                  App.tsx, providers (QueryClient, Toaster), router, AppShell, TopBar, HealthBanner
│  ├─ pages/                HomePage (first run / pick a graph) · GraphPage (/graphs/:id, 404 → list)
│  ├─ features/
│  │  ├─ graph/             managing graphs
│  │  │  ├─ components/     GraphList, UploadDropzone, UploadDialog (also Replace), RenameDialog,
│  │  │  │                  DeleteGraphDialog, VersionConflictAlert, FirstRunState
│  │  │  ├─ hooks/          useGraphs, useGraph, useUploadGraph, useReplaceGraph, useRenameGraph, useDeleteGraph
│  │  │  └─ utils/          fileCheck (size, JSON.parse, light Zod shape)
│  │  ├─ filters/           read-only filter selection = the route query
│  │  │  ├─ components/     RouteQueryPanel, RoleBox, FilterCombobox, NoRouteState
│  │  │  ├─ hooks/          useFilters, useRoutes, useRouteQuery (URL state)
│  │  │  └─ utils/          routeQuery (parse/serialize ?start&through&end, sorted)
│  │  └─ visualization/     drawing the graph
│  │     ├─ components/     GraphCanvas, GraphNodeCard, RouteEdge, CanvasToolbar (Highlight / Route only),
│  │     │                  FindNode, Legend, NodeDetails
│  │     └─ utils/          layout (dagre), graphToFlow, nodeStyling, largeGraph
│  ├─ components/           shared: EmptyState, ErrorAlert (details by path), JsonView, DelayedSpinner
│  ├─ services/             API layer, the only place axios is used
│  │                        apiClient, errors, schemas (Zod), queryKeys, health, graphs, filters, routes
│  ├─ types/                api.ts (z.infer of schemas) · ui.ts (ViewMode, RouteQuery, Role)
│  ├─ design-system/        tokens.css (light + dark via prefers-color-scheme), globals.css,
│  │                        ui/ (shadcn), SeverityBadge, RoleTag, KindStripe
│  └─ utils/                generic: cn, format (relative dates, plurals)
└─ tests/
   ├─ setup.ts · msw/ (handlers, fixtures) · test-utils/renderWithProviders.tsx
   ├─ unit/                 pure functions, no DOM
   ├─ component/            one component, API mocked with MSW
   └─ integration/          whole pages through the router + MSW (+ optional real-backend smoke test)
```

### Rules

- Only `services/` imports axios; components reach the API through hooks.
- Used by one feature → inside that feature. Used by two or more → shared `components/`, `utils/`, `types/`.
- Features do not import each other's internals; `GraphPage` composes them and passes data down as props.
- Feature `utils/` are pure TypeScript and unit-tested without the DOM.
- Server state only in TanStack Query; selected graph and route query in the URL; selected node and view mode are local
  state in `GraphPage`. Invalidation and refetch, no optimistic updates.

## 4. Gated tasks

Each task is **done** when its tests pass, `tsc --noEmit` is clean, lint passes and earlier tests still pass. After each
task: stop, report, wait for approval. No git commits.

### Task 1: Foundation and graph management

Scope: scaffold (Vite, TS strict, ESLint/Prettier, Tailwind, shadcn into `design-system/ui`), tokens light/dark, `env.ts`,
`services/` (client with `paramsSerializer: { indexes: null }`, error normalization, all Zod schemas, query keys, every
resource module), `app/` (providers, router, shell, top bar, health banner with retry), `pages/`, shared `components/`,
`features/graph` (list, upload with client checks and progress, replace with `If-Match` and 409 reload/overwrite,
rename, delete with confirmation, placeholders toast), first-run, skeletons, 404 → list, Dockerfile, nginx, compose,
README, CLAUDE.md.

Done when tested:
- unit: env, schemas, error normalization, apiClient (repeated query params, `If-Match`, FormData without Content-Type),
  fileCheck, format
- component: UploadDialog (success, placeholders, 400 details, 413, 415), VersionConflictAlert, GraphList, HealthBanner
- integration: upload → new graph selected; rename and delete → list updates; unknown id → back to the list; first run

### Task 2: Visualization

Scope: `features/visualization`: dagre LR layout, `graphToFlow`, `nodeStyling` (kind, case-insensitive severity,
highest severity, placeholders), custom node (full and compact) and edge with arrowheads, legend, zoom/fit controls,
minimap, find-node, node details panel (kind, language, path, public, vulnerabilities with CWE, metadata, `extra` JSON),
graph with no edges.

Done when tested:
- unit: layout, graphToFlow, nodeStyling
- component: GraphCanvas through its nodes, edges and classes (`ResizeObserver` / `DOMMatrix` stubs), NodeDetails, FindNode
- integration: open a graph → canvas drawn → click a node → details shown

### Task 3: Filters and route query

Scope: `features/filters`: role boxes (Start / Pass through / End) with chips, combobox with key, description,
`matchCount` (unavailable disabled), "any of (OR)" and "all roles (AND)" hints, URL state, Clear, `useRoutes` with sorted
keys; on the canvas Highlight route vs Route only from `matched.roles` / `matched.filters`, role tags and rings, dimmed
off-route items, result pill; no-route empty state, `400 UNKNOWN_FILTER` / `409 FILTER_UNAVAILABLE` from a shared URL,
large-graph rule (`largeGraph`).

Done when tested:
- unit: routeQuery parse/serialize, largeGraph, graphToFlow with a route result and both view modes
- component: RoleBox / FilterCombobox (OR within a role, unavailable disabled), RouteQueryPanel URL sync, NoRouteState
- integration: pick filters → URL updates → route highlighted; Route only toggle; shared URL → same result;
  route errors shown; optional smoke test against the real backend
