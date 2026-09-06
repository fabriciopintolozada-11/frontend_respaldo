import type {
  ListResponse,
  Mechanic,
  WorkOrderListItem,
} from '../../../shared/api/schema.gen';

// HU-04: contract of the Workshop Lead assignment flow (US-04 / RN-14).
// The generated list and mechanic contracts from schema.gen are reused as-is.

export type { ListResponse, WorkOrderListItem };

// HU-04 / RN-14: getActiveMechanics now enriches each mechanic with its
// display name resolved from the users table (`name: string | null`).
// schema.gen is still the generated contract ({ id, isActive }), so this
// extends it locally until the schema is next regenerated.
export interface MechanicWithName extends Mechanic {
  name?: string | null;
}

// HU-04 / RN-14: response of POST /work-orders/:id/assign-mechanic.

export interface AssignMechanicResult {
  id: string;
  mechanicId: string;
  status: string;
  updatedAt: string;
}