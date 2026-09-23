// Persistência do resultado do Motor de Clientes — segue o mesmo padrão
// local-first (localStorage) das demais coleções, mas isolado das bases
// manuais (RCA/Metas/Top Varejista/Lançamentos): este motor só guarda o
// super-cadastro consolidado, nunca escreve nas coleções manuais.

import { usePersistedState } from '../lib/storage';
import type { ClienteEnriquecido, MotorClientesResumo } from './clienteMotorTypes';

export function useMotorClientes() {
  const [clientes, setClientes] = usePersistedState<ClienteEnriquecido[]>('bj:motorClientes:base', []);
  const [resumo, setResumo] = usePersistedState<MotorClientesResumo | null>('bj:motorClientes:resumo', null);

function salvarResultado(novosClientes: ClienteEnriquecido[], novoResumo: MotorClientesResumo) {
  setClientes(novosClientes);
  setResumo(novoResumo);
}

function limpar() {
  setClientes([]);
  setResumo(null);
}

return { clientes, resumo, salvarResultado, limpar };
}
