import React, { useState, useMemo } from 'react';
import { 
  Keyboard, 
  X, 
  Search, 
  Sparkles, 
  Zap, 
  FileText, 
  Compass, 
  Check, 
  ArrowRight,
  Printer,
  Plus
} from 'lucide-react';
import { SHORTCUTS_LIST, ShortcutItem } from '../../hooks/useKeyboardShortcuts';
import { useApp, AppView } from '../../context/AppContext';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const { setCurrentView, setEditingInvoiceId, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const isMac = useMemo(() => {
    return typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  }, []);

  const categories = [
    { id: 'ALL', label: 'All Shortcuts' },
    { id: 'Billing', label: 'Billing & Invoicing' },
    { id: 'Navigation', label: 'Fast Navigation' },
    { id: 'General', label: 'General & Overlays' },
  ];

  const filteredShortcuts = useMemo(() => {
    return SHORTCUTS_LIST.filter(item => {
      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchQuery = 
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.actionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keys.join(' ').toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleExecuteShortcut = (item: ShortcutItem) => {
    onClose();
    switch (item.id) {
      case 'new-invoice':
        setEditingInvoiceId(null);
        setCurrentView('new-invoice');
        showToast('info', 'New Tax Invoice', 'Opened fresh invoice editor.');
        break;
      case 'nav-dashboard':
        setCurrentView('dashboard');
        break;
      case 'nav-invoices':
        setCurrentView('invoices');
        break;
      case 'nav-customers':
        setCurrentView('customers');
        break;
      case 'nav-items':
        setCurrentView('items');
        break;
      case 'nav-payments':
        setCurrentView('payments');
        break;
      case 'nav-reports':
        setCurrentView('reports');
        break;
      case 'nav-backup':
        setCurrentView('backup');
        break;
      case 'nav-company':
        setCurrentView('settings');
        break;
      case 'save-invoice':
        window.dispatchEvent(new CustomEvent('gst:save-invoice', { detail: { format: 'A4' } }));
        break;
      case 'save-draft':
        window.dispatchEvent(new CustomEvent('gst:save-draft'));
        break;
      case 'pos-print':
        window.dispatchEvent(new CustomEvent('gst:save-invoice', { detail: { format: 'THERMAL_3' } }));
        break;
      case 'add-item-row':
        window.dispatchEvent(new CustomEvent('gst:add-line-item'));
        break;
      case 'fast-walkin':
        window.dispatchEvent(new CustomEvent('gst:walkin-customer'));
        break;
      default:
        break;
    }
  };

  const formatKeyName = (k: string) => {
    if (k === 'Ctrl' && isMac) return '⌘ Cmd';
    if (k === 'Alt' && isMac) return '⌥ Option';
    return k;
  };

  return (
    <div 
      id="modal-shortcuts-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="modal-shortcuts-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Keyboard Shortcuts & Power-User Hotkeys</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {isMac ? 'macOS (Cmd/Opt)' : 'Windows / Linux (Ctrl/Alt)'}
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Speed up counter sales, billing entries, and tax calculations with gapless speed.
              </p>
            </div>
          </div>

          <button
            id="btn-close-shortcuts-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Press Esc to close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Tabs */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search shortcut (e.g. Save, New, Alt+A)..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder:text-slate-400"
              autoFocus
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts List Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {filteredShortcuts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Keyboard className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium">No matching keyboard shortcuts found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredShortcuts.map(item => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/30 transition-all flex items-start justify-between gap-3 group shadow-2xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900 transition-colors truncate">
                        {item.description}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        item.category === 'Billing' 
                          ? 'bg-teal-50 text-teal-800 border border-teal-200' 
                          : item.category === 'Navigation'
                          ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {item.actionName}
                    </p>
                  </div>

                  {/* Keys Badges */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    {item.keys.map((k, idx) => (
                      <React.Fragment key={idx}>
                        <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 text-slate-800 text-xs font-mono font-bold rounded shadow-xs">
                          {formatKeyName(k)}
                        </kbd>
                        {idx < item.keys.length - 1 && (
                          <span className="text-xs text-slate-400 font-bold">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Power Tip: Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 text-slate-800 font-mono text-[10px] rounded font-bold">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 text-slate-800 font-mono text-[10px] rounded font-bold">/</kbd> anywhere to toggle this guide.</span>
          </div>

          <button
            onClick={onClose}
            className="py-1 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
