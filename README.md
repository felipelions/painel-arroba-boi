# 🐂 Painel Arroba do Boi & Simulador Estratégico

Painel completo de inteligência de mercado e simulador estratégico para pecuária de corte no Brasil, 100% mobile-first, com integração de IA (OpenAI), cálculos zootécnicos determinísticos e persistência em JSON local no servidor sem necessidade de banco de dados.

---

## 🌾 Nova Tela: Simulação de Cenários

Baseada na especificação técnica completa, a tela permite que o produtor configure e analise o impacto zootécnico e financeiro de suas decisões operacionais:

- **🤖 Preencher com IA**: Botão que abre modal com campo de texto para o produtor descrever sua estratégia em linguagem natural (ex: *"confinar 300 bois de 400kg por 90 dias com GMD de 1.4kg e ração a R$ 9,50/dia"*), com barra de progresso em tempo real, interpretação automática via modelo OpenAI configurado no `.env` e carregamento instantâneo no painel.
- **⚡ Motor Determinístico (`SimulationEngine`)**: Cálculo exato de ganho de peso, arrobas ganhas e abatidas, rendimento de carcaça, custos alimentares e operacionais, receita bruta/líquida, margem, ponto de equilíbrio da arroba e score de risco (0 a 100).
- **💡 Motor de Insights & Alertas (`InsightEngine`)**: Diagnósticos automáticos baseados em regras para déficit de pastagem, necessidade de capital, sensibilidade de mercado e oportunidades zootécnicas.
- **📊 Fluxo de Caixa Mensal**: Gráficos e tabela mês a mês com receitas de abate, custos e identificação do maior déficit de caixa e período crítico.
- **🎯 Ponto de Equilíbrio & Sensibilidade**: Apresentação de destaque do preço de equilíbrio da arroba, margem de segurança e ranking das variáveis que mais impactam o resultado final.
- **📑 Comparador de Cenários**: Compare até 4 cenários lado a lado com destaques automáticos para Maior Lucro, Maior Margem, Menor Risco e Menor Aporte de Capital.
- **💾 Persistência em JSON no Servidor**: Salva automaticamente no arquivo `data/cenarios.json` via rotas de API Node.js, com sincronização em `localStorage` e opções de **Exportar JSON** e **Importar JSON**.
- **📱 100% Mobile-First**: Controles tácteis com sliders duplos e inputs numéricos, barra de navegação inferior fixa para celular e alternador entre *Modo Rápido (10 variáveis)* e *Modo Avançado*.

---

## ⚙️ Variáveis de Ambiente (.env)

Crie ou edite o arquivo `.env.local` na raiz do projeto:

```env
# Chave da API OpenAI (para a função "Preencher com IA")
OPENAI_API_KEY=sk-sua-chave-aqui

# Modelo da OpenAI desejado (ex: gpt-4o-mini, motor5-nano, gpt-4o)
OPENAI_MODEL=gpt-4o-mini
```

> *Nota: Caso nenhuma chave da OpenAI esteja configurada, o sistema aciona automaticamente o interpretador inteligente zootécnico local de contingência, garantindo funcionamento completo.*

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ ou 20+

### Instalação
```bash
npm install
```

### Modo de Desenvolvimento
```bash
npm run dev
```
Acesse em: `http://localhost:43123`

### Build de Produção
```bash
npm run build
npm run start
```

---

## ☁️ Deploy na Vercel

O projeto está configurado para deploy nativo na **Vercel** com **Next.js**:
1. Conecte o repositório GitHub na Vercel.
2. Nas configurações de **Environment Variables** da Vercel, adicione:
   - `OPENAI_API_KEY`: sua chave OpenAI
   - `OPENAI_MODEL`: `gpt-4o-mini` (ou o motor desejado)
3. Clique em **Deploy** (framework detectado automaticamente como Next.js).

---

## 🛠️ Estrutura do Projeto

```
painel-arroba-boi/
├── data/
│   └── cenarios.json               # Persistência JSON de cenários (sem banco de dados)
├── public/
│   └── data/
│       ├── cepea-historico.json    # Dados históricos CEPEA
│       └── snapshot.json           # Estatísticas CEPEA
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/
│   │   │   ├── cenarios/           # Rotas de leitura e gravação de JSON
│   │   │   └── ai/preencher/       # Endpoint de integração com OpenAI
│   │   ├── layout.tsx              # Shell HTML com metatags mobile
│   │   └── page.tsx                # Página principal com abas e bottom bar mobile
│   ├── components/
│   │   ├── simulacoes/             # Componentes da Simulação de Cenários
│   │   │   ├── SimulacaoCenáriosView.tsx
│   │   │   ├── ModalPreencherIA.tsx
│   │   │   └── ComparadorCenários.tsx
│   │   ├── Filters.tsx
│   │   ├── KPICard.tsx
│   │   ├── PriceChart.tsx
│   │   └── DataTable.tsx
│   ├── services/
│   │   ├── SimulationEngine.ts     # Cálculos zootécnicos e financeiros
│   │   ├── InsightEngine.ts        # Regras de alertas e inteligência
│   │   └── StorageService.ts       # Camada de persistência JSON
│   └── types/
│       └── simulation.ts           # Interfaces e modelos TypeScript
├── .env.example
├── next.config.mjs
└── package.json
```