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
