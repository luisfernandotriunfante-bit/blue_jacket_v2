import type { ReactNode } from 'react';
import { BLUE_JACKET_LOGO } from '../assets/logo';

export type SidebarItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
  onSelect?: () => void;
};

export function Sidebar({ open, onToggle, onClose, items }: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  items: SidebarItem[];
}) {
  return (
    <>
      <button
        type="button"
        className="bj-sidebar-trigger"
        data-open={open ? 'true' : 'false'}
        aria-expanded={open}
        aria-controls="bj-sidebar"
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        onClick={onToggle}
      >
        ☰
      </button>
      {open ? <button type="button" className="bj-sidebar-backdrop" aria-label="Fechar menu" onClick={onClose} /> : null}
      <aside
        id="bj-sidebar"
        className="bj-sidebar"
        data-open={open ? 'true' : 'false'}
        inert={!open}
        aria-hidden={!open}
        aria-label="Navegação principal"
      >
        <div className="bj-sidebar-brand">
          <img className="bj-logo" src={BLUE_JACKET_LOGO} alt="" />
          <div className="bj-sidebar-brand-text">
            <span className="bj-sidebar-brand-name">BLUE JACKET</span>
            <span className="bj-sidebar-brand-tag">Painel comercial · v2</span>
          </div>
        </div>
        <div>
          <div className="bj-sidebar-section-label">Navegação</div>
          <nav className="bj-sidebar-nav">
            {items.map(item => (
              <button
                key={item.id}
                type="button"
                className="bj-sidebar-item"
                aria-current={item.active ? 'page' : undefined}
                onClick={item.onSelect}
              >
                {item.icon ? <span className="bj-sidebar-item-icon">{item.icon}</span> : null}
                <strong>{item.label}</strong>
              </button>
            ))}
          </nav>
        </div>
        <div className="bj-sidebar-footer">
          <span className="bj-sidebar-footer-label">Distribuidor</span>
          <span className="bj-sidebar-footer-value">Milênio</span>
        </div>
      </aside>
    </>
  );
}
