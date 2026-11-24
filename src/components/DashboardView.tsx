/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Wrench, 
  CheckCircle, 
  Truck, 
  DollarSign, 
  ClipboardList, 
  Plus, 
  ArrowRight, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { Order, DashboardStats, OrderStatus, User } from '../types';
import { mockDb } from '../db/mockDb';

interface DashboardViewProps {
  currentUser: User;
  onNavigateToTab: (tab: string, filter?: string) => void;
  onSelectOrder: (orderId: string) => void;
}

export default function DashboardView({ currentUser, onNavigateToTab, onSelectOrder }: DashboardViewProps) {
  const [stats, setStats] = useState<DashboardStats>({
    receivedToday: 0,
    inRepair: 0,
    ready: 0,
    delivered: 0,
    dailyRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Load fresh data
    const currentStats = mockDb.getStats();
    setStats(currentStats);

    const orders = mockDb.getOrders();
    // Sort by date descending and get latest 5
    const sorted = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setRecentOrders(sorted.slice(0, 5));
  }, []);

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
      case 'ESPERANDO_REPUESTO': return 'Esperando Repuesto';
      case 'REPARANDO': return 'Reparando';
      case 'LISTO': return 'Listo';
      case 'ENTREGADO': return 'Entregado';
    }
  };

  return (
    <div id="dashboard-view" className="space-y-5 pb-12 animate-fade-in">
      
      {/* Welcome Hero / Command Banner */}
      <div className="apk-dark-panel apk-chamfer text-white p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between min-h-[152px]">
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-6 opacity-[0.07] pointer-events-none">
          <Smartphone className="w-44 h-44 text-[#FACC15]" />
        </div>
        
        <div className="relative z-10 flex justify-between items-start gap-3">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-[10px] font-display uppercase font-bold tracking-[0.16em] text-[#FACC15]">
              <Sparkles className="w-3 h-3" />
              <span>TALLER ACTIVO</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold mt-1.5 tracking-tight text-white">
              Hola, {currentUser.name}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5 font-medium">
              Rol: {currentUser.role === 'ADMIN' ? 'Administrador' : currentUser.role === 'RECEPTIONIST' ? 'Recepción' : 'Técnico Especialista'}
            </p>
          </div>
          <div className="text-right text-xs text-zinc-400 bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded-xl shrink-0">
            <span className="block font-display font-bold text-white uppercase text-[11px] tracking-wider">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long' })}
            </span>
            <span className="font-mono text-[11px] text-zinc-400">
              {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-white/10">
          <div>
            <span className="text-zinc-400 block text-[10px] font-display uppercase font-bold tracking-[0.14em]">
              Ingresos del día
            </span>
            <span className="text-xl sm:text-2xl font-mono font-bold text-[#FACC15] tabular-nums tracking-tight block mt-0.5">
              Bs. {stats.dailyRevenue.toLocaleString('es-ES')}
            </span>
          </div>
          <div className="border-l border-white/10 pl-4">
            <span className="text-zinc-400 block text-[10px] font-display uppercase font-bold tracking-[0.14em]">
              Recibidos hoy
            </span>
            <span className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums tracking-tight block mt-0.5">
              {stats.receivedToday} <span className="text-xs font-sans font-semibold text-zinc-400">equipos</span>
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <button
          type="button"
          onClick={() => onNavigateToTab('reparaciones', 'HOY')}
          className="text-left apk-card-interactive p-4 flex flex-col justify-between min-h-[116px] cursor-pointer group"
        >
          <div className="flex justify-between items-start w-full">
            <span className="font-display text-[11px] font-bold text-zinc-500 uppercase tracking-[0.1em]">Hoy</span>
            <div className="w-8 h-8 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-mono font-bold text-[#111111] tabular-nums tracking-tight leading-none">{stats.receivedToday}</h3>
            <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center justify-between font-medium">
              <span className="truncate">Equipos recibidos hoy</span>
              <span className="text-xs font-mono font-bold text-[#111111] bg-[#FACC15]/30 px-1.5 py-0.5 rounded-md group-hover:translate-x-0.5 transition-transform ml-1">→</span>
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToTab('reparaciones', 'EN_REPARACION')}
          className="text-left apk-card-interactive p-4 flex flex-col justify-between min-h-[116px] cursor-pointer group"
        >
          <div className="flex justify-between items-start w-full">
            <span className="font-display text-[11px] font-bold text-zinc-500 uppercase tracking-[0.1em]">En Reparación</span>
            <div className="w-8 h-8 bg-purple-50 text-purple-600 border border-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-mono font-bold text-[#111111] tabular-nums tracking-tight leading-none">{stats.inRepair}</h3>
            <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center justify-between font-medium">
              <span className="truncate">Diagnóstico / reparación</span>
              <span className="text-xs font-mono font-bold text-[#111111] bg-[#FACC15]/30 px-1.5 py-0.5 rounded-md group-hover:translate-x-0.5 transition-transform ml-1">→</span>
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToTab('reparaciones', 'LISTO')}
          className="text-left apk-card-interactive p-4 flex flex-col justify-between min-h-[116px] cursor-pointer group"
        >
          <div className="flex justify-between items-start w-full">
            <span className="font-display text-[11px] font-bold text-zinc-500 uppercase tracking-[0.1em]">Listos</span>
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-mono font-bold text-[#111111] tabular-nums tracking-tight leading-none">{stats.ready}</h3>
            <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center justify-between font-medium">
              <span className="truncate">Esperando retiro</span>
              <span className="text-xs font-mono font-bold text-[#111111] bg-[#FACC15]/30 px-1.5 py-0.5 rounded-md group-hover:translate-x-0.5 transition-transform ml-1">→</span>
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToTab('reparaciones', 'ENTREGADO')}
          className="text-left apk-card-interactive p-4 flex flex-col justify-between min-h-[116px] cursor-pointer group"
        >
          <div className="flex justify-between items-start w-full">
            <span className="font-display text-[11px] font-bold text-zinc-500 uppercase tracking-[0.1em]">Entregados</span>
            <div className="w-8 h-8 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-xl flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-mono font-bold text-[#111111] tabular-nums tracking-tight leading-none">{stats.delivered}</h3>
            <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center justify-between font-medium">
              <span className="truncate">Historial del mes</span>
              <span className="text-xs font-mono font-bold text-[#111111] bg-[#FACC15]/30 px-1.5 py-0.5 rounded-md group-hover:translate-x-0.5 transition-transform ml-1">→</span>
            </p>
          </div>
        </button>

      </div>

      {/* Quick single-handed triggers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {(currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST') && (
          <button
            id="quick-reception-btn"
            onClick={() => onNavigateToTab('recepcion')}
            className="flex items-center justify-between px-4 py-3.5 min-h-[58px] bg-[#FACC15] hover:bg-[#fde047] text-[#111111] apk-chamfer-sm font-display font-bold uppercase tracking-wider shadow-[0_6px_20px_-6px_rgba(250,204,21,0.55)] active:scale-[0.985] transition-all text-sm group cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-[#111111] text-[#FACC15] rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <span>Recepción Rápida</span>
            </div>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-[#111111]" />
          </button>
        )}

        <button
          id="quick-list-btn"
          onClick={() => onNavigateToTab('reparaciones')}
          className="flex items-center justify-between px-4 py-3.5 min-h-[58px] bg-white hover:bg-zinc-50 text-[#111111] border border-zinc-200/90 hover:border-[#111111] apk-chamfer-sm font-display font-bold uppercase tracking-wider shadow-xs active:scale-[0.985] transition-all text-sm group cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-zinc-100 border border-zinc-200 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-[#111111]" />
            </div>
            <span>Ver Reparaciones</span>
          </div>
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-[#111111]" />
        </button>
      </div>

      {/* Recent Orders List Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-4 bg-[#FACC15] rounded-xs" />
            <h4 className="font-display text-sm font-bold text-[#111111] uppercase tracking-[0.12em]">Últimas Órdenes</h4>
          </div>
          <button
            id="view-all-orders"
            onClick={() => onNavigateToTab('reparaciones')}
            className="font-display text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-[#111111] transition-colors cursor-pointer"
          >
            Ver todas →
          </button>
        </div>

        <div className="space-y-2.5">
          {recentOrders.length === 0 ? (
            <div className="p-8 apk-card text-center">
              <p className="text-xs text-zinc-400 font-medium">No se registran órdenes recientes.</p>
            </div>
          ) : (
            recentOrders.map((order) => (
              <div
                id={`recent-order-card-${order.id}`}
                key={order.id}
                onClick={() => onSelectOrder(order.id)}
                className="apk-card-interactive p-3.5 sm:p-4 cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-11 h-11 bg-[#F2F3F5] rounded-xl flex items-center justify-center border border-zinc-200/80 flex-shrink-0 group-hover:bg-[#111111] group-hover:border-[#111111] transition-all">
                    <Smartphone className="w-5 h-5 text-zinc-600 group-hover:text-[#FACC15] transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-[#111111] tabular-nums">{order.otNumber}</span>
                      <span className="text-[10px] font-mono text-zinc-400">· {new Date(order.createdAt).toLocaleDateString('es-ES')}</span>
                    </div>
                    <p className="font-display text-sm font-bold text-[#111111] truncate mt-0.5">{order.brand} {order.model}</p>
                    <p className="text-xs text-zinc-500 truncate font-medium">{order.clientName}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 flex-shrink-0 ml-3">
                  <span className={`apk-tech-tag border ${getStatusBadgeStyles(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-[#111111] transform group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
