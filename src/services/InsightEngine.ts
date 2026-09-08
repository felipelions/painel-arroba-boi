import { CenarioVariaveis, CenarioResultados, AlertaInsight, FazendaConfig } from '../types/simulation';

export class InsightEngine {
  /**
   * Avalia os resultados da simulação e gera alertas e insights determinísticos acionáveis.
   */
  public static generateInsights(
    variaveis: CenarioVariaveis,
    resultados: CenarioResultados,
    fazenda: FazendaConfig
  ): AlertaInsight[] {
    const alertas: AlertaInsight[] = [];
    if (!resultados || !variaveis) return alertas;

    const precoProjetado = variaveis.precoProjetadoArroba ?? 0;
    const precoEquilibrio = resultados.precoEquilibrio ?? 0;
    const margemSeguranca = resultados.margemSeguranca ?? 0;
    const lucro = resultados.lucro ?? 0;
    const capitalNecessario = resultados.capitalNecessario ?? 0;
    const producaoArrobas = resultados.producaoArrobas ?? 0;
    const custoArrobaProduzida = resultados.custoArrobaProduzida ?? 0;

    // 1. Alerta de Ponto de Equilíbrio e Margem de Segurança
    if (margemSeguranca < 0) {
      alertas.push({
        id: 'alerta-prejuizo',
        tipo: 'critico',
        categoria: 'mercado',
        titulo: 'Operação Projetada com Prejuízo',
        descricao: `O preço projetado da arroba (R$ ${precoProjetado.toFixed(2)}) é inferior ao custo de equilíbrio (R$ ${precoEquilibrio.toFixed(2)}/@).`,
        impacto: `Prejuízo estimado de R$ ${Math.abs(lucro).toLocaleString('pt-BR')}.`,
        acaoRecomendada: 'Reduza custos operacionais de alimentação, renegocie preços de compra de animais ou proteja o preço via mercado futuro.'
      });
    } else if (margemSeguranca < 8) {
      alertas.push({
        id: 'alerta-margem-apertada',
        tipo: 'atencao',
        categoria: 'mercado',
        titulo: 'Margem de Segurança Estreita',
        descricao: `Sua margem de segurança é de apenas ${margemSeguranca}%. Uma oscilação negativa de ~${Math.floor(margemSeguranca)}% no preço do boi gordo elimina todo o lucro.`,
        impacto: `Lucro muito sensível a variações de mercado.`,
        acaoRecomendada: 'Considere travar preços via contratos a termo ou opções de venda (Put) para garantir piso mínimo.'
      });
    } else if (margemSeguranca >= 20) {
      alertas.push({
        id: 'oportunidade-alta-margem',
        tipo: 'oportunidade',
        categoria: 'mercado',
        titulo: 'Excelente Margem de Segurança',
        descricao: `Sua margem de segurança é de ${margemSeguranca}%, permitindo absorver variações de mercado e manter rentabilidade sólida.`,
        impacto: `Lucro projetado de R$ ${lucro.toLocaleString('pt-BR')} com ROI de ${resultados.roi ?? 0}%.`,
        acaoRecomendada: 'Cenário favorável para expansão controlada ou aceleração do giro do rebanho.'
      });
    }

    // 2. Alerta de Fluxo de Caixa e Capital Necessário
    if (capitalNecessario > 0) {
      alertas.push({
        id: 'alerta-caixa-deficit',
        tipo: capitalNecessario > (variaveis.capitalDisponivel ?? 0) * 1.5 ? 'critico' : 'risco',
        categoria: 'financeiro',
        titulo: `Déficit de Caixa Previsto no ${resultados.mesCriticoCaixa || 'período'}`,
        descricao: `A operação demandará R$ ${capitalNecessario.toLocaleString('pt-BR')} além do capital inicial para cobrir custos de insumos e manutenção antes do abate.`,
        impacto: `Necessidade de linha de custeio ou capital de giro no ${resultados.mesCriticoCaixa || 'período'}.`,
        acaoRecomendada: 'Contrate linha de crédito pecuário pré-aprovada com antecedência para evitar interrupção no fornecimento de ração.'
      });
    }

    // 3. Pastagem e Lotação
    const capUA = variaveis.capacidadeSuporteUA ?? 0;
    const lotUA = variaveis.lotacaoAtualUA ?? 0;
    if (capUA > 0 && lotUA > capUA) {
      const sobrecarga = Math.round(((lotUA - capUA) / capUA) * 100);
      alertas.push({
        id: 'alerta-pastagem-sobrecarga',
        tipo: sobrecarga > 20 ? 'critico' : 'atencao',
        categoria: 'pastagem',
        titulo: 'Taxa de Lotação Acima da Capacidade de Suporte',
        descricao: `A taxa atual (${lotUA} UA/ha) supera em ${sobrecarga}% a capacidade da pastagem (${capUA} UA/ha).`,
        impacto: 'Risco de degradação das pastagens, perda de GMD e necessidade de suplementação emergencial.',
        acaoRecomendada: 'Avalie reforma de piquetes, adubação estratégica ou transferência de parte do lote para semiconfinamento.'
      });
    }

    // 4. Clima
    if (variaveis.cenarioClimatico === 'seca_severa') {
      alertas.push({
        id: 'alerta-seca-severa',
        tipo: 'risco',
        categoria: 'producao',
        titulo: 'Cenário Climático: Seca Severa Ativado',
        descricao: 'A menor oferta de massa de forragem exige aporte extra de volumoso ou concentrado para manter o GMD estipulado.',
        impacto: 'Custo nutricional pode subir entre 15% e 25% para evitar queda de peso.',
        acaoRecomendada: 'Forme estoque estratégico de silagem/feno e planeje vendas escalonadas dos animais mais pesados.'
      });
    }

    // 5. Oportunidade de Ganho de Peso / GMD
    const gmd = variaveis.gmd ?? 0;
    if (gmd >= 1.2) {
      alertas.push({
        id: 'oportunidade-alto-gmd',
        tipo: 'oportunidade',
        categoria: 'producao',
        titulo: 'Alto Desempenho Zootécnico (GMD)',
        descricao: `GMD projetado de ${gmd} kg/dia proporciona giro rápido da fazenda, reduzindo dias de permanência e diluindo custos fixos.`,
        impacto: `Produção de ${producaoArrobas.toLocaleString('pt-BR')} arrobas em apenas ${variaveis.diasPermanencia ?? 0} dias.`,
        acaoRecomendada: 'Mantenha rigoroso controle do trato e pesagens intermediárias a cada 30 dias para confirmar a curva de ganho.'
      });
    }

    // 6. Alerta de Mortalidade
    const mort = variaveis.mortalidade ?? 0;
    if (mort > 0.02) {
      const perdasCabecas = Math.round((variaveis.quantidadeAnimais ?? 0) * mort);
      alertas.push({
        id: 'alerta-mortalidade-elevada',
        tipo: 'atencao',
        categoria: 'sanidade',
        titulo: 'Mortalidade Projetada Elevada',
        descricao: `A taxa de mortalidade de ${(mort * 100).toFixed(1)}% representa perda estimada de ${perdasCabecas} animais.`,
        impacto: `Prejuízo direto de aproximadamente R$ ${(perdasCabecas * (variaveis.precoBoiMagro || 3500)).toLocaleString('pt-BR')}.`,
        acaoRecomendada: 'Reforce o protocolo de vacinação na entrada (clostridioses, pneumonia) e ronda diária nos piquetes.'
      });
    }

    // 7. Insight de Custo da Arroba Produzida vs Preço de Venda
    if (custoArrobaProduzida > 0 && precoProjetado > 0) {
      const margemPorArroba = Math.round(precoProjetado - custoArrobaProduzida);
      if (margemPorArroba > 80) {
        alertas.push({
          id: 'oportunidade-arroba-barata',
          tipo: 'oportunidade',
          categoria: 'producao',
          titulo: 'Engorda Altamente Eficiente',
          descricao: `Cada @ produzida na fazenda custa R$ ${custoArrobaProduzida.toFixed(2)}, contra venda a R$ ${precoProjetado.toFixed(2)}/@.`,
          impacto: `Margem operacional de R$ ${margemPorArroba.toFixed(2)} para cada @ colocada nos animais.`,
          acaoRecomendada: 'Excelente conversão alimentar. Avalie reter os animais por mais 15-20 dias caso o ganho continue acima de 1,2 kg/dia.'
        });
      } else if (margemPorArroba < 20) {
        alertas.push({
          id: 'alerta-arroba-cara',
          tipo: 'atencao',
          categoria: 'producao',
          titulo: 'Custo da Arroba Produzida Próximo ao Preço de Venda',
          descricao: `O custo para colocar cada @ na fazenda está em R$ ${custoArrobaProduzida.toFixed(2)}/@, muito próximo da venda (R$ ${precoProjetado.toFixed(2)}/@).`,
          impacto: 'A engorda gera pouca margem marginal. O lucro depende quase que exclusivamente da compra barata do boi magro.',
          acaoRecomendada: 'Revise a formulação da ração (%PV e custo/kg de insumos) ou o ganho diário (GMD).'
        });
      }
    }

    // 8. Comparativo com a Renda Fixa / Selic
    if (resultados.comparativoSelic) {
      const selicComp = resultados.comparativoSelic;
      if ((selicComp.relacaoComSelic ?? 0) >= 2.0) {
        alertas.push({
          id: 'oportunidade-supera-selic',
          tipo: 'oportunidade',
          categoria: 'financeiro',
          titulo: `Operação Rende ${selicComp.relacaoComSelic}x a Taxa Selic`,
          descricao: `Sua operação no boi projeta rentabilidade de ${selicComp.rentabilidadeBoiPeriodo}% no ciclo, superando amplamente o CDI/Selic (${selicComp.rentabilidadeSelicPeriodo}%).`,
          impacto: `Ganho adicional de R$ ${(selicComp.diferencaLucroVsSelic ?? 0).toLocaleString('pt-BR')} comparado ao investimento bancário seguro.`,
          acaoRecomendada: 'Rentabilidade atrativa do capital próprio empregado na atividade pecuária.'
        });
      } else if ((selicComp.relacaoComSelic ?? 0) < 1.0 && lucro > 0) {
        alertas.push({
          id: 'alerta-abaixo-selic',
          tipo: 'atencao',
          categoria: 'financeiro',
          titulo: 'Rentabilidade do Boi Inferior ao CDI/Selic',
          descricao: `A operação projeta ganho de ${selicComp.rentabilidadeBoiPeriodo}%, enquanto a aplicação financeira renderia ${selicComp.rentabilidadeSelicPeriodo}% sem risco agropecuário.`,
          impacto: `Custo de oportunidade do capital: o CDI renderia R$ ${Math.abs(selicComp.diferencaLucroVsSelic ?? 0).toLocaleString('pt-BR')} a mais.`,
          acaoRecomendada: 'Otimize custos de compra do boi magro e insumos para elevar o retorno sobre o capital investido.'
        });
      }
    }

    return alertas;
  }
}
