import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { server } from '../../test/msw-handlers'
import { createWorkOrder, getVehicleHistory } from './api/reception-api'
import type { RegisterVehicleEntryRequest } from './reception.types'

const request: RegisterVehicleEntryRequest = {
  plate: 'ABC123',
  customer: { identification: '123', name: 'Ana' },
  vehicle: { brand: 'Toyota', model: 'Corolla', year: 2022, isFullyElectric: false },
  initialComplaint: 'Ruido al frenar',
}

describe('reception API', () => {
  it('searches a normalized plate using the vehicle history endpoint', async () => {
    const requestSpy = vi.fn()
    server.use(http.get('/api/v1/vehicles/AB-123/history', ({ request }) => {
      requestSpy(request.url)
      return HttpResponse.json({}, { status: 404 })
    }))

    await expect(getVehicleHistory(' ab-123 ')).resolves.toBeNull()

    expect(requestSpy).toHaveBeenCalledWith('http://localhost:3000/api/v1/vehicles/AB-123/history')
  })

  it('sends the complete registration DTO in one backend operation', async () => {
    const requestSpy = vi.fn()
    server.use(http.post('/api/v1/work-orders', async ({ request: apiRequest }) => {
      requestSpy(await apiRequest.json())
      return HttpResponse.json({
        id: 'work-order-1',
        vehicle_id: 'vehicle-1',
        customer_id: 'customer-1',
        status: 'OPEN',
        initial_complaint: request.initialComplaint,
        created_at: '2026-08-19T12:00:00.000Z',
      }, { status: 201 })
    }))

    const order = await createWorkOrder(request)

    expect(requestSpy).toHaveBeenCalledOnce()
    expect(requestSpy).toHaveBeenCalledWith(request)
    expect(order).toMatchObject({
      vehicle_id: 'vehicle-1',
      customer_id: 'customer-1',
      status: 'OPEN',
      initial_complaint: 'Ruido al frenar',
    })
  })

  it('blocks fully electric vehicles before calling the backend', async () => {
    const requestSpy = vi.fn()
    server.use(http.post('/api/v1/work-orders', () => {
      requestSpy()
      return HttpResponse.json({})
    }))

    await expect(createWorkOrder({
      ...request,
      vehicle: { ...request.vehicle, isFullyElectric: true },
    })).rejects.toMatchObject({ statusCode: 422 })

    expect(requestSpy).not.toHaveBeenCalled()
  })
})
