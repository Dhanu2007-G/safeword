import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { awsConfigured } from "./bedrock.js";
import type { AlertRecord, GuardianRecord, SafeWordRecord, SetupInput } from "../types/index.js";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

const guardians = new Map<string, GuardianRecord>();
const safeWords = new Map<string, SafeWordRecord>();
const alerts = new Map<string, AlertRecord>();

const demoUser: GuardianRecord = {
  user_id: "demo_user_001",
  user_name: "Grandma Parvathi",
  name: "Priya (Daughter)",
  phone: "+919999999999",
};
guardians.set(demoUser.user_id, demoUser);
safeWords.set(demoUser.user_id, {
  user_id: demoUser.user_id,
  question: "What is the name of the dog we had when you were born?",
  answer_hint: "B",
});

export async function getGuardian(userId: string): Promise<GuardianRecord | null> {
  if (!awsConfigured()) return guardians.get(userId) ?? null;
  try {
    const response = await dynamo.send(new GetCommand({
      TableName: process.env.DYNAMODB_GUARDIANS_TABLE,
      Key: { user_id: userId },
    }));
    return (response.Item as GuardianRecord | undefined) ?? null;
  } catch (error) {
    console.warn("DynamoDB guardian lookup failed", error instanceof Error ? error.message : error);
    return guardians.get(userId) ?? null;
  }
}

export async function getSafeWord(userId: string): Promise<SafeWordRecord | null> {
  if (!awsConfigured()) return safeWords.get(userId) ?? null;
  try {
    const response = await dynamo.send(new GetCommand({
      TableName: process.env.DYNAMODB_SAFEWORDS_TABLE,
      Key: { user_id: userId },
    }));
    return (response.Item as SafeWordRecord | undefined) ?? null;
  } catch (error) {
    console.warn("DynamoDB safe-word lookup failed", error instanceof Error ? error.message : error);
    return safeWords.get(userId) ?? null;
  }
}

export async function writeAlert(alert: AlertRecord): Promise<void> {
  alerts.set(alert.alert_id, alert);
  if (!awsConfigured()) return;
  try {
    await dynamo.send(new PutCommand({ TableName: process.env.DYNAMODB_ALERTS_TABLE, Item: alert }));
  } catch (error) {
    console.warn("DynamoDB alert write failed", error instanceof Error ? error.message : error);
  }
}

export async function listAlerts(userId: string): Promise<AlertRecord[]> {
  if (!awsConfigured()) {
    return [...alerts.values()]
      .filter((alert) => alert.user_id === userId)
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
      .slice(0, 20);
  }
  try {
    const response = await dynamo.send(new QueryCommand({
      TableName: process.env.DYNAMODB_ALERTS_TABLE,
      KeyConditionExpression: "user_id = :user_id",
      ExpressionAttributeValues: { ":user_id": userId },
      ScanIndexForward: false,
      Limit: 20,
    }));
    return (response.Items as AlertRecord[] | undefined) ?? [];
  } catch (error) {
    console.warn("DynamoDB alert lookup failed", error instanceof Error ? error.message : error);
    return [...alerts.values()]
      .filter((alert) => alert.user_id === userId)
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
      .slice(0, 20);
  }
}

export async function updateAlertStatus(
  alertId: string,
  status: "APPROVED" | "BLOCKED",
  userId?: string,
): Promise<AlertRecord | null> {
  const cached = alerts.get(alertId);
  if (cached) {
    cached.status = status;
    alerts.set(alertId, cached);
  }
  if (!awsConfigured()) return cached ?? null;
  try {
    const response = await dynamo.send(new UpdateCommand({
      TableName: process.env.DYNAMODB_ALERTS_TABLE,
      Key: { alert_id: alertId, user_id: userId ?? cached?.user_id ?? "demo_user_001" },
      UpdateExpression: "SET #status = :status, resolved_at = :resolved_at",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": status, ":resolved_at": new Date().toISOString() },
      ReturnValues: "ALL_NEW",
    }));
    return (response.Attributes as AlertRecord | undefined) ?? cached ?? null;
  } catch (error) {
    console.warn("DynamoDB alert update failed", error instanceof Error ? error.message : error);
    return cached ?? null;
  }
}

export async function saveSetup(input: SetupInput): Promise<void> {
  const guardian: GuardianRecord = {
    user_id: input.user_id,
    user_name: input.user_name,
    name: input.guardian_name,
    phone: input.guardian_phone,
    ...(input.sns_endpoint ? { sns_endpoint: input.sns_endpoint } : {}),
  };
  const safeWord: SafeWordRecord = {
    user_id: input.user_id,
    question: input.safe_word_question,
    answer_hint: input.safe_word_answer.trim().slice(0, 1).toUpperCase(),
  };
  guardians.set(input.user_id, guardian);
  safeWords.set(input.user_id, safeWord);
  if (!awsConfigured()) return;
  try {
    await Promise.all([
      dynamo.send(new PutCommand({ TableName: process.env.DYNAMODB_GUARDIANS_TABLE, Item: guardian })),
      dynamo.send(new PutCommand({ TableName: process.env.DYNAMODB_SAFEWORDS_TABLE, Item: safeWord })),
    ]);
  } catch (error) {
    console.warn("DynamoDB setup write failed", error instanceof Error ? error.message : error);
  }
}
