import type { ReactNode } from 'react';
import { PackageOpen } from 'lucide-react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'dark' | 'light';
  className?: string;
}

export function EmptyState({ icon, title, description, actionLabel, onAction, tone = 'dark', className = '' }: EmptyStateProps) {
  const isLight = tone === 'light';

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed ${
        isLight ? 'border-slate-300 bg-white' : 'border-[#2D3139] bg-[#16191F]/40'
      } ${className}`}
    >
      <div
        className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 ${
          isLight ? 'bg-lime-50 border-lime-200 text-lime-700' : 'bg-[#F9731615] border-[#F9731630] text-[#F97316]'
        }`}
      >
        {icon ?? <PackageOpen className="w-7 h-7" />}
      </div>
      <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{title}</h3>
      <p className={`mt-1 text-sm max-w-sm ${isLight ? 'text-slate-500' : 'text-[#8E949F]'}`}>{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`mt-5 min-h-[44px] px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
            isLight
              ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950'
              : 'border-[#2D3139] bg-[#1C2028] text-[#E0E2E6] hover:bg-[#2D3139] hover:text-white'
          }`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
