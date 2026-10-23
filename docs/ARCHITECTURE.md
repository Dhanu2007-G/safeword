# Safeword architecture

## Overview

```text
User voice/text
      |
      v
Simulated Alexa+ React UI  -- POST /mcp -->  Streamable HTTP MCP server
      |                                          |
      |                                          +-- screen_situation
      |                                          +-- challenge_identity
      |                                          +-- guardian_alert
      |                                          +-- verify_claim
      |                                          +-- safe_handoff
      |                                          |
      |                                          +-- Bedrock + Guardrails
      |                                          +-- DynamoDB
      |                                          +-- SNS
      |
      +-- REST /setup, /alerts/:userId, PATCH /alert/:alertId
```

## Core journey

1. The person describes a suspicious situation to Alexa+.
2. `screen_situation` returns a score, risk level, signal tags, and a calm
   recommendation.
3. For high risk, `challenge_identity` returns the family-set question. The
   user asks the caller and reports whether the answer was credible.
4. `guardian_alert` writes a summary and optionally publishes an SNS message.
5. The guardian dashboard shows approve/block controls.
6. If the user is distressed, `safe_handoff` stops the normal flow and returns
   an appropriate human resource such as India's cybercrime helpline 1930.

## Safe-by-default runtime

When no AWS credentials are present, service adapters use in-memory demo data
and deterministic heuristics. This keeps the demo reproducible and prevents a
missing cloud configuration from becoming a live safety failure. With AWS
configured, each adapter attempts the real service and falls back to the same
safe local behavior on errors.

## Data minimization

The server stores guardian contact details, the safe-word question, a first
character hint, and alert summaries. It never stores a full answer, audio, or a
conversation transcript.
