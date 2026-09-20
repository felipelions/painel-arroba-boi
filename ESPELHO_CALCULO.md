# Espelho de Cálculo — Painel Arroba Boi

Documento de referência das fórmulas usadas pelo motor de simulação (`SimulationEngine`) e pelos painéis derivados (Resumo Financeiro, Leilão Máximo, Gastos por Dia).

Fonte principal: `src/services/SimulationEngine.ts`.

---

## 1. Convenções de arroba

No Brasil pecuário convivem duas convenções. O painel usa **as duas**, cada uma no contexto certo:

| Contexto | Fórmula | Uso |
|----------|---------|-----|
| **@ de carcaça (venda / frigorífico)** | `1 @ = 15 kg de carcaça` | Receita, produção abatida, preço de equilíbrio |
| **@ viva de compra (boi magro / reposição)** | `arrobas = peso_vivo_kg ÷ 30` | Custo de aquisição por @ |

**Rendimento de carcaça** (padrão 54%, limitado entre 40% e 65%):

```
peso_carcaça = peso_vivo × rendimento
arrobas_carcaça = peso_carcaça ÷ 15
kg_vivo_por_@ = 15 ÷ rendimento
```

Exemplo: com 54% de rendimento, 1 @ de carcaça exige ≈ 27,8 kg de peso vivo.

---

## 2. Rebanho e zootecnia

```
mortalidade_efetiva     = clamp(mortalidade, 0 … 20%)
mortalidade_cabeças     = round(quantidade × mortalidade_efetiva)
animais_abatidos        = round(quantidade × (1 − mortalidade_efetiva))
rebanho_vivo            = max(0, quantidade − mortalidade_cabeças)

peso_entrada            = pesoMedioEntrada > 0 ? pesoMedioEntrada : pesoMedioAtual
ganho_peso_total        = GMD × dias_permanência
peso_final              = round(peso_entrada + ganho_peso_total)   ← sempre dinâmico (entrada + GMD × dias)
peso_vivo_médio         = round((peso_entrada + peso_final) / 2)
peso_vivo_final_total   = animais_abatidos × peso_final
```

### Produção de arrobas (venda)

```
peso_carcaça_total      = peso_vivo_final_total × rendimento
produção_arrobas        = round((peso_carcaça_total / 15) × 100) / 100   ← @ abatidas
@ carcaça / cabeça      = (peso_carcaça_por_cabeça) / 15
```

### Arrobas ganhas na fazenda (só o ganho de peso)

```
ganho_peso_efetivo      = max(0, peso_final − peso_entrada)
@ ganhas / cabeça       = (ganho_peso_efetivo × rendimento) / 15
total_@ produidas       = @ ganhas/cabeça × animais_abatidos
```

### Dias para produzir 1 @ de carcaça

```
ganho_carcaça_dia        = GMD × rendimento
dias_para_1_@           = 15 / ganho_carcaça_dia
```

---

## 3. Alimentação

**Opção A — diária direta (R$/animal/dia):**

```
custo_animal_dia_efetivo = custoAnimalDia
```

**Opção B — % do peso vivo × preço do kg de ração** (quando preenchidos):

```
peso_para_ração         = pesoBaseAlimentação > 0 ? pesoBaseAlimentação : peso_vivo_médio
consumo_diario_kg       = peso_para_ração × (consumoRacaoPercentPV / 100)
custo_animal_dia_efetivo = consumo_diario_kg × precoKgRacao
```

**Total do período:**

```
custo_alimentação = quantidade × custo_animal_dia_efetivo × dias_permanência
```

> A diária usa a **quantidade comprada** (não só os abatidos), porque o lote come enquanto estiver no trato — a mortalidade já reduz a receita, não o custo alimentar base.

---

## 4. Receita de venda

```
receita_bruta     = produção_arrobas × preço_projetado_@
bonificações      = produção_arrobas × bonificação_@
descontos         = produção_arrobas × desconto_@
frete_venda       = animais_abatidos × frete_venda_cabeça
comissão          = receita_bruta × (comissão_% / 100)
Senar / Funrural  = receita_bruta × (impostoSenar_% / 100)   ← padrão 1,63%

receita_líquida   = max(0,
                    receita_bruta + bonificações − descontos
                    − frete_venda − comissão − Senar)
```

**Importante:** frete, comissão e Senar saem **só da receita líquida**. Não entram de novo no custo de engorda (evita contagem dupla no lucro, ROI e teto de leilão).

---

## 5. Custo de compra dos animais

Prioridade (primeira regra que aplicar):

1. **Lista `novasCompras`:**  
   `Σ (qtd × (preço_cabeça + frete_cabeça + comissão_cabeça))`

2. **Preço por @ de boi magro (`precoCompraArrobaBoiMagro`):**  
   ```
   @ entrada / cabeça   = peso_entrada / 30
   custo / cabeça       = @ entrada × preço_compra_@
   custo_compra         = quantidade × custo/cabeça
   ```

3. **Preço por cabeça (`precoBoiMagro`):**  
   `custo_compra = quantidade × precoBoiMagro`

Métricas derivadas:

```
custo_compra / cabeça   = custo_compra / quantidade
@ entrada total         = quantidade × (peso_entrada / 30)
custo_compra / @        = custo_compra / @ entrada total
```

---

## 6. Custos operacionais (engorda)

```
meses = dias_permanência / 30
```

| Item | Fórmula |
|------|---------|
| Manutenção de pasto | `área_pasto × custo_manutenção_ha/ano × (meses/12)` |
| Reforma de pasto | `área_reforma_ha × investimento_ha` |
| Pastagem total | manutenção + reforma |
| Sanidade | `quantidade × custo_sanitário_cab/ano × (meses/12)` |
| Seguro | `quantidade × custo_seguro_cabeça` |
| Arrendamento | `arrendamento_mensal × meses` |
| Mão de obra | `mão_de_obra_mensal × meses` |
| Fixos gerais | `custos_fixos_mensais × meses` |
| **Fixos totais** | gerais + arrendamento + mão de obra |
| Outros variáveis | `quantidade × outros_custo_cab/mês × meses` |
| Financeiro (juros) | `financiamento × taxa_ano × (meses/12)` |

```
custo_engorda = alimentação + sanidade + fixos_totais + pastagem
              + seguro + financeiro + outros_variáveis

custo_total   = custo_compra_animais + custo_engorda
```

---

## 7. Resultado econômico

```
lucro              = receita_líquida − custo_total
margem_líquida_%   = (lucro / receita_líquida) × 100
ROI_%              = (lucro / custo_total) × 100

custo_@ (abatida)  = custo_total / produção_arrobas
preço_equilíbrio   = custo_total / produção_arrobas   (mesmo valor)
margem_segurança_% = ((preço_projetado_@ − preço_equilíbrio) / preço_projetado_@) × 100
```

### Por cabeça / por @ produzida

```
lucro / cabeça           = lucro / animais_abatidos
venda / cabeça           = receita_líquida / animais_abatidos
custo / cabeça           = custo_total / animais_abatidos
custo_@ produzida        = custo_engorda / total_@_produzidas   (só o ganho na fazenda)
diária_total / cab/dia   = custo_engorda / (quantidade × dias)
custo / kg carcaça       = custo_total / peso_carcaça_total
custo_aquisição / kg carcaça = custo_compra/cabeça / peso_carcaça/cabeça
impacto +1 p.p. rendimento ≈ ((peso_vivo_final_total × 0,01) / 15) × preço_@
```

### Lotação e hectare

```
1 UA                   = 450 kg de peso vivo
total_UAs              = (quantidade × peso_vivo_médio) / 450
lotação UA/ha          = total_UAs / área_pastagem
lucro / ha             = lucro / área_produtiva
@ / ha                 = produção_arrobas / área_produtiva
```

---

## 8. Comparativo com Selic / aplicações

Capital de referência = `custo_total` do lote. Período = `dias_permanência`.

Juros compostos:

```
rendimento = capital × ((1 + taxa_anual)^(dias/365) − 1)
```

| Alternativa | Taxa usada |
|-------------|------------|
| Selic / CDI | `taxaJuros` do cenário (padrão 11,25% a.a.) |
| CDB 100% CDI | ≈ Selic |
| Poupança | 70% da Selic se Selic > 8,5%; senão ~6,17% |
| Fundo DI / RF | ≈ 95% do CDI |

No motor:

```
rentabilidade_Selic_período_% = ((1 + Selic)^(dias/365) − 1) × 100
relação_com_Selic             = ROI_boi / rentabilidade_Selic_período
rendimento_Selic_equiv.       = custo_total × (rentabilidade_Selic_período / 100)
diferença vs Selic            = lucro_boi − rendimento_Selic_equiv.
```

---

## 9. Fluxo de caixa mensal

- Número de meses: `ceil(dias/30)`, limitado entre 3 e 12.
- Custos de engorda rateados igualmente entre os meses.
- **Mês 1:** + custo de compra dos animais.
- **Último mês:** + receita líquida; + juros financeiros.
- Saldo acumula a partir do `capitalDisponivel`.
- `capitalNecessário` = valor absoluto do menor saldo acumulado negativo (se houver).
- `mêsCríticoCaixa` = mês em que esse mínimo ocorreu.

---

## 10. Sensibilidade (±10%)

Impacto aproximado no resultado (ordenado pela amplitude):

| Fator | Impacto +10% |
|-------|----------------|
| Preço da @ | `+ produção_arrobas × preço × 0,10` |
| GMD | `+ animais × (GMD×0,1×dias×rendimento/15) × preço_@` |
| Custo alimentar | `− 10% do custo_alimentação` |
| Mortalidade (±1 p.p.) | `± (receita_líquida/abatidos) × (quantidade×0,01)` |
| Custos fixos | `± 10% dos fixos totais` |

---

## 11. Score de risco (0–100)

Parte de base 25 e soma/subtrai:

| Condição | Ajuste |
|----------|--------|
| Margem de segurança &lt; 5% | +30 |
| Margem &lt; 15% | +18 |
| Margem &gt; 25% | −10 |
| Capital necessário &gt; 1,5× capital disponível | +20 |
| Capital necessário &gt; 0 | +10 |
| Lotação &gt; 115% da capacidade UA | +20 |
| Lotação &gt; capacidade UA | +10 |
| Seca severa | +25 |
| Seca moderada | +12 |
| Mortalidade &gt; 3% | +15 |

Classificação: ≤25 baixo · ≤50 moderado · ≤75 elevado · senão crítico. Score limitado entre 5 e 98.

---

## 12. Teto de leilão (máximo a pagar)

Painel `LeilaoMaximoView` — quanto pagar no animal de reposição sem estourar o lucro mínimo desejado:

```
@ entrada / cabeça     = peso_entrada / 30
custo_engorda          = custo_total − custo_compra_atual
teto_compra_total      = receita_líquida − custo_engorda − (lucro_mín_por_cabeça × quantidade)
teto / cabeça          = teto_compra_total / quantidade
teto / @               = teto/cabeça / @ entrada

empate (lucro zero)    = (receita_líquida − custo_engorda) / quantidade
```

---

## 13. Gastos por dia

Painel `GastosPorDiaPanel` — rateia totais do período:

```
por_dia         = total_item / dias
por_cabeça_dia  = total_item / dias / quantidade
```

Itens: ração, fixos, pastagem, sanidade+seguro, venda (Senar+frete+comissão), juros, outros.

> Os custos de venda aparecem no gráfico de gastos/dia para visualização, mas **não** somam de novo no `custo_engorda` (já descontados na receita líquida).

---

## 14. Resumo em uma linha

```
Lucro = [(@ carcaça abatidas × preço_@) ± bônus/descontos − frete − comissão − Senar]
      − [compra dos animais + alimentação + pasto + sanidade + fixos + seguro + juros + outros]
```

Com:

- **Compra** em @ viva (`peso ÷ 30`) ou R$/cabeça  
- **Venda** em @ de carcaça (`peso_vivo × rendimento ÷ 15`)

---

*Gerado a partir do código em vigor do repositório. Se as fórmulas do `SimulationEngine` mudarem, atualize este espelho.*
