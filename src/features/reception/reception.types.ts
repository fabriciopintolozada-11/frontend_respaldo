export type TechnicalHistoryItem = {
  id: string
  description: string
  createdAt: string
}

export type VehicleHistoryResponse = {
  id: string
  plate: string
  brand: string
  model: string
  year: number
  isFullyElectric: boolean
  customer: {
    id: string
    identification: string
    name: string
    phone?: string
  }
  technicalHistory: TechnicalHistoryItem[]
}

export type RegisterVehicleEntryRequest = {
  plate: string
  customer: {
    identification: string
    name: string
    phone?: string
  }
  vehicle: {
    brand: string
    model: string
    year: number
    isFullyElectric: boolean
  }
  initialComplaint: string
}

export type CreatedWorkOrderResponse = {
  id: string
  vehicleId: string
  customerId: string
  status: string
  initialComplaint: string
  createdAt: string
}

export type VehicleEntryFormValues = {
  plate: string
  customerIdentification: string
  customerName: string
  customerPhone: string
  brand: string
  model: string
  year: string
  isFullyElectric: boolean
  initialComplaint: string
}

export type LookupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'new' }
  | { status: 'found'; data: VehicleHistoryResponse }
  | { status: 'error'; message: string }
