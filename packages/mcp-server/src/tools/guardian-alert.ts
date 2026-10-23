import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGuardian, writeAlert } from "../services/dynamodb.js";
import { publishAlert } from "../services/sns.js";
import type { AlertRecord, GuardianAlertResult, RiskLevel } from "../types/index.js";

export function registerGuardianAlert(server: McpServer): void {
  server.tool(
    "guardian_alert",
    "Logs a scam alert and notifies the trusted guardian with approve or block options.",
    {
      user_id: z.string().min(1),
      situation_summary: z.string().min(1).max(500),
      risk_score: z.number().min(0).max(100),
      amount_mentioned: z.string().optional(),
    },
    async ({ user_id, situation_summary, risk_score, amount_mentioned }) => {
      const alertId = `alert_${randomUUID()}`;
      const timestamp = new Date().toISOString();
      try {
        const guardian = await getGuardian(user_id);
        const alert: AlertRecord = {
          alert_id: alertId,
          user_id,
          situation_summary,
          risk_score,
          risk_level: getRiskLevel(risk_score),
          amount_mentioned: amount_mentioned ?? null,
          timestamp,
          status: "PENDING",
          guardian_name: guardian?.name ?? "Guardian",
          guardian_phone: guardian?.phone ?? null,
        };
        await writeAlert(alert);
        const notificationSent = Boolean(
          guardian?.sns_endpoint &&
            (await publishAlert(
              guardian.sns_endpoint,
              `Safeword alert for ${guardian.user_name}: ${alert.risk_level} risk (${risk_score}/100). ${situation_summary}`,
              alertId,
            )),
        );
        const result: GuardianAlertResult = {
          alert_id: alertId,
          guardian_notified: notificationSent,
          guardian_name: guardian?.name ?? "Guardian",
          status: "SENT",
          message: notificationSent
            ? `${guardian?.name ?? "Your guardian"} has been notified and can approve or block this alert.`
            : "The alert is logged. Do not send money; ask a trusted family member to review it.",
          timestamp,
        };
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      } catch {
        const result: GuardianAlertResult = {
          alert_id: alertId,
          guardian_notified: false,
          guardian_name: "Guardian",
          status: "FAILED",
          message: "The guardian could not be reached. Do not send money; call a trusted family member directly.",
          timestamp,
        };
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }
    },
  );
}

function getRiskLevel(score: number): RiskLevel {
  return score >= 86 ? "CRITICAL" : score >= 61 ? "HIGH" : score >= 31 ? "MEDIUM" : "LOW";
}
