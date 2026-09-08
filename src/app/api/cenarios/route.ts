import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const LOCAL_DATA_FILE = path.join(process.cwd(), 'data', 'cenarios.json');
const TMP_DATA_FILE = path.join('/tmp', 'cenarios.json');

// Cenário inicial garantido para contingência caso o filesystem esteja vazio ou inacessível no servidor serverless
const DEFAULT_SCENARIOS = [
  {
    id: "cenario_001",
    nome: "Cenário Base - Planejamento 2027",
    descricao: "Planejamento padrão da operação de recria e terminação em pasto com suplementação e semiconfinamento.",
    isBase: true,
    schemaVersion: "1.0.0",
    dataCriacao: "2026-09-05T20:00:00.000Z",
    dataAtualizacao: "2026-09-05T20:00:00.000Z",
    fazenda: {
      id: "fazenda_001",
      nome: "Fazenda Boa Esperança",
      estado: "SP",
      municipio: "Sorocaba",
      areaTotal: 1200,
      areaProdutiva: 950,
      areaPastagem: 800,
      areaAgricola: 100,
      areaConfinamento: 50,
      modeloProducao: "ciclo_completo",
      objetivoPrincipal: "maximizar_lucro",
      moeda: "BRL"
    },
    periodo: {
      inicio: "2026-09",
      fim: "2027-09"
    },
    variaveis: {
      precoArroba: 310,
      precoProjetadoArroba: 322,
      precoBezerro: 2400,
      precoBoiMagro: 3800,
      precoCompraArrobaBoiMagro: 380,
      precoMilho: 65,
      precoFareloSoja: 1800,
      dolar: 5.60,
      taxaJuros: 0.1125,
      quantidadeAnimais: 500,
      pesoMedioAtual: 410,
      pesoMedioEntrada: 360,
      pesoMedioSaida: 540,
      gmd: 1.10,
      rendimentoCarcaca: 0.54,
      mortalidade: 0.01,
      diasPermanencia: 120,
      lotes: [],
      novasCompras: [],
      dataVenda: "2026-12-30",
      bonificacaoArroba: 3.5,
      descontoArroba: 1.5,
      impostoSenarPercent: 1.63,
      freteVendaCabeca: 35,
      comissaoVendaPercent: 1.0,
      tipoMedidaArea: "hectares",
      areaPastagem: 800,
      tipoPastagem: "Brachiaria Brizantha",
      capacidadeSuporteUA: 1.3,
      lotacaoAtualUA: 1.1,
      custoManutencaoPastagemHaAno: 180,
      reformaPastagemAreaHa: 50,
      investimentoReformaHa: 1200,
      estrategiaNutricional: "semi_confinamento",
      custoAnimalDia: 6.80,
      consumoRacaoPercentPV: 1.80,
      precoKgRacao: 1.58,
      arrendamentoMensal: 3500,
      maoDeObraMensal: 1500,
      custoSeguroCabeca: 5.0,
      cenarioClimatico: "normal",
      impactoPastoPercent: 0,
      custosFixosMensais: 22000,
      custosSanitariosCabecaAno: 65,
      outrosCustosCabecaMes: 12,
      capitalDisponivel: 600000,
      financiamentoNecessario: 0,
      taxaFinanciamentoAno: 0.115
    },
    resultados: {
      producaoArrobas: 9622.8,
      totalArrobasProduzidas: 3240,
      totalArrobasAbatidas: 9622.8,
      pesoVivoFinalTotal: 267300,
      pesoVivoMedio: 450,
      animaisAbatidos: 495,
      receitaBruta: 3098542,
      receitaLiquida: 3069150,
      custoCompraAnimais: 1900000,
      custoAlimentacao: 408000,
      custoSanitario: 10833,
      custosFixosTotal: 108000,
      custosVariaveisTotal: 560000,
      custoPastagem: 108000,
      custoArrendamento: 14000,
      custoMaoDeObra: 6000,
      custoSeguro: 2475,
      custoImpostosVenda: 50506,
      custoFinanceiro: 0,
      custoTotal: 2556000,
      diasParaProduzirUmaArroba: 25.3,
      diariaTotalPorCabeca: 10.93,
      lucroPorCabeca: 1036.67,
      vendaPorCabeca: 6200.30,
      custoPorCabeca: 5163.64,
      custoArrobaProduzida: 202.47,
      custoArrobaTotalAbatida: 265.62,
      lotacaoUAPorHa: 0.6,
      lucro: 513150,
      margemLiquida: 16.7,
      custoArroba: 265.62,
      precoEquilibrio: 265.62,
      margemSeguranca: 17.5,
      lucroHectare: 540.16,
      arrobasHectare: 10.1,
      roi: 20.1,
      capitalNecessario: 0,
      mesCriticoCaixa: "Nenhum déficit",
      fluxoCaixa: [
        { mes: "Mês 1", receitas: 0, custos: 2040000, saldoMensal: -2040000, saldoAcumulado: -1440000 },
        { mes: "Mês 2", receitas: 0, custos: 172000, saldoMensal: -172000, saldoAcumulado: -1612000 },
        { mes: "Mês 3", receitas: 0, custos: 172000, saldoMensal: -172000, saldoAcumulado: -1784000 },
        { mes: "Mês 4", receitas: 3069150, custos: 172000, saldoMensal: 2897150, saldoAcumulado: 1113150 }
      ],
      sensibilidade: [
        { fator: "Preço da Arroba (@)", impactoMais10: 309854, impactoMenos10: -309854, diferenca: 619708 },
        { fator: "Ganho Médio Diário (GMD)", impactoMais10: 84120, impactoMenos10: -84120, diferenca: 168240 },
        { fator: "Custo Alimentar (R$/dia)", impactoMais10: -40800, impactoMenos10: 40800, diferenca: 81600 },
        { fator: "Custos Fixos Mensais", impactoMais10: -8800, impactoMenos10: 8800, diferenca: 17600 }
      ],
      comparativoSelic: {
        rentabilidadeBoiPeriodo: 20.1,
        rentabilidadeSelicPeriodo: 3.6,
        relacaoComSelic: 5.58,
        lucroPeriodoBoi: 513150,
        rendimentoSelicEquivalente: 92016,
        diferencaLucroVsSelic: 421134
      },
      scoreRisco: 22,
      classificacaoRisco: "baixo"
    },
    alertas: [
      {
        id: "oportunidade-alta-margem",
        tipo: "oportunidade",
        categoria: "mercado",
        titulo: "Margem de Segurança Saudável",
        descricao: "Sua margem de segurança é de 17.5%, cobrindo flutuações usuais do mercado físico da arroba.",
        impacto: "Lucro projetado de R$ 513.150.",
        acaoRecomendada: "Acompanhe as cotações diárias na aba Mercado."
      }
    ]
  }
];

// Cache em memória para o ciclo de vida do servidor/lambda
let memoryCache: any[] | null = null;

async function getScenariosFromFile(): Promise<any[]> {
  if (memoryCache && memoryCache.length > 0) {
    return memoryCache;
  }

  // 1. Tenta ler de /tmp (se foi salvo anteriormente no serverless da Vercel)
  try {
    const tmpContent = await fs.readFile(TMP_DATA_FILE, 'utf-8');
    const parsed = JSON.parse(tmpContent);
    if (Array.isArray(parsed) && parsed.length > 0) {
      memoryCache = parsed;
      return parsed;
    }
  } catch {
    // continua para tentar o arquivo local
  }

  // 2. Tenta ler de process.cwd()/data/cenarios.json (ambiente local)
  try {
    const content = await fs.readFile(LOCAL_DATA_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) {
      memoryCache = parsed;
      return parsed;
    }
  } catch {
    // continua para fallback padrão
  }

  // 3. Fallback garantido
  memoryCache = DEFAULT_SCENARIOS;
  return DEFAULT_SCENARIOS;
}

async function saveScenariosToFile(scenarios: any[]): Promise<boolean> {
  memoryCache = scenarios;

  // Tenta salvar no arquivo local (funciona em desenvolvimento local)
  try {
    const localDir = path.dirname(LOCAL_DATA_FILE);
    await fs.mkdir(localDir, { recursive: true });
    await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(scenarios, null, 2), 'utf-8');
    return true;
  } catch {
    // Em produção serverless (Vercel), o diretório raiz é somente-leitura (EROFS).
    // Salvamos em /tmp que é gravável no ambiente de execução.
    try {
      await fs.writeFile(TMP_DATA_FILE, JSON.stringify(scenarios, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.warn('Persistido apenas em memória na instância serverless:', e);
      return true;
    }
  }
}

export async function GET() {
  const scenarios = await getScenariosFromFile();
  return NextResponse.json(scenarios, {
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const newScenario = await req.json();
    if (!newScenario || !newScenario.id) {
      return NextResponse.json({ error: 'Cenário inválido' }, { status: 400 });
    }

    const scenarios = await getScenariosFromFile();
    const index = scenarios.findIndex((s: any) => s.id === newScenario.id);

    if (index >= 0) {
      scenarios[index] = newScenario;
    } else {
      scenarios.push(newScenario);
    }

    await saveScenariosToFile(scenarios);
    return NextResponse.json({ success: true, scenario: newScenario });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao processar' }, { status: 500 });
  }
}
