import React, { useState, useEffect } from 'react';
import {
  Store,
  ClipboardList,
  Package,
  ShoppingBag,
  Smartphone,
  Users,
  Database,
  Save,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  X,
  Upload,
  Download,
  ShieldCheck,
  RefreshCw,
  Tag,
  CheckCircle2,
  Lock,
  UserCheck,
  UserX,
  HelpCircle
} from 'lucide-react';
import { mockDb } from '../db/mockDb';
import { User, UserRole, WorkshopSettings } from '../types';

interface SettingsViewProps {
  currentUser: User;
}

type SettingsTab = 'GENERAL' | 'RECEPTION' | 'INVENTORY' | 'SALES' | 'BRANDS' | 'USERS' | 'BACKUP';

export default function SettingsView({ currentUser }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('GENERAL');
  
  // Settings state
  const [settings, setSettings] = useState<WorkshopSettings>(mockDb.getSettings());
  
  // Users state
  const [users, setUsers] = useState<User[]>(mockDb.getUsers());
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('TECHNICIAN');

  // Brands & Models state
  const [brands, setBrands] = useState<string[]>(mockDb.getBrands());
  const [modelsMap, setModelsMap] = useState<Record<string, string[]>>(mockDb.getModelsMap());
  const [selectedBrand, setSelectedBrand] = useState<string>(brands[0] || 'Apple');
  const [newBrandName, setNewBrandName] = useState('');
  const [newModelName, setNewModelName] = useState('');

  // Interactive Lists inputs
  const [newAccessory, setNewAccessory] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Toast / Feedback
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Backup restore
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    setSettings(mockDb.getSettings());
    setUsers(mockDb.getUsers());
    const loadedBrands = mockDb.getBrands();
    setBrands(loadedBrands);
    setModelsMap(mockDb.getModelsMap());
    if (loadedBrands.length > 0 && !selectedBrand) {
      setSelectedBrand(loadedBrands[0]);
    }
  }, []);

  const handleSaveSettings = () => {
    mockDb.saveSettings(settings);
    showSuccess('¡Configuración guardada correctamente!');
  };

  const showSuccess = (msg: string) => {
    setSavedSuccess(msg);
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 3500);
  };

  // --- ACCESSORY LIST HANDLERS ---
  const handleAddAccessory = () => {
    if (!newAccessory.trim()) return;
    if (settings.defaultAccessoriesList.includes(newAccessory.trim())) {
      showError('El accesorio ya existe en la lista');
      return;
    }
    const updated = {
      ...settings,
      defaultAccessoriesList: [...settings.defaultAccessoriesList, newAccessory.trim()]
    };
    setSettings(updated);
    mockDb.saveSettings(updated);
    setNewAccessory('');
    showSuccess('Accesorio añadido');
  };

  const handleRemoveAccessory = (acc: string) => {
    const updated = {
      ...settings,
      defaultAccessoriesList: settings.defaultAccessoriesList.filter(item => item !== acc)
    };
    setSettings(updated);
    mockDb.saveSettings(updated);
  };

  // --- CHECKLIST HANDLERS ---
  const handleAddChecklist = () => {
    if (!newChecklistItem.trim()) return;
    if (settings.defaultChecklist.includes(newChecklistItem.trim())) {
      showError('El punto de control ya existe');
      return;
    }
    const updated = {
      ...settings,
      defaultChecklist: [...settings.defaultChecklist, newChecklistItem.trim()]
    };
    setSettings(updated);
    mockDb.saveSettings(updated);
    setNewChecklistItem('');
    showSuccess('Punto de chequeo añadido');
  };

  const handleRemoveChecklist = (item: string) => {
    const updated = {
      ...settings,
      defaultChecklist: settings.defaultChecklist.filter(i => i !== item)
    };
    setSettings(updated);
    mockDb.saveSettings(updated);
  };

  // --- CATEGORIES HANDLERS ---
  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    if (settings.categoriesList.includes(newCategory.trim())) {
      showError('La categoría ya existe');
      return;
    }
    const updated = {
      ...settings,
      categoriesList: [...settings.categoriesList, newCategory.trim()]
    };
    setSettings(updated);
    mockDb.saveSettings(updated);
    setNewCategory('');
    showSuccess('Categoría añadida');
  };

  const handleRemoveCategory = (cat: string) => {
    if (settings.categoriesList.length <= 1) {
      showError('Debe mantener al menos una categoría');
      return;
    }
    const updated = {
      ...settings,
      categoriesList: settings.categoriesList.filter(c => c !== cat)
    };
    setSettings(updated);
    mockDb.saveSettings(updated);
  };

  // --- BRANDS & MODELS HANDLERS ---
  const handleAddBrand = () => {
    if (!newBrandName.trim()) return;
    mockDb.addBrand(newBrandName.trim());
    const updatedBrands = mockDb.getBrands();
    setBrands(updatedBrands);
    setModelsMap(mockDb.getModelsMap());
    setSelectedBrand(newBrandName.trim());
    setNewBrandName('');
    showSuccess('Marca agregada exitosamente');
  };

  const handleDeleteBrand = (brandName: string) => {
    if (window.confirm(`¿Seguro que desea eliminar la marca "${brandName}" y sus modelos?`)) {
      mockDb.deleteBrand(brandName);
      const updatedBrands = mockDb.getBrands();
      setBrands(updatedBrands);
      setModelsMap(mockDb.getModelsMap());
      if (selectedBrand === brandName) {
        setSelectedBrand(updatedBrands[0] || '');
      }
      showSuccess('Marca eliminada');
    }
  };

  const handleAddModel = () => {
    if (!selectedBrand || !newModelName.trim()) return;
    mockDb.addModel(selectedBrand, newModelName.trim());
    setModelsMap(mockDb.getModelsMap());
    setNewModelName('');
    showSuccess('Modelo agregado a ' + selectedBrand);
  };

  const handleDeleteModel = (modelName: string) => {
    if (window.confirm(`¿Seguro que desea eliminar el modelo "${modelName}"?`)) {
      mockDb.deleteModel(selectedBrand, modelName);
      setModelsMap(mockDb.getModelsMap());
      showSuccess('Modelo eliminado');
    }
  };

  // --- USER MANAGEMENT HANDLERS ---
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      showError('Por favor complete el nombre y correo electrónico');
      return;
    }

    mockDb.createUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      status: true
    });

    setUsers(mockDb.getUsers());
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('TECHNICIAN');
    setIsAddUserOpen(false);
    showSuccess('Usuario registrado con éxito');
  };

  const handleToggleUserStatus = (userId: string, currentStatus: boolean) => {
    if (userId === currentUser.id) {
      showError('No puedes desactivar tu propio usuario activo');
      return;
    }
    mockDb.updateUser(userId, { status: !currentStatus });
    setUsers(mockDb.getUsers());
    showSuccess(`Usuario ${!currentStatus ? 'activado' : 'desactivado'}`);
  };

  const handleChangeUserRole = (userId: string, newRole: UserRole) => {
    mockDb.updateUser(userId, { role: newRole });
    setUsers(mockDb.getUsers());
    showSuccess('Rol de usuario actualizado');
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      showError('No puedes eliminar tu propia cuenta');
      return;
    }
    if (window.confirm(`¿Está seguro de eliminar al usuario "${userName}"?`)) {
      mockDb.deleteUser(userId);
      setUsers(mockDb.getUsers());
      showSuccess('Usuario eliminado');
    }
  };

  // --- BACKUP & RESTORE HANDLERS ---
  const handleExportBackup = () => {
    const backupJson = mockDb.exportBackupData();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `backup_taller_celulares_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess('Copia de seguridad descargada con éxito');
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        if (window.confirm('¿Está seguro de restaurar esta copia de seguridad? Reemplazará los datos actuales del taller.')) {
          const success = mockDb.importBackupData(content);
          if (success) {
            showSuccess('¡Datos restaurados correctamente! Recargando el sistema...');
            setTimeout(() => window.location.reload(), 1500);
          } else {
            showError('El archivo de copia de seguridad no tiene un formato válido.');
          }
        }
      }
    };
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#111111] to-[#222222] text-white p-6 md:p-8 rounded-3xl shadow-md border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-[#FACC15]/10 border border-[#FACC15]/30 px-3 py-1 rounded-full text-[#FACC15] text-xs font-bold uppercase tracking-wider mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Panel de Control Administrativo</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
            Configuración del Sistema
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Personaliza los datos del taller, formatos de recepción, parámetros de inventario, caja y cuentas de personal.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="bg-[#FACC15] text-black font-black px-5 py-3 rounded-2xl hover:bg-yellow-400 transition-all flex items-center space-x-2 shadow-lg shadow-yellow-500/10 cursor-pointer text-xs uppercase tracking-wide self-stretch md:self-auto justify-center"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Cambios</span>
        </button>
      </div>

      {/* Floating Success / Error Notification */}
      {savedSuccess && (
        <div className="fixed top-6 right-6 z-50 bg-black text-[#FACC15] px-5 py-3 rounded-2xl shadow-2xl border border-[#FACC15]/40 flex items-center space-x-3 text-xs font-black animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-[#FACC15]" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-6 right-6 z-50 bg-red-950 text-white px-5 py-3 rounded-2xl shadow-2xl border border-red-500/50 flex items-center space-x-3 text-xs font-bold animate-slide-in">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200">
        <button
          onClick={() => setActiveTab('GENERAL')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'GENERAL'
              ? 'bg-black text-[#FACC15] shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-150'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Taller & General</span>
        </button>

        <button
          onClick={() => setActiveTab('RECEPTION')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'RECEPTION'
              ? 'bg-black text-[#FACC15] shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-150'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Recepción & Órdenes</span>
        </button>

        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'INVENTORY'
              ? 'bg-black text-[#FACC15] shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-150'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Inventario & Repuestos</span>
        </button>

        <button
          onClick={() => setActiveTab('SALES')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'SALES'
              ? 'bg-black text-[#FACC15] shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-150'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Ventas & Comprobantes</span>
        </button>

        <button
          onClick={() => setActiveTab('BRANDS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'BRANDS'
              ? 'bg-black text-[#FACC15] shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-150'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Marcas & Modelos</span>
        </button>

        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'USERS'
              ? 'bg-black text-[#FACC15] shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-150'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Personal & Permisos</span>
        </button>

        <button
          onClick={() => setActiveTab('BACKUP')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'BACKUP'
              ? 'bg-black text-[#FACC15] shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-150'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Respaldo & Datos</span>
        </button>
      </div>

      {/* TAB CONTENT AREA */}

      {/* 1. GENERAL & WORKSHOP CATEGORY */}
      {activeTab === 'GENERAL' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
              <Store className="w-5 h-5 text-[#E2B810]" />
              <h2 className="text-sm font-black text-gray-900 uppercase">Identificación del Negocio</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nombre del Taller / Empresa</label>
                <input
                  type="text"
                  value={settings.workshopName}
                  onChange={(e) => setSettings({ ...settings, workshopName: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:bg-white focus:border-black outline-none"
                  placeholder="Ej: Servicio Técnico Express"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Lema / Eslogan</label>
                <input
                  type="text"
                  value={settings.workshopSlogan}
                  onChange={(e) => setSettings({ ...settings, workshopSlogan: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:bg-white focus:border-black outline-none"
                  placeholder="Ej: Soluciones Móviles & Accesorios"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono(s) de Contacto</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:bg-white focus:border-black outline-none font-mono"
                  placeholder="Ej: 777-12345 / 789-67890"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Dirección Física</label>
                <textarea
                  rows={2}
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:bg-white focus:border-black outline-none resize-none"
                  placeholder="Ej: Av. Principal N° 450, Galería Central"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
              <ShieldCheck className="w-5 h-5 text-[#E2B810]" />
              <h2 className="text-sm font-black text-gray-900 uppercase">Parámetros Financieros & Garantía</h2>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Símbolo de Moneda</label>
                  <input
                    type="text"
                    value={settings.currencySymbol}
                    onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:bg-white focus:border-black outline-none font-mono"
                    placeholder="Ej: Bs. o $"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Garantía por Defecto (Días)</label>
                  <input
                    type="number"
                    min="0"
                    value={settings.defaultWarrantyDays}
                    onChange={(e) => setSettings({ ...settings, defaultWarrantyDays: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:bg-white focus:border-black outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Impuesto Aplicable (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.taxPercentage}
                  onChange={(e) => setSettings({ ...settings, taxPercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:bg-white focus:border-black outline-none font-mono"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">Ingrese 0 si los precios mostrados son exentos o finales.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mensaje en Pie de Comprobantes Impresos</label>
                <textarea
                  rows={3}
                  value={settings.ticketFooterMessage}
                  onChange={(e) => setSettings({ ...settings, ticketFooterMessage: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:bg-white focus:border-black outline-none resize-none"
                  placeholder="Ej: Todo trabajo técnico cuenta con garantía de 30 días. No se responden por equipos dejados más de 90 días."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. RECEPTION & ORDERS CATEGORY */}
      {activeTab === 'RECEPTION' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
              <ClipboardList className="w-5 h-5 text-[#E2B810]" />
              <h2 className="text-sm font-black text-gray-900 uppercase">Formato & Asignación de Órdenes de Trabajo (OT)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Prefijo de Orden de Trabajo</label>
                <input
                  type="text"
                  value={settings.otPrefix}
                  onChange={(e) => setSettings({ ...settings, otPrefix: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:bg-white focus:border-black outline-none font-mono"
                  placeholder="Ej: OT-"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Ejemplo correlativo: {settings.otPrefix}000124</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Exigir asignación de técnico</span>
                  <span className="text-[10px] text-gray-500 block">No permite registrar la OT si no hay un técnico seleccionado</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, requireTechnicianAssigned: !settings.requireTechnicianAssigned })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    settings.requireTechnicianAssigned ? 'bg-black' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`bg-[#FACC15] w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.requireTechnicianAssigned ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* ACCESORIOS RECEPTIBLES */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs space-y-4">
            <h2 className="text-sm font-black text-gray-900 uppercase">Lista de Accesorios Recibibles por Defecto</h2>
            <p className="text-xs text-gray-500">Agrega o remueve elementos que los clientes suelen dejar al entregar un teléfono.</p>

            <div className="flex gap-2">
              <input
                type="text"
                value={newAccessory}
                onChange={(e) => setNewAccessory(e.target.value)}
                placeholder="Ej: Lápiz Óptico / Stylus, Funda Magnética..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:bg-white focus:border-black outline-none"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAccessory())}
              />
              <button
                type="button"
                onClick={handleAddAccessory}
                className="bg-black text-[#FACC15] px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {settings.defaultAccessoriesList.map((acc) => (
                <span
                  key={acc}
                  className="bg-gray-100 border border-gray-200 text-gray-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2"
                >
                  <span>{acc}</span>
                  <button
                    onClick={() => handleRemoveAccessory(acc)}
                    className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* CHECKLIST DE RECEPCIÓN */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs space-y-4">
            <h2 className="text-sm font-black text-gray-900 uppercase">Puntos de Control para Chequeo Físico Inicial</h2>
            <p className="text-xs text-gray-500">Puntos de inspección que la recepcionista o el técnico debe revisar al ingresar el equipo.</p>

            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder="Ej: Reconocimiento Facial (Face ID), Carga Inalámbrica..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:bg-white focus:border-black outline-none"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddChecklist())}
              />
              <button
                type="button"
                onClick={handleAddChecklist}
                className="bg-black text-[#FACC15] px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Punto</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
              {settings.defaultChecklist.map((item) => (
                <div
                  key={item}
                  className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-800 flex items-center justify-between"
                >
                  <span className="truncate">{item}</span>
                  <button
                    onClick={() => handleRemoveChecklist(item)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. INVENTORY & SPARE PARTS CATEGORY */}
      {activeTab === 'INVENTORY' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
              <Package className="w-5 h-5 text-[#E2B810]" />
              <h2 className="text-sm font-black text-gray-900 uppercase">Reglas de Inventario & Existencias</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Stock Mínimo Predeterminado (Alerta)</label>
                <input
                  type="number"
                  min="1"
                  value={settings.defaultMinStock}
                  onChange={(e) => setSettings({ ...settings, defaultMinStock: parseInt(e.target.value) || 1 })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:bg-white focus:border-black outline-none font-mono"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Los productos que tengan este stock o menos mostrarán la alerta en color amarillo.</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Permitir salidas/ventas sin stock</span>
                  <span className="text-[10px] text-gray-500 block">Permite registrar ventas aun cuando la cantidad en sistema sea 0.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, allowNegativeStock: !settings.allowNegativeStock })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    settings.allowNegativeStock ? 'bg-black' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`bg-[#FACC15] w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.allowNegativeStock ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* CATEGORÍAS DE PRODUCTOS */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs space-y-4">
            <h2 className="text-sm font-black text-gray-900 uppercase">Categorías de Repuestos & Productos</h2>
            <p className="text-xs text-gray-500">Clasificación para filtros en inventario, compras y reportes.</p>

            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Ej: Placas Base, Microsoldadura, Cables..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:bg-white focus:border-black outline-none"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="bg-black text-[#FACC15] px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Categoría</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {settings.categoriesList.map((cat) => (
                <span
                  key={cat}
                  className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center space-x-2"
                >
                  <Tag className="w-3.5 h-3.5 text-[#E2B810]" />
                  <span>{cat}</span>
                  <button
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-0.5 cursor-pointer"
                    title="Eliminar categoría"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. SALES & CASHIER CATEGORY */}
      {activeTab === 'SALES' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
              <ShoppingBag className="w-5 h-5 text-[#E2B810]" />
              <h2 className="text-sm font-black text-gray-900 uppercase">Configuración de Caja & Descuentos</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Permitir aplicar descuentos en ventas</span>
                  <span className="text-[10px] text-gray-500 block">Habilita el campo de descuento en el módulo de cobro/caja</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, allowDiscounts: !settings.allowDiscounts })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    settings.allowDiscounts ? 'bg-black' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`bg-[#FACC15] w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.allowDiscounts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Límite Máximo de Descuento (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  disabled={!settings.allowDiscounts}
                  value={settings.maxDiscountPercentage}
                  onChange={(e) => setSettings({ ...settings, maxDiscountPercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:bg-white focus:border-black outline-none font-mono disabled:opacity-40"
                />
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Impresión automática de comprobante</span>
                  <span className="text-[10px] text-gray-500 block">Genera e imprime el ticket inmediatamente al completar el cobro</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, autoPrintTicket: !settings.autoPrintTicket })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    settings.autoPrintTicket ? 'bg-black' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`bg-[#FACC15] w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.autoPrintTicket ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* MÉTODOS DE PAGO HABILITADOS */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs space-y-4">
            <h2 className="text-sm font-black text-gray-900 uppercase">Métodos de Pago Habilitados en Caja</h2>
            <p className="text-xs text-gray-500">Selecciona los métodos de pago que los vendedores pueden recibir.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['Efectivo', 'Transferencia', 'QR', 'Tarjeta'].map((method) => {
                const isEnabled = settings.enabledPaymentMethods.includes(method);
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      const updatedMethods = isEnabled
                        ? settings.enabledPaymentMethods.filter(m => m !== method)
                        : [...settings.enabledPaymentMethods, method];
                      if (updatedMethods.length === 0) {
                        showError('Debe haber al menos un método de pago habilitado');
                        return;
                      }
                      setSettings({ ...settings, enabledPaymentMethods: updatedMethods });
                    }}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 ${
                      isEnabled
                        ? 'bg-black text-[#FACC15] border-black shadow-md'
                        : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${isEnabled ? 'text-[#FACC15]' : 'text-gray-300'}`} />
                    <span className="text-xs font-bold">{method}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. BRANDS & MODELS CATEGORY */}
      {activeTab === 'BRANDS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* MARCAS COLUMN */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h2 className="text-sm font-black text-gray-900 uppercase">Marcas de Celulares</h2>
              <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-mono font-bold">
                {brands.length}
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Nueva marca..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:bg-white focus:border-black outline-none"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBrand())}
              />
              <button
                onClick={handleAddBrand}
                className="bg-black text-[#FACC15] p-2 rounded-xl text-xs font-bold cursor-pointer"
                title="Agregar marca"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {brands.map((b) => (
                <div
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                    selectedBrand === b
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-gray-50 text-gray-800 border-gray-150 hover:bg-gray-100'
                  }`}
                >
                  <span className="truncate">{b}</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-[9px] bg-white/20 text-gray-300 px-1.5 py-0.5 rounded font-mono">
                      {modelsMap[b]?.length || 0} mod
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBrand(b);
                      }}
                      className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                      title="Eliminar marca"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MODELOS COLUMN */}
          <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-gray-150 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase">
                  Modelos de <span className="text-[#E2B810]">{selectedBrand}</span>
                </h2>
                <span className="text-[10px] text-gray-400">
                  Modelos desplegados al registrar reparaciones o repuestos
                </span>
              </div>
            </div>

            {selectedBrand ? (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    placeholder={`Ej: ${selectedBrand} Note 14 Pro, iPhone 16...`}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:bg-white focus:border-black outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddModel())}
                  />
                  <button
                    type="button"
                    onClick={handleAddModel}
                    className="bg-black text-[#FACC15] px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar Modelo</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
                  {(modelsMap[selectedBrand] || []).map((m) => (
                    <div
                      key={m}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between text-xs font-bold text-gray-800"
                    >
                      <span className="truncate" title={m}>{m}</span>
                      <button
                        onClick={() => handleDeleteModel(m)}
                        className="text-gray-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                        title="Eliminar modelo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {(modelsMap[selectedBrand] || []).length === 0 && (
                    <div className="col-span-full py-8 text-center text-xs text-gray-400 font-bold">
                      No hay modelos registrados para esta marca. ¡Agrega el primero arriba!
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-xs text-gray-400 font-bold">
                Selecciona una marca a la izquierda para administrar sus modelos.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. USERS & PERSONAL CATEGORY */}
      {activeTab === 'USERS' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase">Cuentas de Usuarios & Permisos</h2>
                <p className="text-xs text-gray-500">Gestión de personal del taller (Administradores, Técnicos y Recepcionistas).</p>
              </div>

              <button
                onClick={() => setIsAddUserOpen(true)}
                className="bg-black text-[#FACC15] px-4 py-2.5 rounded-2xl text-xs font-black hover:bg-gray-800 transition-all cursor-pointer flex items-center space-x-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Usuario</span>
              </button>
            </div>

            {/* USERS TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider select-none border-b border-gray-150">
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Correo</th>
                    <th className="py-3 px-4">Rol en Sistema</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-all">
                      <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center space-x-3">
                        <div className="w-8 h-8 bg-black text-[#FACC15] font-black rounded-xl flex items-center justify-center uppercase text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-gray-900">{u.name}</p>
                          <span className="text-[10px] text-gray-400 font-mono">ID: {u.id}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-gray-600 font-medium">
                        {u.email}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          disabled={u.id === currentUser.id}
                          onChange={(e) => handleChangeUserRole(u.id, e.target.value as UserRole)}
                          className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1 text-xs font-black text-gray-800 focus:bg-white focus:border-black outline-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="ADMIN">Administrador</option>
                          <option value="TECHNICIAN">Técnico Reparador</option>
                          <option value="RECEPTIONIST">Recepcionista</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {u.status ? (
                          <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-black border border-green-200 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            Activo
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full text-[10px] font-black border border-gray-200 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                            Inactivo
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.status)}
                            disabled={u.id === currentUser.id}
                            className={`p-1.5 rounded-xl border transition-all cursor-pointer disabled:opacity-30 ${
                              u.status
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            }`}
                            title={u.status ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {u.status ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            disabled={u.id === currentUser.id}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer disabled:opacity-30 border border-transparent hover:border-red-200"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. BACKUP & RESTORE CATEGORY */}
      {activeTab === 'BACKUP' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* EXPORT BACKUP */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-yellow-100 text-[#E2B810] rounded-2xl flex items-center justify-center">
                <Download className="w-5 h-5 text-black" />
              </div>
              <h2 className="text-base font-black text-gray-900 uppercase">Exportar Copia de Seguridad</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Descarga un archivo seguro en formato JSON que incluye todas las órdenes de trabajo, ventas, inventario, clientes y configuraciones de este taller.
              </p>
            </div>

            <button
              onClick={handleExportBackup}
              className="bg-black text-[#FACC15] w-full py-3 rounded-2xl font-black text-xs hover:bg-gray-800 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Archivo JSON de Respaldo</span>
            </button>
          </div>

          {/* IMPORT RESTORE */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-blue-100 text-blue-800 rounded-2xl flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <h2 className="text-base font-black text-gray-900 uppercase">Restaurar Copia de Seguridad</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Carga un archivo de respaldo previamente exportado para recuperar la información del taller.
              </p>
            </div>

            <label className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-900 w-full py-3 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Seleccionar Archivo JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>

          {/* RESET DATABASE TO FACTORY SEED */}
          <div className="col-span-full bg-red-50/60 p-6 rounded-3xl border border-red-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-red-900 uppercase flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Restablecer Datos Iniciales de Fábrica</span>
              </h3>
              <p className="text-xs text-red-700">
                Esta acción borrará todas las transacciones recientes y restaurará los datos de demostración originales.
              </p>
            </div>

            <button
              onClick={() => {
                if (window.confirm('¿Está seguro de borrar todo y restablecer los datos originales de prueba?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-black px-5 py-2.5 rounded-2xl text-xs transition-all cursor-pointer whitespace-nowrap shadow-md"
            >
              Restablecer Datos
            </button>
          </div>

        </div>
      )}

      {/* MODAL: REGISTRAR NUEVO USUARIO */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-150 p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-150">
              <h3 className="text-sm font-black text-gray-900 uppercase">Registrar Nuevo Usuario</h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-gray-400 hover:text-black p-1 bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ej: Andrés Mendoza"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:bg-white focus:border-black outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="andres@taller.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:bg-white focus:border-black outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Rol de Acceso</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:bg-white focus:border-black outline-none cursor-pointer"
                >
                  <option value="ADMIN">Administrador (Acceso total)</option>
                  <option value="TECHNICIAN">Técnico (Diagnósticos, reparaciones y repuestos)</option>
                  <option value="RECEPTIONIST">Recepcionista (Recepción, clientes y caja)</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black text-[#FACC15] rounded-xl text-xs font-black hover:bg-gray-800 transition-all cursor-pointer shadow-md"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
