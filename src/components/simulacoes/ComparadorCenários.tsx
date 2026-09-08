'use client';

import React from 'react';
import { CenarioCompleto } from '../../types/simulation';
import { Award, TrendingUp, ShieldAlert, DollarSign, BarChart3, Check } from 'lucide-react';

interface ComparadorCenáriosProps {
  cenarios: CenarioCompleto[];
  cenarioAtualId: string;
  onSelectCenario: (id: string) => void;
}

export function ComparadorCenários({
  cenarios,
  cenarioAtualId,
  onSelectCenario
}: ComparadorCenáriosProps) {
  if (!cenarios || cenarios.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
        Nenhum cenário disponível para comparação.
      </div>
    );
  }

  // Identifica os melhores indicadores entre os cenários
  const maiorLucro = Math.max(...cenarios.map(c => c.resultados.lucro));
  const maiorMargem = Math.max(...cenarios.map(c => c.resultados.margemLiquida));
  const menorRisco = Math.min(...cenarios.map(c => c.resultados.scoreRisco));
  const menorCapital = Math.min(...cenarios.map(c => c.resultados.capitalNecessario));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Comparativo de Cenários da Propriedade
          </h3>
          <p className="text-xs text-slate-400">
            Compare o impacto econômico e risco de até {cenarios.length} cenários lado a lado
          </p>
        </div>
      </div>

      {/* Tabela Responsiva com Scroll Horizontal no Mobile */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900">
              <th className="p-3.5 sm:p-4 text-xs font-semibold text-slate-400">
                Indicador Estratégico
              </th>
              {cenarios.map(c => {
                const isSelected = c.id === cenarioAtualId;
                return (
                  <th
                    key={c.id}
                    className={`p-3.5 sm:p-4 text-xs font-bold ${
                      isSelected ? 'text-emerald-400 bg-emerald-950/20' : 'text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate max-w-[160px]">{c.nome}</span>
                      {isSelected && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Ativo
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            
            {/* Lucro Projetado */}
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="p-3.5 sm:p-4 font-semibold text-slate-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Lucro Projetado
              </td>
              {cenarios.map(c => {
                const isBest = c.resultados.lucro === maiorLucro && cenarios.length > 1;
                return (
                  <td key={c.id} className="p-3.5 sm:p-4">
                    <div className="font-bold text-sm text-white">
                      R$ {(c.resultados?.lucro ?? 0).toLocaleString('pt-BR')}
                    </div>
                    {isBest && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 mt-0.5">
                        <Award className="w-3 h-3" /> Maior Lucro
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Rebanho Ativo */}
            <tr className="hover:bg-slate-800/30 transition-colors bg-slate-800/20">
              <td className="p-3.5 sm:p-4 font-semibold text-slate-300">
                Rebanho Ativo (Compradas / Vivas)
              </td>
              {cenarios.map(c => (
                <td key={c.id} className="p-3.5 sm:p-4 font-bold text-emerald-400">
                  {c.resultados?.rebanhoVivoAtual ?? c.variaveis?.quantidadeAnimais ?? 0} cab vivas
                  <span className="block text-[10px] text-slate-400 font-normal">
                    (compradas: {c.resultados?.quantidadeComprada ?? c.variaveis?.quantidadeAnimais ?? 0})
                  </span>
                </td>
              ))}
            </tr>

            {/* Investimento em Compra de Gado */}
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="p-3.5 sm:p-4 font-semibold text-amber-300">
                Investimento em Compra de Gado
              </td>
              {cenarios.map(c => (
                <td key={c.id} className="p-3.5 sm:p-4 font-bold text-amber-300">
                  R$ {(c.resultados?.custoCompraAnimais ?? 0).toLocaleString('pt-BR')}
                  <span className="block text-[10px] text-slate-400 font-normal">
                    R$ {(c.resultados?.custoCompraPorCabeca ?? 0).toLocaleString('pt-BR')} /cab
                  </span>
                </td>
              ))}
            </tr>

            {/* Margem Líquida */}
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="p-3.5 sm:p-4 font-semibold text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Margem Líquida
              </td>
              {cenarios.map(c => {
                const isBest = c.resultados.margemLiquida === maiorMargem && cenarios.length > 1;
                return (
                  <td key={c.id} className="p-3.5 sm:p-4">
                    <span className="font-bold text-slate-200">
                      {c.resultados.margemLiquida}%
                    </span>
                    {isBest && (
                      <span className="block text-[10px] font-semibold text-blue-400 mt-0.5">
                        Maior Margem
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Lucro por Cabeça */}
            <tr className="hover:bg-slate-800/30 transition-colors bg-emerald-950/10">
              <td className="p-3.5 sm:p-4 font-semibold text-emerald-400">
                Lucro Líquido por Cabeça
              </td>
              {cenarios.map(c => (
                <td key={c.id} className="p-3.5 sm:p-4">
                  <span className="font-bold text-emerald-400 text-sm">
                    R$ {(c.resultados.lucroPorCabeca || (c.resultados.animaisAbatidos > 0 ? Math.round(c.resultados.lucro / c.resultados.animaisAbatidos) : 0)).toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">/boi</span>
                </td>
              ))}
            </tr>

            {/* Custo da Arroba Produzida (@) */}
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="p-3.5 sm:p-4 font-semibold text-slate-300">
                Custo da @ Produzida (Engorda)
              </td>
              {cenarios.map(c => (
                <td key={c.id} className="p-3.5 sm:p-4">
                  <span className="font-bold text-amber-300">
                    R$ {(c.resultados.custoArrobaProduzida || 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">/@ engordada</span>
                </td>
              ))}
            </tr>

            {/* Comparativo com a Selic */}
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="p-3.5 sm:p-4 font-semibold text-slate-300">
                Comparativo com a Selic
              </td>
              {cenarios.map(c => {
                const rel = c.resultados.comparativoSelic?.relacaoComSelic || 0;
                return (
                  <td key={c.id} className="p-3.5 sm:p-4">
                    <span className={`font-bold ${rel >= 1.5 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {rel > 0 ? `${rel}x a Selic` : '-'}
                    </span>
                    {c.resultados.comparativoSelic && (
                      <span className="text-[10px] text-slate-400 block">
                        +{c.resultados.comparativoSelic.rentabilidadeBoiPeriodo}% no ciclo
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Score de Risco */}
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="p-3.5 sm:p-4 font-semibold text-slate-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Score de Risco (0-100)
              </td>
              {cenarios.map(c => {
                const isBest = c.resultados.scoreRisco === menorRisco && cenarios.length > 1;
                const r = c.resultados.scoreRisco;
                const color = r <= 25 ? 'text-emerald-400' : r <= 50 ? 'text-amber-400' : 'text-red-400';
                return (
                  <td key={c.id} className="p-3.5 sm:p-4">
                    <span className={`font-bold ${color}`}>
                      {r} / 100 ({c.resultados.classificacaoRisco})
                    </span>
                    {isBest && (
                      <span className="block text-[10px] font-semibold text-emerald-400 mt-0.5">
                        Menor Risco
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Capital Necessário */}
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="p-3.5 sm:p-4 font-semibold text-slate-300">
                Capital Necessário (Déficit)
              </td>
              {cenarios.map(c => {
                const isBest = c.resultados.capitalNecessario === menorCapital && cenarios.length > 1;
                return (
                  <td key={c.id} className="p-3.5 sm:p-4">
                    <span className="font-semibold text-slate-300">
                      R$ {(c.resultados?.capitalNecessario ?? 0).toLocaleString('pt-BR')}
                    </span>
                    {isBest && (
                      <span className="block text-[10px] font-semibold text-purple-400 mt-0.5">
                        Menor Aporte
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Ponto de Equilíbrio */}
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="p-3.5 sm:p-4 font-semibold text-slate-300">
                Ponto de Equilíbrio (@)
              </td>
              {cenarios.map(c => (
                <td key={c.id} className="p-3.5 sm:p-4 text-slate-300 font-medium">
                  R$ {c.resultados.precoEquilibrio.toFixed(2)}
                </td>
              ))}
            </tr>

            {/* Produção Arrobas */}
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="p-3.5 sm:p-4 font-semibold text-slate-300">
                Produção (@)
              </td>
              {cenarios.map(c => (
                <td key={c.id} className="p-3.5 sm:p-4 text-slate-300 font-medium">
                  {(c.resultados?.producaoArrobas ?? 0).toLocaleString('pt-BR')} @
                </td>
              ))}
            </tr>

            {/* Arrobas por Hectare */}
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="p-3.5 sm:p-4 font-semibold text-slate-300">
                Produtividade (@ / ha)
              </td>
              {cenarios.map(c => (
                <td key={c.id} className="p-3.5 sm:p-4 text-slate-300 font-medium">
                  {c.resultados.arrobasHectare} @/ha
                </td>
              ))}
            </tr>

            {/* Ação: Selecionar Cenário */}
            <tr>
              <td className="p-3.5 sm:p-4 font-semibold text-slate-400">
                Ação
              </td>
              {cenarios.map(c => {
                const isSelected = c.id === cenarioAtualId;
                return (
                  <td key={c.id} className="p-3.5 sm:p-4">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                        <Check className="w-4 h-4" /> Selecionado
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectCenario(c.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-semibold transition-all"
                      >
                        Carregar Cenário
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
}

