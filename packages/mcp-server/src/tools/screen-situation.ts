import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { analyzeWithBedrock, heuristicSituation } from "../services/bedrock.js";
import type { ScreenSituationResult } from "../types/index.js";

export function registerScreenSituation(server: McpServer): void {
  server.tool(
    "screen_situation",
    "Analyzes a call, text, email, or encounter for scam patterns and returns a risk score.",
    {
      description: z.string().min(10),
      channel: z.enum(["call", "text", "email", "in-person", "unknown"]),
      claimed_identity: z.string().optional(),
    },
    async ({ description, channel, claimed_identity }) => {
      const fallback = (): string => JSON.stringify(heuristicSituation(description, channel, claimed_identity));
      try {
        const raw = await analyzeWithBedrock(
          `Analyze this possible scam. Return only JSON with risk_score, detected_signals, risk_level, explanation, recommendation, safe_to_proceed. Channel: ${channel}. Claimed identity: ${claimed_identity ?? "unknown"}. Description: ${description}`,
          fallback,
        );
        const result = JSON.parse(raw) as ScreenSituationResult;
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      } catch {
        return { content: [{ type: "text", text: fallback() }] };
      }
    },
  );
}
