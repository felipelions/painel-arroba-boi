import { CenarioVariaveis, CenarioResultados, FazendaConfig, FluxoCaixaMes, SensibilidadeItem } from '../types/simulation';

export class SimulationEngine {
  /**
   * Executa a simulação determinística completa com base nas variáveis e parâmetros da fazenda.
   */
  public static calculate(
    variaveis: CenarioVariaveis,
    fazenda: FazendaConfig
  ): CenarioResultados {
    const {
      quantidadeAnimais,
      pesoMedioAtual,
      pesoMedioSaida,
      gmd,
      rendimentoCarcaca,
      mortalidade,
      diasPermanencia,
      precoProjetadoArroba,
      bonificacaoArroba,
      descontoArroba,
      freteVendaCabeca,
      comissaoVendaPercent,
      custoAnimalDia,
      areaPastagem,
      custoManutencaoPastagemHaAno,
      reformaPastagemAreaHa,
      investimentoReformaHa,
      custosFixosMensais,
      custosSanitariosCabecaAno,
      outrosCustosCabecaMes,
      novasCompras,
      financiamentoNecessario,
      taxaFinanciamentoAno,
      cenarioClimatico,
      capacidadeSuporteUA,
      lotacaoAtualUA
    } = variaveis;

    // 1. Zootecnia e Rebanho
    const mortalidadeEfetiva = Math.max(0, Math.min(0.2, mortalidade));
    const animaisAbatidos = Math.round(quantidadeAnimais * (1 - mortalidadeEfetiva));
    const ganhoPesoTotal = gmd * diasPermanencia;
    const pesoFinalCalculado = pesoMedioSaida > 0 ? pesoMedioSaida : (pesoMedioAtual + ganhoPesoTotal);
    const pesoVivoFinalTotal = animaisAbatidos * pesoFinalCalculado;
    
    // Peso carcaça (kg) e Arrobas (@ = 15kg de carcaça)
    const pesoCarcacaTotal = pesoVivoFinalTotal * rendimentoCarcaca;
    const producaoArrobas = Math.round((pesoCarcacaTotal / 15) * 100) / 100;

    // 2. Receita
    const receitaBruta = producaoArrobas * precoProjetadoArroba;
    const bonificacoes = producaoArrobas * bonificacaoArroba;
    const descontos = producaoArrobas * descontoArroba;
    const freteVendaTotal = animaisAbatidos * freteVendaCabeca;
    const comissaoTotal = receitaBruta * (comissaoVendaPercent / 100);
    const receitaLiquida = Math.max(0, receitaBruta + bonificacoes - descontos - freteVendaTotal - comissaoTotal);

    // 3. Custos
    // A) Compra de Animais (se houver novas compras cadastradas)
    let custoCompraAnimais = 0;
    if (novasCompras && novasCompras.length > 0) {
      custoCompraAnimais = novasCompras.reduce((sum, item) => {
        return sum + (item.quantidade * item.precoCabeca + item.quantidade * item.freteCabeca + item.quantidade * item.comissaoCabeca);
      }, 0);
    }

    // B) Alimentação e Nutrição
    const custoAlimentacao = Math.round(quantidadeAnimais * custoAnimalDia * diasPermanencia);

    // C) Pastagem
    const mesesPeriodo = diasPermanencia / 30;
    const custoManutencaoPasto = areaPastagem * (custoManutencaoPastagemHaAno * (mesesPeriodo / 12));
    const custoReformaPasto = reformaPastagemAreaHa * investimentoReformaHa;
    const custoPastagem = Math.round(custoManutencaoPasto + custoReformaPasto);

    // D) Sanidade
    const custoSanitario = Math.round(quantidadeAnimais * (custosSanitariosCabecaAno * (mesesPeriodo / 12)));

    // E) Custos Fixos
    const custosFixosTotal = Math.round(custosFixosMensais * mesesPeriodo);

    // F) Outros Custos Variáveis
    const custosVariaveisOutros = Math.round(quantidadeAnimais * outrosCustosCabecaMes * mesesPeriodo);

    // G) Custo Financeiro
    const custoFinanceiro = Math.round(financiamentoNecessario * (taxaFinanciamentoAno * (mesesPeriodo / 12)));

    const custosVariaveisTotal = custoAlimentacao + custoSanitario + custosVariaveisOutros + custoPastagem + freteVendaTotal + comissaoTotal;
    const custoTotal = custosFixosTotal + custosVariaveisTotal + custoCompraAnimais + custoFinanceiro;

    // 4. Resultados Econômicos
    const lucro = Math.round((receitaLiquida - custoTotal) * 100) / 100;
    const margemLiquida = receitaLiquida > 0 ? Math.round((lucro / receitaLiquida) * 1000) / 10 : 0;
    const custoArroba = producaoArrobas > 0 ? Math.round((custoTotal / producaoArrobas) * 100) / 100 : 0;
    const precoEquilibrio = producaoArrobas > 0 ? Math.round((custoTotal / producaoArrobas) * 100) / 100 : 0;
    const margemSeguranca = precoProjetadoArroba > 0
      ? Math.round(((precoProjetadoArroba - precoEquilibrio) / precoProjetadoArroba) * 1000) / 10
      : 0;
    const areaProdutiva = fazenda.areaProdutiva > 0 ? fazenda.areaProdutiva : (areaPastagem > 0 ? areaPastagem : 1);
    const lucroHectare = Math.round((lucro / areaProdutiva) * 100) / 100;
    const arrobasHectare = Math.round((producaoArrobas / areaProdutiva) * 10) / 10;
    const roi = custoTotal > 0 ? Math.round((lucro / custoTotal) * 1000) / 10 : 0;

    // 5. Fluxo de Caixa Mensal (projeção para o horizonte de meses da simulação, min 6, max 12)
    const numMeses = Math.max(3, Math.min(12, Math.ceil(mesesPeriodo)));
    const fluxoCaixa: FluxoCaixaMes[] = [];
    let saldoAcumulado = variaveis.capitalDisponivel;
    const nomesMeses = ['Mês 1', 'Mês 2', 'Mês 3', 'Mês 4', 'Mês 5', 'Mês 6', 'Mês 7', 'Mês 8', 'Mês 9', 'Mês 10', 'Mês 11', 'Mês 12'];

    const custoFixoMes = custosFixosMensais;
    const custoAlimentacaoMes = custoAlimentacao / numMeses;
    const custoSanitarioMes = custoSanitario / numMeses;
    const outrosVariaveisMes = custosVariaveisOutros / numMeses;
    const custoPastoMes = custoPastagem / numMeses;

    let menorSaldoAcumulado = saldoAcumulado;
    let mesCriticoIndex = 0;

    for (let i = 0; i < numMeses; i++) {
      let receitaMes = 0;
      let custoMes = custoFixoMes + custoAlimentacaoMes + custoSanitarioMes + outrosVariaveisMes + custoPastoMes;

      // Compra de animais no primeiro mês
      if (i === 0) {
        custoMes += custoCompraAnimais;
      }

      // Venda concentrada nos últimos meses ou no último mês
      if (i === numMeses - 1) {
        receitaMes += receitaLiquida;
        custoMes += custoFinanceiro; // juros quitados no fechamento
      }

      const saldoMensal = receitaMes - custoMes;
      saldoAcumulado += saldoMensal;

      if (saldoAcumulado < menorSaldoAcumulado) {
        menorSaldoAcumulado = saldoAcumulado;
        mesCriticoIndex = i;
      }

      fluxoCaixa.push({
        mes: nomesMeses[i] || `Mês ${i + 1}`,
        receitas: Math.round(receitaMes),
        custos: Math.round(custoMes),
        saldoMensal: Math.round(saldoMensal),
        saldoAcumulado: Math.round(saldoAcumulado)
      });
    }

    const capitalNecessario = menorSaldoAcumulado < 0 ? Math.abs(Math.round(menorSaldoAcumulado)) : 0;
    const mesCriticoCaixa = menorSaldoAcumulado < 0 ? nomesMeses[mesCriticoIndex] || `Mês ${mesCriticoIndex + 1}` : 'Nenhum déficit';

    // 6. Análise de Sensibilidade (Impacto no lucro com variação de +10% e -10%)
    const sensibilidade: SensibilidadeItem[] = [
      {
        fator: 'Preço da Arroba (@)',
        impactoMais10: Math.round(producaoArrobas * (precoProjetadoArroba * 0.1)),
        impactoMenos10: -Math.round(producaoArrobas * (precoProjetadoArroba * 0.1)),
        diferenca: Math.round(producaoArrobas * (precoProjetadoArroba * 0.2))
      },
      {
        fator: 'Ganho Médio Diário (GMD)',
        impactoMais10: Math.round(animaisAbatidos * (gmd * 0.1 * diasPermanencia * rendimentoCarcaca / 15) * precoProjetadoArroba),
        impactoMenos10: -Math.round(animaisAbatidos * (gmd * 0.1 * diasPermanencia * rendimentoCarcaca / 15) * precoProjetadoArroba),
        diferenca: Math.round(animaisAbatidos * (gmd * 0.2 * diasPermanencia * rendimentoCarcaca / 15) * precoProjetadoArroba)
      },
      {
        fator: 'Custo Alimentar (R$/dia)',
        impactoMais10: -Math.round(custoAlimentacao * 0.1),
        impactoMenos10: Math.round(custoAlimentacao * 0.1),
        diferenca: Math.round(custoAlimentacao * 0.2)
      },
      {
        fator: 'Mortalidade (+1% / -1%)',
        impactoMais10: -Math.round((receitaLiquida / Math.max(1, animaisAbatidos)) * (quantidadeAnimais * 0.01)),
        impactoMenos10: Math.round((receitaLiquida / Math.max(1, animaisAbatidos)) * (quantidadeAnimais * 0.01)),
        diferenca: Math.round((receitaLiquida / Math.max(1, animaisAbatidos)) * (quantidadeAnimais * 0.02))
      },
      {
        fator: 'Custos Fixos Mensais',
        impactoMais10: -Math.round(custosFixosTotal * 0.1),
        impactoMenos10: Math.round(custosFixosTotal * 0.1),
        diferenca: Math.round(custosFixosTotal * 0.2)
      }
    ].sort((a, b) => b.diferenca - a.diferenca);

    // 7. Score de Risco Composto (0 a 100)
    let scoreRisco = 25; // Base normal

    // Impacto da margem de segurança
    if (margemSeguranca < 5) scoreRisco += 30;
    else if (margemSeguranca < 15) scoreRisco += 18;
    else if (margemSeguranca > 25) scoreRisco -= 10;

    // Impacto de necessidade de capital
    if (capitalNecessario > variaveis.capitalDisponivel * 1.5) scoreRisco += 20;
    else if (capitalNecessario > 0) scoreRisco += 10;

    // Impacto de lotação de pastagem
    if (capacidadeSuporteUA > 0 && lotacaoAtualUA > capacidadeSuporteUA * 1.15) {
      scoreRisco += 20;
    } else if (capacidadeSuporteUA > 0 && lotacaoAtualUA > capacidadeSuporteUA) {
      scoreRisco += 10;
    }

    // Impacto climático
    if (cenarioClimatico === 'seca_severa') scoreRisco += 25;
    else if (cenarioClimatico === 'seca_moderada') scoreRisco += 12;

    // Mortalidade alta
    if (mortalidade > 0.03) scoreRisco += 15;

    scoreRisco = Math.max(5, Math.min(98, scoreRisco));

    let classificacaoRisco: 'baixo' | 'moderado' | 'elevado' | 'critico' = 'baixo';
    if (scoreRisco <= 25) classificacaoRisco = 'baixo';
    else if (scoreRisco <= 50) classificacaoRisco = 'moderado';
    else if (scoreRisco <= 75) classificacaoRisco = 'elevado';
    else classificacaoRisco = 'critico';

    return {
      producaoArrobas,
      pesoVivoFinalTotal,
      animaisAbatidos,
      receitaBruta: Math.round(receitaBruta),
      receitaLiquida: Math.round(receitaLiquida),
      custoCompraAnimais: Math.round(custoCompraAnimais),
      custoAlimentacao: Math.round(custoAlimentacao),
      custoSanitario: Math.round(custoSanitario),
      custosFixosTotal: Math.round(custosFixosTotal),
      custosVariaveisTotal: Math.round(custosVariaveisTotal),
      custoPastagem: Math.round(custoPastagem),
      custoFinanceiro: Math.round(custoFinanceiro),
      custoTotal: Math.round(custoTotal),
      lucro,
      margemLiquida,
      custoArroba,
      precoEquilibrio,
      margemSeguranca,
      lucroHectare,
      arrobasHectare,
      roi,
      capitalNecessario,
      mesCriticoCaixa,
      fluxoCaixa,
      sensibilidade,
      scoreRisco,
      classificacaoRisco
    };
  }
}

