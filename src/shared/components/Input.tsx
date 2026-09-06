import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  id?: string;
  tone?: 'dark' | 'light';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, leftIcon, rightIcon, id, tone = 'dark', className = '', ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const leadingIcon = icon ?? leftIcon;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={`mb-1.5 block text-xs font-semibold uppercase tracking-wider ${tone === 'light' ? 'text-slate-600' : 'text-[#8E949F]'}`}
          >
            {label}
            {props.required && <span className="text-[#EF4444] ml-1">*</span>}
          </label>
        )}
        <div className="relative rounded-xl shadow-xs">
          {leadingIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E949F]">
              {leadingIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`block min-h-[44px] w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 ${
              tone === 'light'
                ? 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-lime-500 focus:ring-lime-200'
                : 'border-[#2D3139] bg-[#0F1115] text-[#E0E2E6] placeholder:text-[#8E949F]/60 focus:border-[#F97316] focus:ring-[#F97316]'
            } ${leadingIcon ? 'pl-11' : ''} ${rightIcon ? 'pr-11' : ''} ${
              error
                ? tone === 'light'
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                  : 'border-[#EF4444] bg-[#EF444410] focus:border-[#EF4444] focus:ring-[#EF4444]'
                : tone === 'light'
                  ? 'hover:border-slate-400'
                  : 'border-[#2D3139] hover:border-[#3D4149]'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8E949F]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p role="alert" className="mt-1 text-xs font-medium text-[#EF4444]">{error}</p>}
        {!error && helperText && (
          <p className="mt-1 text-xs text-[#8E949F]">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
