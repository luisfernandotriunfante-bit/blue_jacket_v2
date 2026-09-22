// Placeholder product/customer base. A real import motor will eventually
// replace these fixed lists — for now they exist only so the "mark as
// lançamento" / "mark as top varejista" flows have something to search.

import type { Cliente, Produto } from './types';

export const PRODUTOS_BASE: Produto[] = [
  { id: 'p01', codigo: '7891024131270', descricao: 'Colgate Total 12 Limpeza Profunda 90g', linha: 'Higiene Oral' },
  { id: 'p02', codigo: '7891024131522', descricao: 'Colgate Total 12 Clean Mint 90g', linha: 'Higiene Oral' },
  { id: 'p03', codigo: '7891024155192', descricao: 'Escova Colgate Slim Soft Média', linha: 'Higiene Oral' },
  { id: 'p04', codigo: '7891024167102', descricao: 'Colgate Plax Fresh Mint 500ml', linha: 'Higiene Oral' },
  { id: 'p05', codigo: '7891150001982', descricao: 'Sabonete Protex Cravo e Alecrim 85g', linha: 'Higiene Pessoal' },
  { id: 'p06', codigo: '7891150002828', descricao: 'Desodorante Speed Stick Men 91g', linha: 'Higiene Pessoal' },
  { id: 'p07', codigo: '7891150089614', descricao: 'Sabonete Líquido Palmolive Naturals 250ml', linha: 'Higiene Pessoal' },
  { id: 'p08', codigo: '7891150096728', descricao: 'Shampoo Palmolive Naturals Hidratação 350ml', linha: 'Higiene Pessoal' },
  { id: 'p09', codigo: '7891035904014', descricao: 'Detergente Limpol Neutro 500ml', linha: 'Home Care' },
  { id: 'p10', codigo: '7891035907022', descricao: 'Amaciante Fofo Concentrado 500ml', linha: 'Home Care' },
  { id: 'p11', codigo: '7891035911920', descricao: 'Sabão em Pó Minerva 1kg', linha: 'Home Care' },
  { id: 'p12', codigo: '7891150094502', descricao: 'Sabonete Elta MP Hidratante 90g', linha: 'Nutrição de Pele' },
  { id: 'p13', codigo: '7891150095851', descricao: 'Creme Hidratante Elta MP 200g', linha: 'Nutrição de Pele' },
  { id: 'p14', codigo: '7891024172533', descricao: 'Colgate Total 12 Profissional Clean Mint 90g', linha: 'Profissional' },
  { id: 'p15', codigo: '7891024176418', descricao: 'Enxaguante Colgate Plax Profissional 750ml', linha: 'Profissional' },
  { id: 'p16', codigo: '7891024180835', descricao: 'Fio Dental Colgate Total Profissional 100m', linha: 'Profissional' },
];

export const CLIENTES_BASE: Cliente[] = [
  { id: 'c01', cnpj: '12.345.678/0001-90', razaoSocial: 'Supermercado Bom Preço Ltda', cidade: 'Cuiabá', uf: 'MT' },
  { id: 'c02', cnpj: '23.456.789/0001-01', razaoSocial: 'Atacadão Vale Verde Ltda', cidade: 'Várzea Grande', uf: 'MT' },
  { id: 'c03', cnpj: '34.567.890/0001-12', razaoSocial: 'Mercearia Porto Alto Eireli', cidade: 'Rondonópolis', uf: 'MT' },
  { id: 'c04', cnpj: '45.678.901/0001-23', razaoSocial: 'Comercial Boa Sorte Ltda', cidade: 'Sinop', uf: 'MT' },
  { id: 'c05', cnpj: '56.789.012/0001-34', razaoSocial: 'Distribuidora Pantanal Ltda', cidade: 'Cáceres', uf: 'MT' },
  { id: 'c06', cnpj: '67.890.123/0001-45', razaoSocial: 'Supermercados Cerrado S.A.', cidade: 'Sorriso', uf: 'MT' },
  { id: 'c07', cnpj: '78.901.234/0001-56', razaoSocial: 'Rede Econômica Milênio Ltda', cidade: 'Cuiabá', uf: 'MT' },
  { id: 'c08', cnpj: '89.012.345/0001-67', razaoSocial: 'Mini Mercado Estrela Ltda', cidade: 'Tangará da Serra', uf: 'MT' },
  { id: 'c09', cnpj: '90.123.456/0001-78', razaoSocial: 'Comercial Norte Mato-Grossense Ltda', cidade: 'Lucas do Rio Verde', uf: 'MT' },
  { id: 'c10', cnpj: '01.234.567/0001-89', razaoSocial: 'Atacado São José Ltda', cidade: 'Primavera do Leste', uf: 'MT' },
  { id: 'c11', cnpj: '12.987.654/0001-11', razaoSocial: 'Supermercado Família Ltda', cidade: 'Barra do Garças', uf: 'MT' },
  { id: 'c12', cnpj: '23.876.543/0001-22', razaoSocial: 'Comercial Bela Vista Eireli', cidade: 'Pontes e Lacerda', uf: 'MT' },
  { id: 'c13', cnpj: '34.765.432/0001-33', razaoSocial: 'Distribuidora Central Mato Grosso Ltda', cidade: 'Cuiabá', uf: 'MT' },
  { id: 'c14', cnpj: '45.654.321/0001-44', razaoSocial: 'Rede Popular de Mercados Ltda', cidade: 'Nova Mutum', uf: 'MT' },
  { id: 'c15', cnpj: '56.543.210/0001-55', razaoSocial: 'Mercado Bom Jesus Ltda', cidade: 'Juína', uf: 'MT' },
  { id: 'c16', cnpj: '67.432.109/0001-66', razaoSocial: 'Supermercado Ideal Ltda', cidade: 'Alta Floresta', uf: 'MT' },
];
