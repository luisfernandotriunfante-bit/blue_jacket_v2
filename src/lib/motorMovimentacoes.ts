// Motor de Movimentações (Motor 4) — cobre toda movimentação pós-virada do
// ERP: carteira de pedidos com a indústria, entrada de notas, vendas (com
// devoluções/bonificações) e cortes de pedido. Ver o comentário de cada
// tipo em motorMovimentacoesTypes.ts para a semântica de atualização de
// cada fonte (a carteira substitui; as demais acumulam por competência).
//
// Ordem de construção (definida com o usuário): Carteira → Entrada de
// notas (218) → Vendas (8022) → Corte (1454).

import type {
  CarteiraItem,
  CorteItem,
  EntradaNotaItem,
  MotorCarteiraResumo,
  MotorCorteResumo,
  MotorEntradaNotasResumo,
  MotorVendasResumo,
  VendaItem,
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

// -------------------------------------------------------------------- Vendas

// Relatório 8022: tabela limpa (uma linha por item de pedido/nota) — usa
// o mesmo infra genérico da Carteira (extractRecords). Ver o comentário do
// tipo VendaItem em motorMovimentacoesTypes.ts sobre por que esta fonte
// SUBSTITUI a cada upload, em vez de acumular como a Entrada de notas.
export async function processarVendas(file: File): Promise<{ itens: VendaItem[]; resumo: MotorVendasResumo }> {
  const wb = await readWorkbook(file);
  const sheet = pickSheet(wb, ['vendas', 'sheet1']);
  const matrix = sheetToMatrix(sheet);
  const records = extractRecords(matrix, ['numeropedwinthor', 'codprodwinthor']);

  const itens: VendaItem[] = [];
  for (const rec of records) {
    const codCliente = str(rec.codcliente);
    const numeroPedWinthor = str(rec.numeropedwinthor);
    const codProdWinthor = str(rec.codprodwinthor);
    if (!codCliente || !numeroPedWinthor || !codProdWinthor) continue; // linha inválida/rodapé

    const tipoVenda = str(rec.tipovenda) ?? 'VENDA';

    itens.push({
      filial: str(rec.filial),
      fornecedor: num(rec.fornecedor) || undefined,
      dataMovimento: excelDateToISO(rec.datamovimento),
      codCliente,
      nomeCliente: str(rec.nomecliente),
      cnpjCpfCliente: str(rec.cnpjcpfcliente),
      segmentoCnae: str(rec.segmentoatuacaocnae),
      cidade: str(rec.cidade),
      cep: str(rec.cep),
      uf: str(rec.uf),
      numeroPedWinthor,
      numeroPedRca: str(rec.numeropedrca),
      dataEmissaoNf: excelDateToISO(rec.dataemissaonf),
      numeroNotaFiscal: str(rec.numeronotafiscal),
      origemPedido: str(rec.origempedido),
      statusPedido: str(rec.statuspedido),
      statusBloqueio: str(rec.statusbloqueio),
      codVendedor: str(rec.codvendedor),
      vendedor: str(rec.vendedor),
      codSupervisor: str(rec.codsupervisor),
      supervisor: str(rec.supervisor),
      codigoFabricante: str(rec.codigofabricante),
      eanProduto: str(rec.eanproduto),
      eanCadastro: str(rec.eancadastro),
      codProdWinthor,
      descricaoProduto: str(rec.descricaoproduto),
      caixasVendidas: num(rec.caixasvendidas),
      unidadesVendidas: num(rec.unidadesvendidas),
      pesoBrutoKg: num(rec.pesobrutokg),
      pesoLiquidoKg: num(rec.pesoliquidokg),
      situacaoPeso: str(rec.situacaopeso),
      valorMercadoria: num(rec.valormercadoriar),
      valorNota: num(rec.valornotar),
      tipoVenda,
    });
  }

  const resumo = resumirVendas(itens);
  return { itens, resumo };
}

export function resumirVendas(itens: VendaItem[]): MotorVendasResumo {
  let vendasQtd = 0;
  let vendasValor = 0;
  let devolucoesQtd = 0;
  let devolucoesValor = 0;
  let bonificacoesQtd = 0;
  let bonificacoesValor = 0;
  let faturadoValor = 0;
  let aFaturarValor = 0;
  let unidadesVendidasTotal = 0;

  for (const it of itens) {
    unidadesVendidasTotal += it.unidadesVendidas;
    if (it.tipoVenda === 'DEVOLUCAO') {
      devolucoesQtd++;
      devolucoesValor += it.valorNota;
    } else if (it.tipoVenda === 'BONIFICACAO') {
      bonificacoesQtd++;
      bonificacoesValor += it.valorNota;
    } else {
      vendasQtd++;
      vendasValor += it.valorNota;
    }
    if (it.statusPedido === 'A FATURAR') {
      aFaturarValor += it.valorNota;
    } else {
      faturadoValor += it.valorNota;
    }
  }

  const datas = itens
    .map(it => it.dataMovimento)
    .filter((d): d is string => !!d)
    .sort();

  return {
    totalItens: itens.length,
    vendasQtd,
    vendasValor: Math.round(vendasValor * 100) / 100,
    devolucoesQtd,
    devolucoesValor: Math.round(devolucoesValor * 100) / 100,
    bonificacoesQtd,
    bonificacoesValor: Math.round(bonificacoesValor * 100) / 100,
    faturadoValor: Math.round(faturadoValor * 100) / 100,
    aFaturarValor: Math.round(aFaturarValor * 100) / 100,
    unidadesVendidasTotal: Math.round(unidadesVendidasTotal * 100) / 100,
    periodoInicio: datas[0],
    periodoFim: datas[datas.length - 1],
    processadoEm: new Date().toISOString(),
  };
}

// -------------------------------------------------------------------- Corte

// Relatório 1454: bloco por cliente (linha "CLIENTE:" + cabeçalho
// decorativo repetido + N linhas de item + subtotal "Total Cliente:").
// Não tem cabeçalho tabular único — lido por posição fixa de coluna nas
// linhas de DADOS, igual à Entrada de notas. O marcador "CLIENTE:" pode
// vir na coluna 0 ou na coluna 1 (o primeiro bloco de cada página do
// relatório impresso vem deslocado por causa do preâmbulo de filtros que
// se repete a cada quebra de página).
export async function processarCorte(file: File): Promise<{ itens: CorteItem[] }> {
  const wb = await readWorkbook(file);
  const sheet = pickSheet(wb, ['corte', 'sheet1']);
  const matrix = sheetToMatrix(sheet) as unknown[][];

  const itens: CorteItem[] = [];
  let clienteCodigo = '';
  let clienteNome: string | undefined;

  for (const row of matrix) {
    const c0 = cellStr(row, 0);
    const c1 = cellStr(row, 1);
    if (c0 === 'CLIENTE:' || c1 === 'CLIENTE:') {
      clienteCodigo = cellStr(row, 2);
      clienteNome = str(cell(row, 4));
      continue;
    }
    if (c0 === 'Data') continue; // cabeçalho decorativo repetido a cada bloco/página
    if (cellStr(row, 5) === 'Total Cliente:') continue; // subtotal — recalculado no resumo
    if (cellStr(row, 7) === 'Total Geral:') continue; // rodapé do relatório

    const dataRaw = cell(row, 0);
    const pedido = cellStr(row, 1);
    const codigoProduto = cellStr(row, 2);
    if (typeof dataRaw !== 'number' || !pedido || !codigoProduto) continue; // ruído do preâmbulo de página

    itens.push({
      clienteCodigo,
      clienteNome,
      dataMovimento: excelDateToISO(dataRaw),
      numeroPedido: pedido,
      codigoProduto,
      descricaoProduto: str(cell(row, 3)),
      embalagem: str(cell(row, 8)),
      unidade: str(cell(row, 9)),
      qtCorte: num(cell(row, 10)),
      precoUnitario: num(cell(row, 11)),
      valorTotal: num(cell(row, 12)),
      codigoComprador: str(cell(row, 14)),
      departamento: str(cell(row, 15)),
    });
  }

  return { itens };
}

// Recalcula o resumo a partir da lista JÁ MESCLADA (histórico acumulado +
// upload novo) — mesmo padrão de resumirEntradaNotas. Dedup por chave é só
// uma rede de segurança: o merge do useCorte já garante lista sem chaves
// repetidas.
export function resumirCorte(itens: CorteItem[]): MotorCorteResumo {
  const chaveDe = (it: CorteItem) => `${it.numeroPedido}|${it.codigoProduto}`;
  const vistos = new Set<string>();
  const clientes = new Set<string>();
  let qtCorteTotal = 0;
  let valorTotal = 0;
  for (const it of itens) {
    clientes.add(it.clienteCodigo);
    const chave = chaveDe(it);
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    qtCorteTotal += it.qtCorte;
    valorTotal += it.valorTotal;
  }
  const datas = itens
    .map(it => it.dataMovimento)
    .filter((d): d is string => !!d)
    .sort();

  return {
    totalItens: vistos.size,
    totalClientes: clientes.size,
    qtCorteTotal: Math.round(qtCorteTotal * 100) / 100,
    valorTotal: Math.round(valorTotal * 100) / 100,
    periodoInicio: datas[0],
    periodoFim: datas[datas.length - 1],
    processadoEm: new Date().toISOString(),
  };
}
