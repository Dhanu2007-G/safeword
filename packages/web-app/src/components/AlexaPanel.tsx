import { useState } from "react";
import type { FormEvent } from "react";
import { GuardianCard } from "./GuardianCard";
import { RiskRing } from "./RiskRing";
import { SignalChip } from "./SignalChip";
import type { ChallengeIdentityResult, GuardianAlertResult, RiskLevel, SafeHandoffResult, ScreenSituationResult, VerifyClaimResult } from "../types";

interface AlexaPanelProps {
  result: ScreenSituationResult | null;
  alert: GuardianAlertResult | null;
  challenge: ChallengeIdentityResult | null;
  handoff: SafeHandoffResult | null;
  claim: VerifyClaimResult | null;
  conversationText: string;
  busy: boolean;
  mcpError: string | null;
  onAnalyze: (description: string) => void;
  onAlert: () => void;
  onQuickDemo: () => void;
  onHandoff: () => void;
  onVerify: (claim: string, category: string) => void;
}

export function AlexaPanel({ result, alert, challenge, handoff, claim, conversationText, busy, mcpError, onAnalyze, onAlert, onQuickDemo, onHandoff, onVerify }: AlexaPanelProps) {
  const [description, setDescription] = useState("");
  const [claimText, setClaimText] = useState("Drinking this herbal tea will cure my diabetes immediately.");
  const score = result?.risk_score ?? 0;
  const level: RiskLevel = result?.risk_level ?? "LOW";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (description.trim().length >= 10) onAnalyze(description.trim());
  };

  return (
    <div className="page-grid alexa-grid">
      <main>
        <div className="page-intro">
          <div><span className="eyebrow">ALEXA+ / LIVE COMPANION</span><h1>Stay one step ahead.</h1><p>Alexa+ listens for the little signals that make a high-stakes moment feel wrong.</p></div>
          <div className="live-pill"><i />SYSTEM ONLINE</div>
        </div>
        <section className="card conversation-card">
          <div className="conversation-top"><span className="eyebrow">ACTIVE CONVERSATION</span><span className="mono tiny">VOICE SESSION · 09:41</span></div>
          <div className="bubbles">
            <div className="bubble bubble-alexa"><div className="mini-avatar">✦</div><div><span className="bubble-meta">ALEXA+ <em>just now</em></span><p>Hi, I’m here with you. Tell me what’s happening.</p></div></div>
             {result ? <div className="bubble bubble-user"><div><span className="bubble-meta">YOU <em>just now</em></span><p>{conversationText}</p></div><div className="mini-avatar user-avatar">Y</div></div> : <div className="conversation-empty"><span>✦</span><p>Describe a call, text, or encounter to begin screening.</p></div>}
             {result && <div className="bubble bubble-alexa bubble-result"><div className="mini-avatar">✦</div><div><span className="bubble-meta">ALEXA+ <em>analyzed now</em></span><p>{result.recommendation}</p></div></div>}
             {challenge && <div className="bubble bubble-alexa bubble-result"><div className="mini-avatar">?</div><div><span className="bubble-meta">IDENTITY CHALLENGE <em>private question</em></span><p>{challenge.instruction}</p></div></div>}
          </div>
          <form className="composer" onSubmit={submit}>
            <textarea aria-label="Describe a situation" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What did they say? Paste a message or describe the call…" rows={2} />
            <div className="composer-bottom"><span className="muted tiny">Your words stay within this session.</span><button className="button button-primary" disabled={busy || description.trim().length < 10}>{busy ? <><span className="spinner" />Analyzing</> : <>Analyze situation <span>↗</span></>}</button></div>
          </form>
        </section>
        {!result && <button className="demo-banner" onClick={onQuickDemo}><span className="demo-icon">▶</span><span><strong>Try the scam scenario</strong><small>Run a realistic bank impersonation demo in one click</small></span><b>↗</b></button>}
        {mcpError && <div className="error-banner"><span>!</span><div><strong>Couldn’t reach the Safeword service</strong><p>{mcpError}. Start the MCP server on port 3000, then try again.</p></div></div>}
        {challenge && <section className="card challenge-card"><span className="eyebrow">VOICE-CLONE RESISTANT</span><h3>Ask the private question</h3><p>{challenge.challenge_question ?? challenge.instruction}</p><small>Never reveal the expected answer. If they cannot answer, stop the call.</small></section>}
        {handoff && <section className="card handoff-card"><span className="eyebrow">SAFE HANDOFF</span><h3>{handoff.calm_response}</h3><p><strong>{handoff.resource_name}</strong>{handoff.resource_contact ? ` · ${handoff.resource_contact}` : ""}</p><small>{handoff.resource_note}</small><ul>{handoff.immediate_actions.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul></section>}
        <section className="card tools-card"><div className="card-heading"><div><span className="eyebrow">TRUST LAYER TOOLS</span><h3>More ways Safeword helps</h3></div></div><div className="tool-actions"><button className="button button-quiet" onClick={onHandoff} disabled={busy}>I need a calm handoff</button><div className="claim-check"><input value={claimText} onChange={(event) => setClaimText(event.target.value)} aria-label="Claim to verify" /><button className="button button-quiet" onClick={() => onVerify(claimText, "health")} disabled={busy || claimText.trim().length < 5}>Verify claim</button></div></div>{claim && <div className="claim-result"><strong>{claim.verdict} · {claim.confidence_score}/100</strong><p>{claim.safe_response}</p></div>}</section>
      </main>
      <aside className="right-rail">
        <section className={`card status-card status-${level.toLowerCase()}`}>
          <div className="card-heading"><div><span className="eyebrow">ALEXA+ PROTECTION</span><h3>Listening for signals</h3></div><span className="wave-mark">◌</span></div>
          <div className="ring-wrap"><RiskRing score={score} level={level} active={Boolean(result)} /></div>
          <div className="status-copy"><strong>{result ? (result.safe_to_proceed ? "Pause and verify" : "Do not proceed") : "Ready when you are"}</strong><span>{result ? result.explanation : "Alexa+ is monitoring for pressure, urgency, and identity claims."}</span></div>
          <div className="meter"><span style={{ width: `${score}%` }} /></div><div className="meter-labels"><span>SAFE</span><span>HIGH RISK</span></div>
        </section>
        <section className="card signals-card"><div className="card-heading"><div><span className="eyebrow">DETECTED SIGNALS</span><h3>{result ? `${result.detected_signals.length} patterns found` : "Nothing flagged yet"}</h3></div><span className="signal-count">{result ? result.detected_signals.length : 0}</span></div>{result ? <div className="signal-list">{result.detected_signals.map((signal) => <SignalChip label={signal} key={signal} />)}</div> : <p className="muted small-copy">Run a scan to see urgency, payment, and impersonation patterns here.</p>}</section>
        <GuardianCard alert={alert} onAlert={onAlert} disabled={busy || !result} />
      </aside>
    </div>
  );
}
