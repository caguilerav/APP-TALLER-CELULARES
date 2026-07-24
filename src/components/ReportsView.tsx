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
    <div id="reports-module-view" className="space-y-6 pb-12 animate-fade-in text-gray-900">
      
      {/* HEADER ROW WITH DATE FILTER BUTTONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-black text-[#FACC15] rounded-xl shadow-md">
            <BarChart3 className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Estadísticas & Reportes</h1>
            <p className="text-xs text-gray-500">Métricas clave, rendimiento de taller y análisis de rentabilidad</p>
          </div>
        </div>

        {/* Date Filters & CSV Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filters toggle */}
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            {(['TODAY', 'WEEK', 'MONTH', 'ALL'] as DateFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  dateFilter === filter 
                    ? 'bg-black text-[#FACC15] shadow-xs' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {filter === 'TODAY' ? 'Hoy' : filter === 'WEEK' ? '7 Días' : filter === 'MONTH' ? 'Este Mes' : 'Todo'}
              </button>
            ))}
          </div>

          <button
            id="export-csv-report-btn"
            onClick={handleExportCSV}
            className="flex items-center space-x-1 px-4 py-2 bg-black hover:bg-gray-900 text-[#FACC15] border border-black rounded-xl font-extrabold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* METRIC SUMMARIES BENTO GRID (4 Items) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Ingresos Totales</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-gray-900 font-mono tracking-tight block">
              Bs. {totalRevenue.toLocaleString('es-ES')}
            </span>
            <div className="flex items-center space-x-1 mt-1">
              <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> +100%
              </span>
              <span className="text-[9px] text-gray-400 font-medium">Ventas + Servicios</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Sales Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Venta Repuestos</span>
            <div className="p-2 bg-[#FACC15]/10 text-yellow-800 rounded-xl">
              <ShoppingBag className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-gray-900 font-mono tracking-tight block">
              Bs. {salesIncome.toLocaleString('es-ES')}
            </span>
            <p className="text-[9px] text-gray-400 font-medium mt-1">
              {filteredSales.length} transacciones registradas
            </p>
          </div>
        </div>

        {/* Metric 3: Repairs Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Servicio Técnico</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
              <Wrench className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-gray-900 font-mono tracking-tight block">
              Bs. {repairIncome.toLocaleString('es-ES')}
            </span>
            <p className="text-[9px] text-gray-400 font-medium mt-1">
              {activeRepairsCount} órdenes activas en taller
            </p>
          </div>
        </div>

        {/* Metric 4: Inventory Asset Value */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Valor de Activos</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-gray-900 font-mono tracking-tight block">
              Bs. {totalInventoryAssetValue.toLocaleString('es-ES')}
            </span>
            <p className="text-[9px] text-gray-400 font-medium mt-1">
              {lowStockItems.length} productos en stock crítico
            </p>
          </div>
        </div>
      </div>

      {/* DETAILED STATS ROW: REVENUE SOURCE CHART & ORDER STATUS BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART Column: REVENUE COMPARISON BARS (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Distribución de Ingresos</h3>
            <p className="text-[10px] text-gray-400">Comparativa proporcional de ingresos por fuente de venta</p>
          </div>

          {/* CUSTOM INTERACTIVE SVG BAR CHART */}
          <div className="relative pt-6">
            <div className="flex h-52 items-end justify-around border-b border-gray-200 pb-2 relative">
              
              {/* Chart Grid Lines */}
              <div className="absolute inset-x-0 top-0 border-t border-gray-100 border-dashed pointer-events-none"></div>
              <div className="absolute inset-x-0 top-1/3 border-t border-gray-100 border-dashed pointer-events-none"></div>
              <div className="absolute inset-x-0 top-2/3 border-t border-gray-100 border-dashed pointer-events-none"></div>

              {chartData.map((data, index) => {
                // Calculate percentage height
                const maxValue = Math.max(...chartData.map(d => d.value), 1);
                const pct = Math.max(10, (data.value / maxValue) * 100);

                return (
                  <div 
                    key={index} 
                    className="flex flex-col items-center w-1/3 group relative"
                    onMouseEnter={() => setHoveredBarIndex(index)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {/* Tooltip Overlay */}
                    {hoveredBarIndex === index && (
                      <div className="absolute -top-12 bg-black text-white px-2.5 py-1.5 rounded-lg text-[9px] font-mono shadow-md z-10 text-center pointer-events-none whitespace-nowrap">
                        <span className="block font-bold text-[#FACC15]">Bs. {data.value.toLocaleString('es-ES')}</span>
                        <span className="text-[8px] text-gray-400">{((data.value / Math.max(totalRevenue, 1)) * 100).toFixed(1)}% del Total</span>
                      </div>
                    )}

                    {/* Animated Bar */}
                    <div 
                      style={{ height: `${pct}%` }}
                      className={`w-14 sm:w-20 rounded-t-xl transition-all duration-500 cursor-pointer border shadow-sm ${
                        index === 0 
                          ? 'bg-black border-black hover:bg-gray-900' 
                          : 'bg-[#FACC15] border-[#FACC15] hover:bg-[#E2B612]'
                      }`}
                    ></div>

                    {/* Short label */}
                    <span className="text-[9px] font-black text-gray-700 mt-2 font-mono uppercase text-center block max-w-full truncate px-1">
                      {index === 0 ? 'Ventas' : 'Reparaciones'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart Legends */}
          <div className="grid grid-cols-2 gap-4 text-xs pt-2">
            <div className="flex items-start space-x-2.5 p-2 bg-gray-50 rounded-xl">
              <div className="w-3 h-3 bg-black rounded-sm mt-0.5"></div>
              <div>
                <span className="text-[9px] text-gray-400 block font-bold uppercase">Repuestos & Accesorios</span>
                <span className="font-extrabold text-gray-800">Bs. {salesIncome.toLocaleString('es-ES')}</span>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 p-2 bg-gray-50 rounded-xl">
              <div className="w-3 h-3 bg-[#FACC15] rounded-sm mt-0.5"></div>
              <div>
                <span className="text-[9px] text-gray-400 block font-bold uppercase">Servicio Técnico</span>
                <span className="font-extrabold text-gray-800">Bs. {repairIncome.toLocaleString('es-ES')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* REPAIR STATUS BREAKDOWN DONUT/PIE DATA (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Estado de Reparaciones</h3>
            <p className="text-[10px] text-gray-400">Órdenes registradas clasificadas según estado actual</p>
          </div>

          {/* Proportional horizontal state bars */}
          <div className="space-y-3 pt-2">
            {Object.entries(repairStatusCounts).map(([status, count]) => {
              const percentage = totalStatusCount > 0 ? (count / totalStatusCount) * 100 : 0;
              
              // Get custom styling colors based on status
              const getColorStyle = (st: string) => {
                switch(st) {
                  case 'RECIBIDO': return 'bg-blue-500';
                  case 'DIAGNOSTICO': return 'bg-purple-500';
                  case 'ESPERANDO_REPUESTO': return 'bg-amber-500';
                  case 'REPARANDO': return 'bg-yellow-500';
                  case 'LISTO': return 'bg-emerald-500';
                  case 'ENTREGADO': return 'bg-gray-400';
                  default: return 'bg-gray-500';
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
                    <span className="font-bold text-gray-700">{getStatusLabel(status)}</span>
                    <span className="font-black text-gray-900 font-mono">
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  
                  {/* Progress Bar background */}
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getColorStyle(status)} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-gray-50 border border-gray-150 rounded-2xl flex justify-between items-center">
            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">Total de Órdenes:</span>
            <span className="text-sm font-black text-gray-800 font-mono">{totalStatusCount} OTs</span>
          </div>
        </div>
      </div>

      {/* LOWER BENTO ROW: TOP SELLING PRODUCTS & CRITICAL INVENTORY ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Grid */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Productos más Vendidos</h3>
              <p className="text-[10px] text-gray-400">Repuestos y accesorios con mayor salida comercial</p>
            </div>
            <Package className="w-5 h-5 text-yellow-500" />
          </div>

          <div className="divide-y divide-gray-100">
            {topSellingProducts.length === 0 ? (
              <p className="py-6 text-xs text-gray-400 italic text-center">Aún no se han registrado ventas de productos.</p>
            ) : (
              topSellingProducts.map((p, index) => (
                <div key={index} className="py-3 flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-3 pr-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-black text-[#FACC15] flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-bold text-gray-800 truncate" title={p.name}>
                      {p.name}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-black text-gray-900 font-mono block">
                      {p.qty} unidades
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold font-mono">
                      Bs. {p.total.toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Notifications / Alerts Grid */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider text-amber-800">Alertas de Stock Crítico</h3>
              <p className="text-[10px] text-amber-600 font-medium">Repuestos con existencia igual o inferior al mínimo permitido</p>
            </div>
            <div className="p-1 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto pr-1">
            {lowStockItems.length === 0 ? (
              <div className="py-8 text-center text-emerald-600 space-y-1">
                <CheckCircle className="w-7 h-7 mx-auto text-emerald-500" />
                <p className="text-xs font-bold">Todo en orden</p>
                <p className="text-[10px]">No hay productos con existencias críticas en inventario.</p>
              </div>
            ) : (
              lowStockItems.map((p) => (
                <div key={p.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-gray-800 truncate max-w-[200px]" title={p.name}>{p.name}</p>
                    <p className="text-[9px] text-gray-400 font-mono">Cód: {p.code} | Cat: {p.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded-md font-bold font-mono">
                      Stock: {p.stock}
                    </span>
                    <span className="block text-[9px] text-gray-400 font-semibold mt-1">Mínimo: {p.minStock}</span>
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
