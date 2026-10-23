import { useState } from "react";
import { AlexaPanel } from "./components/AlexaPanel";
import { GuardianPanel } from "./components/GuardianPanel";
import { SetupPanel } from "./components/SetupPanel";
import { useMCP } from "./hooks/useMCP";
import type { ChallengeIdentityResult, GuardianAlertResult, SafeHandoffResult, ScreenSituationResult, VerifyClaimResult } from "./types";

type Tab = "alexa" | "guardian" | "setup";
const userId = "demo_user_001";
const demoPrompt = "The caller says they’re from my bank and I have to move my savings to a safe account immediately. They want my one-time code and say I must not hang up.";

export default function App() {
  const [tab, setTab] = useState<Tab>("alexa");
  const [result, setResult] = useState<ScreenSituationResult | null>(null);
  const [alert, setAlert] = useState<GuardianAlertResult | null>(null);
  const [challenge, setChallenge] = useState<ChallengeIdentityResult | null>(null);
  const [handoff, setHandoff] = useState<SafeHandoffResult | null>(null);
  const [claim, setClaim] = useState<VerifyClaimResult | null>(null);
  const [conversationText, setConversationText] = useState("");
  const { callTool, isLoading, error, clearError } = useMCP();

  const analyze = async (description: string) => {
    clearError();
    setAlert(null);
    try {
      setConversationText(description);
      const response = await callTool<ScreenSituationResult>("screen_situation", { description, channel: "call", claimed_identity: "a bank representative" });
      setResult(response);
      setChallenge(null);
      setHandoff(null);
      if (response.risk_score >= 61) {
        const identity = await callTool<ChallengeIdentityResult>("challenge_identity", { user_id: userId, claimed_identity: "the caller" });
        setChallenge(identity);
      }
    } catch { /* hook owns the visible error */ }
  };

  const quickDemo = () => void analyze(demoPrompt);

  const sendAlert = async () => {
    if (!result) return;
    try {
      const response = await callTool<GuardianAlertResult>("guardian_alert", { user_id: userId, situation_summary: conversationText || "Caller claiming to be the bank requested an urgent transfer and one-time code.", risk_score: result.risk_score, amount_mentioned: "₹50,000" });
      setAlert(response);
    } catch { /* hook owns the visible error */ }
  };

  const runHandoff = async () => {
    try {
      setHandoff(await callTool<SafeHandoffResult>("safe_handoff", { user_message: "I am frightened and do not know what to do.", distress_type: "scam_victim" }));
    } catch { /* hook owns the visible error */ }
  };

  const verifyClaim = async (text: string, category: string) => {
    try {
      setClaim(await callTool<VerifyClaimResult>("verify_claim", { claim: text, category }));
    } catch { /* hook owns the visible error */ }
  };

  return <div className="app-shell"><header className="topbar"><div className="brand" onClick={() => setTab("alexa")} role="button" tabIndex={0}><span className="brand-mark">✦</span><span>safe<span>word</span></span><small>/ Alexa+</small></div><nav className="main-nav" aria-label="Main navigation"><button className={tab === "alexa" ? "active" : ""} onClick={() => setTab("alexa")}><span className="nav-glyph">◉</span> Alexa+</button><button className={tab === "guardian" ? "active" : ""} onClick={() => setTab("guardian")}><span className="nav-glyph">⌁</span> Guardian <span className="nav-dot" /></button><button className={tab === "setup" ? "active" : ""} onClick={() => setTab("setup")}><span className="nav-glyph">⚙</span> Setup</button></nav><div className="top-actions"><span className="connection"><i /> LOCAL MCP CONNECTED</span><div className="top-avatar">P</div></div></header><div className="content-shell">{tab === "alexa" && <AlexaPanel result={result} alert={alert} challenge={challenge} handoff={handoff} claim={claim} conversationText={conversationText} busy={isLoading} mcpError={error} onAnalyze={analyze} onAlert={sendAlert} onQuickDemo={quickDemo} onHandoff={runHandoff} onVerify={verifyClaim} />}{tab === "guardian" && <GuardianPanel />}{tab === "setup" && <SetupPanel />}</div><footer className="app-footer"><span><span className="brand-mark tiny-mark">✦</span> Safeword trust layer</span><span className="mono">MCP / 2025-11-25</span><span>Built for moments that matter.</span></footer></div>;
}
