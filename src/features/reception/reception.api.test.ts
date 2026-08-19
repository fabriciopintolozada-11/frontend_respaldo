import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createWorkOrder, getVehicleHistory } from './api/reception-api'
import type { RegisterVehicleEntryRequest, VehicleHistoryResponse } from './reception.types'

const request: RegisterVehicleEntryRequest = {
  plate: 'ABC123',
  customer: { identification: '123', name: 'Ana' },
  vehicle: { brand: 'Toyota', model: 'Corolla', year: 2022, isFullyElectric: false },
  initialComplaint: 'Ruido al frenar',
}

describe('reception JSON Server API', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('searches a normalized plate using the JSON Server filter', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([]))

    await expect(getVehicleHistory(' ab-123 ')).resolves.toBeNull()

    expect(fetch).toHaveBeenCalledWith('/api/v1/vehicles?plate=AB-123', {
      headers: {},
      signal: undefined,
    })
  })

  it('persists a new vehicle with its customer and then creates its work order', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse([]))
      .mockImplementationOnce(async (_url, options) => jsonResponse(
        JSON.parse(String(options?.body)) as VehicleHistoryResponse,
        201,
      ))
      .mockImplementationOnce(async (_url, options) => jsonResponse(
        JSON.parse(String(options?.body)),
        201,
      ))

    const order = await createWorkOrder(request)

    expect(fetch).toHaveBeenNthCalledWith(2, '/api/v1/vehicles', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }))
    expect(fetch).toHaveBeenNthCalledWith(3, '/api/v1/workOrders', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }))
    expect(order).toMatchObject({
      vehicle_id: expect.stringMatching(/^vehicle-/),
      customer_id: expect.stringMatching(/^customer-/),
      status: 'OPEN',
      initial_complaint: 'Ruido al frenar',
    })
  })

  it('reuses an existing vehicle when creating another work order', async () => {
    const vehicle = existingVehicle()
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse([vehicle]))
      .mockImplementationOnce(async (_url, options) => jsonResponse(
        JSON.parse(String(options?.body)),
        201,
      ))

    await createWorkOrder(request)

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenLastCalledWith('/api/v1/workOrders', expect.objectContaining({
      body: expect.stringContaining('"vehicle_id":"vehicle-1"'),
    }))
  })

  it('blocks fully electric vehicles before writing to the mock', async () => {
    await expect(createWorkOrder({
      ...request,
      vehicle: { ...request.vehicle, isFullyElectric: true },
    })).rejects.toMatchObject({ status: 422 })

    expect(fetch).not.toHaveBeenCalled()
  })
})

function existingVehicle(): VehicleHistoryResponse {
  return {
    id: 'vehicle-1',
    plate: 'ABC123',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2022,
    is_fully_electric: false,
    customer_id: 'customer-1',
    customer_identification: '123',
    customer_name: 'Ana',
    history: [],
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
