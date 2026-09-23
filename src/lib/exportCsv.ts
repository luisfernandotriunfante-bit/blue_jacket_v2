// Export CSV genérico (client-side, sem backend) para permitir tirar a
// base consolidada do Motor de Clientes do navegador quando necessário.

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const columns = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach(k => set.add(k));
    return set;
  }, new Set<string>()));

  function escapeCell(value: unknown): string {
    if (value === null || value === undefined) return '';
    const s = Array.isArray(value) ? value.join('|') : String(value);
    if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  const lines = [columns.join(';'), ...rows.map(row => columns.map(c => escapeCell(row[c])).join(';'))];
  const csv = '﻿' + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
