import { BatteryWarning, CheckCircle2, Clock3, FileClock, Search, Wrench } from 'lucide-react'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import type { LookupState } from '../vehicle-registration.types'

export function VehicleHistoryPanel({ lookup }: { lookup: LookupState }) {
  if (lookup.status === 'idle') {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-100 text-lime-700">
          <Search className="h-6 w-6" />
        </span>
        <h3 className="mt-4 font-bold text-slate-950">Expediente del vehículo</h3>
        <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">Ingresa una placa válida. La consulta se realizará automáticamente.</p>
      </div>
    )
  }

  if (lookup.status === 'loading') {
    return <LoadingSpinner message="Buscando el expediente del vehículo..." />
  }

  if (lookup.status === 'new') {
    return (
      <div className="flex gap-3 rounded-xl border border-lime-200 bg-lime-50 p-4 text-lime-950" role="status">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lime-600" />
        <div>
          <strong className="font-bold">Vehículo nuevo</strong>
          <p className="mt-1 text-sm leading-6">No existe un expediente para esta placa. Completa los datos para registrarlo.</p>
        </div>
      </div>
    )
  }

  if (lookup.status === 'error') {
    return (
      <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-950" role="alert">
        <FileClock className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <div>
          <strong className="font-bold">No se pudo consultar el expediente</strong>
          <p className="mt-1 text-sm leading-6">{lookup.message}</p>
        </div>
      </div>
    )
  }

  const { data } = lookup
  return (
    <div aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-700">Expediente encontrado</p>
          <h3 className="mt-2 font-mono text-2xl font-black text-slate-950">{data.plate}</h3>
        </div>
        <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold ${data.is_fully_electric ? 'bg-red-100 text-red-800' : 'bg-lime-100 text-lime-900'}`}>
          {data.is_fully_electric ? <BatteryWarning className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {data.is_fully_electric ? '100% eléctrico' : 'Recepción permitida'}
        </span>
      </div>

      <dl className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm">
        <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Cliente registrado</dt><dd className="mt-1 font-semibold text-slate-900">{data.customer_name}</dd></div>
        <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">ID de expediente</dt><dd className="mt-1 truncate font-mono text-slate-700">{data.id}</dd></div>
      </dl>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
        <span className="flex items-center gap-2 text-sm font-bold text-slate-900"><Wrench className="h-4 w-4 text-lime-700" /> Historial técnico</span>
        <strong className="text-xs text-lime-800">{data.history.length} {data.history.length === 1 ? 'registro' : 'registros'}</strong>
      </div>

      {data.history.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">Este vehículo todavía no tiene registros técnicos.</p>
      ) : (
        <ol className="mt-4 space-y-4">
          {data.history.map((item) => (
            <li className="grid grid-cols-[10px_1fr] gap-3" key={item.id}>
              <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-lime-400 ring-4 ring-lime-100" />
              <div>
                <p className="text-sm font-medium text-slate-800">{item.description}</p>
                <time className="mt-1 flex items-center gap-1.5 text-xs text-slate-500" dateTime={item.createdAt}>
                  <Clock3 className="h-3.5 w-3.5" /> {formatDate(item.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
