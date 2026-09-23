import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  LayoutGrid,
  List,
  Check,
  Wrench,
  Layers,
  Smartphone
} from 'lucide-react';
import { Product } from '../types';

interface SparePartsInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  alreadySelectedProductIds?: string[];
}

export const SparePartsInventoryModal: React.FC<SparePartsInventoryModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  alreadySelectedProductIds = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'mosaic' | 'list'>('mosaic');

  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Extract categories with item count
  const categoriesWithCounts = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const cat = p.category || 'Otros';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

  // Filter products by search & category
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products
      .filter((p) => {
        // Category filter
        if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
          return false;
        }
        // Name / compatible model search
        if (query) {
          const nameMatch = (p.name || '').toLowerCase().includes(query);
          const modelMatch = (p.compatibleModel || '').toLowerCase().includes(query);
          if (!nameMatch && !modelMatch) return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div
      id="spare-parts-inventory-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="spare-parts-inventory-modal"
        className="bg-white w-full max-w-xl sm:max-w-2xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER: PREMIUM DARK & GOLD ACCENT */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-2 bg-[#FACC15] text-black rounded-xl shrink-0 shadow-xs">
              <Wrench className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Seleccionar Repuesto
              </h3>
              <p className="text-xs text-gray-400 truncate">
                Elige el repuesto para agregarlo a la orden
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* View Mode Toggle: Mosaic / List */}
            <div className="flex items-center bg-gray-800 p-1 rounded-xl border border-gray-700">
              <button
                id="view-mode-mosaic-btn"
                type="button"
                onClick={() => setViewMode('mosaic')}
                title="Vista Mosaico"
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  viewMode === 'mosaic'
                    ? 'bg-[#FACC15] text-black font-bold shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Mosaico</span>
              </button>
              <button
                id="view-mode-list-btn"
                type="button"
                onClick={() => setViewMode('list')}
                title="Vista Lista"
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#FACC15] text-black font-bold shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Lista</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              id="close-spare-parts-inventory-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
              title="Cerrar (ESC)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* SEARCH & CATEGORIES BAR */}
        <div className="p-3 sm:p-4 bg-gray-50/70 border-b border-gray-200 space-y-2.5 shrink-0">
          {/* Search by spare part name */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="search-spare-parts-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar repuesto por nombre o modelo..."
              autoFocus
              className="w-full pl-9 sm:pl-10 pr-9 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-7 h-7 flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categories Horizontal Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 active:scale-95 ${
                selectedCategory === 'ALL'
                  ? 'bg-black text-[#FACC15] shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Todas</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCategory === 'ALL' ? 'bg-[#FACC15]/20 text-[#FACC15]' : 'bg-gray-100 text-gray-500'
              }`}>
                {products.length}
              </span>
            </button>

            {categoriesWithCounts.map(([cat, count]) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 active:scale-95 ${
                    isSelected
                      ? 'bg-black text-[#FACC15] font-bold shadow-xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-[#FACC15]/20 text-[#FACC15]' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT: MOSAIC OR LIST */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-white min-h-[220px]">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-2.5">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-gray-800">No se encontraron repuestos</p>
              <p className="text-xs text-gray-400 mt-0.5 max-w-xs">
                Verifica el nombre o cambia de categoría para ver más opciones.
              </p>
            </div>
          ) : viewMode === 'mosaic' ? (
            /* PREMIUM REFINED MOSAIC GRID */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {filteredProducts.map((p) => {
                const isAlreadySelected = alreadySelectedProductIds.includes(p.id);
                const isOutOfStock = p.stock <= 0;

                return (
                  <div
                    key={p.id}
                    id={`product-mosaic-${p.id}`}
                    className={`rounded-xl border transition-all flex flex-col justify-between p-3 sm:p-3.5 ${
                      isAlreadySelected
                        ? 'bg-yellow-50/40 border-yellow-300 ring-1 ring-yellow-300/50'
                        : isOutOfStock
                        ? 'bg-gray-50/70 border-gray-200 opacity-60'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Category & Stock row */}
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 uppercase tracking-wider">
                          {p.category}
                        </span>

                        {isAlreadySelected ? (
                          <span className="text-[11px] font-bold text-yellow-900 bg-yellow-100 border border-yellow-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <Check className="w-3 h-3" /> Agregado
                          </span>
                        ) : isOutOfStock ? (
                          <span className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md">
                            Agotado
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                            Stock: {p.stock}
                          </span>
                        )}
                      </div>

                      {/* Repuesto Name */}
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                        {p.name}
                      </h4>

                      {/* Compatible Model */}
                      {p.compatibleModel && (
                        <div className="mt-1 flex items-center space-x-1 text-[11px] text-gray-500 font-medium truncate">
                          <Smartphone className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">{p.compatibleModel}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Row */}
                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-end">
                      {isAlreadySelected ? (
                        <span className="text-xs font-semibold text-yellow-800">
                          Ya en la orden
                        </span>
                      ) : isOutOfStock ? (
                        <span className="text-xs font-medium text-gray-400">
                          Sin stock
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectProduct(p)}
                          className="px-3.5 py-1.5 bg-black hover:bg-[#FACC15] text-[#FACC15] hover:text-black font-bold text-xs rounded-lg transition-all flex items-center space-x-1.5 shadow-2xs active:scale-95 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Seleccionar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* PREMIUM REFINED LIST */
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              {filteredProducts.map((p) => {
                const isAlreadySelected = alreadySelectedProductIds.includes(p.id);
                const isOutOfStock = p.stock <= 0;

                return (
                  <div
                    key={p.id}
                    id={`product-list-${p.id}`}
                    className={`p-2.5 sm:px-3.5 flex items-center justify-between gap-3 transition-colors ${
                      isAlreadySelected
                        ? 'bg-yellow-50/40'
                        : isOutOfStock
                        ? 'bg-gray-50/60 opacity-60'
                        : 'hover:bg-yellow-50/20'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 uppercase tracking-wider shrink-0">
                          {p.category}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                          {p.name}
                        </span>
                      </div>
                      {p.compatibleModel && (
                        <div className="mt-0.5 flex items-center space-x-1 text-[11px] text-gray-500 font-medium pl-0.5">
                          <Smartphone className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">{p.compatibleModel}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {/* Stock badge */}
                      {isOutOfStock ? (
                        <span className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md hidden sm:inline-block">
                          Agotado
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md hidden sm:inline-block">
                          Stock: {p.stock}
                        </span>
                      )}

                      {/* Action */}
                      {isAlreadySelected ? (
                        <span className="text-xs font-bold text-yellow-800 bg-yellow-100 border border-yellow-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <Check className="w-3 h-3" /> Agregado
                        </span>
                      ) : isOutOfStock ? (
                        <span className="text-xs font-medium text-gray-400">
                          Sin stock
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectProduct(p)}
                          className="px-3 py-1.5 bg-black hover:bg-[#FACC15] text-[#FACC15] hover:text-black font-bold text-xs rounded-lg transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Seleccionar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER: SLEEK & MINIMAL */}
        <div className="px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span className="font-medium text-gray-600">
            {filteredProducts.length} repuestos disponibles
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
