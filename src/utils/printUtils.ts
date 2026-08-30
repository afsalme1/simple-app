import QRCode from 'qrcode';
import { Invoice, CompanyProfile } from '../types';
import { generateUPILink } from './gstEngine';

/**
 * Generate high-resolution Data URL for UPI QR Code
 */
export async function generateInvoiceUPIQRCode(
  company: CompanyProfile,
  invoice: Invoice
): Promise<string> {
  if (!company.upiId) return '';
  const upiString = generateUPILink(
    company.upiId,
    company.name,
    invoice.balanceAmount > 0 ? invoice.balanceAmount : invoice.netTotal,
    invoice.invoiceNumber
  );

  try {
    const qrDataUrl = await QRCode.toDataURL(upiString, {
      width: 256,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrDataUrl;
  } catch (err) {
    console.error('Failed to generate UPI QR code', err);
    return '';
  }
}

/**
 * Trigger native window print for a dedicated print container
 */
export function triggerPrint(): void {
  window.print();
}
