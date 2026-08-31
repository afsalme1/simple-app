import React from 'react';
import { 
  Building2, 
  FileText, 
  Users, 
  Package, 
  CreditCard, 
  RotateCcw, 
  BarChart3, 
  Settings, 
  Database, 
  PlusCircle, 
  ShieldCheck, 
  Lock,
  Download,
  Keyboard,
  LayoutDashboard,
  Smartphone,
  Shield,
  Briefcase,
  Calculator,
  HardDrive,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useApp, AppView } from '../../context/AppContext';

interface SidebarProps {
  onOpenShortcuts?: () => void;
  onOpenAndroidModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenShortcuts, onOpenAndroidModal }) => {
  const { 
    currentView, 
    setCurrentView, 
    lockApp, 
    company, 
    invoices, 
    exportDatabase, 
    currentUser, 
    logout 
  } = useApp();

  const unpaidCount = invoices.filter(i => (i.status === 'PARTIAL' || i.status === 'ISSUED') && i.balanceAmount > 0).length;

  const getRoleThemeColor = () => {
    switch (currentUser?.role) {
      case 'ADMIN': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'SALESMAN': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'STAFF': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'ACCOUNTANT': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default: return 'text-teal-400 bg-teal-500/10 border-teal-500/30';
    }
  };

  return (
    <aside className="hidden md:flex w-64 bg-slate-900 text-slate-100 flex-col h-full shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <Building2 className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate text-white tracking-wide" title={company.name}>
            {company.name || 'GST Invoice Pro'}
          </h1>
          <p className="text-xs text-teal-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
            {company.gstin ? `GST: ${company.gstin}` : 'Offline Desktop'}
          </p>
        </div>
      </div>

      {/* User Session Profile Card */}
      {currentUser && (
        <div className="p-3 mx-2 my-2 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white flex-shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
              <div className={`text-[10px] font-semibold px-1.5 py-0.2 rounded inline-block border ${getRoleThemeColor()}`}>
                {currentUser.role}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Action Button */}
      <div className="px-3 pb-2">
        <button
          id="btn-sidebar-create-invoice"
          onClick={() => setCurrentView('new-invoice')}
          title="Create New Invoice (Ctrl+N)"
          className="w-full py-2.5 px-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-lg font-medium text-sm flex items-center justify-between shadow-sm transition-all active:scale-[0.99] cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            <span>New Tax Invoice</span>
          </div>
          <kbd className="px-1.5 py-0.5 bg-black/25 text-teal-100 text-[10px] font-mono rounded font-semibold group-hover:bg-black/40 transition-colors">
            Ctrl+N
          </kbd>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-1 space-y-1 overflow-y-auto">
        {/* Role Portal Pages Section */}
        <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          User Portals & Sync
        </div>

        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => setCurrentView('admin-users')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer group ${
              currentView === 'admin-users' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Admin & Users</span>
            </div>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold">Admin</span>
          </button>
        )}

        {currentUser?.role === 'SALESMAN' && (
          <button
            onClick={() => setCurrentView('salesman-portal')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer group ${
              currentView === 'salesman-portal' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <span>Salesman Desk</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">Field</span>
          </button>
        )}

        {currentUser?.role === 'STAFF' && (
          <button
            onClick={() => setCurrentView('staff-portal')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer group ${
              currentView === 'staff-portal' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Staff Billing Desk</span>
            </div>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold">POS</span>
          </button>
        )}

        {currentUser?.role === 'ACCOUNTANT' && (
          <button
            onClick={() => setCurrentView('accountant-portal')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer group ${
              currentView === 'accountant-portal' ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>Accountant Desk</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">Audit</span>
          </button>
        )}

        {/* USB Sync for everyone */}
        <button
          onClick={() => setCurrentView('usb-sync')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer group ${
            currentView === 'usb-sync' ? 'bg-teal-700/80 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <HardDrive className="w-4 h-4 text-teal-300" />
            <span>USB Sync (PC & Phone)</span>
          </div>
          <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-bold">USB</span>
        </button>

        {/* Core Billing Items */}
        <div className="pt-2 px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Billing & Operations
        </div>

        <button
          onClick={() => setCurrentView('dashboard')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            currentView === 'dashboard' ? 'bg-teal-700/80 text-white' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            <span>Dashboard</span>
          </div>
        </button>

        <button
          onClick={() => setCurrentView('invoices')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            currentView === 'invoices' || currentView === 'new-invoice' ? 'bg-teal-700/80 text-white' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Tax Invoices</span>
          </div>
          {unpaidCount > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800">
              {unpaidCount} Due
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentView('customers')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            currentView === 'customers' ? 'bg-teal-700/80 text-white' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-slate-400" />
            <span>Customers Master</span>
          </div>
        </button>

        <button
          onClick={() => setCurrentView('items')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            currentView === 'items' ? 'bg-teal-700/80 text-white' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <Package className="w-4 h-4 text-slate-400" />
            <span>Items & HSN Catalog</span>
          </div>
        </button>

        <button
          onClick={() => setCurrentView('payments')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            currentView === 'payments' ? 'bg-teal-700/80 text-white' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-slate-400" />
            <span>Payments & Ledger</span>
          </div>
        </button>

        <button
          onClick={() => setCurrentView('credit-notes')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            currentView === 'credit-notes' ? 'bg-teal-700/80 text-white' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Credit Notes (CDNR)</span>
          </div>
        </button>

        <div className="pt-3 px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Compliance & System
        </div>

        <button
          onClick={() => setCurrentView('reports')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            currentView === 'reports' ? 'bg-teal-700/80 text-white' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <span>GST Reports & GSTR-1</span>
          </div>
        </button>

        <button
          onClick={() => setCurrentView('backup')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            currentView === 'backup' ? 'bg-teal-700/80 text-white' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4 text-slate-400" />
            <span>Backup & Database</span>
          </div>
        </button>

        <button
          onClick={() => setCurrentView('settings')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            currentView === 'settings' ? 'bg-teal-700/80 text-white' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Company Setup</span>
          </div>
        </button>
      </nav>

      {/* Footer Info & Quick Utilities */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
        {/* Android App (.APK) Button */}
        {onOpenAndroidModal && (
          <button
            id="btn-sidebar-android-apk"
            onClick={onOpenAndroidModal}
            className="w-full py-1.5 px-2.5 bg-gradient-to-r from-teal-900/60 to-emerald-900/60 hover:from-teal-800 hover:to-emerald-800 text-teal-200 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors border border-teal-700/50 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-teal-400" />
              <span>Android App (.APK)</span>
            </div>
            <span className="px-1.5 py-0.5 bg-teal-800 text-teal-200 text-[10px] font-bold rounded">
              Install
            </span>
          </button>
        )}

        {/* Keyboard Shortcuts Trigger Button */}
        <button
          id="btn-sidebar-shortcuts"
          onClick={onOpenShortcuts}
          className="w-full py-1.5 px-2.5 bg-slate-800/80 hover:bg-slate-850 hover:text-teal-300 text-slate-300 rounded-lg text-xs font-medium flex items-center justify-between transition-colors border border-slate-700/50 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Keyboard className="w-3.5 h-3.5 text-teal-400" />
            <span>Shortcuts Cheatsheet</span>
          </div>
          <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-mono rounded">
            Ctrl+/
          </kbd>
        </button>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span className="flex items-center gap-1 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            100% Offline SQLite
          </span>
          <span className="font-mono text-slate-400">FY {company.currentFY || '2024-25'}</span>
        </div>

        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            id="btn-sidebar-quick-backup"
            onClick={exportDatabase}
            title="Quick Backup JSON/SQLite"
            className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Save Backup</span>
          </button>
          
          {company.isPasswordProtected && (
            <button
              id="btn-sidebar-lock-screen"
              onClick={lockApp}
              title="Lock Application Screen"
              className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center justify-center transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}
        </div>

        {/* Developer / Creator Attribution */}
        <div className="pt-2 mt-1 border-t border-slate-800/80 text-center">
          <div className="text-[11px] text-slate-400 font-medium">
            App created by <span className="text-teal-400 font-semibold tracking-wide">BEEMA STORE</span>
          </div>
        </div>
      </div>
    </aside>
  );
};


