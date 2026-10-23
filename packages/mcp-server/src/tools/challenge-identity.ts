import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSafeWord } from "../services/dynamodb.js";
import type { ChallengeIdentityResult } from "../types/index.js";

export function registerChallengeIdentity(server: McpServer): void {
  server.tool(
    "challenge_identity",
    "Retrieves a family-set challenge question to verify a caller's identity.",
    { user_id: z.string().min(1), claimed_identity: z.string().optional() },
    async ({ user_id, claimed_identity }) => {
      try {
        const safeWord = await getSafeWord(user_id);
        const result: ChallengeIdentityResult = safeWord
          ? {
              has_safe_word: true,
              challenge_question: safeWord.question,
              expected_answer_hint: `Answer starts with: ${safeWord.answer_hint}`,
              instruction: `Ask ${claimed_identity ?? "the caller"}: "${safeWord.question}" Do not reveal the answer.`,
            }
          : {
              has_safe_word: false,
              challenge_question: null,
              expected_answer_hint: null,
              instruction: "No family safe word is configured. Call a trusted family member using a known number to verify.",
            };
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      } catch {
        const fallback: ChallengeIdentityResult = {
          has_safe_word: false,
          challenge_question: null,
          expected_answer_hint: null,
          instruction: "The safe word could not be retrieved. Ask the caller a question only the real person would know.",
        };
        return { content: [{ type: "text", text: JSON.stringify(fallback) }] };
      }
    },
  );
}
