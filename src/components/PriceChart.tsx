import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CotacaoData } from '../types';

interface PriceChartProps {
  data: CotacaoData[];
  loading?: boolean;
}

type ChartPoint = {
  rawDate: string;
  data: string;
  boiGordo?: number;
  boiMagro?: number;
};

function isBoiMagro(tipo: string | undefined): boolean {
  return !!tipo && /magro/i.test(tipo);
}

function avg(vals: number[]): number | undefined {
  if (!vals.length) return undefined;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
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

  // Agrupa por data, separando boi gordo e boi magro (não misturar médias)
  const byDate = new Map<string, { gordo: number[]; magro: number[] }>();
  for (const item of data) {
    if (typeof item.valor !== 'number' || item.valor <= 0) continue;
    let bucket = byDate.get(item.data);
    if (!bucket) {
      bucket = { gordo: [], magro: [] };
      byDate.set(item.data, bucket);
    }
    if (isBoiMagro(item.tipo)) {
      bucket.magro.push(item.valor);
    } else {
      bucket.gordo.push(item.valor);
    }
  }

  const sortedDates = [...byDate.keys()].sort();
  const series: ChartPoint[] = sortedDates.map(date => {
    const bucket = byDate.get(date)!;
    return {
      rawDate: date,
      data: formatDate(date, sortedDates.length > 400),
      boiGordo: avg(bucket.gordo),
      boiMagro: avg(bucket.magro)
    };
  });

  const hasGordo = series.some(p => p.boiGordo != null);
  const hasMagro = series.some(p => p.boiMagro != null);

  // Downsample semanal se houver muitos pontos (preserva as duas séries)
  let chartData = series;
  let downsampled = false;
  if (series.length > 800) {
    downsampled = true;
    const byWeek = new Map<string, { gordo: number[]; magro: number[] }>();
    for (const pt of series) {
      const d = new Date(pt.rawDate + 'T12:00:00');
      const week = `${d.getUTCFullYear()}-W${String(
        Math.ceil((((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000) + 1) / 7)
      ).padStart(2, '0')}`;
      if (!byWeek.has(week)) byWeek.set(week, { gordo: [], magro: [] });
      const w = byWeek.get(week)!;
      if (pt.boiGordo != null) w.gordo.push(pt.boiGordo);
      if (pt.boiMagro != null) w.magro.push(pt.boiMagro);
    }
    chartData = [...byWeek.entries()].map(([week, vals]) => ({
      rawDate: week,
      data: week,
      boiGordo: avg(vals.gordo),
      boiMagro: avg(vals.magro)
    }));
  }

  return (
    <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
          📈 Histórico de Preços da Arroba
        </h3>
        <div className="flex items-center gap-1.5">
          {hasMagro && (
            <span className="text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
              + Boi Magro (Scot)
            </span>
          )}
          {downsampled && (
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              Média semanal
            </span>
          )}
        </div>
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
              formatter={(value: number, name: string) => [
                `R$ ${(Number(value) || 0).toFixed(2)}`,
                name
              ]}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Legend
              wrapperStyle={{ color: '#94a3b8', fontSize: '11px' }}
              iconType="line"
            />
            {hasGordo && (
              <Line
                type="monotone"
                dataKey="boiGordo"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
                name="Boi Gordo (@)"
                connectNulls
                activeDot={{ r: 5, fill: '#10b981' }}
              />
            )}
            {hasMagro && (
              <Line
                type="monotone"
                dataKey="boiMagro"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                name="Boi Magro (@)"
                connectNulls
                activeDot={{ r: 5, fill: '#f59e0b' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {hasMagro && (
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Boi Magro: snapshots Scot Consultoria (Nelore ~375 kg / 12,5@), R$/@ = R$/cabeça ÷ 12,5. Série não diária.
        </p>
      )}

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
