import { useMemo, useState } from 'react';
import { PanelAlert, PanelCard, PanelSectionHeader } from '../../components/Panel';
import { useLancamentoMarks } from '../../data/cadastros';
import { useMotorProdutos } from '../../data/motorProdutosStore';
import { CURRENT_COMPETENCE, formatCompetencia } from '../../lib/competencia';

// Estoque > Produtos — a lista completa vem do Motor de Produtos (Motor 2,
// Administração > Bases): sempre que alguém precisa procurar um item, é
// aqui que vem. A marcação de lançamento (normal ou PEX) é feita item a
// item; a aba Lançamentos só mostra o que já foi marcado. A chave de
// lançamento usa código interno quando existe; para itens só-indústria
// (sem cadastro Winthor ainda) cai para SKU/EAN.
function produtoKey(p: { codigoInterno?: string; skuFabricante?: string; ean?: string }, index: number): string {
  return p.codigoInterno ?? p.skuFabricante ?? p.ean ?? `sem-chave-${index}`;
}

export function EstoqueProdutos() {
  const [query, setQuery] = useState('');
  const { getLancamento, setLancamento, removeLancamento } = useLancamentoMarks();
  const { produtos } = useMotorProdutos();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return produtos;
    return produtos.filter(p =>
      (p.codigoInterno ?? '').toLowerCase().includes(q) ||
      (p.skuFabricante ?? '').toLowerCase().includes(q) ||
      (p.ean ?? '').toLowerCase().includes(q) ||
      (p.descricao ?? '').toLowerCase().includes(q) ||
      (p.descricaoIndustria ?? '').toLowerCase().includes(q),
    );
  }, [produtos, query]);

  if (produtos.length === 0) {
    return (
      <PanelCard>
        <PanelSectionHeader
          eyebrow="ESTOQUE — PRODUTOS"
          title="Produtos"
          description="Ainda não há base processada."
        />
        <PanelAlert tone="info">
          Nenhum produto disponível ainda. Processe o Motor de Produtos em Administração → Bases → Motor 2 para popular esta lista.
        </PanelAlert>
      </PanelCard>
    );
  }

  return (
    <PanelCard>
      <PanelSectionHeader
        eyebrow="ESTOQUE — PRODUTOS"
        title="Produtos"
        description={`Base consolidada pelo Motor de Produtos (${produtos.length.toLocaleString('pt-BR')} item(ns)). Busque um item e marque como lançamento (normal ou PEX) para a competência de ${formatCompetencia(CURRENT_COMPETENCE)}.`}
      />
      <div className="panel-form-grid" style={{ maxWidth: 360 }}>
        <input
          className="panel-input"
          placeholder="Buscar por código, SKU, EAN ou descrição"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      <div className="panel-table-wrap">
        <table className="panel-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Embalagem</th>
              <th>Estoque disp.</th>
              <th>Lançamento</th>
              <th className="is-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((produto, index) => {
              const key = produtoKey(produto, index);
              const tipo = getLancamento(key, CURRENT_COMPETENCE);
              const descricao = produto.descricao ?? produto.descricaoIndustria ?? '—';
              return (
                <tr key={key}>
                  <td className="is-strong">{produto.codigoInterno ?? <span className="panel-muted">sem código</span>}</td>
                  <td>{descricao}</td>
                  <td>{produto.embalagem ?? '—'}</td>
                  <td>{produto.estoqueDisponivel ?? produto.estoqueTotal ?? '—'}</td>
                  <td>
                    {tipo === 'pex' ? (
                      <span className="panel-status-pill panel-status-critical">PEX</span>
                    ) : tipo === 'normal' ? (
                      <span className="panel-status-pill panel-status-ok">Normal</span>
                    ) : (
                      <span className="panel-muted">—</span>
                    )}
                  </td>
                  <td className="is-right">
                    <div className="panel-row-actions">
                      <button
                        type="button"
                        className="panel-chip"
                        aria-selected={tipo === 'normal'}
                        onClick={() => setLancamento(key, CURRENT_COMPETENCE, 'normal')}
                      >
                        Normal
                      </button>
                      <button
                        type="button"
                        className="panel-chip"
                        aria-selected={tipo === 'pex'}
                        onClick={() => setLancamento(key, CURRENT_COMPETENCE, 'pex')}
                      >
                        PEX
                      </button>
                      {tipo ? (
                        <button
                          type="button"
                          className="panel-chip"
                          onClick={() => removeLancamento(key, CURRENT_COMPETENCE)}
                        >
                          Remover
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PanelCard>
  );
}
