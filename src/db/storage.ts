import { CompanyProfile, Customer, Item, Invoice, Payment, CreditNote, BackupData } from '../types';
import { getFinancialYear, calculateLineItem, numberToWordsIndian, calculateInvoiceProfit } from '../utils/gstEngine';

const DB_NAME = 'GST_INVOICE_PRO_DB';
const DB_VERSION = 1;
const LOCAL_STORAGE_KEY = 'GST_APP_LOCAL_STORAGE_V1';

export const DEFAULT_COMPANY: CompanyProfile = {
  id: 'default-company',
  name: 'Apex Tech & Industrial Solutions Pvt. Ltd.',
  tradeName: 'Apex GST Solutions',
  gstin: '29AABCA1234A1Z5',
  pan: 'AABCA1234A',
  state: 'Karnataka',
  stateCode: '29',
  address: 'No. 42, 3rd Floor, Tech Park Road, Koramangala 5th Block',
  city: 'Bengaluru',
  pincode: '560095',
  phone: '+91 98765 43210',
  email: 'billing@apextechsolutions.in',
  website: 'www.apextechsolutions.in',
  logoUrl: '',
  
  bankName: 'HDFC Bank',
  accountNumber: '50200012345678',
  ifscCode: 'HDFC0000123',
  branchName: 'Koramangala Branch, Bengaluru',
  accountHolder: 'Apex Tech & Industrial Solutions Pvt. Ltd.',
  upiId: 'apextech@hdfcbank',
  
  invoicePrefix: 'INV',
  invoiceSuffix: '',
  currentFY: getFinancialYear().fullFY,
  nextInvoiceSequence: 104,
  invoiceNumberingFormat: 'PREFIX/FY/NUM',
  invoicePadding: 4,
  
  termsAndConditions: '1. Goods once sold will not be taken back without prior authorization.\n2. Interest @ 18% p.a. will be charged for bills unpaid after due date.\n3. Subject to Bengaluru jurisdiction only.',
  declaration: 'We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.',
  authorizedSignatoryText: 'For Apex Tech & Industrial Solutions Pvt. Ltd.',
  
  isPasswordProtected: false,
  passwordHash: '',
  autoLockMinutes: 0,
  
  defaultGstRate: 18,
  defaultPrintFormat: 'A4',
  thermalPaperSize: '80mm',
  themeColor: '#0f766e', // Deep Teal
};

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-walkin',
    name: 'Walk-in Cash Customer',
    companyName: 'Retail Counter Buyer',
    gstType: 'CONSUMER',
    state: 'Karnataka',
    stateCode: '29',
    billingAddress: 'Counter Sale, Local Store',
    city: 'Bengaluru',
    pincode: '560095',
    phone: '9999999999',
    openingBalance: 0,
    currentBalance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust-1',
    name: 'InfraCloud Systems Pvt Ltd',
    companyName: 'InfraCloud Systems',
    gstin: '29AAACI9876C1Z3',
    pan: 'AAACI9876C',
    gstType: 'REGULAR',
    state: 'Karnataka',
    stateCode: '29',
    billingAddress: 'Plot 12, Electronic City Phase 1, Hosur Road',
    shippingAddress: 'Plot 12, Electronic City Phase 1, Hosur Road',
    city: 'Bengaluru',
    pincode: '560100',
    phone: '+91 80 4123 9999',
    email: 'accounts@infracloud.co.in',
    openingBalance: 0,
    currentBalance: 45000,
    creditLimit: 500000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust-2',
    name: 'Precision Dynamics Corp',
    companyName: 'Precision Dynamics',
    gstin: '27AABCP4321P1Z9',
    pan: 'AABCP4321P',
    gstType: 'REGULAR',
    state: 'Maharashtra',
    stateCode: '27',
    billingAddress: 'Unit 402, MIDC Industrial Area, Andheri East',
    shippingAddress: 'Warehouse B, Bhiwandi Logistics Park, Thane',
    city: 'Mumbai',
    pincode: '400093',
    phone: '+91 22 2847 1100',
    email: 'purchase@precisiondyn.com',
    openingBalance: 0,
    currentBalance: 0,
    creditLimit: 300000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust-3',
    name: 'Sharma Trading Enterprises',
    companyName: 'Sharma Traders',
    gstin: '07AAAFS5555S1Z1',
    pan: 'AAAFS5555S',
    gstType: 'REGULAR',
    state: 'Delhi',
    stateCode: '07',
    billingAddress: 'Shop 15, Nehru Place Computer Market',
    city: 'New Delhi',
    pincode: '110019',
    phone: '+91 98110 54321',
    email: 'sharmatraders.delhi@gmail.com',
    openingBalance: 0,
    currentBalance: 12500,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_ITEMS: Item[] = [
  {
    id: 'item-1',
    name: 'ThinkCentre Business Desktop i7 16GB/512GB',
    itemCode: 'TC-I7-512',
    itemType: 'GOODS',
    hsnSacCode: '847141',
    description: 'High-performance commercial desktop with 3-year onsite warranty',
    unit: 'NOS',
    sellingPrice: 58000,
    isPriceTaxInclusive: false,
    purchasePrice: 49500,
    gstRate: 18,
    cessRate: 0,
    openingStock: 25,
    currentStock: 18,
    minStockAlert: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-2',
    name: 'Samsung 1TB NVMe PCIe 4.0 SSD 980 Pro',
    itemCode: 'SSD-SAM-1TB',
    itemType: 'GOODS',
    hsnSacCode: '852351',
    description: 'Ultra fast solid state drive up to 7000MB/s read',
    unit: 'PCS',
    sellingPrice: 8500,
    isPriceTaxInclusive: false,
    purchasePrice: 6900,
    gstRate: 18,
    cessRate: 0,
    openingStock: 60,
    currentStock: 42,
    minStockAlert: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-3',
    name: 'Thermal POS Receipt Paper Rolls (80mm x 50m)',
    itemCode: 'TH-ROLL-80',
    itemType: 'GOODS',
    hsnSacCode: '481141',
    description: 'BPA-free high sensitivity thermal paper box of 50 rolls',
    unit: 'BOX',
    sellingPrice: 1450,
    isPriceTaxInclusive: false,
    purchasePrice: 980,
    gstRate: 12,
    cessRate: 0,
    openingStock: 100,
    currentStock: 64,
    minStockAlert: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-4',
    name: 'Enterprise Cloud Infrastructure & IT Consulting',
    itemCode: 'SAC-IT-CONSULT',
    itemType: 'SERVICES',
    hsnSacCode: '998311',
    description: 'Architectural review, cloud migration and GST compliance automation per hour',
    unit: 'HRS',
    sellingPrice: 3500,
    isPriceTaxInclusive: false,
    purchasePrice: 0,
    gstRate: 18,
    cessRate: 0,
    openingStock: 999,
    currentStock: 999,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-5',
    name: 'Epson TM-T82X Thermal POS Printer USB',
    itemCode: 'EPS-T82X',
    itemType: 'GOODS',
    hsnSacCode: '844332',
    description: 'High speed 200mm/s 80mm receipt printer with auto-cutter',
    unit: 'PCS',
    sellingPrice: 9200,
    isPriceTaxInclusive: false,
    purchasePrice: 7800,
    gstRate: 18,
    cessRate: 0,
    openingStock: 15,
    currentStock: 11,
    minStockAlert: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getSampleInvoices(company: CompanyProfile): Invoice[] {
  const fy = getFinancialYear().fullFY;
  const shortFY = getFinancialYear().shortFY;
  const today = new Date().toISOString().split('T')[0];

  // Sample Invoice 1: Intra-state B2B Tax Invoice
  const item1Calc = calculateLineItem(2, 58000, 5, 0, 18, 0, false, 46000);
  const item2Calc = calculateLineItem(4, 8500, 0, 0, 18, 0, false, 6200);
  const subTotal1 = item1Calc.taxableAmount + item2Calc.taxableAmount + item1Calc.cgstAmount + item1Calc.sgstAmount + item2Calc.cgstAmount + item2Calc.sgstAmount;
  const net1 = Math.round(subTotal1);
  const roundOff1 = Number((net1 - subTotal1).toFixed(2));
  const profit1 = calculateInvoiceProfit([
    { id: '1', name: '', hsnSacCode: '', unit: '', ...item1Calc },
    { id: '2', name: '', hsnSacCode: '', unit: '', ...item2Calc }
  ]);

  const inv1: Invoice = {
    id: 'inv-101',
    documentType: 'TAX_INVOICE',
    invoiceNumber: `${company.invoicePrefix}/${shortFY}/0101`,
    sequenceNumber: 101,
    financialYear: fy,
    invoiceDate: today,
    dueDate: today,
    customerId: 'cust-1',
    customerName: 'InfraCloud Systems Pvt Ltd',
    customerGstin: '29AAACI9876C1Z3',
    customerGstType: 'REGULAR',
    customerState: 'Karnataka',
    customerStateCode: '29',
    placeOfSupply: '29-Karnataka',
    placeOfSupplyStateCode: '29',
    billingAddress: 'Plot 12, Electronic City Phase 1, Hosur Road, Bengaluru - 560100',
    shippingAddress: 'Plot 12, Electronic City Phase 1, Hosur Road, Bengaluru - 560100',
    customerPhone: '+91 80 4123 9999',
    isInterState: false,
    isReverseCharge: false,
    items: [
      {
        id: 'inv-item-1',
        itemId: 'item-1',
        name: 'ThinkCentre Business Desktop i7 16GB/512GB',
        hsnSacCode: '847141',
        unit: 'NOS',
        ...item1Calc,
      },
      {
        id: 'inv-item-2',
        itemId: 'item-2',
        name: 'Samsung 1TB NVMe PCIe 4.0 SSD 980 Pro',
        hsnSacCode: '852351',
        unit: 'PCS',
        ...item2Calc,
      },
    ],
    totalTaxableAmount: Number((item1Calc.taxableAmount + item2Calc.taxableAmount).toFixed(2)),
    totalCgstAmount: Number((item1Calc.cgstAmount + item2Calc.cgstAmount).toFixed(2)),
    totalSgstAmount: Number((item1Calc.sgstAmount + item2Calc.sgstAmount).toFixed(2)),
    totalIgstAmount: 0,
    totalCessAmount: 0,
    totalTaxAmount: Number((item1Calc.cgstAmount + item1Calc.sgstAmount + item2Calc.cgstAmount + item2Calc.sgstAmount).toFixed(2)),
    totalCost: profit1.totalCost,
    grossProfit: profit1.grossProfit,
    profitMarginPercent: profit1.profitMarginPercent,
    additionalChargesAmount: 0,
    overallDiscountPercent: 0,
    overallDiscountAmount: 0,
    subTotal: subTotal1,
    roundOff: roundOff1,
    netTotal: net1,
    netTotalInWords: numberToWordsIndian(net1),
    paidAmount: 120000,
    balanceAmount: net1 - 120000,
    status: 'PARTIAL',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Sample Invoice 2: Inter-state (Karnataka to Maharashtra -> IGST)
  const item3Calc = calculateLineItem(2, 9200, 0, 0, 18, 0, true, 7100);
  const item4Calc = calculateLineItem(10, 1450, 0, 0, 12, 0, true, 950);
  const subTotal2 = item3Calc.taxableAmount + item4Calc.taxableAmount + item3Calc.igstAmount + item4Calc.igstAmount;
  const net2 = Math.round(subTotal2);
  const roundOff2 = Number((net2 - subTotal2).toFixed(2));
  const profit2 = calculateInvoiceProfit([
    { id: '3', name: '', hsnSacCode: '', unit: '', ...item3Calc },
    { id: '4', name: '', hsnSacCode: '', unit: '', ...item4Calc }
  ]);

  const inv2: Invoice = {
    id: 'inv-102',
    documentType: 'TAX_INVOICE',
    invoiceNumber: `${company.invoicePrefix}/${shortFY}/0102`,
    sequenceNumber: 102,
    financialYear: fy,
    invoiceDate: today,
    dueDate: today,
    customerId: 'cust-2',
    customerName: 'Precision Dynamics Corp',
    customerGstin: '27AABCP4321P1Z9',
    customerGstType: 'REGULAR',
    customerState: 'Maharashtra',
    customerStateCode: '27',
    placeOfSupply: '27-Maharashtra',
    placeOfSupplyStateCode: '27',
    billingAddress: 'Unit 402, MIDC Industrial Area, Andheri East, Mumbai - 400093',
    shippingAddress: 'Warehouse B, Bhiwandi Logistics Park, Thane - 421302',
    customerPhone: '+91 22 2847 1100',
    isInterState: true,
    isReverseCharge: false,
    items: [
      {
        id: 'inv-item-3',
        itemId: 'item-5',
        name: 'Epson TM-T82X Thermal POS Printer USB',
        hsnSacCode: '844332',
        unit: 'PCS',
        ...item3Calc,
      },
      {
        id: 'inv-item-4',
        itemId: 'item-3',
        name: 'Thermal POS Receipt Paper Rolls (80mm x 50m)',
        hsnSacCode: '481141',
        unit: 'BOX',
        ...item4Calc,
      },
    ],
    totalTaxableAmount: Number((item3Calc.taxableAmount + item4Calc.taxableAmount).toFixed(2)),
    totalCgstAmount: 0,
    totalSgstAmount: 0,
    totalIgstAmount: Number((item3Calc.igstAmount + item4Calc.igstAmount).toFixed(2)),
    totalCessAmount: 0,
    totalTaxAmount: Number((item3Calc.igstAmount + item4Calc.igstAmount).toFixed(2)),
    totalCost: profit2.totalCost,
    grossProfit: profit2.grossProfit,
    profitMarginPercent: profit2.profitMarginPercent,
    additionalChargesAmount: 0,
    overallDiscountPercent: 0,
    overallDiscountAmount: 0,
    subTotal: subTotal2,
    roundOff: roundOff2,
    netTotal: net2,
    netTotalInWords: numberToWordsIndian(net2),
    paidAmount: net2,
    balanceAmount: 0,
    status: 'PAID',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Sample Invoice 3: Walk-in Cash Sale
  const item5Calc = calculateLineItem(2, 1450, 0, 0, 12, 0, false, 950);
  const subTotal3 = item5Calc.taxableAmount + item5Calc.cgstAmount + item5Calc.sgstAmount;
  const net3 = Math.round(subTotal3);
  const roundOff3 = Number((net3 - subTotal3).toFixed(2));
  const profit3 = calculateInvoiceProfit([
    { id: '5', name: '', hsnSacCode: '', unit: '', ...item5Calc }
  ]);

  const inv3: Invoice = {
    id: 'inv-103',
    documentType: 'TAX_INVOICE',
    invoiceNumber: `${company.invoicePrefix}/${shortFY}/0103`,
    sequenceNumber: 103,
    financialYear: fy,
    invoiceDate: today,
    customerId: 'cust-walkin',
    customerName: 'Walk-in Cash Customer',
    customerGstType: 'CONSUMER',
    customerState: 'Karnataka',
    customerStateCode: '29',
    placeOfSupply: '29-Karnataka',
    placeOfSupplyStateCode: '29',
    billingAddress: 'Counter Sale, Local Store',
    customerPhone: '9999999999',
    isInterState: false,
    isReverseCharge: false,
    items: [
      {
        id: 'inv-item-5',
        itemId: 'item-3',
        name: 'Thermal POS Receipt Paper Rolls (80mm x 50m)',
        hsnSacCode: '481141',
        unit: 'BOX',
        ...item5Calc,
      },
    ],
    totalTaxableAmount: item5Calc.taxableAmount,
    totalCgstAmount: item5Calc.cgstAmount,
    totalSgstAmount: item5Calc.sgstAmount,
    totalIgstAmount: 0,
    totalCessAmount: 0,
    totalTaxAmount: item5Calc.cgstAmount + item5Calc.sgstAmount,
    totalCost: profit3.totalCost,
    grossProfit: profit3.grossProfit,
    profitMarginPercent: profit3.profitMarginPercent,
    additionalChargesAmount: 0,
    overallDiscountPercent: 0,
    overallDiscountAmount: 0,
    subTotal: subTotal3,
    roundOff: roundOff3,
    netTotal: net3,
    netTotalInWords: numberToWordsIndian(net3),
    paidAmount: net3,
    balanceAmount: 0,
    status: 'PAID',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Sample 4: Quotation / Estimate
  const itemEstCalc = calculateLineItem(3, 58000, 10, 0, 18, 0, false, 46000);
  const subTotalEst = itemEstCalc.taxableAmount + itemEstCalc.cgstAmount + itemEstCalc.sgstAmount;
  const netEst = Math.round(subTotalEst);
  const roundOffEst = Number((netEst - subTotalEst).toFixed(2));
  const profitEst = calculateInvoiceProfit([
    { id: 'est-1', name: '', hsnSacCode: '', unit: '', ...itemEstCalc }
  ]);

  const inv4Estimate: Invoice = {
    id: 'est-201',
    documentType: 'ESTIMATE',
    invoiceNumber: `EST/${shortFY}/0001`,
    sequenceNumber: 1,
    financialYear: fy,
    invoiceDate: today,
    dueDate: today,
    validUntilDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    customerId: 'cust-1',
    customerName: 'InfraCloud Systems Pvt Ltd',
    customerGstin: '29AAACI9876C1Z3',
    customerGstType: 'REGULAR',
    customerState: 'Karnataka',
    customerStateCode: '29',
    placeOfSupply: '29-Karnataka',
    placeOfSupplyStateCode: '29',
    billingAddress: 'Plot 12, Electronic City Phase 1, Hosur Road, Bengaluru - 560100',
    shippingAddress: 'Plot 12, Electronic City Phase 1, Hosur Road, Bengaluru - 560100',
    customerPhone: '+91 80 4123 9999',
    isInterState: false,
    isReverseCharge: false,
    items: [
      {
        id: 'est-item-1',
        itemId: 'item-1',
        name: 'ThinkCentre Business Desktop i7 16GB/512GB',
        hsnSacCode: '847141',
        unit: 'NOS',
        ...itemEstCalc,
      },
    ],
    totalTaxableAmount: itemEstCalc.taxableAmount,
    totalCgstAmount: itemEstCalc.cgstAmount,
    totalSgstAmount: itemEstCalc.sgstAmount,
    totalIgstAmount: 0,
    totalCessAmount: 0,
    totalTaxAmount: itemEstCalc.cgstAmount + itemEstCalc.sgstAmount,
    totalCost: profitEst.totalCost,
    grossProfit: profitEst.grossProfit,
    profitMarginPercent: profitEst.profitMarginPercent,
    additionalChargesAmount: 0,
    overallDiscountPercent: 0,
    overallDiscountAmount: 0,
    subTotal: subTotalEst,
    roundOff: roundOffEst,
    netTotal: netEst,
    netTotalInWords: numberToWordsIndian(netEst),
    paidAmount: 0,
    balanceAmount: netEst,
    status: 'ISSUED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Sample 5: Bill of Supply (Composition / Exempt)
  const itemBOSCalc = calculateLineItem(5, 1200, 0, 0, 0, 0, false, 800);
  const subTotalBOS = itemBOSCalc.taxableAmount;
  const netBOS = Math.round(subTotalBOS);
  const roundOffBOS = Number((netBOS - subTotalBOS).toFixed(2));
  const profitBOS = calculateInvoiceProfit([
    { id: 'bos-1', name: '', hsnSacCode: '', unit: '', ...itemBOSCalc }
  ]);

  const inv5BillOfSupply: Invoice = {
    id: 'bos-301',
    documentType: 'BILL_OF_SUPPLY',
    invoiceNumber: `BOS/${shortFY}/0001`,
    sequenceNumber: 1,
    financialYear: fy,
    invoiceDate: today,
    customerId: 'cust-walkin',
    customerName: 'Walk-in Cash Customer',
    customerGstType: 'CONSUMER',
    customerState: 'Karnataka',
    customerStateCode: '29',
    placeOfSupply: '29-Karnataka',
    placeOfSupplyStateCode: '29',
    billingAddress: 'Counter Sale, Local Store',
    customerPhone: '9999999999',
    isInterState: false,
    isReverseCharge: false,
    items: [
      {
        id: 'bos-item-1',
        itemId: 'item-3',
        name: 'Thermal POS Receipt Paper Rolls (80mm x 50m) - Exempt',
        hsnSacCode: '481141',
        unit: 'BOX',
        ...itemBOSCalc,
      },
    ],
    totalTaxableAmount: itemBOSCalc.taxableAmount,
    totalCgstAmount: 0,
    totalSgstAmount: 0,
    totalIgstAmount: 0,
    totalCessAmount: 0,
    totalTaxAmount: 0,
    totalCost: profitBOS.totalCost,
    grossProfit: profitBOS.grossProfit,
    profitMarginPercent: profitBOS.profitMarginPercent,
    additionalChargesAmount: 0,
    overallDiscountPercent: 0,
    overallDiscountAmount: 0,
    subTotal: subTotalBOS,
    roundOff: roundOffBOS,
    netTotal: netBOS,
    netTotalInWords: numberToWordsIndian(netBOS),
    paidAmount: netBOS,
    balanceAmount: 0,
    status: 'PAID',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return [inv1, inv2, inv3, inv4Estimate, inv5BillOfSupply];
}

export function getSamplePayments(): Payment[] {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      id: 'pay-1',
      invoiceId: 'inv-101',
      invoiceNumber: 'INV/24-25/0101',
      customerId: 'cust-1',
      customerName: 'InfraCloud Systems Pvt Ltd',
      paymentDate: today,
      amount: 120000,
      paymentMode: 'BANK_TRANSFER',
      referenceNumber: 'HDFC-NEFT-9847120938',
      notes: 'Advance & partial settlement for computers',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'pay-2',
      invoiceId: 'inv-102',
      invoiceNumber: 'INV/24-25/0102',
      customerId: 'cust-2',
      customerName: 'Precision Dynamics Corp',
      paymentDate: today,
      amount: 37996,
      paymentMode: 'UPI',
      referenceNumber: 'UPI-42938102948',
      notes: 'Full payment on delivery via UPI QR',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'pay-3',
      invoiceId: 'inv-103',
      invoiceNumber: 'INV/24-25/0103',
      customerId: 'cust-walkin',
      customerName: 'Walk-in Cash Customer',
      paymentDate: today,
      amount: 3248,
      paymentMode: 'CASH',
      referenceNumber: 'CASH-COUNTER-01',
      notes: 'Cash received at POS counter',
      createdAt: new Date().toISOString(),
    },
  ];
}

export function getSampleCreditNotes(): CreditNote[] {
  return [];
}

/**
 * Storage Controller Layer
 */
export class OfflineStorage {
  private static getInitialState(): BackupData {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
        console.error('Error parsing local storage backup', e);
      }
    }

    const company = DEFAULT_COMPANY;
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      company,
      customers: INITIAL_CUSTOMERS,
      items: INITIAL_ITEMS,
      invoices: getSampleInvoices(company),
      payments: getSamplePayments(),
      creditNotes: getSampleCreditNotes(),
    };
  }

  public static loadData(): BackupData {
    return this.getInitialState();
  }

  public static saveData(data: BackupData): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      // Also record auto-backup timestamp
      localStorage.setItem('GST_LAST_AUTO_BACKUP', new Date().toISOString());
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  }

  public static exportJSON(data: BackupData): string {
    return JSON.stringify(data, null, 2);
  }

  public static resetToFactoryDefaults(): BackupData {
    const defaultData: BackupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      company: DEFAULT_COMPANY,
      customers: INITIAL_CUSTOMERS,
      items: INITIAL_ITEMS,
      invoices: getSampleInvoices(DEFAULT_COMPANY),
      payments: getSamplePayments(),
      creditNotes: [],
    };
    this.saveData(defaultData);
    return defaultData;
  }
}
