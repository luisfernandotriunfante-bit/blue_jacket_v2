import { PanelAlert, PanelCard, PanelKpi, PanelSectionHeader } from '../components/Panel';
import { DailyMovementWindow } from '../components/charts/DailyMovementWindow';
import { buildMockDailyRows, buildMockLineRows, buildMockTotals } from '../lib/mockSellOut';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const number = new Intl.NumberFormat('pt-BR');
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

export function SellOutResumo() {
  const dailyRows = buildMockDailyRows();
  const totals = buildMockTotals(dailyRows);
  const lineRows = buildMockLineRows();
  const latestLabel = dailyRows.length ? new Date(`${dailyRows[dailyRows.length - 1].date}T12:00:00`).toLocaleDateString('pt-BR') : '—';

  return (
    <>
      <PanelAlert tone="info">
        Layout de referência — casca visual: os 6 KPIs, a janela de movimento e o Sell Out por linha seguem a
        mesma estrutura do sistema atual. Os números abaixo são simulados; nenhum motor real está conectado ainda.
      </PanelAlert>

      <div className="panel-stat-grid" style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
        <PanelKpi
          label="Sell Out realizado"
          value={currency.format(totals.realized)}
          progress={totals.salesAchievement}
          progressLabel={`${percent.format(totals.salesAchievement)} da meta`}
        />
        <PanelKpi
          label="Meta T&C"
          value={currency.format(totals.sellOutTarget)}
          progress={totals.salesAchievement}
          progressLabel={`${percent.format(totals.salesAchievement)} atingido`}
        />
        <PanelKpi
          label="Faturado"
          value={currency.format(totals.invoiced)}
          progress={totals.invoicedShare}
          progressLabel={totals.invoicedShare === null ? 'Sem Sell Out realizado' : `${percent.format(totals.invoicedShare)} do Sell Out`}
        />
        <PanelKpi
          label="Clientes positivados"
          value={number.format(totals.positiveCustomers)}
          progress={totals.positivityAchievement}
          progressLabel={`${percent.format(totals.positivityAchievement)} da meta`}
        />
        <PanelKpi
          label="Meta de positivação"
          value={number.format(totals.positivityTarget)}
          progress={totals.positivityAchievement}
          progressLabel={`${percent.format(totals.positivityAchievement)} atingido`}
        />
        <PanelKpi
          label="Positivação faturada"
          value={number.format(totals.invoicedPositiveCustomers)}
          progress={totals.invoicedPositivityAchievement}
          progressLabel={`${percent.format(totals.invoicedPositivityAchievement)} atingido`}
        />
      </div>

      <PanelCard>
        <PanelSectionHeader
          eyebrow="MOVIMENTO"
          title="Fechamento diário"
          description="Gráficos e planilha usam a mesma janela móvel de 10 dias. A abertura sempre inicia no último dia válido do acompanhamento."
          action={<span className="panel-badge">ÚLTIMO MOVIMENTO · {latestLabel}</span>}
        />
        <DailyMovementWindow
          data={dailyRows}
          totals={{ realized: totals.realized, positiveCustomers: totals.positiveCustomers, invoicedPositiveCustomers: totals.invoicedPositiveCustomers }}
        />
      </PanelCard>

      <PanelCard>
        <PanelSectionHeader
          eyebrow="SELL OUT POR LINHA"
          title="Resultado das linhas comerciais"
          description="Cada linha de produto e sua participação percentual sobre o total de Sell Out do período."
        />
        <div className="panel-stat-grid" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
          {lineRows.map(row => (
            <PanelKpi
              key={row.line}
              label={row.line}
              value={currency.format(row.realized)}
              progress={row.share}
              progressLabel={`${percent.format(row.share)} do Sell Out`}
              detail={`Faturado: ${currency.format(row.invoiced)} · A faturar: ${currency.format(row.toInvoice)}`}
            />
          ))}
        </div>
      </PanelCard>
    </>
  );
}
