export interface FazendaConfig {
  id: string;
  nome: string;
  estado: string;
  municipio: string;
  areaTotal: number;
  areaProdutiva: number;
  areaPastagem: number;
  areaAgricola: number;
  areaConfinamento: number;
  modeloProducao: 'ciclo_completo' | 'cria' | 'recria' | 'engorda' | 'confinamento';
  objetivoPrincipal: 'maximizar_lucro' | 'maximizar_retorno_capital' | 'minimizar_risco';
  moeda: 'BRL';
}

export interface LoteAnimal {
  id: string;
  nome: string;
  categoria: 'bezerro' | 'garrote' | 'boi_magro' | 'boi_gordo' | 'novilha' | 'vaca';
  quantidade: number;
  pesoAtual: number;
  pesoEntrada: number;
  pesoObjetivo: number;
  gmd: number;
  rendimentoCarcaca: number; // ex: 0.54 para 54%
  mortalidade: number; // ex: 0.01 para 1%
  dataEntrada: string;
  dataVendaPrevista: string;
}

export interface NovaCompraAnimal {
  id: string;
  quantidade: number;
  categoria: string;
  pesoMedio: number;
  precoCabeca: number;
  freteCabeca: number;
  comissaoCabeca: number;
  dataCompra: string;
}

export interface CenarioVariaveis {
  // 1. Mercado & Cotações
  precoArroba: number;
  precoProjetadoArroba: number;
  precoBezerro: number;
  precoBoiMagro: number; // R$/cabeça
  precoCompraArrobaBoiMagro?: number; // R$/@ de compra (ex: R$ 380/@)
  precoMilho: number; // sc 60kg
  precoFareloSoja: number; // ton
  dolar: number;
  taxaJuros: number; // ex: 0.1125 (Selic anual)

  // 2. Produção Animal & Zootecnia
  quantidadeAnimais: number;
  pesoMedioAtual: number; // Peso de entrada kg
  pesoMedioEntrada: number;
  pesoMedioSaida: number; // Peso final kg
  gmd: number; // Ganho médio diário kg/dia (ex: 1.5)
  rendimentoCarcaca: number; // ex: 0.56 (56%)
  mortalidade: number; // 0 a 0.05 (ex: 0.01)
  diasPermanencia: number; // Período de trato em dias (ex: 100)
  lotes: LoteAnimal[];

  // 3. Nutrição e Ração (Planilha Produtor)
  estrategiaNutricional: 'pasto_mineral' | 'proteinado_aguas' | 'proteinado_seca' | 'semi_confinamento' | 'confinamento_total';
  custoAnimalDia: number; // R$/animal/dia (ex: R$ 13.22)
  consumoRacaoPercentPV?: number; // % do Peso Vivo (ex: 1.80%)
  precoKgRacao?: number; // R$/kg de ração (ex: R$ 1.58)

  // 4. Área da Fazenda (Alqueires vs Hectares)
  tipoMedidaArea?: 'hectares' | 'alqueires';
  areaAlqueires?: number; // ex: 5.0 alqueires
  areaPastagem: number; // hectares (ex: 12.10 ha)
  tipoPastagem: string;
  capacidadeSuporteUA: number; // UA/ha
  lotacaoAtualUA: number;
  custoManutencaoPastagemHaAno: number;
  reformaPastagemAreaHa: number;
  investimentoReformaHa: number;

  // 5. Custos da Operação (Planilha Produtor)
  arrendamentoMensal?: number; // R$/mês (ex: R$ 3.500)
  maoDeObraMensal?: number; // R$/mês (ex: R$ 1.500)
  custosFixosMensais: number; // R$/mês total
  custosSanitariosCabecaAno: number; // R$/cab/ano
  custoSeguroCabeca?: number; // R$/cab (ex: R$ 5.00)
  outrosCustosCabecaMes: number;

  // 6. Compras de Animais
  novasCompras: NovaCompraAnimal[];

  // 7. Venda e Descontos Frigorífico
  dataVenda: string;
  bonificacaoArroba: number;
  descontoArroba: number;
  impostoSenarPercent?: number; // ex: 1.63% (Senar/Funrural)
  freteVendaCabeca: number; // R$/cab (ex: R$ 20.00)
  comissaoVendaPercent: number; // % comissão venda (ex: 1.0%)

  // 8. Clima
  cenarioClimatico: 'normal' | 'seca_moderada' | 'seca_severa' | 'excesso_chuva';
  impactoPastoPercent: number;

  // 9. Financeiro
  capitalDisponivel: number;
  financiamentoNecessario: number;
  taxaFinanciamentoAno: number;
}

export interface FluxoCaixaMes {
  mes: string;
  receitas: number;
  custos: number;
  saldoMensal: number;
  saldoAcumulado: number;
}

export interface SensibilidadeItem {
  fator: string;
  impactoMais10: number;
  impactoMenos10: number;
  diferenca: number;
}

export interface ComparativoSelic {
  rentabilidadeBoiPeriodo: number; // % no período (ex: 9.9%)
  rentabilidadeSelicPeriodo: number; // % no período (ex: 3.4%)
  relacaoComSelic: number; // ex: 2.91x
  lucroPeriodoBoi: number; // R$
  rendimentoSelicEquivalente: number; // R$
  diferencaLucroVsSelic: number; // R$ a mais no boi
}

export interface CenarioResultados {
  // Rebanho & Compras
  quantidadeComprada: number;
  mortalidadeCabecas: number;
  rebanhoVivoAtual: number;
  custoCompraPorCabeca: number;
  custoCompraPorArroba: number;
  arrobasEntradaTotal: number;

  producaoArrobas: number;
  totalArrobasProduzidas: number; // arrobas ganhas na fazenda
  totalArrobasAbatidas: number; // arrobas totais levadas ao frigorífico
  pesoVivoFinalTotal: number;
  pesoVivoMedio: number; // (entrada + saída) / 2
  animaisAbatidos: number;
  diasParaProduzirUmaArroba: number; // ex: 20 dias
  diariaTotalPorCabeca: number; // R$/cab/dia total (ex: R$ 16.43)
  
  // Métricas por Cabeça (Planilha)
  lucroPorCabeca: number; // ex: R$ 683,22
  vendaPorCabeca: number; // ex: R$ 7.560,00
  custoPorCabeca: number; // ex: R$ 6.876,78
  custoArrobaProduzida: number; // R$/@ engordada na fazenda (ex: R$ 229,52)
  custoArrobaTotalAbatida: number; // R$/@ total abatida (ex: R$ 338,98)
  lotacaoUAPorHa: number; // UA/ha calculado (ex: 3.1)

  // Totais
  receitaBruta: number;
  receitaLiquida: number;
  custoCompraAnimais: number;
  custoAlimentacao: number;
  custoSanitario: number;
  custosFixosTotal: number;
  custosVariaveisTotal: number;
  custoPastagem: number;
  custoArrendamento: number;
  custoMaoDeObra: number;
  custoSeguro: number;
  custoImpostosVenda: number;
  custoFinanceiro: number;
  custoTotal: number;
  lucro: number;
  margemLiquida: number; // porcentagem (ex: 26.5)
  custoArroba: number;
  precoEquilibrio: number;
  margemSeguranca: number; // porcentagem (ex: 12.4)
  lucroHectare: number;
  arrobasHectare: number;
  roi: number; // porcentagem (ex: 22.8)
  capitalNecessario: number;
  mesCriticoCaixa: string;
  fluxoCaixa: FluxoCaixaMes[];
  sensibilidade: SensibilidadeItem[];
  comparativoSelic: ComparativoSelic;
  scoreRisco: number; // 0 a 100
  classificacaoRisco: 'baixo' | 'moderado' | 'elevado' | 'critico';
}

export interface AlertaInsight {
  id: string;
  tipo: 'informacao' | 'oportunidade' | 'atencao' | 'risco' | 'critico';
  titulo: string;
  descricao: string;
  impacto: string;
  categoria: 'mercado' | 'producao' | 'pastagem' | 'financeiro' | 'sanidade' | 'geral';
  acaoRecomendada?: string;
}

export interface CenarioCompleto {
  id: string;
  nome: string;
  descricao: string;
  isBase?: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
  fazenda: FazendaConfig;
  periodo: {
    inicio: string;
    fim: string;
  };
  variaveis: CenarioVariaveis;
  resultados: CenarioResultados;
  alertas: AlertaInsight[];
  schemaVersion: string;
}

export interface HistoricoAlteracao {
  data: string;
  cenarioId: string;
  campoAlterado: string;
  valorAnterior: any;
  valorNovo: any;
  lucroAnterior: number;
  lucroNovo: number;
}
