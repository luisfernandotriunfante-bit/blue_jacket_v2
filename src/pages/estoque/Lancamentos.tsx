import { PanelAlert, PanelCard, PanelSectionHeader } from '../../components/Panel';
import { useLancamentoMarks } from '../../data/cadastros';
import { useMotorProdutos } from '../../data/motorProdutosStore';
import { CURRENT_COMPETENCE, formatCompetencia } from '../../lib/competencia';

// Estoque > Lançamentos — visão só-leitura (com opção de remover a
// marcação) do que foi marcado como lançamento na aba Produtos. A chave de
// lançamento é código interno (ou SKU/EAN para itens só-indústria) — a
// mesma usada em Estoque > Produtos.
function produtoKey(p: { codigoInterno?: string; skuFabricante?: string; ean?: string }, index: number): string {
  return p.codigoInterno ?? p.skuFabricante ?? p.ean ?? `sem-chave-${index}`;
}

export function EstoqueLancamentos() {
  const { marks, removeLancamento } = useLancamentoMarks();
  const { produtos } = useMotorProdutos();

  const produtosPorChave = new Map(produtos.map((p, index) => [produtoKey(p, index), p]));

  const rows = marks
    .filter(mark => mark.competencia === CURRENT_COMPETENCE)
    .map(mark => ({ mark, produto: produtosPorChave.get(mark.produtoId) }))
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
                <th>Embalagem</th>
                <th>Tipo</th>
                <th className="is-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ mark, produto }) => (
                <tr key={mark.produtoId}>
                  <td className="is-strong">{produto.codigoInterno ?? <span className="panel-muted">sem código</span>}</td>
                  <td>{produto.descricao ?? produto.descricaoIndustria ?? '—'}</td>
                  <td>{produto.embalagem ?? '—'}</td>
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
                      onClick={() => removeLancamento(mark.produtoId, CURRENT_COMPETENCE)}
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
