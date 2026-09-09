import { httpClient } from '../../../shared/api/httpClient';
import type { WorkBayMonitoring } from './types';

export const WORK_BAYS_MONITORING_PATH = '/work-bays/monitoring';

export const workBaysService = {
  async getMonitoring(): Promise<WorkBayMonitoring[]> {
    const { data } = await httpClient.get<WorkBayMonitoring[]>(WORK_BAYS_MONITORING_PATH);
    return data;
  },
};