import { Check, FileText } from 'lucide-react'
import { Button } from '../../../shared/components/Button'
import { Card } from '../../../shared/components/Card'
import type { CreatedWorkOrderResponse } from '../vehicle-registration.types'

export function WorkOrderSuccess({ order, onNew }: {
  order: CreatedWorkOrderResponse
  onNew: () => void
}) {
  return (
    <Card variant="public" padding="lg" className="w-full text-center" aria-live="polite">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime-100 text-lime-700">
        <Check className="h-8 w-8" />
      </span>
      <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-lime-700">Ingreso registrado</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Orden de Trabajo creada</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">El vehículo quedó registrado y está listo para iniciar su atención.</p>

      <div className="mt-6 flex items-center gap-3 rounded-xl border border-lime-200 bg-lime-50 p-4 text-left">
        <FileText className="h-5 w-5 shrink-0 text-lime-700" />
        <div className="min-w-0 flex-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Orden de Trabajo</span>
          <strong className="mt-1 block truncate font-mono text-sm text-slate-950">{order.id}</strong>
        </div>
        <span className="rounded-full bg-lime-200 px-3 py-1 text-xs font-black text-lime-950">{order.status}</span>
      </div>

      <dl className="my-6 grid gap-4 rounded-xl bg-slate-50 p-4 text-left sm:grid-cols-2">
        <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Fecha de creación</dt><dd className="mt-1 text-sm text-slate-800">{formatDate(order.created_at)}</dd></div>
        <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Reclamo inicial</dt><dd className="mt-1 text-sm text-slate-800">{order.initial_complaint}</dd></div>
      </dl>

      <Button type="button" variant="primary" onClick={onNew}>Registrar otro ingreso</Button>
    </Card>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'long', timeStyle: 'short' }).format(date)
}
