import { useState, useEffect, useMemo, useCallback } from 'react';
import type { CotacaoData, Snapshot, Filtros, PeriodoFiltro } from '../types';

interface FilterOptions {
  fontes: string[];
  tipos: string[];
  ufs: string[];
  pracas: string[];
}

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
  resetFilters: () => void;
  exportCSV: () => void;
  options: FilterOptions;
}

const DEFAULT_FILTROS: Filtros = {
  periodo: '1A',
  fonte: 'Todas',
  tipo: 'Todos',
  uf: 'Todas',
  praca: 'Todas'
};

export function useMarketData(): UseMarketDataReturn {
  const [data, setData] = useState<CotacaoData[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('Carregando dados...');
  const [filtros, setFiltros] = useState<Filtros>(DEFAULT_FILTROS);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setProgress(10);
      setProgressText('Carregando dados das cotações...');

      const CDN_HISTORICO_URL =
        'https://cdn.jsdelivr.net/gh/felipelions/painel-arroba-boi@main/public/data/cepea-historico.json';

      let historicoData: CotacaoData[] | null = null;

      // 1. Tenta carregar do arquivo local
      try {
        const res = await fetch('/data/cepea-historico.json');
        if (res.ok) {
          historicoData = await res.json();
        }
      } catch {
        // ignora e tenta CDN
      }

      // 2. Se falhar, tenta CDN de contingência
      if (!historicoData || !Array.isArray(historicoData)) {
        try {
          const res = await fetch(CDN_HISTORICO_URL);
          if (res.ok) {
            historicoData = await res.json();
          }
        } catch {
          // ignora
        }
      }

      if (!historicoData || historicoData.length === 0) {
        throw new Error('Não foi possível carregar os dados de cotações.');
      }

      setProgress(60);
      setProgressText('Carregando estatísticas do mercado...');

      // Carrega snapshot ou calcula dinamicamente
      let snapshotData: Snapshot | null = null;
      try {
        const snapRes = await fetch('/data/snapshot.json');
        if (snapRes.ok) {
          snapshotData = await snapRes.json();
        }
      } catch {
        // ignora
      }

      if (!snapshotData) {
        // Fallback: computa estatísticas a partir dos dados carregados
        const validValues = historicoData.map(d => d.valor).filter(v => typeof v === 'number' && v > 0);
        snapshotData = {
          geradoEm: new Date().toISOString(),
          totalRegistros: historicoData.length,
          fontes: {
            CEPEA: historicoData.filter(d => d.fonte === 'CEPEA').length,
            CotacaoDoDia: historicoData.filter(d => d.fonte === 'CotacaoDoDia').length
          },
          periodoInicio: historicoData[0]?.data || '',
          periodoFim: historicoData[historicoData.length - 1]?.data || '',
          valorMinimo: validValues.length > 0 ? Math.min(...validValues) : 0,
          valorMaximo: validValues.length > 0 ? Math.max(...validValues) : 0,
          valorMedio: validValues.length > 0 ? validValues.reduce((s, v) => s + v, 0) / validValues.length : 0
        };
      }

      setProgress(90);
      setData(historicoData);
      setSnapshot(snapshotData);
      setProgress(100);
      setProgressText('Dados carregados!');

      setTimeout(() => setLoading(false), 200);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar dados');
      setLoading(false);
    }
  }

  // Extrai dinamicamente as opções que realmente existem nos dados
  const options = useMemo<FilterOptions>(() => {
    if (!data || data.length === 0) {
      return {
        fontes: ['Todas', 'CEPEA', 'CotacaoDoDia'],
        tipos: ['Todos', 'Boi Gordo'],
        ufs: ['Todas', 'SP'],
        pracas: ['Todas', 'São Paulo']
      };
    }

    const uniqueFontes = Array.from(new Set(data.map(d => d.fonte).filter(Boolean))).sort();
    const uniqueTipos = Array.from(new Set(data.map(d => d.tipo).filter(Boolean))).sort();
    const uniqueUfs = Array.from(new Set(data.map(d => d.uf).filter(Boolean))).sort();
    const uniquePracas = Array.from(new Set(data.map(d => d.praca).filter(Boolean))).sort();

    return {
      fontes: ['Todas', ...uniqueFontes],
      tipos: ['Todos', ...uniqueTipos],
      ufs: ['Todas', ...uniqueUfs],
      pracas: ['Todas', ...uniquePracas]
    };
  }, [data]);

  // Filtragem robusta que respeita a cronologia e filtros compostos
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let filtered = [...data];

    // 1. Filtros Categóricos (Fonte, Tipo, UF, Praça)
    if (filtros.fonte && filtros.fonte !== 'Todas') {
      filtered = filtered.filter(
        item => item.fonte && item.fonte.toLowerCase() === filtros.fonte.toLowerCase()
      );
    }
    if (filtros.tipo && filtros.tipo !== 'Todos') {
      filtered = filtered.filter(
        item => item.tipo && item.tipo.toLowerCase() === filtros.tipo.toLowerCase()
      );
    }
    if (filtros.uf && filtros.uf !== 'Todas') {
      filtered = filtered.filter(
        item => item.uf && item.uf.toUpperCase() === filtros.uf.toUpperCase()
      );
    }
    if (filtros.praca && filtros.praca !== 'Todas') {
      filtered = filtered.filter(
        item => item.praca && item.praca.toLowerCase() === filtros.praca.toLowerCase()
      );
    }

    // 2. Filtro de Período Temporal (calculado a partir da data mais recente do subconjunto filtrado)
    if (filtered.length > 0 && filtros.periodo !== 'MAX') {
      const latestDateStr = filtered[filtered.length - 1].data;
      const parts = latestDateStr.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const cutoffDate = new Date(year, month, day);

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
      }

      const cutoffStr = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}-${String(cutoffDate.getDate()).padStart(2, '0')}`;
      filtered = filtered.filter(item => item.data >= cutoffStr);
    }

    return filtered;
  }, [data, filtros]);

  const applyFilters = useCallback(() => {
    // Força atualização se necessário
  }, []);

  const resetFilters = useCallback(() => {
    setFiltros(DEFAULT_FILTROS);
  }, []);

  function exportCSV() {
    if (filteredData.length === 0) return;
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
    link.remove();
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
    resetFilters,
    exportCSV,
    options
  };
}