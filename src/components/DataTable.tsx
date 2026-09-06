import { Download } from 'lucide-react';
import type { CotacaoData } from '../types';

interface DataTableProps {
  data: CotacaoData[];
  onExport: () => void;
  loading?: boolean;
}

export function DataTable({ data, onExport, loading }: DataTableProps) {
  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-700/50 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-48 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const displayData = data.slice(-50).reverse(); // Últimos 50 registros

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Dados Recentes</h3>
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors touch-target"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar CSV</span>
          <span className="sm:hidden">CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-slate-700">
            <thead>
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Valor
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Fonte
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  UF
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Praça
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {displayData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-white">
                    {formatDate(item.data)}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm font-medium text-emerald-400">
                    R$ {item.valor.toFixed(2)}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                    {item.fonte}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                    {item.uf}
                  </td>
                  <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                    {item.praca}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {displayData.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          Nenhum dado disponível
        </div>
      )}

      <p className="text-xs text-slate-500 mt-4 text-center">
        Mostrando {displayData.length} de {data.length} registros
      </p>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}