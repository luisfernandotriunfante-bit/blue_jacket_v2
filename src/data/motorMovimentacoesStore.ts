// Persistência do Motor de Movimentações (Motor 4) — localStorage, mesmo
// padrão do Motor de Produtos: cada fonte tem seu volume pequeno o
// suficiente (centenas/poucos milhares de linhas), ao contrário do Motor
// Histórico. A Carteira é sempre substituída inteira a cada upload (ver
// motorMovimentacoesTypes.ts); as próximas fontes (entrada de notas,
// vendas, corte) vão acumular por competência quando forem implementadas.

import { resumirEntradaNotas } from '../lib/motorMovimentacoes';
import { usePersistedState } from '../lib/storage';
import type {
  CarteiraItem,
  EntradaNotaItem,
  MotorCarteiraResumo,
  MotorEntradaNotasResumo,
  MotorVendasResumo,
  VendaItem,
} from './motorMovimentacoesTypes';

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

// Entrada de notas ACUMULA (ao contrário da Carteira): cada upload faz
// merge pela chave (notaFiscal + transEntrada) — as notas repetidas são
// substituídas pela versão nova, e as inéditas são somadas ao histórico
// já processado. O resumo é sempre recalculado sobre a lista mesclada
// inteira, nunca só sobre o upload do momento.
export function useEntradaNotas() {
  const [itens, setItens] = usePersistedState<EntradaNotaItem[]>('bj:motorMovimentacoes:entradaNotas', []);
  const [resumo, setResumo] = usePersistedState<MotorEntradaNotasResumo | null>('bj:motorMovimentacoes:entradaNotasResumo', null);

  function chaveDe(it: EntradaNotaItem) {
    return `${it.notaFiscal}|${it.transEntrada}`;
  }

  function salvarResultado(novosItens: EntradaNotaItem[]) {
    const chavesNovas = new Set(novosItens.map(chaveDe));
    const mantidos = itens.filter(it => !chavesNovas.has(chaveDe(it)));
    const mesclados = [...mantidos, ...novosItens];
    setItens(mesclados);
    setResumo(resumirEntradaNotas(mesclados));
  }

  function limpar() {
    setItens([]);
    setResumo(null);
  }

  return { itens, resumo, salvarResultado, limpar };
}

// Vendas SUBSTITUI a cada upload (como a Carteira) — não há chave
// linha-a-linha confjC�vel para merge nesta fonte (ver comentário de
// VendaItem em motorMovimentacoesTypes.ts).
export function useVendas() {
  const [itens, setItens] = usePersistedState<VendaItem[]>('bj:motorMovimentacoes:vendas', []);
  const [resumo, setResumo] = usePersistedState<MotorVendasResumo | null>('bj:motorMovimentacoes:vendasResumo', null);

  function salvarResultado(novosItens: VendaItem[], novoResumo: MotorVendasResumo) {
    setItens(novosItens);
    setResumo(novoResumo);
  }

  function limpar() {
    setItens([]);
    setResumo(null);
  }

  return { itens, resumo, salvarResultado, limpar };
}
