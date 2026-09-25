/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  User, 
  Client, 
  Order, 
  Payment, 
  TimelineEvent, 
  OrderStatus, 
  UserRole,
  Product,
  ProductCategory,
  InventoryMovement,
  MovementType,
  Sale,
  SaleItem,
  PaymentMethod,
  DashboardStats,
  WorkshopSettings
} from '../types';

// Storage keys
const USERS_KEY = 'taller_celulares_users';
const CLIENTS_KEY = 'taller_celulares_clients';
const ORDERS_KEY = 'taller_celulares_orders';
const PAYMENTS_KEY = 'taller_celulares_payments';
const EVENTS_KEY = 'taller_celulares_events';
const BRANDS_KEY = 'taller_celulares_brands_v1';
const MODELS_KEY = 'taller_celulares_models_map_v1';
const PRODUCTS_KEY = 'taller_celulares_products_v1';
const MOVEMENTS_KEY = 'taller_celulares_movements_v1';
const SALES_KEY = 'taller_celulares_sales_v1';
const SETTINGS_KEY = 'taller_celulares_settings_v1';

const DEFAULT_SETTINGS: WorkshopSettings = {
  workshopName: 'BOL.FIX',
  workshopSlogan: 'By: Mauro Medina',
  phone: '777-12345 / 789-67890',
  address: 'Av. Principal N° 450, Galería Central Local 12',
  currencySymbol: 'Bs.',
  ticketFooterMessage: '¡Gracias por confiar en BOL.FIX! Todo trabajo técnico cuenta con garantía.',
  defaultWarrantyDays: 30,
  taxPercentage: 0,
  customLogo: '',
  customAppIcon: '',
  appIconZoom: 75,

  otPrefix: 'OT-',
  requireTechnicianAssigned: false,
  defaultAccessoriesList: ['SIM', 'Memoria SD', 'Cargador', 'Caja', 'Funda / Cover', 'S Pen / Stylus'],
  defaultPhysicalStates: [
    'Pantalla rota',
    'No enciende',
    'Mojado',
    'Golpes',
    'Tapa rota',
    'Teléfono doblado',
    'Rayones',
    'Lente cámara roto',
    'Botones dañados',
    'Sin tornillos'
  ],
  defaultChecklist: ['Encendido', 'Pantalla / Táctil', 'Cámaras', 'Micrófono / Auricular', 'Carga / Puerto USB', 'Wi-Fi / Bluetooth', 'Lector SIM / Señal', 'Botones Físicos'],

  defaultMinStock: 3,
  allowNegativeStock: false,
  categoriesList: [
    'Pantallas',
    'Glass',
    'Baterías',
    'Centros de carga',
    'Flex',
    'Cámaras',
    'Tapas',
    'Micrófonos',
    'Parlantes',
    'Botones',
    'Conectores',
    'IC',
    'Herramientas',
    'Accesorios',
    'Otros'
  ],

  allowDiscounts: true,
  maxDiscountPercentage: 20,
  autoPrintTicket: true,
  enabledPaymentMethods: ['Efectivo', 'Transferencia', 'QR', 'Tarjeta'],

  defaultTechnicianCommissionPercentage: 40,
  requireAdminPinForDelete: true,
  appZoom: 100
};

const DEFAULT_BRANDS = [
  'Apple', 'Samsung', 'Xiaomi', 'Motorola', 'Huawei', 'Oppo', 'Realme', 'ZTE', 'Infinix'
];

const DEFAULT_MODELS_MAP: Record<string, string[]> = {
  'Apple': ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14', 'iPhone 13', 'iPhone 12', 'iPhone 11', 'iPhone SE'],
  'Samsung': ['Galaxy S24 Ultra', 'Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy S23', 'Galaxy A54 5G', 'Galaxy A34', 'Galaxy A14', 'Galaxy Z Fold5', 'Galaxy Z Flip5'],
  'Xiaomi': ['Redmi Note 13 Pro', 'Redmi Note 12', 'Redmi 12C', 'Xiaomi 14 Ultra', 'Xiaomi 13T', 'Poco F5 Pro', 'Poco X6 Pro'],
  'Motorola': ['Moto G84', 'Moto G54', 'Edge 40 Neo', 'Edge 40', 'Razr 40 Ultra', 'Moto E13'],
  'Huawei': ['P60 Pro', 'Mate 60 Pro', 'Nova 11i', 'P40 Lite', 'Y9a'],
  'Oppo': ['Reno 10 Pro', 'Reno 11', 'A78', 'A58', 'Find N3'],
  'Realme': ['Realme 11 Pro+', 'Realme C55', 'Realme GT3', 'Realme 9'],
  'ZTE': ['Blade V50', 'Blade A54', 'Axon 50'],
  'Infinix': ['Hot 40 Pro', 'Note 40', 'Smart 8']
};

// Default initial user accounts for testing login
const DEFAULT_USERS: User[] = [
  {
    id: 'usr-admin',
    email: 'admin@taller.com',
    name: 'Alejandro Ramos',
    role: 'ADMIN',
    status: true,
    commissionPercentage: 50,
    phone: '777-11111',
    specialty: 'Jefe Técnico & Microelectrónica',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'usr-tech1',
    email: 'carlos@taller.com',
    name: 'Carlos Ruiz',
    role: 'TECHNICIAN',
    status: true,
    commissionPercentage: 40,
    phone: '777-22222',
    specialty: 'Especialista en Pantallas, Glass y Baterías',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'usr-tech2',
    email: 'marina@taller.com',
    name: 'Marina Sosa',
    role: 'TECHNICIAN',
    status: true,
    commissionPercentage: 45,
    phone: '777-33333',
    specialty: 'Microsoldadura, Placas y Puertos de Carga',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'usr-recep',
    email: 'recepcion@taller.com',
    name: 'Sofía Martínez',
    role: 'RECEPTIONIST',
    status: true,
    phone: '777-44444',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Seed clients
const DEFAULT_CLIENTS: Client[] = [
  { id: 'cli-public-general', name: 'Público General', phone: 'S/N', createdAt: new Date(2026, 0, 1).toISOString() },
  { id: 'cli-1', name: 'María Fernández', phone: '555-123-456', email: 'maria@gmail.com', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'cli-2', name: 'Pedro Gómez', phone: '555-987-654', email: 'pgomez@outlook.com', createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'cli-3', name: 'Juan López', phone: '555-456-789', email: 'jlopez@yahoo.com', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'cli-4', name: 'Diana Pérez', phone: '555-321-789', email: 'dperez@gmail.com', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'cli-5', name: 'Luis Rodríguez', phone: '555-789-123', email: 'lrodriguez@live.com', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
];

// Helper to create dates relative to today
const daysAgo = (days: number, hourOffset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hourOffset);
  return d.toISOString();
};

// Seed Orders
const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ord-1',
    otNumber: 'OT-000001',
    clientId: 'cli-1',
    clientName: 'María Fernández',
    clientPhone: '555-123-456',
    brand: 'Apple',
    model: 'iPhone 13 Pro Max',
    color: 'Azul Sierra',
    imei: '358941258963214',
    problem: 'Pantalla táctil rota, requiere cambio de módulo OLED y calibración de FaceID',
    accessories: ['Cargador', 'Funda'],
    physicalState: ['Pantalla rota', 'Golpes', 'Tapa rota'],
    estimatedCost: 2800,
    laborCost: 1500,
    advancePayment: 1000,
    status: 'REPARANDO',
    assignedTechnicianId: 'usr-tech1',
    assignedTechnicianName: 'Carlos Ruiz',
    observaciones: 'El cliente solicita pantalla original. Se deja con funda de silicona transparente.',
    createdAt: daysAgo(3, 4),
    updatedAt: daysAgo(1, 2),
  },
  {
    id: 'ord-2',
    otNumber: 'OT-000002',
    clientId: 'cli-2',
    clientName: 'Pedro Gómez',
    clientPhone: '555-987-654',
    brand: 'Samsung',
    model: 'Galaxy S22 Ultra',
    color: 'Negro Phantom',
    imei: '354125896541235',
    problem: 'Puerto de carga tipo C sulfatado. No detecta carga ni transferencia de datos.',
    accessories: ['SIM'],
    physicalState: ['Teléfono doblado'],
    estimatedCost: 1200,
    laborCost: 800,
    advancePayment: 500,
    status: 'LISTO',
    assignedTechnicianId: 'usr-tech2',
    assignedTechnicianName: 'Marina Sosa',
    observaciones: 'Limpieza e instalación de pin de carga nuevo completada con éxito. Listo para retiro.',
    createdAt: daysAgo(2, 6),
    updatedAt: daysAgo(0, 3),
  },
  {
    id: 'ord-3',
    otNumber: 'OT-000003',
    clientId: 'cli-3',
    clientName: 'Juan López',
    clientPhone: '555-456-789',
    brand: 'Xiaomi',
    model: 'Redmi Note 11',
    color: 'Gris Grafito',
    imei: '862415893254124',
    problem: 'Cambio de batería, se apaga al 30% y se encuentra inflada.',
    accessories: [],
    physicalState: ['Golpes'],
    estimatedCost: 950,
    laborCost: 600,
    advancePayment: 0,
    status: 'RECIBIDO',
    assignedTechnicianId: undefined,
    assignedTechnicianName: undefined,
    observaciones: 'Revisar si requiere pegamento de tapa trasera.',
    createdAt: daysAgo(0, 2),
    updatedAt: daysAgo(0, 2),
  },
  {
    id: 'ord-4',
    otNumber: 'OT-000004',
    clientId: 'cli-4',
    clientName: 'Diana Pérez',
    clientPhone: '555-321-789',
    brand: 'Motorola',
    model: 'Moto G60',
    color: 'Plata',
    imei: '356874125896325',
    problem: 'Cámara trasera rota por impacto. Vidrio astillado que nubla las fotos.',
    accessories: ['Funda', 'Caja'],
    physicalState: ['Pantalla rota', 'Golpes'],
    estimatedCost: 1400,
    laborCost: 900,
    advancePayment: 600,
    status: 'ESPERANDO_REPUESTO',
    assignedTechnicianId: 'usr-tech1',
    assignedTechnicianName: 'Carlos Ruiz',
    observaciones: 'Repuesto importado pedido el día de ayer. Se espera llegada mañana por la tarde.',
    createdAt: daysAgo(4, 1),
    updatedAt: daysAgo(3, 5),
  },
  {
    id: 'ord-5',
    otNumber: 'OT-000005',
    clientId: 'cli-5',
    clientName: 'Luis Rodríguez',
    clientPhone: '555-789-123',
    brand: 'Apple',
    model: 'iPhone 11',
    color: 'Blanco',
    imei: '351478523698547',
    problem: 'Dispositivo mojado en piscina. No enciende. Requiere baño químico ultrasónico.',
    accessories: ['Funda'],
    physicalState: ['Mojado'],
    estimatedCost: 1800,
    laborCost: 1200,
    advancePayment: 1800, // Fully paid
    status: 'ENTREGADO',
    assignedTechnicianId: 'usr-tech1',
    assignedTechnicianName: 'Carlos Ruiz',
    observaciones: 'Diagnóstico exitoso: Cortocircuito en línea de alimentación principal removido. Entrega directa al cliente.',
    createdAt: daysAgo(6, 8),
    updatedAt: daysAgo(1, 4),
  },
  {
    id: 'ord-6',
    otNumber: 'OT-000006',
    clientId: 'cli-1',
    clientName: 'María Fernández',
    clientPhone: '555-123-456',
    brand: 'Samsung',
    model: 'Galaxy A54 5G',
    color: 'Lima',
    imei: '358941258963444',
    problem: 'Cambio de pantalla completa y protector cerámico',
    accessories: ['Funda'],
    physicalState: ['Pantalla rota'],
    estimatedCost: 650,
    advancePayment: 650,
    status: 'ENTREGADO',
    assignedTechnicianId: 'usr-tech1',
    assignedTechnicianName: 'Carlos Ruiz',
    commissionPercentage: 40,
    commissionAmount: 260,
    observaciones: 'Pantalla instalada y probada al 100%. Entregado con recibo de garantía.',
    createdAt: daysAgo(10, 4),
    updatedAt: daysAgo(9, 2),
  },
  {
    id: 'ord-7',
    otNumber: 'OT-000007',
    clientId: 'cli-2',
    clientName: 'Pedro Gómez',
    clientPhone: '555-987-654',
    brand: 'Xiaomi',
    model: 'Redmi Note 12 Pro',
    color: 'Azul',
    imei: '862415893254999',
    problem: 'Falla de encendido, reballing a IC de carga rápida',
    accessories: [],
    physicalState: ['Rayones'],
    estimatedCost: 480,
    advancePayment: 480,
    status: 'ENTREGADO',
    assignedTechnicianId: 'usr-tech2',
    assignedTechnicianName: 'Marina Sosa',
    commissionPercentage: 45,
    commissionAmount: 216,
    observaciones: 'Microsoldadura ejecutada en laboratorio. Carga a 67W restaurada.',
    createdAt: daysAgo(8, 5),
    updatedAt: daysAgo(7, 3),
  },
  {
    id: 'ord-8',
    otNumber: 'OT-000008',
    clientId: 'cli-3',
    clientName: 'Juan López',
    clientPhone: '555-456-789',
    brand: 'Apple',
    model: 'iPhone 14',
    color: 'Medianoche',
    imei: '356874125896111',
    problem: 'Tapa trasera de vidrio rota, remoción láser y cambio',
    accessories: ['Caja'],
    physicalState: ['Tapa rota'],
    estimatedCost: 550,
    advancePayment: 550,
    status: 'ENTREGADO',
    assignedTechnicianId: 'usr-tech1',
    assignedTechnicianName: 'Carlos Ruiz',
    commissionPercentage: 40,
    commissionAmount: 220,
    observaciones: 'Vidrio trasero cambiado con máquina láser. Acabado original impecable.',
    createdAt: daysAgo(18, 6),
    updatedAt: daysAgo(17, 4),
  },
  {
    id: 'ord-9',
    otNumber: 'OT-000009',
    clientId: 'cli-4',
    clientName: 'Diana Pérez',
    clientPhone: '555-321-789',
    brand: 'Samsung',
    model: 'Galaxy S23',
    color: 'Verde',
    imei: '351478523698777',
    problem: 'Batería descargándose muy rápido, salud al 68%',
    accessories: ['Funda'],
    physicalState: [],
    estimatedCost: 380,
    advancePayment: 380,
    status: 'ENTREGADO',
    assignedTechnicianId: 'usr-tech1',
    assignedTechnicianName: 'Carlos Ruiz',
    commissionPercentage: 40,
    commissionAmount: 152,
    observaciones: 'Batería nueva original instalada. Ciclos de carga testeados OK.',
    createdAt: daysAgo(1, 3),
    updatedAt: daysAgo(0, 5),
  },
  {
    id: 'ord-10',
    otNumber: 'OT-000010',
    clientId: 'cli-5',
    clientName: 'Luis Rodríguez',
    clientPhone: '555-789-123',
    brand: 'Motorola',
    model: 'Edge 40 Neo',
    color: 'Negro',
    imei: '356874125896888',
    problem: 'Altavoz inferior distorsionado y suciedad interna',
    accessories: [],
    physicalState: ['Rayones'],
    estimatedCost: 260,
    advancePayment: 100,
    status: 'LISTO',
    assignedTechnicianId: 'usr-tech1',
    assignedTechnicianName: 'Carlos Ruiz',
    commissionPercentage: 40,
    commissionAmount: 104,
    observaciones: 'Parlante cambiado. Audio nítido y potente en pruebas estéreo.',
    createdAt: daysAgo(2, 4),
    updatedAt: daysAgo(0, 2),
  },
  {
    id: 'ord-11',
    otNumber: 'OT-000011',
    clientId: 'cli-1',
    clientName: 'María Fernández',
    clientPhone: '555-123-456',
    brand: 'Apple',
    model: 'iPhone 12 Pro',
    color: 'Oro',
    imei: '358941258963888',
    problem: 'Micrófono principal no graba audios en WhatsApp',
    accessories: ['Funda'],
    physicalState: [],
    estimatedCost: 420,
    advancePayment: 420,
    status: 'ENTREGADO',
    assignedTechnicianId: 'usr-tech1',
    assignedTechnicianName: 'Carlos Ruiz',
    commissionPercentage: 40,
    commissionAmount: 168,
    observaciones: 'Flex de carga y micrófono inferior sustituido con éxito.',
    createdAt: daysAgo(35, 7),
    updatedAt: daysAgo(34, 5),
  },
];

// Seed Payments
const DEFAULT_PAYMENTS: Payment[] = [
  { id: 'pay-1', orderId: 'ord-1', amount: 1000, method: 'Efectivo', notes: 'Adelanto en recepción', date: daysAgo(3, 4), createdAt: daysAgo(3, 4) },
  { id: 'pay-2', orderId: 'ord-2', amount: 500, method: 'Transferencia', notes: 'Adelanto en recepción', date: daysAgo(2, 6), createdAt: daysAgo(2, 6) },
  { id: 'pay-3', orderId: 'ord-4', amount: 600, method: 'Tarjeta', notes: 'Seña para encargo de repuesto', date: daysAgo(4, 1), createdAt: daysAgo(4, 1) },
  { id: 'pay-4', orderId: 'ord-5', amount: 1800, method: 'Efectivo', notes: 'Pago completo de servicio por adelantado', date: daysAgo(6, 8), createdAt: daysAgo(6, 8) },
];

// Seed TimelineEvents
const DEFAULT_EVENTS: TimelineEvent[] = [
  // Order 1 events
  { id: 'evt-1', orderId: 'ord-1', status: 'RECIBIDO', description: 'Equipo ingresado al taller por Sofía Martínez.', createdBy: 'Sofía Martínez', createdAt: daysAgo(3, 4) },
  { id: 'evt-2', orderId: 'ord-1', status: 'DIAGNOSTICO', description: 'Iniciado diagnóstico de pantalla. Táctil inoperativo en esquina superior derecha.', createdBy: 'Carlos Ruiz', createdAt: daysAgo(2, 8) },
  { id: 'evt-3', orderId: 'ord-1', status: 'REPARANDO', description: 'Instalando repuesto OLED original. Se procede a realizar FaceID mapping.', createdBy: 'Carlos Ruiz', createdAt: daysAgo(1, 2) },

  // Order 2 events
  { id: 'evt-4', orderId: 'ord-2', status: 'RECIBIDO', description: 'Equipo ingresado por Sofía Martínez.', createdBy: 'Sofía Martínez', createdAt: daysAgo(2, 6) },
  { id: 'evt-5', orderId: 'ord-2', status: 'DIAGNOSTICO', description: 'Revisión técnica: Pin de carga destruido internamente.', createdBy: 'Marina Sosa', createdAt: daysAgo(1, 7) },
  { id: 'evt-6', orderId: 'ord-2', status: 'REPARANDO', description: 'Procediendo a desoldar puerto antiguo con estación de calor a 360°C.', createdBy: 'Marina Sosa', createdAt: daysAgo(1, 2) },
  { id: 'evt-7', orderId: 'ord-2', status: 'LISTO', description: 'Reparación de puerto completada. Carga rápida 18W verificada. Limpieza externa realizada.', createdBy: 'Marina Sosa', createdAt: daysAgo(0, 3) },

  // Order 3 events
  { id: 'evt-8', orderId: 'ord-3', status: 'RECIBIDO', description: 'Equipo ingresado por Sofía Martínez. Pendiente asignación de técnico.', createdBy: 'Sofía Martínez', createdAt: daysAgo(0, 2) },

  // Order 4 events
  { id: 'evt-9', orderId: 'ord-4', status: 'RECIBIDO', description: 'Equipo ingresado por Sofía Martínez con seña abonada.', createdBy: 'Sofía Martínez', createdAt: daysAgo(4, 1) },
  { id: 'evt-10', orderId: 'ord-4', status: 'DIAGNOSTICO', description: 'Cámara astillada. El sensor interno está intacto, solo requiere cristal externo.', createdBy: 'Carlos Ruiz', createdAt: daysAgo(3, 10) },
  { id: 'evt-11', orderId: 'ord-4', status: 'ESPERANDO_REPUESTO', description: 'Se solicita cristal de cámara original a distribuidor local. Demora estimada de 48 horas.', createdBy: 'Carlos Ruiz', createdAt: daysAgo(3, 5) },

  // Order 5 events
  { id: 'evt-12', orderId: 'ord-5', status: 'RECIBIDO', description: 'Equipo mojado ingresado de urgencia. Pago total abonado.', createdBy: 'Sofía Martínez', createdAt: daysAgo(6, 8) },
  { id: 'evt-13', orderId: 'ord-5', status: 'REPARANDO', description: 'Sometiendo placa principal a baño químico de alcohol isopropílico al 99% por ultrasonido.', createdBy: 'Carlos Ruiz', createdAt: daysAgo(5, 4) },
  { id: 'evt-14', orderId: 'ord-5', status: 'LISTO', description: 'Dispositivo encendido perfectamente. Se probó Wi-Fi, audio, cámaras y llamadas. Test OK.', createdBy: 'Carlos Ruiz', createdAt: daysAgo(3, 2) },
  { id: 'evt-15', orderId: 'ord-5', status: 'ENTREGADO', description: 'Equipo devuelto al cliente Luis Rodríguez con garantía de 3 meses en mano de obra.', createdBy: 'Sofía Martínez', createdAt: daysAgo(1, 4) },
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    code: 'P-001',
    barcode: '742832920211',
    name: 'Pantalla iPhone 13 Pro Max OLED',
    category: 'Pantallas',
    brand: 'Apple',
    compatibleModel: 'iPhone 13 Pro Max',
    description: 'Pantalla de repuesto OLED de alta calidad. Soporta TrueTone y 120Hz.',
    supplier: 'TecnoMayorista SRL',
    purchasePrice: 650,
    salePrice: 1100,
    stock: 5,
    minStock: 2,
    location: 'Estante A-1',
    status: 'Activo',
    createdAt: daysAgo(20)
  },
  {
    id: 'prod-2',
    code: 'P-002',
    barcode: '742832920222',
    name: 'Batería Galaxy S23 Ultra Original',
    category: 'Baterías',
    brand: 'Samsung',
    compatibleModel: 'Galaxy S23 Ultra',
    description: 'Batería de polímero de litio de 5000mAh con celdas originales.',
    supplier: 'SumiRepuestos Import',
    purchasePrice: 180,
    salePrice: 350,
    stock: 8,
    minStock: 3,
    location: 'Cajón B-3',
    status: 'Activo',
    createdAt: daysAgo(18)
  },
  {
    id: 'prod-3',
    code: 'P-003',
    barcode: '742832920233',
    name: 'Pin de Carga Tipo C Moto G84',
    category: 'Centros de carga',
    brand: 'Motorola',
    compatibleModel: 'Moto G84 / G54',
    description: 'Centro de carga USB Tipo C compatible para soldar en placa.',
    supplier: 'CelParts Repuestos',
    purchasePrice: 10,
    salePrice: 45,
    stock: 18,
    minStock: 5,
    location: 'Caja C-12',
    status: 'Activo',
    createdAt: daysAgo(15)
  },
  {
    id: 'prod-4',
    code: 'P-004',
    barcode: '',
    name: 'Glass de Pantalla iPhone 14 Pro',
    category: 'Glass',
    brand: 'Apple',
    compatibleModel: 'iPhone 14 Pro',
    description: 'Vidrio frontal templado de alta resistencia para remanufactura de pantallas OCA.',
    supplier: 'TecnoMayorista SRL',
    purchasePrice: 40,
    salePrice: 120,
    stock: 2,
    minStock: 3,
    location: 'Cajonera D-1',
    status: 'Activo',
    createdAt: daysAgo(10)
  },
  {
    id: 'prod-5',
    code: 'P-005',
    barcode: '693417770012',
    name: 'Cargador Rápido Xiaomi 33W',
    category: 'Accesorios',
    brand: 'Xiaomi',
    compatibleModel: 'Universal Tipo C',
    description: 'Cargador original Xiaomi 33W de pared con cable incluido.',
    supplier: 'SumiRepuestos Import',
    purchasePrice: 60,
    salePrice: 130,
    stock: 1,
    minStock: 4,
    location: 'Vitrina Frontal A',
    status: 'Activo',
    createdAt: daysAgo(8)
  },
  {
    id: 'prod-6',
    code: 'P-006',
    barcode: '843820192083',
    name: 'Cámara Trasera iPhone 12 Pro',
    category: 'Cámaras',
    brand: 'Apple',
    compatibleModel: 'iPhone 12 Pro',
    description: 'Módulo de triple cámara trasera original para iPhone 12 Pro.',
    supplier: 'Apple Parts Miami',
    purchasePrice: 450,
    salePrice: 850,
    stock: 0,
    minStock: 1,
    location: 'Bóveda Repuestos',
    status: 'Activo',
    createdAt: daysAgo(5)
  }
];

const DEFAULT_MOVEMENTS: InventoryMovement[] = [
  {
    id: 'mov-1',
    productId: 'prod-1',
    productName: 'Pantalla iPhone 13 Pro Max OLED',
    type: 'ENTRADA',
    quantity: 6,
    date: daysAgo(20),
    user: 'Alejandro Ramos',
    reason: 'Compra inicial a proveedor',
    observation: 'Factura 8493 de TecnoMayorista SRL'
  },
  {
    id: 'mov-2',
    productId: 'prod-1',
    productName: 'Pantalla iPhone 13 Pro Max OLED',
    type: 'SALIDA_REPARACION',
    quantity: 1,
    date: daysAgo(10),
    user: 'Carlos Ruiz',
    reason: 'Repuesto utilizado en reparación de OT-000001',
    observation: 'Orden de trabajo OT-000001',
    orderId: 'ord-1'
  },
  {
    id: 'mov-3',
    productId: 'prod-2',
    productName: 'Batería Galaxy S23 Ultra Original',
    type: 'ENTRADA',
    quantity: 8,
    date: daysAgo(18),
    user: 'Alejandro Ramos',
    reason: 'Ingreso por importación directa'
  },
  {
    id: 'mov-4',
    productId: 'prod-3',
    productName: 'Pin de Carga Tipo C Moto G84',
    type: 'ENTRADA',
    quantity: 20,
    date: daysAgo(15),
    user: 'Alejandro Ramos',
    reason: 'Adquisición local'
  },
  {
    id: 'mov-5',
    productId: 'prod-3',
    productName: 'Pin de Carga Tipo C Moto G84',
    type: 'SALIDA_REPARACION',
    quantity: 2,
    date: daysAgo(2),
    user: 'Marina Sosa',
    reason: 'Cambio de pin en OT-000002',
    orderId: 'ord-2'
  }
];

const DEFAULT_SALES: Sale[] = [
  {
    id: 'sale-1',
    saleNumber: 'V-000001',
    clientId: 'cli-3',
    clientName: 'Juan López',
    items: [
      {
        id: 'sitem-1',
        type: 'PRODUCT',
        referenceId: 'prod-5',
        name: 'Cargador Rápido Xiaomi 33W',
        quantity: 1,
        price: 130,
        subtotal: 130
      },
      {
        id: 'sitem-2',
        type: 'SERVICE',
        name: 'Mantenimiento General Computadora/Cargador',
        quantity: 1,
        price: 50,
        subtotal: 50
      }
    ],
    subtotal: 180,
    discount: 10,
    total: 170,
    paymentMethod: 'Efectivo',
    observations: 'Cliente habitual, descuento de Bs. 10 otorgado.',
    date: daysAgo(5, 2),
    user: 'Sofía Martínez'
  },
  {
    id: 'sale-2',
    saleNumber: 'V-000002',
    clientId: 'cli-public-general',
    clientName: 'Público General',
    items: [
      {
        id: 'sitem-3',
        type: 'PRODUCT',
        referenceId: 'prod-2',
        name: 'Batería Galaxy S23 Ultra Original',
        quantity: 1,
        price: 350,
        subtotal: 350
      }
    ],
    subtotal: 350,
    discount: 0,
    total: 350,
    paymentMethod: 'QR',
    observations: 'Venta rápida express.',
    date: daysAgo(2, 4),
    user: 'Sofía Martínez'
  }
];

export const mockDb = {
  // Read helpers
  getUsers(): User[] {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(data);
  },

  getClients(): Client[] {
    const data = localStorage.getItem(CLIENTS_KEY);
    let clients: Client[];
    if (!data) {
      clients = [...DEFAULT_CLIENTS];
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    } else {
      clients = JSON.parse(data);
    }
    
    // Ensure "Público General" is always present and is the first element
    const pgIndex = clients.findIndex(c => c.id === 'cli-public-general');
    if (pgIndex !== -1) {
      const [pgClient] = clients.splice(pgIndex, 1);
      clients.unshift(pgClient);
    } else {
      const pgClient: Client = {
        id: 'cli-public-general',
        name: 'Público General',
        phone: 'S/N',
        createdAt: new Date(2026, 0, 1).toISOString()
      };
      clients.unshift(pgClient);
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    }
    
    return clients;
  },

  getOrders(): Order[] {
    const data = localStorage.getItem(ORDERS_KEY);
    if (!data) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(DEFAULT_ORDERS));
      return DEFAULT_ORDERS;
    }
    return JSON.parse(data);
  },

  getPayments(): Payment[] {
    const data = localStorage.getItem(PAYMENTS_KEY);
    if (!data) {
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(DEFAULT_PAYMENTS));
      return DEFAULT_PAYMENTS;
    }
    return JSON.parse(data);
  },

  getEvents(): TimelineEvent[] {
    const data = localStorage.getItem(EVENTS_KEY);
    if (!data) {
      localStorage.setItem(EVENTS_KEY, JSON.stringify(DEFAULT_EVENTS));
      return DEFAULT_EVENTS;
    }
    return JSON.parse(data);
  },

  // Save helpers
  saveUsers(users: User[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  saveClients(clients: Client[]) {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  },

  saveOrders(orders: Order[]) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  },

  savePayments(payments: Payment[]) {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  },

  saveEvents(events: TimelineEvent[]) {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  },

  getBrands(): string[] {
    const data = localStorage.getItem(BRANDS_KEY);
    if (!data) {
      localStorage.setItem(BRANDS_KEY, JSON.stringify(DEFAULT_BRANDS));
      return DEFAULT_BRANDS;
    }
    return JSON.parse(data);
  },

  saveBrands(brands: string[]) {
    localStorage.setItem(BRANDS_KEY, JSON.stringify(brands));
  },

  getModelsMap(): Record<string, string[]> {
    const data = localStorage.getItem(MODELS_KEY);
    if (!data) {
      localStorage.setItem(MODELS_KEY, JSON.stringify(DEFAULT_MODELS_MAP));
      return DEFAULT_MODELS_MAP;
    }
    return JSON.parse(data);
  },

  saveModelsMap(modelsMap: Record<string, string[]>) {
    localStorage.setItem(MODELS_KEY, JSON.stringify(modelsMap));
  },

  addBrand(brand: string) {
    if (!brand || !brand.trim()) return;
    const brands = this.getBrands();
    const formattedBrand = brand.trim().charAt(0).toUpperCase() + brand.trim().slice(1);
    if (!brands.some(b => b.toLowerCase() === formattedBrand.toLowerCase())) {
      brands.push(formattedBrand);
      localStorage.setItem(BRANDS_KEY, JSON.stringify(brands));
      
      const modelsMap = this.getModelsMap();
      if (!modelsMap[formattedBrand]) {
        modelsMap[formattedBrand] = [];
        localStorage.setItem(MODELS_KEY, JSON.stringify(modelsMap));
      }
    }
  },

  addModel(brand: string, model: string) {
    if (!brand || !brand.trim() || !model || !model.trim()) return;
    const formattedBrand = brand.trim().charAt(0).toUpperCase() + brand.trim().slice(1);
    this.addBrand(formattedBrand); // ensure brand exists
    
    const modelsMap = this.getModelsMap();
    if (!modelsMap[formattedBrand]) {
      modelsMap[formattedBrand] = [];
    }
    
    const trimmedModel = model.trim();
    if (!modelsMap[formattedBrand].some(m => m.toLowerCase() === trimmedModel.toLowerCase())) {
      modelsMap[formattedBrand].push(trimmedModel);
      localStorage.setItem(MODELS_KEY, JSON.stringify(modelsMap));
    }
  },

  // Auth Operations
  login(email: string, password: string): { user: User; token: string } | null {
    const users = this.getUsers();
    // Simplified match (in production we hash/compare, here we do standard literal matches)
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (user) {
      // Setup easy literal credentials corresponding to seeds
      let isCorrect = false;
      if (user.email === 'admin@taller.com' && password === 'admin123') isCorrect = true;
      else if (user.email === 'carlos@taller.com' && password === 'tech123') isCorrect = true;
      else if (user.email === 'marina@taller.com' && password === 'tech123') isCorrect = true;
      else if (user.email === 'recepcion@taller.com' && password === 'recep123') isCorrect = true;
      else if (password === '123456') isCorrect = true; // Fallback master key for ease of preview

      if (isCorrect && user.status) {
        return {
          user,
          token: `mock-jwt-token-${user.id}-${Date.now()}`
        };
      }
    }
    return null;
  },

  // Client Operations
  getOrCreateClient(name: string, phone: string, email?: string, referencePhone?: string, referenceRelationship?: string): Client {
    const clients = this.getClients();
    const existingIdx = clients.findIndex(c => c.phone === phone);
    if (existingIdx !== -1) {
      if (referencePhone !== undefined) {
        clients[existingIdx].referencePhone = referencePhone;
      }
      if (referenceRelationship !== undefined) {
        clients[existingIdx].referenceRelationship = referenceRelationship;
      }
      this.saveClients(clients);
      return clients[existingIdx];
    }
    
    const newClient: Client = {
      id: `cli-${Date.now()}`,
      name,
      phone,
      email,
      referencePhone,
      referenceRelationship,
      createdAt: new Date().toISOString()
    };
    
    clients.push(newClient);
    this.saveClients(clients);
    return newClient;
  },

  updateClient(id: string, updatedFields: Partial<Client>): Client | null {
    const clients = this.getClients();
    const idx = clients.findIndex(c => c.id === id);
    if (idx === -1) return null;
    
    const oldClient = clients[idx];
    const newClient: Client = {
      ...oldClient,
      ...updatedFields
    };
    
    clients[idx] = newClient;
    this.saveClients(clients);
    return newClient;
  },

  // Order Operations
  createOrder(orderData: Omit<Order, 'id' | 'otNumber' | 'createdAt' | 'updatedAt'>, createdByUser: string): Order {
    const orders = this.getOrders();
    const settings = this.getSettings();
    const prefix = settings.otPrefix || 'OT-';
    
    // Generate next OT Number: e.g. OT-000006 or customized prefix
    const lastOtNumber = orders
      .map(o => {
        const match = o.otNumber ? o.otNumber.match(/(\d+)$/) : null;
        return match ? parseInt(match[1], 10) : 0;
      })
      .reduce((max, val) => Math.max(max, val), 0);
    
    const nextNum = lastOtNumber + 1;
    const otNumber = `${prefix}${String(nextNum).padStart(6, '0')}`;
    
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      otNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    orders.push(newOrder);
    this.saveOrders(orders);
    
    // Create first history event
    this.addEvent(
      newOrder.id,
      'RECIBIDO',
      `Orden recibida en taller. Estado físico inicial: [${newOrder.physicalState.join(', ') || 'Normal'}]. Accesorios incluidos: [${newOrder.accessories.join(', ') || 'Ninguno'}]. Seña inicial: Bs. ${newOrder.advancePayment}.`,
      createdByUser
    );

    // If advance payment exists, register it in Payments too
    if (newOrder.advancePayment > 0) {
      this.addPayment(newOrder.id, newOrder.advancePayment, 'Efectivo', 'Pago inicial / seña');
    }
    
    return newOrder;
  },

  updateOrder(orderId: string, updatedFields: Partial<Order>, updatedByUser: string): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;
    
    const oldOrder = orders[idx];
    const newOrder: Order = {
      ...oldOrder,
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };
    
    orders[idx] = newOrder;
    this.saveOrders(orders);
    
    // Log state change if it changes
    if (updatedFields.status && updatedFields.status !== oldOrder.status) {
      this.addEvent(
        orderId,
        updatedFields.status,
        `Cambio de estado: de ${oldOrder.status} a ${updatedFields.status}. Notas: ${updatedFields.observaciones || 'Sin comentarios adicionales.'}`,
        updatedByUser
      );
    } else if (updatedFields.assignedTechnicianId && updatedFields.assignedTechnicianId !== oldOrder.assignedTechnicianId) {
      this.addEvent(
        orderId,
        newOrder.status,
        `Técnico asignado: ${newOrder.assignedTechnicianName || 'No asignado'}`,
        updatedByUser
      );
    } else {
      // General update log
      this.addEvent(
        orderId,
        newOrder.status,
        `Información de orden actualizada.`,
        updatedByUser
      );
    }
    
    return newOrder;
  },

  // Payment Operations
  addPayment(orderId: string, amount: number, method: string, notes?: string): Payment {
    const payments = this.getPayments();
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      orderId,
      amount,
      method,
      notes,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    payments.push(newPayment);
    this.savePayments(payments);
    
    // Auto-update order advancePayment to show total sum paid
    const orders = this.getOrders();
    const ordIdx = orders.findIndex(o => o.id === orderId);
    if (ordIdx !== -1) {
      const allOrderPayments = payments.filter(p => p.orderId === orderId);
      const totalPaid = allOrderPayments.reduce((acc, p) => acc + p.amount, 0);
      orders[ordIdx].advancePayment = totalPaid;
      orders[ordIdx].updatedAt = new Date().toISOString();
      this.saveOrders(orders);
    }
    
    return newPayment;
  },

  // Event Timeline operations
  addEvent(orderId: string, status: OrderStatus, description: string, createdBy: string): TimelineEvent {
    const events = this.getEvents();
    const newEvent: TimelineEvent = {
      id: `evt-${Date.now()}`,
      orderId,
      status,
      description,
      createdBy,
      createdAt: new Date().toISOString()
    };
    
    events.push(newEvent);
    this.saveEvents(events);
    return newEvent;
  },

  // Dashboard Stats calculation
  getStats(): DashboardStats {
    const orders = this.getOrders();
    const payments = this.getPayments();
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    
    // Orders received today
    const receivedToday = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= startOfToday;
    }).length;
    
    // In repair count (either DIAGNOSTICO, ESPERANDO_REPUESTO, or REPARANDO)
    const inRepair = orders.filter(o => 
      o.status === 'DIAGNOSTICO' || o.status === 'ESPERANDO_REPUESTO' || o.status === 'REPARANDO'
    ).length;
    
    // Ready count (LISTO)
    const ready = orders.filter(o => o.status === 'LISTO').length;
    
    // Delivered count (ENTREGADO)
    const delivered = orders.filter(o => o.status === 'ENTREGADO').length;
    
    // Daily revenue (payments received today)
    const dailyRevenue = payments
      .filter(p => {
        const d = new Date(p.date);
        return d >= startOfToday;
      })
      .reduce((sum, p) => sum + p.amount, 0);
      
    return {
      receivedToday,
      inRepair,
      ready,
      delivered,
      dailyRevenue
    };
  },

  // === INVENTORY OPERATIONS ===

  getProducts(): Product[] {
    const data = localStorage.getItem(PRODUCTS_KEY);
    if (!data) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    return JSON.parse(data);
  },

  saveProducts(products: Product[]) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  },

  addProduct(productData: Omit<Product, 'id' | 'createdAt'>, user: string): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    products.push(newProduct);
    this.saveProducts(products);

    // Register movement ENTRADA
    this.addMovement({
      productId: newProduct.id,
      productName: newProduct.name,
      type: 'ENTRADA',
      quantity: newProduct.stock,
      reason: 'Ingreso inicial de producto',
      observation: `Stock inicial registrado de ${newProduct.stock} unidades en la ubicación: ${newProduct.location}.`
    }, user);

    return newProduct;
  },

  updateProduct(id: string, updatedFields: Partial<Product>, user: string): Product | null {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const oldProduct = products[idx];
    const newProduct: Product = {
      ...oldProduct,
      ...updatedFields
    };

    products[idx] = newProduct;
    this.saveProducts(products);

    // If stock was adjusted manually
    if (updatedFields.stock !== undefined && updatedFields.stock !== oldProduct.stock) {
      const diff = updatedFields.stock - oldProduct.stock;
      if (diff !== 0) {
        this.addMovement({
          productId: id,
          productName: newProduct.name,
          type: 'AJUSTE',
          quantity: Math.abs(diff),
          reason: 'Ajuste manual de inventario',
          observation: `El stock cambió de ${oldProduct.stock} a ${newProduct.stock} por ajuste manual.`
        }, user);
      }
    }

    return newProduct;
  },

  deleteProduct(id: string): boolean {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    products.splice(idx, 1);
    this.saveProducts(products);
    return true;
  },

  // === MOVEMENTS OPERATIONS ===

  getMovements(): InventoryMovement[] {
    const data = localStorage.getItem(MOVEMENTS_KEY);
    if (!data) {
      localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(DEFAULT_MOVEMENTS));
      return DEFAULT_MOVEMENTS;
    }
    return JSON.parse(data);
  },

  saveMovements(movements: InventoryMovement[]) {
    localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements));
  },

  addMovement(movData: Omit<InventoryMovement, 'id' | 'date' | 'user'>, user: string): InventoryMovement {
    const movements = this.getMovements();
    const newMov: InventoryMovement = {
      ...movData,
      id: `mov-${Date.now()}`,
      date: new Date().toISOString(),
      user
    };
    movements.push(newMov);
    this.saveMovements(movements);

    // Update stock in product if not already updated (e.g. adjust stock relative to old stock)
    if (newMov.type === 'SALIDA_VENTA' || newMov.type === 'SALIDA_REPARACION' || newMov.type === 'PERDIDA') {
      const products = this.getProducts();
      const pIdx = products.findIndex(p => p.id === newMov.productId);
      if (pIdx !== -1) {
        const allowNeg = !!this.getSettings().allowNegativeStock;
        products[pIdx].stock = allowNeg
          ? products[pIdx].stock - newMov.quantity
          : Math.max(0, products[pIdx].stock - newMov.quantity);
        this.saveProducts(products);
      }
    } else if (newMov.type === 'ENTRADA' || newMov.type === 'DEVOLUCION') {
      const products = this.getProducts();
      const pIdx = products.findIndex(p => p.id === newMov.productId);
      if (pIdx !== -1) {
        products[pIdx].stock = products[pIdx].stock + newMov.quantity;
        this.saveProducts(products);
      }
    }

    return newMov;
  },

  // === SALES OPERATIONS ===

  getSales(): Sale[] {
    const data = localStorage.getItem(SALES_KEY);
    if (!data) {
      localStorage.setItem(SALES_KEY, JSON.stringify(DEFAULT_SALES));
      return DEFAULT_SALES;
    }
    return JSON.parse(data);
  },

  saveSales(sales: Sale[]) {
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
  },

  createSale(saleData: Omit<Sale, 'id' | 'saleNumber' | 'date' | 'user'>, user: string): Sale {
    const sales = this.getSales();

    // Generate V-000001
    const lastSaleNumber = sales
      .map(s => {
        const num = parseInt(s.saleNumber.replace('V-', ''), 10);
        return isNaN(num) ? 0 : num;
      })
      .reduce((max, val) => Math.max(max, val), 0);

    const nextNum = lastSaleNumber + 1;
    const saleNumber = `V-${String(nextNum).padStart(6, '0')}`;

    const newSale: Sale = {
      ...saleData,
      id: `sale-${Date.now()}`,
      saleNumber,
      date: new Date().toISOString(),
      user
    };

    sales.push(newSale);
    this.saveSales(sales);

    // Register inventory movements and discount stock for products
    newSale.items.forEach(item => {
      if (item.type === 'PRODUCT' && item.referenceId) {
        this.addMovement({
          productId: item.referenceId,
          productName: item.name,
          type: 'SALIDA_VENTA',
          quantity: item.quantity,
          reason: `Venta registrada en comprobante ${saleNumber}`,
          observation: `Vendido a ${newSale.clientName}. Pago con: ${newSale.paymentMethod}.`,
          saleId: newSale.id
        }, user);
      }
    });

    return newSale;
  },

  cancelSale(saleId: string, user: string): boolean {
    const sales = this.getSales();
    const idx = sales.findIndex(s => s.id === saleId);
    if (idx === -1) return false;

    const sale = sales[idx];
    
    // Return items to inventory (DEVOLUCION movement)
    sale.items.forEach(item => {
      if (item.type === 'PRODUCT' && item.referenceId) {
        this.addMovement({
          productId: item.referenceId,
          productName: item.name,
          type: 'DEVOLUCION',
          quantity: item.quantity,
          reason: `Devolución por cancelación de venta ${sale.saleNumber}`,
          observation: `Venta anulada por ${user}.`,
          saleId: sale.id
        }, user);
      }
    });

    // Remove the sale
    sales.splice(idx, 1);
    this.saveSales(sales);
    return true;
  },

  // === SETTINGS OPERATIONS ===

  getSettings(): WorkshopSettings {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    try {
      const parsed = JSON.parse(data);
      // Migrate old default workshop names to BOL.FIX
      if (
        !parsed.workshopName ||
        parsed.workshopName === 'SERVICIO TÉCNICO EXPRESS' ||
        parsed.workshopName === 'TALLER DE CELULARES PRO' ||
        parsed.workshopName === 'Taller Celulares' ||
        parsed.workshopName === 'Taller Express'
      ) {
        parsed.workshopName = 'BOL.FIX';
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, ...parsed }));
      }
      if (!parsed.workshopSlogan || parsed.workshopSlogan.includes('Servicio Técnico Especializado') || parsed.workshopSlogan.includes('Panel Administrativo')) {
        parsed.workshopSlogan = 'By: Mauro Medina';
      }
      if (!parsed.defaultPhysicalStates || !Array.isArray(parsed.defaultPhysicalStates) || parsed.defaultPhysicalStates.length === 0) {
        parsed.defaultPhysicalStates = DEFAULT_SETTINGS.defaultPhysicalStates;
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(newSettings: WorkshopSettings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('workshop_settings_saved', { detail: newSettings }));
      window.dispatchEvent(new Event('storage'));
    }
  },

  // === USER MANAGEMENT OPERATIONS ===

  createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  },

  updateUser(id: string, updatedFields: Partial<User>): User | null {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    const updatedUser = { ...users[idx], ...updatedFields };
    users[idx] = updatedUser;
    this.saveUsers(users);
    return updatedUser;
  },

  deleteUser(id: string): boolean {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    users.splice(idx, 1);
    this.saveUsers(users);
    return true;
  },

  // === BRANDS & MODELS MANAGEMENT ===

  deleteBrand(brandName: string): boolean {
    const brands = this.getBrands();
    const idx = brands.findIndex(b => b.toLowerCase() === brandName.toLowerCase());
    if (idx === -1) return false;
    brands.splice(idx, 1);
    localStorage.setItem(BRANDS_KEY, JSON.stringify(brands));

    const modelsMap = this.getModelsMap();
    if (modelsMap[brandName]) {
      delete modelsMap[brandName];
      localStorage.setItem(MODELS_KEY, JSON.stringify(modelsMap));
    }
    return true;
  },

  deleteModel(brandName: string, modelName: string): boolean {
    const modelsMap = this.getModelsMap();
    if (!modelsMap[brandName]) return false;
    const idx = modelsMap[brandName].findIndex(m => m.toLowerCase() === modelName.toLowerCase());
    if (idx === -1) return false;
    modelsMap[brandName].splice(idx, 1);
    localStorage.setItem(MODELS_KEY, JSON.stringify(modelsMap));
    return true;
  },

  // === BACKUP & RESTORE ===

  exportBackupData(): string {
    const backup = {
      timestamp: new Date().toISOString(),
      users: this.getUsers(),
      clients: this.getClients(),
      orders: this.getOrders(),
      payments: this.getPayments(),
      events: this.getEvents(),
      brands: this.getBrands(),
      modelsMap: this.getModelsMap(),
      products: this.getProducts(),
      movements: this.getMovements(),
      sales: this.getSales(),
      settings: this.getSettings()
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackupData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.users && Array.isArray(data.users)) this.saveUsers(data.users);
      if (data.clients && Array.isArray(data.clients)) this.saveClients(data.clients);
      if (data.orders && Array.isArray(data.orders)) this.saveOrders(data.orders);
      if (data.payments && Array.isArray(data.payments)) this.savePayments(data.payments);
      if (data.events && Array.isArray(data.events)) this.saveEvents(data.events);
      if (data.brands && Array.isArray(data.brands)) localStorage.setItem(BRANDS_KEY, JSON.stringify(data.brands));
      if (data.modelsMap && typeof data.modelsMap === 'object') localStorage.setItem(MODELS_KEY, JSON.stringify(data.modelsMap));
      if (data.products && Array.isArray(data.products)) this.saveProducts(data.products);
      if (data.movements && Array.isArray(data.movements)) this.saveMovements(data.movements);
      if (data.sales && Array.isArray(data.sales)) this.saveSales(data.sales);
      if (data.settings && typeof data.settings === 'object') this.saveSettings(data.settings);
      return true;
    } catch (e) {
      console.error('Error al importar copia de seguridad:', e);
      return false;
    }
  }
};
