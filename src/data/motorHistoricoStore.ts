// Persistência do resultado do Motor Histórico (Motor 3) — IndexedDB, não
// localStorage (ver src/lib/idbStore.ts para o porquê). Como a leitura é
// assíncrona, o hook expõe um `carregando` inicial até o primeiro load
// terminar, diferente do usePersistedState síncrono dos outros motores.

import { useEffect, useState } from 'react';
import type {
  CompraAnualProduto,
  CorteHistoricoMensal,
  MotorHistoricoResumo,
  NotaEntradaHistorico,
  VendaHistoricoMensal,
} from './motorHistoricoTypes';
import { idbGet, idbSet } from '../lib/idbStore';

const KEY_VENDAS = 'bj:motorHistorico:vendasMensais';
const KEY_NOTAS = 'bj:motorHistorico:notasEntrada';
const KEY_COMPRAS = 'bj:motorHistorico:comprasAnuais';
const KEY_RESUMO = 'bj:motorHistorico:resumo';
// Série de Corte fechada por competência (Motor 4, pós-virada) — não existe
// equivalente no ERP antigo, por isso fica numa chave própria em vez de
// misturar com vendasMensais (que carrega a série 379 + fechamentos de Vendas).
const KEY_CORTE = 'bj:motorHistorico:corteMensal';

export function useMotorHistorico() {
  const [carregando, setCarregando] = useState(true);
  const [vendasMensais, setVendasMensais] = useState<VendaHistoricoMensal[]>([]);
  const [notasEntrada, setNotasEntrada] = useState<NotaEntradaHistorico[]>([]);
  const [comprasAnuais, setComprasAnuais] = useState<CompraAnualProduto[]>([]);
  const [corteMensal, setCorteMensal] = useState<CorteHistoricoMensal[]>([]);
  const [resumo, setResumo] = useState<MotorHistoricoResumo | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const [v, n, c, cm, r] = await Promise.all([
        idbGet<VendaHistoricoMensal[]>(KEY_VENDAS),
        idbGet<NotaEntradaHistorico[]>(KEY_NOTAS),
        idbGet<CompraAnualProduto[]>(KEY_COMPRAS),
        idbGet<CorteHistoricoMensal[]>(KEY_CORTE),
        idbGet<MotorHistoricoResumo>(KEY_RESUMO),
      ]);
      if (cancelado) return;
      setVendasMensais(v ?? []);
      setNotasEntrada(n ?? []);
      setComprasAnuais(c ?? []);
      setCorteMensal(cm ?? []);
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
    // Reprocessamento do 379/12322/310: preserva fechamentos de competência
    // já feitos via Motor 4 (competenciasFechadasVendas/Corte, corteMensal),
    // já que esses não vêm dos relatórios do ERP antigo.
    setVendasMensais(novasVendas);
    setNotasEntrada(novasNotas);
    setComprasAnuais(novasCompras);
    const resumoFinal: MotorHistoricoResumo = {
      ...novoResumo,
      competenciasFechadasVendas: resumo?.competenciasFechadasVendas,
      competenciasFechadasCorte: resumo?.competenciasFechadasCorte,
    };
    setResumo(resumoFinal);
    await Promise.all([
      idbSet(KEY_VENDAS, novasVendas),
      idbSet(KEY_NOTAS, novasNotas),
      idbSet(KEY_COMPRAS, novasCompras),
      idbSet(KEY_RESUMO, resumoFinal),
    ]);
  }

  // Fecha uma competência de Vendas (Motor 4, pós-virada): mescla os
  // registros agregados (já classificados por tipoVenda) na série mensal,
  // substituindo qualquer registro pré-existente da mesma competência (evita
  // duplicar caso a competência seja fechada mais de uma vez por engano).
  async function fecharCompetenciaVendas(competencia: string, registros: VendaHistoricoMensal[]) {
    const semCompetencia = vendasMensais.filter(v => v.competencia !== competencia);
    const novasVendas = [...semCompetencia, ...registros];
    const competenciasFechadasVendas = [...new Set([...(resumo?.competenciasFechadasVendas ?? []), competencia])].sort();
    const novoResumo: MotorHistoricoResumo = resumo
      ? { ...resumo, competenciasFechadasVendas }
      : {
          competenciasCobertas: [],
          totalRegistrosVenda: 0,
          totalCombinacoesVendaMensal: 0,
          totalNotasEntrada: 0,
          totalProdutosComCompraAnual: 0,
          produtosSomenteEm310: [],
          processadoEm: new Date().toISOString(),
          competenciasFechadasVendas,
        };
    setVendasMensais(novasVendas);
    setResumo(novoResumo);
    await Promise.all([idbSet(KEY_VENDAS, novasVendas), idbSet(KEY_RESUMO, novoResumo)]);
  }

  // Fecha uma competência de Corte (Motor 4, pós-virada): mescla na série
  // própria de Corte, substituindo registros pré-existentes da mesma competência.
  async function fecharCompetenciaCorte(competencia: string, registros: CorteHistoricoMensal[]) {
    const semCompetencia = corteMensal.filter(c => c.competencia !== competencia);
    const novoCorteMensal = [...semCompetencia, ...registros];
    const competenciasFechadasCorte = [...new Set([...(resumo?.competenciasFechadasCorte ?? []), competencia])].sort();
    const novoResumo: MotorHistoricoResumo = resumo
      ? { ...resumo, competenciasFechadasCorte }
      : {
          competenciasCobertas: [],
          totalRegistrosVenda: 0,
          totalCombinacoesVendaMensal: 0,
          totalNotasEntrada: 0,
          totalProdutosComCompraAnual: 0,
          produtosSomenteEm310: [],
          processadoEm: new Date().toISOString(),
          competenciasFechadasCorte,
        };
    setCorteMensal(novoCorteMensal);
    setResumo(novoResumo);
    await Promise.all([idbSet(KEY_CORTE, novoCorteMensal), idbSet(KEY_RESUMO, novoResumo)]);
  }

  async function limpar() {
    setVendasMensais([]);
    setNotasEntrada([]);
    setComprasAnuais([]);
    setCorteMensal([]);
    setResumo(null);
    await Promise.all([
      idbSet(KEY_VENDAS, []),
      idbSet(KEY_NOTAS, []),
      idbSet(KEY_COMPRAS, []),
      idbSet(KEY_CORTE, []),
      idbSet(KEY_RESUMO, null),
    ]);
  }

  return {
    carregando,
    vendasMensais,
    notasEntrada,
    comprasAnuais,
    corteMensal,
    resumo,
    salvarResultado,
    fecharCompetenciaVendas,
    fecharCompetenciaCorte,
    limpar,
  };
}
