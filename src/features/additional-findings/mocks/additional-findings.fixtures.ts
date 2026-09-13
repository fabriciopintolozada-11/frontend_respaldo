import type { TrackingOrder } from '../../work-orders/api/tracking-api';

import type {
  AdditionalFindingResponse,
  ApprovalChannel,
} from '../api/types';

export const ADDITIONAL_FINDING_ORDER_ID = '22222222-2222-4222-8222-222222222222';

const baseResponse: AdditionalFindingResponse = {
  id: 'af-1',
  workOrderId: ADDITIONAL_FINDING_ORDER_ID,
  description: 'Fuga de aceite en el cárter detectada durante la reparación.',
  suggestedTasks: ['Reemplazar junta del cárter'],
  suggestedPartIds: ['spare-1'],
  estimatedHours: 2,
  status: 'PENDING_QUOTE',
  reportedBy: 'usr-mech',
  decidedBy: null,
  decidedAt: null,
  channel: null,
  customerName: null,
  notes: null,
  rejectionReason: null,
  createdAt: '2026-09-12T12:00:00.000Z',
};

export const mockApprovedAdditionalFinding: AdditionalFindingResponse = {
  ...baseResponse,
  status: 'APPROVED',
  decidedBy: 'usr-recep',
  decidedAt: '2026-09-12T15:00:00.000Z',
  channel: 'CALL' as ApprovalChannel,
  customerName: 'Juan Pérez',
  notes: 'Cliente confirmó la ampliación por teléfono.',
};

export const mockRejectedAdditionalFinding: AdditionalFindingResponse = {
  ...baseResponse,
  status: 'REJECTED',
  decidedBy: 'usr-recep',
  decidedAt: '2026-09-12T15:10:00.000Z',
  rejectionReason: 'El cliente prefiere reparar la falla en otro taller.',
};

export const mockPendingOrder: TrackingOrder = {
  id: ADDITIONAL_FINDING_ORDER_ID,
  plate: 'ABC123',
  model: 'Corolla',
  status: 'PRESUPUESTO_ENVIADO',
  entryDate: '2026-08-20T12:00:00.000Z',
  daysInWorkshop: 12,
  bayId: 'bay-1',
  bayNumber: 2,
  mechanicName: 'Mario Rojas',
  customerPhone: '+59170000000',
  missingPartName: null,
  pausedReason: null,
  daysWaitingApproval: null,
  isStaleQuote: false,
  hasPendingAdditionalFinding: true,
  additionalFindingDescription:
    'Fuga de aceite en el cárter detectada durante la reparación.',
};

export const mockAssignedDetailWithStatus = (
  status: 'PENDING_QUOTE' | 'APPROVED' | 'REJECTED',
) => ({
  id: 'ot-123',
  vehicleId: 'veh-1',
  plate: 'ABC-123',
  status: 'EN_REPARACION',
  initialComplaint: 'Ruido al frenar',
  assignedAt: '2026-09-10T09:00:00.000Z',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2022,
  tasks: [],
  parts: [],
  reservedParts: [],
  diagnosticReport: null,
  statusHistory: [],
  additionalFindingStatus: status,
});