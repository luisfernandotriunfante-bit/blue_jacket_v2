// Motor de Clientes — tipos do super-cadastro de clientes gerado a partir
// da mescla de três fontes (base interna Winthor, carteira da integradora
// e base de premissas da Colgate). Uma linha por CNPJ/CPF normalizado,
// preenchida com o máximo de informação disponível entre as fontes.
//
// Regra de firewall (padrão do projeto, não relaxar aqui): nenhum campo
// deste motor alimenta automaticamente os sistemas manuais (RCA, Metas,
// Top Varejista, Lançamentos). `rcaRefTexto`/`codRcaRef`/`supervisorRefTexto`
// e `colgatePerfilReferencia` existem só como referência/consulta.

export type FonteClienteMotor = 'base_interna_1203' | 'carteira_integradora' | 'base_premissas_colgate';

export type ClienteEnriquecido = {
  // Chave de junção
  cnpjNormalizado: string;
  cnpjFormatadoRef?: string;

  // Identidade (base interna 1203 — Winthor)
  codigoWinthor?: string;
  nomeRazaoSocial?: string;
  nomeFantasia?: string;
  municipio1203?: string;
  rcaRefTexto?: string;
  codRcaRef?: string;
  supervisorRefTexto?: string;
  codSupervisorRef?: string;
  bloqueioSefaz?: string;
  dtValidaSefaz?: string;
  nomeSocio?: string;
  dtVenctoLimCredito?: string;
  dtUltConsultaSerasa?: string;
  filial?: string;
  formaCobranca?: string;
  clientePrincipalNome?: string;
  clientePrincipalCodigo?: string;

  // Roteirização / geolocalização (carteira da integradora, com fallback
  // na aba "Relatório Carteira de Clientes" da base de premissas)
  atividadeComercial?: string;
  cidadeCarteira?: string;
  bairro?: string;
  endereco?: string;
  latitude?: string;
  longitude?: string;
  comprador?: string;
  telefone?: string;
  frequenciaVisita?: string;
  diaVisita?: string;
  diasSemComprar?: string;
  representanteRefTexto?: string;

  // Atributos Colgate (base de premissas — aba "Exportação PDVs")
  colgateSemestrePremissa?: string;
  colgateAmbiente?: string;
  colgateFaixa?: string;
  colgateEstado?: string;
  colgateClusterCod?: string;
  colgateClusterDesc?: string;
  colgateAvgVolume12m?: number;
  colgateAreaDistribuidor?: string;
  colgateAreaNielsen?: string;
  /** Informativo apenas — NUNCA usar para marcar Top Varejista automaticamente. */
  colgatePerfilReferencia?: string;
  colgateTipoDoc?: string;
  colgateStatusPdv?: string;
  colgateRede?: string;

  // Proveniência / auditoria
  origens: FonteClienteMotor[];
};

export type MotorClientesResumo = {
  totalClientes: number;
  comBaseInterna: number;
  comCarteiraIntegradora: number;
  comBasePremissasColgate: number;
  comTresFontes: number;
  somenteCarteiraIntegradora: number;
  somenteBasePremissasColgate: number;
  processadoEm: string;
};

export type MotorClientesEstado = {
  clientes: ClienteEnriquecido[];
  resumo: MotorClientesResumo | null;
};
