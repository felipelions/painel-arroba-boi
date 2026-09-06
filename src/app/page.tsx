'use client';

import React, { useState } from 'react';
import { TrendingUp, Database, Calendar, DollarSign, Sliders, Sparkles, BarChart2 } from 'lucide-react';
import { useMarketData } from '../hooks/useMarketData';
import { LoadingScreen } from '../components/LoadingScreen';
import { KPICard } from '../components/KPICard';
import { Filters } from '../components/Filters';
import { PriceChart } from '../components/PriceChart';
import { DataTable } from '../components/DataTable';
import { SimulacaoCenáriosView } from '../components/simulacoes/SimulacaoCenáriosView';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'simulacoes' | 'mercado'>('simulacoes');

  const {
    data,
    snapshot,
    filteredData,
    loading,
    error,
    progress,
    progressText,
    filtros,
    setFiltros,
    applyFilters,
    resetFilters,
    exportCSV,
    options
  } = useMarketData();

  const latestValue = filteredData[filteredData.length - 1]?.valor || 0;
  const previousValue = filteredData[filteredData.length - 2]?.valor || 0;
  const change = latestValue - previousValue;
  const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;

  const avgValue = filteredData.length > 0
    ? filteredData.reduce((sum, d) => sum + d.valor, 0) / filteredData.length
    : 0;

  const minValue = filteredData.length > 0
    ? Math.min(...filteredData.map(d => d.valor))
    : 0;

  const maxValue = filteredData.length > 0
    ? Math.max(...filteredData.map(d => d.valor))
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 pb-20 sm:pb-8">
      {/* Header Fixo */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl">🐂</span>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                  Painel Arroba do Boi
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  Inteligência de Mercado & Simulação Estratégica
                </p>
              </div>
            </div>

            {/* Abas Superiores no Desktop */}
            <nav className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('simulacoes')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'simulacoes'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Simulações de Cenários</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-300 font-bold">
                  IA
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('mercado')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'mercado'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Cotações CEPEA</span>
              </button>
            </nav>

            {/* Total de Registros (quando no mercado) */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
              <Database className="w-4 h-4" />
              <span>{snapshot?.totalRegistros.toLocaleString('pt-BR') || 0} registros</span>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* ABA 1: SIMULAÇÕES DE CENÁRIOS (Nova Tela Requisitada) */}
        {activeTab === 'simulacoes' && (
          <SimulacaoCenáriosView />
        )}

        {/* ABA 2: COTAÇÕES DE MERCADO (Dashboard CEPEA Existente) */}
        {activeTab === 'mercado' && (
          <div className="space-y-6">
            {loading ? (
              <LoadingScreen progress={progress} text={progressText} />
            ) : error ? (
              <div className="min-h-[40vh] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <h2 className="text-xl font-bold text-red-400">Erro ao carregar dados</h2>
                  <p className="text-slate-400 text-sm">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl transition-colors"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Filtros */}
                <Filters
                  filtros={filtros}
                  onChange={setFiltros}
                  onApply={applyFilters}
                  options={options}
                  totalFiltered={filteredData.length}
                  totalTotal={data.length}
                  onReset={resetFilters}
                />

                {filteredData.length === 0 && (
                  <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
                    <p className="text-slate-300 font-semibold text-sm">
                      Nenhum registro encontrado para os filtros selecionados.
                    </p>
                    <p className="text-slate-500 text-xs">
                      Tente ampliar o período ou selecionar outras opções.
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      Restaurar Filtros Padrão
                    </button>
                  </div>
                )}

                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    title="Cotação Atual"
                    value={`R$ ${latestValue.toFixed(2)}`}
                    subtitle="por arroba"
                    trend={change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'}
                    trendValue={`${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`}
                    icon={<DollarSign className="w-5 h-5" />}
                  />

                  <KPICard
                    title="Média do Período"
                    value={`R$ ${avgValue.toFixed(2)}`}
                    subtitle={`${filteredData.length} registros`}
                    icon={<TrendingUp className="w-5 h-5" />}
                  />

                  <KPICard
                    title="Mínima"
                    value={`R$ ${minValue.toFixed(2)}`}
                    subtitle="menor valor"
                    icon={<Calendar className="w-5 h-5" />}
                  />

                  <KPICard
                    title="Máxima"
                    value={`R$ ${maxValue.toFixed(2)}`}
                    subtitle="maior valor"
                    icon={<Calendar className="w-5 h-5" />}
                  />
                </div>

                {/* Gráfico */}
                <PriceChart data={filteredData} />

                {/* Tabela */}
                <DataTable data={filteredData} onExport={exportCSV} />
              </>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-6 border-t border-slate-800/80 mt-12">
        <p>Painel de Simulação Estratégica & Inteligência Pecuária</p>
        <p className="mt-1">
          CEPEA (Zenodo) + CotacaoDoDia.com • Persistência Local em JSON (Sem Banco de Dados)
        </p>
      </footer>

      {/* Barra de Navegação Inferior Fixa no Mobile (100% Mobile-First) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around py-2 px-4 shadow-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('simulacoes')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'simulacoes' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Sparkles className={`w-5 h-5 ${activeTab === 'simulacoes' ? 'animate-pulse' : ''}`} />
          <span className="text-[10px]">Simulações IA</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mercado')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'mercado' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px]">Cotações</span>
        </button>
      </nav>

    </div>
  );
}

