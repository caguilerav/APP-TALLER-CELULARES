/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  PlusCircle, 
  ClipboardList, 
  LogOut, 
  Smartphone, 
  User as UserIcon, 
  Wrench,
  ChevronRight,
  Database,
  Package,
  ShoppingBag,
  BarChart3,
  Search,
  X,
  Printer,
  Settings
} from 'lucide-react';
import { User, Sale, WorkshopSettings, Order, SaleItem } from './types';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import ReceptionView from './components/ReceptionView';
import OrderListView from './components/OrderListView';
import OrderDetailView from './components/OrderDetailView';
import InventoryView from './components/InventoryView';
import SalesView from './components/SalesView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import TechnicianPanelView from './components/TechnicianPanelView';
import GlobalSearchView from './components/GlobalSearchView';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import BolFixLogo from './components/BolFixLogo';
import { mockDb } from './db/mockDb';
import { updateAppIcon, resetAppIcon, generateOptimizedAppIcon } from './utils/appIconHelper';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard'); // 'dashboard', 'recepcion', 'reparaciones', 'inventario', 'ventas', 'reportes'
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [initialPrintView, setInitialPrintView] = useState<boolean>(false);
  const [listFilter, setListFilter] = useState<string>('ALL');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [selectedSaleForTicket, setSelectedSaleForTicket] = useState<Sale | null>(null);
  
  // Workshop dynamic settings
  const [workshopSettings, setWorkshopSettings] = useState<WorkshopSettings>(() => mockDb.getSettings());

  // A simple counter to trigger state re-fetching in list view when operations occur
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // POS Prefill state for redirected service orders
  const [posPrefillSale, setPosPrefillSale] = useState<{
    item: SaleItem;
    client?: { id?: string; name: string; phone: string };
    paymentMethod?: string;
    notes?: string;
  } | null>(null);

  const handleNavigateToPosWithOrder = (order: Order, paymentInfo?: { amount: number; paymentMethod: string; notes?: string }) => {
    setActiveOrderId(null);
    setActiveTab('ventas');
    const remaining = Math.max(0, order.estimatedCost - order.advancePayment);
    const amountToCharge = paymentInfo ? paymentInfo.amount : (remaining > 0 ? remaining : order.estimatedCost);

    setPosPrefillSale({
      item: {
        id: `srv-order-${order.id}-${Date.now()}`,
        type: 'SERVICE',
        referenceId: order.id,
        name: `Servicio OT #${order.otNumber} - ${order.brand} ${order.model}`,
        price: amountToCharge,
        quantity: 1,
        subtotal: amountToCharge,
        orderOt: order.otNumber,
        orderEquipment: `${order.brand} ${order.model}${order.color ? ` (${order.color})` : ''}`,
        orderIssue: order.problem,
        orderTechnician: order.assignedTechnicianName || 'Técnico Especialista',
        category: 'Servicio Técnico',
        details: `Falla: ${order.problem}`
      },
      client: {
        id: order.clientId,
        name: order.clientName,
        phone: order.clientPhone
      },
      paymentMethod: paymentInfo?.paymentMethod || 'Efectivo',
      notes: paymentInfo?.notes || `Liquidación de Orden de Servicio #${order.otNumber}`
    });
  };

  useEffect(() => {
    // Apply saved zoom level
    try {
      const savedZoom = localStorage.getItem('taller_celulares_zoom');
      const settingsZoom = mockDb.getSettings().appZoom;
      const zoomVal = savedZoom ? Number(savedZoom) : (settingsZoom || 100);
      if (zoomVal && zoomVal >= 60 && zoomVal <= 180) {
        (document.documentElement.style as unknown as { zoom: string }).zoom = `${zoomVal / 100}`;
      }
    } catch (e) {
      console.warn('Error setting initial zoom:', e);
    }

    // Helper to refresh app icon in browser tab, apple touch, and PWA manifest with proper safe-zone padding
    const syncAppIcon = async (settings: WorkshopSettings) => {
      let activeIcon = settings.customAppIcon;
      if (!activeIcon && settings.customLogo) {
        activeIcon = await generateOptimizedAppIcon(settings.customLogo, settings.appIconZoom || 75);
      } else if (!activeIcon) {
        activeIcon = settings.customLogo;
      }

      if (activeIcon) {
        updateAppIcon(activeIcon, settings.workshopName);
      } else {
        resetAppIcon();
      }
    };

    // Listen for real-time workshop settings updates across the entire app
    const handleSettingsUpdated = () => {
      const updated = mockDb.getSettings();
      setWorkshopSettings(updated);
      setRefreshTrigger(prev => prev + 1);
      syncAppIcon(updated);
    };

    // Apply custom logo & app icon on mount
    const initialSettings = mockDb.getSettings();
    syncAppIcon(initialSettings);

    window.addEventListener('workshop_settings_saved', handleSettingsUpdated);
    window.addEventListener('custom_logo_updated', handleSettingsUpdated);
    window.addEventListener('app_icon_updated', handleSettingsUpdated);
    window.addEventListener('app_icon_changed', handleSettingsUpdated);
    window.addEventListener('storage', handleSettingsUpdated);

    // Check if user session exists in localStorage
    const savedUser = localStorage.getItem('taller_celulares_active_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('taller_celulares_active_user');
      }
    }

    return () => {
      window.removeEventListener('workshop_settings_saved', handleSettingsUpdated);
      window.removeEventListener('custom_logo_updated', handleSettingsUpdated);
      window.removeEventListener('app_icon_updated', handleSettingsUpdated);
      window.removeEventListener('app_icon_changed', handleSettingsUpdated);
      window.removeEventListener('storage', handleSettingsUpdated);
    };
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('taller_celulares_active_user', JSON.stringify(user));
    if (user.role === 'TECHNICIAN') {
      setActiveTab('panel_tecnico');
    } else {
      setActiveTab('dashboard');
    }
    setActiveOrderId(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('taller_celulares_active_user');
    setActiveOrderId(null);
  };

  const handleSelectOrder = (orderId: string) => {
    setActiveOrderId(orderId);
  };

  const handleOrderCreated = (orderId: string, openPrintView?: boolean) => {
    setRefreshTrigger(prev => prev + 1);
    setActiveOrderId(orderId);
    setInitialPrintView(!!openPrintView);
  };

  const handleOrderUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Helper to reset database to default seed state
  const handleResetDatabase = () => {
    if (window.confirm('¿Está seguro de restablecer los datos del taller? Se perderán las nuevas órdenes registradas.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!currentUser) {
    return (
      <>
        <PWAInstallPrompt />
        <LoginView onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F3F5] text-[#111111] flex flex-col antialiased font-sans">
      <div className="flex-1 flex flex-col md:flex-row">
      
      {/* DESKTOP SIDEBAR — FUTURISTIC CARBON COMMAND RAIL */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-64 bg-[#0E0E10] text-white flex-col justify-between p-4 shrink-0 select-none z-30 overflow-y-auto border-r border-white/10 shadow-[8px_0_30px_rgba(0,0,0,0.18)]">
        <div className="space-y-6">
          {/* Sidebar Brand Logo Module */}
          <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
            <BolFixLogo 
              variant="icon" 
              customLogo={workshopSettings.customAppIcon || workshopSettings.customLogo}
              className="w-10 h-10 shadow-lg rounded-lg shrink-0 ring-1 ring-white/15" 
            />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-sm font-bold tracking-wider text-white uppercase truncate">
                {workshopSettings.workshopName || 'BOL.FIX'}
              </h1>
              <span className="text-[11px] text-[#00E63C] font-semibold tracking-wide truncate block">
                {workshopSettings.workshopSlogan || 'By: Mauro Medina'}
              </span>
            </div>
          </div>

          {/* Quick Smart Search Trigger Button */}
          <div>
            <button
              id="desktop-global-search-trigger"
              onClick={() => setIsSearchOpen(true)}
              className="w-full min-h-[42px] py-2 px-3 bg-white/[0.05] border border-white/12 hover:border-[#FACC15]/60 hover:bg-white/[0.08] rounded-xl text-left text-xs font-semibold text-gray-300 hover:text-white flex items-center justify-between transition-all duration-150 cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <Search className="w-4 h-4 text-[#FACC15] shrink-0" />
                <span className="truncate tracking-wide">Buscar en sistema...</span>
              </div>
              <span className="text-[10px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded font-mono shrink-0">🔍</span>
            </button>
          </div>

          {/* Navigation Links — Machined Android Rail Style */}
          <nav className="space-y-1.5">
            <button
              id="desktop-tab-dashboard"
              onClick={() => { setActiveTab('dashboard'); setActiveOrderId(null); setListFilter('ALL'); }}
              className={`w-full min-h-[44px] flex items-center space-x-3 py-2.5 px-3.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                activeTab === 'dashboard' && !activeOrderId
                  ? 'bg-[#FACC15] text-[#111111] shadow-[0_6px_18px_-6px_rgba(250,204,21,0.55)] apk-chamfer-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Home className="w-4.5 h-4.5 shrink-0" />
              <span className="whitespace-nowrap truncate">Dashboard / Inicio</span>
            </button>

            <button
              id="desktop-tab-reparaciones"
              onClick={() => { setActiveTab('reparaciones'); setActiveOrderId(null); setListFilter('ALL'); }}
              className={`w-full min-h-[44px] flex items-center space-x-3 py-2.5 px-3.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                activeTab === 'reparaciones' && !activeOrderId
                  ? 'bg-[#FACC15] text-[#111111] shadow-[0_6px_18px_-6px_rgba(250,204,21,0.55)] apk-chamfer-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <ClipboardList className="w-4.5 h-4.5 shrink-0" />
              <span className="whitespace-nowrap truncate">Lista de Reparaciones</span>
            </button>

            {/* PANEL DEL TÉCNICO */}
            <button
              id="desktop-tab-panel-tecnico"
              onClick={() => { setActiveTab('panel_tecnico'); setActiveOrderId(null); }}
              className={`w-full min-h-[44px] flex items-center space-x-3 py-2.5 px-3.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                activeTab === 'panel_tecnico' && !activeOrderId
                  ? 'bg-[#00E63C] text-[#111111] shadow-[0_6px_18px_-6px_rgba(0,230,60,0.45)] apk-chamfer-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Wrench className={`w-4.5 h-4.5 shrink-0 ${activeTab === 'panel_tecnico' && !activeOrderId ? 'text-[#111111]' : 'text-[#00E63C]'}`} />
              <div className="flex items-center justify-between flex-1 min-w-0 gap-1">
                <span className="whitespace-nowrap truncate">Panel del Técnico</span>
                {currentUser.role === 'TECHNICIAN' ? (
                  <span className={`text-[10px] font-mono font-bold shrink-0 ${activeTab === 'panel_tecnico' && !activeOrderId ? 'text-[#111111]/80' : 'text-[#00E63C]'}`}>
                    Mis OTs
                  </span>
                ) : (
                  <span className={`text-[10px] font-mono shrink-0 ${activeTab === 'panel_tecnico' && !activeOrderId ? 'text-[#111111]/75' : 'text-gray-400'}`}>
                    Comisiones
                  </span>
                )}
              </div>
            </button>

            <button
              id="desktop-tab-inventario"
              onClick={() => { setActiveTab('inventario'); setActiveOrderId(null); }}
              className={`w-full min-h-[44px] flex items-center space-x-3 py-2.5 px-3.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                activeTab === 'inventario' && !activeOrderId
                  ? 'bg-[#FACC15] text-[#111111] shadow-[0_6px_18px_-6px_rgba(250,204,21,0.55)] apk-chamfer-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Package className="w-4.5 h-4.5 shrink-0" />
              <span className="whitespace-nowrap truncate">Inventario</span>
            </button>

            {(currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST') && (
              <button
                id="desktop-tab-ventas"
                onClick={() => { setActiveTab('ventas'); setActiveOrderId(null); }}
                className={`w-full min-h-[44px] flex items-center space-x-3 py-2.5 px-3.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                  activeTab === 'ventas' && !activeOrderId
                    ? 'bg-[#FACC15] text-[#111111] shadow-[0_6px_18px_-6px_rgba(250,204,21,0.55)] apk-chamfer-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <ShoppingBag className="w-4.5 h-4.5 shrink-0" />
                <span className="whitespace-nowrap truncate">Punto de Venta (POS)</span>
              </button>
            )}

            {currentUser.role === 'ADMIN' && (
              <>
                <button
                  id="desktop-tab-reportes"
                  onClick={() => { setActiveTab('reportes'); setActiveOrderId(null); }}
                  className={`w-full min-h-[44px] flex items-center space-x-3 py-2.5 px-3.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                    activeTab === 'reportes' && !activeOrderId
                      ? 'bg-[#FACC15] text-[#111111] shadow-[0_6px_18px_-6px_rgba(250,204,21,0.55)] apk-chamfer-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <BarChart3 className="w-4.5 h-4.5 shrink-0" />
                  <span className="whitespace-nowrap truncate">Estadísticas / Reportes</span>
                </button>

                <button
                  id="desktop-tab-configuracion"
                  onClick={() => { setActiveTab('configuracion'); setActiveOrderId(null); }}
                  className={`w-full min-h-[44px] flex items-center space-x-3 py-2.5 px-3.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                    activeTab === 'configuracion' && !activeOrderId
                      ? 'bg-[#FACC15] text-[#111111] shadow-[0_6px_18px_-6px_rgba(250,204,21,0.55)] apk-chamfer-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Settings className="w-4.5 h-4.5 shrink-0" />
                  <span className="whitespace-nowrap truncate">Configuración</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Desktop Sidebar Footer & Profile */}
        <div className="space-y-3 pt-4 mt-auto border-t border-white/10 text-xs shrink-0">
          <div className="flex items-center space-x-3 bg-white/[0.04] border border-white/10 p-2.5 rounded-xl">
            <div className="w-9 h-9 bg-[#FACC15] text-[#111111] font-display font-bold flex items-center justify-center rounded-lg text-sm uppercase shrink-0 apk-chamfer-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold truncate text-white tracking-wide">{currentUser.name}</p>
              <p className="text-[10px] text-gray-400 font-mono truncate">{currentUser.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="desktop-reset-db"
              onClick={handleResetDatabase}
              className="min-h-[40px] py-2 px-2.5 bg-red-950/35 hover:bg-red-600/90 text-red-400 border border-red-900/50 rounded-xl font-bold flex items-center justify-center space-x-1.5 hover:text-white transition-all duration-150 cursor-pointer active:scale-[0.97]"
              title="Restablecer base de datos"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              id="desktop-logout"
              onClick={handleLogout}
              className="min-h-[40px] py-2 px-2.5 bg-white/[0.06] hover:bg-red-600 hover:text-white border border-white/10 rounded-xl text-gray-300 transition-all duration-150 font-bold flex items-center justify-center space-x-1.5 cursor-pointer active:scale-[0.97]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* NATIVE ANDROID TOP APP BAR (Compact 56px, translucent carbon surface) */}
        <header className="md:hidden bg-[#0E0E10]/95 backdrop-blur-xl text-white h-14 px-3.5 flex items-center justify-between border-b border-white/10 shadow-[0_6px_20px_rgba(0,0,0,0.22)] select-none sticky top-0 z-40">
          <div className="flex items-center space-x-2.5 min-w-0" onClick={() => setIsSearchOpen(true)}>
            <BolFixLogo 
              variant="icon" 
              customLogo={workshopSettings.customAppIcon || workshopSettings.customLogo}
              className="w-9 h-9 rounded-lg shadow ring-1 ring-white/15 shrink-0 cursor-pointer" 
            />
            <div className="min-w-0">
              <span className="font-display font-bold text-sm uppercase tracking-wider truncate max-w-[165px] block leading-tight text-white">
                {workshopSettings.workshopName || 'BOL.FIX'}
              </span>
              <span className="text-[10px] text-[#00E63C] font-semibold tracking-wide truncate block leading-tight">
                {workshopSettings.workshopSlogan || 'By: Mauro Medina'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Mobile Global Search trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center bg-white/[0.08] border border-white/10 hover:bg-[#FACC15] hover:text-[#111111] rounded-xl transition-all duration-150 text-white cursor-pointer active:scale-95"
              title="Buscador Inteligente"
            >
              <Search className="w-4 h-4" />
            </button>

            <div className="text-right text-[10px] text-gray-400 font-medium leading-tight px-1">
              <span className="block font-display font-bold text-white">{currentUser.name.split(' ')[0]}</span>
              <span className="text-[#FACC15] font-semibold">{currentUser.role === 'ADMIN' ? 'Admin' : currentUser.role === 'RECEPTIONIST' ? 'Recep' : 'Técnico'}</span>
            </div>

            <button
              id="mobile-logout"
              onClick={handleLogout}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center bg-white/[0.08] border border-white/10 hover:bg-red-600 rounded-xl transition-all duration-150 text-gray-300 hover:text-white cursor-pointer active:scale-95"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* PWA INSTALLATION BANNER (Placed directly below top header) */}
        <PWAInstallPrompt />

        {/* MAIN LAYOUT VIEW WRAPPER */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-7 max-w-7xl mx-auto w-full overflow-y-auto">
        {activeOrderId ? (
          <OrderDetailView
            orderId={activeOrderId}
            currentUser={currentUser}
            onBack={() => {
              setActiveOrderId(null);
              setInitialPrintView(false);
            }}
            onOrderUpdated={handleOrderUpdated}
            initialPrintView={initialPrintView}
            onNavigateToPosWithOrder={handleNavigateToPosWithOrder}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                currentUser={currentUser}
                onNavigateToTab={(tab, filter) => {
                  if (filter) {
                    setListFilter(filter);
                  } else {
                    setListFilter('ALL');
                  }
                  setActiveTab(tab);
                }}
                onSelectOrder={handleSelectOrder}
              />
            )}
            {activeTab === 'recepcion' && (
              <ReceptionView
                currentUser={currentUser}
                onOrderCreated={handleOrderCreated}
              />
            )}
            {activeTab === 'reparaciones' && (
              <OrderListView
                onSelectOrder={handleSelectOrder}
                refreshTrigger={refreshTrigger}
                initialFilter={listFilter}
              />
            )}
            {activeTab === 'panel_tecnico' && (
              <TechnicianPanelView
                currentUser={currentUser}
                onSelectOrder={handleSelectOrder}
              />
            )}
            {activeTab === 'inventario' && (
              <InventoryView currentUser={currentUser} />
            )}
            {activeTab === 'ventas' && (
              <SalesView 
                currentUser={currentUser} 
                posPrefillSale={posPrefillSale}
                onClearPosPrefill={() => setPosPrefillSale(null)}
              />
            )}
            {activeTab === 'reportes' && (
              <ReportsView />
            )}
            {activeTab === 'configuracion' && (
              <SettingsView
                currentUser={currentUser}
                onSettingsSaved={(updated) => {
                  setWorkshopSettings(updated);
                  setRefreshTrigger(prev => prev + 1);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* NATIVE ANDROID APK BOTTOM NAVIGATION DOCK (Material 3 Active Indicator + Carbon Glass) */}
      <nav className="md:hidden sticky bottom-0 left-0 right-0 bg-[#0E0E10]/96 backdrop-blur-xl border-t border-white/10 px-1.5 pt-1.5 pb-1.5 flex items-center justify-around shadow-[0_-8px_24px_rgba(0,0,0,0.22)] z-40 select-none pb-safe">
        
        <button
          id="mobile-tab-dashboard"
          onClick={() => { setActiveTab('dashboard'); setActiveOrderId(null); }}
          className={`relative min-h-[46px] min-w-[48px] flex flex-col items-center justify-center px-2 py-1 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
            activeTab === 'dashboard' && !activeOrderId
              ? 'text-[#FACC15]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span className={`w-10 h-6 rounded-lg flex items-center justify-center transition-all duration-150 ${
            activeTab === 'dashboard' && !activeOrderId ? 'bg-[#FACC15] text-[#111111] shadow-[0_2px_10px_rgba(250,204,21,0.45)]' : ''
          }`}>
            <Home className="w-4.5 h-4.5" />
          </span>
          <span className="font-display text-[10px] font-bold tracking-wide mt-0.5 whitespace-nowrap">Inicio</span>
        </button>

        {/* Panel del Técnico for Mobile */}
        {(currentUser.role === 'TECHNICIAN' || currentUser.role === 'ADMIN') && (
          <button
            id="mobile-tab-panel-tecnico"
            onClick={() => { setActiveTab('panel_tecnico'); setActiveOrderId(null); }}
            className={`relative min-h-[46px] min-w-[48px] flex flex-col items-center justify-center px-2 py-1 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
              activeTab === 'panel_tecnico' && !activeOrderId
                ? 'text-[#00E63C]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className={`w-10 h-6 rounded-lg flex items-center justify-center transition-all duration-150 ${
              activeTab === 'panel_tecnico' && !activeOrderId ? 'bg-[#00E63C] text-[#111111] shadow-[0_2px_10px_rgba(0,230,60,0.45)]' : ''
            }`}>
              <Wrench className={`w-4.5 h-4.5 ${activeTab === 'panel_tecnico' && !activeOrderId ? 'text-[#111111]' : 'text-[#00E63C]'}`} />
            </span>
            <span className="font-display text-[10px] font-bold tracking-wide mt-0.5 whitespace-nowrap">Técnico</span>
          </button>
        )}

        <button
          id="mobile-tab-reparaciones"
          onClick={() => { setActiveTab('reparaciones'); setActiveOrderId(null); }}
          className={`relative min-h-[46px] min-w-[48px] flex flex-col items-center justify-center px-2 py-1 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
            activeTab === 'reparaciones' && !activeOrderId
              ? 'text-[#FACC15]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span className={`w-10 h-6 rounded-lg flex items-center justify-center transition-all duration-150 ${
            activeTab === 'reparaciones' && !activeOrderId ? 'bg-[#FACC15] text-[#111111] shadow-[0_2px_10px_rgba(250,204,21,0.45)]' : ''
          }`}>
            <ClipboardList className="w-4.5 h-4.5" />
          </span>
          <span className="font-display text-[10px] font-bold tracking-wide mt-0.5 whitespace-nowrap">Lista</span>
        </button>

        <button
          id="mobile-tab-inventario"
          onClick={() => { setActiveTab('inventario'); setActiveOrderId(null); }}
          className={`relative min-h-[46px] min-w-[48px] flex flex-col items-center justify-center px-2 py-1 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
            activeTab === 'inventario' && !activeOrderId
              ? 'text-[#FACC15]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span className={`w-10 h-6 rounded-lg flex items-center justify-center transition-all duration-150 ${
            activeTab === 'inventario' && !activeOrderId ? 'bg-[#FACC15] text-[#111111] shadow-[0_2px_10px_rgba(250,204,21,0.45)]' : ''
          }`}>
            <Package className="w-4.5 h-4.5" />
          </span>
          <span className="font-display text-[10px] font-bold tracking-wide mt-0.5 whitespace-nowrap">Stock</span>
        </button>

        {(currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST') && (
          <button
            id="mobile-tab-ventas"
            onClick={() => { setActiveTab('ventas'); setActiveOrderId(null); }}
            className={`relative min-h-[46px] min-w-[48px] flex flex-col items-center justify-center px-2 py-1 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
              activeTab === 'ventas' && !activeOrderId
                ? 'text-[#FACC15]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className={`w-10 h-6 rounded-lg flex items-center justify-center transition-all duration-150 ${
              activeTab === 'ventas' && !activeOrderId ? 'bg-[#FACC15] text-[#111111] shadow-[0_2px_10px_rgba(250,204,21,0.45)]' : ''
            }`}>
              <ShoppingBag className="w-4.5 h-4.5" />
            </span>
            <span className="font-display text-[10px] font-bold tracking-wide mt-0.5 whitespace-nowrap">POS</span>
          </button>
        )}

        {currentUser.role === 'ADMIN' && (
          <button
            id="mobile-tab-configuracion"
            onClick={() => { setActiveTab('configuracion'); setActiveOrderId(null); }}
            className={`relative min-h-[46px] min-w-[48px] flex flex-col items-center justify-center px-2 py-1 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
              activeTab === 'configuracion' && !activeOrderId
                ? 'text-[#FACC15]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className={`w-10 h-6 rounded-lg flex items-center justify-center transition-all duration-150 ${
              activeTab === 'configuracion' && !activeOrderId ? 'bg-[#FACC15] text-[#111111] shadow-[0_2px_10px_rgba(250,204,21,0.45)]' : ''
            }`}>
              <Settings className="w-4.5 h-4.5" />
            </span>
            <span className="font-display text-[10px] font-bold tracking-wide mt-0.5 whitespace-nowrap">Ajustes</span>
          </button>
        )}

      </nav>

      {/* GLOBAL COMMAND PALETTE SEARCH MODAL */}
      <GlobalSearchView
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectOrder={handleSelectOrder}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setActiveOrderId(null);
        }}
        onOpenSaleTicket={(sale) => setSelectedSaleForTicket(sale)}
      />

      {/* VIEW SALE TICKET OVERLAY FROM SEARCH RESULTS */}
      {selectedSaleForTicket && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in text-[#111111]">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-black/15 p-5 flex flex-col justify-between max-h-[90vh]">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
              <span className="font-display text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                <span>Consulta de Comprobante</span>
              </span>
              <button
                onClick={() => setSelectedSaleForTicket(null)}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center text-gray-500 hover:text-black transition-colors bg-gray-100 rounded-xl cursor-pointer"
                title="Cerrar ticket"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 font-mono text-xs pr-1 tabular-nums">
              <div className="text-center space-y-1">
                <div className="flex justify-center mb-1">
                  <BolFixLogo 
                    variant="icon" 
                    customLogo={workshopSettings.customAppIcon || workshopSettings.customLogo}
                    className="w-10 h-10 rounded-xl" 
                  />
                </div>
                <h3 className="font-display text-base font-bold tracking-wider text-center uppercase">
                  {workshopSettings.workshopName || 'BOL.FIX'}
                </h3>
                <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wide">
                  {workshopSettings.workshopSlogan || 'By: Mauro Medina'}
                </p>
                <p className="text-[10px] text-gray-600 font-bold border-t border-dashed border-gray-300 pt-1.5 mt-1.5">
                  REIMPRESIÓN COMPROBANTE
                </p>
                <p className="text-[11px] font-bold tracking-wide font-mono mt-0.5 text-center">
                  N° {selectedSaleForTicket.saleNumber}
                </p>
              </div>

              <div className="space-y-1.5 text-[10px] border-t border-b border-dashed border-gray-300 py-2 font-mono">
                <div className="flex justify-between">
                  <span>Fecha:</span>
                  <span>{new Date(selectedSaleForTicket.date).toLocaleString('es-ES')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Atendido por:</span>
                  <span>{selectedSaleForTicket.user}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span className="font-bold truncate max-w-[150px]">{selectedSaleForTicket.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Método de Pago:</span>
                  <span className="font-bold">{selectedSaleForTicket.paymentMethod}</span>
                </div>
              </div>

              <div className="space-y-1 text-[10px] font-mono">
                {selectedSaleForTicket.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-[9px] leading-relaxed">
                    <span className="w-1/2 truncate font-sans">{item.name}</span>
                    <span className="w-1/6 text-center font-mono">{item.quantity}</span>
                    <span className="w-1/3 text-right font-mono">Bs. {(item.price * item.quantity).toLocaleString('es-ES')}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-300 pt-2 mt-2 space-y-1 text-[10px] font-mono">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Bs. {selectedSaleForTicket.subtotal.toLocaleString('es-ES')}</span>
                </div>
                {selectedSaleForTicket.discount > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>Descuento:</span>
                    <span>-Bs. {selectedSaleForTicket.discount.toLocaleString('es-ES')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs border-t border-dashed border-gray-200 pt-1.5 mt-1">
                  <span>TOTAL PAGADO:</span>
                  <span>Bs. {selectedSaleForTicket.total.toLocaleString('es-ES')}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 mt-4">
              <button
                onClick={() => window.print()}
                className="flex-1 min-h-[44px] py-2.5 bg-[#111111] hover:bg-black text-[#FACC15] rounded-xl font-display font-bold tracking-wider uppercase flex items-center justify-center space-x-2 text-xs cursor-pointer apk-chamfer-sm active:scale-[0.98] transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
      </div>
    </div>
  );
}
