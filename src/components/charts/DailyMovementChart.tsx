import { signedChartDomain } from './signedChartDomain';
import type { MovementDay } from '../../lib/mockSellOut';

const compactBRL = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  if (abs >= 1_000) return `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`;
  return `R$ ${Math.round(value).toLocaleString('pt-BR')}`;
};

function linePath(values: number[], x: (index: number) => number, y: (value: number) => number) {
  return values.map((value, index) => `${index === 0 ? 'M' : 'L'} ${x(index).toFixed(2)} ${y(value).toFixed(2)}`).join(' ');
}

export function DailyMovementChart({ data }: { data: MovementDay[] }) {
  if (!data.length) return null;

  const width = 560;
  const height = 220;
  const pad = { top: 16, right: 16, bottom: 30, left: 64 };
  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const domain = signedChartDomain(data.flatMap(item => [item.total, item.invoiced, item.toInvoice]));
  const x = (index: number) => pad.left + (index / Math.max(data.length - 1, 1)) * innerWidth;
  const y = (value: number) => pad.top + innerHeight - ((value - domain.min) / (domain.max - domain.min)) * innerHeight;
  const totalPath = linePath(data.map(item => item.total), x, y);
  const invoicedPath = linePath(data.map(item => item.invoiced), x, y);
  const toInvoicePath = linePath(data.map(item => item.toInvoice), x, y);
  const totalArea = `${totalPath} L ${x(data.length - 1).toFixed(2)} ${y(0).toFixed(2)} L ${x(0).toFixed(2)} ${y(0).toFixed(2)} Z`;
  const grid = [0, 0.25, 0.5, 0.75, 1];
  const labelStep = data.length > 8 ? 2 : 1;

  return (
    <div>
      <div className="chart-legend-row">
        <span className="panel-mini-label">Gráfico do movimento</span>
        <div className="chart-legends">
          <Legend color="var(--bj-red)" label="Sell Out" />
          <Legend color="var(--bj-blue)" label="Faturado" />
          <Legend color="var(--bj-green)" label="A Faturar" dashed />
        </div>
      </div>
      <div className="chart-canvas-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfico diário de faturado, a faturar e Sell Out" className="chart-svg">
          <defs>
            <linearGradient id="movement-total-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--bj-red)" stopOpacity="0.24" />
              <stop offset="100%" stopColor="var(--bj-red)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {grid.map(level => {
            const value = domain.min + (domain.max - domain.min) * level;
            const gy = y(value);
            return (
              <g key={level}>
                <line x1={pad.left} y1={gy} x2={width - pad.right} y2={gy} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                <text x={pad.left - 10} y={gy + 4} textAnchor="end" fill="var(--bj-muted-2)" fontSize="9">{compactBRL(value)}</text>
              </g>
            );
          })}
          <line x1={pad.left} x2={width - pad.right} y1={y(0)} y2={y(0)} stroke="var(--bj-muted-2)" strokeOpacity="0.5" />
          <path d={totalArea} fill="url(#movement-total-area)" />
          <path d={totalPath} fill="none" stroke="var(--bj-red)" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
          <path d={invoicedPath} fill="none" stroke="var(--bj-blue)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <path d={toInvoicePath} fill="none" stroke="var(--bj-green)" strokeWidth="2" strokeDasharray="6 4" strokeLinejoin="round" strokeLinecap="round" />
          {data.map((item, index) => (
            <g key={item.date}>
              <circle cx={x(index)} cy={y(item.total)} r="3" fill="var(--bj-red)" stroke="var(--bj-card)" strokeWidth="1.3" />
              {(index % labelStep === 0 || index === data.length - 1) ? (
                <text x={x(index)} y={height - 12} textAnchor="middle" fill="var(--bj-muted-2)" fontSize="9">
                  {new Date(`${item.date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function Legend({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="chart-legend">
      <span className="chart-legend-line" style={{ borderTopColor: color, borderTopStyle: dashed ? 'dashed' : 'solid' }} />
      {label}
    </span>
  );
}
