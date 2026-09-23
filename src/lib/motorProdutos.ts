// Motor de Produtos (Motor 2) — mescla, por código interno (Winthor) com
// ponte por SKU do fabricante e por EAN, as fontes de dado de produto:
// cadastro interno (286, estoque-1118, preço 8011) e cadastro/sortimento
// da indústria (Histórico Lista de Preço, Sortimento Recomendado).
//
// Fontes removidas do motor (histórico das decisões):
// - 105: tudo que trazia de novo (preço de venda unitário) não era
//   indispensável e o resto já vinha do 286.
// - 8013 (logístico): "estoque em caixas" agora é calculado (estoque
//   disponível ÷ unidades por caixa, do Histórico Lista de Preço) em vez
//   de vir de um arquivo à parte; o peso por caixa já vem do Histórico.
// - extrato-1118 (movimento mensal): é dado de venda/movimentação, não de
//   cadastro — deve entrar num futuro Motor de Vendas, não neste motor.
//
// Âncora: os itens que já têm código interno (286/estoque-1118) são a
// base. Itens que só existem na indústria (SKU sem código interno nosso)
// também entram na base, marcados como sem cadastro Winthor ainda — a
// mesclagem nunca descarta linha por falta de dado em outra fonte.
// Estoque: o 286 preenche um valor inicial, mas o estoque-1118 é a fonte
// autoritativa — quando enviado, seus números sobrescrevem os do 286.

import type {
  FaixaKey,
  MotorProdutosResumo,
  ProdutoEnriquecido,
  ProdutoOrigem,
} from '../data/produtoMotorTypes';
import { nivelSortimentoLabel } from '../data/produtoMotorTypes';
import { extractRecords, normalizeDoc, pickSheet, readWorkbook, sheetToMatrix } from './xlsxParse';

function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s ? s : undefined;
}

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

function codigoKey(v: unknown): string | null {
  const s = normalizeDoc(v);
  if (!s) return null;
  return String(Number(s)); // remove zeros à esquerda para casar formatos diferentes
}

function skuKey(v: unknown): string | undefined {
  const s = str(v);
  if (!s) return undefined;
  return s.toUpperCase();
}

function eanKey(v: unknown): string | undefined {
  return normalizeDoc(v) ?? undefined;
}

const CANAL_TO_FAIXA: Record<string, FaixaKey> = {
  hiper: 'hiper',
  superg: 'superG',
  superp: 'superP',
  vizinhancagde: 'vizinhancaGrande',
  vizinhancapeq: 'vizinhancaPequena',
  tradicionalindependente: 'tradicional',
};

function normalizeCanal(v: unknown): string {
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

// ------------------------------------------------------------------ Merge

export type MotorProdutosInput = {
  produtos286?: File;
  estoque1118?: File;
  preco8011?: File;
  historicoListaPreco?: File;
  sortimentoRecomendado?: File;
};

class MotorProdutosBuilder {
  codigoMap = new Map<string, ProdutoEnriquecido>();
  semCodigoMap = new Map<string, ProdutoEnriquecido>();
  skuToCodigo = new Map<string, string>();
  eanToCodigo = new Map<string, string>();

  private ensureByCodigo(codigo: string): ProdutoEnriquecido {
    let r = this.codigoMap.get(codigo);
    if (!r) {
      r = { codigoInterno: codigo, sortimento: {}, origens: [] };
      this.codigoMap.set(codigo, r);
    }
    return r;
  }

  private resolveCodigo(sku?: string, ean?: string): string | undefined {
    if (sku && this.skuToCodigo.has(sku)) return this.skuToCodigo.get(sku);
    if (ean && this.eanToCodigo.has(ean)) return this.eanToCodigo.get(ean);
    return undefined;
  }

  /** Usado pelas fontes internas (têm código): registra o produto e também
   * as pontes sku/ean → código, para as fontes da indústria mais tarde. */
  byCodigoComPontes(codigo: string, sku?: string, ean?: string): ProdutoEnriquecido {
    const r = this.ensureByCodigo(codigo);
    if (sku) {
      r.skuFabricante = r.skuFabricante ?? sku;
      if (!this.skuToCodigo.has(sku)) this.skuToCodigo.set(sku, codigo);
    }
    if (ean) {
      r.ean = r.ean ?? ean;
      if (!this.eanToCodigo.has(ean)) this.eanToCodigo.set(ean, codigo);
    }
    return r;
  }

  /** Usado pelas fontes da indústria (têm sku/ean, não código): resolve
   * para o item interno já conhecido, ou cria um item "só indústria". */
  bySkuOuEan(sku?: string, ean?: string): ProdutoEnriquecido {
    const codigo = this.resolveCodigo(sku, ean);
    if (codigo) return this.ensureByCodigo(codigo);
    const key = sku ?? ean ?? 'desconhecido';
    let r = this.semCodigoMap.get(key);
    if (!r) {
      r = { skuFabricante: sku, ean, sortimento: {}, origens: [] };
      this.semCodigoMap.set(key, r);
    }
    return r;
  }

  /** Para fontes que só têm código (extrato-1118, 8011 por CODPROD): só
   * mescla se o código já existir na base (âncora = 286/105/estoque). */
  byCodigoSomenteSeExistir(codigo: string): ProdutoEnriquecido | null {
    return this.codigoMap.get(codigo) ?? null;
  }

  addOrigem(r: ProdutoEnriquecido, origem: ProdutoOrigem) {
    if (!r.origens.includes(origem)) r.origens.push(origem);
  }

  all(): ProdutoEnriquecido[] {
    return [...this.codigoMap.values(), ...this.semCodigoMap.values()];
  }
}

// ---------------------------------------------------------- 286 (âncora)

async function processarProdutos286(file: File, b: MotorProdutosBuilder) {
  const wb = await readWorkbook(file);
  const sheet = pickSheet(wb, ['286', 'produtos']);
  const matrix = sheetToMatrix(sheet);
  const records = extractRecords(matrix, ['codigo']);

  for (const rec of records) {
    const codigo = codigoKey(rec.codigo);
    if (!codigo) continue;
    const sku = skuKey(rec.codfabricante);
    const ean = eanKey(rec.codbarras);
    const r = b.byCodigoComPontes(codigo, sku, ean);
    r.descricao = r.descricao ?? str(rec.descricao);
    r.embalagem = r.embalagem ?? str(rec.embalagem);
    r.unidade = r.unidade ?? str(rec.unidade);
    r.classe = r.classe ?? str(rec.classe);
    r.marca = r.marca ?? str(rec.marca);
    r.linhaProduto = r.linhaProduto ?? str(rec.descricaolinhaproduto);
    r.classificacaoFiscal = r.classificacaoFiscal ?? str(rec.classificacaofiscal);
    r.estoqueTotal = r.estoqueTotal ?? num(rec.estoque);
    r.estoqueDisponivel = r.estoqueDisponivel ?? num(rec.disponivel);
    r.estoqueReservado = r.estoqueReservado ?? num(rec.reservado);
    r.estoqueAvariado = r.estoqueAvariado ?? num(rec.qtavaria);
    r.giroDia = r.giroDia ?? num(rec.girodia);
    r.custoReal = r.custoReal ?? num(rec.custoreal);
    b.addOrigem(r, 'interno_286');
  }
}

// ------------------------------------------------------------ estoque-1118

// Fonte autoritativa de estoque: quando presente, os números daqui
// substituem qualquer valor de estoque que o 286 já tenha preenchido (o
// 286 continua servindo de fallback para quem não enviar este arquivo).
async function processarEstoque1118(file: File, b: MotorProdutosBuilder) {
  const wb = await readWorkbook(file);
  const sheet = pickSheet(wb, ['1118', 'estoque']);
  const matrix = sheetToMatrix(sheet);
  const records = extractRecords(matrix, ['codigo']);

  for (const rec of records) {
    const codigo = codigoKey(rec.codigo);
    if (!codigo) continue;
    const sku = skuKey(rec.codfabricante);
    const r = b.byCodigoComPontes(codigo, sku, undefined);
    r.descricao = r.descricao ?? str(rec.descricao);
    r.embalagem = r.embalagem ?? str(rec.embalagem);
    r.classe = r.classe ?? str(rec.classe);
    r.marca = r.marca ?? str(rec.marca);
    r.estoqueDisponivel = num(rec.disponivel) ?? r.estoqueDisponivel;
    r.estoqueReservado = num(rec.reservado) ?? r.estoqueReservado;
    r.estoqueBloqueado = num(rec.bloqueado) ?? r.estoqueBloqueado;
    r.estoqueAvariado = num(rec.avariado) ?? r.estoqueAvariado;
    r.estoqueTotal = num(rec.estoque) ?? r.estoqueTotal;
    b.addOrigem(r, 'interno_estoque_1118');
  }
}

// --------------------------------------------------------------- 8011

async function processarPreco8011(file: File, b: MotorProdutosBuilder) {
  const wb = await readWorkbook(file);
  const sheet = pickSheet(wb, ['8011', 'preco', 'preço']);
  const matrix = sheetToMatrix(sheet);
  const records = extractRecords(matrix, ['codprod']);

  for (const rec of records) {
    const codigo = codigoKey(rec.codprod);
    if (!codigo) continue;
    const r = b.byCodigoSomenteSeExistir(codigo);
    if (!r) continue;
    r.precoTabelaSemST = r.precoTabelaSemST ?? num(rec.valorsemimposto);
    r.precoTabelaComST = r.precoTabelaComST ?? num(rec.preco);
    const ean = eanKey(rec.ean);
    if (ean && !b.eanToCodigo.has(ean)) {
      b.eanToCodigo.set(ean, codigo);
      r.ean = r.ean ?? ean;
    }
    b.addOrigem(r, 'interno_preco_8011');
  }
}

// --------------------------------------------------- Histórico Lista de Preço

async function processarHistoricoListaPreco(file: File, b: MotorProdutosBuilder) {
  const wb = await readWorkbook(file);
  const sheet = pickSheet(wb, ['data', 'historico', 'lista']);
  const matrix = sheetToMatrix(sheet);
  const records = extractRecords(matrix, ['sku']);

  const seen = new Set<string>();
  for (const rec of records) {
    const sku = skuKey(rec.sku);
    if (!sku || seen.has(sku)) continue; // dedup — 1 linha por SKU (mantém a primeira)
    seen.add(sku);
    const ean = eanKey(rec.ean);
    const r = b.bySkuOuEan(sku, ean);
    r.skuFabricante = r.skuFabricante ?? sku;
    r.ean = r.ean ?? ean;
    r.descricaoIndustria = r.descricaoIndustria ?? str(rec.descricaopadrao);
    r.categoria = r.categoria ?? str(rec.categoria);
    r.subcategoria = r.subcategoria ?? str(rec.subcategoria);
    r.marca = r.marca ?? str(rec.marca);
    r.submarca = r.submarca ?? str(rec.submarca);
    r.variante = r.variante ?? str(rec.variante);
    r.tamanho = r.tamanho ?? str(rec.tam);
    r.unidadesPorCaixa = r.unidadesPorCaixa ?? num(rec.uncx);
    r.caixasPorPallet = r.caixasPorPallet ?? num(rec.cxpal);
    r.caixasPorLastro = r.caixasPorLastro ?? num(rec.cxlast);
    r.lastroPorPallet = r.lastroPorPallet ?? num(rec.lastpal);
    r.pesoBrutoUnidKg = r.pesoBrutoUnidKg ?? num(rec.pesobrutounidkg);
    r.pesoLiqUnidKg = r.pesoLiqUnidKg ?? num(rec.pesoliqunidkg);
    r.pesoBrutoCaixaKg = r.pesoBrutoCaixaKg ?? num(rec.pesobrutocxkg);
    r.pesoLiqCaixaKg = r.pesoLiqCaixaKg ?? num(rec.pesoliqcxkg);
    r.precoBaseIndustria = r.precoBaseIndustria ?? num(rec.precobase);
    r.valorCaixaComImpostos = r.valorCaixaComImpostos ?? num(rec.valorcaixacomicmseipi);
    b.addOrigem(r, 'industria_lista_preco');
  }
}

// -------------------------------------------------------------- Sortimento

async function processarSortimentoRecomendado(file: File, b: MotorProdutosBuilder) {
  const wb = await readWorkbook(file);
  const sheet = pickSheet(wb, ['unpivo']);
  const matrix = sheetToMatrix(sheet);
  const records = extractRecords(matrix, ['canal', 'sku']);

  for (const rec of records) {
    const faixa = CANAL_TO_FAIXA[normalizeCanal(rec.canal)];
    if (!faixa) continue; // fora das 6 faixas em uso hoje
    const sku = skuKey(rec.sku);
    if (!sku) continue;
    const ean = eanKey(rec.ean);
    const nivel = num(rec.sortimento) ?? 0;
    const r = b.bySkuOuEan(sku, ean);
    r.skuFabricante = r.skuFabricante ?? sku;
    r.ean = r.ean ?? ean;
    r.sortimento[faixa] = { nivel, label: nivelSortimentoLabel(nivel), permitido: nivel > 0 };
    b.addOrigem(r, 'industria_sortimento');
  }
}

// ------------------------------------------------------------------ Runner

export async function processarMotorProdutos(
  input: MotorProdutosInput,
): Promise<{ produtos: ProdutoEnriquecido[]; resumo: MotorProdutosResumo }> {
  const b = new MotorProdutosBuilder();

  // Ordem importa: âncora interna primeiro (registra as pontes sku/ean →
  // código), fontes que só têm código depois, indústria por último.
  if (input.produtos286) await processarProdutos286(input.produtos286, b);
  if (input.estoque1118) await processarEstoque1118(input.estoque1118, b);
  if (input.preco8011) await processarPreco8011(input.preco8011, b);
  if (input.historicoListaPreco) await processarHistoricoListaPreco(input.historicoListaPreco, b);
  if (input.sortimentoRecomendado) await processarSortimentoRecomendado(input.sortimentoRecomendado, b);

  const produtos = b
    .all()
    .sort((a, c) => (a.codigoInterno ? 0 : 1) - (c.codigoInterno ? 0 : 1) || (a.descricao ?? a.descricaoIndustria ?? '').localeCompare(c.descricao ?? c.descricaoIndustria ?? ''));

  // Estoque em caixas: não vem mais de um arquivo (8013) — é calculado a
  // partir do estoque disponível (interno) e das unidades por caixa (do
  // Histórico Lista de Preço da indústria), quando ambos existem.
  for (const p of produtos) {
    if (p.estoqueDisponivel !== undefined && p.unidadesPorCaixa && p.unidadesPorCaixa > 0) {
      p.estoqueEmCaixasLogistico = Math.round((p.estoqueDisponivel / p.unidadesPorCaixa) * 100) / 100;
    }
  }

  const resumo: MotorProdutosResumo = {
    totalItens: produtos.length,
    comCadastroInterno: produtos.filter(p => p.codigoInterno).length,
    somenteIndustria: produtos.filter(p => !p.codigoInterno).length,
    comListaPrecoIndustria: produtos.filter(p => p.origens.includes('industria_lista_preco')).length,
    comSortimento: produtos.filter(p => Object.keys(p.sortimento).length > 0).length,
    processadoEm: new Date().toISOString(),
  };

  return { produtos, resumo };
}
