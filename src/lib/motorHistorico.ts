// Motor Histórico (Motor 3) — lê relatórios de texto puro do ERP antigo
// (largura fixa, impressão de sistema) e monta:
//  1) vendas mensais por produto (fonte: 379 — Vendas Analítico Detalhado,
//     um ou mais anos), agregadas por competência+código interno;
//  2) notas de entrada (fonte: 12322 — Relação de Notas Fiscais), uma linha
//     por nota;
//  3) compras anuais por produto (fonte: 310 — Compras por Cliente),
//     agregadas por código interno, usadas só como apoio para detectar
//     lacunas no 379 (o 310 não tem granularidade mensal).
//
// Fonte deliberadamente fora do motor: Rapel (acréscimo por CNPJ sobre os
// preços) — vai virar cadastro manual à parte, não faz parte deste motor.
//
// Este motor roda uma única vez (não há necessidade de reprocessar depois
// que os dados históricos estiverem carregados). O resultado é guardado no
// IndexedDB (não localStorage — ver motorHistoricoStore.ts): o volume de
// dados (19 competências × milhares de produtos) passa facilmente dos
// poucos MB que o localStorage aguenta.

import type {
  CompraAnualProduto,
  MotorHistoricoResumo,
  NotaEntradaHistorico,
  VendaHistoricoMensal,
} from '../data/motorHistoricoTypes';
import { codigoKey, numBR, parseDataBR, readTextFile } from './txtReportParse';

// ------------------------------------------------------- 379 (vendas)

const RE_VENDA_379 =
  /^(\d{2}\/\d{2}\/\d{4})\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d.,]+-?)\s+([\d.,]+-?)\s+([\d.,]+-?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d.,]+-?)\s+([\d.,]+-?)\s+(\d*)\s*([\d.]*)\s+(\d+)\s+(.+?)\s+(\d+)\s+(\d+)\s+([A-Z]\d{2})\s+([\d.,]+-?)\s+(\d+)\s+(\S+)\s+(\S+)/;

type VendaAgg = {
  ean?: string;
  qtd: number;
  valor: number;
  desconto: number;
  pesoLiq: number;
  pesoBru: number;
  n: number;
  clientes: Set<string>;
  // Quebra por tipo de operação (Oper.CFOP, m[8])
  qtdVenda: number;
  valorVenda: number;
  qtdDevolucao: number;
  valorDevolucao: number;
  qtdBonificacao: number;
  valorBonificacao: number;
  qtdNaoClassificada: number;
  valorNaoClassificada: number;
};

// Classificação do código de operação (Oper.CFOP) do 379 antigo. Confirmada
// pelo usuário por código exato (não por prefixo — ex.: 13202 aparece no 379
// mas NÃO valida como devolução contra o relatório 310, então não pode
// entrar no mesmo balde que 13201/13216/13234):
//  - 51201, 51234, 51216 -> venda líquida
//  - 13201, 13216, 13234 -> devolução (validado contra o 310)
//  - 59901 -> bonificação (classificação de menor confiança para o usuário;
//    não é crítica de mostrar — ver nota abaixo)
//  - qualquer outro código -> não classificado (ex.: 13202, 21201, 19902,
//    63203). Nunca misturar com as três categorias acima: fica separado
//    para conferência manual com financeiro/ERP.
const CODIGOS_VENDA_379 = new Set(['51201', '51234', '51216']);
const CODIGOS_DEVOLUCAO_379 = new Set(['13201', '13216', '13234']);
const CODIGOS_BONIFICACAO_379 = new Set(['59901']);

function classificarOperacao379(operCfop: string): 'venda' | 'devolucao' | 'bonificacao' | 'naoClassificado' {
  if (CODIGOS_VENDA_379.has(operCfop)) return 'venda';
  if (CODIGOS_DEVOLUCAO_379.has(operCfop)) return 'devolucao';
  if (CODIGOS_BONIFICACAO_379.has(operCfop)) return 'bonificacao';
  return 'naoClassificado';
}

async function parseVendas379(file: File, agg: Map<string, VendaAgg>, codigosNaoClassificados: Set<string>) {
  const text = await readTextFile(file);
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!/^\d{2}\/\d{2}\/\d{4}/.test(line)) continue; // pula cabeçalho/rodapé/página
    const m = RE_VENDA_379.exec(line);
    if (!m) continue;
    const data = parseDataBR(m[1]);
    if (!data) continue;
    const codigo = codigoKey(m[4]);
    if (!codigo) continue;
    const cliente = m[12];
    const ean = m[26] && /^\d{6,}$/.test(m[26]) ? m[26] : undefined; // "SEM GTIN" (produto sem código de barras) cai fora aqui
    const operCfop = m[8];
    const tipo = classificarOperacao379(operCfop);
    if (tipo === 'naoClassificado') codigosNaoClassificados.add(operCfop);

    const key = `${data.competencia}|${codigo}`;
    let a = agg.get(key);
    if (!a) {
      a = {
        ean, qtd: 0, valor: 0, desconto: 0, pesoLiq: 0, pesoBru: 0, n: 0, clientes: new Set(),
        qtdVenda: 0, valorVenda: 0, qtdDevolucao: 0, valorDevolucao: 0,
        qtdBonificacao: 0, valorBonificacao: 0, qtdNaoClassificada: 0, valorNaoClassificada: 0,
      };
      agg.set(key, a);
    }
    const qtd = numBR(m[5]);
    const valor = numBR(m[6]);
    a.qtd += qtd;
    a.valor += valor;
    a.desconto += numBR(m[7]);
    a.pesoLiq += numBR(m[14]);
    a.pesoBru += numBR(m[15]);
    a.n += 1;
    a.clientes.add(cliente);
    if (!a.ean && ean) a.ean = ean;

    if (tipo === 'venda') { a.qtdVenda += qtd; a.valorVenda += valor; }
    else if (tipo === 'devolucao') { a.qtdDevolucao += qtd; a.valorDevolucao += valor; }
    else if (tipo === 'bonificacao') { a.qtdBonificacao += qtd; a.valorBonificacao += valor; }
    else { a.qtdNaoClassificada += qtd; a.valorNaoClassificada += valor; }
  }
}

// ------------------------------------------------ 12322 (chegada de notas)

const RE_NOTA_12322 =
  /^(\d+)\s+(\d{2}\/\d{2}\/\d{2})\s+(\d{2}\/\d{2}\/\d{2})\s+(\d+)\s+(\S+)\s+([\d.]+)\s+(\d+)\s+([\d.,]+-?)\s+([\d.,]+-?)\s+([\d.,]+-?)\s+(\d+)\s+([A-Z]{2})\s+(.*?)\s*(\d+)$/;

async function parseNotas12322(file: File): Promise<NotaEntradaHistorico[]> {
  const text = await readTextFile(file);
  const lines = text.split(/\r?\n/);
  const notas: NotaEntradaHistorico[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!/^\d+\s+\d{2}\/\d{2}\/\d{2}/.test(line)) continue;
    const m = RE_NOTA_12322.exec(line);
    if (!m) continue;
    const emissao = parseDataBR(m[2]);
    const dtCont = parseDataBR(m[3]);
    if (!emissao || !dtCont) continue;
    notas.push({
      nota: m[1],
      serie: m[11],
      emissao: emissao.iso,
      dtContabil: dtCont.iso,
      competencia: dtCont.competencia,
      cgcCpf: m[4],
      razaoSocial: m[5],
      operacao: m[6],
      valorNota: numBR(m[8]),
      desconto: numBR(m[9]),
      descTroca: numBR(m[10]),
      uf: m[12],
      pedido: m[14] && m[14] !== '0' ? m[14] : undefined,
    });
  }
  return notas;
}

// -------------------------------------------- 310 (compras por cliente)

const RE_COMPRA_310 =
  /^(\d{5,})\s+(.+?)\s+([\d.,]+-?)\s+([\d.,]+-?)\s+([\d.,]+-?)\s+([\d.,]+-?)\s+([\d.,]+-?)\s+([\d.,]+-?)\s+([\d.,]+-?)\s+([\d.,]+-?)\s+([\d.,]+-?)\s+(\d+)\s+(\d+)\s+(\S+)\s*(.*)$/;

type CompraAgg = {
  descricao?: string;
  qtd: number;
  pesoLiq: number;
  valor: number;
  bonificacao: number;
  desconto: number;
  clientes: Set<string>;
  n: number;
};

async function parseCompras310(file: File): Promise<Map<string, CompraAgg>> {
  const text = await readTextFile(file);
  const lines = text.split(/\r?\n/);
  const agg = new Map<string, CompraAgg>();
  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    const trimmed = line.trim();
    if (!/^\d{5,}\s/.test(trimmed)) continue;
    if (trimmed.includes('TOTAL DO')) continue;
    const m = RE_COMPRA_310.exec(trimmed);
    if (!m) continue;
    const codigo = codigoKey(m[1]);
    if (!codigo) continue;
    const cnpj = m[12];
    let a = agg.get(codigo);
    if (!a) {
      a = { descricao: m[2], qtd: 0, pesoLiq: 0, valor: 0, bonificacao: 0, desconto: 0, clientes: new Set(), n: 0 };
      agg.set(codigo, a);
    }
    a.qtd += numBR(m[4]);
    a.pesoLiq += numBR(m[5]);
    a.valor += numBR(m[6]);
    a.bonificacao += numBR(m[7]);
    a.desconto += numBR(m[8]);
    a.clientes.add(cnpj);
    a.n += 1;
  }
  return agg;
}

// ------------------------------------------------------------------ Runner

export type MotorHistoricoInput = {
  vendas379: File[]; // um ou mais anos (379-26, 379-25, ...)
  chegadaNotas12322?: File;
  comprasClienteAno310?: { file: File; ano: string };
  // Rapel fica fora deliberadamente — ver comentário no topo do arquivo.
};

export async function processarMotorHistorico(input: MotorHistoricoInput): Promise<{
  vendasMensais: VendaHistoricoMensal[];
  notasEntrada: NotaEntradaHistorico[];
  comprasAnuais: CompraAnualProduto[];
  resumo: MotorHistoricoResumo;
}> {
  const vendaAgg = new Map<string, VendaAgg>();
  const codigosOperNaoClassificados = new Set<string>();
  for (const file of input.vendas379) {
    await parseVendas379(file, vendaAgg, codigosOperNaoClassificados);
  }

  const vendasMensais: VendaHistoricoMensal[] = [...vendaAgg.entries()].map(([key, a]) => {
    const [competencia, codigoInterno] = key.split('|');
    return {
      competencia,
      codigoInterno,
      ean: a.ean,
      qtdVendida: Math.round(a.qtd * 100) / 100,
      valorVendido: Math.round(a.valor * 100) / 100,
      descontoTotal: Math.round(a.desconto * 100) / 100,
      pesoLiqKg: Math.round(a.pesoLiq * 100) / 100,
      pesoBruKg: Math.round(a.pesoBru * 100) / 100,
      numLancamentos: a.n,
      numClientesDistintos: a.clientes.size,
      qtdVendaLiquida: Math.round(a.qtdVenda * 100) / 100,
      valorVendaLiquida: Math.round(a.valorVenda * 100) / 100,
      qtdDevolvida: Math.round(a.qtdDevolucao * 100) / 100,
      valorDevolvido: Math.round(a.valorDevolucao * 100) / 100,
      qtdBonificada: Math.round(a.qtdBonificacao * 100) / 100,
      valorBonificado: Math.round(a.valorBonificacao * 100) / 100,
      qtdNaoClassificada: Math.round(a.qtdNaoClassificada * 100) / 100,
      valorNaoClassificado: Math.round(a.valorNaoClassificada * 100) / 100,
    };
  });

  const notasEntrada = input.chegadaNotas12322 ? await parseNotas12322(input.chegadaNotas12322) : [];

  const codigosCom379 = new Set(vendasMensais.map(v => v.codigoInterno));
  let comprasAnuais: CompraAnualProduto[] = [];
  let produtosSomenteEm310: string[] = [];
  if (input.comprasClienteAno310) {
    const { file, ano } = input.comprasClienteAno310;
    const agg = await parseCompras310(file);
    comprasAnuais = [...agg.entries()].map(([codigoInterno, a]) => ({
      ano,
      codigoInterno,
      descricao: a.descricao,
      qtdCompraTotal: Math.round(a.qtd * 100) / 100,
      pesoLiquidoTotal: Math.round(a.pesoLiq * 100) / 100,
      valorComprasTotal: Math.round(a.valor * 100) / 100,
      bonificacaoTotal: Math.round(a.bonificacao * 100) / 100,
      descontoTotal: Math.round(a.desconto * 100) / 100,
      numClientesDistintos: a.clientes.size,
      numRegistros: a.n,
    }));
    produtosSomenteEm310 = comprasAnuais.filter(c => !codigosCom379.has(c.codigoInterno)).map(c => c.codigoInterno);
  }

  const competenciasCobertas = [...new Set(vendasMensais.map(v => v.competencia))].sort();

  const resumo: MotorHistoricoResumo = {
    competenciasCobertas,
    totalRegistrosVenda: vendasMensais.reduce((s, v) => s + v.numLancamentos, 0),
    totalCombinacoesVendaMensal: vendasMensais.length,
    totalNotasEntrada: notasEntrada.length,
    totalProdutosComCompraAnual: comprasAnuais.length,
    produtosSomenteEm310,
    processadoEm: new Date().toISOString(),
    codigosOperNaoClassificados: [...codigosOperNaoClassificados].sort(),
  };

  return { vendasMensais, notasEntrada, comprasAnuais, resumo };
}
