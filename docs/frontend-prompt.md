# Frontend brief: Graph Explorer

You are building the **frontend** of a graph analysis platform (the Backslash Security home assignment). The backend is
already finished, tested and running; this repository is the React app that uses it.

> **Do not write any code yet.** Read this brief, open the mockup (`docs/design-mockup.html`), check the backend, then
> plan the work **together with the user** in this session (see "Before implementation"). Planning happens here, not in
> this document: what follows is the product, the contract and the rules, not a task list.

---

## 1. Application purpose

Security teams upload a JSON file that describes a microservice architecture as a **directed graph**: services, databases and
queues (nodes), the calls between them (edges), and the known vulnerabilities of each service. The app lets them:

1. **Upload** graph files and manage several independent graphs (list, open, rename, replace with a new file, delete).
2. **See** a graph as an interactive diagram.
3. **Ask questions** about routes through it, for example *"which routes lead from a publicly exposed service to a database,
   passing through a vulnerable service?"*, and see the answer highlighted on the diagram.
4. **Define their own filters** (for example "high-severity vulnerabilities only", "Postgres databases", "payment services")
   with a visual rule builder, preview them, and use them in route questions.

The core value is step 3: turning a large architecture into the small set of risky paths that matter.

## 2. Technology stack

| Concern | Choice |
|---|---|
| Framework | React with TypeScript (strict) |
| Build / dev server | Vite |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Graph visualization | React Flow (`@xyflow/react`) |
| Server state | TanStack Query |
| HTTP | Axios |
| Validation | Zod (API responses, forms, uploaded files) |
| Tests | Vitest and React Testing Library |
| Packaging | Docker |

Things the stack does not cover yet, to **decide with the user during planning** (do not add them silently):

- **Automatic graph layout.** React Flow draws nodes where you place them; it does not compute positions. A directed
  layout library is needed (`@dagrejs/dagre` is the simple choice, `elkjs` the more capable one).
- **Routing** for URLs like `/graphs/:id?start=public&end=sink` (React Router or TanStack Router).
- **API mocking in tests** (MSW is the usual choice) versus mocking the Axios client module.
- **Generating TypeScript types from the OpenAPI document** (`openapi-typescript`) versus hand-written Zod schemas. The
  stack says Zod; hand-written schemas that mirror section 3 are the default.

## 3. Backend API integration

The backend lives in the sibling folder `../home-exercise-backslash-be`. Its `README.md` is the full reference, and the
live **OpenAPI document** is the contract: `http://localhost:3000/docs/openapi.json` (Swagger UI at `/docs`). If anything
below disagrees with the OpenAPI document, the OpenAPI document wins: tell the user.

**Base URL:** `http://localhost:3000`. API routes are under `/api/v1`; `GET /health` is at the root.
**CORS:** the backend allows `http://localhost:5173` (Vite's default port) and exposes the `ETag`, `Location` and
`X-Request-Id` headers. If the app is served from any other origin (for example the Docker image on port 8080), that origin
must be added to `CORS_ORIGINS` in the **backend's** `.env`.

### 3.1 Endpoints

| Method | Path | Request | Success |
|---|---|---|---|
| GET | `/health` | – | `200 HealthReport` · `503` same shape when the database is down |
| POST | `/api/v1/graphs` | `multipart/form-data`: `file` (the JSON file), `name` (1–200 chars, required, need not be unique) | `201 GraphWriteResult` + `Location` + `ETag` |
| GET | `/api/v1/graphs` | – | `200 GraphSummary[]`, newest first |
| GET | `/api/v1/graphs/:id` | – | `200 GraphDetail` + `ETag` |
| PUT | `/api/v1/graphs/:id` | multipart: `file`, optional `name`; optional header `If-Match: "<version>"` | `200 GraphWriteResult` + `ETag` |
| PATCH | `/api/v1/graphs/:id` | JSON `{ "name": "…" }` (version unchanged) | `200 GraphSummary` |
| DELETE | `/api/v1/graphs/:id` | – | `204` (nodes, edges and filters go too) |
| GET | `/api/v1/graphs/:id/filters` | – | `200 Filter[]` (built-in first, then custom by key) |
| POST | `/api/v1/graphs/:id/filters` | JSON `{ key, description?, definition }` | `201 Filter` + `Location` |
| POST | `/api/v1/graphs/:id/filters/preview` | JSON `{ definition }` (saves nothing) | `200 FilterPreview` |
| GET | `/api/v1/graphs/:id/filters/:key` | – | `200 Filter` |
| PUT | `/api/v1/graphs/:id/filters/:key` | JSON `{ description?, definition }` (replaces the whole filter; omitted description clears it) | `200 Filter` |
| DELETE | `/api/v1/graphs/:id/filters/:key` | – | `204` |
| GET | `/api/v1/graphs/:id/routes` | query `start`, `end`, `through`: filter keys, each repeatable | `200 RouteResult` |

### 3.2 Response shapes

```ts
type HealthReport = { status: 'ok' | 'unavailable'; database: 'up' | 'down'; uptime: number; timestamp: string };

type GraphSummary = {
  id: string; name: string;
  version: number;                 // grows with every change to nodes, edges or filters; equals the ETag
  nodeCount: number; edgeCount: number;
  createdAt: string; updatedAt: string; // ISO dates
};
type GraphWriteResult = GraphSummary & { placeholders: string[] }; // nodes that edges referenced but the file never defined

type GraphNode = {
  name: string;                     // unique within a graph: use it as the React Flow node id
  kind: string | null;              // free string ("service", "rds", "sqs", …); null only for placeholders
  language: string | null;
  path: string | null;
  publicExposed: boolean | null;    // only `true` means public
  placeholder: boolean;             // created for a name an edge used but the file did not define
  vulnerabilities: Record<string, unknown>[]; // usually { file, severity, message, metadata: { cwe } }, all optional
  metadata: Record<string, unknown> | null;   // e.g. { cloud, engine, version } on databases
  extra: Record<string, unknown> | null;      // fields of the uploaded node the API does not define
};
type GraphEdge = { from: string; to: string; extra?: Record<string, unknown> }; // `extra` only when present

type GraphDetail = {
  id: string; name: string; version: number;
  extra: Record<string, unknown> | null;      // unknown top-level fields of the uploaded file
  nodes: GraphNode[];                          // file order; placeholders last
  edges: GraphEdge[];
};

type Filter = {
  key: string; description: string | null;
  builtin: boolean;                  // public, sink, vulnerable: read-only
  definition: Rule;                  // see 3.4
  matchCount: number | null;         // null = its stored rule can no longer be compiled ("unavailable")
  createdAt: string; updatedAt: string;
};
type FilterPreview = { matchCount: number; matches: string[] }; // node names, file order

type Role = 'start' | 'through' | 'end';
type RouteResult = {
  graphId: string; version: number;
  applied: { start: string[]; end: string[]; through: string[] };
  nodes: (GraphNode & { matched: { roles: Role[]; filters: string[] } })[];
  edges: GraphEdge[];
};

type ApiError = { error: { code: string; message: string; details?: { path: string; message: string }[] } };
```

Validate responses with Zod at the API boundary, so a contract mismatch fails loudly in one place instead of deep in a
component.

### 3.3 Behaviour the UI must respect

- **Route semantics.** The result is the *subgraph of every node and edge on at least one route* that starts at a `start`
  node, ends at an `end` node and passes through a `through` node. Several filters in one role are combined with **OR**;
  the three roles must **all** hold (AND). A role left empty is unconstrained; with no role at all the whole graph comes back.
  A start or end node counts as a through node. Routes may go round cycles. **No route is a normal `200` with empty
  `nodes`/`edges`** (an empty state, not an error).
- **`matched.roles`** are the roles a node really plays (a `start` only if a route can actually continue from it);
  **`matched.filters`** are the filters named in the query that the node matches. Use both to style nodes; do not recompute.
- **Query string format.** Repeat the parameter: `?start=public&start=vulnerable&end=sink`. **Axios serializes arrays as
  `start[]=…` by default, which the backend rejects with 400**: configure `paramsSerializer: { indexes: null }` (or
  build the query yourself). Unknown parameters are rejected too, by design.
- **Filter keys:** 1–63 chars, lowercase letters, digits and hyphens, starting with a letter and not ending with a hyphen.
  A graph holds at most 100 filters. Built-in filters (`public`, `sink`, `vulnerable`) cannot be edited or deleted (409):
  show them locked.
- **Versions and conflicts.** `version` (also the `ETag`, e.g. `"3"`) changes on every replace and every filter change,
  not on rename. Send the version you loaded as `If-Match` when replacing a graph; a `409 VERSION_CONFLICT` means someone
  else changed it: offer *reload* or *overwrite* (resend without `If-Match`).
- **Uploads.** Send `FormData` with `file` and `name` and **do not set the `Content-Type` header yourself** (the browser
  adds the multipart boundary). Only JSON is accepted (`*.json` or `application/json`). Limits come from the backend:
  10 MB, 50,000 nodes, 500,000 edges by default (`413` beyond). The server always validates the content; client-side checks
  are only for fast feedback.
- **Placeholders.** After an upload, `placeholders` lists nodes the file referenced but never defined; tell the user. On
  the diagram they look different (dashed, italic) and never match a filter, but they can lie on a route.
- **Unknown fields** are preserved at every level (`extra` on the graph, nodes and edges, plus whole vulnerability and
  metadata objects). Show them in the node details panel as read-only JSON.
- **Errors** always have the `ApiError` shape. Show `message`, and list `details` with their `path` when present (upload
  and filter-rule errors point at the exact field, e.g. `nodes.3.publicExposed` or `definition.all.1.value`).

| Status | Codes |
|---|---|
| 400 | `VALIDATION_ERROR` · `INVALID_JSON` · `INVALID_MULTIPART` · `INVALID_IF_MATCH` · `DUPLICATE_NODE_NAME` · `INVALID_FILTER_RULE` · `UNKNOWN_FILTER` |
| 404 | `GRAPH_NOT_FOUND` · `FILTER_NOT_FOUND` · `ROUTE_NOT_FOUND` |
| 409 | `VERSION_CONFLICT` · `FILTER_KEY_EXISTS` · `FILTER_LIMIT_REACHED` · `BUILTIN_FILTER_READ_ONLY` · `FILTER_UNAVAILABLE` |
| 413 / 415 | `PAYLOAD_TOO_LARGE` · `UNSUPPORTED_MEDIA_TYPE` |
| 500 | `INTERNAL_ERROR` |

### 3.4 The filter rule language (what the builder edits)

A rule is exactly one of:

```jsonc
{ "all": [Rule, …] }          // every rule matches
{ "any": [Rule, …] }          // at least one rule matches
{ "not": Rule }
{ "field": "kind", "op": "in", "value": ["rds", "sql"] }
{ "field": "vulnerabilities", "op": "some", "where": { "field": "severity", "op": "eq", "value": "high" } }
```

- **Fields:** `name`, `kind`, `language`, `path`, `publicExposed`, `metadata.<key>`, `extra.<key>` (dotted paths go
  deeper), and `vulnerabilities` (only with `some`). Inside `where`, any field of a vulnerability (`severity`, `file`,
  `message`, `metadata.cwe`, or unknown ones).
- **Operators:** `eq`, `neq` (string, number, boolean or null) · `in`, `notIn` (list) · `exists`, `notExists` (no value) ·
  `contains` (case-sensitive substring) · `gt`, `gte`, `lt`, `lte` (numbers) · `some` (vulnerabilities, optional `where`).
- **Missing** means absent or null: `eq`, `in`, `exists`, `contains` and the numeric operators are false for it; `neq`,
  `notIn` and `notExists` are true.
- **Limits:** 8 levels deep, 100 parts, 50 rules per `all`/`any`, 1,000 values per list.
- The server validates every rule and returns `400 INVALID_FILTER_RULE` with one `{ path, message }` per problem:
  attach these to the builder rows. A Zod schema for the rule on the client gives instant feedback; the server stays the
  authority. `POST …/filters/preview` lets the user see matches before saving.

Useful presets for the builder: *high-severity vulnerabilities*, *databases (`kind in rds, sql`)*, *queues*, *by name contains*,
*by language*, *by metadata value*.

## 4. Main user interface

See `docs/design-mockup.html` (open it in a browser). The layout is a three-column app shell:

- **Top bar:** app name, current graph (breadcrumb), version badge, node and edge counts, actions (Replace file, Rename,
  Delete with confirmation), API status from `/health`.
- **Left sidebar:** upload drop zone, then the list of graphs (name, counts, version, relative date). Names are not unique,
  so items must be distinguishable by their metadata. The selected graph is in the URL.
- **Center canvas (React Flow):** the graph with an automatic left-to-right layout, zoom/pan controls, fit-to-view, a minimap
  for large graphs, a "find node" search that centers on a node, and a legend. A view switch: **Highlight route** (whole
  graph, nodes and edges off the route dimmed), **Route only**, **Whole graph**. Default to be agreed in planning.
- **Right panel:** two tabs: **Route query** (the dynamic filter panel, section 5) and **Filters** (list and builder).
  Clicking a node opens its **details**: kind, language, path, public, matched roles and filters, the vulnerabilities
  (severity badges, message, file, CWE), metadata, and `extra` as read-only JSON.

Node appearance (custom React Flow node): a card with the name, kind and a few facts; a colored left border by kind (service,
database `rds`/`sql`, queue `sqs`, other); a "Public" badge; a vulnerability badge colored by the highest severity; a role tag
(START / THROUGH / END) and ring for `matched.roles`; placeholders dashed and italic. Edges are directed (arrowheads);
route edges are emphasized. Never rely on color alone.

## 5. Dynamic filter panel

- Three role boxes: **Start at**, **Pass through**, **End at**. Each holds filter chips chosen from the graph's filters
  (`GET …/filters`), with a combobox that shows each filter's description and `matchCount`; "unavailable" filters
  (`matchCount: null`) are shown but cannot be picked.
- Make the logic visible: "any of (OR)" inside a role; a short note that all roles must hold (AND).
- The query is **URL state** (`?start=public&through=vulnerable&end=sink`), so it survives a reload and can be shared.
  Changing a chip runs the query (TanStack Query, keyed by graph id and roles); a "Clear" resets it.
- Show the result summary ("21 nodes · 40 edges on matching routes") and the empty state when nothing matches.
- **Filters tab:** list (built-in locked, custom with Edit/Delete, unavailable ones with a "Fix" action), and "New filter"
  opening the builder: key, description, a visual rule editor (match all/any, conditions, nested groups, `not`), a JSON tab
  to view or paste the raw rule, a live **preview** (matches count and names), inline server errors by path, Save.
  Creating, editing or deleting a filter changes the graph version and the route results: invalidate accordingly.

## 6. Graph upload

- Drag-and-drop or browse; JSON files only; a name field (prefilled from the file name, editable, required).
- Before sending: read the file, check size, parse JSON and run a light Zod check (object with `nodes` and `edges` arrays,
  nodes with `name` and `kind`) for instant feedback. Do not re-implement the server's rules; show its errors as returned.
- During the upload: progress and a disabled form. After success: select the new graph, show counts and any
  `placeholders` (toast or summary).
- **Replace file** on an open graph: same dialog, sends `If-Match` with the current version, keeps custom filters (the
  server does), handles `409 VERSION_CONFLICT`.
- Errors: `400` lists `details` (path and message), `413` explains the size limit, `415` asks for a JSON file.

## 7. Application states

Design every one of these (the mockup has examples):

- **First run:** no graphs, upload call-to-action.
- **Loading:** skeletons for lists and panels; a canvas spinner only after a short delay.
- **Empty results:** a route query with no match (normal `200`); a graph with no edges; a filter with 0 matches.
- **Errors:** API unreachable or `/health` down (banner, automatic retry); `404` graph (deleted elsewhere: back to the list);
  validation errors with paths; `409` conflicts (reload or overwrite); built-in filter edits blocked in the UI itself.
- **Large graphs:** thousands of nodes. Decide in planning: a node-count threshold above which only the route result is
  drawn, simplified nodes when zoomed out, and the layout running off the main thread if needed.
- **Optimistic vs. confirmed updates:** prefer invalidation and refetch over optimistic edits (the server computes match
  counts and versions).

## 8. Design system

The mockup (`docs/design-mockup.html`) defines it; turn its CSS variables into the Tailwind theme and shadcn/ui variables:

- **Neutrals and primary:** slate scale; primary indigo-600; destructive red-600; radius 8 px (cards 12 px).
- **Route roles:** start emerald-600, through amber-600, end rose-600; off-route opacity 0.28.
- **Node kinds:** service indigo, database (`rds`/`sql`) sky, queue (`sqs`) violet, anything else slate; placeholders
  dashed slate-400.
- **Severity:** critical rose-800, high red-600, medium amber-600, low sky-600, unknown slate-500 (severity is free text:
  match case-insensitively, display the original).
- **Type:** Inter (14 body, 12 meta, 16/22 headings); JetBrains Mono for filter keys, paths and JSON.
- **Accessibility:** keyboard reachable controls, visible focus rings, labels on icon buttons, color never the only signal,
  WCAG AA contrast. Dark mode is optional: decide in planning.

## 9. Project architecture

A feature-based structure, for example:

```
src/
  app/            providers (QueryClient, router, theme), app shell, routes
  api/            axios instance, error normalization, Zod schemas of responses, one module per resource
  features/
    graphs/       list, upload/replace dialogs, rename/delete, hooks (useGraphs, useGraph, useUploadGraph…)
    graph-view/   React Flow canvas, custom node/edge components, layout, legend, node details
    route-query/  role boxes, URL state, useRoutes
    filters/      list, rule builder, preview, rule schema, hooks
  components/ui/  shadcn/ui components
  lib/            small helpers (format, colors by kind/severity)
  styles/
tests/            all tests (see section 13)
```

Rules: components never call Axios directly (only through `api/` + hooks); the rule builder converts to and from the
backend's rule JSON in one tested module; layout and node styling are pure functions, tested without the DOM.

## 10. State management

- **Server state:** TanStack Query only. Suggested keys: `['health']`, `['graphs']`, `['graph', id]`, `['filters', id]`,
  `['routes', id, { start, end, through }]` (sorted, so equal queries share the cache).
- **Invalidation:** upload → `graphs`; replace → `graph`, `filters`, `routes` of that id, and `graphs`; rename → `graph`,
  `graphs`; delete → remove every key of that id and invalidate `graphs`; filter create/update/delete → `filters`, `routes`,
  `graph` of that id (the version changed).
- **URL state:** selected graph and the route query (shareable, survives reloads).
- **Local UI state:** panel open/closed, selected node, view mode, builder drafts. No global store unless planning shows a
  real need.

## 11. Environment configuration

- `VITE_API_BASE_URL` (default `http://localhost:3000`): the only required variable. Vite exposes only `VITE_` variables, and
  they are baked into the bundle at build time.
- Follow the backend's convention unless the user says otherwise: a **single `.env` file**, validated with Zod at startup
  (fail with a clear message), documented in the README rather than in a `.env.example`. Confirm this in planning.

## 12. Docker

- A multi-stage `Dockerfile`: build with Node, serve `dist/` with a small web server (for example `nginx:alpine`) with an SPA
  fallback to `index.html` and long cache headers for hashed assets.
- `VITE_API_BASE_URL` is a build argument (it is compiled in). Runtime configuration is an option to discuss if one image
  must serve several environments.
- A `docker-compose.yml` with a `frontend` service. The backend has its own compose project
  (`../home-exercise-backslash-be`, API on port 3000). Whatever port the container is published on must be in the backend's
  `CORS_ORIGINS`.

## 13. Testing

- Vitest and React Testing Library, jsdom. Follow the backend convention: **all tests under `tests/`**, mirroring `src/`
  (confirm in planning).
- Unit tests for pure logic: API schemas, error normalization, the rule-builder conversion, URL-state parsing, layout,
  node styling by kind/severity/role.
- Component tests with a mocked API: upload (success, placeholders, 400 details, 413, 415), the role boxes (OR within a role,
  URL sync), the filter builder (preview, server errors attached to rows, built-ins locked), states (empty, loading, error,
  conflict).
- React Flow in jsdom needs `ResizeObserver` and `DOMMatrix` stubs; test the canvas through its inputs and outputs
  (nodes, edges, classes), not pixels.
- Each planned task is **done when its tests pass, `tsc --noEmit` is clean and lint passes**, and earlier tests still pass.
  Optionally, a final smoke test against the real backend.

## 14. Development rules

These are the user's rules from the backend project; apply them here too:

- **Never run `git commit`** (or anything that creates commits). The user commits.
- **No code until the user approves.** Work is split into **gated tasks** agreed in planning; implement only the approved
  task, then stop, report and wait for approval before the next one.
- **No dependency without a reason:** for every package beyond the stack above, say why it is needed and wait for approval.
- Do not assume what the backend does: check the OpenAPI document or the backend README; if something seems missing in
  the API, raise it instead of working around it.
- TypeScript strict, no `any` at boundaries; small components; accessible markup.
- Verify before reporting: run the tests, the type check and the app; report failures honestly with their output.
- Keep `README.md` up to date (setup, scripts, env, Docker, architecture), and create a `CLAUDE.md` for future sessions.

## 15. Before implementation

Do these in order, and stop after step 5 for the user's approval:

1. Read this brief and open `docs/design-mockup.html`.
2. Check the backend: `GET http://localhost:3000/health`, read `http://localhost:3000/docs/openapi.json` and
   `../home-exercise-backslash-be/README.md`. Report any difference from section 3. If the backend is not running:
   `cd ../home-exercise-backslash-be && docker compose up -d` (and `npm run seed` there for sample data).
3. Review the stack: flag unnecessary or missing pieces (layout library, router, API mocking, type generation), with a
   recommendation for each.
4. Ask the open questions, at least:
   - Default canvas view: highlight the route on the whole graph, or show the route only?
   - Large-graph threshold and behaviour.
   - Dark mode: yes or no?
   - Filter builder scope for the first version (visual builder + JSON tab, or JSON tab first)?
   - Single `.env` and tests under `tests/`, as in the backend?
   - Which port the Docker image is served on (so the backend's `CORS_ORIGINS` can include it)?
5. With the answers, **plan together with the user**: the architecture in detail, then the split into gated tasks, each
   with the tests that define "done". Wait for approval before writing any code.
