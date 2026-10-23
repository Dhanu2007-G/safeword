# Safeword three-minute demo script

## 0:00–0:20 — Hook

Open the Alexa+ tab and click **Try the scam scenario**. Say: “A bank caller
is asking me to move my savings immediately and read an OTP. They say I must
not hang up.”

## 0:20–0:50 — Screen the situation

Show the risk ring and signal chips. Explain that `screen_situation` pauses the
moment before money or personal information moves. The key line is: “This is a
strong reason to stop and verify independently.”

## 0:50–1:20 — Challenge identity

Open Setup first if recording from a fresh state, then show the challenge
question: “What is the name of the dog we had when you were born?” Emphasize:
**a voice clone cannot answer a private family question.**

## 1:20–1:50 — Guardian decision

Click **Alert guardian**, switch to Guardian, and show the pending card. Click
**Block**. Point out that the guardian sees a summary, not surveillance or a
recording.

## 1:50–2:20 — General trust layer

Use the setup or API flow to demonstrate that the same server also exposes
`verify_claim` for high-stakes health/financial answers and `safe_handoff` for
distress. The response includes caveats and official human resources rather
than improvisation.

## 2:20–2:50 — Technical proof

Show `POST /mcp`, the five tool names in `tools/list`, and the terminal output
from `npm run evaluate`.

## 2:50–3:00 — Close

“Safeword is an MIT-licensed, reusable MCP trust layer for Alexa+. It runs
locally without AWS, and adds Bedrock, Guardrails, DynamoDB, and SNS when
configured.”
