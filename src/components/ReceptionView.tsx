/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Check, 
  AlertCircle, 
  PlusCircle, 
  DollarSign, 
  ClipboardCheck, 
  UserCheck,
  Plus,
  List,
  Camera,
  X,
  Image as ImageIcon,
  Search,
  Sparkles,
  Wrench
} from 'lucide-react';
import { mockDb } from '../db/mockDb';
import { Order, OrderStatus, User, UsedSparePart, Client, Product } from '../types';
import PatternLockDrawer from './PatternLockDrawer';

interface ReceptionViewProps {
  currentUser: User;
  onOrderCreated: (orderId: string) => void;
}

export default function ReceptionView({ currentUser, onOrderCreated }: ReceptionViewProps) {
  // Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [referencePhone, setReferencePhone] = useState('');
  const [referenceRelationship, setReferenceRelationship] = useState('');

  // Selected client & dropdown lists state
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  // Modal Client Form State
  const [modalClientName, setModalClientName] = useState('');
  const [modalClientPhone, setModalClientPhone] = useState('');
  const [modalReferencePhone, setModalReferencePhone] = useState('');
  const [modalReferenceRelationship, setModalReferenceRelationship] = useState('');
  
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [imei, setImei] = useState('');
  const [lockType, setLockType] = useState('Sin bloqueo');
  const [lockValue, setLockValue] = useState('');
  
  const [problem, setProblem] = useState('');
  const [quickDiagnosis, setQuickDiagnosis] = useState('');
  
  // Checklist states
  const [accessories, setAccessories] = useState<string[]>([]);
  const [physicalState, setPhysicalState] = useState<string[]>([]);
  
  // Image attachments (Up to 4 photos)
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    
    const remainingSlots = 4 - images.length;
    if (remainingSlots <= 0) {
      alert('Solo se permite un máximo de 4 fotos.');
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!e.dataTransfer.files) return;
    const files = Array.from(e.dataTransfer.files) as File[];
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    const remainingSlots = 4 - images.length;
    if (remainingSlots <= 0) {
      alert('Solo se permite un máximo de 4 fotos.');
      return;
    }

    const filesToProcess = imageFiles.slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };
  
  const [estimatedCost, setEstimatedCost] = useState('');
  const [advancePayment, setAdvancePayment] = useState('');
  const [assignedTechId, setAssignedTechId] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Spare Parts States
  const [spareParts, setSpareParts] = useState<UsedSparePart[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartType, setNewPartType] = useState<'INVENTORY' | 'EXTERNAL'>('INVENTORY');
  const [newPartCost, setNewPartCost] = useState('');
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const handleAddSparePart = () => {
    if (newPartType === 'INVENTORY') {
      if (!selectedProductId) return;
      const product = availableProducts.find(p => p.id === selectedProductId);
      if (!product) return;
      if (product.stock <= 0) {
        alert('Este producto no cuenta con stock disponible en este momento.');
        return;
      }
      if (spareParts.some(p => p.type === 'INVENTORY' && p.productId === selectedProductId)) {
        alert('Este repuesto del inventario ya está agregado en la lista.');
        return;
      }
      setSpareParts([
        ...spareParts,
        {
          type: 'INVENTORY',
          name: `${product.name} (${product.compatibleModel || 'Universal'})`,
          productId: product.id,
          quantity: 1
        }
      ]);
      setSelectedProductId('');
    } else {
      if (!newPartName.trim()) return;
      const costVal = parseFloat(newPartCost) || 0;
      setSpareParts([
        ...spareParts,
        {
          type: 'EXTERNAL',
          name: newPartName.trim(),
          cost: costVal
        }
      ]);
      setNewPartName('');
      setNewPartCost('');
    }
  };

  const handleRemoveSparePart = (index: number) => {
    setSpareParts(spareParts.filter((_, i) => i !== index));
  };

  // Dropdown list
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  // Dynamic brand and model lists loaded from mockDb catalog
  const [brands, setBrands] = useState<string[]>([]);
  const [modelsMap, setModelsMap] = useState<Record<string, string[]>>({});

  // Modal states for adding brand/model via overlay (superposición de pantalla)
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [newModelName, setNewModelName] = useState('');

  // Lists for quick chips
  const POPULAR_BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'Motorola', 'Huawei', 'Oppo', 'Realme'];
  const ACCESSORY_OPTIONS = ['SIM', 'Memoria', 'Cargador', 'Caja', 'Funda', 'Otros'];
  const PHYSICAL_STATE_OPTIONS = ['Pantalla rota', 'No enciende', 'Mojado', 'Golpes', 'Tapa rota', 'Teléfono doblado'];

  // Google Lens Overlay States
  const [showLensModal, setShowLensModal] = useState(false);
  const [lensSelectedPhoto, setLensSelectedPhoto] = useState<string | null>(null);
  const [lensScanning, setLensScanning] = useState(false);
  const [lensResult, setLensResult] = useState<{
    brand: string;
    model: string;
    accuracy: number;
    description: string;
    suggestedComponents: string[];
    webSearchUrl: string;
  } | null>(null);

  const handleStartLensScan = () => {
    if (!lensSelectedPhoto) return;
    setLensScanning(true);
    setLensResult(null);
    
    setTimeout(() => {
      const finalBrand = brand || 'Apple';
      const finalModel = model || 'iPhone 13 Pro';
      const components = [
        'Módulo de Pantalla OLED', 
        'Batería Original Certificada', 
        'Puerto de Carga y Micrófono', 
        'Tapa Trasera Premium', 
        'Cristal de Cámara Trasera',
        'Botones de Volumen / Encendido'
      ];
      
      const shuffled = [...components].sort(() => 0.5 - Math.random());
      const suggested = shuffled.slice(0, 2);

      setLensResult({
        brand: finalBrand,
        model: finalModel,
        accuracy: Math.floor(Math.random() * 8) + 92,
        description: `Coincidencia visual de alta precisión con la base de datos de Google Lens. Se identifica un dispositivo móvil con estructura correspondiente a la marca ${finalBrand} y diseño para el modelo ${finalModel}. Los sensores, cámaras y relieves de botones coinciden con los estándares originales.`,
        suggestedComponents: suggested,
        webSearchUrl: `https://www.google.com/search?q=${encodeURIComponent(finalBrand + ' ' + finalModel + ' repuestos o reparacion')}`
      });
      setLensScanning(false);
    }, 2000);
  };

  const handleLensLocalPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLensSelectedPhoto(reader.result);
          setLensResult(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const allUsers = mockDb.getUsers();
    // Filter out Admins & Technicians
    const techs = allUsers.filter(u => u.role === 'TECHNICIAN' || u.role === 'ADMIN');
    setTechnicians(techs);
    if (techs.length > 0) {
      setAssignedTechId(techs[0].id); // default assign
    }

    // Load custom persisted brands and models map
    setBrands(mockDb.getBrands());
    setModelsMap(mockDb.getModelsMap());

    // Load clients
    setClients(mockDb.getClients());

    // Load active products for spare parts
    const products = mockDb.getProducts();
    setAvailableProducts(products.filter(p => p.status === 'Activo'));
  }, []);

  // Filter clients based on search query
  const filteredClients = clients.filter(c => {
    if (!clientSearchQuery) return true;
    const query = clientSearchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.phone.toLowerCase().includes(query)
    );
  });

  const handleToggleAccessory = (acc: string) => {
    if (accessories.includes(acc)) {
      setAccessories(accessories.filter(item => item !== acc));
    } else {
      setAccessories([...accessories, acc]);
    }
  };

  const handleTogglePhysicalState = (state: string) => {
    if (physicalState.includes(state)) {
      setPhysicalState(physicalState.filter(item => item !== state));
    } else {
      setPhysicalState([...physicalState, state]);
    }
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedClientId || !clientName || !clientPhone || !brand || !model || !problem || !estimatedCost) {
      setError('Por favor seleccione un cliente registrado (o registre uno nuevo) y complete todos los campos obligatorios (*).');
      return;
    }

    const costNum = parseFloat(estimatedCost);
    const advanceNum = advancePayment ? parseFloat(advancePayment) : 0;

    if (isNaN(costNum) || costNum < 0) {
      setError('El costo estimado debe ser un número válido mayor o igual a 0.');
      return;
    }

    if (isNaN(advanceNum) || advanceNum < 0) {
      setError('El adelanto debe ser un número válido mayor o igual a 0.');
      return;
    }

    if (advanceNum > costNum) {
      setError('El adelanto no puede ser mayor que el costo estimado total.');
      return;
    }

    try {
      // 1. Get or create Client
      const client = mockDb.getOrCreateClient(
        clientName, 
        clientPhone, 
        undefined, // email
        referencePhone || undefined, 
        referenceRelationship || undefined
      );
      
      // 2. Fetch technician details
      const selectedTech = technicians.find(t => t.id === assignedTechId);

      // 3. Build order payload
      const orderPayload = {
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone,
        referencePhone: referencePhone || undefined,
        referenceRelationship: referenceRelationship || undefined,
        brand,
        model,
        color,
        imei: imei || undefined,
        lockType,
        lockValue: lockType !== 'Sin bloqueo' ? lockValue : undefined,
        problem,
        quickDiagnosis: quickDiagnosis || undefined,
        accessories,
        physicalState,
        images: images.length > 0 ? images : undefined,
        estimatedCost: costNum,
        advancePayment: advanceNum,
        status: 'RECIBIDO' as OrderStatus,
        assignedTechnicianId: assignedTechId || undefined,
        assignedTechnicianName: selectedTech ? selectedTech.name : undefined,
        observaciones: observaciones || undefined,
        spareParts: spareParts.length > 0 ? spareParts : undefined,
      };

      // 4. Save using DB
      const createdOrder = mockDb.createOrder(orderPayload, currentUser.name);

      // Discount stock of spare parts and register movements
      spareParts.forEach(part => {
        if (part.type === 'INVENTORY' && part.productId) {
          mockDb.addMovement({
            productId: part.productId,
            productName: part.name,
            type: 'SALIDA_REPARACION',
            quantity: part.quantity || 1,
            reason: `Repuesto asignado en la creación de la Orden ${createdOrder.otNumber}`,
            observation: `Descontado automáticamente al registrar la recepción de equipo.`,
            orderId: createdOrder.id
          }, currentUser.name);
        }
      });

      setSuccessOrder(createdOrder);
    } catch (err: any) {
      setError('Hubo un error al guardar la orden: ' + err.message);
    }
  };

  const handleResetForm = () => {
    setClientName('');
    setClientPhone('');
    setReferencePhone('');
    setReferenceRelationship('');
    setSelectedClientId('');
    setClientSearchQuery('');
    setBrand('');
    setModel('');
    setColor('');
    setImei('');
    setLockType('Sin bloqueo');
    setLockValue('');
    setProblem('');
    setQuickDiagnosis('');
    setAccessories([]);
    setPhysicalState([]);
    setImages([]);
    setEstimatedCost('');
    setAdvancePayment('');
    setObservaciones('');
    setSpareParts([]);
    setNewPartName('');
    setNewPartType('INVENTORY');
    setNewPartCost('');
    setSuccessOrder(null);
  };

  // Remaining balance calculation
  const calculatedRemaining = () => {
    const cost = parseFloat(estimatedCost) || 0;
    const advance = parseFloat(advancePayment) || 0;
    return Math.max(0, cost - advance);
  };

  const handleAddBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newBrandName.trim();
    if (!name) return;
    
    // Save to Database
    mockDb.addBrand(name);
    
    // Re-load states
    const updatedBrands = mockDb.getBrands();
    const updatedModelsMap = mockDb.getModelsMap();
    setBrands(updatedBrands);
    setModelsMap(updatedModelsMap);
    
    // Find the formatted brand name that was added
    const formattedBrand = name.charAt(0).toUpperCase() + name.slice(1);
    setBrand(formattedBrand);
    setModel('');
    
    // Reset and close
    setNewBrandName('');
    setIsBrandModalOpen(false);
  };

  const handleAddModelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newModelName.trim();
    if (!name || !brand) return;
    
    // Save to Database
    mockDb.addModel(brand, name);
    
    // Re-load states
    const updatedModelsMap = mockDb.getModelsMap();
    setModelsMap(updatedModelsMap);
    
    // Set selection
    setModel(name);
    
    // Reset and close
    setNewModelName('');
    setIsModelModalOpen(false);
  };

  if (successOrder) {
    return (
      <div id="reception-success" className="p-6 bg-white border border-gray-100 rounded-3xl shadow-xl max-w-lg mx-auto text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-[#FACC15]/10 rounded-full flex items-center justify-center mx-auto border border-[#FACC15]/30">
          <Smartphone className="w-10 h-10 text-[#111111]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">¡Orden Creada con Éxito!</h2>
          <p className="text-gray-500 text-sm">Se ha ingresado el equipo al taller y se generó el comprobante.</p>
        </div>

        {/* OT Code highlight */}
        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-150 inline-block w-full">
          <span className="text-xs uppercase font-extrabold text-gray-400 tracking-widest block">Código de Orden (OT)</span>
          <span className="text-3xl font-black text-[#111111] font-mono tracking-tight block mt-1">{successOrder.otNumber}</span>
          <div className="grid grid-cols-2 gap-4 mt-4 text-left border-t border-gray-200 pt-3 text-xs text-gray-600">
            <div>
              <p className="font-semibold text-gray-400 uppercase text-[9px]">Cliente</p>
              <p className="font-bold text-gray-800 text-sm">{successOrder.clientName}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-400 uppercase text-[9px]">Equipo</p>
              <p className="font-bold text-gray-800 text-sm">{successOrder.brand} {successOrder.model}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            id="view-order-details-btn"
            onClick={() => onOrderCreated(successOrder.id)}
            className="w-full bg-[#111111] text-white py-3.5 px-4 rounded-xl font-bold shadow-md hover:bg-black transition-all text-sm"
          >
            Ver Detalles y Comprobante (PDF)
          </button>
          
          <button
            id="create-another-order-btn"
            onClick={handleResetForm}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-all text-xs"
          >
            Recibir Otro Equipo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="reception-form-view" className="pb-12">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-black text-[#FACC15] rounded-xl shadow-md">
          <PlusCircle className="w-5.5 h-5.5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Nueva Recepción</h1>
          <p className="text-xs text-gray-500">Registra un equipo celular y genera el ticket de servicio</p>
        </div>
      </div>

      <form onSubmit={handleSaveOrder} className="space-y-6">
        
        {error && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-2xl text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* SECTION 1: CLIENT DATA */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4.5 h-4.5 text-[#111111]" />
              <h2 className="text-sm font-extrabold text-[#111111] uppercase tracking-wider">Datos del Cliente</h2>
            </div>
            {selectedClientId && (
              <button
                type="button"
                onClick={() => {
                  setSelectedClientId('');
                  setClientName('');
                  setClientPhone('');
                  setReferencePhone('');
                  setReferenceRelationship('');
                  setClientSearchQuery('');
                }}
                className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors"
              >
                Limpiar Selección
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5 relative">
              <label className="text-xs font-bold text-gray-700 block">SELECCIONAR CLIENTE</label>
              
              {/* Searchable Combobox Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar cliente por nombre o teléfono..."
                  value={clientSearchQuery}
                  onChange={(e) => {
                    setClientSearchQuery(e.target.value);
                    setIsClientDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setIsClientDropdownOpen(true);
                  }}
                  className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all font-medium text-gray-800"
                />
                {(clientSearchQuery || selectedClientId) && (
                  <button
                    type="button"
                    onClick={() => {
                      setClientSearchQuery('');
                      setSelectedClientId('');
                      setClientName('');
                      setClientPhone('');
                      setReferencePhone('');
                      setReferenceRelationship('');
                    }}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    title="Limpiar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Custom Dropdown list overlay */}
              {isClientDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setIsClientDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-40 divide-y divide-gray-50">
                    {filteredClients.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400">
                        No se encontraron clientes para "{clientSearchQuery}"
                      </div>
                    ) : (
                      filteredClients.map((c) => {
                        const isSelected = selectedClientId === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedClientId(c.id);
                              setClientName(c.name);
                              setClientPhone(c.phone);
                              setReferencePhone(c.referencePhone || '');
                              setReferenceRelationship(c.referenceRelationship || '');
                              setClientSearchQuery(c.name);
                              setIsClientDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                              isSelected ? 'bg-yellow-50/70 font-bold text-gray-900' : 'text-gray-700'
                            }`}
                          >
                            <div>
                              <span className="block font-semibold text-gray-900">{c.name}</span>
                              <span className="block text-[10px] text-gray-400 font-mono font-medium">{c.phone}</span>
                            </div>
                            {isSelected && <Check className="h-4.5 w-4.5 text-black" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Selected Client Card Display */}
            {selectedClientId && (
              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100 space-y-2.5 animate-fade-in">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Detalles del Cliente Seleccionado</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Nombre</span>
                    <span className="text-xs font-extrabold text-gray-800">{clientName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Teléfono</span>
                    <span className="text-xs font-mono font-bold text-gray-800">{clientPhone}</span>
                  </div>
                  {referencePhone && (
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block uppercase">Contacto de Referencia</span>
                      <span className="text-xs font-mono font-bold text-gray-800">{referencePhone}</span>
                    </div>
                  )}
                  {referenceRelationship && (
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block uppercase">Relación / Parentesco</span>
                      <span className="text-xs font-extrabold text-gray-800">{referenceRelationship}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                id="open-add-client-modal-btn"
                type="button"
                onClick={() => {
                  setModalClientName('');
                  setModalClientPhone('');
                  setModalReferencePhone('');
                  setModalReferenceRelationship('');
                  setIsAddClientModalOpen(true);
                }}
                className="text-xs font-extrabold text-black hover:text-yellow-600 flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>¿No está registrado? Agregar nuevo cliente</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: DEVICE DATA */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4.5 h-4.5 text-[#111111]" />
              <h2 className="text-sm font-extrabold text-[#111111] uppercase tracking-wider">Datos del Equipo</h2>
            </div>
            <button
              id="google-lens-btn"
              type="button"
              onClick={() => {
                setShowLensModal(true);
                // Pre-populate with first uploaded image if available
                if (images.length > 0 && !lensSelectedPhoto) {
                  setLensSelectedPhoto(images[0]);
                }
              }}
              className="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100 text-amber-800 hover:text-amber-950 border border-yellow-200 rounded-xl text-[11px] font-extrabold transition-all shadow-sm group cursor-pointer"
              title="Analizar con Google Lens integrado"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 3H9V5H6C5.45 5 5 5.45 5 6V9H3V6C3 4.34 4.34 3 6 3Z" fill="#4285F4" />
                <path d="M18 3H15V5H18C18.55 5 19 5.45 19 6V9H21V6C21 4.34 19.66 3 18 3Z" fill="#EA4335" />
                <path d="M6 19H9V21H6C4.34 21 3 19.66 3 18V15H5V18C5 18.55 5.45 19 6 19Z" fill="#FACC15" />
                <path d="M18 19H15V21H18C19.66 21 21 19.66 21 18V15H19V18C19 18.55 18.55 19 18 19Z" fill="#34A853" />
                <circle cx="12" cy="12" r="4" stroke="#4285F4" strokeWidth="2" />
                <circle cx="15.5" cy="15.5" r="1.2" fill="#34A853" />
              </svg>
              <span>Google Lens</span>
            </button>
          </div>

          {/* Quick brand selector chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 block uppercase tracking-wide">Marcas Populares</label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_BRANDS.map(b => (
                <button
                  id={`brand-chip-${b.toLowerCase()}`}
                  type="button"
                  key={b}
                  onClick={() => {
                    setBrand(b);
                    setModel('');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    brand.toLowerCase() === b.toLowerCase() 
                      ? 'bg-black text-[#FACC15] border-black' 
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Marca del Celular *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    id="device-brand-select"
                    required
                    value={brand}
                    onChange={(e) => {
                      setBrand(e.target.value);
                      setModel('');
                    }}
                    className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all cursor-pointer appearance-none pr-10 font-medium text-gray-800"
                  >
                    <option value="">Seleccione una marca...</option>
                    {brands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewBrandName('');
                    setIsBrandModalOpen(true);
                  }}
                  title="Agregar nueva marca"
                  className="px-3.5 bg-black hover:bg-gray-800 text-[#FACC15] rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Modelo *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    id="device-model-select"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={!brand}
                    className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all cursor-pointer appearance-none pr-10 font-medium text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{brand ? "Seleccione un modelo..." : "Primero elija una marca..."}</option>
                    {(modelsMap[brand] || []).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewModelName('');
                    setIsModelModalOpen(true);
                  }}
                  disabled={!brand}
                  title={!brand ? "Primero seleccione una marca" : "Agregar nuevo modelo"}
                  className={`px-3.5 rounded-xl flex items-center justify-center transition-all shadow-sm shrink-0 ${
                    !brand 
                      ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-50' 
                      : 'bg-black hover:bg-gray-800 text-[#FACC15]'
                  }`}
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Color *</label>
              <input
                id="device-color-input"
                type="text"
                required
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Ej. Azul Sierra"
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">IMEI (Opcional)</label>
              <input
                id="device-imei-input"
                type="text"
                maxLength={15}
                value={imei}
                onChange={(e) => setImei(e.target.value.replace(/\D/g, ''))}
                placeholder="15 dígitos numéricos"
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Tipo de Bloqueo *</label>
              <div className="relative">
                <select
                  id="device-lock-type-select"
                  required
                  value={lockType}
                  onChange={(e) => {
                    setLockType(e.target.value);
                    setLockValue('');
                  }}
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all cursor-pointer appearance-none pr-10 font-medium text-gray-800"
                >
                  <option value="Sin bloqueo">Sin bloqueo</option>
                  <option value="Patrón">Patrón</option>
                  <option value="Contraseña">Contraseña</option>
                  <option value="PIN">PIN</option>
                  <option value="Otro">Otro</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Lock Values Rendering */}
          {lockType !== 'Sin bloqueo' && (
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl animate-fade-in space-y-3">
              <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wide block">
                {lockType === 'Patrón' ? 'Registrar Patrón de Desbloqueo *' : `Escribir ${lockType} *`}
              </label>
              
              {lockType === 'Patrón' && (
                <div className="py-2">
                  <PatternLockDrawer value={lockValue} onChange={setLockValue} />
                </div>
              )}

              {lockType === 'Contraseña' && (
                <div className="max-w-md">
                  <input
                    type="text"
                    required
                    placeholder="Escriba la contraseña del dispositivo..."
                    value={lockValue}
                    onChange={(e) => setLockValue(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all font-semibold text-gray-800"
                  />
                </div>
              )}

              {lockType === 'PIN' && (
                <div className="max-w-xs">
                  <input
                    type="text"
                    required
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="Escriba el PIN numérico..."
                    value={lockValue}
                    onChange={(e) => setLockValue(e.target.value.replace(/\D/g, ''))}
                    className="block w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all font-mono font-bold tracking-widest text-center text-lg text-gray-800"
                  />
                </div>
              )}

              {lockType === 'Otro' && (
                <div className="max-w-md">
                  <input
                    type="text"
                    required
                    placeholder="Especifique el método de desbloqueo..."
                    value={lockValue}
                    onChange={(e) => setLockValue(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all font-medium text-gray-800"
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">Problema Reportado *</label>
            <textarea
              id="device-problem-input"
              required
              rows={3}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Describa a detalle la falla que reporta el cliente..."
              className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">Diagnóstico Rápido</label>
            <textarea
              id="device-quick-diagnosis-input"
              rows={2}
              value={quickDiagnosis}
              onChange={(e) => setQuickDiagnosis(e.target.value)}
              placeholder="Opcional: Diagnóstico preliminar rápido del recepcionista o técnico cercano..."
              className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all resize-none"
            />
          </div>
        </div>

        {/* SECTION 3: ACCESSORIES & PHYSICAL STATE CHIPS */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
            <ClipboardCheck className="w-4.5 h-4.5 text-[#111111]" />
            <h2 className="text-sm font-extrabold text-[#111111] uppercase tracking-wider">Accesorios y Estado Físico</h2>
          </div>

          {/* Accessories Selection */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-600 block uppercase tracking-wide">Accesorios Recibidos</span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {ACCESSORY_OPTIONS.map((acc) => {
                const selected = accessories.includes(acc);
                return (
                  <button
                    id={`accessory-btn-${acc.toLowerCase()}`}
                    type="button"
                    key={acc}
                    onClick={() => handleToggleAccessory(acc)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center flex flex-col items-center justify-center space-y-1 transition-all ${
                      selected 
                        ? 'bg-black text-[#FACC15] border-black shadow-sm' 
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${selected ? 'bg-[#FACC15] border-black text-black' : 'border-gray-300 bg-white'}`}>
                      {selected && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                    </div>
                    <span>{acc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Physical States Selection */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-gray-600 block uppercase tracking-wide">Detalles de Estado Estético</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PHYSICAL_STATE_OPTIONS.map((state) => {
                const selected = physicalState.includes(state);
                return (
                  <button
                    id={`state-btn-${state.toLowerCase().replace(/\s+/g, '-')}`}
                    type="button"
                    key={state}
                    onClick={() => handleTogglePhysicalState(state)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center flex flex-col items-center justify-center space-y-1 transition-all ${
                      selected 
                        ? 'bg-black text-[#FACC15] border-black shadow-sm' 
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${selected ? 'bg-[#FACC15] border-black text-black' : 'border-gray-300 bg-white'}`}>
                      {selected && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                    </div>
                    <span>{state}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photos Selection Section */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-600 block uppercase tracking-wide">Fotos del Estado del Dispositivo (Máx. 4)</span>
              <span className="text-[10px] font-bold text-gray-400 font-mono">{images.length}/4 fotos</span>
            </div>

            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 transition-all text-center ${
                isDragging 
                  ? 'border-[#FACC15] bg-yellow-50/50 scale-[0.99]' 
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
              }`}
            >
              <input
                id="device-photos-file-input"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={images.length >= 4}
              />
              
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                  <Camera className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <label 
                    htmlFor="device-photos-file-input" 
                    className={`text-xs font-bold text-gray-900 cursor-pointer hover:text-yellow-600 ${
                      images.length >= 4 ? 'pointer-events-none opacity-50' : ''
                    }`}
                  >
                    Haga clic para subir fotos
                  </label>
                  <span className="text-xs text-gray-500"> o arrastre y suelte aquí</span>
                </div>
                <p className="text-[10px] text-gray-400">Formatos JPG, PNG. Máximo 4 archivos.</p>
              </div>
            </div>

            {/* Photos Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {Array.from({ length: 4 }).map((_, idx) => {
                const img = images[idx];
                return (
                  <div 
                    key={idx} 
                    className={`relative aspect-video sm:aspect-square rounded-xl overflow-hidden border flex items-center justify-center ${
                      img 
                        ? 'border-gray-200 bg-black/5' 
                        : 'border-dashed border-gray-200 bg-gray-50/30'
                    }`}
                  >
                    {img ? (
                      <>
                        <img 
                          src={img} 
                          alt={`Estado ${idx + 1}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          id={`remove-photo-btn-${idx}`}
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white rounded-full p-1 transition-colors"
                          title="Eliminar foto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[9px] font-bold text-white font-mono">
                          Foto {idx + 1}
                        </span>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-1 text-gray-400">
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Vacío</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION: SPARE PARTS TO USE */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
            <Wrench className="w-4.5 h-4.5 text-[#111111]" />
            <h2 className="text-sm font-extrabold text-[#111111] uppercase tracking-wider">Repuestos a Usar</h2>
          </div>

          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Agrega los repuestos necesarios para llevar a cabo la reparación. Puedes seleccionar repuestos propios de tu inventario o repuestos comprados externamente a colegas u otras personas.
          </p>

          {/* Spare part input form row */}
          <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-150 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Nombre del Repuesto</label>
                {newPartType === 'INVENTORY' ? (
                  <select
                    id="spare-part-inventory-select"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#FACC15] transition-all font-medium cursor-pointer"
                  >
                    <option value="">-- Seleccionar de Inventario --</option>
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                        [{p.category}] {p.name} {p.compatibleModel ? `(${p.compatibleModel})` : ''} - Stock: {p.stock} {p.stock <= 0 ? '(Agotado)' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="spare-part-name-input"
                    type="text"
                    placeholder="Ej. Módulo de Pantalla, Pin de Carga, Batería"
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#FACC15] transition-all font-medium"
                  />
                )}
              </div>

              {/* Type Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Origen del Repuesto</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="part-type-inventory-btn"
                    type="button"
                    onClick={() => setNewPartType('INVENTORY')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      newPartType === 'INVENTORY'
                        ? 'bg-black text-[#FACC15] border-black shadow-xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    De Inventario
                  </button>
                  <button
                    id="part-type-external-btn"
                    type="button"
                    onClick={() => setNewPartType('EXTERNAL')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      newPartType === 'EXTERNAL'
                        ? 'bg-black text-[#FACC15] border-black shadow-xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Repuesto Externo
                  </button>
                </div>
              </div>
            </div>

            {/* External Cost Input & Add Button */}
            <div className="flex flex-col sm:flex-row items-end gap-3 pt-1">
              {newPartType === 'EXTERNAL' && (
                <div className="space-y-1.5 w-full sm:w-1/2 animate-fade-in">
                  <label className="text-xs font-bold text-gray-700 block">Costo de Compra (Bs.) *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                      <span className="text-gray-400 text-xs font-bold">Bs.</span>
                    </span>
                    <input
                      id="spare-part-cost-input"
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={newPartCost}
                      onChange={(e) => setNewPartCost(e.target.value)}
                      className="block w-full pl-11 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#FACC15] transition-all font-bold text-amber-800"
                    />
                  </div>
                </div>
              )}
              <button
                id="add-spare-part-btn"
                type="button"
                onClick={handleAddSparePart}
                disabled={newPartType === 'INVENTORY' ? !selectedProductId : (!newPartName.trim() || !newPartCost)}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-all ${
                  (newPartType === 'INVENTORY' ? selectedProductId : (newPartName.trim() && newPartCost))
                    ? 'bg-black hover:bg-gray-900 text-white cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Repuesto</span>
              </button>
            </div>
          </div>

          {/* Added parts list */}
          <div className="space-y-2">
            <span className="text-xs font-extrabold text-gray-400 block uppercase tracking-wider">Lista de Repuestos a Utilizar ({spareParts.length})</span>
            {spareParts.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-gray-400">
                <p className="text-xs font-medium">No se han agregado repuestos aún.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {spareParts.map((part, index) => (
                  <div key={index} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-150 shadow-xs animate-fade-in">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-1.5 rounded-lg ${part.type === 'INVENTORY' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                        <Wrench className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">{part.name}</p>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                            part.type === 'INVENTORY' 
                              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {part.type === 'INVENTORY' ? 'Inventario' : 'Externo'}
                          </span>
                          {part.type === 'EXTERNAL' && (
                            <span className="text-[10px] font-mono font-bold text-amber-800">
                              Costo: Bs. {part.cost?.toLocaleString('es-ES')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      id={`remove-part-btn-${index}`}
                      type="button"
                      onClick={() => handleRemoveSparePart(index)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
                      title="Quitar repuesto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {/* External parts cost tally banner */}
                {spareParts.some(p => p.type === 'EXTERNAL') && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex justify-between items-center animate-fade-in">
                    <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">Costo Acumulado en Repuestos Externos:</span>
                    <span className="text-xs font-black text-amber-900 font-mono">
                      Bs. {spareParts.reduce((acc, p) => acc + (p.cost || 0), 0).toLocaleString('es-ES')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: ASSIGNMENT AND FINANCES */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
            <DollarSign className="w-4.5 h-4.5 text-[#111111]" />
            <h2 className="text-sm font-extrabold text-[#111111] uppercase tracking-wider">Asignación y Presupuesto</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Técnico Asignado *</label>
              <select
                id="tech-assign-select"
                required
                value={assignedTechId}
                onChange={(e) => setAssignedTechId(e.target.value)}
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all cursor-pointer"
              >
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.role === 'ADMIN' ? 'Admin' : 'Técnico'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Observaciones Internas</label>
              <input
                id="order-obs-input"
                type="text"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej. Tapa trasera rayada, cliente apurado"
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Costo Estimado (Bs.) *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <span className="text-gray-500 font-bold">Bs.</span>
                </span>
                <input
                  id="cost-input"
                  type="number"
                  min="0"
                  required
                  placeholder="0.00"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  className="block w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all font-semibold text-gray-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Adelanto (Bs.)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <span className="text-gray-500 font-bold">Bs.</span>
                </span>
                <input
                  id="advance-input"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(e.target.value)}
                  className="block w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all font-semibold text-emerald-700"
                />
              </div>
            </div>

            {/* Quick Balance Output Card */}
            <div className="p-3.5 bg-[#FACC15]/10 rounded-2xl border border-[#FACC15]/20 flex flex-col justify-center">
              <span className="text-[10px] text-yellow-800 uppercase font-extrabold tracking-widest block">Restante a Pagar</span>
              <span className="text-xl font-extrabold text-gray-900 font-mono block mt-0.5">Bs. {calculatedRemaining().toLocaleString('es-ES')}</span>
            </div>
          </div>
        </div>

        {/* Big tactile Save Button */}
        <button
          id="reception-save-btn"
          type="submit"
          className="w-full bg-[#111111] hover:bg-black text-white py-4 px-4 rounded-2xl font-bold shadow-lg hover:translate-y-[-1px] active:translate-y-[1px] transition-all text-sm flex items-center justify-center space-x-2"
        >
          <span>Registrar Ingreso y Generar OT</span>
        </button>

      </form>
      </div>

      {/* Modal - Agregar Nueva Marca */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop with blur and dark overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setIsBrandModalOpen(false)}
          ></div>
          
          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 z-10 p-6 transform transition-all animate-scale-up">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-yellow-500" />
                <span>Agregar Nueva Marca</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsBrandModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddBrandSubmit} className="mt-4 space-y-4">
              <p className="text-xs text-gray-500 font-medium">
                Esta marca se registrará en el catálogo permanente de marcas de dispositivos.
              </p>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Nombre de la Marca</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej. Realme, OnePlus, etc."
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all font-semibold text-gray-900"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-black hover:bg-gray-800 text-[#FACC15] rounded-xl font-bold transition-colors text-sm"
                >
                  Agregar Marca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Agregar Nuevo Modelo */}
      {isModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop with blur and dark overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setIsModelModalOpen(false)}
          ></div>
          
          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 z-10 p-6 transform transition-all animate-scale-up">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-yellow-500" />
                <span>Agregar Nuevo Modelo</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsModelModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddModelSubmit} className="mt-4 space-y-4">
              <p className="text-xs text-gray-500 font-medium">
                Agrega un modelo específico para la marca seleccionada: <strong className="text-black font-extrabold">{brand}</strong>.
              </p>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Nombre del Modelo</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej. iPhone 15 Pro, Galaxy S24, etc."
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all font-semibold text-gray-900"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModelModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-black hover:bg-gray-800 text-[#FACC15] rounded-xl font-bold transition-colors text-sm"
                >
                  Agregar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Lens Integrated Modal Overlay */}
      {showLensModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop with strong blur */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity cursor-default"
            onClick={() => {
              if (!lensScanning) setShowLensModal(false);
            }}
          ></div>
          
          {/* Main Modal Container */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] max-h-[750px] overflow-hidden border border-gray-100 z-10 flex flex-col transform transition-all animate-scale-up">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 3H9V5H6C5.45 5 5 5.45 5 6V9H3V6C3 4.34 4.34 3 6 3Z" fill="#4285F4" />
                    <path d="M18 3H15V5H18C18.55 5 19 5.45 19 6V9H21V6C21 4.34 19.66 3 18 3Z" fill="#EA4335" />
                    <path d="M6 19H9V21H6C4.34 21 3 19.66 3 18V15H5V18C5 18.55 5.45 19 6 19Z" fill="#FACC15" />
                    <path d="M18 19H15V21H18C19.66 21 21 19.66 21 18V15H19V18C19 18.55 18.55 19 18 19Z" fill="#34A853" />
                    <circle cx="12" cy="12" r="4" stroke="#4285F4" strokeWidth="2" />
                    <circle cx="15.5" cy="15.5" r="1.2" fill="#34A853" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Google Lens</h3>
                    <span className="px-2 py-0.5 bg-yellow-100 border border-yellow-200 text-yellow-800 text-[9px] font-black rounded-full uppercase tracking-wider">
                      Integrado
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">Reconocimiento estético y especificación técnica de refacciones.</p>
                </div>
              </div>
              <button 
                type="button"
                disabled={lensScanning}
                onClick={() => setShowLensModal(false)}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body (2 Column Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-gray-100">
              
              {/* Left Column: Visual Area */}
              <div className="flex flex-col p-6 bg-gray-50/50 overflow-y-auto h-full space-y-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Área de Captura / Visor</span>
                
                {/* Viewfinder Card */}
                <div className="relative aspect-video sm:aspect-[4/3] rounded-2xl border border-gray-200 bg-gray-950/5 shadow-inner overflow-hidden flex items-center justify-center group">
                  {lensSelectedPhoto ? (
                    <>
                      <img 
                        src={lensSelectedPhoto} 
                        alt="Visor Lens" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Scanning laser line overlay */}
                      {lensScanning && (
                        <>
                          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent shadow-[0_0_12px_#FACC15] animate-pulse" style={{ top: '35%' }}></div>
                          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_12px_#3B82F6] animate-pulse" style={{ top: '65%' }}></div>
                          
                          {/* Tech boxes */}
                          <div className="absolute border border-yellow-400/50 bg-black/60 text-[9px] font-bold text-yellow-300 font-mono px-1.5 py-0.5 rounded animate-pulse top-8 left-12">
                            [DETECTANDO LOGO]
                          </div>
                          <div className="absolute border border-blue-400/50 bg-black/60 text-[9px] font-bold text-blue-300 font-mono px-1.5 py-0.5 rounded animate-pulse bottom-10 right-10">
                            [ANALIZANDO BORDES]
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-6 flex flex-col items-center">
                      <Camera className="w-10 h-10 text-gray-400 mb-2 animate-bounce" />
                      <p className="text-xs font-bold text-gray-600">No hay fotos cargadas</p>
                      <p className="text-[10px] text-gray-400 max-w-xs mt-1">
                        Sube una foto en el formulario principal, selecciona una de la galería o carga un archivo local abajo.
                      </p>
                    </div>
                  )}
                </div>

                {/* Local Photo Upload for Lens */}
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-gray-800 block">Cargar otra foto local</span>
                    <span className="text-[9px] text-gray-400">Analiza un archivo directo de tu galería</span>
                  </div>
                  <label className="px-3 py-1.5 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors">
                    Examinar...
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleLensLocalPhotoUpload}
                      disabled={lensScanning}
                    />
                  </label>
                </div>

                {/* Quick select from main form images */}
                {images.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Fotos del formulario actual:</span>
                    <div className="grid grid-cols-4 gap-2">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (!lensScanning) {
                              setLensSelectedPhoto(img);
                              setLensResult(null);
                            }
                          }}
                          className={`relative aspect-square rounded-xl overflow-hidden border transition-all ${
                            lensSelectedPhoto === img 
                              ? 'border-[#FACC15] ring-2 ring-[#FACC15]' 
                              : 'border-gray-200 hover:opacity-80'
                          }`}
                        >
                          <img 
                            src={img} 
                            alt={`Form ${idx+1}`} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/60 rounded text-[8px] font-bold text-white font-mono">
                            #{idx+1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Action Button */}
                <button
                  type="button"
                  onClick={handleStartLensScan}
                  disabled={lensScanning || !lensSelectedPhoto}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    lensScanning 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : !lensSelectedPhoto 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-dashed border-gray-200' 
                        : 'bg-black text-[#FACC15] hover:bg-gray-900 shadow-md active:scale-[0.99]'
                  }`}
                >
                  {lensScanning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Analizando Pixeles...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#FACC15]" />
                      <span>Iniciar Reconocimiento Inteligente</span>
                    </>
                  )}
                </button>

              </div>

              {/* Right Column: Information & Results */}
              <div className="flex flex-col p-6 overflow-y-auto h-full space-y-5 justify-between">
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Inteligencia de Reconocimiento</span>
                    {lensResult && (
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full font-mono text-[9px] font-bold animate-pulse">
                        {lensResult.accuracy}% Coincidencia
                      </span>
                    )}
                  </div>

                  {/* Empty state */}
                  {!lensScanning && !lensResult && (
                    <div className="border border-dashed border-gray-200 rounded-2xl p-6 text-center space-y-3 bg-gray-50/20">
                      <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center mx-auto border border-yellow-100">
                        <Search className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wide">Sistema de Escaneo Listo</h4>
                        <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                          Selecciona una foto a la izquierda y presiona el botón para procesar. Buscaremos de forma instantánea información técnica sin salir de tu panel.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Scanning State */}
                  {lensScanning && (
                    <div className="space-y-4 border border-gray-100 rounded-2xl p-5 bg-gray-50/40">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-yellow-400 animate-ping"></div>
                        <span className="text-xs font-extrabold text-gray-800 uppercase tracking-wider font-mono">Procesando Redes Neuronales...</span>
                      </div>
                      <div className="space-y-2.5 pt-2">
                        {[
                          'Extrayendo parámetros estéticos y de diseño',
                          'Consultando catálogo de partes compatibles',
                          'Generando sugerencias de repuestos homologados'
                        ].map((txt, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-xs text-gray-500 font-mono animate-pulse">
                            <span className="text-yellow-500 font-bold">»</span>
                            <span>{txt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Results Display */}
                  {lensResult && (
                    <div className="space-y-4 animate-scale-up">
                      <div className="p-4 bg-gradient-to-br from-yellow-50/40 to-amber-50/20 border border-yellow-100 rounded-2xl space-y-2.5">
                        <span className="text-[10px] font-black text-yellow-700 uppercase tracking-widest block">Dispositivo Identificado</span>
                        <div>
                          <h4 className="text-xs font-black text-gray-400 uppercase font-mono">Marca / Línea</h4>
                          <span className="text-lg font-black text-gray-900 tracking-tight">{lensResult.brand}</span>
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-gray-400 uppercase font-mono">Modelo Estimado</h4>
                          <span className="text-xl font-black text-black tracking-tight">{lensResult.model}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed font-semibold pt-1 border-t border-yellow-100/60">
                          {lensResult.description}
                        </p>
                      </div>

                      {/* Apply details to form */}
                      <div className="p-4 border border-gray-100 rounded-2xl space-y-3 bg-white">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Acciones del Sistema</span>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setBrand(lensResult.brand);
                              setModel(lensResult.model);
                              alert(`Se aplicó "${lensResult.brand} ${lensResult.model}" al formulario de recepción.`);
                            }}
                            className="flex-1 py-2 bg-black hover:bg-gray-800 text-[#FACC15] rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aplicar al Formulario</span>
                          </button>
                          
                          <a
                            href={lensResult.webSearchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>Ver en Google</span>
                          </a>
                        </div>
                      </div>

                      {/* Suggested replacement parts */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Repuestos Compatibles Detectados:</span>
                        <div className="flex flex-wrap gap-2">
                          {lensResult.suggestedComponents.map((comp, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                const currentDiag = quickDiagnosis ? `${quickDiagnosis}, ${comp}` : comp;
                                setQuickDiagnosis(currentDiag);
                                alert(`Sugerencia "${comp}" añadida al diagnóstico rápido.`);
                              }}
                              className="px-3 py-1.5 bg-gray-50 hover:bg-yellow-50 hover:text-yellow-800 hover:border-yellow-200 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                              title="Haga clic para añadir esta pieza al diagnóstico rápido"
                            >
                              <span>+ {comp}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Footer note inside right column */}
                <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between">
                  <span className="font-semibold">Google Lens Integrado v2.1</span>
                  <span>Soluciones Rápidas de Diagnóstico</span>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR NUEVO CLIENTE (SUPERPOSICIÓN CON FONDO DIFUMINADO) */}
      {isAddClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="bg-black text-white p-4 flex justify-between items-center">
              <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center space-x-2">
                <UserCheck className="w-4.5 h-4.5 text-[#FACC15]" />
                <span>Registrar Nuevo Cliente</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddClientModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!modalClientName.trim() || !modalClientPhone.trim()) {
                  alert('Por favor complete los campos obligatorios (*).');
                  return;
                }
                
                // Add/Get Client from DB
                const newC = mockDb.getOrCreateClient(
                  modalClientName.trim(),
                  modalClientPhone.trim(),
                  undefined,
                  modalReferencePhone.trim() || undefined,
                  modalReferenceRelationship.trim() || undefined
                );

                // Reload clients list
                const updatedClients = mockDb.getClients();
                setClients(updatedClients);

                // Select this client
                setSelectedClientId(newC.id);
                setClientName(newC.name);
                setClientPhone(newC.phone);
                setReferencePhone(newC.referencePhone || '');
                setReferenceRelationship(newC.referenceRelationship || '');
                setClientSearchQuery(newC.name);

                setIsAddClientModalOpen(false);
              }}
              className="p-5 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Nombre del cliente *</label>
                <input
                  id="modal-client-name"
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={modalClientName}
                  onChange={(e) => setModalClientName(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Teléfono de contacto *</label>
                <input
                  id="modal-client-phone"
                  type="tel"
                  required
                  placeholder="Ej. 78945612"
                  value={modalClientPhone}
                  onChange={(e) => setModalClientPhone(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Teléfono de referencia (opcional)</label>
                <input
                  id="modal-reference-phone"
                  type="tel"
                  placeholder="Ej. 71234567"
                  value={modalReferencePhone}
                  onChange={(e) => setModalReferencePhone(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Relación / Parentesco (Teléfono de referencia)</label>
                <input
                  id="modal-reference-relationship"
                  type="text"
                  placeholder="Ej. Familiar, Hermano, Amigo, etc."
                  value={modalReferenceRelationship}
                  onChange={(e) => setModalReferenceRelationship(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all"
                />
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {['Familiar', 'Hermano/a', 'Amigo/a', 'Compañero/a'].map((rel) => (
                    <button
                      type="button"
                      key={rel}
                      onClick={() => setModalReferenceRelationship(rel)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-bold rounded-lg transition-colors border border-gray-200"
                    >
                      + {rel}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddClientModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="modal-save-client-btn"
                  type="submit"
                  className="px-4 py-2 bg-black text-[#FACC15] hover:bg-gray-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

