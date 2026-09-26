/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import BolFixLogo from './BolFixLogo';
import { 
  ShoppingBag, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  DollarSign, 
  User, 
  CreditCard, 
  Printer, 
  CheckCircle,
  FileText,
  Smartphone,
  Sparkles,
  RefreshCw,
  X,
  PlusCircle,
  Tag,
  History,
  Check,
  AlertCircle,
  Package,
  QrCode,
  ArrowRight,
  MessageCircle,
  Store,
  Layers,
  Wrench,
  Percent,
  Receipt
} from 'lucide-react';
import { mockDb } from '../db/mockDb';
import { Product, Sale, SaleItem, Client, User as SystemUser, WorkshopSettings } from '../types';

interface SalesViewProps {
  currentUser: SystemUser;
  posPrefillSale?: {
    item: SaleItem;
    client?: { id?: string; name: string; phone: string };
    paymentMethod?: string;
    notes?: string;
  } | null;
  onClearPosPrefill?: () => void;
}

const COMMON_SERVICES = [
  { id: 'srv-1', name: 'Limpieza y Mantenimiento Físico', category: 'Servicio', price: 50 },
  { id: 'srv-2', name: 'Instalación de Software / Flash / Reset', category: 'Servicio', price: 70 },
  { id: 'srv-3', name: 'Instalación de Vidrio Protector Templado', category: 'Servicio', price: 25 },
  { id: 'srv-4', name: 'Diagnóstico Técnico Avanzado', category: 'Servicio', price: 40 },
  { id: 'srv-5', name: 'Instalación de Protector de Hidrogel Premium', category: 'Servicio', price: 45 },
  { id: 'srv-6', name: 'Cambio de Pin de Carga / Micro-soldadura', category: 'Servicio', price: 120 }
];

export default function SalesView({ currentUser, posPrefillSale, onClearPosPrefill }: SalesViewProps) {
  // DB States
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  // Search & Catalog Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedType, setSelectedType] = useState<'ALL' | 'PRODUCTS' | 'SERVICES'>('ALL');

  // Client Selection
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  
  // Custom client quick registration modal
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Inventory Modal State
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState<string>('Todos');
  const [onlyInStock, setOnlyInStock] = useState(true);
  const [addedItemNotice, setAddedItemNotice] = useState<string | null>(null);

  // Custom Item Modal
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemCategory, setCustomItemCategory] = useState('Servicio');

  // Sales History Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Cart State
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Efectivo');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [orderNotice, setOrderNotice] = useState<string | null>(null);

  // Workshop Settings
  const [workshopSettings, setWorkshopSettings] = useState<WorkshopSettings>(() => mockDb.getSettings());

  // Barcode / Scanner input ref
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const availablePaymentMethods = useMemo(() => {
    return workshopSettings.enabledPaymentMethods && workshopSettings.enabledPaymentMethods.length > 0
      ? workshopSettings.enabledPaymentMethods
      : ['Efectivo', 'QR', 'Transferencia', 'Tarjeta', 'Pago Móvil'];
  }, [workshopSettings.enabledPaymentMethods]);

  useEffect(() => {
    if (!availablePaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(availablePaymentMethods[0] || 'Efectivo');
    }
  }, [availablePaymentMethods, paymentMethod]);

  // Completed sale for ticket printing
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Load Initial Data
  const loadData = () => {
    const allProducts = mockDb.getProducts().filter(p => p.status === 'Activo');
    setProducts(allProducts);

    const allClients = mockDb.getClients();
    setClients(allClients);

    const allSales = mockDb.getSales().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRecentSales(allSales);

    // Default to "Público General" if no client is selected
    if (!selectedClient) {
      const pubGeneral = allClients.find(c => c.id === 'client-publico-general');
      if (pubGeneral) {
        setSelectedClient(pubGeneral);
        setClientSearch(pubGeneral.name);
      }
    }
  };

  useEffect(() => {
    loadData();

    const handleSettingsUpdate = () => {
      setWorkshopSettings(mockDb.getSettings());
      loadData();
    };

    window.addEventListener('workshop_settings_saved', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);
    return () => {
      window.removeEventListener('workshop_settings_saved', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, []);

  // Listen for redirected service orders from work order payment
  useEffect(() => {
    if (posPrefillSale) {
      // Add or replace service item in cart
      setCart(prev => {
        const withoutSameOrder = prev.filter(
          item => !(item.type === 'SERVICE' && item.referenceId === posPrefillSale.item.referenceId)
        );
        return [posPrefillSale.item, ...withoutSameOrder];
      });

      // Set client from order
      if (posPrefillSale.client) {
        const foundClient = clients.find(c => c.name.toLowerCase() === posPrefillSale.client?.name.toLowerCase());
        if (foundClient) {
          setSelectedClient(foundClient);
          setClientSearch(foundClient.name);
        } else {
          const tempClient: Client = {
            id: posPrefillSale.client.id || `client-${Date.now()}`,
            name: posPrefillSale.client.name,
            phone: posPrefillSale.client.phone,
            createdAt: new Date().toISOString()
          };
          setSelectedClient(tempClient);
          setClientSearch(tempClient.name);
        }
      }

      // Set payment method
      if (posPrefillSale.paymentMethod) {
        setPaymentMethod(posPrefillSale.paymentMethod);
      }

      // Show high-priority notice banner
      setOrderNotice(
        `Orden #${posPrefillSale.item.orderOt || ''} (${posPrefillSale.item.orderEquipment || 'Equipo'}) agregada al carrito POS por Bs. ${posPrefillSale.item.price}.`
      );

      // Auto clear prefill trigger
      if (onClearPosPrefill) {
        onClearPosPrefill();
      }
    }
  }, [posPrefillSale, clients, onClearPosPrefill]);

  // Categories list
  const categories = useMemo(() => {
    return ['Todos', ...Array.from(new Set(products.map(p => p.category)))];
  }, [products]);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === 'PERCENT') {
      return Math.round((subtotal * (discountValue / 100)) * 100) / 100;
    }
    return Math.min(subtotal, Math.max(0, discountValue));
  }, [subtotal, discountType, discountValue]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const changeDue = useMemo(() => {
    const tendered = parseFloat(cashTendered);
    if (isNaN(tendered) || tendered < total) return 0;
    return Math.round((tendered - total) * 100) / 100;
  }, [cashTendered, total]);

  // Add product to cart
  const addToCart = (item: { 
    id: string; 
    name: string; 
    price: number; 
    type: 'PRODUCT' | 'SERVICE'; 
    stock?: number;
    category?: string;
    sku?: string;
    details?: string;
  }, qtyToAdd: number = 1) => {
    const existingIdx = cart.findIndex(c => c.type === item.type && c.referenceId === item.id);
    
    if (existingIdx !== -1) {
      const updatedCart = [...cart];
      const newQty = updatedCart[existingIdx].quantity + qtyToAdd;
      
      // Stock check
      if (!workshopSettings.allowNegativeStock && item.type === 'PRODUCT' && item.stock !== undefined && newQty > item.stock) {
        alert(`Stock máximo disponible para este producto: ${item.stock} unidades.`);
        return;
      }
      
      updatedCart[existingIdx].quantity = newQty;
      setCart(updatedCart);
    } else {
      if (!workshopSettings.allowNegativeStock && item.type === 'PRODUCT' && item.stock !== undefined && item.stock <= 0) {
        alert('Este producto no tiene stock disponible.');
        return;
      }
      
      setCart([
        ...cart,
        {
          id: `item-${Date.now()}-${Math.random()}`,
          type: item.type,
          referenceId: item.id,
          name: item.name,
          quantity: qtyToAdd,
          price: item.price,
          category: item.category,
          sku: item.sku,
          details: item.details
        }
      ]);
    }

    // Visual feedback
    setAddedItemNotice(item.name);
    setTimeout(() => {
      setAddedItemNotice(null);
    }, 1800);
  };

  const updateCartQuantity = (index: number, delta: number) => {
    const updatedCart = [...cart];
    const item = updatedCart[index];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      updatedCart.splice(index, 1);
    } else {
      if (!workshopSettings.allowNegativeStock && item.type === 'PRODUCT') {
        const prod = products.find(p => p.id === item.referenceId);
        if (prod && newQty > prod.stock) {
          alert(`No hay suficiente stock. Máximo disponible: ${prod.stock}`);
          return;
        }
      }
      item.quantity = newQty;
    }
    setCart(updatedCart);
  };

  const removeFromCart = (index: number) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    setDiscountValue(0);
    setCashTendered('');
    setOrderNotice(null);
  };

  // Barcode / Fast search handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Search exact barcode first
    const barcodeMatch = products.find(p => p.barcode && p.barcode.toLowerCase() === query.toLowerCase());
    if (barcodeMatch) {
      addToCart({
        id: barcodeMatch.id,
        name: barcodeMatch.name,
        price: barcodeMatch.salePrice,
        type: 'PRODUCT',
        stock: barcodeMatch.stock,
        category: barcodeMatch.category,
        sku: barcodeMatch.code
      });
      setSearchQuery('');
      return;
    }

    // Search exact internal code
    const codeMatch = products.find(p => p.code.toLowerCase() === query.toLowerCase());
    if (codeMatch) {
      addToCart({
        id: codeMatch.id,
        name: codeMatch.name,
        price: codeMatch.salePrice,
        type: 'PRODUCT',
        stock: codeMatch.stock,
        category: codeMatch.category,
        sku: codeMatch.code
      });
      setSearchQuery('');
      return;
    }

    // If single match by name
    const nameMatches = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    if (nameMatches.length === 1) {
      const match = nameMatches[0];
      addToCart({
        id: match.id,
        name: match.name,
        price: match.salePrice,
        type: 'PRODUCT',
        stock: match.stock,
        category: match.category,
        sku: match.code
      });
      setSearchQuery('');
    }
  };

  // Add custom fee/service
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(customItemPrice);
    if (!customItemName.trim() || isNaN(priceNum) || priceNum <= 0) {
      alert('Por favor ingrese un concepto y precio válido');
      return;
    }

    addToCart({
      id: `custom-${Date.now()}`,
      name: customItemName.trim(),
      price: priceNum,
      type: 'SERVICE',
      category: customItemCategory
    });

    setCustomItemName('');
    setCustomItemPrice('');
    setIsCustomItemModalOpen(false);
  };

  // Complete Sale & Checkout
  const handleCompleteSale = () => {
    if (cart.length === 0) {
      alert('El carrito de compras está vacío.');
      return;
    }
    if (!selectedClient) {
      alert('Por favor seleccione un cliente para la venta.');
      return;
    }

    const salePayload = {
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientPhone: selectedClient.phone,
      items: cart,
      subtotal,
      discount: discountAmount,
      total,
      paymentMethod
    };

    try {
      const newSale = mockDb.createSale(salePayload, currentUser.name);
      setCompletedSale(newSale);

      // Auto print if enabled
      if (workshopSettings.autoPrintTicket) {
        setTimeout(() => {
          window.print();
        }, 500);
      }

      // Refresh records
      loadData();

      // Reset cart and tender
      setCart([]);
      setDiscountValue(0);
      setCashTendered('');
      setOrderNotice(null);

      // Reset client to Publico General
      const pg = clients.find(c => c.id === 'client-publico-general');
      if (pg) {
        setSelectedClient(pg);
        setClientSearch(pg.name);
      }
    } catch (err: any) {
      alert('Error al registrar la venta: ' + (err?.message || err));
    }
  };

  // Quick client submit
  const handleQuickClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientPhone.trim()) {
      alert('Nombre y teléfono son obligatorios');
      return;
    }

    const created = mockDb.getOrCreateClient(
      newClientName.trim(),
      newClientPhone.trim(),
      undefined,
      undefined,
      undefined
    );

    const updated = mockDb.getClients();
    setClients(updated);
    setSelectedClient(created);
    setClientSearch(created.name);
    setNewClientName('');
    setNewClientPhone('');
    setIsClientModalOpen(false);
  };

  // Filter products for inventory modal
  const filteredInventoryProducts = useMemo(() => {
    const q = inventorySearch.toLowerCase().trim();
    return products.filter(p => {
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        p.code.toLowerCase().includes(q) || 
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        p.brand.toLowerCase().includes(q);
      const matchesCategory = inventoryCategory === 'Todos' || p.category === inventoryCategory;
      const matchesStock = !onlyInStock || p.stock > 0;
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, inventorySearch, inventoryCategory, onlyInStock]);

  // Filter products for main view quick grid
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p => {
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        p.code.toLowerCase().includes(q) || 
        (p.barcode && p.barcode.toLowerCase().includes(q));
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const filteredServices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return COMMON_SERVICES.filter(s => !q || s.name.toLowerCase().includes(q));
  }, [searchQuery]);

  // Today's total sales
  const todaySalesStats = useMemo(() => {
    const today = new Date().toDateString();
    const todayList = recentSales.filter(s => new Date(s.date).toDateString() === today);
    const sum = todayList.reduce((acc, s) => acc + s.total, 0);
    return { count: todayList.length, sum };
  }, [recentSales]);

  return (
    <div id="pos-module-view" className="space-y-5 pb-16 animate-fade-in text-gray-900 select-none">
      
      {/* ======================================================== */}
      {/* 1. TOP POS HEADER & PRIMARY ACTIONS                       */}
      {/* ======================================================== */}
      <div className="bg-[#111111] text-white p-4 sm:p-5 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10">
        
        {/* Brand & Cashier Info */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FACC15] text-black flex items-center justify-center font-black shadow-lg shadow-yellow-500/20 shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase">
                Punto de Venta (POS)
              </h1>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Caja Activa
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Cajero: <span className="text-[#FACC15] font-bold">{currentUser.name}</span> · Ventas hoy: <strong className="text-white font-mono">{todaySalesStats.count}</strong> (Bs. {todaySalesStats.sum.toLocaleString('es-ES')})
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          
          {/* Quick Custom Item */}
          <button
            type="button"
            onClick={() => setIsCustomItemModalOpen(true)}
            className="px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-gray-200 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer border border-white/10"
            title="Agregar servicio o concepto manual libre"
          >
            <Plus className="w-4 h-4 text-[#FACC15]" />
            <span className="hidden sm:inline">Concepto Libre</span>
          </button>

          {/* Sales History */}
          <button
            type="button"
            id="pos-history-btn"
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3 py-2.5 bg-white/10 hover:bg-white/15 text-gray-200 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer border border-white/10"
            title="Ver ventas recientes y reimprimir comprobantes"
          >
            <History className="w-4 h-4 text-gray-300" />
            <span className="hidden md:inline">Historial</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
            title="Actualizar datos de inventario"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* NOTICE BANNER: REDIRECTED ORDER FROM SERVICE PAYMENT      */}
      {/* ======================================================== */}
      {orderNotice && (
        <div className="bg-gradient-to-r from-amber-500/15 via-[#FACC15]/20 to-amber-500/15 border-2 border-[#FACC15] p-3.5 rounded-2xl flex items-center justify-between text-gray-900 shadow-md animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#FACC15] text-black rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-900 tracking-tight">
                {orderNotice}
              </p>
              <p className="text-[11px] text-gray-600 font-medium">
                La orden ya está lista en el carrito. Puedes completar el cobro ahora o añadir accesorios y repuestos adicionales.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOrderNotice(null)}
            className="p-1 hover:bg-black/10 rounded-lg text-gray-600 hover:text-black cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Temporary visual feedback when adding item */}
      {addedItemNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-[#FACC15] px-4 py-2.5 rounded-2xl font-bold text-xs shadow-2xl flex items-center space-x-2 border border-white/20 animate-bounce">
          <Check className="w-4 h-4 text-[#FACC15]" />
          <span>"{addedItemNotice}" añadido al carrito</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MAIN POS WORKSPACE: ONLY THE PREMIUM POS CART         */}
      {/* ======================================================== */}
      <div className="max-w-3xl mx-auto w-full">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden flex flex-col min-h-[520px]">
          
          {/* Cart Header */}
          <div className="p-3 bg-[#111111] text-white flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-[#FACC15] text-black flex items-center justify-center font-black shadow-md shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-white uppercase">CARRITO</h2>
                <span className="text-[10px] text-gray-400 font-medium">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)} ítem(s)
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {cart.length > 0 && (
                <button
                  type="button"
                  id="cart-vaciar-btn"
                  onClick={clearCart}
                  className="px-2.5 py-1.5 text-[10px] font-bold text-red-400 hover:text-red-300 hover:bg-red-950/40 bg-white/5 border border-red-900/30 rounded-lg transition-all cursor-pointer flex items-center space-x-1"
                  title="Vaciar"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>X</span>
                </button>
              )}
            </div>
          </div>

            {/* Client Selector Box */}
            <div className="p-3.5 bg-gray-50 border-b border-gray-150 shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider flex items-center space-x-1">
                  <User className="w-3 h-3 text-gray-500" />
                  <span>Cliente de la Venta</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(true)}
                  className="text-[10px] font-bold text-[#FACC15] hover:underline cursor-pointer"
                >
                  + Nuevo Cliente
                </button>
              </div>

              <div className="relative">
                <div 
                  onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs flex items-center justify-between cursor-pointer hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-700 shrink-0">
                      {selectedClient ? selectedClient.name.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div className="truncate">
                      <span className="font-extrabold text-gray-900 truncate block">
                        {selectedClient ? selectedClient.name : 'Público General'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono block">
                        {selectedClient?.phone ? `Telf: ${selectedClient.phone}` : 'Sin teléfono registrado'}
                      </span>
                    </div>
                  </div>
                  <span className="text-gray-400 text-xs">▼</span>
                </div>

                {/* Dropdown list */}
                {isClientDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-30 p-2 max-h-56 overflow-y-auto space-y-1">
                    <input
                      type="text"
                      placeholder="Buscar cliente..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-black mb-1"
                    />

                    {clients
                      .filter(c => !clientSearch || c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch))
                      .slice(0, 6)
                      .map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedClient(c);
                            setClientSearch(c.name);
                            setIsClientDropdownOpen(false);
                          }}
                          className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            selectedClient?.id === c.id ? 'bg-[#FACC15]/20 font-bold text-black' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className="truncate">{c.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{c.phone}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cart Items List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 min-h-[160px] scrollbar-thin">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 text-gray-400">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600">El carrito está vacío</p>
                    <p className="text-[11px] text-gray-400 max-w-[200px] mt-0.5">
                      Agrega productos del inventario o cobra una orden de servicio.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsInventoryModalOpen(true)}
                    className="px-5 py-3 bg-gradient-to-r from-[#FACC15] to-amber-400 hover:from-amber-400 hover:to-[#FACC15] text-black font-black text-xs rounded-2xl shadow-lg shadow-yellow-500/20 active:scale-[0.98] transition-all flex items-center space-x-2 cursor-pointer border border-yellow-300/40"
                  >
                    <Package className="w-4.5 h-4.5 text-black" />
                    <span>Agregar Producto del Inventario</span>
                  </button>
                </div>
              ) : (
                cart.map((item, index) => {
                  const isServiceOrder = item.type === 'SERVICE' && Boolean(item.orderOt);

                  return (
                    <div
                      key={item.id || index}
                      className={`p-3 rounded-2xl border transition-all ${
                        isServiceOrder
                          ? 'bg-gradient-to-r from-amber-50/50 via-yellow-50/30 to-amber-50/50 border-[#FACC15] shadow-xs'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Service Order Specific Header Tag */}
                      {isServiceOrder && (
                        <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-yellow-200/60">
                          <span className="text-[9px] font-black uppercase tracking-wider text-yellow-900 bg-[#FACC15] px-2 py-0.5 rounded-md flex items-center space-x-1">
                            <Sparkles className="w-3 h-3 text-black" />
                            <span>ORDEN DE TRABAJO #{item.orderOt}</span>
                          </span>
                          <span className="text-[10px] text-gray-500 font-bold">
                            Técnico: {item.orderTechnician || 'Taller'}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <h4 className="text-xs font-black text-gray-900 leading-tight truncate">
                            {item.name}
                          </h4>

                          {/* Extra info for service order or product SKU */}
                          {isServiceOrder ? (
                            <div className="text-[10px] text-gray-600 space-y-0.5">
                              <p className="truncate"><strong>Equipo:</strong> {item.orderEquipment}</p>
                              {item.orderIssue && (
                                <p className="truncate text-gray-500"><strong>Falla:</strong> {item.orderIssue}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-400 font-mono">
                              {item.sku ? `SKU: ${item.sku} · ` : ''}Unit: Bs. {item.price.toLocaleString('es-ES')}
                            </p>
                          )}
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(index)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Quitar ítem"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Stepper & Line Subtotal */}
                      <div className="pt-2 mt-2 flex items-center justify-between border-t border-gray-100">
                        {/* Stepper (Only editable for non-service orders or allowed qty) */}
                        {!isServiceOrder ? (
                          <div className="flex items-center space-x-1 bg-gray-100 p-0.5 rounded-xl">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(index, -1)}
                              className="w-6 h-6 rounded-lg bg-white text-gray-800 flex items-center justify-center font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center font-mono text-xs font-black text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(index, 1)}
                              className="w-6 h-6 rounded-lg bg-white text-gray-800 flex items-center justify-center font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-500 bg-white/80 px-2 py-0.5 rounded-md border border-yellow-200">
                            Cobro Servicio (Cant: 1)
                          </span>
                        )}

                        <span className="font-mono text-xs font-black text-gray-900">
                          Bs. {(item.price * item.quantity).toLocaleString('es-ES')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Financial Summary & Checkout Controls */}
            {cart.length > 0 && (
              <div className="p-4 bg-gray-50 border-t border-gray-200 shrink-0 space-y-3.5">
                
                {/* Subtotal & Discount row */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-mono font-bold">Bs. {subtotal.toLocaleString('es-ES')}</span>
                  </div>

                  {/* Discount toggle and input */}
                  <div className="flex items-center justify-between text-gray-600 pt-1 border-t border-dashed border-gray-200">
                    <div className="flex items-center space-x-1">
                      <span className="text-[11px] font-bold">Descuento</span>
                      <div className="flex bg-gray-200 p-0.5 rounded-lg text-[9px] font-black">
                        <button
                          type="button"
                          onClick={() => setDiscountType('FIXED')}
                          className={`px-1.5 py-0.5 rounded-md cursor-pointer ${discountType === 'FIXED' ? 'bg-white text-black shadow-xs' : 'text-gray-500'}`}
                        >
                          Bs.
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType('PERCENT')}
                          className={`px-1.5 py-0.5 rounded-md cursor-pointer ${discountType === 'PERCENT' ? 'bg-white text-black shadow-xs' : 'text-gray-500'}`}
                        >
                          %
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min="0"
                        step={discountType === 'PERCENT' ? '1' : '0.5'}
                        max={discountType === 'PERCENT' ? '100' : String(subtotal)}
                        value={discountValue || ''}
                        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-16 px-2 py-1 bg-white border border-gray-200 rounded-lg text-right font-mono font-bold text-xs focus:ring-1 focus:ring-black"
                      />
                      {discountAmount > 0 && (
                        <span className="text-[11px] font-mono text-red-600 font-bold">
                          (-Bs. {discountAmount.toLocaleString('es-ES')})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* GRAND TOTAL HIGH IMPACT BANNER */}
                <div className="bg-[#111111] text-white p-3.5 rounded-2xl flex items-center justify-between shadow-lg border border-white/10">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FACC15] block">
                      TOTAL A COBRAR
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">Impuestos / Boleta incluida</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-[#FACC15] font-mono tracking-tight">
                      Bs. {total.toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                    Método de Pago
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {availablePaymentMethods.slice(0, 4).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 px-1 text-center rounded-xl text-[10px] font-black tracking-tight transition-all cursor-pointer border ${
                          paymentMethod === method
                            ? 'bg-black text-[#FACC15] border-black shadow-xs scale-[1.02]'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash Tender & Change Calculator (Only if Efectivo) */}
                {paymentMethod === 'Efectivo' && (
                  <div className="p-2.5 bg-white rounded-2xl border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-700">Monto Recibido:</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-400 font-bold">Bs.</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder={String(total)}
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          className="w-24 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-right font-mono font-black text-xs focus:ring-1 focus:ring-black"
                        />
                      </div>
                    </div>

                    {/* Quick Bill presets */}
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => setCashTendered(String(total))}
                        className="flex-1 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        Exacto
                      </button>
                      <button
                        type="button"
                        onClick={() => setCashTendered(String(Math.ceil(total / 50) * 50 || 50))}
                        className="flex-1 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        +Bs. 50
                      </button>
                      <button
                        type="button"
                        onClick={() => setCashTendered(String(Math.ceil(total / 100) * 100 || 100))}
                        className="flex-1 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        +Bs. 100
                      </button>
                      <button
                        type="button"
                        onClick={() => setCashTendered(String(Math.ceil(total / 200) * 200 || 200))}
                        className="flex-1 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        +Bs. 200
                      </button>
                    </div>

                    {/* Change due calculation */}
                    {parseFloat(cashTendered) >= total && (
                      <div className="flex items-center justify-between pt-1 border-t border-gray-150 text-xs font-black">
                        <span className="text-emerald-700">Cambio a Devolver:</span>
                        <span className="font-mono text-emerald-600 text-sm">
                          Bs. {changeDue.toLocaleString('es-ES')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Primary Checkout CTA */}
                <button
                  type="button"
                  id="pos-checkout-btn"
                  onClick={handleCompleteSale}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-950/20 transition-all flex items-center justify-center space-x-2 cursor-pointer border border-emerald-400/30"
                >
                  <DollarSign className="w-5 h-5 text-white" />
                  <span>PROCESAR VENTA · Bs. {total.toLocaleString('es-ES')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

      {/* ======================================================== */}
      {/* 3. MODAL: AGREGAR PRODUCTO DEL INVENTARIO                 */}
      {/* ======================================================== */}
      {isInventoryModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none animate-fade-in">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-150 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#111111] text-white flex items-center justify-between shrink-0 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FACC15] text-black flex items-center justify-center font-black">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">
                    Catálogo de Inventario para Venta
                  </h3>
                  <p className="text-xs text-gray-400">
                    Selecciona repuestos o accesorios para sumar al carrito POS
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInventoryModalOpen(false)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 shrink-0 space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Buscar por código, nombre, código de barra o marca..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
                  />
                </div>

                <label className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="rounded text-black focus:ring-0 cursor-pointer"
                  />
                  <span>Solo con Stock</span>
                </label>
              </div>

              {/* Categories */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setInventoryCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold whitespace-nowrap transition-all border cursor-pointer ${
                      inventoryCategory === cat
                        ? 'bg-black text-[#FACC15] border-black shadow-xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Table / Cards list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[500px]">
              {filteredInventoryProducts.length === 0 ? (
                <div className="p-10 text-center space-y-2 text-gray-400">
                  <Package className="w-10 h-10 mx-auto text-gray-300" />
                  <p className="text-xs font-bold text-gray-600">No se encontraron productos coincidentes.</p>
                  <p className="text-[11px] text-gray-400">Prueba ajustando el término de búsqueda o filtros.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredInventoryProducts.map((prod) => {
                    const inCartCount = cart.find(c => c.type === 'PRODUCT' && c.referenceId === prod.id)?.quantity || 0;
                    const isOutOfStock = prod.stock <= 0;

                    return (
                      <div
                        key={prod.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                          isOutOfStock && !workshopSettings.allowNegativeStock
                            ? 'bg-gray-50 border-gray-200 opacity-60'
                            : inCartCount > 0
                            ? 'bg-yellow-50/30 border-black shadow-xs'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono font-bold text-gray-500">{prod.code}</span>
                            <span className={`px-2 py-0.5 rounded-md font-extrabold text-[9px] ${
                              prod.stock > 5 ? 'bg-emerald-50 text-emerald-700' : prod.stock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
                            }`}>
                              {prod.stock > 0 ? `${prod.stock} disponibles` : 'Agotado'}
                            </span>
                          </div>

                          <h4 className="text-xs font-black text-gray-900 leading-tight">
                            {prod.name}
                          </h4>

                          <p className="text-[10px] text-gray-400 truncate">
                            {prod.category} {prod.brand ? `· ${prod.brand}` : ''} {prod.compatibleModel ? `· ${prod.compatibleModel}` : ''}
                          </p>
                        </div>

                        <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-gray-400 block font-medium">Precio Venta</span>
                            <span className="font-mono text-sm font-black text-gray-900">
                              Bs. {prod.salePrice.toLocaleString('es-ES')}
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={isOutOfStock && !workshopSettings.allowNegativeStock}
                            onClick={() => addToCart({
                              id: prod.id,
                              name: prod.name,
                              price: prod.salePrice,
                              type: 'PRODUCT',
                              stock: prod.stock,
                              category: prod.category,
                              sku: prod.code
                            })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1 transition-all cursor-pointer ${
                              inCartCount > 0
                                ? 'bg-black text-[#FACC15] hover:bg-gray-800'
                                : 'bg-[#FACC15] text-black hover:bg-yellow-400'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{inCartCount > 0 ? `Agregar (+${inCartCount})` : 'Agregar'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 shrink-0 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Mostrando {filteredInventoryProducts.length} productos
              </span>
              <button
                type="button"
                onClick={() => setIsInventoryModalOpen(false)}
                className="px-5 py-2.5 bg-black text-[#FACC15] font-black text-xs rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Listo / Volver al Carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL: AGREGAR CONCEPTO LIBRE / SERVICIO MANUAL       */}
      {/* ======================================================== */}
      {isCustomItemModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in h-screen w-screen">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-150 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black text-gray-900 uppercase">
                Agregar Concepto Libre / Servicio
              </h3>
              <button
                type="button"
                onClick={() => setIsCustomItemModalOpen(false)}
                className="p-1 text-gray-400 hover:text-black rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Descripción o Concepto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cambio de cristal templado, Desbloqueo de cuenta, etc."
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Precio (Bs.) *</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  required
                  placeholder="0.00"
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Categoría</label>
                <select
                  value={customItemCategory}
                  onChange={(e) => setCustomItemCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                >
                  <option value="Servicio">Servicio Técnico</option>
                  <option value="Accesorio">Accesorio</option>
                  <option value="Repuesto">Repuesto Especial</option>
                  <option value="Mano de Obra">Mano de Obra</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomItemModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-black text-[#FACC15] font-black text-xs rounded-xl hover:bg-gray-800 cursor-pointer"
                >
                  Agregar al Carrito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL: REGISTRO RÁPIDO DE CLIENTE                      */}
      {/* ======================================================== */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in h-screen w-screen">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-150 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black text-gray-900 uppercase">
                Registrar Nuevo Cliente
              </h3>
              <button
                type="button"
                onClick={() => setIsClientModalOpen(false)}
                className="p-1 text-gray-400 hover:text-black rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickClientSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Roberto Gómez"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Número de Celular *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. 70912345"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-black text-[#FACC15] font-black text-xs rounded-xl hover:bg-gray-800 cursor-pointer"
                >
                  Guardar y Asignar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL: HISTORIAL DE VENTAS DEL DÍA                     */}
      {/* ======================================================== */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-150 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-[#111111] text-white flex items-center justify-between shrink-0 border-b border-white/10">
              <div className="flex items-center space-x-2.5">
                <History className="w-5 h-5 text-[#FACC15]" />
                <h3 className="text-sm font-black uppercase text-white">
                  Historial de Ventas / Caja ({recentSales.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {recentSales.length === 0 ? (
                <p className="text-center py-8 text-xs text-gray-400 font-bold">No se registran ventas previas.</p>
              ) : (
                recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between hover:bg-white transition-colors"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-xs text-gray-900">{sale.saleNumber}</span>
                        <span className="text-[10px] text-gray-400">• {new Date(sale.date).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className="text-[10px] bg-black text-[#FACC15] px-1.5 py-0.2 rounded font-bold">{sale.paymentMethod}</span>
                      </div>
                      <p className="text-xs font-bold text-gray-700 truncate">{sale.clientName}</p>
                      <p className="text-[10px] text-gray-400">
                        {sale.items.length} {sale.items.length === 1 ? 'artículo' : 'artículos'} · Atendido por {sale.user}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-black text-sm text-gray-900">
                        Bs. {sale.total.toLocaleString('es-ES')}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCompletedSale(sale);
                          setIsHistoryModalOpen(false);
                        }}
                        className="p-2 bg-black text-[#FACC15] rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
                        title="Reimprimir Comprobante"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. COMPLETED SALE RECEIPT / TICKET OVERLAY               */}
      {/* ======================================================== */}
      {completedSale && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-[#111111] select-none">
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-150 p-6 flex flex-col justify-between max-h-[92vh]">
            
            {/* Header (hidden on print) */}
            <div className="flex justify-between items-center pb-3 border-b border-gray-150 mb-4 print:hidden">
              <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Venta Procesada Exitosamente</span>
              </span>
              <button
                type="button"
                id="close-ticket-btn"
                onClick={() => setCompletedSale(null)}
                className="text-gray-400 hover:text-black transition-colors p-1 bg-gray-100 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Print Container: 80mm Thermal Style */}
            <div id="printable-ticket" className="flex-1 overflow-y-auto space-y-4 font-mono text-xs pr-1">
              <div className="text-center space-y-1">
                <div className="flex justify-center mb-1">
                  <BolFixLogo variant="icon" className="w-10 h-10 rounded-xl" />
                </div>
                <h3 className="text-base font-black tracking-tight uppercase">
                  {mockDb.getSettings().workshopName || 'BOL.FIX'}
                </h3>
                <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wide">
                  {mockDb.getSettings().workshopSlogan || 'Servicio Técnico & POS'}
                </p>
                <p className="text-[9px] text-gray-500">
                  {mockDb.getSettings().phone || 'Telf: (+591) 78945612'}
                </p>
                <p className="text-[10px] text-gray-700 font-bold border-t border-dashed border-gray-300 pt-1.5 mt-1.5 uppercase">
                  COMPROBANTE DE VENTA POS
                </p>
                <p className="text-xs font-black tracking-wide font-mono mt-0.5">
                  N° {completedSale.saleNumber}
                </p>
              </div>

              {/* Details block */}
              <div className="space-y-1 text-[10px] border-t border-b border-dashed border-gray-300 py-2">
                <div className="flex justify-between">
                  <span>Fecha:</span>
                  <span>{new Date(completedSale.date).toLocaleDateString('es-ES')} {new Date(completedSale.date).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cajero:</span>
                  <span>{completedSale.user}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span className="font-extrabold truncate max-w-[150px]">{completedSale.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Telf:</span>
                  <span>{completedSale.clientPhone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Método:</span>
                  <span className="font-bold">{completedSale.paymentMethod}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between font-bold border-b border-dashed border-gray-300 pb-1">
                  <span className="w-1/2">Descripción</span>
                  <span className="w-1/6 text-center">Cant</span>
                  <span className="w-1/3 text-right">Total</span>
                </div>
                {completedSale.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5 border-b border-dashed border-gray-100 pb-1">
                    <div className="flex justify-between leading-tight">
                      <span className="w-1/2 font-sans font-bold truncate">{item.name}</span>
                      <span className="w-1/6 text-center font-mono">{item.quantity}</span>
                      <span className="w-1/3 text-right font-mono font-bold">
                        Bs. {(item.price * item.quantity).toLocaleString('es-ES')}
                      </span>
                    </div>
                    {item.orderOt && (
                      <p className="text-[8px] text-gray-500 font-sans">
                        OT #{item.orderOt} · {item.orderEquipment}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Bs. {completedSale.subtotal.toLocaleString('es-ES')}</span>
                </div>
                {completedSale.discount > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>Descuento:</span>
                    <span>-Bs. {completedSale.discount.toLocaleString('es-ES')}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm border-t border-dashed border-gray-300 pt-1.5 mt-1">
                  <span>TOTAL PAGADO:</span>
                  <span>Bs. {completedSale.total.toLocaleString('es-ES')}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-3 border-t border-dashed border-gray-300 space-y-1">
                <p className="text-[8px] uppercase font-bold text-gray-600">¡Muchas Gracias por su Preferencia!</p>
                <p className="text-[7px] text-gray-400">Conserve este comprobante para cualquier garantía.</p>
              </div>
            </div>

            {/* Actions (hidden on print) */}
            <div className="flex flex-col gap-2 pt-4 border-t border-gray-150 mt-3 print:hidden">
              <button
                type="button"
                id="print-thermal-btn"
                onClick={() => window.print()}
                className="w-full py-3 bg-black hover:bg-gray-800 text-[#FACC15] rounded-xl font-black flex items-center justify-center space-x-2 text-xs cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4 text-[#FACC15]" />
                <span>Imprimir Ticket (Térmica 80mm)</span>
              </button>

              {completedSale.clientPhone && (
                <button
                  type="button"
                  onClick={() => {
                    const cleanPhone = completedSale.clientPhone.replace(/\D/g, '');
                    const text = encodeURIComponent(
                      `*COMPROBANTE DE VENTA POS - ${workshopSettings.workshopName || 'BOL.FIX'}*\n` +
                      `Comprobante N°: ${completedSale.saleNumber}\n` +
                      `Cliente: ${completedSale.clientName}\n` +
                      `Total Pagado: Bs. ${completedSale.total}\n` +
                      `Método: ${completedSale.paymentMethod}\n\n` +
                      `¡Gracias por su compra!`
                    );
                    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 text-xs cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Recibo por WhatsApp</span>
                </button>
              )}

              <button
                type="button"
                id="close-ticket-action-btn"
                onClick={() => setCompletedSale(null)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs cursor-pointer text-center"
              >
                Nueva Venta / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
