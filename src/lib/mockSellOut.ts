// Mock data for the Sell Out "Resumo" visual shell. No motor is wired up
// yet — these numbers only exist to prove the layout, the 10-day sliding
// window and the line-by-line breakdown actually work end to end.

export type MovementDay = {
  date: string;
  invoiced: number;
  toInvoice: number;
  total: number;
  invoicedPositivation: number;
  totalPositivation: number;
};

export type LineRow = { line: string; realized: number; invoiced: number; toInvoice: number; share: number };

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

export function buildMockDailyRows(competence = '2026-09'): MovementDay[] {
  const rand = seededRandom(42);
  const [year, month] = competence.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;

  const rows: MovementDay[] = [];
  let cumulativePositivation = 0;
  for (let day = 1; day <= lastDay; day++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const weekendDamp = weekday === 0 ? 0.15 : weekday === 6 ? 0.55 : 1;
    const base = (68000 + rand() * 42000) * weekendDamp;
    const invoiced = base * (0.55 + rand() * 0.2);
    const toInvoice = base - invoiced;
    const dayPositivation = Math.round((6 + rand() * 14) * weekendDamp);
    cumulativePositivation += dayPositivation;
    const invoicedPositivation = Math.round(dayPositivation * (0.5 + rand() * 0.3));
    rows.push({
      date,
      invoiced: Math.round(invoiced),
      toInvoice: Math.round(toInvoice),
      total: Math.round(base),
      invoicedPositivation,
      totalPositivation: Math.min(cumulativePositivation, 420),
    });
  }
  return rows;
}

export function buildMockLineRows(): LineRow[] {
  const raw: { line: string; realized: number; invoiced: number }[] = [
    { line: 'Higiene Oral', realized: 612480, invoiced: 401600 },
    { line: 'Higiene Pessoal', realized: 388900, invoiced: 265200 },
    { line: 'Home Care', realized: 274150, invoiced: 190300 },
    { line: 'Nutrição de Pele', realized: 118600, invoiced: 79800 },
    { line: 'Profissional', realized: 61870, invoiced: 40200 },
  ];
  const total = raw.reduce((sum, item) => sum + item.realized, 0);
  return raw.map(item => ({
    line: item.line,
    realized: item.realized,
    invoiced: item.invoiced,
    toInvoice: item.realized - item.invoiced,
    share: total ? item.realized / total : 0,
  }));
}

export function buildMockTotals(rows: MovementDay[]) {
  const realized = rows.reduce((sum, day) => sum + day.total, 0);
  const invoiced = rows.reduce((sum, day) => sum + day.invoiced, 0);
  const positiveCustomers = rows.length ? rows[rows.length - 1].totalPositivation : 0;
  const invoicedPositiveCustomers = Math.round(positiveCustomers * 0.62);
  return {
    realized,
    invoiced,
    sellOutTarget: 1650000,
    positivityTarget: 460,
    positiveCustomers,
    invoicedPositiveCustomers,
    salesAchievement: realized / 1650000,
    invoicedShare: realized ? invoiced / realized : null,
    positivityAchievement: positiveCustomers / 460,
    invoicedPositivityAchievement: invoicedPositiveCustomers / 460,
  };
}
