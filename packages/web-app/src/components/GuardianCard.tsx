import type { GuardianAlertResult } from "../types";

interface GuardianCardProps {
  alert: GuardianAlertResult | null;
  onAlert: () => void;
  disabled?: boolean;
}

export function GuardianCard({ alert, onAlert, disabled }: GuardianCardProps) {
  return (
    <section className="card guardian-card">
      <div className="card-heading">
        <div>
          <span className="eyebrow">TRUSTED CONTACT</span>
          <h3>Guardian shield</h3>
        </div>
        <span className={`status-dot ${alert ? "status-dot-live" : ""}`}><i />{alert ? "Alert sent" : "Standing by"}</span>
      </div>
      <div className="guardian-profile">
        <div className="avatar avatar-guardian">P</div>
        <div><strong>Priya</strong><span>Daughter · +91 99999 99999</span></div>
        <span className="lock-icon">⌁</span>
      </div>
      {alert ? (
        <div className="alert-sent">
          <div className="alert-sent-icon">✓</div>
          <div><strong>Priya has been notified</strong><p>{alert.message}</p></div>
        </div>
      ) : (
        <p className="muted small-copy">Your guardian can review a flagged call before you take the next step.</p>
      )}
      <button className="button button-danger button-full" onClick={onAlert} disabled={disabled || Boolean(alert)}>
        <span>⌁</span>{alert ? "Guardian notified" : "Alert guardian now"}
      </button>
    </section>
  );
}
