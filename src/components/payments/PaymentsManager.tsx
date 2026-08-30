import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  User, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  DollarSign, 
  FileSpreadsheet, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  Filter,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Payment, Customer, Invoice } from '../../types';
import { formatINR } from '../../utils/gstEngine';

export const PaymentsManager: React.FC = () => {
  const { 
    customers, 
    invoices, 
    payments, 
    selectedCustomer, 
    setSelectedCustomer, 
    recordPayment, 
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'LEDGER' | 'PAYMENTS_LIST' | 'AGEING'>('LEDGER');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Quick Payment modal state
  const [paymentCustomer, setPaymentCustomer] = useState<Customer>(selectedCustomer || customers[0]);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE'>('UPI');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const currentCust = selectedCustomer || customers[0];

  // Invoices for current customer
  const custInvoices = invoices.filter(i => i.customerId === currentCust?.id && i.status !== 'CANCELLED' && i.status !== 'DRAFT');
  const custPayments = payments.filter(p => p.customerId === currentCust?.id);

  // Generate Customer Ledger entries sorted by date
  interface LedgerEntry {
    id: string;
    date: string;
    type: 'INVOICE' | 'PAYMENT' | 'OPENING_BALANCE';
    reference: string;
    description: string;
    debit: number;  // increases customer due
    credit: number; // decreases customer due
    runningBalance: number;
  }

  const ledgerEntries: LedgerEntry[] = [];
  let balance = Number(currentCust?.openingBalance || 0);

  if (balance > 0) {
    ledgerEntries.push({
      id: 'entry-op',
      date: currentCust.createdAt.split('T')[0],
      type: 'OPENING_BALANCE',
      reference: 'OP-BAL',
      description: 'Opening Balance brought forward',
      debit: balance,
      credit: 0,
      runningBalance: balance,
    });
  }

  // Combine invoices and payments
  const rawEvents: Array<{ date: string; type: 'INV' | 'PAY'; data: any }> = [];
  custInvoices.forEach(inv => rawEvents.push({ date: inv.invoiceDate, type: 'INV', data: inv }));
  custPayments.forEach(pay => rawEvents.push({ date: pay.paymentDate, type: 'PAY', data: pay }));
  rawEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  rawEvents.forEach((ev, idx) => {
    if (ev.type === 'INV') {
      const inv: Invoice = ev.data;
      balance += inv.netTotal;
      ledgerEntries.push({
        id: `led-inv-${inv.id}`,
        date: inv.invoiceDate,
        type: 'INVOICE',
        reference: inv.invoiceNumber,
        description: `Tax Invoice (${inv.placeOfSupply})`,
        debit: inv.netTotal,
        credit: 0,
        runningBalance: balance,
      });
    } else {
      const pay: Payment = ev.data;
      balance -= pay.amount;
      ledgerEntries.push({
        id: `led-pay-${pay.id}`,
        date: pay.paymentDate,
        type: 'PAYMENT',
        reference: pay.paymentNumber,
        description: `Payment received via ${pay.paymentMode}${pay.referenceNumber ? ` (${pay.referenceNumber})` : ''}`,
        debit: 0,
        credit: pay.amount,
        runningBalance: balance,
      });
    }
  });

  const openNewPaymentModal = () => {
    setPaymentCustomer(currentCust);
    const unpaidInv = custInvoices.find(i => i.balanceAmount > 0);
    if (unpaidInv) {
      setPaymentInvoiceId(unpaidInv.id);
      setPaymentAmount(unpaidInv.balanceAmount);
    } else {
      setPaymentInvoiceId('');
      setPaymentAmount(currentCust?.currentBalance > 0 ? currentCust.currentBalance : 0);
    }
    setPaymentRef('');
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      showToast('error', 'Invalid Amount', 'Payment amount must be greater than zero.');
      return;
    }

    const inv = invoices.find(i => i.id === paymentInvoiceId);

    recordPayment({
      invoiceId: inv ? inv.id : undefined,
      invoiceNumber: inv ? inv.invoiceNumber : undefined,
      customerId: paymentCustomer.id,
      customerName: paymentCustomer.name,
      paymentDate,
      amount: Number(paymentAmount),
      paymentMode,
      referenceNumber: paymentRef.trim() || undefined,
      notes: `Payment for ${paymentCustomer.name}`,
    });

    setIsPaymentModalOpen(false);
  };

  // Ageing breakdown calculations
  const today = new Date();
  const ageingBuckets = {
    current: 0, // 0-30 days
    bucket30_60: 0,
    bucket60_90: 0,
    bucketOver90: 0,
  };

  invoices
    .filter(i => i.status !== 'CANCELLED' && i.status !== 'DRAFT' && i.balanceAmount > 0)
    .forEach(inv => {
      const invDate = new Date(inv.invoiceDate);
      const diffDays = Math.floor((today.getTime() - invDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays <= 30) ageingBuckets.current += inv.balanceAmount;
      else if (diffDays <= 60) ageingBuckets.bucket30_60 += inv.balanceAmount;
      else if (diffDays <= 90) ageingBuckets.bucket60_90 += inv.balanceAmount;
      else ageingBuckets.bucketOver90 += inv.balanceAmount;
    });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-600" />
            Payments, Receipts & Customer Ledgers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track customer debit/credit transactions, age-wise outstanding debt, and multi-mode settlements.
          </p>
        </div>

        <button
          onClick={openNewPaymentModal}
          className="py-2 px-3.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Receipt / Payment</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'LEDGER', label: 'Customer Account Ledger' },
          { id: 'PAYMENTS_LIST', label: 'All Receipts Log' },
          { id: 'AGEING', label: 'Receivables Ageing Analysis' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === t.id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Customer Account Ledger */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-4">
          {/* Customer Selector & Quick Balances */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
                <User className="w-5 h-5" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Select Customer</label>
                <select
                  value={currentCust?.id || ''}
                  onChange={e => {
                    const found = customers.find(c => c.id === e.target.value);
                    if (found) setSelectedCustomer(found);
                  }}
                  className="mt-0.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.gstin ? `(${c.gstin})` : ''} - Due: ₹{c.currentBalance}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Opening Balance</span>
                <div className="font-mono text-sm font-semibold text-slate-700">{formatINR(currentCust?.openingBalance || 0)}</div>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Total Billed</span>
                <div className="font-mono text-sm font-semibold text-slate-700">
                  {formatINR(custInvoices.reduce((s, i) => s + i.netTotal, 0))}
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Current Balance Due</span>
                <div className="font-mono text-base font-bold text-rose-700">{formatINR(currentCust?.currentBalance || 0)}</div>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider">
                Statement of Account: {currentCust?.name}
              </span>
              <span className="font-mono text-slate-500">{ledgerEntries.length} Transactions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Doc / Ref No.</th>
                    <th className="px-4 py-2.5">Transaction Particulars</th>
                    <th className="px-4 py-2.5 text-right text-rose-700">Debit (Billed ₹)</th>
                    <th className="px-4 py-2.5 text-right text-emerald-700">Credit (Paid ₹)</th>
                    <th className="px-4 py-2.5 text-right">Closing Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        No transactions recorded for this customer.
                      </td>
                    </tr>
                  ) : (
                    ledgerEntries.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono text-slate-600">{entry.date}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-800">{entry.reference}</td>
                        <td className="px-4 py-3 text-slate-700">{entry.description}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">
                          {entry.debit > 0 ? formatINR(entry.debit) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                          {entry.credit > 0 ? formatINR(entry.credit) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatINR(entry.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: All Receipts Log */}
      {activeTab === 'PAYMENTS_LIST' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Receipt No. & Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Settled Invoice</th>
                  <th className="px-4 py-3">Payment Mode & Ref</th>
                  <th className="px-4 py-3 text-right">Amount Received (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                      No payment receipts logged yet.
                    </td>
                  </tr>
                ) : (
                  payments.map(pay => (
                    <tr key={pay.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-slate-800">{pay.paymentNumber}</div>
                        <div className="text-[11px] text-slate-400">{pay.paymentDate}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{pay.customerName}</td>
                      <td className="px-4 py-3 font-mono text-teal-700">
                        {pay.invoiceNumber || 'On Account'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-800">
                          {pay.paymentMode}
                        </span>
                        {pay.referenceNumber && (
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">Ref: {pay.referenceNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        {formatINR(pay.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Receivables Ageing Analysis */}
      {activeTab === 'AGEING' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold uppercase">0 - 30 Days (Current)</span>
              <div className="text-xl font-mono font-bold text-emerald-700 mt-1">{formatINR(ageingBuckets.current)}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold uppercase">31 - 60 Days</span>
              <div className="text-xl font-mono font-bold text-amber-600 mt-1">{formatINR(ageingBuckets.bucket30_60)}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold uppercase">61 - 90 Days</span>
              <div className="text-xl font-mono font-bold text-orange-600 mt-1">{formatINR(ageingBuckets.bucket60_90)}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold uppercase">&gt; 90 Days (Overdue)</span>
              <div className="text-xl font-mono font-bold text-rose-700 mt-1">{formatINR(ageingBuckets.bucketOver90)}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Unpaid Invoices Ageing Registry
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Invoice No.</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Invoice Date</th>
                    <th className="px-4 py-3 text-right">Age (Days)</th>
                    <th className="px-4 py-3 text-right">Total Invoiced</th>
                    <th className="px-4 py-3 text-right text-rose-700">Balance Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices
                    .filter(i => i.status !== 'CANCELLED' && i.status !== 'DRAFT' && i.balanceAmount > 0)
                    .map(inv => {
                      const diffDays = Math.floor((today.getTime() - new Date(inv.invoiceDate).getTime()) / (1000 * 3600 * 24));
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{inv.customerName}</td>
                          <td className="px-4 py-3 font-mono text-slate-600">{inv.invoiceDate}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold">
                            <span className={`px-2 py-0.5 rounded ${diffDays > 60 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                              {diffDays} days
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-700">{formatINR(inv.netTotal)}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">{formatINR(inv.balanceAmount)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-600" />
                Record Customer Payment Receipt
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Customer
                </label>
                <select
                  value={paymentCustomer?.id || ''}
                  onChange={e => {
                    const found = customers.find(c => c.id === e.target.value);
                    if (found) setPaymentCustomer(found);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Balance: ₹{c.currentBalance})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Link to Invoice (Optional)
                </label>
                <select
                  value={paymentInvoiceId}
                  onChange={e => {
                    setPaymentInvoiceId(e.target.value);
                    const inv = invoices.find(i => i.id === e.target.value);
                    if (inv) setPaymentAmount(inv.balanceAmount);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">-- General On-Account Payment --</option>
                  {invoices
                    .filter(i => i.customerId === paymentCustomer.id && i.balanceAmount > 0)
                    .map(i => (
                      <option key={i.id} value={i.id}>
                        {i.invoiceNumber} (Due: ₹{i.balanceAmount})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Receipt Date
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Amount Received (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    required
                    value={paymentAmount || ''}
                    onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="UPI">UPI / Bharat QR</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank NEFT / IMPS</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    UTR / Cheque Ref
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    placeholder="e.g. UTR893247923"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="py-2 px-4 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
