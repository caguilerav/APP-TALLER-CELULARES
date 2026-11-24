/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  Smartphone, 
  ChevronRight, 
  Calendar, 
  Wrench, 
  CheckCircle,
  Truck,
  Timer,
  RefreshCw
} from 'lucide-react';
import { mockDb } from '../db/mockDb';
import { Order, OrderStatus } from '../types';

interface OrderListViewProps {
  onSelectOrder: (orderId: string) => void;
  // Trigger list refresh when needed
  refreshTrigger?: number;
  initialFilter?: string;
}

export default function OrderListView({ onSelectOrder, refreshTrigger = 0, initialFilter = 'ALL' }: OrderListViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [sortBy, setSortBy] = useState<string>('newest'); // 'newest' | 'oldest' | 'cost_high' | 'cost_low'
  const [showFilters, setShowFilters] = useState(initialFilter !== 'ALL');

  useEffect(() => {
    // Load fresh orders from database
    const allOrders = mockDb.getOrders();
    setOrders(allOrders);
  }, [refreshTrigger]);

  useEffect(() => {
    setStatusFilter(initialFilter);
    if (initialFilter !== 'ALL') {
      setShowFilters(true);
    }
  }, [initialFilter]);

  const getStatusBadgeStyles = (status: OrderStatus) => {
    switch (status) {
      case 'RECIBIDO':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'DIAGNOSTICO':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'ESPERANDO_REPUESTO':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'REPARANDO':
        return 'bg-[#FACC15]/15 text-yellow-800 border-[#FACC15]/30';
      case 'LISTO':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'ENTREGADO':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-100';
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

  const getFilterLabel = (filter: string) => {
    switch (filter) {
      case 'ALL': return 'Todos';
      case 'HOY': return 'Hoy (Recibidos)';
      case 'EN_REPARACION': return 'En Reparación';
      case 'RECIBIDO': return 'Recibido';
      case 'DIAGNOSTICO': return 'Diagnóstico';
      case 'ESPERANDO_REPUESTO': return 'Esperando repuesto';
      case 'REPARANDO': return 'Reparando';
      case 'LISTO': return 'Listo';
      case 'ENTREGADO': return 'Entregado';
      default: return filter;
    }
  };

  // Filter & Sort Logic
  const filteredOrders = orders
    .filter(order => {
      // 1. Search Query
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        order.otNumber.toLowerCase().includes(query) ||
        order.clientName.toLowerCase().includes(query) ||
        order.clientPhone.toLowerCase().includes(query) ||
        order.brand.toLowerCase().includes(query) ||
        order.model.toLowerCase().includes(query) ||
        (order.imei && order.imei.toLowerCase().includes(query));
      
      // 2. Status Filter
      let matchesStatus = false;
      if (statusFilter === 'ALL') {
        matchesStatus = true;
      } else if (statusFilter === 'HOY') {
        const startOfToday = new Date();
        startOfToday.setHours(0,0,0,0);
        matchesStatus = new Date(order.createdAt) >= startOfToday;
      } else if (statusFilter === 'EN_REPARACION') {
        matchesStatus = 
          order.status === 'DIAGNOSTICO' || 
          order.status === 'ESPERANDO_REPUESTO' || 
          order.status === 'REPARANDO';
      } else {
        matchesStatus = order.status === statusFilter;
      }

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'cost_high':
          return b.estimatedCost - a.estimatedCost;
        case 'cost_low':
          return a.estimatedCost - b.estimatedCost;
        default:
          return 0;
      }
    });

  const getStatusCount = (status: string) => {
    if (status === 'ALL') return orders.length;
    if (status === 'HOY') {
      const startOfToday = new Date();
      startOfToday.setHours(0,0,0,0);
      return orders.filter(o => new Date(o.createdAt) >= startOfToday).length;
    }
    if (status === 'EN_REPARACION') {
      return orders.filter(o => 
        o.status === 'DIAGNOSTICO' || 
        o.status === 'ESPERANDO_REPUESTO' || 
        o.status === 'REPARANDO'
      ).length;
    }
    return orders.filter(o => o.status === status).length;
  };

  return (
    <div id="order-list-view" className="space-y-4 pb-12 animate-fade-in">
      
      {/* Header section */}
      <div className="apk-dark-panel apk-chamfer-tr text-white p-4 sm:p-5 flex justify-between items-center gap-3">
        <div>
          <span className="text-[10px] font-display uppercase tracking-[0.16em] text-[#FACC15] font-bold block">
            ÓRDENES DE SERVICIO
          </span>
          <h1 className="font-display text-lg sm:text-xl font-bold text-white tracking-tight uppercase mt-0.5">
            Lista de Reparaciones
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">Monitorea y actualiza todas las órdenes de servicio</p>
        </div>
        <button
          id="refresh-list-btn"
          onClick={() => setOrders(mockDb.getOrders())}
          className="w-10 h-10 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 rounded-xl text-zinc-300 hover:text-[#FACC15] flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
          title="Refrescar lista"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="space-y-3">
        <div className="flex space-x-2">
          {/* Search box */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400" />
            </span>
            <input
              id="search-orders-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por OT, cliente, modelo, IMEI..."
              className="apk-input block w-full pl-10 pr-4 py-3 text-xs font-medium min-h-[46px]"
            />
          </div>

          {/* Toggle advance filters */}
          <button
            id="toggle-filters-btn"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 min-h-[46px] apk-chamfer-sm border text-xs font-display font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer active:scale-95 ${
              showFilters || statusFilter !== 'ALL' || sortBy !== 'newest'
                ? 'bg-[#111111] text-[#FACC15] border-[#111111]'
                : 'bg-white text-zinc-700 border-zinc-200 hover:border-[#111111]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>

        {/* Active filter feedback chip */}
        {statusFilter !== 'ALL' && (
          <div className="flex items-center space-x-2 bg-[#111111] text-white border border-[#FACC15]/40 px-3 py-1.5 rounded-lg w-max animate-fade-in">
            <span className="text-[11px] font-medium text-zinc-300">
              Filtrado por: <span className="font-display font-bold text-[#FACC15] uppercase tracking-wider">{getFilterLabel(statusFilter)}</span>
            </span>
            <button
              id="clear-filter-pill-btn"
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className="text-[#FACC15] hover:text-white font-mono font-bold text-xs px-1.5 hover:bg-white/10 rounded transition-colors cursor-pointer"
              title="Quitar filtro"
            >
              ×
            </button>
          </div>
        )}

        {/* Expandable Advanced Filters Box */}
        {showFilters && (
          <div className="apk-card p-4 space-y-4 animate-fade-in">
            {/* Status quick select */}
            <div className="space-y-2">
              <label className="font-display text-[10px] uppercase font-bold text-zinc-500 tracking-[0.14em] block">
                Estado de Reparación
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'HOY', 'EN_REPARACION', 'RECIBIDO', 'DIAGNOSTICO', 'ESPERANDO_REPUESTO', 'REPARANDO', 'LISTO', 'ENTREGADO'].map((status) => (
                  <button
                    id={`filter-status-${status.toLowerCase()}`}
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-2 rounded-lg text-[11px] font-display font-bold uppercase tracking-wide border transition-all cursor-pointer flex items-center space-x-1.5 ${
                      statusFilter === status
                        ? 'bg-[#111111] text-white border-[#111111]'
                        : 'bg-[#F6F7F9] text-zinc-600 border-zinc-200/80 hover:border-zinc-400'
                    }`}
                  >
                    <span>{getFilterLabel(status)}</span>
                    <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold tabular-nums ${
                      statusFilter === status ? 'bg-[#FACC15] text-[#111111]' : 'bg-zinc-200/80 text-zinc-700'
                    }`}>
                      {getStatusCount(status)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sorting options */}
            <div className="space-y-2 pt-3 border-t border-zinc-100">
              <label className="font-display text-[10px] uppercase font-bold text-zinc-500 tracking-[0.14em] block">
                Ordenar Resultados
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 'newest', label: 'Más recientes' },
                  { value: 'oldest', label: 'Más antiguos' },
                  { value: 'cost_high', label: 'Mayor costo' },
                  { value: 'cost_low', label: 'Menor costo' }
                ].map((option) => (
                  <button
                    id={`sort-by-${option.value}`}
                    key={option.value}
                    type="button"
                    onClick={() => setSortBy(option.value)}
                    className={`py-2 px-3 rounded-lg border text-xs font-display font-bold uppercase tracking-wide transition-all cursor-pointer text-center ${
                      sortBy === option.value
                        ? 'bg-[#FACC15] text-[#111111] border-[#FACC15]'
                        : 'bg-[#F6F7F9] text-zinc-600 border-zinc-200/80 hover:border-zinc-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ORDERS LIST CONTAINER */}
      <div className="space-y-2.5">
        {filteredOrders.length === 0 ? (
          <div className="p-12 apk-card text-center space-y-2">
            <p className="font-display text-sm font-bold text-zinc-700 uppercase tracking-wide">No se encontraron reparaciones</p>
            <p className="text-xs text-zinc-400">Intenta cambiar la búsqueda o desactivar los filtros activos.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              id={`order-list-item-${order.id}`}
              key={order.id}
              onClick={() => onSelectOrder(order.id)}
              className="apk-card-interactive p-3.5 sm:p-4 cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                {/* Visual smartphone container icon */}
                <div className="w-11 h-11 bg-[#F2F3F5] rounded-xl flex items-center justify-center border border-zinc-200/80 group-hover:bg-[#111111] group-hover:border-[#111111] transition-all flex-shrink-0">
                  <Smartphone className="w-5 h-5 text-zinc-600 group-hover:text-[#FACC15] transition-colors" />
                </div>

                <div className="min-w-0">
                  {/* Row with OT and date */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-[#111111] tabular-nums">{order.otNumber}</span>
                    <span className="text-[10px] font-mono text-zinc-400">· {new Date(order.createdAt).toLocaleDateString('es-ES')}</span>
                  </div>

                  {/* Brand and model */}
                  <p className="font-display text-sm font-bold text-[#111111] truncate mt-0.5">
                    {order.brand} {order.model}
                  </p>

                  {/* Client & Tech footer */}
                  <div className="flex flex-wrap items-center text-[11px] text-zinc-500 mt-0.5 gap-x-2 gap-y-0.5">
                    <span className="font-semibold text-zinc-700">{order.clientName}</span>
                    {order.assignedTechnicianName && (
                      <>
                        <span className="text-zinc-300">·</span>
                        <span className="text-zinc-500 flex items-center">
                          <Wrench className="w-3 h-3 mr-1 text-zinc-400" />
                          {order.assignedTechnicianName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status and price right rail */}
              <div className="flex items-center space-x-3 flex-shrink-0 ml-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-[#111111] font-mono tabular-nums">Bs. {order.estimatedCost.toLocaleString('es-ES')}</p>
                  <p className="font-display text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                    {order.advancePayment >= order.estimatedCost ? 'Saldado' : order.advancePayment > 0 ? 'Con Seña' : 'Pendiente'}
                  </p>
                </div>
                
                <span className={`apk-tech-tag border ${getStatusBadgeStyles(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>

                <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-[#111111] transform group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
