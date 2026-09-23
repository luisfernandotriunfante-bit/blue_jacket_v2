import { useMemo, useState } from 'react';
import { PanelAlert, PanelCard, PanelSectionHeader } from '../../components/Panel';
import { useTopVarejistaMarks } from '../../data/cadastros';
import { useMotorClientes } from '../../data/motorClientesStore';
import { CLIENTES_BASE } from '../../data/mockBase';
import { downloadCsv } from '../../lib/exportCsv';
import { CURRENT_COMPETENCE, formatCompetencia } from '../../lib/competencia';

const ORIGEM_LABEL: Record<string, string> = {
  base_interna_1203: '1203',
  carteira_integradora: 'Carteira',
  base_premissas_colgate: 'Colgate',
};

// Clientes e Sortimento > Clientes — busca por CNPJ/razão social e marcação
// de top varejista; a aba Top Varejistas só mostra o que já foi marcado.
export function ClientesLista() {
  const [query, setQuery] = useState('');
  const { isTop, markTop, unmarkTop } = useTopVarejistaMarks();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/[.\-/]/g, '');
    if (!q) return CLIENTES_BASE;
    return CLIENTES_BASE.filter(
      c => c.cnpj.replace(/[.\-/]/g, '').includes(q) || c.razaoSocial.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <>
      <PanelCard>
        <PanelSectionHeader
          eyebrow="CLIENTES E SORTIMENTO — CLIENTES"
          title="Clientes"
          description={`Busque pelo CNPJ e marque os clientes top varejistas de ${formatCompetencia(CURRENT_COMPETENCE)}.`}
        />
        <div className="panel-form-grid" style={{ maxWidth: 360 }}>
          <input
            className="panel-input"
            placeholder="Buscar por CNPJ ou razão social"
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
                <th>Cidade</th>
                <th>Top varejista</th>
                <th className="is-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(cliente => {
                const top = isTop(cliente.id, CURRENT_COMPETENCE);
                return (
                  <tr key={cliente.id}>
                    <td className="is-strong">{cliente.cnpj}</td>
                    <td>{cliente.razaoSocial}</td>
                    <td>{cliente.cidade}/{cliente.uf}</td>
                    <td>
                      {top ? (
                        <span className="panel-status-pill panel-status-ok">Top varejista</span>
                      ) : (
                        <span className="panel-muted">—</span>
                      )}
                    </td>
                    <td className="is-right">
                      <button
                        type="button"
                        className="panel-chip"
                        aria-selected={top}
                        onClick={() => (top ? unmarkTop(cliente.id, CURRENT_COMPETENCE) : markTop(cliente.id, CURRENT_COMPETENCE))}
                      >
                        {top ? 'Remover marcação' : 'Marcar como top'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PanelCard>
      <ClientesBaseConsolidada />
    </>
  );
}

// Base consolidada do Motor 1 (Motor de Clientes, em Administração > Bases):
// super-cadastro único por CNPJ, mesclando as três fontes. É só consulta —
// nenhum campo daqui alimenta a marcação de top varejista acima, que
// continua 100% manual. O resumo/KPIs da mesclagem ficam em Administração >
// Auditoria; aqui é a lista completa, linha a linha.
function ClientesBaseConsolidada() {
  const { clientes, resumo } = useMotorClientes();
  const [query, setQuery] = useState('');

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

  if (!resumo || clientes.length === 0) {
    return (
      <PanelAlert tone="info">
        Base consolidada do Motor 1 ainda vazia. Processe os arquivos em Administração → Bases para ver a lista completa de clientes aqui.
      </PanelAlert>
    );
  }

  return (
    <PanelCard>
      <PanelSectionHeader
        eyebrow="CLIENTES E SORTIMENTO — BASE CONSOLIDADA (MOTOR 1)"
        title="Clientes (base consolidada)"
        description={`${filtered.length.toLocaleString('pt-BR')} cliente(s) na busca atual${filtered.length > visiveis.length ? ` — mostrando os primeiros ${visiveis.length}` : ''}. RCA e perfil Colgate aqui são só referência de consulta.`}
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
  );
}
