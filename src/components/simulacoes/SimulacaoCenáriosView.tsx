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
  Scale
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

export function SimulacaoCenáriosView() {
  const [cenarios, setCenarios] = useState<CenarioCompleto[]>([]);
  const [cenarioAtual, setCenarioAtual] = useState<CenarioCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Abas didáticas simplificadas
  const [activeTab, setActiveTab] = useState<'simulador' | 'resultado' | 'diagnostico' | 'comparador'>('simulador');
  
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
      const list = await StorageService.listScenarios();
      setCenarios(list);
      if (list.length > 0) {
        const activeId = StorageService.getActiveScenarioId();
        const found = list.find(c => c.id === activeId) || list[0];
        setCenarioAtual(found);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  // Recalcula simulação e salva com debounce
  function updateVariable<K extends keyof CenarioVariaveis>(key: K, value: CenarioVariaveis[K]) {
    if (!cenarioAtual) return;

    const novasVariaveis: CenarioVariaveis = {
      ...cenarioAtual.variaveis,
      [key]: value
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
  const diferencaLucroBase = r.lucro - cenarioBase.resultados.lucro;

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

      {/* 2. O TERMÔMETRO DO PRODUTOR (O que sobra no bolso, preço de empate e caixa) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Card 1: Lucro Líquido no Bolso */}
        <div className="sm:col-span-2 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border-2 border-emerald-500/40 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <span className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4" />
              Lucro Estimado no Bolso
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-500/30">
              Margem {r.margemLiquida}%
            </span>
          </div>

          <div className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-1">
            R$ {r.lucro.toLocaleString('pt-BR')}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <div>
              Receita Total da Venda: <strong className="text-slate-200">R$ {r.receitaLiquida.toLocaleString('pt-BR')}</strong>
            </div>
            {diferencaLucroBase !== 0 && !cenarioAtual.isBase && (
              <div className={`font-bold flex items-center gap-1 ${diferencaLucroBase > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                <ArrowUpRight className="w-3.5 h-3.5" />
                {diferencaLucroBase > 0 ? '+' : ''}R$ {diferencaLucroBase.toLocaleString('pt-BR')} que o plano base
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Preço de Empate (Breakeven Didático) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-amber-400" />
                Preço de Empate
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                r.margemSeguranca >= 15 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                +{r.margemSeguranca}% folga
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              R$ {r.precoEquilibrio.toFixed(2)}
              <span className="text-xs font-normal text-slate-400 ml-1">/@</span>
            </div>

            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Preço mínimo de venda para não ter prejuízo. Vendendo a R$ {v.precoProjetadoArroba.toFixed(2)}, você está protegido.
            </p>
          </div>

          {/* Risco da Operação */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Risco:</span>
            <span className={`font-bold ${
              r.scoreRisco <= 25 ? 'text-emerald-400' : r.scoreRisco <= 50 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {r.scoreRisco}/100 ({r.classificacaoRisco})
            </span>
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
            
            {/* CONTROLE 1: PREÇO DA ARROBA */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Preço de Venda da Arroba (@)
                  </h4>
                  <p className="text-[11px] text-slate-400">Quanto você espera receber no frigorífico</p>
                </div>
                <div className="text-lg font-black text-emerald-400">
                  R$ {v.precoProjetadoArroba.toFixed(2)}
                </div>
              </div>

              {/* Botões Tácteis Grandões de + e - */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => adjustNumber('precoProjetadoArroba', -5, 200, 500)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  - R$ 5
                </button>
                <button
                  type="button"
                  onClick={() => adjustNumber('precoProjetadoArroba', -1, 200, 500)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  - R$ 1
                </button>
                <input
                  type="range"
                  min="240"
                  max="420"
                  step="1"
                  value={v.precoProjetadoArroba}
                  onChange={(e) => updateVariable('precoProjetadoArroba', parseFloat(e.target.value))}
                  className="flex-1 accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => adjustNumber('precoProjetadoArroba', 1, 200, 500)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  + R$ 1
                </button>
                <button
                  type="button"
                  onClick={() => adjustNumber('precoProjetadoArroba', 5, 200, 500)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  + R$ 5
                </button>
              </div>
            </div>

            {/* CONTROLE 2: QUANTIDADE DE BOIS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Quantidade de Bois no Lote
                  </h4>
                  <p className="text-[11px] text-slate-400">Cabeças que serão engordadas</p>
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
            </div>

            {/* CONTROLE 3: GANHO MÉDIO DIÁRIO (GMD) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Ganho de Peso por Dia (GMD)
                  </h4>
                  <p className="text-[11px] text-slate-400">Quantos quilos o boi engorda por dia</p>
                </div>
                <div className="text-lg font-black text-amber-400">
                  {v.gmd.toFixed(2)} <span className="text-xs font-normal text-slate-400">kg/dia</span>
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
                  onClick={() => adjustNumber('gmd', -0.05, 0.3, 2.0)}
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
                  onClick={() => adjustNumber('gmd', 0.05, 0.3, 2.0)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  +0.05
                </button>
              </div>
            </div>

            {/* CONTROLE 4: DIAS DE TRATO (PERMANÊNCIA) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
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
                {[60, 90, 120, 180].map((dias) => (
                  <button
                    key={dias}
                    type="button"
                    onClick={() => updateVariable('diasPermanencia', dias)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold border ${v.diasPermanencia === dias ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                  >
                    {dias} dias
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
            </div>

            {/* CONTROLE 5: PESO DE ENTRADA & SAÍDA */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Peso Vivo de Entrada
                  </h4>
                  <p className="text-[11px] text-slate-400">Peso médio que o animal entra no lote</p>
                </div>
                <div className="text-lg font-black text-white">
                  {v.pesoMedioAtual} <span className="text-xs font-normal text-slate-400">kg</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustNumber('pesoMedioAtual', -10, 180, 550)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  -10kg
                </button>
                <input
                  type="range"
                  min="200"
                  max="480"
                  step="5"
                  value={v.pesoMedioAtual}
                  onChange={(e) => updateVariable('pesoMedioAtual', parseInt(e.target.value, 10))}
                  className="flex-1 accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => adjustNumber('pesoMedioAtual', 10, 180, 550)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  +10kg
                </button>
              </div>

              <div className="text-[11px] text-slate-400 pt-1 flex justify-between border-t border-slate-800/60">
                <span>Peso final projetado: <strong className="text-emerald-400">{Math.round(v.pesoMedioAtual + v.gmd * v.diasPermanencia)} kg</strong></span>
                <span>Rendimento carcaça: <strong className="text-white">{(v.rendimentoCarcaca * 100).toFixed(0)}%</strong></span>
              </div>
            </div>

            {/* CONTROLE 6: CUSTO DA COMIDA POR DIA */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Custo de Comida por Boi / Dia
                  </h4>
                  <p className="text-[11px] text-slate-400">Gasto diário com ração, sal e trato</p>
                </div>
                <div className="text-lg font-black text-amber-400">
                  R$ {v.custoAnimalDia.toFixed(2)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustNumber('custoAnimalDia', -0.5, 1, 30)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  - R$ 0.50
                </button>
                <input
                  type="range"
                  min="2"
                  max="18"
                  step="0.5"
                  value={v.custoAnimalDia}
                  onChange={(e) => updateVariable('custoAnimalDia', parseFloat(e.target.value))}
                  className="flex-1 accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => adjustNumber('custoAnimalDia', 0.5, 1, 30)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  + R$ 0.50
                </button>
              </div>

              <div className="text-[11px] text-slate-400 pt-1 flex justify-between border-t border-slate-800/60">
                <span>Custo alimentar no período: <strong className="text-white">R$ {r.custoAlimentacao.toLocaleString('pt-BR')}</strong></span>
              </div>
            </div>

          </div>

          {/* ACORDEÃO DE CUSTOS DETALHADOS (Simples e Expansível) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <button
              type="button"
              onClick={() => setShowAdvancedCosts(!showAdvancedCosts)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Outros Custos da Fazenda</h4>
                  <p className="text-[11px] text-slate-400">Custos fixos, remédios, frete e pastagem</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{showAdvancedCosts ? 'Ocultar' : 'Ajustar'}</span>
                {showAdvancedCosts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showAdvancedCosts && (
              <div className="p-4 border-t border-slate-800 space-y-4 text-xs animate-fadeIn bg-slate-950/40">
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Custos Fixos */}
                  <div className="space-y-1.5 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="font-semibold text-slate-300">Custos Fixos Mensais (R$)</span>
                    <input
                      type="number"
                      step="1000"
                      value={v.custosFixosMensais}
                      onChange={(e) => updateVariable('custosFixosMensais', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                    />
                    <p className="text-[10px] text-slate-500">Funcionários, energia, manutenção</p>
                  </div>

                  {/* Sanitário */}
                  <div className="space-y-1.5 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="font-semibold text-slate-300">Vacinas e Remédios (R$/cab/ano)</span>
                    <input
                      type="number"
                      step="5"
                      value={v.custosSanitariosCabecaAno}
                      onChange={(e) => updateVariable('custosSanitariosCabecaAno', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                    />
                    <p className="text-[10px] text-slate-500">Vermífugo, aftosa, mineral sanitário</p>
                  </div>

                  {/* Clima */}
                  <div className="space-y-1.5 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="font-semibold text-slate-300">Condição do Clima</span>
                    <select
                      value={v.cenarioClimatico}
                      onChange={(e) => updateVariable('cenarioClimatico', e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                    >
                      <option value="normal">Normal (Chuva adequada)</option>
                      <option value="seca_moderada">Seca Moderada</option>
                      <option value="seca_severa">Seca Severa (Pasto seco)</option>
                    </select>
                    <p className="text-[10px] text-slate-500">Impacta disponibilidade de capim</p>
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
