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

    // 1. Alerta de Ponto de Equilíbrio e Margem de Segurança
    if (resultados.margemSeguranca < 0) {
      alertas.push({
        id: 'alerta-prejuizo',
        tipo: 'critico',
        categoria: 'mercado',
        titulo: 'Operação Projetada com Prejuízo',
        descricao: `O preço projetado da arroba (R$ ${variaveis.precoProjetadoArroba.toFixed(2)}) é inferior ao custo de equilíbrio (R$ ${resultados.precoEquilibrio.toFixed(2)}/@).`,
        impacto: `Prejuízo estimado de R$ ${Math.abs(resultados.lucro).toLocaleString('pt-BR')}.`,
        acaoRecomendada: 'Reduza custos operacionais de alimentação, renegocie preços de compra de animais ou proteja o preço via mercado futuro.'
      });
    } else if (resultados.margemSeguranca < 8) {
      alertas.push({
        id: 'alerta-margem-apertada',
        tipo: 'atencao',
        categoria: 'mercado',
        titulo: 'Margem de Segurança Estreita',
        descricao: `Sua margem de segurança é de apenas ${resultados.margemSeguranca}%. Uma oscilação negativa de ~${Math.floor(resultados.margemSeguranca)}% no preço do boi gordo elimina todo o lucro.`,
        impacto: `Lucro muito sensível a variações de mercado.`,
        acaoRecomendada: 'Considere travar preços via contratos a termo ou opções de venda (Put) para garantir piso mínimo.'
      });
    } else if (resultados.margemSeguranca >= 20) {
      alertas.push({
        id: 'oportunidade-alta-margem',
        tipo: 'oportunidade',
        categoria: 'mercado',
        titulo: 'Excelente Margem de Segurança',
        descricao: `Sua margem de segurança é de ${resultados.margemSeguranca}%, permitindo absorver variações de mercado e manter rentabilidade sólida.`,
        impacto: `Lucro projetado de R$ ${resultados.lucro.toLocaleString('pt-BR')} com ROI de ${resultados.roi}%.`,
        acaoRecomendada: 'Cenário favorável para expansão controlada ou aceleração do giro do rebanho.'
      });
    }

    // 2. Alerta de Fluxo de Caixa e Capital Necessário
    if (resultados.capitalNecessario > 0) {
      alertas.push({
        id: 'alerta-caixa-deficit',
        tipo: resultados.capitalNecessario > variaveis.capitalDisponivel * 1.5 ? 'critico' : 'risco',
        categoria: 'financeiro',
        titulo: `Déficit de Caixa Previsto no ${resultados.mesCriticoCaixa}`,
        descricao: `A operação demandará R$ ${resultados.capitalNecessario.toLocaleString('pt-BR')} além do capital inicial para cobrir custos de insumos e manutenção antes do abate.`,
        impacto: `Necessidade de linha de custeio ou capital de giro no ${resultados.mesCriticoCaixa}.`,
        acaoRecomendada: 'Contrate linha de crédito pecuário pré-aprovada com antecedência para evitar interrupção no fornecimento de ração.'
      });
    }

    // 3. Pastagem e Lotação
    if (variaveis.capacidadeSuporteUA > 0 && variaveis.lotacaoAtualUA > variaveis.capacidadeSuporteUA) {
      const sobrecarga = Math.round(((variaveis.lotacaoAtualUA - variaveis.capacidadeSuporteUA) / variaveis.capacidadeSuporteUA) * 100);
      alertas.push({
        id: 'alerta-pastagem-sobrecarga',
        tipo: sobrecarga > 20 ? 'critico' : 'atencao',
        categoria: 'pastagem',
        titulo: 'Taxa de Lotação Acima da Capacidade de Suporte',
        descricao: `A taxa atual (${variaveis.lotacaoAtualUA} UA/ha) supera em ${sobrecarga}% a capacidade da pastagem (${variaveis.capacidadeSuporteUA} UA/ha).`,
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
    if (variaveis.gmd >= 1.2) {
      alertas.push({
        id: 'oportunidade-alto-gmd',
        tipo: 'oportunidade',
        categoria: 'producao',
        titulo: 'Alto Desempenho Zootécnico (GMD)',
        descricao: `GMD projetado de ${variaveis.gmd} kg/dia proporciona giro rápido da fazenda, reduzindo dias de permanência e diluindo custos fixos.`,
        impacto: `Produção de ${resultados.producaoArrobas.toLocaleString('pt-BR')} arrobas em apenas ${variaveis.diasPermanencia} dias.`,
        acaoRecomendada: 'Mantenha rigoroso controle do trato e pesagens intermediárias a cada 30 dias para confirmar a curva de ganho.'
      });
    }

    // 6. Alerta de Mortalidade
    if (variaveis.mortalidade > 0.02) {
      const perdasCabecas = Math.round(variaveis.quantidadeAnimais * variaveis.mortalidade);
      alertas.push({
        id: 'alerta-mortalidade-elevada',
        tipo: 'atencao',
        categoria: 'sanidade',
        titulo: 'Mortalidade Projetada Elevada',
        descricao: `A taxa de mortalidade de ${(variaveis.mortalidade * 100).toFixed(1)}% representa perda estimada de ${perdasCabecas} animais.`,
        impacto: `Prejuízo direto de aproximadamente R$ ${(perdasCabecas * (variaveis.precoBoiMagro || 3500)).toLocaleString('pt-BR')}.`,
        acaoRecomendada: 'Reforce o protocolo de vacinação na entrada (clostridioses, pneumonia) e ronda diária nos piquetes.'
      });
    }

    // 7. Insight de Custo da Arroba Produzida vs Preço de Venda
    if (resultados.custoArrobaProduzida > 0 && variaveis.precoProjetadoArroba > 0) {
      const margemPorArroba = Math.round(variaveis.precoProjetadoArroba - resultados.custoArrobaProduzida);
      if (margemPorArroba > 80) {
        alertas.push({
          id: 'oportunidade-arroba-barata',
          tipo: 'oportunidade',
          categoria: 'producao',
          titulo: 'Engorda Altamente Eficiente',
          descricao: `Cada @ produzida na fazenda custa R$ ${resultados.custoArrobaProduzida.toFixed(2)}, contra venda a R$ ${variaveis.precoProjetadoArroba.toFixed(2)}/@.`,
          impacto: `Margem operacional de R$ ${margemPorArroba.toFixed(2)} para cada @ colocada nos animais.`,
          acaoRecomendada: 'Excelente conversão alimentar. Avalie reter os animais por mais 15-20 dias caso o ganho continue acima de 1,2 kg/dia.'
        });
      } else if (margemPorArroba < 20) {
        alertas.push({
          id: 'alerta-arroba-cara',
          tipo: 'atencao',
          categoria: 'producao',
          titulo: 'Custo da Arroba Produzida Próximo ao Preço de Venda',
          descricao: `O custo para colocar cada @ na fazenda está em R$ ${resultados.custoArrobaProduzida.toFixed(2)}/@, muito próximo da venda (R$ ${variaveis.precoProjetadoArroba.toFixed(2)}/@).`,
          impacto: 'A engorda gera pouca margem marginal. O lucro depende quase que exclusivamente da compra barata do boi magro.',
          acaoRecomendada: 'Revise a formulação da ração (%PV e custo/kg de insumos) ou o ganho diário (GMD).'
        });
      }
    }

    // 8. Comparativo com a Renda Fixa / Selic
    if (resultados.comparativoSelic) {
      if (resultados.comparativoSelic.relacaoComSelic >= 2.0) {
        alertas.push({
          id: 'oportunidade-supera-selic',
          tipo: 'oportunidade',
          categoria: 'financeiro',
          titulo: `Operação Rende ${resultados.comparativoSelic.relacaoComSelic}x a Taxa Selic`,
          descricao: `Sua operação no boi projeta rentabilidade de ${resultados.comparativoSelic.rentabilidadeBoiPeriodo}% no ciclo, superando amplamente o CDI/Selic (${resultados.comparativoSelic.rentabilidadeSelicPeriodo}%).`,
          impacto: `Ganho adicional de R$ ${resultados.comparativoSelic.diferencaLucroVsSelic.toLocaleString('pt-BR')} comparado ao investimento bancário seguro.`,
          acaoRecomendada: 'Rentabilidade atrativa do capital próprio empregado na atividade pecuária.'
        });
      } else if (resultados.comparativoSelic.relacaoComSelic < 1.0 && resultados.lucro > 0) {
        alertas.push({
          id: 'alerta-abaixo-selic',
          tipo: 'atencao',
          categoria: 'financeiro',
          titulo: 'Rentabilidade do Boi Inferior ao CDI/Selic',
          descricao: `A operação projeta ganho de ${resultados.comparativoSelic.rentabilidadeBoiPeriodo}%, enquanto a aplicação financeira renderia ${resultados.comparativoSelic.rentabilidadeSelicPeriodo}% sem risco agropecuário.`,
          impacto: `Custo de oportunidade do capital: o CDI renderia R$ ${Math.abs(resultados.comparativoSelic.diferencaLucroVsSelic).toLocaleString('pt-BR')} a mais.`,
          acaoRecomendada: 'Otimize custos de compra do boi magro e insumos para elevar o retorno sobre o capital investido.'
        });
      }
    }

    return alertas;
  }
}

