// US-19 (BE-T19.2, RN-16): payload to conclude a repair and release its bay.
// finalMileage and closingNotes are optional for the backend, but the UI
// captures them because the Gherkin scenario requires both. No monetary
// fields (RN-16).
export interface CompleteWorkOrderPayload {
  finalMileage?: number;
  closingNotes?: string;
}

// US-19: response after concluding a repair. Confirms the new status
// (LISTO_ENTREGA), when it was completed and which physical bay (if any) was
// freed. Never exposes costs or prices (RN-16).
export interface CompleteWorkOrderResponse {
  id: string;
  status: 'LISTO_ENTREGA' | string;
  completedAt: string;
  bayNumber: number | null;
  finalMileage: number | null;
  closingNotes: string | null;
}