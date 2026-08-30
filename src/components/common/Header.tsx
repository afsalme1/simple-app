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
  Smartphone
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  onOpenShortcuts?: () => void;
  onOpenWindowsModal?: () => void;
  onOpenAndroidModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenShortcuts, onOpenWindowsModal, onOpenAndroidModal }) => {
  const { company, setCurrentView, lockApp, invoices } = useApp();

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
        {/* Android App (.APK) Button */}
        <button
          id="btn-header-android-apk"
          onClick={onOpenAndroidModal}
          title="Install / Download for Android Phone (.APK / PWA)"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-teal-600" />
          <span>Android App</span>
        </button>

        {/* Keyboard Shortcuts Trigger Button */}
        <button
          id="btn-header-shortcuts"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts Cheatsheet (Ctrl+/)"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
        >
          <Keyboard className="w-3.5 h-3.5 text-slate-600" />
          <span>Shortcuts</span>
          <kbd className="px-1 bg-white border border-slate-300 rounded font-mono text-[10px] text-slate-600">
            Ctrl+/
          </kbd>
        </button>

        {/* FY Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium">
          <Calendar className="w-3.5 h-3.5 text-teal-600" />
          <span>FY {company.currentFY || '2024-25'}</span>
        </div>

        {/* Windows Desktop App (.EXE) Button */}
        <button
          id="btn-header-windows-exe"
          onClick={onOpenWindowsModal}
          title="Install / Run as Windows Desktop App (.EXE)"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
        >
          <Monitor className="w-3.5 h-3.5 text-teal-600" />
          <span>Windows (.EXE)</span>
        </button>

        {/* Database Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
          <span>Offline DB</span>
        </div>

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

        {company.isPasswordProtected && (
          <button
            id="btn-header-lock"
            onClick={lockApp}
            title="Lock screen"
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
          >
            <Lock className="w-4 h-4 text-amber-600" />
          </button>
        )}
      </div>
    </header>
  );
};

