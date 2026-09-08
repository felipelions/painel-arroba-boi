import { Download, Table } from 'lucide-react';
import type { CotacaoData } from '../types';

interface DataTableProps {
  data: CotacaoData[];
  onExport: () => void;
  loading?: boolean;
}

export function DataTable({ data, onExport, loading }: DataTableProps) {
  if (loading) {
    return (
      <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-6 border border-slate-800 animate-pulse">
        <div className="h-5 bg-slate-800 rounded w-44 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-800/60 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const displayData = data.slice(-50).reverse(); // Últimos 50 registros

  return (
    <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
          <Table className="w-4 h-4 text-emerald-400" />
          Dados Recentes da Arroba
        </h3>
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md touch-target active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Exportar CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto no-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-slate-800">
            <thead>
              <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-3 py-2.5">Data</th>
                <th className="px-3 py-2.5">Cotação</th>
                <th className="px-3 py-2.5">Fonte</th>
                <th className="hidden sm:table-cell px-3 py-2.5">UF</th>
                <th className="hidden md:table-cell px-3 py-2.5">Praça</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {displayData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-3 py-3 whitespace-nowrap text-white font-medium">
                    {formatDate(item.data)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap font-black text-emerald-400">
                    R$ {item.valor.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-slate-300 font-medium">
                    {item.fonte}
                  </td>
                  <td className="hidden sm:table-cell px-3 py-3 whitespace-nowrap text-slate-400">
                    {item.uf}
                  </td>
                  <td className="hidden md:table-cell px-3 py-3 whitespace-nowrap text-slate-400">
                    {item.praca}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {displayData.length === 0 && (
        <div className="text-center py-6 text-slate-400 text-xs">
          Nenhum dado disponível
        </div>
      )}

      <p className="text-[10px] text-slate-500 text-center font-medium">
        Exibindo os {displayData.length} registros mais recentes (total {data.length})
      </p>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}