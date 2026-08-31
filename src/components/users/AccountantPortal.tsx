import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calculator, 
  FileCheck, 
  PieChart, 
  TrendingUp, 
  DollarSign, 
  HardDrive, 
  ArrowRight, 
  CreditCard, 
  FileSpreadsheet,
  AlertTriangle,
  Receipt
} from 'lucide-react';
import { formatCurrencyIndian } from '../../utils/gstEngine';

export const AccountantPortal: React.FC = () => {
  const { 
    currentUser, 
    invoices, 
    payments, 
    creditNotes, 
    customers, 
    setCurrentView 
  } = useApp();

  const activeInvoices = invoices.filter(i => i.status !== 'CANCELLED');
  const totalTaxable = activeInvoices.reduce((sum, i) => sum + i.totalTaxableAmount, 0);
  const totalCGST = activeInvoices.reduce((sum, i) => sum + i.totalCgst, 0);
  const totalSGST = activeInvoices.reduce((sum, i) => sum + i.totalSgst, 0);
  const totalIGST = activeInvoices.reduce((sum, i) => sum + i.totalIgst, 0);
  const totalGST = totalCGST + totalSGST + totalIGST;
  const totalGrossRevenue = activeInvoices.reduce((sum, i) => sum + i.netTotal, 0);
  const totalOutstanding = customers.reduce((sum, c) => sum + Math.max(0, c.currentBalance), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-500/30">
              <Calculator className="w-3.5 h-3.5" />
              <span>Accounts, Audit & Tax Compliance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Senior Accountant Desk ({currentUser?.name || 'Accountant'})
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              GSTR-1 return filing prep, tax liability breakdown (CGST/SGST/IGST), customer ledgers & USB audit sync.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setCurrentView('reports')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>GSTR-1 & Audit Reports</span>
            </button>
            <button
              onClick={() => setCurrentView('usb-sync')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all cursor-pointer"
            >
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span>USB Sync</span>
            </button>
          </div>
        </div>

        {/* Accounting Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Taxable Value</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">{formatCurrencyIndian(totalTaxable)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{activeInvoices.length} active tax bills</div>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">GST Output Liability</div>
            <div className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">{formatCurrencyIndian(totalGST)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">CGST+SGST+IGST collected</div>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Total Sales</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">{formatCurrencyIndian(totalGrossRevenue)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Incl. GST & round-offs</div>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sundry Debtors Due</div>
            <div className="text-xl sm:text-2xl font-bold text-rose-400 mt-1">{formatCurrencyIndian(totalOutstanding)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Total customer receivables</div>
          </div>
        </div>
      </div>

      {/* Tax Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">CGST (Central Tax)</div>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Intra-State</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">{formatCurrencyIndian(totalCGST)}</div>
          <p className="text-xs text-slate-400">Total Central GST collected on local state supplies.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">SGST / UTGST (State Tax)</div>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">Intra-State</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">{formatCurrencyIndian(totalSGST)}</div>
          <p className="text-xs text-slate-400">Total State GST collected on local supplies.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">IGST (Integrated Tax)</div>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Inter-State</span>
          </div>
          <div className="text-2xl font-bold text-amber-400">{formatCurrencyIndian(totalIGST)}</div>
          <p className="text-xs text-slate-400">Total Interstate GST collected across states.</p>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setCurrentView('reports')}
          className="p-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-2xl text-left transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Generate GSTR-1 Excel / CSV</h3>
          <p className="text-xs text-slate-400 mt-1">Export B2B, B2CL, and B2CS tables formatted for the official GST Portal.</p>
        </button>

        <button
          onClick={() => setCurrentView('customers')}
          className="p-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/40 rounded-2xl text-left transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-105 transition-transform">
            <Receipt className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Customer Statement & Ledger</h3>
          <p className="text-xs text-slate-400 mt-1">View date-wise debit/credit statement with opening & closing balances.</p>
        </button>

        <button
          onClick={() => setCurrentView('credit-notes')}
          className="p-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/40 rounded-2xl text-left transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-105 transition-transform">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">GST Credit & Debit Notes</h3>
          <p className="text-xs text-slate-400 mt-1">Audit sales returns, rate reductions, and tax adjustments.</p>
        </button>
      </div>
    </div>
  );
};
