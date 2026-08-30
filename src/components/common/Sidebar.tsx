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
  Smartphone
} from 'lucide-react';
import { useApp, AppView } from '../../context/AppContext';

interface SidebarProps {
  onOpenShortcuts?: () => void;
  onOpenAndroidModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenShortcuts, onOpenAndroidModal }) => {
  const { currentView, setCurrentView, lockApp, company, invoices, exportDatabase } = useApp();

  const unpaidCount = invoices.filter(i => (i.status === 'PARTIAL' || i.status === 'ISSUED') && i.balanceAmount > 0).length;

  const menuItems: Array<{
    id: AppView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    shortcut: string;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'Alt+1' },
    { id: 'invoices', label: 'Tax Invoices', icon: FileText, shortcut: 'Alt+2', badge: unpaidCount > 0 ? `${unpaidCount} Due` : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'customers', label: 'Customers Master', icon: Users, shortcut: 'Alt+3' },
    { id: 'items', label: 'Items & HSN Catalog', icon: Package, shortcut: 'Alt+4' },
    { id: 'payments', label: 'Payments & Ledger', icon: CreditCard, shortcut: 'Alt+5' },
    { id: 'credit-notes', label: 'Credit Notes (CDNR)', icon: RotateCcw, shortcut: 'Alt+C' },
    { id: 'reports', label: 'GST Reports & GSTR-1/3B', icon: BarChart3, shortcut: 'Alt+6' },
    { id: 'backup', label: 'Backup & Database', icon: Database, shortcut: 'Alt+7' },
    { id: 'settings', label: 'Company Setup & FY', icon: Settings, shortcut: 'Alt+8' },
  ];

  return (
    <aside className="hidden md:flex w-64 bg-slate-900 text-slate-100 flex-col h-full shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold shadow-md">
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

      {/* Quick Action Button */}
      <div className="p-3">
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
        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Billing & Operations
        </div>
        {menuItems.slice(0, 6).map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id || (item.id === 'invoices' && currentView === 'new-invoice');
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer group ${
                isActive
                  ? 'bg-teal-700/80 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-200' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${item.badgeColor || 'bg-slate-700 text-slate-200'}`}>
                    {item.badge}
                  </span>
                )}
                <kbd className={`text-[10px] font-mono opacity-40 group-hover:opacity-100 px-1 py-0.5 rounded ${
                  isActive ? 'bg-teal-800 text-teal-100' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.shortcut}
                </kbd>
              </div>
            </button>
          );
        })}

        <div className="pt-3 px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Compliance & System
        </div>
        {menuItems.slice(6).map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer group ${
                isActive
                  ? 'bg-teal-700/80 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-200' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              <kbd className={`text-[10px] font-mono opacity-40 group-hover:opacity-100 px-1 py-0.5 rounded ${
                isActive ? 'bg-teal-800 text-teal-100' : 'bg-slate-800 text-slate-400'
              }`}>
                {item.shortcut}
              </kbd>
            </button>
          );
        })}
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

