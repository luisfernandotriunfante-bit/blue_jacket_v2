// Motor de Movimentações (Motor 4) — cobre toda movimentação pós-virada do
// ERP: carteira de pedidos com a indústria, entrada de notas, vendas (com
// devoluções/bonificações) e cortes de pedido. Ver o comentário de cada
// tipo em motorMovimentacoesTypes.ts para a semântica de atualização de
// cada fonte (a carteira substitui; as demais acumulam por competência).
//
// Ordem de construção (definida com o usuário): Carteira → Entrada de
// notas (218) → Vendas (8022) → Corte (1454). As três últimas ainda não
// foram implementadas nesta primeira etapa.

import type {
  CarteiraItem,
  EntradaNotaItem,
  MotorCarteiraResumo,
  MotorEntradaNotasResumo,
} from '../data/motorMovimentacoesTypes';
import { excelDateToISO, extractRecords, pickSheet, readWorkbook, sheetToMatrix } from './xlsxParse';

function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s ? s : undefined;
}

function num(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

// Célula de uma linha "crua" (matriz sheetToMatrix) por índice de coluna —
// usado pelos parsers de relatório impresso/agrupado (Entrada de notas,
// e futuramente Corte), que não têm cabeçalho tabular e precisam ler por
// posição fixa de coluna.
function cell(row: unknown[] | undefined, idx: number): unknown {
  return row ? row[idx] : undefined;
}

function cellStr(row: unknown[] | undefined, idx: number): string {
  return str(cell(row, idx)) ?? '';
}

// ---------------------------------------------------------------- Carteira

export async function processarCarteira(file: File): Promise<{ itens: CarteiraItem[]; resumo: MotorCarteiraResumo }> {
  const wb = await readWorkbook(file);
  const sheet = pickSheet(wb, ['data', 'carteira']);
  const matrix = sheetToMatrix(sheet);
  const records = extractRecords(matrix, ['material', 'ordernumber']);

  const itens: CarteiraItem[] = [];
  for (const rec of records) {
    const material = str(rec.material);
    const orderNumber = str(rec.ordernumber);
    const customerNumber = str(rec.customernumber);
    if (!material || !orderNumber || !customerNumber) continue; // linha inválida/rodapé

    const orderQty = num(rec.orderqty);
    const billQty = num(rec.billqty);
    const qtyPendente = Math.max(0, orderQty - billQty);
    const status: CarteiraItem['status'] = billQty <= 0 ? 'pendente' : qtyPendente > 0 ? 'parcial' : 'completo';

    itens.push({
      orderDate: excelDateToISO(rec.orderdate),
      customerNumber,
      customerName: str(rec.customername),
      orderNumber,
      material,
      descricao: str(rec.description),
      orderQty,
      billQty,
      qtyPendente,
      valorLiquido: num(rec.netvaluezinv),
      notaFiscalNumber: str(rec.notafiscalnumber),
      billingType: str(rec.billingtype),
      billingDate: excelDateToISO(rec.billingdate),
      pesoBrutoKg: num(rec.grossweight) || undefined,
      status,
    });
  }

  const pendentes = itens.filter(i => i.status === 'pendente').length;
  const parciais = itens.filter(i => i.status === 'parcial').length;
  const completos = itens.filter(i => i.status === 'completo').length;
  const qtyPendenteTotal = itens.reduce((s, i) => s + i.qtyPendente, 0);
  const valorPendenteTotal = itens.reduce((s, i) => {
    if (i.qtyPendente <= 0 || i.orderQty <= 0) return s;
    return s + (i.valorLiquido * i.qtyPendente) / i.orderQty;
  }, 0);

  const resumo: MotorCarteiraResumo = {
    totalItens: itens.length,
    pendentes,
    parciais,
    completos,
    qtyPendenteTotal: Math.round(qtyPendenteTotal * 100) / 100,
    valorPendenteTotal: Math.round(valorPendenteTotal * 100) / 100,
    processadoEm: new Date().toISOString(),
  };

  return { itens, resumo };
}

// --------------------------------------------------------- Entrada de notas

// Relatório 218: bloco por nota fiscal (cabeçalho + 1 linha de dados),
// seguido de sub-bloco de produtos (1+ linhas) e sub-bloco de C.Pagar (1
// linha). Não tem cabeçalho tabular único — é lido por posição fixa de
// coluna nas linhas de DADOS (os cabeçalhos impressos têm colunas
// deslocadas por causa de células mescladas, então são só decorativos).
export async function processarEntradaNotas(file: File): Promise<{ itens: EntradaNotaItem[] }> {
  const wb = await readWorkbook(file);
  const sheet = pickSheet(wb, ['report', 'entrada']);
  const matrix = sheetToMatrix(sheet) as unknown[][];

  const itens: EntradaNotaItem[] = [];
  let i = 0;
  while (i < matrix.length) {
    const row = matrix[i];
    if (cellStr(row, 0) !== 'Dt. Entrada') {
      i++;
      continue;
    }

    const dataRow = matrix[i + 1];
    const notaFiscal = cellStr(dataRow, 4).replace(/^\*/, '');
    const transEntrada = num(cell(dataRow, 1));
    if (!notaFiscal || !transEntrada) {
      i += 1; // cabeçalho sem linha de dados válida — pula só ele
      continue;
    }

    const invoice = {
      dtEntrada: excelDateToISO(cell(dataRow, 0)),
      transEntrada,
      notaFiscal,
      tipoEntrada: str(cell(dataRow, 5)),
      serie: str(cell(dataRow, 7)),
      dtEmissao: excelDateToISO(cell(dataRow, 8)),
      prazoEntrega: num(cell(dataRow, 9)) || undefined,
      filial: str(cell(dataRow, 10)),
      codFornecedor: num(cell(dataRow, 11)) || undefined,
      fornecedor: str(cell(dataRow, 12)),
      cgc: str(cell(dataRow, 18)),
      uf: str(cell(dataRow, 20)),
      valorTotalNota: num(cell(dataRow, 21)),
      valorIpi: num(cell(dataRow, 23)),
    };
    i += 2; // pula cabeçalho + linha de dados da nota

    // acha o sub-cabeçalho de produtos ("Código"/"Produto"), tolerando
    // eventuais linhas em branco (quebra de página do relatório impresso)
    while (i < matrix.length && cellStr(matrix[i], 0) !== 'Dt. Entrada' && !(cellStr(matrix[i], 4) === 'Código' && cellStr(matrix[i], 5) === 'Produto')) {
      i++;
    }
    if (i >= matrix.length || cellStr(matrix[i], 0) === 'Dt. Entrada') continue; // bloco sem produtos — nota descartada
    i++; // pula o sub-cabeçalho

    const produtos: Array<
      Pick<
        EntradaNotaItem,
        | 'codigoInterno'
        | 'produto'
        | 'filialProduto'
        | 'embalagem'
        | 'un'
        | 'qtd'
        | 'precoUnit'
        | 'custoFinAnterior'
        | 'custoFinAtual'
        | 'codigoFiscal'
        | 'codigoOperacao'
      >
    > = [];

    while (i < matrix.length) {
      const r = matrix[i];
      if (cellStr(r, 4) === 'C.Pagar:') break;
      if (cellStr(r, 0) === 'Dt. Entrada') break;
      const codigo = cell(r, 4);
      if (codigo !== null && codigo !== undefined && codigo !== '' && Number.isFinite(Number(codigo))) {
        produtos.push({
          codigoInterno: String(codigo).trim(),
          produto: str(cell(r, 5)),
          filialProduto: str(cell(r, 10)),
          embalagem: str(cell(r, 12)),
          un: str(cell(r, 14)),
          qtd: num(cell(r, 15)),
          precoUnit: num(cell(r, 17)),
          custoFinAnterior: num(cell(r, 18)) || undefined,
          custoFinAtual: num(cell(r, 20)) || undefined,
          codigoFiscal: str(cell(r, 21)),
          codigoOperacao: str(cell(r, 23)),
        });
      }
      i++;
    }

    let cPagarNrLanc: number | undefined;
    let cPagarValor: number | undefined;
    let cPagarDtVenc: string | undefined;
    let cPagarPrazo: number | undefined;
    let cPagarIndice: string | undefined;
    if (i < matrix.length && cellStr(matrix[i], 4) === 'C.Pagar:') {
      const payRow = matrix[i + 1];
      cPagarNrLanc = num(cell(payRow, 6)) || undefined;
      cPagarValor = num(cell(payRow, 14)) || undefined;
      cPagarDtVenc = excelDateToISO(cell(payRow, 16));
      cPagarPrazo = num(cell(payRow, 18)) || undefined;
      cPagarIndice = str(cell(payRow, 19));
      i += 2;
    }

    for (const p of produtos) {
      itens.push({ ...invoice, ...p, cPagarNrLanc, cPagarValor, cPagarDtVenc, cPagarPrazo, cPagarIndice });
    }
  }

  return { itens };
}

// Recalcula o resumo a partir da lista JÁ MESCLADA (histórico acumulado +
// upload novo) — diferente da Carteira, o resumo da Entrada de notas não
// nasce pronto no processamento do arquivo, porque depende do que já foi
// acumulado antes. Ver useEntradaNotas em motorMovimentacoesStore.ts.
export function resumirEntradaNotas(itens: EntradaNotaItem[]): MotorEntradaNotasResumo {
  const chaveDe = (it: EntradaNotaItem) => `${it.notaFiscal}|${it.transEntrada}`;
  const vistos = new Set<string>();
  let valorTotalNotas = 0;
  for (const it of itens) {
    const chave = chaveDe(it);
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    valorTotalNotas += it.valorTotalNota;
  }
  const datas = itens
    .map(it => it.dtEntrada)
    .filter((d): d is string => !!d)
    .sort();

  return {
    totalNotas: vistos.size,
    totalItens: itens.length,
    valorTotalNotas: Math.round(valorTotalNotas * 100) / 100,
    periodoEntradaInicio: datas[0],
    periodoEntradaFim: datas[datas.length - 1],
    processadoEm: new Date().toISOString(),
  };
}
