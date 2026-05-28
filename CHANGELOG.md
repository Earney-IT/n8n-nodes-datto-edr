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
