import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './Button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Ocurrio un error al cargar los datos.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-200 bg-red-50">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="text-sm font-bold text-slate-950">Error</h3>
      <p className="max-w-md text-xs text-slate-600">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950" onClick={onRetry} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
