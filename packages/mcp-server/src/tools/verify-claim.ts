import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { analyzeWithBedrock, heuristicClaim } from "../services/bedrock.js";
import type { VerifyClaimResult } from "../types/index.js";

export function registerVerifyClaim(server: McpServer): void {
  server.tool(
    "verify_claim",
    "Fact-checks a health, financial, legal, or general claim before it is acted on.",
    {
      claim: z.string().min(1),
      category: z.enum(["health", "financial", "legal", "general"]),
      original_question: z.string().optional(),
    },
    async ({ claim, category, original_question }) => {
      const fallback = (): string => JSON.stringify(heuristicClaim(claim, category));
      try {
        const raw = await analyzeWithBedrock(
          `Fact-check this ${category} claim. Return only JSON with confidence_score, verdict, explanation, safe_response, should_flag, sources_mentioned. Question: ${original_question ?? "none"}. Claim: ${claim}`,
          fallback,
        );
        const result = JSON.parse(raw) as VerifyClaimResult;
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      } catch {
        return { content: [{ type: "text", text: fallback() }] };
      }
    },
  );
}
