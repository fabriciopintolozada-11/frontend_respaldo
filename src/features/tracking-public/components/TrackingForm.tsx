import { zodResolver } from '@hookform/resolvers/zod';
import { Search } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Input } from '../../../shared/components/Input';
import { trackingStatusSchema, type TrackingStatusFormValues } from '../tracking-status-schema';

export interface TrackingFormProps {
  disabled?: boolean;
  onSubmit: (values: TrackingStatusFormValues) => void;
}

export function TrackingForm({ disabled = false, onSubmit }: TrackingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TrackingStatusFormValues>({
    resolver: zodResolver(trackingStatusSchema),
    mode: 'onSubmit',
  });

  return (
    <Card variant="public" padding="lg" className="w-full max-w-3xl">
      <form className="grid gap-5 md:grid-cols-[1fr_1fr_auto] md:items-end" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          id="tracking-plate"
          label="Placa del vehículo"
          placeholder="Ej. ABC123"
          autoComplete="off"
          inputMode="text"
          maxLength={10}
          tone="light"
          required
          disabled={disabled}
          error={errors.plate?.message}
          {...register('plate', { onChange: (event) => { event.target.value = event.target.value.toUpperCase(); } })}
        />
        <Input
          id="tracking-identification"
          label="Documento de identidad"
          placeholder="Ingresa tu documento"
          autoComplete="off"
          inputMode="numeric"
          tone="light"
          required
          disabled={disabled}
          error={errors.identification?.message}
          {...register('identification')}
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full md:w-auto"
          disabled={disabled}
          isLoading={isSubmitting}
          leftIcon={!isSubmitting ? <Search className="h-5 w-5" /> : undefined}
        >
          Consultar estado
        </Button>
      </form>
      <p className="mt-4 text-xs text-slate-500">Consulta pública segura. Solo necesitamos la placa y el documento asociado a la orden.</p>
    </Card>
  );
}
