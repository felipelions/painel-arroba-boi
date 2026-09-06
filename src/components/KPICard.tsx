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
      <div className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-700/50 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-24 mb-3" />
        <div className="h-8 bg-slate-700 rounded w-32 mb-2" />
        <div className="h-3 bg-slate-700 rounded w-20" />
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
    <div className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-700/50 hover:border-emerald-500/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        {icon && <div className="text-emerald-500">{icon}</div>}
      </div>
      
      <div className="space-y-1">
        <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
        
        {(subtitle || trendValue) && (
          <div className="flex items-center gap-2 text-sm">
            {trendValue && (
              <span className={`flex items-center gap-1 ${trendColor}`}>
                <TrendIcon className="w-3 h-3" />
                {trendValue}
              </span>
            )}
            {subtitle && (
              <span className="text-slate-400">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}