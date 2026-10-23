# Product feedback draft

This is a draft for the hackathon submission form. Replace measured latency
with values from the deployed demo before submitting.

## MCP SDK (`@modelcontextprotocol/sdk`)

Used `McpServer`, Zod schemas, and `StreamableHTTPServerTransport` for the
self-hosted `2025-11-25` endpoint. Tool registration is concise and type-safe.
The browser flow required explicit CORS handling and response-header exposure;
that should be called out in the official examples. We would build with it
again.

## Alexa+ simulated path

The React simulation provides a practical way to show the real MCP calls while
preview access is unavailable. A first-party browser simulator with session
and tool-call inspection would make onboarding much easier and would help
developers demonstrate compliance honestly.

## Amazon Bedrock and Guardrails

Bedrock is used for scam analysis and claim verification. Guardrails can screen
prompts before analysis. The demo keeps a deterministic local fallback because
model access, region availability, and credentials should not be a live demo
blocker. Model IDs and regional availability should be surfaced more clearly
in onboarding.

## DynamoDB

DynamoDB is used for guardian records, safe-word questions, and alert history.
PAY_PER_REQUEST is a good fit for a small hackathon demo. A reference schema
and local development recipe would reduce setup time.

## SNS

SNS is used for optional guardian notifications. The app still logs the alert
when SNS is absent or unavailable. SMS sandbox requirements and phone
verification should be more prominent in the hackathon setup documentation.
