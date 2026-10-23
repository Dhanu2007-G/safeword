import type { CSSProperties } from "react";
import type { RiskLevel } from "../types";

interface RiskRingProps {
  score: number;
  level: RiskLevel;
  active?: boolean;
}

const labels: Record<RiskLevel, string> = {
  LOW: "Clear",
  MEDIUM: "Caution",
  HIGH: "High risk",
  CRITICAL: "Critical",
};

export function RiskRing({ score, level, active = false }: RiskRingProps) {
  const safeScore = Math.min(100, Math.max(0, score));
  const color = level === "CRITICAL" || level === "HIGH" ? "#ff5f72" : level === "MEDIUM" ? "#ffbf69" : "#50e3b2";
  return (
    <div className={`risk-ring risk-${level.toLowerCase()} ${active ? "is-active" : ""}`} style={{ "--ring-color": color, "--score": `${safeScore * 3.6}deg` } as CSSProperties}>
      <div className="risk-ring-inner">
        <span className="ring-kicker">RISK SCORE</span>
        <strong>{Math.round(safeScore)}</strong>
        <span className="ring-label">{labels[level]}</span>
      </div>
    </div>
  );
}
