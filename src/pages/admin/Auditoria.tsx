import { PanelAlert, PanelCard, PanelKpi, PanelSectionHeader } from '../../components/Panel';
import { useMotorClientes } from '../../data/motorClientesStore';

// Administração > Auditoria — painel de conferência dos motores de dados.
// Por enquanto só existe o resumo do Motor 1 (Motor de Clientes): quantos
// clientes vieram de cada fonte, quantos bateram nas três fontes e quantos
// só existem numa fonte isolada (sinal de possível problema de cadastro).
// O upload/processamento em si fica em Administração > Bases > Motor 1; a
// lista completa de clientes fica em Clientes e Sortimento > Clientes.
export function AdminAuditoria() {
  const { resumo } = useMotorClientes();

  return (
    <>
      {resumo ? (
        <PanelCard>
          <PanelSectionHeader
            eyebrow="ADMINISTRAÇÃO — AUDITORIA — MOTOR 1"
            title="Base consolidada (Motor de Clientes)"
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
        <PanelAlert tone="info">
          Nenhuma base processada ainda pelo Motor 1. Envie os arquivos em Administração → Bases e volte aqui para conferir o resumo da mesclagem.
        </PanelAlert>
      )}
    </>
  );
}
