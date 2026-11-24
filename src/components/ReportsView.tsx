/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Wrench, 
  FileText, 
  Download, 
  Calendar, 
  Smartphone, 
  AlertTriangle,
  ArrowUpRight,
  Package,
  ShoppingBag,
  Users,
  CheckCircle
} from 'lucide-react';
import { mockDb } from '../db/mockDb';
import { Product, Sale, Order, Payment } from '../types';

type DateFilter = 'TODAY' | 'WEEK' | 'MONTH' | 'ALL';

export default function ReportsView() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  
  // Loaded records
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Hover state for interactive chart tooltip
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  useEffect(() => {
    setProducts(mockDb.getProducts());
    setSales(mockDb.getSales());
    setOrders(mockDb.getOrders());
    setPayments(mockDb.getPayments());
  }, []);

  // Filter records by date
  const getFilteredData = () => {
    const now = new Date();
    let startDate = new Date();

    if (dateFilter === 'TODAY') {
      startDate.setHours(0, 0, 0, 0);
    } else if (dateFilter === 'WEEK') {
      startDate.setDate(now.getDate() - 7);
    } else if (dateFilter === 'MONTH') {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      // ALL
      startDate = new Date(0); // Epoch start
    }

    const filteredSales = sales.filter(s => new Date(s.date) >= startDate);
    const filteredOrders = orders.filter(o => new Date(o.createdAt) >= startDate);
    const filteredPayments = payments.filter(p => new Date(p.date) >= startDate);

    return { filteredSales, filteredOrders, filteredPayments };
  };

  const { filteredSales, filteredOrders, filteredPayments } = getFilteredData();

  // === CALCULATE FINANCIAL METRICS ===
  
  // Total Sales Income
  const salesIncome = filteredSales.reduce((sum, s) => sum + s.total, 0);

  // Total Repair Income (All payments registered within the selected timeframe)
  const repairIncome = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  // Total Combined Revenue
  const totalRevenue = salesIncome + repairIncome;

  // Active Repair Orders Count
  const activeRepairsCount = filteredOrders.filter(o => o.status !== 'ENTREGADO').length;

  // Inventory Asset Value (Current products in stock * purchase price)
  const totalInventoryAssetValue = products.reduce((sum, p) => sum + (p.purchasePrice * p.stock), 0);

  // Critical stock items
  const lowStockItems = products.filter(p => p.stock <= p.minStock);

  // === CHART 1: REVENUE SOURCE COMPARISON BAR DATA ===
  const chartData = [
    { name: 'Repuestos & Accesorios (Ventas)', value: salesIncome, color: '#FACC15' },
    { name: 'Servicio Técnico (Reparaciones)', value: repairIncome, color: '#111111' }
  ];

  // === CHART 2: REPAIR STATUS COUNTS ===
  const repairStatusCounts = {
    RECIBIDO: filteredOrders.filter(o => o.status === 'RECIBIDO').length,
    DIAGNOSTICO: filteredOrders.filter(o => o.status === 'DIAGNOSTICO').length,
    ESPERANDO_REPUESTO: filteredOrders.filter(o => o.status === 'ESPERANDO_REPUESTO').length,
    REPARANDO: filteredOrders.filter(o => o.status === 'REPARANDO').length,
    LISTO: filteredOrders.filter(o => o.status === 'LISTO').length,
    ENTREGADO: filteredOrders.filter(o => o.status === 'ENTREGADO').length,
  };

  const totalStatusCount = Object.values(repairStatusCounts).reduce((a, b) => a + b, 0);

  // === CHART 3: TOP SELLING PRODUCTS ===
  // Calculate quantity sold per product from sales
  const productSalesMap: Record<string, { name: string; qty: number; total: number }> = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (item.type === 'PRODUCT' && item.referenceId) {
        if (!productSalesMap[item.referenceId]) {
          productSalesMap[item.referenceId] = { name: item.name, qty: 0, total: 0 };
        }
        productSalesMap[item.referenceId].qty += item.quantity;
        productSalesMap[item.referenceId].total += item.quantity * item.price;
      }
    });
  });

  const topSellingProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Export financial summary report to CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'REPORT FINANCIAL SUMMARY - TALLER DE REPARACIONES Y VENTAS\r\n';
    csvContent += `Date Filter: ${dateFilter}\r\n`;
    csvContent += `Generated At: ${new Date().toLocaleString()}\r\n\r\n`;

    csvContent += 'FINANCIALS,Amount (Bs.)\r\n';
    csvContent += `Sales Revenue (Repuestos/Accesorios),${salesIncome}\r\n`;
    csvContent += `Repair Revenue (Servicio Técnico),${repairIncome}\r\n`;
    csvContent += `Total Revenue Combined,${totalRevenue}\r\n`;
    csvContent += `Inventory Asset Value,${totalInventoryAssetValue}\r\n\r\n`;

    csvContent += 'TRANSACTION HISTORY (SALES)\r\n';
    csvContent += 'Sale Number,Date,Client Name,Payment Method,Total (Bs.)\r\n';
    filteredSales.forEach(s => {
      csvContent += `${s.saleNumber},${s.date},"${s.clientName}",${s.paymentMethod},${s.total}\r\n`;
    });
    csvContent += '\r\n';

    csvContent += 'REPAIR ORDERS IN TIMEFRAME\r\n';
    csvContent += 'OT Number,Created At,Client Name,Brand/Model,Status,Estimated Cost (Bs.)\r\n';
    filteredOrders.forEach(o => {
      csvContent += `${o.otNumber},${o.createdAt},"${o.clientName}",${o.brand} ${o.model},${o.status},${o.estimatedCost}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_financiero_${dateFilter.toLowerCase()}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="reports-module-view" className="space-y-5 pb-12 animate-fade-in text-[#111111]">
      
      {/* HEADER ROW WITH DATE FILTER BUTTONS */}
      <div className="apk-dark-panel apk-chamfer-tr text-white p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 bg-[#FACC15] text-[#111111] rounded-xl flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(250,204,21,0.28)]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display text-[10px] uppercase tracking-[0.16em] text-[#FACC15] font-bold block">
              TELEMETRÍA FINANCIERA
            </span>
            <h1 className="font-display text-lg sm:text-xl font-bold text-white uppercase tracking-wide mt-0.5">
              Estadísticas & Reportes
            </h1>
            <p className="text-xs text-zinc-400">Métricas clave, rendimiento de taller y análisis de rentabilidad</p>
          </div>
        </div>

        {/* Date Filters & CSV Export */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filters toggle */}
          <div className="flex bg-white/[0.06] p-1 rounded-xl border border-white/10">
            {(['TODAY', 'WEEK', 'MONTH', 'ALL'] as DateFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-3 py-1.5 rounded-lg font-display text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  dateFilter === filter 
                    ? 'bg-[#FACC15] text-[#111111]' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {filter === 'TODAY' ? 'Hoy' : filter === 'WEEK' ? '7 Días' : filter === 'MONTH' ? 'Este Mes' : 'Todo'}
              </button>
            ))}
          </div>

          <button
            id="export-csv-report-btn"
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-4 py-2 min-h-[38px] bg-[#FACC15] hover:bg-[#fde047] text-[#111111] apk-chamfer-sm font-display font-bold uppercase tracking-wider text-xs transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* METRIC SUMMARIES BENTO GRID (4 Items) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="apk-card p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-display text-[10px] font-bold text-zinc-500 uppercase tracking-[0.14em] block">Ingresos Totales</span>
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-[#111111] font-mono tabular-nums tracking-tight block">
              Bs. {totalRevenue.toLocaleString('es-ES')}
            </span>
            <div className="flex items-center space-x-1.5 mt-1.5">
              <span className="apk-tech-tag bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> +100%
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">Ventas + Servicios</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Sales Revenue */}
        <div className="apk-card p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-display text-[10px] font-bold text-zinc-500 uppercase tracking-[0.14em] block">Venta Repuestos</span>
            <div className="w-9 h-9 bg-[#FACC15]/20 text-[#111111] border border-[#FACC15]/40 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-[#111111] font-mono tabular-nums tracking-tight block">
              Bs. {salesIncome.toLocaleString('es-ES')}
            </span>
            <p className="text-[11px] text-zinc-500 font-medium mt-1.5 tabular-nums">
              {filteredSales.length} transacciones registradas
            </p>
          </div>
        </div>

        {/* Metric 3: Repairs Revenue */}
        <div className="apk-card p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-display text-[10px] font-bold text-zinc-500 uppercase tracking-[0.14em] block">Servicio Técnico</span>
            <div className="w-9 h-9 bg-purple-50 text-purple-700 border border-purple-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-[#111111] font-mono tabular-nums tracking-tight block">
              Bs. {repairIncome.toLocaleString('es-ES')}
            </span>
            <p className="text-[11px] text-zinc-500 font-medium mt-1.5 tabular-nums">
              {activeRepairsCount} órdenes activas en taller
            </p>
          </div>
        </div>

        {/* Metric 4: Inventory Asset Value */}
        <div className="apk-card p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-display text-[10px] font-bold text-zinc-500 uppercase tracking-[0.14em] block">Valor de Activos</span>
            <div className="w-9 h-9 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-[#111111] font-mono tabular-nums tracking-tight block">
              Bs. {totalInventoryAssetValue.toLocaleString('es-ES')}
            </span>
            <p className="text-[11px] text-zinc-500 font-medium mt-1.5 tabular-nums">
              {lowStockItems.length} productos en stock crítico
            </p>
          </div>
        </div>
      </div>

      {/* DETAILED STATS ROW: REVENUE SOURCE CHART & ORDER STATUS BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CHART Column: REVENUE COMPARISON BARS (7 Cols) */}
        <div className="lg:col-span-7 apk-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-4 bg-[#FACC15] rounded-xs" />
            <div>
              <h3 className="font-display text-xs font-bold text-[#111111] uppercase tracking-[0.12em]">Distribución de Ingresos</h3>
              <p className="text-[11px] text-zinc-500">Comparativa proporcional de ingresos por fuente de venta</p>
            </div>
          </div>

          {/* CUSTOM INTERACTIVE SVG BAR CHART */}
          <div className="relative pt-6">
            <div className="flex h-52 items-end justify-around border-b border-zinc-200 pb-2 relative">
              
              {/* Chart Grid Lines */}
              <div className="absolute inset-x-0 top-0 border-t border-zinc-200/70 border-dashed pointer-events-none"></div>
              <div className="absolute inset-x-0 top-1/3 border-t border-zinc-200/70 border-dashed pointer-events-none"></div>
              <div className="absolute inset-x-0 top-2/3 border-t border-zinc-200/70 border-dashed pointer-events-none"></div>

              {chartData.map((data, index) => {
                // Calculate percentage height
                const maxValue = Math.max(...chartData.map(d => d.value), 1);
                const pct = Math.max(10, (data.value / maxValue) * 100);

                return (
                  <div 
                    key={index} 
                    className="flex flex-col items-center w-1/3 group relative h-full justify-end"
                    onMouseEnter={() => setHoveredBarIndex(index)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {/* Tooltip Overlay */}
                    {hoveredBarIndex === index && (
                      <div className="absolute -top-12 bg-[#111111] text-white px-3 py-1.5 rounded-lg text-[10px] font-mono shadow-lg z-10 text-center pointer-events-none whitespace-nowrap border border-[#FACC15]/30">
                        <span className="block font-bold text-[#FACC15] tabular-nums">Bs. {data.value.toLocaleString('es-ES')}</span>
                        <span className="text-[9px] text-zinc-400 tabular-nums">{((data.value / Math.max(totalRevenue, 1)) * 100).toFixed(1)}% del Total</span>
                      </div>
                    )}

                    {/* Animated Bar */}
                    <div 
                      style={{ height: `${pct}%` }}
                      className={`w-14 sm:w-20 rounded-t-lg transition-all duration-300 cursor-pointer border ${
                        index === 0 
                          ? 'bg-[#111111] border-[#111111] hover:bg-zinc-800' 
                          : 'bg-[#FACC15] border-[#eab308] hover:bg-[#fde047]'
                      }`}
                    ></div>

                    {/* Short label */}
                    <span className="font-display text-[10px] font-bold text-zinc-700 mt-2 uppercase tracking-wider text-center block max-w-full truncate px-1">
                      {index === 0 ? 'Ventas' : 'Reparaciones'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart Legends */}
          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div className="flex items-start space-x-2.5 p-3 bg-[#F6F7F9] border border-zinc-200/70 rounded-xl">
              <div className="w-3 h-3 bg-[#111111] rounded-xs mt-0.5 shrink-0"></div>
              <div className="min-w-0">
                <span className="font-display text-[10px] text-zinc-500 block font-bold uppercase tracking-wider truncate">Repuestos & Accesorios</span>
                <span className="font-mono font-bold text-[#111111] tabular-nums">Bs. {salesIncome.toLocaleString('es-ES')}</span>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 p-3 bg-[#F6F7F9] border border-zinc-200/70 rounded-xl">
              <div className="w-3 h-3 bg-[#FACC15] rounded-xs mt-0.5 shrink-0"></div>
              <div className="min-w-0">
                <span className="font-display text-[10px] text-zinc-500 block font-bold uppercase tracking-wider truncate">Servicio Técnico</span>
                <span className="font-mono font-bold text-[#111111] tabular-nums">Bs. {repairIncome.toLocaleString('es-ES')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* REPAIR STATUS BREAKDOWN DONUT/PIE DATA (5 Cols) */}
        <div className="lg:col-span-5 apk-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-4 bg-[#111111] rounded-xs" />
            <div>
              <h3 className="font-display text-xs font-bold text-[#111111] uppercase tracking-[0.12em]">Estado de Reparaciones</h3>
              <p className="text-[11px] text-zinc-500">Órdenes registradas clasificadas según estado actual</p>
            </div>
          </div>

          {/* Proportional horizontal state bars */}
          <div className="space-y-3 pt-1">
            {Object.entries(repairStatusCounts).map(([status, count]) => {
              const percentage = totalStatusCount > 0 ? (count / totalStatusCount) * 100 : 0;
              
              // Get custom styling colors based on status
              const getColorStyle = (st: string) => {
                switch(st) {
                  case 'RECIBIDO': return 'bg-blue-500';
                  case 'DIAGNOSTICO': return 'bg-purple-500';
                  case 'ESPERANDO_REPUESTO': return 'bg-amber-500';
                  case 'REPARANDO': return 'bg-[#FACC15]';
                  case 'LISTO': return 'bg-[#00B82B]';
                  case 'ENTREGADO': return 'bg-zinc-500';
                  default: return 'bg-zinc-400';
                }
              };

              const getStatusLabel = (st: string) => {
                switch(st) {
                  case 'RECIBIDO': return 'Recibido';
                  case 'DIAGNOSTICO': return 'En Diagnóstico';
                  case 'ESPERANDO_REPUESTO': return 'Esp. Repuesto';
                  case 'REPARANDO': return 'Reparando';
                  case 'LISTO': return 'Listo / Listo para Entrega';
                  case 'ENTREGADO': return 'Entregado';
                  default: return st;
                }
              };

              return (
                <div key={status} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-zinc-700">{getStatusLabel(status)}</span>
                    <span className="font-bold text-[#111111] font-mono tabular-nums">
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  
                  {/* Progress Bar background */}
                  <div className="h-2 w-full bg-[#F2F3F5] rounded-xs overflow-hidden border border-zinc-200/60">
                    <div 
                      className={`h-full rounded-xs ${getColorStyle(status)} transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-[#111111] text-white rounded-xl flex justify-between items-center">
            <span className="font-display text-[10px] font-bold text-zinc-400 uppercase tracking-[0.14em]">Total de Órdenes:</span>
            <span className="text-sm font-bold text-[#FACC15] font-mono tabular-nums">{totalStatusCount} OTs</span>
          </div>
        </div>
      </div>

      {/* LOWER BENTO ROW: TOP SELLING PRODUCTS & CRITICAL INVENTORY ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Products Grid */}
        <div className="apk-card p-5 sm:p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-[#FACC15] rounded-xs" />
              <div>
                <h3 className="font-display text-xs font-bold text-[#111111] uppercase tracking-[0.12em]">Productos más Vendidos</h3>
                <p className="text-[11px] text-zinc-500">Repuestos y accesorios con mayor salida comercial</p>
              </div>
            </div>
            <div className="w-9 h-9 bg-[#FACC15]/20 text-[#111111] rounded-xl flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>

          <div className="divide-y divide-zinc-100">
            {topSellingProducts.length === 0 ? (
              <p className="py-6 text-xs text-zinc-400 text-center">Aún no se han registrado ventas de productos.</p>
            ) : (
              topSellingProducts.map((p, index) => (
                <div key={index} className="py-3 flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-3 pr-2 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-[#111111] text-[#FACC15] flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0">
                      0{index + 1}
                    </span>
                    <span className="font-display font-bold text-[#111111] truncate" title={p.name}>
                      {p.name}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-[#111111] font-mono tabular-nums block">
                      {p.qty} unidades
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold font-mono tabular-nums">
                      Bs. {p.total.toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Notifications / Alerts Grid */}
        <div className="apk-card p-5 sm:p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-amber-500 rounded-xs" />
              <div>
                <h3 className="font-display text-xs font-bold uppercase tracking-[0.12em] text-amber-800">Alertas de Stock Crítico</h3>
                <p className="text-[11px] text-amber-700/80 font-medium">Repuestos con existencia igual o inferior al mínimo permitido</p>
              </div>
            </div>
            <div className="w-9 h-9 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="divide-y divide-zinc-100 max-h-56 overflow-y-auto pr-1">
            {lowStockItems.length === 0 ? (
              <div className="py-8 text-center text-emerald-600 space-y-1">
                <CheckCircle className="w-7 h-7 mx-auto text-[#00B82B]" />
                <p className="font-display text-xs font-bold uppercase tracking-wider">Todo en orden</p>
                <p className="text-[11px] text-zinc-500">No hay productos con existencias críticas en inventario.</p>
              </div>
            ) : (
              lowStockItems.map((p) => (
                <div key={p.id} className="py-3 flex justify-between items-center text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-display font-bold text-[#111111] truncate max-w-[200px]" title={p.name}>{p.name}</p>
                    <p className="text-[10px] text-zinc-400 font-mono">Cód: {p.code} · Cat: {p.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="apk-tech-tag bg-red-50 text-red-700 border border-red-200 font-mono tabular-nums">
                      Stock: {p.stock}
                    </span>
                    <span className="block text-[10px] text-zinc-400 font-mono mt-1 tabular-nums">Mínimo: {p.minStock}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
