import React from 'react';
import { 
  Building2, 
  MapPin, 
  HardDrive, 
  Lock, 
  Plus, 
  Calendar,
  Layers,
  Keyboard,
  Monitor,
  Smartphone,
  Usb,
  User,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  onOpenShortcuts?: () => void;
  onOpenWindowsModal?: () => void;
  onOpenAndroidModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenShortcuts, onOpenWindowsModal, onOpenAndroidModal }) => {
  const { company, setCurrentView, lockApp, invoices, currentUser, logout } = useApp();

  const totalSales = invoices
    .filter(i => i.status !== 'CANCELLED' && i.status !== 'DRAFT')
    .reduce((acc, curr) => acc + curr.netTotal, 0);

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shrink-0 shadow-xs">
      {/* Left: Current Active Business Context */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-slate-800 text-xs sm:text-sm tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
            <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="truncate">{company.tradeName || company.name}</span>
          </span>
          <span className="hidden xs:inline-block text-[11px] sm:text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-medium shrink-0">
            GSTIN: {company.gstin || 'Unregistered'}
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 pl-3 border-l border-slate-200">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>State: <strong className="text-slate-700">{company.stateCode} - {company.state}</strong></span>
        </div>
      </div>

      {/* Right: Quick Stats & Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* USB Sync Button */}
        <button
          id="btn-header-usb-sync"
          onClick={() => setCurrentView('usb-sync')}
          title="Sync Invoices & Stock via USB Drive / Android Phone"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Usb className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">USB Sync</span>
        </button>

        {/* Android App (.APK) Button */}
        <button
          id="btn-header-android-apk"
          onClick={onOpenAndroidModal}
          title="Install / Download for Android Phone (.APK / PWA)"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-teal-600" />
          <span>Android</span>
        </button>

        {/* User Account / Role Pill */}
        {currentUser && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs">
            <div className="w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-slate-800 hidden md:inline truncate max-w-[100px]">
              {currentUser.name}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-bold">
              {currentUser.role}
            </span>
          </div>
        )}

        {/* Quick New Invoice Button */}
        <button
          id="btn-header-new-invoice"
          onClick={() => setCurrentView('new-invoice')}
          title="Create New Tax Invoice (Ctrl+N)"
          className="py-1.5 px-2.5 sm:px-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 sm:gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Create Bill</span>
          <span className="xs:hidden">Bill</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-teal-800 text-teal-100 font-mono text-[10px] font-bold">
            Ctrl+N
          </kbd>
        </button>

        {currentUser && (
          <button
            id="btn-header-logout"
            onClick={logout}
            title="Sign out of current account"
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};

