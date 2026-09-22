import { PanelAlert, PanelCard, PanelSectionHeader } from '../../components/Panel';
import { useLancamentoMarks } from '../../data/cadastros';
import { PRODUTOS_BASE } from '../../data/mockBase';
import { CURRENT_COMPETENCE, formatCompetencia } from '../../lib/competencia';

// Estoque > Lançamentos — visão só-leitura (com opção de remover a
// marcação) do que foi marcado como lançamento na aba Produtos.
export function EstoqueLancamentos() {
  const { marks, removeLancamento } = useLancamentoMarks();

  const rows = marks
    .filter(mark => mark.competencia === CURRENT_COMPETENCE)
    .map(mark => ({ mark, produto: PRODUTOS_BASE.find(p => p.id === mark.produtoId) }))
    .filter((row): row is { mark: (typeof marks)[number]; produto: NonNullable<(typeof row)['produto']> } =>
      Boolean(row.produto),
    );

  return (
    <PanelCard>
      <PanelSectionHeader
        eyebrow="ESTOQUE — LANÇAMENTOS"
        title="Lançamentos"
        description={`Itens marcados como lançamento em ${formatCompetencia(CURRENT_COMPETENCE)}. A marcação é feita na aba Produtos.`}
      />
      {rows.length === 0 ? (
        <PanelAlert tone="info">Nenhum item marcado como lançamento nesta competência.</PanelAlert>
      ) : (
        <div className="panel-table-wrap">
          <table className="panel-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Linha</th>
                <th>Tipo</th>
                <th className="is-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ mark, produto }) => (
                <tr key={produto.id}>
                  <td className="is-strong">{produto.codigo}</td>
                  <td>{produto.descricao}</td>
                  <td>{produto.linha}</td>
                  <td>
                    {mark.tipo === 'pex' ? (
                      <span className="panel-status-pill panel-status-critical">PEX</span>
                    ) : (
                      <span className="panel-status-pill panel-status-ok">Normal</span>
                    )}
                  </td>
                  <td className="is-right">
                    <button
                      type="button"
                      className="panel-chip"
                      onClick={() => removeLancamento(produto.id, CURRENT_COMPETENCE)}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PanelCard>
  );
}
