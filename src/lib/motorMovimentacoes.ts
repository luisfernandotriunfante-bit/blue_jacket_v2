// Motor de Movimentações (Motor 4) — cobre toda movimentação pós-virada do
// ERP: carteira de pedidos com a indústria, entrada de notas, vendas (com
// devoluções/bonificações) e cortes de pedido. Ver o comentário de cada
// tipo em motorMovimentacoesTypes.ts para a semântica de atualização de
// cada fonte (a carteira substitui; as demais acumulam por competência).
//
// Ordem de construção (definida com o usuário): Carteira → Entrada de
// notas (218) → Vendas (8022) → Corte (1454). As três últimas ainda não
// foram implementadas nesta primeira etapa.

import type { CarteiraItem, MotorCarteiraResumo } from '../data/motorMovimentacoesTypes';
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
