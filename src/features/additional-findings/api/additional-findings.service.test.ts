import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '../../../test/msw-handlers';
import {
  ADDITIONAL_FINDING_ORDER_ID,
  mockApprovedAdditionalFinding,
  mockRejectedAdditionalFinding,
} from '../mocks/additional-findings.fixtures';
import { additionalFindingsService } from './additional-findings.service';

describe('additionalFindingsService (US-21)', () => {
  it('approve() posts the channel, customerName and notes to the approve endpoint', async () => {
    const bodySpy = vi.fn();
    server.use(
      http.post('/api/v1/work-orders/:id/additional-findings/approve', async ({ request }) => {
        bodySpy(await request.json());
        return HttpResponse.json(mockApprovedAdditionalFinding);
      }),
    );

    const result = await additionalFindingsService.approve(
      ADDITIONAL_FINDING_ORDER_ID,
      {
        channel: 'CALL',
        customerName: 'Juan Pérez',
        notes: 'Cliente confirmó la ampliación por teléfono.',
      },
    );

    expect(bodySpy).toHaveBeenCalledWith({
      channel: 'CALL',
      customerName: 'Juan Pérez',
      notes: 'Cliente confirmó la ampliación por teléfono.',
    });
    expect(result).toEqual(mockApprovedAdditionalFinding);
  });

  it('reject() posts the reason to the reject endpoint', async () => {
    const bodySpy = vi.fn();
    server.use(
      http.post('/api/v1/work-orders/:id/additional-findings/reject', async ({ request }) => {
        bodySpy(await request.json());
        return HttpResponse.json(mockRejectedAdditionalFinding);
      }),
    );

    const result = await additionalFindingsService.reject(
      ADDITIONAL_FINDING_ORDER_ID,
      { reason: 'El cliente prefiere reparar la falla en otro taller.' },
    );

    expect(bodySpy).toHaveBeenCalledWith({
      reason: 'El cliente prefiere reparar la falla en otro taller.',
    });
    expect(result).toEqual(mockRejectedAdditionalFinding);
  });
});