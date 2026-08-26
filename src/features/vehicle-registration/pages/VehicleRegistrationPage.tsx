import {
  AlertTriangle,
  BatteryWarning,
  CarFront,
  ChevronRight,
  CircleUserRound,
  ClipboardPlus,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { ApiError } from '../../../shared/api/httpClient'
import { Button } from '../../../shared/components/Button'
import { Card } from '../../../shared/components/Card'
import { Input } from '../../../shared/components/Input'
import { VehicleHistoryPanel } from '../components/VehicleHistoryPanel'
import { WorkOrderSuccess } from '../components/WorkOrderSuccess'
import { useCreateWorkOrder, useVehicleHistory } from '../hooks/useVehicleRegistration'
import type {
  CreatedWorkOrderResponse,
  LookupState,
  VehicleEntryFormValues,
} from '../vehicle-registration.types'
import { normalizePlate, PLATE_PATTERN, toRegisterRequest } from '../vehicle-registration.validation'

const defaultValues: VehicleEntryFormValues = {
  plate: '',
  customerIdentification: '',
  customerName: '',
  customerPhone: '',
  brand: '',
  model: '',
  year: '',
  isFullyElectric: false,
  initialComplaint: '',
}

export function VehicleRegistrationPage() {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<VehicleEntryFormValues>({ defaultValues, mode: 'onBlur' })
  const plate = useWatch({ control, name: 'plate' })
  const isFullyElectric = useWatch({ control, name: 'isFullyElectric' })
  const [searchedPlate, setSearchedPlate] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [createdOrder, setCreatedOrder] = useState<CreatedWorkOrderResponse | null>(null)
  const autoCompletedValues = useRef<Partial<VehicleEntryFormValues>>({})
  const historyQuery = useVehicleHistory(searchedPlate)
  const createWorkOrder = useCreateWorkOrder()
  const normalizedPlate = normalizePlate(plate)
  const lookup: LookupState = !PLATE_PATTERN.test(normalizedPlate)
    ? { status: 'idle' }
    : searchedPlate !== normalizedPlate || historyQuery.isPending || historyQuery.isFetching
      ? { status: 'loading' }
      : historyQuery.isError
        ? { status: 'error', message: getErrorMessage(historyQuery.error) }
        : historyQuery.data
          ? { status: 'found', data: historyQuery.data }
          : { status: 'new' }
  const isPersistedElectric = lookup.status === 'found' && lookup.data.is_fully_electric
  const isElectricBlocked = isFullyElectric || isPersistedElectric

  useEffect(() => {
    setSubmitError('')

    for (const [field, value] of Object.entries(autoCompletedValues.current)) {
      const fieldName = field as keyof VehicleEntryFormValues
      if (getValues(fieldName) === value) {
        setValue(fieldName, defaultValues[fieldName])
      }
    }
    autoCompletedValues.current = {}

    if (!PLATE_PATTERN.test(normalizedPlate)) {
      setSearchedPlate('')
      return
    }

    const timeout = window.setTimeout(() => setSearchedPlate(normalizedPlate), 350)
    return () => window.clearTimeout(timeout)
  }, [getValues, normalizedPlate, setValue])

  useEffect(() => {
    const data = historyQuery.data
    if (!data || data.plate !== searchedPlate) return

    const values: Partial<VehicleEntryFormValues> = {
      customerIdentification: data.customer_identification,
      customerName: data.customer_name,
      customerPhone: data.customer_phone ?? '',
      brand: data.brand,
      model: data.model,
      year: String(data.year),
      isFullyElectric: data.is_fully_electric,
    }

    for (const [field, value] of Object.entries(values)) {
      setValue(field as keyof VehicleEntryFormValues, value, { shouldValidate: true })
    }
    autoCompletedValues.current = values
  }, [historyQuery.data, searchedPlate, setValue])

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError('')
    if (values.isFullyElectric || isPersistedElectric) {
      setSubmitError('Los vehículos 100% eléctricos no pueden ser recibidos por el taller.')
      return
    }

    try {
      const order = await createWorkOrder.mutateAsync(toRegisterRequest(values))
      setCreatedOrder(order)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      if (error instanceof ApiError && Array.isArray(error.body?.message)) {
        setSubmitError(error.body.message.join(' '))
      } else {
        setSubmitError(getErrorMessage(error))
      }
    }
  })

  function startNewEntry() {
    reset(defaultValues)
    setSearchedPlate('')
    setCreatedOrder(null)
    setSubmitError('')
    createWorkOrder.reset()
    autoCompletedValues.current = {}
  }

  if (createdOrder) {
    return (
      <div className="mx-auto grid min-h-[65vh] max-w-2xl place-items-center">
        <WorkOrderSuccess order={createdOrder} onNew={startNewEntry} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-700">Recepción de taller</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">Registrar ingreso</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Consulta el expediente del vehículo y crea su Orden de Trabajo para iniciar la atención.</p>
        </div>
        <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
          <span className="text-2xl font-black text-lime-600">01</span>
          <div><strong className="block text-sm text-slate-950">Ingreso</strong><span className="text-xs text-slate-500">Datos y reclamo</span></div>
        </div>
      </header>

      <form onSubmit={onSubmit} noValidate>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,.85fr)]">
          <div className="space-y-5">
            <Card variant="public" padding="lg" className="border-lime-200 bg-gradient-to-br from-lime-50/80 to-white">
              <SectionHeader icon={<Search className="h-5 w-5" />} title="Consulta por placa" description="La búsqueda inicia al completar una placa válida." />
              <Input
                id="plate"
                label="Placa del vehículo"
                className="font-mono text-base font-black uppercase tracking-wider text-lime-800"
                placeholder="ABC123"
                maxLength={10}
                autoComplete="off"
                tone="light"
                required
                aria-invalid={Boolean(errors.plate)}
                error={errors.plate?.message}
                helperText="3 a 10 caracteres: letras, números o guion."
                {...register('plate', {
                  required: 'La placa es obligatoria.',
                  validate: (value) => PLATE_PATTERN.test(normalizePlate(value)) || 'Ingresa una placa válida.',
                  onBlur: (event) => setValue('plate', normalizePlate(event.target.value), { shouldValidate: true }),
                })}
              />
            </Card>

            <Card variant="public" padding="lg">
              <SectionHeader icon={<CarFront className="h-5 w-5" />} title="Datos del vehículo" description="Información necesaria para abrir la orden." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input id="brand" label="Marca" placeholder="Toyota" tone="light" required aria-invalid={Boolean(errors.brand)} error={errors.brand?.message}
                  {...register('brand', { validate: (value) => Boolean(value.trim()) || 'La marca es obligatoria.' })} />
                <Input id="model" label="Modelo" placeholder="Corolla" tone="light" required aria-invalid={Boolean(errors.model)} error={errors.model?.message}
                  {...register('model', { validate: (value) => Boolean(value.trim()) || 'El modelo es obligatorio.' })} />
                <Input id="year" label="Año" inputMode="numeric" placeholder="2022" maxLength={4} tone="light" required aria-invalid={Boolean(errors.year)} error={errors.year?.message}
                  {...register('year', {
                    validate: (value) => {
                      const year = Number(value)
                      if (!value.trim()) return 'El año es obligatorio.'
                      if (!Number.isInteger(year) || year < 1900 || year > 2100) return 'El año debe estar entre 1900 y 2100.'
                      return true
                    },
                  })} />
              </div>

              <label htmlFor="isFullyElectric" className={`mt-5 flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${isElectricBlocked ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                <input id="isFullyElectric" type="checkbox" disabled={isPersistedElectric} className="h-5 w-5 shrink-0 accent-lime-500" {...register('isFullyElectric')} />
                <BatteryWarning className={`h-5 w-5 shrink-0 ${isElectricBlocked ? 'text-red-600' : 'text-slate-500'}`} />
                <span><strong className="block text-sm text-slate-900">Vehículo 100% eléctrico</strong><small className="text-xs text-slate-500">Estos vehículos no son admitidos por el taller.</small></span>
              </label>
              {isElectricBlocked && (
                <div className="mt-3 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-950" role="alert">
                  <BatteryWarning className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div><strong className="text-sm font-bold">Recepción bloqueada</strong><p className="mt-1 text-sm leading-6">No se puede crear una Orden de Trabajo para un vehículo 100% eléctrico.</p></div>
                </div>
              )}
            </Card>

            <Card variant="public" padding="lg">
              <SectionHeader icon={<CircleUserRound className="h-5 w-5" />} title="Datos del cliente" description="Responsable asociado a la Orden de Trabajo." />
              {lookup.status === 'found' && (
                <div className="mb-4 flex items-center gap-2 text-xs font-bold text-lime-800"><ShieldCheck className="h-4 w-4" /> Datos autocompletados desde el expediente.</div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input id="customerIdentification" label="Identificación" placeholder="CI o NIT" tone="light" required aria-invalid={Boolean(errors.customerIdentification)} error={errors.customerIdentification?.message}
                  {...register('customerIdentification', { validate: (value) => Boolean(value.trim()) || 'La identificación es obligatoria.' })} />
                <Input id="customerName" label="Nombre completo" placeholder="Nombre del cliente" tone="light" required aria-invalid={Boolean(errors.customerName)} error={errors.customerName?.message}
                  {...register('customerName', { validate: (value) => Boolean(value.trim()) || 'El nombre es obligatorio.' })} />
                <Input id="customerPhone" label="Teléfono" type="tel" placeholder="+591 70000000" tone="light" error={errors.customerPhone?.message} {...register('customerPhone')} />
              </div>
            </Card>

            <Card variant="public" padding="lg">
              <SectionHeader icon={<ClipboardPlus className="h-5 w-5" />} title="Reclamo inicial" description="Describe el motivo principal del ingreso." />
              <label htmlFor="initialComplaint" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Síntomas o solicitud del cliente <span className="ml-1 text-red-500">*</span></label>
              <textarea
                id="initialComplaint"
                rows={5}
                placeholder="Ej.: Se escucha un ruido al frenar en velocidades bajas..."
                aria-invalid={Boolean(errors.initialComplaint)}
                aria-describedby={errors.initialComplaint ? 'initialComplaint-error' : undefined}
                className={`block w-full resize-y rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900 shadow-xs outline-none placeholder:text-slate-400 focus:ring-2 ${errors.initialComplaint ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-slate-300 hover:border-slate-400 focus:border-lime-500 focus:ring-lime-200'}`}
                {...register('initialComplaint', { validate: (value) => Boolean(value.trim()) || 'El reclamo inicial es obligatorio.' })}
              />
              {errors.initialComplaint && <p id="initialComplaint-error" className="mt-1 text-xs font-medium text-red-500" role="alert">{errors.initialComplaint.message}</p>}
            </Card>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <Card variant="public" padding="lg"><VehicleHistoryPanel lookup={lookup} /></Card>
            <div className="flex gap-3 rounded-2xl border border-lime-200 bg-lime-50 p-4 text-lime-950">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-lime-700" />
              <div><strong className="text-sm font-bold">Registro seguro</strong><p className="mt-1 text-sm leading-6 text-lime-900">Los datos del cliente, vehículo y Orden de Trabajo se registran juntos.</p></div>
            </div>
          </aside>
        </div>

        {submitError && (
          <div className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-950" role="alert">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" /><p className="text-sm">{submitError}</p>
          </div>
        )}

        <Card variant="public" padding="md" className="mt-6 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
          <div><strong className="block text-sm text-slate-950">Crear Orden de Trabajo</strong><span className="mt-1 block text-xs text-slate-500">Verifica los datos antes de registrar el ingreso.</span></div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
            disabled={isElectricBlocked || lookup.status === 'loading'}
            isLoading={isSubmitting}
            rightIcon={!isSubmitting ? <ChevronRight className="h-5 w-5" /> : undefined}
          >
            Registrar ingreso
          </Button>
        </Card>
      </form>
    </div>
  )
}

function SectionHeader({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-100 text-lime-800">{icon}</span>
      <div><h2 className="font-bold text-slate-950">{title}</h2><p className="mt-0.5 text-sm text-slate-500">{description}</p></div>
    </div>
  )
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}
