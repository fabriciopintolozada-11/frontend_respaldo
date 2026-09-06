import { httpClient } from '../../../shared/api/httpClient';
import type {
  AssignMechanicResult,
  ListResponse,
  MechanicWithName,
  WorkOrderListItem,
} from './types';

const WORK_ORDERS_PATH = '/work-orders';
const MECHANICS_PATH = '/mechanics';

export const assignmentService = {
  // HU-04 / RN-14: pending (RECIBIDO, unassigned) work orders for the lead.
  async getPendingAssignments(
    page = 1,
    pageSize = 20,
  ): Promise<ListResponse<WorkOrderListItem>> {
    const { data } = await httpClient.get<ListResponse<WorkOrderListItem>>(
      WORK_ORDERS_PATH,
      { params: { page, pageSize } },
    );
    return data;
  },

  // HU-04 / RN-14: only active mechanics may receive an assigned work order.
  async getActiveMechanics(page = 1, pageSize = 20): Promise<MechanicWithName[]> {
    const { data } = await httpClient.get<ListResponse<MechanicWithName>>(
      MECHANICS_PATH,
      { params: { page, pageSize } },
    );
    return data.data.filter((mechanic) => mechanic.isActive);
  },

  // HU-04 / RN-14: assign a pending work order to a mechanic.
  async assignToMechanic(
    orderId: string,
    mechanicId: string,
  ): Promise<AssignMechanicResult> {
    const { data } = await httpClient.post<AssignMechanicResult>(
      `${WORK_ORDERS_PATH}/${orderId}/assign-mechanic`,
      { mechanicId },
    );
    return data;
  },
};