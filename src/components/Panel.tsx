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

export type PanelKpiProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  progress?: number | null;
  progressLabel?: string;
  tone?: 'default' | 'attention';
};

export function PanelKpi({ label, value, detail, progress, progressLabel, tone = 'default' }: PanelKpiProps) {
  const hasProgress = progress !== undefined;
  const safeProgress = progress == null ? null : Math.max(0, Math.min(1, progress));
  return (
    <div className="panel-kpi" data-tone={tone}>
      <div className="panel-kpi-head">
        <span className="panel-kpi-label">{label}</span>
      </div>
      <span className="panel-kpi-value">{value}</span>
      {detail ? <span className="panel-kpi-detail">{detail}</span> : null}
      {hasProgress ? (
        <>
          {progressLabel ? <span className="panel-kpi-progress-copy">{progressLabel}</span> : null}
          <div className={`panel-kpi-progress${safeProgress === null ? ' is-empty' : ''}`}>
            <span style={{ width: safeProgress === null ? '0%' : `${safeProgress * 100}%` }} />
          </div>
        </>
      ) : null}
    </div>
  );
}

export function PanelAlert({ tone = 'info', children }: PropsWithChildren<{ tone?: 'info' | 'success' | 'warning' | 'error' }>) {
  return <div className={`panel-alert panel-alert-${tone}`}>{children}</div>;
}
