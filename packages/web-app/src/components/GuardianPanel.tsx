import { useEffect, useState } from "react";
import { fetchAlerts, updateAlert } from "../hooks/useMCP";
import type { AlertRecord } from "../types";

const demoUser = "demo_user_001";

export function GuardianPanel() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    try { setError(null); setAlerts((await fetchAlerts(demoUser)).alerts); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load alerts"); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 5000); return () => window.clearInterval(timer); }, []);

  const resolve = async (id: string, status: "APPROVED" | "BLOCKED") => {
    setUpdating(id);
    try { const updated = await updateAlert(id, status, demoUser); if (updated) setAlerts((current) => current.map((item) => item.alert_id === id ? updated : item)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update alert"); }
    finally { setUpdating(null); }
  };

  return <div className="dashboard-page"><div className="page-intro guardian-intro"><div><span className="eyebrow">GUARDIAN / OVERSIGHT</span><h1>A calm second opinion.</h1><p>Review flagged moments and give a clear next step when someone you love needs it.</p></div><button className="button button-quiet" onClick={() => void load()}><span className={loading ? "spin" : ""}>↻</span> Refresh <span className="mono tiny">5s</span></button></div>
    <div className="guardian-summary"><div className="summary-stat"><span className="eyebrow">OPEN ALERTS</span><strong>{alerts.filter((alert) => alert.status === "PENDING").length.toString().padStart(2, "0")}</strong><small>Need your review</small></div><div className="summary-stat"><span className="eyebrow">PROTECTED USER</span><strong className="summary-name">Grandma Parvathi</strong><small>Demo profile · connected</small></div><div className="summary-stat summary-connected"><span className="connected-dot" /> Notifications active</div></div>
    {error && <div className="error-banner"><span>!</span><div><strong>Guardian feed unavailable</strong><p>{error}. Alerts will appear here once the backend is connected.</p></div></div>}
    <section className="card alerts-card"><div className="card-heading"><div><span className="eyebrow">ALERT INBOX</span><h3>Recent situations</h3></div><span className="mono tiny muted">LIVE POLLING</span></div>{loading ? <div className="loading-state"><span className="spinner dark" />Checking for alerts…</div> : alerts.length === 0 ? <div className="empty-dashboard"><div>✓</div><strong>All clear for now</strong><p>When Alexa+ needs a second opinion, the alert will show up here.</p></div> : <div className="alert-table">{alerts.map((alert) => <AlertRow alert={alert} key={alert.alert_id} onResolve={resolve} updating={updating === alert.alert_id} />)}</div>}</section>
  </div>;
}

function AlertRow({ alert, onResolve, updating }: { alert: AlertRecord; onResolve: (id: string, status: "APPROVED" | "BLOCKED") => void; updating: boolean }) {
  const date = new Date(alert.timestamp);
  return <article className="alert-row"><div className={`alert-severity severity-${alert.risk_level.toLowerCase()}`}><span>{alert.risk_score}</span><small>RISK</small></div><div className="alert-details"><div className="alert-row-top"><span className={`level-tag tag-${alert.risk_level.toLowerCase()}`}>{alert.risk_level}</span><span className="mono tiny muted">{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div><strong>{alert.situation_summary}</strong><p>{alert.guardian_name} · {alert.amount_mentioned ? `Amount mentioned: ${alert.amount_mentioned}` : "No amount detected"}</p></div><div className="alert-actions">{alert.status === "PENDING" ? <><button className="button button-approve" disabled={updating} onClick={() => onResolve(alert.alert_id, "APPROVED")}>✓ Approve</button><button className="button button-block" disabled={updating} onClick={() => onResolve(alert.alert_id, "BLOCKED")}>Block</button></> : <span className={`resolved-tag resolved-${alert.status.toLowerCase()}`}>{alert.status === "APPROVED" ? "✓ Approved" : "Blocked"}</span>}</div></article>;
}
