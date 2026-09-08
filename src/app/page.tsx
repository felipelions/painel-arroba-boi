'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Database, Calendar, DollarSign, Sparkles, BarChart2, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { useMarketData } from '../hooks/useMarketData';
import { LoadingScreen } from '../components/LoadingScreen';
import { KPICard } from '../components/KPICard';
import { Filters } from '../components/Filters';
import { PriceChart } from '../components/PriceChart';
import { DataTable } from '../components/DataTable';
import { SimulacaoCenáriosView } from '../components/simulacoes/SimulacaoCenáriosView';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulacoes' | 'mercado'>('simulacoes');

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-400">Carregando painel mobile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 sm:pb-8 selection:bg-emerald-500 selection:text-white">
      
      {/* Header Fixo Mobile & Desktop com Efeito de Vidro */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 shadow-md">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-xl shadow-lg shadow-emerald-950/60 shrink-0">
                🐂
              </div>
              <div>
                <h1 className="text-sm sm:text-lg font-black text-white flex items-center gap-2 tracking-tight">
                  Painel Arroba Boi
                  <span className="hidden xs:inline-block text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    PWA Offline
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
                  Simulador de Margem & Cotações CEPEA
                </p>
              </div>
            </div>

            {/* Abas Superiores no Desktop */}
            <nav className="hidden sm:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('simulacoes')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'simulacoes'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'mercado'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Cotações CEPEA</span>
              </button>
            </nav>

            {/* Total de Registros (quando no mercado) */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Database className="w-4 h-4 text-emerald-500" />
              <span>{(snapshot?.totalRegistros ?? 0).toLocaleString('pt-BR')} registros</span>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6">
        
        {/* ABA 1: SIMULAÇÕES DE CENÁRIOS */}
        {activeTab === 'simulacoes' && (
          <SimulacaoCenáriosView />
        )}

        {/* ABA 2: COTAÇÕES DE MERCADO */}
        {activeTab === 'mercado' && (
          <div className="space-y-4 sm:space-y-6">
            {loading ? (
              <LoadingScreen progress={progress} text={progressText} />
            ) : error ? (
              <div className="min-h-[40vh] flex items-center justify-center p-4">
                <div className="text-center space-y-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm mx-auto shadow-xl">
                  <h2 className="text-lg font-bold text-red-400">Erro ao carregar dados</h2>
                  <p className="text-slate-400 text-xs">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl transition-all shadow-lg"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Filtros de Mercado */}
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
                  <div className="p-6 text-center bg-slate-900/80 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
                    <p className="text-slate-300 font-semibold text-xs sm:text-sm">
                      Nenhum registro encontrado para os filtros selecionados.
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Tente ampliar o período ou selecionar outras opções.
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl transition-all shadow-md"
                    >
                      Restaurar Filtros Padrão
                    </button>
                  </div>
                )}

                {/* KPIs de Cotações */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                  <KPICard
                    title="Cotação Atual"
                    value={`R$ ${(latestValue ?? 0).toFixed(2)}`}
                    subtitle="por arroba"
                    trend={change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'}
                    trendValue={`${changePercent >= 0 ? '+' : ''}${(changePercent ?? 0).toFixed(2)}%`}
                    icon={<DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />}
                  />

                  <KPICard
                    title="Média Período"
                    value={`R$ ${(avgValue ?? 0).toFixed(2)}`}
                    subtitle={`${filteredData?.length ?? 0} registros`}
                    icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />}
                  />

                  <KPICard
                    title="Mínima"
                    value={`R$ ${(minValue ?? 0).toFixed(2)}`}
                    subtitle="menor valor"
                    icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />}
                  />

                  <KPICard
                    title="Máxima"
                    value={`R$ ${(maxValue ?? 0).toFixed(2)}`}
                    subtitle="maior valor"
                    icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />}
                  />
                </div>

                {/* Gráfico de Preços */}
                <PriceChart data={filteredData} />

                {/* Tabela de Registros Recentes */}
                <DataTable data={filteredData} onExport={exportCSV} />
              </>
            )}
          </div>
        )}

      </main>

      {/* Footer Mobile & Desktop */}
      <footer className="text-center text-[11px] text-slate-500 py-8 border-t border-slate-800/80 mt-12 px-4 space-y-1">
        <p className="font-bold text-slate-400">Painel de Simulação Estratégica & Inteligência Pecuária</p>
        <p>CEPEA (Zenodo) + CotacaoDoDia.com • Suporte 100% PWA Offline (sem necessidade de internet)</p>
      </footer>

      {/* Barra de Navegação Inferior Fixa no Mobile (100% Mobile-First Ergonomia) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/90 flex items-center justify-around py-1.5 px-3 shadow-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('simulacoes')}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-5 rounded-2xl transition-all ${
            activeTab === 'simulacoes'
              ? 'bg-emerald-600/20 text-emerald-400 font-black border border-emerald-500/30 shadow-md'
              : 'text-slate-400 font-medium hover:text-slate-200'
          }`}
        >
          <Sparkles className={`w-5 h-5 ${activeTab === 'simulacoes' ? 'animate-pulse text-emerald-400' : ''}`} />
          <span className="text-[10px] tracking-tight">Simulações IA</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mercado')}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-5 rounded-2xl transition-all ${
            activeTab === 'mercado'
              ? 'bg-emerald-600/20 text-emerald-400 font-black border border-emerald-500/30 shadow-md'
              : 'text-slate-400 font-medium hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Cotações</span>
        </button>
      </nav>

    </div>
  );
}
