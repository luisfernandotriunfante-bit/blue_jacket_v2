# Blue Jacket v2

Casca visual (MVP) do Blue Jacket — painel comercial da Milênio (distribuidor Colgate).

Este repositório é um rebuild do zero: a UI segue o padrão visual do mockup
"Painel PEX" (Space Grotesk / Manrope / IBM Plex Mono, paleta quase-preta,
escala de raio deliberada), mantendo do sistema atual apenas o essencial —
logo, nome, navegação por menu lateral e abas internas.

Nenhum motor de dados real está conectado ainda. A aba **Sell Out → Resumo**
está totalmente montada como referência de layout (6 KPIs, janela de
movimento diário de 10 dias com gráficos + planilha, Sell Out por linha),
mas com dados simulados — ver `src/lib/mockSellOut.ts`.

## Rodando localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Publica automaticamente no GitHub Pages via `.github/workflows/pages.yml`
a cada push em `main`.
# blue_jacket_v2
