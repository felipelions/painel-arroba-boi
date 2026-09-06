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
  // 1. Mercado
  precoArroba: number;
  precoProjetadoArroba: number;
  precoBezerro: number;
  precoBoiMagro: number;
  precoMilho: number; // sc 60kg
  precoFareloSoja: number; // ton
  dolar: number;
  taxaJuros: number; // ex: 0.1125

  // 2. Produção Animal
  quantidadeAnimais: number;
  pesoMedioAtual: number;
  pesoMedioEntrada: number;
  pesoMedioSaida: number;
  gmd: number; // Ganho médio diário kg/dia
  rendimentoCarcaca: number; // 0.50 a 0.60
  mortalidade: number; // 0 a 0.05
  diasPermanencia: number;
  lotes: LoteAnimal[];

  // 3. Compras
  novasCompras: NovaCompraAnimal[];

  // 4. Vendas
  dataVenda: string;
  bonificacaoArroba: number;
  descontoArroba: number;
  freteVendaCabeca: number;
  comissaoVendaPercent: number;

  // 5. Pastagem
  areaPastagem: number;
  tipoPastagem: string;
  capacidadeSuporteUA: number; // UA/ha
  lotacaoAtualUA: number;
  custoManutencaoPastagemHaAno: number;
  reformaPastagemAreaHa: number;
  investimentoReformaHa: number;

  // 6. Nutrição
  estrategiaNutricional: 'pasto_mineral' | 'proteinado_aguas' | 'proteinado_seca' | 'semi_confinamento' | 'confinamento_total';
  custoAnimalDia: number; // R$/animal/dia

  // 7. Clima
  cenarioClimatico: 'normal' | 'seca_moderada' | 'seca_severa' | 'excesso_chuva';
  impactoPastoPercent: number; // ex: -0.15 para -15%

  // 8. Custos
  custosFixosMensais: number;
  custosSanitariosCabecaAno: number;
  outrosCustosCabecaMes: number;

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

export interface CenarioResultados {
  producaoArrobas: number;
  pesoVivoFinalTotal: number;
  animaisAbatidos: number;
  receitaBruta: number;
  receitaLiquida: number;
  custoCompraAnimais: number;
  custoAlimentacao: number;
  custoSanitario: number;
  custosFixosTotal: number;
  custosVariaveisTotal: number;
  custoPastagem: number;
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

