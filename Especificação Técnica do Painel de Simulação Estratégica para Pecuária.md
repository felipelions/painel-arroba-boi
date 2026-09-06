# Painel de Simulação Estratégica para Pecuária

## 1. Visão geral do projeto

Desenvolver um painel completo de simulação estratégica para produtores rurais de gado.

O objetivo da aplicação é permitir que o produtor configure sua operação, altere variáveis produtivas, financeiras, comerciais, climáticas e zootécnicas e visualize imediatamente como essas alterações impactam:

1. Receita
2. Custos
3. Lucro
4. Margem
5. Fluxo de caixa
6. Produção
7. Quantidade de arrobas
8. Custo por arroba
9. Lucro por hectare
10. Capital necessário
11. Risco da operação
12. Ponto de equilíbrio
13. Rentabilidade
14. Necessidade de financiamento
15. Capacidade produtiva
16. Momento ideal de compra
17. Momento ideal de venda

A aplicação deve funcionar como um laboratório estratégico da propriedade rural.

Cada alteração feita pelo usuário deverá recalcular automaticamente as projeções do cenário.

---

# 2. Objetivo principal

O sistema deve responder principalmente:

> Se eu alterar determinada variável da minha operação, qual será o impacto econômico, financeiro e produtivo?

Exemplos:

> Se a arroba cair 10%, qual será meu lucro?

> Se eu comprar mais 300 bezerros, qual capital precisarei?

> Se eu aumentar o ganho médio diário, quanto meu resultado melhora?

> Se eu suplementar determinado lote, vale economicamente a pena?

> Se ocorrer uma seca, minha fazenda suportará o rebanho atual?

> Se eu vender um lote em novembro em vez de janeiro, qual estratégia é melhor?

> Qual é o preço mínimo da arroba para minha operação não apresentar prejuízo?

> Qual é o preço máximo que posso pagar em um bezerro?

> Quanto posso investir em suplementação sem destruir minha margem?

> Qual estratégia gera o melhor equilíbrio entre lucro, capital e risco?

---

# 3. Premissa de arquitetura

## 3.1 Não utilizar banco de dados

A primeira versão da aplicação NÃO deverá utilizar:

1. MySQL
2. PostgreSQL
3. MongoDB
4. SQLite
5. Redis
6. Supabase
7. Firebase
8. Qualquer banco de dados remoto

Todo o armazenamento deverá ocorrer localmente utilizando arquivos JSON.

O objetivo é permitir que a aplicação seja executada de maneira simples, sem necessidade de configurar infraestrutura de banco de dados.

---

# 4. Persistência dos dados

Todos os dados deverão ser armazenados em arquivos JSON locais.

Estrutura sugerida:

```text
/data
    fazenda.json
    configuracoes.json
    rebanho.json
    lotes.json
    pastagens.json
    custos.json
    mercado.json
    cenarios.json
    simulacoes.json
    historico.json
    parametros.json
```

A aplicação deverá possuir uma camada responsável exclusivamente pela leitura e gravação desses arquivos.

Nenhuma parte da interface deverá acessar diretamente os arquivos JSON.

Criar uma camada de serviço semelhante a:

```text
StorageService
```

Responsabilidades:

1. Ler arquivos
2. Criar arquivos quando não existirem
3. Atualizar informações
4. Salvar cenários
5. Duplicar cenários
6. Remover cenários
7. Restaurar informações
8. Criar backup
9. Validar estrutura dos arquivos
10. Controlar versões da estrutura JSON

---

# 5. Estrutura sugerida de armazenamento

## fazenda.json

Exemplo:

```json
{
  "id": "fazenda_001",
  "nome": "Fazenda Boa Esperança",
  "estado": "SP",
  "municipio": "Sorocaba",
  "areaTotal": 1200,
  "areaProdutiva": 950,
  "areaPastagem": 800,
  "areaAgricola": 100,
  "areaConfinamento": 50,
  "modeloProducao": "ciclo_completo",
  "objetivoPrincipal": "maximizar_lucro",
  "moeda": "BRL"
}
```

---

# 6. Estrutura dos cenários

Cada cenário deverá possuir uma cópia independente das variáveis utilizadas na simulação.

Exemplo:

```json
{
  "id": "cenario_001",
  "nome": "Cenário Base",
  "descricao": "Planejamento padrão da operação",
  "dataCriacao": "2026-09-05T20:00:00",
  "dataAtualizacao": "2026-09-05T20:00:00",
  "periodo": {
    "inicio": "2026-09",
    "fim": "2027-09"
  },
  "variaveis": {},
  "resultados": {},
  "scoreRisco": 41
}
```

---

# 7. Regras importantes dos cenários

O sistema deve permitir:

1. Criar cenário
2. Editar cenário
3. Duplicar cenário
4. Renomear cenário
5. Excluir cenário
6. Comparar cenários
7. Definir cenário principal
8. Restaurar cenário
9. Exportar cenário
10. Importar cenário

Cada cenário deverá possuir todas as variáveis necessárias para reproduzir exatamente a simulação.

Não depender de valores temporários armazenados somente na interface.

---

# 8. Salvamento automático

Todas as alterações poderão ser armazenadas automaticamente.

Recomendação:

Após alteração de qualquer campo, esperar aproximadamente alguns milissegundos antes de salvar.

Utilizar mecanismo de debounce para evitar gravações excessivas.

Fluxo:

```text
Usuário altera variável
↓
Estado da aplicação atualizado
↓
Cálculos executados
↓
Resultados atualizados
↓
JSON do cenário atualizado
↓
Arquivo salvo
```

---

# 9. Backup automático

Sempre que um cenário for salvo, a aplicação poderá manter uma versão anterior.

Estrutura:

```text
/backups
    cenario_001_20260905_200000.json
    cenario_001_20260905_201500.json
```

Limitar a quantidade de backups, por exemplo:

20 versões por cenário.

---

# 10. Exportação e importação

A aplicação deverá permitir exportar um cenário completo.

Formato:

```text
cenario_fazenda_boavista.json
```

Esse arquivo deverá conter:

1. Configurações
2. Variáveis
3. Resultados
4. Dados do cenário
5. Versão da estrutura

Também deverá existir opção:

**Importar cenário**

O sistema valida o JSON antes de aceitar.

---

# 11. Estrutura visual principal

A tela deverá possuir três grandes áreas:

```text
PAINEL DE VARIÁVEIS

ÁREA CENTRAL DE RESULTADOS

PAINEL DE INTELIGÊNCIA
```

Representação:

```text
┌───────────────────────────────────────────────────────────────┐
│ SIMULADOR ESTRATÉGICO                                        │
│ Fazenda Boa Esperança                     Cenário Base        │
├───────────────────────────────────────────────────────────────┤
│ RESULTADOS PRINCIPAIS                                         │
│                                                               │
│ Lucro     Receita     Margem     Caixa     Produção     Risco │
├──────────────────┬──────────────────────────┬─────────────────┤
│ VARIÁVEIS        │ RESULTADOS               │ INTELIGÊNCIA    │
│                  │                          │                 │
│ Mercado          │ Fluxo de Caixa           │ Riscos          │
│ Produção         │ Evolução                 │ Oportunidades   │
│ Rebanho          │ Produção                 │ Recomendações   │
│ Pastagem         │ Custos                   │ Alertas         │
│ Nutrição         │ Rentabilidade            │                 │
│ Reprodução       │                          │                 │
│ Clima            │                          │                 │
│ Financeiro       │                          │                 │
├──────────────────┴──────────────────────────┴─────────────────┤
│ PONTO DE EQUILÍBRIO                                           │
├───────────────────────────────────────────────────────────────┤
│ COMPARAR | SALVAR | DUPLICAR | OTIMIZAR                       │
└───────────────────────────────────────────────────────────────┘
```

---

# 12. Cabeçalho

O cabeçalho deve apresentar:

## Informações

Nome da fazenda

Nome do cenário

Período analisado

Última atualização

Modelo produtivo

Horizonte da simulação

## Ações

Salvar

Duplicar

Comparar

Restaurar

Exportar

Importar

Novo cenário

---

# 13. Cards principais

Logo abaixo do cabeçalho deverão existir os principais indicadores da operação.

## Lucro projetado

Exemplo:

```text
R$ 1.248.000
```

Exibir também diferença em relação ao cenário base.

```text
+37,7%
```

---

## Receita projetada

```text
R$ 4.700.000
```

---

## Margem líquida

```text
26,5%
```

---

## Capital necessário

```text
R$ 610.000
```

Representa o maior déficit de caixa esperado durante o período analisado.

---

## Produção

```text
13.480 arrobas
```

---

## Lucro por hectare

```text
R$ 1.560
```

---

## Custo por arroba

```text
R$ 249
```

---

## Score de risco

```text
48 / 100
```

Classificação:

```text
0 até 25
Risco baixo

26 até 50
Risco moderado

51 até 75
Risco elevado

76 até 100
Risco crítico
```

---

# 14. Navegação das variáveis

A lateral esquerda deverá conter categorias.

## Mercado

## Produção

## Rebanho

## Compra

## Venda

## Pastagem

## Nutrição

## Reprodução

## Clima

## Custos

## Financeiro

## Infraestrutura

Cada categoria deverá abrir seus respectivos campos.

---

# 15. Mercado

Campos configuráveis:

## Boi gordo

Preço atual da arroba

Preço projetado da arroba

Preço mínimo

Preço máximo

## Reposição

Preço do bezerro

Preço do garrote

Preço do boi magro

Preço da novilha

## Insumos

Milho

Soja

Farelo

Mineral

Proteinado

Ração

Fertilizante

Diesel

Frete

## Macroeconomia

Dólar

Taxa de juros

Inflação

Custo do financiamento

---

# 16. Controles das variáveis

Sempre que possível utilizar:

1. Slider
2. Campo numérico
3. Campo percentual
4. Seletor
5. Calendário

Exemplo:

```text
Preço da arroba

R$ 320

R$ 250 ●──────────── R$ 450
```

O valor deve poder ser alterado tanto pelo slider quanto pelo campo numérico.

---

# 17. Produção animal

Campos:

Quantidade de animais

Peso médio atual

Peso médio de entrada

Peso médio de saída

Ganho médio diário

Rendimento de carcaça

Mortalidade

Idade média

Dias de permanência

Conversão alimentar

Produção esperada

---

# 18. Ganho médio diário

Campo:

```text
GMD atual
0,75 kg
```

Campo de simulação:

```text
GMD projetado
0,90 kg
```

Resultados derivados:

Nova data de saída

Dias economizados

Peso futuro

Produção adicional

Custo adicional

Receita adicional

Lucro incremental

---

# 19. Lotes

O sistema deverá permitir trabalhar por lote.

Cada lote poderá possuir:

```json
{
  "id": "lote_001",
  "nome": "Lote 01",
  "categoria": "boi_engorda",
  "quantidade": 220,
  "pesoAtual": 478,
  "pesoEntrada": 350,
  "pesoObjetivo": 525,
  "gmd": 0.82,
  "rendimentoCarcaca": 0.54,
  "mortalidade": 0.01,
  "dataEntrada": "2026-03-01",
  "dataVendaPrevista": "2026-11-01"
}
```

---

# 20. Compra de animais

Permitir simular novas compras.

Campos:

Quantidade

Categoria

Peso médio

Preço por cabeça

Preço por quilo

Frete

Comissão

Custos sanitários

Data da compra

Forma de pagamento

Número de parcelas

Juros

Mortalidade esperada

GMD estimado

Peso esperado de venda

Data estimada de venda

---

# 21. Resultado da compra

Calcular:

Investimento inicial

Capital total necessário

Custo financeiro

Custo de manutenção

Custo alimentar

Custo total

Produção projetada

Quantidade de arrobas

Receita esperada

Lucro esperado

Margem

Retorno sobre capital

Prazo de retorno

Preço mínimo de venda

---

# 22. Venda de animais

Permitir selecionar um lote e alterar:

Data da venda

Preço esperado

Peso esperado

Rendimento

Frete

Bonificação

Desconto

Comprador

---

# 23. Comparação das datas de venda

O sistema deverá poder comparar diversas datas possíveis.

Exemplo:

```text
NOVEMBRO

Lucro
R$ 312.000

DEZEMBRO

Lucro
R$ 341.000

JANEIRO

Lucro
R$ 318.000
```

Destacar automaticamente a alternativa mais rentável.

Entretanto considerar também:

Capital

Risco

Custo de permanência

Preço projetado

Necessidade de pastagem

---

# 24. Pastagem

Campos:

Área disponível

Tipo de pastagem

Capacidade de suporte

Unidade animal por hectare

Produção de matéria seca

Taxa de crescimento

Lotação atual

Lotação máxima

Custo de manutenção

Custo de reforma

Adubação

Irrigação

---

# 25. Simulação de recuperação de pastagem

Usuário informa:

Área recuperada

Investimento por hectare

Aumento estimado da capacidade

Aumento estimado de produtividade

Resultado:

Investimento total

Quantidade adicional de animais

Produção adicional

Receita adicional

Resultado incremental

Tempo estimado de retorno

---

# 26. Nutrição

O sistema deverá permitir simular estratégias diferentes.

Exemplo:

## Estratégia atual

Pasto + mineral

GMD:

0,65 kg

Custo:

R$ 2,30 por animal por dia

## Estratégia alternativa

Pasto + proteinado energético

GMD:

0,92 kg

Custo:

R$ 5,10 por animal por dia

Calcular:

Custo adicional

Peso adicional

Dias economizados

Produção adicional

Receita adicional

Resultado incremental

---

# 27. Dietas

Estrutura sugerida:

```json
{
  "id": "dieta_001",
  "nome": "Proteinado energético",
  "custoAnimalDia": 5.1,
  "gmdEsperado": 0.92,
  "consumoKgDia": 2.5
}
```

---

# 28. Clima

Permitir ajustes de cenários climáticos.

Campos:

Chuva

Temperatura

Umidade

Produção da pastagem

Risco de seca

Disponibilidade hídrica

---

# 29. Cenários climáticos rápidos

Criar opções:

Normal

Seca moderada

Seca severa

Excesso de chuva

Temperatura elevada

Personalizado

---

# 30. Impacto do clima

Alterações climáticas deverão influenciar:

Produção de pasto

Capacidade de suporte

GMD

Consumo de suplemento

Custo alimentar

Quantidade de animais suportada

Mortalidade potencial

Necessidade de venda antecipada

---

# 31. Reprodução

Campos:

Número de matrizes

Taxa de prenhez

Taxa de nascimento

Taxa de desmame

Mortalidade neonatal

Intervalo entre partos

Taxa de descarte

Taxa de reposição

Peso médio ao desmame

---

# 32. Resultado reprodutivo

Calcular:

Quantidade de nascimentos

Quantidade de desmamados

Quantidade de animais disponíveis

Valor esperado da produção

Custo reprodutivo

Receita futura

Impacto no rebanho

Impacto em caixa

---

# 33. Confinamento

Criar simulador específico.

Inputs:

Quantidade de animais

Peso inicial

Peso final

Dias de confinamento

GMD

Consumo diário

Custo da dieta

Preço do milho

Preço dos demais ingredientes

Custo operacional

Rendimento de carcaça

Preço esperado da arroba

Frete

Mortalidade

---

# 34. Resultados do confinamento

Exibir:

Custo por animal por dia

Custo alimentar total

Custo por arroba produzida

Produção adicional

Receita esperada

Lucro esperado

Margem

Retorno sobre capital

Preço de equilíbrio

---

# 35. Custos

Separar:

## Custos variáveis

Compra de animais

Ração

Suplementação

Medicamentos

Vacinas

Fertilizantes

Combustível

Frete

Comissões

Mão de obra variável

## Custos fixos

Funcionários

Administração

Contabilidade

Arrendamento

Seguros

Energia

Manutenção

Depreciação

Sistemas

Consultorias

---

# 36. Fluxo de caixa

O sistema deverá projetar o fluxo de caixa mês a mês.

Exibir:

Receitas

Custos

Investimentos

Compra de animais

Venda de animais

Financiamentos

Juros

Saldo mensal

Saldo acumulado

---

# 37. Maior necessidade de caixa

Calcular automaticamente o menor saldo acumulado.

Exemplo:

```text
Maior necessidade de capital

R$ 640.000

Período crítico

Março de 2027
```

---

# 38. Linha do tempo

Criar visualização cronológica dos eventos.

Exemplo:

```text
SETEMBRO

Compra de animais

OUTUBRO

Reforma de pastagem

NOVEMBRO

Estação de monta

JANEIRO

Suplementação

MAIO

Semi confinamento

AGOSTO

Primeiro lote pronto

SETEMBRO

Venda

OUTUBRO

Venda
```

---

# 39. Comparador de cenários

Permitir selecionar até quatro cenários.

Exibir:

| Indicador | Base | Confinamento | Pastagem | Expansão |
| --- | ---: | ---: | ---: | ---: |
| Lucro | R$ 920 mil | R$ 1,35 mi | R$ 1,18 mi | R$ 1,42 mi |
| Capital | R$ 380 mil | R$ 920 mil | R$ 470 mil | R$ 1,10 mi |
| Margem | 21% | 27% | 26% | 25% |
| Risco | 32 | 61 | 39 | 58 |
| Arrobas por hectare | 10,4 | 15,8 | 14,9 | 16,2 |

Indicar automaticamente:

Maior lucro

Maior margem

Menor risco

Menor necessidade de capital

Maior retorno sobre capital

Melhor relação risco retorno

---

# 40. Ponto de equilíbrio

Criar área extremamente visível.

Exemplo:

```text
PREÇO DE EQUILÍBRIO DA ARROBA

R$ 284,70
```

Também calcular:

Preço máximo do bezerro

Preço máximo do boi magro

Preço máximo do milho

GMD mínimo

Rendimento mínimo de carcaça

Taxa mínima de prenhez

Produção mínima por hectare

---

# 41. Margem de segurança

Exemplo:

Preço projetado:

```text
R$ 322
```

Preço de equilíbrio:

```text
R$ 284
```

Margem de segurança:

```text
11,8%
```

Quanto menor a margem, maior o risco financeiro.

---

# 42. Análise de sensibilidade

Criar seção:

## O que mais impacta meu resultado?

Avaliar variação das principais variáveis.

Exemplo:

```text
Preço da arroba

Impacto potencial
R$ 560.000

GMD

Impacto potencial
R$ 310.000

Preço do bezerro

Impacto potencial
R$ 270.000

Milho

Impacto potencial
R$ 190.000
```

Ordenar da variável de maior impacto para a de menor impacto.

---

# 43. Score de risco

Criar cálculo composto entre 0 e 100.

Considerar:

Mercado

Clima

Fluxo de caixa

Endividamento

Pastagem

Alimentação

Sanidade

Reprodução

Concentração de receita

Concentração de compradores

Dependência de insumos

Margem de segurança

---

# 44. Inteligência da aplicação

A aplicação deve gerar automaticamente insights baseados nos resultados.

Exemplos:

## Oportunidade

```text
A suplementação do lote 08 durante 72 dias pode aumentar o resultado em aproximadamente R$ 96.000.
```

## Risco

```text
A capacidade de suporte prevista para agosto está aproximadamente 14% abaixo da necessidade do rebanho projetado.
```

## Caixa

```text
A estratégia atual poderá exigir aproximadamente R$ 580.000 adicionais em março.
```

## Mercado

```text
Uma redução superior a 11% no preço da arroba pode eliminar a margem operacional do cenário.
```

---

# 45. Sistema de alertas

Classificações:

Informação

Oportunidade

Atenção

Risco

Crítico

Cada alerta deve possuir:

Título

Descrição

Impacto

Categoria

Prioridade

Possível ação

---

# 46. Regras de insight

Não depender obrigatoriamente de inteligência artificial externa.

Criar inicialmente um motor baseado em regras.

Exemplo:

```text
SE capacidadePastagem < necessidadeRebanho
ENTÃO gerar alerta de déficit de pastagem
```

Outro exemplo:

```text
SE precoProjetadoArroba < precoEquilibrio * 1.05
ENTÃO gerar alerta de margem reduzida
```

Outro:

```text
SE saldoProjetado < 0
ENTÃO gerar alerta de necessidade de capital
```

---

# 47. Monte Carlo

Preparar a arquitetura para permitir simulações probabilísticas futuramente.

Variáveis possíveis:

Preço da arroba

Preço do milho

Preço do bezerro

GMD

Mortalidade

Chuva

Taxa de prenhez

Rendimento de carcaça

---

# 48. Resultado probabilístico futuro

Exemplo:

```text
Simulações executadas

10.000

Lucro médio

R$ 1.240.000

Probabilidade de lucro

87%

Probabilidade de prejuízo

13%

Cenário inferior

R$ 180.000 de prejuízo

Cenário superior

R$ 2.150.000 de lucro
```

---

# 49. Otimizador estratégico

Preparar a arquitetura para um motor capaz de buscar automaticamente a melhor configuração.

Inputs do produtor:

Capital máximo disponível

Risco máximo aceitável

Área disponível

Quantidade máxima de animais

Objetivo

Exemplo de objetivo:

```text
MAXIMIZAR_LUCRO
```

ou

```text
MAXIMIZAR_RETORNO_CAPITAL
```

ou

```text
MINIMIZAR_RISCO
```

---

# 50. Resultado do otimizador

Exemplo:

```text
ESTRATÉGIA RECOMENDADA

Comprar 180 bezerros

Recuperar 120 hectares

Suplementar 460 animais

Semi confinar 250 animais

Venda do lote A em novembro

Venda do lote B em janeiro

Lucro esperado

R$ 1.480.000

Capital máximo necessário

R$ 687.000

Score de risco

46 / 100
```

---

# 51. Fórmulas iniciais

As fórmulas devem ficar centralizadas em um serviço de cálculo.

Nunca espalhar fórmulas diretamente pelos componentes visuais.

Criar algo semelhante a:

```text
SimulationEngine
```

Responsável por todos os cálculos.

---

# 52. Produção de arrobas

Exemplo simplificado:

```text
pesoCarcaca = pesoVivo × rendimentoCarcaca
```

```text
arrobas = pesoCarcaca / 15
```

---

# 53. Receita

```text
receitaBruta = arrobasVendidas × precoArroba
```

---

# 54. Receita líquida

```text
receitaLiquida =
receitaBruta
+ bonificacoes
− descontos
− frete
− comissoes
− impostos
```

---

# 55. Custo total

```text
custoTotal =
custosFixos
+ custosVariaveis
+ custoCompraAnimais
+ custoFinanceiro
+ investimentosConsumidos
```

---

# 56. Lucro

```text
lucro = receitaLiquida − custoTotal
```

---

# 57. Margem líquida

```text
margemLiquida = lucro / receitaLiquida
```

---

# 58. Custo por arroba

```text
custoArroba = custoTotal / arrobasProduzidas
```

---

# 59. Lucro por hectare

```text
lucroHectare = lucro / areaProdutiva
```

---

# 60. Arrobas por hectare

```text
arrobasHectare = arrobasProduzidas / areaProdutiva
```

---

# 61. Ganho de peso

```text
ganhoPeso = GMD × numeroDias
```

```text
pesoFinal = pesoInicial + ganhoPeso
```

---

# 62. Data estimada para atingir peso objetivo

```text
diasNecessarios =
(pesoObjetivo − pesoAtual) / GMD
```

---

# 63. Custo alimentar

```text
custoAlimentacao =
quantidadeAnimais
× custoAnimalDia
× numeroDias
```

---

# 64. Mortalidade

```text
animaisSobreviventes =
quantidadeInicial × (1 − mortalidade)
```

---

# 65. Produção reprodutiva

```text
prenhezes =
matrizes × taxaPrenhez
```

```text
nascimentos =
prenhezes × taxaNascimento
```

```text
desmamados =
nascimentos × taxaDesmame
```

---

# 66. Retorno sobre capital

```text
ROI = lucro / capitalInvestido
```

---

# 67. Ponto de equilíbrio da arroba

Simplificação inicial:

```text
precoEquilibrio =
custoTotal / arrobasVendidas
```

Posteriormente poderão ser incorporadas regras mais sofisticadas.

---

# 68. Resultado incremental

Sempre que possível comparar cenário modificado versus cenário base.

```text
resultadoIncremental =
lucroNovoCenario − lucroCenarioBase
```

---

# 69. Estado global

Centralizar os dados do cenário em um estado global.

Estrutura conceitual:

```json
{
  "fazenda": {},
  "cenarioAtual": {},
  "rebanho": [],
  "lotes": [],
  "pastagens": [],
  "mercado": {},
  "nutricao": {},
  "clima": {},
  "custos": {},
  "financeiro": {},
  "resultados": {},
  "alertas": []
}
```

---

# 70. Fluxo de cálculo

Toda alteração deverá executar:

```text
ATUALIZAR VARIÁVEL

↓

VALIDAR VALOR

↓

ATUALIZAR ESTADO

↓

EXECUTAR MOTOR DE SIMULAÇÃO

↓

RECALCULAR RESULTADOS

↓

ATUALIZAR GRÁFICOS

↓

ATUALIZAR ALERTAS

↓

ATUALIZAR INSIGHTS

↓

SALVAR JSON LOCAL
```

---

# 71. Performance

Evitar recalcular absolutamente tudo quando não for necessário.

Separar cálculos por módulos:

Mercado

Produção

Financeiro

Rebanho

Clima

Pastagem

Nutrição

Cada módulo deverá informar quais resultados foram impactados.

---

# 72. Versionamento do JSON

Todos os arquivos principais deverão possuir:

```json
{
  "schemaVersion": "1.0.0"
}
```

Isso permitirá evoluir o projeto futuramente.

---

# 73. Validação dos arquivos

Ao carregar um JSON:

1. Validar existência
2. Validar formato
3. Validar versão
4. Validar campos obrigatórios
5. Corrigir valores padrão quando possível
6. Informar erro quando necessário

---

# 74. Arquivo de configurações

Exemplo:

```json
{
  "schemaVersion": "1.0.0",
  "unidadePeso": "kg",
  "unidadeArea": "hectare",
  "moeda": "BRL",
  "arrobaKg": 15,
  "autosave": true,
  "backupAutomatico": true,
  "limiteBackups": 20
}
```

---

# 75. Valores padrão

Criar arquivo:

```text
parametros.json
```

Com valores padrão utilizados quando ainda não houver informações cadastradas.

Nunca deixar cálculos quebrarem por ausência de valores.

---

# 76. Experiência de uso

O painel deve ser fácil o suficiente para um produtor rural utilizar sem conhecimento técnico.

Priorizar:

Campos simples

Explicações objetivas

Resultados visuais

Comparações claras

Poucos campos visíveis simultaneamente

Informações avançadas escondidas em áreas expansíveis

---

# 77. Simulação rápida

Criar modo:

## Simulação rápida

Utilizar apenas aproximadamente 10 principais variáveis:

Preço da arroba

Quantidade de animais

Peso atual

GMD

Preço do bezerro

Preço do milho

Custo alimentar

Mortalidade

Rendimento de carcaça

Preço de venda

Capital disponível

---

# 78. Simulação avançada

Criar modo:

## Simulação avançada

Permitir acesso a todas as variáveis da operação.

---

# 79. Dashboard

Os gráficos mais importantes deverão ser:

Fluxo de caixa

Lucro por mês

Receita por mês

Custos por mês

Evolução do rebanho

Evolução de peso

Arrobas produzidas

Custo por arroba

Produção por hectare

Sensibilidade do lucro

---

# 80. Histórico de simulações

Guardar no JSON:

Data

Cenário

Variáveis alteradas

Resultado anterior

Resultado novo

Exemplo:

```json
{
  "data": "2026-09-05T21:10:00",
  "cenarioId": "cenario_001",
  "alteracoes": {
    "precoArroba": {
      "anterior": 310,
      "novo": 325
    }
  },
  "resultadoAnterior": {
    "lucro": 920000
  },
  "resultadoNovo": {
    "lucro": 1085000
  }
}
```

---

# 81. Botão restaurar

Permitir restaurar:

Última versão

Cenário original

Versão selecionada

---

# 82. Modo comparação

Nunca alterar os cenários comparados.

Somente leitura.

---

# 83. Possibilidade futura de IA

A arquitetura deverá ser preparada para adicionar futuramente um agente de IA.

O agente receberia um JSON resumido.

Exemplo:

```json
{
  "fazenda": {},
  "cenario": {},
  "indicadores": {},
  "riscos": [],
  "oportunidades": [],
  "sensibilidade": {}
}
```

A IA poderia responder perguntas sobre a operação.

Entretanto a aplicação deverá funcionar completamente sem IA externa.

---

# 84. Princípio fundamental

A lógica matemática da aplicação NÃO deve depender de uma IA generativa.

Os cálculos precisam ser determinísticos.

IA poderá ser utilizada posteriormente apenas para:

Interpretação

Recomendações

Explicações

Identificação de padrões

Geração de relatórios

Planejamento estratégico

---

# 85. Estrutura sugerida de código

Estrutura conceitual:

```text
src

    components

    pages

    modules

        mercado

        rebanho

        pastagem

        nutricao

        reproducao

        financeiro

        clima

    services

        StorageService

        SimulationEngine

        ScenarioService

        RiskEngine

        InsightEngine

        BackupService

    models

    utils

    hooks

data

backups
```

---

# 86. Serviços principais

## StorageService

Responsável pelos arquivos JSON.

## SimulationEngine

Responsável pelos cálculos.

## ScenarioService

Responsável pelos cenários.

## RiskEngine

Responsável pela análise de risco.

## InsightEngine

Responsável por regras e recomendações.

## BackupService

Responsável pelas versões locais.

---

# 87. Regras de desenvolvimento

1. Não utilizar banco de dados
2. Persistir tudo em JSON
3. Separar interface de cálculos
4. Separar cálculos do armazenamento
5. Centralizar fórmulas
6. Criar componentes reutilizáveis
7. Permitir fácil inclusão de novas variáveis
8. Permitir evolução futura
9. Não acoplar regras aos componentes
10. Evitar valores fixos no código
11. Utilizar arquivo de parâmetros
12. Validar todos os inputs
13. Salvar automaticamente alterações
14. Criar backups
15. Permitir exportação e importação
16. Criar histórico de alterações
17. Permitir comparar cenários
18. Recalcular resultados em tempo real

---

# 88. Prioridade do MVP

A primeira versão deve priorizar:

## Fase 1

Cadastro da fazenda

Cenários

Rebanho

Lotes

Mercado

Custos

Produção

Fluxo de caixa

Resultado financeiro

Ponto de equilíbrio

Comparação de cenários

Armazenamento JSON

Exportação

Importação

Backup

---

# 89. Segunda etapa

Adicionar:

Pastagem

Nutrição

Compra

Venda

Reprodução

Clima

Confinamento

Sensibilidade

Score de risco

---

# 90. Terceira etapa

Adicionar:

Monte Carlo

Otimização

Recomendações automáticas

Agente IA

Dados externos

Previsão de preços

Integrações

---

# 91. Resultado esperado da aplicação

Ao abrir a plataforma o produtor deverá conseguir visualizar algo semelhante a:

```text
FAZENDA BOA ESPERANÇA

CENÁRIO
Planejamento 2027

RECEITA PROJETADA
R$ 4.700.000

LUCRO PROJETADO
R$ 1.248.000

MARGEM
26,5%

PRODUÇÃO
13.480 arrobas

CUSTO POR ARROBA
R$ 249

PREÇO DE EQUILÍBRIO
R$ 284

PREÇO PROJETADO
R$ 322

CAPITAL NECESSÁRIO
R$ 610.000

LUCRO POR HECTARE
R$ 1.560

SCORE DE RISCO
48 / 100
```

---

# 92. Objetivo final do produto

O sistema não deve ser apenas uma ferramenta de gestão rural.

Ele deve funcionar como:

> Uma plataforma de inteligência econômica, produtiva e estratégica da pecuária capaz de transformar dados da fazenda em decisões financeiras.

Cada tela deve ajudar o produtor a responder:

```text
O QUE ACONTECE SE EU FIZER ISSO?
```

e principalmente:

```text
QUAL DECISÃO TENDE A GERAR O MELHOR RESULTADO?
```

A experiência principal deve permitir:

```text
ALTERAR UMA VARIÁVEL

↓

ENTENDER O IMPACTO

↓

COMPARAR POSSIBILIDADES

↓

ANALISAR RISCO

↓

TOMAR UMA DECISÃO
```

Esse deve ser o princípio central de toda a arquitetura do produto.