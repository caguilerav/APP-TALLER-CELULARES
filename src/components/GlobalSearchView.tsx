/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  User, 
  Smartphone, 
  ClipboardList, 
  Package, 
  ShoppingBag, 
  ArrowRight,
  Sparkles,
  SearchIcon
} from 'lucide-react';
import { mockDb } from '../db/mockDb';
import { Order, Product, Sale, Client } from '../types';

interface GlobalSearchViewProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (orderId: string) => void;
  onSelectTab: (tab: string) => void;
  onOpenSaleTicket: (sale: Sale) => void;
}

export default function GlobalSearchView({ 
  isOpen, 
  onClose, 
  onSelectOrder, 
  onSelectTab,
  onOpenSaleTicket
}: GlobalSearchViewProps) {
  const [query, setQuery] = useState('');
  
  // Data pools
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    if (isOpen) {
      setOrders(mockDb.getOrders());
      setProducts(mockDb.getProducts());
      setSales(mockDb.getSales());
      setClients(mockDb.getClients());
      setQuery(''); // Reset query on open
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const searchQuery = query.trim().toLowerCase();

  // 1. Filter Orders (by OT number, client name, phone, device brand, model, IMEI)
  const filteredOrders = searchQuery.length >= 2 
    ? orders.filter(o => 
        o.otNumber.toLowerCase().includes(searchQuery) ||
        o.clientName.toLowerCase().includes(searchQuery) ||
        o.clientPhone.toLowerCase().includes(searchQuery) ||
        o.brand.toLowerCase().includes(searchQuery) ||
        o.model.toLowerCase().includes(searchQuery) ||
        (o.imei && o.imei.toLowerCase().includes(searchQuery))
      ).slice(0, 5)
    : [];

  // 2. Filter Clients (by name, phone)
  const filteredClients = searchQuery.length >= 2
    ? clients.filter(c => 
        c.name.toLowerCase().includes(searchQuery) ||
        c.phone.toLowerCase().includes(searchQuery)
      ).slice(0, 5)
    : [];

  // 3. Filter Products (by name, internal code, barcode, compatible model)
  const filteredProducts = searchQuery.length >= 2
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery) ||
        p.code.toLowerCase().includes(searchQuery) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchQuery)) ||
        (p.compatibleModel && p.compatibleModel.toLowerCase().includes(searchQuery))
      ).slice(0, 5)
    : [];

  // 4. Filter Sales (by sale number, client name, item name)
  const filteredSales = searchQuery.length >= 2
    ? sales.filter(s => 
        s.saleNumber.toLowerCase().includes(searchQuery) ||
        s.clientName.toLowerCase().includes(searchQuery) ||
        s.items.some(item => item.name.toLowerCase().includes(searchQuery))
      ).slice(0, 5)
    : [];

  const totalResultsCount = filteredOrders.length + filteredClients.length + filteredProducts.length + filteredSales.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-28 text-gray-900 font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity cursor-default"
        onClick={onClose}
      ></div>

      {/* Spotlight Search Panel */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 z-10 flex flex-col transform transition-all animate-scale-up max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-150 bg-gray-50/50">
          <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Buscar por cliente, N° OT, modelo de celular, IMEI, repuesto o venta..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-bold text-gray-900 focus:outline-none placeholder-gray-400"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full w-5 h-5 flex items-center justify-center font-bold mr-2 transition-colors"
            >
              ×
            </button>
          )}
          <button 
            onClick={onClose}
            className="text-xs font-bold text-gray-400 hover:text-black transition-colors px-2 py-1 bg-white border border-gray-200 rounded-lg shadow-2xs"
          >
            Cerrar [ESC]
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {searchQuery.length < 2 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <SearchIcon className="w-10 h-10 text-gray-200 mx-auto" />
              <p className="text-xs font-bold uppercase tracking-wider">Buscador Inteligente del Sistema</p>
              <p className="text-[11px] max-w-md mx-auto leading-relaxed">
                Escribe al menos <strong className="text-gray-600">2 caracteres</strong> para buscar de forma global. El buscador rastrea órdenes de trabajo, repuestos en inventario, clientes, ventas y números IMEI.
              </p>
            </div>
          ) : totalResultsCount === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-1">
              <p className="text-xs font-bold text-gray-700">No se encontraron resultados para "{query}"</p>
              <p className="text-[10px]">Prueba con otra palabra clave, número de teléfono o código de barras.</p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Category 1: Órdenes de Trabajo (OT) */}
              {filteredOrders.length > 0 && (
                <div className="space-y-1.5 animate-fade-in">
                  <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-2">Órdenes de Trabajo ({filteredOrders.length})</h4>
                  <div className="space-y-1">
                    {filteredOrders.map(order => (
                      <button
                        key={order.id}
                        onClick={() => {
                          onSelectOrder(order.id);
                          onClose();
                        }}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-yellow-500/10 rounded-xl flex justify-between items-center group transition-all border border-transparent hover:border-[#FACC15]/30 cursor-pointer"
                      >
                        <div className="flex items-start space-x-3 min-w-0">
                          <div className="p-2 bg-black text-[#FACC15] rounded-xl flex-shrink-0">
                            <ClipboardList className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                              <span>Orden {order.otNumber}</span>
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                                order.status === 'RECIBIDO' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'LISTO' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status}
                              </span>
                            </p>
                            <p className="text-[11px] text-gray-600 font-medium">
                              {order.brand} {order.model} • <span className="font-extrabold">{order.clientName}</span>
                            </p>
                            {order.imei && (
                              <p className="text-[9px] text-gray-400 font-mono mt-0.5">IMEI: {order.imei}</p>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 2: Productos e Inventario */}
              {filteredProducts.length > 0 && (
                <div className="space-y-1.5 animate-fade-in">
                  <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-2">Productos en Inventario ({filteredProducts.length})</h4>
                  <div className="space-y-1">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectTab('inventario');
                          onClose();
                        }}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-yellow-500/10 rounded-xl flex justify-between items-center group transition-all border border-transparent hover:border-[#FACC15]/30 cursor-pointer"
                      >
                        <div className="flex items-start space-x-3 min-w-0">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-gray-900">{p.name}</p>
                            <p className="text-[10px] text-gray-500 font-medium">
                              Cód: <span className="font-mono font-bold">{p.code}</span> | Categoría: {p.category}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              Stock: <span className={`font-bold ${p.stock <= p.minStock ? 'text-red-600' : 'text-gray-700'}`}>{p.stock} uds</span> • Precio: Bs. {p.salePrice.toLocaleString('es-ES')}
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] text-blue-600 font-extrabold uppercase bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">Ir a Inventario</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 3: Ventas & Facturación */}
              {filteredSales.length > 0 && (
                <div className="space-y-1.5 animate-fade-in">
                  <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-2">Ventas & Caja ({filteredSales.length})</h4>
                  <div className="space-y-1">
                    {filteredSales.map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          onOpenSaleTicket(s);
                          onClose();
                        }}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-yellow-500/10 rounded-xl flex justify-between items-center group transition-all border border-transparent hover:border-[#FACC15]/30 cursor-pointer"
                      >
                        <div className="flex items-start space-x-3 min-w-0">
                          <div className="p-2 bg-purple-50 text-purple-600 rounded-xl flex-shrink-0">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-gray-900">Venta {s.saleNumber}</p>
                            <p className="text-[11px] text-gray-600 font-medium">
                              Cliente: <span className="font-extrabold">{s.clientName}</span> • Pago: {s.paymentMethod}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              Monto: <span className="font-mono font-bold text-purple-900">Bs. {s.total.toLocaleString('es-ES')}</span> • Items: {s.items.length}
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] text-purple-600 font-extrabold uppercase bg-purple-50 border border-purple-100 px-2 py-0.5 rounded">Ver Ticket</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 4: Clientes Registrados */}
              {filteredClients.length > 0 && (
                <div className="space-y-1.5 animate-fade-in">
                  <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-2">Clientes Registrados ({filteredClients.length})</h4>
                  <div className="space-y-1">
                    {filteredClients.map(c => (
                      <div
                        key={c.id}
                        className="p-3 bg-gray-50 rounded-xl flex justify-between items-center border border-transparent"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="p-2 bg-gray-100 text-gray-600 rounded-xl flex-shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-gray-900">{c.name}</p>
                            <p className="text-[10px] text-gray-500 font-mono font-semibold">Celular: {c.phone}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-extrabold text-gray-400 uppercase bg-gray-200 px-2 py-0.5 rounded font-mono">{c.id.substring(0,8)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-150 text-[10px] text-gray-400 text-center font-semibold">
          Consejo: Escribe una marca o IMEI para localizar rápidamente un dispositivo en reparación.
        </div>
      </div>
    </div>
  );
}
