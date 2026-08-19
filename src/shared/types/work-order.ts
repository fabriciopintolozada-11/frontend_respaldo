export type WorkOrderStatus =
  | 'RECIBIDO'
  | 'ASIGNADA'
  | 'EN_REPARACION'
  | 'ESPERANDO_REPUESTO'
  | 'FINALIZADO'
  | 'LISTO_ENTREGA'

export interface AssignedWorkOrderSummary {
  id: string
  vehicleId: string
  plate: string
  status: WorkOrderStatus
  initialComplaint: string
  assignedAt: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface AssignedWorkOrderDetail {
  id: string
  vehicleId: string
  plate: string
  status: WorkOrderStatus
  initialComplaint: string
  assignedAt: string | null
  vehicle: {
    brand: string
    model: string
    year: number
  }
  tasks: WorkOrderTask[]
  parts: WorkOrderPart[]
  diagnosticReport: string | null
  statusHistory: StatusHistoryEntry[]
}

export interface WorkOrderTask {
  id: string
  description: string
  estimatedHours: number
  isCompleted: boolean
}

export interface WorkOrderPart {
  id: string
  partCode: string
  description: string
  quantityRequired: number
  quantityUsed: number
  status: 'PENDIENTE' | 'RESERVADO' | 'INSTALADO' | 'EN_ESPERA_IMPORTACION'
}

export interface StatusHistoryEntry {
  status: WorkOrderStatus
  timestamp: string
  changedBy: string
  reason?: string
}
