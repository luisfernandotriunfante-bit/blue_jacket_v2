import { useState } from 'react';
import { Sidebar, type SidebarItem } from './components/Sidebar';
import { Header, TopTabs, Content } from './components/Shell';
import { PanelPage, PanelCard, PanelSectionHeader, PanelKpi, PanelAlert } from './components/Panel';
import { IconBars, IconBox, IconDoc, IconGear, IconGrid, IconPulse, IconUsers } from './components/icons';
import { SellOutResumo } from './pages/SellOutResumo';

const SECTIONS = [
  { id: 'sell-out', label: 'Sell Out', icon: <IconPulse />, tabs: ['Resumo', 'Redes', 'Gerencial'] },
  { id: 'pex', label: 'PEX', icon: <IconBars />, tabs: ['Indicadores'] },
  { id: 'estoque', label: 'Estoque', icon: <IconBox />, tabs: ['Visão Geral', 'Produtos', 'Lançamentos', 'Entradas e Saídas'] },
  { id: 'atividades', label: 'Atividades', icon: <IconGrid />, tabs: ['Visão Geral'] },
  { id: 'clientes', label: 'Clientes e Sortimento', icon: <IconUsers />, tabs: ['Visão Geral'] },
  { id: 'documentos', label: 'Documentos', icon: <IconDoc />, tabs: [] as string[] },
  { id: 'administracao', label: 'Administração', icon: <IconGear />, tabs: ['Bases', 'Cadastros', 'Metas', 'Competências', 'Auditoria'] },
] as const;

function PlaceholderPage({ section, tab }: { section: string; tab: string }) {
  return (
    <>
      <PanelCard>
        <PanelSectionHeader
          eyebrow="CASCA — MVP VISUAL"
          title={tab || section}
          description="Este é o esqueleto visual do Blue Jacket v2: ainda não há motor nem dado real conectado aqui. A ideia é validar layout, navegação e consistência antes de desenhar os motores."
        />
        <div className="panel-stat-grid">
          <PanelKpi label="Indicador A" value="—" caption="Aguardando motor" />
          <PanelKpi label="Indicador B" value="—" caption="Aguardando motor" />
          <PanelKpi label="Indicador C" value="—" caption="Aguardando motor" />
        </div>
      </PanelCard>
      <PanelAlert tone="info">
        Página placeholder — o conteúdo real de "{section}" entra quando os motores desta área forem definidos.
      </PanelAlert>
    </>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sectionId, setSectionId] = useState<(typeof SECTIONS)[number]['id']>('sell-out');
  const section = SECTIONS.find(item => item.id === sectionId) ?? SECTIONS[0];
  const [tab, setTab] = useState(section.tabs[0] ?? '');

  const items: SidebarItem[] = SECTIONS.map(item => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    active: item.id === sectionId,
    onSelect: () => {
      setSectionId(item.id);
      setTab(item.tabs[0] ?? '');
      setSidebarOpen(false);
    },
  }));

  const isSellOutResumo = section.id === 'sell-out' && tab === 'Resumo';

  return (
    <div className="bj-shell">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} onClose={() => setSidebarOpen(false)} items={items} />
      <Content>
        <Header eyebrow={`BLUE JACKET / ${section.label}`} title={tab || section.label} competence="Setembro 2026" />
        <TopTabs
          tabs={section.tabs.map(label => ({ id: label, label }))}
          activeId={tab}
          onSelect={setTab}
        />
        <PanelPage>
          {isSellOutResumo ? <SellOutResumo /> : <PlaceholderPage section={section.label} tab={tab} />}
        </PanelPage>
      </Content>
    </div>
  );
}
