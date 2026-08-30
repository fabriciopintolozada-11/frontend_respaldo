import { Wrench } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Cargando...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-16">
      <div className="relative" aria-hidden="true">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-lime-500" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Wrench className="h-4 w-4 text-lime-600" />
        </div>
      </div>
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  )
}
