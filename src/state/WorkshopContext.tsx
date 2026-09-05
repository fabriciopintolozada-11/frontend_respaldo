import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { workshopService, type DiagnosticPayload } from '../services/workshop-service';
import type {
  Bay,
  BayStatus,
  InventoryItem,
  Mechanic,
  WorkOrder,
  WorkOrderStatus,
  WorkshopMetrics,
} from '../types/workshop';

interface WorkshopContextValue {
  bays: Bay[];
  workOrders: WorkOrder[];
  mechanics: Mechanic[];
  inventory: InventoryItem[];
  metrics: WorkshopMetrics | null;
  loading: boolean;
  refresh: () => Promise<void>;
  assignBayAndMechanic: (
    orderId: string,
    bayId: number,
    primaryMechanicId: string,
    assistantMechanicId?: string,
  ) => Promise<WorkOrder>;
  updateBayStatus: (bayId: number, status: BayStatus, notes?: string) => Promise<Bay>;
  updateStatus: (orderId: string, newStatus: WorkOrderStatus, changedBy: string, reason?: string) => Promise<WorkOrder>;
  startDiagnostic: (orderId: string, changedBy: string) => Promise<WorkOrder>;
  saveDiagnosticDraft: (
    orderId: string,
    payload: { diagnosticReport?: string; mechanicNotes?: string },
    _changedBy?: string,
  ) => Promise<WorkOrder>;
  completeDiagnostic: (orderId: string, payload: DiagnosticPayload, changedBy: string) => Promise<WorkOrder>;
  toggleLaborCompletion: (orderId: string, laborId: string) => Promise<WorkOrder>;
  confirmPartInstalled: (orderId: string, partItemId: string) => Promise<WorkOrder>;
  resetData: () => void;
}

const WorkshopContext = createContext<WorkshopContextValue | undefined>(undefined);

export function WorkshopProvider({ children }: { children: ReactNode }) {
  const [bays, setBays] = useState<Bay[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [metrics, setMetrics] = useState<WorkshopMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [baysData, ordersData, mechanicsData, inventoryData, metricsData] = await Promise.all([
        workshopService.getAllBays(),
        workshopService.getAllWorkOrders(),
        workshopService.getAllMechanics(),
        workshopService.getAllInventory(),
        workshopService.getMetrics(),
      ]);

      setBays(baysData);
      setWorkOrders(ordersData);
      setMechanics(mechanicsData);
      setInventory(inventoryData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error al cargar datos del taller:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const executeMutation = async <T,>(action: () => Promise<T>): Promise<T> => {
    const result = await action();
    await loadData();
    return result;
  };

  const value = useMemo<WorkshopContextValue>(
    () => ({
      bays,
      workOrders,
      mechanics,
      inventory,
      metrics,
      loading,
      refresh: loadData,
      assignBayAndMechanic: (orderId, bayId, primaryMechanicId, assistantMechanicId) =>
        executeMutation(() =>
          workshopService.assignBayAndMechanic(orderId, bayId, primaryMechanicId, assistantMechanicId),
        ),
      updateBayStatus: (bayId, status, notes) =>
        executeMutation(() => workshopService.updateBayStatus(bayId, status, notes)),
      updateStatus: (orderId, newStatus, changedBy, reason) =>
        executeMutation(() => workshopService.updateStatus(orderId, newStatus, changedBy, reason)),
      startDiagnostic: (orderId, changedBy) =>
        executeMutation(() => workshopService.startDiagnostic(orderId, changedBy)),
      saveDiagnosticDraft: (orderId, payload) =>
        executeMutation(() => workshopService.saveDiagnosticDraft(orderId, payload)),
      completeDiagnostic: (orderId, payload) =>
        executeMutation(() => workshopService.completeDiagnostic(orderId, payload)),
      toggleLaborCompletion: (orderId, laborId) =>
        executeMutation(() => workshopService.toggleLaborCompletion(orderId, laborId)),
      confirmPartInstalled: (orderId, partItemId) =>
        executeMutation(() => workshopService.confirmPartInstalled(orderId, partItemId)),
      resetData: () => {
        void loadData();
      },
    }),
    [bays, workOrders, mechanics, inventory, metrics, loading, loadData],
  );

  return <WorkshopContext.Provider value={value}>{children}</WorkshopContext.Provider>;
}

// AQUÍ SE AGREGA LA FUNCIÓN QUE FALTABA
export function useWorkshop(): WorkshopContextValue {
  const context = useContext(WorkshopContext);
  if (!context) {
    throw new Error('useWorkshop debe ser utilizado dentro de un WorkshopProvider');
  }
  return context;
}