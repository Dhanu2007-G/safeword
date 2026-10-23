# Friction Log — Safeword / Amazon Developer Hackathon

## Entry 001

**Task:** Initialize an MCP session from a browser client.
**Steps taken:** Sent an InitializeRequest from the React app and read the
`Mcp-Session-Id` response header.
**Expected:** Browser JavaScript can retain the session identifier.
**Actual:** CORS requires the header to be explicitly exposed.
**Severity:** High
**Workaround:** Added `Access-Control-Expose-Headers: Mcp-Session-Id`.
**Actionable suggestion:** Include browser CORS guidance in the Streamable HTTP
MCP examples.

## Entry 002

**Task:** Keep the demo running without AWS credentials.
**Steps taken:** Started the server with an empty `.env` and exercised every
tool and REST route.
**Expected:** The demo should still show a complete safety flow.
**Actual:** A cloud-only implementation would block the hackathon demo.
**Severity:** Critical
**Workaround:** Added seeded in-memory records and deterministic fallbacks.
**Actionable suggestion:** Publish a local reference adapter for common AWS
service-backed MCP examples.

## Entry 003

**Task:** Let a guardian act on a browser-rendered alert.
**Steps taken:** Created an alert through `guardian_alert`, loaded the polling
view, and patched its status.
**Expected:** The card updates immediately and remains readable after refresh.
**Actual:** The client needs a stable alert key and a clear REST contract.
**Severity:** Medium
**Workaround:** Defined `PATCH /alert/:alertId` with `APPROVED` and `BLOCKED`.
**Actionable suggestion:** Document recommended guardian approval primitives for
MCP integrations.

## Entry 004

**Task:** Demonstrate the Alexa+ track without preview access.
**Steps taken:** Built a browser simulation that calls the self-hosted MCP
endpoint instead of mocking tool responses.
**Expected:** Judges can see the real tool contract in action.
**Actual:** There is no official browser test client for Alexa+ MCP flows.
**Severity:** High
**Workaround:** Added a simulated Alexa+ tab and technical proof steps to the
demo script.
**Actionable suggestion:** Provide an official browser-based Alexa+ simulator
with session inspection and tool traces.

## Entry 005

**Task:** Avoid leaking a family safe-word answer.
**Steps taken:** Submitted setup data, requested a challenge, and inspected the
stored in-memory/DynamoDB shape.
**Expected:** The challenge can be shown without exposing the answer.
**Actual:** Storing the full answer would make the safety feature weaker.
**Severity:** Critical
**Workaround:** Store only the first-character hint and never return it to the
caller-facing UI.
**Actionable suggestion:** Add a standard secret/consent pattern to MCP tool
schema guidance for sensitive user-defined facts.
