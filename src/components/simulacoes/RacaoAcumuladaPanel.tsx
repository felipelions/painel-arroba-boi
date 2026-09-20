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
import { FormulaHelp } from '../FormulaHelp';

export type DiaRacao = {
  dia: number;
  pesoVivo: number;
  ganhoAcumulado: number;
  ganhoDia: number;
  consumoKg: number;
  custoCabeca: number;
  custoLote: number;
  custoAcumCabeca: number;
  custoAcumLote: number;
};

type SemanaRacao = {
  semana: number;
  diaInicio: number;
  diaFim: number;
  pesoVivo: number;
  ganhoSemana: number;
  ganhoAcumulado: number;
  consumoKg: number;
  custoSemana: number;
  custoAcumCabeca: number;
  custoAcumLote: number;
};

function formatBRL(valor: number, casas = 2) {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas
  });
}

/** Série diária só em peso vivo: peso = entrada + GMD×(dia−1); ração pelo peso vivo do dia. */
export function montarRacaoAcumulada(v: CenarioVariaveis): DiaRacao[] {
  const dias = Math.max(1, Math.round(v.diasPermanencia || 1));
  const quantidade = Math.max(1, v.quantidadeAnimais || 1);
  const entrada =
    v.pesoMedioEntrada > 0 ? v.pesoMedioEntrada : v.pesoMedioAtual || 0;
  const gmd = Math.max(0, v.gmd || 0);
  const percentPV = v.consumoRacaoPercentPV || 0;
  const precoKg = v.precoKgRacao || 0;
  const diariaFixa = v.custoAnimalDia || 0;
  const usaPercentPV = percentPV > 0 && precoKg > 0;

  const serie: DiaRacao[] = [];
  let custoAcumCabeca = 0;

  for (let dia = 1; dia <= dias; dia++) {
    const ganhoAcumulado = Math.round(gmd * (dia - 1) * 10) / 10;
    const pesoVivo = Math.round((entrada + ganhoAcumulado) * 10) / 10;
    const consumoKg = usaPercentPV
      ? Math.round(pesoVivo * (percentPV / 100) * 100) / 100
      : 0;
    const custoCabeca = usaPercentPV
      ? Math.round(consumoKg * precoKg * 100) / 100
      : Math.round(diariaFixa * 100) / 100;
    const custoLote = Math.round(custoCabeca * quantidade * 100) / 100;
    custoAcumCabeca = Math.round((custoAcumCabeca + custoCabeca) * 100) / 100;

    serie.push({
      dia,
      pesoVivo,
      ganhoAcumulado,
      ganhoDia: Math.round(gmd * 10) / 10,
      consumoKg,
      custoCabeca,
      custoLote,
      custoAcumCabeca,
      custoAcumLote: Math.round(custoAcumCabeca * quantidade * 100) / 100
    });
  }

  return serie;
}

function agruparPorSemana(serie: DiaRacao[]): SemanaRacao[] {
  const semanas: SemanaRacao[] = [];
  for (let i = 0; i < serie.length; i += 7) {
    const chunk = serie.slice(i, i + 7);
    const primeiro = chunk[0];
    const ultimo = chunk[chunk.length - 1];
    const ganhoSemana = Math.round((ultimo.ganhoAcumulado - (i === 0 ? 0 : serie[i - 1].ganhoAcumulado)) * 10) / 10;
    const custoSemana = Math.round(chunk.reduce((s, d) => s + d.custoCabeca, 0) * 100) / 100;
    const consumoKg = Math.round(chunk.reduce((s, d) => s + d.consumoKg, 0) * 100) / 100;
    semanas.push({
      semana: Math.floor(i / 7) + 1,
      diaInicio: primeiro.dia,
      diaFim: ultimo.dia,
      pesoVivo: ultimo.pesoVivo,
      ganhoSemana,
      ganhoAcumulado: ultimo.ganhoAcumulado,
      consumoKg,
      custoSemana,
      custoAcumCabeca: ultimo.custoAcumCabeca,
      custoAcumLote: ultimo.custoAcumLote
    });
  }
  return semanas;
}

interface RacaoAcumuladaPanelProps {
  variaveis: CenarioVariaveis;
}

export function RacaoAcumuladaPanel({ variaveis: v }: RacaoAcumuladaPanelProps) {
  const [modo, setModo] = useState<'dias' | 'semanas'>('dias');
  const serie = useMemo(() => montarRacaoAcumulada(v), [v]);
  const semanas = useMemo(() => agruparPorSemana(serie), [serie]);

  if (serie.length === 0) return null;

  const primeiro = serie[0];
  const ultimo = serie[serie.length - 1];
  const mediaCustoDia =
    Math.round((ultimo.custoAcumCabeca / serie.length) * 100) / 100;
  const usaPercentPV =
    (v.consumoRacaoPercentPV || 0) > 0 && (v.precoKgRacao || 0) > 0;

  const chartData =
    modo === 'dias'
      ? serie.map((d) => ({
          label: `D${d.dia}`,
          peso: d.pesoVivo,
          ganhoAcum: d.ganhoAcumulado,
          custoAcum: d.custoAcumCabeca
        }))
      : semanas.map((s) => ({
          label: `S${s.semana}`,
          peso: s.pesoVivo,
          ganhoAcum: s.ganhoAcumulado,
          custoAcum: s.custoAcumCabeca
        }));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Beef className="w-4 h-4 text-amber-400" />
            Ração acumulada (peso vivo)
            <FormulaHelp
              titulo="Ração acumulada"
              formula="Só peso vivo — sem carcaça.\npeso = entrada + GMD × (dia − 1)\nração = peso_vivo × %PV × R$/kg\nganho acum. = GMD × dias decorridos"
            />
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Acompanha o peso vivo dia a dia e o custo de ração sobre esse peso (não usa rendimento de carcaça)
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {serie.length} dias · {semanas.length} sem.
          </span>
        </div>
      </div>

      {/* Seletor Dias / Semanas */}
      <div className="flex p-0.5 bg-slate-950 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => setModo('dias')}
          className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-colors ${
            modo === 'dias'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Por dia
        </button>
        <button
          type="button"
          onClick={() => setModo('semanas')}
          className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-colors ${
            modo === 'semanas'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Por semana
        </button>
      </div>

      <div className="text-[10px] text-center text-slate-500">
        Visualização atual:{' '}
        <strong className="text-emerald-300">
          {modo === 'dias' ? `Diária (${serie.length} dias)` : `Semanal (${semanas.length} semanas)`}
        </strong>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-2.5">
          <span className="text-[10px] text-slate-500 block">Peso vivo inicial → final</span>
          <strong className="text-sm text-white">
            {primeiro.pesoVivo.toFixed(0)} → {ultimo.pesoVivo.toFixed(0)} kg
          </strong>
        </div>
        <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-2.5">
          <span className="text-[10px] text-slate-500 block">Ganho vivo total</span>
          <strong className="text-sm text-emerald-300">
            +{ultimo.ganhoAcumulado.toFixed(0)} kg
          </strong>
        </div>
        <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-2.5">
          <span className="text-[10px] text-slate-500 block">Ração média / cab/dia</span>
          <strong className="text-sm text-amber-300">R$ {formatBRL(mediaCustoDia)}</strong>
        </div>
        <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-2.5">
          <span className="text-[10px] text-slate-500 block flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Ração acum. / cab
          </span>
          <strong className="text-sm text-amber-300">
            R$ {formatBRL(ultimo.custoAcumCabeca)}
          </strong>
        </div>
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 flex justify-between text-[11px]">
        <span className="text-slate-400">Ração total lote</span>
        <strong className="text-white">R$ {formatBRL(ultimo.custoAcumLote, 0)}</strong>
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
              tickFormatter={(val) => `${val}`}
            />
            <YAxis
              yAxisId="custo"
              orientation="right"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 9 }}
              tickFormatter={(val) => `R$${val}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 12,
                fontSize: 11
              }}
              formatter={(value: number, name: string) => {
                if (name.includes('kg')) return [`${Number(value).toFixed(1)} kg`, name];
                return [`R$ ${formatBRL(Number(value))}`, name];
              }}
              labelFormatter={(label) =>
                modo === 'dias' ? `Dia ${String(label).replace('D', '')}` : `Semana ${String(label).replace('S', '')}`
              }
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
              dataKey="ganhoAcum"
              name="Ganho vivo acum. (kg)"
              stroke="#38bdf8"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-slate-500">
        {usaPercentPV
          ? `Consumo = peso vivo × ${(v.consumoRacaoPercentPV || 0).toFixed(1)}% PV × R$ ${(v.precoKgRacao || 0).toFixed(2)}/kg`
          : `Diária fixa R$ ${(v.custoAnimalDia || 0).toFixed(2)}/cab/dia`}
        {' · '}
        {modo === 'dias' ? 'Tabela em dias corridos' : 'Tabela agregada por semana (7 dias)'}
      </p>

      {modo === 'dias' ? (
        <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-xl border border-slate-800">
          <table className="w-full text-[10px] sm:text-[11px]">
            <thead className="sticky top-0 bg-slate-950 text-slate-400">
              <tr>
                <th className="text-left p-2 font-semibold">Dia</th>
                <th className="text-right p-2 font-semibold">Peso vivo</th>
                <th className="text-right p-2 font-semibold">Ganho dia</th>
                <th className="text-right p-2 font-semibold">Ganho acum.</th>
                <th className="text-right p-2 font-semibold">Ração dia</th>
                <th className="text-right p-2 font-semibold">Ração acum.</th>
              </tr>
            </thead>
            <tbody>
              {serie.map((d) => (
                <tr key={d.dia} className="border-t border-slate-800/80 hover:bg-slate-800/40">
                  <td className="p-2 text-slate-300 font-medium">
                    <span className="text-emerald-400/80 text-[9px] mr-1">DIA</span>
                    {d.dia}
                  </td>
                  <td className="p-2 text-right text-emerald-300">{d.pesoVivo.toFixed(1)} kg</td>
                  <td className="p-2 text-right text-slate-400">+{d.ganhoDia.toFixed(2)}</td>
                  <td className="p-2 text-right text-sky-300">+{d.ganhoAcumulado.toFixed(1)} kg</td>
                  <td className="p-2 text-right text-amber-300">
                    R$ {formatBRL(d.custoCabeca)}
                    {usaPercentPV ? (
                      <span className="block text-[9px] text-slate-500">{d.consumoKg.toFixed(2)} kg</span>
                    ) : null}
                  </td>
                  <td className="p-2 text-right text-white">R$ {formatBRL(d.custoAcumCabeca)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-xl border border-slate-800">
          <table className="w-full text-[10px] sm:text-[11px]">
            <thead className="sticky top-0 bg-slate-950 text-slate-400">
              <tr>
                <th className="text-left p-2 font-semibold">Semana</th>
                <th className="text-left p-2 font-semibold">Dias</th>
                <th className="text-right p-2 font-semibold">Peso vivo</th>
                <th className="text-right p-2 font-semibold">Ganho sem.</th>
                <th className="text-right p-2 font-semibold">Ganho acum.</th>
                <th className="text-right p-2 font-semibold">Ração sem.</th>
                <th className="text-right p-2 font-semibold">Ração acum.</th>
              </tr>
            </thead>
            <tbody>
              {semanas.map((s) => (
                <tr key={s.semana} className="border-t border-slate-800/80 hover:bg-slate-800/40">
                  <td className="p-2 text-slate-300 font-medium">
                    <span className="text-amber-400/90 text-[9px] mr-1">SEM</span>
                    {s.semana}
                  </td>
                  <td className="p-2 text-slate-500">
                    {s.diaInicio}–{s.diaFim}
                  </td>
                  <td className="p-2 text-right text-emerald-300">{s.pesoVivo.toFixed(1)} kg</td>
                  <td className="p-2 text-right text-slate-400">+{s.ganhoSemana.toFixed(1)} kg</td>
                  <td className="p-2 text-right text-sky-300">+{s.ganhoAcumulado.toFixed(1)} kg</td>
                  <td className="p-2 text-right text-amber-300">
                    R$ {formatBRL(s.custoSemana)}
                    {usaPercentPV ? (
                      <span className="block text-[9px] text-slate-500">{s.consumoKg.toFixed(1)} kg</span>
                    ) : null}
                  </td>
                  <td className="p-2 text-right text-white">R$ {formatBRL(s.custoAcumCabeca)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
