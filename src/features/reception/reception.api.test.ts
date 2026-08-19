import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createWorkOrder, getVehicleHistory } from './api/reception-api'
import type { RegisterVehicleEntryRequest } from './reception.types'

describe('reception API', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('uses the real history route and receptionist role header', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ id: 'vehicle-1' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    await getVehicleHistory(' ab-123 ')

    expect(fetch).toHaveBeenCalledWith('/api/vehicles/AB-123/history', expect.objectContaining({
      headers: expect.objectContaining({ 'x-user-role': 'RECEPTIONIST' }),
    }))
  })

  it('posts the unmodified DTO to the real work-order route', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ id: 'order-1' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }))
    const request: RegisterVehicleEntryRequest = {
      plate: 'ABC123',
      customer: { identification: '123', name: 'Ana' },
      vehicle: { brand: 'Toyota', model: 'Corolla', year: 2022, isFullyElectric: false },
      initialComplaint: 'Ruido al frenar',
    }

    await createWorkOrder(request)

    expect(fetch).toHaveBeenCalledWith('/api/work-orders', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(request),
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        'x-user-role': 'RECEPTIONIST',
      }),
    }))
  })
})
