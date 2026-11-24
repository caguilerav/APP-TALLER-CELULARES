/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

const OUTPUT_PATH = path.resolve(process.cwd(), 'public', 'BOLFIX_Especificacion_Completa.pdf');

// Colors (RGB)
const C_BLACK: [number, number, number] = [17, 17, 17];
const C_GOLD: [number, number, number] = [250, 204, 21];
const C_GOLD_DARK: [number, number, number] = [161, 98, 7];
const C_NEON: [number, number, number] = [0, 200, 50];
const C_TEXT: [number, number, number] = [31, 41, 55];
const C_MUTED: [number, number, number] = [107, 114, 128];
const C_BORDER: [number, number, number] = [229, 231, 235];
const C_BG_LIGHT: [number, number, number] = [248, 250, 252];
const C_BG_CODE: [number, number, number] = [243, 244, 246];
const C_WHITE: [number, number, number] = [255, 255, 255];

class SpecPdfBuilder {
  doc: jsPDF;
  pageWidth = 210;
  pageHeight = 297;
  margin = 15;
  topMargin = 20;
  bottomMargin = 18;
  contentWidth = 180;
  y = 20;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
  }

  ensureSpace(heightNeeded: number) {
    if (this.y + heightNeeded > this.pageHeight - this.bottomMargin) {
      this.doc.addPage();
      this.y = this.topMargin;
    }
  }

  addCoverPage() {
    const { doc, pageWidth, pageHeight, margin } = this;

    // Dark hero header background
    doc.setFillColor(...C_BLACK);
    doc.rect(0, 0, pageWidth, 125, 'F');

    // Top gold accent strip
    doc.setFillColor(...C_GOLD);
    doc.rect(0, 0, pageWidth, 4, 'F');

    // Badge
    doc.setFillColor(35, 35, 35);
    doc.setDrawColor(...C_NEON);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, 22, 82, 9, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...C_NEON);
    doc.text('BLUEPRINT TECNICO PARA CLAUDE CODE', margin + 41, 27.8, { align: 'center' });

    // Main brand title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(...C_NEON);
    doc.text('BOL', margin, 52);
    doc.setTextColor(...C_WHITE);
    doc.text('.FIX', margin + 27, 52);

    doc.setFontSize(11);
    doc.setTextColor(...C_GOLD);
    doc.text('By: Mauro Medina  |  Sistema de Gestion de Taller de Celulares & POS', margin, 62);

    // Subtitle description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(215, 220, 228);
    const intro = doc.splitTextToSize(
      'Especificacion funcional, arquitectura de datos, reglas de negocio, diseno UI/UX y guia completa de implementacion movil para construir la aplicacion nativa/multiplataforma en formato APK (Android) e IPA (iOS).',
      this.contentWidth
    );
    doc.text(intro, margin, 74);

    // Target platform badges inside hero
    const chips = [
      'Android (.APK)',
      'iOS (.IPA)',
      '11 Modulos Completos',
      '3 Roles (RBAC)',
      'Offline-First + Sync'
    ];
    let cx = margin;
    chips.forEach((chip) => {
      const w = doc.getTextWidth(chip) + 8;
      doc.setFillColor(30, 30, 30);
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(0.3);
      doc.roundedRect(cx, 98, w, 8, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...C_GOLD);
      doc.text(chip, cx + w / 2, 103.3, { align: 'center' });
      cx += w + 3.5;
    });

    // Metadata box below hero
    let y = 140;
    doc.setFillColor(...C_BG_LIGHT);
    doc.setDrawColor(...C_BORDER);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, this.contentWidth, 42, 3, 3, 'FD');

    const metaRows: [string, string][] = [
      ['Aplicacion:', 'BOL.FIX - Administracion de Taller de Reparacion de Celulares y Punto de Venta (POS)'],
      ['Objetivo:', 'Lectura directa por Claude Code para generar app movil compilable a APK (Android) e IPA (iOS)'],
      ['Moneda / Idioma:', 'Bolivianos (Bs., configurable) / Espanol (es-ES / es-BO)'],
      ['Stack Web Origen:', 'React 19 + TypeScript + Tailwind CSS v4 + Vite + jsPDF + QRCode + Prisma Schema'],
      ['Stack Movil Sugerido:', 'React Native + Expo SDK (TypeScript) + Expo SQLite + EAS Build (o Flutter + Drift)']
    ];

    let my = y + 8;
    metaRows.forEach(([k, v]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...C_BLACK);
      doc.text(k, margin + 5, my);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C_TEXT);
      doc.text(v, margin + 43, my);
      my += 7.2;
    });

    // Table of Contents
    y = 194;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...C_BLACK);
    doc.text('INDICE DEL DOCUMENTO', margin, y);
    y += 3;
    doc.setDrawColor(...C_GOLD);
    doc.setLineWidth(1);
    doc.line(margin, y, margin + 48, y);
    y += 8;

    const toc = [
      '1. Vision General, Arquitectura y Alcance Funcional',
      '2. Identidad Visual, Branding y Sistema de Diseno (UI/UX)',
      '3. Roles de Usuario, Autenticacion y Matriz de Permisos (RBAC)',
      '4. Navegacion (Movil Bottom Tabs, Header y Sidebar Desktop)',
      '5. Modelo de Datos Completo (Entidades TypeScript y Esquema SQL/Prisma)',
      '6. Especificacion Detallada Pantalla por Pantalla (11 Modulos)',
      '7. Reglas de Negocio Criticas, Calculos y Sincronizacion de Stock',
      '8. Comprobantes, Recibos PDF (50x70mm, 80mm, Carta) y Codigo QR',
      '9. Datos Semilla (Seed Data) y Configuracion Inicial',
      '10. Guia de Implementacion Movil para Claude Code (APK y IPA)'
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...C_TEXT);
    toc.forEach((item) => {
      doc.text(item, margin + 2, y);
      y += 6.5;
    });

    // Cover Footer
    doc.setDrawColor(...C_BORDER);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C_MUTED);
    doc.text('BOL.FIX  |  Especificacion Tecnica Integral para Desarrollo Movil (APK / IPA)', margin, pageHeight - 12);
    doc.text('Version 1.0', pageWidth - margin, pageHeight - 12, { align: 'right' });

    doc.addPage();
    this.y = this.topMargin;
  }

  addSection(num: string, title: string) {
    this.ensureSpace(16);
    const { doc, margin, contentWidth } = this;

    doc.setFillColor(...C_BLACK);
    doc.roundedRect(margin, this.y, contentWidth, 9.5, 2, 2, 'F');
    doc.setFillColor(...C_GOLD);
    doc.rect(margin, this.y, 3, 9.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...C_WHITE);
    doc.text(`${num}. ${title.toUpperCase()}`, margin + 6, this.y + 6.4);

    this.y += 13;
  }

  addSubSection(title: string) {
    this.ensureSpace(11);
    const { doc, margin, contentWidth } = this;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.8);
    doc.setTextColor(...C_BLACK);
    doc.text(title, margin, this.y + 4);

    doc.setDrawColor(...C_BORDER);
    doc.setLineWidth(0.35);
    doc.line(margin, this.y + 5.8, margin + contentWidth, this.y + 5.8);

    this.y += 9.5;
  }

  addParagraph(text: string, fontSize = 8.8) {
    const { doc, margin, contentWidth } = this;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(...C_TEXT);
    const lines = doc.splitTextToSize(text, contentWidth);
    const lineH = fontSize * 0.48;

    for (const line of lines) {
      this.ensureSpace(lineH + 1);
      doc.text(line, margin, this.y);
      this.y += lineH;
    }
    this.y += 2;
  }

  addBullet(label: string, text: string) {
    const { doc, margin, contentWidth } = this;
    const fontSize = 8.6;
    const lineH = 4.2;
    const fullText = label ? `${label}: ${text}` : text;
    const lines = doc.splitTextToSize(fullText, contentWidth - 5);

    this.ensureSpace(lineH * Math.min(lines.length, 3) + 1.5);

    // Bullet dot
    doc.setFillColor(...C_GOLD_DARK);
    doc.circle(margin + 1.8, this.y - 1.1, 0.85, 'F');

    lines.forEach((line: string, idx: number) => {
      if (idx > 0) this.ensureSpace(lineH + 1);
      if (idx === 0 && label && line.startsWith(`${label}:`)) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontSize);
        doc.setTextColor(...C_BLACK);
        const prefix = `${label}:`;
        doc.text(prefix, margin + 5, this.y);
        const pw = doc.getTextWidth(prefix) + 1.5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C_TEXT);
        doc.text(line.slice(prefix.length).trimStart(), margin + 5 + pw, this.y);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(...C_TEXT);
        doc.text(line, margin + 5, this.y);
      }
      this.y += lineH;
    });
    this.y += 1.2;
  }

  addCodeBlock(code: string) {
    const { doc, margin, contentWidth } = this;
    const rawLines = code.trimEnd().split('\n');
    const wrappedLines: string[] = [];
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.4);

    rawLines.forEach((raw) => {
      const split = doc.splitTextToSize(raw || ' ', contentWidth - 8);
      split.forEach((s: string) => wrappedLines.push(s));
    });

    const lineH = 3.6;
    let idx = 0;

    while (idx < wrappedLines.length) {
      const avail = this.pageHeight - this.bottomMargin - this.y - 4;
      let maxLines = Math.floor(avail / lineH);
      if (maxLines < 3) {
        this.doc.addPage();
        this.y = this.topMargin;
        maxLines = Math.floor((this.pageHeight - this.bottomMargin - this.y - 4) / lineH);
      }

      const chunk = wrappedLines.slice(idx, idx + maxLines);
      const boxH = chunk.length * lineH + 4.5;

      doc.setFillColor(...C_BG_CODE);
      doc.setDrawColor(...C_BORDER);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, this.y, contentWidth, boxH, 1.5, 1.5, 'FD');

      doc.setFillColor(...C_BLACK);
      doc.rect(margin, this.y, 1.6, boxH, 'F');

      doc.setFont('courier', 'normal');
      doc.setFontSize(7.4);
      doc.setTextColor(25, 30, 40);

      let cy = this.y + 4;
      chunk.forEach((l) => {
        doc.text(l, margin + 4.5, cy);
        cy += lineH;
      });

      this.y += boxH + 3;
      idx += chunk.length;
    }
  }

  addTable(headers: string[], rows: string[][], colWidths: number[]) {
    const { doc, margin } = this;
    const fontSize = 7.8;
    const lineH = 3.7;
    const padX = 2.2;
    const padY = 2.2;
    const totalW = colWidths.reduce((a, b) => a + b, 0);

    const drawHeader = () => {
      const headerH = 7;
      this.ensureSpace(headerH + 8);
      doc.setFillColor(...C_BLACK);
      doc.rect(margin, this.y, totalW, headerH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontSize);
      doc.setTextColor(...C_GOLD);
      let x = margin;
      headers.forEach((h, i) => {
        doc.text(h, x + padX, this.y + 4.8);
        x += colWidths[i];
      });
      this.y += headerH;
    };

    drawHeader();

    rows.forEach((row, rIdx) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      const cellLines = row.map((cell, cIdx) =>
        doc.splitTextToSize(cell || '', colWidths[cIdx] - padX * 2)
      );
      const maxLineCount = Math.max(...cellLines.map((c) => c.length), 1);
      const rowH = maxLineCount * lineH + padY * 2;

      if (this.y + rowH > this.pageHeight - this.bottomMargin) {
        doc.addPage();
        this.y = this.topMargin;
        drawHeader();
      }

      if (rIdx % 2 === 1) {
        doc.setFillColor(...C_BG_LIGHT);
        doc.rect(margin, this.y, totalW, rowH, 'F');
      }

      doc.setDrawColor(...C_BORDER);
      doc.setLineWidth(0.25);
      doc.rect(margin, this.y, totalW, rowH, 'S');

      let x = margin;
      cellLines.forEach((lines, cIdx) => {
        doc.setFont('helvetica', cIdx === 0 ? 'bold' : 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(cIdx === 0 ? C_BLACK[0] : C_TEXT[0], cIdx === 0 ? C_BLACK[1] : C_TEXT[1], cIdx === 0 ? C_BLACK[2] : C_TEXT[2]);
        let cy = this.y + padY + 2.8;
        lines.forEach((line: string) => {
          doc.text(line, x + padX, cy);
          cy += lineH;
        });
        x += colWidths[cIdx];
      });

      this.y += rowH;
    });

    this.y += 4;
  }

  addRunningHeadersAndFooters() {
    const { doc, pageWidth, pageHeight, margin } = this;
    const totalPages = doc.getNumberOfPages();

    for (let i = 2; i <= totalPages; i++) {
      doc.setPage(i);

      // Header line
      doc.setDrawColor(...C_BORDER);
      doc.setLineWidth(0.3);
      doc.line(margin, 12, pageWidth - margin, 12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...C_BLACK);
      doc.text('BOL.FIX', margin, 9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C_MUTED);
      doc.text('  |  Especificacion Completa de la Aplicacion (APK / IPA)', margin + 14, 9.5);

      // Footer line
      doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);
      doc.setFontSize(7.5);
      doc.setTextColor(...C_MUTED);
      doc.text('Blueprint Tecnico para Claude Code - Taller de Celulares & Punto de Venta (POS)', margin, pageHeight - 8.5);
      doc.text(`Pagina ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 8.5, { align: 'right' });
    }
  }

  save(filePath: string) {
    this.addRunningHeadersAndFooters();
    const arrayBuffer = this.doc.output('arraybuffer');
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
  }
}

function generateFullSpecPdf() {
  const pdf = new SpecPdfBuilder();

  // COVER
  pdf.addCoverPage();

  // =========================================================================
  // SECTION 1: VISION GENERAL & ARQUITECTURA
  // =========================================================================
  pdf.addSection('1', 'Vision General, Arquitectura y Alcance Funcional');
  pdf.addParagraph(
    'BOL.FIX (By: Mauro Medina) es un sistema completo de administracion para talleres de reparacion de telefonos celulares y venta de repuestos/accesorios. Combina la gestion operativa del servicio tecnico (recepcion con fotos y patron de desbloqueo, flujo de 6 estados, asignacion de tecnicos, calculo de comisiones, generacion de comprobantes PDF y etiquetas QR) con un inventario con kardex automatico y un Punto de Venta (POS) integrado.'
  );
  pdf.addParagraph(
    'La aplicacion original esta construida como una SPA web (React 19, TypeScript, Tailwind CSS v4, Vite) con persistencia offline en localStorage y un esquema relacional Prisma/PostgreSQL listo para backend. Este documento contiene el 100% de la arquitectura, pantallas, formulas, textos, permisos y flujos para que Claude Code pueda reconstruirla como aplicacion movil nativa/multiplataforma compilable a APK (Android) e IPA (iOS).'
  );

  pdf.addSubSection('Modulos Principales del Sistema (11 Vistas)');
  pdf.addTable(
    ['#', 'Modulo / Componente', 'Ruta / Tab', 'Proposito Principal'],
    [
      ['1', 'LoginView', 'Auth', 'Inicio de sesion por email/clave, accesos demo y recuperacion'],
      ['2', 'DashboardView', 'dashboard', 'Metricas del dia, ingresos, accesos rapidos y ultimas 5 ordenes'],
      ['3', 'ReceptionView', 'recepcion', 'Alta de orden de trabajo (OT), cliente, fotos, patron y repuestos'],
      ['4', 'OrderListView', 'reparaciones', 'Listado filtrable, buscador y ordenamiento de todas las OTs'],
      ['5', 'OrderDetailView', 'activeOrderId', 'Gestion de OT, estados, edicion, cobro en POS, PDF/QR y timeline'],
      ['6', 'TechnicianPanelView', 'panel_tecnico', 'Ordenes asignadas por tecnico, historial laboral y comisiones'],
      ['7', 'InventoryView', 'inventario', 'Catalogo de repuestos (Album/Lista), CRUD y Kardex de movimientos'],
      ['8', 'SalesView (POS)', 'ventas', 'Carrito POS centrado, venta de stock, ordenes transferidas y tickets'],
      ['9', 'ReportsView', 'reportes', 'KPIs financieros, graficos comparativos, alertas stock y export CSV'],
      ['10', 'SettingsView', 'configuracion', '7 pestanas de ajustes globales, branding, marcas, usuarios y backup'],
      ['11', 'GlobalSearchView', 'Modal Global', 'Buscador Spotlight unificado: OTs, productos, ventas y clientes']
    ],
    [10, 42, 30, 98]
  );

  // =========================================================================
  // SECTION 2: IDENTIDAD VISUAL Y SISTEMA DE DISENO
  // =========================================================================
  pdf.addSection('2', 'Identidad Visual, Branding y Sistema de Diseno (UI/UX)');
  pdf.addParagraph(
    'El diseno visual combina una estetica industrial de alto contraste (negro carbon + acento dorado + verde neon tecnico) sobre superficies limpias blancas y gris claro, priorizando legibilidad en talleres, botones grandes optimizados para uso tactil y tipografia tabular para cifras.'
  );

  pdf.addSubSection('Paleta de Colores Oficial');
  pdf.addTable(
    ['Token / Uso', 'Codigo Hex', 'Aplicacion en la Interfaz'],
    [
      ['Fondo General App', '#F9F9F9', 'Fondo principal de pantallas y contenedores scrollables'],
      ['Superficie Tarjetas', '#FFFFFF', 'Cards, modales, inputs activos y barra inferior movil'],
      ['Negro Primario', '#111111 / #000000', 'Headers, Sidebar desktop, banners KPI, botones primarios y total POS'],
      ['Amarillo Dorado (Brand)', '#FACC15 / #E2B810', 'Acento principal, tabs activos, botones CTA, patron de desbloqueo'],
      ['Verde Neon (Tecnico/Logo)', '#00FF40 / #00E63C', 'Logo oficial BOL.FIX, eslogan, Panel del Tecnico y comisiones'],
      ['Verde Exito / Cobro', '#10B981 / #059669', 'Estado LISTO, boton PROCESAR VENTA, saldos pagados y vuelto'],
      ['Rojo Alerta / Peligro', '#EF4444 / #DC2626', 'Stock agotado, boton Vaciar/Eliminar, descuentos y reset de fabrica'],
      ['Estados de Orden', 'Azul / Purpura / Ambar', 'RECIBIDO (azul), DIAGNOSTICO (purpura), ESP. REPUESTO (ambar)']
    ],
    [45, 38, 97]
  );

  pdf.addSubSection('Tipografia, Formas y Logotipo Oficial (BolFixLogo)');
  pdf.addBullet('Fuente Sans (UI)', 'Inter (pesos 400 Regular, 600 SemiBold, 700 Bold, 800 ExtraBold, 900 Black). Titulos en mayusculas con tracking ajustado.');
  pdf.addBullet('Fuente Mono (Datos)', 'JetBrains Mono para codigos OT-000001, V-000001, IMEI, SKU, precios (Bs.), fechas, stock y secuencias de patron.');
  pdf.addBullet('Radios y Elevacion', 'Tarjetas principales con border-radius 24px (rounded-3xl), tarjetas internas 16px (rounded-2xl), botones 12px-16px, bordes sutiles #E5E7EB.');
  pdf.addBullet('Logotipo Oficial SVG', 'Fondo negro con contorno del mapa de Bolivia en verde neon (#00FF40), insignia rectangular redondeada con borde neon, icono de smartphone blanco con llave mecanica arriba a la derecha, texto "BOL" en verde neon bold italic, ".FIX" en blanco y "By: Mauro Medina" debajo.');
  pdf.addBullet('Personalizacion Dinamica', 'Desde Configuracion > General el administrador puede subir una imagen personalizada para Logotipo e Icono de App (con ajuste de zoom 40% a 100%, default 75%) que se refleja en headers, login y comprobantes.');

  // =========================================================================
  // SECTION 3: ROLES, AUTENTICACION Y RBAC
  // =========================================================================
  pdf.addSection('3', 'Roles de Usuario, Autenticacion y Permisos (RBAC)');
  pdf.addParagraph(
    'El sistema maneja 3 roles de usuario definidos en el enum UserRole: ADMIN (Administrador), RECEPTIONIST (Recepcion) y TECHNICIAN (Tecnico Especialista). La sesion se persiste localmente en el dispositivo y redirige segun el rol al iniciar sesion.'
  );

  pdf.addTable(
    ['Funcionalidad / Modulo', 'ADMIN', 'RECEPTIONIST', 'TECHNICIAN'],
    [
      ['Pantalla inicial tras Login', 'Dashboard', 'Dashboard', 'Panel del Tecnico'],
      ['Dashboard (KPIs + Ultimas OTs)', 'Si (completo)', 'Si (completo)', 'Si (sin boton Recepcion)'],
      ['Recepcion Rapida (Crear OT)', 'Si', 'Si', 'No'],
      ['Lista de Reparaciones', 'Si', 'Si', 'Si'],
      ['Detalle de Orden (Ver / Editar / Estados)', 'Si', 'Si', 'Si'],
      ['Panel del Tecnico & Comisiones', 'Si (ve todos los tecnicos)', 'Acceso solo lectura desktop', 'Si (bloqueado a su usuario)'],
      ['Inventario (Ver Stock y Kardex)', 'Si', 'Si', 'Si (solo lectura)'],
      ['Inventario (Crear / Editar / Eliminar)', 'Si', 'Si', 'No'],
      ['Punto de Venta (POS) y Cobros', 'Si', 'Si', 'No'],
      ['Estadisticas, Reportes y Export CSV', 'Si', 'No', 'No'],
      ['Configuracion, Usuarios y Backup', 'Si', 'No', 'No']
    ],
    [66, 38, 38, 38]
  );

  pdf.addSubSection('Cuentas Demo Semilla (LoginView)');
  pdf.addTable(
    ['Nombre', 'Email', 'Contrasena', 'Rol', 'Comision / Especialidad'],
    [
      ['Alejandro Ramos', 'admin@taller.com', 'admin123', 'ADMIN', '50% - Jefe Tecnico & Microelectronica'],
      ['Sofia Martinez', 'recepcion@taller.com', 'recep123', 'RECEPTIONIST', 'Atencion al cliente y caja'],
      ['Carlos Ruiz', 'carlos@taller.com', 'tech123', 'TECHNICIAN', '40% - Pantallas, Glass y Baterias'],
      ['Marina Sosa', 'marina@taller.com', 'tech123', 'TECHNICIAN', '45% - Microsoldadura, Placas y Carga']
    ],
    [34, 38, 22, 28, 58]
  );

  // =========================================================================
  // SECTION 4: NAVEGACION MOVIL Y DESKTOP
  // =========================================================================
  pdf.addSection('4', 'Arquitectura de Navegacion (Mobile-First & Responsive)');
  pdf.addBullet('Header Superior Movil (Sticky)', 'Fondo #111111, altura compacta. Izquierda: Icono logo + Nombre del taller + Eslogan verde neon (tocar abre Buscador Global). Derecha: Boton lupa (Buscador Global), primer nombre + rol abreviado, boton salir (LogOut).');
  pdf.addBullet('Barra Inferior Movil (Bottom Tab Bar)', 'Fija en la parte inferior con soporte SafeArea (env(safe-area-inset-bottom)). Pestanas visibles segun rol: Inicio (Home), Tecnico (Wrench verde, Admin/Tecnico), Lista (ClipboardList), Stock (Package), POS (ShoppingBag, Admin/Recepcion), Ajustes (Settings, solo Admin).');
  pdf.addBullet('Sidebar Desktop (Tablet/Web >= 768px)', 'Barra lateral fija izquierda de 256px en #111111 con logo, boton de buscador global, 7 enlaces de navegacion, tarjeta de perfil de usuario, boton Reset DB y boton Salir.');
  pdf.addBullet('Navegacion a Detalle de Orden', 'Al tocar cualquier orden desde Dashboard, Lista, Panel del Tecnico o Buscador Global, se abre OrderDetailView ocupando la vista principal con boton "Volver". Al tocar "Cobrar en Carrito POS", cierra el detalle, cambia a la pestana POS y precarga la orden en el carrito.');

  // =========================================================================
  // SECTION 5: MODELO DE DATOS COMPLETO
  // =========================================================================
  pdf.addSection('5', 'Modelo de Datos Completo (TypeScript & Esquema Relacional)');
  pdf.addParagraph(
    'A continuacion se detallan las interfaces exactas del dominio (src/types.ts). Para la app movil APK/IPA, estas entidades deben mapearse directamente a tablas locales SQLite/Drift/WatermelonDB y/o endpoints REST/PostgreSQL.'
  );

  pdf.addCodeBlock(`export type UserRole = 'ADMIN' | 'TECHNICIAN' | 'RECEPTIONIST';

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
  commissionPercentage?: number; // Ej: 40 (%)
  phone?: string;
  specialty?: string;
  createdAt: string;             // ISO 8601
}

export interface Client {
  id: string;                    // 'cli-public-general' para venta rapida
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
  cost?: number;                 // Solo si type === 'EXTERNAL'
  productId?: string;            // Solo si type === 'INVENTORY'
  quantity?: number;             // Default 1
}

export interface Order {
  id: string;
  otNumber: string;              // Correlativo: OT-000001 (prefijo configurable)
  clientId: string;
  clientName: string;
  clientPhone: string;
  referencePhone?: string;
  referenceRelationship?: string;
  // Dispositivo
  brand: string;
  model: string;
  color: string;
  imei?: string;
  lockType?: string;             // 'Sin bloqueo' | 'PIN' | 'Contraseña' | 'Patrón'
  lockValue?: string;            // Ej. '1234' o secuencia de patron '1-2-3-5-7'
  // Detalles tecnicos
  problem: string;
  quickDiagnosis?: string;
  accessories: string[];         // SIM, Memoria SD, Cargador, Caja, Funda...
  physicalState: string[];       // Pantalla rota, No enciende, Mojado, Golpes...
  checklist?: string[];
  images?: string[];             // Maximo 4 fotos (Base64 o URI local)
  spareParts?: UsedSparePart[];
  isLaborOnly?: boolean;         // true = Solo mano de obra (sin repuestos)
  // Finanzas y comisiones
  estimatedCost: number;         // laborCost + costo de repuestos
  advancePayment: number;        // Suma total abonada/pagada hasta la fecha
  laborCost?: number;            // Base para comision del tecnico
  commissionPercentage?: number;
  commissionAmount?: number;
  commissionPaid?: boolean;
  // Estado y asignacion
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
  method: string;                // Efectivo | Transferencia | QR | Tarjeta
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
}`);

  pdf.addSubSection('Entidades de Inventario, Ventas (POS) y Configuracion');
  pdf.addCodeBlock(`export type ProductCategory =
  | 'Pantallas' | 'Glass' | 'Baterías' | 'Centros de carga' | 'Flex'
  | 'Cámaras' | 'Tapas' | 'Micrófonos' | 'Parlantes' | 'Botones'
  | 'Conectores' | 'IC' | 'Herramientas' | 'Accesorios' | 'Otros';

export interface Product {
  id: string;
  code: string;                  // Codigo interno (ej. PROD-123456)
  barcode?: string;              // Codigo de barras escaneable
  name: string;
  category: ProductCategory;
  brand: string;
  compatibleModel?: string;
  description: string;
  supplier: string;
  purchasePrice: number;         // Costo de compra (valorizacion de activos)
  salePrice: number;             // Precio de venta al publico
  stock: number;
  minStock: number;              // Umbral de alerta de bajo stock
  location: string;              // Estante / gaveta
  status: 'Activo' | 'Inactivo';
  image?: string;
  createdAt: string;
}

export type MovementType =
  | 'ENTRADA' | 'SALIDA_VENTA' | 'SALIDA_REPARACION'
  | 'AJUSTE'  | 'PERDIDA'      | 'DEVOLUCION';

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  date: string;
  user: string;
  reason: string;
  observation?: string;
  orderId?: string;              // Si proviene de una orden de servicio
  saleId?: string;               // Si proviene de una venta POS
}

export type SaleItemType = 'PRODUCT' | 'SERVICE';
export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'QR' | 'Tarjeta' | 'Mixto';

export interface SaleItem {
  id?: string;
  type: SaleItemType;
  referenceId?: string;          // Product ID o Order ID
  name: string;
  quantity: number;
  price: number;
  subtotal?: number;
  details?: string;
  category?: string;
  sku?: string;
  // Metadatos cuando el item corresponde a una Orden de Servicio cobrada en POS
  orderOt?: string;
  orderEquipment?: string;
  orderIssue?: string;
  orderTechnician?: string;
}

export interface Sale {
  id: string;
  saleNumber: string;            // Correlativo: V-000001
  clientId: string;
  clientName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  observations?: string;
  date: string;
  user: string;
}

export interface WorkshopSettings {
  workshopName: string;          // Default: 'BOL.FIX'
  workshopSlogan: string;        // Default: 'By: Mauro Medina'
  phone: string;
  address: string;
  currencySymbol: string;        // Default: 'Bs.'
  ticketFooterMessage: string;
  defaultWarrantyDays: number;   // Default: 30
  taxPercentage: number;         // Default: 0
  customLogo?: string;
  customAppIcon?: string;
  appIconZoom?: number;          // 40 a 100 (default 75)
  defaultTechnicianCommissionPercentage?: number; // Default: 40
  otPrefix: string;              // Default: 'OT-'
  requireTechnicianAssigned: boolean;
  defaultAccessoriesList: string[];
  defaultPhysicalStates: string[];
  defaultChecklist?: string[];
  defaultMinStock: number;       // Default: 3
  allowNegativeStock: boolean;   // Default: false
  categoriesList: string[];
  allowDiscounts: boolean;       // Default: true
  maxDiscountPercentage: number; // Default: 20
  autoPrintTicket: boolean;      // Default: true
  enabledPaymentMethods: string[];
  requireAdminPinForDelete: boolean;
  appZoom?: number;              // 70 a 150 (default 100)
}`);

  pdf.addSubSection('Relaciones de Base de Datos (Prisma / SQLite)');
  pdf.addBullet('User 1:N Order', 'Un tecnico (User) tiene multiples ordenes asignadas via assignedTechnicianId.');
  pdf.addBullet('Client 1:N Order / Sale', 'Un cliente puede tener multiples ordenes de reparacion y compras en POS.');
  pdf.addBullet('Order 1:N Payment (Cascade)', 'Cada orden mantiene historial de pagos/senas; la suma actualiza Order.advancePayment.');
  pdf.addBullet('Order 1:N TimelineEvent (Cascade)', 'Registro inmutable de auditoria por creacion, cambio de estado, asignacion y cobros.');
  pdf.addBullet('Product 1:N InventoryMovement', 'Cada cambio de stock genera un movimiento en el kardex con referencia opcional a orderId o saleId.');

  // =========================================================================
  // SECTION 6: ESPECIFICACION PANTALLA POR PANTALLA
  // =========================================================================
  pdf.addSection('6', 'Especificacion Detallada Pantalla por Pantalla');

  // 6.1 Login
  pdf.addSubSection('6.1 LoginView (Autenticacion)');
  pdf.addBullet('Diseno', 'Tarjeta blanca centrada con barra superior dorada (#FACC15), logotipo BolFixLogo completo y subtitulo "Servicio Tecnico Especializado & Gestion de Taller".');
  pdf.addBullet('Campos', 'Email (required), Contrasena (required, oculta), Checkbox "Recordarme", enlace "¿Olvidaste tu contrasena?" que despliega formulario de recuperacion por correo.');
  pdf.addBullet('Accesos Demo', '3 botones rapidos (Admin, Sofia, Carlos) que autocompletan credenciales para pruebas.');

  // 6.2 Dashboard
  pdf.addSubSection('6.2 DashboardView (Inicio / Panel de Control)');
  pdf.addBullet('Hero Banner Oscuro (#111111)', 'Badge "Taller Activo", saludo "Hola, {user.name}", rol, fecha actual en espanol, e indicadores destacados: Ingresos del dia (Bs.) y Equipos recibidos hoy.');
  pdf.addBullet('4 Tarjetas KPI Interactivas (Grid 2x2 movil / 4 cols desktop)', '1) Hoy (equipos recibidos hoy -> abre Lista filtrada por HOY); 2) En Reparacion (DIAGNOSTICO + ESPERANDO_REPUESTO + REPARANDO -> abre Lista filtrada por EN_REPARACION); 3) Listos (LISTO -> filtro LISTO); 4) Entregados (ENTREGADO -> filtro ENTREGADO).');
  pdf.addBullet('Accesos Rapidos', 'Boton dorado "Recepcion Rapida" (visible solo para ADMIN y RECEPTIONIST) y boton blanco "Ver Reparaciones".');
  pdf.addBullet('Ultimas Ordenes', 'Muestra las 5 ordenes mas recientes ordenadas por createdAt descendente con Nro OT, fecha, marca/modelo, cliente y badge de estado.');

  // 6.3 Reception
  pdf.addSubSection('6.3 ReceptionView (Recepcion de Equipos / Nueva OT)');
  pdf.addBullet('Gestion de Cliente', 'Buscador desplegable de clientes existentes + boton "+ Nuevo Cliente" (modal con busqueda en vivo para evitar duplicados, campos: Nombre*, Telefono*, Telefono Referencia, Parentesco) + boton Editar Cliente seleccionado.');
  pdf.addBullet('Datos del Equipo', 'Chips rapidos de marcas populares (Apple, Samsung, Xiaomi, Motorola, Huawei, Oppo, Realme) + selector de Marca con boton "+ Agregar Marca" (modal) + selector de Modelo filtrado dinamicamente por marca con boton "+ Agregar Modelo" (modal) + Color + IMEI (en movil, permitir escaneo con camara).');
  pdf.addBullet('Bloqueo y Patron Tactil (PatternLockDrawer)', 'Selector de tipo: Sin bloqueo, PIN, Contrasena, Patron. Si elige Patron, se renderiza un tablero tactil 3x3 con puntos numerados 1-9 que permite deslizar el dedo o tocar para trazar lineas doradas (#FACC15), muestra la secuencia (ej. 1 -> 2 -> 5 -> 8) y guarda "1-2-5-8" en lockValue.');
  pdf.addBullet('Estado Fisico y Accesorios', 'Chips multi-seleccion cargados desde WorkshopSettings (ej. Pantalla rota, Mojado, Golpes, Tapa rota, Telefono doblado / SIM, Memoria SD, Cargador, Caja, Funda) con boton "+ Otro" para agregar opciones personalizadas al vuelo.');
  pdf.addBullet('Evidencia Fotografica (Max 4 Fotos)', 'Carga de hasta 4 fotos del estado inicial del telefono (en APK/IPA usar camara nativa y galeria), miniaturas con boton eliminar y modal auxiliar de escaneo visual (identificacion de modelo/componentes).');
  pdf.addBullet('Falla, Diagnostico y Repuestos', 'Descripcion de falla reportada (*), diagnostico rapido y observaciones. Switch "Solo Mano de Obra (sin repuestos)". Si esta desactivado, permite agregar repuestos de Inventario (abriendo SparePartsInventoryModal con vista Mosaico/Lista, buscador y pills de categoria) o repuestos Externos (nombre + costo).');
  pdf.addBullet('Finanzas y Guardado', 'Costo Mano de Obra (*), resumen automatico de Costo Total = Mano de Obra + Repuestos, Adelanto/Sena (validado <= Costo Total), selector de Tecnico Responsable. Permite "Guardar Orden" o "Guardar e Imprimir Comprobante".');

  // 6.4 Order List
  pdf.addSubSection('6.4 OrderListView (Lista de Reparaciones)');
  pdf.addBullet('Busqueda Instantanea', 'Filtra en tiempo real por Nro OT, nombre cliente, telefono, marca, modelo o IMEI.');
  pdf.addBullet('Panel de Filtros Expandible', 'Pills de estado con contador numerico en tiempo real (Todos, Hoy, En Reparacion y cada uno de los 6 estados) + 4 criterios de ordenamiento (Mas recientes, Mas antiguos, Mayor costo, Menor costo).');
  pdf.addBullet('Tarjetas de Orden', 'Muestran Nro OT, fecha, Marca/Modelo, Cliente, Tecnico asignado, Costo estimado, etiqueta financiera (Saldado / Con Sena / Pendiente) y badge de estado.');

  // 6.5 Order Detail
  pdf.addSubSection('6.5 OrderDetailView (Detalle y Gestion de Orden)');
  pdf.addBullet('Cabecera y Flujo de Estados', 'Numero OT, boton Volver, boton Editar Orden, boton Imprimir/Comprobante, selector de Tecnico y barra interactiva de 6 estados (RECIBIDO -> DIAGNOSTICO -> ESPERANDO_REPUESTO -> REPARANDO -> LISTO -> ENTREGADO).');
  pdf.addBullet('Modo Edicion Completo', 'Permite modificar datos del dispositivo, bloqueo/patron, falla, diagnostico, mano de obra, observaciones, fotos y repuestos. Al guardar cambios de repuestos de inventario, calcula diferencias automaticamente: descuenta nuevos repuestos (SALIDA_REPARACION) y reingresa los eliminados (DEVOLUCION).');
  pdf.addBullet('Tarjeta Cliente & Pagos (Regla UI Importante)', 'Muestra cliente, telefono, Costo de Servicio, Total Pagado, Saldo Pendiente e Historial de Cobros (con boton "Recibo" individual). Cuando Saldo Pendiente > 0, muestra UNICAMENTE el boton negro/dorado "Cobrar en Carrito POS" (NO existe boton verde de Registrar Pago/Abono directo). Si Saldo == 0, muestra badge verde "Orden Saldada".');
  pdf.addBullet('Timeline & Galeria', 'Cronologia inversa de todos los eventos con usuario y fecha/hora, y visor de fotos a pantalla completa.');

  // 6.6 Technician Panel
  pdf.addSubSection('6.6 TechnicianPanelView (Panel del Tecnico & Comisiones)');
  pdf.addBullet('Cabecera y Perfil', 'Header oscuro con acento verde neon (#00FF40). Si el usuario es ADMIN, incluye desplegable para seleccionar y auditar a cualquier tecnico; si es TECHNICIAN, queda bloqueado a su propia cuenta. Muestra 4 metricas de carrera: Fecha ingreso, % Comision, Trabajos activos y Efectividad historica (% entregados).');
  pdf.addBullet('Sub-pestana 1: Trabajos Asignados Activos', '4 tarjetas de conteo rapido por estado (En Diagnostico, En Reparacion, Esp. Repuesto, Listos para Retiro), buscador, ordenamiento y selector inline para cambiar estado al instante.');
  pdf.addBullet('Sub-pestana 2: Reporte Financiero de Comisiones', 'Filtros de fecha rapidos (Hoy, Ayer, Esta Semana, Este Mes, Mes Pasado, Todo, Personalizado), control de % de comision, resumen de Comision Ganada (ordenes ENTREGADO), Comision Pendiente de Retiro (ordenes LISTO), Total Facturado en Mano de Obra, Promedio por trabajo, tabla detallada y vista imprimible.');
  pdf.addBullet('Sub-pestana 3: Historial Completo Laboral', 'Listado historico de todas las ordenes atendidas por el tecnico con buscador y filtro de estado.');

  // 6.7 Inventory
  pdf.addSubSection('6.7 InventoryView (Inventario de Repuestos y Kardex)');
  pdf.addBullet('Pestana Lista Stock', 'Buscador (codigo, barcode, nombre, marca, modelo), filtro por categoria (15 categorias dinamicas), filtro por nivel (Todos, Bajo Stock, Agotado), selector de vista Album (tarjetas) o Lista compacta, y boton "+ Registrar Pieza" (Admin/Recepcion).');
  pdf.addBullet('Tarjetas de Producto', 'Codigo interno, categoria, badge de estado (DISPONIBLE / BAJO STOCK / AGOTADO), nombre, marca, modelo compatible, stock disponible, precio venta, precio compra, ubicacion y acciones (Ajustar Stock, Editar, Eliminar).');
  pdf.addBullet('Modal Ajuste Manual de Stock', 'Permite registrar ENTRADA (compra/reposicion), AJUSTE o PERDIDA indicando cantidad, motivo obligatorio y observacion.');
  pdf.addBullet('Pestana Kardex / Movimientos', 'Bitacora completa con filtro por tipo de movimiento y buscador, mostrando fecha, producto, cantidad (+/-), usuario, motivo y referencia a OT o Venta.');

  // 6.8 POS
  pdf.addSubSection('6.8 SalesView (Punto de Venta - POS)');
  pdf.addParagraph(
    'Diseno minimalista enfocado exclusivamente en el CARRITO POS centrado (sin cuadricula lateral fija en pantalla principal). En movil, la cabecera es compacta para dar maximo protagonismo al carrito.'
  );
  pdf.addBullet('Cabecera POS', 'Muestra titulo Punto de Venta (POS), badge Caja Activa, cajero actual, ventas del dia (cantidad y monto), boton "+" (Agregar Concepto Libre / Servicio), boton Historial y boton Refrescar. (Se elimino el boton amarillo superior de agregar producto y el boton "+Prod" del header del carrito).');
  pdf.addBullet('Tarjeta CARRITO', 'Header oscuro con titulo grande "CARRITO" (text-lg font-black), contador de items y boton rojo "Vaciar" (limpia el carrito de inmediato sin dialogo window.confirm).');
  pdf.addBullet('Selector de Cliente', 'Por defecto "Publico General". Desplegable con buscador en vivo y enlace "+ Nuevo Cliente" que abre modal fijo centrado.');
  pdf.addBullet('Estado Vacio & Catalogo Bajo Demanda', 'Cuando el carrito esta vacio, muestra el boton principal dorado "Agregar Producto del Inventario" que abre el modal de catalogo completo (buscador por nombre/codigo/barcode/marca, filtro por categoria, checkbox "Solo con stock" y botones para sumar al carrito).');
  pdf.addBullet('Items en el Carrito', 'Soporta dos tipos: 1) PRODUCT (stepper [- qty +], SKU, validacion de stock, subtotal); 2) SERVICE proveniente de Orden de Trabajo (tarjeta con borde dorado, badge "ORDEN DE TRABAJO #OT", equipo, falla y tecnico asignado, cantidad fija 1). Permite venta cruzada sumando accesorios a una reparacion.');
  pdf.addBullet('Modales Fijos y Centrados (Critico en Movil)', 'Todos los modales del POS ("Agregar Producto del Inventario", "Agregar Concepto Libre / Servicio", "Registrar Nuevo Cliente") se montan mediante Portal directo al viewport (en movil nativo usar <Modal transparent> con KeyboardAvoidingView) para quedar siempre fijos y centrados horizontal/verticalmente sin moverse al hacer scroll.');
  pdf.addBullet('Checkout y Calculadora de Vuelto', 'Subtotal, Descuento alternable entre monto fijo (Bs.) o porcentaje (%), banner negro/dorado TOTAL A COBRAR, selector de Metodo de Pago (Efectivo, Transferencia, QR, Tarjeta). Si el metodo es Efectivo, despliega campo "Monto Recibido", 4 botones rapidos (Exacto, +Bs. 50, +Bs. 100, +Bs. 200) y calculo en vivo de "Cambio a Devolver".');
  pdf.addBullet('Comprobante y Anulacion', 'Al pulsar PROCESAR VENTA genera venta V-000001, descuenta inventario y muestra ticket termico 80mm con opcion Imprimir y enviar por WhatsApp. Desde Historial se puede reimprimir o anular ventas (revirtiendo stock).');

  // 6.9 Reports
  pdf.addSubSection('6.9 ReportsView (Estadisticas y Reportes - Solo Admin)');
  pdf.addBullet('Filtro Temporal y Exportacion', 'Selector de rango (Hoy, 7 Dias, Este Mes, Todo) y boton "Exportar CSV" que genera reporte descargable con totales financieros, listado de ventas y listado de ordenes.');
  pdf.addBullet('4 Tarjetas KPI', '1) Ingresos Totales (Ventas + Pagos de Reparaciones); 2) Venta Repuestos (+ cantidad de transacciones); 3) Servicio Tecnico (+ ordenes activas); 4) Valor de Activos en Inventario (sum(purchasePrice * stock) + productos criticos).');
  pdf.addBullet('Visualizaciones', 'Grafico de barras comparativo (Ventas vs Reparaciones) con tooltip, barras horizontales de distribucion por los 6 estados de orden, ranking Top 5 productos mas vendidos y panel de Alertas de Stock Critico (stock <= minStock).');

  // 6.10 Settings
  pdf.addSubSection('6.10 SettingsView (Configuracion del Sistema - Solo Admin)');
  pdf.addBullet('Barra de Guardado', 'Detecta cambios sin guardar (hasUnsavedChanges), atajo Ctrl+S / Cmd+S, boton Descartar y boton Guardar Cambios que sincroniza toda la app en tiempo real.');
  pdf.addTable(
    ['Pestana', 'Parametros Configurables'],
    [
      ['GENERAL', 'Nombre taller, slogan, telefono, direccion, simbolo moneda, mensaje pie ticket, dias garantia, % impuestos, % comision por defecto, carga de Logo e Icono (zoom 40-100%) y Zoom Global de interfaz (70-150%).'],
      ['RECEPTION', 'Prefijo de orden (OT-), requerir tecnico asignado obligatorio, editor de lista de accesorios y editor de lista de estados fisicos/esteticos.'],
      ['INVENTORY', 'Stock minimo por defecto, permitir ventas con stock negativo (boolean), editor dinamico de categorias de repuestos.'],
      ['SALES', 'Permitir descuentos, porcentaje maximo de descuento, impresion automatica de ticket, metodos de pago habilitados.'],
      ['BRANDS', 'Gestor maestro de Marcas y Modelos dependientes (agregar y eliminar marcas o modelos).'],
      ['USERS', 'Alta de usuarios, edicion de rol (ADMIN/TECHNICIAN/RECEPTIONIST), activar/desactivar cuenta y eliminar (con proteccion para no borrarse a si mismo).'],
      ['BACKUP', 'Exportar copia de seguridad completa (.JSON), Restaurar desde JSON y boton rojo Restablecer datos de fabrica.']
    ],
    [28, 152]
  );

  // 6.11 Global Search
  pdf.addSubSection('6.11 GlobalSearchView (Buscador Global Spotlight)');
  pdf.addParagraph(
    'Modal de busqueda rapida accesible desde cualquier pantalla. Requiere al menos 2 caracteres y devuelve hasta 5 coincidencias por cada una de las 4 categorias: Ordenes de Trabajo (abre OrderDetailView), Productos (navega a Inventario), Ventas (abre modal de reimpresion de ticket) y Clientes. Antes de escribir muestra accesos directos rapidos.'
  );

  // =========================================================================
  // SECTION 7: REGLAS DE NEGOCIO Y FORMULAS
  // =========================================================================
  pdf.addSection('7', 'Reglas de Negocio Criticas, Calculos y Stock');
  pdf.addBullet('Numeracion Correlativa de OTs', 'Extrae el mayor numero entero al final de todos los otNumber existentes, suma 1 y formatea a 6 digitos con el prefijo configurado: ej. OT-000001.');
  pdf.addBullet('Numeracion Correlativa de Ventas', 'Extrae el mayor numero de saleNumber quitando "V-", suma 1 y formatea a 6 digitos: ej. V-000001.');
  pdf.addBullet('Costo Total de Reparacion', 'Si isLaborOnly === true, estimatedCost = laborCost. Si es false, estimatedCost = laborCost + sum(repuestos externos.cost) + sum(repuestos inventario.salePrice).');
  pdf.addBullet('Calculo de Saldo Pendiente', 'remainingBalance = Math.max(0, order.estimatedCost - order.advancePayment). Cada nuevo pago registrado recalcula order.advancePayment como la suma de todos los Payment asociados a esa orderId.');
  pdf.addBullet('Transferencia de Orden al POS', 'Al pulsar "Cobrar en Carrito POS" en OrderDetailView: amountToCharge = remaining > 0 ? remaining : order.estimatedCost. Crea un SaleItem tipo SERVICE con referenceId = order.id, orderOt, orderEquipment, orderIssue y orderTechnician, y preselecciona al cliente de la orden.');
  pdf.addBullet('Comision de Tecnicos', 'baseAmount = order.laborCost !== undefined ? order.laborCost : order.estimatedCost. appliedRate = order.commissionPercentage ?? tech.commissionPercentage ?? settings.defaultTechnicianCommissionPercentage ?? 40. comision = Math.round(baseAmount * (appliedRate / 100) * 100) / 100.');
  pdf.addBullet('Reglas de Movimiento de Stock', 'ENTRADA y DEVOLUCION suman (+qty) al stock. SALIDA_VENTA, SALIDA_REPARACION y PERDIDA restan (-qty) al stock (con piso en 0 si !allowNegativeStock). Anular una venta genera automaticamente movimientos DEVOLUCION para todos sus productos.');
  pdf.addBullet('Metricas del Dashboard', 'receivedToday = ordenes creadas desde las 00:00 de hoy. inRepair = ordenes en DIAGNOSTICO, ESPERANDO_REPUESTO o REPARANDO. dailyRevenue = suma de Payment.amount registrados desde las 00:00 de hoy.');

  // =========================================================================
  // SECTION 8: COMPROBANTES PDF Y CODIGO QR
  // =========================================================================
  pdf.addSection('8', 'Comprobantes, Recibos PDF (3 Formatos) y Codigo QR');
  pdf.addParagraph(
    'El archivo src/utils/receiptPdfGenerator.ts implementa la generacion de documentos en 3 formatos profesionales para ordenes y cobros. En la app movil deben generarse con expo-print / HTML-a-PDF o libreria nativa PDF y ofrecer botones de Compartir (WhatsApp/Sistema) e Impresion Bluetooth:'
  );
  pdf.addTable(
    ['Formato', 'Dimensiones', 'Contenido y Proposito'],
    [
      ['Ticket Celular (Pegatina)', '50mm x 70mm', 'Etiqueta adhesiva para la parte trasera del equipo: Titulo TICKET CELULAR, OT, Cliente, Marca/Modelo, Clave/Patron, Tecnico y Codigo QR apuntando a la orden.'],
      ['Recibo Termico', '80mm ancho (alto dinamico)', 'Diseno 100% negro puro de alto contraste para impresora termica: Encabezado del taller, recuadro de OT, fechas de recepcion y entrega, cliente, equipo, IMEI, seguridad, falla, recuadro de cobro, saldo pendiente, garantia y mensaje de pie.'],
      ['Hoja Carta (Oficial)', 'Letter (215.9 x 279.4mm)', 'Documento formal completo: Logo + datos taller, badge Comprobante/Recibo Oficial, banner verde si es cobro, 2 tarjetas (Cliente y Recepcion/Entrega), grilla tecnica 4 cols, falla y diagnostico, lista de repuestos, balance financiero, 3 clausulas de terminos y condiciones, y 2 lineas de firma.']
    ],
    [38, 34, 108]
  );

  // =========================================================================
  // SECTION 9: DATOS SEMILLA Y CATALOGOS INICIALES
  // =========================================================================
  pdf.addSection('9', 'Datos Semilla (Seed Data) y Catalogos Iniciales');
  pdf.addBullet('Configuracion Default', 'workshopName: "BOL.FIX", slogan: "By: Mauro Medina", phone: "777-12345 / 789-67890", address: "Av. Principal Nro 450, Galeria Central Local 12", currencySymbol: "Bs.", defaultWarrantyDays: 30, otPrefix: "OT-", defaultMinStock: 3, maxDiscountPercentage: 20, defaultTechnicianCommissionPercentage: 40.');
  pdf.addBullet('Metodos de Pago Default', 'Efectivo, Transferencia, QR, Tarjeta.');
  pdf.addBullet('Accesorios Default', 'SIM, Memoria SD, Cargador, Caja, Funda / Cover, S Pen / Stylus.');
  pdf.addBullet('Estados Fisicos Default', 'Pantalla rota, No enciende, Mojado, Golpes, Tapa rota, Telefono doblado, Rayones, Lente camara roto, Botones danados, Sin tornillos.');
  pdf.addBullet('Checklist de Recepcion', 'Encendido, Pantalla / Tactil, Camaras, Microfono / Auricular, Carga / Puerto USB, Wi-Fi / Bluetooth, Lector SIM / Senal, Botones Fisicos.');
  pdf.addBullet('Marcas y Modelos Semilla', '9 marcas pre-cargadas: Apple (iPhone 11 a 15 Pro Max, SE), Samsung (S23/S24, A14/A34/A54, Fold5/Flip5), Xiaomi (Redmi Note 12/13 Pro, 12C, 13T/14 Ultra, Poco F5/X6 Pro), Motorola (G54/G84, Edge 40, Razr 40, E13), Huawei, Oppo, Realme, ZTE e Infinix.');
  pdf.addBullet('Servicios Rapidos POS', 'Limpieza y Mantenimiento (Bs. 50), Software/Flash/Reset (Bs. 70), Vidrio Templado (Bs. 25), Diagnostico Avanzado (Bs. 40), Hidrogel Premium (Bs. 45), Cambio Pin de Carga (Bs. 120).');
  pdf.addBullet('Cliente Generico Obligatorio', 'id: "cli-public-general", name: "Publico General", phone: "S/N". Siempre disponible y preseleccionado por defecto en POS.');

  // =========================================================================
  // SECTION 10: GUIA DE COMPILACION APK E IPA PARA CLAUDE CODE
  // =========================================================================
  pdf.addSection('10', 'Guia de Implementacion Movil para Claude Code (APK & IPA)');
  pdf.addParagraph(
    'Para transformar esta especificacion en una aplicacion movil lista para instalar en Android (.apk) e iOS (.ipa) con maxima fidelidad visual y funcional, se recomienda la siguiente arquitectura:'
  );

  pdf.addSubSection('10.1 Stack Movil Recomendado (React Native + Expo SDK)');
  pdf.addBullet('Framework', 'Expo (Managed Workflow, TypeScript) + Expo Router (file-based navigation con Tabs inferiores + Stack para OrderDetail y Reception).');
  pdf.addBullet('Estilos', 'NativeWind v4 (Tailwind CSS para React Native) reutilizando exactamente la paleta (#111111, #FACC15, #00FF40, #F9F9F9) y radios de borde.');
  pdf.addBullet('Base de Datos Local Offline-First', 'expo-sqlite (con Drizzle ORM o capa de repositorio equivalente a mockDb.ts) + Zustand o React Context para estado reactivo instantaneo. Opcionalmente sincronizable con backend PostgreSQL/Prisma o Supabase/Firebase.');
  pdf.addBullet('Componentes Nativos Clave', 'react-native-svg (para BolFixLogo y PatternLockDrawer con PanResponder/GestureHandler), lucide-react-native (mismos iconos), react-native-qrcode-svg (QR de ordenes), expo-image-picker & expo-camera (4 fotos en recepcion y escaner real de codigo de barras/IMEI).');
  pdf.addBullet('Generacion de PDF e Impresion', 'expo-print + expo-sharing para generar los 3 formatos PDF (50x70mm, 80mm, Carta) y compartir por WhatsApp. Opcional: react-native-thermal-receipt-printer para impresoras termicas Bluetooth.');
  pdf.addBullet('Modales Moviles Fijos', 'Usar <Modal visible={...} transparent animationType="fade"> envuelto en <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}> y ScrollView interno para garantizar que los modales (Concepto Libre, Nuevo Cliente, Catalogo de Inventario) permanezcan siempre fijos y centrados al abrir el teclado o hacer scroll.');

  pdf.addSubSection('10.2 Estructura de Proyecto Sugerida (Expo Router)');
  pdf.addCodeBlock(`bolfix-mobile/
|-- app.json                      # Bundle ID (com.bolfix.app), icono, splash, permisos camara
|-- eas.json                      # Perfiles build: preview (APK) y production (AAB / IPA)
|-- app/
|   |-- _layout.tsx               # AuthProvider, SafeAreaProvider, Theme
|   |-- login.tsx                 # LoginView + accesos demo
|   |-- (tabs)/
|   |   |-- _layout.tsx           # Bottom Tabs segun rol (Inicio, Tecnico, Lista, Stock, POS, Ajustes)
|   |   |-- index.tsx             # DashboardView
|   |   |-- tecnico.tsx           # TechnicianPanelView (Asignadas, Comisiones, Historial)
|   |   |-- reparaciones.tsx      # OrderListView
|   |   |-- inventario.tsx        # InventoryView (Stock + Kardex)
|   |   |-- pos.tsx               # SalesView (Solo Carrito POS centrado + modales)
|   |   +-- ajustes.tsx           # SettingsView (7 pestanas + Backup JSON)
|   |-- recepcion.tsx             # ReceptionView (Stack modal/screen)
|   +-- orden/[id].tsx            # OrderDetailView (Estados, Edicion, Cobrar en POS, PDF/QR)
+-- src/
    |-- types/index.ts            # Todas las interfaces de la Seccion 5
    |-- db/
    |   |-- sqlite.ts             # Inicializacion de tablas y seed data
    |   +-- repository.ts         # Todos los metodos CRUD, stock, comisiones y backup JSON
    |-- components/
    |   |-- BolFixLogo.tsx        # Logo oficial SVG + soporte logo custom
    |   |-- PatternLockDrawer.tsx # Tablero tactil 3x3 con GestureHandler + SVG
    |   |-- GlobalSearchModal.tsx # Buscador Spotlight
    |   +-- SparePartsModal.tsx   # Selector de repuestos Mosaico/Lista
    +-- utils/
        |-- receiptPdf.ts         # Plantillas HTML -> PDF (50x70mm, 80mm, Carta)
        +-- csvExport.ts          # Exportacion CSV de reportes con expo-file-system + sharing`);

  pdf.addSubSection('10.3 Comandos para Compilar APK (Android) e IPA (iOS)');
  pdf.addCodeBlock(`# 1. Instalar dependencias y configurar EAS CLI
npm install -g eas-cli
eas login
eas build:configure

# 2. Configurar perfil "preview" en eas.json para generar archivo .APK instalable directo:
#    "preview": { "android": { "buildType": "apk" }, "ios": { "simulator": false } }

# 3. Compilar APK para Android (instalacion directa sin Play Store)
eas build -p android --profile preview

# 4. Compilar IPA para iOS (requiere cuenta Apple Developer)
eas build -p ios --profile production

# Alternativa local sin nube (requiere Android Studio / Xcode instalados):
npx expo prebuild
cd android && ./gradlew assembleRelease   # Genera app-release.apk`);

  pdf.addSubSection('10.4 Instrucciones Directas para Claude Code');
  pdf.addParagraph(
    'Al leer este PDF, Claude Code debe: (1) inicializar el proyecto Expo TypeScript con las dependencias anteriores; (2) crear primero el esquema de datos exacto y el repositorio offline con los datos semilla de la Seccion 9; (3) implementar la autenticacion y navegacion RBAC de las Secciones 3 y 4; (4) construir las 11 pantallas respetando la paleta de colores (#111111, #FACC15, #00FF40, #F9F9F9), el diseno exclusivo de Carrito POS sin catalogo lateral permanente, el boton unico "Cobrar en Carrito POS" en OrderDetailView y los modales centrados fijos; (5) implementar la generacion de PDFs en los 3 formatos y la exportacion CSV/JSON; y (6) dejar configurado eas.json listo para generar APK e IPA.'
  );

  pdf.save(OUTPUT_PATH);
  console.log(`PDF generado correctamente en: ${OUTPUT_PATH}`);
  console.log(`Total de paginas: ${pdf.doc.getNumberOfPages()}`);
  console.log(`Tamano del archivo: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(1)} KB`);
}

generateFullSpecPdf();
