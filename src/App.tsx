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
import { User, Sale } from './types';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import ReceptionView from './components/ReceptionView';
import OrderListView from './components/OrderListView';
import OrderDetailView from './components/OrderDetailView';
import InventoryView from './components/InventoryView';
import SalesView from './components/SalesView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import GlobalSearchView from './components/GlobalSearchView';
import { mockDb } from './db/mockDb';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard'); // 'dashboard', 'recepcion', 'reparaciones', 'inventario', 'ventas', 'reportes'
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<string>('ALL');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [selectedSaleForTicket, setSelectedSaleForTicket] = useState<Sale | null>(null);
  
  // A simple counter to trigger state re-fetching in list view when operations occur
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    // Check if user session exists in localStorage
    const savedUser = localStorage.getItem('taller_celulares_active_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('taller_celulares_active_user');
      }
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('taller_celulares_active_user', JSON.stringify(user));
    setActiveTab('dashboard');
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

  const handleOrderCreated = (orderId: string) => {
    setRefreshTrigger(prev => prev + 1);
    setActiveOrderId(orderId);
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
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-gray-900 flex flex-col md:flex-row antialiased font-sans">
      
      {/* DESKTOP SIDEBAR (Visible only on md: screens and larger) */}
      <aside className="hidden md:flex md:w-64 bg-[#111111] text-white flex-col justify-between p-5 shrink-0 select-none">
        <div className="space-y-8">
          {/* Sidebar Brand Logo */}
          <div className="flex items-center space-x-3 px-2">
            <div className="w-10 h-10 bg-[#FACC15] rounded-xl flex items-center justify-center shadow-md">
              <Smartphone className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white uppercase">Taller Celulares</h1>
              <span className="text-[10px] text-[#FACC15] font-bold">Panel Administrativo</span>
            </div>
          </div>

          {/* Quick Smart Search Trigger Button */}
          <div className="px-2">
            <button
              id="desktop-global-search-trigger"
              onClick={() => setIsSearchOpen(true)}
              className="w-full py-2.5 px-3.5 bg-white/5 border border-white/10 hover:border-[#FACC15]/45 rounded-xl text-left text-xs font-bold text-gray-300 hover:text-white flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <Search className="w-4 h-4 text-[#FACC15]" />
                <span>Buscar en sistema...</span>
              </div>
              <span className="text-[9px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded font-mono">🔍</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              id="desktop-tab-dashboard"
              onClick={() => { setActiveTab('dashboard'); setActiveOrderId(null); setListFilter('ALL'); }}
              className={`w-full flex items-center space-x-3.5 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'dashboard' && !activeOrderId
                  ? 'bg-[#FACC15] text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home className="w-4.5 h-4.5" />
              <span>Dashboard / Inicio</span>
            </button>

            {(currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST') && (
              <button
                id="desktop-tab-recepcion"
                onClick={() => { setActiveTab('recepcion'); setActiveOrderId(null); }}
                className={`w-full flex items-center space-x-3.5 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'recepcion' && !activeOrderId
                    ? 'bg-[#FACC15] text-black shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <PlusCircle className="w-4.5 h-4.5" />
                <span>Recepción (Nueva OT)</span>
              </button>
            )}

            <button
              id="desktop-tab-reparaciones"
              onClick={() => { setActiveTab('reparaciones'); setActiveOrderId(null); setListFilter('ALL'); }}
              className={`w-full flex items-center space-x-3.5 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'reparaciones' && !activeOrderId
                  ? 'bg-[#FACC15] text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ClipboardList className="w-4.5 h-4.5" />
              <span>Lista de Reparaciones</span>
            </button>

            <button
              id="desktop-tab-inventario"
              onClick={() => { setActiveTab('inventario'); setActiveOrderId(null); }}
              className={`w-full flex items-center space-x-3.5 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'inventario' && !activeOrderId
                  ? 'bg-[#FACC15] text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Package className="w-4.5 h-4.5" />
              <span>Inventario</span>
            </button>

            {(currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST') && (
              <button
                id="desktop-tab-ventas"
                onClick={() => { setActiveTab('ventas'); setActiveOrderId(null); }}
                className={`w-full flex items-center space-x-3.5 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'ventas' && !activeOrderId
                    ? 'bg-[#FACC15] text-black shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <ShoppingBag className="w-4.5 h-4.5" />
                <span>Ventas / Caja</span>
              </button>
            )}

            {currentUser.role === 'ADMIN' && (
              <>
                <button
                  id="desktop-tab-reportes"
                  onClick={() => { setActiveTab('reportes'); setActiveOrderId(null); }}
                  className={`w-full flex items-center space-x-3.5 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === 'reportes' && !activeOrderId
                      ? 'bg-[#FACC15] text-black shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BarChart3 className="w-4.5 h-4.5" />
                  <span>Estadísticas / Reportes</span>
                </button>

                <button
                  id="desktop-tab-configuracion"
                  onClick={() => { setActiveTab('configuracion'); setActiveOrderId(null); }}
                  className={`w-full flex items-center space-x-3.5 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === 'configuracion' && !activeOrderId
                      ? 'bg-[#FACC15] text-black shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Settings className="w-4.5 h-4.5" />
                  <span>Configuración</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Desktop Sidebar Footer & Profile */}
        <div className="space-y-4 pt-4 border-t border-white/10 text-xs">
          <div className="flex items-center space-x-3 bg-white/5 p-2.5 rounded-xl">
            <div className="w-8 h-8 bg-[#FACC15] text-black font-black flex items-center justify-center rounded-lg text-sm uppercase">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-bold truncate text-white">{currentUser.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{currentUser.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="desktop-reset-db"
              onClick={handleResetDatabase}
              className="py-2 px-2.5 bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-950 rounded-xl font-bold flex items-center justify-center space-x-1 hover:text-white transition-all cursor-pointer"
              title="Restablecer base de datos"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              id="desktop-logout"
              onClick={handleLogout}
              className="py-2 px-2.5 bg-white/5 hover:bg-red-600 hover:text-white rounded-xl text-gray-400 transition-all font-bold flex items-center justify-center space-x-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER (Sticky top logo/user action bar) */}
      <header className="md:hidden bg-[#111111] text-white py-3 px-4 flex items-center justify-between shadow-md select-none sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#FACC15] rounded-lg flex items-center justify-center shadow" onClick={() => setIsSearchOpen(true)}>
            <Smartphone className="w-5 h-5 text-black" />
          </div>
          <span className="font-extrabold text-sm uppercase tracking-wide">Taller Celulares</span>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Mobile Global Search trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 bg-white/10 hover:bg-[#FACC15] hover:text-black rounded-xl transition-all text-white cursor-pointer"
            title="Buscador Inteligente"
          >
            <Search className="w-4 h-4" />
          </button>

          <div className="text-right text-[10px] text-gray-400 font-medium">
            <span className="block font-bold text-white leading-none">{currentUser.name.split(' ')[0]}</span>
            <span>{currentUser.role === 'ADMIN' ? 'Admin' : currentUser.role === 'RECEPTIONIST' ? 'Recep' : 'Técnico'}</span>
          </div>

          <button
            id="mobile-logout"
            onClick={handleLogout}
            className="p-2 bg-white/10 hover:bg-red-600 rounded-xl transition-all text-gray-300 hover:text-white cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT VIEW WRAPPER */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {activeOrderId ? (
          <OrderDetailView
            orderId={activeOrderId}
            currentUser={currentUser}
            onBack={() => setActiveOrderId(null)}
            onOrderUpdated={handleOrderUpdated}
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
            {activeTab === 'inventario' && (
              <InventoryView currentUser={currentUser} />
            )}
            {activeTab === 'ventas' && (
              <SalesView currentUser={currentUser} />
            )}
            {activeTab === 'reportes' && (
              <ReportsView />
            )}
            {activeTab === 'configuracion' && (
              <SettingsView currentUser={currentUser} />
            )}
          </>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION TAB BAR (Sticky bottom layout for mobile screens) */}
      <div className="md:hidden sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-1.5 px-1 flex items-center justify-around shadow-lg z-40 select-none pb-safe">
        
        <button
          id="mobile-tab-dashboard"
          onClick={() => { setActiveTab('dashboard'); setActiveOrderId(null); }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard' && !activeOrderId
              ? 'text-yellow-600 font-extrabold bg-[#FACC15]/10 px-2.5'
              : 'text-gray-400 font-medium'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] mt-0.5">Inicio</span>
        </button>

        {(currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST') && (
          <button
            id="mobile-tab-recepcion"
            onClick={() => { setActiveTab('recepcion'); setActiveOrderId(null); }}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'recepcion' && !activeOrderId
                ? 'text-yellow-600 font-extrabold bg-[#FACC15]/10 px-2.5'
                : 'text-gray-400 font-medium'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span className="text-[9px] mt-0.5">Recibir</span>
          </button>
        )}

        <button
          id="mobile-tab-reparaciones"
          onClick={() => { setActiveTab('reparaciones'); setActiveOrderId(null); }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'reparaciones' && !activeOrderId
              ? 'text-yellow-600 font-extrabold bg-[#FACC15]/10 px-2.5'
              : 'text-gray-400 font-medium'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[9px] mt-0.5">Lista</span>
        </button>

        <button
          id="mobile-tab-inventario"
          onClick={() => { setActiveTab('inventario'); setActiveOrderId(null); }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'inventario' && !activeOrderId
              ? 'text-yellow-600 font-extrabold bg-[#FACC15]/10 px-2.5'
              : 'text-gray-400 font-medium'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[9px] mt-0.5">Stock</span>
        </button>

        {(currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST') && (
          <button
            id="mobile-tab-ventas"
            onClick={() => { setActiveTab('ventas'); setActiveOrderId(null); }}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'ventas' && !activeOrderId
                ? 'text-yellow-600 font-extrabold bg-[#FACC15]/10 px-2.5'
                : 'text-gray-400 font-medium'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[9px] mt-0.5">Vender</span>
          </button>
        )}

        {currentUser.role === 'ADMIN' && (
          <button
            id="mobile-tab-configuracion"
            onClick={() => { setActiveTab('configuracion'); setActiveOrderId(null); }}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'configuracion' && !activeOrderId
                ? 'text-yellow-600 font-extrabold bg-[#FACC15]/10 px-2.5'
                : 'text-gray-400 font-medium'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[9px] mt-0.5">Ajustes</span>
          </button>
        )}

      </div>

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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in text-[#111111]">
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-150 p-6 flex flex-col justify-between max-h-[90vh]">
            <div className="flex justify-between items-center pb-3 border-b border-gray-150 mb-4">
              <span className="text-xs font-black text-gray-700 flex items-center gap-1">
                <span>Consulta de Comprobante</span>
              </span>
              <button
                onClick={() => setSelectedSaleForTicket(null)}
                className="text-gray-400 hover:text-black transition-colors p-1 bg-gray-100 rounded-full"
                title="Cerrar ticket"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 font-mono text-xs pr-1">
              <div className="text-center space-y-1">
                <h3 className="text-base font-black tracking-tight text-center uppercase">SERVICIO TÉCNICO EXPRESS</h3>
                <p className="text-[9px] text-gray-500 uppercase">Soluciones Móviles & Accesorios</p>
                <p className="text-[10px] text-gray-600 font-bold border-t border-dashed border-gray-300 pt-1.5 mt-1.5">
                  REIMPRESIÓN COMPROBANTE
                </p>
                <p className="text-[11px] font-black tracking-wide font-mono mt-0.5 text-center">
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
                  <span className="font-extrabold truncate max-w-[150px]">{selectedSaleForTicket.clientName}</span>
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
                <div className="flex justify-between font-black text-xs border-t border-dashed border-gray-200 pt-1.5 mt-1">
                  <span>TOTAL PAGADO:</span>
                  <span>Bs. {selectedSaleForTicket.total.toLocaleString('es-ES')}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-150 mt-4">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-black hover:bg-gray-900 text-[#FACC15] rounded-xl font-bold flex items-center justify-center space-x-1.5 text-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
