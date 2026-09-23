import { useState } from 'react';
import { Sidebar, type SidebarItem } from './components/Sidebar';
import { Header, TopTabs, Content } from './components/Shell';
import { PanelPage, PanelCard, PanelSectionHeader, PanelKpi, PanelAlert } from './components/Panel';
import { IconBars, IconBox, IconDoc, IconGear, IconGrid, IconPulse, IconUsers } from './components/icons';
import { SellOutResumo } from './pages/SellOutResumo';
import { AdminCadastros } from './pages/admin/Cadastros';
import { AdminMetas } from './pages/admin/Metas';
import { EstoqueProdutos } from './pages/estoque/Produtos';
import { EstoqueLancamentos } from './pages/estoque/Lancamentos';
import { ClientesLista } from './pages/clientes/Clientes';
import { ClientesTopVarejistas } from './pages/clientes/TopVarejistas';
import { MotorClientes } from './pages/clientes/MotorClientes';
import { CURRENT_COMPETENCE, formatCompetencia } from './lib/competencia';

const SECTIONS = [
  { id: 'sell-out', label: 'Sell Out', icon: <IconPulse />, tabs: ['Resumo', 'Redes', 'Gerencial'] },
  { id: 'pex', label: 'PEX', icon: <IconBars />, tabs: ['Indicadores'] },
  { id: 'estoque', label: 'Estoque', icon: <IconBox />, tabs: ['Visão Geral', 'Produtos', 'Lançamentos', 'Entradas e Saídas'] },
  { id: 'atividades', label: 'Atividades', icon: <IconGrid />, tabs: ['Visão Geral'] },
  { id: 'clientes', label: 'Clientes e Sortimento', icon: <IconUsers />, tabs: ['Visão Geral', 'Clientes', 'Motor de Clientes', 'Top Varejistas'] },
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

// Dispatch explícito por seção+aba: cada combinação com dado manual já
// definido ganha sua própria página; o resto continua na casca visual até
// o motor daquela área ser desenhado.
function renderPage(sectionId: string, sectionLabel: string, tab: string) {
  if (sectionId === 'sell-out' && tab === 'Resumo') return <SellOutResumo />;
  if (sectionId === 'administracao' && tab === 'Cadastros') return <AdminCadastros />;
  if (sectionId === 'administracao' && tab === 'Metas') return <AdminMetas />;
  if (sectionId === 'estoque' && tab === 'Produtos') return <EstoqueProdutos />;
  if (sectionId === 'estoque' && tab === 'Lançamentos') return <EstoqueLancamentos />;
  if (sectionId === 'clientes' && tab === 'Clientes') return <ClientesLista />;
  if (sectionId === 'clientes' && tab === 'Motor de Clientes') return <MotorClientes />;
  if (sectionId === 'clientes' && tab === 'Top Varejistas') return <ClientesTopVarejistas />;
  return <PlaceholderPage section={sectionLabel} tab={tab} />;
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

  return (
    <div className="bj-shell">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} onClose={() => setSidebarOpen(false)} items={items} />
      <Content>
        <Header eyebrow={`BLUE JACKET / ${section.label}`} title={tab || section.label} competence={formatCompetencia(CURRENT_COMPETENCE)} />
        <TopTabs
          tabs={section.tabs.map(label => ({ id: label, label }))}
          activeId={tab}
          onSelect={setTab}
        />
        <PanelPage>
          {renderPage(section.id, section.label, tab)}
        </PanelPage>
      </Content>
    </div>
  );
}
