import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Package, 
  Menu, 
  X, 
  Users, 
  RotateCcw, 
  CreditCard, 
  BarChart3, 
  Database, 
  Settings, 
  Smartphone, 
  Monitor, 
  Download,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { useApp, AppView } from '../../context/AppContext';

interface MobileNavProps {
  onOpenAndroidModal: () => void;
  onOpenWindowsModal: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ 
  onOpenAndroidModal, 
  onOpenWindowsModal 
}) => {
  const { currentView, setCurrentView, company, invoices } = useApp();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const unpaidCount = invoices.filter(i => (i.status === 'PARTIAL' || i.status === 'ISSUED') && i.balanceAmount > 0).length;

  const navigateTo = (view: AppView) => {
    setCurrentView(view);
    setIsDrawerOpen(false);
  };

  const navItems = [
    { id: 'dashboard' as AppView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices' as AppView, label: 'Invoices', icon: FileText, badge: unpaidCount > 0 ? unpaidCount : undefined },
    { id: 'new-invoice' as AppView, label: 'New Bill', icon: PlusCircle, isPrimary: true },
    { id: 'items' as AppView, label: 'Items', icon: Package },
  ];

  const drawerMenuItems: Array<{
    id: AppView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-invoice', label: 'Create Tax Invoice', icon: PlusCircle },
    { id: 'invoices', label: 'All Invoices & Estimates', icon: FileText, badge: unpaidCount > 0 ? `${unpaidCount} Due` : undefined },
    { id: 'customers', label: 'Customers & Balance', icon: Users },
    { id: 'items', label: 'Items & Stock Catalog', icon: Package },
    { id: 'payments', label: 'Payment Receipts & Ledger', icon: CreditCard },
    { id: 'credit-notes', label: 'Credit Notes (CDNR)', icon: RotateCcw },
    { id: 'reports', label: 'GST Reports & GSTR-1/3B', icon: BarChart3 },
    { id: 'backup', label: 'Backup & Restore', icon: Database },
    { id: 'settings', label: 'Company Settings & FY', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Sticky Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around select-none safe-area-bottom shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || (item.id === 'invoices' && currentView === 'new-invoice' && !item.isPrimary);

          if (item.isPrimary) {
            return (
              <button
                key={item.id}
                id="mobile-nav-new-invoice"
                onClick={() => navigateTo(item.id)}
                className="relative -top-3 flex flex-col items-center justify-center p-2 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-600 text-white shadow-lg active:scale-95 transition-transform"
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center">
                  <PlusCircle className="w-7 h-7" />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => navigateTo(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors relative ${
                isActive ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 bg-amber-500 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* More Menu Drawer Trigger */}
        <button
          id="mobile-nav-more"
          onClick={() => setIsDrawerOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
            isDrawerOpen ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="mt-0.5">Menu</span>
        </button>
      </div>

      {/* Slide-over Full Mobile Menu Drawer */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="w-4/5 max-w-xs bg-slate-900 text-slate-100 h-full flex flex-col shadow-2xl border-l border-slate-800 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Building2 className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{company.name || 'GST Invoice Pro'}</h4>
                  <p className="text-[10px] text-teal-400 font-mono">100% Offline</p>
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Install Action Banner */}
            <div className="p-3 bg-teal-950/60 border-b border-teal-800/40 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenAndroidModal();
                }}
                className="w-full py-2 px-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <Smartphone className="w-4 h-4" />
                <span>Install on Android (.APK)</span>
              </button>
            </div>

            {/* Nav Menu */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
              {drawerMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-teal-700 text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-teal-200' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 text-center space-y-1">
              <div className="text-[11px] text-slate-400">
                Created by <span className="text-teal-400 font-semibold">BEEMA STORE</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                FY {company.currentFY || '2024-25'} • v1.0 Android
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
