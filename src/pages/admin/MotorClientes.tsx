import { useMemo, useState, type ChangeEvent } from 'react';
import { PanelAlert, PanelCard, PanelKpi, PanelSectionHeader } from '../../components/Panel';
import { useMotorClientes } from '../../data/motorClientesStore';
import { downloadCsv } from '../../lib/exportCsv';
import { processarMotorClientes } from '../../lib/motorClientes';

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

const ORIGEM_LABEL: Record<string, string> = {
  base_interna_1203: '1203',
  carteira_integradora: 'Carteira',
  base_premissas_colgate: 'Colgate',
};

// Administração > Bases > Motor 1 (Motor de Clientes) — mescla, por CNPJ normalizado,
// as três fontes de dado de cliente num super-cadastro único (uma linha por
// CNPJ, com o máximo de informação disponível entre as fontes enviadas).
// Nenhum campo daqui alimenta RCA/Metas/Top Varejista/Lançamentos, que
// continuam 100% manuais — os campos de RCA e "perfil" da Colgate aqui são
// só referência de consulta.
export function MotorClientes() {
  const [files, setFiles] = useState<Partial<Record<SlotKey, File>>>({});
  const [query, setQuery] = useState('');
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/[.\-/]/g, '');
    if (!q) return clientes;
    return clientes.filter(
      c =>
        c.cnpjNormalizado.includes(q) ||
        c.nomeRazaoSocial?.toLowerCase().includes(q) ||
        c.nomeFantasia?.toLowerCase().includes(q),
    );
  }, [clientes, query]);

  const visiveis = filtered.slice(0, 300);

  return (
    <>
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
      </PanelCard>

      {resumo ? (
        <PanelCard>
          <PanelSectionHeader
            title="Base consolidada"
            description={`Processado em ${new Date(resumo.processadoEm).toLocaleString('pt-BR')}. Firewall mantido: RCA/supervisor e o perfil da Colgate aqui são só referência — não alimentam os cadastros manuais de RCA ou Top Varejista.`}
          />
          <div className="panel-stat-grid">
            <PanelKpi label="Clientes na base" value={resumo.totalClientes.toLocaleString('pt-BR')} />
            <PanelKpi label="Com base interna (1203)" value={resumo.comBaseInterna.toLocaleString('pt-BR')} />
            <PanelKpi label="Com carteira/roteirização" value={resumo.comCarteiraIntegradora.toLocaleString('pt-BR')} />
            <PanelKpi label="Com dados Colgate" value={resumo.comBasePremissasColgate.toLocaleString('pt-BR')} />
            <PanelKpi label="Com as três fontes" value={resumo.comTresFontes.toLocaleString('pt-BR')} />
            <PanelKpi label="Só carteira integradora" value={resumo.somenteCarteiraIntegradora.toLocaleString('pt-BR')} caption="Não existe em 1203 nem na base Colgate" />
            <PanelKpi label="Só base Colgate" value={resumo.somenteBasePremissasColgate.toLocaleString('pt-BR')} caption="Não existe em 1203 nem na carteira" />
          </div>
        </PanelCard>
      ) : (
        <PanelAlert tone="info">Nenhuma base processada ainda. Envie ao menos um arquivo e clique em "Processar e mesclar".</PanelAlert>
      )}

      {clientes.length > 0 ? (
        <PanelCard>
          <PanelSectionHeader
            title="Clientes"
            description={`${filtered.length.toLocaleString('pt-BR')} cliente(s) na busca atual${filtered.length > visiveis.length ? ` — mostrando os primeiros ${visiveis.length}` : ''}.`}
            action={
              <button type="button" className="panel-button" onClick={() => downloadCsv('motor-clientes.csv', filtered as unknown as Record<string, unknown>[])}>
                Exportar CSV ({filtered.length.toLocaleString('pt-BR')})
              </button>
            }
          />
          <div className="panel-form-grid" style={{ maxWidth: 360 }}>
            <input
              className="panel-input"
              placeholder="Buscar por CNPJ, razão social ou fantasia"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="panel-table-wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>CNPJ</th>
                  <th>Razão social</th>
                  <th>Fantasia</th>
                  <th>Município</th>
                  <th>RCA ref.</th>
                  <th>Perfil Colgate ref.</th>
                  <th>Geo</th>
                  <th>Fontes</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map(c => (
                  <tr key={c.cnpjNormalizado}>
                    <td className="is-strong">{c.cnpjNormalizado}</td>
                    <td>{c.nomeRazaoSocial ?? '—'}</td>
                    <td>{c.nomeFantasia ?? '—'}</td>
                    <td>{c.municipio1203 ?? c.cidadeCarteira ?? '—'}</td>
                    <td className="panel-muted">{c.rcaRefTexto ?? '—'}</td>
                    <td className="panel-muted">{c.colgatePerfilReferencia ?? '—'}</td>
                    <td>{c.latitude && c.longitude ? <span className="panel-status-pill panel-status-ok">Sim</span> : <span className="panel-muted">—</span>}</td>
                    <td>
                      <div className="panel-row-actions" style={{ justifyContent: 'flex-start' }}>
                        {c.origens.map(o => (
                          <span key={o} className="panel-badge">{ORIGEM_LABEL[o] ?? o}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PanelCard>
      ) : null}
    </>
  );
}
