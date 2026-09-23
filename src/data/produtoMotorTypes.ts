// Tipos do Motor 2 (Motor de Produtos) — mesclagem de cadastro, estoque,
// preço e sortimento por produto. Ver src/lib/motorProdutos.ts para a
// lógica de mesclagem e src/pages/admin/MotorProdutos.tsx para a UI.

export type FaixaKey =
  | 'hiper'
  | 'superG'
  | 'superP'
  | 'vizinhancaGrande'
  | 'vizinhancaPequena'
  | 'tradicional';

export const FAIXA_LABEL: Record<FaixaKey, string> = {
  hiper: 'Faixa 1 — Hiper',
  superG: 'Faixa 2 — Super G',
  superP: 'Faixa 3 — Super P',
  vizinhancaGrande: 'Faixa 4 — Vizinhança grande',
  vizinhancaPequena: 'Faixa 5 — Vizinhança pequena',
  tradicional: 'Faixa 6 — Tradicional',
};

// Nível de sortimento recomendado pela indústria, por faixa/canal:
// 0 = não recomendado, 1 = mandatório, 2 = importante, 5 = plano tático.
export type SortimentoFaixa = {
  nivel: number;
  label: string;
  permitido: boolean;
};

export function nivelSortimentoLabel(nivel: number): string {
  switch (nivel) {
    case 0:
      return 'Não recomendado';
    case 1:
      return 'Mandatório';
    case 2:
      return 'Importante';
    case 5:
      return 'Plano tático';
    default:
      return `Nível ${nivel}`;
  }
}

export type ProdutoOrigem =
  | 'interno_286'
  | 'interno_estoque_1118'
  | 'interno_preco_8011'
  | 'industria_lista_preco'
  | 'industria_sortimento';

export type ProdutoEnriquecido = {
  // chaves — nem todo item tem as três; itens só-indústria não têm código interno
  codigoInterno?: string;
  skuFabricante?: string;
  ean?: string;

  // identificação / cadastro
  descricao?: string;
  descricaoIndustria?: string;
  embalagem?: string;
  classe?: string;
  unidade?: string;
  marca?: string;
  submarca?: string;
  variante?: string;
  categoria?: string;
  subcategoria?: string;
  linhaProduto?: string;
  classificacaoFiscal?: string; // NCM

  // dimensões / paletização (vem da indústria — Histórico Lista de Preço)
  unidadesPorCaixa?: number;
  caixasPorPallet?: number;
  caixasPorLastro?: number;
  lastroPorPallet?: number;
  pesoBrutoUnidKg?: number;
  pesoLiqUnidKg?: number;
  pesoBrutoCaixaKg?: number;
  pesoLiqCaixaKg?: number;
  tamanho?: string;

  // estoque interno (posição atual)
  estoqueDisponivel?: number;
  estoqueReservado?: number;
  estoqueBloqueado?: number;
  estoqueAvariado?: number;
  estoqueTotal?: number;
  // calculado (estoqueDisponivel ÷ unidadesPorCaixa), não vem de arquivo
  estoqueEmCaixasLogistico?: number;
  giroDia?: number;

  // preço
  custoReal?: number;
  precoTabelaSemST?: number;
  precoTabelaComST?: number;
  precoBaseIndustria?: number;
  valorCaixaComImpostos?: number;

  // sortimento recomendado pela indústria, por faixa de cliente
  sortimento: Partial<Record<FaixaKey, SortimentoFaixa>>;

  origens: ProdutoOrigem[];
};

export type MotorProdutosResumo = {
  totalItens: number;
  comCadastroInterno: number;
  somenteIndustria: number;
  comListaPrecoIndustria: number;
  comSortimento: number;
  processadoEm: string;
};
