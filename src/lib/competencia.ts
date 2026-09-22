// The competência (month) manual data and markings apply to. Fixed for now
// — the auto-closing/rollover behavior (current competência becomes
// historical, a new one opens) is a motor to design later.

export const CURRENT_COMPETENCE = '2026-09';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function formatCompetencia(competencia: string): string {
  const [year, month] = competencia.split('-').map(Number);
  const label = MONTHS[(month ?? 1) - 1] ?? competencia;
  return `${label} ${year}`;
}
