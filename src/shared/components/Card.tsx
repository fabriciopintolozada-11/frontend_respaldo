import type { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'bordered' | 'accent' | 'warning' | 'danger' | 'success' | 'public';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: 'p-0',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

const variantStyles = {
  default: 'bg-white border border-slate-200 rounded-2xl shadow-xs transition-all text-slate-900',
  flat: 'bg-white border border-slate-200 rounded-xl text-slate-900',
  bordered: 'bg-white border-2 border-slate-200 rounded-2xl text-slate-900',
  accent: 'bg-white border border-slate-200 shadow-xs rounded-2xl text-slate-900',
  warning: 'bg-white border border-slate-200 rounded-2xl text-slate-900',
  danger: 'bg-white border border-slate-200 rounded-2xl text-slate-900',
  success: 'bg-white border border-slate-200 rounded-2xl text-slate-900',
  public: 'bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-900',
};

export function Card({ children, variant = 'default', padding = 'md', className = '', ...props }: CardProps) {
  return (
    <div className={`${variantStyles[variant]} ${paddingStyles[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
}
