import type { PropsWithChildren, ReactNode } from 'react';

export function PanelPage({ children }: PropsWithChildren<object>) {
  return (
    <div className="bj-page">
      <div className="bj-page-content">{children}</div>
    </div>
  );
}

export function PanelCard({ compact = false, flush = false, className = '', children }: PropsWithChildren<{
  compact?: boolean;
  flush?: boolean;
  className?: string;
}>) {
  const classes = ['panel-card', compact ? 'panel-card-compact' : '', flush ? 'panel-card-flush' : '', className]
    .filter(Boolean)
    .join(' ');
  return <section className={classes}>{children}</section>;
}

export function PanelSectionHeader({ eyebrow, title, description, action }: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel-section-header">
      <div>
        {eyebrow ? <div className="panel-eyebrow">{eyebrow}</div> : null}
        <h2 className="panel-section-title">{title}</h2>
        {description ? <p className="panel-section-description">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

// Radial ring, ported 1:1 from the "Painel PEX" reference's theme-progress
// cards: a 92px SVG donut (r=52, stroke-width 10, round cap) with the
// percentage set in mono text at its center.
const RING_R = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

function KpiRing({ progress }: { progress: number | null }) {
  const safe = progress == null ? null : Math.max(0, Math.min(1, progress));
  const dash = safe == null ? 0 : safe * RING_CIRCUMFERENCE;
  const label = safe == null ? '—' : `${Math.round(safe * 100)}%`;
  return (
    <svg width="92" height="92" viewBox="0 0 120 120" className="panel-kpi-ring" aria-hidden="true">
      <circle cx="60" cy="60" r={RING_R} fill="none" stroke="var(--bj-border)" strokeWidth="10" />
      <circle
        cx="60"
        cy="60"
        r={RING_R}
        fill="none"
        stroke="var(--bj-red)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash.toFixed(1)} ${RING_CIRCUMFERENCE.toFixed(1)}`}
        transform="rotate(-90 60 60)"
      />
      <text x="60" y="67" textAnchor="middle" className="panel-kpi-ring-label">{label}</text>
    </svg>
  );
}

// Matches the "Painel PEX" KPI card model exactly: a circular progress
// ring on the left (percentage set inside it, like the reference's theme
// cards) with the label, value and caption text beside it on the right.
export type PanelKpiProps = {
  label: string;
  value: ReactNode;
  suffix?: ReactNode;
  caption?: ReactNode;
  progress?: number | null;
  tone?: 'default' | 'attention';
  badge?: string;
};

export function PanelKpi({ label, value, suffix, caption, progress, tone = 'default', badge }: PanelKpiProps) {
  const hasProgress = progress !== undefined;
  return (
    <div className="panel-kpi" data-tone={tone}>
      {hasProgress ? <KpiRing progress={progress} /> : null}
      <div className="panel-kpi-body">
        <div className="panel-kpi-top">
          <span className="panel-kpi-label">{label}</span>
          {badge ? <span className="panel-kpi-badge">{badge}</span> : null}
        </div>
        <div className="panel-kpi-value-row">
          <span className="panel-kpi-value">{value}</span>
          {suffix ? <span className="panel-kpi-suffix">{suffix}</span> : null}
        </div>
        {caption ? <span className="panel-kpi-caption">{caption}</span> : null}
      </div>
    </div>
  );
}

export function PanelAlert({ tone = 'info', children }: PropsWithChildren<{ tone?: 'info' | 'success' | 'warning' | 'error' }>) {
  return <div className={`panel-alert panel-alert-${tone}`}>{children}</div>;
}
