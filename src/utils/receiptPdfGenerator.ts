/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Order, Payment, WorkshopSettings, User as SystemUser } from '../types';

interface GenerateReceiptPdfParams {
  order: Order;
  activePayment?: Payment | null;
  printFormat: 'letter' | 'thermal' | 'ticket';
  workshopSettings: WorkshopSettings;
  currentUser: SystemUser;
}

const formatDateTime = (dateStr?: string | Date | null): string => {
  if (!dateStr) return 'No registrada';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return 'No registrada';
  const dateFormatted = d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timeFormatted = d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return `${dateFormatted} - ${timeFormatted} hrs`;
};

export async function generateReceiptPdf({
  order,
  activePayment,
  printFormat,
  workshopSettings,
  currentUser
}: GenerateReceiptPdfParams): Promise<void> {
  const isPaymentReceipt = Boolean(activePayment);
  const remainingBalance = Math.max(0, order.estimatedCost - order.advancePayment);
  const shopName = workshopSettings.workshopName || 'BOL.FIX';
  const slogan = workshopSettings.workshopSlogan || 'Servicio Técnico Especializado & Soluciones Móviles';
  const address = workshopSettings.address || 'Av. Principal de Reparaciones #123';
  const phone = workshopSettings.phone || 'Tel: 555-9000';
  const warrantyDays = workshopSettings.defaultWarrantyDays || 30;
  const footerMsg = workshopSettings.ticketFooterMessage || '¡Gracias por su preferencia y confianza!';

  const receptionDateTime = formatDateTime(order.createdAt);
  const paymentDeliveryDateTime = formatDateTime(activePayment?.date || activePayment?.createdAt || new Date());

  if (printFormat === 'ticket') {
    // ========================================================
    // FORMATO TICKET CELULAR (PEGATINA TRASERA)
    // ========================================================
    const pdfWidth = 50;
    const pdfHeight = 70;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight]
    });

    const margin = 3;
    let y = 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TICKET CELULAR', pdfWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(8);
    doc.text(`OT: ${order.otNumber}`, margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${order.clientName}`, margin, y, { maxWidth: pdfWidth - margin * 2 });
    y += 5;
    
    doc.text(`Equipo: ${order.brand} ${order.model}`, margin, y, { maxWidth: pdfWidth - margin * 2 });
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text(`Clave: ${order.lockValue || 'N/A'}`, margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.text(`Técnico: ${order.assignedTechnicianName || 'Pendiente'}`, margin, y);
    y += 6;

    // QR Code
    try {
      const orderUrl = `${window.location.origin}/order/${order.id}`;
      const qrDataUrl = await QRCode.toDataURL(orderUrl, { margin: 1, scale: 4 });
      doc.addImage(qrDataUrl, 'PNG', (pdfWidth - 25) / 2, y, 25, 25);
    } catch (err) {
      console.error('Error generating QR for PDF:', err);
    }
    
    y += 28;

    doc.setFontSize(6);
    doc.text('Escanea para detalle completo', pdfWidth / 2, y, { align: 'center' });

    doc.save(`Ticket_Celular_${order.otNumber}.pdf`);
  } else if (printFormat === 'thermal') {
    // ========================================================
    // FORMATO TÉRMICO (80mm) - 100% NEGRO PURO (ALTA LEGIBILIDAD)
    // ========================================================
    const pdfWidth = 80;
    // Calculate dynamic height based on sections
    let estimatedHeight = 185;
    if (isPaymentReceipt) estimatedHeight += 25;
    if (order.spareParts && order.spareParts.length > 0 && !order.isLaborOnly) {
      estimatedHeight += order.spareParts.length * 5;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth, estimatedHeight]
    });

    const margin = 5;
    const contentWidth = pdfWidth - margin * 2;
    let y = 8;

    const drawDashedLine = (currY: number) => {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.setLineDashPattern([1.5, 1], 0);
      doc.line(margin, currY, pdfWidth - margin, currY);
      doc.setLineDashPattern([], 0);
    };

    // Header (100% Black)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(0, 0, 0);
    doc.text(shopName.toUpperCase(), pdfWidth / 2, y, { align: 'center', maxWidth: contentWidth });
    y += 5.2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text(slogan, pdfWidth / 2, y, { align: 'center', maxWidth: contentWidth });
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(0, 0, 0);
    doc.text(`${address} | ${phone}`, pdfWidth / 2, y, { align: 'center', maxWidth: contentWidth });
    y += 4.5;

    drawDashedLine(y);
    y += 4;

    // Document Badge (Black border, pure black text)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin + 5, y - 3, contentWidth - 10, 11, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(isPaymentReceipt ? 'RECIBO DE COBRO' : 'COMPROBANTE DE ORDEN', pdfWidth / 2, y + 1.5, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(order.otNumber, pdfWidth / 2, y + 6, { align: 'center' });
    y += 11;

    drawDashedLine(y);
    y += 4.5;

    // Meta details (100% Black)
    doc.setFontSize(7.5);
    const renderRow = (label: string, val: string, isBoldVal = false) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(label, margin, y);

      doc.setFont('helvetica', isBoldVal ? 'bold' : 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(val, pdfWidth - margin, y, { align: 'right' });
      y += 4;
    };

    renderRow('Fecha de Recepción:', receptionDateTime);
    renderRow('Fecha de Entrega:', paymentDeliveryDateTime, true);
    renderRow('Cliente:', order.clientName.length > 22 ? order.clientName.slice(0, 22) + '...' : order.clientName, true);
    renderRow('Teléfono:', order.clientPhone);
    renderRow('Atendido por:', currentUser.name.length > 20 ? currentUser.name.slice(0, 20) + '...' : currentUser.name);

    y += 1;
    drawDashedLine(y);
    y += 4.5;

    // Device Details (100% Black)
    renderRow('Equipo:', `${order.brand} ${order.model}`, true);
    renderRow('Color:', order.color);
    if (order.imei) renderRow('IMEI:', order.imei);
    renderRow('Seguridad:', order.lockType || 'Sin bloqueo');

    // Falla
    y += 1;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text('FALLA REPORTADA:', margin, y);
    y += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    const problemLines = doc.splitTextToSize(order.problem, contentWidth);
    doc.text(problemLines, margin, y);
    y += problemLines.length * 3.5 + 2;

    // Highlighted Payment Box if payment receipt (Pure Black)
    if (isPaymentReceipt && activePayment) {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text('MONTO COBRADO:', margin + 3, y + 5.2);

      doc.setFontSize(10.5);
      doc.setTextColor(0, 0, 0);
      doc.text(`Bs. ${activePayment.amount.toLocaleString('es-ES')}`, pdfWidth - margin - 3, y + 5.2, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(0, 0, 0);
      doc.text(`Método: ${activePayment.method}`, margin + 3, y + 10);
      doc.text(paymentDeliveryDateTime, pdfWidth - margin - 3, y + 10, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.text(`Fecha de Entrega Registrada`, margin + 3, y + 14.5);

      if (activePayment.notes) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(0, 0, 0);
        doc.text(`Ref: ${activePayment.notes}`, margin + 3, y + 18.5);
      }

      y += 25;
    }

    drawDashedLine(y);
    y += 4.5;

    // Financial balance (100% Black)
    renderRow('Costo Mano de Obra / Total:', `Bs. ${order.estimatedCost.toLocaleString('es-ES')}`);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Total Abonado:', margin, y);
    doc.text(`-Bs. ${order.advancePayment.toLocaleString('es-ES')}`, pdfWidth - margin, y, { align: 'right' });
    y += 4.5;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(margin, y - 0.5, pdfWidth - margin, y - 0.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text('SALDO PENDIENTE:', margin, y + 3.5);
    doc.setFontSize(10);
    doc.text(`Bs. ${remainingBalance.toLocaleString('es-ES')}`, pdfWidth - margin, y + 3.5, { align: 'right' });
    y += 8.5;

    drawDashedLine(y);
    y += 4.5;

    // Footer (100% Black)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(0, 0, 0);
    doc.text(footerMsg, pdfWidth / 2, y, { align: 'center', maxWidth: contentWidth });
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text(`Garantía de ${warrantyDays} días en mano de obra.`, pdfWidth / 2, y, { align: 'center' });
    y += 3.5;
    doc.text('Conserve este ticket para retirar su equipo.', pdfWidth / 2, y, { align: 'center' });

    doc.save(`Recibo_Termico_${order.otNumber}_${isPaymentReceipt ? 'Cobro' : 'Orden'}.pdf`);
  } else {
    // ========================================================
    // FORMATO TAMAÑO CARTA (LETTER / FULL SHEET)
    // ========================================================
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // ~215.9mm
    const margin = 14;
    const contentWidth = pageWidth - margin * 2; // ~187.9mm
    let y = 16;

    // Top Header Banner
    doc.setFillColor(17, 24, 39);
    doc.roundedRect(margin, y, 10, 10, 2.5, 2.5, 'F');
    doc.setTextColor(250, 204, 21);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('W', margin + 3.2, y + 6.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(17, 24, 39);
    doc.text(shopName.toUpperCase(), margin + 13, y + 6);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(slogan, margin + 13, y + 10.5);

    // Right Header: OT and Badge
    const rightX = pageWidth - margin;
    if (isPaymentReceipt) {
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(rightX - 58, y - 2, 58, 8, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(6, 95, 70);
      doc.text('RECIBO OFICIAL DE COBRO', rightX - 29, y + 3.2, { align: 'center' });
    } else {
      doc.setFillColor(17, 24, 39);
      doc.roundedRect(rightX - 58, y - 2, 58, 8, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(250, 204, 21);
      doc.text('COMPROBANTE DE ORDEN', rightX - 29, y + 3.2, { align: 'center' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text(order.otNumber, rightX, y + 12, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(`Fecha de Entrega: ${paymentDeliveryDateTime}`, rightX, y + 16.5, { align: 'right' });

    y += 18;

    // Contact info subtitle
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`${address}  •  ${phone}`, margin, y);
    y += 5;

    // Divider
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, y, rightX, y);
    y += 6;

    // Highlighted payment banner if receipt
    if (isPaymentReceipt && activePayment) {
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(margin, y, contentWidth, 21, 3, 3, 'FD');

      doc.setFillColor(16, 149, 90);
      doc.roundedRect(margin + 4, y + 4.5, 10, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('✓', margin + 7.5, y + 11.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(6, 95, 70);
      doc.text('COBRO CONFIRMADO & REGISTRADO', margin + 17, y + 7.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(4, 120, 87);
      const noteText = activePayment.notes ? ` • Ref: ${activePayment.notes}` : '';
      doc.text(`Forma de Pago: ${activePayment.method}${noteText}`, margin + 17, y + 12);
      doc.text(`Fecha de Entrega: ${paymentDeliveryDateTime}`, margin + 17, y + 16.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(6, 95, 70);
      doc.text('MONTO COBRADO', rightX - 6, y + 7.5, { align: 'right' });

      doc.setFontSize(14);
      doc.setTextColor(6, 95, 70);
      doc.text(`Bs. ${activePayment.amount.toLocaleString('es-ES')}`, rightX - 6, y + 14, { align: 'right' });

      y += 27;
    }

    // Two side-by-side cards: Cliente and Recepción
    const cardWidth = (contentWidth - 6) / 2;
    const cardHeight = 32;

    // Card 1: Cliente
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(margin, y, cardWidth, cardHeight, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99);
    doc.text('DATOS DEL CLIENTE', margin + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('Nombre:', margin + 4, y + 12);
    doc.text('Teléfono:', margin + 4, y + 18);
    if (order.referencePhone) {
      doc.text('Contacto Ref.:', margin + 4, y + 24);
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(order.clientName, margin + 24, y + 12);
    doc.text(order.clientPhone, margin + 24, y + 18);
    if (order.referencePhone) {
      const refDetail = order.referenceRelationship ? ` (${order.referenceRelationship})` : '';
      doc.text(`${order.referencePhone}${refDetail}`, margin + 26, y + 24);
    }

    // Card 2: Recepción y Entrega
    const card2X = margin + cardWidth + 6;
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(card2X, y, cardWidth, cardHeight, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99);
    doc.text('RECEPCIÓN Y ENTREGA', card2X + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(107, 114, 128);
    doc.text('Fecha de Recepción:', card2X + 4, y + 11.5);
    doc.text('Fecha de Entrega:', card2X + 4, y + 17);
    doc.text('Estado Actual:', card2X + 4, y + 22.5);
    doc.text('Atendido por:', card2X + 4, y + 28);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(receptionDateTime, card2X + 33, y + 11.5);
    doc.text(paymentDeliveryDateTime, card2X + 33, y + 17);
    doc.text(order.status.toUpperCase(), card2X + 33, y + 22.5);
    doc.text(currentUser.name, card2X + 33, y + 28);

    y += cardHeight + 6;

    // Technical Specs Grid
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(margin, y, contentWidth, 18, 3, 3, 'FD');

    const colW = contentWidth / 4;
    const renderSpecCol = (colIdx: number, label: string, val: string) => {
      const colX = margin + colIdx * colW + 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text(label.toUpperCase(), colX, y + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(17, 24, 39);
      doc.text(val, colX, y + 12.5, { maxWidth: colW - 6 });
    };

    renderSpecCol(0, 'Dispositivo', `${order.brand} ${order.model}`);
    renderSpecCol(1, 'Color', order.color || 'No especificado');
    renderSpecCol(2, 'IMEI', order.imei || 'No registrado');
    renderSpecCol(3, 'Seguridad', order.lockType || 'Sin bloqueo');

    y += 24;

    // Falla and Diagnóstico
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text('FALLA REPORTADA', margin, y);
    doc.text('DIAGNÓSTICO TÉCNICO / MODALIDAD', card2X, y);
    y += 2.5;

    // Problem box
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(margin, y, cardWidth, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(31, 41, 55);
    const probLines = doc.splitTextToSize(order.problem, cardWidth - 8);
    doc.text(probLines, margin + 4, y + 5.5);

    // Diagnosis box
    doc.roundedRect(card2X, y, cardWidth, 16, 2, 2, 'FD');
    const diagText = order.quickDiagnosis 
      ? order.quickDiagnosis 
      : (order.isLaborOnly ? 'Servicio de Mano de Obra Sin Repuestos' : 'Servicio Técnico Integral');
    const diagLines = doc.splitTextToSize(diagText, cardWidth - 8);
    doc.text(diagLines, card2X + 4, y + 5.5);

    y += 22;

    // Repuestos si aplica
    if (!order.isLaborOnly && order.spareParts && order.spareParts.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(75, 85, 99);
      doc.text('REPUESTOS Y COMPONENTES ASOCIADOS', margin, y);
      y += 2.5;

      const partHeight = Math.max(12, order.spareParts.length * 5 + 4);
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(margin, y, contentWidth, partHeight, 2, 2, 'FD');

      let partY = y + 5;
      order.spareParts.forEach(part => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(31, 41, 55);
        doc.text(`• ${part.name}`, margin + 4, partY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text(part.type === 'INVENTORY' ? 'De Inventario' : `Externo (Bs. ${part.cost})`, rightX - 6, partY, { align: 'right' });
        partY += 4.5;
      });

      y += partHeight + 6;
    }

    // Balance Financiero
    doc.setDrawColor(209, 213, 219);
    doc.setLineDashPattern([2, 1], 0);
    doc.line(margin, y, rightX, y);
    doc.setLineDashPattern([], 0);
    y += 6;

    const renderFinanceRow = (label: string, val: string, isGreen = false, isBold = false) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(isBold ? 9.5 : 8.5);
      doc.setTextColor(isGreen ? 16 : (isBold ? 17 : 75), isGreen ? 149 : (isBold ? 24 : 85), isGreen ? 90 : (isBold ? 39 : 99));
      doc.text(label, margin, y);
      doc.text(val, rightX, y, { align: 'right' });
      y += 5.5;
    };

    renderFinanceRow('Costo Mano de Obra:', `Bs. ${(order.laborCost || 0).toLocaleString('es-ES')}`);
    renderFinanceRow('Costo Total (Mano de Obra + Repuestos):', `Bs. ${order.estimatedCost.toLocaleString('es-ES')}`);
    renderFinanceRow('Total Cobrado / Abonado a la Fecha:', `-Bs. ${order.advancePayment.toLocaleString('es-ES')}`, true, true);

    doc.setDrawColor(17, 24, 39);
    doc.setLineWidth(0.8);
    doc.line(margin, y, rightX, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text('SALDO RESTANTE A LIQUIDAR:', margin, y);

    doc.setFontSize(13);
    doc.text(`Bs. ${remainingBalance.toLocaleString('es-ES')}`, rightX, y, { align: 'right' });
    y += 10;

    // Términos del servicio
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.4);
    doc.line(margin, y, rightX, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text('TÉRMINOS Y CONDICIONES DE SERVICIO:', margin, y);
    y += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(156, 163, 175);
    doc.text(`1. Equipos no retirados tras 30 días causarán gastos diarios de almacenamiento y custodia.`, margin, y);
    y += 3;
    doc.text(`2. Garantía de ${warrantyDays} días en mano de obra. No cubre golpes, caídas o exposición a humedad posterior.`, margin, y);
    y += 3;
    doc.text(`3. La empresa no se responsabiliza por pérdida de información digital previa a la recepción.`, margin, y);
    y += 12;

    // Firmas
    const sigLineW = 55;
    doc.setDrawColor(156, 163, 175);
    doc.setLineWidth(0.5);

    // Cliente signature
    doc.line(margin + 15, y, margin + 15 + sigLineW, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    doc.text('Firma del Cliente', margin + 15 + sigLineW / 2, y + 4.5, { align: 'center' });

    // Workshop signature
    const sig2X = rightX - 15 - sigLineW;
    doc.line(sig2X, y, sig2X + sigLineW, y);
    doc.text('Taller Autorizado / Recepción', sig2X + sigLineW / 2, y + 4.5, { align: 'center' });

    doc.save(`Recibo_Carta_${order.otNumber}_${isPaymentReceipt ? 'Cobro' : 'Orden'}.pdf`);
  }
}
