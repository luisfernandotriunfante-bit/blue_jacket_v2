// Fechamento de competência do Motor 4 (Vendas + Corte) — trava o período
// encerrado como histórico permanente no Motor Histórico (Motor 3) e libera
// o Motor 4 para a próxima competência. O fechamento em si é sempre uma
// ação manual (botão) — o sistema apenas avisa (ver competenciaMotor4Store)
// quando o relógio já virou o mês sem o fechamento ter sido feito.
//
// Vendas: zera após o fechamento — Vendas é sempre a FOTO do período
// exportado (substitui a cada upload, não acumula), então o próximo upload
// do 8022 começa do zero para a nova competência.
// Corte: continua acumulando — só os itens da competência fechada saem do
// Motor 4 (o resto, de competências ainda abertas, permanece).
//
// Itens sem dataMovimento não entram no fechamento (não há como saber a que
// competência pertencem) — ficam de fora do histórico gerado; em Vendas são
// perdidos ao zerar (dado incompleto na origem), em Corte permanecem no
// Motor 4 junto com o restante não fechado.

import type { CorteItem, VendaItem } from '../data/motorMovimentacoesTypes';
import type { CorteHistoricoMensal, VendaHistoricoMensal } from '../data/motorHistoricoTypes';

function competenciaDeIso(iso: string | undefined): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  return m ? `${m[1]}-${m[2]}` : null;
}

type VendaAggFechamento = {
  ean?: string;
  qtd: number;
  valor: number;
  pesoLiq: number;
  pesoBru: number;
  n: number;
  clientes: Set<string>;
  qtdVenda: number;
  valorVenda: number;
  qtdDevolucao: number;
  valorDevolucao: number;
  qtdBonificacao: number;
  valorBonificacao: number;
  qtdNaoClassificada: number;
  valorNaoClassificada: number;
};

// Agrega os itens de Vendas (Motor 4) da competência informada no formato
// do Motor Histórico. Classificação vem direto de tipoVenda — diferente do
// 379 antigo, não precisa inferir por código de operação (Oper.CFOP).
export function agregarFechamentoVendas(itens: VendaItem[], competencia: string): VendaHistoricoMensal[] {
  const agg = new Map<string, VendaAggFechamento>();
  for (const it of itens) {
    if (competenciaDeIso(it.dataMovimento) !== competencia) continue;
    const codigo = it.codProdWinthor;
    if (!codigo) continue;
    let a = agg.get(codigo);
    if (!a) {
      a = {
        ean: it.eanProduto || it.eanCadastro,
        qtd: 0, valor: 0, pesoLiq: 0, pesoBru: 0, n: 0, clientes: new Set(),
        qtdVenda: 0, valorVenda: 0, qtdDevolucao: 0, valorDevolucao: 0,
        qtdBonificacao: 0, valorBonificacao: 0, qtdNaoClassificada: 0, valorNaoClassificada: 0,
      };
      agg.set(codigo, a);
    }
    const qtd = it.unidadesVendidas ?? 0;
    const valor = it.valorMercadoria ?? 0;
    a.qtd += qtd;
    a.valor += valor;
    a.pesoLiq += it.pesoLiquidoKg ?? 0;
    a.pesoBru += it.pesoBrutoKg ?? 0;
    a.n += 1;
    if (it.codCliente) a.clientes.add(it.codCliente);
    if (!a.ean && (it.eanProduto || it.eanCadastro)) a.ean = it.eanProduto || it.eanCadastro;

    const tipo = it.tipoVenda;
    if (tipo === 'VENDA') { a.qtdVenda += qtd; a.valorVenda += valor; }
    else if (tipo === 'DEVOLUCAO') { a.qtdDevolucao += qtd; a.valorDevolucao += valor; }
    else if (tipo === 'BONIFICACAO') { a.qtdBonificacao += qtd; a.valorBonificacao += valor; }
    else { a.qtdNaoClassificada += qtd; a.valorNaoClassificada += valor; }
  }
  return [...agg.entries()].map(([codigoInterno, a]) => ({
    competencia,
    codigoInterno,
    ean: a.ean,
    qtdVendida: Math.round(a.qtd * 100) / 100,
    valorVendido: Math.round(a.valor * 100) / 100,
    descontoTotal: 0, // 8022 não traz desconto por item separado
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
  }));
}

// Agrega os itens de Corte (Motor 4) da competência informada. Retorna os
// registros a mesclar no Motor Histórico e os itens que devem PERMANECER no
// Motor 4 (competências ainda não fechadas, ou sem dataMovimento).
export function agregarFechamentoCorte(
  itens: CorteItem[],
  competencia: string,
): { registros: CorteHistoricoMensal[]; itensRestantes: CorteItem[] } {
  type Agg = { qtd: number; valor: number; n: number; clientes: Set<string> };
  const agg = new Map<string, Agg>();
  const itensRestantes: CorteItem[] = [];
  for (const it of itens) {
    const comp = competenciaDeIso(it.dataMovimento);
    if (comp !== competencia) {
      itensRestantes.push(it);
      continue;
    }
    const codigo = it.codigoProduto;
    let a = agg.get(codigo);
    if (!a) {
      a = { qtd: 0, valor: 0, n: 0, clientes: new Set() };
      agg.set(codigo, a);
    }
    a.qtd += it.qtCorte ?? 0;
    a.valor += it.valorTotal ?? 0;
    a.n += 1;
    if (it.clienteCodigo) a.clientes.add(it.clienteCodigo);
  }
  const registros: CorteHistoricoMensal[] = [...agg.entries()].map(([codigoProduto, a]) => ({
    competencia,
    codigoProduto,
    qtdCortada: Math.round(a.qtd * 100) / 100,
    valorTotal: Math.round(a.valor * 100) / 100,
    numLancamentos: a.n,
    numClientesDistintos: a.clientes.size,
  }));
  return { registros, itensRestantes };
}
