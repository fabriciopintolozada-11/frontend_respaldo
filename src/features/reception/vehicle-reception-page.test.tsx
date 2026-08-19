import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../lib/api-error'
import { createWorkOrder, getVehicleHistory } from './reception.api'
import { VehicleReceptionPage } from './vehicle-reception-page'

vi.mock('./reception.api', () => ({
  getVehicleHistory: vi.fn(),
  createWorkOrder: vi.fn(),
}))

const mockedHistory = vi.mocked(getVehicleHistory)
const mockedCreate = vi.mocked(createWorkOrder)

describe('VehicleReceptionPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('validates every field required by the backend DTO', async () => {
    const user = userEvent.setup()
    render(<VehicleReceptionPage />)

    await user.click(screen.getByRole('button', { name: /Registrar ingreso/ }))

    expect(await screen.findByText('La placa es obligatoria.')).toBeInTheDocument()
    expect(screen.getByText('La marca es obligatoria.')).toBeInTheDocument()
    expect(screen.getByText('El modelo es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('El año es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('La identificación es obligatoria.')).toBeInTheDocument()
    expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('El reclamo inicial es obligatorio.')).toBeInTheDocument()
    expect(mockedCreate).not.toHaveBeenCalled()
  })

  it('automatically searches, autocompletes and shows technical history', async () => {
    mockedHistory.mockResolvedValue({
      id: 'vehicle-1',
      plate: 'ABC123',
      is_fully_electric: false,
      customer_id: 'customer-1',
      customer_name: 'María Flores',
      history: [{ id: 'history-1', description: 'Cambio de pastillas', createdAt: '2026-08-18T10:00:00.000Z' }],
    })
    const user = userEvent.setup()
    render(<VehicleReceptionPage />)

    await user.type(screen.getByLabelText('Placa del vehículo *'), 'abc123')

    await waitFor(() => expect(mockedHistory).toHaveBeenCalledWith('ABC123', expect.any(AbortSignal)))
    expect(await screen.findByText('Cambio de pastillas')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre completo *')).toHaveValue('María Flores')
    expect(screen.getByText('Recepción permitida')).toBeInTheDocument()
  })

  it('blocks an existing fully electric vehicle', async () => {
    mockedHistory.mockResolvedValue({
      id: 'vehicle-electric',
      plate: 'ELE123',
      is_fully_electric: true,
      customer_id: 'customer-1',
      customer_name: 'Cliente eléctrico',
      history: [],
    })
    const user = userEvent.setup()
    render(<VehicleReceptionPage />)

    await user.type(screen.getByLabelText('Placa del vehículo *'), 'ELE123')

    expect(await screen.findByText('Recepción bloqueada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Registrar ingreso/ })).toBeDisabled()
    expect(mockedCreate).not.toHaveBeenCalled()
  })

  it('treats a 404 as new vehicle and creates the work order with the real DTO', async () => {
    mockedHistory.mockRejectedValue(new ApiError(404, { message: 'Vehicle not found' }))
    mockedCreate.mockResolvedValue({
      id: 'order-1',
      vehicle_id: 'vehicle-1',
      customer_id: 'customer-1',
      status: 'OPEN',
      initial_complaint: 'Ruido al frenar',
      created_at: '2026-08-18T10:00:00.000Z',
    })
    const user = userEvent.setup()
    render(<VehicleReceptionPage />)

    await user.type(screen.getByLabelText('Placa del vehículo *'), 'NEW123')
    expect(await screen.findByText('Vehículo nuevo')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Identificación *'), '123456')
    await user.type(screen.getByLabelText('Nombre completo *'), 'Ana Pérez')
    await user.type(screen.getByLabelText('Marca *'), 'Toyota')
    await user.type(screen.getByLabelText('Modelo *'), 'Corolla')
    await user.type(screen.getByLabelText('Año *'), '2022')
    await user.type(screen.getByLabelText('Síntomas o solicitud del cliente *'), 'Ruido al frenar')
    await user.click(screen.getByRole('button', { name: /Registrar ingreso/ }))

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledWith({
      plate: 'NEW123',
      customer: { identification: '123456', name: 'Ana Pérez' },
      vehicle: { brand: 'Toyota', model: 'Corolla', year: 2022, isFullyElectric: false },
      initialComplaint: 'Ruido al frenar',
    }))
    expect(await screen.findByText('Orden de Trabajo creada')).toBeInTheDocument()
    expect(screen.getByText('OPEN')).toBeInTheDocument()
  })
})
