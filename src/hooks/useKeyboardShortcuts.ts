import { useEffect } from 'react';
import { useApp, AppView } from '../context/AppContext';

export interface ShortcutItem {
  id: string;
  category: 'Billing' | 'Navigation' | 'Actions' | 'General';
  keys: string[];
  description: string;
  actionName: string;
}

export const SHORTCUTS_LIST: ShortcutItem[] = [
  // Billing & Invoicing
  {
    id: 'new-invoice',
    category: 'Billing',
    keys: ['Ctrl', 'N'],
    description: 'Create New Tax Invoice',
    actionName: 'Opens clean invoice billing screen with next FY sequence number',
  },
  {
    id: 'save-invoice',
    category: 'Billing',
    keys: ['Ctrl', 'S'],
    description: 'Issue & Save Tax Invoice (A4)',
    actionName: 'Validates and saves invoice, calculates taxes and updates stock',
  },
  {
    id: 'save-draft',
    category: 'Billing',
    keys: ['Ctrl', 'Shift', 'S'],
    description: 'Save as Draft',
    actionName: 'Saves work-in-progress draft without incrementing invoice number',
  },
  {
    id: 'pos-print',
    category: 'Billing',
    keys: ['Ctrl', 'P'],
    description: 'Issue & POS Thermal Print',
    actionName: 'Saves invoice and immediately opens 3" / 2" thermal receipt',
  },
  {
    id: 'add-item-row',
    category: 'Billing',
    keys: ['Alt', 'A'],
    description: 'Add Line Item Row',
    actionName: 'Appends a new product/service item line to the current invoice',
  },
  {
    id: 'fast-walkin',
    category: 'Billing',
    keys: ['Alt', 'W'],
    description: '⚡ Fast Walk-In Customer Fill',
    actionName: 'Instantly populates local cash counter customer & local POS state',
  },

  // Navigation
  {
    id: 'nav-dashboard',
    category: 'Navigation',
    keys: ['Alt', '1'],
    description: 'Go to Dashboard',
    actionName: 'Overview, sales KPI metrics, receivables and low stock alerts',
  },
  {
    id: 'nav-invoices',
    category: 'Navigation',
    keys: ['Alt', '2'],
    description: 'Go to Invoices Register',
    actionName: 'List of all issued tax invoices, payment statuses and actions',
  },
  {
    id: 'nav-customers',
    category: 'Navigation',
    keys: ['Alt', '3'],
    description: 'Go to Customers Directory',
    actionName: 'Manage GSTIN registered and consumer client directory',
  },
  {
    id: 'nav-items',
    category: 'Navigation',
    keys: ['Alt', '4'],
    description: 'Go to Items & HSN Catalog',
    actionName: 'Products, services, stock inventory and HSN tax slabs',
  },
  {
    id: 'nav-payments',
    category: 'Navigation',
    keys: ['Alt', '5'],
    description: 'Go to Payments & Ledger',
    actionName: 'Payment receipts, customer debit/credit statements & ageing',
  },
  {
    id: 'nav-reports',
    category: 'Navigation',
    keys: ['Alt', '6'],
    description: 'Go to GSTR Reports',
    actionName: 'GSTR-1 JSON/CSV portal export and GSTR-3B Table 3.1 summaries',
  },
  {
    id: 'nav-backup',
    category: 'Navigation',
    keys: ['Alt', '7'],
    description: 'Go to Backup & Database',
    actionName: 'Download offline JSON snapshot or view SQLite DDL schema',
  },
  {
    id: 'nav-company',
    category: 'Navigation',
    keys: ['Alt', '8'],
    description: 'Go to Company Settings',
    actionName: 'GSTIN, trade name, address, bank particulars and FY series',
  },

  // General & Overlays
  {
    id: 'open-shortcuts',
    category: 'General',
    keys: ['Ctrl', '/'],
    description: 'Toggle Keyboard Shortcuts Cheatsheet',
    actionName: 'Shows interactive hotkeys modal for fast power-user lookup',
  },
  {
    id: 'open-shortcuts-f1',
    category: 'General',
    keys: ['F1'],
    description: 'Help & Shortcuts Cheatsheet',
    actionName: 'Alternative key to open this keyboard guide',
  },
  {
    id: 'escape',
    category: 'General',
    keys: ['Esc'],
    description: 'Close Modal / Cancel Action',
    actionName: 'Dismisses open dialogs, print previews, or returns to invoice list',
  },
];

interface UseShortcutsProps {
  onToggleShortcutsModal: () => void;
  isShortcutsModalOpen: boolean;
  onCloseModals: () => void;
}

export const useKeyboardShortcuts = ({
  onToggleShortcutsModal,
  isShortcutsModalOpen,
  onCloseModals,
}: UseShortcutsProps) => {
  const { 
    currentView, 
    setCurrentView, 
    setEditingInvoiceId,
    showToast,
    printInvoice,
    setPrintInvoice 
  } = useApp();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;
      const isShift = e.shiftKey;
      const key = e.key;
      const lowerKey = key.toLowerCase();

      const activeElement = document.activeElement as HTMLElement | null;
      const isInputFocused = 
        activeElement && 
        (activeElement.tagName === 'INPUT' || 
         activeElement.tagName === 'TEXTAREA' || 
         activeElement.tagName === 'SELECT' || 
         activeElement.isContentEditable);

      // 1. ESCAPE key: Close modals or cancel
      if (key === 'Escape') {
        if (isShortcutsModalOpen) {
          e.preventDefault();
          onCloseModals();
          return;
        }
        if (printInvoice) {
          e.preventDefault();
          setPrintInvoice(null);
          return;
        }
        if (currentView === 'new-invoice') {
          // If in invoice editor, trigger exit event or return to invoices
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('gst:invoice-escape'));
          return;
        }
      }

      // 2. SHORTCUTS CHEATSHEET: Ctrl + / or F1 or Shift + ? (when not inside typing input)
      if ((isCtrlOrCmd && (key === '/' || key === '?')) || key === 'F1') {
        e.preventDefault();
        onToggleShortcutsModal();
        return;
      }

      if (!isCtrlOrCmd && !isAlt && !isShift && key === '?' && !isInputFocused) {
        e.preventDefault();
        onToggleShortcutsModal();
        return;
      }

      // 3. CREATE NEW INVOICE: Ctrl + N or Alt + N
      if ((isCtrlOrCmd && lowerKey === 'n' && !isShift) || (isAlt && lowerKey === 'n')) {
        e.preventDefault();
        setEditingInvoiceId(null);
        setCurrentView('new-invoice');
        showToast('info', 'New Tax Invoice', 'Loaded blank invoice with next sequential FY number.');
        return;
      }

      // 4. INVOICE ACTIONS (Ctrl+S, Ctrl+Shift+S, Ctrl+P, Alt+A, Alt+W)
      if (currentView === 'new-invoice') {
        // Save & Issue Invoice: Ctrl + S (or Alt + S)
        if ((isCtrlOrCmd && lowerKey === 's' && !isShift) || (isAlt && lowerKey === 's')) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('gst:save-invoice', { detail: { format: 'A4' } }));
          return;
        }

        // Save Draft: Ctrl + Shift + S
        if (isCtrlOrCmd && isShift && lowerKey === 's') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('gst:save-draft'));
          return;
        }

        // Issue & POS Thermal Print: Ctrl + P (or Alt + P)
        if ((isCtrlOrCmd && lowerKey === 'p' && !isShift) || (isAlt && lowerKey === 'p')) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('gst:save-invoice', { detail: { format: 'THERMAL_3' } }));
          return;
        }

        // Add Item Row: Alt + A or Ctrl + I
        if ((isAlt && lowerKey === 'a') || (isCtrlOrCmd && lowerKey === 'i')) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('gst:add-line-item'));
          return;
        }

        // Fast Walk-in Customer: Alt + W
        if (isAlt && lowerKey === 'w') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('gst:walkin-customer'));
          return;
        }
      }

      // 5. NAVIGATION SHORTCUTS: Alt + 1..8 or Ctrl + Shift + D/L/C/I/P/R/B
      if (isAlt && !isCtrlOrCmd && !isShift) {
        switch (key) {
          case '1':
            e.preventDefault();
            setCurrentView('dashboard');
            return;
          case '2':
            e.preventDefault();
            setCurrentView('invoices');
            return;
          case '3':
            e.preventDefault();
            setCurrentView('customers');
            return;
          case '4':
            e.preventDefault();
            setCurrentView('items');
            return;
          case '5':
            e.preventDefault();
            setCurrentView('payments');
            return;
          case '6':
            e.preventDefault();
            setCurrentView('reports');
            return;
          case '7':
            e.preventDefault();
            setCurrentView('backup');
            return;
          case '8':
            e.preventDefault();
            setCurrentView('settings');
            return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [currentView, isShortcutsModalOpen, printInvoice, setCurrentView, setEditingInvoiceId, setPrintInvoice, showToast, onToggleShortcutsModal, onCloseModals]);
};
