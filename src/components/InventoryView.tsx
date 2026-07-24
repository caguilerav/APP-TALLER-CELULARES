/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  X, 
  Tag, 
  Barcode, 
  Layers, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  CheckCircle,
  Smartphone,
  ChevronRight,
  Info,
  LayoutGrid,
  List
} from 'lucide-react';
import { mockDb } from '../db/mockDb';
import { Product, ProductCategory, InventoryMovement, MovementType, User } from '../types';

interface InventoryViewProps {
  currentUser: User;
}

export default function InventoryView({ currentUser }: InventoryViewProps) {
  // Tabs: 'LIST' or 'MOVEMENTS'
  const [activeTab, setActiveTab] = useState<'LIST' | 'MOVEMENTS'>('LIST');

  // View Mode: 'ALBUM' (cards grid) or 'LIST' (compact layout)
  const [viewMode, setViewMode] = useState<'ALBUM' | 'LIST'>('ALBUM');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStockLevel, setSelectedStockLevel] = useState<string>('ALL'); // 'ALL', 'LOW', 'OUT'

  // Movements state
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementSearch, setMovementSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Manual movement payload
  const [manualMovProductId, setManualMovProductId] = useState('');
  const [manualMovType, setManualMovType] = useState<'ENTRADA' | 'AJUSTE' | 'PERDIDA'>('ENTRADA');
  const [manualMovQty, setManualMovQty] = useState<number>(1);
  const [manualMovReason, setManualMovReason] = useState('');
  const [manualMovObs, setManualMovObs] = useState('');

  // Product Form State
  const [prodForm, setProdForm] = useState({
    code: '',
    barcode: '',
    name: '',
    category: 'Pantallas' as ProductCategory,
    brand: '',
    compatibleModel: '',
    description: '',
    supplier: '',
    purchasePrice: 0,
    salePrice: 0,
    stock: 0,
    minStock: 5,
    location: '',
    status: 'Activo' as 'Activo' | 'Inactivo'
  });

  // Load database on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(mockDb.getProducts());
    setMovements(mockDb.getMovements());
  };

  // Categories list
  const categories: ProductCategory[] = [
    'Pantallas', 'Glass', 'Baterías', 'Centros de carga', 'Flex', 'Cámaras', 
    'Tapas', 'Micrófonos', 'Parlantes', 'Botones', 'Conectores', 'IC', 
    'Herramientas', 'Accesorios', 'Otros'
  ];

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.compatibleModel && p.compatibleModel.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;

    let matchesStock = true;
    if (selectedStockLevel === 'LOW') {
      matchesStock = p.stock > 0 && p.stock <= p.minStock;
    } else if (selectedStockLevel === 'OUT') {
      matchesStock = p.stock === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Filter movements
  const filteredMovements = movements.filter(m => {
    const matchesSearch = 
      m.productName.toLowerCase().includes(movementSearch.toLowerCase()) ||
      m.productId.toLowerCase().includes(movementSearch.toLowerCase()) ||
      m.reason.toLowerCase().includes(movementSearch.toLowerCase()) ||
      (m.observation && m.observation.toLowerCase().includes(movementSearch.toLowerCase())) ||
      m.user.toLowerCase().includes(movementSearch.toLowerCase());

    const matchesType = movementTypeFilter === 'ALL' || m.type === movementTypeFilter;

    return matchesSearch && matchesType;
  });

  // Open modal to add product
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdForm({
      code: `PROD-${Date.now().toString().slice(-6)}`,
      barcode: '',
      name: '',
      category: 'Pantallas',
      brand: '',
      compatibleModel: '',
      description: '',
      supplier: '',
      purchasePrice: 0,
      salePrice: 0,
      stock: 0,
      minStock: 5,
      location: '',
      status: 'Activo'
    });
    setIsProductModalOpen(true);
  };

  // Open modal to edit product
  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProdForm({
      code: product.code,
      barcode: product.barcode || '',
      name: product.name,
      category: product.category,
      brand: product.brand,
      compatibleModel: product.compatibleModel || '',
      description: product.description || '',
      supplier: product.supplier || '',
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      stock: product.stock,
      minStock: product.minStock,
      location: product.location || '',
      status: product.status
    });
    setIsProductModalOpen(true);
  };

  // Handle Save Product Form
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name || !prodForm.brand || !prodForm.code) {
      alert('Por favor complete los campos requeridos (*).');
      return;
    }

    if (editingProduct) {
      // Update
      const updated = mockDb.updateProduct(editingProduct.id, prodForm, currentUser.name);

      if (updated) {
        loadData();
        setIsProductModalOpen(false);
      } else {
        alert('Error al actualizar el producto.');
      }
    } else {
      // Create
      try {
        const created = mockDb.addProduct(prodForm, currentUser.name);
        if (created) {
          loadData();
          setIsProductModalOpen(false);
        } else {
          alert('Error al crear el producto.');
        }
      } catch (err) {
        alert('Ocurrió un error al registrar el producto.');
      }
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = (id: string, name: string) => {
    if (window.confirm(`¿Está seguro de eliminar el producto "${name}"? Esta acción no se puede deshacer.`)) {
      const success = mockDb.deleteProduct(id);
      if (success) {
        loadData();
      } else {
        alert('No se pudo eliminar el producto.');
      }
    }
  };

  // Handle Open Quick Stock adjustment
  const handleOpenAdjustment = (productId?: string) => {
    setManualMovProductId(productId || (products[0]?.id || ''));
    setManualMovType('ENTRADA');
    setManualMovQty(1);
    setManualMovReason('');
    setManualMovObs('');
    setIsMovementModalOpen(true);
  };

  // Submit Manual Movement Stock Adjust
  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualMovProductId || manualMovQty <= 0 || !manualMovReason) {
      alert('Por favor complete todos los datos requeridos.');
      return;
    }

    const targetProd = products.find(p => p.id === manualMovProductId);
    if (!targetProd) {
      alert('Producto no válido.');
      return;
    }

    // Validation for exits
    if ((manualMovType === 'PERDIDA' || manualMovType === 'AJUSTE') && manualMovQty > targetProd.stock && manualMovType !== 'ENTRADA') {
      if (manualMovType === 'PERDIDA' || (manualMovType === 'AJUSTE' && manualMovQty > targetProd.stock)) {
        if (!window.confirm('La cantidad seleccionada es mayor al stock disponible. ¿Desea dejar el stock en 0?')) {
          return;
        }
      }
    }

    const payload = {
      productId: targetProd.id,
      productName: targetProd.name,
      type: manualMovType === 'ENTRADA' ? 'ENTRADA' as MovementType : manualMovType === 'PERDIDA' ? 'PERDIDA' as MovementType : 'AJUSTE' as MovementType,
      quantity: manualMovQty,
      reason: manualMovReason,
      observation: manualMovObs
    };

    mockDb.addMovement(payload, currentUser.name);
    loadData();
    setIsMovementModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Action Tabs */}
      <div className="bg-[#111111] text-white p-6 rounded-3xl shadow-xl border border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[#FACC15] rounded-2xl flex items-center justify-center text-black">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase">Inventario de Repuestos</h1>
            <p className="text-xs text-gray-400">Administra stock, códigos y registra movimientos de piezas</p>
          </div>
        </div>

        <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 self-start sm:self-center">
          <button
            onClick={() => setActiveTab('LIST')}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer ${
              activeTab === 'LIST'
                ? 'bg-[#FACC15] text-black shadow'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Lista Stock
          </button>
          <button
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer ${
              activeTab === 'MOVEMENTS'
                ? 'bg-[#FACC15] text-black shadow'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Kárdex / Movimientos
          </button>
        </div>
      </div>

      {activeTab === 'LIST' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-150 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por código, nombre, marca o modelo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-medium focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] transition-all outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] transition-all outline-none cursor-pointer"
              >
                <option value="ALL">Todas las Categorías</option>
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={selectedStockLevel}
                onChange={(e) => setSelectedStockLevel(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] transition-all outline-none cursor-pointer"
              >
                <option value="ALL">Todos los Niveles</option>
                <option value="LOW">Bajo Stock (Alerta)</option>
                <option value="OUT">Sin Stock (Agotado)</option>
              </select>

              {/* Selector de Vista: Álbum o Lista */}
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode('ALBUM')}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    viewMode === 'ALBUM'
                      ? 'bg-black text-[#FACC15]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Vista Álbum (Cuadrícula)"
                >
                  <LayoutGrid className="w-4.5 h-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('LIST')}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    viewMode === 'LIST'
                      ? 'bg-black text-[#FACC15]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Vista Lista Resumida"
                >
                  <List className="w-4.5 h-4.5" />
                </button>
              </div>

              {(currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST') && (
                <button
                  onClick={handleOpenAddProduct}
                  className="bg-[#FACC15] hover:bg-[#E2B810] text-black px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <PlusCircle className="w-4.5 h-4.5" />
                  <span>Registrar Pieza</span>
                </button>
              )}
            </div>
          </div>

          {/* Product Cards Grid / Mobile Responsive List */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-150">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-700">No se encontraron productos</p>
              <p className="text-xs text-gray-400 mt-1">Prueba cambiando los filtros o agrega un producto nuevo</p>
            </div>
          ) : viewMode === 'ALBUM' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((p) => {
                const isLow = p.stock > 0 && p.stock <= p.minStock;
                const isOut = p.stock === 0;

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-3xl border border-gray-150 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden"
                  >
                    {/* Corner badge for stock status */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      {isOut ? (
                        <span className="bg-red-50 text-red-700 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                          AGOTADO
                        </span>
                      ) : isLow ? (
                        <span className="bg-yellow-50 text-yellow-800 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                          BAJO STOCK
                        </span>
                      ) : (
                        <span className="bg-green-50 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          DISPONIBLE
                        </span>
                      )}
                    </div>

                    <div className="space-y-3.5">
                      {/* Code and Category Header */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-gray-100 text-gray-500 font-extrabold px-2 py-0.5 rounded">
                          {p.code}
                        </span>
                        <span className="text-[10px] bg-yellow-50 text-yellow-800 font-black px-2 py-0.5 rounded">
                          {p.category}
                        </span>
                      </div>

                      {/* Product Name & Brand */}
                      <div>
                        <h3 className="font-extrabold text-sm text-gray-900 leading-snug line-clamp-2">
                          {p.name}
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Marca: <span className="text-gray-700 font-bold">{p.brand}</span>
                          {p.compatibleModel && (
                            <> | Mod: <span className="text-[#E2B810] font-extrabold">{p.compatibleModel}</span></>
                          )}
                        </p>
                      </div>

                      {/* Info Bento Grid */}
                      <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-2xl text-[11px] font-mono">
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase font-sans">Stock Disponible</span>
                          <span className={`text-sm font-black ${isOut ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-gray-800'}`}>
                            {p.stock} <span className="text-[10px] text-gray-400 font-sans font-medium">unid.</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase font-sans">Precio de Venta</span>
                          <span className="text-sm font-black text-gray-900">
                            Bs. {p.salePrice.toLocaleString('es-ES')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase font-sans">Precio Compra</span>
                          <span className="text-[11px] font-bold text-gray-600">
                            Bs. {p.purchasePrice.toLocaleString('es-ES')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase font-sans">Ubicación</span>
                          <span className="text-[11px] font-bold text-gray-700 truncate block">
                            {p.location || 'No asignada'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-4 pt-3.5 border-t border-gray-150 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenAdjustment(p.id)}
                        className="text-[10px] bg-black hover:bg-gray-900 text-white font-extrabold px-3 py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                      >
                        <Activity className="w-3.5 h-3.5 text-[#FACC15]" />
                        <span>Ajustar Stock</span>
                      </button>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                          title="Editar producto"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {currentUser.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST MODE (Resumed compact list table) */
            <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold uppercase tracking-wider select-none">
                      <th className="py-3 px-4">Código</th>
                      <th className="py-3 px-4">Nombre / Repuesto</th>
                      <th className="py-3 px-4">Categoría</th>
                      <th className="py-3 px-4 text-center">Stock</th>
                      <th className="py-3 px-4 text-right">P. Compra</th>
                      <th className="py-3 px-4 text-right">P. Venta</th>
                      <th className="py-3 px-4">Ubicación</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {filteredProducts.map((p) => {
                      const isLow = p.stock > 0 && p.stock <= p.minStock;
                      const isOut = p.stock === 0;

                      return (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-all font-sans text-xs">
                          {/* Código */}
                          <td className="py-2.5 px-4 font-mono font-bold text-gray-600 whitespace-nowrap">
                            {p.code}
                          </td>
                          {/* Nombre / Repuesto */}
                          <td className="py-2.5 px-4">
                            <div className="font-extrabold text-gray-900 line-clamp-1">{p.name}</div>
                            <div className="text-[10px] text-gray-400">
                              Marca: <span className="text-gray-700 font-bold">{p.brand}</span>
                              {p.compatibleModel && (
                                <> | Mod: <span className="text-[#E2B810] font-extrabold">{p.compatibleModel}</span></>
                              )}
                            </div>
                          </td>
                          {/* Categoría */}
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <span className="text-[10px] bg-yellow-50 text-yellow-800 font-black px-2 py-0.5 rounded-full">
                              {p.category}
                            </span>
                          </td>
                          {/* Stock */}
                          <td className="py-2.5 px-4 text-center whitespace-nowrap font-mono">
                            {isOut ? (
                              <span className="bg-red-50 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                                0 u.
                              </span>
                            ) : isLow ? (
                              <span className="bg-yellow-50 text-yellow-800 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                                {p.stock} u.
                              </span>
                            ) : (
                              <span className="bg-green-50 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                {p.stock} u.
                              </span>
                            )}
                          </td>
                          {/* Precio Compra */}
                          <td className="py-2.5 px-4 text-right whitespace-nowrap font-mono text-gray-600 font-bold">
                            Bs. {p.purchasePrice.toLocaleString('es-ES')}
                          </td>
                          {/* Precio Venta */}
                          <td className="py-2.5 px-4 text-right whitespace-nowrap font-mono text-gray-900 font-black">
                            Bs. {p.salePrice.toLocaleString('es-ES')}
                          </td>
                          {/* Ubicación */}
                          <td className="py-2.5 px-4 text-gray-500 font-mono text-[11px] max-w-[120px] truncate" title={p.location}>
                            {p.location || '-'}
                          </td>
                          {/* Estado */}
                          <td className="py-2.5 px-4 text-center whitespace-nowrap">
                            {p.status === 'Activo' ? (
                              <span className="text-green-600 font-bold text-[10px] bg-green-50 px-1.5 py-0.5 rounded">Activo</span>
                            ) : (
                              <span className="text-gray-400 font-bold text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">Inactivo</span>
                            )}
                          </td>
                          {/* Acciones */}
                          <td className="py-2.5 px-4 text-right whitespace-nowrap">
                            <div className="flex justify-end items-center gap-1">
                              <button
                                onClick={() => handleOpenAdjustment(p.id)}
                                className="p-1.5 text-black hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                                title="Ajustar Stock"
                              >
                                <Activity className="w-4 h-4 text-[#E2B810]" />
                              </button>
                              <button
                                onClick={() => handleOpenEditProduct(p)}
                                className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                                title="Editar repuesto"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {currentUser.role === 'ADMIN' && (
                                <button
                                  onClick={() => handleDeleteProduct(p.id, p.name)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                  title="Eliminar repuesto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Movements audit search filter bar */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-150 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="Filtrar movimientos por producto, usuario, razón..."
                value={movementSearch}
                onChange={(e) => setMovementSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-medium focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] transition-all outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] transition-all outline-none cursor-pointer"
              >
                <option value="ALL">Todos los Tipos</option>
                <option value="ENTRADA">ENTRADA (Compra/Carga)</option>
                <option value="SALIDA_VENTA">SALIDA_VENTA</option>
                <option value="SALIDA_REPARACION">SALIDA_REPARACION</option>
                <option value="AJUSTE">AJUSTE</option>
                <option value="PERDIDA">PÉRDIDA</option>
                <option value="DEVOLUCION">DEVOLUCIÓN</option>
              </select>

              <button
                onClick={() => handleOpenAdjustment()}
                className="bg-black hover:bg-gray-900 text-[#FACC15] px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Activity className="w-4.5 h-4.5" />
                <span>Registrar Ajuste</span>
              </button>
            </div>
          </div>

          {/* Movements Timeline / Audit List */}
          <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4 text-center">Cantidad</th>
                    <th className="py-3 px-4">Razón / Motivo</th>
                    <th className="py-3 px-4">Registrado Por</th>
                    <th className="py-3 px-4">Relación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        No hay movimientos registrados que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((mov) => {
                      const isEntry = mov.type === 'ENTRADA' || mov.type === 'DEVOLUCION';

                      return (
                        <tr key={mov.id} className="hover:bg-gray-50/50 transition-all font-mono text-[11px]">
                          <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                            {new Date(mov.date).toLocaleString('es-ES')}
                          </td>
                          <td className="py-3 px-4 font-sans font-bold text-gray-900 max-w-[180px] truncate">
                            {mov.productName}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isEntry ? (
                              <span className="bg-green-50 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" />
                                {mov.type}
                              </span>
                            ) : (
                              <span className="bg-red-50 text-red-700 text-[9px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <ArrowDownRight className="w-3 h-3" />
                                {mov.type}
                              </span>
                            )}
                          </td>
                          <td className={`py-3 px-4 text-center font-black text-sm whitespace-nowrap ${isEntry ? 'text-green-600' : 'text-red-500'}`}>
                            {isEntry ? `+${mov.quantity}` : `-${mov.quantity}`}
                          </td>
                          <td className="py-3 px-4 font-sans text-gray-600 max-w-[200px] truncate" title={mov.observation}>
                            <span className="font-bold text-gray-900 block">{mov.reason}</span>
                            {mov.observation && <span className="text-[10px] text-gray-400 block">{mov.observation}</span>}
                          </td>
                          <td className="py-3 px-4 font-sans text-gray-500">
                            {mov.user}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-sans text-[10px]">
                            {mov.orderId && (
                              <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">
                                OT N° {mov.orderId.replace('ord-', '').slice(0,6)}
                              </span>
                            )}
                            {mov.saleId && (
                              <span className="bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded">
                                Venta N° {mov.saleId.replace('sale-', '').slice(0,6)}
                              </span>
                            )}
                            {!mov.orderId && !mov.saleId && (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-fade-in text-gray-900">
            <div className="bg-[#111111] text-white p-5 flex justify-between items-center select-none">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-[#FACC15]" />
                <h2 className="text-sm font-black uppercase tracking-wider">
                  {editingProduct ? 'Editar Repuesto' : 'Nuevo Repuesto / Producto'}
                </h2>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Código Interno *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.code}
                    onChange={(e) => setProdForm({ ...prodForm, code: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#FACC15]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Código de Barras (Opcional)</label>
                  <input
                    type="text"
                    value={prodForm.barcode}
                    onChange={(e) => setProdForm({ ...prodForm, barcode: e.target.value })}
                    placeholder="Escanear o ingresar"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#FACC15]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Nombre del Repuesto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Módulo de Pantalla OLED compatible con iPhone 12 Pro Max"
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-[#FACC15]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Categoría *</label>
                  <select
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value as ProductCategory })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-[#FACC15]"
                  >
                    {categories.map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Marca / Fabricante *</label>
                  <input
                    type="text"
                    required
                    placeholder="Apple, Samsung, Xiaomi..."
                    value={prodForm.brand}
                    onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#FACC15]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Modelo Compatible</label>
                  <input
                    type="text"
                    placeholder="iPhone 11, Note 20..."
                    value={prodForm.compatibleModel}
                    onChange={(e) => setProdForm({ ...prodForm, compatibleModel: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#FACC15]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Ubicación en Almacén</label>
                  <input
                    type="text"
                    placeholder="Estante A - Cajón 3"
                    value={prodForm.location}
                    onChange={(e) => setProdForm({ ...prodForm, location: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#FACC15]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Precio de Compra (Bs.) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.1"
                    value={prodForm.purchasePrice || ''}
                    onChange={(e) => setProdForm({ ...prodForm, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-[#FACC15]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Precio de Venta (Bs.) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.1"
                    value={prodForm.salePrice || ''}
                    onChange={(e) => setProdForm({ ...prodForm, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-[#FACC15]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Stock Inicial *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    disabled={!!editingProduct}
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: parseInt(e.target.value) || 0 })}
                    className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-[#FACC15] ${editingProduct ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  {editingProduct && (
                    <span className="text-[9px] text-gray-400 mt-0.5 block">Para cambiar stock use "Ajustar Stock"</span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-[#E2B810] mb-1">Stock Mínimo (Alerta) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={prodForm.minStock}
                    onChange={(e) => setProdForm({ ...prodForm, minStock: parseInt(e.target.value) || 5 })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-[#FACC15]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Descripción / Notas Adicionales</label>
                <textarea
                  placeholder="Detalles sobre compatibilidad, calidad de pieza (OEM, Original, Alternativa)..."
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-[#FACC15]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Proveedor</label>
                  <input
                    type="text"
                    placeholder="Nombre distribuidora"
                    value={prodForm.supplier}
                    onChange={(e) => setProdForm({ ...prodForm, supplier: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#FACC15]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Estado</label>
                  <select
                    value={prodForm.status}
                    onChange={(e) => setProdForm({ ...prodForm, status: e.target.value as 'Activo' | 'Inactivo' })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-[#FACC15]"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-150 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 rounded-2xl text-xs font-bold text-gray-600 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#FACC15] hover:bg-[#E2B810] text-black rounded-2xl text-xs font-black transition-all cursor-pointer shadow-sm"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Registrar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL STOCK MOVEMENT (ADJUSTMENT) */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden flex flex-col animate-fade-in text-gray-900">
            <div className="bg-[#111111] text-white p-5 flex justify-between items-center select-none">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-[#FACC15]" />
                <h2 className="text-sm font-black uppercase tracking-wider">Ajuste de Stock Manual</h2>
              </div>
              <button
                onClick={() => setIsMovementModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Seleccionar Repuesto *</label>
                <select
                  value={manualMovProductId}
                  onChange={(e) => setManualMovProductId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-[#FACC15]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) - Stock: {p.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Tipo de Movimiento *</label>
                  <select
                    value={manualMovType}
                    onChange={(e) => setManualMovType(e.target.value as 'ENTRADA' | 'AJUSTE' | 'PERDIDA')}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-[#FACC15]"
                  >
                    <option value="ENTRADA">ENTRADA (Compra/Ingreso)</option>
                    <option value="AJUSTE">AJUSTE (Alineación física)</option>
                    <option value="PERDIDA">SALIDA / PÉRDIDA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Cantidad *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={manualMovQty}
                    onChange={(e) => setManualMovQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-[#FACC15]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Motivo / Razón *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Compra a distribuidor, Pérdida por rotura en taller, etc."
                  value={manualMovReason}
                  onChange={(e) => setManualMovReason(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-[#FACC15]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Comentario / Observación</label>
                <textarea
                  placeholder="Comentario interno para control de inventario..."
                  value={manualMovObs}
                  onChange={(e) => setManualMovObs(e.target.value)}
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-[#FACC15]"
                />
              </div>

              <div className="pt-4 border-t border-gray-150 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 rounded-2xl text-xs font-bold text-gray-600 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#FACC15] hover:bg-[#E2B810] text-black rounded-2xl text-xs font-black transition-all cursor-pointer shadow-sm"
                >
                  Confirmar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
