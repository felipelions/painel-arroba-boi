'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, X, Loader2, CheckCircle2, AlertCircle, ArrowRight, Lightbulb } from 'lucide-react';

interface ModalPreencherIAProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

const EXEMPLOS_PROMPT = [
  {
    label: '🐂 Confinamento 300 bois',
    texto: 'Tenho 300 bois de 400kg para confinar durante 90 dias com GMD de 1.4kg/dia. Custo diário de alimentação de R$ 9,50 por animal. Espero vender o boi gordo a R$ 325 a arroba.'
  },
  {
    label: '🌾 Recria em Pasto 200 bezerros',
    texto: 'Quero recriar 200 bezerros de 220kg em 300 hectares de Brachiaria por 180 dias com proteinado de R$ 4,20/dia e GMD esperado de 0.85kg/dia, vendendo a R$ 318/@.'
  },
  {
    label: '☀️ Cenário de Seca Severa',
    texto: 'Simular cenário de seca severa com 450 cabeças, pasto reduzido em 25%, necessidade de semi-confinamento com custo diário de R$ 7,50 e arroba a R$ 310.'
  }
];

export function ModalPreencherIA({ isOpen, onClose, onSuccess }: ModalPreencherIAProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPrompt('');
      setLoading(false);
      setProgress(0);
      setStatusMessage('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleProcessar() {
    if (!prompt.trim()) {
      setError('Por favor, escreva uma breve descrição do que deseja simular.');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(15);
    setStatusMessage('Iniciando conexão com o motor de IA...');

    // Progress animation steps
    const timer1 = setTimeout(() => {
      setProgress(45);
      setStatusMessage('Interpretando parâmetros zootécnicos, custos e mercado...');
    }, 600);

    const timer2 = setTimeout(() => {
      setProgress(75);
      setStatusMessage('Estruturando variáveis de rebanho, nutrição e pastagem...');
    }, 1200);

    try {
      const res = await fetch('/api/ai/preencher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Erro ao processar resumo com IA.');
      }

      setProgress(100);
      setStatusMessage('Cenário interpretado com sucesso! Carregando simulação...');

      setTimeout(() => {
        onSuccess(result.data);
        onClose();
      }, 500);

    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setError(err?.message || 'Falha ao processar simulação com IA.');
      setLoading(false);
      setProgress(0);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Preencher com IA
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  OpenAI
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Descreva sua operação em linguagem natural
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm">
          
          {/* Instrução */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Escreva a quantidade de animais, peso de entrada/saída, GMD, dias de trato, custos diários ou valor projetado da arroba. O motor interpretará os dados e completará a simulação automaticamente.
            </p>
          </div>

          {/* Exemplos Rápidos */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-400">Sugestões rápidas (toque para preencher):</span>
            <div className="flex flex-wrap gap-1.5">
              {EXEMPLOS_PROMPT.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={loading}
                  onClick={() => setPrompt(ex.texto)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all text-left disabled:opacity-50"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-1.5">
            <label htmlFor="prompt-ia" className="block text-xs font-semibold text-slate-300">
              Resumo da sua operação:
            </label>
            <textarea
              id="prompt-ia"
              rows={4}
              disabled={loading}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ex: Quero fazer um confinamento com 350 bois de 390kg durante 85 dias com ganho de 1.4kg ao dia. Custo da diária a R$ 10,00 e quero vender a R$ 330/@..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none disabled:opacity-60"
            />
          </div>

          {/* Progress Bar em tempo real */}
          {loading && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-medium flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {statusMessage}
                </span>
                <span className="font-bold text-slate-400">{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Mensagem de Erro */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading || !prompt.trim()}
            onClick={handleProcessar}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Processar com IA
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

