// Motor de Clientes — porta para o navegador a lógica validada em Python
// (merge_clientes2.py) que mescla as três fontes de dados de cliente por
// CNPJ/CPF normalizado: base interna Winthor (clientes-1203), carteira da
// integradora (roteirização/geo) e base de premissas da Colgate.
//
// Junção sempre "outer": um cliente que só existe em uma fonte continua na
// base final, só que com os demais campos vazios — nunca descartamos linha
// por falta de dado em outra fonte.

import type { ClienteEnriquecido, MotorClientesResumo } from '../data/clienteMotorTypes';
import { extractRecords, normalizeDoc, pickSheet, readWorkbook, sheetToMatrix } from './xlsxParse';

type Rec = Record<string, unknown>;

function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s ? s : undefined;
}

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

// ------------------------------------------------------- Base interna 1203

async function extractBaseInterna1203(file: File): Promise<Map<string, Partial<ClienteEnriquecido>>> {
  const wb = await readWorkbook(file);
  const sheet = pickSheet(wb, ['clientes', 'cadastro']);
  const matrix = sheetToMatrix(sheet);
  const records = extractRecords(matrix, ['cpfcnpj', 'cnpj']);

  const out = new Map<string, Partial<ClienteEnriquecido>>();
  for (const r of records) {
    const cnpj = normalizeDoc((r.cpfcnpj as unknown) ?? (r.cnpj as unknown));
    if (!cnpj) continue;
    if (out.has(cnpj)) continue; // keep first (dedup, mirrors keep="first")
    out.set(cnpj, {
      cnpjNormalizado: cnpj,
      cnpjFormatadoRef: str(r.cpfcnpj ?? r.cnpj),
      codigoWinthor: str(r.codigo),
      nomeRazaoSocial: str(r.nome),
      nomeFantasia: str(r.fantasia),
      municipio1203: str(r.municipio),
      rcaRefTexto: str(r.rca),
      codRcaRef: str(r.codrca),
      supervisorRefTexto: str(r.supervisor),
      codSupervisorRef: str(r.codsupervisor),
      bloqueioSefaz: str(r.bloqueiosefaz),
      dtValidaSefaz: str(r.dtvalidasefaz),
      nomeSocio: str(r.nomesocio),
      dtVenctoLimCredito: str(r.dtvenctolimcred),
      dtUltConsultaSerasa: str(r.dtultconsultaserasa),
      filial: str(r.filial),
      formaCobranca: str(r.cobranca),
      clientePrincipalNome: str(r.clienteprinc),
      clientePrincipalCodigo: str(r.codclienteprinc),
    });
  }
  return out;
}

// ------------------------------------------------- Carteira da integradora

function mapCarteiraRecord(r: Rec): Partial<ClienteEnriquecido> | null {
  const cnpj = normalizeDoc((r.cnpj as unknown) ?? (r.codcliente as unknown));
  if (!cnpj) return null;
  return {
    cnpjNormalizado: cnpj,
    atividadeComercial: str(r.atividadecomercial),
    cidadeCarteira: str(r.cidade),
    bairro: str(r.bairro),
    endereco: str(r.endereco),
    latitude: str(r.latitude),
    longitude: str(r.longitude),
    comprador: str(r.comprador),
    telefone: str(r.telefone),
    frequenciaVisita: str(r.frequencia),
    diaVisita: str(r.visita),
    diasSemComprar: str(r.diassemcomprar),
    representanteRefTexto: str(r.representante),
  };
}

async function extractCarteiraFromFile(file: File, sheetNameHints: string[]): Promise<Map<string, Partial<ClienteEnriquecido>>> {
  const wb = await readWorkbook(file);
  const sheet = pickSheet(wb, sheetNameHints);
  const matrix = sheetToMatrix(sheet);
  const records = extractRecords(matrix, ['cnpj']);

  const out = new Map<string, Partial<ClienteEnriquecido>>();
  for (const r of records) {
    const mapped = mapCarteiraRecord(r);
    if (!mapped || !mapped.cnpjNormalizado) continue;
    if (out.has(mapped.cnpjNormalizado)) continue;
    out.set(mapped.cnpjNormalizado, mapped);
  }
  return out;
}

// --------------------------------------------- Base de premissas (Colgate)

async function extractBasePremissas(file: File): Promise<{
  carteiraFallback: Map<string, Partial<ClienteEnriquecido>>;
  pdv: Map<string, Partial<ClienteEnriquecido>>;
}> {
  const wb = await readWorkbook(file);

  const carteiraSheet = pickSheet(wb, ['carteira']);
  const carteiraMatrix = sheetToMatrix(carteiraSheet);
  const carteiraRecords = extractRecords(carteiraMatrix, ['cnpj']);
  const carteiraFallback = new Map<string, Partial<ClienteEnriquecido>>();
  for (const r of carteiraRecords) {
    const mapped = mapCarteiraRecord(r);
    if (!mapped || !mapped.cnpjNormalizado) continue;
    if (carteiraFallback.has(mapped.cnpjNormalizado)) continue;
    carteiraFallback.set(mapped.cnpjNormalizado, mapped);
  }

  const pdvSheet = pickSheet(wb, ['pdv', 'exportacao']);
  const pdvMatrix = sheetToMatrix(pdvSheet);
  const pdvRecords = extractRecords(pdvMatrix, ['codcliente', 'cnpj']);
  const pdv = new Map<string, Partial<ClienteEnriquecido>>();
  for (const r of pdvRecords) {
    const cnpj = normalizeDoc((r.codcliente as unknown) ?? (r.cnpj as unknown));
    if (!cnpj) continue;
    if (pdv.has(cnpj)) continue;
    pdv.set(cnpj, {
      cnpjNormalizado: cnpj,
      colgateSemestrePremissa: str(r.semestrepremissa),
      colgateAmbiente: str(r.ambiente),
      colgateFaixa: str(r.faixas),
      colgateEstado: str(r.estado),
      colgateClusterCod: str(r.indclustercod),
      colgateClusterDesc: str(r.indclusterdesc),
      colgateAvgVolume12m: num(r.avg12meses),
      colgateAreaDistribuidor: str(r.areadistribuidor),
      colgateAreaNielsen: str(r.areanielsen),
      colgatePerfilReferencia: str(r.perfil),
      colgateTipoDoc: str(r.tipo),
      colgateStatusPdv: str(r.checkpdv),
      colgateRede: str(r.rede),
    });
  }

  return { carteiraFallback, pdv };
}

// ------------------------------------------------------------------ Merge

export type MotorClientesInput = {
  baseInterna1203?: File;
  carteiraIntegradora?: File;
  basePremissasColgate?: File;
};

export async function processarMotorClientes(
  input: MotorClientesInput,
): Promise<{ clientes: ClienteEnriquecido[]; resumo: MotorClientesResumo }> {
  const [base1203, carteira, premissas] = await Promise.all([
    input.baseInterna1203 ? extractBaseInterna1203(input.baseInterna1203) : Promise.resolve(new Map<string, Partial<ClienteEnriquecido>>()),
    input.carteiraIntegradora ? extractCarteiraFromFile(input.carteiraIntegradora, ['carteira']) : Promise.resolve(new Map<string, Partial<ClienteEnriquecido>>()),
    input.basePremissasColgate ? extractBasePremissas(input.basePremissasColgate) : Promise.resolve({ carteiraFallback: new Map<string, Partial<ClienteEnriquecido>>(), pdv: new Map<string, Partial<ClienteEnriquecido>>() }),
  ]);

  const merged = new Map<string, ClienteEnriquecido>();

  function ensure(cnpj: string): ClienteEnriquecido {
    let row = merged.get(cnpj);
    if (!row) {
      row = { cnpjNormalizado: cnpj, origens: [] };
      merged.set(cnpj, row);
    }
    return row;
  }

  for (const [cnpj, data] of base1203) {
    const row = ensure(cnpj);
    Object.assign(row, data);
    row.origens.push('base_interna_1203');
  }

  for (const [cnpj, data] of carteira) {
    const row = ensure(cnpj);
    Object.assign(row, data, { cnpjNormalizado: cnpj });
    row.origens.push('carteira_integradora');
  }

  // Fallback de roteirização/geo: só preenche o que ainda estiver vazio,
  // nunca sobrescreve dado já vindo da carteira "oficial" da integradora.
  for (const [cnpj, data] of premissas.carteiraFallback) {
    const row = ensure(cnpj);
    for (const [key, value] of Object.entries(data)) {
      if (key === 'cnpjNormalizado') continue;
      const typedKey = key as keyof ClienteEnriquecido;
      if (row[typedKey] === undefined && value !== undefined) {
        (row as Record<string, unknown>)[typedKey] = value;
      }
    }
  }

  for (const [cnpj, data] of premissas.pdv) {
    const row = ensure(cnpj);
    Object.assign(row, data, { cnpjNormalizado: cnpj });
    if (!row.origens.includes('base_premissas_colgate')) row.origens.push('base_premissas_colgate');
  }

  const clientes = Array.from(merged.values()).sort((a, b) => a.cnpjNormalizado.localeCompare(b.cnpjNormalizado));

  const resumo: MotorClientesResumo = {
    totalClientes: clientes.length,
    comBaseInterna: clientes.filter(c => c.origens.includes('base_interna_1203')).length,
    comCarteiraIntegradora: clientes.filter(c => c.origens.includes('carteira_integradora') || c.atividadeComercial || c.latitude).length,
    comBasePremissasColgate: clientes.filter(c => c.origens.includes('base_premissas_colgate')).length,
    comTresFontes: clientes.filter(c => c.origens.includes('base_interna_1203') && c.origens.includes('carteira_integradora') && c.origens.includes('base_premissas_colgate')).length,
    somenteCarteiraIntegradora: clientes.filter(c => c.origens.length === 1 && c.origens[0] === 'carteira_integradora').length,
    somenteBasePremissasColgate: clientes.filter(c => c.origens.length === 1 && c.origens[0] === 'base_premissas_colgate').length,
    processadoEm: new Date().toISOString(),
  };

  return { clientes, resumo };
}
