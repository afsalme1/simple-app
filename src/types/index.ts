export interface CompanyProfile {
  id: string;
  name: string;
  tradeName?: string;
  gstin: string;
  pan: string;
  state: string;
  stateCode: string; // 2-digit GST state code e.g. "27"
  address: string;
  city: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string; // Base64 data URL
  
  // Banking & UPI
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  accountHolder: string;
  upiId?: string; // for instant dynamic UPI QR code
  
  // Invoice Configuration
  invoicePrefix: string; // e.g. "INV" or "TAX"
  invoiceSuffix?: string;
  currentFY: string; // e.g. "2024-25"
  nextInvoiceSequence: number; // e.g. 1
  invoiceNumberingFormat: 'PREFIX/FY/NUM' | 'PREFIX-FY-NUM' | 'FY/NUM' | 'PREFIX/NUM'; // e.g. INV/24-25/0001
  invoicePadding: number; // e.g. 4 for 0001
  
  // Terms & Notes
  termsAndConditions: string;
  declaration: string;
  authorizedSignatoryText: string;
  
  // Security
  isPasswordProtected: boolean;
  passwordHash?: string;
  autoLockMinutes?: number;
  
  // App preferences
  defaultGstRate: number;
  defaultPrintFormat: 'A4' | 'THERMAL_3' | 'THERMAL_2';
  thermalPaperSize: '58mm' | '80mm';
  themeColor: string;
}

export type GSTType = 'REGULAR' | 'COMPOSITION' | 'UNREGISTERED' | 'CONSUMER' | 'OVERSEAS';

export interface Customer {
  id: string;
  name: string;
  companyName?: string;
  gstin?: string;
  pan?: string;
  gstType: GSTType;
  state: string;
  stateCode: string; // 2-digit GST state code
  billingAddress: string;
  shippingAddress?: string;
  city: string;
  pincode: string;
  phone: string;
  email?: string;
  openingBalance: number; // positive = customer owes us (debit)
  currentBalance: number;
  creditLimit?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ItemType = 'GOODS' | 'SERVICES';

export interface Item {
  id: string;
  name: string;
  itemCode?: string; // SKU / Barcode
  itemType: ItemType;
  hsnSacCode: string; // 4 to 8 digits
  description?: string;
  unit: string; // PCS, KGS, MTR, NOS, BOX, PKT, HRS, etc.
  sellingPrice: number; // excluding tax or including tax
  isPriceTaxInclusive: boolean;
  purchasePrice?: number;
  gstRate: number; // 0, 5, 12, 18, 28
  cessRate?: number; // % cess if applicable
  openingStock: number;
  currentStock: number;
  minStockAlert?: number;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType = 'TAX_INVOICE' | 'BILL_OF_SUPPLY' | 'ESTIMATE';

export interface InvoiceItem {
  id: string;
  itemId?: string;
  name: string;
  hsnSacCode: string;
  quantity: number;
  unit: string;
  rate: number; // Unit price before discount & tax
  purchasePrice?: number; // Unit purchase/cost price for profit calculation
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number; // (qty * rate) - discount
  costAmount?: number; // qty * purchasePrice
  profit?: number; // taxableAmount - costAmount
  profitMargin?: number; // (profit / taxableAmount) * 100
  gstRate: number; // total GST %
  cgstRate: number; // half of gstRate if intra-state
  cgstAmount: number;
  sgstRate: number; // half of gstRate if intra-state
  sgstAmount: number;
  igstRate: number; // full gstRate if inter-state
  igstAmount: number;
  cessRate: number;
  cessAmount: number;
  totalAmount: number; // taxableAmount + tax
}

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIAL' | 'PAID' | 'CANCELLED';

export interface Invoice {
  id: string;
  documentType?: DocumentType; // 'TAX_INVOICE' | 'BILL_OF_SUPPLY' | 'ESTIMATE'
  invoiceNumber: string; // e.g. INV/24-25/0001 or BOS/24-25/0001 or EST/24-25/0001
  sequenceNumber: number; // integer for gapless sequence tracking
  financialYear: string; // e.g. "2024-25"
  invoiceDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  validUntilDate?: string; // For Estimates/Quotations (e.g. 30 days validity)
  isConvertedFromEstimate?: boolean;
  originalEstimateNumber?: string;
  
  // Customer details at snapshot time
  customerId: string;
  customerName: string;
  customerGstin?: string;
  customerGstType: GSTType;
  customerState: string;
  customerStateCode: string;
  placeOfSupply: string; // State + Code e.g. "27-Maharashtra"
  placeOfSupplyStateCode: string;
  billingAddress: string;
  shippingAddress?: string;
  customerPhone?: string;
  
  // Tax applicability
  isInterState: boolean; // true if supplier state != place of supply
  isReverseCharge: boolean;
  
  // Items
  items: InvoiceItem[];
  
  // Summary calculations
  totalTaxableAmount: number;
  totalCgstAmount: number;
  totalSgstAmount: number;
  totalIgstAmount: number;
  totalCessAmount: number;
  totalTaxAmount: number;

  // Profit & Cost calculations
  totalCost?: number;
  grossProfit?: number;
  profitMarginPercent?: number;
  
  // Additional charges & overall discount
  additionalChargesName?: string; // e.g. "Freight & Handling"
  additionalChargesAmount: number;
  additionalChargesGstRate?: number;
  overallDiscountPercent: number;
  overallDiscountAmount: number;
  
  // Grand totals
  subTotal: number;
  roundOff: number; // e.g. -0.34 or +0.25
  netTotal: number; // final rounded total payable
  netTotalInWords: string;
  
  // Payment tracking
  paidAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
  
  // Cancellation metadata
  cancellationReason?: string;
  cancelledAt?: string;
  
  // Transport & E-Way Bill (optional Indian GST compliance)
  eWayBillNo?: string;
  vehicleNo?: string;
  transporterName?: string;
  poNumber?: string;
  poDate?: string;
  
  // User & Salesman Attribution
  createdByUserId?: string;
  createdByUserName?: string;
  salesmanId?: string;
  salesmanName?: string;

  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE' | 'OTHER';

export interface Payment {
  id: string;
  paymentNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  customerId: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string; // UTR / Cheque No / Transaction ID
  notes?: string;
  createdAt: string;
}

export type CreditNoteReason = 'SALES_RETURN' | 'POST_SALE_DISCOUNT' | 'DEFICIENCY_IN_SERVICE' | 'CORRECTION_IN_INVOICE' | 'CHANGE_IN_POS' | 'OTHERS';

export interface CreditNote {
  id: string;
  creditNoteNumber: string; // e.g. CN/24-25/0001
  noteType?: 'CREDIT' | 'DEBIT';
  sequenceNumber?: number;
  financialYear?: string;
  creditNoteDate: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  originalInvoiceDate: string;
  
  customerId: string;
  customerName: string;
  customerGstin?: string;
  
  reason: CreditNoteReason;
  reasonDescription?: string;
  
  items: InvoiceItem[];
  totalTaxableAmount: number;
  totalCgstAmount: number;
  totalSgstAmount: number;
  totalIgstAmount: number;
  totalCessAmount: number;
  totalTaxAmount?: number;
  netTotal: number;
  netTotalInWords: string;
  
  createdAt: string;
}

export interface GSTState {
  code: string; // 2-digit string "01".."38"
  name: string;
  isUT?: boolean;
}

export interface RateWiseGSTSummary {
  gstRate: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTax: number;
  totalAmount: number;
}

export interface GSTR1B2BInvoice {
  gstin: string;
  receiverName: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  placeOfSupply: string;
  reverseCharge: 'N' | 'Y';
  applicablePercent: number;
  invoiceType: 'Regular';
  eCommerceGstin?: string;
  rate: number;
  taxableValue: number;
  cessAmount: number;
}

export interface GSTR1HSNSummary {
  hsn: string;
  description: string;
  uqc: string;
  totalQuantity: number;
  totalValue: number;
  taxableValue: number;
  integratedTaxAmount: number;
  centralTaxAmount: number;
  stateTaxAmount: number;
  cessAmount: number;
}

export interface CustomerLedgerEntry {
  id: string;
  date: string;
  type: 'INVOICE' | 'PAYMENT' | 'CREDIT_NOTE' | 'OPENING_BALANCE';
  referenceNo: string;
  description: string;
  debit: number; // Increases receivable (Invoice)
  credit: number; // Decreases receivable (Payment, Credit Note)
  balance: number; // Running balance
}

export interface AgeingBucket {
  period: string; // '0-30 Days', '31-60 Days', '61-90 Days', '90+ Days'
  amount: number;
  invoicesCount: number;
}

export type UserRole = 'ADMIN' | 'SALESMAN' | 'STAFF' | 'ACCOUNTANT' | 'CUSTOM';

export interface UserPermissions {
  canCreateInvoice: boolean;
  canCreateEstimate: boolean;
  canEditInvoice: boolean;
  canDeleteInvoice: boolean;
  canCancelInvoice: boolean;
  canViewProfit: boolean;
  canManageItems: boolean;
  canManageCustomers: boolean;
  canRecordPayment: boolean;
  canCreateCreditNote: boolean;
  canViewReports: boolean;
  canSyncUSB: boolean;
  canBackupRestore: boolean;
  canManageCompanySettings: boolean;
  canManageUsers: boolean;
  allowDiscountEditing?: boolean;
  maxDiscountPercent?: number;
  salesCommissionPercent?: number;
}

export interface AppUser {
  id: string;
  username: string; // login id (unique)
  name: string;
  passwordHash: string; // password
  role: UserRole;
  phone?: string;
  email?: string;
  isActive: boolean;
  permissions: UserPermissions;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncPackage {
  syncId: string;
  version: string;
  deviceId: string;
  deviceName: string;
  exportedAt: string;
  exportedByUserId: string;
  exportedByUserName: string;
  invoices: Invoice[];
  payments: Payment[];
  customers: Customer[];
  items: Item[];
  creditNotes: CreditNote[];
  checksum: string;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  direction: 'EXPORT' | 'IMPORT';
  sourceDevice: string;
  userId: string;
  userName: string;
  invoicesCount: number;
  paymentsCount: number;
  customersCount: number;
  itemsCount: number;
  status: 'SUCCESS' | 'CONFLICT_RESOLVED' | 'FAILED';
  details: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  type: 'AUTH' | 'INVOICE' | 'PAYMENT' | 'CUSTOMER' | 'ITEM' | 'SYNC' | 'ADMIN';
}

export interface BackupData {
  version: string;
  exportedAt: string;
  company: CompanyProfile;
  customers: Customer[];
  items: Item[];
  invoices: Invoice[];
  payments: Payment[];
  creditNotes: CreditNote[];
  users?: AppUser[];
  syncLogs?: SyncLog[];
  activityLogs?: ActivityLog[];
}

