'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CenarioCompleto,
  CenarioVariaveis,
  FazendaConfig
} from '../../types/simulation';
import { SimulationEngine } from '../../services/SimulationEngine';
import { InsightEngine } from '../../services/InsightEngine';
import { StorageService } from '../../services/StorageService';
import { ModalPreencherIA } from './ModalPreencherIA';
import { ComparadorCenários } from './ComparadorCenários';
import {
  Sparkles,
  Mic,
  Copy,
  Trash2,
  Download,
  Upload,
  Plus,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Layers,
  BarChart3,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Zap,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Pencil,
  Check,
  X,
  PlusCircle,
  MinusCircle,
  HelpCircle,
  ArrowUpRight,
  ShieldAlert,
  Wallet,
  Scale,
  Percent,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line
} from 'recharts';

function criarCenarioPadrao(): CenarioCompleto {
  const fazenda: FazendaConfig = {
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
  };

  const variaveis: CenarioVariaveis = {
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
  };

  const resultados = SimulationEngine.calculate(variaveis, fazenda);
  const alertas = InsightEngine.generateInsights(variaveis, resultados, fazenda);

  return {
    id: "cenario_001",
    nome: "Cenário Base - Planejamento 2027",
    descricao: "Planejamento padrão da operação de recria e terminação em pasto com suplementação e semiconfinamento.",
    isBase: true,
    schemaVersion: "1.0.0",
    dataCriacao: new Date().toISOString(),
    dataAtualizacao: new Date().toISOString(),
    fazenda,
    periodo: { inicio: "2026-09", fim: "2027-09" },
    variaveis,
    resultados,
    alertas
  };
}

export function SimulacaoCenáriosView() {
  const [cenarios, setCenarios] = useState<CenarioCompleto[]>([]);
  const [cenarioAtual, setCenarioAtual] = useState<CenarioCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Abas didáticas simplificadas
  const [activeTab, setActiveTab] = useState<'simulador' | 'resultado' | 'diagnostico' | 'comparador'>('simulador');
  
  // Modos de entrada
  const [modoCompraGado, setModoCompraGado] = useState<'arroba' | 'cabeca'>('arroba');
  const [modoNutricao, setModoNutricao] = useState<'planilha' | 'direto'>('planilha');
  const [unidadeArea, setUnidadeArea] = useState<'hectares' | 'alqueires'>('hectares');

  // Expansão de custos avançados
  const [showAdvancedCosts, setShowAdvancedCosts] = useState(false);
  
  // Modais e edição de título
  const [modalIAOpen, setModalIAOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'salvo' | 'salvando' | 'erro'>('salvo');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega cenários iniciais
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let list = await StorageService.listScenarios();
        if (!list || list.length === 0) {
          const cenarioPadrao = criarCenarioPadrao();
          await StorageService.saveScenario(cenarioPadrao);
          list = [cenarioPadrao];
        }
        
        // Garante resultados recalculados para todos os cenários
        list = list.map(c => {
          if (!c.resultados || typeof c.resultados.lucro !== 'number') {
            const res = SimulationEngine.calculate(c.variaveis, c.fazenda);
            const ins = InsightEngine.generateInsights(c.variaveis, res, c.fazenda);
            return { ...c, resultados: res, alertas: ins };
          }
          return c;
        });

        setCenarios(list);
        const activeId = StorageService.getActiveScenarioId();
        const found = list.find(c => c.id === activeId) || list[0];
        setCenarioAtual(found);
        if (found?.variaveis?.tipoMedidaArea) {
          setUnidadeArea(found.variaveis.tipoMedidaArea);
        }
      } catch (err) {
        console.error('Erro ao carregar cenários:', err);
        const cenarioPadrao = criarCenarioPadrao();
        setCenarios([cenarioPadrao]);
        setCenarioAtual(cenarioPadrao);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  // Recalcula simulação e salva com debounce (suporta múltiplas variáveis simultâneas)
  function updateVariables(partial: Partial<CenarioVariaveis>) {
    if (!cenarioAtual) return;

    const novasVariaveis: CenarioVariaveis = {
      ...cenarioAtual.variaveis,
      ...partial
    };

    const novosResultados = SimulationEngine.calculate(novasVariaveis, cenarioAtual.fazenda);
    const novosAlertas = InsightEngine.generateInsights(novasVariaveis, novosResultados, cenarioAtual.fazenda);

    const cenarioAtualizado: CenarioCompleto = {
      ...cenarioAtual,
      variaveis: novasVariaveis,
      resultados: novosResultados,
      alertas: novosAlertas,
      dataAtualizacao: new Date().toISOString()
    };

    setCenarioAtual(cenarioAtualizado);
    setCenarios(prev => prev.map(c => c.id === cenarioAtualizado.id ? cenarioAtualizado : c));

    setSaveStatus('salvando');
    StorageService.debounceAutoSave(cenarioAtualizado, 500, (success) => {
      setSaveStatus(success ? 'salvo' : 'erro');
    });
  }

  function updateVariable<K extends keyof CenarioVariaveis>(key: K, value: CenarioVariaveis[K]) {
    updateVariables({ [key]: value });
  }

  // Atalhos de incremento didático (+/-)
  function adjustNumber(key: keyof CenarioVariaveis, delta: number, min = 0, max = 999999) {
    if (!cenarioAtual) return;
    const current = Number(cenarioAtual.variaveis[key]) || 0;
    const next = Math.max(min, Math.min(max, Math.round((current + delta) * 100) / 100));
    updateVariable(key, next as any);
  }

  function handleSelectCenario(id: string) {
    const selected = cenarios.find(c => c.id === id);
    if (selected) {
      setCenarioAtual(selected);
      StorageService.setActiveScenarioId(selected.id);
      setIsEditingTitle(false);
      setShowActionsMenu(false);
      showToast(`Cenário "${selected.nome}" carregado.`);
    }
  }

  async function handleSaveTitle() {
    if (!cenarioAtual) return;
    const newName = editTitleValue.trim();
    if (!newName) {
      setIsEditingTitle(false);
      return;
    }
    const updated: CenarioCompleto = {
      ...cenarioAtual,
      nome: newName,
      dataAtualizacao: new Date().toISOString()
    };
    setCenarioAtual(updated);
    setCenarios(prev => prev.map(c => c.id === updated.id ? updated : c));
    setIsEditingTitle(false);
    await StorageService.saveScenario(updated);
    showToast(`Título alterado para "${newName}"`);
  }

  async function handleNovoCenario() {
    if (!cenarioAtual) return;
    const novo: CenarioCompleto = {
      id: `cenario_${Date.now()}`,
      nome: `Plano Safra ${cenarios.length + 1}`,
      descricao: 'Novo planejamento estratégico personalizado',
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
      fazenda: { ...cenarioAtual.fazenda },
      periodo: { inicio: '2026-09', fim: '2027-09' },
      variaveis: { ...cenarioAtual.variaveis },
      resultados: { ...cenarioAtual.resultados },
      alertas: [...cenarioAtual.alertas],
      schemaVersion: '1.0.0'
    };
    await StorageService.saveScenario(novo);
    setCenarios(prev => [...prev, novo]);
    setCenarioAtual(novo);
    StorageService.setActiveScenarioId(novo.id);
    setShowActionsMenu(false);
    showToast('Novo plano criado!');
  }

  async function handleDuplicar() {
    if (!cenarioAtual) return;
    const duplicated = await StorageService.duplicateScenario(cenarioAtual.id);
    if (duplicated) {
      setCenarios(prev => [...prev, duplicated]);
      setCenarioAtual(duplicated);
      StorageService.setActiveScenarioId(duplicated.id);
      setShowActionsMenu(false);
      showToast(`Plano duplicado: "${duplicated.nome}"`);
    }
  }

  async function handleExcluir() {
    if (!cenarioAtual) return;
    if (cenarios.length <= 1) {
      alert('Você precisa ter pelo menos um cenário no sistema.');
      return;
    }
    if (!confirm(`Deseja apagar o plano "${cenarioAtual.nome}"?`)) return;

    await StorageService.deleteScenario(cenarioAtual.id);
    const restantes = cenarios.filter(c => c.id !== cenarioAtual.id);
    setCenarios(restantes);
    setCenarioAtual(restantes[0]);
    StorageService.setActiveScenarioId(restantes[0].id);
    setShowActionsMenu(false);
    showToast('Plano excluído.');
  }

  function handleExportar() {
    if (!cenarioAtual) return;
    StorageService.exportScenarioJSON(cenarioAtual);
    setShowActionsMenu(false);
    showToast('Arquivo baixado no seu celular/computador!');
  }

  function handleImportar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const imported = StorageService.importScenarioJSON(text);
        imported.resultados = SimulationEngine.calculate(imported.variaveis, imported.fazenda);
        imported.alertas = InsightEngine.generateInsights(imported.variaveis, imported.resultados, imported.fazenda);

        await StorageService.saveScenario(imported);
        setCenarios(prev => [...prev, imported]);
        setCenarioAtual(imported);
        StorageService.setActiveScenarioId(imported.id);
        setShowActionsMenu(false);
        showToast(`Plano "${imported.nome}" importado com sucesso!`);
      } catch (err: any) {
        alert('Arquivo inválido: ' + err.message);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  }

  async function handleApplyAI(aiData: any) {
    if (!cenarioAtual) return;

    const novasVariaveis: CenarioVariaveis = {
      ...cenarioAtual.variaveis,
      ...aiData.variaveis
    };

    const novosResultados = SimulationEngine.calculate(novasVariaveis, cenarioAtual.fazenda);
    const novosAlertas = InsightEngine.generateInsights(novasVariaveis, novosResultados, cenarioAtual.fazenda);

    const cenarioAtualizado: CenarioCompleto = {
      ...cenarioAtual,
      nome: aiData.nomeCenario || cenarioAtual.nome,
      descricao: aiData.descricao || cenarioAtual.descricao,
      variaveis: novasVariaveis,
      resultados: novosResultados,
      alertas: novosAlertas,
      dataAtualizacao: new Date().toISOString()
    };

    setCenarioAtual(cenarioAtualizado);
    setCenarios(prev => prev.map(c => c.id === cenarioAtualizado.id ? cenarioAtualizado : c));
    await StorageService.saveScenario(cenarioAtualizado);
    showToast('✨ Simulação preenchida pela IA com sucesso!');
  }

  if (loading || !cenarioAtual) {
    return (
      <div className="p-8 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
        Carregando simulador da fazenda...
      </div>
    );
  }

  const v = cenarioAtual.variaveis;
  const r = cenarioAtual.resultados;
  const f = cenarioAtual.fazenda;

  // Encontra cenário base para comparação didática
  const cenarioBase = cenarios.find(c => c.isBase) || cenarios[0];
  const diferencaLucroBase = r.lucro - (cenarioBase?.resultados?.lucro || 0);

  // Cálculos didáticos auxiliares da fazenda
  const pesoEntradaEfetivo = v.pesoMedioEntrada > 0 ? v.pesoMedioEntrada : v.pesoMedioAtual;
  const arrobasEntrada = Math.round((pesoEntradaEfetivo / 30) * 10) / 10;
  const precoBoiMagroCalculado = v.precoCompraArrobaBoiMagro && v.precoCompraArrobaBoiMagro > 0
    ? Math.round(arrobasEntrada * v.precoCompraArrobaBoiMagro)
    : (v.precoBoiMagro || 3800);

  const pesoFinalCalculado = v.pesoMedioSaida > 0 ? v.pesoMedioSaida : Math.round(pesoEntradaEfetivo + v.gmd * v.diasPermanencia);
  const arrobasFinal = Math.round(((pesoFinalCalculado * v.rendimentoCarcaca) / 15) * 10) / 10;
  const arrobasGanhas = Math.max(0, Math.round((arrobasFinal - arrobasEntrada) * 10) / 10);
  const ganhoPorArrobaProduzida = Math.round((v.precoProjetadoArroba - (r.custoArrobaProduzida || 0)) * 100) / 100;
  const consumoKgRacaoDia = Math.round((r.pesoVivoMedio * ((v.consumoRacaoPercentPV || 1.80) / 100)) * 100) / 100;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Notificação Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 px-4 py-3 bg-emerald-600 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Input de arquivo invisível */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportar}
        accept=".json"
        className="hidden"
      />

      {/* 1. TOPO: Título, Fazenda e Ações Didáticas */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        
        {/* Linha 1: Identificação da Fazenda & Status de Salvamento */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold uppercase">{f.nome}</span>
            <span>•</span>
            <span>{f.municipio} ({f.estado})</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            {saveStatus === 'salvando' ? (
              <span className="text-amber-400 font-medium">Salvando...</span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> Salvo local
              </span>
            )}
          </div>
        </div>

        {/* Linha 2: Título do Cenário (Edição Direta com 1 Toque) */}
        <div className="flex items-center justify-between gap-2">
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                autoFocus
                className="w-full text-base sm:text-xl font-bold text-white bg-slate-950 px-3.5 py-2 rounded-2xl border-2 border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shrink-0"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingTitle(false)}
                className="p-2.5 bg-slate-800 text-slate-400 hover:text-white rounded-2xl shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h2 className="text-lg sm:text-2xl font-black text-white truncate tracking-tight">
                {cenarioAtual.nome}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditTitleValue(cenarioAtual.nome);
                  setIsEditingTitle(true);
                }}
                title="Editar nome deste plano"
                className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Menu de Cenários & Ações */}
          <div className="relative flex items-center gap-1.5">
            {cenarios.length > 1 && (
              <select
                value={cenarioAtual.id}
                onChange={(e) => handleSelectCenario(e.target.value)}
                className="text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl px-2.5 py-2 cursor-pointer focus:outline-none"
              >
                {cenarios.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    Trocar: {c.nome} {c.isBase ? '(Base)' : ''}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors text-xs font-semibold flex items-center gap-1"
            >
              <span>Mais</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showActionsMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Menu Dropdown de Ações */}
            {showActionsMenu && (
              <div className="absolute right-0 top-12 z-50 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 space-y-1 text-xs animate-fadeIn">
                <button
                  type="button"
                  onClick={handleNovoCenario}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl font-medium"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Novo Plano em Branco</span>
                </button>
                <button
                  type="button"
                  onClick={handleDuplicar}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl font-medium"
                >
                  <Copy className="w-4 h-4 text-blue-400" />
                  <span>Duplicar este Plano</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportar}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl font-medium"
                >
                  <Download className="w-4 h-4 text-purple-400" />
                  <span>Baixar Arquivo JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl font-medium"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Restaurar / Importar</span>
                </button>
                {cenarios.length > 1 && (
                  <button
                    type="button"
                    onClick={handleExcluir}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-950/40 rounded-xl font-medium border-t border-slate-800"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir este Plano</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Linha 3: Botão de Destaque: FALAR OU PREENCHER COM IA */}
        <button
          type="button"
          onClick={() => setModalIAOpen(true)}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2.5 transition-all transform active:scale-98"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Mic className="w-4 h-4 text-white animate-pulse" />
          </div>
          <span className="tracking-wide">Falar ou Preencher com IA</span>
          <Sparkles className="w-4 h-4 text-amber-200" />
        </button>

      </div>

      {/* 2. OS 4 CARDS ESTRATÉGICOS DO PRODUTOR (DA PLANILHA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* CARD 1: LUCRO LÍQUIDO NO BOLSO (TOTAL E POR BOI) */}
        <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4" />
                Lucro no Bolso
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] border border-emerald-500/30">
                {r?.margemLiquida ?? 0}% margem
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
              R$ {(r?.lucro ?? 0).toLocaleString('pt-BR')}
            </div>

            {/* Destaque Didático: Sobra por Boi */}
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
              <span>Sobra limpa:</span>
              <strong className="text-white text-sm">R$ {(r?.lucroPorCabeca ?? 0).toLocaleString('pt-BR')}</strong>
              <span className="text-[10px] font-normal text-slate-400">/boi</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Venda Líquida:</span>
            <strong className="text-slate-200">R$ {(r?.receitaLiquida ?? 0).toLocaleString('pt-BR')}</strong>
          </div>
        </div>

        {/* CARD 2: CUSTO DA @ PRODUZIDA (ENGORDA) VS VENDA */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                Custo da @ Engordada
              </span>
              <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] border border-amber-500/30">
                +{ganhoPorArrobaProduzida >= 0 ? 'R$ ' + (ganhoPorArrobaProduzida ?? 0).toFixed(2) : '-'} /@
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
              R$ {(r?.custoArrobaProduzida ?? 0).toFixed(2)}
              <span className="text-xs font-normal text-slate-400 ml-1">/@</span>
            </div>

            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Custo para colocar cada @ na fazenda. Você vende a <strong className="text-white">R$ {(v?.precoProjetadoArroba ?? 0).toFixed(2)}/@</strong>.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Dias p/ 1 @:</span>
            <strong className="text-slate-200">{r.diasParaProduzirUmaArroba} dias</strong>
          </div>
        </div>

        {/* CARD 3: COMPARATIVO COM A SELIC / CDI (DA PLANILHA) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-blue-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Percent className="w-4 h-4" />
                Boi vs CDI / Selic
              </span>
              <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-[10px] border border-blue-500/30">
                {r.comparativoSelic?.relacaoComSelic || 0}x a Selic
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
              +{r.comparativoSelic?.rentabilidadeBoiPeriodo || 0}%
              <span className="text-xs font-normal text-slate-400 ml-1.5">no ciclo</span>
            </div>

            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              A Selic renderia {r.comparativoSelic?.rentabilidadeSelicPeriodo || 0}% no mesmo prazo ({v.diasPermanencia}d).
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Ganho extra vs banco:</span>
            <strong className="text-emerald-400 font-bold">
              +R$ {(r.comparativoSelic?.diferencaLucroVsSelic || 0).toLocaleString('pt-BR')}
            </strong>
          </div>
        </div>

        {/* CARD 4: PREÇO DE EMPATE & LOTAÇÃO */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-purple-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Scale className="w-4 h-4" />
                Preço de Empate
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                r.margemSeguranca >= 15 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                +{r.margemSeguranca}% folga
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
              R$ {(r?.precoEquilibrio ?? 0).toFixed(2)}
              <span className="text-xs font-normal text-slate-400 ml-1">/@</span>
            </div>

            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Preço mínimo geral no frigorífico para não tomar prejuízo na operação.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Lotação Pasto:</span>
            <strong className="text-slate-200">{r.lotacaoUAPorHa} UA/ha</strong>
          </div>
        </div>

      </div>

      {/* 2.5. PAINEL EXECUTIVO: REBANHO ATUAL & AQUISIÇÃO DE GADO */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base border border-amber-500/30">
              🐄
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                Inventário de Rebanho & Compras de Gado
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Ao Vivo
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Resumo da aquisição de animais e rebanho ativo no pasto/confinamento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl font-bold border border-slate-700">
              Lotação: <strong className="text-emerald-400">{(r?.lotacaoUAPorHa ?? 0)} UA/ha</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          
          {/* Item 1: Quantidade Comprada vs Rebanho Vivo */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rebanho Vivo Atual</span>
            <div className="text-lg sm:text-xl font-black text-emerald-400">
              {(r?.rebanhoVivoAtual ?? v.quantidadeAnimais)} <span className="text-xs font-normal text-slate-400">cab</span>
            </div>
            <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-800/60">
              <span>Compradas: <strong className="text-white">{(r?.quantidadeComprada ?? v.quantidadeAnimais)}</strong></span>
              <span>Mortes: <strong className="text-red-400">{(r?.mortalidadeCabecas ?? 0)}</strong></span>
            </div>
          </div>

          {/* Item 2: Investimento Total na Compra */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Investimento em Gado</span>
            <div className="text-lg sm:text-xl font-black text-amber-300">
              R$ {(r?.custoCompraAnimais ?? 0).toLocaleString('pt-BR')}
            </div>
            <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-800/60">
              <span>Média/Cab: <strong className="text-white">R$ {(r?.custoCompraPorCabeca ?? 0).toLocaleString('pt-BR')}</strong></span>
            </div>
          </div>

          {/* Item 3: Preço por @ do Boi Magro */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Preço de Compra por @</span>
            <div className="text-lg sm:text-xl font-black text-purple-300">
              R$ {(r?.custoCompraPorArroba ?? v.precoCompraArrobaBoiMagro ?? 0).toFixed(2)}
              <span className="text-xs font-normal text-slate-400 ml-1">/@</span>
            </div>
            <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-800/60">
              <span>Total @ Entrada: <strong className="text-white">{(r?.arrobasEntradaTotal ?? 0).toLocaleString('pt-BR')} @</strong></span>
            </div>
          </div>

          {/* Item 4: Evolução de Peso do Animal */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Evolução no Trato</span>
            <div className="text-lg sm:text-xl font-black text-blue-400">
              +{((v.gmd || 0) * (v.diasPermanencia || 0)).toFixed(0)} <span className="text-xs font-normal text-slate-400">kg ganho</span>
            </div>
            <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-800/60">
              <span>Entrada: <strong className="text-white">{pesoEntradaEfetivo}kg</strong></span>
              <span>Saída: <strong className="text-emerald-400">{pesoFinalCalculado}kg</strong></span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. NAVEGAÇÃO DE ABAS 100% DIDÁTICA NO MOBILE */}
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs font-bold">
        
        <button
          type="button"
          onClick={() => setActiveTab('simulador')}
          className={`py-2.5 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
            activeTab === 'simulador'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Ajustar Contas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('resultado')}
          className={`py-2.5 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
            activeTab === 'resultado'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Mês a Mês</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('diagnostico')}
          className={`py-2.5 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
            activeTab === 'diagnostico'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Dicas ({cenarioAtual.alertas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('comparador')}
          className={`py-2.5 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
            activeTab === 'comparador'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Comparar</span>
        </button>

      </div>

      {/* 4. CONTEÚDO DAS ABAS */}

      {/* ABA 1: AJUSTAR SIMULAÇÃO (CONTROLES GRANDES E DIDÁTICOS PARA O PRODUTOR) */}
      {activeTab === 'simulador' && (
        <div className="space-y-4 animate-fadeIn">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* CONTROLE 1: PREÇO DE VENDA DA ARROBA NO FRIGORÍFICO */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Venda da Arroba no Frigorífico
                  </h4>
                  <p className="text-[11px] text-slate-400">Preço esperado na data de abate</p>
                </div>
                <div className="text-lg font-black text-emerald-400">
                  R$ {(v?.precoProjetadoArroba ?? 0).toFixed(2)}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => adjustNumber('precoProjetadoArroba', -5, 180, 500)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  - R$ 5
                </button>
                <button
                  type="button"
                  onClick={() => adjustNumber('precoProjetadoArroba', -1, 180, 500)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  - R$ 1
                </button>
                <input
                  type="range"
                  min="220"
                  max="420"
                  step="1"
                  value={v.precoProjetadoArroba}
                  onChange={(e) => updateVariable('precoProjetadoArroba', parseFloat(e.target.value))}
                  className="flex-1 accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => adjustNumber('precoProjetadoArroba', 1, 180, 500)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  + R$ 1
                </button>
                <button
                  type="button"
                  onClick={() => adjustNumber('precoProjetadoArroba', 5, 180, 500)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  + R$ 5
                </button>
              </div>

              <div className="text-[11px] text-slate-400 pt-1 flex justify-between border-t border-slate-800/60">
                <span>Receita Bruta Projetada:</span>
                <strong className="text-white">R$ {r.receitaBruta.toLocaleString('pt-BR')}</strong>
              </div>
            </div>

            {/* CONTROLE 2: COMPRA DO BOI MAGRO (POR @ OU POR CABEÇA) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    Compra do Boi Magro
                  </h4>
                  <p className="text-[11px] text-slate-400">Preço de aquisição para engorda</p>
                </div>
                <div className="text-lg font-black text-amber-300">
                  {modoCompraGado === 'arroba'
                    ? `R$ ${(v.precoCompraArrobaBoiMagro || 380).toFixed(2)}/@`
                    : `R$ ${precoBoiMagroCalculado.toLocaleString('pt-BR')}/cab`}
                </div>
              </div>

              {/* Seletor de Modo de Compra */}
              <div className="flex items-center gap-2 pb-1">
                <button
                  type="button"
                  onClick={() => setModoCompraGado('arroba')}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                    modoCompraGado === 'arroba'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Preço por @ (R$ {(v.precoCompraArrobaBoiMagro || 380).toFixed(0)}/@)
                </button>
                <button
                  type="button"
                  onClick={() => setModoCompraGado('cabeca')}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                    modoCompraGado === 'cabeca'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Preço por Boi (R$ {precoBoiMagroCalculado.toLocaleString('pt-BR')})
                </button>
              </div>

              {modoCompraGado === 'arroba' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustNumber('precoCompraArrobaBoiMagro', -10, 200, 600)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                  >
                    -10
                  </button>
                  <input
                    type="range"
                    min="250"
                    max="460"
                    step="5"
                    value={v.precoCompraArrobaBoiMagro || 380}
                    onChange={(e) => updateVariable('precoCompraArrobaBoiMagro', parseFloat(e.target.value))}
                    className="flex-1 accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => adjustNumber('precoCompraArrobaBoiMagro', 10, 200, 600)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                  >
                    +10
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustNumber('precoBoiMagro', -100, 1500, 8000)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                  >
                    -100
                  </button>
                  <input
                    type="range"
                    min="2500"
                    max="6000"
                    step="50"
                    value={v.precoBoiMagro || 3800}
                    onChange={(e) => updateVariable('precoBoiMagro', parseFloat(e.target.value))}
                    className="flex-1 accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => adjustNumber('precoBoiMagro', 100, 1500, 8000)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                  >
                    +100
                  </button>
                </div>
              )}

              <div className="text-[11px] text-slate-400 pt-1 flex justify-between border-t border-slate-800/60">
                <span>Custo de compra por boi:</span>
                <strong className="text-white">R$ {precoBoiMagroCalculado.toLocaleString('pt-BR')} ({arrobasEntrada} @)</strong>
              </div>
            </div>

            {/* CONTROLE 3: QUANTIDADE DE ANIMAIS NO LOTE */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Quantidade de Bois no Lote
                  </h4>
                  <p className="text-[11px] text-slate-400">Total de animais a engordar</p>
                </div>
                <div className="text-lg font-black text-white">
                  {v.quantidadeAnimais} <span className="text-xs font-normal text-slate-400">cab</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => adjustNumber('quantidadeAnimais', -50, 10, 5000)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  -50
                </button>
                <button
                  type="button"
                  onClick={() => adjustNumber('quantidadeAnimais', -10, 10, 5000)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  -10
                </button>
                <input
                  type="range"
                  min="20"
                  max="2000"
                  step="10"
                  value={v.quantidadeAnimais}
                  onChange={(e) => updateVariable('quantidadeAnimais', parseInt(e.target.value, 10))}
                  className="flex-1 accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => adjustNumber('quantidadeAnimais', 10, 10, 5000)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => adjustNumber('quantidadeAnimais', 50, 10, 5000)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  +50
                </button>
              </div>

              <div className="text-[11px] text-slate-400 pt-1 flex justify-between border-t border-slate-800/60">
                <span>Animais abatidos previstos (mortalidade {((v.mortalidade || 0.01) * 100).toFixed(1)}%):</span>
                <strong className="text-white">{r.animaisAbatidos} cab</strong>
              </div>
            </div>

            {/* CONTROLE 4: DIAS DE TRATO / PERMANÊNCIA */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Dias de Permanência / Trato
                  </h4>
                  <p className="text-[11px] text-slate-400">Duração do ciclo até a venda</p>
                </div>
                <div className="text-lg font-black text-white">
                  {v.diasPermanencia} <span className="text-xs font-normal text-slate-400">dias</span>
                </div>
              </div>

              {/* Botões Rápidos */}
              <div className="flex items-center gap-1.5 pb-1">
                {[60, 90, 100, 120, 150].map((dias) => (
                  <button
                    key={dias}
                    type="button"
                    onClick={() => updateVariable('diasPermanencia', dias)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      v.diasPermanencia === dias
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {dias}d
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustNumber('diasPermanencia', -10, 30, 365)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  -10
                </button>
                <input
                  type="range"
                  min="30"
                  max="240"
                  step="5"
                  value={v.diasPermanencia}
                  onChange={(e) => updateVariable('diasPermanencia', parseInt(e.target.value, 10))}
                  className="flex-1 accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => adjustNumber('diasPermanencia', 10, 30, 365)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  +10
                </button>
              </div>

              <div className="text-[11px] text-slate-400 pt-1 flex justify-between border-t border-slate-800/60">
                <span>Duração estimada do lote:</span>
                <strong className="text-white">{(v.diasPermanencia / 30).toFixed(1)} meses</strong>
              </div>
            </div>

            {/* CONTROLE 5: GANHO DE PESO (GMD) E PESOS DE ENTRADA/SAÍDA */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Ganho Médio Diário (GMD)
                  </h4>
                  <p className="text-[11px] text-slate-400">Engorda diária por animal</p>
                </div>
                <div className="text-lg font-black text-amber-400">
                  {(v?.gmd ?? 0).toFixed(2)} <span className="text-xs font-normal text-slate-400">kg/dia</span>
                </div>
              </div>

              {/* Botões Rápidos por Sistema Produtivo */}
              <div className="flex items-center gap-1.5 pb-1">
                <button
                  type="button"
                  onClick={() => updateVariable('gmd', 0.65)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold border ${v.gmd === 0.65 ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                >
                  Pasto (0.65)
                </button>
                <button
                  type="button"
                  onClick={() => updateVariable('gmd', 1.05)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold border ${v.gmd === 1.05 ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                >
                  Semi (1.05)
                </button>
                <button
                  type="button"
                  onClick={() => updateVariable('gmd', 1.45)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold border ${v.gmd === 1.45 ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                >
                  Confinamento (1.45)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustNumber('gmd', -0.05, 0.3, 2.2)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  -0.05
                </button>
                <input
                  type="range"
                  min="0.4"
                  max="1.8"
                  step="0.05"
                  value={v.gmd}
                  onChange={(e) => updateVariable('gmd', parseFloat(e.target.value))}
                  className="flex-1 accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => adjustNumber('gmd', 0.05, 0.3, 2.2)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  +0.05
                </button>
              </div>

              <div className="text-[11px] text-slate-400 pt-1 flex justify-between border-t border-slate-800/60">
                <span>Entrada: <strong className="text-white">{pesoEntradaEfetivo} kg</strong></span>
                <span>Saída: <strong className="text-emerald-400">{pesoFinalCalculado} kg ({arrobasFinal} @)</strong></span>
                <span>Ganho: <strong className="text-amber-300">+{arrobasGanhas} @</strong></span>
              </div>
            </div>

            {/* CONTROLE 6: NUTRIÇÃO & RAÇÃO (DA PLANILHA) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    Alimentação & Ração (Planilha)
                  </h4>
                  <p className="text-[11px] text-slate-400">Consumo em %PV e preço do kg</p>
                </div>
                <div className="text-lg font-black text-amber-400">
                  R$ {(v?.custoAnimalDia ?? 0).toFixed(2)}
                  <span className="text-xs font-normal text-slate-400 ml-1">/dia</span>
                </div>
              </div>

              {/* Seletor de Modo de Alimentação */}
              <div className="flex items-center gap-2 pb-1">
                <button
                  type="button"
                  onClick={() => setModoNutricao('planilha')}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                    modoNutricao === 'planilha'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Fórmula %PV e R$/kg
                </button>
                <button
                  type="button"
                  onClick={() => setModoNutricao('direto')}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                    modoNutricao === 'direto'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Custo Diário Direto
                </button>
              </div>

              {modoNutricao === 'planilha' ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Consumo (% do Peso Vivo):</span>
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="4.0"
                          value={v.consumoRacaoPercentPV || 1.80}
                          onChange={(e) => {
                            const pv = parseFloat(e.target.value) || 0;
                            const pr = v.precoKgRacao || 1.58;
                            const custoDiaCalc = Math.round(((r.pesoVivoMedio * (pv / 100)) * pr) * 100) / 100;
                            updateVariables({ consumoRacaoPercentPV: pv, custoAnimalDia: custoDiaCalc });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-xs"
                        />
                        <span className="text-xs text-slate-400">%PV</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Preço R$/kg da Ração:</span>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-slate-400">R$</span>
                        <input
                          type="number"
                          step="0.05"
                          min="0.5"
                          max="10"
                          value={v.precoKgRacao || 1.58}
                          onChange={(e) => {
                            const pr = parseFloat(e.target.value) || 0;
                            const pv = v.consumoRacaoPercentPV || 1.80;
                            const custoDiaCalc = Math.round(((r.pesoVivoMedio * (pv / 100)) * pr) * 100) / 100;
                            updateVariables({ precoKgRacao: pr, custoAnimalDia: custoDiaCalc });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 pt-1 flex justify-between border-t border-slate-800/60">
                    <span>Trato: <strong className="text-emerald-400">{consumoKgRacaoDia} kg de ração/dia</strong></span>
                    <span>Total Trato: <strong className="text-white">R$ {r.custoAlimentacao.toLocaleString('pt-BR')}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustNumber('custoAnimalDia', -0.5, 1, 35)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                    >
                      -0.50
                    </button>
                    <input
                      type="range"
                      min="2"
                      max="20"
                      step="0.5"
                      value={v.custoAnimalDia}
                      onChange={(e) => updateVariable('custoAnimalDia', parseFloat(e.target.value))}
                      className="flex-1 accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => adjustNumber('custoAnimalDia', 0.5, 1, 35)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                    >
                      +0.50
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1 flex justify-between border-t border-slate-800/60">
                    <span>Alimentação Total no Período:</span>
                    <strong className="text-white">R$ {r.custoAlimentacao.toLocaleString('pt-BR')}</strong>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ACORDEÃO DE CUSTOS OPERACIONAIS E ESTRUTURA (PLANILHA) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <button
              type="button"
              onClick={() => setShowAdvancedCosts(!showAdvancedCosts)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Custos da Fazenda (Arrendamento, Mão de Obra, Pasto e Senar)</h4>
                  <p className="text-[11px] text-slate-400">Valores fixos, impostos de abate e área de pastagem</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                <span>{showAdvancedCosts ? 'Ocultar' : 'Ajustar'}</span>
                {showAdvancedCosts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showAdvancedCosts && (
              <div className="p-4 border-t border-slate-800 space-y-4 text-xs animate-fadeIn bg-slate-950/50">
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Arrendamento Mensal */}
                  <div className="space-y-1.5 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="font-semibold text-slate-300">Arrendamento / Aluguel de Pasto (R$/mês)</span>
                    <input
                      type="number"
                      step="500"
                      value={v.arrendamentoMensal || 0}
                      onChange={(e) => updateVariable('arrendamentoMensal', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                    />
                    <p className="text-[10px] text-slate-500">Ex: R$ 3.500/mês ou R$ 0 se terra própria</p>
                  </div>

                  {/* Mão de Obra Mensal */}
                  <div className="space-y-1.5 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="font-semibold text-slate-300">Mão de Obra / Campeiro (R$/mês)</span>
                    <input
                      type="number"
                      step="500"
                      value={v.maoDeObraMensal || 0}
                      onChange={(e) => updateVariable('maoDeObraMensal', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                    />
                    <p className="text-[10px] text-slate-500">Salários e encargos operacionais</p>
                  </div>

                  {/* Seguro por Cabeça */}
                  <div className="space-y-1.5 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="font-semibold text-slate-300">Seguro por Boi (R$/cab)</span>
                    <input
                      type="number"
                      step="1"
                      value={v.custoSeguroCabeca || 0}
                      onChange={(e) => updateVariable('custoSeguroCabeca', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                    />
                    <p className="text-[10px] text-slate-500">Ex: R$ 5,00 por cabeça no ciclo</p>
                  </div>

                  {/* Imposto Senar / Funrural */}
                  <div className="space-y-1.5 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="font-semibold text-slate-300">Imposto Senar / Funrural (%)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={v.impostoSenarPercent ?? 1.63}
                      onChange={(e) => updateVariable('impostoSenarPercent', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                    />
                    <p className="text-[10px] text-slate-500">Padrão nacional: 1.63% sobre a receita bruta</p>
                  </div>

                  {/* Área de Pastagem (Hectares vs Alqueires) */}
                  <div className="space-y-1.5 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300">Área de Pastagem</span>
                      <div className="flex items-center gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            setUnidadeArea('hectares');
                            updateVariable('tipoMedidaArea', 'hectares');
                          }}
                          className={`px-1.5 py-0.5 rounded ${unidadeArea === 'hectares' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                        >
                          ha
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUnidadeArea('alqueires');
                            updateVariable('tipoMedidaArea', 'alqueires');
                          }}
                          className={`px-1.5 py-0.5 rounded ${unidadeArea === 'alqueires' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                        >
                          alq
                        </button>
                      </div>
                    </div>

                    {unidadeArea === 'alqueires' ? (
                      <div>
                        <input
                          type="number"
                          step="0.5"
                          value={Math.round((v.areaPastagem / 2.42) * 10) / 10}
                          onChange={(e) => {
                            const alq = parseFloat(e.target.value) || 1;
                            updateVariable('areaPastagem', Math.round(alq * 2.42 * 10) / 10);
                          }}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          = {v.areaPastagem} ha (Lotação: {r.lotacaoUAPorHa} UA/ha)
                        </p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="number"
                          step="5"
                          value={v.areaPastagem}
                          onChange={(e) => updateVariable('areaPastagem', parseFloat(e.target.value) || 1)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Lotação calculada: {r.lotacaoUAPorHa} UA/ha
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Sanitário & Vacinas */}
                  <div className="space-y-1.5 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="font-semibold text-slate-300">Vacinas e Remédios (R$/cab/ano)</span>
                    <input
                      type="number"
                      step="5"
                      value={v.custosSanitariosCabecaAno}
                      onChange={(e) => updateVariable('custosSanitariosCabecaAno', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                    />
                    <p className="text-[10px] text-slate-500">Vermífugo, aftosa e sanidade preventiva</p>
                  </div>

                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* ABA 2: RESULTADOS MÊS A MÊS (FLUXO DE CAIXA DIDÁTICO) */}
      {activeTab === 'resultado' && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* FECHAMENTO DA CONTA DO BOI (DRE DIDÁTICA DO PRODUTOR) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              Fechamento Completo da Conta do Boi (DRE)
            </h4>
            <p className="text-xs text-slate-400">
              Extrato detalhado de compra, custos operacionais e resultado líquido no bolso
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold">Item de Custo / Receita</th>
                    <th className="p-3 font-semibold text-right">Total do Lote</th>
                    <th className="p-3 font-semibold text-right">Por Cabeça</th>
                    <th className="p-3 font-semibold text-right">% do Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="p-3 text-slate-300 font-medium">1. Compra dos Animais (Gado Magro)</td>
                    <td className="p-3 text-right font-bold text-white">R$ {r.custoCompraAnimais.toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right text-slate-300">R$ {Math.round(r.custoCompraAnimais / Math.max(1, v.quantidadeAnimais)).toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right text-slate-400">{r.custoTotal > 0 ? Math.round((r.custoCompraAnimais / r.custoTotal) * 100) : 0}%</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-300 font-medium">2. Alimentação & Ração ({v.diasPermanencia} dias)</td>
                    <td className="p-3 text-right font-bold text-amber-300">R$ {r.custoAlimentacao.toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right text-slate-300">R$ {Math.round(r.custoAlimentacao / Math.max(1, v.quantidadeAnimais)).toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right text-slate-400">{r.custoTotal > 0 ? Math.round((r.custoAlimentacao / r.custoTotal) * 100) : 0}%</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-300 font-medium">3. Arrendamento & Mão de Obra</td>
                    <td className="p-3 text-right font-bold text-slate-200">R$ {(r.custoArrendamento + r.custoMaoDeObra).toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right text-slate-300">R$ {Math.round((r.custoArrendamento + r.custoMaoDeObra) / Math.max(1, v.quantidadeAnimais)).toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right text-slate-400">{r.custoTotal > 0 ? Math.round(((r.custoArrendamento + r.custoMaoDeObra) / r.custoTotal) * 100) : 0}%</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-300 font-medium">4. Sanidade, Seguro & Pastagem</td>
                    <td className="p-3 text-right font-bold text-slate-200">R$ {(r.custoSanitario + r.custoSeguro + r.custoPastagem).toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right text-slate-300">R$ {Math.round((r.custoSanitario + r.custoSeguro + r.custoPastagem) / Math.max(1, v.quantidadeAnimais)).toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right text-slate-400">{r.custoTotal > 0 ? Math.round(((r.custoSanitario + r.custoSeguro + r.custoPastagem) / r.custoTotal) * 100) : 0}%</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-300 font-medium">5. Imposto Senar (1.63%) & Fretes de Venda</td>
                    <td className="p-3 text-right font-bold text-slate-200">R$ {(r.custoImpostosVenda + (r.animaisAbatidos * (v.freteVendaCabeca || 0))).toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right text-slate-300">R$ {Math.round((r.custoImpostosVenda + (r.animaisAbatidos * (v.freteVendaCabeca || 0))) / Math.max(1, r.animaisAbatidos)).toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right text-slate-400">{r.custoTotal > 0 ? Math.round(((r.custoImpostosVenda + (r.animaisAbatidos * (v.freteVendaCabeca || 0))) / r.custoTotal) * 100) : 0}%</td>
                  </tr>
                  <tr className="bg-slate-950 font-bold border-t border-slate-700">
                    <td className="p-3 text-red-300">CUSTO TOTAL DESEMBOLSADO</td>
                    <td className="p-3 text-right text-red-400 text-sm">R$ {r.custoTotal.toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right text-red-400">R$ {r.custoPorCabeca.toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right text-slate-400">100%</td>
                  </tr>
                  <tr className="bg-slate-950/80 font-bold">
                    <td className="p-3 text-slate-200">RECEITA LÍQUIDA DA VENDA</td>
                    <td className="p-3 text-right text-emerald-400 text-sm">R$ {r.receitaLiquida.toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right text-emerald-400">R$ {r.vendaPorCabeca.toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right text-slate-400">-</td>
                  </tr>
                  <tr className="bg-emerald-950/40 font-black border-t-2 border-emerald-500/50">
                    <td className="p-3.5 text-emerald-300 text-sm uppercase">SOBRA LÍQUIDA NO BOLSO</td>
                    <td className="p-3.5 text-right text-emerald-400 text-base sm:text-lg">R$ {r.lucro.toLocaleString('pt-BR')}</td>
                    <td className="p-3.5 text-right text-emerald-400 text-base">R$ {r.lucroPorCabeca.toLocaleString('pt-BR')} /boi</td>
                    <td className="p-3.5 text-right text-emerald-300">{r.margemLiquida}% margem</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Quando entra e sai dinheiro da fazenda?
                </h4>
                <p className="text-xs text-slate-400">
                  Custos mensais de alimentação e o momento das vendas
                </p>
              </div>

              {r.capitalNecessario > 0 ? (
                <div className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
                  Atenção: Necessidade de R$ {r.capitalNecessario.toLocaleString('pt-BR')} em {r.mesCriticoCaixa}
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  Caixa equilibrado durante toda a operação
                </div>
              )}
            </div>

            {/* Gráfico de Barras */}
            <div className="h-60 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={r.fluxoCaixa} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR')}`, '']}
                  />
                  <Legend />
                  <Bar dataKey="receitas" name="Recebimento (Venda)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="custos" name="Desembolso (Custos)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabela de Evolução Simplificada */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="p-3 font-bold">Mês</th>
                  <th className="p-3 font-bold">Recebimento</th>
                  <th className="p-3 font-bold">Despesas</th>
                  <th className="p-3 font-bold">Resultado do Mês</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {r.fluxoCaixa.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-850">
                    <td className="p-3 font-bold text-white">{item.mes}</td>
                    <td className="p-3 text-emerald-400 font-semibold">
                      {item.receitas > 0 ? `R$ ${item.receitas.toLocaleString('pt-BR')}` : '-'}
                    </td>
                    <td className="p-3 text-red-400 font-semibold">R$ {item.custos.toLocaleString('pt-BR')}</td>
                    <td className={`p-3 font-bold ${item.saldoMensal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      R$ {item.saldoMensal.toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ABA 3: DICAS & DIAGNÓSTICO (INSIGHTS DIDÁTICOS) */}
      {activeTab === 'diagnostico' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Diagnóstico Automático da sua Operação
            </h4>
          </div>

          {cenarioAtual.alertas.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
              Operação muito equilibrada! Nenhum risco crítico identificado.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {cenarioAtual.alertas.map((alerta) => {
                const isCritico = alerta.tipo === 'critico';
                const isRisco = alerta.tipo === 'risco';
                const isOportunidade = alerta.tipo === 'oportunidade';

                const bgBadge = isCritico ? 'bg-red-500/20 text-red-400 border-red-500/40' : isRisco ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : isOportunidade ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-blue-500/20 text-blue-400 border-blue-500/40';

                return (
                  <div key={alerta.id} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${bgBadge}`}>
                        {alerta.tipo}
                      </span>
                      <h5 className="font-bold text-xs sm:text-sm text-white">{alerta.titulo}</h5>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{alerta.descricao}</p>
                    
                    {alerta.acaoRecomendada && (
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-emerald-300 flex items-start gap-2">
                        <span className="text-base">💡</span>
                        <div>
                          <strong>Dica Prática:</strong> {alerta.acaoRecomendada}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA 4: COMPARAR CENÁRIOS */}
      {activeTab === 'comparador' && (
        <div className="animate-fadeIn">
          <ComparadorCenários
            cenarios={cenarios}
            cenarioAtualId={cenarioAtual.id}
            onSelectCenario={handleSelectCenario}
          />
        </div>
      )}

      {/* Modal Preencher com IA (com Transcrição por Voz Nativa) */}
      <ModalPreencherIA
        isOpen={modalIAOpen}
        onClose={() => setModalIAOpen(false)}
        onSuccess={handleApplyAI}
      />

    </div>
  );
}
