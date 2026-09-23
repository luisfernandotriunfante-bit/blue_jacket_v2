// Leitura genérica de planilhas no navegador (sem backend). Usa a lib xlsx
// (SheetJS) para ler .xls/.xlsx/.csv como arrays de células, e expõe um
// utilitário de detecção de linha de cabeçalho — os relatórios reais têm
// preâmbulos de filtro (ex.: 3 linhas antes do cabeçalho de verdade) e
// nomes de coluna que variam levemente entre exportações.

import * as XLSX from 'xlsx';

export function normalizeHeaderKey(raw: unknown): string {
  const s = String(raw ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // mantém só letras/números
  return s;
}

export function normalizeDoc(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).replace(/\D/g, '');
  return s ? s : null;
}

export async function readWorkbook(file: File): Promise<XLSX.WorkBook> {
  const buffer = await file.arrayBuffer();
  return XLSX.read(buffer, { type: 'array', cellDates: false });
}

/** Retorna a planilha cujo nome bate com algum dos padrões (case-insensitive,
 * substring), ou a primeira planilha do arquivo se nenhuma bater. */
export function pickSheet(workbook: XLSX.WorkBook, nameContainsAny: string[]): XLSX.WorkSheet {
  const lowerNames = workbook.SheetNames.map(n => n.toLowerCase());
  for (const pattern of nameContainsAny) {
    const idx = lowerNames.findIndex(n => n.includes(pattern.toLowerCase()));
    if (idx !== -1) return workbook.Sheets[workbook.SheetNames[idx]];
  }
  return workbook.Sheets[workbook.SheetNames[0]];
}

export function sheetToMatrix(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, blankrows: false });
}

/**
 * Varre as primeiras `scanRows` linhas em busca da linha de cabeçalho real
 * (a que contém alguma das colunas esperadas, ex.: "cnpj"/"cpfcnpj"). Isso
 * lida com preâmbulos de filtro que alguns relatórios trazem antes do
 * cabeçalho de verdade. Retorna os registros já como objetos chaveados
 * pela versão normalizada do cabeçalho.
 */
export function extractRecords(
  matrix: unknown[][],
  expectedHeaderKeys: string[],
  scanRows = 15,
): Record<string, unknown>[] {
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(scanRows, matrix.length); i++) {
    const row = matrix[i] ?? [];
    const normalized = row.map(normalizeHeaderKey);
    if (expectedHeaderKeys.some(key => normalized.includes(key))) {
      headerRowIdx = i;
      break;
    }
  }

  const headerRow = (matrix[headerRowIdx] ?? []).map(normalizeHeaderKey);
  const records: Record<string, unknown>[] = [];
  for (let i = headerRowIdx + 1; i < matrix.length; i++) {
    const row = matrix[i];
    if (!row || row.every(cell => cell === null || cell === undefined || cell === '')) continue;
    const record: Record<string, unknown> = {};
    headerRow.forEach((key, colIdx) => {
      if (!key) return;
      record[key] = row[colIdx] ?? null;
    });
    records.push(record);
  }
  return records;
}
