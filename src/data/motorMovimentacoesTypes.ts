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

// -------------------------------------------------------------------- Vendas

// Fonte: relatório 8022 do ERP — planilha de vendas já tabular (uma linha
// por item de pedido/nota), com CNPJ, produto, vendedor/supervisor e o
// campo tipoVenda (venda, devolução ou bonificação) e statusPedido
// (faturado ou a faturar).
//
// DIFERENTE da Entrada de notas: aqui não existe uma chave linha-a-linha
// confiável para merge — o relatório pode repetir legitimamente a mesma
// combinação pedido+produto+nota (ex.: entregas fracionadas), então, como
// a Carteira, cada upload SUBSTITUI a base anterior inteira. É sempre a
// foto do período exportado no relatório, não um acumulado por
// competência (revisar quando o fechamento de competência automático for
// desenhado).
export type VendaItem = {
  filial?: string;
  fornecedor?: number;
  dataMovimento?: string; // ISO
  codCliente: string;
  nomeCliente?: string;
  cnpjCpfCliente?: string;
  segmentoCnae?: string;
  cidade?: string;
  cep?: string;
  uf?: string;
  numeroPedWinthor: string;
  numeroPedRca?: string;
  dataEmissaoNf?: string; // ISO
  numeroNotaFiscal?: string;
  origemPedido?: string;
  statusPedido?: string; // 'FATURADO' | 'A FATURAR'
  statusBloqueio?: string;
  codVendedor?: string;
  vendedor?: string;
  codSupervisor?: string;
  supervisor?: string;
  codigoFabricante?: string; // casa com skuFabricante do Motor de Produtos
  eanProduto?: string;
  eanCadastro?: string;
  codProdWinthor: string; // casa com codigoInterno do Motor de Produtos
  descricaoProduto?: string;
  caixasVendidas: number;
  unidadesVendidas: number;
  pesoBrutoKg: number;
  pesoLiquidoKg: number;
  situacaoPeso?: string;
  valorMercadoria: number;
  valorNota: number;
  tipoVenda: 'VENDA' | 'DEVOLUCAO' | 'BONIFICACAO' | string;
};

export type MotorVendasResumo = {
  totalItens: number;
  vendasQtd: number;
  vendasValor: number;
  devolucoesQtd: number;
  devolucoesValor: number;
  bonificacoesQtd: number;
  bonificacoesValor: number;
  faturadoValor: number;
  aFaturarValor: number;
  unidadesVendidasTotal: number;
  periodoInicio?: string;
  periodoFim?: string;
  processadoEm: string;
};

// -------------------------------------------------------------------- Corte

// Fonte: relatório 1454 do ERP ("Consultar Corte de Mercadorias — Por
// Cliente"). Relatório impresso e agrupado por cliente: cada cliente forma
// um bloco (linha "CLIENTE:" + cabeçalho decorativo + N linhas de item),
// fechado por uma linha "Total Cliente:" (subtotal — recalculado no
// resumo, não guardado por item). Os cabeçalhos e o preâmbulo de filtros
// se repetem a cada quebra de página do relatório impresso; no primeiro
// bloco de cada página o marcador "CLIENTE:" vem numa coluna diferente dos
// demais blocos — o parser trata as duas posições.
//
// IGUAL à Entrada de notas: existe uma chave linha-a-linha confjC�vel —
// numeroPedido + codigoProduto (zero colisões nos 1.358 itens da amostra
// validada) — então cada upload ACUMULA por essa chave: os itens repetidos
// são substituídos pela versão nova, e os inéditos são somados ao
// histórico já processado.
export type CorteItem = {
  clienteCodigo: string; // casa com codigoWinthor do Motor de Clientes (respeitar a regra de firewall em clienteMotorTypes.ts — não ligar automaticamente)
  clienteNome?: string;
  dataMovimento?: string; // ISO
  numeroPedido: string; // parte da chave de merge
  codigoProduto: string; // parte da chave de merge — casa com codigoInterno do Motor de Produtos
  descricaoProduto?: string;
  embalagem?: string;
  unidade?: string;
  qtCorte: number;
  precoUnitario: number;
  valorTotal: number;
  codigoComprador?: string;
  departamento?: string;
};

export type MotorCorteResumo = {
  totalItens: number;
  totalClientes: number;
  qtCorteTotal: number;
  valorTotal: number;
  periodoInicio?: string;
  periodoFim?: string;
  processadoEm: string;
};
