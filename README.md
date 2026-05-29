# n8n-nodes-datto-edr

An n8n community node for **Datto EDR** (formerly Infocyte / "Pulse API"). Query endpoints, scans, threats and alerts, and run response actions — AI-agent ready.

---

## Install

### n8n Settings (recommended)

In your n8n instance go to **Settings → Community Nodes → Install** and enter:

```
n8n-nodes-datto-edr
```

### npm (self-hosted)

```bash
npm i n8n-nodes-datto-edr
```

---

## Credentials & setup

Create a **Datto EDR API** credential with the following fields:

| Field | Value |
|---|---|
| **Base URL** | Your console URL followed by `/api` — e.g. `https://YOURINSTANCE.infocyte.com/api` |
| **API Token** | Generated in the EDR console under **Admin → Users & Tokens → API Tokens** |

**Important:** The Base URL **must** end with `/api` (e.g. `https://YOURINSTANCE.infocyte.com/api`). If you omit `/api` the node hits the Datto web app and returns HTML — the credential test will fail with a clear error message.

**Token notes:**
- Tokens expire after **1 year** — regenerate and update the credential before expiry.
- The token is sent as the raw value of the `Authorization` header (not a `Bearer` scheme). This matches the verified behaviour of the Datto EDR Pulse API.
- The credential test calls `GET /users/me` and validates that the response is a JSON object containing an `id` or `email` field (not HTML). A missing `/api` in the Base URL or a wrong token will produce a descriptive error.

Token generation walkthrough: <https://edr.datto.com/help/Content/2-manage/api-generate-token.htm>

---

## Resources & operations

The node exposes 14 resources. The table below lists every operation available for each resource, derived from the resource descriptors and special action handlers in the source.

| Resource | Get Many | Get | Count | Create | Update | Delete | Actions |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **Agent** | ✓ | ✓ | ✓ | | ✓ | ✓ | Isolate, Scan, Uninstall, Rename, Retrieve Logs, Assign Target, Is Active, Scan History |
| **Alert** | ✓ | ✓ | ✓ | | | | Archive, Unarchive, Respond, Get Comments, Add Comment |
| **Target** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | List Agents |
| **Quarantined File** | ✓ | ✓ | ✓ | | | | Delete Files, Restore Files |
| **Organization** | ✓ | ✓ | ✓ | ✓ | ✓ | | |
| **Webhook** | ✓ | ✓ | | ✓ | ✓ | ✓ | |
| **Suppression Rule** | ✓ | ✓ | | ✓ | | | |
| **User** | ✓ | ✓ | | | | | |
| **Report** | ✓ | ✓ | | | | | |
| **Box** | ✓ | ✓ | | | | | |
| **Flag** | ✓ | ✓ | | | | | |
| **Policy** | ✓ | ✓ | | | | | |
| **Location** | ✓ | ✓ | | | | | |
| **Extension** | ✓ | ✓ | | | | | |

---

## Response actions are LIVE

> **Warning:** The following operations act immediately on production endpoints — there is no confirmation step or dry-run mode.
>
> - **Agent: Isolate** — cuts the endpoint off from the network (or releases it).
> - **Agent: Scan** — initiates an on-demand scan on the specified device(s).
> - **Agent: Uninstall** — queues an uninstall job on the specified device.
> - **Agent: Retrieve Logs** — triggers a log-collection job on the device.
> - **Quarantined File: Delete Files** — permanently deletes quarantined files matching the filter.
> - **Quarantined File: Restore Files** — restores quarantined files to their original location.
> - **Alert: Archive / Unarchive** — changes the archived state of matching alerts.
> - **Alert: Respond** — sends a response action (e.g. quarantine/delete) to the API.
>
> Review your filter criteria carefully before executing any of these operations.

---

## Using with AI agents

The node has `usableAsTool: true`, meaning you can attach it directly to an n8n AI Agent node and let the model drive EDR queries and actions.

**Example agent prompts:**

- "List all endpoints in the target group named `Servers` that are currently isolated."
- "Isolate the endpoint named `LAPTOP-123` immediately."
- "Archive all low-severity alerts that are older than 7 days."
- "Show the 10 most recent high-severity alerts."
- "How many agents are currently active?"
- "List all quarantined files for agent ID `abc-123`."

The node's tool description is designed so that an LLM can map natural-language requests onto the correct resource + operation without extra prompt engineering.

---

## Filtering

All **Get Many** operations support LoopBack 3 filtering:

### Filters (operator-aware)

The **Filters** section is a multi-value fixedCollection. Each condition has three fields:

| Field | Description |
|---|---|
| **Field** | The filterable attribute for the resource (e.g. `hostname`, `severity`). |
| **Operator** | Equals, Not Equals, Greater Than, Greater Or Equal, Less Than, Less Or Equal, Contains (like `%value%`), In List (Comma-Sep → LoopBack `inq`). |
| **Value** | The comparison value. Numeric strings are automatically coerced to numbers for GT/GTE/LT/LTE/EQ. |

Multiple conditions are ANDed together in the LoopBack `where` clause.

### Options

- **Order** — sort field and direction, e.g. `createdOn DESC`.
- **Fields** — comma-separated field projection, e.g. `id,hostname,status`.
- **Where (JSON)** — advanced: a raw LoopBack `where` clause as JSON (e.g. `{"severity":{"gt":3}}`). This is merged **over** the Filters above, so it can override or extend any condition.
- **Include** — embed related resources in the response (where available).

### Return All / Limit

Toggle **Return All** to fetch all pages automatically (uses limit/skip pagination), or set a **Limit** to cap results.

For **Archive**, **Unarchive**, **Delete Files**, and **Restore Files** the filter is a raw LoopBack `where` JSON object (e.g. `{"agentId":"abc-123"}`) that is sent as the `where` query-string parameter.

---

## Links

- **GitHub repository:** <https://github.com/Earney-IT/n8n-nodes-datto-edr>
- **Datto EDR API token docs:** <https://edr.datto.com/help/Content/2-manage/api-generate-token.htm>
- **Report issues:** <https://github.com/Earney-IT/n8n-nodes-datto-edr/issues>

---

## License

MIT — [Tristen Rice](mailto:support@earneyit.com) / Earney IT
