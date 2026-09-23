// Persistência do resultado do Motor de Produtos (Motor 2) — mesmo padrão
// local-first (localStorage) do Motor de Clientes (Motor 1), isolado em
// sua própria chave.

import { usePersistedState } from '../lib/storage';
import type { MotorProdutosResumo, ProdutoEnriquecido } from './produtoMotorTypes';

export function useMotorProdutos() {
  const [produtos, setProdutos] = usePersistedState<ProdutoEnriquecido[]>('bj:motorProdutos:base', []);
  const [resumo, setResumo] = usePersistedState<MotorProdutosResumo | null>('bj:motorProdutos:resumo', null);

  function salvarResultado(novosProdutos: ProdutoEnriquecido[], novoResumo: MotorProdutosResumo) {
    setProdutos(novosProdutos);
    setResumo(novoResumo);
  }

  function limpar() {
    setProdutos([]);
    setResumo(null);
  }

  return { produtos, resumo, salvarResultado, limpar };
}
