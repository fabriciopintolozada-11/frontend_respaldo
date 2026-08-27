import type { ReactNode } from 'react';
import { PackageOpen } from 'lucide-react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon, title, description, actionLabel, onAction, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-lime-50 border border-lime-200 text-lime-700 flex items-center justify-center mb-4">
        {icon ?? <PackageOpen className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-bold text-slate-950">{title}</h3>
      <p className="mt-1 text-sm text-slate-600 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
            className="mt-5 min-h-[44px] px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
