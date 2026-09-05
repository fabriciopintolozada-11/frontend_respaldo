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

  const iconStyle = isLight
    ? variant === 'danger'
      ? 'bg-red-50 text-red-700 border border-red-200'
      : variant === 'warning'
        ? 'bg-amber-50 text-amber-700 border border-amber-200'
        : 'bg-lime-50 text-lime-700 border border-lime-200'
    : 'bg-[#F9731615] text-[#F97316] border border-[#F9731630]';

  const valueStyle = isLight
    ? variant === 'danger'
      ? 'text-red-700'
      : variant === 'warning'
        ? 'text-amber-700'
        : 'text-slate-950'
    : 'text-white';

  return (
    <Card variant={isLight ? 'public' : variant} className={`relative overflow-hidden ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-[#8E949F]'}`}>{title}</p>
          <p className={`mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${valueStyle}`}>{value}</p>
          {subtitle && <p className={`mt-1 text-xs font-medium ${isLight ? 'text-slate-600' : 'text-[#8E949F]'}`}>{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${iconStyle}`}>{icon}</div>
      </div>
    </Card>
  );
}
