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

**Token notes:**
- Tokens expire after **1 year** — regenerate and update the credential before expiry.
- The token is sent as the raw value of the `Authorization` header (not a `Bearer` scheme). This matches the verified behaviour of the Datto EDR Pulse API.
- The credential test calls `GET /users/me` to validate both the base URL and the token.

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

- **Filters** (per-resource `where` clause) — a collection of fields specific to each resource (e.g. hostname, severity, organization). Expand the Filters section to add conditions.
- **Options** — a separate collection for `order` (sort field and direction), `fields` (projection), and `include` (relation embedding).
- **Return All** / **Limit** — toggle whether the node fetches all pages automatically or caps at a given count.

For **Archive**, **Unarchive**, **Delete Files**, and **Restore Files** the filter is a raw LoopBack `where` JSON object (e.g. `{"agentId":"abc-123"}`) that is sent as the `where` query-string parameter.

---

## Links

- **GitHub repository:** <https://github.com/Earney-IT/n8n-nodes-datto-edr>
- **Datto EDR API token docs:** <https://edr.datto.com/help/Content/2-manage/api-generate-token.htm>
- **Report issues:** <https://github.com/Earney-IT/n8n-nodes-datto-edr/issues>

---

## License

MIT — [Tristen Rice](mailto:support@earneyit.com) / Earney IT
