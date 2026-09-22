import { useState } from 'react';
import { DailyMovementChart } from './DailyMovementChart';
import { DailyPositivityChart } from './DailyPositivityChart';
import type { MovementDay } from '../../lib/mockSellOut';

const WINDOW_DAYS = 10;
const fmtBRL = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtInt = (value: number) => Math.round(value || 0).toLocaleString('pt-BR');
const fmtDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR');
const fmtShortDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

export function DailyMovementWindow({ data, totals }: {
  data: MovementDay[];
  totals: { realized: number; positiveCustomers: number; invoicedPositiveCustomers: number };
}) {
  const calendar = data;
  const latestDate = calendar.length ? calendar[calendar.length - 1].date : '';
  const maxEnd = Math.max(calendar.length - 1, 0);
  const minEnd = Math.min(WINDOW_DAYS - 1, maxEnd);
  const [selectedEndDate, setSelectedEndDate] = useState('');
  const [compact, setCompact] = useState(false);
  const selectedIndex = selectedEndDate ? calendar.findIndex(day => day.date === selectedEndDate) : -1;
  const safeEnd = selectedIndex >= minEnd && selectedIndex <= maxEnd ? selectedIndex : maxEnd;

  if (!calendar.length) return null;

  const startIndex = Math.max(0, safeEnd - (WINDOW_DAYS - 1));
  const visible = calendar.slice(startIndex, safeEnd + 1);
  const isLatest = safeEnd === maxEnd;
  const isEarliest = safeEnd === minEnd;
  const periodStart = visible[0]?.date ?? '';
  const periodEnd = visible[visible.length - 1]?.date ?? '';

  const selectEnd = (index: number) => {
    const target = Math.min(maxEnd, Math.max(minEnd, index));
    setSelectedEndDate(calendar[target]?.date ?? latestDate);
  };
  const move = (direction: number) => selectEnd(safeEnd + direction);
  const goCurrent = () => setSelectedEndDate(latestDate);

  return (
    <div className="chart-window">
      <div className="chart-window-toolbar">
        <div>
          <div className="chart-window-title">Janela sincronizada · {WINDOW_DAYS} dias</div>
          <div className="chart-window-period">{fmtDate(periodStart)} — {fmtDate(periodEnd)}</div>
        </div>
        <div className="chart-window-actions">
          <button type="button" className="chart-nav-button" onClick={() => move(-1)} disabled={isEarliest} aria-label="Voltar um dia">‹</button>
          <button type="button" className="chart-nav-button" onClick={goCurrent} disabled={isLatest}>Atual</button>
          <button type="button" className="chart-nav-button" onClick={() => move(1)} disabled={isLatest} aria-label="Avançar um dia">›</button>
        </div>
      </div>
      <div className="chart-pair">
        <div className="chart-stack">
          <div className="chart-panel">
            <div className="chart-panel-copy">
              <div className="panel-eyebrow">MOVIMENTO FINANCEIRO</div>
              <div className="chart-panel-title">Sell Out diário</div>
            </div>
            <DailyMovementChart data={visible} />
          </div>
          <div className="chart-panel">
            <div className="chart-panel-copy">
              <div className="panel-eyebrow">MOVIMENTO DE POSITIVAÇÃO</div>
              <div className="chart-panel-title">Clientes positivados por dia</div>
            </div>
            <DailyPositivityChart data={visible} />
          </div>
        </div>
        <div className="chart-daily-table">
          <div className="chart-daily-header">
            <div>
              <div className="panel-eyebrow">PLANILHA DIÁRIA</div>
              <div className="panel-section-title">Financeiro + positivação</div>
              <div className="panel-muted" style={{ fontSize: 'var(--bj-font-caption)', marginTop: 3 }}>{fmtShortDate(periodStart)} — {fmtShortDate(periodEnd)}</div>
            </div>
            <button type="button" className="chart-density" aria-pressed={compact} onClick={() => setCompact(value => !value)}>
              {compact ? 'Confortável' : 'Compactar'}
            </button>
          </div>
          <div className={`chart-daily-body${compact ? ' is-compact' : ''}`}>
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th className="is-right">Sell Out</th>
                  <th className="is-right">Faturado</th>
                  <th className="is-right">A Faturar</th>
                  <th className="is-right">Pos. Fat.</th>
                  <th className="is-right">Pos. Total</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(day => (
                  <tr key={day.date}>
                    <td className="is-strong">{fmtShortDate(day.date)}</td>
                    <td className="is-right is-strong">{fmtBRL(day.total)}</td>
                    <td className="is-right is-blue">{fmtBRL(day.invoiced)}</td>
                    <td className="is-right is-green">{fmtBRL(day.toInvoice)}</td>
                    <td className="is-right is-blue">{fmtInt(day.invoicedPositivation)}</td>
                    <td className="is-right">{fmtInt(day.totalPositivation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="chart-daily-footer chart-daily-footer-totals">
            <div><div className="panel-mini-label">Sell Out acumulado</div><div className="panel-mini-value">{fmtBRL(totals.realized)}</div></div>
            <div><div className="panel-mini-label">Positivados acumulados</div><div className="panel-mini-value">{fmtInt(totals.positiveCustomers)}</div></div>
            <div><div className="panel-mini-label">Pos. faturada</div><div className="panel-mini-value">{fmtInt(totals.invoicedPositiveCustomers)}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
