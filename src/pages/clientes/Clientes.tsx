import { useMemo, useState } from 'react';
import { PanelCard, PanelSectionHeader } from '../../components/Panel';
import { useTopVarejistaMarks } from '../../data/cadastros';
import { CLIENTES_BASE } from '../../data/mockBase';
import { CURRENT_COMPETENCE, formatCompetencia } from '../../lib/competencia';

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
  );
}
