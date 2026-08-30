import { BackupData, SyncPackage, Invoice, Customer, Item, Payment, CreditNote, SyncLog, AppUser } from '../types';

export interface SyncDiffResult {
  newInvoices: Invoice[];
  updatedInvoices: Invoice[];
  newCustomers: Customer[];
  updatedCustomers: Customer[];
  newItems: Item[];
  updatedItems: Item[];
  newPayments: Payment[];
  newCreditNotes: CreditNote[];
  mergedData: BackupData;
  summary: string;
}

/**
 * Generate a simple hash checksum for payload verification
 */
function generateChecksum(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Create a portable USB / Local Sync Bundle
 */
export function createSyncPackage(data: BackupData, currentUser: AppUser, deviceName?: string): { packageData: SyncPackage; filename: string; jsonString: string } {
  const syncId = `SYNC-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const now = new Date().toISOString();
  
  // Detect current platform/device
  const detectedDevice = deviceName || (typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent) ? 'Android Phone' : 'Windows/Mac PC');

  const payload: Omit<SyncPackage, 'checksum'> = {
    syncId,
    version: '2.0.0',
    deviceId: `DEV-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    deviceName: detectedDevice,
    exportedAt: now,
    exportedByUserId: currentUser.id,
    exportedByUserName: currentUser.name,
    invoices: data.invoices,
    payments: data.payments,
    customers: data.customers,
    items: data.items,
    creditNotes: data.creditNotes || [],
  };

  const rawJson = JSON.stringify(payload);
  const checksum = generateChecksum(rawJson);

  const fullPackage: SyncPackage = {
    ...payload,
    checksum,
  };

  const jsonString = JSON.stringify(fullPackage, null, 2);
  const dateStr = now.split('T')[0];
  const filename = `GST_SYNC_${currentUser.username}_${dateStr}_${syncId.substring(5)}.gstsync`;

  return { packageData: fullPackage, filename, jsonString };
}

/**
 * Smart 2-Way Merge of Remote Sync Package into Local State
 */
export function mergeSyncPackage(currentData: BackupData, incomingPackage: SyncPackage, currentUser: AppUser): SyncDiffResult {
  const result: SyncDiffResult = {
    newInvoices: [],
    updatedInvoices: [],
    newCustomers: [],
    updatedCustomers: [],
    newItems: [],
    updatedItems: [],
    newPayments: [],
    newCreditNotes: [],
    mergedData: { ...currentData },
    summary: '',
  };

  // 1. Merge Invoices
  const localInvoiceMap = new Map<string, Invoice>();
  const localInvoiceNumMap = new Map<string, Invoice>();
  currentData.invoices.forEach(inv => {
    localInvoiceMap.set(inv.id, inv);
    localInvoiceNumMap.set(inv.invoiceNumber, inv);
  });

  const mergedInvoices = [...currentData.invoices];

  (incomingPackage.invoices || []).forEach(remoteInv => {
    const existingById = localInvoiceMap.get(remoteInv.id);
    const existingByNum = localInvoiceNumMap.get(remoteInv.invoiceNumber);

    if (!existingById && !existingByNum) {
      // Completely new invoice from other device
      mergedInvoices.push(remoteInv);
      result.newInvoices.push(remoteInv);
    } else if (existingById) {
      // Exists by ID: check timestamps
      const localTime = new Date(existingById.updatedAt || existingById.createdAt).getTime();
      const remoteTime = new Date(remoteInv.updatedAt || remoteInv.createdAt).getTime();
      if (remoteTime > localTime) {
        const index = mergedInvoices.findIndex(i => i.id === remoteInv.id);
        if (index >= 0) {
          mergedInvoices[index] = remoteInv;
          result.updatedInvoices.push(remoteInv);
        }
      }
    }
  });

  // 2. Merge Customers
  const localCustMap = new Map<string, Customer>();
  const localCustPhoneMap = new Map<string, Customer>();
  currentData.customers.forEach(c => {
    localCustMap.set(c.id, c);
    if (c.phone) localCustPhoneMap.set(c.phone, c);
  });

  const mergedCustomers = [...currentData.customers];
  (incomingPackage.customers || []).forEach(remoteCust => {
    const existing = localCustMap.get(remoteCust.id) || (remoteCust.phone ? localCustPhoneMap.get(remoteCust.phone) : undefined);
    if (!existing) {
      mergedCustomers.push(remoteCust);
      result.newCustomers.push(remoteCust);
    } else {
      const localTime = new Date(existing.updatedAt || existing.createdAt).getTime();
      const remoteTime = new Date(remoteCust.updatedAt || remoteCust.createdAt).getTime();
      if (remoteTime > localTime) {
        const idx = mergedCustomers.findIndex(c => c.id === existing.id);
        if (idx >= 0) {
          mergedCustomers[idx] = { ...existing, ...remoteCust, id: existing.id };
          result.updatedCustomers.push(mergedCustomers[idx]);
        }
      }
    }
  });

  // 3. Merge Items Catalog & Stock
  const localItemMap = new Map<string, Item>();
  const localItemCodeMap = new Map<string, Item>();
  currentData.items.forEach(it => {
    localItemMap.set(it.id, it);
    if (it.itemCode) localItemCodeMap.set(it.itemCode, it);
  });

  const mergedItems = [...currentData.items];
  (incomingPackage.items || []).forEach(remoteItem => {
    const existing = localItemMap.get(remoteItem.id) || (remoteItem.itemCode ? localItemCodeMap.get(remoteItem.itemCode) : undefined);
    if (!existing) {
      mergedItems.push(remoteItem);
      result.newItems.push(remoteItem);
    } else {
      const localTime = new Date(existing.updatedAt || existing.createdAt).getTime();
      const remoteTime = new Date(remoteItem.updatedAt || remoteItem.createdAt).getTime();
      if (remoteTime > localTime) {
        const idx = mergedItems.findIndex(i => i.id === existing.id);
        if (idx >= 0) {
          mergedItems[idx] = { ...existing, ...remoteItem, id: existing.id };
          result.updatedItems.push(mergedItems[idx]);
        }
      }
    }
  });

  // 4. Merge Payments
  const localPayMap = new Set(currentData.payments.map(p => p.id));
  const mergedPayments = [...currentData.payments];
  (incomingPackage.payments || []).forEach(remotePay => {
    if (!localPayMap.has(remotePay.id)) {
      mergedPayments.push(remotePay);
      result.newPayments.push(remotePay);
    }
  });

  // 5. Merge Credit Notes
  const localCNMap = new Set((currentData.creditNotes || []).map(cn => cn.id));
  const mergedCreditNotes = [...(currentData.creditNotes || [])];
  (incomingPackage.creditNotes || []).forEach(remoteCN => {
    if (!localCNMap.has(remoteCN.id)) {
      mergedCreditNotes.push(remoteCN);
      result.newCreditNotes.push(remoteCN);
    }
  });

  // Summary generation
  const summaryParts: string[] = [];
  if (result.newInvoices.length > 0) summaryParts.push(`+${result.newInvoices.length} New Invoices`);
  if (result.updatedInvoices.length > 0) summaryParts.push(`${result.updatedInvoices.length} Invoices Updated`);
  if (result.newPayments.length > 0) summaryParts.push(`+${result.newPayments.length} Payments`);
  if (result.newCustomers.length > 0) summaryParts.push(`+${result.newCustomers.length} Customers`);
  if (result.newItems.length > 0) summaryParts.push(`+${result.newItems.length} Items`);

  result.summary = summaryParts.length > 0 ? summaryParts.join(', ') : 'All records are already up-to-date.';

  // Build merged data
  result.mergedData = {
    ...currentData,
    invoices: mergedInvoices,
    customers: mergedCustomers,
    items: mergedItems,
    payments: mergedPayments,
    creditNotes: mergedCreditNotes,
    exportedAt: new Date().toISOString(),
  };

  return result;
}
