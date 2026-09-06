export interface CotacaoData {
  data: string;
  valor: number;
  fonte: string;
  tipo: string;
  uf: string;
  praca: string;
}

export interface Snapshot {
  geradoEm: string;
  totalRegistros: number;
  fontes: {
    CEPEA: number;
    CotacaoDoDia: number;
  };
  periodoInicio: string;
  periodoFim: string;
  valorMinimo: number;
  valorMaximo: number;
  valorMedio: number;
}

export type PeriodoFiltro = '1M' | '3M' | '1A' | '5A' | 'MAX';

export interface Filtros {
  periodo: PeriodoFiltro;
  fonte: string;
  tipo: string;
  uf: string;
  praca: string;
}