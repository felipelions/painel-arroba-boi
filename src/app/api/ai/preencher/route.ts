import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Por favor, informe a descrição ou resumo do cenário.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    // Se a chave não estiver configurada, utilizar motor zootécnico inteligente com base nas palavras-chave do texto
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('sua-chave-aqui')) {
      const mockResult = generateIntelligentFallback(prompt);
      return NextResponse.json({
        success: true,
        source: 'simulated_ai',
        warning: 'OPENAI_API_KEY não configurada no .env.local. Usando interpretação zootécnica inteligente local.',
        data: mockResult
      });
    }

    const systemPrompt = `Você é um agrônomo e consultor zootécnico sênior especializado em pecuária de corte brasileira.
O usuário fornecerá um resumo em linguagem natural com planos para sua fazenda de gado.
Sua missão é extrair ou inferir com alta precisão técnica os parâmetros para alimentar o simulador da fazenda.
Retorne SEMPRE e EXCLUSIVAMENTE um objeto JSON válido contendo exatamente esta estrutura:
{
  "nomeCenario": "Nome curto descritivo (ex: Confinamento 300 Bois 90d)",
  "descricao": "Resumo objetivo da estratégia",
  "fazenda": {
    "nome": "Nome da fazenda citado ou 'Fazenda Boa Esperança'",
    "estado": "SP",
    "municipio": "Sorocaba",
    "areaTotal": 1200,
    "areaProdutiva": 950,
    "areaPastagem": 800
  },
  "variaveis": {
    "precoArroba": 310,
    "precoProjetadoArroba": 322,
    "precoBezerro": 2400,
    "precoBoiMagro": 3800,
    "precoCompraArrobaBoiMagro": 380,
    "precoMilho": 65,
    "precoFareloSoja": 1800,
    "dolar": 5.60,
    "taxaJuros": 0.1125,
    "quantidadeAnimais": 300,
    "pesoMedioAtual": 400,
    "pesoMedioEntrada": 360,
    "pesoMedioSaida": 540,
    "gmd": 1.25,
    "rendimentoCarcaca": 0.54,
    "mortalidade": 0.01,
    "diasPermanencia": 90,
    "bonificacaoArroba": 3.0,
    "descontoArroba": 1.5,
    "freteVendaCabeca": 35,
    "comissaoVendaPercent": 1.0,
    "impostoSenarPercent": 1.63,
    "tipoMedidaArea": "hectares",
    "areaPastagem": 800,
    "tipoPastagem": "Brachiaria Brizantha",
    "capacidadeSuporteUA": 1.3,
    "lotacaoAtualUA": 1.1,
    "custoManutencaoPastagemHaAno": 180,
    "reformaPastagemAreaHa": 0,
    "investimentoReformaHa": 1200,
    "estrategiaNutricional": "confinamento_total",
    "custoAnimalDia": 9.50,
    "consumoRacaoPercentPV": 1.80,
    "precoKgRacao": 1.58,
    "arrendamentoMensal": 0,
    "maoDeObraMensal": 1500,
    "custoSeguroCabeca": 5.0,
    "cenarioClimatico": "normal",
    "impactoPastoPercent": 0,
    "custosFixosMensais": 20000,
    "custosSanitariosCabecaAno": 65,
    "outrosCustosCabecaMes": 12,
    "capitalDisponivel": 500000,
    "financiamentoNecessario": 0,
    "taxaFinanciamentoAno": 0.115
  }
}
IMPORTANTE:
- Converta valores numéricos para number (nunca strings).
- Se o usuário mencionar consumo de ração em % do PV (peso vivo) ou preço/kg de ração, preencha 'consumoRacaoPercentPV' e 'precoKgRacao'.
- Se o usuário citar preço de compra do boi magro por arroba (ex: 380/@), preencha 'precoCompraArrobaBoiMagro'.
- Se citar arrendamento (aluguel de pasto) ou mão de obra mensal, preencha 'arrendamentoMensal' e 'maoDeObraMensal'.
- Para valores ausentes no texto do usuário, aplique os melhores padrões agronômicos coerentes com a estratégia descrita (confinamento, pasto, recria, etc.).`;

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: model.trim(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      console.error('Erro na API da OpenAI:', errorText);
      // Fallback em caso de erro da chave ou quota excedida
      const fallback = generateIntelligentFallback(prompt);
      return NextResponse.json({
        success: true,
        source: 'simulated_ai_fallback',
        warning: `Erro na OpenAI (${openAiResponse.status}): usando fallback zootécnico inteligente.`,
        data: fallback
      });
    }

    const openAiData = await openAiResponse.json();
    const content = openAiData.choices?.[0]?.message?.content;
    const parsedData = JSON.parse(content);

    return NextResponse.json({
      success: true,
      source: 'openai',
      modelUsed: model,
      data: parsedData
    });
  } catch (error: any) {
    console.error('Erro no processamento da IA:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao processar resumo com IA.' },
      { status: 500 }
    );
  }
}

/**
 * Parser inteligente de contingência que detecta números, raças, estratégias e custos
 * caso a chave da OpenAI não esteja configurada ou a rede falhe.
 */
function generateIntelligentFallback(prompt: string) {
  const p = prompt.toLowerCase();

  // 1. Extração de quantidade de animais
  let quantidade = 300;
  const matchCabecas = p.match(/(\d+)\s*(bois|cabeças|cab|animais|garrotes|bezerros|novilhas)/i);
  if (matchCabecas && matchCabecas[1]) {
    quantidade = parseInt(matchCabecas[1], 10);
  }

  // 2. Peso médio atual e saída
  let pesoAtual = 400;
  let pesoSaida = 540;
  const matchPeso = p.match(/(\d{3})\s*kg/i);
  if (matchPeso && matchPeso[1]) {
    pesoAtual = parseInt(matchPeso[1], 10);
  }

  // 3. Dias de permanência
  let dias = 90;
  const matchDias = p.match(/(\d+)\s*(dias|dia|meses|mes)/i);
  if (matchDias && matchDias[1]) {
    const num = parseInt(matchDias[1], 10);
    dias = matchDias[2].startsWith('m') ? num * 30 : num;
  }

  // 4. Preço da arroba
  let precoArroba = 325;
  const matchArroba = p.match(/(r\$|\$)?\s*(\d{2,3}(?:[.,]\d{1,2})?)\s*(reais|\/|por|\@|arroba)/i);
  if (matchArroba && matchArroba[2]) {
    precoArroba = parseFloat(matchArroba[2].replace(',', '.'));
  }

  // 5. GMD (ganho médio diário)
  let gmd = 1.25;
  const matchGMD = p.match(/gmd\s*(?:de)?\s*(\d+(?:[.,]\d+)?)/i) || p.match(/ganho\s*(?:de)?\s*(\d+(?:[.,]\d+)?)\s*kg/i);
  if (matchGMD && matchGMD[1]) {
    gmd = parseFloat(matchGMD[1].replace(',', '.'));
  } else if (p.includes('pasto') && !p.includes('confin')) {
    gmd = 0.75;
  } else if (p.includes('semi')) {
    gmd = 1.05;
  }

  // 6. Estratégia nutricional e custo diário
  // 6. Estratégia nutricional, %PV e custo diário
  let estrategia: 'pasto_mineral' | 'proteinado_aguas' | 'proteinado_seca' | 'semi_confinamento' | 'confinamento_total' = 'confinamento_total';
  let custoDia = 9.80;
  let consumoRacaoPercentPV = 1.80;
  let precoKgRacao = 1.58;

  if (p.includes('semi')) {
    estrategia = 'semi_confinamento';
    custoDia = 6.20;
    consumoRacaoPercentPV = 1.20;
    precoKgRacao = 1.45;
  } else if (p.includes('proteinado') || p.includes('suplement')) {
    estrategia = 'proteinado_seca';
    custoDia = 4.80;
    consumoRacaoPercentPV = 0.50;
    precoKgRacao = 2.20;
  } else if (p.includes('pasto') || p.includes('mineral')) {
    estrategia = 'pasto_mineral';
    custoDia = 2.40;
    consumoRacaoPercentPV = 0.10;
    precoKgRacao = 3.50;
  }

  // Extração de %PV (ex: 1.8% PV ou 1,8% do peso)
  const matchPV = p.match(/(\d+(?:[.,]\d+)?)\s*%\s*(?:do\s*)?(?:pv|peso\s*vivo)/i);
  if (matchPV && matchPV[1]) {
    consumoRacaoPercentPV = parseFloat(matchPV[1].replace(',', '.'));
  }

  // Preço do kg de ração (ex: 1.58 por kg, 1,58/kg de racao)
  const matchPrecoRacao = p.match(/(\d+(?:[.,]\d+)?)\s*(?:reais|r\$)?\s*(?:\/|por)\s*kg(?:\s*(?:de\s*)?ra[çc][aã]o)?/i);
  if (matchPrecoRacao && matchPrecoRacao[1]) {
    precoKgRacao = parseFloat(matchPrecoRacao[1].replace(',', '.'));
  }

  const matchCustoDia = p.match(/(\d+(?:[.,]\d+)?)\s*(?:reais|r\$)?\s*(?:\/|por)\s*(?:cab|dia|boi|animal)/i);
  if (matchCustoDia && matchCustoDia[1]) {
    custoDia = parseFloat(matchCustoDia[1].replace(',', '.'));
  }

  // 7. Clima
  // 7. Preço de compra do boi magro por @ (ex: 380/@, 380 a arroba magra)
  let precoCompraArrobaBoiMagro = 380;
  const matchCompraMagro = p.match(/(\d{3})\s*(?:reais|r\$)?\s*(?:\/|por|\@)\s*(?:de\s*)?(?:boi\s*magro|magro|compra)/i)
    || p.match(/compra(?:r)?\s*(?:a|por)?\s*(\d{3})\s*(?:\/|por|\@)/i);
  if (matchCompraMagro && matchCompraMagro[1]) {
    precoCompraArrobaBoiMagro = parseFloat(matchCompraMagro[1].replace(',', '.'));
  }

  // 8. Custos operacionais (Arrendamento, Mão de Obra)
  let arrendamento = 0;
  const matchArrendamento = p.match(/arrendamento\s*(?:de)?\s*(?:r\$)?\s*(\d+(?:[.,]\d+)?)/i);
  if (matchArrendamento && matchArrendamento[1]) {
    arrendamento = parseFloat(matchArrendamento[1].replace('.', '').replace(',', '.'));
  }

  let maoDeObra = 1500;
  const matchMaoDeObra = p.match(/m[aã]o\s*de\s*obra\s*(?:de)?\s*(?:r\$)?\s*(\d+(?:[.,]\d+)?)/i);
  if (matchMaoDeObra && matchMaoDeObra[1]) {
    maoDeObra = parseFloat(matchMaoDeObra[1].replace('.', '').replace(',', '.'));
  }

  // 9. Clima
  let cenarioClima: 'normal' | 'seca_moderada' | 'seca_severa' | 'excesso_chuva' = 'normal';
  if (p.includes('seca severa') || p.includes('estiagem severa')) {
    cenarioClima = 'seca_severa';
  } else if (p.includes('seca') || p.includes('estiagem')) {
    cenarioClima = 'seca_moderada';
  } else if (p.includes('chuva')) {
    cenarioClima = 'excesso_chuva';
  }

  // Calcula peso final estimado
  pesoSaida = Math.round(pesoAtual + gmd * dias);

  return {
    nomeCenario: `Simulação IA: ${quantidade} Animais (${dias}d)`,
    descricao: `Cenário gerado com base no resumo: "${prompt.slice(0, 80)}..."`,
    fazenda: {
      nome: 'Fazenda Boa Esperança',
      estado: 'SP',
      municipio: 'Sorocaba',
      areaTotal: 1200,
      areaProdutiva: 950,
      areaPastagem: 800
    },
    variaveis: {
      precoArroba: Math.max(250, precoArroba - 10),
      precoProjetadoArroba: precoArroba,
      precoBezerro: 2400,
      precoBoiMagro: Math.round(pesoAtual * 9.5),
      precoBoiMagro: Math.round((pesoAtual / 30) * precoCompraArrobaBoiMagro),
      precoCompraArrobaBoiMagro,
      precoMilho: 65,
      precoFareloSoja: 1800,
      dolar: 5.60,
      taxaJuros: 0.1125,
      quantidadeAnimais: quantidade,
      pesoMedioAtual: pesoAtual,
      pesoMedioEntrada: Math.max(200, pesoAtual - 50),
      pesoMedioSaida: pesoSaida,
      gmd,
      rendimentoCarcaca: estrategia === 'confinamento_total' ? 0.55 : 0.535,
      mortalidade: 0.01,
      diasPermanencia: dias,
      bonificacaoArroba: 3.5,
      descontoArroba: 1.5,
      freteVendaCabeca: 35,
      comissaoVendaPercent: 1.0,
      impostoSenarPercent: 1.63,
      tipoMedidaArea: 'hectares',
      areaPastagem: 800,
      tipoPastagem: 'Brachiaria Brizantha',
      capacidadeSuporteUA: 1.3,
      lotacaoAtualUA: Math.round((quantidade / 800) * 10) / 10 || 1.0,
      custoManutencaoPastagemHaAno: 180,
      reformaPastagemAreaHa: 0,
      investimentoReformaHa: 1200,
      estrategiaNutricional: estrategia,
      custoAnimalDia: custoDia,
      consumoRacaoPercentPV,
      precoKgRacao,
      arrendamentoMensal: arrendamento,
      maoDeObraMensal: maoDeObra,
      custoSeguroCabeca: 5.0,
      cenarioClimatico: cenarioClima,
      impactoPastoPercent: cenarioClima === 'seca_severa' ? -0.25 : cenarioClima === 'seca_moderada' ? -0.15 : 0,
      custosFixosMensais: 20000,
      custosSanitariosCabecaAno: 65,
      outrosCustosCabecaMes: 12,
      capitalDisponivel: Math.round(quantidade * custoDia * dias * 0.8),
      financiamentoNecessario: 0,
      taxaFinanciamentoAno: 0.115
    }
  };
}

