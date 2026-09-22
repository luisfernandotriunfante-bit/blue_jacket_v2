// Manual-data collections + mutators. Every "marking" (meta, lançamento,
// top varejista) supports removal — unmarking just deletes the row for
// that key, it never leaves a hidden/soft-deleted trace.

import { usePersistedState } from '../lib/storage';
import type { Cliente, LancamentoMark, LancamentoTipo, MetaRca, MetaTC, Produto, Rca, TopVarejistaMark } from './types';

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

// ---------------------------------------------------------------- RCAs ---

export function useRcas() {
  const [rcas, setRcas] = usePersistedState<Rca[]>('bj:rcas', []);

  function addRca(input: Omit<Rca, 'id' | 'criadoEm'>) {
    setRcas(prev => [...prev, { ...input, id: makeId(), criadoEm: new Date().toISOString() }]);
  }

  function removeRca(id: string) {
    setRcas(prev => prev.filter(rca => rca.id !== id));
  }

  return { rcas, addRca, removeRca };
}

// ------------------------------------------------------------ Metas RCA --

export function useMetasRca() {
  const [metas, setMetas] = usePersistedState<MetaRca[]>('bj:metasRca', []);

  function setMeta(rcaId: string, competencia: string, valor: number) {
    setMetas(prev => {
      const idx = prev.findIndex(m => m.rcaId === rcaId && m.competencia === competencia);
      if (idx === -1) return [...prev, { rcaId, competencia, valor }];
      const next = [...prev];
      next[idx] = { rcaId, competencia, valor };
      return next;
    });
  }

  function removeMeta(rcaId: string, competencia: string) {
    setMetas(prev => prev.filter(m => !(m.rcaId === rcaId && m.competencia === competencia)));
  }

  function getMeta(rcaId: string, competencia: string): number | null {
    return metas.find(m => m.rcaId === rcaId && m.competencia === competencia)?.valor ?? null;
  }

  return { metas, setMeta, removeMeta, getMeta };
}

// -------------------------------------------------------------- Meta T&C -

export function useMetaTC() {
  const [metasTC, setMetasTC] = usePersistedState<MetaTC[]>('bj:metaTC', []);

  function setMetaTC(competencia: string, valor: number) {
    setMetasTC(prev => {
      const idx = prev.findIndex(m => m.competencia === competencia);
      if (idx === -1) return [...prev, { competencia, valor }];
      const next = [...prev];
      next[idx] = { competencia, valor };
      return next;
    });
  }

  function removeMetaTC(competencia: string) {
    setMetasTC(prev => prev.filter(m => m.competencia !== competencia));
  }

  function getMetaTC(competencia: string): number | null {
    return metasTC.find(m => m.competencia === competencia)?.valor ?? null;
  }

  return { metasTC, setMetaTC, removeMetaTC, getMetaTC };
}

// --------------------------------------------------------- Lançamentos --

export function useLancamentoMarks() {
  const [marks, setMarks] = usePersistedState<LancamentoMark[]>('bj:lancamentos', []);

  function setLancamento(produtoId: string, competencia: string, tipo: LancamentoTipo) {
    setMarks(prev => {
      const idx = prev.findIndex(m => m.produtoId === produtoId && m.competencia === competencia);
      if (idx === -1) return [...prev, { produtoId, competencia, tipo }];
      const next = [...prev];
      next[idx] = { produtoId, competencia, tipo };
      return next;
    });
  }

  function removeLancamento(produtoId: string, competencia: string) {
    setMarks(prev => prev.filter(m => !(m.produtoId === produtoId && m.competencia === competencia)));
  }

  function getLancamento(produtoId: string, competencia: string): LancamentoTipo | null {
    return marks.find(m => m.produtoId === produtoId && m.competencia === competencia)?.tipo ?? null;
  }

  return { marks, setLancamento, removeLancamento, getLancamento };
}

// -------------------------------------------------------- Top varejistas -

export function useTopVarejistaMarks() {
  const [marks, setMarks] = usePersistedState<TopVarejistaMark[]>('bj:topVarejistas', []);

  function markTop(clienteId: string, competencia: string) {
    setMarks(prev =>
      prev.some(m => m.clienteId === clienteId && m.competencia === competencia)
        ? prev
        : [...prev, { clienteId, competencia }],
    );
  }

  function unmarkTop(clienteId: string, competencia: string) {
    setMarks(prev => prev.filter(m => !(m.clienteId === clienteId && m.competencia === competencia)));
  }

  function isTop(clienteId: string, competencia: string): boolean {
    return marks.some(m => m.clienteId === clienteId && m.competencia === competencia);
  }

  return { marks, markTop, unmarkTop, isTop };
}

export type { Cliente, LancamentoMark, LancamentoTipo, MetaRca, MetaTC, Produto, Rca, TopVarejistaMark };
