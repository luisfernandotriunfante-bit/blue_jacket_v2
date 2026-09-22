import { useMemo, useState } from 'react';
import { PanelCard, PanelSectionHeader } from '../../components/Panel';
import { useLancamentoMarks } from '../../data/cadastros';
import { PRODUTOS_BASE } from '../../data/mockBase';
import { CURRENT_COMPETENCE, formatCompetencia } from '../../lib/competencia';

// Estoque > Produtos — a marcação de lançamento (normal ou PEX) é feita
// aqui, item a item; a aba Lançamentos só mostra o que já foi marcado.
export function EstoqueProdutos() {
  const [query, setQuery] = useState('');
  const { getLancamento, setLancamento, removeLancamento } = useLancamentoMarks();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PRODUTOS_BASE;
    return PRODUTOS_BASE.filter(p => p.codigo.includes(q) || p.descricao.toLowerCase().includes(q));
  }, [query]);

  return (
    <PanelCard>
      <PanelSectionHeader
        eyebrow="ESTOQUE — PRODUTOS"
        title="Produtos"
        description={`Busque um item e marque como lançamento (normal ou PEX) para a competência de ${formatCompetencia(CURRENT_COMPETENCE)}.`}
      />
      <div className="panel-form-grid" style={{ maxWidth: 360 }}>
        <input
          className="panel-input"
          placeholder="Buscar por código ou descrição"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      <div className="panel-table-wrap">
        <table className="panel-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Linha</th>
              <th>Lançamento</th>
              <th className="is-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(produto => {
              const tipo = getLancamento(produto.id, CURRENT_COMPETENCE);
              return (
                <tr key={produto.id}>
                  <td className="is-strong">{produto.codigo}</td>
                  <td>{produto.descricao}</td>
                  <td>{produto.linha}</td>
                  <td>
                    {tipo === 'pex' ? (
                      <span className="panel-status-pill panel-status-critical">PEX</span>
                    ) : tipo === 'normal' ? (
                      <span className="panel-status-pill panel-status-ok">Normal</span>
                    ) : (
                      <span className="panel-muted">—</span>
                    )}
                  </td>
                  <td className="is-right">
                    <div className="panel-row-actions">
                      <button
                        type="button"
                        className="panel-chip"
                        aria-selected={tipo === 'normal'}
                        onClick={() => setLancamento(produto.id, CURRENT_COMPETENCE, 'normal')}
                      >
                        Normal
                      </button>
                      <button
                        type="button"
                        className="panel-chip"
                        aria-selected={tipo === 'pex'}
                        onClick={() => setLancamento(produto.id, CURRENT_COMPETENCE, 'pex')}
                      >
                        PEX
                      </button>
                      {tipo ? (
                        <button
                          type="button"
                          className="panel-chip"
                          onClick={() => removeLancamento(produto.id, CURRENT_COMPETENCE)}
                        >
                          Remover
                        </button>
                      ) : null}
                    </div>
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
