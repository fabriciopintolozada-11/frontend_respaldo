import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Package, Plus, Trash2, Wrench } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import {
  diagnosticSchema,
  type DiagnosticFormValues,
  type DiagnosticPayload,
} from '../schemas/diagnostic-schema';

export interface DiagnosticWorkOrderContext {
  id: string;
  code: string;
  plate: string;
  status: string;
  initialComplaint: string;
  vehicleDescription?: string;
}

export interface SuggestedPartOption {
  id: string;
  code: string;
  name: string;
}

export interface DiagnosticFormProps {
  order: DiagnosticWorkOrderContext;
  parts: SuggestedPartOption[];
  onCancel: () => void;
  onSubmit?: (payload: DiagnosticPayload) => Promise<unknown>;
}

export function DiagnosticForm({ order, parts, onCancel, onSubmit }: DiagnosticFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DiagnosticFormValues>({
    resolver: zodResolver(diagnosticSchema),
    defaultValues: {
      description: '',
      estimatedHours: 0,
      suggestedTasks: [''],
      suggestedPartIds: [],
    },
  });
  const suggestedTasks = useWatch({ control, name: 'suggestedTasks' });

  const submitDiagnostic = handleSubmit(async (values) => {
    if (!onSubmit) return;

    setSubmitError(null);
    setIsSuccess(false);
    try {
      await onSubmit({
        ...values,
        description: values.description.trim(),
        suggestedTasks: values.suggestedTasks.map((task) => task.trim()).filter(Boolean),
      });
      setIsSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo registrar el diagnóstico. Intenta nuevamente.');
    }
  });

  return (
    <form className="space-y-6" onSubmit={submitDiagnostic} noValidate>
      <section aria-label="Contexto de la orden" className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-bold text-lime-700">{order.code}</p>
            <p className="mt-1 text-lg font-extrabold text-slate-950">{order.plate}</p>
            {order.vehicleDescription && <p className="text-sm text-slate-600">{order.vehicleDescription}</p>}
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            {formatStatus(order.status)}
          </span>
        </div>
        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Motivo de ingreso</p>
          <p className="mt-1 text-sm text-slate-700">{order.initialComplaint}</p>
        </div>
      </section>

      {!onSubmit && (
        <div role="status" className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">El registro aún no está disponible</p>
            <p className="mt-1">Puedes revisar el formulario, pero el servicio necesario para guardar el diagnóstico todavía no está habilitado.</p>
          </div>
        </div>
      )}

      {submitError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {submitError}
        </div>
      )}
      {isSuccess && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-lime-200 bg-lime-50 p-3 text-sm font-semibold text-lime-900">
          <CheckCircle2 className="h-5 w-5" />
          Diagnóstico registrado correctamente.
        </div>
      )}

      <div>
        <label htmlFor="diagnostic-description" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
          Fallas detectadas <span className="text-red-600">*</span>
        </label>
        <textarea
          id="diagnostic-description"
          rows={5}
          placeholder="Describe los hallazgos técnicos de la inspección."
          aria-invalid={Boolean(errors.description)}
          className={`min-h-[132px] w-full rounded-xl border bg-white p-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
            errors.description
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
              : 'border-slate-300 focus:border-lime-500 focus:ring-lime-200'
          }`}
          {...register('description')}
        />
        {errors.description && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.description.message}</p>}
      </div>

      <Input
        id="diagnostic-estimated-hours"
        tone="light"
        type="number"
        min="0"
        step="0.25"
        label="Horas estimadas de mano de obra"
        error={errors.estimatedHours?.message}
        required
        {...register('estimatedHours', { valueAsNumber: true })}
      />

      <section className="space-y-3" aria-labelledby="suggested-tasks-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="suggested-tasks-title" className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Wrench className="h-4 w-4 text-lime-700" />
            Tareas sugeridas
          </h3>
          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setValue('suggestedTasks', [...suggestedTasks, ''])}
          >
            Agregar tarea
          </Button>
        </div>
        <div className="space-y-2">
          {suggestedTasks.map((_, index) => (
            <div className="flex items-center gap-2" key={`task-${index}`}>
              <Input
                tone="light"
                aria-label={`Tarea sugerida ${index + 1}`}
                placeholder="Ej. Reemplazar pastillas de freno"
                {...register(`suggestedTasks.${index}`)}
              />
              <button
                type="button"
                aria-label={`Quitar tarea ${index + 1}`}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={() => setValue('suggestedTasks', suggestedTasks.filter((_, taskIndex) => taskIndex !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <fieldset className="space-y-3">
        <legend className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Package className="h-4 w-4 text-lime-700" />
          Repuestos sugeridos
        </legend>
        {parts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            El catálogo de repuestos no está disponible para esta sesión.
          </p>
        ) : (
          <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {parts.map((part) => (
              <label
                key={part.id}
                className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-lime-400 hover:bg-lime-50"
              >
                <input
                  type="checkbox"
                  value={part.id}
                  className="h-5 w-5 accent-lime-500"
                  {...register('suggestedPartIds')}
                />
                <span className="min-w-0">
                  <span className="block font-mono text-xs font-bold text-lime-700">{part.code}</span>
                  <span className="block truncate text-sm font-semibold text-slate-800">{part.name}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-5 sm:flex-row">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950">
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!onSubmit || isSuccess}>
          {isSubmitting ? 'Registrando diagnóstico...' : 'Confirmar diagnóstico'}
        </Button>
      </div>
    </form>
  );
}

function formatStatus(status: string): string {
  return status.toLowerCase().replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
}
