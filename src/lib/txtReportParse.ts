// Leitura de relatórios legados em texto puro (impressão de ERP antigo,
// largura fixa, sem separador estruturado) — usados pelo Motor Histórico
// (Motor 3). Diferente de xlsxParse.ts (planilhas .xls/.xlsx/.csv), aqui o
// arquivo é .txt e cada "coluna" é reconhecida por padrão (data, número,
// código), não por posição de célula.

/** Lê um File como texto puro (utf-8/latin1 tanto faz para dígitos/datas). */
export async function readTextFile(file: File): Promise<string> {
  return file.text();
}

/** Número no formato BR (1.234,56), com sufixo "-" opcional indicando
 * negativo (notação usada nos relatórios de compras/devolução). */
export function numBR(raw: string | undefined | null): number {
  if (!raw) return 0;
  let s = raw.trim();
  if (!s) return 0;
  let neg = false;
  if (s.endsWith('-')) {
    neg = true;
    s = s.slice(0, -1);
  }
  s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return neg ? -n : n;
}

/** Data BR (DD/MM/AAAA ou DD/MM/AA) → { iso, competencia }. Ano de 2 dígitos
 * é sempre lido como 20XX (todos os relatórios envolvidos são de 2025/2026). */
export function parseDataBR(raw: string | undefined | null): { iso: string; competencia: string } | null {
  if (!raw) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/.exec(raw.trim());
  if (!m) return null;
  const [, dd, mm, yy] = m;
  const year = yy.length === 2 ? 2000 + Number(yy) : Number(yy);
  return { iso: `${year}-${mm}-${dd}`, competencia: `${year}-${mm}` };
}

/** Normaliza um código de produto (remove zeros à esquerda) para casar com
 * o codigoInterno usado pelo Motor de Produtos (mesma convenção do
 * codigoKey em motorProdutos.ts). */
export function codigoKey(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  return String(Number(digits));
}
