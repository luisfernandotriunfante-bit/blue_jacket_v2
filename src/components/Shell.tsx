import type { ReactNode } from 'react';

export function Header({ eyebrow, title, competence }: { eyebrow: string; title: string; competence?: string }) {
  return (
    <header className="bj-header">
      <div>
        <div className="bj-header-eyebrow">{eyebrow}</div>
        <div className="bj-header-title">{title}</div>
      </div>
      <div className="bj-header-actions">
        <div className="bj-header-chip" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="6" /><line x1="16" y1="16" x2="21" y2="21" /></svg>
          <span>Buscar…</span>
        </div>
        {competence ? (
          <div className="bj-header-chip">
            {competence}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
          </div>
        ) : null}
        <button type="button" className="bj-header-icon-button" aria-label="Notificações">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 12 6 8z" /><path d="M9.5 16a2.5 2.5 0 005 0" /></svg>
        </button>
        <button type="button" className="panel-button panel-button-primary">Exportar</button>
        <div className="bj-header-avatar" aria-hidden="true">MO</div>
      </div>
    </header>
  );
}

export type TopTab = { id: string; label: string };

export function TopTabs({ tabs, activeId, onSelect }: { tabs: TopTab[]; activeId: string; onSelect: (id: string) => void }) {
  if (!tabs.length) return null;
  return (
    <div className="bj-top-tabs" role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          className="bj-top-tab"
          aria-selected={tab.id === activeId}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Content({ children }: { children: ReactNode }) {
  return <div className="bj-content">{children}</div>;
}
