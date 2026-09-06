import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CotacaoData } from '../types';

interface PriceChartProps {
  data: CotacaoData[];
  loading?: boolean;
}

export function PriceChart({ data, loading }: PriceChartProps) {
  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-700/50 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-48 mb-6" />
        <div className="h-64 sm:h-80 bg-slate-700 rounded" />
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

  // Downsample weekly when too many points (keeps multi-year readable)
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
    <div className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-6">Histórico de Preços</h3>
      {downsampled && (
        <p className="text-xs text-slate-400 mb-3">Média semanal ({chartData.length} pontos) — período longo</p>
      )}
      
      <div className="w-full h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="data" 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={{ stroke: '#334155' }}
            />
            <YAxis 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={{ stroke: '#334155' }}
              tickFormatter={(value) => `R$${value.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor']}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Legend 
              wrapperStyle={{ color: '#94a3b8' }}
              iconType="line"
            />
            <Line 
              type="monotone" 
              dataKey="valor" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={false}
              name="Preço da Arroba"
              activeDot={{ r: 6, fill: '#10b981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {data.length === 0 && (
        <div className="text-center py-8 text-slate-400">
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