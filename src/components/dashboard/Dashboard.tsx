import React from 'react';
import { 
  FileText, 
  Plus, 
  Users, 
  Package, 
  CreditCard, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  Zap, 
  Receipt,
  FileSpreadsheet,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/gstEngine';

export const Dashboard: React.FC = () => {
  const { 
    company, 
    invoices, 
    customers, 
    items, 
    payments, 
    setCurrentView, 
    setEditingInvoiceId,
    setPrintInvoice,
    setPrintFormat 
  } = useApp();

  const validInvoices = invoices.filter(i => i.status !== 'CANCELLED' && i.status !== 'DRAFT');
  
  const totalSales = validInvoices.reduce((s, i) => s + i.netTotal, 0);
  const totalTaxCollected = validInvoices.reduce((s, i) => s + i.totalTaxAmount, 0);
  const totalCollected = validInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalOutstanding = validInvoices.reduce((s, i) => s + i.balanceAmount, 0);

  const lowStockItems = items.filter(it => it.itemType === 'GOODS' && it.currentStock <= (it.minStockAlert || 5));
  const recentInvoices = [...invoices].reverse().slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner & Quick Action */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-teal-900/40">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              FY {company.currentFY} • GST ACTIVE
            </span>
            <span className="text-xs text-slate-300">GSTIN: {company.gstin}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {company.name}
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Offline GST billing engine running with gapless invoice series, CGST/SGST/IGST tax splitting, and automated GSTR-1/3B filing returns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setEditingInvoiceId(null);
              setCurrentView('new-invoice');
            }}
            className="py-2.5 px-4 bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Create Tax Invoice</span>
          </button>

          <button
            onClick={() => setCurrentView('reports')}
            className="py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
            <span>GSTR Returns</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gross Sales (FY)</span>
            <div className="text-xl font-mono font-bold text-slate-900">{formatINR(totalSales)}</div>
            <div className="text-[11px] text-teal-700 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{validInvoices.length} Invoices Issued</span>
            </div>
          </div>
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Total GST Tax Collected */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Output GST Tax</span>
            <div className="text-xl font-mono font-bold text-indigo-900">{formatINR(totalTaxCollected)}</div>
            <div className="text-[11px] text-indigo-700 font-medium">
              CGST + SGST + IGST
            </div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* Collections */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Received</span>
            <div className="text-xl font-mono font-bold text-emerald-800">{formatINR(totalCollected)}</div>
            <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{payments.length} Payments Logged</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Receivables Due</span>
            <div className="text-xl font-mono font-bold text-amber-700">{formatINR(totalOutstanding)}</div>
            <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Customer Balance</span>
            </div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Invoices + Quick Masters & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Recent Tax Invoices</span>
              </h3>
              <button
                onClick={() => setCurrentView('invoices')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All Invoices</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Invoice No.</th>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5 text-right">Amount (₹)</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                    <th className="px-4 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No invoices created yet.
                      </td>
                    </tr>
                  ) : (
                    recentInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{inv.customerName}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{inv.invoiceDate}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatINR(inv.netTotal)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-800'
                              : inv.status === 'CANCELLED'
                              ? 'bg-rose-50 text-rose-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setPrintInvoice(inv);
                              setPrintFormat('A4');
                            }}
                            className="text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                          >
                            Print
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>GST Compliance Rule: Sequential Gapless Invoicing Active</span>
            <span className="font-mono text-slate-700 font-semibold">FY {company.currentFY}</span>
          </div>
        </div>

        {/* Right Col: Quick Actions & Inventory Alert */}
        <div className="space-y-6">
          {/* Quick Shortcuts */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Quick Shortcuts & Masters
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setCurrentView('customers')}
                className="p-3 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-colors text-left group cursor-pointer"
              >
                <Users className="w-5 h-5 text-teal-600 group-hover:scale-110 transition-transform mb-1" />
                <div className="text-xs font-bold text-slate-800">Customers Master</div>
                <div className="text-[11px] text-slate-500">{customers.length} Contacts</div>
              </button>

              <button
                onClick={() => setCurrentView('items')}
                className="p-3 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-colors text-left group cursor-pointer"
              >
                <Package className="w-5 h-5 text-teal-600 group-hover:scale-110 transition-transform mb-1" />
                <div className="text-xs font-bold text-slate-800">Items Catalog</div>
                <div className="text-[11px] text-slate-500">{items.length} Products/HSN</div>
              </button>

              <button
                onClick={() => setCurrentView('credit-notes')}
                className="p-3 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-colors text-left group cursor-pointer"
              >
                <Zap className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform mb-1" />
                <div className="text-xs font-bold text-slate-800">Credit Notes</div>
                <div className="text-[11px] text-slate-500">GSTR-1 CDNR Table 9B</div>
              </button>

              <button
                onClick={() => setCurrentView('backup')}
                className="p-3 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-colors text-left group cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform mb-1" />
                <div className="text-xs font-bold text-slate-800">Backup & Restore</div>
                <div className="text-[11px] text-slate-500">Offline SQLite File</div>
              </button>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Low Stock Alerts</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-700 font-bold font-mono">
                {lowStockItems.length} Items
              </span>
            </h3>

            {lowStockItems.length === 0 ? (
              <div className="text-xs text-emerald-700 font-medium py-3 text-center flex items-center justify-center gap-1.5 bg-emerald-50/50 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                <span>All items are sufficiently stocked!</span>
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockItems.slice(0, 3).map(it => (
                  <div key={it.id} className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{it.name}</span>
                      <div className="text-[11px] text-slate-500 font-mono">HSN: {it.hsnSacCode}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-rose-700">{it.currentStock} {it.unit}</span>
                      <div className="text-[10px] text-slate-400">Min: {it.minStockAlert}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
