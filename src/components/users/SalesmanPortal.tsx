import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Briefcase, 
  PlusCircle, 
  DollarSign, 
  Users, 
  FileText, 
  Smartphone, 
  HardDrive, 
  TrendingUp, 
  ArrowRight, 
  Search, 
  CheckCircle2, 
  Percent, 
  Clock, 
  CreditCard,
  QrCode
} from 'lucide-react';
import { formatCurrencyIndian } from '../../utils/gstEngine';

export const SalesmanPortal: React.FC = () => {
  const { 
    currentUser, 
    invoices, 
    customers, 
    payments, 
    setCurrentView, 
    setSelectedInvoice, 
    setSelectedCustomer 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  // Filter invoices created by this salesman or all if not set
  const salesmanInvoices = invoices.filter(inv => {
    if (inv.salesmanId && currentUser) {
      return inv.salesmanId === currentUser.id;
    }
    if (inv.createdByUserId && currentUser) {
      return inv.createdByUserId === currentUser.id;
    }
    return true;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayInvoices = salesmanInvoices.filter(i => i.invoiceDate === todayStr && i.status !== 'CANCELLED');
  const todaySalesAmount = todayInvoices.reduce((sum, i) => sum + i.netTotal, 0);
  
  const totalSalesAmount = salesmanInvoices
    .filter(i => i.status !== 'CANCELLED')
    .reduce((sum, i) => sum + i.netTotal, 0);

  const commissionRate = currentUser?.permissions?.salesCommissionPercent ?? 3.5;
  const estimatedCommission = (totalSalesAmount * commissionRate) / 100;

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-500/30">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Salesman Field Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Hello, {currentUser?.name || 'Sales Representative'}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Create offline field invoices, collect customer dues, and sync your day's orders with the main computer via USB or phone.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setCurrentView('new-invoice')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            >
              <PlusCircle className="w-5 h-5" />
              <span>New Sales Invoice</span>
            </button>

            <button
              onClick={() => setCurrentView('usb-sync')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all"
            >
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>USB Sync</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Sales</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">
              {formatCurrencyIndian(todaySalesAmount)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{todayInvoices.length} orders billed today</div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales Billed</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">
              {formatCurrencyIndian(totalSalesAmount)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{salesmanInvoices.length} lifetime invoices</div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Commission Earned</span>
              <span className="text-emerald-400 font-bold">{commissionRate}%</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-blue-400 mt-1">
              {formatCurrencyIndian(estimatedCommission)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Calculated on active sales</div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Max Discount Allowed</div>
            <div className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">
              {currentUser?.permissions?.maxDiscountPercent || 10}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Set by Admin Policy</div>
          </div>
        </div>
      </div>

      {/* Main Grid: My Invoices & Customer Quick Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Recent Invoices */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">My Generated Invoices & Orders</h2>
            </div>
            <button
              onClick={() => setCurrentView('invoices')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {salesmanInvoices.slice(0, 6).map((inv) => (
              <div
                key={inv.id}
                onClick={() => {
                  setSelectedInvoice(inv);
                  setCurrentView('invoices');
                }}
                className="p-3.5 bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-emerald-500/40 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                      {inv.invoiceNumber}
                    </span>
                    <span className="text-xs text-slate-400">• {inv.invoiceDate}</span>
                  </div>
                  <div className="text-sm font-semibold text-white truncate mt-0.5">
                    {inv.customerName}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {inv.items.length} items billed • Status: <span className="text-slate-300 font-medium">{inv.status}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-base font-bold text-white">
                    {formatCurrencyIndian(inv.netTotal)}
                  </div>
                  {inv.balanceAmount > 0 ? (
                    <div className="text-xs text-rose-400 font-medium">
                      Bal: {formatCurrencyIndian(inv.balanceAmount)}
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 justify-end">
                      <CheckCircle2 className="w-3 h-3" /> Paid
                    </div>
                  )}
                </div>
              </div>
            ))}

            {salesmanInvoices.length === 0 && (
              <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
                No invoices recorded yet. Click "New Sales Invoice" to start billing!
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Customer Accounts & Balance Lookup */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold text-white">Customer Balances</h2>
            </div>
            <button
              onClick={() => setCurrentView('customers')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              Directory
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer by name..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredCustomers.map((cust) => (
              <div
                key={cust.id}
                onClick={() => {
                  setSelectedCustomer(cust);
                  setCurrentView('customers');
                }}
                className="p-3 bg-slate-950/70 hover:bg-slate-950 border border-slate-800 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{cust.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{cust.city || 'Local'} • {cust.phone || 'No phone'}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-xs font-bold ${cust.currentBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {cust.currentBalance > 0 ? formatCurrencyIndian(cust.currentBalance) : '₹0 (Clear)'}
                  </div>
                  <div className="text-[10px] text-slate-500">Balance</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
