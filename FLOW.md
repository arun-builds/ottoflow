# Ottoflow — Request / Response & Data Flow

Verified end-to-end on 2026-10-17 with the Docker stack in `docker-compose.yml`.

## Architecture

```
┌──────────┐        ┌──────────┐        ┌─────────────────┐        ┌──────────┐
│  React   │  HTTP  │   api    │  SQL   │    Postgres      │        │  Redis   │
│  client  │ ─────► │  :8080   │ ─────► │     :5432        │ ◄───── │  :6379   │
│  :5173   │        │ (UI API) │        │ workflows        │        │ stream:  │
└──────────┘        └──────────┘        │ workflow_execs   │        │ ottoflow │
                                        │ node_executions  │        │ :webhooks│
┌──────────┐  HTTP  ┌──────────┐  XADD  │                  │        └────▲─────┘
│ external │ ─────► │ webhook  │ ─────► │                  │             │
│  caller  │        │  :8081   │        └──────────────────┘             │ XREADGROUP
└──────────┘        └──────────┘                 ▲                       │
                                                 │ SQL                   │
                                            ┌────┴───────────────────────┴────┐
                                            │              worker              │
                                            │  consumer → engine.Execute(BFS)  │
                                            └──────────────────────────────────┘
```

## Services

| Service | Port | Role | Key env |
|---|---|---|---|
| `api` | 8080 | CRUD for workflows, read executions for the UI | `DATABASE_URL`, `PORT` |
| `webhook` | 8081 | Public ingress, publishes payload to Redis Stream | `REDIS_URL`, `PORT` |
| `worker` | — | Consumes Redis Stream, loads DAG, runs engine | `DATABASE_URL`, `REDIS_URL`, `SMTP_*` |
| `postgres` | 5432 | Workflows + execution audit logs | — |
| `redis` | 6379 | Stream `ottoflow:webhooks`, group `worker-group` | — |
| `client` (not in compose) | 5173 | React flow-builder UI (`cd client && bun dev`) | API hardcoded to `:8080` |

## End-to-end flow

```
 1. UI saves graph        POST /api/workflows          → row in `workflows` (nodes/edges as JSONB)
 2. External trigger      POST /hooks/{workflow_id}    → webhook service reads body
 3. webhook publishes     XADD ottoflow:webhooks  { webhook_id, payload }   → 202 {"status":"queued"}
 4. worker consumes       XREADGROUP worker-group / worker-1
 5. worker loads DAG      SELECT ... WHERE id = {workflow_id}   (GetByGlobalID, no workspace filter)
 6. engine.Execute        INSERT workflow_executions (status=running)
 7. BFS over graph        for each node: handler.Handle() → INSERT node_executions (input/output/error)
 8. engine finishes       UPDATE workflow_executions SET status=completed|failed, finished_at
 9. worker ACKs           XACK ottoflow:webhooks worker-group {msg_id}
10. UI observes           GET /api/workflows/{id}/executions + GET /api/executions/{id}/nodes
```

### Trigger URL

The webhook URL is the **workflow UUID** (not a separate token):

```
POST http://localhost:8081/hooks/a892c080-7b78-4f7d-b6ee-c2bc96918741
Content-Type: application/json

{"amount": 150, "repository": {"name": "ottoflow"}}
```

Response (immediate, before execution happens):

```json
HTTP/1.1 202 Accepted
{"status":"queued"}
```

## API reference (verified responses)

### `POST /api/workflows` — create

Request:

```json
{
  "name": "E2E Test Workflow",
  "workspace_id": "00000000-0000-0000-0000-000000000001",
  "nodes": [
    { "id": "1", "type": "webhook", "data": { "label": "Webhook Trigger" }, "position": { "x": 0, "y": 0 } },
    { "id": "2", "type": "if", "data": { "value1": "{{webhook.amount}}", "operator": ">=", "value2": "100" }, "position": { "x": 250, "y": 0 } },
    { "id": "3", "type": "email", "data": { "to": "alice@example.com", "subject": "High value: {{webhook.amount}}", "body": "..." }, "position": { "x": 500, "y": -100 } },
    { "id": "4", "type": "email", "data": { "to": "bob@example.com", "subject": "Low value: {{webhook.amount}}", "body": "..." }, "position": { "x": 500, "y": 100 } }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2", "sourceHandle": "main", "targetHandle": "main" },
    { "id": "e2-3", "source": "2", "target": "3", "sourceHandle": "true", "targetHandle": "main" },
    { "id": "e2-4", "source": "2", "target": "4", "sourceHandle": "false", "targetHandle": "main" }
  ]
}
```

Response `201` (ID is server-generated UUID; body echoes the saved graph):

```json
{
  "id": "a892c080-7b78-4f7d-b6ee-c2bc96918741",
  "workspace_id": "00000000-0000-0000-0000-000000000001",
  "name": "E2E Test Workflow",
  "status": "draft",
  "nodes": [ ... ],
  "edges": [ ... ],
  "created_at": "2026-10-17T13:27:24.139472507Z",
  "updated_at": "2026-10-17T13:27:24.139472507Z"
}
```

### `GET /api/workflows` — list (light, no nodes/edges)

```json
[{"id":"a892c080-...","name":"E2E Test Workflow","status":"draft"}]
```

Workspace scoping via `X-Workspace-ID` header; falls back to `00000000-0000-0000-0000-000000000001`.

### `GET /api/workflows/{id}` — load full graph (used by editor)

### `PUT /api/workflows/{id}` — update graph

### `GET /api/workflows/{workflow_id}/executions`

```json
[
  {
    "id": "a872ddf3-1fe7-4081-b3a2-d1697d22b965",
    "workspace_id": "00000000-0000-0000-0000-000000000001",
    "workflow_id": "a892c080-7b78-4f7d-b6ee-c2bc96918741",
    "status": "completed",
    "started_at": "2026-10-17T13:28:15.383673Z",
    "finished_at": "2026-10-17T13:28:15.387343Z"
  }
]
```

### `GET /api/executions/{execution_id}/nodes` — per-node audit trail

```json
[
  {
    "id": "dc05968a-6118-4731-8c76-0f3c4e74c486",
    "execution_id": "3f63d3dc-a149-4ef6-a8f1-9030af4cfd24",
    "node_id": "1",
    "node_type": "webhook",
    "status": "success",
    "input_data": { "webhook": { "amount": 150, "repository": { "name": "ottoflow" } } },
    "output_data": { "payload": { "amount": 150, "repository": { "name": "ottoflow" } } },
    "error_message": "",
    "executed_at": "2026-10-17T13:27:29.508675Z"
  }
]
```

## Data model

| Table | Purpose | Key columns |
|---|---|---|
| `workflows` | Graph definition | `id UUID`, `workspace_id`, `name`, `status`, `nodes JSONB`, `edges JSONB` |
| `workflow_executions` | One row per run | `status` `running`/`completed`/`failed`, `started_at`, `finished_at` |
| `node_executions` | One row per node step | `node_id`, `node_type`, `status` `success`/`failed`, `input_data`, `output_data`, `error_message`, `executed_at` |

`nodes`/`edges` are stored exactly as the frontend sends them. **Edges use camelCase
`sourceHandle`** (`main`, `true`, `false`); the engine also accepts legacy
`source_handle` for rows saved before the fix.

## Engine semantics

- **Start node**: the first node whose `type == triggerType` (`"webhook"` for webhook runs).
- **State**: a shared `map[string]interface{}`; webhook payload seeded as `state["webhook"]`.
  `http`/`log`/`email`/`if` handlers may add entries keyed by node ID.
- **Templating**: `{{webhook.amount}}` / `{{ $json.amount }}` resolved per node from state/input.
  Missing paths resolve to `""`.
- **Routing**: each handler returns an `ActiveHandle`; only edges whose `sourceHandle`
  matches (or is empty/`main`) are followed.
- **Dedup**: visited-set prevents a converging node from running twice.
- **Failure**: any node error marks the run `failed`; execution continues to downstream
  `main` edges (no halt/retry semantics yet).

### Node reference

| Type | Data fields | Behavior |
|---|---|---|
| `webhook` | — | Passes payload through |
| `if` | `value1`, `operator` (`==` `!=` `>` `<` `>=` `<=`), `value2` | Numeric compare when both parse as numbers, else string; activates `true`/`false` |
| `email` | `to`, `subject`, `body` | Sends via SMTP when `SMTP_*` env set; otherwise logs a warning and succeeds |
| `http` | `url`, `method`, `body` | HTTP call (10s timeout); non-2xx marks node failed, response saved to state |
| `log` | — | Logs current state |

## Environment variables

| Var | Used by | Default |
|---|---|---|
| `DATABASE_URL` | api, worker | `postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable` |
| `REDIS_URL` | webhook, worker | `redis://localhost:6379` |
| `PORT` | api, webhook | `8080` / `8081` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | worker (email node) | unset → email send is skipped with a warning |

## Running from scratch

```bash
docker compose up -d --build
goose -dir migrations postgres "postgres://postgres:postgres@localhost:5432/ottoflow?sslmode=disable" up
# UI (optional)
cd client && bun install && bun dev     # http://localhost:5173
```

## Verified scenarios (2026-10-17)

| Scenario | Result |
|---|---|
| `{"amount":150}` → workflow above | nodes 1→2→3 executed, `if` result `true`, email to alice, run `completed` |
| `{"amount":50}` → workflow above | nodes 1→2→4 executed, `if` result `false`, email to bob, run `completed` |
| Email node without `to` | node `failed` (`email node requires a 'to' address`), run `failed` |
| Legacy `source_handle` edges in DB | still routed correctly through `true` branch |
| Worker ACK | `Successfully processed and ACKed webhook` in worker logs |

## Known limitations

- `internal/nodes` + `engine/types.go` (`OttoNode`/`OttoItem`) is an unused WIP rewrite of the node system.
- `GetCredentials` is mocked; no credential store yet.
- No manual/test-run trigger, no retries/DLQ for failed Redis messages.
- `execution_inbox` table exists but is unused.
- Frontend exposes only `webhook`, `email`, `if` (no `http`/`log` palette entries yet).
