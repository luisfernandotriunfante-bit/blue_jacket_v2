// Persistência do Motor de Movimentações (Motor 4) — localStorage, mesmo
// padrão do Motor de Produtos: cada fonte tem seu volume pequeno o
// suficiente (centenas/poucos milhares de linhas), ao contrário do Motor
// Histórico. A Carteira é sempre substituída inteira a cada upload (ver
// motorMovimentacoesTypes.ts); as próximas fontes (entrada de notas,
// vendas, corte) vão acumular por competência quando forem implementadas.

import { usePersistedState } from '../lib/storage';
import type { CarteiraItem, MotorCarteiraResumo } from './motorMovimentacoesTypes';

export function useCarteira() {
  const [itens, setItens] = usePersistedState<CarteiraItem[]>('bj:motorMovimentacoes:carteira', []);
  const [resumo, setResumo] = usePersistedState<MotorCarteiraResumo | null>('bj:motorMovimentacoes:carteiraResumo', null);

  function salvarResultado(novosItens: CarteiraItem[], novoResumo: MotorCarteiraResumo) {
    setItens(novosItens);
    setResumo(novoResumo);
  }

  function limpar() {
    setItens([]);
    setResumo(null);
  }

  return { itens, resumo, salvarResultado, limpar };
}
