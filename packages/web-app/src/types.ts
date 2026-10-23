export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AlertStatus = "PENDING" | "APPROVED" | "BLOCKED";

export interface ScreenSituationResult {
  risk_score: number;
  detected_signals: string[];
  risk_level: RiskLevel;
  explanation: string;
  recommendation: string;
  safe_to_proceed: boolean;
}

export interface GuardianAlertResult {
  alert_id: string;
  guardian_notified: boolean;
  guardian_name: string;
  status: "SENT" | "FAILED" | "PENDING";
  message: string;
  timestamp: string;
}

export interface ChallengeIdentityResult {
  has_safe_word: boolean;
  challenge_question: string | null;
  expected_answer_hint: string | null;
  instruction: string;
}

export interface VerifyClaimResult {
  confidence_score: number;
  verdict: "VERIFIED" | "LIKELY_TRUE" | "UNCERTAIN" | "LIKELY_FALSE" | "FALSE";
  explanation: string;
  safe_response: string;
  should_flag: boolean;
  sources_mentioned: string[];
}

export interface SafeHandoffResult {
  calm_response: string;
  resource_name: string;
  resource_contact: string | null;
  resource_type: "call" | "web" | "action";
  resource_note: string;
  immediate_actions: string[];
  do_not_do: string[];
}

export interface AlertRecord {
  alert_id: string;
  user_id: string;
  situation_summary: string;
  risk_score: number;
  risk_level: RiskLevel;
  amount_mentioned: string | null;
  timestamp: string;
  status: AlertStatus;
  guardian_name: string;
  guardian_phone: string | null;
}

export interface SetupValues {
  user_id: string;
  user_name: string;
  guardian_name: string;
  guardian_phone: string;
  safe_word_question: string;
  safe_word_answer: string;
}
