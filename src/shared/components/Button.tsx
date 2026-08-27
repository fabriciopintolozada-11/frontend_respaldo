import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] min-h-[44px] min-w-[44px]';

  const sizeStyles = {
    sm: 'px-3 py-2 text-xs gap-1.5 min-h-[44px]',
    md: 'px-4 py-2.5 text-sm gap-2 min-h-[44px]',
    lg: 'px-6 py-3.5 text-base gap-2.5 min-h-[50px]',
  };

  const variantStyles = {
    primary:
      'bg-lime-400 hover:bg-lime-300 text-lime-950 shadow-sm shadow-lime-950/10 focus:ring-lime-400 active:bg-lime-500',
    secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300 hover:text-slate-950 focus:ring-slate-300',
    outline:
      'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 focus:ring-lime-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-lime-400 text-lime-900 hover:bg-lime-500 focus:ring-lime-400',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 hover:text-amber-950 focus:ring-amber-300',
    ghost: 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 focus:ring-slate-300',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Cargando...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
