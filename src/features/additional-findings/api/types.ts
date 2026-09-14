// US-21 (FE-T21.1 / FE-T21.2): contract of the unforeseen finding decision
// flow. Copied from the real backend DTOs (approve/reject additional-findings)
// because schema.gen.ts is not regenerated in this repo (project convention).
// No monetary field is defined: RN-16 forbids exposing costs to the mechanic
// and the annex only reconstructs tasks/parts from the mechanic description.

export type AdditionalFindingStatus =
  | 'NONE'
  | 'PENDING_QUOTE'
  | 'APPROVED'
  | 'REJECTED';

export type ApprovalChannel = 'CALL' | 'WHATSAPP' | 'IN_PERSON';

export interface ApproveAdditionalFindingPayload {
  channel: ApprovalChannel;
  customerName: string;
  notes: string;
}

export interface RejectAdditionalFindingPayload {
  reason: string;
}

// BE-T21.2: response of approve/reject. Only the decision state leaks to the
// mechanic (additionalFindingStatus in GET /work-orders/assigned/:id).
export interface AdditionalFindingResponse {
  id: string;
  workOrderId: string;
  description: string;
  suggestedTasks: string[];
  suggestedPartIds: string[];
  estimatedHours: number;
  status: 'PENDING_QUOTE' | 'APPROVED' | 'REJECTED';
  reportedBy: string;
  decidedBy: string | null;
  decidedAt: string | null;
  channel: ApprovalChannel | null;
  customerName: string | null;
  notes: string | null;
  rejectionReason: string | null;
  createdAt: string;
}