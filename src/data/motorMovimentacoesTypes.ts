// Tipos do Motor 4 (Motor de Movimentações) — cobre TODO tipo de
// movimentação pós-virada do ERP: carteira de pedidos com a indústria,
// entrada de notas, vendas/devoluções/bonificações e cortes de pedido.
// Ver src/lib/motorMovimentacoes.ts para a lógica de leitura e
// src/pages/admin/MotorMovimentacoes.tsx para a UI.
//
// Diferente do Motor Histórico (roda uma única vez), este é RECORRENTE:
// reprocessa a cada fechamento de competência. Cada fonte tem sua própria
// semântica de atualização — ver comentário de cada tipo abaixo.

// ---------------------------------------------------------------- Carteira

// Fonte: export SAP da própria Colgate ("CARTEIRA"). Não tem recorte por
// competência (a data do pedido é só mais um campo) — é sempre a FOTO
// COMPLETA atual da carteira, então cada upload SUBSTITUI o anterior
// inteiro (não acumula por competência, ao contrário das outras fontes
// deste motor).
export type CarteiraItem = {
  orderDate?: string; // ISO
  customerNumber: string;
  customerName?: string;
  orderNumber: string;
  material: string; // SKU fabricante — casa com skuFabricante do Motor de Produtos
  descricao?: string;
  orderQty: number;
  billQty: number;
  qtyPendente: number; // orderQty - billQty, nunca negativo
  valorLiquido: number;
  notaFiscalNumber?: string;
  billingType?: string;
  billingDate?: string; // ISO
  pesoBrutoKg?: number;
  status: 'pendente' | 'parcial' | 'completo';
};

export type MotorCarteiraResumo = {
  totalItens: number;
  pendentes: number;
  parciais: number;
  completos: number;
  qtyPendenteTotal: number;
  valorPendenteTotal: number;
  processadoEm: string;
};

// --------------------------------------------------------- Entrada de notas

// Fonte: relatório 218 do ERP ("Rel. Entrada de Mercadoria — Analítico —
// Por nota fiscal"). É um relatório impresso e agrupado: cada nota fiscal
// forma um bloco (cabeçalho + 1 linha com os dados da nota), seguido de um
// sub-bloco de produtos (1 ou mais linhas) e um sub-bloco de contas a
// pagar (1 linha). Cada linha aqui representa UM PRODUTO de UMA nota — os
// dados da nota e do contas a pagar ficam repetidos em cada produto do
// mesmo bloco, para facilitar filtro/soma direto na lista.
//
// DIFERENTE da Carteira: esta fonte ACUMULA — cada upload faz merge pela
// chave (notaFiscal + transEntrada): as notas repetidas são substituídas
// (o upload mais novo vence) e as novas são somadas ao histórico já
// processado, sem apagar o que já existia.
export type EntradaNotaItem = {
  // nota fiscal (repetido em cada produto do mesmo bloco)
  dtEntrada?: string; // ISO — data em que a mercadoria chegou na unidade
  transEntrada: number; // Nº Trans. Ent. — chave junto com notaFiscal
  notaFiscal: string; // sem o "*" inicial
  tipoEntrada?: string;
  serie?: string;
  dtEmissao?: string; // ISO — data de emissão da nota pelo fornecedor
  prazoEntrega?: number;
  filial?: string;
  codFornecedor?: number;
  fornecedor?: string;
  cgc?: string;
  uf?: string;
  valorTotalNota: number;
  valorIpi: number;
  // produto (uma linha por produto da nota)
  codigoInterno: string; // casa com codigoInterno do Motor de Produtos
  produto?: string;
  filialProduto?: string;
  embalagem?: string;
  un?: string;
  qtd: number;
  precoUnit: number;
  custoFinAnterior?: number;
  custoFinAtual?: number;
  codigoFiscal?: string;
  codigoOperacao?: string;
  // contas a pagar da nota (repetido em cada produto do mesmo bloco)
  cPagarNrLanc?: number;
  cPagarValor?: number;
  cPagarDtVenc?: string; // ISO
  cPagarPrazo?: number;
  cPagarIndice?: string;
};

export type MotorEntradaNotasResumo = {
  totalNotas: number;
  totalItens: number;
  valorTotalNotas: number;
  periodoEntradaInicio?: string;
  periodoEntradaFim?: string;
  processadoEm: string;
};
