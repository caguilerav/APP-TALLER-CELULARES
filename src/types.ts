/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'ADMIN' | 'TECHNICIAN' | 'RECEPTIONIST';

export type OrderStatus =
  | 'RECIBIDO'
  | 'DIAGNOSTICO'
  | 'ESPERANDO_REPUESTO'
  | 'REPARANDO'
  | 'LISTO'
  | 'ENTREGADO';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  referencePhone?: string;
  referenceRelationship?: string;
  createdAt: string;
}

export interface UsedSparePart {
  type: 'INVENTORY' | 'EXTERNAL';
  name: string;
  cost?: number; // Only for external spare parts
  productId?: string; // If type === 'INVENTORY'
  quantity?: number; // Quantity used from inventory
}

export interface Order {
  id: string;
  otNumber: string; // OT-000001, etc.
  clientId: string;
  clientName: string;
  clientPhone: string;
  referencePhone?: string;
  referenceRelationship?: string;
  
  // Device
  brand: string;
  model: string;
  color: string;
  imei?: string;
  lockType?: string;
  lockValue?: string;
  
  // Details
  problem: string;
  quickDiagnosis?: string;
  accessories: string[]; // 'SIM', 'Memoria', 'Cargador', 'Caja', 'Funda', 'Otros'
  physicalState: string[]; // 'Pantalla rota', 'No enciende', 'Mojado', 'Golpes', 'Rayones'
  images?: string[]; // Base64 or Object URL of photos of the device
  spareParts?: UsedSparePart[]; // Spare parts associated to this repair
  
  // Finance
  estimatedCost: number;
  advancePayment: number;
  
  // Status & Tech
  status: OrderStatus;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: string; // 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Pago Móvil'
  notes?: string;
  date: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  orderId: string;
  status: OrderStatus;
  description: string;
  createdBy: string;
  createdAt: string;
}

// Stats interface for dashboard metrics
export interface DashboardStats {
  receivedToday: number;
  inRepair: number;
  ready: number;
  delivered: number;
  dailyRevenue: number;
}

// === NEW TYPES FOR MODULES ===

export type ProductCategory =
  | 'Pantallas'
  | 'Glass'
  | 'Baterías'
  | 'Centros de carga'
  | 'Flex'
  | 'Cámaras'
  | 'Tapas'
  | 'Micrófonos'
  | 'Parlantes'
  | 'Botones'
  | 'Conectores'
  | 'IC'
  | 'Herramientas'
  | 'Accesorios'
  | 'Otros';

export type ProductStatus = 'Disponible' | 'Bajo Stock' | 'Agotado';

export interface Product {
  id: string;
  code: string; // Internal code
  barcode?: string;
  name: string;
  category: ProductCategory;
  brand: string;
  compatibleModel?: string;
  description: string;
  supplier: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  location: string;
  status: 'Activo' | 'Inactivo';
  image?: string;
  createdAt: string;
}

export type MovementType =
  | 'ENTRADA'
  | 'SALIDA_VENTA'
  | 'SALIDA_REPARACION'
  | 'AJUSTE'
  | 'PERDIDA'
  | 'DEVOLUCION';

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  date: string;
  user: string; // User name or email
  reason: string; // Motivo
  observation?: string;
  orderId?: string; // If related to a repair
  saleId?: string;  // If related to a sale
}

export type SaleItemType = 'PRODUCT' | 'SERVICE';

export interface SaleItem {
  id: string;
  type: SaleItemType;
  referenceId?: string; // Product ID if type === 'PRODUCT'
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'QR' | 'Tarjeta' | 'Mixto';

export interface Sale {
  id: string;
  saleNumber: string; // e.g. V-000001
  clientId: string;
  clientName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  observations?: string;
  date: string;
  user: string; // Name of user who registered the sale
}
