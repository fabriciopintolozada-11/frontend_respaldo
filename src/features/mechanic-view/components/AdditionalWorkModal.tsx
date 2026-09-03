import { ShieldAlert } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';

interface AdditionalWorkModalProps {
  isOpen: boolean;
  vehiclePlate: string;
  description: string;
  hours: number;
  partDescription: string;
  isSubmitting: boolean;
  onDescriptionChange: (value: string) => void;
  onHoursChange: (value: number) => void;
  onPartDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function AdditionalWorkModal({
  isOpen,
  vehiclePlate,
  description,
  hours,
  partDescription,
  isSubmitting,
  onDescriptionChange,
  onHoursChange,
  onPartDescriptionChange,
  onSubmit,
  onClose,
}: AdditionalWorkModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reportar daño oculto en ${vehiclePlate}`}
      subtitle="Suspende automáticamente el avance en bahía y genera un presupuesto adicional para el cliente"
      variant="light"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Descripción técnica del daño oculto{' '}
            <span className="text-red-600">*</span>
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Ej.: Fuga activa en el retén del cigüeñal al retirar el protector del cárter..."
            className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-200 min-h-[56px]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Horas adicionales estimadas
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={hours}
              onChange={(e) => onHoursChange(Number(e.target.value))}
              className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Repuesto adicional (opcional)
            </label>
            <input
              type="text"
              value={partDescription}
              onChange={(e) => onPartDescriptionChange(e.target.value)}
              placeholder="Ej.: Retén OEM trasero del cigüeñal"
              className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-200"
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <div className="w-1.5 h-10 bg-amber-500 rounded-full shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-slate-950">
              <span className="text-amber-800">Efecto inmediato:</span> La orden
              cambiará a <em className="text-amber-700">Suspendida</em>.
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              El cliente será notificado para obtener su aprobación formal.
            </p>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-200">
          <Button
            variant="outline"
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            isLoading={isSubmitting}
            onClick={onSubmit}
            leftIcon={<ShieldAlert className="w-5 h-5" />}
          >
            Aplicar suspensión
          </Button>
        </div>
      </div>
    </Modal>
  );
}
