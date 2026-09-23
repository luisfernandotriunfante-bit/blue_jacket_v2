// Competência atual do Motor 4 (Vendas + Corte) — rastreada separadamente
// da competência usada pelas marcações manuais (metas, top varejistas,
// lançamentos em estoque — CURRENT_COMPETENCE em src/lib/competencia.ts,
// que por ora continua fixa; não fazia parte deste fechamento).
//
// O fechamento em si é sempre uma ação manual (botão "Fechar competência"
// na UI) — este store só guarda qual é a competência aberta agora, avisa
// quando o relógio do sistema já virou o mês sem ela ter sido fechada, e
// registra o histórico de fechamentos já feitos.

import { usePersistedState } from '../lib/storage';
import { CURRENT_COMPETENCE } from '../lib/competencia';

const KEY_COMPETENCIA_ATUAL = 'bj:motor4:competenciaAtual';
const KEY_HISTORICO = 'bj:motor4:historicoFechamentos';

export type FechamentoLog = {
  competencia: string; // competência que foi fechada
  fechadoEm: string; // ISO datetime
  produtosVendas: number; // combinações competencia+produto geradas em Vendas
  produtosCorte: number; // combinações competencia+produto geradas em Corte
};

function competenciaReal(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
}

function proximaCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split('-').map(Number);
  const d = new Date(ano, mes, 1); // mes já é 1-indexado no input -> vira o 1º dia do mês seguinte
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function useCompetenciaMotor4() {
  const [competenciaAtual, setCompetenciaAtual] = usePersistedState<string>(KEY_COMPETENCIA_ATUAL, CURRENT_COMPETENCE);
  const [historico, setHistorico] = usePersistedState<FechamentoLog[]>(KEY_HISTORICO, []);

  // true quando o mês do relógio real já passou do mês da competência
  // aberta — sinal para o aviso automático de fechamento pendente.
  const viradaPendente = competenciaReal() > competenciaAtual;

  function registrarFechamento(produtosVendas: number, produtosCorte: number) {
    const competenciaFechada = competenciaAtual;
    const proxima = proximaCompetencia(competenciaFechada);
    setHistorico(h => [
      ...h,
      { competencia: competenciaFechada, fechadoEm: new Date().toISOString(), produtosVendas, produtosCorte },
    ]);
    setCompetenciaAtual(proxima);
    return { competenciaFechada, proxima };
  }

  return { competenciaAtual, historico, viradaPendente, registrarFechamento };
}
