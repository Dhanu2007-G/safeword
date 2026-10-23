import {
  ApplyGuardrailCommand,
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { ScreenSituationResult, VerifyClaimResult } from "../types/index.js";

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

export function awsConfigured(): boolean {
  return Boolean(
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
      process.env.AWS_PROFILE,
  );
}

export async function analyzeWithBedrock(
  prompt: string,
  fallback: () => string,
): Promise<string> {
  if (!awsConfigured()) return fallback();

  try {
    if (process.env.BEDROCK_GUARDRAIL_ID) {
      const guardrail = await client.send(
        new ApplyGuardrailCommand({
          guardrailIdentifier: process.env.BEDROCK_GUARDRAIL_ID,
          guardrailVersion: process.env.BEDROCK_GUARDRAIL_VERSION ?? "DRAFT",
          source: "INPUT",
          content: [{ text: { text: prompt } }],
        }),
      );
      if (guardrail.action === "GUARDRAIL_INTERVENED") {
        throw new Error("Bedrock Guardrail blocked the request");
      }
    }

    const response = await client.send(
      new InvokeModelCommand({
        modelId: process.env.BEDROCK_MODEL_ID ?? "anthropic.claude-3-5-sonnet-20241022-v2:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 1024,
          messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
        }),
      }),
    );
    const decoded: unknown = JSON.parse(Buffer.from(response.body ?? []).toString("utf8"));
    if (!isRecord(decoded) || !Array.isArray(decoded.content) || !isRecord(decoded.content[0])) {
      throw new Error("Unexpected Bedrock response");
    }
    const text = decoded.content[0].text;
    if (typeof text !== "string") throw new Error("Bedrock response did not contain text");
    return text;
  } catch (error) {
    console.warn("Bedrock unavailable; using heuristic fallback", error instanceof Error ? error.message : error);
    return fallback();
  }
}

export function heuristicSituation(description: string, channel: string, claimedIdentity?: string): ScreenSituationResult {
  const text = `${description} ${claimedIdentity ?? ""}`.toLowerCase();
  const signals: string[] = [];
  const add = (signal: string, words: string[]): void => {
    if (words.some((word) => text.includes(word))) signals.push(signal);
  };
  add("URGENCY", ["urgent", "right now", "immediately", "hurry", "today", "emergency", "in 2 hours", "before the offer expires"]);
  add("SECRECY", ["don't tell", "do not tell", "keep this secret", "secret", "nobody else"]);
  add("IMPERSONATION", ["police", "bank", "government", "grandson", "daughter", "son", "officer", "prize company", "lottery", "customs", "support agent", "loan officer"]);
  add("GIFT_CARD", ["gift card", "crypto", "bitcoin", "wire transfer", "send money", "otp", "one-time code", "processing fee", "upfront transfer", "cash demand", "demands cash", "demands a fee"]);
  add("FEAR_GUILT", ["arrest", "jail", "accident", "crying", "fine", "threat", "hospital", "legal case", "virus"]);
  add("UNUSUAL_CHANNEL", ["unexpected", "new number", "unknown number", "unfamiliar website", "lookalike", "shortened link"]);
  add("INFO_HARVEST", ["password", "pin", "cvv", "account number", "social security", "aadhaar", "remote access", "card details", "bank details"]);
  if (channel === "unknown" && !signals.includes("UNUSUAL_CHANNEL")) signals.push("UNUSUAL_CHANNEL");

  const scamHints = [
    "urgent", "immediately", "right now", "do not tell", "secret", "arrest", "jail", "accident",
    "hospital", "gift card", "crypto", "wire", "pin", "password", "account number", "remote access",
    "won a prize", "processing fee", "new number", "unknown number", "lookalike", "threat", "demands cash",
  ].filter((hint) => text.includes(hint)).length;
  const reassuringContext = ["official app", "usual number", "receipt confirms", "appointment", "tracking link", "autopay", "booked", "scheduled", "as usual"].some((hint) => text.includes(hint));
  const coordinatedPressure = (signals.length >= 2 && scamHints >= 1) || scamHints >= 2;
  const riskScore = Math.min(100, Math.max(8, signals.length * 14 + Math.min(28, scamHints * 7) + (signals.length >= 4 ? 12 : 0) + (coordinatedPressure ? 27 : 0) - (reassuringContext ? 8 : 0)));
  const riskLevel = riskScore >= 86 ? "CRITICAL" : riskScore >= 61 ? "HIGH" : riskScore >= 31 ? "MEDIUM" : "LOW";
  return {
    risk_score: riskScore,
    detected_signals: signals.length > 0 ? signals : ["NO_STRONG_SIGNALS"],
    risk_level: riskLevel,
    explanation: signals.length > 0
      ? `The description includes ${signals.length} common scam signal${signals.length === 1 ? "" : "s"}.`
      : "No strong scam pattern was detected, but verify unexpected requests independently.",
    recommendation: riskScore >= 61
      ? "Pause and do not send money or personal information. Contact a trusted person using a known number."
      : "Do not share sensitive information until you independently verify who contacted you.",
    safe_to_proceed: riskScore < 31,
  };
}

export function heuristicClaim(claim: string, category: string): VerifyClaimResult {
  const uncertain = /guarantee|cure|secret|instantly|always|never|free money|double your money/i.test(claim);
  const confidence = uncertain ? 35 : category === "general" ? 65 : 50;
  return {
    confidence_score: confidence,
    verdict: confidence >= 80 ? "LIKELY_TRUE" : uncertain ? "LIKELY_FALSE" : "UNCERTAIN",
    explanation: uncertain
      ? "The claim uses absolute or high-pressure language and needs independent expert verification."
      : "This claim cannot be fully verified without a reliable source and more context.",
    safe_response: `${claim} Please verify this with a qualified ${category === "general" ? "professional or authoritative source" : `${category} professional`} before acting on it.`,
    should_flag: confidence < 85,
    sources_mentioned: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
