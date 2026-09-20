'use client';

import React, { useMemo, useState } from 'react';
import { Beef, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { CenarioVariaveis } from '../../types/simulation';

export type DiaRacao = {
  dia: number;
  pesoVivo: number;
  ganhoAcumulado: number;
  consumoKg: number;
  custoCabeca: number;
  custoLote: number;
  custoAcumCabeca: number;
  custoAcumLote: number;
  carcacaKgDia: number;
  arrobasDia: number;
  carcacaKgAcum: number;
  arrobasAcum: number;
  custoPorArrobaDia: number;
};

function formatBRL(valor: number, casas = 2) {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas
  });
}

/** Série diária: peso = entrada + GMD×(dia−1); ração pelo peso do dia; carcaça = GMD×rendimento. */
export function montarRacaoAcumulada(v: CenarioVariaveis): DiaRacao[] {
  const dias = Math.max(1, Math.round(v.diasPermanencia || 1));
  const quantidade = Math.max(1, v.quantidadeAnimais || 1);
  const entrada =
    v.pesoMedioEntrada > 0 ? v.pesoMedioEntrada : v.pesoMedioAtual || 0;
  const gmd = Math.max(0, v.gmd || 0);
  const rendimento = Math.max(0.4, Math.min(0.65, v.rendimentoCarcaca || 0.54));
  const percentPV = v.consumoRacaoPercentPV || 0;
  const precoKg = v.precoKgRacao || 0;
  const diáriaFixa = v.custoAnimalDia || 0;
  const usaPercentPV = percentPV > 0 && precoKg > 0;

  const carcacaKgDia = Math.round(gmd * rendimento * 1000) / 1000;
  const arrobasDia = Math.round((carcacaKgDia / 15) * 10000) / 10000;

  const serie: DiaRacao[] = [];
  let custoAcumCabeca = 0;
  let carcacaKgAcum = 0;
  let arrobasAcum = 0;

  for (let dia = 1; dia <= dias; dia++) {
    const ganhoAcumulado = Math.round(gmd * (dia - 1) * 10) / 10;
    const pesoVivo = Math.round((entrada + ganhoAcumulado) * 10) / 10;
    const consumoKg = usaPercentPV
      ? Math.round(pesoVivo * (percentPV / 100) * 100) / 100
      : 0;
    const custoCabeca = usaPercentPV
      ? Math.round(consumoKg * precoKg * 100) / 100
      : Math.round(diáriaFixa * 100) / 100;
    const custoLote = Math.round(custoCabeca * quantidade * 100) / 100;
    custoAcumCabeca = Math.round((custoAcumCabeca + custoCabeca) * 100) / 100;
    carcacaKgAcum = Math.round((carcacaKgAcum + carcacaKgDia) * 1000) / 1000;
    arrobasAcum = Math.round((arrobasAcum + arrobasDia) * 10000) / 10000;
    const custoPorArrobaDia =
      arrobasDia > 0 ? Math.round((custoCabeca / arrobasDia) * 100) / 100 : 0;

    serie.push({
      dia,
      pesoVivo,
      ganhoAcumulado,
      consumoKg,
      custoCabeca,
      custoLote,
      custoAcumCabeca,
      custoAcumLote: Math.round(custoAcumCabeca * quantidade * 100) / 100,
      carcacaKgDia,
      arrobasDia,
      carcacaKgAcum,
      arrobasAcum,
      custoPorArrobaDia
    });
  }

  return serie;
}

interface RacaoAcumuladaPanelProps {
  variaveis: CenarioVariaveis;
}

export function RacaoAcumuladaPanel({ variaveis: v }: RacaoAcumuladaPanelProps) {
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const serie = useMemo(() => montarRacaoAcumulada(v), [v]);

  if (serie.length === 0) return null;

  const primeiro = serie[0];
  const ultimo = serie[serie.length - 1];
  const mediaCustoDia =
    Math.round((ultimo.custoAcumCabeca / serie.length) * 100) / 100;

  // Gráfico: todos os dias se ≤90; senão amostra semanal + último
  const chartData =
    serie.length <= 90
      ? serie.map((d) => ({
          label: String(d.dia),
          peso: d.pesoVivo,
          custoAcum: d.custoAcumCabeca,
          arrobasAcum: Math.round(d.arrobasAcum * 100) / 100
        }))
      : serie
          .filter((d) => d.dia === 1 || d.dia === serie.length || d.dia % 7 === 0)
          .map((d) => ({
            label: `D${d.dia}`,
            peso: d.pesoVivo,
            custoAcum: d.custoAcumCabeca,
            arrobasAcum: Math.round(d.arrobasAcum * 100) / 100
          }));

  // Tabela: semanal por padrão, ou todos
  const linhasTabela = mostrarTodos
    ? serie
    : serie.filter(
        (d) =>
          d.dia === 1 ||
          d.dia === serie.length ||
          d.dia % 7 === 0
      );

  const usaPercentPV =
    (v.consumoRacaoPercentPV || 0) > 0 && (v.precoKgRacao || 0) > 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Beef className="w-4 h-4 text-amber-400" />
            Ração acumulada (dia a dia)
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Peso = entrada + GMD × dias · ração pelo peso do dia · rendimento = GMD × % carcaça
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
          {serie.length} dias
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-2.5">
          <span className="text-[10px] text-slate-500 block">Peso inicial → final</span>
          <strong className="text-sm text-white">
            {primeiro.pesoVivo.toFixed(0)} → {ultimo.pesoVivo.toFixed(0)} kg
          </strong>
        </div>
        <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-2.5">
          <span className="text-[10px] text-slate-500 block">Ração média / cab/dia</span>
          <strong className="text-sm text-amber-300">R$ {formatBRL(mediaCustoDia)}</strong>
        </div>
        <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-2.5">
          <span className="text-[10px] text-slate-500 block">Ração acum. / cabeça</span>
          <strong className="text-sm text-amber-300">
            R$ {formatBRL(ultimo.custoAcumCabeca)}
          </strong>
        </div>
        <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-2.5">
          <span className="text-[10px] text-slate-500 block flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Rendimento diário
          </span>
          <strong className="text-sm text-emerald-300">
            +{ultimo.carcacaKgDia.toFixed(2)} kg · {ultimo.arrobasDia.toFixed(3)} @
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl px-3 py-2 flex justify-between">
          <span className="text-slate-400">Carcaça acum. / cab</span>
          <strong className="text-emerald-300">
            {ultimo.carcacaKgAcum.toFixed(1)} kg · {ultimo.arrobasAcum.toFixed(2)} @
          </strong>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 flex justify-between">
          <span className="text-slate-400">Ração total lote</span>
          <strong className="text-white">R$ {formatBRL(ultimo.custoAcumLote, 0)}</strong>
        </div>
      </div>

      <div className="w-full h-44 sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 9 }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="peso"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 9 }}
              tickFormatter={(v) => `${v}`}
            />
            <YAxis
              yAxisId="custo"
              orientation="right"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 9 }}
              tickFormatter={(v) => `R$${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 12,
                fontSize: 11
              }}
              formatter={(value: number, name: string) => {
                if (name === 'Peso vivo (kg)') return [`${Number(value).toFixed(1)} kg`, name];
                if (name === '@ carcaça acum.') return [`${Number(value).toFixed(2)} @`, name];
                return [`R$ ${formatBRL(Number(value))}`, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
            <Area
              yAxisId="custo"
              type="monotone"
              dataKey="custoAcum"
              name="Ração acum. (R$/cab)"
              fill="#f59e0b33"
              stroke="#f59e0b"
              strokeWidth={2}
            />
            <Line
              yAxisId="peso"
              type="monotone"
              dataKey="peso"
              name="Peso vivo (kg)"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="peso"
              type="monotone"
              dataKey="arrobasAcum"
              name="@ carcaça acum."
              stroke="#a78bfa"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-slate-500">
          {usaPercentPV
            ? `Consumo = peso × ${(v.consumoRacaoPercentPV || 0).toFixed(1)}% PV × R$ ${(v.precoKgRacao || 0).toFixed(2)}/kg`
            : `Diária fixa R$ ${(v.custoAnimalDia || 0).toFixed(2)}/cab/dia`}
        </p>
        <button
          type="button"
          onClick={() => setMostrarTodos((s) => !s)}
          className="text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          {mostrarTodos ? 'Ver semanal' : 'Ver todos os dias'}
        </button>
      </div>

      <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-xl border border-slate-800">
        <table className="w-full text-[10px] sm:text-[11px]">
          <thead className="sticky top-0 bg-slate-950 text-slate-400">
            <tr>
              <th className="text-left p-2 font-semibold">Dia</th>
              <th className="text-right p-2 font-semibold">Peso</th>
              <th className="text-right p-2 font-semibold">Ganho acum.</th>
              <th className="text-right p-2 font-semibold">Ração dia</th>
              <th className="text-right p-2 font-semibold">Ração acum.</th>
              <th className="text-right p-2 font-semibold">Rend. dia</th>
              <th className="text-right p-2 font-semibold">@ acum.</th>
              <th className="text-right p-2 font-semibold">R$/@ dia</th>
            </tr>
          </thead>
          <tbody>
            {linhasTabela.map((d) => (
              <tr
                key={d.dia}
                className="border-t border-slate-800/80 hover:bg-slate-800/40"
              >
                <td className="p-2 text-slate-300 font-medium">{d.dia}</td>
                <td className="p-2 text-right text-emerald-300">{d.pesoVivo.toFixed(1)} kg</td>
                <td className="p-2 text-right text-slate-400">+{d.ganhoAcumulado.toFixed(1)}</td>
                <td className="p-2 text-right text-amber-300">
                  R$ {formatBRL(d.custoCabeca)}
                  {usaPercentPV ? (
                    <span className="block text-[9px] text-slate-500">{d.consumoKg.toFixed(2)} kg</span>
                  ) : null}
                </td>
                <td className="p-2 text-right text-white">R$ {formatBRL(d.custoAcumCabeca)}</td>
                <td className="p-2 text-right text-purple-300">
                  {d.carcacaKgDia.toFixed(2)} kg
                  <span className="block text-[9px] text-slate-500">
                    {d.arrobasDia.toFixed(3)} @
                  </span>
                </td>
                <td className="p-2 text-right text-purple-200">{d.arrobasAcum.toFixed(2)} @</td>
                <td className="p-2 text-right text-slate-300">
                  {d.custoPorArrobaDia > 0 ? `R$ ${formatBRL(d.custoPorArrobaDia)}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
