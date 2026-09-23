import { useState, type ChangeEvent } from 'react';
import { PanelAlert, PanelCard, PanelSectionHeader } from '../../components/Panel';
import { useMotorProdutos } from '../../data/motorProdutosStore';
import { processarMotorProdutos, type MotorProdutosInput } from '../../lib/motorProdutos';
import { downloadCsv } from '../../lib/exportCsv';

type SlotKey = keyof MotorProdutosInput;

const SLOTS: { key: SlotKey; titulo: string; descricao: string }[] = [
  {
    key: 'produtos286',
    titulo: 'Relatório 286 (âncora)',
    descricao: 'Cadastro interno principal: código, descrição, classe, marca, estoque e custo.',
  },
  {
    key: 'estoque1118',
    titulo: 'Estoque 1118',
    descricao: 'Fonte autoritativa de estoque: disponível, reservado, bloqueado, avariado (sobrescreve o valor inicial do 286).',
  },
  {
    key: 'preco8011',
    titulo: 'Preços 8011',
    descricao: 'Preço de tabela por código interno: com ST e sem ST.',
  },
  {
    key: 'historicoListaPreco',
    titulo: 'Histórico Lista de Preço',
    descricao: 'Cadastro completo vindo da indústria: dimensões, paletização, peso e preço base — por SKU do fabricante.',
  },
  {
    key: 'sortimentoRecomendado',
    titulo: 'Sortimento Recomendado',
    descricao: 'Indica, por SKU e por faixa de cliente (canal), o nível de sortimento recomendado pela indústria.',
  },
];

// Administração > Bases > Motor 2 (Motor de Produtos) — mescla, por código
// interno (Winthor) com ponte por SKU do fabricante e por EAN, as fontes de
// cadastro, estoque, preço e sortimento de produto. Itens que só existem na
// indústria (sem cadastro Winthor ainda) entram na base mesmo assim,
// marcados como "sem código interno" — a mesclagem nunca descarta linha por
// falta de dado em outra fonte.
//
// Fontes removidas do escopo deste motor: 105 (só duplicava o 286),
// logístico-8013 (estoque em caixas agora é calculado a partir do estoque
// disponível ÷ unidades por caixa, em vez de vir de arquivo) e extrato-1118
// (movimento mensal — é dado de venda, reservado para um futuro Motor de
// Vendas, não para este motor de cadastro).
//
// Esta página só cuida do processamento em si (upload + mesclagem). O
// resultado é guardado em bj:motorProdutos:* (ver motorProdutosStore).
export function MotorProdutos() {
  const [files, setFiles] = useState<Partial<Record<SlotKey, File>>>({});
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { produtos, resumo, salvarResultado, limpar } = useMotorProdutos();

  const hasAnyFile = Object.values(files).some(Boolean);

  function handleFileChange(key: SlotKey, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFiles(prev => ({ ...prev, [key]: file }));
  }

  async function handleProcessar() {
    if (!hasAnyFile) return;
    setProcessing(true);
    setError(null);
    try {
      const resultado = await processarMotorProdutos(files);
      salvarResultado(resultado.produtos, resultado.resumo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível processar os arquivos enviados.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <PanelCard>
      <PanelSectionHeader
        eyebrow="ADMINISTRAÇÃO — BASES — MOTOR 2"
        title="Motor de Produtos"
        description="Envie as fontes abaixo (o que tiver disponível) e o motor mescla por código interno, com ponte por SKU do fabricante e por EAN, montando uma base única de produtos. Roda inteiramente no navegador — nenhum arquivo sai daqui."
      />
      <div className="panel-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {SLOTS.map(slot => (
          <div key={slot.key} className="panel-upload-slot">
            <div className="panel-upload-slot-title">{slot.titulo}</div>
            <div className="panel-upload-slot-desc">{slot.descricao}</div>
            <label className="panel-button panel-upload-button">
              {files[slot.key]?.name ?? 'Selecionar arquivo (.xls/.xlsx)'}
              <input
                type="file"
                accept=".xls,.xlsx,.csv"
                onChange={e => handleFileChange(slot.key, e)}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        ))}
      </div>
      <div className="panel-row-actions" style={{ justifyContent: 'flex-start', marginTop: 'var(--bj-space-2)' }}>
        <button
          type="button"
          className="panel-button panel-button-primary"
          disabled={processing || !hasAnyFile}
          onClick={handleProcessar}
        >
          {processing ? 'Processando…' : 'Processar e mesclar'}
        </button>
        {produtos.length > 0 ? (
          <button
            type="button"
            className="panel-button"
            onClick={() => downloadCsv(`motor-produtos-${new Date().toISOString().slice(0, 10)}.csv`, produtos)}
          >
            Baixar planilha (CSV)
          </button>
        ) : null}
        {produtos.length > 0 ? (
          <button type="button" className="panel-button" onClick={limpar}>
            Limpar base consolidada
          </button>
        ) : null}
      </div>
      {error ? (
        <div style={{ marginTop: 'var(--bj-space-4)' }}>
          <PanelAlert tone="error">{error}</PanelAlert>
        </div>
      ) : null}
      <div style={{ marginTop: 'var(--bj-space-4)' }}>
        {resumo ? (
          <PanelAlert tone="success">
            Base processada em {new Date(resumo.processadoEm).toLocaleString('pt-BR')} — {resumo.totalItens.toLocaleString('pt-BR')} item(ns) consolidado(s)
            ({resumo.comCadastroInterno.toLocaleString('pt-BR')} com cadastro interno, {resumo.somenteIndustria.toLocaleString('pt-BR')} só-indústria).
          </PanelAlert>
        ) : (
          <PanelAlert tone="info">Nenhuma base processada ainda. Envie ao menos um arquivo e clique em "Processar e mesclar".</PanelAlert>
        )}
      </div>
    </PanelCard>
  );
}
