import React, { useState } from 'react';
import { Filter, X, ChevronDown, RotateCcw } from 'lucide-react';
import type { Filtros, PeriodoFiltro } from '../types';

interface FilterOptions {
  fontes: string[];
  tipos: string[];
  ufs: string[];
  pracas: string[];
}

interface FiltersProps {
  filtros: Filtros;
  onChange: (filtros: Filtros) => void;
  onApply: () => void;
  options?: FilterOptions;
  totalFiltered?: number;
  totalTotal?: number;
  onReset?: () => void;
}

export function Filters({
  filtros,
  onChange,
  onApply,
  options,
  totalFiltered,
  totalTotal,
  onReset
}: FiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const periodos: { value: PeriodoFiltro; label: string }[] = [
    { value: '1M', label: '1 Mês' },
    { value: '3M', label: '3 Meses' },
    { value: '1A', label: '1 Ano' },
    { value: '5A', label: '5 Anos' },
    { value: 'MAX', label: 'Todo Histórico' }
  ];

  const fontes = options?.fontes || ['Todas', 'CEPEA', 'CotacaoDoDia'];
  const tipos = options?.tipos || ['Todos', 'Boi Gordo'];
  const ufs = options?.ufs || ['Todas', 'SP'];
  const pracas = options?.pracas || ['Todas', 'São Paulo'];

  const hasActiveFilters =
    filtros.periodo !== '1A' ||
    filtros.fonte !== 'Todas' ||
    filtros.tipo !== 'Todos' ||
    filtros.uf !== 'Todas' ||
    filtros.praca !== 'Todas';

  return (
    <>
      {/* Mobile: Botão de Acionamento dos Filtros */}
      <div className="lg:hidden space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex-1 flex items-center justify-between px-4 py-3 bg-slate-800/90 text-white rounded-xl border border-slate-700 hover:border-emerald-500 transition-colors shadow-lg"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-xs">Filtrar Cotações</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{periodos.find(p => p.value === filtros.periodo)?.label}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {hasActiveFilters && onReset && (
            <button
              type="button"
              onClick={onReset}
              title="Restaurar padrão"
              className="p-3 bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Indicador de registros filtrados no mobile */}
        {typeof totalFiltered === 'number' && (
          <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
            <span>
              Exibindo <strong>{(totalFiltered ?? 0).toLocaleString('pt-BR')}</strong> registros
            </span>
            {hasActiveFilters && (
              <span className="text-emerald-400 font-medium">Filtros ativos</span>
            )}
          </div>
        )}
      </div>

      {/* Mobile: Modal / Bottom Sheet */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-2xl max-h-[85vh] overflow-y-auto border-t border-slate-700 p-4 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Filter className="w-4 h-4 text-emerald-400" />
                  Filtrar Cotações
                </h3>
                <p className="text-xs text-slate-400">Selecione os parâmetros de consulta</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <FilterSection
                label="Período"
                value={filtros.periodo}
                options={periodos.map(p => ({ value: p.value, label: p.label }))}
                onChange={(value) => onChange({ ...filtros, periodo: value as PeriodoFiltro })}
              />

              <FilterSection
                label="Fonte de Dados"
                value={filtros.fonte}
                options={fontes.map(f => ({ value: f, label: f }))}
                onChange={(value) => onChange({ ...filtros, fonte: value })}
              />

              <FilterSection
                label="Tipo de Animal"
                value={filtros.tipo}
                options={tipos.map(t => ({ value: t, label: t }))}
                onChange={(value) => onChange({ ...filtros, tipo: value })}
              />

              <FilterSection
                label="Estado (UF)"
                value={filtros.uf}
                options={ufs.map(u => ({ value: u, label: u }))}
                onChange={(value) => onChange({ ...filtros, uf: value })}
              />

              <FilterSection
                label="Praça de Comercialização"
                value={filtros.praca}
                options={pracas.map(p => ({ value: p, label: p }))}
                onChange={(value) => onChange({ ...filtros, praca: value })}
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              {onReset && (
                <button
                  type="button"
                  onClick={() => {
                    onReset();
                    setIsOpen(false);
                  }}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                >
                  Restaurar Padrão
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onApply();
                  setIsOpen(false);
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-lg"
              >
                Ver Resultados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop: Barra de Filtros Inline */}
      <div className="hidden lg:flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            label="Período"
            value={filtros.periodo}
            options={periodos.map(p => ({ value: p.value, label: p.label }))}
            onChange={(value) => {
              onChange({ ...filtros, periodo: value as PeriodoFiltro });
              onApply();
            }}
          />

          <FilterSelect
            label="Fonte"
            value={filtros.fonte}
            options={fontes.map(f => ({ value: f, label: f }))}
            onChange={(value) => {
              onChange({ ...filtros, fonte: value });
              onApply();
            }}
          />

          <FilterSelect
            label="Tipo"
            value={filtros.tipo}
            options={tipos.map(t => ({ value: t, label: t }))}
            onChange={(value) => {
              onChange({ ...filtros, tipo: value });
              onApply();
            }}
          />

          <FilterSelect
            label="UF"
            value={filtros.uf}
            options={ufs.map(u => ({ value: u, label: u }))}
            onChange={(value) => {
              onChange({ ...filtros, uf: value });
              onApply();
            }}
          />

          <FilterSelect
            label="Praça"
            value={filtros.praca}
            options={pracas.map(p => ({ value: p, label: p }))}
            onChange={(value) => {
              onChange({ ...filtros, praca: value });
              onApply();
            }}
          />
        </div>

        {/* Ações e Contador de Registros */}
        <div className="flex items-center gap-3 text-xs">
          {typeof totalFiltered === 'number' && (
            <span className="text-slate-400">
              <strong className="text-white">{totalFiltered.toLocaleString('pt-BR')}</strong> registros
            </span>
          )}

          {hasActiveFilters && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

interface FilterSectionProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function FilterSection({ label, value, options, onChange }: FilterSectionProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-300">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              value === option.value
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 bg-slate-950 text-white rounded-xl border border-slate-700 hover:border-emerald-500 focus:border-emerald-500 focus:outline-none transition-colors text-xs font-medium cursor-pointer"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-slate-900 text-white">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}