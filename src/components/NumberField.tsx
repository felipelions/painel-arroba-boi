'use client';

import React, { useEffect, useState } from 'react';

type NumberFieldProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number | string;
  className?: string;
  disabled?: boolean;
  /** Valor aplicado ao sair do campo vazio (padrão: min ?? 0) */
  emptyValue?: number;
  /** Casas na exibição quando não está focado */
  decimals?: number;
  'aria-label'?: string;
  id?: string;
};

function formatValue(n: number, decimals?: number): string {
  if (!Number.isFinite(n)) return '';
  if (decimals != null) {
    const f = n.toFixed(decimals);
    return f.replace(/\.?0+$/, '') || '0';
  }
  return String(n);
}

function parseLoose(raw: string): number | null {
  const t = raw.trim().replace(',', '.');
  if (t === '' || t === '-' || t === '.' || t === '-.') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/**
 * Input numérico que permite apagar o zero / deixar vazio enquanto digita.
 * Só aplica min/max e emptyValue no blur (ou quando há número válido).
 */
export function NumberField({
  value,
  onChange,
  min,
  max,
  step,
  className,
  disabled,
  emptyValue,
  decimals,
  id,
  'aria-label': ariaLabel
}: NumberFieldProps) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(() => formatValue(value, decimals));

  useEffect(() => {
    if (!focused) {
      setText(formatValue(value, decimals));
    }
  }, [value, focused, decimals]);

  function clamp(n: number): number {
    let out = n;
    if (min != null && Number.isFinite(min)) out = Math.max(min, out);
    if (max != null && Number.isFinite(max)) out = Math.min(max, out);
    return out;
  }

  function commit(raw: string) {
    const parsed = parseLoose(raw);
    if (parsed == null) {
      const fallback = emptyValue ?? min ?? 0;
      const next = clamp(fallback);
      onChange(next);
      setText(formatValue(next, decimals));
      return;
    }
    const next = clamp(parsed);
    onChange(next);
    setText(formatValue(next, decimals));
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      disabled={disabled}
      aria-label={ariaLabel}
      step={step}
      className={className}
      value={focused ? text : formatValue(value, decimals)}
      onFocus={(e) => {
        setFocused(true);
        setText(formatValue(value, decimals));
        // Seleciona tudo para digitar por cima (inclui substituir o 0)
        requestAnimationFrame(() => e.target.select());
      }}
      onChange={(e) => {
        const raw = e.target.value;
        // Permite vazio, sinal e decimal parcial enquanto digita
        if (raw === '' || /^-?\d*[.,]?\d*$/.test(raw)) {
          setText(raw);
          const parsed = parseLoose(raw);
          if (parsed != null) {
            onChange(clamp(parsed));
          }
          // Se vazio: não força 0 no estado pai — deixa apagar
        }
      }}
      onBlur={() => {
        setFocused(false);
        commit(text);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}
