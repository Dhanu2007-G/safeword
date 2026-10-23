# Safeword

Safeword is an open-source MCP trust layer that makes Alexa+ a calmer, safer
co-pilot for vulnerable people in high-stakes moments.

> When someone asks, “Alexa, is this real?”, Safeword creates a pause before
> an irreversible action.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## What it does

Safeword exposes five reusable MCP tools over Streamable HTTP:

| Tool | Purpose |
| --- | --- |
| `screen_situation` | Scores scam patterns from a call, text, email, or encounter. |
| `challenge_identity` | Retrieves a private, family-set challenge question. |
| `guardian_alert` | Logs an alert and gives a trusted guardian approve/block controls. |
| `verify_claim` | Adds a confidence score and caveats to health or financial claims. |
| `safe_handoff` | Stops improvisation and provides a calm human-resource handoff. |

The included browser app is a simulated Alexa+ experience. It calls the real
MCP endpoint and REST dashboard routes, so the demo exercises the same server
that an Alexa+ integration would use.

## Hackathon submission

- **Primary track:** Amazon Developer Hackathon — Alexa+
- **Track technology:** self-hosted MCP server, Streamable HTTP, protocol
  version `2025-11-25`
- **Mini challenges:** AWS Builder and Open Source
- **Demo video:** add the public under-three-minute URL here before submission

## Quick start

Requirements: Node.js 20+.

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

Open:

- Simulated Alexa+: http://localhost:5173
- MCP health: http://localhost:3000/health
- MCP endpoint: http://localhost:3000/mcp

The demo works without AWS credentials. It uses a seeded in-memory profile for
`demo_user_001` and deterministic heuristic fallbacks. To enable AWS adapters,
copy `.env.example` to `.env` and configure credentials, Bedrock, DynamoDB,
and SNS. Never commit `.env` or credentials.

## MCP contract

```text
POST   /mcp   JSON-RPC requests and tool calls
GET    /mcp   Streamable HTTP server stream for an active session
DELETE /mcp   Session termination
```

Initialize a session with protocol `2025-11-25`, retain the returned
`Mcp-Session-Id`, then call `tools/list` or `tools/call`. All tool results are
structured JSON strings in `result.content[0].text`.

REST helpers used by the simulated guardian UI:

```text
GET   /health
POST  /setup
GET   /alerts/:userId
PATCH /alert/:alertId   body: { "status": "APPROVED" | "BLOCKED" }
```

## AWS integrations

- **Amazon Bedrock:** scam analysis and claim verification, with optional
  Bedrock Guardrails screening.
- **Amazon DynamoDB:** guardian records, safe-word questions, and alert history.
- **Amazon SNS:** optional guardian notifications when `SNS_TOPIC_ARN` is set.

Every AWS call is wrapped in a safe fallback. The demo remains usable if AWS
is unavailable, and the full safe-word answer is never persisted—only its first
character hint is stored for the local demo.

## Reproducible evaluation

The labeled dataset contains 50 mixed scam, legitimate, and suspicious cases.
Run:

```bash
npm run evaluate
```

The evaluator uses the same deterministic fallback classifier used when AWS is
not configured and prints precision, recall, F1, and the confusion matrix.

Latest local baseline (50 labeled cases, no AWS credentials):

```text
Precision: 100.0%
Recall:     88.0%
F1 Score:   93.6%
TP:22 TN:25 FP:0 FN:3
```

The baseline is intentionally reproducible; Bedrock-backed runs can produce
different scores depending on the configured model and prompt response.

Current local baseline (50 cases, scam threshold `risk_score >= 61`):

```text
Precision: 100.0%
Recall:     88.0%
F1 Score:   93.6%
TP:22 TN:25 FP:0 FN:3
```

## Repository map

```text
packages/mcp-server/   Streamable HTTP MCP server and service adapters
packages/web-app/      React/Vite simulated Alexa+ and guardian dashboard
docs/                  Architecture, demo script, feedback, friction log
infrastructure/        Bedrock Guardrail starter configuration
```

## Privacy and safety boundaries

- Safeword does not record or inspect phone audio.
- Safe-word answers are not stored; only a first-character hint is retained.
- Guardian alerts contain a concise summary, not surveillance transcripts.
- A high score means “pause and verify”, not a final legal or financial
  determination. Users should contact trusted people and official resources.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). New scam patterns, translations,
tool schemas, tests, and documentation are welcome.

## License

MIT — see [LICENSE](LICENSE).
