import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Wrench,
  Calendar,
  DollarSign,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Printer,
  Download,
  Eye,
  Phone,
  ChevronDown,
  Check,
  UserCheck,
  TrendingUp,
  Award,
  Smartphone,
  FileText,
  ChevronRight,
  X,
  Sparkles,
  RefreshCw,
  MessageSquare,
  Percent,
  Sliders,
  ShieldCheck,
  BarChart2,
  Package,
  Layers,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { mockDb } from '../db/mockDb';
import { Order, User, OrderStatus, WorkshopSettings } from '../types';
import BolFixLogo from './BolFixLogo';

interface TechnicianPanelViewProps {
  currentUser: User;
  onSelectOrder: (orderId: string) => void;
}

type SubTab = 'ASSIGNED' | 'HISTORY' | 'FINANCIAL';
type DatePreset = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'ALL_TIME' | 'CUSTOM';

export default function TechnicianPanelView({
  currentUser,
  onSelectOrder
}: TechnicianPanelViewProps) {
  const [orders, setOrders] = useState<Order[]>(() => mockDb.getOrders());
  const [users, setUsers] = useState<User[]>(() => mockDb.getUsers());
  const [settings, setSettings] = useState<WorkshopSettings>(() => mockDb.getSettings());

  // Filter technicians
  const technicians = useMemo(() => {
    return users.filter(u => u.role === 'TECHNICIAN' || u.role === 'ADMIN');
  }, [users]);

  // Selected technician: if currentUser is a technician, lock to them by default. If admin, allow selecting.
  const [selectedTechId, setSelectedTechId] = useState<string>(() => {
    if (currentUser.role === 'TECHNICIAN') return currentUser.id;
    const defaultTech = technicians.find(t => t.id === 'usr-tech1') || technicians[0];
    return defaultTech ? defaultTech.id : currentUser.id;
  });

  const selectedTechnician = useMemo(() => {
    return technicians.find(t => t.id === selectedTechId) || currentUser;
  }, [technicians, selectedTechId, currentUser]);

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('ASSIGNED');

  // Active assigned orders filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL_ACTIVE' | OrderStatus>('ALL_ACTIVE');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'COST_DESC'>('DATE_DESC');

  // History tab filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('ALL');

  // Financial report state
  const [datePreset, setDatePreset] = useState<DatePreset>('THIS_MONTH');
  
  // Initialize start/end dates
  const getPresetDates = (preset: DatePreset) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    switch (preset) {
      case 'TODAY':
        return { start: todayStr, end: todayStr };
      case 'YESTERDAY': {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        const yStr = y.toISOString().split('T')[0];
        return { start: yStr, end: yStr };
      }
      case 'THIS_WEEK': {
        const curr = new Date(now);
        const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1); // Monday
        const monday = new Date(curr.setDate(first));
        return { start: monday.toISOString().split('T')[0], end: todayStr };
      }
      case 'THIS_MONTH': {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: firstDay.toISOString().split('T')[0], end: todayStr };
      }
      case 'LAST_MONTH': {
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: firstDay.toISOString().split('T')[0], end: lastDay.toISOString().split('T')[0] };
      }
      case 'ALL_TIME': {
        // From technician start date or 1 year ago
        const techStart = selectedTechnician?.createdAt 
          ? new Date(selectedTechnician.createdAt).toISOString().split('T')[0] 
          : '2025-01-01';
        return { start: techStart, end: todayStr };
      }
      default:
        return { start: todayStr, end: todayStr };
    }
  };

  const initialDates = getPresetDates('THIS_MONTH');
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [customCommissionRate, setCustomCommissionRate] = useState<number>(() => {
    return selectedTechnician?.commissionPercentage || settings.defaultTechnicianCommissionPercentage || 40;
  });
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Update dates when preset changes
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== 'CUSTOM') {
      const { start, end } = getPresetDates(preset);
      setStartDate(start);
      setEndDate(end);
    }
  };

  // Sync commission rate when switching technician
  useEffect(() => {
    const rate = selectedTechnician?.commissionPercentage || settings.defaultTechnicianCommissionPercentage || 40;
    setCustomCommissionRate(rate);
  }, [selectedTechnician, settings]);

  // Reload orders on mount & storage event
  const reloadData = () => {
    setOrders(mockDb.getOrders());
    setUsers(mockDb.getUsers());
    setSettings(mockDb.getSettings());
  };

  useEffect(() => {
    window.addEventListener('storage', reloadData);
    window.addEventListener('workshop_settings_saved', reloadData);
    return () => {
      window.removeEventListener('storage', reloadData);
      window.removeEventListener('workshop_settings_saved', reloadData);
    };
  }, []);

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // All orders for this technician
  const techOrders = useMemo(() => {
    return orders.filter(o => o.assignedTechnicianId === selectedTechId);
  }, [orders, selectedTechId]);

  // Active assigned orders (not delivered)
  const activeAssignedOrders = useMemo(() => {
    return techOrders.filter(o => o.status !== 'ENTREGADO');
  }, [techOrders]);

  // Delivered orders
  const deliveredOrders = useMemo(() => {
    return techOrders.filter(o => o.status === 'ENTREGADO');
  }, [techOrders]);

  // Filtered active assigned orders
  const filteredActiveOrders = useMemo(() => {
    return activeAssignedOrders.filter(o => {
      // Status filter
      if (statusFilter !== 'ALL_ACTIVE' && o.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesOt = o.otNumber?.toLowerCase().includes(q);
        const matchesClient = o.clientName?.toLowerCase().includes(q) || o.clientPhone?.toLowerCase().includes(q);
        const matchesDevice = `${o.brand} ${o.model}`.toLowerCase().includes(q);
        const matchesProblem = o.problem?.toLowerCase().includes(q);
        const matchesImei = o.imei?.toLowerCase().includes(q);
        return matchesOt || matchesClient || matchesDevice || matchesProblem || matchesImei;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'DATE_DESC') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'DATE_ASC') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'COST_DESC') {
        return (b.estimatedCost || 0) - (a.estimatedCost || 0);
      }
      return 0;
    });
  }, [activeAssignedOrders, statusFilter, searchQuery, sortBy]);

  // Full history filtered orders
  const filteredHistoryOrders = useMemo(() => {
    return techOrders.filter(o => {
      if (historyStatusFilter !== 'ALL' && o.status !== historyStatusFilter) {
        return false;
      }

      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const matchesOt = o.otNumber?.toLowerCase().includes(q);
        const matchesClient = o.clientName?.toLowerCase().includes(q);
        const matchesDevice = `${o.brand} ${o.model}`.toLowerCase().includes(q);
        const matchesProblem = o.problem?.toLowerCase().includes(q);
        return matchesOt || matchesClient || matchesDevice || matchesProblem;
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [techOrders, historyStatusFilter, historySearch]);

  // Commission calculation helper
  const calculateCommission = (order: Order, rate: number): number => {
    if (order.commissionAmount !== undefined && order.commissionAmount > 0) {
      return order.commissionAmount;
    }
    const appliedRate = order.commissionPercentage !== undefined ? order.commissionPercentage : rate;
    const baseAmount = order.estimatedCost || 0;
    return Math.round((baseAmount * (appliedRate / 100)) * 100) / 100;
  };

  // Financial Report orders in date range
  const financialOrders = useMemo(() => {
    const startObj = new Date(`${startDate}T00:00:00`);
    const endObj = new Date(`${endDate}T23:59:59.999`);

    // Include orders that are completed/delivered or ready within the date range
    return techOrders.filter(o => {
      // Relevant date: updatedAt or createdAt
      const orderDate = new Date(o.updatedAt || o.createdAt);
      const inRange = orderDate >= startObj && orderDate <= endObj;
      if (!inRange) return false;

      // Commissionable: usually ENTREGADO (delivered/billed) or LISTO (completed)
      return o.status === 'ENTREGADO' || o.status === 'LISTO';
    }).sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }, [techOrders, startDate, endDate]);

  // Financial Metrics
  const financialMetrics = useMemo(() => {
    let totalCommissionEarned = 0; // From delivered orders
    let totalCommissionPendingPickup = 0; // From ready orders
    let totalBilled = 0;
    let deliveredCount = 0;
    let readyCount = 0;

    financialOrders.forEach(order => {
      const comm = calculateCommission(order, customCommissionRate);
      const cost = order.estimatedCost || 0;
      totalBilled += cost;

      if (order.status === 'ENTREGADO') {
        totalCommissionEarned += comm;
        deliveredCount++;
      } else if (order.status === 'LISTO') {
        totalCommissionPendingPickup += comm;
        readyCount++;
      }
    });

    const totalSummed = totalCommissionEarned + totalCommissionPendingPickup;

    return {
      totalSummed,
      totalCommissionEarned,
      totalCommissionPendingPickup,
      totalBilled,
      totalOrders: financialOrders.length,
      deliveredCount,
      readyCount,
      averageCommissionPerJob: financialOrders.length > 0 ? totalSummed / financialOrders.length : 0
    };
  }, [financialOrders, customCommissionRate]);

  // Overall career historical metrics
  const careerStats = useMemo(() => {
    const totalAllTime = techOrders.length;
    const delivered = deliveredOrders.length;
    const successRate = totalAllTime > 0 ? Math.round((delivered / totalAllTime) * 100) : 0;
    const totalRevenueGenerated = techOrders.reduce((sum, o) => sum + (o.estimatedCost || 0), 0);
    const totalCommissionsAllTime = techOrders
      .filter(o => o.status === 'ENTREGADO')
      .reduce((sum, o) => sum + calculateCommission(o, customCommissionRate), 0);

    return {
      totalAllTime,
      delivered,
      successRate,
      totalRevenueGenerated,
      totalCommissionsAllTime
    };
  }, [techOrders, deliveredOrders, customCommissionRate]);

  // Quick inline status change
  const handleQuickStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    });

    mockDb.saveOrders(updated);
    setOrders(updated);

    // Add timeline event
    const events = mockDb.getEvents();
    const newEvent = {
      id: `evt-${Date.now()}`,
      orderId,
      status: newStatus,
      description: `Estado actualizado a "${newStatus}" por el técnico ${selectedTechnician.name}.`,
      createdBy: selectedTechnician.name,
      createdAt: new Date().toISOString()
    };
    mockDb.saveEvents([...events, newEvent]);

    showNotification(`¡Orden actualizada con éxito a estado: ${newStatus}!`);
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/D';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-BO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Helper for status badge colors
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'RECIBIDO':
        return { label: 'Recibido', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'DIAGNOSTICO':
        return { label: 'En Diagnóstico', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'REPARANDO':
        return { label: 'En Reparación', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'ESPERANDO_REPUESTO':
        return { label: 'Esp. Repuesto', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'LISTO':
        return { label: 'Listo / Retiro', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'ENTREGADO':
        return { label: 'Entregado', bg: 'bg-gray-100 text-gray-700 border-gray-300' };
      default:
        return { label: status, bg: 'bg-gray-50 text-gray-600 border-gray-200' };
    }
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn pb-16">
      {/* Toast notification */}
      {actionSuccessMsg && (
        <div className="fixed top-4 right-4 z-50 bg-[#111111] text-[#00FF40] px-4 py-3 rounded-2xl shadow-2xl border border-[#00FF40]/30 flex items-center space-x-2.5 text-xs font-bold animate-bounce">
          <CheckCircle className="w-4 h-4 text-[#00FF40]" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* HEADER: PANEL DEL TÉCNICO & SELECTOR */}
      <div className="bg-gradient-to-r from-[#111111] via-[#1a1a1a] to-[#222222] text-white p-6 rounded-3xl shadow-xl border border-white/10 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#00E63C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-black/60 rounded-2xl p-2 flex items-center justify-center border-2 border-[#00FF40]/40 shadow-inner shrink-0">
              <BolFixLogo variant="icon" className="w-full h-full rounded-xl" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full bg-[#00FF40]/20 text-[#00FF40] text-[10px] font-black uppercase tracking-wider border border-[#00FF40]/30">
                  Módulo de Rendimiento & Finanzas
                </span>
                <span className="text-gray-400 text-xs font-mono">
                  {settings.currencySymbol || 'Bs.'} COMISIONES
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mt-0.5">
                Panel del Técnico
              </h1>
              <p className="text-xs text-gray-300">
                Órdenes asignadas, historial laboral y reporte financiero de comisiones sumadas
              </p>
            </div>
          </div>

          {/* Technician Selector / Profile Info */}
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-sm self-start md:self-auto">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00E63C] to-emerald-400 text-black font-black flex items-center justify-center text-sm shadow-md shrink-0">
              {selectedTechnician.name.charAt(0)}
            </div>
            
            <div className="min-w-0 pr-2">
              {currentUser.role === 'ADMIN' ? (
                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">
                    Viendo Técnico:
                  </label>
                  <select
                    value={selectedTechId}
                    onChange={(e) => setSelectedTechId(e.target.value)}
                    className="bg-transparent text-white font-extrabold text-xs outline-none cursor-pointer border-b border-white/20 pb-0.5 hover:border-[#00FF40] transition-colors"
                  >
                    {technicians.map(tech => (
                      <option key={tech.id} value={tech.id} className="bg-[#1c1c1c] text-white">
                        {tech.name} ({tech.role === 'ADMIN' ? 'Admin' : 'Técnico'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-black text-white truncate">{selectedTechnician.name}</p>
                  <p className="text-[10px] text-[#00FF40] font-bold">
                    {selectedTechnician.specialty || 'Servicio Técnico Especializado'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Tech Badge details */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 block font-medium">En la empresa desde</span>
            <span className="font-bold text-white font-mono">
              {formatDate(selectedTechnician.createdAt)}
            </span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 block font-medium">Comisión asignada</span>
            <span className="font-black text-[#00FF40] font-mono">
              {customCommissionRate}% del trabajo
            </span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 block font-medium">Trabajos activos</span>
            <span className="font-black text-amber-400 font-mono">
              {activeAssignedOrders.length} órdenes en taller
            </span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-gray-400 block font-medium">Efectividad histórica</span>
            <span className="font-black text-emerald-400 font-mono">
              {careerStats.successRate}% éxito ({careerStats.delivered} entregados)
            </span>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS WITHIN THE PANEL */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubTab('ASSIGNED')}
          className={`flex items-center space-x-2 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'ASSIGNED'
              ? 'bg-black text-[#00FF40] shadow-md'
              : 'text-gray-600 hover:text-black hover:bg-gray-100'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Trabajos Asignados Activos</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeSubTab === 'ASSIGNED' ? 'bg-[#00FF40]/20 text-[#00FF40]' : 'bg-gray-200 text-gray-700'
          }`}>
            {activeAssignedOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('FINANCIAL')}
          className={`flex items-center space-x-2 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'FINANCIAL'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-gray-600 hover:text-black hover:bg-gray-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Reporte Financiero de Comisiones</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
            {settings.currencySymbol || 'Bs.'}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('HISTORY')}
          className={`flex items-center space-x-2 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'HISTORY'
              ? 'bg-black text-white shadow-md'
              : 'text-gray-600 hover:text-black hover:bg-gray-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Historial Completo Laboral</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-gray-200 text-gray-700">
            {techOrders.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: TRABAJOS ASIGNADOS ACTIVOS */}
      {/* ========================================================================= */}
      {activeSubTab === 'ASSIGNED' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Quick Counter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                status: 'DIAGNOSTICO',
                label: 'En Diagnóstico',
                count: activeAssignedOrders.filter(o => o.status === 'DIAGNOSTICO').length,
                color: 'text-purple-700',
                bg: 'bg-purple-50/80 border-purple-200'
              },
              {
                status: 'REPARANDO',
                label: 'En Reparación',
                count: activeAssignedOrders.filter(o => o.status === 'REPARANDO').length,
                color: 'text-amber-700',
                bg: 'bg-amber-50/80 border-amber-200'
              },
              {
                status: 'ESPERANDO_REPUESTO',
                label: 'Esperando Repuesto',
                count: activeAssignedOrders.filter(o => o.status === 'ESPERANDO_REPUESTO').length,
                color: 'text-orange-700',
                bg: 'bg-orange-50/80 border-orange-200'
              },
              {
                status: 'LISTO',
                label: 'Listos para Retiro',
                count: activeAssignedOrders.filter(o => o.status === 'LISTO').length,
                color: 'text-emerald-700',
                bg: 'bg-emerald-50/80 border-emerald-200'
              }
            ].map((stat, idx) => (
              <div
                key={idx}
                onClick={() => setStatusFilter(stat.status as OrderStatus)}
                className={`p-3.5 rounded-2xl border ${stat.bg} shadow-2xs cursor-pointer hover:shadow-md transition-all active:scale-98`}
              >
                <span className="text-[11px] font-bold text-gray-600 block">{stat.label}</span>
                <span className={`text-2xl font-black font-mono ${stat.color} block mt-0.5`}>
                  {stat.count}
                </span>
              </div>
            ))}
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por OT, cliente, modelo, falla, IMEI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 focus:bg-white focus:border-black outline-none font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center space-x-1 overflow-x-auto w-full md:w-auto">
                {[
                  { id: 'ALL_ACTIVE', label: 'Todos los activos' },
                  { id: 'DIAGNOSTICO', label: 'Diagnóstico' },
                  { id: 'REPARANDO', label: 'Reparando' },
                  { id: 'ESPERANDO_REPUESTO', label: 'Repuesto' },
                  { id: 'LISTO', label: 'Listos' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id as 'ALL_ACTIVE' | OrderStatus)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-black text-[#00FF40]'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'DATE_DESC' | 'DATE_ASC' | 'COST_DESC')}
                className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 font-bold outline-none cursor-pointer ml-auto"
              >
                <option value="DATE_DESC">Más recientes</option>
                <option value="DATE_ASC">Más antiguos (urgentes)</option>
                <option value="COST_DESC">Mayor presupuesto</option>
              </select>
            </div>
          </div>

          {/* Cards List */}
          {filteredActiveOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 space-y-3">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-sm font-black text-gray-800 uppercase">
                No hay órdenes activas con este filtro
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {activeAssignedOrders.length === 0
                  ? `¡Genial! El técnico ${selectedTechnician.name} está al día y no tiene órdenes pendientes de reparación.`
                  : 'Prueba cambiando los filtros de búsqueda para ver otras órdenes de trabajo asignadas.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredActiveOrders.map(order => {
                const badge = getStatusBadge(order.status);
                const estimatedComm = calculateCommission(order, customCommissionRate);

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-2xs hover:shadow-md transition-all p-4.5 flex flex-col justify-between space-y-3.5 relative group"
                  >
                    {/* Top Row: OT & Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 bg-black text-[#00FF40] rounded-lg font-mono font-black text-xs tracking-wider">
                          {order.otNumber}
                        </span>
                        <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {formatDate(order.createdAt)}
                        </span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Device & Client info */}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4 text-gray-700 shrink-0" />
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">
                          {order.brand} {order.model}
                        </h4>
                        {order.color && (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded font-medium">
                            {order.color}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-600 pl-6 flex items-center justify-between">
                        <span>Cliente: <strong className="text-gray-900">{order.clientName}</strong></span>
                        {order.clientPhone && (
                          <a
                            href={`https://wa.me/${order.clientPhone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00E63C] hover:text-emerald-700 font-bold flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="w-3 h-3" />
                            <span>{order.clientPhone}</span>
                          </a>
                        )}
                      </p>
                    </div>

                    {/* Problem summary */}
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 text-xs">
                      <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wide">
                        Falla Reportada:
                      </span>
                      <p className="text-gray-800 line-clamp-2 mt-0.5 font-medium leading-relaxed">
                        {order.problem}
                      </p>
                      {order.observaciones && (
                        <p className="text-[11px] text-gray-500 italic mt-1 border-t border-gray-200/60 pt-1 line-clamp-1">
                          Nota: {order.observaciones}
                        </p>
                      )}
                    </div>

                    {/* Financial Pills (Cost & Estimated Commission) */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                      <div className="bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-150">
                        <span className="text-[9px] text-gray-400 block font-bold uppercase">Presupuesto</span>
                        <span className="text-xs font-black text-gray-900 font-mono">
                          {settings.currencySymbol || 'Bs.'} {order.estimatedCost?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                        <span className="text-[9px] text-emerald-700 block font-bold uppercase">
                          Tu Comisión ({customCommissionRate}%)
                        </span>
                        <span className="text-xs font-black text-emerald-800 font-mono">
                          +{settings.currencySymbol || 'Bs.'} {estimatedComm.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Quick State Transition Actions & Details Button */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        {order.status !== 'DIAGNOSTICO' && order.status !== 'REPARANDO' && order.status !== 'LISTO' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(order.id, 'DIAGNOSTICO')}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg border border-purple-200 transition-all cursor-pointer"
                          >
                            Diagnóstico
                          </button>
                        )}

                        {order.status !== 'REPARANDO' && order.status !== 'LISTO' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(order.id, 'REPARANDO')}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg border border-amber-200 transition-all cursor-pointer"
                          >
                            Reparar
                          </button>
                        )}

                        {order.status !== 'ESPERANDO_REPUESTO' && order.status !== 'LISTO' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(order.id, 'ESPERANDO_REPUESTO')}
                            className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 text-[10px] font-bold rounded-lg border border-orange-200 transition-all cursor-pointer"
                          >
                            Esp. Repuesto
                          </button>
                        )}

                        {order.status !== 'LISTO' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(order.id, 'LISTO')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Listo
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectOrder(order.id)}
                        className="px-3 py-1.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ml-auto shrink-0 shadow-xs"
                      >
                        <span>Abrir OT</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: REPORTE FINANCIERO DE COMISIONES */}
      {/* ========================================================================= */}
      {activeSubTab === 'FINANCIAL' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Controls & Date Filter Card */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-150">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Filtrado por Fechas & Cálculo de Comisiones
                </h3>
                <p className="text-[11px] text-gray-500">
                  Selecciona el rango de fechas para calcular la comisión sumada generada por {selectedTechnician.name}
                </p>
              </div>

              {/* Commission Rate badge & Quick Setting */}
              <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                <span className="text-[11px] font-bold text-gray-600 pl-1.5">Tasa aplicada:</span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-200 font-mono">
                  {customCommissionRate}%
                </span>
                {currentUser.role === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => {
                      const newRate = prompt('Ingresa nuevo porcentaje de comisión para este reporte (ej: 40):', `${customCommissionRate}`);
                      if (newRate && !isNaN(Number(newRate))) {
                        setCustomCommissionRate(Number(newRate));
                      }
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline px-1 cursor-pointer"
                  >
                    Cambiar
                  </button>
                )}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-extrabold text-gray-400 mr-1 uppercase">Atajos:</span>
              {[
                { id: 'TODAY', label: 'Hoy' },
                { id: 'YESTERDAY', label: 'Ayer' },
                { id: 'THIS_WEEK', label: 'Esta Semana' },
                { id: 'THIS_MONTH', label: 'Este Mes' },
                { id: 'LAST_MONTH', label: 'Mes Pasado' },
                { id: 'ALL_TIME', label: 'Todo el Historial' }
              ].map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetChange(preset.id as DatePreset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    datePreset === preset.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Desde</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset('CUSTOM');
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:bg-white focus:border-black outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Hasta</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset('CUSTOM');
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:bg-white focus:border-black outline-none font-mono"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  disabled={financialOrders.length === 0}
                  className="w-full py-2 px-3.5 bg-black hover:bg-gray-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-[#00FF40]" />
                  <span>Imprimir / Liquidar Comisiones</span>
                </button>
              </div>
            </div>
          </div>

          {/* MAIN PROMINENT COMMISSION DISPLAY CARD */}
          <div className="bg-gradient-to-br from-[#0c1f12] via-[#09150d] to-[#040805] text-white p-6 md:p-8 rounded-3xl shadow-xl border-2 border-[#00FF40]/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Award className="w-48 h-48 text-[#00FF40]" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#00FF40]/20 text-[#00FF40] text-xs font-black tracking-wider uppercase border border-[#00FF40]/40">
                    Comisión Sumada en el Rango
                  </span>
                  <span className="text-gray-400 text-xs font-mono">
                    ({formatDate(startDate)} — {formatDate(endDate)})
                  </span>
                </div>

                <div className="flex items-baseline space-x-2 pt-2">
                  <span className="text-4xl sm:text-5xl md:text-6xl font-black text-[#00FF40] tracking-tight font-mono drop-shadow-md">
                    {settings.currencySymbol || 'Bs.'} {financialMetrics.totalSummed.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <p className="text-xs text-gray-300 font-medium">
                  Ganancia acumulada por <strong className="text-white">{selectedTechnician.name}</strong> en {financialMetrics.totalOrders} reparaciones realizadas.
                </p>
              </div>

              {/* Breakdown Pills */}
              <div className="grid grid-cols-2 gap-3 min-w-[280px]">
                <div className="bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
                  <span className="text-[10px] text-emerald-400 block font-bold uppercase">
                    Comisión Cobrada (Entregadas)
                  </span>
                  <span className="text-lg font-black text-white font-mono">
                    {settings.currencySymbol || 'Bs.'} {financialMetrics.totalCommissionEarned.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    {financialMetrics.deliveredCount} trabajos entregados
                  </span>
                </div>

                <div className="bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
                  <span className="text-[10px] text-amber-300 block font-bold uppercase">
                    Por Cobrar (Listos en taller)
                  </span>
                  <span className="text-lg font-black text-amber-300 font-mono">
                    {settings.currencySymbol || 'Bs.'} {financialMetrics.totalCommissionPendingPickup.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    {financialMetrics.readyCount} trabajos terminados
                  </span>
                </div>

                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">
                      Total Facturado en Servicios
                    </span>
                    <span className="text-sm font-bold text-gray-200 font-mono">
                      {settings.currencySymbol || 'Bs.'} {financialMetrics.totalBilled.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">
                      Promedio Comisión / Orden
                    </span>
                    <span className="text-sm font-bold text-[#00FF40] font-mono">
                      {settings.currencySymbol || 'Bs.'} {financialMetrics.averageCommissionPerJob.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ITEMIZATION TABLE */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4.5 border-b border-gray-150 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">
                  Desglose de Trabajos Realizados en el Período
                </h4>
                <p className="text-[11px] text-gray-500">
                  Lista detallada de órdenes finalizadas con cálculo de comisión individual
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-xl">
                {financialOrders.length} {financialOrders.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            {financialOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs">
                No se registraron reparaciones terminadas o entregadas en el rango de fechas seleccionado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-500 border-b border-gray-150 tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">N° OT</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Dispositivo</th>
                      <th className="py-3 px-4">Falla / Trabajo</th>
                      <th className="py-3 px-4 text-right">Cobrado</th>
                      <th className="py-3 px-4 text-center">% Com.</th>
                      <th className="py-3 px-4 text-right font-black text-emerald-800">Comisión</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {financialOrders.map(order => {
                      const comm = calculateCommission(order, customCommissionRate);
                      const badge = getStatusBadge(order.status);

                      return (
                        <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                            {formatDate(order.updatedAt || order.createdAt)}
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-gray-900 whitespace-nowrap">
                            {order.otNumber}
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">
                            {order.clientName}
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-800 whitespace-nowrap">
                            <span className="font-bold text-black">{order.brand}</span> {order.model}
                          </td>
                          <td className="py-3 px-4 text-gray-600 max-w-xs truncate" title={order.problem}>
                            {order.problem}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                            {settings.currencySymbol || 'Bs.'} {order.estimatedCost?.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-gray-600">
                            {order.commissionPercentage !== undefined ? order.commissionPercentage : customCommissionRate}%
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm whitespace-nowrap">
                            +{settings.currencySymbol || 'Bs.'} {comm.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => onSelectOrder(order.id)}
                              className="text-gray-500 hover:text-black font-bold text-[11px] underline cursor-pointer"
                            >
                              Ver
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50/90 font-bold border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={5} className="py-3.5 px-4 font-black text-xs uppercase text-gray-800 text-right">
                        Totales del Período ({financialOrders.length} órdenes):
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-xs text-gray-900">
                        {settings.currencySymbol || 'Bs.'} {financialMetrics.totalBilled.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-gray-500">
                        Prom.
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-emerald-700">
                        {settings.currencySymbol || 'Bs.'} {financialMetrics.totalSummed.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: HISTORIAL COMPLETO LABORAL */}
      {/* ========================================================================= */}
      {activeSubTab === 'HISTORY' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Historical Overview Banner */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-150">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-black text-[#00FF40] rounded-2xl flex items-center justify-center font-black text-lg">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                    Historial Laboral Histórico de {selectedTechnician.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Registro de toda la actividad técnica desde su ingreso al taller ({formatDate(selectedTechnician.createdAt)})
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-400 block font-bold uppercase">Total Comisiones Históricas</span>
                <span className="text-sm font-black text-emerald-700 font-mono">
                  {settings.currencySymbol || 'Bs.'} {careerStats.totalCommissionsAllTime.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Career Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <span className="text-[10px] text-gray-500 font-bold block uppercase">Órdenes Atendidas</span>
                <span className="text-2xl font-black text-gray-900 font-mono">{careerStats.totalAllTime}</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-bold block uppercase">Entregadas con Éxito</span>
                <span className="text-2xl font-black text-emerald-800 font-mono">{careerStats.delivered}</span>
              </div>
              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200">
                <span className="text-[10px] text-blue-700 font-bold block uppercase">Tasa de Efectividad</span>
                <span className="text-2xl font-black text-blue-800 font-mono">{careerStats.successRate}%</span>
              </div>
              <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200">
                <span className="text-[10px] text-purple-700 font-bold block uppercase">Valor Reparado Histórico</span>
                <span className="text-xl font-black text-purple-900 font-mono">
                  {settings.currencySymbol || 'Bs.'} {careerStats.totalRevenueGenerated.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* History Search & Filter */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar en el historial laboral..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 focus:bg-white focus:border-black outline-none font-medium"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-gray-500">Estado:</span>
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 font-bold outline-none cursor-pointer"
              >
                <option value="ALL">Todos los estados</option>
                <option value="ENTREGADO">Entregados</option>
                <option value="LISTO">Listos</option>
                <option value="REPARANDO">En Reparación</option>
                <option value="DIAGNOSTICO">En Diagnóstico</option>
                <option value="ESPERANDO_REPUESTO">Esperando Repuesto</option>
              </select>
            </div>
          </div>

          {/* Full History Table */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-500 border-b border-gray-150 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Fecha Ingreso</th>
                    <th className="py-3 px-4">N° OT</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Dispositivo</th>
                    <th className="py-3 px-4">Problema / Falla</th>
                    <th className="py-3 px-4 text-right">Importe</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredHistoryOrders.map(order => {
                    const badge = getStatusBadge(order.status);

                    return (
                      <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-gray-900 whitespace-nowrap">
                          {order.otNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">
                          {order.clientName}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-800 whitespace-nowrap">
                          <span className="font-bold text-black">{order.brand}</span> {order.model}
                        </td>
                        <td className="py-3 px-4 text-gray-600 max-w-sm truncate" title={order.problem}>
                          {order.problem}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                          {settings.currencySymbol || 'Bs.'} {order.estimatedCost?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onSelectOrder(order.id)}
                            className="text-blue-600 hover:text-blue-800 font-bold text-[11px] underline cursor-pointer"
                          >
                            Ver Orden
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINT / COMMISSION SETTLEMENT RECEIPT MODAL */}
      {/* ========================================================================= */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4.5 bg-gray-50 border-b border-gray-150 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Printer className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-gray-900 uppercase">
                  Liquidación & Comprobante de Comisiones
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Body */}
            <div id="printable-commission-receipt" className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-xs">
              {/* Header Company */}
              <div className="text-center pb-3 border-b border-gray-200 space-y-1">
                <h2 className="text-base font-black uppercase tracking-tight text-gray-900">
                  {settings.workshopName || 'BOL.FIX'}
                </h2>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                  {settings.workshopSlogan || 'By: Mauro Medina'}
                </p>
                <p className="text-[10px] text-gray-600">
                  {settings.address} • Tel: {settings.phone}
                </p>
                <div className="pt-2">
                  <span className="inline-block px-3 py-1 bg-black text-[#00FF40] text-xs font-black uppercase tracking-wider rounded-lg font-mono">
                    COMPROBANTE DE PAGO DE COMISIONES
                  </span>
                </div>
              </div>

              {/* Data Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Técnico Beneficiario</span>
                  <span className="font-black text-gray-900 text-sm">{selectedTechnician.name}</span>
                  <span className="text-[10px] text-gray-500 block font-mono">ID: {selectedTechnician.id}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Período Liquidado</span>
                  <span className="font-bold text-gray-900 font-mono">
                    {formatDate(startDate)} al {formatDate(endDate)}
                  </span>
                  <span className="text-[10px] text-emerald-700 block font-bold">
                    Tasa: {customCommissionRate}%
                  </span>
                </div>
              </div>

              {/* Itemized summary */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-gray-100 uppercase text-[9px] font-black text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="py-2 px-3">Fecha</th>
                      <th className="py-2 px-3">N° OT</th>
                      <th className="py-2 px-3">Equipo / Trabajo</th>
                      <th className="py-2 px-3 text-right">Facturado</th>
                      <th className="py-2 px-3 text-right font-black text-emerald-800">Comisión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {financialOrders.map(order => {
                      const comm = calculateCommission(order, customCommissionRate);
                      return (
                        <tr key={order.id}>
                          <td className="py-1.5 px-3 font-mono text-[10px]">
                            {formatDate(order.updatedAt || order.createdAt)}
                          </td>
                          <td className="py-1.5 px-3 font-mono font-bold">{order.otNumber}</td>
                          <td className="py-1.5 px-3 truncate max-w-[180px]">
                            {order.brand} {order.model} ({order.problem})
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono">
                            {settings.currencySymbol || 'Bs.'} {order.estimatedCost?.toLocaleString()}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-black text-emerald-700">
                            {settings.currencySymbol || 'Bs.'} {comm.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Grand Total Box */}
              <div className="bg-[#111111] text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">
                    TOTAL COMISIÓN LIQUIDADA ({financialOrders.length} reparaciones)
                  </span>
                  <span className="text-xs text-[#00FF40] font-bold">
                    Período: {formatDate(startDate)} — {formatDate(endDate)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#00FF40] font-mono">
                    {settings.currencySymbol || 'Bs.'} {financialMetrics.totalSummed.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[10px]">
                <div className="border-t border-gray-400 pt-1.5">
                  <p className="font-bold text-gray-900 uppercase">{selectedTechnician.name}</p>
                  <p className="text-gray-500">Firma del Técnico (Conforme)</p>
                </div>
                <div className="border-t border-gray-400 pt-1.5">
                  <p className="font-bold text-gray-900 uppercase">
                    {currentUser.role === 'ADMIN' ? currentUser.name : 'Administración / Gerencia'}
                  </p>
                  <p className="text-gray-500">Firma Administración (Aprobado)</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-150 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-black hover:bg-gray-800 text-[#00FF40] hover:text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Recibo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
