/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { mockDb } from '../db/mockDb';
import { Product, Sale, SaleItem, Client, User as SystemUser, WorkshopSettings } from '../types';

interface SalesViewProps {
  currentUser: SystemUser;
}

const COMMON_SERVICES = [
  { id: 'srv-1', name: 'Limpieza y Mantenimiento Físico', category: 'Servicio', price: 50 },
  { id: 'srv-2', name: 'Instalación de Software / Flash / Reset', category: 'Servicio', price: 70 },
  { id: 'srv-3', name: 'Cambio de Vidrio Protector Templado', category: 'Servicio', price: 30 },
  { id: 'srv-4', name: 'Diagnóstico Técnico Avanzado', category: 'Servicio', price: 40 },
  { id: 'srv-5', name: 'Instalación de Protector de Hidrogel', category: 'Servicio', price: 45 },
  { id: 'srv-6', name: 'Microsoldadura Básica / Cambio de Pin', category: 'Servicio', price: 120 }
];

export default function SalesView({ currentUser }: SalesViewProps) {
  // DB States
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  // Search & Filters
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
  const [showSalesSuggestions, setShowSalesSuggestions] = useState(true);

  // Cart State
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Efectivo');

  // Workshop Settings
  const [workshopSettings, setWorkshopSettings] = useState<WorkshopSettings>(() => mockDb.getSettings());

  const availablePaymentMethods = useMemo(() => {
    return workshopSettings.enabledPaymentMethods && workshopSettings.enabledPaymentMethods.length > 0
      ? workshopSettings.enabledPaymentMethods
      : ['Efectivo', 'Tarjeta', 'Transferencia', 'QR', 'Pago Móvil'];
  }, [workshopSettings.enabledPaymentMethods]);

  useEffect(() => {
    if (!availablePaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(availablePaymentMethods[0] || 'Efectivo');
    }
  }, [availablePaymentMethods]);

  // Print/Success Modal State
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Load Initial Data
  const loadData = () => {
    const allProducts = mockDb.getProducts().filter(p => p.status === 'Activo');
    setProducts(allProducts);

    const allClients = mockDb.getClients();
    setClients(allClients);

    const allSales = mockDb.getSales().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRecentSales(allSales);

    // Set "Público General" as default client on mount if available
    const pubGeneral = allClients.find(c => c.id === 'client-publico-general');
    if (pubGeneral) {
      setSelectedClient(pubGeneral);
      setClientSearch(pubGeneral.name);
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

  // Unique categories of products
  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  // Cart operations
  const addToCart = (item: { id: string; name: string; price: number; type: 'PRODUCT' | 'SERVICE'; stock?: number }) => {
    const existingIdx = cart.findIndex(c => c.type === item.type && c.referenceId === item.id);
    
    if (existingIdx !== -1) {
      const updatedCart = [...cart];
      const newQty = updatedCart[existingIdx].quantity + 1;
      
      // Stock check if product and negative stock is not allowed
      if (!workshopSettings.allowNegativeStock && item.type === 'PRODUCT' && item.stock !== undefined && newQty > item.stock) {
        alert(`No hay suficiente stock disponible. Stock máximo: ${item.stock}`);
        return;
      }
      
      updatedCart[existingIdx].quantity = newQty;
      setCart(updatedCart);
    } else {
      // Stock check for first item
      if (!workshopSettings.allowNegativeStock && item.type === 'PRODUCT' && item.stock !== undefined && item.stock <= 0) {
        alert('Este producto está agotado.');
        return;
      }
      
      setCart([
        ...cart,
        {
          type: item.type,
          referenceId: item.id,
          name: item.name,
          quantity: 1,
          price: item.price
        }
      ]);
    }
  };

  const updateCartQuantity = (index: number, delta: number) => {
    const updatedCart = [...cart];
    const item = updatedCart[index];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      updatedCart.splice(index, 1);
    } else {
      // Check stock if product
      if (!workshopSettings.allowNegativeStock && item.type === 'PRODUCT') {
        const prod = products.find(p => p.id === item.referenceId);
        if (prod && newQty > prod.stock) {
          alert(`No hay suficiente stock disponible. Stock máximo: ${prod.stock}`);
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

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - discount);

  // Client dropdown autocomplete list
  // Fix "Público General" to always appear at the top
  const filteredClientsForDropdown = (() => {
    const query = clientSearch.toLowerCase().trim();
    // Prioritize client-publico-general
    const pg = clients.find(c => c.id === 'client-publico-general');
    const others = clients.filter(c => c.id !== 'client-publico-general');

    const matches = others.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.phone.toLowerCase().includes(query)
    );

    // If query is empty, show pg at top, followed by other clients
    if (!query) {
      return pg ? [pg, ...others] : others;
    }

    // If there is query, show pg if it matches "publico" or similar, followed by matching others
    const pgMatches = pg && (pg.name.toLowerCase().includes(query) || pg.phone.toLowerCase().includes(query));
    return pgMatches ? [pg, ...matches] : matches;
  })();

  // Quick register client from sales screen
  const handleQuickClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientPhone.trim()) {
      alert('Nombre y teléfono son campos obligatorios');
      return;
    }

    const created = mockDb.getOrCreateClient(
      newClientName.trim(),
      newClientPhone.trim(),
      undefined,
      undefined,
      undefined
    );

    // Reload list and set as active client
    const updatedClients = mockDb.getClients();
    setClients(updatedClients);
    setSelectedClient(created);
    setClientSearch(created.name);
    
    // Clear & close
    setNewClientName('');
    setNewClientPhone('');
    setIsClientModalOpen(false);
  };

  // Live Matching Clients in Sales Quick Modal
  const matchingSalesClients = useMemo(() => {
    const rawQuery = newClientName.trim();
    if (!rawQuery || rawQuery.length < 2) return [];

    const normalize = (str: string) =>
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const normalizedQuery = normalize(rawQuery);

    return clients.filter(c => {
      const normName = normalize(c.name || '');
      return normName.includes(normalizedQuery);
    }).slice(0, 6);
  }, [clients, newClientName]);

  const handleSelectExistingFromSalesModal = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(client.name);
    setNewClientName('');
    setNewClientPhone('');
    setShowSalesSuggestions(false);
    setIsClientModalOpen(false);
  };

  // Complete Sale
  const handleCompleteSale = () => {
    if (cart.length === 0) {
      alert('El carrito está vacío.');
      return;
    }
    if (!selectedClient) {
      alert('Por favor seleccione un cliente o elija Público General.');
      return;
    }

    const salePayload = {
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientPhone: selectedClient.phone,
      items: cart,
      subtotal,
      discount,
      total,
      paymentMethod
    };

    try {
      const newSale = mockDb.createSale(salePayload, currentUser.name);
      setCompletedSale(newSale);
      
      // Auto-print ticket if enabled in workshop settings
      if (workshopSettings.autoPrintTicket) {
        setTimeout(() => {
          window.print();
        }, 500);
      }

      // Refresh database records on sales screen
      loadData();
      
      // Clear cart
      setCart([]);
      setDiscount(0);
      setPaymentMethod('Efectivo');
      
      // Keep selected client as Publico General for the next sale
      const pg = clients.find(c => c.id === 'client-publico-general');
      if (pg) {
        setSelectedClient(pg);
        setClientSearch(pg.name);
      } else {
        setSelectedClient(null);
        setClientSearch('');
      }
    } catch (err: any) {
      alert('Error al registrar la venta: ' + err.message);
    }
  };

  // Render filter items
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredServices = COMMON_SERVICES.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="sales-module-view" className="space-y-6 pb-12 animate-fade-in text-gray-900">
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-black text-[#FACC15] rounded-xl shadow-md">
            <ShoppingBag className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Módulo de Ventas</h1>
            <p className="text-xs text-gray-500">Caja / Facturación rápida de repuestos, accesorios y servicios</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] bg-[#FACC15]/15 text-yellow-800 border border-[#FACC15]/30 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Cajero: {currentUser.name}
          </span>
          <button
            onClick={loadData}
            className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            title="Recargar datos de inventario"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: CATALOG GRID (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            {/* Search and catalog tab selector */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  id="sales-catalog-search"
                  type="text"
                  placeholder="Buscar producto por nombre, código interno o barra..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#FACC15] font-semibold transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 font-bold text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Type Switch */}
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setSelectedType('ALL'); setSelectedCategory('Todos'); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all ${
                    selectedType === 'ALL' ? 'bg-black text-[#FACC15] shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Todo
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType('PRODUCTS')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all ${
                    selectedType === 'PRODUCTS' ? 'bg-black text-[#FACC15] shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Productos
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedType('SERVICES'); setSelectedCategory('Todos'); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all ${
                    selectedType === 'SERVICES' ? 'bg-black text-[#FACC15] shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Servicios
                </button>
              </div>
            </div>

            {/* Category horizontal scroller for Products */}
            {selectedType !== 'SERVICES' && (
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedType('PRODUCTS');
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border cursor-pointer ${
                      selectedCategory === cat && selectedType === 'PRODUCTS'
                        ? 'bg-black text-[#FACC15] border-black shadow-xs'
                        : 'bg-gray-50 text-gray-600 border-gray-150 hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* GRID OF PRODUCTS / SERVICES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 max-h-[580px] overflow-y-auto pr-1">
            {/* Products Listing */}
            {selectedType !== 'SERVICES' && filteredProducts.map((prod) => (
              <button
                key={prod.id}
                onClick={() => addToCart({ id: prod.id, name: prod.name, price: prod.salePrice, type: 'PRODUCT', stock: prod.stock })}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs hover:shadow-xs hover:border-gray-300 transition-all text-left flex flex-col justify-between group cursor-pointer relative overflow-hidden"
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[8px] font-black uppercase tracking-wider text-[#FACC15] bg-black px-1.5 py-0.5 rounded">
                      {prod.category}
                    </span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded font-mono ${
                      prod.stock <= 0 
                        ? 'bg-red-50 text-red-600 border border-red-100' 
                        : prod.stock <= prod.minStock 
                        ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {prod.stock <= 0 ? 'AGOTADO' : `Stock: ${prod.stock}`}
                    </span>
                  </div>
                  
                  <h3 className="text-xs font-extrabold text-gray-800 line-clamp-2 leading-snug group-hover:text-black transition-colors">
                    {prod.name}
                  </h3>
                  
                  <p className="text-[10px] text-gray-400 font-mono">
                    Cód: {prod.code}
                  </p>
                  
                  {prod.compatibleModel && (
                    <p className="text-[9px] text-gray-500 font-medium">
                      Comp: <span className="font-bold text-gray-700">{prod.compatibleModel}</span>
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-end border-t border-gray-100 pt-2.5 mt-3">
                  <div>
                    <span className="text-[8px] text-gray-400 block font-bold uppercase">Precio</span>
                    <span className="text-sm font-black text-gray-900 font-mono">
                      Bs. {prod.salePrice.toLocaleString('es-ES')}
                    </span>
                  </div>
                  <div className="w-7 h-7 bg-gray-50 border border-gray-150 rounded-lg flex items-center justify-center text-gray-600 group-hover:bg-black group-hover:text-[#FACC15] group-hover:border-black transition-all">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}

            {/* Services Listing */}
            {selectedType !== 'PRODUCTS' && filteredServices.map((srv) => (
              <button
                key={srv.id}
                onClick={() => addToCart({ id: srv.id, name: srv.name, price: srv.price, type: 'SERVICE' })}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs hover:shadow-xs hover:border-gray-300 transition-all text-left flex flex-col justify-between group cursor-pointer relative overflow-hidden"
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded">
                      Servicio Técnico
                    </span>
                    <span className="text-[8px] font-black text-gray-400 uppercase">Frecuente</span>
                  </div>
                  
                  <h3 className="text-xs font-extrabold text-gray-800 line-clamp-2 leading-snug group-hover:text-black transition-colors">
                    {srv.name}
                  </h3>
                  
                  <p className="text-[9px] text-gray-400 font-medium italic">
                    Servicio express inmediato en mesón
                  </p>
                </div>

                <div className="flex justify-between items-end border-t border-gray-100 pt-2.5 mt-3">
                  <div>
                    <span className="text-[8px] text-gray-400 block font-bold uppercase">Costo</span>
                    <span className="text-sm font-black text-purple-900 font-mono">
                      Bs. {srv.price.toLocaleString('es-ES')}
                    </span>
                  </div>
                  <div className="w-7 h-7 bg-gray-50 border border-gray-150 rounded-lg flex items-center justify-center text-gray-600 group-hover:bg-black group-hover:text-[#FACC15] group-hover:border-black transition-all">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}

            {/* Empty States */}
            {selectedType !== 'SERVICES' && filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white border border-gray-150 rounded-2xl">
                <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-400">No se encontraron productos que coincidan.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: POINT OF SALE CART & BILLING DETAILS (4-5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-150">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-4.5 h-4.5 text-black" />
                <h2 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Detalle del Carrito</h2>
              </div>
              <span className="text-[10px] font-extrabold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} Items
              </span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-400 italic space-y-1">
                  <ShoppingBag className="w-7 h-7 mx-auto text-gray-300" />
                  <p className="text-[10px] font-bold">El carrito de compras está vacío.</p>
                  <p className="text-[9px]">Haga clic en un producto o servicio del catálogo de la izquierda para agregarlo.</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50/50 p-2.5 rounded-xl border border-gray-150 shadow-2xs">
                    <div className="flex-1 min-w-0 pr-2">
                      <span className={`text-[8px] font-extrabold px-1 py-0.2 rounded uppercase ${
                        item.type === 'PRODUCT' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {item.type === 'PRODUCT' ? 'Repuesto' : 'Servicio'}
                      </span>
                      <h4 className="text-xs font-extrabold text-gray-800 truncate mt-0.5 leading-snug" title={item.name}>
                        {item.name}
                      </h4>
                      <p className="text-[10px] font-bold text-gray-500 font-mono">
                        Bs. {item.price.toLocaleString('es-ES')} c/u
                      </p>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      {/* Quantity Controls */}
                      <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(idx, -1)}
                          className="px-1.5 py-1 text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-extrabold text-gray-900 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(idx, 1)}
                          className="px-1.5 py-1 text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right min-w-[60px]">
                        <span className="text-xs font-black text-gray-900 font-mono">
                          Bs. {(item.price * item.quantity).toLocaleString('es-ES')}
                        </span>
                      </div>

                      {/* Trash Button */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(idx)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                        title="Quitar item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* BILLING SECTION: CLIENT AUTOCOMPLETE & ACCOUNTS */}
            <div className="space-y-3 pt-3 border-t border-gray-150">
              {/* Selected Client Overview / Search */}
              <div className="space-y-1.5 relative">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">Facturar a Nombre de:</label>
                  <button
                    type="button"
                    onClick={() => setIsClientModalOpen(true)}
                    className="text-[10px] font-bold text-yellow-600 hover:text-yellow-700 flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>+ Registrar Cliente</span>
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar cliente registrado..."
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setIsClientDropdownOpen(true);
                      // Clear selection if typing
                      if (selectedClient && e.target.value !== selectedClient.name) {
                        setSelectedClient(null);
                      }
                    }}
                    onFocus={() => setIsClientDropdownOpen(true)}
                    className="block w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FACC15] transition-all"
                  />
                  {clientSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setClientSearch('');
                        setSelectedClient(null);
                        setIsClientDropdownOpen(true);
                      }}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 font-bold text-xs"
                    >
                      ×
                    </button>
                  )}

                  {/* Combobox Dropdown */}
                  {isClientDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsClientDropdownOpen(false)}
                      ></div>
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-20 divide-y divide-gray-50 font-sans">
                        {filteredClientsForDropdown.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedClient(c);
                              setClientSearch(c.name);
                              setIsClientDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs flex justify-between items-center transition-colors ${
                              selectedClient?.id === c.id 
                                ? 'bg-[#FACC15]/10 font-bold' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div>
                              <p className="font-extrabold text-gray-800 flex items-center gap-1">
                                {c.id === 'client-publico-general' && <span className="text-[8px] bg-black text-[#FACC15] px-1 py-0.2 rounded font-sans mr-1">FIJADO</span>}
                                {c.name}
                              </p>
                              <p className="text-[10px] text-gray-500 font-medium">Telf: {c.phone}</p>
                            </div>
                            <span className="text-[9px] text-gray-400 font-mono uppercase">{c.id.substring(0, 8)}</span>
                          </button>
                        ))}
                        {filteredClientsForDropdown.length === 0 && (
                          <p className="p-3 text-xs text-gray-400 italic text-center">No se encontraron coincidencias.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">Método de Pago</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="block w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FACC15] transition-all cursor-pointer"
                  >
                    {availablePaymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* BILLING TOTALS */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 space-y-2 mt-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold">Subtotal:</span>
                <span className="font-bold text-gray-800 font-mono">
                  {workshopSettings.currencySymbol || 'Bs.'} {subtotal.toLocaleString('es-ES')}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  <span>Descuento Especial ({workshopSettings.currencySymbol || 'Bs.'}):</span>
                </span>
                {workshopSettings.allowDiscounts ? (
                  <div className="flex items-center space-x-1">
                    <input
                      id="sale-discount-input"
                      type="number"
                      min="0"
                      max={workshopSettings.maxDiscountPercentage > 0 ? (subtotal * workshopSettings.maxDiscountPercentage) / 100 : subtotal}
                      placeholder="0"
                      value={discount || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const maxVal = workshopSettings.maxDiscountPercentage > 0
                          ? (subtotal * workshopSettings.maxDiscountPercentage) / 100
                          : subtotal;
                        setDiscount(Math.min(maxVal, Math.max(0, val)));
                      }}
                      className="w-20 px-2 py-1 bg-white border border-gray-200 rounded-lg text-right text-xs font-bold font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
                    />
                    {workshopSettings.maxDiscountPercentage > 0 && (
                      <span className="text-[9px] text-gray-400 font-mono">máx {workshopSettings.maxDiscountPercentage}%</span>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-400 italic">Deshabilitado</span>
                )}
              </div>

              <div className="flex justify-between items-center border-t border-gray-200 pt-2.5 mt-2.5">
                <span className="text-xs font-black text-gray-900 uppercase">Total a Pagar:</span>
                <span className="text-lg font-black text-emerald-700 font-mono">
                  {workshopSettings.currencySymbol || 'Bs.'} {total.toLocaleString('es-ES')}
                </span>
              </div>
            </div>

            {/* ACTION BUTTON */}
            <button
              id="complete-sale-btn"
              type="button"
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || !selectedClient}
              className="w-full mt-4 bg-black hover:bg-gray-900 text-[#FACC15] disabled:bg-gray-200 disabled:text-gray-400 py-3.5 px-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-md text-sm disabled:shadow-none cursor-pointer"
            >
              <CheckCircle className="w-4.5 h-4.5" />
              <span>REGISTRAR Y EMITIR COMPROBANTE</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK CLIENT REGISTRATION MODAL */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={() => setIsClientModalOpen(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 z-10 p-6 animate-scale-up text-gray-900">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-yellow-500" />
                <span>Registrar Nuevo Cliente</span>
              </h3>
              <button onClick={() => setIsClientModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleQuickClientSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-gray-700 block">Nombre Completo *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ej. Andrés Cáceres Lozada"
                    value={newClientName}
                    onChange={(e) => {
                      setNewClientName(e.target.value);
                      setShowSalesSuggestions(true);
                    }}
                    onFocus={() => setShowSalesSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSalesSuggestions(false), 200)}
                    autoComplete="off"
                    className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#FACC15] transition-all font-semibold"
                  />

                  {/* Historial desplegable deslizado abajito de la línea - Solo muestra el nombre */}
                  {showSalesSuggestions && newClientName.trim().length >= 2 && matchingSalesClients.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-gray-100 max-h-48 overflow-y-auto">
                      {matchingSalesClients.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectExistingFromSalesModal(c);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-yellow-50 active:bg-yellow-100 text-xs font-semibold text-gray-800 transition-colors cursor-pointer flex items-center justify-between group"
                        >
                          <span className="truncate text-gray-900 group-hover:text-black">
                            {c.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Número de Celular *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 70912345"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#FACC15] transition-all font-semibold font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-black hover:bg-gray-800 text-[#FACC15] rounded-xl font-bold transition-all text-xs"
                >
                  Crear e Inserir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SALES COMPLETED TICKET OVERLAY */}
      {completedSale && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in text-[#111111]">
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-150 p-6 flex flex-col justify-between max-h-[90vh]">
            {/* Action panel at the top (hidden during print) */}
            <div className="flex justify-between items-center pb-3 border-b border-gray-150 mb-4 print:hidden">
              <span className="text-xs font-black text-gray-700 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Venta Registrada Exitosamente</span>
              </span>
              <button
                id="close-ticket-btn"
                onClick={() => setCompletedSale(null)}
                className="text-gray-400 hover:text-black transition-colors p-1 bg-gray-100 rounded-full"
                title="Cerrar ticket"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* PRINT CONTAINER START */}
            <div id="printable-ticket" className="flex-1 overflow-y-auto space-y-4 font-mono text-xs pr-1">
              {/* Receipt Header */}
              <div className="text-center space-y-1">
                <div className="flex justify-center mb-1">
                  <BolFixLogo variant="icon" className="w-10 h-10 rounded-xl" />
                </div>
                <h3 className="text-base font-black tracking-tight text-center uppercase">
                  {mockDb.getSettings().workshopName || 'BOL.FIX'}
                </h3>
                <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wide">
                  {mockDb.getSettings().workshopSlogan || 'By: Mauro Medina'}
                </p>
                <p className="text-[9px] text-gray-400">
                  {mockDb.getSettings().phone || 'Telf: (+591) 78945612'}
                </p>
                <p className="text-[10px] text-gray-600 font-bold border-t border-dashed border-gray-300 pt-1.5 mt-1.5">
                  COMPROBANTE DE COMPRA
                </p>
                <p className="text-[11px] font-black tracking-wide font-mono mt-0.5 text-center">
                  N° {completedSale.saleNumber}
                </p>
              </div>

              {/* Receipt Details Block */}
              <div className="space-y-1.5 text-[10px] border-t border-b border-dashed border-gray-300 py-2 font-mono">
                <div className="flex justify-between">
                  <span>Fecha:</span>
                  <span>{new Date(completedSale.date).toLocaleDateString('es-ES')} {new Date(completedSale.date).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="flex justify-between">
                  <span>Atendido por:</span>
                  <span>{completedSale.user}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span className="font-extrabold truncate max-w-[150px]">{completedSale.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Telf:</span>
                  <span>{completedSale.clientPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Método de Pago:</span>
                  <span className="font-bold">{completedSale.paymentMethod}</span>
                </div>
              </div>

              {/* Receipt Items list */}
              <div className="space-y-1 text-[10px] font-mono">
                <div className="flex justify-between font-bold border-b border-dashed border-gray-200 pb-1 mb-1">
                  <span className="w-1/2">Descripción</span>
                  <span className="w-1/6 text-center">Cant</span>
                  <span className="w-1/3 text-right">Monto</span>
                </div>
                {completedSale.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-[9px] leading-relaxed">
                    <span className="w-1/2 truncate font-sans">{item.name}</span>
                    <span className="w-1/6 text-center font-mono">{item.quantity}</span>
                    <span className="w-1/3 text-right font-mono">Bs. {(item.price * item.quantity).toLocaleString('es-ES')}</span>
                  </div>
                ))}
              </div>

              {/* Receipt Totals */}
              <div className="border-t border-dashed border-gray-300 pt-2 mt-2 space-y-1 text-[10px] font-mono">
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
                <div className="flex justify-between font-black text-xs border-t border-dashed border-gray-200 pt-1.5 mt-1">
                  <span>TOTAL PAGADO:</span>
                  <span>Bs. {completedSale.total.toLocaleString('es-ES')}</span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="text-center pt-4 border-t border-dashed border-gray-300 space-y-1">
                <p className="text-[8px] uppercase font-bold text-gray-500">¡Gracias por su Preferencia!</p>
                <p className="text-[7px] text-gray-400">Garantía válida según términos comerciales.</p>
                <p className="text-[7px] text-gray-400 font-sans">Sistema desarrollado por Arq. Software</p>
              </div>
            </div>
            {/* PRINT CONTAINER END */}

            {/* Actions overlay buttons (hidden during print) */}
            <div className="flex gap-3 pt-4 border-t border-gray-150 mt-4 print:hidden">
              <button
                id="print-thermal-btn"
                onClick={() => window.print()}
                className="flex-1 py-3 bg-black hover:bg-gray-900 text-[#FACC15] rounded-xl font-bold flex items-center justify-center space-x-1.5 text-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>
              
              <button
                id="close-ticket-action-btn"
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs cursor-pointer text-center"
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
