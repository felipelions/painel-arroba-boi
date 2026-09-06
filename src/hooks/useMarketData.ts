import { useState, useEffect, useMemo } from 'react';
import type { CotacaoData, Snapshot, Filtros, PeriodoFiltro } from '../types';

interface UseMarketDataReturn {
  data: CotacaoData[];
  snapshot: Snapshot | null;
  filteredData: CotacaoData[];
  loading: boolean;
  error: string | null;
  progress: number;
  progressText: string;
  filtros: Filtros;
  setFiltros: (filtros: Filtros) => void;
  applyFilters: () => void;
  exportCSV: () => void;
}

export function useMarketData(): UseMarketDataReturn {
  const [data, setData] = useState<CotacaoData[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('Carregando dados...');
  const [filtros, setFiltros] = useState<Filtros>({
    periodo: '1A',
    fonte: 'Todas',
    tipo: 'Todos',
    uf: 'Todas',
    praca: 'Todas'
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setProgress(0);
      setProgressText('Baixando histórico CEPEA...');

      const [historicoRes, snapshotRes] = await Promise.all([
        fetch('/data/cepea-historico.json'),
        fetch('/data/snapshot.json')
      ]);

      if (!historicoRes.ok || !snapshotRes.ok) {
        throw new Error('Erro ao carregar dados');
      }

      setProgress(40);
      setProgressText('Processando registros...');

      const historicoData = await historicoRes.json();
      const snapshotData = await snapshotRes.json();

      setProgress(70);
      setProgressText('Preparando visualizações...');

      await new Promise(resolve => setTimeout(resolve, 300));

      setData(historicoData);
      setSnapshot(snapshotData);
      setProgress(100);
      setProgressText('Dados carregados!');

      setTimeout(() => setLoading(false), 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setLoading(false);
    }
  }

  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Filtro de período
    if (data.length > 0) {
      const latestDate = new Date(data[data.length - 1].data);
      const cutoffDate = new Date(latestDate);

      switch (filtros.periodo) {
        case '1M':
          cutoffDate.setMonth(cutoffDate.getMonth() - 1);
          break;
        case '3M':
          cutoffDate.setMonth(cutoffDate.getMonth() - 3);
          break;
        case '1A':
          cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
          break;
        case '5A':
          cutoffDate.setFullYear(cutoffDate.getFullYear() - 5);
          break;
        case 'MAX':
          break;
      }

      if (filtros.periodo !== 'MAX') {
        filtered = filtered.filter(item => new Date(item.data) >= cutoffDate);
      }
    }

    // Outros filtros
    if (filtros.fonte !== 'Todas') {
      filtered = filtered.filter(item => item.fonte === filtros.fonte);
    }
    if (filtros.tipo !== 'Todos') {
      filtered = filtered.filter(item => item.tipo === filtros.tipo);
    }
    if (filtros.uf !== 'Todas') {
      filtered = filtered.filter(item => item.uf === filtros.uf);
    }
    if (filtros.praca !== 'Todas') {
      filtered = filtered.filter(item => item.praca === filtros.praca);
    }

    return filtered;
  }, [data, filtros]);

  function applyFilters() {
    setProgressText('Aplicando filtros...');
  }

  function exportCSV() {
    const headers = ['Data', 'Valor', 'Fonte', 'Tipo', 'UF', 'Praça'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item =>
        [item.data, item.valor, item.fonte, item.tipo, item.uf, item.praca].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `arroba-boi-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  return {
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
    exportCSV
  };
}