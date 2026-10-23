# Safeword — Alexa+ trust layer

Safeword is an open-source MCP trust layer for vulnerable people in high-stakes
voice interactions. It ships a Streamable HTTP MCP server and a simulated
Alexa+ web experience for the Amazon Developer Hackathon Alexa+ track.

## Build phases

`[x]` 1-Scaffold  `[x]` 2-Core MCP  `[x]` 3-Tools  `[x]` 4-Frontend
`[x]` 5-AWS fallbacks  `[x]` 6-Polish

The attached Safeword Vibe Guide is the product source of truth. Keep the
demo safe by default, never store full safe-word answers, and keep the
friction log current when the developer experience reveals a problem.

## Backend contract

- `packages/mcp-server` exposes a Streamable HTTP MCP endpoint at `POST /mcp`,
  `GET /mcp`, and `DELETE /mcp` using MCP protocol version `2025-11-25`.
- Five MCP tools are registered: `screen_situation`, `challenge_identity`,
  `guardian_alert`, `verify_claim`, and `safe_handoff`.
- Every tool response is a JSON string in `content[0].text`.
- REST helpers are available at `/health`, `POST /setup`, `GET /alerts/:userId`,
  and `PATCH /alert/:alertId`.
- With no AWS credentials, the server uses a seeded in-memory demo user and
  deterministic heuristic analysis. With credentials configured, service
  wrappers use Bedrock, DynamoDB, and SNS, while failures fall back safely.
- `packages/web-app` is the simulated Alexa+ path. It calls the real MCP
  endpoint and REST dashboard routes; it is not a fake-only frontend.

## Development

```bash
npm install
npm run typecheck
npm run build
npm run evaluate
npm run dev
```

Open `http://localhost:5173` for the simulated Alexa+ UI and
`http://localhost:3000/health` for the MCP server.

Copy `.env.example` to `.env` only when connecting AWS services. Never commit
credentials or other secrets.
