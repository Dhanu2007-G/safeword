import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { SafeHandoffResult } from "../types/index.js";

const resources = {
  scam_victim: { name: "National Cyber Crime Helpline", contact: "1930", type: "call" as const, note: "India's official cyber fraud reporting line." },
  emotional_distress: { name: "iCall Counselling", contact: "9152987821", type: "call" as const, note: "Mental health support in India." },
  financial_loss: { name: "RBI Sachet", contact: "https://sachet.rbi.org.in", type: "web" as const, note: "Report unauthorised financial transactions." },
  confused: { name: "A trusted family member", contact: null, type: "action" as const, note: "Call someone you trust using a known number." },
  general: { name: "Family", contact: null, type: "action" as const, note: "Call a trusted family member now." },
};

export function registerSafeHandoff(server: McpServer): void {
  server.tool(
    "safe_handoff",
    "Provides a calm response and an appropriate human resource when distress is detected.",
    {
      user_message: z.string().min(1),
      distress_type: z.enum(["scam_victim", "emotional_distress", "financial_loss", "confused", "general"]),
      situation_context: z.string().optional(),
    },
    async ({ distress_type }) => {
      const resource = resources[distress_type];
      const result: SafeHandoffResult = {
        calm_response: distress_type === "scam_victim"
          ? "You did nothing wrong. Scammers are convincing. Let us pause and take this one step at a time."
          : distress_type === "emotional_distress"
            ? "I can hear that this is stressful. You are not alone. Let us slow down together."
            : "You are safe to pause. Let us get a trusted person to help with the next step.",
        resource_name: resource.name,
        resource_contact: resource.contact,
        resource_type: resource.type,
        resource_note: resource.note,
        immediate_actions: distress_type === "scam_victim"
          ? ["Stop contact with the caller", "Do not send money or gift cards", "Tell a trusted family member", "Call 1930 if money was sent"]
          : ["Take a slow breath", "Do not make an irreversible decision", "Call a trusted person"],
        do_not_do: distress_type === "scam_victim"
          ? ["Do not call the suspicious number back", "Do not share passwords or one-time codes", "Do not pay anyone to recover money"]
          : [],
      };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  );
}
