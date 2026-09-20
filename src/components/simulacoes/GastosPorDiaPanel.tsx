'use client';

import React from 'react';
import { Clock } from 'lucide-react';
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

type GastoDiarioItem = {
  id: string;
  nome: string;
  nomeCurto: string;
  totalPeriodo: number;
  porDia: number;
  porCabecaDia: number;
  cor: string;
};

function formatBRL(valor: number, casas = 2) {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas
  });
}

function montarGastosDiarios(
  dias: number,
  quantidade: number,
  r: CenarioResultados,
  v: CenarioVariaveis
): GastoDiarioItem[] {
  const d = Math.max(1, dias);
  const q = Math.max(1, quantidade);
  const freteVenda = (r.animaisAbatidos || 0) * (v.freteVendaCabeca || 0);
  const comissao = (r.receitaBruta || 0) * ((v.comissaoVendaPercent || 0) / 100);
  const conhecidosVariaveis =
    (r.custoAlimentacao || 0) +
    (r.custoSanitario || 0) +
    (r.custoPastagem || 0) +
    (r.custoSeguro || 0);
  const outros = Math.max(0, (r.custosVariaveisTotal || 0) - conhecidosVariaveis);

  return [
    { id: 'alimentacao', nome: 'Alimentação e ração', nomeCurto: 'Ração', totalPeriodo: r.custoAlimentacao || 0, cor: '#f59e0b' },
    { id: 'fixos', nome: 'Arrendamento, mão de obra e fixos', nomeCurto: 'Fixos', totalPeriodo: r.custosFixosTotal || 0, cor: '#38bdf8' },
    { id: 'pastagem', nome: 'Pastagem', nomeCurto: 'Pasto', totalPeriodo: r.custoPastagem || 0, cor: '#34d399' },
    { id: 'sanidade', nome: 'Sanidade e seguro', nomeCurto: 'Sanidade', totalPeriodo: (r.custoSanitario || 0) + (r.custoSeguro || 0), cor: '#a78bfa' },
    { id: 'venda', nome: 'Senar, frete e comissão (venda)', nomeCurto: 'Venda', totalPeriodo: freteVenda + comissao + (r.custoImpostosVenda || 0), cor: '#fb7185' },
    { id: 'financeiro', nome: 'Juros e financeiro', nomeCurto: 'Juros', totalPeriodo: r.custoFinanceiro || 0, cor: '#94a3b8' },
    { id: 'outros', nome: 'Outros custos do lote', nomeCurto: 'Outros', totalPeriodo: outros, cor: '#64748b' }
  ]
    .filter((item) => item.totalPeriodo > 0.5)
    .map((item) => ({
      ...item,
      porDia: Math.round((item.totalPeriodo / d) * 100) / 100,
      porCabecaDia: Math.round((item.totalPeriodo / d / q) * 100) / 100
    }));
}

interface GastosPorDiaPanelProps {
  resultados: CenarioResultados;
  variaveis: CenarioVariaveis;
  variante?: 'compacto' | 'completo';
}

export function GastosPorDiaPanel({
  resultados: r,
  variaveis: v,
  variante = 'completo'
}: GastosPorDiaPanelProps) {
  const dias = Math.max(1, v.diasPermanencia || 1);
  const quantidade = Math.max(1, v.quantidadeAnimais || 1);
  const itens = montarGastosDiarios(dias, quantidade, r, v);
  const gastoDiaLote = itens.reduce((soma, item) => soma + item.porDia, 0);
  const gastoDiaCabeca = quantidade > 0 ? Math.round((gastoDiaLote / quantidade) * 100) / 100 : 0;
  const gastoDiaAlimentacao = itens.find((item) => item.id === 'alimentacao')?.porDia || 0;
  const totalBarra = Math.max(gastoDiaLote, 0.01);
  const custoCompraDia = (r.custoCompraAnimais || 0) / dias;
  const chartData = itens.map((item) => ({
    nome: item.nomeCurto,
    valor: item.porDia,
    fill: item.cor
  }));

  if (itens.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400">
        Ainda não há custos operacionais neste cenário para montar a média diária.
      </div>
    );
  }

  if (variante === 'compacto') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Gastos médios por dia
            </h3>
            <p className="text-[11px] text-slate-400">
              Média operacional nos {dias} dias de trato, sem a compra do gado
            </p>
          </div>
          <span className="text-[11px] text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl font-bold border border-slate-700">
            {dias} dias · {quantidade} cab
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lote / dia</span>
            <div className="text-lg sm:text-xl font-black text-amber-300 mt-1">
              R$ {formatBRL(gastoDiaLote, gastoDiaLote >= 1000 ? 0 : 2)}
            </div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Por boi / dia</span>
            <div className="text-lg sm:text-xl font-black text-white mt-1">
              R$ {formatBRL(gastoDiaCabeca)}
            </div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Só ração / dia</span>
            <div className="text-lg sm:text-xl font-black text-emerald-400 mt-1">
              R$ {formatBRL(gastoDiaAlimentacao, gastoDiaAlimentacao >= 1000 ? 0 : 2)}
            </div>
          </div>
        </div>

        <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-800">
          {itens.map((item) => (
            <div
              key={item.id}
              title={`${item.nome}: R$ ${formatBRL(item.porDia)}/dia`}
              className="h-full"
              style={{ width: `${(item.porDia / totalBarra) * 100}%`, backgroundColor: item.cor }}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">
          {itens.map((item) => (
            <span key={item.id} className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.cor }} />
              {item.nomeCurto} {Math.round((item.porDia / totalBarra) * 100)}%
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Quanto sai de caixa por dia?
          </h4>
          <p className="text-xs text-slate-400">
            Média dos custos operacionais diluída nos {dias} dias do ciclo
          </p>
        </div>
        <div className="text-[11px] text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl font-bold border border-slate-700">
          Compra do gado fica de fora desta média (é um desembolso único)
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/70 p-3 rounded-2xl border border-amber-500/30">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Média do lote</span>
          <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
            R$ {formatBRL(gastoDiaLote, gastoDiaLote >= 1000 ? 0 : 2)}
          </div>
          <span className="text-[10px] text-slate-500">por dia</span>
        </div>
        <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Média por boi</span>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">
            R$ {formatBRL(gastoDiaCabeca)}
          </div>
          <span className="text-[10px] text-slate-500">por cabeça / dia</span>
        </div>
        <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alimentação</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
            R$ {formatBRL(gastoDiaAlimentacao, gastoDiaAlimentacao >= 1000 ? 0 : 2)}
          </div>
          <span className="text-[10px] text-slate-500">ração / dia do lote</span>
        </div>
        <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Se diluir a compra</span>
          <div className="text-xl sm:text-2xl font-black text-slate-200 mt-1">
            R$ {formatBRL(gastoDiaLote + custoCompraDia, 0)}
          </div>
          <span className="text-[10px] text-slate-500">total / dia com o gado</span>
        </div>
      </div>

      <div className="h-56 sm:h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis
              type="number"
              stroke="#64748b"
              fontSize={10}
              tickFormatter={(val) =>
                Number(val) >= 1000 ? `R$${(Number(val) / 1000).toFixed(1)}k` : `R$${Number(val).toFixed(0)}`
              }
            />
            <YAxis
              type="category"
              dataKey="nome"
              stroke="#64748b"
              fontSize={11}
              width={64}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              formatter={(val: number) => [`R$ ${formatBRL(Number(val))} / dia`, 'Média']}
            />
            <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
              {chartData.map((item) => (
                <Cell key={item.nome} fill={item.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3 font-semibold">Item</th>
              <th className="p-3 font-semibold text-right">Por dia (lote)</th>
              <th className="p-3 font-semibold text-right">Por boi / dia</th>
              <th className="p-3 font-semibold text-right">No ciclo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {itens.map((item) => (
              <tr key={item.id}>
                <td className="p-3 text-slate-300 font-medium">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.cor }} />
                    {item.nome}
                  </span>
                </td>
                <td className="p-3 text-right font-bold text-white">R$ {formatBRL(item.porDia)}</td>
                <td className="p-3 text-right text-slate-300">R$ {formatBRL(item.porCabecaDia)}</td>
                <td className="p-3 text-right text-slate-400">R$ {item.totalPeriodo.toLocaleString('pt-BR')}</td>
              </tr>
            ))}
            <tr className="bg-slate-950 font-bold">
              <td className="p-3 text-amber-300">Média operacional / dia</td>
              <td className="p-3 text-right text-amber-300">R$ {formatBRL(gastoDiaLote)}</td>
              <td className="p-3 text-right text-amber-300">R$ {formatBRL(gastoDiaCabeca)}</td>
              <td className="p-3 text-right text-slate-300">
                R$ {Math.round(gastoDiaLote * dias).toLocaleString('pt-BR')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
