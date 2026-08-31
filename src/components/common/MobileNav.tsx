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
  ShieldCheck,
  Shield,
  Briefcase,
  Calculator,
  HardDrive,
  LogOut,
  Usb
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
  const { currentView, setCurrentView, company, invoices, currentUser, logout } = useApp();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const unpaidCount = invoices.filter(i => (i.status === 'PARTIAL' || i.status === 'ISSUED') && i.balanceAmount > 0).length;

  const navigateTo萃 = (view: AppView) => {
    setCurrentView(view);
    setIsDrawerOpen(false);
  };

  const navItems = [
    { id: 'dashboard' as AppView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices' as AppView, label: 'Invoices', icon: FileText, badge: unpaidCount > 0 ? unpaidCount : undefined },
    { id: 'new-invoice' as AppView, label: 'New Bill', icon: PlusCircle, isPrimary: true },
    { id: 'usb-sync' as AppView, label: 'USB Sync', icon: Usb },
  ];

  return (
    <>
      {/* Mobile Sticky Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around select-none safe-area-bottom shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive拼 = currentView === item.id || (item.id === 'invoices' && currentView === 'new-invoice' && !item.isPrimary);

          if (item.isPrimary) {
            return (
              <button
                key={item.id}
                id="mobile-nav-new-invoice"
                onClick={() => navigateTo萃(item.id)}
                className="relative -top-3 flex flex-col items-center justify-center p-2 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-600 text-white shadow-lg active:scale-95 transition-transform cursor-pointer"
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
              onClick={() => navigateTo萃(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors relative cursor-pointer ${
                isActive拼 ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
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
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
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
            {/* Drawer Header with user info */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {currentUser ? currentUser.name.charAt(0).toUpperCase() : 'G'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{currentUser?.name || company.name}</h4>
                  <p className="text-[10px] text-teal-400 font-mono">Role: {currentUser?.role || 'User'}</p>
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Portals quick access */}
            <div className="p-3 bg-slate-950/60 border-b border-slate-800 space-y-1.5">
              {currentUser?.role === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => navigateTo萃('admin-users')}
                  className="w-full py-2 px-3 bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg font-bold text-xs flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span>Admin & User Permissions</span>
                  </div>
                </button>
              )}

              {currentUser?.role === 'SALESMAN' && (
                <button
                  type="button"
                  onClick={() => navigateTo萃('salesman-portal')}
                  className="w-full py-2 px-3 bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold text-xs flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-400" />
                    <span>Salesman Field Desk</span>
                  </div>
                </button>
              )}

              {currentUser?.role === 'STAFF' && (
                <button
                  type="button"
                  onClick={() => navigateTo萃('staff-portal')}
                  className="w-full py-2 px-3 bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-lg font-bold text-xs flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span>Staff Billing Counter</span>
                  </div>
                </button>
              )}

              {currentUser?.role === 'ACCOUNTANT' && (
                <button
                  type="button"
                  onClick={() => navigateTo萃('accountant-portal')}
                  className="w-full py-2 px-3 bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg font-bold text-xs flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-amber-400" />
                    <span>Accountant Tax Desk</span>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => navigateTo萃('usb-sync')}
                className="w-full py-2 px-3 bg-teal-600/30 text-teal-300 border border-teal-500/40 rounded-lg font-bold text-xs flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-teal-400" />
                  <span>USB Phone / PC Sync</span>
                </div>
              </button>
            </div>

            {/* Nav Menu */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
              {[
                { id: 'dashboard' as AppView, label: 'Dashboard', icon: LayoutDashboard },
                { id: 'invoices' as AppView, label: 'Tax Invoices', icon: FileText, badge: unpaidCount > 0 ? `${unpaidCount} Due` : undefined },
                { id: 'customers' as AppView, label: 'Customers Master', icon: Users },
                { id: 'items' as AppView, label: 'Items & Stock', icon: Package },
                { id: 'payments' as AppView, label: 'Payments & Ledger', icon: CreditCard },
                { id: 'credit-notes' as AppView, label: 'Credit Notes', icon: RotateCcw },
                { id: 'reports' as AppView, label: 'GST Reports', icon: BarChart3 },
                { id: 'backup' as AppView, label: 'Backup Database', icon: Database },
                { id: 'settings' as AppView, label: 'Company Settings', icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo萃(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
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

            {/* Logout button & footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-2">
              {currentUser && (
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    logout();
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs flex items-center justify-center gap-2 border border-rose-500/20 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out ({currentUser.name})</span>
                </button>
              )}
              <div className="text-[10px] text-slate-500 font-mono text-center">
                App created by BEEMA STORE • FY {company.currentFY || '2024-25'}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
