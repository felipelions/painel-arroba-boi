import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: ReactNode;
  loading?: boolean;
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendValue,
  icon,
  loading 
}: KPICardProps) {
  if (loading) {
    return (
      <div className="bg-slate-900/80 rounded-2xl p-3.5 sm:p-5 border border-slate-800 animate-pulse">
        <div className="h-3 bg-slate-800 rounded w-20 mb-2.5" />
        <div className="h-6 bg-slate-800 rounded w-28 mb-2" />
        <div className="h-3 bg-slate-800 rounded w-16" />
      </div>
    );
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' 
    ? 'text-emerald-400' 
    : trend === 'down' 
    ? 'text-red-400' 
    : 'text-slate-400';

  return (
    <div className="bg-slate-900/90 rounded-2xl p-3.5 sm:p-5 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-lg flex flex-col justify-between">
      <div className="flex items-start justify-between gap-1 mb-2">
        <h3 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
        {icon && <div className="text-emerald-400 shrink-0">{icon}</div>}
      </div>
      
      <div className="space-y-1">
        <p className="text-lg sm:text-2xl font-black text-white tracking-tight">{value}</p>
        
        {(subtitle || trendValue) && (
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
            {trendValue && (
              <span className={`flex items-center gap-0.5 font-bold ${trendColor}`}>
                <TrendIcon className="w-3 h-3" />
                {trendValue}
              </span>
            )}
            {subtitle && (
              <span className="text-slate-400 truncate">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}