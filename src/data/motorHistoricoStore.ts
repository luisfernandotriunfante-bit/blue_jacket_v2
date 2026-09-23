// Persistência do resultado do Motor Histórico (Motor 3) — IndexedDB, não
// localStorage (ver src/lib/idbStore.ts para o porquê). Como a leitura é
// assíncrona, o hook expõe um `carregando` inicial até o primeiro load
// terminar, diferente do usePersistedState síncrono dos outros motores.

import { useEffect, useState } from 'react';
import type { CompraAnualProduto, MotorHistoricoResumo, NotaEntradaHistorico, VendaHistoricoMensal } from './motorHistoricoTypes';
import { idbGet, idbSet } from '../lib/idbStore';

const KEY_VENDAS = 'bj:motorHistorico:vendasMensais';
const KEY_NOTAS = 'bj:motorHistorico:notasEntrada';
const KEY_COMPRAS = 'bj:motorHistorico:comprasAnuais';
const KEY_RESUMO = 'bj:motorHistorico:resumo';

export function useMotorHistorico() {
  const [carregando, setCarregando] = useState(true);
  const [vendasMensais, setVendasMensais] = useState<VendaHistoricoMensal[]>([]);
  const [notasEntrada, setNotasEntrada] = useState<NotaEntradaHistorico[]>([]);
  const [comprasAnuais, setComprasAnuais] = useState<CompraAnualProduto[]>([]);
  const [resumo, setResumo] = useState<MotorHistoricoResumo | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const [v, n, c, r] = await Promise.all([
        idbGet<VendaHistoricoMensal[]>(KEY_VENDAS),
        idbGet<NotaEntradaHistorico[]>(KEY_NOTAS),
        idbGet<CompraAnualProduto[]>(KEY_COMPRAS),
        idbGet<MotorHistoricoResumo>(KEY_RESUMO),
      ]);
      if (cancelado) return;
      setVendasMensais(v ?? []);
      setNotasEntrada(n ?? []);
      setComprasAnuais(c ?? []);
      setResumo(r ?? null);
      setCarregando(false);
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  async function salvarResultado(
    novasVendas: VendaHistoricoMensal[],
    novasNotas: NotaEntradaHistorico[],
    novasCompras: CompraAnualProduto[],
    novoResumo: MotorHistoricoResumo,
  ) {
    setVendasMensais(novasVendas);
    setNotasEntrada(novasNotas);
    setComprasAnuais(novasCompras);
    setResumo(novoResumo);
    await Promise.all([
      idbSet(KEY_VENDAS, novasVendas),
      idbSet(KEY_NOTAS, novasNotas),
      idbSet(KEY_COMPRAS, novasCompras),
      idbSet(KEY_RESUMO, novoResumo),
    ]);
  }

  async function limpar() {
    setVendasMensais([]);
    setNotasEntrada([]);
    setComprasAnuais([]);
    setResumo(null);
    await Promise.all([
      idbSet(KEY_VENDAS, []),
      idbSet(KEY_NOTAS, []),
      idbSet(KEY_COMPRAS, []),
      idbSet(KEY_RESUMO, null),
    ]);
  }

  return { carregando, vendasMensais, notasEntrada, comprasAnuais, resumo, salvarResultado, limpar };
}
