import {
  CenarioVariaveis,
  CenarioResultados,
  FazendaConfig,
  FluxoCaixaMes,
  SensibilidadeItem,
  ComparativoSelic
} from '../types/simulation';

export class SimulationEngine {
  /**
   * Executa a simulação determinística completa com base nas variáveis e parâmetros da fazenda,
   * incorporando os parâmetros zootécnicos e financeiros da planilha de pecuária.
   */
  public static calculate(
    variaveis: CenarioVariaveis,
    fazenda: FazendaConfig
  ): CenarioResultados {
    const {
      quantidadeAnimais,
      pesoMedioAtual,
      pesoMedioEntrada,
      pesoMedioSaida,
      gmd,
      rendimentoCarcaca,
      mortalidade,
      diasPermanencia,
      precoProjetadoArroba,
      precoBoiMagro,
      precoCompraArrobaBoiMagro,
      bonificacaoArroba,
      descontoArroba,
      freteVendaCabeca,
      comissaoVendaPercent,
      impostoSenarPercent = 1.63,
      custoAnimalDia,
      consumoRacaoPercentPV,
      precoKgRacao,
      areaPastagem,
      custoManutencaoPastagemHaAno,
      reformaPastagemAreaHa,
      investimentoReformaHa,
      arrendamentoMensal = 0,
      maoDeObraMensal = 0,
      custosFixosMensais,
      custosSanitariosCabecaAno,
      custoSeguroCabeca = 0,
      outrosCustosCabecaMes,
      novasCompras,
      financiamentoNecessario,
      taxaFinanciamentoAno,
      cenarioClimatico,
      capacidadeSuporteUA,
      taxaJuros
    } = variaveis;

    // 1. Zootecnia e Rebanho
    const mortalidadeEfetiva = Math.max(0, Math.min(0.2, mortalidade || 0));
    const quantidadeComprada = quantidadeAnimais;
    const mortalidadeCabecas = Math.round(quantidadeAnimais * mortalidadeEfetiva);
    const rebanhoVivoAtual = Math.max(0, quantidadeAnimais - mortalidadeCabecas);
    const animaisAbatidos = Math.round(quantidadeAnimais * (1 - mortalidadeEfetiva));
    const pesoEntradaEfetivo = pesoMedioEntrada > 0 ? pesoMedioEntrada : pesoMedioAtual;
    const ganhoPesoTotal = gmd * diasPermanencia;
    const pesoFinalCalculado = pesoMedioSaida > 0 ? pesoMedioSaida : (pesoEntradaEfetivo + ganhoPesoTotal);
    const pesoVivoFinalTotal = animaisAbatidos * pesoFinalCalculado;
    const pesoVivoMedio = Math.round((pesoEntradaEfetivo + pesoFinalCalculado) / 2);

    // Peso carcaça (kg) e Arrobas (@ = 15kg de carcaça abatida)
    const pesoCarcacaTotal = pesoVivoFinalTotal * rendimentoCarcaca;
    const producaoArrobas = Math.round((pesoCarcacaTotal / 15) * 100) / 100;
    const totalArrobasAbatidas = producaoArrobas;

    // Arrobas produzidas/ganhas dentro da fazenda
    const arrobasGanhasPorCabeca = Math.round(((ganhoPesoTotal * rendimentoCarcaca) / 15) * 100) / 100;
    const totalArrobasProduzidas = Math.round(arrobasGanhasPorCabeca * animaisAbatidos * 10) / 10;

    // Dias para colocar 1 arroba na carcaça
    const ganhoCarcaçaDia = gmd * rendimentoCarcaca;
    const diasParaProduzirUmaArroba = ganhoCarcaçaDia > 0 ? Math.round((15 / ganhoCarcaçaDia) * 10) / 10 : 0;

    // 2. Nutrição e Alimentação (Cálculo Direto ou %PV e Preço/kg da Ração)
    let custoAnimalDiaEfetivo = custoAnimalDia;
    if (consumoRacaoPercentPV && consumoRacaoPercentPV > 0 && precoKgRacao && precoKgRacao > 0) {
      const consumoDiarioKg = pesoVivoMedio * (consumoRacaoPercentPV / 100);
      custoAnimalDiaEfetivo = Math.round(consumoDiarioKg * precoKgRacao * 100) / 100;
    }
    const custoAlimentacao = Math.round(quantidadeAnimais * custoAnimalDiaEfetivo * diasPermanencia);

    // 3. Receita Bruta e Descontos da Venda
    const receitaBruta = Math.round(producaoArrobas * precoProjetadoArroba);
    const bonificacoes = Math.round(producaoArrobas * (bonificacaoArroba || 0));
    const descontos = Math.round(producaoArrobas * (descontoArroba || 0));
    const freteVendaTotal = Math.round(animaisAbatidos * (freteVendaCabeca || 0));
    const comissaoTotal = Math.round(receitaBruta * ((comissaoVendaPercent || 0) / 100));
    const custoImpostosVenda = Math.round(receitaBruta * ((impostoSenarPercent || 0) / 100));
    const receitaLiquida = Math.max(0, receitaBruta + bonificacoes - descontos - freteVendaTotal - comissaoTotal - custoImpostosVenda);

    // 4. Custos da Operação
    // A) Compra de Animais (Gado Magro / Bezerro)
    let custoCompraAnimais = 0;
    if (novasCompras && novasCompras.length > 0) {
      custoCompraAnimais = novasCompras.reduce((sum, item) => {
        return sum + (item.quantidade * item.precoCabeca + item.quantidade * item.freteCabeca + item.quantidade * item.comissaoCabeca);
      }, 0);
    } else if (precoCompraArrobaBoiMagro && precoCompraArrobaBoiMagro > 0) {
      // Cálculo padrão de compra por @ de boi magro: (pesoEntrada / 30) * precoCompraArroba
      const arrobasCompraCabeca = pesoEntradaEfetivo / 30;
      const custoCabecaCompra = arrobasCompraCabeca * precoCompraArrobaBoiMagro;
      custoCompraAnimais = Math.round(quantidadeAnimais * custoCabecaCompra);
    } else if (precoBoiMagro && precoBoiMagro > 0) {
      custoCompraAnimais = Math.round(quantidadeAnimais * precoBoiMagro);
    }

    const custoCompraPorCabeca = quantidadeAnimais > 0 ? Math.round(custoCompraAnimais / quantidadeAnimais) : 0;
    const arrobasEntradaCabeca = pesoEntradaEfetivo / 30;
    const arrobasEntradaTotal = Math.round(quantidadeAnimais * arrobasEntradaCabeca * 10) / 10;
    const custoCompraPorArroba = arrobasEntradaTotal > 0 ? Math.round((custoCompraAnimais / arrobasEntradaTotal) * 100) / 100 : 0;

    // B) Pastagem
    const mesesPeriodo = diasPermanencia / 30;
    const custoManutencaoPasto = areaPastagem * (custoManutencaoPastagemHaAno * (mesesPeriodo / 12));
    const custoReformaPasto = reformaPastagemAreaHa * investimentoReformaHa;
    const custoPastagem = Math.round(custoManutencaoPasto + custoReformaPasto);

    // C) Sanidade & Seguro
    const custoSanitario = Math.round(quantidadeAnimais * (custosSanitariosCabecaAno * (mesesPeriodo / 12)));
    const custoSeguro = Math.round(quantidadeAnimais * (custoSeguroCabeca || 0));

    // D) Mão de Obra e Arrendamento
    const custoArrendamento = Math.round((arrendamentoMensal || 0) * mesesPeriodo);
    const custoMaoDeObra = Math.round((maoDeObraMensal || 0) * mesesPeriodo);
    const custosFixosGerais = Math.round(custosFixosMensais * mesesPeriodo);
    const custosFixosTotal = custosFixosGerais + custoArrendamento + custoMaoDeObra;

    // E) Outros Custos Variáveis
    const custosVariaveisOutros = Math.round(quantidadeAnimais * outrosCustosCabecaMes * mesesPeriodo);

    // F) Custo Financeiro
    const custoFinanceiro = Math.round(financiamentoNecessario * (taxaFinanciamentoAno * (mesesPeriodo / 12)));

    // Custos de Engorda (todos os custos operacionais na fazenda, excluindo a compra do animal)
    const custosVariaveisTotal = custoAlimentacao + custoSanitario + custosVariaveisOutros + custoPastagem + custoSeguro + freteVendaTotal + comissaoTotal + custoImpostosVenda;
    const custoEngorda = custoAlimentacao + custoSanitario + custosFixosTotal + custoPastagem + custoSeguro + freteVendaTotal + comissaoTotal + custoImpostosVenda + custoFinanceiro + custosVariaveisOutros;
    const custoTotal = custoCompraAnimais + custoEngorda;

    // 5. Resultados Econômicos do Produtor
    const lucro = Math.round((receitaLiquida - custoTotal) * 100) / 100;
    const margemLiquida = receitaLiquida > 0 ? Math.round((lucro / receitaLiquida) * 1000) / 10 : 0;
    const custoArroba = producaoArrobas > 0 ? Math.round((custoTotal / producaoArrobas) * 100) / 100 : 0;
    const precoEquilibrio = producaoArrobas > 0 ? Math.round((custoTotal / producaoArrobas) * 100) / 100 : 0;
    const margemSeguranca = precoProjetadoArroba > 0
      ? Math.round(((precoProjetadoArroba - precoEquilibrio) / precoProjetadoArroba) * 1000) / 10
      : 0;

    // Métricas por Cabeça e por Arroba Produzida
    const lucroPorCabeca = animaisAbatidos > 0 ? Math.round((lucro / animaisAbatidos) * 100) / 100 : 0;
    const vendaPorCabeca = animaisAbatidos > 0 ? Math.round((receitaLiquida / animaisAbatidos) * 100) / 100 : 0;
    const custoPorCabeca = animaisAbatidos > 0 ? Math.round((custoTotal / animaisAbatidos) * 100) / 100 : 0;
    const custoArrobaProduzida = totalArrobasProduzidas > 0 ? Math.round((custoEngorda / totalArrobasProduzidas) * 100) / 100 : 0;
    const custoArrobaTotalAbatida = precoEquilibrio;
    const diariaTotalPorCabeca = (quantidadeAnimais > 0 && diasPermanencia > 0)
      ? Math.round((custoEngorda / (quantidadeAnimais * diasPermanencia)) * 100) / 100
      : 0;

    // Lotação em UA/ha (1 UA = 450 kg de peso vivo)
    const areaProdutiva = fazenda.areaProdutiva > 0 ? fazenda.areaProdutiva : (areaPastagem > 0 ? areaPastagem : 1);
    const totalUAs = (quantidadeAnimais * pesoVivoMedio) / 450;
    const lotacaoUAPorHa = areaPastagem > 0 ? Math.round((totalUAs / areaPastagem) * 10) / 10 : 0;
    const lucroHectare = Math.round((lucro / areaProdutiva) * 100) / 100;
    const arrobasHectare = Math.round((producaoArrobas / areaProdutiva) * 10) / 10;
    const roi = custoTotal > 0 ? Math.round((lucro / custoTotal) * 1000) / 10 : 0;

    // 6. Comparativo com a Selic / CDI
    const taxaSelicAnual = taxaJuros > 0 ? taxaJuros : 0.1125;
    const rentabilidadeSelicPeriodo = Math.round((Math.pow(1 + taxaSelicAnual, diasPermanencia / 365) - 1) * 1000) / 10;
    const rentabilidadeBoiPeriodo = roi;
    const relacaoComSelic = rentabilidadeSelicPeriodo > 0
      ? Math.round((rentabilidadeBoiPeriodo / rentabilidadeSelicPeriodo) * 100) / 100
      : 0;
    const rendimentoSelicEquivalente = Math.round(custoTotal * (rentabilidadeSelicPeriodo / 100));
    const diferencaLucroVsSelic = Math.round(lucro - rendimentoSelicEquivalente);

    const comparativoSelic: ComparativoSelic = {
      rentabilidadeBoiPeriodo,
      rentabilidadeSelicPeriodo,
      relacaoComSelic,
      lucroPeriodoBoi: lucro,
      rendimentoSelicEquivalente,
      diferencaLucroVsSelic
    };

    // 7. Projeção de Fluxo de Caixa Mensal
    const numMeses = Math.max(3, Math.min(12, Math.ceil(mesesPeriodo)));
    const fluxoCaixa: FluxoCaixaMes[] = [];
    let saldoAcumulado = variaveis.capitalDisponivel;
    const nomesMeses = ['Mês 1', 'Mês 2', 'Mês 3', 'Mês 4', 'Mês 5', 'Mês 6', 'Mês 7', 'Mês 8', 'Mês 9', 'Mês 10', 'Mês 11', 'Mês 12'];

    const custoFixoMes = custosFixosTotal / numMeses;
    const custoAlimentacaoMes = custoAlimentacao / numMeses;
    const custoSanitarioMes = (custoSanitario + custoSeguro) / numMeses;
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

      // Venda concentrada no último mês
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

    // 8. Sensibilidade (+10% / -10%)
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

    // 9. Score de Risco Composto (0 a 100)
    let scoreRisco = 25;
    if (margemSeguranca < 5) scoreRisco += 30;
    else if (margemSeguranca < 15) scoreRisco += 18;
    else if (margemSeguranca > 25) scoreRisco -= 10;

    // Impacto de necessidade de capital
    if (capitalNecessario > variaveis.capitalDisponivel * 1.5) scoreRisco += 20;
    else if (capitalNecessario > 0) scoreRisco += 10;

    // Impacto de lotação de pastagem
    if (capacidadeSuporteUA > 0 && lotacaoUAPorHa > capacidadeSuporteUA * 1.15) {
      scoreRisco += 20;
    } else if (capacidadeSuporteUA > 0 && lotacaoUAPorHa > capacidadeSuporteUA) {
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
      quantidadeComprada,
      mortalidadeCabecas,
      rebanhoVivoAtual,
      custoCompraPorCabeca,
      custoCompraPorArroba,
      arrobasEntradaTotal,
      producaoArrobas,
      totalArrobasProduzidas,
      totalArrobasAbatidas,
      pesoVivoFinalTotal,
      pesoVivoMedio,
      animaisAbatidos,
      receitaBruta,
      receitaLiquida,
      custoCompraAnimais,
      custoAlimentacao,
      custoSanitario,
      custosFixosTotal,
      custosVariaveisTotal,
      custoPastagem,
      custoArrendamento,
      custoMaoDeObra,
      custoSeguro,
      custoImpostosVenda,
      custoFinanceiro,
      custoTotal,
      diasParaProduzirUmaArroba,
      diariaTotalPorCabeca,
      lucroPorCabeca,
      vendaPorCabeca,
      custoPorCabeca,
      custoArrobaProduzida,
      custoArrobaTotalAbatida,
      lotacaoUAPorHa,
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
      comparativoSelic,
      scoreRisco,
      classificacaoRisco
    };
  }
}
