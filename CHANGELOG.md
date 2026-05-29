## 0.2.0 — 2026-05-29

- **Programmatic connection test** — replaced the declarative `GET /users/me` credential test (which false-passed on HTML from the Datto web app) with a programmatic test that validates the response is a JSON object with an `id` or `email` field. The test now returns a clear `Error` status if the Base URL is missing `/api` or the API token is wrong.
- **Fail loud on non-JSON responses** — `dattoEdrApiRequest` now throws a descriptive `NodeOperationError` (with a `/api` hint) when the API returns an HTML string instead of JSON. Previously the node silently returned `{found:0}`. `dattoEdrApiRequestAllItems` also has an improved error message.
- **Operator-aware list filtering** — the Filters collection on `getAll` and `count` is now a fixedCollection supporting 8 operators: Equals, Not Equals, Greater Than, Greater Or Equal, Less Than, Less Or Equal, Contains (`like %...%`), and In List (Comma-Sep, maps to LoopBack `inq`). Numeric strings are automatically coerced for comparison operators.
- **Raw Where JSON** (`whereJson`) — a new `Where (JSON)` field in the Options collection accepts a raw LoopBack `where` clause as JSON; it is merged over the Filters above, enabling any field/operator not covered by the UI.
- 168 unit tests (Jest, +22 new).

## 0.1.0 — 2026-05-20

Initial release.

- One `usableAsTool` Datto EDR node covering 14 resources via the live Datto EDR Pulse API (LoopBack 3 REST).
- **Agent** — Get Many, Get, Count, Update, Delete + Isolate (isolate/release), Scan, Uninstall, Rename, Retrieve Logs, Assign Target, Is Active, Scan History.
- **Alert** — Get Many, Get, Count + Archive, Unarchive, Respond, Get Comments, Add Comment.
- **Target** — Get Many, Get, Count, Create, Update, Delete + List Agents.
- **Quarantined File** — Get Many, Get, Count + Delete Files, Restore Files.
- **Organization** — Get Many, Get, Count, Create, Update.
- **Webhook** — Get Many, Get, Create, Update, Delete.
- **Suppression Rule** — Get Many, Get, Create.
- **User**, **Report**, **Box**, **Flag**, **Policy**, **Location**, **Extension** — read-only (Get Many, Get).
- LoopBack filter support: per-resource `where` fields, plus `order`/`fields`/`include` Options and Return All / Limit pagination.
- Raw-token `Authorization` header (verified against the live API — `Bearer` scheme returns HTTP 500).
- Credential test via `GET /users/me`.
- ~146 unit tests (Jest).
