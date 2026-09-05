import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError, request } from '../../../shared/api/httpClient';
import { env } from '../../../shared/config/env';
import { mockDb } from '../../../shared/api/mock-db';
import type { Budget, WorkOrder } from '../../../shared/types/openapi';

export type BudgetItemType = 'labor' | 'part';

export interface BudgetItem {
  id: string;
  type: BudgetItemType;
  code?: string;
  description: string;
  quantity: number;
  unitPriceBOB: number;
  totalBOB: number;
  status: string;
  isApproved: boolean;
  isElectricRestricted: boolean;
}

export interface BudgetApprovalData {
  workOrder: WorkOrder;
  budget: Budget;
  items: BudgetItem[];
  isFullyElectric: boolean;
}

export interface BudgetApprovalListItem {
  orderId: string;
  orderCode: string;
  vehiclePlate: string;
  vehicleDescription: string;
  clientName: string;
  status: Budget['status'];
  totalBOB: number;
  isFullyElectric: boolean;
}

export type BudgetApprovalChannel = 'CALL' | 'WHATSAPP' | 'IN_PERSON';
export type BudgetDecision = 'APROBADO' | 'RECHAZADO';

export interface BudgetApprovalPayload {
  approvedItemIds: string[];
  rejectedItemIds: string[];
  decision: BudgetDecision;
  channel: BudgetApprovalChannel;
  customerName: string;
  notes: string;
  rejectionReason?: string;
}

interface QuoteDecisionResponse {
  id: string;
  quoteId: string;
  workOrderId: string;
  decision: 'APPROVED' | 'REJECTED';
  channel?: BudgetApprovalChannel;
  customerName?: string;
  notes?: string;
  reason?: string;
  createdAt: string;
}

const decisionsStorageKey = 'fratelli_budget_approval_decisions_v1';

const CONTINGENCY_ORDER: WorkOrder = {
  id: 'ot-contingency-ev',
  code: 'OT-2026-EV01',
  vehiclePlate: 'EV-2040',
  vehicleBrand: 'NeonVolt',
  vehicleModel: 'Eon X',
  vehicleYear: 2025,
  clientName: 'Laura Quiroga',
  clientDocument: '8092441 LP',
  clientPhone: '+591 70000000',
  clientEmail: 'laura.quiroga@example.com',
  status: 'PRESUPUESTO_ENVIADO',
  entryDate: new Date().toISOString(),
  entryReason: 'Revisión preventiva y alerta en el sistema de frenado.',
  diagnosticReport: 'Se requiere inspección de frenos y diagnóstico de alto voltaje por personal certificado.',
  laborItems: [
    {
      id: 'ev-labor-brakes',
      description: 'Inspección de frenos regenerativos y calibración',
      estimatedHours: 2,
      hourlyRateBOB: 180,
      totalBOB: 360,
      isCompleted: false,
    },
    {
      id: 'ev-labor-engine',
      description: 'Cambio de aceite de motor de combustión',
      estimatedHours: 1,
      hourlyRateBOB: 120,
      totalBOB: 120,
      isCompleted: false,
    },
  ],
  partsItems: [
    {
      id: 'ev-part-brakes',
      partId: 'REP-EV-FRE-001',
      partCode: 'REP-EV-FRE-001',
      description: 'Pastillas de freno cerámicas para eje delantero',
      quantityRequired: 1,
      quantityUsed: 0,
      unitPriceBOB: 480,
      totalBOB: 480,
      isReserved: false,
      isDeliveredToBay: false,
      status: 'PENDIENTE',
    },
    {
      id: 'ev-part-oil',
      partId: 'REP-EV-MOT-001',
      partCode: 'REP-EV-MOT-001',
      description: 'Filtro de aceite de motor y lubricante',
      quantityRequired: 1,
      quantityUsed: 0,
      unitPriceBOB: 95,
      totalBOB: 95,
      isReserved: false,
      isDeliveredToBay: false,
      status: 'PENDIENTE',
    },
  ],
  totalLaborBOB: 480,
  totalPartsBOB: 575,
  totalGeneralBOB: 1055,
  lastClientContactDate: new Date().toISOString().slice(0, 10),
  daysWithoutClientResponse: 0,
  hasPendingAdditionalWork: false,
  isSuspendedForAdditionalWork: false,
  statusHistory: [],
};

const CONTINGENCY_BUDGET: Budget = {
  id: 'budget-contingency-ev',
  workOrderId: CONTINGENCY_ORDER.id,
  otCode: CONTINGENCY_ORDER.code,
  vehiclePlate: CONTINGENCY_ORDER.vehiclePlate,
  clientName: CONTINGENCY_ORDER.clientName,
  clientDocument: CONTINGENCY_ORDER.clientDocument,
  createdAt: CONTINGENCY_ORDER.entryDate,
  validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  laborSubtotalBOB: CONTINGENCY_ORDER.totalLaborBOB,
  partsSubtotalBOB: CONTINGENCY_ORDER.totalPartsBOB,
  discountBOB: 50,
  totalBOB: CONTINGENCY_ORDER.totalGeneralBOB - 50,
  status: 'ENVIADO_CLIENTE',
};

function isBackendSource(): boolean {
  return env.dataSource === 'backend';
}

function isNetworkError(error: unknown): boolean {
  return (
    (error instanceof ApiError && error.statusCode === 0) ||
    (error instanceof Error && /network error|failed to fetch|network request/i.test(error.message))
  );
}

interface StoredDecision {
  approved: string[];
  rejected: string[];
  decision?: BudgetDecision;
  channel?: BudgetApprovalChannel;
  notes?: string;
  rejectionReason?: string;
  recordedAt?: string;
}

function getStoredDecisions(): Record<string, StoredDecision> {
  try {
    const stored = localStorage.getItem(decisionsStorageKey);
    return stored ? JSON.parse(stored) as Record<string, StoredDecision> : {};
  } catch {
    return {};
  }
}

function storeDecisions(orderId: string, payload: BudgetApprovalPayload): void {
  try {
    const decisions = getStoredDecisions();
    decisions[orderId] = {
      approved: payload.approvedItemIds,
      rejected: payload.rejectedItemIds,
      decision: payload.decision,
      channel: payload.channel,
      notes: payload.notes,
      rejectionReason: payload.rejectionReason,
      recordedAt: new Date().toISOString(),
    };
    localStorage.setItem(decisionsStorageKey, JSON.stringify(decisions));
  } catch {
    // Persistence is best effort in mock mode.
  }
}

function isElectricRestricted(description: string, isFullyElectric: boolean): boolean {
  if (!isFullyElectric) return false;

  return /motor|aceite|buj[ií]|combust|inyect|embrague|transmisi[oó]n|distribuci[oó]n|pist[oó]n|escape|radiador/i.test(
    description,
  );
}

function createBudgetFromOrder(order: WorkOrder): Budget {
  return {
    id: `budget-${order.id}`,
    workOrderId: order.id,
    otCode: order.code,
    vehiclePlate: order.vehiclePlate,
    clientName: order.clientName,
    clientDocument: order.clientDocument,
    createdAt: order.entryDate,
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    laborSubtotalBOB: order.totalLaborBOB,
    partsSubtotalBOB: order.totalPartsBOB,
    discountBOB: 0,
    totalBOB: order.totalGeneralBOB,
    status: order.clientApprovedAt ? 'APROBADO' : 'BORRADOR',
  };
}

function createItems(order: WorkOrder, isFullyElectric: boolean): BudgetItem[] {
  const decisions = getStoredDecisions()[order.id];
  const hasStoredDecisions = Boolean(decisions);
  const budgetIsApproved = Boolean(order.clientApprovedAt);

  const laborItems = order.laborItems.map((item): BudgetItem => ({
    id: item.id,
    type: 'labor',
    description: item.description,
    quantity: item.estimatedHours,
    unitPriceBOB: item.hourlyRateBOB,
    totalBOB: item.totalBOB,
    status: item.isCompleted ? 'COMPLETED' : 'PENDING',
    isApproved: hasStoredDecisions
      ? decisions.approved.includes(item.id)
      : budgetIsApproved && !isElectricRestricted(item.description, isFullyElectric),
    isElectricRestricted: isElectricRestricted(item.description, isFullyElectric),
  }));

  const partItems = order.partsItems.map((item): BudgetItem => ({
    id: item.id,
    type: 'part',
    code: item.partCode,
    description: item.description,
    quantity: item.quantityRequired,
    unitPriceBOB: item.unitPriceBOB,
    totalBOB: item.totalBOB,
    status: item.status,
    isApproved: hasStoredDecisions
      ? decisions.approved.includes(item.id)
      : budgetIsApproved && !isElectricRestricted(item.description, isFullyElectric),
    isElectricRestricted: isElectricRestricted(item.description, isFullyElectric),
  }));

  return [...laborItems, ...partItems];
}

function getMockBudgetApproval(orderId: string): BudgetApprovalData {
  const baseOrder = mockDb.getWorkOrders().find((item) => item.id === orderId || item.code === orderId)
    ?? (orderId === CONTINGENCY_ORDER.id || orderId === CONTINGENCY_ORDER.code ? CONTINGENCY_ORDER : undefined);
  if (!baseOrder) throw new Error('Orden de trabajo no encontrada');

  const storedDecision = getStoredDecisions()[baseOrder.id];
  const order = storedDecision?.decision
    ? {
        ...baseOrder,
        status: storedDecision.decision === 'APROBADO' ? 'APROBADO' as const : 'RECHAZADO' as const,
        clientApprovedAt: storedDecision.decision === 'APROBADO' ? storedDecision.recordedAt : undefined,
      }
    : baseOrder;

  const vehicle = mockDb.getVehicles().find((item) => item.plate === order.vehiclePlate);
  const isFullyElectric = order.id === CONTINGENCY_ORDER.id || vehicle?.fuelType === 'ELECTRICO';
  const baseBudget = mockDb.getBudgets().find((item) => item.workOrderId === order.id || item.otCode === order.code)
    ?? (order.id === CONTINGENCY_ORDER.id ? CONTINGENCY_BUDGET : undefined)
    ?? createBudgetFromOrder(order);
  const budget = storedDecision?.decision
    ? { ...baseBudget, status: storedDecision.decision, approvalDate: storedDecision.recordedAt }
    : baseBudget;

  return { workOrder: order, budget, items: createItems(order, isFullyElectric), isFullyElectric };
}

function getMockApprovalList(): BudgetApprovalListItem[] {
  const orders = mockDb.getWorkOrders();
  const budgets = mockDb.getBudgets();

  const list = budgets.map((budget) => {
    const order = orders.find((item) => item.id === budget.workOrderId || item.code === budget.otCode);
    const vehicle = order ? mockDb.getVehicles().find((item) => item.plate === order.vehiclePlate) : undefined;
    const storedDecision = getStoredDecisions()[budget.workOrderId];
    return {
      orderId: budget.workOrderId,
      orderCode: budget.otCode,
      vehiclePlate: budget.vehiclePlate,
      vehicleDescription: order ? `${order.vehicleBrand} ${order.vehicleModel} (${order.vehicleYear})` : 'Vehículo no disponible',
      clientName: budget.clientName,
      status: storedDecision?.decision ?? budget.status,
      totalBOB: budget.totalBOB,
      isFullyElectric: vehicle?.fuelType === 'ELECTRICO',
    };
  });

  if (!list.some((item) => item.orderId === CONTINGENCY_ORDER.id)) {
    const storedDecision = getStoredDecisions()[CONTINGENCY_ORDER.id];
    list.push({
      orderId: CONTINGENCY_ORDER.id,
      orderCode: CONTINGENCY_ORDER.code,
      vehiclePlate: CONTINGENCY_ORDER.vehiclePlate,
      vehicleDescription: `${CONTINGENCY_ORDER.vehicleBrand} ${CONTINGENCY_ORDER.vehicleModel} (${CONTINGENCY_ORDER.vehicleYear})`,
      clientName: CONTINGENCY_ORDER.clientName,
      status: storedDecision?.decision ?? CONTINGENCY_BUDGET.status,
      totalBOB: CONTINGENCY_BUDGET.totalBOB,
      isFullyElectric: true,
    });
  }

  return list;
}

// US-09 (client approval). The previous implementation called ghost endpoints
// (/work-orders/:id/budget-approval and /budgets/approval) that do not exist on
// the backend and always 404'd. HU-12's quote creation uses
// POST /work-orders/:id/quote instead. See useQuoteCreation.
// US-09 approval/creation is handled through the real endpoints
// POST /work-orders/:id/approve-quote and POST /work-orders/:id/reject-quote
// (submitBudgetApproval below).
async function fetchBudgetApproval(orderId: string): Promise<BudgetApprovalData> {
  return getMockBudgetApproval(orderId);
}

async function fetchApprovalList(): Promise<BudgetApprovalListItem[]> {
  return getMockApprovalList();
}

function updateMockInventory(order: WorkOrder, payload: BudgetApprovalPayload): void {
  const inventory = mockDb.getInventory();
  const approvedPartIds = new Set(
    payload.decision === 'APROBADO'
      ? payload.approvedItemIds
      : [],
  );

  for (const part of order.partsItems) {
    if (!approvedPartIds.has(part.id) || part.isReserved) continue;
    const inventoryItem = inventory.find((item) => item.id === part.partId);
    if (inventoryItem && inventoryItem.stockAvailable < part.quantityRequired) {
      throw new Error(`Stock insuficiente para ${inventoryItem.name}.`);
    }
  }

  for (const part of order.partsItems) {
    const inventoryItem = inventory.find((item) => item.id === part.partId);
    if (!inventoryItem) continue;

    const shouldReserve = approvedPartIds.has(part.id);
    if (shouldReserve && !part.isReserved) {
      inventoryItem.stockAvailable = Math.max(0, inventoryItem.stockAvailable - part.quantityRequired);
      inventoryItem.stockReserved += part.quantityRequired;
      part.isReserved = true;
      part.status = 'RESERVADO';
    } else if (!shouldReserve && part.isReserved) {
      inventoryItem.stockAvailable += part.quantityRequired;
      inventoryItem.stockReserved = Math.max(0, inventoryItem.stockReserved - part.quantityRequired);
      part.isReserved = false;
      part.status = 'PENDIENTE';
    }
  }

  mockDb.saveInventory(inventory);
}

async function submitBudgetApproval(orderId: string, payload: BudgetApprovalPayload): Promise<QuoteDecisionResponse> {
  if (isBackendSource()) {
    try {
      return await request<QuoteDecisionResponse>({
        url: `/work-orders/${encodeURIComponent(orderId)}/${payload.decision === 'APROBADO' ? 'approve-quote' : 'reject-quote'}`,
        method: 'POST',
        data: payload.decision === 'APROBADO'
          ? { channel: payload.channel, customerName: payload.customerName, notes: payload.notes }
          : { reason: payload.rejectionReason },
      });
    } catch (error) {
      if (!isNetworkError(error)) throw error;
      // Continue with the local contingency flow when the API is unavailable.
    }
  }

  const orders = mockDb.getWorkOrders();
  const orderIndex = orders.findIndex((item) => item.id === orderId || item.code === orderId);
  const isContingencyOrder = orderId === CONTINGENCY_ORDER.id || orderId === CONTINGENCY_ORDER.code;
  if (orderIndex === -1 && !isContingencyOrder) throw new Error('Orden de trabajo no encontrada');

  if (orderIndex === -1 && isContingencyOrder) {
    storeDecisions(CONTINGENCY_ORDER.id, payload);
    return createMockDecisionResponse(CONTINGENCY_ORDER, payload, new Date().toISOString());
  }

  const order = orders[orderIndex];
  if (order.status !== 'PRESUPUESTO_ENVIADO' && order.status !== 'RECHAZADO') {
    throw new Error('La OT no está pendiente de aprobación de presupuesto');
  }
  updateMockInventory(order, payload);
  storeDecisions(order.id, payload);

  const budgets = mockDb.getBudgets();
  const budgetIndex = budgets.findIndex((item) => item.workOrderId === order.id || item.otCode === order.code);
  if (budgetIndex >= 0) {
    budgets[budgetIndex] = {
      ...budgets[budgetIndex],
      status: payload.decision,
      approvalDate: new Date().toISOString(),
    };
    mockDb.saveBudgets(budgets);
  }

  const decisionTimestamp = new Date().toISOString();
  orders[orderIndex] = {
    ...order,
    status: payload.decision === 'APROBADO' ? 'APROBADO' : 'RECHAZADO',
    clientApprovedAt: payload.decision === 'APROBADO' ? new Date().toISOString() : undefined,
    clientApprovalMethod: payload.channel === 'WHATSAPP' ? 'WHATSAPP_CONFIRMADO' : payload.channel === 'IN_PERSON' ? 'PRESENCIAL' : 'PORTAL_WEB',
    statusHistory: [
      ...order.statusHistory,
      {
        status: payload.decision === 'APROBADO' ? 'APROBADO' : 'RECHAZADO',
        timestamp: decisionTimestamp,
        changedBy: `Recepción (${payload.channel})`,
        reason: payload.decision === 'RECHAZADO' ? payload.rejectionReason : payload.notes,
      },
    ],
  };
  mockDb.saveWorkOrders(orders);

  return createMockDecisionResponse(order, payload, decisionTimestamp);
}

function createMockDecisionResponse(order: WorkOrder, payload: BudgetApprovalPayload, createdAt: string): QuoteDecisionResponse {
  return {
    id: `decision-${order.id}-${Date.now()}`,
    quoteId: `budget-${order.id}`,
    workOrderId: order.id,
    decision: payload.decision === 'APROBADO' ? 'APPROVED' : 'REJECTED',
    channel: payload.decision === 'APROBADO' ? payload.channel : undefined,
    customerName: payload.customerName,
    notes: payload.decision === 'APROBADO' ? payload.notes : undefined,
    reason: payload.decision === 'RECHAZADO' ? payload.rejectionReason : undefined,
    createdAt,
  };
}

export function useBudgetApproval(orderId?: string) {
  return useQuery({
    queryKey: ['budget-approval', orderId],
    queryFn: () => fetchBudgetApproval(orderId as string),
    enabled: Boolean(orderId),
  });
}

export function useBudgetApprovalList() {
  return useQuery({
    queryKey: ['budget-approval-list'],
    queryFn: fetchApprovalList,
  });
}

export function useSubmitBudgetApproval(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BudgetApprovalPayload) => submitBudgetApproval(orderId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['budget-approval', orderId] }),
        queryClient.invalidateQueries({ queryKey: ['budget-approval-list'] }),
        queryClient.invalidateQueries({ queryKey: ['work-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['work-orders', 'assigned'] }),
        queryClient.invalidateQueries({ queryKey: ['mechanic', 'assigned-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['bays'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
      ]);
    },
  });
}

export function useCreateQuote(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      workOrderId: string;
      otCode: string;
      vehiclePlate: string;
      clientName: string;
      laborSubtotalBOB: number;
      partsSubtotalBOB: number;
      discountBOB?: number;
      totalBOB: number;
      items: { description: string; itemType: 'LABOR' | 'PART'; quantity: number; unitPriceBOB?: number }[];
    }) => {
      // Backend ignores unitPrice for PART items, uses catalog price
      // For LABOR, uses configured hourly rate (default 65 BOB)
      return await request<ApiResponse<Budget>>({
        url: `/work-orders/${encodeURIComponent(orderId)}/quote`,
        method: 'POST',
        data: payload,
      });
    },
  });
}
