import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileText, 
  PlusCircle, 
  Package, 
  Users, 
  CreditCard, 
  Search, 
  CheckCircle2, 
  RotateCcw,
  HardDrive
} from 'lucide-react';
import { formatCurrencyIndian } from '../../utils/gstEngine';

export const StaffPortal: React.FC = () => {
  const { 
    currentUser, 
    invoices, 
    items, 
    setCurrentView, 
    setSelectedInvoice 
  } = useApp();

  const [itemSearch, setItemSearch] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayInvoices = invoices.filter(i => i.invoiceDate === todayStr && i.status !== 'CANCELLED');
  const todayCount = todayInvoices.length;
  const todaySales = todayInvoices.reduce((sum, i) => sum + i.netTotal, 0);

  const filteredItems = items.filter(it => 
    it.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    (it.itemCode && it.itemCode.toLowerCase().includes(itemSearch.toLowerCase())) ||
    (it.hsnCode && it.hsnCode.includes(itemSearch))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900/60 via-slate-900 to-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2 border border-purple-500/30">
              <FileText className="w-3.5 h-3.5" />
              <span>Billing Counter & POS Staff</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome, {currentUser?.name || 'Staff Member'}
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Rapid tax billing, POS counter operations, inventory lookup, and customer receipt management.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setCurrentView('new-invoice')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create New Bill (Ctrl+N)</span>
            </button>
            <button
              onClick={() => setCurrentView('usb-sync')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all cursor-pointer"
            >
              <HardDrive className="w-4 h-4 text-purple-400" />
              <span>USB Sync</span>
            </button>
          </div>
        </div>

        {/* Counter Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Counter Bills</div>
            <div className="text-2xl font-bold text-purple-400 mt-1">{todayCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Invoices printed today</div>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Collection</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrencyIndian(todaySales)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Total counter revenue</div>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Discount Limit</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{currentUser?.permissions?.maxDiscountPercent || 15}%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Max allowed discount</div>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Catalog Items</div>
            <div className="text-2xl font-bold text-white mt-1">{items.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Live offline products</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Quick Invoicing Feed + Stock Quick Lookup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-white">Recent Counter Invoices</h2>
            </div>
            <button
              onClick={() => setCurrentView('invoices')}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              All Invoices &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {invoices.slice(0, 6).map((inv) => (
              <div
                key={inv.id}
                onClick={() => {
                  setSelectedInvoice(inv);
                  setCurrentView('invoices');
                }}
                className="p-3.5 bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-purple-500/40 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-purple-400">{inv.invoiceNumber}</span>
                    <span className="text-xs text-slate-400">• {inv.invoiceDate}</span>
                  </div>
                  <div className="text-sm font-semibold text-white truncate mt-0.5">{inv.customerName}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {inv.items.length} items • Billed by {inv.createdByUserName || 'Staff'}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-base font-bold text-white">{formatCurrencyIndian(inv.netTotal)}</div>
                  {inv.balanceAmount > 0 ? (
                    <div className="text-xs text-rose-400 font-medium">Due: {formatCurrencyIndian(inv.balanceAmount)}</div>
                  ) : (
                    <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 justify-end">
                      <CheckCircle2 className="w-3 h-3" /> Paid
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock & Item Catalog Quick Lookup */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Stock & Price Lookup</h2>
            </div>
            <button
              onClick={() => setCurrentView('items')}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              Catalog &rarr;
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              placeholder="Search product / HSN..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredItems.slice(0, 15).map((item) => (
              <div
                key={item.id}
                onClick={() => setCurrentView('items')}
                className="p-3 bg-slate-950/70 hover:bg-slate-950 border border-slate-800 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{item.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">HSN: {item.hsnCode} • GST {item.gstRate}%</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold text-emerald-400">{formatCurrencyIndian(item.sellingPrice)}</div>
                  <div className="text-[10px] text-slate-400">Stock: <span className="font-semibold text-white">{item.stockQuantity}</span> {item.unit}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
