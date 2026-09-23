import { useState, type ChangeEvent } from 'react';
import { PanelAlert, PanelCard, PanelSectionHeader } from '../../components/Panel';
import { useMotorHistorico } from '../../data/motorHistoricoStore';
import { processarMotorHistorico } from '../../lib/motorHistorico';

// Administração > Bases > Motor 3 (Motor Histórico) — última fotografia do
// ERP antigo (fontes variadas), para consulta de dados de competências
// passadas por qualquer parte do sistema. Ver src/lib/motorHistorico.ts
// para os detalhes de cada fonte.
//
// Diferente dos motores anteriores, este roda uma ÚNICA VEZ: cobre o
// período antes da virada do ERP (até jul/2026) e não precisa ser
// reprocessado depois — o futuro Motor 4 (movimentações atuais) continua a
// série a partir de ago/2026. Por enquanto não há página própria que
// consuma este resultado; ele fica guardado (IndexedDB — ver
// motorHistoricoStore.ts) como base de apoio para quando o Motor 4 for
// construído.
//
// Fonte deliberadamente fora do motor: Rapel — vira cadastro manual à parte.
export function MotorHistorico() {
  const [vendas2026, setVendas2026] = useState<File | null>(null);
  const [vendas2025, setVendas2025] = useState<File | null>(null);
  const [notas12322, setNotas12322] = useState<File | null>(null);
  const [compras310, setCompras310] = useState<File | null>(null);
  const [anoCompras310, setAnoCompras310] = useState('2026');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { carregando, resumo, salvarResultado, limpar } = useMotorHistorico();

  const hasAnyFile = Boolean(vendas2026 || vendas2025 || notas12322 || compras310);

  function pick(setter: (f: File | null) => void) {
    return (e: ChangeEvent<HTMLInputElement>) => setter(e.target.files?.[0] ?? null);
  }

  async function handleProcessar() {
    if (!hasAnyFile) return;
    setProcessing(true);
    setError(null);
    try {
      const resultado = await processarMotorHistorico({
        vendas379: [vendas2026, vendas2025].filter((f): f is File => Boolean(f)),
        chegadaNotas12322: notas12322 ?? undefined,
        comprasClienteAno310: compras310 ? { file: compras310, ano: anoCompras310.trim() || '2026' } : undefined,
      });
      await salvarResultado(resultado.vendasMensais, resultado.notasEntrada, resultado.comprasAnuais, resultado.resumo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível processar os arquivos enviados.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <PanelCard>
      <PanelSectionHeader
        eyebrow="ADMINISTRAÇÃO — BASES — MOTOR 3"
        title="Motor Histórico"
        description="Última fotografia do ERP antigo, antes da virada de sistema (até jul/2026). Roda uma única vez — o resultado fica guardado para servir de base ao futuro Motor 4, que traz as movimentações a partir de ago/2026. Roda inteiramente no navegador — nenhum arquivo sai daqui."
      />
      <div className="panel-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div className="panel-upload-slot">
          <div className="panel-upload-slot-title">Vendas 379 — 2026 (jan-jul)</div>
          <div className="panel-upload-slot-desc">Analítico detalhado de vendas, período antes da virada do ERP.</div>
          <label className="panel-button panel-upload-button">
            {vendas2026?.name ?? 'Selecionar arquivo (.txt)'}
            <input type="file" accept=".txt" onChange={pick(setVendas2026)} style={{ display: 'none' }} />
          </label>
        </div>
        <div className="panel-upload-slot">
          <div className="panel-upload-slot-title">Vendas 379 — 2025 (completo)</div>
          <div className="panel-upload-slot-desc">Analítico detalhado de vendas do ano anterior, completo.</div>
          <label className="panel-button panel-upload-button">
            {vendas2025?.name ?? 'Selecionar arquivo (.txt)'}
            <input type="file" accept=".txt" onChange={pick(setVendas2025)} style={{ display: 'none' }} />
          </label>
        </div>
        <div className="panel-upload-slot">
          <div className="panel-upload-slot-title">Chegada de notas (12322)</div>
          <div className="panel-upload-slot-desc">Relação de notas fiscais de entrada — uma linha por nota.</div>
          <label className="panel-button panel-upload-button">
            {notas12322?.name ?? 'Selecionar arquivo (.txt)'}
            <input type="file" accept=".txt" onChange={pick(setNotas12322)} style={{ display: 'none' }} />
          </label>
        </div>
        <div className="panel-upload-slot">
          <div className="panel-upload-slot-title">Compras por cliente (310) — apoio</div>
          <div className="panel-upload-slot-desc">
            Só dá totais anuais (sem mês) — usado apenas para preencher lacunas do 379.
          </div>
          <label className="panel-button panel-upload-button">
            {compras310?.name ?? 'Selecionar arquivo (.txt)'}
            <input type="file" accept=".txt" onChange={pick(setCompras310)} style={{ display: 'none' }} />
          </label>
          {compras310 ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--bj-space-2)', marginTop: 'var(--bj-space-2)' }}>
              <span style={{ fontSize: '0.85em' }}>Ano do arquivo:</span>
              <input
                type="text"
                value={anoCompras310}
                onChange={e => setAnoCompras310(e.target.value)}
                className="panel-input panel-input-inline"
                style={{ width: '5em' }}
              />
            </label>
          ) : null}
        </div>
      </div>
      <div className="panel-row-actions" style={{ justifyContent: 'flex-start', marginTop: 'var(--bj-space-2)' }}>
        <button
          type="button"
          className="panel-button panel-button-primary"
          disabled={processing || !hasAnyFile}
          onClick={handleProcessar}
        >
          {processing ? 'Processando…' : 'Processar e mesclar'}
        </button>
        {resumo ? (
          <button type="button" className="panel-button" onClick={limpar}>
            Limpar base histórica
          </button>
        ) : null}
      </div>
      {error ? (
        <div style={{ marginTop: 'var(--bj-space-4)' }}>
          <PanelAlert tone="error">{error}</PanelAlert>
        </div>
      ) : null}
      <div style={{ marginTop: 'var(--bj-space-4)' }}>
        {carregando ? (
          <PanelAlert tone="info">Carregando base histórica…</PanelAlert>
        ) : resumo ? (
          <PanelAlert tone="success">
            Base processada em {new Date(resumo.processadoEm).toLocaleString('pt-BR')} — {resumo.totalCombinacoesVendaMensal.toLocaleString('pt-BR')}{' '}
            combinações competência+produto ({resumo.totalRegistrosVenda.toLocaleString('pt-BR')} lançamentos de venda), cobrindo{' '}
            {resumo.competenciasCobertas.length} competência(s) — de {resumo.competenciasCobertas[0] ?? '—'} a{' '}
            {resumo.competenciasCobertas[resumo.competenciasCobertas.length - 1] ?? '—'}. {resumo.totalNotasEntrada.toLocaleString('pt-BR')}{' '}
            nota(s) de entrada. {resumo.totalProdutosComCompraAnual.toLocaleString('pt-BR')} produto(s) com compra anual (310)
            {resumo.produtosSomenteEm310.length > 0
              ? `, sendo ${resumo.produtosSomenteEm310.length.toLocaleString('pt-BR')} sem nenhum registro no 379 (lacuna)`
              : ''}
            .
          </PanelAlert>
        ) : (
          <PanelAlert tone="info">Nenhuma base histórica processada ainda. Envie ao menos um arquivo e clique em "Processar e mesclar".</PanelAlert>
        )}
      </div>
    </PanelCard>
  );
}
