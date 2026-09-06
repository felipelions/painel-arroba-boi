import { TrendingUp, Database, Calendar, DollarSign } from 'lucide-react';
import { useMarketData } from './hooks/useMarketData';
import { LoadingScreen } from './components/LoadingScreen';
import { KPICard } from './components/KPICard';
import { Filters } from './components/Filters';
import { PriceChart } from './components/PriceChart';
import { DataTable } from './components/DataTable';

function App() {
  const {
    snapshot,
    filteredData,
    loading,
    error,
    progress,
    progressText,
    filtros,
    setFiltros,
    applyFilters,
    exportCSV
  } = useMarketData();

  if (loading) {
    return <LoadingScreen progress={progress} text={progressText} />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-400">Erro ao carregar dados</h2>
          <p className="text-slate-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                🐂 Painel Arroba do Boi
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Dados de mercado CEPEA + CotacaoDoDia
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <Database className="w-4 h-4" />
              <span>{snapshot?.totalRegistros.toLocaleString('pt-BR')} registros</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Filtros */}
        <Filters
          filtros={filtros}
          onChange={setFiltros}
          onApply={applyFilters}
        />

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

        {/* Footer */}
        <footer className="text-center text-sm text-slate-500 py-8 border-t border-slate-800">
          <p>
            Dados: CEPEA (Zenodo) + CotacaoDoDia.com
          </p>
          <p className="mt-1">
            Última atualização: {snapshot?.geradoEm ? new Date(snapshot.geradoEm).toLocaleString('pt-BR') : 'N/A'}
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;