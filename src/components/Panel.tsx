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

// Matches the "Painel PEX" KPI card model exactly: label row (with an
// optional attention badge), a big mono value with an inline muted
// suffix baseline-aligned next to it, an optional thin progress bar
// (no text riding on it — the suffix already carries that), and an
// optional small caption underneath for the precise figure.
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
  const safeProgress = progress == null ? null : Math.max(0, Math.min(1, progress));
  return (
    <div className="panel-kpi" data-tone={tone}>
      <div className="panel-kpi-top">
        <span className="panel-kpi-label">{label}</span>
        {badge ? <span className="panel-kpi-badge">{badge}</span> : null}
      </div>
      <div className="panel-kpi-value-row">
        <span className="panel-kpi-value">{value}</span>
        {suffix ? <span className="panel-kpi-suffix">{suffix}</span> : null}
      </div>
      {hasProgress ? (
        <div className={`panel-kpi-progress${safeProgress === null ? ' is-empty' : ''}`}>
          <span style={{ width: safeProgress === null ? '0%' : `${safeProgress * 100}%` }} />
        </div>
      ) : null}
      {caption ? <span className="panel-kpi-caption">{caption}</span> : null}
    </div>
  );
}

export function PanelAlert({ tone = 'info', children }: PropsWithChildren<{ tone?: 'info' | 'success' | 'warning' | 'error' }>) {
  return <div className={`panel-alert panel-alert-${tone}`}>{children}</div>;
}
