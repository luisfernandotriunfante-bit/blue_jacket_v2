import { PanelAlert, PanelCard, PanelKpi, PanelSectionHeader } from '../components/Panel';
import { DailyMovementWindow } from '../components/charts/DailyMovementWindow';
import { buildMockDailyRows, buildMockLineRows, buildMockTotals } from '../lib/mockSellOut';
import { compactBRL, currencyFmt, numberFmt, percentFmt } from '../lib/format';

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

      <div className="panel-stat-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <PanelKpi
          label="Sell Out realizado"
          value={compactBRL(totals.realized)}
          suffix={`de ${compactBRL(totals.sellOutTarget)}`}
          progress={totals.salesAchievement}
          caption={currencyFmt.format(totals.realized)}
        />
        <PanelKpi
          label="Meta T&C"
          value={compactBRL(totals.sellOutTarget)}
          suffix={`${percentFmt.format(totals.salesAchievement)} atingido`}
          progress={totals.salesAchievement}
          caption={currencyFmt.format(totals.sellOutTarget)}
        />
        <PanelKpi
          label="Faturado"
          value={compactBRL(totals.invoiced)}
          suffix={totals.invoicedShare === null ? 'sem Sell Out' : `${percentFmt.format(totals.invoicedShare)} do Sell Out`}
          progress={totals.invoicedShare}
          caption={currencyFmt.format(totals.invoiced)}
        />
        <PanelKpi
          label="Clientes positivados"
          value={numberFmt.format(totals.positiveCustomers)}
          suffix={`de ${numberFmt.format(totals.positivityTarget)}`}
          progress={totals.positivityAchievement}
        />
        <PanelKpi
          label="Meta de positivação"
          value={numberFmt.format(totals.positivityTarget)}
          suffix={`${percentFmt.format(totals.positivityAchievement)} atingido`}
          progress={totals.positivityAchievement}
        />
        <PanelKpi
          label="Positivação faturada"
          value={numberFmt.format(totals.invoicedPositiveCustomers)}
          suffix={`de ${numberFmt.format(totals.positivityTarget)}`}
          progress={totals.invoicedPositivityAchievement}
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
        <div className="panel-stat-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {lineRows.map(row => (
            <PanelKpi
              key={row.line}
              label={row.line}
              value={compactBRL(row.realized)}
              suffix={`${percentFmt.format(row.share)} do total`}
              progress={row.share}
              caption={`Fat: ${compactBRL(row.invoiced)} · A fat: ${compactBRL(row.toInvoice)}`}
            />
          ))}
        </div>
      </PanelCard>
    </>
  );
}
