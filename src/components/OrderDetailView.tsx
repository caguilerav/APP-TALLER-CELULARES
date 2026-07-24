/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Smartphone, 
  Wrench, 
  CheckCircle, 
  Calendar, 
  User, 
  DollarSign, 
  History, 
  Printer, 
  Plus, 
  Edit2, 
  Save, 
  X,
  AlertCircle,
  FileText,
  Clock,
  Briefcase,
  Check,
  ClipboardList,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { mockDb } from '../db/mockDb';
import { Order, OrderStatus, Payment, TimelineEvent, User as SystemUser, UsedSparePart, Product } from '../types';
import PatternLockDrawer from './PatternLockDrawer';

interface OrderDetailViewProps {
  orderId: string;
  currentUser: SystemUser;
  onBack: () => void;
  onOrderUpdated: () => void;
}

export default function OrderDetailView({ orderId, currentUser, onBack, onOrderUpdated }: OrderDetailViewProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  
  // Interaction states
  const [isEditing, setIsEditing] = useState(false);
  const [statusInput, setStatusInput] = useState<OrderStatus>('RECIBIDO');
  const [assignedTechInput, setAssignedTechInput] = useState('');
  
  // Payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Editing form states
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editImei, setEditImei] = useState('');
  const [editLockType, setEditLockType] = useState('Sin bloqueo');
  const [editLockValue, setEditLockValue] = useState('');
  const [editProblem, setEditProblem] = useState('');
  const [editQuickDiagnosis, setEditQuickDiagnosis] = useState('');
  const [editEstimatedCost, setEditEstimatedCost] = useState('');
  const [editObservaciones, setEditObservaciones] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editSpareParts, setEditSpareParts] = useState<UsedSparePart[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartType, setNewPartType] = useState<'INVENTORY' | 'EXTERNAL'>('INVENTORY');
  const [newPartCost, setNewPartCost] = useState('');
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const handleAddEditSparePart = () => {
    if (newPartType === 'INVENTORY') {
      if (!selectedProductId) return;
      const product = availableProducts.find(p => p.id === selectedProductId);
      if (!product) return;
      if (product.stock <= 0) {
        alert('Este producto no cuenta con stock disponible en este momento.');
        return;
      }
      if (editSpareParts.some(p => p.type === 'INVENTORY' && p.productId === selectedProductId)) {
        alert('Este repuesto del inventario ya está agregado en la lista actual.');
        return;
      }
      setEditSpareParts([
        ...editSpareParts,
        {
          type: 'INVENTORY',
          name: `${product.name} (${product.compatibleModel || 'Universal'})`,
          productId: product.id,
          quantity: 1
        }
      ]);
      setSelectedProductId('');
    } else {
      if (!newPartName.trim()) return;
      const costVal = parseFloat(newPartCost) || 0;
      setEditSpareParts([
        ...editSpareParts,
        {
          type: 'EXTERNAL',
          name: newPartName.trim(),
          cost: costVal
        }
      ]);
      setNewPartName('');
      setNewPartCost('');
    }
  };

  const handleRemoveEditSparePart = (index: number) => {
    setEditSpareParts(editSpareParts.filter((_, i) => i !== index));
  };

  // Modal for full size image preview
  const [selectedFullsizeImage, setSelectedFullsizeImage] = useState<string | null>(null);

  // Printable ticket state
  const [showPrintView, setShowPrintView] = useState(false);

  const [technicians, setTechnicians] = useState<SystemUser[]>([]);
  const [error, setError] = useState('');

  const STATUS_FLOW: OrderStatus[] = [
    'RECIBIDO',
    'DIAGNOSTICO',
    'ESPERANDO_REPUESTO',
    'REPARANDO',
    'LISTO',
    'ENTREGADO'
  ];

  const PAYMENT_METHODS = ['Efectivo', 'Tarjeta', 'Transferencia', 'Pago Móvil'];

  useEffect(() => {
    loadOrderDetails();
    const users = mockDb.getUsers();
    setTechnicians(users.filter(u => u.role === 'TECHNICIAN' || u.role === 'ADMIN'));
    
    // Load active products for spare parts linking
    const products = mockDb.getProducts();
    setAvailableProducts(products.filter(p => p.status === 'Activo'));
  }, [orderId]);

  const loadOrderDetails = () => {
    const orders = mockDb.getOrders();
    const found = orders.find(o => o.id === orderId);
    if (found) {
      setOrder(found);
      setStatusInput(found.status);
      setAssignedTechInput(found.assignedTechnicianId || '');
      
      // Initialize edit fields
      setEditBrand(found.brand);
      setEditModel(found.model);
      setEditColor(found.color);
      setEditImei(found.imei || '');
      setEditLockType(found.lockType || 'Sin bloqueo');
      setEditLockValue(found.lockValue || '');
      setEditProblem(found.problem);
      setEditQuickDiagnosis(found.quickDiagnosis || '');
      setEditEstimatedCost(String(found.estimatedCost));
      setEditObservaciones(found.observaciones || '');
      setEditImages(found.images || []);
      setEditSpareParts(found.spareParts || []);

      // Load payments
      const allPayments = mockDb.getPayments().filter(p => p.orderId === orderId);
      setPayments(allPayments);

      // Load timeline
      const allEvents = mockDb.getEvents()
        .filter(e => e.orderId === orderId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTimeline(allEvents);
    }
  };

  const handleUpdateStatus = (newStatus: OrderStatus) => {
    if (!order) return;
    setStatusInput(newStatus);
    
    const updated = mockDb.updateOrder(order.id, { status: newStatus }, currentUser.name);
    if (updated) {
      loadOrderDetails();
      onOrderUpdated();
    }
  };

  const handleAssignTechnician = (techId: string) => {
    if (!order) return;
    setAssignedTechInput(techId);
    const tech = technicians.find(t => t.id === techId);
    
    const updated = mockDb.updateOrder(order.id, {
      assignedTechnicianId: techId || undefined,
      assignedTechnicianName: tech ? tech.name : undefined
    }, currentUser.name);
    
    if (updated) {
      loadOrderDetails();
      onOrderUpdated();
    }
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!order) return;

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Por favor ingrese un monto de pago válido.');
      return;
    }

    const remaining = order.estimatedCost - order.advancePayment;
    if (amountNum > remaining + 0.01) { // small tolerance for floating point decimals
      setError(`El monto ingresado (Bs. ${amountNum}) supera el saldo pendiente (Bs. ${remaining}).`);
      return;
    }

    // Add payment
    mockDb.addPayment(order.id, amountNum, paymentMethod, paymentNotes || undefined);
    
    // Log timeline event for payment
    mockDb.addEvent(
      order.id,
      order.status,
      `Cobro registrado: Bs. ${amountNum} pagado vía ${paymentMethod}. Notas: ${paymentNotes || 'Abono general.'}`,
      currentUser.name
    );

    // Reset payment states
    setPaymentAmount('');
    setPaymentNotes('');
    setPaymentMethod('Efectivo');
    setShowPaymentModal(false);
    
    loadOrderDetails();
    onOrderUpdated();
  };

  const handleSaveChanges = () => {
    if (!order) return;
    setError('');

    const costNum = parseFloat(editEstimatedCost);
    if (isNaN(costNum) || costNum < 0) {
      setError('El costo estimado debe ser un número válido.');
      return;
    }

    if (costNum < order.advancePayment) {
      setError('El nuevo costo estimado no puede ser menor a los pagos ya registrados.');
      return;
    }

    // Calculate difference in used spare parts of type INVENTORY
    const oldParts = order.spareParts || [];
    const newParts = editSpareParts;

    const oldInventoryParts = oldParts.filter(p => p.type === 'INVENTORY' && p.productId);
    const newInventoryParts = newParts.filter(p => p.type === 'INVENTORY' && p.productId);

    const oldProductIds = oldInventoryParts.map(p => p.productId!);
    const newProductIds = newInventoryParts.map(p => p.productId!);

    // Process additions: discount stock
    newInventoryParts.forEach(part => {
      const isNew = !oldProductIds.includes(part.productId!);
      if (isNew) {
        mockDb.addMovement({
          productId: part.productId!,
          productName: part.name,
          type: 'SALIDA_REPARACION',
          quantity: part.quantity || 1,
          reason: `Repuesto asignado en la reparación de la Orden ${order.otNumber}`,
          observation: `Descontado automáticamente al guardar cambios en reparación.`,
          orderId: order.id
        }, currentUser.name);
      }
    });

    // Process removals: restore stock
    oldInventoryParts.forEach(part => {
      const isRemoved = !newProductIds.includes(part.productId!);
      if (isRemoved) {
        mockDb.addMovement({
          productId: part.productId!,
          productName: part.name,
          type: 'DEVOLUCION',
          quantity: part.quantity || 1,
          reason: `Repuesto removido de la reparación de la Orden ${order.otNumber}`,
          observation: `Reingresado automáticamente al inventario.`,
          orderId: order.id
        }, currentUser.name);
      }
    });

    const updated = mockDb.updateOrder(order.id, {
      brand: editBrand,
      model: editModel,
      color: editColor,
      imei: editImei || undefined,
      lockType: editLockType,
      lockValue: editLockType !== 'Sin bloqueo' ? editLockValue : undefined,
      problem: editProblem,
      quickDiagnosis: editQuickDiagnosis || undefined,
      estimatedCost: costNum,
      observaciones: editObservaciones || undefined,
      images: editImages.length > 0 ? editImages : undefined,
      spareParts: editSpareParts.length > 0 ? editSpareParts : undefined,
    }, currentUser.name);

    if (updated) {
      setIsEditing(false);
      loadOrderDetails();
      onOrderUpdated();
    }
  };

  const getStatusBadgeStyles = (status: OrderStatus) => {
    switch (status) {
      case 'RECIBIDO': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'DIAGNOSTICO': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'ESPERANDO_REPUESTO': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'REPARANDO': return 'bg-[#FACC15]/15 text-yellow-800 border-[#FACC15]/30';
      case 'LISTO': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'ENTREGADO': return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'RECIBIDO': return 'Recibido';
      case 'DIAGNOSTICO': return 'Diagnóstico';
      case 'ESPERANDO_REPUESTO': return 'Esperando repuesto';
      case 'REPARANDO': return 'Reparando';
      case 'LISTO': return 'Listo';
      case 'ENTREGADO': return 'Entregado';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!order) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-gray-100">
        <p className="text-gray-500 font-medium">Buscando detalles de orden...</p>
      </div>
    );
  }

  const remainingBalance = order.estimatedCost - order.advancePayment;

  // Render Printable Invoice Overlay
  if (showPrintView) {
    return (
      <div id="print-overlay" className="bg-white min-h-screen p-6 max-w-xl mx-auto space-y-6 text-[#111111] animate-fade-in font-sans print:p-0">
        
        {/* Buttons to print or close */}
        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-200 print:hidden">
          <button
            id="print-back-btn"
            onClick={() => setShowPrintView(false)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:text-black cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          
          <button
            id="print-action-btn"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-900 cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Recibo</span>
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div className="border border-dashed border-gray-300 p-6 space-y-6 rounded-2xl print:border-none print:p-0">
          {/* Header */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black tracking-tight uppercase">TALLER DE CELULARES PRO</h2>
            <p className="text-xs text-gray-500">Av. Principal de Reparaciones #123</p>
            <p className="text-[11px] text-gray-500">Tel: 555-9000 | Email: contacto@taller.com</p>
            <p className="text-xs font-bold pt-2">COMPROBANTE DE SERVICIO</p>
          </div>

          <div className="border-t border-b border-dashed border-gray-300 py-3 space-y-1.5 text-xs">
            <div className="flex justify-between font-mono font-bold text-sm">
              <span>ORDEN: {order.otNumber}</span>
              <span>FECHA: {new Date(order.createdAt).toLocaleDateString('es-ES')}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Cliente:</span>
              <span className="font-semibold text-gray-900">{order.clientName}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Teléfono:</span>
              <span className="font-semibold text-gray-900">{order.clientPhone}</span>
            </div>
            {order.referencePhone && (
              <div className="flex justify-between text-gray-600">
                <span>Teléf. Referencia:</span>
                <span className="font-semibold text-gray-900">
                  {order.referencePhone} {order.referenceRelationship ? `(${order.referenceRelationship})` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Device details */}
          <div className="space-y-2 text-xs">
            <h3 className="font-bold border-b border-gray-100 pb-1">DATOS DEL EQUIPO</h3>
            <div className="grid grid-cols-2 gap-y-1">
              <span className="text-gray-500">Dispositivo:</span>
              <span className="font-semibold text-right">{order.brand} {order.model}</span>
              
              <span className="text-gray-500">Color:</span>
              <span className="font-semibold text-right">{order.color}</span>
              
              {order.imei && (
                <>
                  <span className="text-gray-500">IMEI:</span>
                  <span className="font-mono text-right">{order.imei}</span>
                </>
              )}

              <span className="text-gray-500">Bloqueo:</span>
              <span className="font-semibold text-right">
                {order.lockType || 'Sin bloqueo'}
                {order.lockType && order.lockType !== 'Sin bloqueo' && order.lockValue && (
                  <span className="text-[10px] text-gray-500 block font-normal leading-tight">
                    {order.lockType === 'Patrón' 
                      ? order.lockValue.split('-').join(' → ') 
                      : order.lockValue
                    }
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Fault details */}
          <div className="space-y-2 text-xs">
            <h3 className="font-bold border-b border-gray-100 pb-1">FALLA REPORTADA</h3>
            <p className="bg-gray-50 p-2.5 rounded-lg italic text-gray-700">{order.problem}</p>
          </div>

          {order.quickDiagnosis && (
            <div className="space-y-2 text-xs">
              <h3 className="font-bold border-b border-gray-100 pb-1">DIAGNÓSTICO RÁPIDO</h3>
              <p className="bg-gray-50 p-2.5 rounded-lg font-medium text-gray-700">{order.quickDiagnosis}</p>
            </div>
          )}

          {/* Accessories and states */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <h4 className="font-bold text-gray-600">Accesorios:</h4>
              <p className="text-gray-800">{order.accessories.join(', ') || 'Ninguno'}</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-600">Detalles estéticos:</h4>
              <p className="text-gray-800">{order.physicalState.join(', ') || 'Normal'}</p>
            </div>
          </div>

          {/* Used spare parts on ticket */}
          {order.spareParts && order.spareParts.length > 0 && (
            <div className="space-y-2 text-xs pt-1">
              <h3 className="font-bold border-b border-gray-100 pb-1 uppercase tracking-wide">Repuestos Asociados / A Usar</h3>
              <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-200/60 space-y-1.5">
                {order.spareParts.map((part, pidx) => (
                  <div key={pidx} className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-gray-800">{part.name}</span>
                    <span className="text-[10px] text-gray-500 italic">
                      {part.type === 'INVENTORY' ? 'De Inventario' : `Adquisición Externa (Bs. ${part.cost})`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos list in ticket if any */}
          {order.images && order.images.length > 0 && (
            <div className="space-y-1.5 text-xs pt-1.5 border-t border-gray-100">
              <h4 className="font-bold text-gray-600 uppercase tracking-wide">FOTOS DE RECEPCIÓN:</h4>
              <div className="grid grid-cols-4 gap-2">
                {order.images.map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                    <img 
                      src={img} 
                      alt={`Foto ${idx+1}`} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial calculations */}
          <div className="border-t border-dashed border-gray-300 pt-4 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span>Costo Estimado de Servicio:</span>
              <span className="font-semibold">Bs. {order.estimatedCost.toLocaleString('es-ES')}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Total Abonado / Adelanto:</span>
              <span className="font-bold">-Bs. {order.advancePayment.toLocaleString('es-ES')}</span>
            </div>
            <div className="flex justify-between text-sm font-black border-t border-gray-100 pt-2">
              <span>SALDO RESTANTE A PAGAR:</span>
              <span className="font-mono">Bs. {remainingBalance.toLocaleString('es-ES')}</span>
            </div>
          </div>

          {/* Legal / Policy terms */}
          <div className="text-[9px] text-gray-500 leading-normal space-y-1 pt-4 border-t border-dashed border-gray-200">
            <p className="font-semibold text-center text-gray-700">TÉRMINOS Y CONDICIONES</p>
            <p>1. Todo equipo no retirado pasados los 30 días del aviso de reparación generará costo de almacenamiento diario.</p>
            <p>2. No nos hacemos responsables por pérdida de información. El cliente debe realizar un respaldo previo.</p>
            <p>3. Los trabajos cuentan con 3 meses de garantía en mano de obra. La garantía no cubre humedad ni golpes posteriores.</p>
          </div>

          {/* Signature margins */}
          <div className="grid grid-cols-2 gap-8 pt-10 text-center text-[10px] text-gray-400">
            <div className="border-t border-gray-300 pt-1">Firma del Cliente</div>
            <div className="border-t border-gray-300 pt-1">Firma de Recepción</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="order-detail-view" className="space-y-6 pb-12 animate-fade-in">
      
      {/* Top action header */}
      <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
        <button
          id="detail-back-btn"
          onClick={onBack}
          className="flex items-center space-x-1.5 py-2 px-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        <div className="flex items-center space-x-2">
          {currentUser.role === 'ADMIN' && (
            <button
              id="detail-edit-toggle-btn"
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isEditing 
                  ? 'bg-black text-yellow-400 border-black' 
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
              }`}
              title="Editar orden"
            >
              {isEditing ? <X className="w-4.5 h-4.5" /> : <Edit2 className="w-4.5 h-4.5" />}
            </button>
          )}

          <button
            id="detail-print-btn"
            onClick={() => setShowPrintView(true)}
            className="flex items-center space-x-1.5 py-2 px-3.5 bg-[#111111] hover:bg-black text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-2xl text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STACKED SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: ORDER CODE, STATUS BAR */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">Código de Servicio</span>
              <h2 className="text-2xl font-black text-[#111111] font-mono leading-none mt-1">{order.otNumber}</h2>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeStyles(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
          </div>

          {/* Quick status progress selector */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">Actualizar Estado:</span>
            <div className="grid grid-cols-2 gap-1.5">
              {STATUS_FLOW.map((st) => (
                <button
                  id={`status-flow-btn-${st.toLowerCase().replace(/_/g, '-')}`}
                  key={st}
                  onClick={() => handleUpdateStatus(st)}
                  className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all text-center border cursor-pointer ${
                    order.status === st
                      ? 'bg-black text-[#FACC15] border-black shadow-sm'
                      : 'bg-gray-50 text-gray-600 border-gray-150 hover:bg-gray-100'
                  }`}
                >
                  {getStatusLabel(st)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 2: DEVICE DETAILS */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
            <Smartphone className="w-4.5 h-4.5 text-[#111111]" />
            <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Equipo & Diagnóstico</h3>
          </div>

          {!isEditing ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-black text-gray-900">{order.brand} {order.model}</p>
                <p className="text-xs text-gray-500">Color: <span className="font-medium text-gray-800">{order.color}</span></p>
                <div className="flex flex-wrap gap-x-4 mt-0.5">
                  {order.imei && <p className="text-xs text-gray-500">IMEI: <span className="font-mono font-medium text-gray-800">{order.imei}</span></p>}
                  <p className="text-xs text-gray-500">
                    Bloqueo:{' '}
                    <span className="font-medium text-gray-800">
                      {order.lockType || 'Sin bloqueo'}
                      {order.lockType && order.lockType !== 'Sin bloqueo' && order.lockValue && (
                        <span className="ml-1 text-gray-500 font-normal">
                          ({order.lockType === 'Patrón' ? order.lockValue.split('-').join(' → ') : order.lockValue})
                        </span>
                      )}
                    </span>
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Falla:</span>
                <p className="text-xs text-gray-700 leading-relaxed">{order.problem}</p>
              </div>

              {order.quickDiagnosis && (
                <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Diagnóstico Rápido:</span>
                  <p className="text-xs text-gray-700 leading-relaxed font-medium">{order.quickDiagnosis}</p>
                </div>
              )}

              {/* Used Spare Parts */}
              {order.spareParts && order.spareParts.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-150 shadow-2xs">
                  <div className="flex items-center space-x-1.5 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                    <Wrench className="w-3.5 h-3.5 text-gray-400" />
                    <span>Repuestos a Usar ({order.spareParts.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {order.spareParts.map((part, pidx) => (
                      <div key={pidx} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-800">{part.name}</span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                          part.type === 'INVENTORY'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {part.type === 'INVENTORY' ? 'Inventario' : `Externo (Bs. ${part.cost})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase font-bold">Accesorios</span>
                  <span className="font-medium text-gray-800">{order.accessories.join(', ') || 'Ninguno'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase font-bold">Estado físico</span>
                  <span className="font-medium text-gray-800">{order.physicalState.join(', ') || 'Normal'}</span>
                </div>
              </div>

              {/* Device Photos Showcase */}
              {order.images && order.images.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-gray-100">
                  <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-wide">Fotos de Recepción ({order.images.length}/4)</span>
                  <div className="grid grid-cols-4 gap-2">
                    {order.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedFullsizeImage(img)}
                        className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 hover:opacity-85 transition-opacity cursor-pointer group"
                        title="Haga clic para ver en tamaño completo"
                      >
                        <img
                          src={img}
                          alt={`Foto de recepción ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/60 rounded text-[8px] font-bold text-white font-mono">
                          #{idx + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // INLINE EDITOR
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="font-bold text-gray-500">Marca</span>
                  <input
                    id="edit-brand-input"
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-gray-500">Modelo</span>
                  <input
                    id="edit-model-input"
                    type="text"
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="font-bold text-gray-500">Color</span>
                  <input
                    id="edit-color-input"
                    type="text"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-gray-500">IMEI</span>
                  <input
                    id="edit-imei-input"
                    type="text"
                    value={editImei}
                    onChange={(e) => setEditImei(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-gray-500">Tipo de Bloqueo</span>
                <select
                  id="edit-lock-type-select"
                  value={editLockType}
                  onChange={(e) => {
                    setEditLockType(e.target.value);
                    setEditLockValue('');
                  }}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none font-medium text-gray-800"
                >
                  <option value="Sin bloqueo">Sin bloqueo</option>
                  <option value="Patrón">Patrón</option>
                  <option value="Contraseña">Contraseña</option>
                  <option value="PIN">PIN</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Conditional edit lock values */}
              {editLockType !== 'Sin bloqueo' && (
                <div className="p-3 bg-gray-50 border border-gray-200/60 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-gray-600 block">
                    {editLockType === 'Patrón' ? 'Dibujar Patrón de Desbloqueo *' : `Escribir ${editLockType} *`}
                  </span>
                  
                  {editLockType === 'Patrón' && (
                    <div className="py-1">
                      <PatternLockDrawer value={editLockValue} onChange={setEditLockValue} />
                    </div>
                  )}

                  {editLockType === 'Contraseña' && (
                    <input
                      type="text"
                      required
                      placeholder="Contraseña del dispositivo..."
                      value={editLockValue}
                      onChange={(e) => setEditLockValue(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:outline-none text-sm font-semibold"
                    />
                  )}

                  {editLockType === 'PIN' && (
                    <input
                      type="text"
                      required
                      pattern="[0-9]*"
                      inputMode="numeric"
                      placeholder="PIN numérico..."
                      value={editLockValue}
                      onChange={(e) => setEditLockValue(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:outline-none text-sm font-mono font-bold text-center tracking-widest"
                    />
                  )}

                  {editLockType === 'Otro' && (
                    <input
                      type="text"
                      required
                      placeholder="Especifique el método..."
                      value={editLockValue}
                      onChange={(e) => setEditLockValue(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:outline-none text-sm font-medium"
                    />
                  )}
                </div>
              )}

              <div className="space-y-1">
                <span className="font-bold text-gray-500">Falla Reportada</span>
                <textarea
                  id="edit-problem-textarea"
                  rows={2}
                  value={editProblem}
                  onChange={(e) => setEditProblem(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="font-bold text-gray-500">Diagnóstico Rápido</span>
                <textarea
                  id="edit-quick-diagnosis-textarea"
                  rows={2}
                  value={editQuickDiagnosis}
                  onChange={(e) => setEditQuickDiagnosis(e.target.value)}
                  placeholder="Diagnóstico preliminar rápido..."
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              {/* Editing Photos Section */}
              <div className="space-y-1.5 pt-1">
                <span className="font-bold text-gray-500 block">Fotos del Dispositivo ({editImages.length}/4)</span>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, idx) => {
                    const img = editImages[idx];
                    return (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden"
                      >
                        {img ? (
                          <>
                            <img
                              src={img}
                              alt={`Foto ${idx + 1}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => setEditImages(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white rounded-full p-1 transition-colors"
                              title="Quitar foto"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <span className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/60 rounded text-[7px] font-bold text-white font-mono">
                              #{idx + 1}
                            </span>
                          </>
                        ) : (
                          <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                            <Camera className="w-4 h-4" />
                            <span className="text-[8px] font-bold uppercase mt-0.5">Subir</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    if (typeof reader.result === 'string') {
                                      setEditImages(prev => [...prev, reader.result as string]);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* EDIT MODE: SPARE PARTS */}
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <span className="font-bold text-gray-500 text-xs">Repuestos a Usar</span>
                
                <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-150 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {newPartType === 'INVENTORY' ? (
                      <select
                        id="edit-spare-part-inventory-select"
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
                      >
                        <option value="">-- Seleccionar Repuesto del Inventario --</option>
                        {availableProducts.map(p => (
                          <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                            [{p.category}] {p.name} {p.compatibleModel ? `(${p.compatibleModel})` : ''} - Stock: {p.stock} {p.stock <= 0 ? '(Agotado)' : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="edit-spare-part-name"
                        type="text"
                        placeholder="Nombre del repuesto..."
                        value={newPartName}
                        onChange={(e) => setNewPartName(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                      />
                    )}
                    
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setNewPartType('INVENTORY')}
                        className={`py-2 px-2 rounded-xl border text-[10px] font-bold text-center transition-all cursor-pointer ${
                          newPartType === 'INVENTORY'
                            ? 'bg-black text-[#FACC15] border-black'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        Inventario
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPartType('EXTERNAL')}
                        className={`py-2 px-2 rounded-xl border text-[10px] font-bold text-center transition-all cursor-pointer ${
                          newPartType === 'EXTERNAL'
                            ? 'bg-black text-[#FACC15] border-black'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        Externo
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {newPartType === 'EXTERNAL' && (
                      <div className="relative w-1/2 animate-fade-in">
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-xs">Bs.</span>
                        <input
                          id="edit-spare-part-cost"
                          type="number"
                          placeholder="Costo"
                          value={newPartCost}
                          onChange={(e) => setNewPartCost(e.target.value)}
                          className="w-full pl-10 pr-2 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-amber-800"
                        />
                      </div>
                    )}
                    <button
                      id="edit-add-spare-part-btn"
                      type="button"
                      onClick={handleAddEditSparePart}
                      disabled={newPartType === 'INVENTORY' ? !selectedProductId : (!newPartName.trim() || !newPartCost)}
                      className="px-4 py-2 bg-black text-[#FACC15] hover:bg-gray-900 rounded-xl font-bold text-xs disabled:bg-gray-200 disabled:text-gray-400 cursor-pointer"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>

                {/* List of current spare parts in edit mode */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {editSpareParts.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic">No hay repuestos registrados para esta orden.</p>
                  ) : (
                    editSpareParts.map((part, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-150 text-xs">
                        <span className="font-bold text-gray-800">{part.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                            part.type === 'INVENTORY'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {part.type === 'INVENTORY' ? 'Inventario' : `Externo (Bs. ${part.cost})`}
                          </span>
                          <button
                            id={`edit-remove-part-btn-${index}`}
                            type="button"
                            onClick={() => handleRemoveEditSparePart(index)}
                            className="text-gray-400 hover:text-red-600 font-bold p-1 rounded-full hover:bg-gray-200 cursor-pointer text-xs"
                            title="Remover repuesto"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-gray-500">Observaciones</span>
                <input
                  id="edit-obs-input"
                  type="text"
                  value={editObservaciones}
                  onChange={(e) => setEditObservaciones(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <button
                id="edit-save-btn"
                type="button"
                onClick={handleSaveChanges}
                className="w-full py-2 bg-black text-[#FACC15] rounded-xl font-bold flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          )}
        </div>

        {/* CARD 3: CLIENT & FINANCIAL METRICS */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
              <User className="w-4.5 h-4.5 text-[#111111]" />
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Cliente & Pagos</h3>
            </div>

            <div>
              <p className="text-sm font-extrabold text-gray-900">{order.clientName}</p>
              <p className="text-xs text-gray-500 font-medium">Telf: {order.clientPhone}</p>
              {order.referencePhone && (
                <div className="mt-1 text-xs text-gray-500 font-medium">
                  <span className="text-gray-400">Ref:</span> {order.referencePhone}
                  {order.referenceRelationship && (
                    <span className="text-gray-400 font-normal"> ({order.referenceRelationship})</span>
                  )}
                </div>
              )}
            </div>

            {/* Financial meters */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Costo de Servicio:</span>
                {isEditing ? (
                  <div className="relative w-32">
                    <span className="absolute left-2.5 top-0.5 text-gray-500 font-bold text-xs">Bs.</span>
                    <input
                      id="edit-cost-input"
                      type="number"
                      value={editEstimatedCost}
                      onChange={(e) => setEditEstimatedCost(e.target.value)}
                      className="w-full pl-10 pr-1 py-0.5 bg-gray-50 border border-gray-200 rounded focus:outline-none font-bold font-mono text-xs"
                    />
                  </div>
                ) : (
                  <span className="font-extrabold text-[#111111] font-mono">Bs. {order.estimatedCost.toLocaleString('es-ES')}</span>
                )}
              </div>

              <div className="flex justify-between items-center text-xs text-emerald-700">
                <span className="font-medium">Total Pagado:</span>
                <span className="font-extrabold font-mono">Bs. {order.advancePayment.toLocaleString('es-ES')}</span>
              </div>

              <div className="flex justify-between items-center text-xs font-extrabold border-t border-gray-100 pt-2 text-[#111111]">
                <span>Saldo Pendiente:</span>
                <span className="font-mono text-sm">Bs. {remainingBalance.toLocaleString('es-ES')}</span>
              </div>
            </div>
          </div>

          {remainingBalance > 0 ? (
            <button
              id="detail-add-payment-toggle"
              onClick={() => setShowPaymentModal(true)}
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Pago / Abono</span>
            </button>
          ) : (
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-center border border-emerald-100 text-xs font-extrabold flex items-center justify-center space-x-1.5 mt-4">
              <CheckCircle className="w-4 h-4" />
              <span>Orden Completamente Saldada</span>
            </div>
          )}
        </div>
      </div>

      {/* REPAIR PROGRESS TIMELINE & TECHNICIAN ASSIGNMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ASSIGNMENT & COMMENTARY */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 lg:col-span-1">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
            <Briefcase className="w-4.5 h-4.5 text-[#111111]" />
            <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Asignación de Técnico</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Técnico Asignado:</label>
              <select
                id="tech-assign-dropdown"
                value={assignedTechInput}
                onChange={(e) => handleAssignTechnician(e.target.value)}
                className="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent cursor-pointer"
              >
                <option value="">No Asignado</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100 text-[11px] text-yellow-800 leading-relaxed">
              <p className="font-bold">Observación de Recepción:</p>
              <p className="italic mt-0.5">{order.observaciones || 'No se registraron observaciones adicionales para esta orden.'}</p>
            </div>
          </div>
        </div>

        {/* TIMELINE HISTORIAL */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
            <History className="w-4.5 h-4.5 text-[#111111]" />
            <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Historial y Línea de Tiempo</h3>
          </div>

          {/* Interactive Chronological Vertical Timeline */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-150">
            {timeline.length === 0 ? (
              <p className="text-xs text-gray-400 font-medium pl-2">No se registran eventos en el historial.</p>
            ) : (
              timeline.map((event) => (
                <div key={event.id} className="relative text-xs">
                  {/* Circle marker on line */}
                  <span className={`absolute -left-[20px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center ${
                    event.status === 'RECIBIDO' ? 'border-blue-500' :
                    event.status === 'DIAGNOSTICO' ? 'border-purple-500' :
                    event.status === 'ESPERANDO_REPUESTO' ? 'border-amber-500' :
                    event.status === 'REPARANDO' ? 'border-yellow-400' :
                    event.status === 'LISTO' ? 'border-emerald-500' : 'border-gray-400'
                  }`} />
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-y-0.5">
                    <span className="font-extrabold text-gray-900 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-150">
                      {getStatusLabel(event.status)}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(event.createdAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-gray-600 mt-1 pl-1 leading-relaxed">{event.description}</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5 pl-1 flex items-center">
                    <User className="w-3 h-3 mr-0.5" />
                    Registrado por: {event.createdBy}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* REGISTRAR PAGO MODAL/BOX */}
      {showPaymentModal && (
        <div id="payment-modal" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 animate-fade-in space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-[#111111]">Registrar Cobro</h3>
              </div>
              <button
                id="close-payment-modal"
                onClick={() => setShowPaymentModal(false)}
                className="p-1 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Monto del Pago (Bs.) *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <span className="text-gray-500 font-bold text-xs">Bs.</span>
                  </span>
                  <input
                    id="payment-amount-input"
                    type="number"
                    min="0.1"
                    step="0.01"
                    required
                    placeholder={String(remainingBalance)}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="block w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-medium">Saldo pendiente: Bs. {remainingBalance.toLocaleString('es-ES')}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Método de Pago *</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(method => (
                    <button
                      id={`pay-method-btn-${method.toLowerCase().replace(/\s+/g, '-')}`}
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-2 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                        paymentMethod === method
                          ? 'bg-black text-[#FACC15] border-black shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Notas Adicionales</label>
                <input
                  id="payment-notes-input"
                  type="text"
                  placeholder="Ej. Abono parcial, transferencia verificada"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <button
                id="submit-payment-btn"
                type="submit"
                className="w-full bg-[#111111] hover:bg-black text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md cursor-pointer"
              >
                Confirmar Cobro
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FULLSIZE IMAGE PREVIEW MODAL */}
      {selectedFullsizeImage && (
        <div 
          id="image-preview-modal" 
          onClick={() => setSelectedFullsizeImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-black flex items-center justify-center">
            <img 
              src={selectedFullsizeImage} 
              alt="Dispositivo en tamaño completo" 
              className="max-w-full max-h-[80vh] object-contain select-none"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
            />
            <button
              id="close-image-modal-btn"
              onClick={() => setSelectedFullsizeImage(null)}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white rounded-full p-2 border border-white/20 transition-all cursor-pointer"
              title="Cerrar vista"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
