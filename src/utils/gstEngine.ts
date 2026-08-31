import { GSTState, InvoiceItem } from '../types';

// Official Indian GST State / UT Codes
export const GST_STATES: GSTState[] = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh', isUT: true },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi', isUT: true },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu', isUT: true },
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh (Old)' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep', isUT: true },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry', isUT: true },
  { code: '35', name: 'Andaman and Nicobar Islands', isUT: true },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh', isUT: true },
  { code: '97', name: 'Other Territory', isUT: true },
  { code: '99', name: 'Centre Jurisdiction' },
];

export const STANDARD_UNITS = [
  { code: 'PCS', name: 'Pieces' },
  { code: 'NOS', name: 'Numbers' },
  { code: 'KGS', name: 'Kilograms' },
  { code: 'GMS', name: 'Grams' },
  { code: 'MTR', name: 'Meters' },
  { code: 'BOX', name: 'Boxes' },
  { code: 'PKT', name: 'Packets' },
  { code: 'SET', name: 'Sets' },
  { code: 'LTR', name: 'Liters' },
  { code: 'MLT', name: 'Milliliters' },
  { code: 'HRS', name: 'Hours' },
  { code: 'DAYS', name: 'Days' },
  { code: 'SQF', name: 'Square Feet' },
  { code: 'SQM', name: 'Square Meters' },
  { code: 'TON', name: 'Tonnes' },
  { code: 'BAG', name: 'Bags' },
  { code: 'CAN', name: 'Cans' },
  { code: 'ROL', name: 'Rolls' },
  { code: 'UNT', name: 'Units' },
  { code: 'OTH', name: 'Others' },
];

export const GST_RATES = [0, 5, 12, 18, 28];

/**
 * Validate 15-character Indian GSTIN
 * Format: 2 digits (State) + 5 letters + 4 digits + 1 letter (PAN) + 1 entity num + 'Z' + 1 checksum char
 */
export function validateGSTIN(gstin: string): { isValid: boolean; message?: string; stateCode?: string; pan?: string } {
  if (!gstin) return { isValid: false, message: 'GSTIN cannot be empty' };
  
  const cleanGstin = gstin.trim().toUpperCase();
  if (cleanGstin.length !== 15) {
    return { isValid: false, message: 'GSTIN must be exactly 15 characters long' };
  }
  
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(cleanGstin)) {
    return { isValid: false, message: 'Invalid GSTIN structure (Format: 22AAAAA0000A1Z5)' };
  }
  
  const stateCode = cleanGstin.substring(0, 2);
  const state = GST_STATES.find(s => s.code === stateCode);
  if (!state) {
    return { isValid: false, message: `Invalid GST state code "${stateCode}"` };
  }
  
  const pan = cleanGstin.substring(2, 12);
  
  return {
    isValid: true,
    stateCode,
    pan,
  };
}

/**
 * Validate 10-character Indian PAN
 */
export function validatePAN(pan: string): boolean {
  if (!pan) return false;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.trim().toUpperCase());
}

/**
 * Calculate Indian Financial Year from date (e.g. 2024-08-15 -> "2024-25" and "24-25")
 */
export function getFinancialYear(dateInput?: string | Date): { fullFY: string; shortFY: string } {
  const d = dateInput ? new Date(dateInput) : new Date();
  const month = d.getMonth() + 1; // 1-12 (April is 4)
  const fullYear = d.getFullYear();
  
  let startYear: number;
  let endYear: number;
  
  if (month >= 4) {
    startYear = fullYear;
    endYear = fullYear + 1;
  } else {
    startYear = fullYear - 1;
    endYear = fullYear;
  }
  
  const fullFY = `${startYear}-${String(endYear).slice(-2)}`;
  const shortFY = `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
  
  return { fullFY, shortFY };
}

/**
 * Format Invoice number based on Prefix, FY, and Sequence number
 */
export function formatInvoiceNumber(
  prefix: string,
  sequence: number,
  financialYear: string,
  format: 'PREFIX/FY/NUM' | 'PREFIX-FY-NUM' | 'FY/NUM' | 'PREFIX/NUM' = 'PREFIX/FY/NUM',
  padding = 4
): string {
  const numStr = String(sequence).padStart(padding, '0');
  const cleanPrefix = (prefix || 'INV').trim().toUpperCase();
  
  // Extract short FY if full FY is provided (e.g. "2024-25" -> "24-25")
  let fyStr = financialYear;
  if (fyStr.includes('-') && fyStr.length === 7) {
    const parts = fyStr.split('-');
    fyStr = `${parts[0].slice(-2)}-${parts[1]}`;
  }
  
  switch (format) {
    case 'PREFIX-FY-NUM':
      return `${cleanPrefix}-${fyStr}-${numStr}`;
    case 'FY/NUM':
      return `${fyStr}/${numStr}`;
    case 'PREFIX/NUM':
      return `${cleanPrefix}/${numStr}`;
    case 'PREFIX/FY/NUM':
    default:
      return `${cleanPrefix}/${fyStr}/${numStr}`;
  }
}

/**
 * Format Currency in Indian format (₹ 1,23,456.78)
 */
export function formatINR(amount: number | undefined | null, includeSymbol = true): string {
  const num = Number(amount || 0);
  const formatted = num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Convert numbers to Indian words (Rupees and Paisa)
 * e.g. 154250.50 -> "Rupees One Lakh Fifty-Four Thousand Two Hundred Fifty and Fifty Paisa Only"
 */
export function numberToWordsIndian(amount: number): string {
  const num = Math.abs(Number(amount || 0));
  if (num === 0) return 'Rupees Zero Only';
  
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function convertGroup(n: number): string {
    let str = '';
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += units[n] + ' ';
    }
    return str.trim();
  }
  
  const rupees = Math.floor(num);
  const paisa = Math.round((num - rupees) * 100);
  
  let crore = Math.floor(rupees / 10000000);
  let remainder = rupees % 10000000;
  
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  
  let thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;
  
  let result = '';
  
  if (crore > 0) {
    result += convertGroup(crore) + ' Crore ';
  }
  if (lakh > 0) {
    result += convertGroup(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    result += convertGroup(thousand) + ' Thousand ';
  }
  if (remainder > 0) {
    result += convertGroup(remainder) + ' ';
  }
  
  result = result.trim();
  let finalWord = result ? `Rupees ${result}` : 'Rupees Zero';
  
  if (paisa > 0) {
    finalWord += ` and ${convertGroup(paisa)} Paisa`;
  }
  
  return `${finalWord} Only`;
}

/**
 * Calculate Line Item values based on Qty, Rate, Discount, GST Rate, Cess, Inter-state status, and Purchase/Cost Price
 */
export function calculateLineItem(
  quantity: number,
  rate: number,
  discountPercent = 0,
  discountAmount = 0,
  gstRate = 18,
  cessRate = 0,
  isInterState = false,
  purchasePrice = 0
): Omit<InvoiceItem, 'id' | 'name' | 'hsnSacCode' | 'unit'> {
  const qty = Number(quantity) || 0;
  const unitRate = Number(rate) || 0;
  const unitCost = Number(purchasePrice) || 0;
  const rawSubtotal = qty * unitRate;
  
  let discAmt = 0;
  if (discountPercent > 0) {
    discAmt = (rawSubtotal * discountPercent) / 100;
  } else if (discountAmount > 0) {
    discAmt = Math.min(rawSubtotal, discountAmount);
  }
  
  const taxableAmount = Math.max(0, rawSubtotal - discAmt);
  
  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;
  
  if (isInterState) {
    igstRate = gstRate;
    igstAmount = (taxableAmount * igstRate) / 100;
  } else {
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;
    cgstAmount = (taxableAmount * cgstRate) / 100;
    sgstAmount = (taxableAmount * sgstRate) / 100;
  }
  
  const cessAmt = cessRate > 0 ? (taxableAmount * cessRate) / 100 : 0;
  const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmt;
  
  // Profit calculations
  const costAmount = Number((qty * unitCost).toFixed(2));
  const profit = Number((taxableAmount - costAmount).toFixed(2));
  const profitMargin = taxableAmount > 0 ? Number(((profit / taxableAmount) * 100).toFixed(1)) : 0;
  
  return {
    quantity: qty,
    rate: unitRate,
    purchasePrice: unitCost,
    discountPercent,
    discountAmount: Number(discAmt.toFixed(2)),
    taxableAmount: Number(taxableAmount.toFixed(2)),
    costAmount,
    profit,
    profitMargin,
    gstRate,
    cgstRate,
    cgstAmount: Number(cgstAmount.toFixed(2)),
    sgstRate,
    sgstAmount: Number(sgstAmount.toFixed(2)),
    igstRate,
    igstAmount: Number(igstAmount.toFixed(2)),
    cessRate,
    cessAmount: Number(cessAmt.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
}

/**
 * Calculate total cost, gross profit and margin for an entire invoice/bill
 */
export function calculateInvoiceProfit(items: InvoiceItem[]): { totalCost: number; grossProfit: number; profitMarginPercent: number } {
  let totalTaxable = 0;
  let totalCost = 0;
  
  items.forEach(item => {
    totalTaxable += item.taxableAmount || 0;
    const itemCost = (item.purchasePrice !== undefined ? item.purchasePrice : (item.costAmount ? item.costAmount / (item.quantity || 1) : 0)) * (item.quantity || 0);
    totalCost += itemCost;
  });
  
  const grossProfit = Number((totalTaxable - totalCost).toFixed(2));
  const profitMarginPercent = totalTaxable > 0 ? Number(((grossProfit / totalTaxable) * 100).toFixed(1)) : 0;
  
  return {
    totalCost: Number(totalCost.toFixed(2)),
    grossProfit,
    profitMarginPercent,
  };
}

/**
 * Format number into Indian Currency (e.g. ₹1,23,456.00)
 */
export function formatCurrencyIndian(amount: number): string {
  return '₹' + Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Generate UPI Payment Link and Deep Link for dynamic QR Code
 * Format: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
 */
export function generateUPILink(vpa: string, payeeName: string, amount: number, invoiceNumber: string): string {
  if (!vpa) return '';
  const cleanVpa = vpa.trim();
  const cleanName = encodeURIComponent(payeeName.trim());
  const formattedAmount = amount.toFixed(2);
  const note = encodeURIComponent(`Inv ${invoiceNumber}`);
  
  return `upi://pay?pa=${cleanVpa}&pn=${cleanName}&am=${formattedAmount}&cu=INR&tn=${note}`;
}
