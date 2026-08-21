import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '../../app/providers/AppProviders'
import { server } from '../../test/msw-handlers'
import type { VehicleHistoryResponse } from './reception.types'
import { VehicleReceptionPage } from './vehicle-reception-page'

describe('VehicleReceptionPage', () => {
  const requestSpy = vi.fn()

  beforeEach(() => {
    requestSpy.mockClear()
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
  })

  it('validates every required work-order field', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Registrar ingreso/ }))

    expect(await screen.findByText('La placa es obligatoria.')).toBeInTheDocument()
    expect(screen.getByText('La marca es obligatoria.')).toBeInTheDocument()
    expect(screen.getByText('El modelo es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('El año es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('La identificación es obligatoria.')).toBeInTheDocument()
    expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('El reclamo inicial es obligatorio.')).toBeInTheDocument()
    expect(requestSpy).not.toHaveBeenCalled()
  })

  it('searches, autocompletes vehicle and customer data, and shows history', async () => {
    server.use(http.get('/api/v1/vehicles/ABC123/history', () => HttpResponse.json(existingVehicle())))
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Placa del vehículo *'), 'abc123')

    expect(await screen.findByText('Cambio de pastillas')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre completo *')).toHaveValue('María Flores')
    expect(screen.getByLabelText('Identificación *')).toHaveValue('7845123')
    expect(screen.getByLabelText('Marca *')).toHaveValue('Toyota')
    expect(screen.getByLabelText('Modelo *')).toHaveValue('Corolla')
    expect(screen.getByLabelText('Año *')).toHaveValue('2022')
    expect(screen.getByText('Recepción permitida')).toBeInTheDocument()
  })

  it('blocks an existing fully electric vehicle', async () => {
    server.use(http.get('/api/v1/vehicles/ELE123/history', () => HttpResponse.json({
      ...existingVehicle(),
      id: 'vehicle-electric',
      plate: 'ELE123',
      is_fully_electric: true,
    })))
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Placa del vehículo *'), 'ELE123')

    expect(await screen.findByText('Recepción bloqueada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Registrar ingreso/ })).toBeDisabled()
  })

  it('detects a new vehicle and sends one registration request', async () => {
    server.use(
      http.get('/api/v1/vehicles/NEW123/history', () => HttpResponse.json({}, { status: 404 })),
      http.post('/api/v1/work-orders', async ({ request }) => {
        requestSpy(await request.json())
        return HttpResponse.json({
        id: 'work-order-1',
        vehicle_id: 'vehicle-1',
        customer_id: 'customer-1',
        status: 'OPEN',
        initial_complaint: 'Ruido al frenar',
        created_at: '2026-08-19T12:00:00.000Z',
        }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Placa del vehículo *'), 'NEW123')
    expect(await screen.findByText('Vehículo nuevo')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Identificación *'), '123456')
    await user.type(screen.getByLabelText('Nombre completo *'), 'Ana Pérez')
    await user.type(screen.getByLabelText('Marca *'), 'Toyota')
    await user.type(screen.getByLabelText('Modelo *'), 'Corolla')
    await user.type(screen.getByLabelText('Año *'), '2022')
    await user.type(screen.getByLabelText('Síntomas o solicitud del cliente *'), 'Ruido al frenar')
    await user.click(screen.getByRole('button', { name: /Registrar ingreso/ }))

    expect(await screen.findByText('Orden de Trabajo creada')).toBeInTheDocument()
    expect(screen.getByText('OPEN')).toBeInTheDocument()
    expect(requestSpy).toHaveBeenCalledOnce()
    expect(requestSpy).toHaveBeenCalledWith(expect.objectContaining({ plate: 'NEW123' }))
  })
})

function renderPage() {
  return render(
    <AppProviders>
      <VehicleReceptionPage />
    </AppProviders>,
  )
}

function existingVehicle(): VehicleHistoryResponse {
  return {
    id: 'vehicle-1',
    plate: 'ABC123',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2022,
    is_fully_electric: false,
    customer_id: 'customer-1',
    customer_identification: '7845123',
    customer_name: 'María Flores',
    customer_phone: '+591 71234567',
    history: [{
      id: 'history-1',
      description: 'Cambio de pastillas',
      createdAt: '2026-08-18T10:00:00.000Z',
    }],
  }
}

