import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CompanyProfile,
  Customer,
  Item,
  Invoice,
  Payment,
  CreditNote,
  BackupData,
  CustomerLedgerEntry,
  AgeingBucket,
  RateWiseGSTSummary,
  AppUser,
  UserRole,
  UserPermissions,
  SyncLog,
  ActivityLog,
  SyncPackage
} from '../types';
import { OfflineStorage, DEFAULT_COMPANY, DEFAULT_USERS, getRoleDefaultPermissions } from '../db/storage';
import { formatInvoiceNumber, getFinancialYear, calculateInvoiceProfit, numberToWordsIndian } from '../utils/gstEngine';
import { createSyncPackage, mergeSyncPackage, SyncDiffResult } from '../utils/syncEngine';

export type AppView = 
  | 'dashboard'
  | 'invoices'
  | 'new-invoice'
  | 'customers'
  | 'items'
  | 'payments'
  | 'credit-notes'
  | 'reports'
  | 'settings'
  | 'backup'
  | 'admin-users'
  | 'salesman-portal'
  | 'staff-portal'
  | 'accountant-portal'
  | 'usb-sync';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface AppContextType {
  // Navigation & View
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  
  // Security / Lock / Auth
  currentUser: AppUser | null;
  users: AppUser[];
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  saveUser: (user: AppUser) => void;
  deleteUser: (userId: string) => boolean;
  updateUserPermissions: (userId: string, permissions: Partial<UserPermissions>) => void;
  hasPermission: (permissionKey: keyof UserPermissions) => boolean;
  isLocked: boolean;
  lockApp: () => void;
  unlockApp: (password: string) => boolean;
  
  // Audit & Sync
  syncLogs: SyncLog[];
  activityLogs: ActivityLog[];
  addActivityLog: (action: string, details: string, type?: ActivityLog['type']) => void;
  exportUSBSyncPackage: (deviceName?: string) => { filename: string; jsonString: string; packageData: SyncPackage };
  importUSBSyncPackage: (incomingJson: string) => { success: boolean; diff?: SyncDiffResult; error?: string };
  applyUSBSyncMerge: (diff: SyncDiffResult) => void;
  
  // Data entities
  company: CompanyProfile;
  customers: Customer[];
  items: Item[];
  invoices: Invoice[];
  payments: Payment[];
  creditNotes: CreditNote[];
  
  // Selected / Editing entities
  selectedInvoice: Invoice | null;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  editingInvoiceId: string | null;
  setEditingInvoiceId: (id: string | null) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  
  // Print preview modals
  printInvoice: Invoice | null;
  setPrintInvoice: (invoice: Invoice | null) => void;
  printFormat: 'A4' | 'THERMAL_3' | 'THERMAL_2';
  setPrintFormat: (format: 'A4' | 'THERMAL_3' | 'THERMAL_2') => void;
  
  // Entity CRUD Operations
  updateCompany: (company: Partial<CompanyProfile>) => void;
  saveCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => boolean;
  saveItem: (item: Item) => void;
  saveItemsBulk: (items: Item[]) => void;
  deleteItem: (id: string) => boolean;
  deleteItemsBulk: (ids: string[]) => boolean;
  
  // Invoicing Operations
  getNextInvoiceNumber: (customPrefix?: string) => { invoiceNumber: string; sequenceNumber: number; financialYear: string };
  saveInvoice: (invoice: Invoice, isNew: boolean) => void;
  convertEstimateToInvoice: (estimateId: string, targetType?: 'TAX_INVOICE' | 'BILL_OF_SUPPLY') => void;
  cancelInvoice: (id: string, reason: string) => void;
  deleteInvoice: (id: string) => void;
  deleteDraftInvoice: (id: string) => void;
  
  // Payments & Credit Notes
  recordPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => void;
  saveCreditNote: (creditNote: CreditNote) => void;
  
  // Analytics & Derived Helpers
  getCustomerLedger: (customerId: string) => CustomerLedgerEntry[];
  getCustomerAgeing: (customerId?: string) => AgeingBucket[];
  getRateWiseTaxSummary: (startDate?: string, endDate?: string) => RateWiseGSTSummary[];
  
  // Backup / Restore
  exportDatabase: () => void;
  importDatabase: (backup: BackupData) => boolean;
  resetDatabase: () => void;
  
  // Notifications
  toasts: ToastMessage[];
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<BackupData>(() => OfflineStorage.loadData());
  const [currentView, setCurrentView] = useState<AppView>('invoices');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  
  // User Authentication State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const savedUserId = OfflineStorage.getActiveUserSession();
    const users = data.users || DEFAULT_USERS;
    if (savedUserId) {
      const found = users.find(u => u.id === savedUserId && u.isActive);
      if (found) return found;
    }
    // Return null so everyone sees the login page first
    return null;
  });

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [printFormat, setPrintFormat] = useState<'A4' | 'THERMAL_3' | 'THERMAL_2'>('A4');
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persist whenever data changes
  useEffect(() => {
    OfflineStorage.saveData(data);
  }, [data]);

  const showToast = useCallback((type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addActivityLog = useCallback((action: string, details: string, type: ActivityLog['type'] = 'ADMIN') => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'usr-system',
      userName: currentUser?.name || 'System',
      action,
      details,
      type,
    };
    setData(prev => ({
      ...prev,
      activityLogs: [newLog, ...(prev.activityLogs || []).slice(0, 199)],
    }));
  }, [currentUser]);

  // Auth: Login
  const login = useCallback((username: string, password: string): { success: boolean; error?: string } => {
    const users = data.users || DEFAULT_USERS;
    const user = users.find(u => u.username.trim().toLowerCase() === username.trim().toLowerCase());
    
    if (!user) {
      return { success: false, error: 'Invalid User ID. Please check and try again.' };
    }
    if (!user.isActive) {
      return { success: false, error: 'This user account is deactivated. Contact Administrator.' };
    }
    if (user.passwordHash !== password.trim()) {
      return { success: false, error: 'Incorrect Password. Please try again.' };
    }

    const updatedUser: AppUser = {
      ...user,
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update last login in data
    setData(prev => ({
      ...prev,
      users: (prev.users || DEFAULT_USERS).map(u => (u.id === updatedUser.id ? updatedUser : u)),
    }));

    setCurrentUser(updatedUser);
    OfflineStorage.setActiveUserSession(updatedUser.id);
    setIsLocked(false);

    // Smart default view routing based on role
    if (updatedUser.role === 'SALESMAN') {
      setCurrentView('salesman-portal');
    } else if (updatedUser.role === 'ADMIN') {
      setCurrentView('dashboard');
    } else if (updatedUser.role === 'ACCOUNTANT') {
      setCurrentView('reports');
    } else {
      setCurrentView('invoices');
    }

    addActivityLog('User Logged In', `${updatedUser.name} (${updatedUser.role}) logged in successfully.`, 'AUTH');
    showToast('success', `Welcome, ${updatedUser.name}`, `Signed in as ${updatedUser.role}`);
    return { success: true };
  }, [data.users, addActivityLog, showToast]);

  // Auth: Logout
  const logout = useCallback(() => {
    if (currentUser) {
      addActivityLog('User Logged Out', `${currentUser.name} signed out.`, 'AUTH');
    }
    setCurrentUser(null);
    OfflineStorage.setActiveUserSession(null);
    setCurrentView('invoices');
    showToast('info', 'Logged Out', 'You have been safely signed out.');
  }, [currentUser, addActivityLog, showToast]);

  const switchUser = useCallback((userId: string) => {
    const users = data.users || DEFAULT_USERS;
    const target = users.find(u => u.id === userId);
    if (target && target.isActive) {
      setCurrentUser(target);
      OfflineStorage.setActiveUserSession(target.id);
      if (target.role === 'SALESMAN') setCurrentView('salesman-portal');
      else if (target.role === 'ADMIN') setCurrentView('dashboard');
      else if (target.role === 'ACCOUNTANT') setCurrentView('reports');
      else setCurrentView('invoices');
      showToast('info', 'Switched User', `Active session: ${target.name} (${target.role})`);
    }
  }, [data.users, showToast]);

  // User & Permission Management (Admin)
  const saveUser = useCallback((user: AppUser) => {
    setData(prev => {
      const currentUsers = prev.users || DEFAULT_USERS;
      const exists = currentUsers.some(u => u.id === user.id);
      let updatedUsers: AppUser[];
      if (exists) {
        updatedUsers = currentUsers.map(u => (u.id === user.id ? user : u));
      } else {
        updatedUsers = [...currentUsers, user];
      }
      return { ...prev, users: updatedUsers };
    });

    if (currentUser && currentUser.id === user.id) {
      setCurrentUser(user);
    }

    addActivityLog('Saved User Account', `User ${user.name} (@${user.username}) updated with role ${user.role}.`, 'ADMIN');
    showToast('success', 'User Account Saved', `${user.name} permissions and credentials updated.`);
  }, [currentUser, addActivityLog, showToast]);

  const deleteUser = useCallback((userId: string): boolean => {
    const currentUsers = data.users || DEFAULT_USERS;
    const target = currentUsers.find(u => u.id === userId);
    if (!target) return false;
    if (target.username === 'admin') {
      showToast('error', 'Cannot Delete Admin', 'The primary Administrator account cannot be deleted.');
      return false;
    }

    setData(prev => ({
      ...prev,
      users: (prev.users || DEFAULT_USERS).filter(u => u.id !== userId),
    }));

    addActivityLog('Deleted User Account', `Removed user ${target.name} (@${target.username}).`, 'ADMIN');
    showToast('info', 'User Removed', `${target.name} has been deleted.`);
    return true;
  }, [data.users, addActivityLog, showToast]);

  const updateUserPermissions = useCallback((userId: string, permissions: Partial<UserPermissions>) => {
    setData(prev => {
      const currentUsers = prev.users || DEFAULT_USERS;
      const updated = currentUsers.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            permissions: { ...u.permissions, ...permissions },
            updatedAt: new Date().toISOString(),
          };
        }
        return u;
      });
      return { ...prev, users: updated };
    });

    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, permissions: { ...prev.permissions, ...permissions } } : null);
    }

    addActivityLog('Updated Permissions', `Custom permissions applied for user ID ${userId}.`, 'ADMIN');
    showToast('success', 'Permissions Updated', 'User access rules applied.');
  }, [currentUser, addActivityLog, showToast]);

  const hasPermission = useCallback((permissionKey: keyof UserPermissions): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    return Boolean(currentUser.permissions?.[permissionKey]);
  }, [currentUser]);

  // USB Sync Engine Integration
  const exportUSBSyncPackage = useCallback((deviceName?: string) => {
    if (!currentUser) throw new Error('Must be logged in to sync');
    const syncResult = createSyncPackage(data, currentUser, deviceName);
    
    // Record sync log
    const log: SyncLog = {
      id: `synclog-${Date.now()}`,
      timestamp: new Date().toISOString(),
      direction: 'EXPORT',
      sourceDevice: syncResult.packageData.deviceName,
      userId: currentUser.id,
      userName: currentUser.name,
      invoicesCount: data.invoices.length,
      paymentsCount: data.payments.length,
      customersCount: data.customers.length,
      itemsCount: data.items.length,
      status: 'SUCCESS',
      details: `Generated USB sync bundle (${syncResult.filename})`,
    };

    setData(prev => ({
      ...prev,
      syncLogs: [log, ...(prev.syncLogs || []).slice(0, 49)],
    }));

    addActivityLog('USB Sync Exported', `Created sync package ${syncResult.filename}`, 'SYNC');
    return syncResult;
  }, [data, currentUser, addActivityLog]);

  const importUSBSyncPackage = useCallback((incomingJson: string): { success: boolean; diff?: SyncDiffResult; error?: string } => {
    if (!currentUser) return { success: false, error: 'Please log in first.' };
    try {
      const parsed: SyncPackage = JSON.parse(incomingJson);
      if (!parsed.syncId || !Array.isArray(parsed.invoices)) {
        return { success: false, error: 'Invalid GST Sync Package format.' };
      }

      const diff = mergeSyncPackage(data, parsed, currentUser);
      return { success: true, diff };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to parse sync bundle file.' };
    }
  }, [data, currentUser]);

  const applyUSBSyncMerge = useCallback((diff: SyncDiffResult) => {
    if (!currentUser) return;
    setData(diff.mergedData);
    OfflineStorage.saveData(diff.mergedData);

    const log: SyncLog = {
      id: `synclog-${Date.now()}`,
      timestamp: new Date().toISOString(),
      direction: 'IMPORT',
      sourceDevice: 'External USB/Phone',
      userId: currentUser.id,
      userName: currentUser.name,
      invoicesCount: diff.newInvoices.length + diff.updatedInvoices.length,
      paymentsCount: diff.newPayments.length,
      customersCount: diff.newCustomers.length + diff.updatedCustomers.length,
      itemsCount: diff.newItems.length,
      status: 'SUCCESS',
      details: diff.summary,
    };

    setData(prev => ({
      ...prev,
      syncLogs: [log, ...(prev.syncLogs || []).slice(0, 49)],
    }));

    addActivityLog('USB Sync Merged', diff.summary, 'SYNC');
    showToast('success', 'USB Sync Complete', diff.summary);
  }, [currentUser, addActivityLog, showToast]);

  const lockApp = useCallback(() => {
    if (data.company.isPasswordProtected && data.company.passwordHash) {
      setIsLocked(true);
      showToast('info', 'Session Locked', 'App has been locked. Enter your password to continue.');
    }
  }, [data.company.isPasswordProtected, data.company.passwordHash, showToast]);

  const unlockApp = useCallback((password: string): boolean => {
    if (!data.company.isPasswordProtected || !data.company.passwordHash) {
      setIsLocked(false);
      return true;
    }
    if (password === data.company.passwordHash || btoa(password) === data.company.passwordHash || (currentUser && password === currentUser.passwordHash)) {
      setIsLocked(false);
      showToast('success', 'Unlocked', 'Welcome back to GST Invoice Pro');
      return true;
    }
    return false;
  }, [data.company, currentUser, showToast]);


  const updateCompany = useCallback((updated: Partial<CompanyProfile>) => {
    setData(prev => ({
      ...prev,
      company: { ...prev.company, ...updated },
      exportedAt: new Date().toISOString(),
    }));
    showToast('success', 'Settings Saved', 'Company setup and preferences updated successfully.');
  }, [showToast]);

  const saveCustomer = useCallback((customer: Customer) => {
    setData(prev => {
      const exists = prev.customers.some(c => c.id === customer.id);
      let updatedCustomers: Customer[];
      if (exists) {
        updatedCustomers = prev.customers.map(c => (c.id === customer.id ? customer : c));
      } else {
        updatedCustomers = [customer, ...prev.customers];
      }
      return { ...prev, customers: updatedCustomers };
    });
    showToast('success', 'Customer Saved', `${customer.name} was successfully saved.`);
  }, [showToast]);

  const deleteCustomer = useCallback((id: string): boolean => {
    // Check if customer has invoices
    const hasInvoices = data.invoices.some(i => i.customerId === id);
    if (hasInvoices) {
      showToast('error', 'Cannot Delete', 'Customer has linked invoices. Archive or keep for GST compliance.');
      return false;
    }
    setData(prev => ({
      ...prev,
      customers: prev.customers.filter(c => c.id !== id),
    }));
    showToast('info', 'Customer Deleted', 'Customer master record removed.');
    return true;
  }, [data.invoices, showToast]);

  const saveItem = useCallback((item: Item) => {
    setData(prev => {
      const exists = prev.items.some(i => i.id === item.id);
      let updatedItems: Item[];
      if (exists) {
        updatedItems = prev.items.map(i => (i.id === item.id ? item : i));
      } else {
        updatedItems = [item, ...prev.items];
      }
      return { ...prev, items: updatedItems };
    });
    showToast('success', 'Item Saved', `${item.name} catalog record updated.`);
  }, [showToast]);

  const saveItemsBulk = useCallback((newOrUpdatedItems: Item[]) => {
    if (!newOrUpdatedItems.length) return;
    setData(prev => {
      const itemMap = new Map<string, Item>(prev.items.map(i => [i.id, i]));
      for (const it of newOrUpdatedItems) {
        itemMap.set(it.id, it);
      }
      return {
        ...prev,
        items: Array.from(itemMap.values()),
      };
    });
    showToast('success', 'Bulk Update Complete', `${newOrUpdatedItems.length} items saved to catalog successfully.`);
  }, [showToast]);

  const deleteItem = useCallback((id: string): boolean => {
    setData(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id),
    }));
    showToast('info', 'Item Removed', 'Product/Service removed from catalog.');
    return true;
  }, [showToast]);

  const deleteItemsBulk = useCallback((ids: string[]): boolean => {
    if (!ids.length) return false;
    const idSet = new Set(ids);
    setData(prev => ({
      ...prev,
      items: prev.items.filter(i => !idSet.has(i.id)),
    }));
    showToast('info', 'Bulk Items Removed', `${ids.length} items removed from catalog.`);
    return true;
  }, [showToast]);

  const getNextInvoiceNumber = useCallback((customPrefix?: string) => {
    const fyInfo = getFinancialYear();
    const sequenceNumber = data.company.nextInvoiceSequence || 1;
    const prefix = customPrefix || data.company.invoicePrefix || 'INV';
    const invoiceNumber = formatInvoiceNumber(
      prefix,
      sequenceNumber,
      fyInfo.fullFY,
      data.company.invoiceNumberingFormat,
      data.company.invoicePadding
    );
    return {
      invoiceNumber,
      sequenceNumber,
      financialYear: fyInfo.fullFY,
    };
  }, [data.company]);

  const saveInvoice = useCallback((invoice: Invoice, isNew: boolean) => {
    // Ensure profit calculations are populated
    const profitMetrics = calculateInvoiceProfit(invoice.items);
    const invoiceWithProfit: Invoice = {
      ...invoice,
      documentType: invoice.documentType || 'TAX_INVOICE',
      totalCost: profitMetrics.totalCost,
      grossProfit: profitMetrics.grossProfit,
      profitMarginPercent: profitMetrics.profitMarginPercent,
      updatedAt: new Date().toISOString(),
    };

    const isEstimate = invoiceWithProfit.documentType === 'ESTIMATE';

    setData(prev => {
      let updatedInvoices: Invoice[];
      let updatedCompany = { ...prev.company };
      let updatedItems = [...prev.items];
      let updatedCustomers = [...prev.customers];

      if (isNew) {
        updatedInvoices = [invoiceWithProfit, ...prev.invoices];
        // Advance gapless sequence if it matched the next expected number and not an estimate
        if (!isEstimate && invoiceWithProfit.sequenceNumber >= updatedCompany.nextInvoiceSequence) {
          updatedCompany.nextInvoiceSequence = invoiceWithProfit.sequenceNumber + 1;
        }

        // Deduct inventory stock for goods if not draft and not estimate
        if (invoiceWithProfit.status !== 'DRAFT' && !isEstimate) {
          invoiceWithProfit.items.forEach(invItem => {
            if (invItem.itemId) {
              const itemIdx = updatedItems.findIndex(i => i.id === invItem.itemId);
              if (itemIdx !== -1 && updatedItems[itemIdx].itemType === 'GOODS') {
                updatedItems[itemIdx] = {
                  ...updatedItems[itemIdx],
                  currentStock: updatedItems[itemIdx].currentStock - invItem.quantity,
                  updatedAt: new Date().toISOString(),
                };
              }
            }
          });
        }

        // Update customer balance if not fully paid and not draft/estimate
        if (invoiceWithProfit.balanceAmount > 0 && invoiceWithProfit.status !== 'DRAFT' && !isEstimate) {
          const custIdx = updatedCustomers.findIndex(c => c.id === invoiceWithProfit.customerId);
          if (custIdx !== -1) {
            updatedCustomers[custIdx] = {
              ...updatedCustomers[custIdx],
              currentBalance: updatedCustomers[custIdx].currentBalance + invoiceWithProfit.balanceAmount,
              updatedAt: new Date().toISOString(),
            };
          }
        }
      } else {
        // EDITING EXISTING INVOICE: Calculate stock and customer balance deltas
        const oldInv = prev.invoices.find(i => i.id === invoiceWithProfit.id);

        // 1. Revert previous deductions if old invoice was active & not estimate
        if (oldInv && oldInv.status !== 'DRAFT' && oldInv.documentType !== 'ESTIMATE') {
          oldInv.items.forEach(oldItem => {
            if (oldItem.itemId) {
              const itemIdx = updatedItems.findIndex(i => i.id === oldItem.itemId);
              if (itemIdx !== -1 && updatedItems[itemIdx].itemType === 'GOODS') {
                updatedItems[itemIdx] = {
                  ...updatedItems[itemIdx],
                  currentStock: updatedItems[itemIdx].currentStock + oldItem.quantity,
                  updatedAt: new Date().toISOString(),
                };
              }
            }
          });

          // Revert old balance
          if (oldInv.balanceAmount > 0) {
            const oldCustIdx = updatedCustomers.findIndex(c => c.id === oldInv.customerId);
            if (oldCustIdx !== -1) {
              updatedCustomers[oldCustIdx] = {
                ...updatedCustomers[oldCustIdx],
                currentBalance: Math.max(0, updatedCustomers[oldCustIdx].currentBalance - oldInv.balanceAmount),
                updatedAt: new Date().toISOString(),
              };
            }
          }
        }

        // 2. Apply new deductions if updated invoice is active & not estimate
        if (invoiceWithProfit.status !== 'DRAFT' && !isEstimate) {
          invoiceWithProfit.items.forEach(newItem => {
            if (newItem.itemId) {
              const itemIdx = updatedItems.findIndex(i => i.id === newItem.itemId);
              if (itemIdx !== -1 && updatedItems[itemIdx].itemType === 'GOODS') {
                updatedItems[itemIdx] = {
                  ...updatedItems[itemIdx],
                  currentStock: updatedItems[itemIdx].currentStock - newItem.quantity,
                  updatedAt: new Date().toISOString(),
                };
              }
            }
          });

          // Apply new balance
          if (invoiceWithProfit.balanceAmount > 0) {
            const custIdx = updatedCustomers.findIndex(c => c.id === invoiceWithProfit.customerId);
            if (custIdx !== -1) {
              updatedCustomers[custIdx] = {
                ...updatedCustomers[custIdx],
                currentBalance: updatedCustomers[custIdx].currentBalance + invoiceWithProfit.balanceAmount,
                updatedAt: new Date().toISOString(),
              };
            }
          }
        }

        updatedInvoices = prev.invoices.map(inv => (inv.id === invoiceWithProfit.id ? invoiceWithProfit : inv));
      }

      return {
        ...prev,
        invoices: updatedInvoices,
        company: updatedCompany,
        items: updatedItems,
        customers: updatedCustomers,
      };
    });

    const docName = invoiceWithProfit.documentType === 'ESTIMATE' 
      ? 'Quotation / Estimate' 
      : invoiceWithProfit.documentType === 'BILL_OF_SUPPLY' 
      ? 'Bill of Supply' 
      : 'Tax Invoice';

    if (isNew) {
      showToast('success', `${docName} Generated`, `${invoiceWithProfit.invoiceNumber} recorded successfully.`);
    } else {
      showToast('success', `${docName} Updated`, `${invoiceWithProfit.invoiceNumber} modifications saved.`);
    }
  }, [showToast]);

  const convertEstimateToInvoice = useCallback((estimateId: string, targetType: 'TAX_INVOICE' | 'BILL_OF_SUPPLY' = 'TAX_INVOICE') => {
    const estimate = data.invoices.find(i => i.id === estimateId);
    if (!estimate) {
      showToast('error', 'Estimate Not Found', 'Could not locate quotation to convert.');
      return;
    }

    const nextNum = getNextInvoiceNumber(targetType === 'BILL_OF_SUPPLY' ? 'BOS' : data.company.invoicePrefix);
    
    // Recalculate line items based on target doc type (e.g. if Bill of Supply, 0% tax)
    const convertedItems = estimate.items.map(item => {
      const isBOS = targetType === 'BILL_OF_SUPPLY';
      const effGstRate = isBOS ? 0 : item.gstRate;
      const cgstAmt = isBOS ? 0 : item.cgstAmount;
      const sgstAmt = isBOS ? 0 : item.sgstAmount;
      const igstAmt = isBOS ? 0 : item.igstAmount;
      const cessAmt = isBOS ? 0 : item.cessAmount;
      const totAmt = isBOS ? item.taxableAmount : item.totalAmount;
      return {
        ...item,
        gstRate: effGstRate,
        cgstRate: isBOS ? 0 : item.cgstRate,
        cgstAmount: cgstAmt,
        sgstRate: isBOS ? 0 : item.sgstRate,
        sgstAmount: sgstAmt,
        igstRate: isBOS ? 0 : item.igstRate,
        igstAmount: igstAmt,
        cessAmount: cessAmt,
        totalAmount: totAmt,
      };
    });

    const isBOS = targetType === 'BILL_OF_SUPPLY';
    const totalTaxable = estimate.totalTaxableAmount;
    const totalTax = isBOS ? 0 : estimate.totalTaxAmount;
    const subTotal = isBOS ? totalTaxable : estimate.subTotal;
    const netTotal = Math.round(subTotal);
    const roundOff = Number((netTotal - subTotal).toFixed(2));

    const convertedInvoice: Invoice = {
      ...estimate,
      id: `inv-${Date.now()}`,
      documentType: targetType,
      invoiceNumber: nextNum.invoiceNumber,
      sequenceNumber: nextNum.sequenceNumber,
      financialYear: nextNum.financialYear,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      items: convertedItems,
      totalTaxableAmount: totalTaxable,
      totalCgstAmount: isBOS ? 0 : estimate.totalCgstAmount,
      totalSgstAmount: isBOS ? 0 : estimate.totalSgstAmount,
      totalIgstAmount: isBOS ? 0 : estimate.totalIgstAmount,
      totalCessAmount: isBOS ? 0 : estimate.totalCessAmount,
      totalTaxAmount: totalTax,
      subTotal,
      roundOff,
      netTotal,
      netTotalInWords: numberToWordsIndian(netTotal),
      paidAmount: 0,
      balanceAmount: netTotal,
      status: 'ISSUED',
      isConvertedFromEstimate: true,
      originalEstimateNumber: estimate.invoiceNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveInvoice(convertedInvoice, true);
    showToast('success', 'Quotation Converted', `Estimate ${estimate.invoiceNumber} converted to ${targetType === 'BILL_OF_SUPPLY' ? 'Bill of Supply' : 'Tax Invoice'} ${convertedInvoice.invoiceNumber}`);
  }, [data.invoices, data.company.invoicePrefix, getNextInvoiceNumber, saveInvoice, showToast]);

  const cancelInvoice = useCallback((id: string, reason: string) => {
    setData(prev => {
      const targetInv = prev.invoices.find(i => i.id === id);
      if (!targetInv) return prev;

      // Restore inventory stock
      const updatedItems = [...prev.items];
      targetInv.items.forEach(invItem => {
        if (invItem.itemId) {
          const itemIdx = updatedItems.findIndex(i => i.id === invItem.itemId);
          if (itemIdx !== -1 && updatedItems[itemIdx].itemType === 'GOODS') {
            updatedItems[itemIdx] = {
              ...updatedItems[itemIdx],
              currentStock: updatedItems[itemIdx].currentStock + invItem.quantity,
              updatedAt: new Date().toISOString(),
            };
          }
        }
      });

      // Adjust customer balance
      const updatedCustomers = [...prev.customers];
      const custIdx = updatedCustomers.findIndex(c => c.id === targetInv.customerId);
      if (custIdx !== -1 && targetInv.balanceAmount > 0) {
        updatedCustomers[custIdx] = {
          ...updatedCustomers[custIdx],
          currentBalance: Math.max(0, updatedCustomers[custIdx].currentBalance - targetInv.balanceAmount),
          updatedAt: new Date().toISOString(),
        };
      }

      const updatedInvoices = prev.invoices.map(inv => {
        if (inv.id === id) {
          return {
            ...inv,
            status: 'CANCELLED' as const,
            cancellationReason: reason,
            cancelledAt: new Date().toISOString(),
            balanceAmount: 0,
            updatedAt: new Date().toISOString(),
          };
        }
        return inv;
      });

      return {
        ...prev,
        invoices: updatedInvoices,
        items: updatedItems,
        customers: updatedCustomers,
      };
    });

    showToast('warning', 'Invoice Cancelled', `Invoice was soft-cancelled. Gapless audit sequence preserved for GST returns.`);
  }, [showToast]);

  const deleteDraftInvoice = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      invoices: prev.invoices.filter(i => i.id !== id),
    }));
    showToast('info', 'Draft Removed', 'Draft invoice deleted.');
  }, [showToast]);

  const deleteInvoice = useCallback((id: string) => {
    let deletedDocName = 'Document';
    let deletedDocNum = '';

    setData(prev => {
      const targetInv = prev.invoices.find(i => i.id === id);
      if (!targetInv) return prev;

      deletedDocNum = targetInv.invoiceNumber;
      deletedDocName = targetInv.documentType === 'ESTIMATE'
        ? 'Quotation'
        : targetInv.documentType === 'BILL_OF_SUPPLY'
        ? 'Bill of Supply'
        : 'Tax Invoice';

      let updatedItems = [...prev.items];
      let updatedCustomers = [...prev.customers];

      // If active and not an estimate/draft/cancelled, restore inventory stock and customer balance
      if (targetInv.status !== 'CANCELLED' && targetInv.status !== 'DRAFT' && targetInv.documentType !== 'ESTIMATE') {
        // Restore stock for goods
        targetInv.items.forEach(invItem => {
          if (invItem.itemId) {
            const itemIdx = updatedItems.findIndex(i => i.id === invItem.itemId);
            if (itemIdx !== -1 && updatedItems[itemIdx].itemType === 'GOODS') {
              updatedItems[itemIdx] = {
                ...updatedItems[itemIdx],
                currentStock: updatedItems[itemIdx].currentStock + invItem.quantity,
                updatedAt: new Date().toISOString(),
              };
            }
          }
        });

        // Revert unpaid balance from customer
        if (targetInv.balanceAmount > 0) {
          const custIdx = updatedCustomers.findIndex(c => c.id === targetInv.customerId);
          if (custIdx !== -1) {
            updatedCustomers[custIdx] = {
              ...updatedCustomers[custIdx],
              currentBalance: Math.max(0, updatedCustomers[custIdx].currentBalance - targetInv.balanceAmount),
              updatedAt: new Date().toISOString(),
            };
          }
        }
      }

      // Filter out payments directly attached to this invoice
      const updatedPayments = prev.payments ? prev.payments.filter(p => p.invoiceId !== id) : [];

      return {
        ...prev,
        invoices: prev.invoices.filter(i => i.id !== id),
        payments: updatedPayments,
        items: updatedItems,
        customers: updatedCustomers,
      };
    });

    showToast('info', `${deletedDocName} Deleted`, `${deletedDocNum || 'Invoice'} deleted from records and stock/balances reconciled.`);
  }, [showToast]);

  const recordPayment = useCallback((paymentData: Omit<Payment, 'id' | 'createdAt'>) => {
    const paymentId = `pay-${Date.now()}`;
    const newPayment: Payment = {
      ...paymentData,
      id: paymentId,
      createdAt: new Date().toISOString(),
    };

    setData(prev => {
      let updatedInvoices = [...prev.invoices];
      let updatedCustomers = [...prev.customers];

      // Settle invoice if linked
      if (newPayment.invoiceId) {
        updatedInvoices = updatedInvoices.map(inv => {
          if (inv.id === newPayment.invoiceId) {
            const newPaid = Number((inv.paidAmount + newPayment.amount).toFixed(2));
            const newBalance = Math.max(0, Number((inv.netTotal - newPaid).toFixed(2)));
            return {
              ...inv,
              paidAmount: newPaid,
              balanceAmount: newBalance,
              status: newBalance === 0 ? 'PAID' : ('PARTIAL' as const),
              updatedAt: new Date().toISOString(),
            };
          }
          return inv;
        });
      }

      // Reduce customer receivable balance
      const custIdx = updatedCustomers.findIndex(c => c.id === newPayment.customerId);
      if (custIdx !== -1) {
        updatedCustomers[custIdx] = {
          ...updatedCustomers[custIdx],
          currentBalance: Math.max(0, Number((updatedCustomers[custIdx].currentBalance - newPayment.amount).toFixed(2))),
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        ...prev,
        payments: [newPayment, ...prev.payments],
        invoices: updatedInvoices,
        customers: updatedCustomers,
      };
    });

    showToast('success', 'Payment Recorded', `Received ₹${newPayment.amount.toLocaleString('en-IN')} via ${newPayment.paymentMode}`);
  }, [showToast]);

  const saveCreditNote = useCallback((creditNote: CreditNote) => {
    setData(prev => {
      const updatedCreditNotes = [creditNote, ...prev.creditNotes];
      const updatedCustomers = [...prev.customers];

      // Reduce customer balance by credit note value
      const custIdx = updatedCustomers.findIndex(c => c.id === creditNote.customerId);
      if (custIdx !== -1) {
        updatedCustomers[custIdx] = {
          ...updatedCustomers[custIdx],
          currentBalance: Math.max(0, Number((updatedCustomers[custIdx].currentBalance - creditNote.netTotal).toFixed(2))),
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        ...prev,
        creditNotes: updatedCreditNotes,
        customers: updatedCustomers,
      };
    });

    showToast('success', 'Credit Note Issued', `Credit note ${creditNote.creditNoteNumber} registered against invoice.`);
  }, [showToast]);

  // Derived Customer Ledger statement
  const getCustomerLedger = useCallback((customerId: string): CustomerLedgerEntry[] => {
    const customer = data.customers.find(c => c.id === customerId);
    if (!customer) return [];

    const entries: Array<{
      date: string;
      type: 'INVOICE' | 'PAYMENT' | 'CREDIT_NOTE' | 'OPENING_BALANCE';
      referenceNo: string;
      description: string;
      debit: number;
      credit: number;
      id: string;
    }> = [];

    // Opening Balance
    if (customer.openingBalance > 0) {
      entries.push({
        id: 'ob-1',
        date: customer.createdAt.split('T')[0],
        type: 'OPENING_BALANCE',
        referenceNo: 'OB',
        description: 'Opening Balance (Receivable)',
        debit: customer.openingBalance,
        credit: 0,
      });
    }

    // Invoices for customer
    data.invoices
      .filter(inv => inv.customerId === customerId && inv.status !== 'CANCELLED' && inv.status !== 'DRAFT')
      .forEach(inv => {
        entries.push({
          id: inv.id,
          date: inv.invoiceDate,
          type: 'INVOICE',
          referenceNo: inv.invoiceNumber,
          description: `Tax Invoice (${inv.items.length} items)`,
          debit: inv.netTotal,
          credit: 0,
        });
      });

    // Payments
    data.payments
      .filter(p => p.customerId === customerId)
      .forEach(p => {
        entries.push({
          id: p.id,
          date: p.paymentDate,
          type: 'PAYMENT',
          referenceNo: p.referenceNumber || p.paymentMode,
          description: `Payment Received (${p.paymentMode})`,
          debit: 0,
          credit: p.amount,
        });
      });

    // Credit Notes
    data.creditNotes
      .filter(cn => cn.customerId === customerId)
      .forEach(cn => {
        entries.push({
          id: cn.id,
          date: cn.creditNoteDate,
          type: 'CREDIT_NOTE',
          referenceNo: cn.creditNoteNumber,
          description: `Credit Note - ${cn.reason}`,
          debit: 0,
          credit: cn.netTotal,
        });
      });

    // Sort chronologically
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let running = 0;
    return entries.map(entry => {
      running += entry.debit - entry.credit;
      return {
        ...entry,
        balance: Number(running.toFixed(2)),
      };
    });
  }, [data.customers, data.invoices, data.payments, data.creditNotes]);

  // Customer Ageing Analysis
  const getCustomerAgeing = useCallback((customerId?: string): AgeingBucket[] => {
    const today = new Date();
    const buckets: Record<string, { amount: number; count: number }> = {
      '0-30 Days': { amount: 0, count: 0 },
      '31-60 Days': { amount: 0, count: 0 },
      '61-90 Days': { amount: 0, count: 0 },
      '90+ Days': { amount: 0, count: 0 },
    };

    const targetInvoices = data.invoices.filter(inv => {
      if (inv.status === 'CANCELLED' || inv.status === 'DRAFT' || inv.balanceAmount <= 0) return false;
      if (customerId && inv.customerId !== customerId) return false;
      return true;
    });

    targetInvoices.forEach(inv => {
      const invDate = new Date(inv.invoiceDate);
      const diffTime = Math.abs(today.getTime() - invDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) {
        buckets['0-30 Days'].amount += inv.balanceAmount;
        buckets['0-30 Days'].count += 1;
      } else if (diffDays <= 60) {
        buckets['31-60 Days'].amount += inv.balanceAmount;
        buckets['31-60 Days'].count += 1;
      } else if (diffDays <= 90) {
        buckets['61-90 Days'].amount += inv.balanceAmount;
        buckets['61-90 Days'].count += 1;
      } else {
        buckets['90+ Days'].amount += inv.balanceAmount;
        buckets['90+ Days'].count += 1;
      }
    });

    return Object.entries(buckets).map(([period, val]) => ({
      period,
      amount: Number(val.amount.toFixed(2)),
      invoicesCount: val.count,
    }));
  }, [data.invoices]);

  // GST Rate-wise Output Tax Summary
  const getRateWiseTaxSummary = useCallback((startDate?: string, endDate?: string): RateWiseGSTSummary[] => {
    const rateMap: Record<number, {
      taxable: number;
      cgst: number;
      sgst: number;
      igst: number;
      cess: number;
    }> = {
      0: { taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
      5: { taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
      12: { taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
      18: { taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
      28: { taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 },
    };

    data.invoices
      .filter(inv => {
        if (inv.status === 'CANCELLED' || inv.status === 'DRAFT') return false;
        if (startDate && inv.invoiceDate < startDate) return false;
        if (endDate && inv.invoiceDate > endDate) return false;
        return true;
      })
      .forEach(inv => {
        inv.items.forEach(item => {
          const r = item.gstRate;
          if (!rateMap[r]) {
            rateMap[r] = { taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 };
          }
          rateMap[r].taxable += item.taxableAmount;
          rateMap[r].cgst += item.cgstAmount;
          rateMap[r].sgst += item.sgstAmount;
          rateMap[r].igst += item.igstAmount;
          rateMap[r].cess += item.cessAmount;
        });
      });

    return Object.entries(rateMap).map(([rateStr, v]) => {
      const rate = Number(rateStr);
      const totalTax = v.cgst + v.sgst + v.igst + v.cess;
      return {
        gstRate: rate,
        taxableAmount: Number(v.taxable.toFixed(2)),
        cgstAmount: Number(v.cgst.toFixed(2)),
        sgstAmount: Number(v.sgst.toFixed(2)),
        igstAmount: Number(v.igst.toFixed(2)),
        cessAmount: Number(v.cess.toFixed(2)),
        totalTax: Number(totalTax.toFixed(2)),
        totalAmount: Number((v.taxable + totalTax).toFixed(2)),
      };
    });
  }, [data.invoices]);

  const exportDatabase = useCallback(() => {
    const backupJson = OfflineStorage.exportJSON(data);
    const dateStr = new Date().toISOString().split('T')[0];
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GST_Invoice_Pro_Backup_${data.company.gstin || 'Data'}_${dateStr}.gstbackup`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('success', 'Backup Exported', 'Full offline database JSON backup generated.');
  }, [data, showToast]);

  const importDatabase = useCallback((backup: BackupData): boolean => {
    if (!backup || !backup.company || !Array.isArray(backup.customers) || !Array.isArray(backup.invoices)) {
      showToast('error', 'Import Failed', 'Invalid backup file structure.');
      return false;
    }
    setData(backup);
    OfflineStorage.saveData(backup);
    showToast('success', 'Database Restored', 'All invoices, customers, items, and company masters restored.');
    return true;
  }, [showToast]);

  const resetDatabase = useCallback(() => {
    const fresh = OfflineStorage.resetToFactoryDefaults();
    setData(fresh);
    showToast('info', 'Factory Reset', 'Database reset to default sample business data.');
  }, [showToast]);

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        currentUser,
        users: data.users || DEFAULT_USERS,
        login,
        logout,
        switchUser,
        saveUser,
        deleteUser,
        updateUserPermissions,
        hasPermission,
        isLocked,
        lockApp,
        unlockApp,
        syncLogs: data.syncLogs || [],
        activityLogs: data.activityLogs || [],
        addActivityLog,
        exportUSBSyncPackage,
        importUSBSyncPackage,
        applyUSBSyncMerge,
        company: data.company,
        customers: data.customers,
        items: data.items,
        invoices: data.invoices,
        payments: data.payments,
        creditNotes: data.creditNotes,
        selectedInvoice,
        setSelectedInvoice,
        editingInvoiceId,
        setEditingInvoiceId,
        selectedCustomer,
        setSelectedCustomer,
        printInvoice,
        setPrintInvoice,
        printFormat,
        setPrintFormat,
        updateCompany,
        saveCustomer,
        deleteCustomer,
        saveItem,
        saveItemsBulk,
        deleteItem,
        deleteItemsBulk,
        getNextInvoiceNumber,
        saveInvoice,
        convertEstimateToInvoice,
        cancelInvoice,
        deleteInvoice,
        deleteDraftInvoice,
        recordPayment,
        saveCreditNote,
        getCustomerLedger,
        getCustomerAgeing,
        getRateWiseTaxSummary,
        exportDatabase,
        importDatabase,
        resetDatabase,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
