import React, { useState } from 'react';
import { 
  RotateCcw, 
  Plus, 
  Search, 
  FileText, 
  Calendar, 
  User, 
  AlertCircle, 
  Printer, 
  CheckCircle,
  X 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CreditNote, CreditNoteReason, InvoiceItem } from '../../types';
import { formatINR, calculateLineItem, numberToWordsIndian } from '../../utils/gstEngine';

export const CreditNotesManager: React.FC = () => {
  const { creditNotes, invoices, company, saveCreditNote, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [creditNoteNumber, setCreditNoteNumber] = useState('');
  const [noteType, setNoteType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [creditNoteDate, setCreditNoteDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<CreditNoteReason>('SALES_RETURN');
  const [reasonDescription, setReasonDescription] = useState('Goods returned due to defect / non-compliance');
  const [items, setItems] = useState<InvoiceItem[]>([]);

  const eligibleInvoices = invoices.filter(i => i.status !== 'CANCELLED' && i.status !== 'DRAFT');

  const openAddModal = () => {
    const nextSeq = creditNotes.length + 1;
    const num = `CN/${company.currentFY}/${String(nextSeq).padStart(4, '0')}`;
    setCreditNoteNumber(num);
    setNoteType('CREDIT');
    setCreditNoteDate(new Date().toISOString().split('T')[0]);
    setReason('SALES_RETURN');
    setReasonDescription('Goods returned by customer');
    
    if (eligibleInvoices.length > 0) {
      handleInvoiceSelect(eligibleInvoices[0].id);
    } else {
      setSelectedInvoiceId('');
      setItems([]);
    }
    setIsModalOpen(true);
  };

  const handleInvoiceSelect = (invId: string) => {
    setSelectedInvoiceId(invId);
    const inv = invoices.find(i => i.id === invId);
    if (inv && inv.items.length > 0) {
      // Pre-fill with items from original invoice
      const firstItem = inv.items[0];
      const calc = calculateLineItem(
        1,
        firstItem.rate,
        0,
        0,
        firstItem.gstRate,
        firstItem.cessRate,
        inv.isInterState
      );
      setItems([
        {
          id: `cn-item-${Date.now()}`,
          name: firstItem.name,
          hsnSacCode: firstItem.hsnSacCode,
          unit: firstItem.unit,
          ...calc,
        },
      ]);
    }
  };

  const handleLineQtyChange = (index: number, qty: number) => {
    const inv = invoices.find(i => i.id === selectedInvoiceId);
    const isInterstate = inv ? inv.isInterState : false;
    const updated = [...items];
    const item = updated[index];
    const calc = calculateLineItem(qty, item.rate, item.discountPercent, 0, item.gstRate, item.cessRate, isInterstate);
    updated[index] = { ...item, ...calc };
    setItems(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const originalInv = invoices.find(i => i.id === selectedInvoiceId);
    if (!originalInv) {
      showToast('error', 'Original Invoice Required', 'Please select the original tax invoice against which this credit note is issued.');
      return;
    }

    const totalTaxable = items.reduce((s, it) => s + it.taxableAmount, 0);
    const totalCgst = items.reduce((s, it) => s + it.cgstAmount, 0);
    const totalSgst = items.reduce((s, it) => s + it.sgstAmount, 0);
    const totalIgst = items.reduce((s, it) => s + it.igstAmount, 0);
    const totalCess = items.reduce((s, it) => s + it.cessAmount, 0);
    const totalTax = totalCgst + totalSgst + totalIgst + totalCess;
    const netTotal = Math.round(totalTaxable + totalTax);

    const cn: CreditNote = {
      id: `cn-${Date.now()}`,
      creditNoteNumber,
      noteType,
      originalInvoiceId: originalInv.id,
      originalInvoiceNumber: originalInv.invoiceNumber,
      originalInvoiceDate: originalInv.invoiceDate,
      customerId: originalInv.customerId,
      customerName: originalInv.customerName,
      customerGstin: originalInv.customerGstin,
      creditNoteDate,
      reason,
      reasonDescription,
      items,
      totalTaxableAmount: Number(totalTaxable.toFixed(2)),
      totalCgstAmount: Number(totalCgst.toFixed(2)),
      totalSgstAmount: Number(totalSgst.toFixed(2)),
      totalIgstAmount: Number(totalIgst.toFixed(2)),
      totalCessAmount: Number(totalCess.toFixed(2)),
      totalTaxAmount: Number(totalTax.toFixed(2)),
      netTotal,
      netTotalInWords: numberToWordsIndian(netTotal),
      createdAt: new Date().toISOString(),
    };

    saveCreditNote(cn);
    setIsModalOpen(false);
  };

  const filteredNotes = creditNotes.filter(cn => {
    const q = searchQuery.toLowerCase();
    return (
      cn.creditNoteNumber.toLowerCase().includes(q) ||
      cn.originalInvoiceNumber.toLowerCase().includes(q) ||
      cn.customerName.toLowerCase().includes(q) ||
      (cn.customerGstin && cn.customerGstin.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-teal-600" />
            Credit / Debit Notes (CDNR) Register
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            GST Section 34 compliant credit/debit notes linked to original tax invoices for GSTR-1 Table 9B.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="py-2 px-3.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Credit / Debit Note</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search note number, original invoice, buyer..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Note No. & Date</th>
                <th className="px-4 py-3">Type & Reason</th>
                <th className="px-4 py-3">Original Invoice</th>
                <th className="px-4 py-3">Customer / Buyer</th>
                <th className="px-4 py-3 text-right">Taxable Adj (₹)</th>
                <th className="px-4 py-3 text-right">Net Note Value (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No Credit / Debit notes issued yet.
                  </td>
                </tr>
              ) : (
                filteredNotes.map(cn => (
                  <tr key={cn.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-800">{cn.creditNoteNumber}</div>
                      <div className="text-[11px] text-slate-400">{cn.creditNoteDate}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        cn.noteType === 'CREDIT' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
                      }`}>
                        {cn.noteType} NOTE
                      </span>
                      <div className="text-[11px] text-slate-600 mt-0.5">{cn.reason}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                        {cn.originalInvoiceNumber}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">Dated: {cn.originalInvoiceDate}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{cn.customerName}</div>
                      {cn.customerGstin && (
                        <div className="text-[11px] font-mono text-slate-500">{cn.customerGstin}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-700">
                      {formatINR(cn.totalTaxableAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(cn.netTotal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-teal-600" />
                Issue GST Credit / Debit Note
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Document Type
                  </label>
                  <select
                    value={noteType}
                    onChange={e => setNoteType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="CREDIT">Credit Note (Sales Return / Discount)</option>
                    <option value="DEBIT">Debit Note (Supplementary Charge)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Note Number
                  </label>
                  <input
                    type="text"
                    required
                    value={creditNoteNumber}
                    onChange={e => setCreditNoteNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Note Date
                  </label>
                  <input
                    type="date"
                    required
                    value={creditNoteDate}
                    onChange={e => setCreditNoteDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Select Original Tax Invoice <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedInvoiceId}
                  onChange={e => handleInvoiceSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {eligibleInvoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.customerName} ({inv.invoiceDate}) — Total: ₹{inv.netTotal}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    GST Statutory Reason Code
                  </label>
                  <select
                    value={reason}
                    onChange={e => setReason(e.target.value as CreditNoteReason)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="SALES_RETURN">01 - Sales Return</option>
                    <option value="POST_SALE_DISCOUNT">02 - Post Sale Discount</option>
                    <option value="DEFICIENCY_IN_SERVICE">03 - Deficiency in Services</option>
                    <option value="CORRECTION_IN_INVOICE">04 - Correction in Invoice</option>
                    <option value="CHANGE_IN_POS">05 - Change in POS</option>
                    <option value="OTHERS">06 - Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Detailed Remarks
                  </label>
                  <input
                    type="text"
                    value={reasonDescription}
                    onChange={e => setReasonDescription(e.target.value)}
                    placeholder="e.g. Return of 1 unit defective display panel"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Line Items for adjustment */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800">Items / Values to Adjust:</span>
                {items.map((it, idx) => (
                  <div key={it.id} className="grid grid-cols-12 gap-2 items-center text-xs">
                    <div className="col-span-5 font-semibold text-slate-800 truncate">{it.name}</div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min={0.1}
                        step="any"
                        value={it.quantity}
                        onChange={e => handleLineQtyChange(idx, parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-center"
                      />
                    </div>
                    <div className="col-span-2 font-mono text-right text-slate-700">₹{it.taxableAmount.toFixed(2)}</div>
                    <div className="col-span-3 font-mono font-bold text-right text-teal-900">₹{it.totalAmount.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Issue Credit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
