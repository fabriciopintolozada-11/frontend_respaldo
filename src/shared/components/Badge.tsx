import React from 'react';
import { WorkOrderStatus, BayStatus, PartRotation, FuelType } from '../types/openapi';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'amber' | 'slate';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const variantStyles = {
    default: 'bg-[#2D3139] text-[#8E949F] border-[#2D3139]',
    success: 'bg-[#22C55E15] text-[#22C55E] border-[#22C55E30]',
    warning: 'bg-[#F59E0B15] text-[#F59E0B] border-[#F59E0B30]',
    danger: 'bg-[#EF444415] text-[#EF4444] border-[#EF444430]',
    info: 'bg-[#3B82F615] text-[#3B82F6] border-[#3B82F630]',
    purple: 'bg-[#A855F715] text-[#A855F7] border-[#A855F730]',
    amber: 'bg-[#F9731615] text-[#F97316] border-[#F9731630]',
    slate: 'bg-[#1C2028] text-[#8E949F] border-[#2D3139]',
  };

  const dotStyles = {
    default: 'bg-[#8E949F]',
    success: 'bg-[#22C55E]',
    warning: 'bg-[#F59E0B]',
    danger: 'bg-[#EF4444]',
    info: 'bg-[#3B82F6]',
    purple: 'bg-[#A855F7]',
    amber: 'bg-[#F97316]',
    slate: 'bg-[#8E949F]',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-semibold',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3.5 py-1.5 text-sm font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border tracking-wide whitespace-nowrap ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />}
      {children}
    </span>
  );
};

export const WorkOrderStatusBadge: React.FC<{ status: WorkOrderStatus; size?: 'sm' | 'md' | 'lg' }> = ({
  status,
  size = 'md',
}) => {
  const configs: Record<WorkOrderStatus, { label: string; variant: BadgeProps['variant'] }> = {
    REGISTRADA: { label: '1. Registrada', variant: 'slate' },
    DIAGNOSTICADA: { label: '2. Diagnosticada', variant: 'info' },
    PRESUPUESTADA: { label: '3. Presupuestada', variant: 'amber' },
    APROBADA: { label: '4. Aprobada x Cliente', variant: 'success' },
    EN_PROGRESO: { label: '5. En Progreso', variant: 'purple' },
    EN_ESPERA_REPUESTO: { label: '6. Espera Repuesto', variant: 'warning' },
    FINALIZADA: { label: '7. Finalizada / Calidad', variant: 'success' },
    ENTREGADA: { label: '8. Entregada / Cobrada', variant: 'default' },
    CANCELADA: { label: 'Cancelada', variant: 'danger' },
  };

  const config = configs[status] || { label: status, variant: 'default' };
  return (
    <Badge variant={config.variant} size={size} dot>
      {config.label}
    </Badge>
  );
};

export const BayStatusBadge: React.FC<{ status: BayStatus; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const configs: Record<BayStatus, { label: string; variant: BadgeProps['variant'] }> = {
    LIBRE: { label: 'Libre para Asignar', variant: 'success' },
    OCUPADA: { label: 'En Operación', variant: 'purple' },
    ESPERA_REPUESTO: { label: 'Pausa x Repuesto', variant: 'warning' },
    MANTENIMIENTO: { label: 'En Mantenimiento', variant: 'slate' },
  };
  const config = configs[status] || { label: status, variant: 'default' };
  return (
    <Badge variant={config.variant} size={size} dot>
      {config.label}
    </Badge>
  );
};

export const RotationBadge: React.FC<{ rotation: PartRotation }> = ({ rotation }) => {
  const configs: Record<PartRotation, { label: string; variant: BadgeProps['variant'] }> = {
    ALTA: { label: 'Alta Rotación', variant: 'success' },
    MEDIA: { label: 'Media Rotación', variant: 'info' },
    BAJA: { label: 'Baja Rotación', variant: 'slate' },
    SIN_ROTACION_ALERTA: { label: '⚠️ Alerta: 2+ Meses Sin Rotar (RN-10)', variant: 'danger' },
  };
  const config = configs[rotation] || { label: rotation, variant: 'default' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const FuelTypeBadge: React.FC<{ fuel: FuelType }> = ({ fuel }) => {
  const configs: Record<FuelType, { label: string; variant: BadgeProps['variant'] }> = {
    GASOLINA: { label: 'Gasolina', variant: 'slate' },
    DIESEL: { label: 'Diésel', variant: 'amber' },
    HIBRIDO: { label: 'Híbrido', variant: 'success' },
    ELECTRICO: { label: '100% Eléctrico (No admitido)', variant: 'danger' },
  };
  const config = configs[fuel] || { label: fuel, variant: 'default' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};
