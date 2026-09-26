/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import BolFixLogo from './BolFixLogo';
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
  Image as ImageIcon, 
  Boxes,
  Send,
  Download,
  Receipt,
  FileCheck,
  MessageCircle,
  Share2,
  Sparkles,
  Sliders,
  ShieldCheck,
  Building2,
  Phone,
  MapPin,
  ShoppingBag
} from 'lucide-react';
import { mockDb } from '../db/mockDb';
import { Order, OrderStatus, Payment, TimelineEvent, User as SystemUser, UsedSparePart, Product, WorkshopSettings } from '../types';
import PatternLockDrawer from './PatternLockDrawer';
import { SparePartsInventoryModal } from './SparePartsInventoryModal';
import { generateReceiptPdf } from '../utils/receiptPdfGenerator';
import { QRCodeSVG } from 'qrcode.react';

interface OrderDetailViewProps {
  orderId: string;
  currentUser: SystemUser;
  onBack: () => void;
  onOrderUpdated: () => void;
  initialPrintView?: boolean;
  onNavigateToPosWithOrder?: (order: Order, paymentInfo?: { amount: number; paymentMethod: string; notes?: string }) => void;
}

export default function OrderDetailView({ 
  orderId, 
  currentUser, 
  onBack, 
  onOrderUpdated, 
  initialPrintView = false,
  onNavigateToPosWithOrder 
}: OrderDetailViewProps) {
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
  const [editIsLaborOnly, setEditIsLaborOnly] = useState(false);
  const [editSpareParts, setEditSpareParts] = useState<UsedSparePart[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartType, setNewPartType] = useState<'INVENTORY' | 'EXTERNAL'>('INVENTORY');
  const [newPartCost, setNewPartCost] = useState('');
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isSparePartsInventoryModalOpen, setIsSparePartsInventoryModalOpen] = useState(false);

  const handleSelectProductFromInventoryModal = (product: Product) => {
    if (product.stock <= 0) {
      alert('Este repuesto no cuenta con stock disponible en este momento.');
      return;
    }
    if (editSpareParts.some(p => p.type === 'INVENTORY' && p.productId === product.id)) {
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
    setSelectedProductId(product.id);
    setIsSparePartsInventoryModalOpen(false);
  };

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
  const [showPrintView, setShowPrintView] = useState(initialPrintView);
  const [printFormat, setPrintFormat] = useState<'letter' | 'thermal' | 'ticket'>('letter');
  const [activePaymentForReceipt, setActivePaymentForReceipt] = useState<Payment | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [workshopSettings, setWorkshopSettings] = useState<WorkshopSettings>(() => mockDb.getSettings());

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

  const PAYMENT_METHODS = useMemo(() => {
    return workshopSettings.enabledPaymentMethods && workshopSettings.enabledPaymentMethods.length > 0
      ? workshopSettings.enabledPaymentMethods
      : ['Efectivo', 'Tarjeta', 'Transferencia', 'Pago Móvil'];
  }, [workshopSettings.enabledPaymentMethods]);

  useEffect(() => {
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      setPaymentMethod(PAYMENT_METHODS[0] || 'Efectivo');
    }
  }, [PAYMENT_METHODS]);

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setWorkshopSettings(mockDb.getSettings());
    };
    window.addEventListener('workshop_settings_saved', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);
    return () => {
      window.removeEventListener('workshop_settings_saved', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, []);

  useEffect(() => {
    loadOrderDetails();
    const users = mockDb.getUsers();
    setTechnicians(users.filter(u => u.role === 'TECHNICIAN' || u.role === 'ADMIN'));
    
    // Load active products for spare parts linking
    const products = mockDb.getProducts();
    setAvailableProducts(products.filter(p => p.status === 'Activo'));
  }, [orderId]);

  // Prevent background scrolling while payment modal is open so it stays locked in center
  useEffect(() => {
    if (showPaymentModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const mainEl = document.querySelector('main');
      const originalMainOverflow = mainEl ? mainEl.style.overflow : '';
      if (mainEl) {
        mainEl.style.overflow = 'hidden';
      }
      return () => {
        document.body.style.overflow = originalOverflow;
        if (mainEl) {
          mainEl.style.overflow = originalMainOverflow;
        }
      };
    }
  }, [showPaymentModal]);

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
      setEditEstimatedCost(String(found.laborCost !== undefined ? found.laborCost : found.estimatedCost));
      setEditObservaciones(found.observaciones || '');
      setEditImages(found.images || []);
      setEditIsLaborOnly(found.isLaborOnly || false);
      setEditSpareParts(found.spareParts || []);

      // Load payments
      const allPayments = mockDb.getPayments().filter(p => p.orderId === orderId);
      setPayments(allPayments);

      // Load timeline
      const allEvents = mockDb.getEvents()
        .filter(e => e.orderId === orderId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTimeline(allEvents);

      // Load latest workshop settings
      setWorkshopSettings(mockDb.getSettings());
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
    const newPayment = mockDb.addPayment(order.id, amountNum, paymentMethod, paymentNotes || undefined);
    
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

    // Redirigir al carrito como una venta con los detalles de la orden pagada
    if (onNavigateToPosWithOrder) {
      onNavigateToPosWithOrder(order, {
        amount: amountNum,
        paymentMethod: paymentMethod,
        notes: paymentNotes || `Cobro de Orden #${order.otNumber}`
      });
    } else {
      setActivePaymentForReceipt(newPayment);
      setShowPrintView(true);
    }
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

    const partsTotal = !editIsLaborOnly ? editSpareParts.reduce((acc, part) => {
      if (part.type === 'EXTERNAL') return acc + (part.cost || 0);
      if (part.type === 'INVENTORY') {
        const product = availableProducts.find(p => p.id === part.productId);
        return acc + (product?.salePrice || 0);
      }
      return acc;
    }, 0) : 0;

    const totalCost = costNum + partsTotal;

    // Calculate difference in used spare parts of type INVENTORY
    const oldParts = order.spareParts || [];
    const newParts = editIsLaborOnly ? [] : editSpareParts;

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
      estimatedCost: totalCost,
      laborCost: costNum,
      observaciones: editObservaciones || undefined,
      images: editImages.length > 0 ? editImages : undefined,
      isLaborOnly: editIsLaborOnly,
      spareParts: !editIsLaborOnly && editSpareParts.length > 0 ? editSpareParts : undefined,
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

  const formatReceiptDateTime = (dateStr?: string | Date | null): string => {
    if (!dateStr) return 'No registrada';
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return 'No registrada';
    const dateFormatted = d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeFormatted = d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${dateFormatted} - ${timeFormatted} hrs`;
  };

  // Share receipt via WhatsApp
  const handleShareWhatsApp = () => {
    if (!order) return;
    const cleanPhone = order.clientPhone.replace(/\D/g, '');
    const isPaymentReceipt = Boolean(activePaymentForReceipt);
    const shopName = workshopSettings.workshopName || 'BOL.FIX';
    
    let text = `*COMPROBANTE DE ${isPaymentReceipt ? 'COBRO' : 'RECEPCIÓN'} - ${shopName.toUpperCase()}*\n\n`;
    text += `*Orden:* ${order.otNumber}\n`;
    text += `*Cliente:* ${order.clientName}\n`;
    text += `*Dispositivo:* ${order.brand} ${order.model} (${order.color})\n`;
    text += `*Falla:* ${order.problem}\n`;
    text += `*Fecha de Recepción:* ${formatReceiptDateTime(order.createdAt)}\n`;
    text += `*Fecha de Entrega:* ${formatReceiptDateTime(activePaymentForReceipt?.date || activePaymentForReceipt?.createdAt || new Date())}\n\n`;
    
    if (isPaymentReceipt && activePaymentForReceipt) {
      text += `*--- DETALLE DEL COBRO ---*\n`;
      text += `*Monto Pagado:* Bs. ${activePaymentForReceipt.amount.toLocaleString('es-ES')}\n`;
      text += `*Método:* ${activePaymentForReceipt.method}\n`;
      if (activePaymentForReceipt.notes) {
        text += `*Nota:* ${activePaymentForReceipt.notes}\n`;
      }
      text += `*Fecha de Pago:* ${formatReceiptDateTime(activePaymentForReceipt.date || activePaymentForReceipt.createdAt)}\n\n`;
    }
    
    text += `*Costo Total Estimado:* Bs. ${order.estimatedCost.toLocaleString('es-ES')}\n`;
    text += `*Total Pagado a la Fecha:* Bs. ${order.advancePayment.toLocaleString('es-ES')}\n`;
    text += `*Saldo Pendiente:* Bs. ${remainingBalance.toLocaleString('es-ES')}\n`;
    text += `*Estado:* ${getStatusLabel(order.status)}\n\n`;
    text += `${workshopSettings.ticketFooterMessage || '¡Gracias por confiar en nuestro servicio técnico!'}`;

    const encoded = encodeURIComponent(text);
    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}` 
      : `https://api.whatsapp.com/send?text=${encoded}`;
    
    window.open(waUrl, '_blank');
  };

  // Download receipt as official PDF (Letter or Thermal format)
  const handleDownloadPdfReceipt = async () => {
    if (!order) return;
    try {
      setIsDownloadingPdf(true);
      await generateReceiptPdf({
        order,
        activePayment: activePaymentForReceipt,
        printFormat,
        workshopSettings,
        currentUser
      });
    } catch (err) {
      console.error('Error generando PDF de recibo:', err);
    } finally {
      setTimeout(() => {
        setIsDownloadingPdf(false);
      }, 400);
    }
  };

  // Render Printable Invoice Overlay
  if (showPrintView) {
    const isPaymentReceipt = Boolean(activePaymentForReceipt);

    return (
      <div id="print-overlay" className="bg-white min-h-screen p-4 sm:p-6 text-[#111111] animate-fade-in font-sans print:p-0">
        
        {/* PREMIUM ACTION TOOLBAR */}
        <div className="max-w-2xl mx-auto mb-6 bg-gradient-to-b from-[#18181B] to-[#0F0F12] text-white p-4 sm:p-5 rounded-3xl border border-gray-800/80 shadow-2xl space-y-4 print:hidden backdrop-blur-md">
          {/* Top Bar: Back button, Status badge, Format selector */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <button
                id="print-back-btn"
                onClick={() => {
                  setShowPrintView(false);
                  setActivePaymentForReceipt(null);
                }}
                className="group flex items-center space-x-2 px-3.5 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl text-xs font-semibold text-gray-200 hover:text-white cursor-pointer transition-all active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                <span>Volver a la Orden</span>
              </button>

              {isPaymentReceipt ? (
                <div className="flex items-center space-x-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-xl text-xs font-bold tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Recibo de Cobro</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 bg-amber-500/15 border border-amber-500/30 text-[#FACC15] px-3 py-1 rounded-xl text-xs font-bold tracking-wide">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Comprobante de Orden</span>
                </div>
              )}
            </div>

            {/* Format Segmented Controller */}
            <div className="flex items-center space-x-1 bg-black/50 p-1 rounded-2xl border border-white/10 shadow-inner">
              <span className="text-[10px] font-bold text-gray-400 px-2 uppercase tracking-wider hidden sm:inline-block">Formato</span>
              <button
                type="button"
                onClick={() => setPrintFormat('letter')}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  printFormat === 'letter'
                    ? 'bg-[#FACC15] text-black shadow-md shadow-yellow-500/20 scale-[1.02]'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Carta</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('thermal')}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  printFormat === 'thermal'
                    ? 'bg-[#FACC15] text-black shadow-md shadow-yellow-500/20 scale-[1.02]'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Térmica 80mm</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('ticket')}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  printFormat === 'ticket'
                    ? 'bg-[#FACC15] text-black shadow-md shadow-yellow-500/20 scale-[1.02]'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Ticket Celular</span>
              </button>
            </div>
          </div>

          {/* Bottom Action Grid: Primary Print button + Secondary WhatsApp & Download buttons */}
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Primary & Secondary Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
              {/* Imprimir button */}
              <button
                id="print-action-btn"
                onClick={handlePrint}
                className="group relative flex items-center justify-center space-x-2.5 px-5 py-2.5 bg-[#FACC15] hover:bg-yellow-400 active:scale-[0.98] text-black rounded-2xl font-black text-xs shadow-lg shadow-yellow-500/25 transition-all cursor-pointer overflow-hidden"
              >
                <div className="p-1 rounded-lg bg-black/10">
                  <Printer className="w-4 h-4 text-black" />
                </div>
                <div className="text-left">
                  <span className="block leading-tight font-extrabold text-[12px]">
                    {printFormat === 'ticket' ? 'Imprimir Ticket' : 'Imprimir Recibo'}
                  </span>
                  <span className="block text-[9px] font-semibold text-black/70 tracking-wide">
                    {printFormat === 'ticket' ? 'Formato Térmico Pegatina' : (printFormat === 'thermal' ? 'Impresora Térmica' : 'Formato Carta')}
                  </span>
                </div>
              </button>

              {/* WhatsApp button - Only show for Letter or Thermal receipt, not for Ticket Celular */}
              {printFormat !== 'ticket' && (
                <button
                  id="receipt-whatsapp-btn"
                  onClick={handleShareWhatsApp}
                  className="group flex items-center justify-center space-x-2.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.98] text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-950/40 transition-all cursor-pointer border border-emerald-400/20"
                  title="Enviar detalle directamente por WhatsApp al cliente"
                >
                  <div className="p-1 rounded-lg bg-white/15">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="block leading-tight font-extrabold text-[12px]">Enviar WhatsApp</span>
                    <span className="block text-[9px] font-medium text-emerald-100/80 tracking-wide">
                      Notificar al cliente
                    </span>
                  </div>
                </button>
              )}

              {/* Descargar en PDF button (Carta, Térmico o Ticket) */}
              <button
                id="receipt-download-btn"
                onClick={handleDownloadPdfReceipt}
                disabled={isDownloadingPdf}
                className={`group flex items-center justify-center space-x-2.5 px-4 py-2.5 bg-white/10 hover:bg-white/15 active:scale-[0.98] text-gray-100 hover:text-white rounded-2xl font-bold text-xs border border-white/15 transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${printFormat === 'ticket' ? 'sm:col-span-2' : ''}`}
                title={`Descargar ${printFormat === 'ticket' ? 'ticket celular' : 'recibo oficial'} en PDF`}
              >
                <div className="p-1 rounded-lg bg-white/10">
                  {isDownloadingPdf ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-gray-300 group-hover:text-white" />
                  )}
                </div>
                <div className="text-left">
                  <span className="block leading-tight font-extrabold text-[12px]">
                    {isDownloadingPdf ? 'Generando PDF...' : (printFormat === 'ticket' ? 'Descargar Ticket PDF' : 'Descargar en PDF')}
                  </span>
                  <span className="block text-[9px] font-medium text-amber-300/90 tracking-wide">
                    {printFormat === 'ticket' ? 'Formato Mini 50x70mm' : (printFormat === 'thermal' ? 'PDF Térmica 80mm' : 'PDF Tamaño Carta')}
                  </span>
                </div>
              </button>
            </div>

            {/* Order tag and info */}
            <div className="hidden lg:flex flex-col items-end justify-center pl-3 border-l border-white/10 text-right">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">ORDEN</span>
              <span className="font-mono font-black text-sm text-[#FACC15]">{order.otNumber}</span>
              <span className="text-[10px] text-gray-400 truncate max-w-[120px]">{order.clientName}</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RECEIPT CONTAINER (Captured for PDF & Printed)           */}
        {/* ======================================================== */}
        <div className="flex justify-center pb-8">
          {printFormat === 'ticket' ? (
            <div
              id="printable-ticket-card"
              className="bg-white p-4 border border-black rounded-lg text-black font-sans text-xs w-[200px] flex flex-col items-center space-y-1 print:p-0"
            >
              <h2 className="font-bold text-center">Ticket Celular</h2>
              <p className="w-full"><strong>Cliente:</strong> {order.clientName}</p>
              <p className="w-full"><strong>Equipo:</strong> {order.brand} {order.model}</p>
              <p className="w-full"><strong>Clave:</strong> {order.lockValue || 'N/A'}</p>
              <p className="w-full"><strong>Técnico:</strong> {order.assignedTechnicianName || 'Pendiente'}</p>
              <div className="mt-2">
                <QRCodeSVG value={`${window.location.origin}/order/${order.id}`} size={100} />
              </div>
              <p className="text-[8px] mt-1 text-center">Escanea para detalle</p>
            </div>
          ) : printFormat === 'thermal' ? (
              <div
                id="printable-receipt-card"
                className="thermal-receipt-view w-[330px] bg-white p-5 border border-dashed border-black rounded-3xl shadow-xl print:shadow-none print:border-none print:p-0 font-sans text-xs text-black transition-all select-none"
              >
              {/* Header (100% Black) */}
              <div className="text-center pb-3 border-b-2 border-dashed border-black">
                <div className="inline-flex items-center justify-center mb-1.5">
                  <BolFixLogo variant="icon" className="w-10 h-10 rounded-xl" />
                </div>
                <h1 className="text-sm font-black tracking-tight text-black uppercase leading-snug">
                  {workshopSettings.workshopName || 'BOL.FIX'}
                </h1>
                {workshopSettings.workshopSlogan && (
                  <p className="text-[10px] font-bold text-black uppercase tracking-wide">
                    {workshopSettings.workshopSlogan}
                  </p>
                )}
                <div className="text-[9.5px] text-black mt-1 space-y-0.5 font-semibold">
                  {workshopSettings.address && <p>{workshopSettings.address}</p>}
                  {workshopSettings.phone && <p>Tel: {workshopSettings.phone}</p>}
                </div>

                {/* Badge Documento */}
                <div className="mt-2.5 pt-2 border-t border-black flex items-center justify-between">
                  <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider border border-black bg-white text-black">
                    {isPaymentReceipt ? 'RECIBO DE COBRO' : 'COMPROBANTE OT'}
                  </span>
                  <span className="font-mono font-black text-xs text-black">
                    {order.otNumber}
                  </span>
                </div>
              </div>

              {/* Fecha y Asesor */}
              <div className="py-2.5 border-b border-dashed border-black text-[10.5px] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-black font-bold">Fecha de Recepción:</span>
                  <span className="font-extrabold text-black text-right">
                    {formatReceiptDateTime(order.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-black font-bold">Fecha de Entrega:</span>
                  <span className="font-black text-black text-right">
                    {formatReceiptDateTime(activePaymentForReceipt?.date || activePaymentForReceipt?.createdAt || new Date())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black font-bold">Cliente:</span>
                  <span className="font-black text-black truncate max-w-[170px]">{order.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black font-bold">Teléfono:</span>
                  <span className="font-extrabold text-black">{order.clientPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black font-bold">Atendido por:</span>
                  <span className="font-extrabold text-black truncate max-w-[150px]">{currentUser.name}</span>
                </div>
              </div>

              {/* Datos del Equipo */}
              <div className="py-2.5 border-b border-dashed border-black text-[10.5px] space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-black font-bold">Dispositivo:</span>
                  <span className="font-black text-black text-right">{order.brand} {order.model}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-black font-bold">Color:</span>
                  <span className="font-extrabold text-black">{order.color}</span>
                </div>
                {order.imei && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-black font-bold">IMEI:</span>
                    <span className="font-mono font-extrabold text-black">{order.imei}</span>
                  </div>
                )}
                
                {/* Resumen Falla */}
                <div className="mt-1 pt-1 bg-white p-2 rounded-xl border border-black">
                  <span className="text-[9px] font-black text-black uppercase tracking-wider block">Falla / Motivo:</span>
                  <p className="text-[10px] font-bold text-black leading-snug">{order.problem}</p>
                </div>
              </div>

              {/* Cobro Específico Destacado (100% Negro Puro) */}
              {isPaymentReceipt && activePaymentForReceipt && (
                <div className="my-2.5 p-3 rounded-2xl bg-white border-2 border-black text-black space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-black">
                      MONTO COBRADO:
                    </span>
                    <span className="text-base font-black font-mono text-black">
                      Bs. {activePaymentForReceipt.amount.toLocaleString('es-ES')}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-black pt-0.5">
                    <span>Método: <strong className="font-black">{activePaymentForReceipt.method}</strong></span>
                    <span className="font-bold">{formatReceiptDateTime(activePaymentForReceipt.date || activePaymentForReceipt.createdAt)}</span>
                  </div>
                  {activePaymentForReceipt.notes && (
                    <p className="text-[9px] text-black italic bg-white p-1 rounded-md border border-black/30">
                      Ref: {activePaymentForReceipt.notes}
                    </p>
                  )}
                </div>
              )}

              {/* Balance Financiero Resumido y en Negro Puro */}
              <div className="py-2.5 border-b border-dashed border-black text-[11px] space-y-1">
                <div className="flex justify-between text-black">
                  <span className="font-bold">Costo Mano de Obra / Total:</span>
                  <span className="font-mono font-black">Bs. {order.estimatedCost.toLocaleString('es-ES')}</span>
                </div>
                <div className="flex justify-between text-black">
                  <span className="font-bold">Total Abonado:</span>
                  <span className="font-mono font-black">-Bs. {order.advancePayment.toLocaleString('es-ES')}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-black font-black text-xs">
                  <span className="text-black uppercase">Saldo Pendiente:</span>
                  <span className="font-mono text-sm text-black">
                    Bs. {remainingBalance.toLocaleString('es-ES')}
                  </span>
                </div>
              </div>

              {/* Pie de Recibo Térmico (100% Negro Puro) */}
              <div className="pt-3 text-center space-y-1 text-[9.5px] text-black">
                <p className="font-black uppercase">
                  {workshopSettings.ticketFooterMessage || '¡Gracias por su confianza!'}
                </p>
                <p className="font-bold">Garantía de {workshopSettings.defaultWarrantyDays || 30} días en mano de obra.</p>
                <p className="text-[8.5px] font-semibold">Ticket válido para retiro del equipo.</p>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* VIEW 2: FORMATO TAMAÑO CARTA (LETTER) - ULTRA PREMIUM    */
            /* ======================================================== */
            <div
              id="printable-receipt-card"
              className="w-full max-w-[700px] bg-white border border-gray-200 p-8 sm:p-10 rounded-3xl shadow-2xl print:border-none print:shadow-none print:p-0 space-y-6 text-gray-900 transition-all font-sans"
            >
              {/* Header Corporativo Elegante */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-6">
                <div className="space-y-1.5 max-w-[420px]">
                  <div className="flex items-center space-x-3">
                    <BolFixLogo variant="icon" className="w-12 h-12 rounded-xl shadow-md shrink-0" />
                    <div>
                      <h1 className="text-xl font-black tracking-tight text-gray-950 uppercase leading-none">
                        {workshopSettings.workshopName || 'BOL.FIX'}
                      </h1>
                      {workshopSettings.workshopSlogan && (
                        <p className="text-xs font-bold text-[#00A82D] uppercase tracking-wider mt-1">
                          {workshopSettings.workshopSlogan}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-500 space-y-0.5 pt-0.5">
                    {workshopSettings.address && (
                      <p className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{workshopSettings.address}</span>
                      </p>
                    )}
                    {workshopSettings.phone && (
                      <p className="flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>Teléfono: {workshopSettings.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Folio y Documento */}
                <div className="text-right space-y-1.5">
                  <div className={`inline-block font-extrabold text-[11px] px-3 py-1 rounded-xl uppercase tracking-wider ${
                    isPaymentReceipt 
                      ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30' 
                      : 'bg-gray-900 text-[#FACC15]'
                  }`}>
                    {isPaymentReceipt ? 'RECIBO OFICIAL DE COBRO' : 'COMPROBANTE DE SERVICIO'}
                  </div>
                  <div className="pt-0.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">No. ORDEN</span>
                    <span className="font-mono font-black text-xl text-gray-950 tracking-tight">{order.otNumber}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Fecha de Entrega: {formatReceiptDateTime(activePaymentForReceipt?.date || activePaymentForReceipt?.createdAt || new Date())}
                  </p>
                </div>
              </div>

              {/* Banner de Pago Destacado si proviene de un cobro */}
              {isPaymentReceipt && activePaymentForReceipt && (
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-sm">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20">
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                        COBRO CONFIRMADO & REGISTRADO
                      </span>
                      <p className="text-xs font-semibold text-emerald-950">
                        Forma de Pago: <strong className="font-extrabold">{activePaymentForReceipt.method}</strong>
                        {activePaymentForReceipt.notes ? ` • Ref: ${activePaymentForReceipt.notes}` : ''}
                      </p>
                      <p className="text-[10.5px] text-emerald-700 font-medium pt-0.5">
                        Fecha de Entrega: <strong>{formatReceiptDateTime(activePaymentForReceipt.date || activePaymentForReceipt.createdAt)}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Monto Cobrado</span>
                    <span className="text-2xl font-black text-emerald-700 font-mono">
                      Bs. {activePaymentForReceipt.amount.toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>
              )}

              {/* Cuadrícula de Datos: Cliente & Orden */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-150 space-y-2 text-xs">
                  <div className="flex items-center space-x-1.5 border-b border-gray-200 pb-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-extrabold text-[11px] text-gray-500 uppercase tracking-wider">Cliente</span>
                  </div>
                  <div className="space-y-1 text-gray-600">
                    <div className="flex justify-between">
                      <span>Nombre:</span>
                      <strong className="text-gray-900 font-bold">{order.clientName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Teléfono:</span>
                      <strong className="text-gray-900 font-semibold">{order.clientPhone}</strong>
                    </div>
                    {order.referencePhone && (
                      <div className="flex justify-between">
                        <span>Contacto Ref.:</span>
                        <span className="text-gray-800 font-medium">
                          {order.referencePhone} {order.referenceRelationship ? `(${order.referenceRelationship})` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-150 space-y-2 text-xs">
                  <div className="flex items-center space-x-1.5 border-b border-gray-200 pb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-extrabold text-[11px] text-gray-500 uppercase tracking-wider">Recepción y Entrega</span>
                  </div>
                  <div className="space-y-1 text-gray-600">
                    <div className="flex justify-between items-center">
                      <span>Fecha de Recepción:</span>
                      <strong className="text-gray-900 font-bold">{formatReceiptDateTime(order.createdAt)}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Fecha de Entrega:</span>
                      <strong className="text-gray-900 font-bold">{formatReceiptDateTime(activePaymentForReceipt?.date || activePaymentForReceipt?.createdAt || new Date())}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Estado:</span>
                      <span className="text-gray-900 font-bold uppercase">{getStatusLabel(order.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Atendido por:</span>
                      <span className="text-gray-900 font-medium">{currentUser.name}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ficha Técnica del Dispositivo */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-gray-200 pb-1">
                  <span className="font-extrabold text-gray-600 uppercase tracking-wider text-[11px]">
                    INFORMACIÓN TÉCNICA DEL DISPOSITIVO
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-gray-50/60 p-3.5 rounded-2xl border border-gray-150">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Equipo</span>
                    <strong className="text-gray-900 text-xs">{order.brand} {order.model}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Color</span>
                    <span className="text-gray-800 font-medium text-xs">{order.color}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">IMEI</span>
                    <span className="text-gray-800 font-mono text-[11px] font-medium">{order.imei || 'No registrado'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Seguridad</span>
                    <span className="text-gray-800 font-medium text-xs">{order.lockType || 'Sin bloqueo'}</span>
                  </div>
                </div>
              </div>

              {/* Falla y Diagnóstico */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="font-extrabold text-gray-500 uppercase tracking-wider text-[10px]">Falla Reportada</span>
                  <p className="bg-gray-50 p-2.5 rounded-xl border border-gray-150 text-gray-800 font-medium min-h-[44px]">
                    {order.problem}
                  </p>
                </div>
                {order.quickDiagnosis ? (
                  <div className="space-y-1">
                    <span className="font-extrabold text-gray-500 uppercase tracking-wider text-[10px]">Diagnóstico Técnico</span>
                    <p className="bg-gray-50 p-2.5 rounded-xl border border-gray-150 text-gray-800 font-medium min-h-[44px]">
                      {order.quickDiagnosis}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="font-extrabold text-gray-500 uppercase tracking-wider text-[10px]">Modalidad del Servicio</span>
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-150 text-gray-800 font-semibold min-h-[44px] flex items-center">
                      {order.isLaborOnly ? 'Servicio de Mano de Obra Sin Repuestos' : 'Servicio Técnico Integral'}
                    </div>
                  </div>
                )}
              </div>

              {/* Repuestos si aplica */}
              {!order.isLaborOnly && order.spareParts && order.spareParts.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <span className="font-extrabold text-gray-500 uppercase tracking-wider text-[10px]">Repuestos y Componentes Asociados</span>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-150 space-y-1">
                    {order.spareParts.map((part, pidx) => (
                      <div key={pidx} className="flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-gray-800">• {part.name}</span>
                        <span className="text-gray-500 font-mono text-[10.5px]">
                          {part.type === 'INVENTORY' ? 'De Inventario' : `Externo (Bs. ${part.cost})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Balance Financiero Ejecutivo */}
              <div className="border-t-2 border-dashed border-gray-200 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span className="font-medium">Costo Total Estimado / Mano de Obra:</span>
                  <span className="font-bold text-gray-900 font-mono text-sm">Bs. {order.estimatedCost.toLocaleString('es-ES')}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span className="font-medium">Total Cobrado / Abonado a la Fecha:</span>
                  <span className="font-black font-mono text-sm">-Bs. {order.advancePayment.toLocaleString('es-ES')}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-black border-t border-gray-200 pt-2 text-gray-950">
                  <span className="uppercase tracking-wider">SALDO RESTANTE A LIQUIDAR:</span>
                  <span className="font-mono text-xl text-gray-950 font-black">
                    Bs. {remainingBalance.toLocaleString('es-ES')}
                  </span>
                </div>
              </div>

              {/* Términos de Servicio Resumidos */}
              <div className="text-[9.5px] text-gray-400 space-y-1 pt-3 border-t border-gray-200 leading-tight">
                <p className="font-bold text-gray-600 uppercase">Términos del Servicio</p>
                <p>1. Equipos no retirados tras 30 días causarán gastos de almacenamiento.</p>
                <p>2. Garantía de {workshopSettings.defaultWarrantyDays || 30} días en mano de obra. No incluye caídas o exposición a humedad posterior.</p>
              </div>

              {/* Firmas Elegantes */}
              <div className="grid grid-cols-2 gap-16 pt-6 text-center text-[10px] text-gray-500">
                <div className="border-t border-gray-300 pt-2 font-semibold">Firma del Cliente</div>
                <div className="border-t border-gray-300 pt-2 font-semibold">Taller Autorizado</div>
              </div>
            </div>
          )}
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

              {/* Used Spare Parts or Labor-Only indicator */}
              {order.isLaborOnly ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 shadow-2xs flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    SERVICIO DE MANO DE OBRA SIN REPUESTOS
                  </span>
                </div>
              ) : order.spareParts && order.spareParts.length > 0 ? (
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
              ) : null}

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

              {/* EDIT MODE: LABOR ONLY TOGGLE */}
              <div className={`p-3 rounded-xl border transition-all ${
                editIsLaborOnly ? 'bg-amber-50/70 border-amber-300' : 'bg-gray-50 border-gray-200'
              }`}>
                <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editIsLaborOnly}
                    onChange={(e) => setEditIsLaborOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-black focus:ring-[#FACC15] accent-black cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                    SERVICIO DE MANO DE OBRA SIN REPUESTOS
                  </span>
                </label>
              </div>

              {/* EDIT MODE: SPARE PARTS (HIDDEN IF LABOR ONLY) */}
              {!editIsLaborOnly && (
              <div className="space-y-2 border-t border-gray-100 pt-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-500 text-xs">Repuestos a Usar</span>
                  <button
                    id="edit-spare-parts-main-inventory-btn"
                    type="button"
                    onClick={() => {
                      setNewPartType('INVENTORY');
                      setIsSparePartsInventoryModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-1 text-[11px] font-black text-black bg-[#FACC15] hover:bg-yellow-400 active:scale-95 px-2.5 py-1 rounded-lg shadow-2xs border border-yellow-300 transition-all cursor-pointer"
                  >
                    <Boxes className="w-3 h-3" />
                    <span>Seleccionar Inventario</span>
                  </button>
                </div>
                
                <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-150 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {newPartType === 'INVENTORY' ? (
                      <div className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 flex items-center justify-between shadow-2xs text-left">
                        <div className="flex items-center space-x-2 min-w-0">
                          <Boxes className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
                          <span className="truncate">
                            {selectedProductId
                              ? (availableProducts.find(p => p.id === selectedProductId)?.name || 'Repuesto seleccionado')
                              : 'Usa "Seleccionar Inventario" arriba'}
                          </span>
                        </div>
                        {selectedProductId && (
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[9px] rounded shrink-0">
                            Listo
                          </span>
                        )}
                      </div>
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
                        onClick={() => {
                          setNewPartType('INVENTORY');
                        }}
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
                      className="px-4 py-2 bg-black text-[#FACC15] hover:bg-gray-900 rounded-xl font-bold text-xs disabled:bg-gray-200 disabled:text-gray-400 cursor-pointer flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Repuesto</span>
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
              )}

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

            {/* List of registered payments if any */}
            {payments.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Historial de Cobros ({payments.length})</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {payments.map((p, pIdx) => (
                    <div key={p.id || pIdx} className="bg-gray-50 p-2 rounded-xl border border-gray-150 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-black text-emerald-700 font-mono">Bs. {p.amount.toLocaleString('es-ES')}</span>
                          <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-700">{p.method}</span>
                        </div>
                        <span className="text-[9px] text-gray-400 font-mono">
                          {new Date(p.date || p.createdAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActivePaymentForReceipt(p);
                          setShowPrintView(true);
                        }}
                        className="p-1.5 bg-white hover:bg-black hover:text-[#FACC15] text-gray-700 rounded-lg border border-gray-200 text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                        title="Ver / Imprimir Recibo de este cobro"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Recibo</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {remainingBalance > 0 ? (
            <div className="space-y-2 mt-4">
              {onNavigateToPosWithOrder && (
                <button
                  type="button"
                  id="detail-cobrar-pos-btn"
                  onClick={() => onNavigateToPosWithOrder(order)}
                  className="w-full bg-[#111111] hover:bg-black active:scale-[0.99] text-[#FACC15] py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center space-x-2 border border-white/10 shadow-sm cursor-pointer transition-all"
                  title="Cobrar este servicio directamente en el Carrito de Ventas (POS)"
                >
                  <ShoppingBag className="w-4 h-4 text-[#FACC15]" />
                  <span>Cobrar en Carrito POS</span>
                </button>
              )}
            </div>
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
      {showPaymentModal && typeof document !== 'undefined' && createPortal(
        <div 
          id="payment-modal" 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none touch-none"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPaymentModal(false);
            }
          }}
        >
          <div 
            className="relative bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 animate-fade-in space-y-5 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#111111] leading-tight">Registrar Cobro</h3>
                  <p className="text-[11px] text-gray-500 font-medium">Abono o liquidación de la orden</p>
                </div>
              </div>
              <button
                id="close-payment-modal"
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 hover:bg-gray-100 active:scale-95 rounded-xl cursor-pointer text-gray-400 hover:text-gray-700 transition-all"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <label htmlFor="payment-amount-input" className="text-xs font-bold text-gray-700">Monto del Pago (Bs.) *</label>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Pendiente: <strong className="text-amber-900 font-mono">Bs. {remainingBalance.toLocaleString('es-ES')}</strong>
                  </span>
                </div>
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
                    autoFocus
                    placeholder={String(remainingBalance)}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="block w-full pl-11 pr-20 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(String(remainingBalance))}
                    className="absolute inset-y-1.5 right-1.5 px-2.5 bg-gray-200 hover:bg-[#FACC15] hover:text-black text-gray-700 text-[10px] font-black rounded-lg transition-all cursor-pointer"
                    title="Cobrar el total pendiente"
                  >
                    Total
                  </button>
                </div>
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
                      className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                        paymentMethod === method
                          ? 'bg-black text-[#FACC15] border-black shadow-sm scale-[1.02]'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="payment-notes-input" className="text-xs font-bold text-gray-700">Notas Adicionales</label>
                <input
                  id="payment-notes-input"
                  type="text"
                  placeholder="Ej. Abono parcial, transferencia verificada"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:bg-white transition-all text-gray-800"
                />
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  id="submit-payment-btn"
                  type="submit"
                  className="w-2/3 bg-[#111111] hover:bg-black active:scale-[0.99] text-[#FACC15] font-black py-3 px-4 rounded-xl text-xs shadow-md transition-all cursor-pointer text-center flex items-center justify-center space-x-1.5"
                >
                  <DollarSign className="w-4 h-4 text-[#FACC15]" />
                  <span>Confirmar Cobro</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
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

      {/* Floating Inventory Picker Modal with Backdrop Blur */}
      <SparePartsInventoryModal
        isOpen={isSparePartsInventoryModalOpen}
        onClose={() => setIsSparePartsInventoryModalOpen(false)}
        products={availableProducts}
        onSelectProduct={handleSelectProductFromInventoryModal}
        alreadySelectedProductIds={editSpareParts.filter((p) => p.type === 'INVENTORY' && p.productId).map((p) => p.productId!)}
      />

    </div>
  );
}
