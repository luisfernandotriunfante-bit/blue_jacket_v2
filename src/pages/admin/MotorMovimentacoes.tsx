import { useState, type ChangeEvent } from 'react';
import { PanelAlert, PanelCard, PanelSectionHeader } from '../../components/Panel';
import { useCarteira, useCorte, useEntradaNotas, useVendas } from '../../data/motorMovimentacoesStore';
import { processarCarteira, processarCorte, processarEntradaNotas, processarVendas } from '../../lib/motorMovimentacoes';

// Administração > Bases > Motor 4 (Motor de Movimentações) — cobre toda
// movimentação pós-virada do ERP: carteira de pedidos, entrada de notas,
// vendas (com devoluções/bonificações) e cortes de pedido. Ver
// src/lib/motorMovimentacoes.ts para os detalhes de cada fonte.
//
// Diferente do Motor Histórico (roda uma única vez), este é RECORRENTE —
// reprocessado a cada fechamento de competência. Construído em etapas, na
// ordem combinada com o usuário: Carteira → Entrada de notas (218) →
// Vendas (8022) → Corte (1454) — as quatro fontes já estão aqui. As telas
// de consumo (abas "Notas" e "Cortes") ficam para depois que todos os
// motores estiverem prontos.
export function MotorMovimentacoes() {
  return (
    <PanelCard>
      <PanelSectionHeader
        eyebrow="ADMINISTRAÇÃO — BASES — MOTOR 4"
        title="Motor de Movimentações"
        description="Movimentações atuais (pós-virada do ERP): carteira, entrada de notas, vendas/devoluções/bonificações e cortes. Recorrente — reprocesse a cada fechamento de competência. Roda inteiramente no navegador — nenhum arquivo sai daqui."
      />
      <CarteiraSecao />
      <EntradaNotasSecao />
      <VendasSecao />
      <CorteSecao />
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

// Entrada de notas: notas da carteira que já chegaram na unidade. Diferente
// da Carteira, ACUMULA — cada upload faz merge pela chave (nota + nº
// transação de entrada), então reenviar o relatório é seguro (não duplica)
// e cada novo envio soma as notas inéditas ao histórico.
function EntradaNotasSecao() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resumo, salvarResultado, limpar } = useEntradaNotas();

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  async function handleProcessar() {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const resultado = await processarEntradaNotas(file);
      salvarResultado(resultado.itens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível processar o arquivo enviado.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div style={{ marginTop: 'var(--bj-space-6)' }}>
      <div className="panel-upload-slot" style={{ maxWidth: 420 }}>
        <div className="panel-upload-slot-title">Entrada de notas (relatório 218)</div>
        <div className="panel-upload-slot-desc">
          Notas da carteira que já chegaram na unidade — o que entrou, quando e o contas a pagar de cada uma. Acumula: reenviar o relatório não
          duplica, só atualiza as notas repetidas e soma as novas.
        </div>
        <label className="panel-button panel-upload-button">
          {file?.name ?? 'Selecionar arquivo (.xls/.xlsx)'}
          <input type="file" accept=".xls,.xlsx,.csv" onChange={handleFile} style={{ display: 'none' }} />
        </label>
      </div>
      <div className="panel-row-actions" style={{ justifyContent: 'flex-start', marginTop: 'var(--bj-space-2)' }}>
        <button type="button" className="panel-button panel-button-primary" disabled={processing || !file} onClick={handleProcessar}>
          {processing ? 'Processando…' : 'Processar entrada de notas'}
        </button>
        {resumo ? (
          <button type="button" className="panel-button" onClick={limpar}>
            Limpar entrada de notas
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
            Histórico atualizado em {new Date(resumo.processadoEm).toLocaleString('pt-BR')} — {resumo.totalNotas.toLocaleString('pt-BR')} nota(s),{' '}
            {resumo.totalItens.toLocaleString('pt-BR')} item(ns) de produto,{' '}
            {resumo.valorTotalNotas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} no total
            {resumo.periodoEntradaInicio && resumo.periodoEntradaFim
              ? ` — entradas de ${new Date(resumo.periodoEntradaInicio + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(
                  resumo.periodoEntradaFim + 'T00:00:00',
                ).toLocaleDateString('pt-BR')}`
              : ''}
            .
          </PanelAlert>
        ) : (
          <PanelAlert tone="info">Nenhuma entrada de notas processada ainda. Envie o relatório 218 e clique em "Processar entrada de notas".</PanelAlert>
        )}
      </div>
    </div>
  );
}

// Vendas: planilha já tabular (venda/devolução/bonificação, faturado/a
// faturar). Sem chave linha-a-linha confjC�vel para merge — cada
// processamento SUBSTITUI a base anterior inteira, como a Carteira.
function VendasSecao() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resumo, salvarResultado, limpar } = useVendas();

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  async function handleProcessar() {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const resultado = await processarVendas(file);
      salvarResultado(resultado.itens, resultado.resumo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível processar o arquivo enviado.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div style={{ marginTop: 'var(--bj-space-6)' }}>
      <div className="panel-upload-slot" style={{ maxWidth: 420 }}>
        <div className="panel-upload-slot-title">Vendas (relatório 8022)</div>
        <div className="panel-upload-slot-desc">
          Venda por produto e CNPJ, com devoluções e bonificações, e visão do que já está faturado e do que está a faturar. Cada envio substitui a
          base anterior — é sempre a foto do período exportado no relatório.
        </div>
        <label className="panel-button panel-upload-button">
          {file?.name ?? 'Selecionar arquivo (.xls/.xlsx)'}
          <input type="file" accept=".xls,.xlsx,.csv" onChange={handleFile} style={{ display: 'none' }} />
        </label>
      </div>
      <div className="panel-row-actions" style={{ justifyContent: 'flex-start', marginTop: 'var(--bj-space-2)' }}>
        <button type="button" className="panel-button panel-button-primary" disabled={processing || !file} onClick={handleProcessar}>
          {processing ? 'Processando…' : 'Processar vendas'}
        </button>
        {resumo ? (
          <button type="button" className="panel-button" onClick={limpar}>
            Limpar vendas
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
            Vendas processadas em {new Date(resumo.processadoEm).toLocaleString('pt-BR')} — {resumo.totalItens.toLocaleString('pt-BR')} item(ns):{' '}
            {resumo.vendasQtd.toLocaleString('pt-BR')} venda(s) ({resumo.vendasValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            ), {resumo.devolucoesQtd.toLocaleString('pt-BR')} devolução(ões) (
            {resumo.devolucoesValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}), {resumo.bonificacoesQtd.toLocaleString('pt-BR')}{' '}
            bonificação(ões) ({resumo.bonificacoesValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) — faturado{' '}
            {resumo.faturadoValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, a faturar{' '}
            {resumo.aFaturarValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            {resumo.periodoInicio && resumo.periodoFim
              ? ` — período de ${new Date(resumo.periodoInicio + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(
                  resumo.periodoFim + 'T00:00:00',
                ).toLocaleDateString('pt-BR')}`
              : ''}
            .
          </PanelAlert>
        ) : (
          <PanelAlert tone="info">Nenhuma venda processada ainda. Envie o relatório 8022 e clique em "Processar vendas".</PanelAlert>
        )}
      </div>
    </div>
  );
}

// Corte: pedidos cortados (não atendidos) por cliente. Diferente da
// Vendas, ACUMULA — cada upload faz merge pela chave (pedido + produto),
// então reenviar o relatório é seguro (não duplica) e cada novo envio soma
// os cortes inéditos ao histórico.
function CorteSecao() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resumo, salvarResultado, limpar } = useCorte();

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  async function handleProcessar() {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const resultado = await processarCorte(file);
      salvarResultado(resultado.itens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível processar o arquivo enviado.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div style={{ marginTop: 'var(--bj-space-6)' }}>
      <div className="panel-upload-slot" style={{ maxWidth: 420 }}>
        <div className="panel-upload-slot-title">Corte (relatório 1454)</div>
        <div className="panel-upload-slot-desc">
          Pedidos cortados (não atendidos) por cliente e produto. Acumula: reenviar o relatório não duplica, só atualiza os cortes repetidos e soma os
          novos.
        </div>
        <label className="panel-button panel-upload-button">
          {file?.name ?? 'Selecionar arquivo (.xls/.xlsx)'}
          <input type="file" accept=".xls,.xlsx,.csv" onChange={handleFile} style={{ display: 'none' }} />
        </label>
      </div>
      <div className="panel-row-actions" style={{ justifyContent: 'flex-start', marginTop: 'var(--bj-space-2)' }}>
        <button type="button" className="panel-button panel-button-primary" disabled={processing || !file} onClick={handleProcessar}>
          {processing ? 'Processando…' : 'Processar corte'}
        </button>
        {resumo ? (
          <button type="button" className="panel-button" onClick={limpar}>
            Limpar corte
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
            Histórico de corte atualizado em {new Date(resumo.processadoEm).toLocaleString('pt-BR')} — {resumo.totalItens.toLocaleString('pt-BR')}{' '}
            item(ns) de {resumo.totalClientes.toLocaleString('pt-BR')} cliente(s), {resumo.qtCorteTotal.toLocaleString('pt-BR')} unidade(s) cortada(s) (
            {resumo.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
            {resumo.periodoInicio && resumo.periodoFim
              ? ` — período de ${new Date(resumo.periodoInicio + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(
                  resumo.periodoFim + 'T00:00:00',
                ).toLocaleDateString('pt-BR')}`
              : ''}
            .
          </PanelAlert>
        ) : (
          <PanelAlert tone="info">Nenhum corte processado ainda. Envie o relatório 1454 e clique em "Processar corte".</PanelAlert>
        )}
      </div>
    </div>
  );
}
