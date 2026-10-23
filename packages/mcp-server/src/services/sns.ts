import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { awsConfigured } from "./bedrock.js";

const sns = new SNSClient({ region: process.env.AWS_REGION });

export async function publishAlert(topicArn: string, message: string, subject: string): Promise<boolean> {
  if (!awsConfigured()) return false;
  try {
    await sns.send(new PublishCommand({
      TopicArn: topicArn,
      Message: message,
      Subject: `SAFEWORD: ${subject}`,
    }));
    return true;
  } catch (error) {
    console.warn("SNS publish failed", error instanceof Error ? error.message : error);
    return false;
  }
}
