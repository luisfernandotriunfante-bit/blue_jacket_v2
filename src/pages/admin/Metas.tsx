import { PanelCard, PanelKpi, PanelSectionHeader } from '../../components/Panel';
import { useMetaTC, useMetasRca, useRcas } from '../../data/cadastros';
import { CURRENT_COMPETENCE, formatCompetencia } from '../../lib/competencia';
import { currencyFmt } from '../../lib/format';

function parseValor(raw: string): number | null {
  if (!raw.trim()) return null;
  const normalized = raw.replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isNaN(value) ? null : value;
}

// Administração > Metas — a meta da indústria é sempre a soma das metas de
// RCA cadastradas na aba Cadastros; a meta de T&C é o único valor manual
// definido diretamente aqui, por competência.
export function AdminMetas() {
  const { rcas } = useRcas();
  const { getMeta } = useMetasRca();
  const { getMetaTC, setMetaTC, removeMetaTC } = useMetaTC();

  const rcasComMeta = rcas.filter(rca => getMeta(rca.id, CURRENT_COMPETENCE) !== null);
  const metaIndustria = rcasComMeta.reduce((sum, rca) => sum + (getMeta(rca.id, CURRENT_COMPETENCE) ?? 0), 0);
  const metaTC = getMetaTC(CURRENT_COMPETENCE);

  function handleTCBlur(raw: string) {
    const valor = parseValor(raw);
    if (valor === null) {
      removeMetaTC(CURRENT_COMPETENCE);
      return;
    }
    setMetaTC(CURRENT_COMPETENCE, valor);
  }

  return (
    <>
      <PanelCard>
        <PanelSectionHeader
          eyebrow="ADMINISTRAÇÃO — METAS"
          title="Metas da competência"
          description={formatCompetencia(CURRENT_COMPETENCE)}
        />
        <div className="panel-stat-grid">
          <PanelKpi
            label="Meta Indústria"
            value={currencyFmt.format(metaIndustria)}
            caption={`Soma das metas de ${rcasComMeta.length} de ${rcas.length} RCA(s) cadastrados`}
          />
        </div>
      </PanelCard>

      <PanelCard>
        <PanelSectionHeader
          title="Meta T&C"
          description="Meta de Trade & Category para a competência atual — valor único, não ligado a um RCA."
        />
        <div className="panel-form-grid" style={{ maxWidth: 320 }}>
          <input
            key={metaTC ?? 'empty'}
            className="panel-input"
            type="text"
            inputMode="decimal"
            placeholder="Definir meta T&C"
            defaultValue={metaTC ?? ''}
            onBlur={e => handleTCBlur(e.target.value)}
          />
        </div>
      </PanelCard>
    </>
  );
}
