// Shared number/currency formatters used across KPI cards and charts.

export const currencyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const numberFmt = new Intl.NumberFormat('pt-BR');
export const percentFmt = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

// Compact BRL, matching the "Painel PEX" KPI card model: a short mono
// number (e.g. "R$ 1,65 mi") is what sits big inside the card; the exact
// value belongs in a caption underneath, not in the headline number.
export function compactBRL(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mi`;
  if (abs >= 1_000) return `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  return `R$ ${Math.round(value).toLocaleString('pt-BR')}`;
}
