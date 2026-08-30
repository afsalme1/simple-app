import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  CreditCard, 
  Eye, 
  XCircle, 
  Edit3, 
  Download, 
  Calendar, 
  RotateCcw,
  CheckCircle2,
  Clock,
  Ban,
  Receipt,
  X,
  TrendingUp,
  FileCheck,
  Calculator,
  ArrowRightCircle,
  Sparkles,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceStatus, DocumentType } from '../../types';
import { formatINR } from '../../utils/gstEngine';

export const InvoiceList: React.FC = () => {
  const { 
    invoices, 
    setCurrentView, 
    setEditingInvoiceId, 
    setPrintInvoice, 
    setPrintFormat, 
    cancelInvoice, 
    deleteInvoice,
    deleteDraftInvoice,
    convertEstimateToInvoice,
    recordPayment,
    showToast 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Delete Modal State
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);

  // Cancel Modal State
  const [cancellingInvoice, setCancellingInvoice] = useState<Invoice | null>(null);
  const [cancellationReason, setCancellationReason] = useState('Customer Order Cancelled / Goods Returned');

  // Quick Payment Modal State
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD'>('UPI');
  const [paymentReference, setPaymentReference] = useState('');

  // Convert Estimate Modal State
  const [convertingEstimate, setConvertingEstimate] = useState<Invoice | null>(null);

  const openCancelModal = (inv: Invoice) => {
    setCancellingInvoice(inv);
    setCancellationReason('Customer Order Cancelled / Revision Required');
  };

  const handleConfirmCancel = () => {
    if (!cancellingInvoice) return;
    cancelInvoice(cancellingInvoice.id, cancellationReason);
    setCancellingInvoice(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingInvoice) return;
    deleteInvoice(deletingInvoice.id);
    setDeletingInvoice(null);
  };

  const openPaymentModal = (inv: Invoice) => {
    setPayingInvoice(inv);
    setPaymentAmount(inv.balanceAmount);
    setPaymentReference('');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;
    if (paymentAmount <= 0) {
      showToast('error', 'Invalid Amount', 'Payment amount must be greater than zero.');
      return;
    }

    recordPayment({
      invoiceId: payingInvoice.id,
      invoiceNumber: payingInvoice.invoiceNumber,
      customerId: payingInvoice.customerId,
      customerName: payingInvoice.customerName,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: Number(paymentAmount),
      paymentMode,
      referenceNumber: paymentReference.trim() || undefined,
      notes: `Settlement for Invoice ${payingInvoice.invoiceNumber}`,
    });

    setPayingInvoice(null);
  };

  const handleConvertEstimate = (targetType: 'TAX_INVOICE' | 'BILL_OF_SUPPLY') => {
    if (!convertingEstimate) return;
    convertEstimateToInvoice(convertingEstimate.id, targetType);
    setConvertingEstimate(null);
  };

  const filteredInvoices = invoices.filter(inv => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      (inv.customerGstin && inv.customerGstin.toLowerCase().includes(q)) ||
      inv.invoiceDate.includes(q);

    if (!matchesSearch) return false;

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'OUTSTANDING') {
        if (inv.documentType === 'ESTIMATE' || inv.status === 'CANCELLED' || inv.status === 'DRAFT' || inv.balanceAmount <= 0) return false;
      } else if (statusFilter === 'PAID') {
        if (inv.status !== 'PAID' || inv.documentType === 'ESTIMATE') return false;
      } else if (statusFilter === 'DRAFT') {
        if (inv.status !== 'DRAFT') return false;
      } else if (statusFilter === 'CANCELLED') {
        if (inv.status !== 'CANCELLED') return false;
      } else if (statusFilter === 'TAX_INVOICE' || statusFilter === 'BILL_OF_SUPPLY' || statusFilter === 'ESTIMATE') {
        if ((inv.documentType || 'TAX_INVOICE') !== statusFilter) return false;
      }
    }

    return true;
  });

  const validInvoices = invoices.filter(i => i.status !== 'CANCELLED' && i.status !== 'DRAFT' && i.documentType !== 'ESTIMATE');

  const totalSales = validInvoices.reduce((sum, i) => sum + i.netTotal, 0);
  const totalTaxable = validInvoices.reduce((sum, i) => sum + i.totalTaxableAmount, 0);
  const totalProfit = validInvoices.reduce((sum, i) => sum + (i.grossProfit || 0), 0);
  const overallMarginPercent = totalTaxable > 0 ? ((totalProfit / totalTaxable) * 100).toFixed(1) : '0';

  const totalCollected = validInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalOutstanding = validInvoices.reduce((sum, i) => sum + i.balanceAmount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & New Document Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Billing & Invoices Register
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tax Invoices • Bills of Supply • Estimates & Quotes • Real-time Profit & Cost Margins
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-new-invoice"
            onClick={() => {
              setEditingInvoiceId(null);
              setCurrentView('new-invoice');
            }}
            className="py-2 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Document</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Invoiced (Gross)</span>
            <div className="text-xl font-mono font-bold text-slate-800 mt-1">{formatINR(totalSales)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{validInvoices.length} Bills Issued</div>
          </div>
          <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Gross Profit & Margin</span>
            <div className="text-xl font-mono font-bold text-emerald-700 mt-1">{formatINR(totalProfit)}</div>
            <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>{overallMarginPercent}% Gross Margin</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Paid / Collected</span>
            <div className="text-xl font-mono font-bold text-teal-800 mt-1">{formatINR(totalCollected)}</div>
            <div className="text-[11px] text-teal-700 font-medium mt-0.5">Settled at Counter / Bank</div>
          </div>
          <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Receivables (Due)</span>
            <div className="text-xl font-mono font-bold text-amber-700 mt-1">{formatINR(totalOutstanding)}</div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">Pending Customer Balances</div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search document no., customer, GSTIN..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'TAX_INVOICE', label: 'Tax Invoices' },
            { id: 'BILL_OF_SUPPLY', label: 'Bill of Supply' },
            { id: 'ESTIMATE', label: 'Estimates' },
            { id: 'OUTSTANDING', label: 'Unpaid / Due' },
            { id: 'PAID', label: 'Paid' },
            { id: 'DRAFT', label: 'Drafts' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-teal-700 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Doc No. & Type</th>
                <th className="px-4 py-3">Customer & GSTIN</th>
                <th className="px-4 py-3">Place of Supply</th>
                <th className="px-4 py-3 text-right">Taxable (₹)</th>
                <th className="px-4 py-3 text-right">Profit (Est.)</th>
                <th className="px-4 py-3 text-right">Net Amount (₹)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    No documents matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const docType = inv.documentType || 'TAX_INVOICE';

                  let statusBadge = (
                    <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                      PAID
                    </span>
                  );

                  if (docType === 'ESTIMATE') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-purple-50 text-purple-800 border border-purple-200">
                        ESTIMATE {inv.validUntilDate ? `(Till ${inv.validUntilDate})` : ''}
                      </span>
                    );
                  } else if (inv.status === 'PARTIAL' || (inv.status === 'ISSUED' && inv.balanceAmount > 0)) {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
                        DUE: {formatINR(inv.balanceAmount)}
                      </span>
                    );
                  } else if (inv.status === 'DRAFT') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-slate-100 text-slate-700">
                        DRAFT
                      </span>
                    );
                  } else if (inv.status === 'CANCELLED') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-rose-50 text-rose-800 border border-rose-200">
                        CANCELLED
                      </span>
                    );
                  }

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800">{inv.invoiceNumber}</span>
                          {docType === 'ESTIMATE' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-700">
                              EST
                            </span>
                          )}
                          {docType === 'BILL_OF_SUPPLY' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-700">
                              BOS
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{inv.invoiceDate}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{inv.customerName}</div>
                        {inv.customerGstin ? (
                          <div className="text-[11px] font-mono text-teal-700">{inv.customerGstin}</div>
                        ) : (
                          <div className="text-[10px] text-slate-400">Unregistered Consumer</div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-slate-700 font-medium">{inv.placeOfSupply}</span>
                        <div className="text-[10px] text-slate-400 font-semibold">
                          {docType === 'BILL_OF_SUPPLY' ? '0% Exempt' : (inv.isInterState ? 'IGST' : 'CGST+SGST')}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-700">
                        {formatINR(inv.totalTaxableAmount)}
                      </td>

                      {/* Profit Column */}
                      <td className="px-4 py-3 text-right font-mono">
                        {inv.grossProfit !== undefined ? (
                          <div>
                            <span className="font-bold text-emerald-700">+{formatINR(inv.grossProfit)}</span>
                            <div className="text-[10px] text-emerald-800 font-semibold">
                              {inv.profitMarginPercent || 0}%
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(inv.netTotal)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {statusBadge}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Convert Estimate Action (if Estimate) */}
                          {docType === 'ESTIMATE' && inv.status !== 'CANCELLED' && (
                            <button
                              onClick={() => setConvertingEstimate(inv)}
                              title="Convert Quotation into GST Tax Invoice or Bill of Supply"
                              className="p-1.5 text-purple-700 hover:bg-purple-50 rounded transition-colors cursor-pointer"
                            >
                              <ArrowRightCircle className="w-3.5 h-3.5 text-purple-600" />
                            </button>
                          )}

                          {/* A4 Print */}
                          <button
                            onClick={() => {
                              setPrintInvoice(inv);
                              setPrintFormat('A4');
                            }}
                            title="Print Compliant A4 Document"
                            className="p-1.5 text-teal-700 hover:bg-teal-50 rounded transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Thermal POS Receipt */}
                          <button
                            onClick={() => {
                              setPrintInvoice(inv);
                              setPrintFormat('THERMAL_3');
                            }}
                            title="Print 2/3 inch Thermal POS Receipt"
                            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Payment Button if balance > 0 (for non-estimates) */}
                          {docType !== 'ESTIMATE' && inv.status !== 'CANCELLED' && inv.status !== 'DRAFT' && inv.balanceAmount > 0 && (
                            <button
                              onClick={() => openPaymentModal(inv)}
                              title="Record Payment / Collect Due"
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit Option (Enabled for all non-cancelled documents) */}
                          {inv.status !== 'CANCELLED' && (
                            <button
                              onClick={() => {
                                setEditingInvoiceId(inv.id);
                                setCurrentView('new-invoice');
                              }}
                              title={`Edit ${inv.invoiceNumber}`}
                              className="p-1.5 text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Cancel Option */}
                          {inv.status !== 'CANCELLED' && inv.status !== 'DRAFT' && (
                            <button
                              onClick={() => openCancelModal(inv)}
                              title="Soft Cancel Invoice (Preserves Gapless Audit)"
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Permanent Delete Option */}
                          <button
                            onClick={() => setDeletingInvoice(inv)}
                            title={`Delete ${inv.invoiceNumber} permanently`}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Convert Estimate Modal */}
      {convertingEstimate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Convert Estimate to Invoice
              </h3>
              <button
                onClick={() => setConvertingEstimate(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Converting quotation <strong>{convertingEstimate.invoiceNumber}</strong> for <strong>{convertingEstimate.customerName}</strong> will generate a live sequential document, apply inventory deductions, and post entries to customer accounts.
            </p>

            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs font-mono">
              <div><strong>Quotation Value:</strong> {formatINR(convertingEstimate.netTotal)}</div>
              <div><strong>Items Count:</strong> {convertingEstimate.items.length} items</div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleConvertEstimate('TAX_INVOICE')}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Convert to Standard Tax Invoice (GST)</span>
              </button>

              <button
                type="button"
                onClick={() => handleConvertEstimate('BILL_OF_SUPPLY')}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Convert to Bill of Supply (0% / Composition)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Settlement Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Record Payment Settlement
              </h3>
              <button
                onClick={() => setPayingInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Invoice Number:</span>
                  <span className="font-mono font-bold text-slate-800">{payingInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Customer:</span>
                  <span className="font-semibold text-slate-800">{payingInvoice.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Amount:</span>
                  <span className="font-mono font-bold">{formatINR(payingInvoice.netTotal)}</span>
                </div>
                <div className="flex justify-between text-amber-800 font-bold pt-1 border-t border-slate-200">
                  <span>Current Outstanding Due:</span>
                  <span className="font-mono">{formatINR(payingInvoice.balanceAmount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Amount to Collect (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0.01}
                  max={payingInvoice.balanceAmount}
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank NEFT / IMPS</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Transaction / UTR Ref
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                    placeholder="e.g. UTR12345678"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="py-2 px-4 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <Ban className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-800">Soft Cancel Document</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Under GST statutory guidelines, cancelling a document performs a soft audit cancellation preserving the sequential number for the Document Issue table in GSTR-1. Inventory stocks and customer balances will be automatically restored.
            </p>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs font-mono">
              <strong>Cancelling:</strong> {cancellingInvoice.invoiceNumber} ({formatINR(cancellingInvoice.netTotal)})
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mandatory Reason for Cancellation
              </label>
              <textarea
                rows={2}
                required
                value={cancellationReason}
                onChange={e => setCancellationReason(e.target.value)}
                placeholder="e.g. Buyer order cancelled / Error in rates"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancellingInvoice(null)}
                className="py-2 px-4 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Delete {deletingInvoice.documentType === 'ESTIMATE' ? 'Quotation' : deletingInvoice.documentType === 'BILL_OF_SUPPLY' ? 'Bill of Supply' : 'Invoice'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Permanent removal from local database</p>
                </div>
              </div>
              <button
                onClick={() => setDeletingInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Details Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Document No:</span>
                <span className="font-bold text-slate-800 font-mono">{deletingInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-700">{deletingInvoice.customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Date:</span>
                <span className="text-slate-700">{deletingInvoice.invoiceDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Grand Total:</span>
                <span className="font-bold text-teal-700">{formatINR(deletingInvoice.netTotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold text-slate-700 uppercase text-[10px]">{deletingInvoice.status}</span>
              </div>
            </div>

            {/* Auto Reconciliation Notice */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Automatic Stock & Ledger Adjustment</span>
              </div>
              {deletingInvoice.status !== 'CANCELLED' && deletingInvoice.status !== 'DRAFT' && deletingInvoice.documentType !== 'ESTIMATE' ? (
                <p className="text-[11px] leading-relaxed">
                  Deleting this active document will automatically <strong>return goods quantities ({deletingInvoice.items.length} items) back to inventory stock</strong> and <strong>reduce the customer's outstanding balance by {formatINR(deletingInvoice.balanceAmount)}</strong>.
                </p>
              ) : (
                <p className="text-[11px] leading-relaxed">
                  This document will be permanently removed from your records. No inventory or ledger changes were active.
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingInvoice(null)}
                className="py-2 px-4 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium cursor-pointer"
              >
                Keep Document
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-2 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
