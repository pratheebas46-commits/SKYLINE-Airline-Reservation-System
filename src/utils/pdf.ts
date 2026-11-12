import { jsPDF } from 'jspdf';
import { Booking, Flight } from '../types';
import { db } from '../services/db';
import { generateTicketQRCode } from './qr';

export async function downloadTicketPDF(booking: Booking, flight: Flight, existingQrUrl?: string): Promise<void> {
  const originAirport = db.getAirportByCode(flight.originCode);
  const destAirport = db.getAirportByCode(flight.destinationCode);

  // Ensure we have the QR code data URL
  let qrUrl = existingQrUrl;
  if (!qrUrl) {
    try {
      qrUrl = await generateTicketQRCode({
        pnr: booking.pnr,
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        passengerName: booking.passenger.fullName,
        seat: booking.seatNumber,
        travelDate: booking.travelDate,
        origin: flight.originCode,
        destination: flight.destinationCode,
        cabinClass: booking.cabinClass,
      });
    } catch {
      qrUrl = undefined;
    }
  }

  // Create A4 PDF (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210

  // 1. Top Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Airline Name & Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(flight.airline.toUpperCase(), 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('ELECTRONIC PASSENGER TICKET & BOARDING PASS DOCUMENT', 14, 23);
  doc.text(`ISSUED: ${new Date(booking.createdAt).toLocaleDateString()} | TICKET NO: 098-${booking.pnr}`, 14, 29);

  // PNR Badge in Header
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(pageWidth - 65, 8, 51, 20, 3, 3, 'F');
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('BOOKING REF (PNR)', pageWidth - 39.5, 14, { align: 'center' });
  doc.setTextColor(96, 165, 250); // blue-400
  doc.setFontSize(14);
  doc.text(booking.pnr.toUpperCase(), pageWidth - 39.5, 23, { align: 'center' });

  // 2. Booking Status Bar
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(0, 36, pageWidth, 11, 'F');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(`STATUS: ${booking.bookingStatus || 'CONFIRMED'}`, 14, 43);
  doc.setTextColor(2, 132, 199);
  doc.text(`CLASS: ${booking.cabinClass.toUpperCase()}`, 70, 43);
  doc.setTextColor(71, 85, 105);
  doc.text(`MEAL: ${booking.mealPreference || 'Standard In-flight'}`, 120, 43);

  // 3. Flight Journey Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 52, pageWidth - 28, 48, 4, 4, 'FD');

  // Origin Airport
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DEPARTURE', 20, 60);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(22);
  doc.text(flight.originCode, 20, 71);
  doc.setFontSize(10);
  doc.text(originAirport?.city || flight.originCode, 20, 77);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Terminal: T${flight.terminal || '1'} | ${flight.departureTime} hrs`, 20, 83);
  doc.text(`Date: ${booking.travelDate}`, 20, 88);

  const aircraft = db.getAircraftById(flight.aircraftId);
  const payment = db.getPaymentByPnr(booking.pnr);

  // Middle Flight info
  doc.setFontSize(10);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.setFont('helvetica', 'bold');
  doc.text(flight.flightNumber, pageWidth / 2, 65, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Duration: ${flight.duration} (Non-stop)`, pageWidth / 2, 71, { align: 'center' });
  doc.text(`Aircraft: ${aircraft?.model || 'Commercial Jet'}`, pageWidth / 2, 77, { align: 'center' });
  doc.setDrawColor(203, 213, 225);
  doc.line((pageWidth / 2) - 20, 81, (pageWidth / 2) + 20, 81);
  doc.setFontSize(7);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text('● CONFIRMED FLIGHT', pageWidth / 2, 86, { align: 'center' });

  // Destination Airport
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('ARRIVAL', pageWidth - 20, 60, { align: 'right' });
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(22);
  doc.text(flight.destinationCode, pageWidth - 20, 71, { align: 'right' });
  doc.setFontSize(10);
  doc.text(destAirport?.city || flight.destinationCode, pageWidth - 20, 77, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gate: ${flight.gate || '12A'} | ${flight.arrivalTime} hrs`, pageWidth - 20, 83, { align: 'right' });
  doc.text(`Date: ${booking.travelDate}`, pageWidth - 20, 88, { align: 'right' });

  // 4. Passenger Details & QR Code Section
  // Left Column: Passenger Details
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 105, 118, 76, 4, 4, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PASSENGER DETAILS & BOARDING INFORMATION', 20, 114);

  const pData: [string, string][] = [
    ['Passenger Name:', booking.passenger.fullName],
    ['Age & Gender:', `${booking.passenger.age} Years / ${booking.passenger.gender}`],
    ['Contact Phone:', booking.passenger.phone],
    ['Contact Email:', booking.passenger.email],
    ['Assigned Seat:', booking.seatNumber],
    ['Cabin Class:', `${booking.cabinClass} Class`],
  ];

  if (booking.concessionType && booking.concessionType !== 'REGULAR') {
    pData.push(['Concession Category:', `${booking.concessionType.replace(/_/g, ' ')}`]);
  }

  if (booking.passenger.passportNumber) {
    pData.push(['Passport Number:', booking.passenger.passportNumber]);
  }

  pData.push(['Total Fare Paid:', `INR ${booking.totalAmount.toLocaleString()} (${payment?.paymentMethod || 'Online Paid'})`]);

  let currentY = 122;
  const lineSpacing = pData.length > 7 ? 6.2 : 7;
  pData.forEach(([label, value]) => {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(label, 20, currentY);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(value, 60, currentY);
    currentY += lineSpacing;
  });

  // Right Column: QR Code Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(138, 105, pageWidth - 138 - 14, 76, 4, 4, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('BOARDING QR CODE', 167, 114, { align: 'center' });

  if (qrUrl) {
    try {
      doc.addImage(qrUrl, 'PNG', 147, 118, 40, 40);
    } catch (err) {
      console.warn('Could not render QR code inside PDF:', err);
    }
  }

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text(`PNR: ${booking.pnr.toUpperCase()}`, 167, 163, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Scan with QR scanner to view ticket details', 167, 168, { align: 'center' });
  doc.text('Verified E-Ticket Document', 167, 172, { align: 'center' });

  // 5. Baggage & Travel Advisory Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 187, pageWidth - 28, 48, 4, 4, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('IMPORTANT TRAVEL ADVISORY & CHECK-IN REGULATIONS', 20, 195);

  const notes = [
    '• Airport Reporting: Report at least 2 hours prior to scheduled domestic departure.',
    '• Boarding Gates: Gates close strictly 20 minutes before departure time.',
    '• Hand Baggage: 1 standard piece up to 7 kg (dimensions 55cm x 35cm x 25cm).',
    '• Checked Baggage: 15 kg for Economy Class passengers, 25 kg for Business Class.',
    '• Mandatory ID: Carry government-issued photo ID (Aadhaar, Passport, Voter ID, Driving License).',
    '• QR Ticket: If you do not have a printout, show this QR code or use the QR scanner at the terminal.',
  ];

  let noteY = 202;
  notes.forEach(note => {
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(note, 20, noteY);
    noteY += 5.5;
  });

  // 6. Security Barcode Graphic Simulation at Bottom
  doc.setDrawColor(15, 23, 42);
  doc.setFillColor(15, 23, 42);
  
  // Draw simulated barcode lines
  const barcodeY = 244;
  const barcodeStart = 30;
  const barcodeWidth = pageWidth - 60;
  let bx = barcodeStart;
  while (bx < barcodeStart + barcodeWidth) {
    const w = ((bx * 7) % 3) + 0.6;
    doc.rect(bx, barcodeY, w, 12, 'F');
    bx += w + ((bx * 13) % 2.5) + 1;
  }

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('courier', 'bold');
  doc.text(`*ETKT-${booking.pnr}-${flight.flightNumber}-${booking.travelDate.replace(/-/g, '')}*`, pageWidth / 2, 261, { align: 'center' });

  // 7. Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('SKYLINE RESERVATION BOOKING SYSTEM - OFFICIAL ELECTRONIC TICKET DOCUMENT', pageWidth / 2, 275, { align: 'center' });
  doc.text('For rescheduling, cancellations, or support, visit the portal or scan this ticket QR code.', pageWidth / 2, 280, { align: 'center' });

  // Save the PDF
  doc.save(`Ticket_${booking.pnr}_${flight.flightNumber}.pdf`);
}
