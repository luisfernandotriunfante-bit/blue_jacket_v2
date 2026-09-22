import { PanelAlert, PanelCard, PanelSectionHeader } from '../../components/Panel';
import { useTopVarejistaMarks } from '../../data/cadastros';
import { CLIENTES_BASE } from '../../data/mockBase';
import { CURRENT_COMPETENCE, formatCompetencia } from '../../lib/competencia';

// Clientes e Sortimento > Top Varejistas — visão só-leitura (com opção de
// remover a marcação) do que foi marcado na aba Clientes.
export function ClientesTopVarejistas() {
  const { marks, unmarkTop } = useTopVarejistaMarks();

  const rows = marks
    .filter(mark => mark.competencia === CURRENT_COMPETENCE)
    .map(mark => CLIENTES_BASE.find(c => c.id === mark.clienteId))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <PanelCard>
      <PanelSectionHeader
        eyebrow="CLIENTES E SORTIMENTO — TOP VAREJISTAS"
        title="Top varejistas"
        description={`Clientes marcados como top varejista em ${formatCompetencia(CURRENT_COMPETENCE)}. A marcação é feita na aba Clientes.`}
      />
      {rows.length === 0 ? (
        <PanelAlert tone="info">Nenhum cliente marcado como top varejista nesta competência.</PanelAlert>
      ) : (
        <div className="panel-table-wrap">
          <table className="panel-table">
            <thead>
              <tr>
                <th>CNPJ</th>
                <th>Razão social</th>
                <th>Cidade</th>
                <th className="is-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(cliente => (
                <tr key={cliente.id}>
                  <td className="is-strong">{cliente.cnpj}</td>
                  <td>{cliente.razaoSocial}</td>
                  <td>{cliente.cidade}/{cliente.uf}</td>
                  <td className="is-right">
                    <button type="button" className="panel-chip" onClick={() => unmarkTop(cliente.id, CURRENT_COMPETENCE)}>
                      Remover marcação
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
