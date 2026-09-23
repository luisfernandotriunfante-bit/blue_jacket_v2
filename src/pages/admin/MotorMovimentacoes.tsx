import { useState, type ChangeEvent } from 'react';
import { PanelAlert, PanelCard, PanelSectionHeader } from '../../components/Panel';
import { useCarteira } from '../../data/motorMovimentacoesStore';
import { processarCarteira } from '../../lib/motorMovimentacoes';

// Administração > Bases > Motor 4 (Motor de Movimentações) — cobre toda
// movimentação pós-virada do ERP: carteira de pedidos, entrada de notas,
// vendas (com devoluções/bonificações) e cortes de pedido. Ver
// src/lib/motorMovimentacoes.ts para os detalhes de cada fonte.
//
// Diferente do Motor Histórico (roda uma única vez), este é RECORRENTE —
// reprocessado a cada fechamento de competência. Construído em etapas, na
// ordem combinada com o usuário: Carteira → Entrada de notas (218) →
// Vendas (8022) → Corte (1454). As três últimas ainda não existem aqui.
export function MotorMovimentacoes() {
  return (
    <PanelCard>
      <PanelSectionHeader
        eyebrow="ADMINISTRAÇÃO — BASES — MOTOR 4"
        title="Motor de Movimentações"
        description="Movimentações atuais (pós-virada do ERP): carteira, entrada de notas, vendas/devoluções/bonificações e cortes. Recorrente — reprocesse a cada fechamento de competência. Roda inteiramente no navegador — nenhum arquivo sai daqui."
      />
      <CarteiraSecao />
    </PanelCard>
  );
}

// Carteira: sempre a foto completa atual (a data do pedido não delimita um
// período) — cada processamento SUBSTITUI a base anterior inteira.
function CarteiraSecao() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resumo, salvarResultado, limpar } = useCarteira();

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  async function handleProcessar() {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const resultado = await processarCarteira(file);
      salvarResultado(resultado.itens, resultado.resumo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível processar o arquivo enviado.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div style={{ marginTop: 'var(--bj-space-4)' }}>
      <div className="panel-upload-slot" style={{ maxWidth: 420 }}>
        <div className="panel-upload-slot-title">Carteira</div>
        <div className="panel-upload-slot-desc">
          Export da Colgate (SAP): tudo que compramos, o que já chegou (Bill Qty) e o que falta chegar. Cada envio substitui a base anterior — é
          sempre a foto completa atual, não um recorte de período.
        </div>
        <label className="panel-button panel-upload-button">
          {file?.name ?? 'Selecionar arquivo (.xls/.xlsx)'}
          <input type="file" accept=".xls,.xlsx,.csv" onChange={handleFile} style={{ display: 'none' }} />
        </label>
      </div>
      <div className="panel-row-actions" style={{ justifyContent: 'flex-start', marginTop: 'var(--bj-space-2)' }}>
        <button type="button" className="panel-button panel-button-primary" disabled={processing || !file} onClick={handleProcessar}>
          {processing ? 'Processando…' : 'Processar carteira'}
        </button>
        {resumo ? (
          <button type="button" className="panel-button" onClick={limpar}>
            Limpar carteira
          </button>
        ) : null}
      </div>
      {error ? (
        <div style={{ marginTop: 'var(--bj-space-4)' }}>
          <PanelAlert tone="error">{error}</PanelAlert>
        </div>
      ) : null}
      <div style={{ marginTop: 'var(--bj-space-4)' }}>
        {resumo ? (
          <PanelAlert tone="success">
            Carteira processada em {new Date(resumo.processadoEm).toLocaleString('pt-BR')} — {resumo.totalItens.toLocaleString('pt-BR')} item(ns):{' '}
            {resumo.completos.toLocaleString('pt-BR')} completo(s), {resumo.parciais.toLocaleString('pt-BR')} parcial(is),{' '}
            {resumo.pendentes.toLocaleString('pt-BR')} pendente(s) — {resumo.qtyPendenteTotal.toLocaleString('pt-BR')} unidade(s) e{' '}
            {resumo.valorPendenteTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ainda a chegar.
          </PanelAlert>
        ) : (
          <PanelAlert tone="info">Nenhuma carteira processada ainda. Envie o arquivo e clique em "Processar carteira".</PanelAlert>
        )}
      </div>
    </div>
  );
}
