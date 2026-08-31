/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { MobileNav } from './components/common/MobileNav';
import { ShortcutsModal } from './components/common/ShortcutsModal';
import { WindowsAppModal } from './components/common/WindowsAppModal';
import { AndroidAppModal } from './components/common/AndroidAppModal';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginScreen } from './components/auth/LoginScreen';
import { AdminUsersView } from './components/admin/AdminUsersView';
import { SalesmanPortal } from './components/users/SalesmanPortal';
import { StaffPortal } from './components/users/StaffPortal';
import { AccountantPortal } from './components/users/AccountantPortal';
import { USBSyncView } from './components/sync/USBSyncView';
import { Dashboard } from './components/dashboard/Dashboard';
import { InvoiceEditor } from './components/invoicing/InvoiceEditor';
import { InvoiceList } from './components/invoicing/InvoiceList';
import { InvoiceA4Print } from './components/invoicing/InvoiceA4Print';
import { InvoiceThermalPrint } from './components/invoicing/InvoiceThermalPrint';
import { CreditNotesManager } from './components/invoicing/CreditNotesManager';
import { CustomersManager } from './components/masters/CustomersManager';
import { ItemsManager } from './components/masters/ItemsManager';
import { PaymentsManager } from './components/payments/PaymentsManager';
import { ReportsGSTR } from './components/reports/ReportsGSTR';
import { CompanySettings } from './components/company/CompanySettings';
import { BackupManager } from './components/backup/BackupManager';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const AppContent: React.FC = () => {
  const { currentView, currentUser } = useApp();
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isWindowsModalOpen, setIsWindowsModalOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const toggleShortcutsModal = useCallback(() => {
    setIsShortcutsModalOpen(prev => !prev);
  }, []);

  const closeShortcutsModal = useCallback(() => {
    setIsShortcutsModalOpen(false);
  }, []);

  // Hook global keyboard shortcuts
  useKeyboardShortcuts({
    isShortcutsModalOpen,
    onToggleShortcutsModal: toggleShortcutsModal,
    onCloseModals: () => {
      closeShortcutsModal();
      setIsWindowsModalOpen(false);
      setIsAndroidModalOpen(false);
    },
  });

  // If no user is logged in, show authentication login screen
  if (!currentUser) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
        <LoginScreen />
        <ToastContainer />
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'admin-users':
        return <AdminUsersView />;
      case 'salesman-portal':
        return <SalesmanPortal />;
      case 'staff-portal':
        return <StaffPortal />;
      case 'accountant-portal':
        return <AccountantPortal />;
      case 'usb-sync':
        return <USBSyncView />;
      case 'dashboard':
        return <Dashboard />;
      case 'new-invoice':
        return <InvoiceEditor />;
      case 'invoices':
        return <InvoiceList />;
      case 'customers':
        return <CustomersManager />;
      case 'items':
        return <ItemsManager />;
      case 'credit-notes':
        return <CreditNotesManager />;
      case 'payments':
        return <PaymentsManager />;
      case 'reports':
        return <ReportsGSTR />;
      case 'settings':
      case 'company':
        return <CompanySettings />;
      case 'backup':
        return <BackupManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900 antialiased selection:bg-teal-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar 
        onOpenShortcuts={toggleShortcutsModal} 
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <Header 
          onOpenShortcuts={toggleShortcutsModal} 
          onOpenWindowsModal={() => setIsWindowsModalOpen(true)}
          onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        />

        {/* Dynamic Main Body */}
        <main className="flex-1 overflow-y-auto bg-slate-100 pb-20 md:pb-12 p-4 md:p-6">
          {renderView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav 
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        onOpenWindowsModal={() => setIsWindowsModalOpen(true)}
      />

      {/* Print Overlays (A4 and POS Thermal) */}
      <InvoiceA4Print />
      <InvoiceThermalPrint />

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      <ShortcutsModal 
        isOpen={isShortcutsModalOpen}
        onClose={closeShortcutsModal}
      />

      {/* Windows Desktop App Modal */}
      <WindowsAppModal
        isOpen={isWindowsModalOpen}
        onClose={() => setIsWindowsModalOpen(false)}
      />

      {/* Android Mobile App (.APK / PWA) Modal */}
      <AndroidAppModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
        deferredPrompt={deferredPrompt}
        isInstallable={!!deferredPrompt}
      />

      {/* Notification Toast Stack */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
