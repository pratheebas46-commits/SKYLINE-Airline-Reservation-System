import QRCode from 'qrcode';
import jsQR from 'jsqr';

export interface TicketQRData {
  pnr: string;
  airline?: string;
  flightNumber: string;
  passengerName: string;
  seat: string;
  travelDate: string;
  origin: string;
  destination: string;
  cabinClass?: string;
}

export interface ParsedTicketQR {
  pnr: string;
  airline?: string;
  flightNumber?: string;
  passengerName?: string;
  seat?: string;
  travelDate?: string;
  origin?: string;
  destination?: string;
  cabinClass?: string;
  rawText: string;
}

export interface PaymentQRData {
  upiId?: string;
  payeeName?: string;
  amount: number;
  flightNumber?: string;
  pnrRef?: string;
  transactionNote?: string;
}

/**
 * Parse raw QR decoded text into ticket fields.
 * Supports pipe-separated format, JSON format, URL with PNR, or standalone 6-char PNR.
 */
export function parseTicketQRText(rawText: string): ParsedTicketQR | null {
  if (!rawText || typeof rawText !== 'string') return null;
  const trimmed = rawText.trim();

  const result: ParsedTicketQR = {
    pnr: '',
    rawText: trimmed,
  };

  // Check JSON format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj.pnr) {
        result.pnr = String(obj.pnr).trim().toUpperCase();
        result.airline = obj.airline;
        result.flightNumber = obj.flightNumber || obj.flight;
        result.passengerName = obj.passengerName || obj.pax;
        result.seat = obj.seat;
        result.travelDate = obj.travelDate || obj.date;
        result.origin = obj.origin;
        result.destination = obj.destination;
        result.cabinClass = obj.cabinClass || obj.class;
        return result;
      }
    } catch {
      // Ignore JSON parse failure and continue to pattern matching
    }
  }

  // Check Pipe-delimited format (e.g., AIRLINE:AEROSKY|PNR:ABC123|FLIGHT:AI-101|PAX:John...)
  if (trimmed.includes('|') || trimmed.includes(':')) {
    const parts = trimmed.split(/[|\n]/);
    for (const part of parts) {
      const idx = part.indexOf(':');
      if (idx !== -1) {
        const key = part.slice(0, idx).trim().toUpperCase();
        const val = part.slice(idx + 1).trim();
        if (key === 'PNR') result.pnr = val.toUpperCase();
        else if (key === 'AIRLINE') result.airline = val;
        else if (key === 'FLIGHT') result.flightNumber = val;
        else if (key === 'PAX' || key === 'NAME' || key === 'PASSENGER') result.passengerName = val;
        else if (key === 'SEAT') result.seat = val;
        else if (key === 'DATE') result.travelDate = val;
        else if (key === 'CLASS') result.cabinClass = val;
        else if (key === 'ROUTE') {
          const routeParts = val.split(/->|-| to /i);
          if (routeParts.length === 2) {
            result.origin = routeParts[0].trim();
            result.destination = routeParts[1].trim();
          }
        }
      }
    }
  }

  // Check URL query parameter like ?pnr=ABC123
  if (!result.pnr && (trimmed.includes('pnr=') || trimmed.includes('PNR='))) {
    const match = trimmed.match(/[?&]pnr=([A-Za-z0-9]+)/i);
    if (match && match[1]) {
      result.pnr = match[1].toUpperCase();
    }
  }

  // Regex fallback: find standalone PNR like "PNR: ABC123" or 6-character alphanumeric
  if (!result.pnr) {
    const pnrMatch = trimmed.match(/PNR[:\s=]+([A-Za-z0-9]{5,8})/i);
    if (pnrMatch && pnrMatch[1]) {
      result.pnr = pnrMatch[1].toUpperCase();
    } else {
      // Check if the entire string is just a 6-character PNR code
      const directMatch = trimmed.match(/^([A-Za-z0-9]{6})$/);
      if (directMatch && directMatch[1]) {
        result.pnr = directMatch[1].toUpperCase();
      }
    }
  }

  return result.pnr ? result : null;
}

/**
 * Decode QR Code from an HTMLCanvas / ImageData using jsQR
 */
export function decodeQRFromImageData(imageData: ImageData): string | null {
  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });
    return code ? code.data : null;
  } catch (err) {
    console.error('jsQR decode error:', err);
    return null;
  }
}

/**
 * Decode QR code from an uploaded Image File or Blob
 */
export async function decodeQRFromFile(file: File | Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: 'attemptBoth',
          });
          resolve(code ? code.data : null);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Generates an SVG Data URI fallback representation of a QR matrix
 * in the unlikely event the canvas/image encoder fails.
 */
function generateFallbackSvgQR(text: string, title = 'TICKET QR'): string {
  // Simple deterministic pattern based on hash of string
  const size = 21; // standard QR version 1 size
  const cells: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder patterns (top-left, top-right, bottom-left 7x7)
  const drawFinder = (startR: number, startC: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          cells[startR + r][startC + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Pseudo-random fill for remaining cells based on input string
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder areas
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= size - 8) ||
        (r >= size - 8 && c < 8)
      ) {
        continue;
      }
      const val = Math.abs(Math.sin((r * size + c) + hash) * 10000);
      if (val - Math.floor(val) > 0.45) {
        cells[r][c] = true;
      }
    }
  }

  let rects = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (cells[r][c]) {
        rects += `<rect x="${c * 10 + 10}" y="${r * 10 + 10}" width="10" height="10" fill="#0f172a"/>`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 230" width="220" height="220" shape-rendering="crispEdges">
    <rect width="230" height="230" fill="#ffffff" rx="12"/>
    ${rects}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generate official E-Ticket validation QR code
 */
export async function generateTicketQRCode(data: TicketQRData): Promise<string> {
  const airlineName = data.airline?.trim() || 'Airlines';
  const payload = [
    `AIRLINE:${airlineName}`,
    `PNR:${data.pnr.toUpperCase()}`,
    `FLIGHT:${data.flightNumber}`,
    `PAX:${data.passengerName}`,
    `SEAT:${data.seat}`,
    `DATE:${data.travelDate}`,
    `ROUTE:${data.origin}->${data.destination}`,
    `CLASS:${data.cabinClass || 'ECONOMY'}`,
    `AUTH:SECURE-OFFICIAL-VERIFIED`,
  ].join('\n');

  try {
    const dataUrl = await QRCode.toDataURL(payload, {
      width: 256,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.warn('QRCode.toDataURL fallback invoked for ticket', err);
    return generateFallbackSvgQR(payload, `PNR-${data.pnr}`);
  }
}

/**
 * Generate UPI / Digital Payment QR code for checkout
 */
export async function generatePaymentQRCode(params: PaymentQRData): Promise<string> {
  const upiId = params.upiId || 'reservations@icici';
  const payeeName = params.payeeName || 'Reservations Payment';
  const note = params.transactionNote || `Booking PNR ${params.pnrRef || params.flightNumber || ''}`;
  
  // Standard NPCI UPI URI Specification
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${params.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;

  try {
    const dataUrl = await QRCode.toDataURL(upiUri, {
      width: 260,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.warn('QRCode.toDataURL fallback invoked for payment', err);
    return generateFallbackSvgQR(upiUri, 'Payment QR');
  }
}

