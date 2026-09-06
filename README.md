# 🐂 Painel Arroba do Boi

Dashboard web mobile-first para visualização de dados de mercado de arroba de gado bovino no Brasil.

## 📊 Sobre

Este painel integra dados históricos de duas fontes principais:
- **CEPEA** (Centro de Estudos Avançados em Economia Aplicada) via Zenodo
- **CotacaoDoDia.com** via scraping web

O dashboard oferece visualizações interativas, KPIs em tempo real, filtros dinâmicos e exportação de dados em CSV.

## ✨ Funcionalidades

- **📱 Mobile-First**: Layout otimizado para celular com touch targets de 44px+
- **📈 KPIs Dinâmicos**: Cotação atual, média, mínima e máxima do período
- **🎯 Filtros Avançados**: Por período (1M/3M/1A/5A/Máx), fonte, tipo, UF e praça
- **📊 Gráfico Interativo**: Histórico de preços com Recharts
- **📋 Tabela de Dados**: Visualização dos últimos registros
- **💾 Exportação CSV**: Download de dados filtrados
- **🎨 UI Dark Agribusiness**: Design moderno em dark mode
- **⚡ Estados de Loading**: Skeleton screens, progress bars e feedback em PT-BR

## 🚀 Como Usar

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:43123`

### Build de Produção

```bash
npm run build
npm run preview
```

### Atualizar Dados Reais

O projeto vem com dados de demonstração. Para buscar dados reais e atualizados:

```bash
npm run data:build
```

Este comando irá:
1. Baixar o histórico CEPEA do Zenodo (arquivo XLS)
2. Fazer scraping do CotacaoDoDia.com desde julho/2023
3. Gerar `public/data/cepea-historico.json` e `public/data/snapshot.json`

**Nota**: O scraping pode levar alguns minutos dependendo da quantidade de dados.

## 🛠️ Tecnologias

- **Vite** - Build tool e dev server
- **React 19** - Framework UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Recharts** - Gráficos interativos
- **Lucide React** - Ícones
- **XLSX** - Leitura de arquivos Excel
- **Cheerio** - Scraping HTML
- **node-fetch** - Requisições HTTP

## 📁 Estrutura do Projeto

```
painel-arroba-boi/
├── public/
│   └── data/
│       ├── cepea-historico.json   # Dados históricos
│       └── snapshot.json           # Estatísticas gerais
├── scripts/
│   └── build-data.mjs              # Script de coleta de dados
├── src/
│   ├── components/                 # Componentes React
│   │   ├── LoadingScreen.tsx
│   │   ├── KPICard.tsx
│   │   ├── Filters.tsx
│   │   ├── PriceChart.tsx
│   │   └── DataTable.tsx
│   ├── hooks/
│   │   └── useMarketData.ts        # Hook customizado
│   ├── types/
│   │   └── index.ts                # Definições TypeScript
│   ├── App.tsx                     # Componente principal
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Estilos globais
└── package.json
```

## 📊 Fontes de Dados

### CEPEA (Zenodo)
- **URL**: https://zenodo.org/records/12163228
- **Formato**: XLS
- **Conteúdo**: Série histórica de preços CEPEA
- **Licença**: Consultar repositório Zenodo

### CotacaoDoDia.com
- **URL Base**: https://www.cotacaododia.com/boi-gordo/historico/
- **Período**: Julho/2023 em diante
- **Método**: Web scraping responsável
- **Nota**: Use com moderação para não sobrecarregar o servidor

## ⚖️ Licença e Atribuição

Este projeto é fornecido como está para fins educacionais e de pesquisa.

**Atribuição de Dados**:
- Dados CEPEA: Centro de Estudos Avançados em Economia Aplicada (ESALQ/USP)
- Dados CotacaoDoDia: www.cotacaododia.com

Por favor, respeite os termos de uso das fontes de dados ao utilizar este dashboard.

## 🤝 Contribuindo

Contribuições são bem-vindas! Algumas ideias:
- Adicionar mais fontes de dados (B3, Esalq)
- Implementar análises preditivas
- Adicionar comparações regionais
- Melhorar a performance do scraping
- Adicionar testes automatizados

## 📝 Notas Técnicas

### Mobile-First
- Touch targets mínimos de 44px
- Bottom sheet para filtros em mobile
- Tabela responsiva com colunas colapsáveis
- Gráfico adaptativo via ResponsiveContainer

### Estados de Loading
- Skeleton screens para KPIs e tabela
- Progress bar determinada (0-100%)
- Textos descritivos em PT-BR
- Transições suaves

### Performance
- Dados carregados via fetch local (fast)
- Filtros aplicados via useMemo
- Agregação de dados no client-side
- Últimos 180 pontos no gráfico
- Últimos 50 registros na tabela

---

**Desenvolvido com ❤️ para o agronegócio brasileiro**