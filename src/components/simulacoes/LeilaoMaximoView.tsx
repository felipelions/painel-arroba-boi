'use client';

import React, { useState } from 'react';
import { Gavel, AlertTriangle, CheckCircle2, TrendingDown, Target } from 'lucide-react';
import { CenarioResultados, CenarioVariaveis } from '../../types/simulation';

function formatBRL(valor: number, casas = 0) {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas
  });
}

interface LeilaoMaximoViewProps {
  resultados: CenarioResultados;
  variaveis: CenarioVariaveis;
}

export function LeilaoMaximoView({
  resultados: r,
  variaveis: v
}: LeilaoMaximoViewProps) {
  const quantidade = Math.max(1, v.quantidadeAnimais || 1);
  const pesoEntrada = v.pesoMedioEntrada > 0 ? v.pesoMedioEntrada : v.pesoMedioAtual;
  const arrobasEntrada = Math.max(0.1, Math.round((pesoEntrada / 30) * 10) / 10);
  const receita = r.receitaLiquida || 0;
  const aquisicaoAtual = r.custoCompraAnimais || 0;
  const custoEngorda = Math.max(0, (r.custoTotal || 0) - aquisicaoAtual);
  const precoAtualCabeca = quantidade > 0 ? Math.round(aquisicaoAtual / quantidade) : 0;
  const precoAtualArroba = v.precoCompraArrobaBoiMagro && v.precoCompraArrobaBoiMagro > 0
    ? v.precoCompraArrobaBoiMagro
    : Math.round((precoAtualCabeca / arrobasEntrada) * 100) / 100;

  // Lucro mínimo desejado por cabeça (0 = preço de empate)
  const [lucroMinPorCabeca, setLucroMinPorCabeca] = useState(300);

  const lucroMinTotal = Math.round(lucroMinPorCabeca * quantidade);
  const tetoCompraTotal = Math.round(receita - custoEngorda - lucroMinTotal);
  const tetoPorCabeca = Math.max(0, Math.round(tetoCompraTotal / quantidade));
  const tetoPorArroba = Math.max(0, Math.round((tetoPorCabeca / arrobasEntrada) * 100) / 100);

  // Empate absoluto (lucro zero)
  const empatePorCabeca = Math.max(0, Math.round((receita - custoEngorda) / quantidade));
  const empatePorArroba = Math.max(0, Math.round((empatePorCabeca / arrobasEntrada) * 100) / 100);

  const folgaVsAtual = tetoPorCabeca - precoAtualCabeca;
  const folgaPct = precoAtualCabeca > 0
    ? Math.round((folgaVsAtual / precoAtualCabeca) * 1000) / 10
    : 0;

  const status =
    folgaVsAtual > 50 ? 'folga' :
    folgaVsAtual >= -50 ? 'limite' :
    'acima';

  const presets = [
    { label: 'Empate', valor: 0 },
    { label: 'R$ 200/boi', valor: 200 },
    { label: 'R$ 300/boi', valor: 300 },
    { label: 'R$ 500/boi', valor: 500 },
    { label: 'R$ 800/boi', valor: 800 }
  ];

  const vendaPorCabeca = r.vendaPorCabeca || Math.round(receita / Math.max(1, r.animaisAbatidos || quantidade));
  const engordaPorCabeca = Math.round(custoEngorda / quantidade);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-1">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Gavel className="w-4 h-4 text-amber-400" />
          Calculadora de leilão — até quanto pagar no boi
        </h3>
        <p className="text-xs text-slate-400">
          Com base na venda projetada e em todos os custos de engorda do seu cenário
        </p>
      </div>

      {/* Indicador principal: TETO DE COMPRA */}
      <div className={`rounded-3xl p-4 sm:p-6 border-2 shadow-xl space-y-4 ${
        status === 'folga'
          ? 'bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border-emerald-500/50'
          : status === 'limite'
            ? 'bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-900 border-amber-500/50'
            : 'bg-gradient-to-br from-red-950/60 via-slate-900 to-slate-900 border-red-500/50'
      }`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1">
              Preço máximo no leilão
            </div>
            <div className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              R$ {formatBRL(tetoPorCabeca)}
              <span className="text-base sm:text-lg font-bold text-slate-400 ml-2">/boi</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40">
              <span className="text-amber-300 font-black text-lg">
                R$ {formatBRL(tetoPorArroba, 2)}/@
              </span>
              <span className="text-[10px] text-slate-400">
                ({arrobasEntrada} @ · {pesoEntrada} kg)
              </span>
            </div>
          </div>

          <div className={`px-3 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            status === 'folga'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : status === 'limite'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-red-500/15 border-red-500/40 text-red-300'
          }`}>
            {status === 'folga' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {status === 'folga'
              ? `Folga de R$ ${formatBRL(folgaVsAtual)} vs preço atual`
              : status === 'limite'
                ? 'Perto do preço atual de compra'
                : `Atual está R$ ${formatBRL(Math.abs(folgaVsAtual))} acima do teto`}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
          <div className="bg-slate-950/70 rounded-2xl p-3 border border-slate-800">
            <span className="text-slate-500 block">Preço atual (cenário)</span>
            <strong className="text-white text-sm">R$ {formatBRL(precoAtualCabeca)}/boi</strong>
            <div className="text-slate-500">R$ {formatBRL(precoAtualArroba, 2)}/@</div>
          </div>
          <div className="bg-slate-950/70 rounded-2xl p-3 border border-slate-800">
            <span className="text-slate-500 block">Empate (lucro zero)</span>
            <strong className="text-amber-300 text-sm">R$ {formatBRL(empatePorCabeca)}/boi</strong>
            <div className="text-slate-500">R$ {formatBRL(empatePorArroba, 2)}/@</div>
          </div>
          <div className="bg-slate-950/70 rounded-2xl p-3 border border-slate-800">
            <span className="text-slate-500 block">Lucro mínimo desejado</span>
            <strong className="text-emerald-300 text-sm">R$ {formatBRL(lucroMinPorCabeca)}/boi</strong>
            <div className="text-slate-500">Total R$ {formatBRL(lucroMinTotal)}</div>
          </div>
          <div className="bg-slate-950/70 rounded-2xl p-3 border border-slate-800">
            <span className="text-slate-500 block">Folga vs atual</span>
            <strong className={`text-sm ${folgaVsAtual >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {folgaVsAtual >= 0 ? '+' : ''}R$ {formatBRL(folgaVsAtual)}
            </strong>
            <div className="text-slate-500">{folgaPct >= 0 ? '+' : ''}{folgaPct}%</div>
          </div>
        </div>
      </div>

      {/* Controle: lucro mínimo desejado */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-400" />
              Lucro mínimo que eu quero por boi
            </h4>
            <p className="text-[11px] text-slate-400">
              Quanto menor o lucro exigido, maior o teto que você pode pagar no leilão
            </p>
          </div>
          <div className="text-lg font-black text-emerald-300">
            R$ {formatBRL(lucroMinPorCabeca)}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.valor}
              type="button"
              onClick={() => setLucroMinPorCabeca(p.valor)}
              className={`px-3 py-2.5 min-h-11 rounded-xl text-xs font-bold border transition-colors ${
                lucroMinPorCabeca === p.valor
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLucroMinPorCabeca(Math.max(0, lucroMinPorCabeca - 50))}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
          >
            −50
          </button>
          <input
            type="range"
            min={0}
            max={1500}
            step={50}
            value={lucroMinPorCabeca}
            onChange={(e) => setLucroMinPorCabeca(parseInt(e.target.value, 10))}
            className="flex-1 accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <button
            type="button"
            onClick={() => setLucroMinPorCabeca(Math.min(1500, lucroMinPorCabeca + 50))}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
          >
            +50
          </button>
        </div>
      </div>

      {/* Conta didática */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <TrendingDown className="w-4 h-4 text-slate-400" />
          Como o teto é calculado (por boi)
        </h4>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
            <span className="text-slate-400">Venda líquida projetada</span>
            <strong className="text-emerald-400">+ R$ {formatBRL(vendaPorCabeca)}</strong>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
            <span className="text-slate-400">− Custos de engorda (ração, fixos, pasto…)</span>
            <strong className="text-red-300">− R$ {formatBRL(engordaPorCabeca)}</strong>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
            <span className="text-slate-400">− Lucro mínimo desejado</span>
            <strong className="text-amber-300">− R$ {formatBRL(lucroMinPorCabeca)}</strong>
          </div>
          <div className="flex justify-between items-center py-2.5 bg-amber-500/10 rounded-xl px-3 border border-amber-500/30">
            <span className="text-amber-200 font-bold">= Máximo a pagar no leilão</span>
            <strong className="text-amber-300 text-base">R$ {formatBRL(tetoPorCabeca)}/boi</strong>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 leading-relaxed">
          Conta do lote: Receita R$ {formatBRL(receita)} − Engorda R$ {formatBRL(custoEngorda)} − Lucro mínimo R$ {formatBRL(lucroMinTotal)} = teto de compra R$ {formatBRL(Math.max(0, tetoCompraTotal))}
          ({quantidade} cabeças · {arrobasEntrada} @ de entrada).
        </p>
      </div>

      {/* Dica prática */}
      <div className="rounded-2xl p-4 border border-slate-800 bg-slate-950/60 space-y-2">
        <p className="text-xs text-white font-bold">No leilão, use assim:</p>
        <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc pl-4">
          <li>
            Não passe de <strong className="text-amber-300">R$ {formatBRL(tetoPorCabeca)}/boi</strong> ou{' '}
            <strong className="text-amber-300">R$ {formatBRL(tetoPorArroba, 2)}/@</strong> se quiser pelo menos R$ {formatBRL(lucroMinPorCabeca)} de lucro por animal.
          </li>
          <li>
            No empate (sem lucro), o limite sobe para <strong className="text-white">R$ {formatBRL(empatePorCabeca)}/boi</strong>.
          </li>
          <li>
            Se o lance passar disso, o lote tende a ficar no vermelho com os custos atuais de engorda e venda.
          </li>
        </ul>
      </div>
    </div>
  );
}
