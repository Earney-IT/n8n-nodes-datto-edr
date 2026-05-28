# n8n-nodes-datto-edr

An n8n community node for **Datto EDR** (formerly Infocyte). Query endpoints, scans, threats/alerts, and run response actions — AI-agent ready.

> **Work in progress.** The branded skeleton and credential are scaffolded; resource operations will be added once the live API surface is verified.

## Install

In your n8n instance go to **Settings → Community Nodes → Install** and enter:

```
n8n-nodes-datto-edr
```

## Credentials

Create a **Datto EDR API** credential with:

- **Base URL** — your instance URL followed by `/api`, e.g. `https://acme.infocyte.com/api`
- **API Token** — generated in the EDR console under *Admin → Users & Tokens → API Tokens* (1-year expiry)

## License

MIT — [Tristen Rice](mailto:support@earneyit.com) / Earney IT
