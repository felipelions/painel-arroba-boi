import { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import type { Filtros, PeriodoFiltro } from '../types';

interface FiltersProps {
  filtros: Filtros;
  onChange: (filtros: Filtros) => void;
  onApply: () => void;
}

export function Filters({ filtros, onChange, onApply }: FiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const periodos: { value: PeriodoFiltro; label: string }[] = [
    { value: '1M', label: '1 Mês' },
    { value: '3M', label: '3 Meses' },
    { value: '1A', label: '1 Ano' },
    { value: '5A', label: '5 Anos' },
    { value: 'MAX', label: 'Máximo' }
  ];

  const fontes = ['Todas', 'CEPEA', 'CotacaoDoDia'];
  const tipos = ['Todos', 'Boi Gordo', 'Boi Magro'];
  const ufs = ['Todas', 'SP', 'MS', 'MT', 'GO', 'MG', 'PR'];
  const pracas = ['Todas', 'São Paulo', 'Nacional', 'Campo Grande', 'Cuiabá'];

  return (
    <>
      {/* Mobile: Bottom Sheet Trigger */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 hover:border-emerald-500 transition-colors touch-target"
        >
          <Filter className="w-5 h-5" />
          <span className="font-medium">Filtros</span>
          <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Mobile: Bottom Sheet */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-4 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Filtros</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors touch-target"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <FilterSection
                label="Período"
                value={filtros.periodo}
                options={periodos.map(p => ({ value: p.value, label: p.label }))}
                onChange={(value) => onChange({ ...filtros, periodo: value as PeriodoFiltro })}
              />
              
              <FilterSection
                label="Fonte"
                value={filtros.fonte}
                options={fontes.map(f => ({ value: f, label: f }))}
                onChange={(value) => onChange({ ...filtros, fonte: value })}
              />
              
              <FilterSection
                label="Tipo Animal"
                value={filtros.tipo}
                options={tipos.map(t => ({ value: t, label: t }))}
                onChange={(value) => onChange({ ...filtros, tipo: value })}
              />
              
              <FilterSection
                label="UF"
                value={filtros.uf}
                options={ufs.map(u => ({ value: u, label: u }))}
                onChange={(value) => onChange({ ...filtros, uf: value })}
              />
              
              <FilterSection
                label="Praça"
                value={filtros.praca}
                options={pracas.map(p => ({ value: p, label: p }))}
                onChange={(value) => onChange({ ...filtros, praca: value })}
              />

              <button
                onClick={() => {
                  onApply();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors touch-target"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop: Inline Filters */}
      <div className="hidden lg:flex flex-wrap gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
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
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors touch-target ${
              value === option.value
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
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
      <label className="text-xs font-medium text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-600 hover:border-emerald-500 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}