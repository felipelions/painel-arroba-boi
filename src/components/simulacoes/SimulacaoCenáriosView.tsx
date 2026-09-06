'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Save,
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
  Maximize2,
  Zap,
  Info,
  ChevronDown,
  RefreshCw,
  Pencil,
  Check,
  X
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
  const [activeTab, setActiveTab] = useState<'variaveis' | 'resultados' | 'sensibilidade' | 'alertas' | 'comparar'>('variaveis');
  const [modoRapido, setModoRapido] = useState(true);
  const [modalIAOpen, setModalIAOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'salvo' | 'salvando' | 'erro'>('salvo');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDescValue, setEditDescValue] = useState('');
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

  // Recalcula a simulação e agenda salvamento automático
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
    StorageService.debounceAutoSave(cenarioAtualizado, 600, (success) => {
      setSaveStatus(success ? 'salvo' : 'erro');
    });
  }

  // Seleciona outro cenário
  function handleSelectCenario(id: string) {
    const selected = cenarios.find(c => c.id === id);
    if (selected) {
      setCenarioAtual(selected);
      StorageService.setActiveScenarioId(selected.id);
      setIsEditingTitle(false);
      setIsEditingDesc(false);
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

  async function handleSaveDesc() {
    if (!cenarioAtual) return;
    const newDesc = editDescValue.trim();
    const updated: CenarioCompleto = {
      ...cenarioAtual,
      descricao: newDesc,
      dataAtualizacao: new Date().toISOString()
    };
    setCenarioAtual(updated);
    setCenarios(prev => prev.map(c => c.id === updated.id ? updated : c));
    setIsEditingDesc(false);
    await StorageService.saveScenario(updated);
    showToast('Descrição do cenário atualizada');
  }

  // Cria novo cenário
  async function handleNovoCenario() {
    if (!cenarioAtual) return;
    const novo: CenarioCompleto = {
      id: `cenario_${Date.now()}`,
      nome: `Novo Cenário ${cenarios.length + 1}`,
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
    showToast('Novo cenário criado com sucesso!');
  }

  // Duplica cenário
  async function handleDuplicar() {
    if (!cenarioAtual) return;
    const duplicated = await StorageService.duplicateScenario(cenarioAtual.id);
    if (duplicated) {
      setCenarios(prev => [...prev, duplicated]);
      setCenarioAtual(duplicated);
      StorageService.setActiveScenarioId(duplicated.id);
      showToast(`Cenário duplicado: "${duplicated.nome}"`);
    }
  }

  // Exclui cenário
  async function handleExcluir() {
    if (!cenarioAtual) return;
    if (cenarios.length <= 1) {
      alert('Você não pode excluir o único cenário existente.');
      return;
    }
    if (!confirm(`Deseja realmente excluir o cenário "${cenarioAtual.nome}"?`)) return;

    await StorageService.deleteScenario(cenarioAtual.id);
    const restantes = cenarios.filter(c => c.id !== cenarioAtual.id);
    setCenarios(restantes);
    setCenarioAtual(restantes[0]);
    StorageService.setActiveScenarioId(restantes[0].id);
    showToast('Cenário excluído.');
  }

  // Exporta JSON
  function handleExportar() {
    if (!cenarioAtual) return;
    StorageService.exportScenarioJSON(cenarioAtual);
    showToast('Arquivo JSON do cenário baixado!');
  }

  // Importa JSON
  function handleImportar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const imported = StorageService.importScenarioJSON(text);
        // Recalcula para garantir consistência
        imported.resultados = SimulationEngine.calculate(imported.variaveis, imported.fazenda);
        imported.alertas = InsightEngine.generateInsights(imported.variaveis, imported.resultados, imported.fazenda);

        await StorageService.saveScenario(imported);
        setCenarios(prev => [...prev, imported]);
        setCenarioAtual(imported);
        StorageService.setActiveScenarioId(imported.id);
        showToast(`Cenário "${imported.nome}" importado com sucesso!`);
      } catch (err: any) {
        alert('Erro ao importar JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  }

  // Aplicação dos dados preenchidos pela IA
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
    showToast('✨ Cenário atualizado pela IA com sucesso!');
  }

  if (loading || !cenarioAtual) {
    return (
      <div className="p-8 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
        Carregando painel de simulação...
      </div>
    );
  }

  const v = cenarioAtual.variaveis;
  const r = cenarioAtual.resultados;
  const f = cenarioAtual.fazenda;

  return (
    <div className="space-y-6">
      
      {/* Toast flutuante de notificação */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 px-4 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      {/* Input de arquivo invisível para importação */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportar}
        accept=".json"
        className="hidden"
      />

      {/* 1. Header do Cenário & Barra de Ações (Mobile-First) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-sm shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
              <span>{f.nome}</span>
              <span>•</span>
              <span>{f.municipio} - {f.estado}</span>
              <span>•</span>
              <span className="hidden sm:inline">{f.areaProdutiva} ha produtivos</span>
            </div>
            
            {/* Título do Cenário (com Edição) */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2 mt-1 max-w-lg">
                <input
                  type="text"
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  autoFocus
                  placeholder="Nome do cenário..."
                  className="text-base sm:text-xl font-bold text-white bg-slate-950 px-3 py-1.5 rounded-xl border border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-full"
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  title="Salvar título"
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shrink-0 shadow-md"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(false)}
                  title="Cancelar"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>{cenarioAtual.nome}</span>
                  {cenarioAtual.isBase && (
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Base
                    </span>
                  )}
                </h2>

                <button
                  type="button"
                  onClick={() => {
                    setEditTitleValue(cenarioAtual.nome);
                    setIsEditingTitle(true);
                  }}
                  title="Editar título do cenário"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                {/* Seletor de Cenários Rápido */}
                {cenarios.length > 1 && (
                  <select
                    value={cenarioAtual.id}
                    onChange={(e) => handleSelectCenario(e.target.value)}
                    className="text-xs font-semibold text-slate-400 hover:text-white bg-slate-950/80 border border-slate-700 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                  >
                    {cenarios.map(c => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        Alternar: {c.nome} {c.isBase ? '(Base)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Descrição do Cenário (com Edição) */}
            {isEditingDesc ? (
              <div className="flex items-center gap-2 mt-1 max-w-lg">
                <input
                  type="text"
                  value={editDescValue}
                  onChange={(e) => setEditDescValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveDesc();
                    if (e.key === 'Escape') setIsEditingDesc(false);
                  }}
                  autoFocus
                  placeholder="Descrição da estratégia..."
                  className="text-xs text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-emerald-500 focus:outline-none w-full"
                />
                <button
                  type="button"
                  onClick={handleSaveDesc}
                  className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingDesc(false)}
                  className="p-1 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-slate-400 line-clamp-1">
                  {cenarioAtual.descricao || 'Sem descrição definida.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditDescValue(cenarioAtual.descricao || '');
                    setIsEditingDesc(true);
                  }}
                  title="Editar descrição"
                  className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                >
                  <Pencil className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>

          {/* Botões de Ação Principais */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Botão de Destaque: Preencher com IA */}
            <button
              type="button"
              onClick={() => setModalIAOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-950/60 flex items-center gap-2 transition-all transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-emerald-100 animate-pulse" />
              <span>Preencher com IA</span>
            </button>

            {/* Novo Cenário */}
            <button
              type="button"
              onClick={handleNovoCenario}
              title="Criar novo cenário"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Duplicar */}
            <button
              type="button"
              onClick={handleDuplicar}
              title="Duplicar cenário atual"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* Exportar JSON */}
            <button
              type="button"
              onClick={handleExportar}
              title="Exportar JSON local"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Importar JSON */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Importar JSON de cenário"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Excluir */}
            {cenarios.length > 1 && (
              <button
                type="button"
                onClick={handleExcluir}
                title="Excluir cenário"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-300 border border-slate-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status de Salvamento Automático */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${saveStatus === 'salvo' ? 'bg-emerald-400' : saveStatus === 'salvando' ? 'bg-amber-400 animate-pulse' : 'bg-red-400'}`} />
            <span>
              {saveStatus === 'salvo' && 'Armazenado no servidor (JSON local)'}
              {saveStatus === 'salvando' && 'Salvando alterações...'}
              {saveStatus === 'erro' && 'Erro ao persistir localmente'}
            </span>
          </div>
          <span className="text-slate-500">
            Atualizado às {new Date(cenarioAtual.dataAtualizacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* 2. Grid de Cards Principais de Indicadores (KPIs Estratégicos) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Lucro Projetado */}
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Lucro Projetado</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            R$ {r.lucro.toLocaleString('pt-BR')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Margem Líquida: <strong className="text-white">{r.margemLiquida}%</strong>
          </div>
        </div>

        {/* Receita Líquida */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Receita Líquida</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-white">
            R$ {r.receitaLiquida.toLocaleString('pt-BR')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Bruta: R$ {(r.receitaBruta / 1000).toFixed(0)} mil
          </div>
        </div>

        {/* Capital Necessário (Maior Déficit) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Capital Necessário</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-white">
            R$ {r.capitalNecessario.toLocaleString('pt-BR')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {r.mesCriticoCaixa}
          </div>
        </div>

        {/* Produção Arrobas */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Produção Total</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-white">
            {r.producaoArrobas.toLocaleString('pt-BR')} @
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {r.arrobasHectare} @/ha • {r.animaisAbatidos} cab
          </div>
        </div>

        {/* Ponto de Equilíbrio e Risco */}
        <div className="col-span-2 sm:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold">Equilíbrio (@)</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.scoreRisco <= 25 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : r.scoreRisco <= 50 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                Risco {r.scoreRisco}/100
              </span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-white">
              R$ {r.precoEquilibrio.toFixed(2)}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Margem segur.: <strong className={r.margemSeguranca >= 10 ? 'text-emerald-400' : 'text-amber-400'}>{r.margemSeguranca}%</strong>
          </div>
        </div>

      </div>

      {/* 3. Navegação por Abas Responsiva (Mobile-First) */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-1">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          
          <button
            type="button"
            onClick={() => setActiveTab('variaveis')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'variaveis' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Variáveis da Operação</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('resultados')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'resultados' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Fluxo de Caixa & Gráficos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sensibilidade')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'sensibilidade' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Sensibilidade & Equilíbrio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alertas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'alertas' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Insights ({cenarioAtual.alertas.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comparar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'comparar' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Comparar Cenários</span>
          </button>

        </div>

        {/* Alternador Rápido vs Avançado quando na aba Variáveis */}
        {activeTab === 'variaveis' && (
          <button
            type="button"
            onClick={() => setModoRapido(!modoRapido)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{modoRapido ? 'Modo Rápido (10 vars)' : 'Modo Completo'}</span>
          </button>
        )}
      </div>

      {/* 4. Conteúdo das Abas */}
      
      {/* ABA 1: VARIÁVEIS */}
      {activeTab === 'variaveis' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Seletor Rápido vs Completo no Mobile */}
          <div className="sm:hidden flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Exibição de variáveis:</span>
            <button
              type="button"
              onClick={() => setModoRapido(!modoRapido)}
              className="px-2.5 py-1 rounded-md bg-slate-800 text-emerald-400 font-bold border border-slate-700"
            >
              {modoRapido ? 'Modo Rápido' : 'Modo Avançado'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Bloco 1: Mercado & Preços */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Mercado & Cotações
              </h4>

              {/* Preço Projetado da Arroba */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Preço Projetado da Arroba (@)</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">R$</span>
                    <input
                      type="number"
                      value={v.precoProjetadoArroba}
                      onChange={(e) => updateVariable('precoProjetadoArroba', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white text-right font-bold text-xs"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="240"
                  max="420"
                  step="1"
                  value={v.precoProjetadoArroba}
                  onChange={(e) => updateVariable('precoProjetadoArroba', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>R$ 240</span>
                  <span>R$ 330</span>
                  <span>R$ 420</span>
                </div>
              </div>

              {/* Preço do Bezerro / Boi Magro */}
              {!modoRapido && (
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Preço do Boi Magro (R$/cab)</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">R$</span>
                      <input
                        type="number"
                        value={v.precoBoiMagro}
                        onChange={(e) => updateVariable('precoBoiMagro', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white text-right font-bold text-xs"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="2500"
                    max="5500"
                    step="50"
                    value={v.precoBoiMagro}
                    onChange={(e) => updateVariable('precoBoiMagro', parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Preço do Milho */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Preço do Milho (R$/saca 60kg)</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">R$</span>
                    <input
                      type="number"
                      value={v.precoMilho}
                      onChange={(e) => updateVariable('precoMilho', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white text-right font-bold text-xs"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="40"
                  max="120"
                  step="1"
                  value={v.precoMilho}
                  onChange={(e) => updateVariable('precoMilho', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

            </div>

            {/* Bloco 2: Rebanho & Desempenho Animal */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Produção & Zootecnia
              </h4>

              {/* Quantidade de Animais */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Quantidade de Animais (Cabeças)</span>
                  <input
                    type="number"
                    value={v.quantidadeAnimais}
                    onChange={(e) => updateVariable('quantidadeAnimais', parseInt(e.target.value, 10) || 0)}
                    className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white text-right font-bold text-xs"
                  />
                </div>
                <input
                  type="range"
                  min="50"
                  max="3000"
                  step="10"
                  value={v.quantidadeAnimais}
                  onChange={(e) => updateVariable('quantidadeAnimais', parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Ganho Médio Diário (GMD) */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Ganho Médio Diário (GMD kg/dia)</span>
                  <input
                    type="number"
                    step="0.05"
                    value={v.gmd}
                    onChange={(e) => updateVariable('gmd', parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white text-right font-bold text-xs"
                  />
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="1.8"
                  step="0.05"
                  value={v.gmd}
                  onChange={(e) => updateVariable('gmd', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>0.4 kg (Pasto seco)</span>
                  <span>1.0 kg (Semi)</span>
                  <span>1.8 kg (Confin.)</span>
                </div>
              </div>

              {/* Dias de Permanência */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Dias de Permanência (Trato)</span>
                  <input
                    type="number"
                    value={v.diasPermanencia}
                    onChange={(e) => updateVariable('diasPermanencia', parseInt(e.target.value, 10) || 0)}
                    className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white text-right font-bold text-xs"
                  />
                </div>
                <input
                  type="range"
                  min="30"
                  max="365"
                  step="5"
                  value={v.diasPermanencia}
                  onChange={(e) => updateVariable('diasPermanencia', parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

            </div>

            {/* Bloco 3: Nutrição & Custos da Operação */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Nutrição & Estratégia Alimentar
              </h4>

              {/* Estratégia Nutricional */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Estratégia Nutricional:</label>
                <select
                  value={v.estrategiaNutricional}
                  onChange={(e) => updateVariable('estrategiaNutricional', e.target.value as any)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                >
                  <option value="pasto_mineral">Pasto + Sal Mineral (Custo Baixo, GMD 0.5-0.7kg)</option>
                  <option value="proteinado_aguas">Pasto + Proteinado Águas (GMD 0.7-0.9kg)</option>
                  <option value="proteinado_seca">Pasto + Proteinado Seca (GMD 0.6-0.8kg)</option>
                  <option value="semi_confinamento">Semi-confinamento (GMD 1.0-1.3kg)</option>
                  <option value="confinamento_total">Confinamento Total (GMD 1.3-1.7kg)</option>
                </select>
              </div>

              {/* Custo Animal/Dia */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Custo Alimentar (R$/animal/dia)</span>
                  <input
                    type="number"
                    step="0.5"
                    value={v.custoAnimalDia}
                    onChange={(e) => updateVariable('custoAnimalDia', parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white text-right font-bold text-xs"
                  />
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.2"
                  value={v.custoAnimalDia}
                  onChange={(e) => updateVariable('custoAnimalDia', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Custos Fixos Mensais */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Custos Fixos Mensais da Fazenda (R$)</span>
                  <input
                    type="number"
                    step="1000"
                    value={v.custosFixosMensais}
                    onChange={(e) => updateVariable('custosFixosMensais', parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white text-right font-bold text-xs"
                  />
                </div>
                <input
                  type="range"
                  min="5000"
                  max="80000"
                  step="1000"
                  value={v.custosFixosMensais}
                  onChange={(e) => updateVariable('custosFixosMensais', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

            </div>

            {/* Bloco 4: Pastagem, Clima & Financeiro */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Pastagem, Clima & Capital
              </h4>

              {/* Cenário Climático */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Cenário Climático:</label>
                <select
                  value={v.cenarioClimatico}
                  onChange={(e) => updateVariable('cenarioClimatico', e.target.value as any)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                >
                  <option value="normal">Normal (Chuvas regulares)</option>
                  <option value="seca_moderada">Seca Moderada (-15% pasto)</option>
                  <option value="seca_severa">Seca Severa (-25% pasto, risco elevado)</option>
                  <option value="excesso_chuva">Excesso de Chuva</option>
                </select>
              </div>

              {/* Capital Inicial Disponível */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Capital Próprio Disponível (R$)</span>
                  <input
                    type="number"
                    step="20000"
                    value={v.capitalDisponivel}
                    onChange={(e) => updateVariable('capitalDisponivel', parseFloat(e.target.value) || 0)}
                    className="w-28 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white text-right font-bold text-xs"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="2000000"
                  step="25000"
                  value={v.capitalDisponivel}
                  onChange={(e) => updateVariable('capitalDisponivel', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Mortalidade Esperada */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Mortalidade Esperada (%)</span>
                  <span className="font-bold text-white">{(v.mortalidade * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.05"
                  step="0.005"
                  value={v.mortalidade}
                  onChange={(e) => updateVariable('mortalidade', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ABA 2: RESULTADOS & FLUXO DE CAIXA */}
      {activeTab === 'resultados' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Gráfico de Fluxo de Caixa Mensal */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Projeção de Fluxo de Caixa (Mês a Mês)
                </h4>
                <p className="text-xs text-slate-400">
                  Receitas de venda vs despesas com nutrição, custos fixos e insumos
                </p>
              </div>

              {r.capitalNecessario > 0 ? (
                <div className="px-3 py-1 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                  Maior déficit: R$ {r.capitalNecessario.toLocaleString('pt-BR')} ({r.mesCriticoCaixa})
                </div>
              ) : (
                <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  Caixa positivo em todo o ciclo
                </div>
              )}
            </div>

            <div className="h-64 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={r.fluxoCaixa} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR')}`, '']}
                  />
                  <Legend />
                  <Bar dataKey="receitas" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="custos" name="Custos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Saldo Acumulado */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Evolução do Saldo Acumulado de Caixa
            </h4>
            <div className="h-48 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={r.fluxoCaixa} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR')}`, 'Saldo']}
                  />
                  <Line type="monotone" dataKey="saldoAcumulado" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabela do Fluxo de Caixa */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="p-3 font-semibold">Mês</th>
                  <th className="p-3 font-semibold">Receitas</th>
                  <th className="p-3 font-semibold">Custos</th>
                  <th className="p-3 font-semibold">Saldo do Mês</th>
                  <th className="p-3 font-semibold">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {r.fluxoCaixa.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="p-3 font-bold text-white">{item.mes}</td>
                    <td className="p-3 text-emerald-400">R$ {item.receitas.toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-red-400">R$ {item.custos.toLocaleString('pt-BR')}</td>
                    <td className={`p-3 font-medium ${item.saldoMensal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      R$ {item.saldoMensal.toLocaleString('pt-BR')}
                    </td>
                    <td className={`p-3 font-bold ${item.saldoAcumulado >= 0 ? 'text-slate-200' : 'text-red-400'}`}>
                      R$ {item.saldoAcumulado.toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ABA 3: SENSIBILIDADE & PONTO DE EQUILÍBRIO */}
      {activeTab === 'sensibilidade' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Card de Ponto de Equilíbrio em Grande Destaque (Seção 40) */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                Preço de Equilíbrio (Breakeven)
              </div>
              <div className="text-3xl sm:text-5xl font-black text-white mt-1">
                R$ {r.precoEquilibrio.toFixed(2)}
                <span className="text-sm font-normal text-slate-400 ml-2">/ arroba</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Preço projetado de venda: <strong>R$ {v.precoProjetadoArroba.toFixed(2)}/@</strong> • Margem de Segurança: <strong className="text-emerald-400">+{r.margemSeguranca}%</strong>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400">Arrobas por Hectare: <strong className="text-white">{r.arrobasHectare} @/ha</strong></div>
              <div className="text-slate-400">Lucro por Hectare: <strong className="text-emerald-400">R$ {r.lucroHectare.toLocaleString('pt-BR')}</strong></div>
              <div className="text-slate-400">Retorno sobre Capital (ROI): <strong className="text-blue-400">{r.roi}%</strong></div>
            </div>
          </div>

          {/* Análise de Sensibilidade: O que mais impacta meu resultado? (Seção 42) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                O que mais impacta meu resultado financeiro?
              </h4>
              <p className="text-xs text-slate-400">
                Simulação de oscilação de ±10% nas variáveis críticas da fazenda
              </p>
            </div>

            <div className="space-y-3">
              {r.sensibilidade.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-white">{item.fator}</div>
                    <div className="text-[11px] text-slate-400">
                      Impacto total de amplitude: R$ {item.diferenca.toLocaleString('pt-BR')}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-red-400 font-medium">
                      -10%: R$ {item.impactoMenos10.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-emerald-400 font-medium">
                      +10%: +R$ {item.impactoMais10.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ABA 4: INSIGHTS & ALERTAS */}
      {activeTab === 'alertas' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Diagnóstico Inteligente da Propriedade ({cenarioAtual.alertas.length})
            </h4>
          </div>

          {cenarioAtual.alertas.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
              Nenhum alerta ou risco identificado na configuração atual.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {cenarioAtual.alertas.map((alerta) => {
                const isCritico = alerta.tipo === 'critico';
                const isRisco = alerta.tipo === 'risco';
                const isOportunidade = alerta.tipo === 'oportunidade';
                const isAtencao = alerta.tipo === 'atencao';

                const borderColor = isCritico ? 'border-red-500/40 bg-red-950/20' : isRisco ? 'border-amber-500/40 bg-amber-950/20' : isOportunidade ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-blue-500/40 bg-blue-950/20';

                return (
                  <div key={alerta.id} className={`p-4 rounded-2xl border ${borderColor} space-y-2`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        {isCritico && <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 text-[10px] font-bold">CRÍTICO</span>}
                        {isRisco && <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-bold">RISCO</span>}
                        {isOportunidade && <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">OPORTUNIDADE</span>}
                        {isAtencao && <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[10px] font-bold">ATENÇÃO</span>}
                        <span>{alerta.titulo}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300">{alerta.descricao}</p>
                    <div className="text-xs text-slate-400">
                      <strong>Impacto:</strong> {alerta.impacto}
                    </div>

                    {alerta.acaoRecomendada && (
                      <div className="pt-2 border-t border-slate-800/60 text-xs text-emerald-300 font-medium">
                        💡 <strong>Recomendação:</strong> {alerta.acaoRecomendada}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA 5: COMPARAR CENÁRIOS */}
      {activeTab === 'comparar' && (
        <div className="animate-fadeIn">
          <ComparadorCenários
            cenarios={cenarios}
            cenarioAtualId={cenarioAtual.id}
            onSelectCenario={handleSelectCenario}
          />
        </div>
      )}

      {/* Modal Preencher com IA */}
      <ModalPreencherIA
        isOpen={modalIAOpen}
        onClose={() => setModalIAOpen(false)}
        onSuccess={handleApplyAI}
      />

    </div>
  );
}

