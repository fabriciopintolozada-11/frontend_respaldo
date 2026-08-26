import type { ReactNode } from 'react';
import { Card } from './Card';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  variant?: 'default' | 'accent' | 'warning' | 'danger';
  theme?: 'dark' | 'light';
  className?: string;
}

export function MetricCard({ title, value, subtitle, icon, variant = 'default', theme = 'dark', className = '' }: MetricCardProps) {
  const isLight = theme === 'light';

  return (
    <Card variant={isLight ? 'public' : variant} className={`relative overflow-hidden ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-[#8E949F]'}`}>{title}</p>
          <p className={`mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${isLight ? 'text-slate-950' : 'text-white'}`}>{value}</p>
          {subtitle && <p className={`mt-1 text-xs font-medium ${isLight ? 'text-slate-600' : 'text-[#8E949F]'}`}>{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${isLight ? 'bg-lime-50 text-lime-700 border border-lime-200' : 'bg-[#F9731615] text-[#F97316] border border-[#F9731630]'}`}>{icon}</div>
      </div>
    </Card>
  );
}
