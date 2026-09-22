// Manual-data types: everything here is entered by hand (no motor computes
// it) until a real integration/import replaces the base lists or the
// marking workflow.

// Cadastro de RCA — inclui a referência ao coordenador (hierarquia de
// supervisão) diretamente nos campos do próprio RCA.
export type Rca = {
  id: string;
  numeroAtual: string;
  numeroAntigo: string;
  nome: string;
  codCoordenador: string;
  nomeCoordenador: string;
  criadoEm: string;
};

// Meta de um RCA para uma competência. A meta da indústria é a soma de
// todas as metas de RCA daquela competência — não é armazenada à parte.
export type MetaRca = {
  rcaId: string;
  competencia: string;
  valor: number;
};

// Meta de T&C — um valor único por competência, não ligado a um RCA.
export type MetaTC = {
  competencia: string;
  valor: number;
};

// Base de produtos (viria de uma importação futura; por ora é uma lista
// fixa só para permitir a marcação de lançamentos).
export type Produto = {
  id: string;
  codigo: string;
  descricao: string;
  linha: string;
};

export type LancamentoTipo = 'normal' | 'pex';

// Marcação de um produto como lançamento numa competência. A ausência de
// marcação para o par produto+competência significa "não é lançamento".
export type LancamentoMark = {
  produtoId: string;
  competencia: string;
  tipo: LancamentoTipo;
};

// Base de clientes (viria de uma importação futura; por ora é uma lista
// fixa só para permitir a marcação de top varejistas).
export type Cliente = {
  id: string;
  cnpj: string;
  razaoSocial: string;
  cidade: string;
  uf: string;
};

// Marcação de um cliente como top varejista numa competência.
export type TopVarejistaMark = {
  clienteId: string;
  competencia: string;
};
