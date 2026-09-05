import { apiClient } from '../shared/api/api-client';
import { isBackendMode } from '../shared/config/env';

import type {
  Bay,
  BayStatus,
  Mechanic,
  WorkOrder,
  WorkOrderStatus,
  WorkshopMetrics,
} from '../types/workshop';

export const HOURLY_RATE_BOB = 120;

const VALID_STATE_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  REGISTRADA: ['EN_DIAGNOSTICO', 'CANCELADA'],
  RECIBIDO: ['ASIGNADA', 'EN_DIAGNOSTICO', 'CANCELADA'],
  ASIGNADA: ['EN_DIAGNOSTICO', 'CANCELADA'],
  EN_DIAGNOSTICO: ['DIAGNOSTICADA', 'PRESUPUESTO_ENVIADO', 'CANCELADA'],
  DIAGNOSTICADA: ['PRESUPUESTO_ENVIADO', 'CANCELADA'],
  PRESUPUESTO_ENVIADO: ['APROBADO', 'CANCELADA'],
  APROBADO: ['EN_PROGRESO', 'EN_REPARACION', 'EN_ESPERA_REPUESTO', 'CANCELADA'],
  RECHAZADO: [],
  EN_PROGRESO: ['EN_ESPERA_REPUESTO', 'FINALIZADA', 'CANCELADA'],
  EN_REPARACION: ['ESPERANDO_REPUESTO', 'FINALIZADO', 'CANCELADA'],
  EN_ESPERA_REPUESTO: ['EN_PROGRESO', 'FINALIZADA', 'CANCELADA'],
  ESPERANDO_REPUESTO: ['EN_REPARACION', 'FINALIZADO', 'CANCELADA'],
  FINALIZADA: ['ENTREGADA'],
  FINALIZADO: ['LISTO_ENTREGA', 'ENTREGADO'],
  LISTO_ENTREGA: ['ENTREGADO'],
  ENTREGADA: [],
  ENTREGADO: [],
  CANCELADA: [],
};

export interface DiagnosticPayload {
  diagnosticReport: string;
  mechanicNotes?: string;
  laborItems: Array<{
    description: string;
    estimatedHours: number;
    assignedMechanicId?: string;
  }>;
  partsItems: Array<{
    partId: string;
    quantityRequired: number;
  }>;
}

// Helper para calcular las bahías a partir de las órdenes
function computeBaysFromOrders(orders: WorkOrder[]): Bay[] {
  const bays: Bay[] = [
    {
      id: 1,
      code: 'BAHIA-01',
      name: 'Bahía 1: Elevador 4T (Mecánica Pesada)',
      type: 'Elevador Hidráulico 4T',
      status: 'OCUPADA',
      currentWorkOrderId: undefined,
      currentVehiclePlate: undefined,
      currentVehicleModel: undefined,
      primaryMechanicId: undefined,
      assistantMechanicId: undefined,
      startedAt: undefined,
      estimatedCompletionAt: undefined,
      notes: 'Disponible para asignación',
    },
    {
      id: 2,
      code: 'BAHIA-02',
      name: 'Bahía 2: Elevador 2 Columnas (Frenos y Suspensión)',
      type: 'Elevador 2 Columnas',
      status: 'ESPERA_REPUESTO',
      currentWorkOrderId: undefined,
      currentVehiclePlate: undefined,
      currentVehicleModel: undefined,
      primaryMechanicId: undefined,
      assistantMechanicId: undefined,
      startedAt: undefined,
      estimatedCompletionAt: undefined,
      notes: 'Disponible',
    },
    {
      id: 3,
      code: 'BAHIA-03',
      name: 'Bahía 3: Fosa / Diagnóstico Computarizado',
      type: 'Fosa de Alineación',
      status: 'OCUPADA',
      currentWorkOrderId: undefined,
      currentVehiclePlate: undefined,
      currentVehicleModel: undefined,
      primaryMechanicId: undefined,
      assistantMechanicId: undefined,
      startedAt: undefined,
      estimatedCompletionAt: undefined,
      notes: 'Disponible',
    },
    {
      id: 4,
      code: 'BAHIA-04',
      name: 'Bahía 4: Mantenimiento Preventivo / Rápido',
      type: 'Bahía Rápida / Escáner',
      status: 'LIBRE',
      currentWorkOrderId: undefined,
      currentVehiclePlate: undefined,
      currentVehicleModel: undefined,
      primaryMechanicId: undefined,
      assistantMechanicId: undefined,
      startedAt: undefined,
      estimatedCompletionAt: undefined,
      notes: 'Disponible',
    },
  ];

  const orderBays = orders.filter((o) => o.assignedBayId).map((o) => ({
    bayId: o.assignedBayId!,
    status: o.status,
  }));

  bays.forEach((bay) => {
    const assigned = orderBays.find((ob) => ob.bayId === bay.id);
    if (assigned) {
      const idx = bays.findIndex((b) => b.id === bay.id);
      if (idx >= 0) {
        bays[idx] = { ...bays[idx], status: assigned.status as BayStatus };
      }
    }
  });

  return bays;
}

async function resolveOrderKey(orderId: string): Promise<WorkOrder | null> {
  if (isBackendMode) {
    try {
      const response = await apiClient.getHttp<WorkOrder>(`/work-orders/${orderId}`);
      return response.data;
    } catch {
      const response = await apiClient.getHttp<WorkOrder[]>('/work-orders');
      return response.data.find((o) => o.id === orderId || o.code === orderId) || null;
    }
  }
  return null;
}

async function persistOrder(updated: WorkOrder): Promise<WorkOrder> {
  if (isBackendMode) {
    const response = await apiClient.patchHttp<Partial<WorkOrder>, WorkOrder>(
      `/work-orders/${updated.id}`,
      updated,
    );
    return response.data;
  }
  return updated;
}

export const workshopService = {
  async getAllWorkOrders(): Promise<WorkOrder[]> {
    if (isBackendMode) {
      const response = await apiClient.getHttp<WorkOrder[]>('/work-orders');
      return response.data;
    }
    return [];
  },

  async getWorkOrderById(orderId: string): Promise<WorkOrder | null> {
    if (isBackendMode) {
      const response = await apiClient.getHttp<WorkOrder>(`/work-orders/${orderId}`);
      return response.data;
    }
    return await resolveOrderKey(orderId);
  },

  async getAllBays(): Promise<Bay[]> {
    if (isBackendMode) {
      try {
        const response = await apiClient.getHttp<Bay[]>('/bays');
        return response.data;
      } catch {
        const orders = await workshopService.getAllWorkOrders();
        return computeBaysFromOrders(orders);
      }
    }
    return computeBaysFromOrders([]);
  },

  async getAllMechanics(): Promise<Mechanic[]> {
    if (isBackendMode) {
      const response = await apiClient.getHttp<Mechanic[]>('/work-orders/mechanics');
      return response.data;
    }
    return [];
  },

  async getAllInventory(): Promise<any[]> {
    if (isBackendMode) {
      const response = await apiClient.getHttp<any[]>('/spare-parts');
      return response.data;
    }
    return [];
  },

  async getMetrics(): Promise<WorkshopMetrics> {
    if (isBackendMode) {
      try {
        const response = await apiClient.getHttp<WorkshopMetrics>('/workshop/metrics');
        return response.data;
      } catch {
        const workOrders = await workshopService.getAllWorkOrders();
        const bays = await workshopService.getAllBays();
        const mechanics = await workshopService.getAllMechanics();

        const totalBays = bays.length;
        const occupiedBays = bays.filter((b) => b.status === 'OCUPADA').length;
        const freeBays = totalBays - occupiedBays;
        const activeWorkOrdersCount = workOrders.filter(
          (o) => o.status === 'EN_PROGRESO' || o.status === 'EN_REPARACION',
        ).length;
        const mechanicsActive = mechanics.filter((m) => m.activeOtCount > 0 || m.currentBayId !== undefined).length;
        const totalMechanics = mechanics.length;
        const enDiagnosticoCount = workOrders.filter(
          (o) => o.status === 'EN_DIAGNOSTICO',
        ).length;

        const bayOccupancyRatePercent =
          totalBays > 0 ? Math.round((occupiedBays / totalBays) * 100) : 0;

        return {
          totalBays,
          occupiedBays,
          waitingPartsBays: 0,
          freeBays,
          bayOccupancyRatePercent,
          activeWorkOrdersCount,
          mechanicsActive,
          totalMechanics,
          enDiagnosticoCount,
        };
      }
    }

    return {
      totalBays: 0,
      occupiedBays: 0,
      waitingPartsBays: 0,
      freeBays: 0,
      bayOccupancyRatePercent: 0,
      activeWorkOrdersCount: 0,
      mechanicsActive: 0,
      totalMechanics: 0,
      enDiagnosticoCount: 0,
    };
  },

  async assignBayAndMechanic(
    orderId: string,
    bayId: number,
    primaryMechanicId: string,
    assistantMechanicId?: string,
  ): Promise<WorkOrder> {
    if (isBackendMode) {
      const payload = { bayId, primaryMechanicId, assistantMechanicId };
      const response = await apiClient.postHttp<typeof payload, WorkOrder>(
        `/work-orders/${orderId}/assign-bay`,
        payload,
      );
      return response.data;
    }
    const order = await resolveOrderKey(orderId);
    if (!order) throw new Error('Orden de trabajo no encontrada');
    return await persistOrder(order);
  },

  async updateBayStatus(bayId: number, status: BayStatus, notes?: string): Promise<Bay> {
    if (isBackendMode) {
      const payload = { status, notes };
      const response = await apiClient.patchHttp<typeof payload, Bay>(
        `/bays/${bayId}/status`,
        payload,
      );
      return response.data;
    }
    throw new Error('Modo backend requerido');
  },

  async updateStatus(
    orderId: string,
    newStatus: WorkOrderStatus,
    changedBy: string,
    reason?: string,
  ): Promise<WorkOrder> {
    const order = await resolveOrderKey(orderId);
    if (!order) throw new Error('Orden de trabajo no encontrada');

    const allowed = VALID_STATE_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(
        `Transición no permitida: no se puede cambiar de ${order.status} a ${newStatus}.`,
      );
    }

    if (
      newStatus === 'EN_PROGRESO' &&
      order.status !== 'APROBADO' &&
      order.status !== 'EN_ESPERA_REPUESTO'
    ) {
      throw new Error(
        'Regla RN-02: La orden debe ser aprobada explícitamente por el cliente antes de iniciar trabajos.',
      );
    }

    if (isBackendMode) {
      const payload = { status: newStatus, changedBy, reason };
      const response = await apiClient.patchHttp<typeof payload, WorkOrder>(
        `/work-orders/${orderId}/status`,
        payload,
      );
      return response.data;
    }

    return await persistOrder(order);
  },

  async startDiagnostic(orderId: string, changedBy: string): Promise<WorkOrder> {
    return await this.updateStatus(
      orderId,
      'EN_DIAGNOSTICO',
      changedBy,
      'Inicio de diagnóstico técnico inicial (HU-02).',
    );
  },

  async saveDiagnosticDraft(
    orderId: string,
    payload: { diagnosticReport?: string; mechanicNotes?: string },
  ): Promise<WorkOrder> {
    if (isBackendMode) {
      const response = await apiClient.patchHttp<typeof payload, WorkOrder>(
        `/work-orders/${orderId}/diagnostic-draft`,
        payload,
      );
      return response.data;
    }
    const order = await resolveOrderKey(orderId);
    if (!order) throw new Error('Orden de trabajo no encontrada');
    return await persistOrder(order);
  },

  async completeDiagnostic(
    orderId: string,
    payload: DiagnosticPayload,
  ): Promise<WorkOrder> {
    if (!payload.diagnosticReport.trim()) {
      throw new Error('El informe de diagnóstico es obligatorio.');
    }

    if (isBackendMode) {
      const response = await apiClient.postHttp<DiagnosticPayload, WorkOrder>(
        `/work-orders/${orderId}/diagnostic`,
        payload,
      );
      return response.data;
    }

    const order = await resolveOrderKey(orderId);
    if (!order) throw new Error('Orden de trabajo no encontrada');
    return await persistOrder(order);
  },

  async toggleLaborCompletion(orderId: string, laborId: string): Promise<WorkOrder> {
    if (isBackendMode) {
      const response = await apiClient.patchHttp<Record<string, never>, WorkOrder>(
        `/work-orders/${orderId}/labor/${laborId}/toggle`,
        {},
      );
      return response.data;
    }
    const order = await resolveOrderKey(orderId);
    if (!order) throw new Error('Orden no encontrada');
    return await persistOrder(order);
  },

  async confirmPartInstalled(orderId: string, partItemId: string): Promise<WorkOrder> {
    if (isBackendMode) {
      const response = await apiClient.patchHttp<Record<string, never>, WorkOrder>(
        `/work-orders/${orderId}/parts/${partItemId}/install`,
        {},
      );
      return response.data;
    }
    const order = await resolveOrderKey(orderId);
    if (!order) throw new Error('Orden no encontrada');
    return await persistOrder(order);
  },
};