import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { WorkBayMonitoring } from '../api/types';
import { WorkBaysGrid } from './WorkBaysGrid';

function makeBay(overrides: Partial<WorkBayMonitoring> & { bayId: number }): WorkBayMonitoring {
  return {
    bayCode: `BAHIA-0${overrides.bayId}`,
    bayName: `Bahía ${overrides.bayId}`,
    status: 'DISPONIBLE',
    ...overrides,
  };
}

function cardFor(bayCode: string): HTMLElement {
  const heading = screen.getByText(bayCode);
  return heading.closest('article') as HTMLElement;
}

const fourBays: WorkBayMonitoring[] = [
  makeBay({
    bayId: 1,
    status: 'EN_DIAGNOSTICO',
    occupation: {
      vehiclePlate: '4589-KXA',
      vehicleDescription: 'Toyota Hilux 2021',
      mechanicName: 'Juan Carlos Mamani',
      workOrderStatus: 'EN_DIAGNOSTICO',
      hoursInStage: 4,
    },
  }),
  makeBay({
    bayId: 2,
    status: 'EN_ESPERA_DE_REPUESTO',
    occupation: {
      vehiclePlate: '3042-XYZ',
      vehicleDescription: 'Suzuki Grand Vitara 2019',
      mechanicName: 'Roberto Gómez Silva',
      workOrderStatus: 'ESPERANDO_REPUESTO',
      hoursInStage: 26,
      waitingPartName: 'Kit de embrague reforzado',
      waitingDays: 3,
    },
  }),
  makeBay({
    bayId: 3,
    status: 'EN_REPARACION',
    occupation: {
      vehiclePlate: '2190-LPN',
      vehicleDescription: 'Nissan Frontier 2018',
      mechanicName: 'Diego Morales Claros',
      workOrderStatus: 'EN_REPARACION',
      hoursInStage: 9,
    },
  }),
  makeBay({ bayId: 4, status: 'DISPONIBLE' }),
];

describe('WorkBaysGrid (FE-T18.1)', () => {
  it('representa exactamente las 4 bahías físicas', () => {
    render(<WorkBaysGrid bays={fourBays} />);

    expect(screen.getAllByRole('article')).toHaveLength(4);
    expect(screen.getByText('BAHIA-01')).toBeInTheDocument();
    expect(screen.getByText('BAHIA-02')).toBeInTheDocument();
    expect(screen.getByText('BAHIA-03')).toBeInTheDocument();
    expect(screen.getByText('BAHIA-04')).toBeInTheDocument();
  });

  it('muestra explícitamente "Disponible" en una bahía libre', () => {
    render(<WorkBaysGrid bays={fourBays} />);

    const freeCard = cardFor('BAHIA-04');
    expect(freeCard).toHaveTextContent('Disponible');
    expect(freeCard).not.toHaveTextContent('OT:');
  });

  it('muestra los datos de la bahía ocupada cuando el backend los provee', () => {
    render(<WorkBaysGrid bays={fourBays} />);

    const occupiedCard = cardFor('BAHIA-01');
    expect(occupiedCard).toHaveTextContent('4589-KXA');
    expect(occupiedCard).toHaveTextContent('Toyota Hilux 2021');
    expect(occupiedCard).toHaveTextContent('Juan Carlos Mamani');
    expect(occupiedCard).toHaveTextContent('OT: EN_DIAGNOSTICO');
    expect(occupiedCard).toHaveTextContent('4 h en etapa');
  });
});

describe('WorkBaysGrid diferenciación visual de estados (FE-T18.2)', () => {
  it('pinta Disponible en gris', () => {
    render(<WorkBaysGrid bays={fourBays} />);

    expect(cardFor('BAHIA-04').className).toContain('border-slate-200');
    expect(cardFor('BAHIA-04')).toHaveTextContent('Disponible');
  });

  it('pinta En Diagnóstico en azul', () => {
    render(<WorkBaysGrid bays={fourBays} />);

    expect(cardFor('BAHIA-01').className).toContain('3B82F6');
  });

  it('pinta En Reparación en verde', () => {
    render(<WorkBaysGrid bays={fourBays} />);

    expect(cardFor('BAHIA-03').className).toContain('22C55E');
  });

  it('pinta Espera de Repuesto en ámbar y la mantiene como ocupada', () => {
    render(<WorkBaysGrid bays={fourBays} />);

    const waitingCard = cardFor('BAHIA-02');
    expect(waitingCard.className).toContain('F59E0B');
    expect(waitingCard).toHaveTextContent('Espera de Repuesto');
    expect(waitingCard).toHaveTextContent('Kit de embrague reforzado');
    expect(waitingCard).toHaveTextContent('3 días de espera');
    expect(waitingCard).not.toHaveTextContent('Disponible');
  });

  it('no inventa el repuesto o los días cuando el backend no los envía', () => {
    const withoutWaitingInfo = [
      makeBay({
        bayId: 2,
        status: 'EN_ESPERA_DE_REPUESTO',
        occupation: { vehiclePlate: '3042-XYZ' },
      }),
    ];
    render(<WorkBaysGrid bays={withoutWaitingInfo} />);

    const waitingCard = cardFor('BAHIA-02');
    expect(waitingCard).toHaveTextContent('Espera de Repuesto');
    expect(waitingCard).not.toHaveTextContent('Repuesto:');
    expect(waitingCard).not.toHaveTextContent('días de espera');
  });
});