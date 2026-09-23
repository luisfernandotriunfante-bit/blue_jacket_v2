// Tipos do Motor 3 (Motor Histórico) — última fotografia do ERP antigo
// (fontes variadas), guardada para consulta de dados de períodos passados
// por qualquer parte do sistema. Ver src/lib/motorHistorico.ts para a
// lógica de leitura/mesclagem e src/pages/admin/MotorHistorico.tsx para a UI.
//
// Diferente do Motor de Produtos (cadastro, atualizado a cada reprocesso),
// este motor roda uma única vez: cobre o período anterior à virada do ERP
// (até jul/2026) e serve de base para o futuro Motor 4 (movimentações
// atuais, pós-virada), que continua a série a partir de ago/2026.

export type VendaHistoricoMensal = {
  competencia: string; // "AAAA-MM"
  codigoInterno: string; // normalizado (sem zeros à esquerda) — casa com produtoMotorTypes.ProdutoEnriquecido.codigoInterno
  ean?: string;
  qtdVendida: number;
  valorVendido: number;
  descontoTotal: number;
  pesoLiqKg: number;
  pesoBruKg: number;
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
  competenciasCobertas: string[]; // ordenado, "AAAA-MM"
  totalRegistrosVenda: number; // linhas cruas lidas do(s) 379
  totalCombinacoesVendaMensal: number; // linhas agregadas (competencia+produto)
  totalNotasEntrada: number;
  totalProdutosComCompraAnual: number; // linhas agregadas do 310
  produtosSomenteEm310: string[]; // codigoInterno presente no 310 mas ausente em todas as competências do 379
  processadoEm: string;
};
