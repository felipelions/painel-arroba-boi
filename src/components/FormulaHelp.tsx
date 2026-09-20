'use client';

import React, { useEffect, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface FormulaHelpProps {
  titulo: string;
  formula: string;
  /** Alinha o balão à direita (útil no canto direito dos cards) */
  align?: 'left' | 'center' | 'right';
  className?: string;
}

/**
 * Ícone ? com explicação da fórmula (toque/clique — mobile-friendly).
 */
export function FormulaHelp({
  titulo,
  formula,
  align = 'center',
  className = ''
}: FormulaHelpProps) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function fechar(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', fechar);
    document.addEventListener('touchstart', fechar);
    return () => {
      document.removeEventListener('mousedown', fechar);
      document.removeEventListener('touchstart', fechar);
    };
  }, [aberto]);

  const pos =
    align === 'right'
      ? 'right-0 left-auto translate-x-0'
      : align === 'left'
        ? 'left-0 translate-x-0'
        : 'left-1/2 -translate-x-1/2';

  const seta =
    align === 'right'
      ? 'right-3 left-auto translate-x-0'
      : align === 'left'
        ? 'left-3 translate-x-0'
        : 'left-1/2 -translate-x-1/2';

  return (
    <span ref={ref} className={`relative inline-flex align-middle ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setAberto((s) => !s);
        }}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-slate-500 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors shrink-0"
        aria-label={`Como calcula: ${titulo}`}
        aria-expanded={aberto}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {aberto && (
        <span
          role="tooltip"
          className={`absolute z-50 bottom-full mb-2 w-64 sm:w-72 p-2.5 rounded-xl bg-slate-950 border border-emerald-500/40 shadow-2xl text-left whitespace-normal ${pos}`}
        >
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
            {titulo}
          </span>
          <span className="block text-[11px] text-slate-300 leading-relaxed font-normal whitespace-pre-line">
            {formula}
          </span>
          <span
            className={`absolute top-full border-4 border-transparent border-t-emerald-500/40 ${seta}`}
          />
        </span>
      )}
    </span>
  );
}
