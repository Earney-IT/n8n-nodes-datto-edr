# n8n-nodes-datto-edr — Design

**Date:** 2026-05-20
**Package:** `n8n-nodes-datto-edr` (Earney IT) — repo `github.com/Earney-IT/n8n-nodes-datto-edr`
**Status:** API explored against a live instance; building.

## API facts (verified live, 2026-05-20)

- Datto EDR is the former **Infocyte** platform; the API is internally called **"Pulse API"** — a **LoopBack 3** REST API, OpenAPI 3 spec at `https://<instance>/explorer/openapi.json` (1269 routes, ~100 models).
- **Base URL:** `https://<instance>.infocyte.com/api` (customer enters their console URL + `/api`).
- **Auth:** `Authorization: <token>` — the token sent **RAW**, NOT `Bearer`. (Bearer → 500; raw → 200; none → 401.) Token from console Admin → Users & Tokens (1-year expiry).
- **List queries:** LoopBack `?filter=<json>` where filter = `{ where, limit, skip, order, include, fields }` (URL-encoded JSON). `GET /<Model>/count?where=<json>` for counts. Standard per-model routes: `GET/POST /<Model>`, `GET/PUT/PATCH/DELETE /<Model>/{id}`, `GET /<Model>/count`, `GET /<Model>/findOne`.
- **Errors:** `{ "error": { "statusCode", "name", "message" } }`. 401 = bad/missing token, 404 = unknown route/model, 400 = bad params.
- Credential test: `GET /users/me` (auth-required, lightweight — validates token, not just reachability).

## Node scope (curated high-value EDR surface)

One node `Datto EDR` (`usableAsTool: true`). NOT all ~100 LoopBack models — a focused set an MSP/analyst/AI agent actually uses. Each resource: read CRUD (list with filter / get / count) plus create/update/delete and custom actions where they exist and make sense.

| Resource | Model | Operations |
|---|---|---|
| **Agent** (endpoint/device) | Agents | getAll, get, count, update, delete, **isolate** (`POST /Agents/toggleIsolation`), **scan** (`POST /Agents/scan`), **uninstall** (`POST /Agents/uninstall`), **rename** (`PATCH /Agents/{id}/rename`), **retrieveLogs** (`POST /Agents/{id}/retrieveLogs`), assignTarget, assignDeviceGroup, assignLicenses, toggleMetricsCollection, toggleVerboseLogging, isActive, scanHistory, export |
| **Alert** (threat/detection) | Alerts | getAll, get, count, **archive** (`POST /Alerts/archive`), **unarchive** (`POST /Alerts/unarchive`), **respond** (`POST /Alerts/response`), getComments/addComment (`/Alerts/{id}/comments`) |
| **Target** (group) | Targets | getAll, get, count, create, update, delete, listAgents (`GET /Targets/{id}/agents`) |
| **Organization** | Organizations | getAll, get, count, create, update |
| **Quarantined File** | QuarantinedFiles | getAll, get, count, **deleteFiles** (`POST /QuarantinedFiles/createDeleteFileJobs`), **restoreFiles** (`POST /QuarantinedFiles/createRestoreFileJobs`) |
| **Report** | Reports | getAll, get |
| **Box** (saved search / scan result) | Boxes | getAll, get |
| **Flag** | Flags | getAll |
| **Policy** | Policies | getAll, get |
| **Suppression Rule** | SuppressionRules | getAll, get, create |
| **Webhook** | Webhooks | getAll, get, create, update, delete |
| **User** | Users | getAll, get, me (`GET /users/me`) |
| **Location** | Locations | getAll, get |
| **Extension** | Extensions | getAll, get |

(More LoopBack models can be added later; this v1 set covers endpoints, threats, scanning, response actions, org/site management, quarantine, reporting, and alert tuning.)

## Architecture

Mirror the proven sibling `n8n-nodes-itglue-extended` engine, adapted for LoopBack/plain-REST (no JSON:API wrapper):

- `nodes/DattoEdr/shared/transport.ts` — `dattoEdrApiRequest` (raw-token auth via credential; `filter` JSON building; error mapping `{error:{...}}` → NodeApiError) + `dattoEdrApiRequestAllItems` (limit/skip pagination).
- `nodes/DattoEdr/registry/` — `ResourceDescriptor`/`FieldDescriptor` types + one descriptor per resource (model, path, operations, fields, filters).
- `nodes/DattoEdr/engine/` — properties generator + generic CRUD execute (list/get/count/create/update/delete) using LoopBack semantics.
- `nodes/DattoEdr/resources/special/` — custom action handlers: agents (isolate/scan/uninstall/rename/...), alerts (archive/unarchive/respond/comments), quarantinedFiles (delete/restore), targets (listAgents).
- `nodes/DattoEdr/DattoEdr.node.ts` — node class, `usableAsTool: true`, dispatcher.
- `methods/loadOptions` — dropdowns for Targets, Organizations, Flags.
- Tests via Jest (added alongside the `@n8n/node-cli` build/lint).

## Tooling

Modern n8n starter: `@n8n/node-cli` (`n8n-node build` / `n8n-node lint`) — both verified working. Add Jest + ts-jest for unit tests (TDD). Icon: square Datto-blue mark (palette/tool-picker friendly).

## Safety during build

Live verification uses **read-only GETs only** (list/get/count). Destructive/mutating actions (isolate, scan, uninstall, delete, archive, quarantine delete/restore) are built from the verified OpenAPI spec but **NOT executed** against the live production tenant. The local OpenAPI spec is at `.openapi-scratch.json` (gitignored); the test token lives in `.datto-test.env` (gitignored) and is temporary/revocable.
