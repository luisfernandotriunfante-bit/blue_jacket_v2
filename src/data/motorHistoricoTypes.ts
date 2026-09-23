// Tipos do Motor 3 (Motor Histórico) — última fotografia do ERP antigo
// (fontes variadas), guardada para consulta de dados de períodos passados
// por qualquer parte do sistema. Ver src/lib/motorHistorico.ts para a
// lógica de leitura/mesclagem e src/pages/admin/MotorHistorico.tsx para a UI.
//
// Diferente do Motor de Produtos (cadastro, atualizado a cada reprocesso),
// este motor roda uma única vez: cobre o período anterior à virada do ERP
// (até jul/2026) e serve de base para o futuro Motor 4 (movimentações
// atuais, pós-virada), que continua a série a partir de ago/2026.

// Classificação da operação (Oper.CFOP do 379 antigo, ou tipoVenda já
// atribuído pelo Motor 4 a partir de ago/2026). "naoClassificado" cobre
// códigos que não batem com nenhum prefixo conhecido (ex.: 21201, 19902,
// 63203) — nunca é misturado com venda/devolução/bonificação, fica visível
// à parte para conferência manual (financeiro/ERP).
export type VendaHistoricoMensal = {
  competencia: string; // "AAAA-MM"
  codigoInterno: string; // normalizado (sem zeros à esquerda) — casa com produtoMotorTypes.ProdutoEnriquecido.codigoInterno
  ean?: string;
  // Totais gerais (soma de venda + devolução + bonificação + não classificado)
  qtdVendida: number;
  valorVendido: number;
  descontoTotal: number;
  pesoLiqKg: number;
  pesoBruKg: number;
  numLancamentos: number;
  numClientesDistintos: number;
  // Quebra por tipo de operação
  qtdVendaLiquida: number;
  valorVendaLiquida: number;
  qtdDevolvida: number;
  valorDevolvido: number;
  qtdBonificada: number;
  valorBonificado: number;
  qtdNaoClassificada: number;
  valorNaoClassificado: number;
};

// Fechamento de Corte (1454) por competência — série nova, sem equivalente
// no ERP antigo (Corte não existia como relatório separado pré-virada).
// Gerada ao fechar a competência do Motor 4: cada item acumulado do Corte é
// atribuído à competência de dataMovimento e agregado por produto.
export type CorteHistoricoMensal = {
  competencia: string; // "AAAA-MM"
  codigoProduto: string;
  qtdCortada: number;
  valorTotal: number;
  numLancamentos: number;
  numClientesDistintos: number;
};

export type NotaEntradaHistorico = {
  nota: string;
  serie: string;
  emissao: string; // ISO (AAAA-MM-DD)
  dtContabil: string; // ISO (AAAA-MM-DD)
  competencia: string; // "AAAA-MM", derivada da Dt.Cont (data contábil)
  cgcCpf: string;
  razaoSocial: string;
  operacao: string;
  valorNota: number;
  desconto: number;
  descTroca: number;
  uf: string;
  pedido?: string;
};

// Fallback/apoio do 310 (compras por cliente) — só dá totais ANUAIS, sem
// granularidade mensal, por isso fica separado das vendas mensais em vez de
// forçar um mês. Usado para detectar lacunas: produtos que aparecem aqui
// mas não em nenhuma competência do 379 (venda "sumida" no relatório
// detalhado) entram em produtosSomenteEm310 no resumo.
export type CompraAnualProduto = {
  ano: string; // "AAAA"
  codigoInterno: string;
  descricao?: string;
  qtdCompraTotal: number;
  pesoLiquidoTotal: number;
  valorComprasTotal: number;
  bonificacaoTotal: number;
  descontoTotal: number;
  numClientesDistintos: number;
  numRegistros: number;
};

export type MotorHistoricoResumo = {
  competenciasCobertas: string[]; // ordenado, "AAAA-MM" (série 379, pré-virada)
  totalRegistrosVenda: number; // linhas cruas lidas do(s) 379
  totalCombinacoesVendaMensal: number; // linhas agregadas (competencia+produto)
  totalNotasEntrada: number;
  totalProdutosComCompraAnual: number; // linhas agregadas do 310
  produtosSomenteEm310: string[]; // codigoInterno presente no 310 mas ausente em todas as competências do 379
  processadoEm: string;
  // Competências fechadas via Motor 4 (pós-virada, ago/2026 em diante)
  competenciasFechadasVendas?: string[]; // ordenado, "AAAA-MM"
  competenciasFechadasCorte?: string[]; // ordenado, "AAAA-MM"
  // Códigos Oper.CFOP do 379 encontrados sem classificação conhecida (prefixo != 51/13/599)
  codigosOperNaoClassificados?: string[];
};
