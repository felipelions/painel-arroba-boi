'use client';

import React, { useMemo, useState } from 'react';
import {
  FileDown,
  Receipt,
  Wallet,
  ShoppingCart,
  Wheat,
  Stethoscope,
  TreePine,
  Users,
  Landmark,
  Truck,
  TrendingUp,
  Scale,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  CenarioResultados,
  CenarioVariaveis,
  FazendaConfig
} from '../../types/simulation';

type LinhaCusto = {
  id: string;
  grupo: string;
  nome: string;
  total: number;
  cor: string;
};

function formatBRL(valor: number, casas = 0) {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas
  });
}

function pct(parte: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.round((parte / total) * 1000) / 10;
}

function montarLinhas(
  r: CenarioResultados,
  v: CenarioVariaveis
): LinhaCusto[] {
  const frete = (r.animaisAbatidos || 0) * (v.freteVendaCabeca || 0);
  const comissao = Math.round((r.receitaBruta || 0) * ((v.comissaoVendaPercent || 0) / 100));
  const senar = r.custoImpostosVenda || 0;
  const fixosGerais = Math.max(
    0,
    (r.custosFixosTotal || 0) - (r.custoArrendamento || 0) - (r.custoMaoDeObra || 0)
  );
  const outrosVar = Math.max(
    0,
    (r.custosVariaveisTotal || 0) -
      (r.custoAlimentacao || 0) -
      (r.custoSanitario || 0) -
      (r.custoPastagem || 0) -
      (r.custoSeguro || 0)
  );

  return [
    { id: 'compra', grupo: 'Aquisição', nome: 'Compra dos animais (boi magro)', total: r.custoCompraAnimais || 0, cor: '#f59e0b' },
    { id: 'racao', grupo: 'Engorda', nome: 'Alimentação e ração', total: r.custoAlimentacao || 0, cor: '#fb923c' },
    { id: 'pasto', grupo: 'Engorda', nome: 'Pastagem (manutenção + reforma)', total: r.custoPastagem || 0, cor: '#34d399' },
    { id: 'sanidade', grupo: 'Engorda', nome: 'Sanidade / vacinas', total: r.custoSanitario || 0, cor: '#a78bfa' },
    { id: 'seguro', grupo: 'Engorda', nome: 'Seguro do rebanho', total: r.custoSeguro || 0, cor: '#818cf8' },
    { id: 'arrend', grupo: 'Engorda', nome: 'Arrendamento', total: r.custoArrendamento || 0, cor: '#38bdf8' },
    { id: 'mao', grupo: 'Engorda', nome: 'Mão de obra', total: r.custoMaoDeObra || 0, cor: '#22d3ee' },
    { id: 'fixos', grupo: 'Engorda', nome: 'Custos fixos gerais', total: fixosGerais, cor: '#94a3b8' },
    { id: 'juros', grupo: 'Engorda', nome: 'Juros / financeiro', total: r.custoFinanceiro || 0, cor: '#64748b' },
    { id: 'outros', grupo: 'Engorda', nome: 'Outros custos variáveis', total: outrosVar, cor: '#78716c' },
    { id: 'senar', grupo: 'Venda*', nome: 'Senar / Funrural', total: senar, cor: '#fb7185' },
    { id: 'frete', grupo: 'Venda*', nome: 'Frete de venda', total: frete, cor: '#f472b6' },
    { id: 'comissao', grupo: 'Venda*', nome: 'Comissão de venda', total: comissao, cor: '#e879f9' }
  ].filter((l) => l.total > 0.5);
}

interface DetalheCustosViewProps {
  resultados: CenarioResultados;
  variaveis: CenarioVariaveis;
  fazenda: FazendaConfig;
  nomeCenario: string;
}

export function DetalheCustosView({
  resultados: r,
  variaveis: v,
  fazenda,
  nomeCenario
}: DetalheCustosViewProps) {
  const [exportando, setExportando] = useState(false);
  const qtd = Math.max(1, v.quantidadeAnimais || 1);
  const abatidos = Math.max(1, r.animaisAbatidos || 1);
  const linhas = useMemo(() => montarLinhas(r, v), [r, v]);

  const custoEngorda = Math.max(0, (r.custoTotal || 0) - (r.custoCompraAnimais || 0));
  const descontosVenda = linhas
    .filter((l) => l.grupo === 'Venda*')
    .reduce((s, l) => s + l.total, 0);

  const pieEngorda = linhas
    .filter((l) => l.grupo === 'Engorda')
    .map((l) => ({ nome: l.nome, valor: l.total, fill: l.cor }));

  const barrasComposicao = [
    { nome: 'Compra', valor: r.custoCompraAnimais || 0, fill: '#f59e0b' },
    { nome: 'Engorda', valor: custoEngorda, fill: '#34d399' },
    { nome: 'Descontos venda*', valor: descontosVenda, fill: '#fb7185' }
  ].filter((b) => b.valor > 0);

  const pesoEntrada = v.pesoMedioEntrada > 0 ? v.pesoMedioEntrada : v.pesoMedioAtual;
  const pesoSaida =
    v.pesoMedioSaida > 0
      ? v.pesoMedioSaida
      : Math.round(pesoEntrada + (v.gmd || 0) * (v.diasPermanencia || 0));

  async function exportarPDF() {
    setExportando(true);
    try {
      const [{ jsPDF }, autoTableMod] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);
      const autoTable = autoTableMod.default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 14;
      let y = 16;

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalhe dos Custos — Painel Arroba Boi', margin, 12);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        `${nomeCenario} · ${fazenda.nome || 'Fazenda'} · ${fazenda.municipio || ''}/${fazenda.estado || ''}`,
        margin,
        20
      );
      doc.text(
        `Gerado em ${new Date().toLocaleString('pt-BR')}`,
        pageW - margin,
        20,
        { align: 'right' }
      );

      y = 36;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Parâmetros do lote', margin, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const params = [
        `Animais: ${v.quantidadeAnimais} (abatidos: ${r.animaisAbatidos}) · Mortalidade: ${((v.mortalidade || 0) * 100).toFixed(1)}%`,
        `Peso: ${pesoEntrada} kg → ${pesoSaida} kg · GMD: ${(v.gmd || 0).toFixed(2)} kg/dia · ${v.diasPermanencia} dias`,
        `Rendimento carcaça: ${((v.rendimentoCarcaca || 0.54) * 100).toFixed(1)}% · @ abatidas: ${(r.producaoArrobas || 0).toLocaleString('pt-BR')}`,
        `Preço venda: R$ ${(v.precoProjetadoArroba || 0).toFixed(2)}/@ · Compra: R$ ${(r.custoCompraPorArroba || 0).toFixed(2)}/@ entrada`
      ];
      params.forEach((line) => {
        doc.text(line, margin, y);
        y += 5;
      });

      y += 2;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Resumo financeiro', margin, y);
      y += 2;

      autoTable(doc, {
        startY: y,
        head: [['Indicador', 'Valor']],
        body: [
          ['Custo total (compra + engorda)', `R$ ${formatBRL(r.custoTotal)}`],
          ['Custo de compra', `R$ ${formatBRL(r.custoCompraAnimais)}`],
          ['Custo de engorda', `R$ ${formatBRL(custoEngorda)}`],
          ['Receita bruta', `R$ ${formatBRL(r.receitaBruta)}`],
          ['Receita líquida', `R$ ${formatBRL(r.receitaLiquida)}`],
          ['Lucro líquido', `R$ ${formatBRL(r.lucro)}`],
          ['Lucro / cabeça', `R$ ${formatBRL(r.lucroPorCabeca)}`],
          ['Margem líquida', `${r.margemLiquida}%`],
          ['ROI', `${r.roi}%`],
          ['Custo / @ abatida', `R$ ${formatBRL(r.custoArroba, 2)}`],
          ['Custo / @ produzida (engorda)', `R$ ${formatBRL(r.custoArrobaProduzida, 2)}`],
          ['Diária total / cab', `R$ ${formatBRL(r.diariaTotalPorCabeca, 2)}`]
        ],
        styles: { fontSize: 8, cellPadding: 2.2 },
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin }
      });

      y = (doc as any).lastAutoTable.finalY + 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('Composição detalhada dos custos', margin, y);
      y += 2;

      autoTable(doc, {
        startY: y,
        head: [['Grupo', 'Item', 'Total lote', 'Por cabeça', '% custo total']],
        body: linhas.map((l) => [
          l.grupo,
          l.nome,
          `R$ ${formatBRL(l.total)}`,
          `R$ ${formatBRL(l.total / (l.grupo === 'Venda*' ? abatidos : qtd))}`,
          l.grupo === 'Venda*'
            ? 'na receita líq.'
            : `${pct(l.total, r.custoTotal)}%`
        ]),
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [30, 41, 59], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin },
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' }
        }
      });

      y = (doc as any).lastAutoTable.finalY + 8;
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Resultado consolidado', margin, y);
      y += 2;

      autoTable(doc, {
        startY: y,
        head: [['Descrição', 'Total', 'Por cabeça']],
        body: [
          ['(+) Receita líquida', `R$ ${formatBRL(r.receitaLiquida)}`, `R$ ${formatBRL(r.vendaPorCabeca)}`],
          ['(−) Custo total', `R$ ${formatBRL(r.custoTotal)}`, `R$ ${formatBRL(r.custoPorCabeca)}`],
          ['(=) Lucro líquido', `R$ ${formatBRL(r.lucro)}`, `R$ ${formatBRL(r.lucroPorCabeca)}`]
        ],
        styles: { fontSize: 9, cellPadding: 2.5 },
        headStyles: { fillColor: [5, 150, 105], textColor: 255 },
        bodyStyles: { fontStyle: 'bold' },
        margin: { left: margin, right: margin }
      });

      y = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(
        '* Descontos de venda (Senar, frete, comissão) já saem da receita líquida e não somam de novo no custo total.',
        margin,
        y,
        { maxWidth: pageW - margin * 2 }
      );
      y += 8;
      doc.text(
        'Documento gerado pelo Painel Arroba Boi — simulação determinística. Valores arredondados.',
        margin,
        y
      );

      const slug = nomeCenario
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40);
      doc.save(`detalhe-custos-${slug || 'cenario'}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Falha ao exportar PDF:', err);
      alert('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div>
          <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            Detalhe dos custos
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Visão completa de aquisição, engorda, venda e resultado — {nomeCenario}
          </p>
        </div>
        <button
          type="button"
          onClick={exportarPDF}
          disabled={exportando}
          className="inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 disabled:opacity-60"
        >
          {exportando ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          {exportando ? 'Gerando PDF…' : 'Exportar PDF'}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Kpi
          icon={<ShoppingCart className="w-4 h-4 text-amber-400" />}
          label="Compra"
          value={`R$ ${formatBRL(r.custoCompraAnimais)}`}
          sub={`${pct(r.custoCompraAnimais, r.custoTotal)}% do custo`}
        />
        <Kpi
          icon={<Wheat className="w-4 h-4 text-emerald-400" />}
          label="Engorda"
          value={`R$ ${formatBRL(custoEngorda)}`}
          sub={`R$ ${formatBRL(custoEngorda / qtd)}/cab`}
        />
        <Kpi
          icon={<Wallet className="w-4 h-4 text-sky-400" />}
          label="Custo total"
          value={`R$ ${formatBRL(r.custoTotal)}`}
          sub={`R$ ${formatBRL(r.custoPorCabeca)}/cab`}
        />
        <Kpi
          icon={<TrendingUp className="w-4 h-4 text-emerald-300" />}
          label="Lucro líquido"
          value={`R$ ${formatBRL(r.lucro)}`}
          sub={`${r.margemLiquida}% margem · ROI ${r.roi}%`}
          highlight={r.lucro >= 0}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <h4 className="text-xs font-bold text-white mb-1">Composição: compra × engorda × venda</h4>
          <p className="text-[10px] text-slate-500 mb-2">
            *Descontos de venda já abatem a receita líquida
          </p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barrasComposicao} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="nome" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  width={42}
                  tickFormatter={(v) =>
                    Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : String(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 12,
                    fontSize: 11
                  }}
                  formatter={(val: number) => [`R$ ${formatBRL(Number(val))}`, 'Valor']}
                />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                  {barrasComposicao.map((b) => (
                    <Cell key={b.nome} fill={b.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <h4 className="text-xs font-bold text-white mb-1">Engorda: onde vai o dinheiro</h4>
          <p className="text-[10px] text-slate-500 mb-2">Distribuição dos custos operacionais do ciclo</p>
          <div className="h-52">
            {pieEngorda.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieEngorda}
                    dataKey="valor"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {pieEngorda.map((e) => (
                      <Cell key={e.nome} fill={e.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: 12,
                      fontSize: 11
                    }}
                    formatter={(val: number, name: string) => [
                      `R$ ${formatBRL(Number(val))}`,
                      name
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 10, color: '#94a3b8' }}
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500 text-center pt-16">Sem custos de engorda</p>
            )}
          </div>
        </div>
      </div>

      {/* Cards por grupo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <GrupoCard
          titulo="Aquisição"
          icon={<ShoppingCart className="w-4 h-4 text-amber-400" />}
          itens={linhas.filter((l) => l.grupo === 'Aquisição')}
          qtd={qtd}
          basePct={r.custoTotal}
        />
        <GrupoCard
          titulo="Engorda"
          icon={<Wheat className="w-4 h-4 text-emerald-400" />}
          itens={linhas.filter((l) => l.grupo === 'Engorda')}
          qtd={qtd}
          basePct={r.custoTotal}
        />
        <GrupoCard
          titulo="Descontos na venda"
          icon={<Truck className="w-4 h-4 text-rose-400" />}
          itens={linhas.filter((l) => l.grupo === 'Venda*')}
          qtd={abatidos}
          basePct={r.receitaBruta}
          nota="Já descontados da receita líquida"
        />
      </div>

      {/* Tabela completa */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Extrato completo de custos
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs whitespace-nowrap">
            <thead className="bg-slate-950 text-slate-400">
              <tr>
                <th className="text-left p-3 font-semibold">Grupo</th>
                <th className="text-left p-3 font-semibold">Item</th>
                <th className="text-right p-3 font-semibold">Total lote</th>
                <th className="text-right p-3 font-semibold">Por cabeça</th>
                <th className="text-right p-3 font-semibold">% custo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {linhas.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/40">
                  <td className="p-3">
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                      style={{ backgroundColor: l.cor }}
                    />
                    <span className="text-slate-400">{l.grupo}</span>
                  </td>
                  <td className="p-3 text-slate-200 font-medium">{l.nome}</td>
                  <td className="p-3 text-right text-white font-bold">
                    R$ {formatBRL(l.total)}
                  </td>
                  <td className="p-3 text-right text-slate-300">
                    R$ {formatBRL(l.total / (l.grupo === 'Venda*' ? abatidos : qtd))}
                  </td>
                  <td className="p-3 text-right text-slate-400">
                    {l.grupo === 'Venda*'
                      ? '—'
                      : `${pct(l.total, r.custoTotal)}%`}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-950 font-bold border-t border-slate-700">
                <td className="p-3 text-red-300" colSpan={2}>
                  CUSTO TOTAL (compra + engorda)
                </td>
                <td className="p-3 text-right text-red-400">
                  R$ {formatBRL(r.custoTotal)}
                </td>
                <td className="p-3 text-right text-red-400">
                  R$ {formatBRL(r.custoPorCabeca)}
                </td>
                <td className="p-3 text-right text-slate-400">100%</td>
              </tr>
              <tr className="bg-slate-950/80 font-bold">
                <td className="p-3 text-slate-200" colSpan={2}>
                  RECEITA LÍQUIDA
                </td>
                <td className="p-3 text-right text-emerald-400">
                  R$ {formatBRL(r.receitaLiquida)}
                </td>
                <td className="p-3 text-right text-emerald-400">
                  R$ {formatBRL(r.vendaPorCabeca)}
                </td>
                <td className="p-3 text-right text-slate-500">—</td>
              </tr>
              <tr className="bg-emerald-950/40 font-black border-t-2 border-emerald-500/40">
                <td className="p-3.5 text-emerald-300" colSpan={2}>
                  LUCRO LÍQUIDO
                </td>
                <td className="p-3.5 text-right text-emerald-400 text-sm">
                  R$ {formatBRL(r.lucro)}
                </td>
                <td className="p-3.5 text-right text-emerald-400">
                  R$ {formatBRL(r.lucroPorCabeca)}/boi
                </td>
                <td className="p-3.5 text-right text-emerald-300">
                  {r.margemLiquida}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Métricas zootécnicas / unitárias */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <Metric icon={<Scale className="w-3.5 h-3.5" />} label="@ abatidas" value={(r.producaoArrobas || 0).toLocaleString('pt-BR')} />
        <Metric icon={<TrendingUp className="w-3.5 h-3.5" />} label="@ produzidas" value={(r.totalArrobasProduzidas || 0).toLocaleString('pt-BR')} />
        <Metric icon={<Wheat className="w-3.5 h-3.5" />} label="Custo/@ engordada" value={`R$ ${formatBRL(r.custoArrobaProduzida, 2)}`} />
        <Metric icon={<Landmark className="w-3.5 h-3.5" />} label="Custo/@ abatida" value={`R$ ${formatBRL(r.custoArroba, 2)}`} />
        <Metric icon={<Users className="w-3.5 h-3.5" />} label="Diária total/cab" value={`R$ ${formatBRL(r.diariaTotalPorCabeca, 2)}`} />
        <Metric icon={<TreePine className="w-3.5 h-3.5" />} label="Lucro/ha" value={`R$ ${formatBRL(r.lucroHectare)}`} />
        <Metric icon={<Stethoscope className="w-3.5 h-3.5" />} label="Rendimento" value={`${r.rendimentoCarcacaPct}%`} />
        <Metric icon={<Scale className="w-3.5 h-3.5" />} label="Carcaça/cab" value={`${r.pesoCarcacaPorCabeca} kg`} />
        <Metric icon={<ShoppingCart className="w-3.5 h-3.5" />} label="Compra/cab" value={`R$ ${formatBRL(r.custoCompraPorCabeca)}`} />
        <Metric icon={<Wallet className="w-3.5 h-3.5" />} label="Preço equilíbrio" value={`R$ ${formatBRL(r.precoEquilibrio, 2)}/@`} />
        <Metric icon={<TrendingUp className="w-3.5 h-3.5" />} label="Margem segurança" value={`${r.margemSeguranca}%`} />
        <Metric icon={<Users className="w-3.5 h-3.5" />} label="Lotação" value={`${r.lotacaoUAPorHa} UA/ha`} />
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  highlight
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 sm:p-3.5 ${
        highlight
          ? 'bg-emerald-950/30 border-emerald-500/30'
          : 'bg-slate-900 border-slate-800'
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-base sm:text-lg font-black text-white truncate">{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}

function GrupoCard({
  titulo,
  icon,
  itens,
  qtd,
  basePct,
  nota
}: {
  titulo: string;
  icon: React.ReactNode;
  itens: LinhaCusto[];
  qtd: number;
  basePct: number;
  nota?: string;
}) {
  const total = itens.reduce((s, i) => s + i.total, 0);
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
          {icon}
          {titulo}
        </h4>
        <strong className="text-xs text-emerald-300">R$ {formatBRL(total)}</strong>
      </div>
      {nota && <p className="text-[10px] text-slate-500">{nota}</p>}
      <ul className="space-y-1.5">
        {itens.length === 0 && (
          <li className="text-[10px] text-slate-500">Sem itens neste grupo</li>
        )}
        {itens.map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-400 truncate flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: i.cor }} />
              {i.nome}
            </span>
            <span className="text-slate-200 font-semibold shrink-0">
              R$ {formatBRL(i.total)}
              <span className="text-slate-500 font-normal ml-1">
                ({pct(i.total, basePct)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
      {total > 0 && (
        <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-1.5">
          R$ {formatBRL(total / Math.max(1, qtd))}/cabeça
        </div>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
      <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-slate-500 tracking-wide mb-0.5">
        <span className="text-slate-400">{icon}</span>
        {label}
      </div>
      <div className="text-xs font-bold text-white truncate">{value}</div>
    </div>
  );
}
