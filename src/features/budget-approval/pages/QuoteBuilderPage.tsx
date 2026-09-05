import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  PlusCircle,
  ShieldAlert,
  Printer,
  Copy,
  ExternalLink,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
import { Modal } from '../../../shared/components/Modal';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { useToast } from '../../../shared/components/ToastContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type ApiResponse } from '../../../shared/api/api-client';
import type { Budget, WorkOrder } from '../../../shared/types/openapi';
import { budgetsService } from '../api/budgets-service';
import { workOrdersService } from '../../work-orders/api/work-orders-service';
import { normalizePlate } from '../reception/reception.validation';

const moneyFormatter = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatMoney(amount: number): string {
  return `${moneyFormatter.format(amount)} BOB`;
}

interface PendingQuoteOrder {
  id: string;
  code: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  clientName: string;
  status: string;
  entryDate: string;
  initialComplaint: string;
}

interface QuoteItem {
  id: string;
  description: string;
  itemType: 'LABOR' | 'PART';
  quantity: number;
  unitPriceBOB: number;
  totalBOB: number;
  isElectricRestricted: boolean;
}

interface QuoteBuilderFormValues {
  workOrderId: string;
  items: string[]; // selected item IDs
  notes?: string;
}

export function QuoteBuilderPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  // Fetch work orders pending quote
  const pendingQuery = useQuery({
    queryKey: ['pending-quote-orders'],
    queryFn: async () => {
      const response = await apiClient.get(() => {
        const orders = workOrdersService.getAll();
        return (orders.data ?? []).filter(
          (o) => o.status === 'EN_DIAGNOSTICO' || o.status === 'DIAGNOSTICADA'
        );
      });
      return response.data as PendingQuoteOrder[];
    },
    enabled: false, // Se habilitará al cargar la página
  });

  const [selectedOrder, setSelectedOrder] = useState<PendingQuoteOrder | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnostic, setDiagnostic] = useState<{ description: string; suggestedTasks: string[]; suggestedPartIds: string[]; estimatedHours: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load data when pendingQuery succeeds
  useEffect(() => {
    if (pendingQuery.data && pendingQuery.data.length > 0) {
      // Nothing special needed, orders are available
    }
  }, [pendingQuery.data]);

  const loadDiagnostic = (orderId: string) => {
    // Find diagnostic from the order (simplified - in real app would call API)
    const order = pendingQuery.data?.find((o) => o.id === orderId);
    if (order) {
      // Simulate loading diagnostic - in real app would call GET /work-orders/:id/diagnostic
      setDiagnostic({
        description: order.initialComplaint || 'Diagnóstico técnico del vehículo',
        suggestedTasks: ['Inspección general', 'Diagnóstico de sistemas'],
        suggestedPartIds: [],
        estimatedHours: 2,
      });
      setShowDiagnostic(true);
    }
  };

  const handleAddLabor = (hours: number, hourlyRate: number = 65) => {
    const totalBOB = hours * hourlyRate;
    const newItem: QuoteItem = {
      id: `labor-${Date.now()}`,
      description: `${hours} hora${hours !== 1 ? 's de mano de obra' : ''}`,
      itemType: 'LABOR',
      quantity: hours,
      unitPriceBOB: hourlyRate,
      totalBOB: totalBOB,
      isElectricRestricted: false,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleAddPart = (partId: string, partDescription: string, quantity: number, catalogPrice: number) => {
    const existingIndex = items.findIndex((item) => item.id.includes(partId));
    if (existingIndex >= 0) {
      // Increase quantity if part already selected
      const updated = [...items];
      updated[existingIndex].quantity += quantity;
      updated[existingIndex].totalBOB = updated[existingIndex].unitPriceBOB * updated[existingIndex].quantity;
      setItems(updated);
    } else {
      const newItem: QuoteItem = {
        id: `part-${Date.now()}-${partId}`,
        description: partDescription,
        itemType: 'PART',
        quantity: quantity,
        unitPriceBOB: catalogPrice,
        totalBOB: catalogPrice * quantity,
        isElectricRestricted: partDescription.toLowerCase().includes('motor') || partDescription.toLowerCase().includes('eléct'),
      };
      setItems((prev) => [...prev, newItem]);
    }
  };

  const calculateTotals = () => {
    const laborTotal = items.filter((i) => i.itemType === 'LABOR').reduce((sum, i) => sum + i.totalBOB, 0);
    const partsTotal = items.filter((i) => i.itemType === 'PART').reduce((sum, i) => sum + i.totalBOB, 0);
    const total = laborTotal + partsTotal;
    return { laborTotal, partsTotal, total };
  };

  const onSubmit = async () => {
    if (selectedOrder === null || items.length === 0) {
      toast.warning('Selecciona al menos un ítem', 'No hay ítems para cotizar');
      return;
    }

    setIsSubmitting(true);
    try {
      const { laborTotal, partsTotal, total } = calculateTotals();
      
      const response = await apiClient.post<ApiResponse<Budget>>((data) => {
        const newBudget: Budget = {
          id: `budget-${Date.now().toString().slice(-4)}`,
          workOrderId: selectedOrder!.id,
          otCode: selectedOrder!.code,
          vehiclePlate: selectedOrder!.vehiclePlate,
          clientName: selectedOrder!.clientName,
          clientDocument: '', // Will be filled later
          createdAt: new Date().toISOString(),
          validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          laborSubtotalBOB: laborTotal,
          partsSubtotalBOB: partsTotal,
          discountBOB: 0,
          totalBOB: total,
          status: 'ENVIADO_CLIENTE',
          isAdditionalWorkBudget: false,
        };
        // In a real implementation, this would send to the backend
        // For now, we'll just save it locally and notify
        data(newBudget);
        return newBudget;
      }, {
        workOrderId: selectedOrder!.id,
        otCode: selectedOrder!.code,
        vehiclePlate: selectedOrder!.vehiclePlate,
        clientName: selectedOrder!.clientName,
        laborSubtotalBOB: laborTotal,
        partsSubtotalBOB: partsTotal,
        discountBOB: 0,
        totalBOB: total,
      });

      setIsSubmitting(false);
      setShowSuccess(true);
      setItems([]);
      setSelectedOrder(null);
      toast.success('Presupuesto generado', `Presupuesto N° ${selectedOrder!.code} creado exitosamente en BOB $${formatMoney(total)}`);
    } catch (error) {
      setIsSubmitting(false);
      toast.error('Error al generar presupuesto', error instanceof Error ? error.message : 'Intenta nuevamente');
    }
  };

  if (!pendingQuery.data || pendingQuery.isLoading) {
    return (
      <Card variant="public" padding="lg" className="max-w-2xl mx-auto">
        <LoadingSkeleton rows={3} className="max-h-64" />
        <p className="mt-4 text-center text-slate-600">Cargando órdenes pendientes de cotización...</p>
      </Card>
    );
  }

  if (pendingQuery.data.length === 0) {
    return (
      <Card variant="public" padding="lg" className="max-w-2xl mx-auto">
        <EmptyState
          icon={<FileCheck className="w-8 h-8 text-slate-400" />}
          title="No hay órdenes para cotizar"
          description="Las órdenes con diagnóstico pending aparecerán aquí para generar presupuestos."
        />
      </Card>
    );
  }

  return (
    <Card variant="public" padding="lg" className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Generador de Presupuesto (US-12)</h1>
      
      {/* Orders List Section */}
      <Card variant="flat" padding="md" className="mb-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-700">Órdenes en diagnóstico</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDiagnostic(false)}
          >
            Cerrar lista
          </Button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {pendingQuery.data.map((order) => (
            <div
              key={order.id}
              onClick={() => {
                setSelectedOrder(order);
                setShowDiagnostic(true);
                loadDiagnostic(order.id);
              }}
              className="cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-lime-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-lime-700">{order.code}</span>
                <div>
                  <p className="font-bold text-slate-900">{order.vehiclePlate}</p>
                  <p className="text-sm text-slate-500">{order.vehicleBrand} {order.vehicleModel} ({order.vehicleYear})</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">{order.initialComplaint}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Selected Order Section */}
      {selectedOrder && (
        <Card variant="flat" padding="md" className="mb-6">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Órden Seleccionada</h2>
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-xs font-bold text-lime-700">{selectedOrder.code}</span>
            <span>
              <strong>Vehículo:</strong> {selectedOrder.vehiclePlate} · {selectedOrder.vehicleBrand} {selectedOrder.vehicleModel} ({selectedOrder.vehicleYear})
            </span>
          </div>
          <p className="text-sm text-slate-500">{selectedOrder.initialComplaint}</p>
          {showDiagnostic && (
            <div className="mt-3 p-3 rounded-xl border border-lime-200 bg-lime-50 text-sm">
              <p className="font-bold text-slate-900">Diagnóstico</p>
              <p>{diagnostic?.description}</p>
              <p className="text-xs text-slate-500">
                Horas estimadas: {diagnostic?.estimatedHours}h · Tareas: {diagnostic?.suggestedTasks.join(', ')}
              </p>
            </div>
          )}
          <button
            onClick={() => { setShowDiagnostic(false); setDiagnostic(null); }}
            className="mt-2 text-xs text-lime-600 hover:text-lime-700"
          >
            Ocultar diagnóstico
          </button>
        </Card>
      )}

      {/* Items Form Section */}
      {selectedOrder && (
        <Card variant="flat" padding="md">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Ítems del Presupuesto</h2>
          
          {items.length === 0 && (
            <p className="text-sm text-slate-500 mb-3">No hay ítems agregados. Selecciona tipo de ítem arriba.</p>
          )}

          {/* Labor Item Form */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Mano de Obra</h3>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <label>
                <span className="block text-[10px] text-slate-500">Horas</span>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={''}
                  onChange={(e) => handleAddLabor(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-sm focus:outline-none focus:border-lime-500"
                  placeholder="Ej. 2.5"
                />
              </label>
              <label>
                <span className="block text-[10px] text-slate-500">Tarifa hora (BOB)</span>
                <input
                  type="number"
                  min="10"
                  step="5"
                  value={''}
                  onChange={(e) => handleAddLabor(parseFloat(e.target.value) || 0, parseFloat(e.target.value) || 65)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-sm focus:outline-none focus:border-lime-500"
                  placeholder="Ej. 65"
                />
              </label>
            </div>
          </div>

          {/* Parts Item Form */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Repuestos</h3>
            <p className="text-xs text-slate-500 mb-2">Los precios se toman del catálogo del backend, el frontend no envía unitPrice para repuestos.</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <label>
                <span className="block text-[10px] text-slate-500">Código repuesto</span>
                <input
                  type="text"
                  placeholder="Ej. REP-BRA-001"
                  onChange={(e) => { /* Would fetch from catalog */ }}
                  className="w-full rounded-xl border border-slate-300 p-2 text-sm focus:outline-none focus:border-lime-500"
                />
              </label>
              <label>
                <span className="block text-[10px] text-slate-500">Cantidad</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={''}
                  onChange={(e) => handleAddPart('PART-' + Date.now(), 'Repuesto', parseInt(e.target.value) || 1, 0)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-sm focus:outline-none focus:border-lime-500"
                  placeholder="1"
                />
              </label>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="font-bold text-slate-700">Subtotal Mano de Obra</p>
                <p className="font-mono text-lime-700">{formatMoney(calculateTotals().laborTotal)}</p>
              </div>
              <div>
                <p className="font-bold text-slate-700">Subtotal Repuestos</p>
                <p className="font-memo text-lime-700">{formatMoney(calculateTotals().partsTotal)}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
              <span className="font-bold text-lime-700">Total Presupuestado</span>
              <span className="font-mono text-2xl text-lime-700">{formatMoney(calculateTotals().total)}</span>
            </div>
          </div>

          <Button
            type="submit"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full py-3 mt-4 font-bold text-lime-950 bg-lime-400 hover:bg-lime-500"
          >
            {isSubmitting ? 'Generando...' : 'Generar Presupuesto (RN-21)'}
          </Button>
        </Card>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="mt-6 p-6 rounded-xl border border-lime-200 bg-lime-50 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-lime-600" />
          <h2 className="text-2xl font-bold text-lime-900 mb-2">Presupuesto Generado</h2>
          <p className="text-lime-700">Se ha creado el presupuesto para la orden {selectedOrder?.code}</p>
          <p className="text-lime-600">Total: {formatMoney(calculateTotals().total)}</p>
          <Button
            variant="outline"
            onClick={() => {
              setShowSuccess(false);
              setSelectedOrder(null);
              setItems([]);
            }}
          >
            Nueva Cotización
          </Button>
        </div>
      )}
    </Card>
  );
}