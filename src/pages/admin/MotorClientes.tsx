import { useState, type ChangeEvent } from 'react';
import { PanelAlert, PanelCard, PanelSectionHeader } from '../../components/Panel';
import { useMotorClientes } from '../../data/motorClientesStore';
import { processarMotorClientes } from '../../lib/motorClientes';
import { downloadCsv } from '../../lib/exportCsv';

type SlotKey = 'baseInterna1203' | 'carteiraIntegradora' | 'basePremissasColgate';

const SLOTS: { key: SlotKey; titulo: string; descricao: string }[] = [
  {
    key: 'baseInterna1203',
    titulo: 'Base interna (clientes 1203)',
    descricao: 'Cadastro Winthor: identidade, RCA/supervisor de referência, dados de crédito e SEFAZ.',
  },
  {
    key: 'carteiraIntegradora',
    titulo: 'Carteira de clientes (integradora)',
    descricao: 'Roteirização: geolocalização, frequência e dia de visita, dias sem comprar.',
  },
  {
    key: 'basePremissasColgate',
    titulo: 'Base de premissas (Colgate)',
    descricao: 'Atributos da indústria: faixa, ambiente, cluster, volume médio 12 meses, perfil de referência.',
  },
];

// Administração > Bases > Motor 1 (Motor de Clientes) — mescla, por CNPJ normalizado,
// as três fontes de dado de cliente num super-cadastro único (uma linha por
// CNPJ, com o máximo de informação disponível entre as fontes enviadas).
// Nenhum campo daqui alimenta RCA/Metas/Top Varejista/Lançamentos, que
// continuam 100% manuais — os campos de RCA e "perfil" da Colgate aqui são
// só referência de consulta.
//
// Esta página só cuida do processamento em si (upload + mesclagem). O
// resultado é guardado em bj:motorClientes:* (ver motorClientesStore) e é
// consumido em outros dois lugares: o resumo/KPIs fica em Administração >
// Auditoria (para acompanhar a saúde da mesclagem) e a lista completa de
// clientes fica em Clientes e Sortimento > Clientes.
export function MotorClientes() {
  const [files, setFiles] = useState<Partial<Record<SlotKey, File>>>({});
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { clientes, resumo, salvarResultado, limpar } = useMotorClientes();

  function handleFileChange(key: SlotKey, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFiles(prev => ({ ...prev, [key]: file }));
  }

  async function handleProcessar() {
    if (!files.baseInterna1203 && !files.carteiraIntegradora && !files.basePremissasColgate) return;
    setProcessing(true);
    setError(null);
    try {
      const resultado = await processarMotorClientes(files);
      salvarResultado(resultado.clientes, resultado.resumo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível processar os arquivos enviados.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <PanelCard>
      <PanelSectionHeader
        eyebrow="ADMINISTRAÇÃO — BASES — MOTOR 1"
        title="Motor de Clientes"
        description="Envie as três fontes abaixo (o que tiver disponível) e o motor mescla por CNPJ normalizado, deduplica e monta uma base única com o máximo de informação por cliente. Roda inteiramente no navegador — nenhum arquivo sai daqui."
      />
      <div className="panel-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {SLOTS.map(slot => (
          <div key={slot.key} className="panel-upload-slot">
            <div className="panel-upload-slot-title">{slot.titulo}</div>
            <div className="panel-upload-slot-desc">{slot.descricao}</div>
            <label className="panel-button panel-upload-button">
              {files[slot.key]?.name ?? 'Selecionar arquivo (.xls/.xlsx)'}
              <input
                type="file"
                accept=".xls,.xlsx,.csv"
                onChange={e => handleFileChange(slot.key, e)}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        ))}
      </div>
      <div className="panel-row-actions" style={{ justifyContent: 'flex-start', marginTop: 'var(--bj-space-2)' }}>
        <button
          type="button"
          className="panel-button panel-button-primary"
          disabled={processing || (!files.baseInterna1203 && !files.carteiraIntegradora && !files.basePremissasColgate)}
          onClick={handleProcessar}
        >
          {processing ? 'Processando…' : 'Processar e mesclar'}
        </button>
        {clientes.length > 0 ? (
          <button
            type="button"
            className="panel-button"
            onClick={() => downloadCsv(`motor-clientes-${new Date().toISOString().slice(0, 10)}.csv`, clientes)}
          >
            Baixar planilha (CSV)
          </button>
        ) : null}
        {clientes.length > 0 ? (
          <button type="button" className="panel-button" onClick={limpar}>
            Limpar base consolidada
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
            Base processada em {new Date(resumo.processadoEm).toLocaleString('pt-BR')} — {resumo.totalClientes.toLocaleString('pt-BR')} cliente(s) consolidado(s).
            O resumo completo está em Administração → Auditoria e a lista de clientes em Clientes e Sortimento → Clientes.
          </PanelAlert>
        ) : (
          <PanelAlert tone="info">Nenhuma base processada ainda. Envie ao menos um arquivo e clique em "Processar e mesclar".</PanelAlert>
        )}
      </div>
    </PanelCard>
  );
}
