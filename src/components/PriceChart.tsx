import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CotacaoData } from '../types';

interface PriceChartProps {
  data: CotacaoData[];
  loading?: boolean;
}

export function PriceChart({ data, loading }: PriceChartProps) {
  if (loading) {
    return (
      <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-6 border border-slate-800 animate-pulse">
        <div className="h-5 bg-slate-800 rounded w-44 mb-4" />
        <div className="h-56 sm:h-72 bg-slate-800/60 rounded-2xl" />
      </div>
    );
  }

  // Agrupar por data e calcular média
  const aggregatedData = data.reduce((acc, item) => {
    const existing = acc.find(d => d.data === item.data);
    if (existing) {
      existing.valores.push(item.valor);
    } else {
      acc.push({ data: item.data, valores: [item.valor] });
    }
    return acc;
  }, [] as { data: string; valores: number[] }[]);

  const series = aggregatedData.map(item => ({
    rawDate: item.data,
    data: formatDate(item.data, aggregatedData.length > 400),
    valor: item.valores.reduce((sum, v) => sum + v, 0) / item.valores.length
  }));

  // Downsample semanal se houver muitos pontos
  let chartData = series;
  let downsampled = false;
  if (series.length > 800) {
    downsampled = true;
    const byWeek = new Map<string, number[]>();
    for (const pt of series) {
      const d = new Date(pt.rawDate + 'T12:00:00');
      const week = `${d.getUTCFullYear()}-W${String(Math.ceil((((d.getTime() - Date.UTC(d.getUTCFullYear(),0,1)) / 86400000) + 1) / 7)).padStart(2,'0')}`;
      if (!byWeek.has(week)) byWeek.set(week, []);
      byWeek.get(week)!.push(pt.valor);
    }
    chartData = [...byWeek.entries()].map(([week, vals]) => ({
      rawDate: week,
      data: week,
      valor: vals.reduce((a,b)=>a+b,0) / vals.length
    }));
  }

  return (
    <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
          📈 Histórico de Preços da Arroba
        </h3>
        {downsampled && (
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            Média semanal
          </span>
        )}
      </div>

      <div className="w-full h-56 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis 
              dataKey="data" 
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={{ stroke: '#1e293b' }}
            />
            <YAxis 
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={{ stroke: '#1e293b' }}
              tickFormatter={(value) => `R$${(Number(value) || 0).toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px'
              }}
              formatter={(value: number) => [`R$ ${(Number(value) || 0).toFixed(2)}`, 'Valor']}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Legend 
              wrapperStyle={{ color: '#94a3b8', fontSize: '11px' }}
              iconType="line"
            />
            <Line 
              type="monotone" 
              dataKey="valor" 
              stroke="#10b981" 
              strokeWidth={2.5}
              dot={false}
              name="Cotação (@)"
              activeDot={{ r: 5, fill: '#10b981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {data.length === 0 && (
        <div className="text-center py-6 text-slate-400 text-xs">
          Nenhum dado disponível para o período selecionado
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string, withYear = false): string {
  const [year, month, day] = dateStr.split('-');
  return withYear ? `${day}/${month}/${year.slice(2)}` : `${day}/${month}`;
}