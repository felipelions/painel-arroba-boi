'use client';

import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Landmark,
  Building2,
  LineChart,
  Scale
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { CenarioResultados, CenarioVariaveis } from '../../types/simulation';

type Alternativa = {
  id: string;
  nome: string;
  descricao: string;
  taxaAnualPct: number;
  rendimento: number;
  capitalFinal: number;
  rentabilidadePeriodoPct: number;
  vsBoi: number;
  cor: string;
  icon: React.ReactNode;
};

function formatBRL(valor: number, casas = 0) {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas
  });
}

function rendimentoComposto(capital: number, taxaAnual: number, dias: number) {
  if (capital <= 0 || dias <= 0) return 0;
  const fator = Math.pow(1 + taxaAnual, dias / 365) - 1;
  return Math.round(capital * fator);
}

interface ResumoFinanceiroViewProps {
  resultados: CenarioResultados;
  variaveis: CenarioVariaveis;
}

export function ResumoFinanceiroView({
  resultados: r,
  variaveis: v
}: ResumoFinanceiroViewProps) {
  const dias = Math.max(1, v.diasPermanencia || 120);
  const capital = Math.max(0, r.custoTotal || 0);
  const receita = r.receitaLiquida || 0;
  const lucroBoi = r.lucro || 0;
  const gasto = capital;
  const capitalFinalBoi = receita;
  const rentabilidadeBoiPct = capital > 0
    ? Math.round((lucroBoi / capital) * 1000) / 10
    : 0;

  // Taxas anuais de referência (estimativa média de mercado)
  const selicAnual = v.taxaJuros > 0 ? v.taxaJuros : 0.1125;
  const cdiAnual = selicAnual; // CDI ≈ Selic
  const cdbAnual = cdiAnual * 1.0; // CDB 100% CDI (média conservadora)
  const poupancaAnual = selicAnual > 0.085 ? selicAnual * 0.7 : 0.0617; // regra atual ~70% Selic
  const fundoAnual = cdiAnual * 0.95; // fundo DI / RF com taxa média ~95% CDI

  const alternativas: Alternativa[] = [
    {
      id: 'boi',
      nome: 'Engorda (Boi)',
      descricao: 'Resultado líquido do lote no ciclo',
      taxaAnualPct: rentabilidadeBoiPct > 0 && dias > 0
        ? Math.round((Math.pow(1 + rentabilidadeBoiPct / 100, 365 / dias) - 1) * 1000) / 10
        : 0,
      rendimento: lucroBoi,
      capitalFinal: capitalFinalBoi,
      rentabilidadePeriodoPct: rentabilidadeBoiPct,
      vsBoi: 0,
      cor: '#10b981',
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      id: 'selic',
      nome: 'Selic / CDI',
      descricao: `Taxa básica ≈ ${(selicAnual * 100).toFixed(1)}% a.a.`,
      taxaAnualPct: Math.round(selicAnual * 1000) / 10,
      rendimento: rendimentoComposto(capital, selicAnual, dias),
      capitalFinal: capital + rendimentoComposto(capital, selicAnual, dias),
      rentabilidadePeriodoPct: capital > 0
        ? Math.round((rendimentoComposto(capital, selicAnual, dias) / capital) * 1000) / 10
        : 0,
      vsBoi: 0,
      cor: '#38bdf8',
      icon: <Landmark className="w-4 h-4" />
    },
    {
      id: 'cdb',
      nome: 'CDB 100% CDI',
      descricao: 'Estimativa média de CDB pós-fixado',
      taxaAnualPct: Math.round(cdbAnual * 1000) / 10,
      rendimento: rendimentoComposto(capital, cdbAnual, dias),
      capitalFinal: capital + rendimentoComposto(capital, cdbAnual, dias),
      rentabilidadePeriodoPct: capital > 0
        ? Math.round((rendimentoComposto(capital, cdbAnual, dias) / capital) * 1000) / 10
        : 0,
      vsBoi: 0,
      cor: '#a78bfa',
      icon: <Building2 className="w-4 h-4" />
    },
    {
      id: 'poupanca',
      nome: 'Poupança',
      descricao: 'Regra aproximada (~70% da Selic)',
      taxaAnualPct: Math.round(poupancaAnual * 1000) / 10,
      rendimento: rendimentoComposto(capital, poupancaAnual, dias),
      capitalFinal: capital + rendimentoComposto(capital, poupancaAnual, dias),
      rentabilidadePeriodoPct: capital > 0
        ? Math.round((rendimentoComposto(capital, poupancaAnual, dias) / capital) * 1000) / 10
        : 0,
      vsBoi: 0,
      cor: '#f472b6',
      icon: <PiggyBank className="w-4 h-4" />
    },
    {
      id: 'fundo',
      nome: 'Fundo DI / RF',
      descricao: 'Estimativa média (~95% do CDI líquido)',
      taxaAnualPct: Math.round(fundoAnual * 1000) / 10,
      rendimento: rendimentoComposto(capital, fundoAnual, dias),
      capitalFinal: capital + rendimentoComposto(capital, fundoAnual, dias),
      rentabilidadePeriodoPct: capital > 0
        ? Math.round((rendimentoComposto(capital, fundoAnual, dias) / capital) * 1000) / 10
        : 0,
      vsBoi: 0,
      cor: '#fbbf24',
      icon: <LineChart className="w-4 h-4" />
    }
  ].map((alt) => ({
    ...alt,
    vsBoi: Math.round(lucroBoi - alt.rendimento)
  }));

  const chartData = alternativas.map((alt) => ({
    nome: alt.id === 'boi' ? 'Boi' : alt.id === 'selic' ? 'Selic' : alt.id === 'cdb' ? 'CDB' : alt.id === 'poupanca' ? 'Poupança' : 'Fundo',
    rendimento: alt.rendimento,
    fill: alt.cor
  }));

  const melhorBanco = alternativas
    .filter((a) => a.id !== 'boi')
    .reduce((melhor, atual) => (atual.rendimento > melhor.rendimento ? atual : melhor));

  const vantagemVsMelhorBanco = Math.round(lucroBoi - melhorBanco.rendimento);
  const meses = Math.round((dias / 30) * 10) / 10;

  const aquisicao = r.custoCompraAnimais || 0;
  const custosOperacao = Math.max(0, (r.custoTotal || 0) - aquisicao);
  const ganhoPuro = lucroBoi;
  const ganhoPuroPorCabeca = r.lucroPorCabeca || 0;
  const quantidade = Math.max(1, v.quantidadeAnimais || 1);
  const aquisicaoPorCabeca = Math.round(aquisicao / quantidade);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-1">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Scale className="w-4 h-4 text-emerald-400" />
          Resumo do ciclo — gasto, ganho e alternativas
        </h3>
        <p className="text-xs text-slate-400">
          Comparativo do capital investido no lote ({dias} dias / {meses} meses) versus aplicações de renda fixa
        </p>
      </div>

      {/* INDICADOR: VALOR PURO DO GANHO */}
      <div className="bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border-2 border-emerald-500/50 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-1">
              Valor puro do ganho
            </div>
            <div className={`text-3xl sm:text-4xl font-black tracking-tight ${
              ganhoPuro >= 0 ? 'text-emerald-300' : 'text-red-300'
            }`}>
              {ganhoPuro >= 0 ? '+' : ''}R$ {formatBRL(ganhoPuro)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              O que realmente sobrou depois de pagar a aquisição e todos os custos do ciclo
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex flex-col items-end gap-1 px-3 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Por boi</span>
              <span className={`text-lg font-black ${ganhoPuro >= 0 ? 'text-white' : 'text-red-300'}`}>
                {ganhoPuroPorCabeca >= 0 ? '+' : ''}R$ {formatBRL(ganhoPuroPorCabeca)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="bg-slate-950/70 rounded-2xl p-3 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">1. Aquisição do gado</span>
            <div className="text-lg font-black text-amber-300 mt-0.5">
              R$ {formatBRL(aquisicao)}
            </div>
            <span className="text-[10px] text-slate-500">
              R$ {formatBRL(aquisicaoPorCabeca)} / cabeça
            </span>
          </div>
          <div className="bg-slate-950/70 rounded-2xl p-3 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">2. Total recebido na venda</span>
            <div className="text-lg font-black text-white mt-0.5">
              R$ {formatBRL(receita)}
            </div>
            <span className="text-[10px] text-slate-500">
              Receita líquida do frigorífico
            </span>
          </div>
          <div className="bg-slate-950/70 rounded-2xl p-3 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">3. Custos além da compra</span>
            <div className="text-lg font-black text-slate-200 mt-0.5">
              R$ {formatBRL(custosOperacao)}
            </div>
            <span className="text-[10px] text-slate-500">
              Ração, fixos, pasto, frete etc.
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-950/80 border border-slate-800 px-3 py-2.5 text-[11px] sm:text-xs text-slate-300 font-medium leading-relaxed">
          <span className="text-slate-500">Conta:</span>{' '}
          <span className="text-white">Recebido</span>
          <span className="text-slate-500"> R$ {formatBRL(receita)}</span>
          <span className="text-slate-500"> − </span>
          <span className="text-amber-300">Aquisição</span>
          <span className="text-slate-500"> R$ {formatBRL(aquisicao)}</span>
          <span className="text-slate-500"> − </span>
          <span className="text-slate-300">Custos</span>
          <span className="text-slate-500"> R$ {formatBRL(custosOperacao)}</span>
          <span className="text-slate-500"> = </span>
          <strong className={ganhoPuro >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            Ganho puro R$ {formatBRL(ganhoPuro)}
          </strong>
        </div>
      </div>

      {/* Totais principais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-wider">
            <TrendingDown className="w-3.5 h-3.5" />
            Quanto vou gastar
          </div>
          <div className="text-2xl font-black text-red-300">
            R$ {formatBRL(gasto)}
          </div>
          <p className="text-[11px] text-slate-500">
            Custo total do lote (compra + operação)
          </p>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Por boi</span>
            <strong className="text-slate-200">R$ {formatBRL(r.custoPorCabeca || 0)}</strong>
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            <Wallet className="w-3.5 h-3.5" />
            Quanto vou receber
          </div>
          <div className="text-2xl font-black text-emerald-300">
            R$ {formatBRL(receita)}
          </div>
          <p className="text-[11px] text-slate-500">
            Receita líquida da venda no frigorífico
          </p>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Por boi</span>
            <strong className="text-slate-200">R$ {formatBRL(r.vendaPorCabeca || 0)}</strong>
          </div>
        </div>

        <div className={`bg-slate-900 border rounded-2xl p-4 space-y-1 ${
          lucroBoi >= 0 ? 'border-amber-500/40' : 'border-red-500/40'
        }`}>
          <div className="flex items-center gap-2 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5" />
            Sobra no bolso
          </div>
          <div className={`text-2xl font-black ${lucroBoi >= 0 ? 'text-amber-300' : 'text-red-300'}`}>
            {lucroBoi >= 0 ? '+' : ''}R$ {formatBRL(lucroBoi)}
          </div>
          <p className="text-[11px] text-slate-500">
            Lucro líquido · {rentabilidadeBoiPct}% no ciclo
          </p>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Por boi</span>
            <strong className={lucroBoi >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              R$ {formatBRL(r.lucroPorCabeca || 0)}
            </strong>
          </div>
        </div>
      </div>

      {/* Veredito rápido */}
      <div className={`rounded-2xl p-4 border ${
        vantagemVsMelhorBanco >= 0
          ? 'bg-emerald-950/40 border-emerald-500/30'
          : 'bg-amber-950/40 border-amber-500/30'
      }`}>
        <p className="text-sm text-white font-bold">
          {vantagemVsMelhorBanco >= 0
            ? `O boi rende cerca de R$ ${formatBRL(vantagemVsMelhorBanco)} a mais que ${melhorBanco.nome} no mesmo prazo.`
            : `Nesse cenário, ${melhorBanco.nome} renderia cerca de R$ ${formatBRL(Math.abs(vantagemVsMelhorBanco))} a mais que o boi.`}
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Estimativa média aplicando o mesmo capital (R$ {formatBRL(capital)}) por {dias} dias.
          Valores de mercado são aproximados e não consideram IR, IOF nem taxas administrativas específicas.
        </p>
      </div>

      {/* Cards das alternativas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {alternativas.map((alt) => {
          const eBoi = alt.id === 'boi';
          return (
            <div
              key={alt.id}
              className={`rounded-2xl p-4 border space-y-2 ${
                eBoi
                  ? 'bg-emerald-950/30 border-emerald-500/40'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${alt.cor}22`, color: alt.cor }}
                  >
                    {alt.icon}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white">{alt.nome}</h4>
                    <p className="text-[10px] text-slate-500">{alt.descricao}</p>
                  </div>
                </div>
                {eBoi && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Seu lote
                  </span>
                )}
              </div>

              <div className="text-xl font-black text-white">
                {alt.rendimento >= 0 ? '+' : ''}R$ {formatBRL(alt.rendimento)}
              </div>
              <div className="text-[11px] text-slate-400 flex justify-between">
                <span>Rentabilidade no ciclo</span>
                <strong style={{ color: alt.cor }}>{alt.rentabilidadePeriodoPct}%</strong>
              </div>
              <div className="text-[11px] text-slate-400 flex justify-between">
                <span>Taxa anual ref.</span>
                <strong className="text-slate-300">{alt.taxaAnualPct}% a.a.</strong>
              </div>
              <div className="text-[11px] text-slate-400 flex justify-between border-t border-slate-800 pt-2">
                <span>Capital ao final</span>
                <strong className="text-white">R$ {formatBRL(alt.capitalFinal)}</strong>
              </div>
              {!eBoi && (
                <div className={`text-[11px] font-bold pt-1 ${
                  alt.vsBoi >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {alt.vsBoi >= 0
                    ? `Boi +R$ ${formatBRL(alt.vsBoi)} vs esta opção`
                    : `Boi −R$ ${formatBRL(Math.abs(alt.vsBoi))} vs esta opção`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Gráfico comparativo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div>
          <h4 className="text-sm font-bold text-white">Rendimento estimado no período</h4>
          <p className="text-xs text-slate-400">
            Lucro/juros gerados pelo mesmo capital em {dias} dias
          </p>
        </div>
        <div className="h-56 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="nome" stroke="#64748b" fontSize={10} interval={0} />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                width={42}
                tickFormatter={(val) => `R$${(Number(val) / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                formatter={(val: number) => [`R$ ${formatBRL(Number(val))}`, 'Rendimento']}
              />
              <Bar dataKey="rendimento" radius={[6, 6, 0, 0]}>
                {chartData.map((item) => (
                  <Cell key={item.nome} fill={item.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela resumo */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3 font-semibold">Aplicação</th>
              <th className="p-3 font-semibold text-right">Taxa a.a.</th>
              <th className="p-3 font-semibold text-right">No ciclo</th>
              <th className="p-3 font-semibold text-right">Rendimento</th>
              <th className="p-3 font-semibold text-right">vs Boi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {alternativas.map((alt) => (
              <tr key={alt.id} className={alt.id === 'boi' ? 'bg-emerald-950/20' : ''}>
                <td className="p-3 font-bold text-white">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: alt.cor }} />
                    {alt.nome}
                  </span>
                </td>
                <td className="p-3 text-right text-slate-300">{alt.taxaAnualPct}%</td>
                <td className="p-3 text-right text-slate-300">{alt.rentabilidadePeriodoPct}%</td>
                <td className="p-3 text-right font-bold text-white">
                  R$ {formatBRL(alt.rendimento)}
                </td>
                <td className={`p-3 text-right font-bold ${
                  alt.id === 'boi'
                    ? 'text-slate-500'
                    : alt.vsBoi >= 0
                      ? 'text-emerald-400'
                      : 'text-red-400'
                }`}>
                  {alt.id === 'boi'
                    ? '—'
                    : `${alt.vsBoi >= 0 ? '+' : ''}R$ ${formatBRL(alt.vsBoi)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-slate-500 leading-relaxed px-1">
        Estimativas educativas com base na Selic do cenário ({(selicAnual * 100).toFixed(2)}% a.a.).
        CDB = 100% CDI · Fundo DI = 95% CDI · Poupança ≈ 70% Selic (quando Selic &gt; 8,5%).
        O rendimento do boi já desconta custos e impostos do ciclo; aplicações financeiras podem ter IR/IOF.
      </p>
    </div>
  );
}
