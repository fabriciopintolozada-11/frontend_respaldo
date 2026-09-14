import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { WorkBayMonitoring } from '../api/types';
import { WorkBaysGrid } from './WorkBaysGrid';

function makeBay(overrides: Partial<WorkBayMonitoring> & { bayNumber: number }): WorkBayMonitoring {
  return {
    id: `bay-${overrides.bayNumber}`,
    bayNumber: overrides.bayNumber,
    isOccupied: false,
    status: 'LIBRE',
    currentWorkOrderId: null,
    currentWorkOrder: null,
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-01T12:00:00.000Z',
    ...overrides,
  };
}

function cardFor(bayNumber: number): HTMLElement {
  const heading = screen.getByText(`Bahía ${bayNumber}`);
  return heading.closest('article') as HTMLElement;
}

const fourBays: WorkBayMonitoring[] = [
  makeBay({
    bayNumber: 1,
    isOccupied: true,
    status: 'OCUPADA',
    currentWorkOrderId: 'wo-1',
    currentWorkOrder: {
      id: 'wo-1',
      status: 'EN_DIAGNOSTICO',
      plate: '4589-KXA',
      vehicleBrand: 'Toyota',
      vehicleModel: 'Hilux',
      mechanicId: 'm-1',
      mechanicName: 'Juan Carlos Mamani',
      assignedAt: '2026-09-01T08:00:00.000Z',
      elapsedHours: 4,
    },
  }),
  makeBay({
    bayNumber: 2,
    isOccupied: true,
    status: 'ESPERA_REPUESTO',
    currentWorkOrderId: 'wo-2',
    currentWorkOrder: {
      id: 'wo-2',
      status: 'EN_ESPERA_DE_REPUESTO',
      plate: '3042-XYZ',
      vehicleBrand: 'Suzuki',
      vehicleModel: 'Grand Vitara',
      mechanicId: 'm-2',
      mechanicName: 'Roberto Gómez Silva',
      assignedAt: '2026-08-31T10:00:00.000Z',
      elapsedHours: 26,
    },
  }),
  makeBay({
    bayNumber: 3,
    isOccupied: true,
    status: 'OCUPADA',
    currentWorkOrderId: 'wo-3',
    currentWorkOrder: {
      id: 'wo-3',
      status: 'EN_REPARACION',
      plate: '2190-LPN',
      vehicleBrand: 'Nissan',
      vehicleModel: 'Frontier',
      mechanicId: 'm-3',
      mechanicName: 'Diego Morales Claros',
      assignedAt: '2026-09-01T03:00:00.000Z',
      elapsedHours: 9,
    },
  }),
  makeBay({ bayNumber: 4, status: 'LIBRE' }),
];

describe('WorkBaysGrid (FE-T18.1)', () => {
  it('representa exactamente las 4 bahías físicas', () => {
    render(<WorkBaysGrid bays={fourBays} />);

    expect(screen.getAllByRole('article')).toHaveLength(4);
    expect(screen.getByText('Bahía 1')).toBeInTheDocument();
    expect(screen.getByText('Bahía 2')).toBeInTheDocument();
    expect(screen.getByText('Bahía 3')).toBeInTheDocument();
    expect(screen.getByText('Bahía 4')).toBeInTheDocument();
  });

  it('muestra explícitamente "Disponible" en una bahía libre', () => {
    render(<WorkBaysGrid bays={fourBays} />);

    const freeCard = cardFor(4);
    expect(freeCard).toHaveTextContent('Disponible');
    expect(freeCard).not.toHaveTextContent('OT:');
  });

  it('muestra los datos de la bahía ocupada cuando el backend los provee', () => {
    render(<WorkBaysGrid bays={fourBays} />);

    const occupiedCard = cardFor(1);
    expect(occupiedCard).toHaveTextContent('4589-KXA');
    expect(occupiedCard).toHaveTextContent('Toyota Hilux');
    expect(occupiedCard).toHaveTextContent('Juan Carlos Mamani');
    expect(occupiedCard).toHaveTextContent('OT: EN_DIAGNOSTICO');
    expect(occupiedCard).toHaveTextContent('4 h en etapa');
  });
});

describe('WorkBaysGrid diferenciación visual de estados (FE-T18.2)', () => {
  it('pinta Disponible en gris', () => {
    render(<WorkBaysGrid bays={fourBays} />);

    expect(cardFor(4).className).toContain('border-slate-200');
    expect(cardFor(4)).toHaveTextContent('Disponible');
  });

  it('pinta En Diagnóstico en azul cuando la OT está en diagnóstico', () => {
    render(<WorkBaysGrid bays={fourBays} />);

    expect(cardFor(1).className).toContain('3B82F6');
  });

  it('pinta En Reparación en verde', () => {
    render(<WorkBaysGrid bays={fourBays} />);

    expect(cardFor(3).className).toContain('22C55E');
  });

  it('pinta Espera de Repuesto en ámbar y la mantiene como ocupada', () => {
    render(<WorkBaysGrid bays={fourBays} />);

    const waitingCard = cardFor(2);
    expect(waitingCard.className).toContain('F59E0B');
    expect(waitingCard).toHaveTextContent('En Espera de Repuesto');
    expect(waitingCard).not.toHaveTextContent('Disponible');
  });

  it('no inventa el repuesto o los días cuando el backend no los envía', () => {
    render(<WorkBaysGrid bays={fourBays} />);

    const waitingCard = cardFor(2);
    expect(waitingCard).toHaveTextContent('En Espera de Repuesto');
    expect(waitingCard).not.toHaveTextContent('Repuesto:');
    expect(waitingCard).not.toHaveTextContent('días de espera');
  });

  it('no muestra undefined/null en una bahía ocupada sin detalle', () => {
    const occupiedWithoutDetail = [makeBay({ bayNumber: 1, isOccupied: true, status: 'OCUPADA' })];
    render(<WorkBaysGrid bays={occupiedWithoutDetail} />);

    const occupiedCard = cardFor(1);
    expect(occupiedCard).toHaveTextContent('Ocupada');
    expect(occupiedCard.textContent).not.toMatch(/undefined|null/);
  });
});