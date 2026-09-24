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
    <div id="dashboard-view" className="space-y-6 pb-12 animate-fade-in">
      
      {/* Welcome Hero / Quick Banner */}
      <div className="bg-[#111111] text-white p-6 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[140px]">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-6 opacity-10">
          <Smartphone className="w-48 h-48 text-[#FACC15]" />
        </div>
        
        <div className="flex justify-between items-start">
          <div>
            <span className="bg-[#FACC15]/20 text-[#FACC15] text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border border-[#FACC15]/30 flex items-center space-x-1 w-max">
              <Sparkles className="w-3 h-3 mr-1" />
              <span>Taller Activo</span>
            </span>
            <h2 className="text-xl font-bold mt-2 tracking-tight">Hola, {currentUser.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Rol: {currentUser.role === 'ADMIN' ? 'Administrador' : currentUser.role === 'RECEPTIONIST' ? 'Recepción' : 'Técnico Especialista'}</p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <span className="block font-medium text-white">{new Date().toLocaleDateString('es-ES', { weekday: 'long' })}</span>
            <span>{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
          </div>
        </div>

        <div className="flex space-x-4 mt-4 pt-4 border-t border-white/10 text-xs">
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-widest">Ingresos del día</span>
            <span className="text-lg font-bold text-[#FACC15]">Bs. {stats.dailyRevenue.toLocaleString('es-ES')}</span>
          </div>
          <div className="border-l border-white/10 pl-4">
            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-widest">Recibidos hoy</span>
            <span className="text-lg font-bold text-white">{stats.receivedToday} equipos</span>
          </div>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <button
          type="button"
          onClick={() => onNavigateToTab('reparaciones', 'HOY')}
          className="text-left bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[110px] hover:border-gray-300 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group"
        >
          <div className="flex justify-between items-start w-full">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hoy</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mt-2">{stats.receivedToday}</h3>
            <p className="text-[11px] text-gray-500 mt-1 flex items-center justify-between">
              <span>Equipos recibidos hoy</span>
              <span className="text-[10px] font-bold text-[#FACC15] group-hover:translate-x-0.5 transition-transform">→</span>
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToTab('reparaciones', 'EN_REPARACION')}
          className="text-left bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[110px] hover:border-gray-300 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group"
        >
          <div className="flex justify-between items-start w-full">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">En Reparación</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mt-2">{stats.inRepair}</h3>
            <p className="text-[11px] text-gray-500 mt-1 flex items-center justify-between">
              <span>Diagnóstico / reparación</span>
              <span className="text-[10px] font-bold text-[#FACC15] group-hover:translate-x-0.5 transition-transform">→</span>
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToTab('reparaciones', 'LISTO')}
          className="text-left bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[110px] hover:border-gray-300 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group"
        >
          <div className="flex justify-between items-start w-full">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Listos</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mt-2">{stats.ready}</h3>
            <p className="text-[11px] text-gray-500 mt-1 flex items-center justify-between">
              <span>Esperando retiro</span>
              <span className="text-[10px] font-bold text-[#FACC15] group-hover:translate-x-0.5 transition-transform">→</span>
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToTab('reparaciones', 'ENTREGADO')}
          className="text-left bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[110px] hover:border-gray-300 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group"
        >
          <div className="flex justify-between items-start w-full">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Entregados</span>
            <div className="p-1.5 bg-gray-50 text-gray-600 rounded-lg group-hover:bg-gray-100 transition-colors">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mt-2">{stats.delivered}</h3>
            <p className="text-[11px] text-gray-500 mt-1 flex items-center justify-between">
              <span>Historial del mes</span>
              <span className="text-[10px] font-bold text-[#FACC15] group-hover:translate-x-0.5 transition-transform">→</span>
            </p>
          </div>
        </button>

      </div>

      {/* Quick single-handed bottom triggers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST') && (
          <button
            id="quick-reception-btn"
            onClick={() => onNavigateToTab('recepcion')}
            className="flex items-center justify-between p-4 bg-[#FACC15] hover:bg-[#FACC15]/90 text-[#111111] rounded-2xl font-bold shadow-md hover:shadow-lg transition-all text-sm group cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-black/10 rounded-xl">
                <Plus className="w-5 h-5 text-black" />
              </div>
              <span>Recepción Rápida</span>
            </div>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-[#111111]" />
          </button>
        )}

        <button
          id="quick-tech-panel-btn"
          onClick={() => onNavigateToTab('panel_tecnico')}
          className="flex items-center justify-between p-4 bg-[#111111] hover:bg-black text-[#00FF40] rounded-2xl font-bold shadow-md hover:shadow-lg transition-all text-sm group cursor-pointer border border-[#00FF40]/30"
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-[#00FF40]/10 rounded-xl">
              <Wrench className="w-5 h-5 text-[#00FF40]" />
            </div>
            <div className="text-left">
              <span className="block leading-tight text-white font-extrabold">Panel del Técnico</span>
              <span className="text-[10px] text-[#00FF40] font-mono">Mis OTs & Comisiones</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-[#00FF40]" />
        </button>

        <button
          id="quick-list-btn"
          onClick={() => onNavigateToTab('reparaciones')}
          className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 text-[#111111] border border-gray-200 rounded-2xl font-bold shadow-sm transition-all text-sm group cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-gray-100 rounded-xl">
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
          <h4 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Últimas Órdenes</h4>
          <button
            id="view-all-orders"
            onClick={() => onNavigateToTab('reparaciones')}
            className="text-xs font-semibold text-gray-500 hover:text-[#111111] transition-colors"
          >
            Ver todas
          </button>
        </div>

        <div className="space-y-3">
          {recentOrders.length === 0 ? (
            <div className="p-8 bg-white border border-gray-100 rounded-2xl text-center">
              <p className="text-xs text-gray-400 font-medium">No se registran órdenes recientes.</p>
            </div>
          ) : (
            recentOrders.map((order) => (
              <div
                id={`recent-order-card-${order.id}`}
                key={order.id}
                onClick={() => onSelectOrder(order.id)}
                className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-gray-300 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 flex-shrink-0 group-hover:bg-[#FACC15]/10 group-hover:border-[#FACC15]/20 transition-all">
                    <Smartphone className="w-5.5 h-5.5 text-gray-500 group-hover:text-yellow-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-[#111111]">{order.otNumber}</span>
                      <span className="text-[10px] text-gray-400 font-medium">• {new Date(order.createdAt).toLocaleDateString('es-ES')}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{order.brand} {order.model}</p>
                    <p className="text-xs text-gray-500 truncate">{order.clientName}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeStyles(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#111111] transform group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
