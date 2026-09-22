import { useState, type FormEvent } from 'react';
import { PanelAlert, PanelCard, PanelSectionHeader } from '../../components/Panel';
import { IconTrash } from '../../components/icons';
import { useMetasRca, useRcas } from '../../data/cadastros';
import { CURRENT_COMPETENCE, formatCompetencia } from '../../lib/competencia';

const EMPTY_FORM = { numeroAtual: '', numeroAntigo: '', nome: '', codCoordenador: '', nomeCoordenador: '' };

function parseValor(raw: string): number | null {
  if (!raw.trim()) return null;
  const normalized = raw.replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isNaN(value) ? null : value;
}

// Administração > Cadastros — cadastro de RCA (com a hierarquia de
// coordenação nos próprios campos) e, na mesma linha, a meta do RCA para a
// competência atual. A meta só existe depois que o RCA já está cadastrado.
export function AdminCadastros() {
  const { rcas, addRca, removeRca } = useRcas();
  const { getMeta, setMeta, removeMeta } = useMetasRca();
  const [form, setForm] = useState(EMPTY_FORM);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.numeroAtual.trim() || !form.nome.trim()) return;
    addRca(form);
    setForm(EMPTY_FORM);
  }

  function handleMetaBlur(rcaId: string, raw: string) {
    const valor = parseValor(raw);
    if (valor === null) {
      removeMeta(rcaId, CURRENT_COMPETENCE);
      return;
    }
    setMeta(rcaId, CURRENT_COMPETENCE, valor);
  }

  return (
    <>
      <PanelCard>
        <PanelSectionHeader
          eyebrow="ADMINISTRAÇÃO — CADASTROS"
          title="Cadastro de RCAs"
          description="Registre os RCAs com a hierarquia de coordenação. Depois de cadastrado, defina a meta do RCA para a competência atual direto na linha da tabela."
        />
        <form className="panel-form-grid" onSubmit={handleSubmit}>
          <input
            className="panel-input"
            placeholder="Número atual"
            value={form.numeroAtual}
            onChange={e => setForm(f => ({ ...f, numeroAtual: e.target.value }))}
            required
          />
          <input
            className="panel-input"
            placeholder="Número antigo"
            value={form.numeroAntigo}
            onChange={e => setForm(f => ({ ...f, numeroAntigo: e.target.value }))}
          />
          <input
            className="panel-input"
            placeholder="Nome do RCA"
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            required
          />
          <input
            className="panel-input"
            placeholder="Cód. coordenador"
            value={form.codCoordenador}
            onChange={e => setForm(f => ({ ...f, codCoordenador: e.target.value }))}
          />
          <input
            className="panel-input"
            placeholder="Nome do coordenador"
            value={form.nomeCoordenador}
            onChange={e => setForm(f => ({ ...f, nomeCoordenador: e.target.value }))}
          />
          <button type="submit" className="panel-button panel-button-primary">Cadastrar RCA</button>
        </form>
      </PanelCard>

      <PanelCard>
        <PanelSectionHeader
          title="RCAs cadastrados"
          description={`Meta referente à competência de ${formatCompetencia(CURRENT_COMPETENCE)}.`}
        />
        {rcas.length === 0 ? (
          <PanelAlert tone="info">Nenhum RCA cadastrado ainda.</PanelAlert>
        ) : (
          <div className="panel-table-wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Nº atual</th>
                  <th>Nº antigo</th>
                  <th>Nome</th>
                  <th>Cód. coordenador</th>
                  <th>Coordenador</th>
                  <th>Meta ({formatCompetencia(CURRENT_COMPETENCE)})</th>
                  <th className="is-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rcas.map(rca => {
                  const meta = getMeta(rca.id, CURRENT_COMPETENCE);
                  return (
                    <tr key={rca.id}>
                      <td className="is-strong">{rca.numeroAtual}</td>
                      <td>{rca.numeroAntigo || '—'}</td>
                      <td>{rca.nome}</td>
                      <td>{rca.codCoordenador || '—'}</td>
                      <td>{rca.nomeCoordenador || '—'}</td>
                      <td>
                        <input
                          key={meta ?? 'empty'}
                          className="panel-input panel-input-inline"
                          type="text"
                          inputMode="decimal"
                          placeholder="Definir meta"
                          defaultValue={meta ?? ''}
                          onBlur={e => handleMetaBlur(rca.id, e.target.value)}
                        />
                      </td>
                      <td className="is-right">
                        <button
                          type="button"
                          className="panel-icon-button"
                          aria-label={`Remover RCA ${rca.nome}`}
                          onClick={() => removeRca(rca.id)}
                        >
                          <IconTrash size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PanelCard>
    </>
  );
}
