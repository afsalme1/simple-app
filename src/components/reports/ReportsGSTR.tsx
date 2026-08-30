import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  FileCode, 
  Calendar, 
  Layers, 
  ArrowUpRight, 
  CheckCircle2, 
  Sparkles,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { 
  generateGSTR1JSON, 
  generateGSTR1B2BCSV, 
  generateGSTR1B2CSCSV, 
  generateGSTR1HSNCSV, 
  downloadFile 
} from '../../utils/gstrExport';
import { formatINR } from '../../utils/gstEngine';

export const ReportsGSTR: React.FC = () => {
  const { company, invoices, creditNotes, showToast } = useApp();

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [reportTab, setReportTab] = useState<'GSTR1' | 'GSTR3B' | 'RATE_WISE' | 'SALES_REGISTER'>('GSTR1');

  // Filter invoices for selected month (or all if empty)
  const filteredInvoices = invoices.filter(i => {
    if (i.status === 'DRAFT') return false;
    if (!selectedMonth) return true;
    return i.invoiceDate.startsWith(selectedMonth);
  });

  const filteredCreditNotes = creditNotes.filter(cn => {
    if (!selectedMonth) return true;
    return cn.creditNoteDate.startsWith(selectedMonth);
  });

  // Calculate Rate-wise tax aggregation
  const rateWiseMap: Record<number, { count: number; taxable: number; cgst: number; sgst: number; igst: number; cess: number; total: number }> = {
    0: { count: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, total: 0 },
    5: { count: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, total: 0 },
    12: { count: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, total: 0 },
    18: { count: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, total: 0 },
    28: { count: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, total: 0 },
  };

  filteredInvoices
    .filter(i => i.status !== 'CANCELLED')
    .forEach(inv => {
      inv.items.forEach(item => {
        const rate = item.gstRate;
        if (!rateWiseMap[rate]) {
          rateWiseMap[rate] = { count: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, total: 0 };
        }
        rateWiseMap[rate].count += 1;
        rateWiseMap[rate].taxable += item.taxableAmount;
        rateWiseMap[rate].cgst += item.cgstAmount;
        rateWiseMap[rate].sgst += item.sgstAmount;
        rateWiseMap[rate].igst += item.igstAmount;
        rateWiseMap[rate].cess += item.cessAmount;
        rateWiseMap[rate].total += item.totalAmount;
      });
    });

  // GSTR-3B Totals (Table 3.1)
  const validInvoices = filteredInvoices.filter(i => i.status !== 'CANCELLED');
  const totalTaxable = validInvoices.reduce((s, i) => s + i.totalTaxableAmount, 0);
  const totalCgst = validInvoices.reduce((s, i) => s + i.totalCgstAmount, 0);
  const totalSgst = validInvoices.reduce((s, i) => s + i.totalSgstAmount, 0);
  const totalIgst = validInvoices.reduce((s, i) => s + i.totalIgstAmount, 0);
  const totalCess = validInvoices.reduce((s, i) => s + i.totalCessAmount, 0);
  const grandTax = totalCgst + totalSgst + totalIgst + totalCess;

  // Inter-state supplies to unregistered (Table 3.2)
  const interstateB2C = validInvoices.filter(i => i.isInterState && (!i.customerGstin || i.customerGstType === 'CONSUMER'));
  const interstateB2CTaxable = interstateB2C.reduce((s, i) => s + i.totalTaxableAmount, 0);
  const interstateB2CIgst = interstateB2C.reduce((s, i) => s + i.totalIgstAmount, 0);

  // Export handlers
  const handleExportGstr1Json = () => {
    const jsonObj = generateGSTR1JSON(company, filteredInvoices, filteredCreditNotes, selectedMonth);
    const jsonStr = JSON.stringify(jsonObj, null, 2);
    const filename = `GSTR1_${company.gstin}_${selectedMonth.replace('-', '')}.json`;
    downloadFile(jsonStr, filename, 'application/json');
    showToast('success', 'GSTR-1 JSON Generated', `Saved as ${filename} for GST Portal offline tool.`);
  };

  const handleExportB2BCsv = () => {
    const csv = generateGSTR1B2BCSV(filteredInvoices);
    const filename = `GSTR1_B2B_${company.gstin}_${selectedMonth}.csv`;
    downloadFile(csv, filename, 'text/csv;charset=utf-8;');
    showToast('success', 'B2B CSV Exported', `Saved as ${filename}`);
  };

  const handleExportB2CSCsv = () => {
    const csv = generateGSTR1B2CSCSV(filteredInvoices);
    const filename = `GSTR1_B2CS_${company.gstin}_${selectedMonth}.csv`;
    downloadFile(csv, filename, 'text/csv;charset=utf-8;');
    showToast('success', 'B2CS CSV Exported', `Saved as ${filename}`);
  };

  const handleExportHsnCsv = () => {
    const csv = generateGSTR1HSNCSV(filteredInvoices);
    const filename = `GSTR1_HSN_Summary_${company.gstin}_${selectedMonth}.csv`;
    downloadFile(csv, filename, 'text/csv;charset=utf-8;');
    showToast('success', 'HSN CSV Exported', `Saved as ${filename}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            GST Returns (GSTR-1 / GSTR-3B) & Tax Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Govt. portal compatible GSTR-1 JSON payload, B2B/B2C CSVs, and rate-wise output tax ledgers.
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-700">Tax Return Period:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="text-xs font-mono font-bold text-teal-900 border-none bg-transparent focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'GSTR1', label: 'GSTR-1 Portal JSON & CSV Exports' },
          { id: 'GSTR3B', label: 'GSTR-3B Table 3.1 & 3.2 Computation' },
          { id: 'RATE_WISE', label: 'Rate-wise GST Output Tax Summary' },
          { id: 'SALES_REGISTER', label: 'Detailed Sales Register' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setReportTab(t.id as any)}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              reportTab === t.id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: GSTR-1 Exports */}
      {reportTab === 'GSTR1' && (
        <div className="space-y-6">
          <div className="bg-teal-50/70 border border-teal-200 p-4 rounded-xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div className="text-xs text-teal-950 space-y-1">
              <span className="font-bold text-sm">GSTR-1 JSON Schema 1.1 Compliant</span>
              <p>
                Generated JSON can be directly imported into the GST Offline Tool or uploaded to the GST Portal (gst.gov.in) under Returns &gt; GSTR-1. Includes sections: 4A/4B (B2B), 5A (B2CL), 7 (B2CS), 9B (CDNR), 12 (HSN summary), and 13 (Docs issued).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* JSON Export Box */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 w-fit mb-3">
                  <FileCode className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">GSTR-1 Official JSON</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Full payload package for portal upload containing B2B, B2C, HSN, and Document series.
                </p>
              </div>

              <button
                onClick={handleExportGstr1Json}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download GSTR-1 JSON</span>
              </button>
            </div>

            {/* B2B Invoices CSV */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 w-fit mb-3">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Table 4A - B2B Invoices CSV</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Registered buyer invoices with buyer GSTIN, invoice number, value, rate and tax amounts.
                </p>
              </div>

              <button
                onClick={handleExportB2BCsv}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export B2B CSV</span>
              </button>
            </div>

            {/* B2CS Invoices CSV */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 w-fit mb-3">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Table 7 - B2CS Small CSV</h3>
                <p className="text-xs text-slate-500 mt-1">
                  State-wise and rate-wise summary of intra-state and small inter-state consumer supplies.
                </p>
              </div>

              <button
                onClick={handleExportB2CSCsv}
                className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export B2CS CSV</span>
              </button>
            </div>

            {/* HSN Summary CSV */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700 w-fit mb-3">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Table 12 - HSN Summary CSV</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Mandatory 4/6-digit HSN code summary with total quantities, taxable value, and tax breakdown.
                </p>
              </div>

              <button
                onClick={handleExportHsnCsv}
                className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export HSN CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GSTR-3B Table 3.1 & 3.2 Computation */}
      {reportTab === 'GSTR3B' && (
        <div className="space-y-6">
          {/* Table 3.1 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Table 3.1: Details of Outward Supplies and inward supplies liable to reverse charge
              </h3>
              <span className="font-mono text-xs text-teal-700 font-bold">Period: {selectedMonth}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3">Nature of Supplies</th>
                    <th className="px-4 py-3 text-right">Total Taxable Value (₹)</th>
                    <th className="px-4 py-3 text-right">Integrated Tax (₹)</th>
                    <th className="px-4 py-3 text-right">Central Tax (₹)</th>
                    <th className="px-4 py-3 text-right">State / UT Tax (₹)</th>
                    <th className="px-4 py-3 text-right">Cess (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="px-4 py-3 font-sans font-medium text-slate-800">
                      (a) Outward taxable supplies (other than zero rated, nil rated and exempted)
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{formatINR(totalTaxable)}</td>
                    <td className="px-4 py-3 text-right text-indigo-700">{formatINR(totalIgst)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatINR(totalCgst)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatINR(totalSgst)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatINR(totalCess)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-sans text-slate-600">
                      (b) Outward taxable supplies (zero rated)
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">0.00</td>
                    <td className="px-4 py-3 text-right text-slate-400">0.00</td>
                    <td className="px-4 py-3 text-right text-slate-400">0.00</td>
                    <td className="px-4 py-3 text-right text-slate-400">0.00</td>
                    <td className="px-4 py-3 text-right text-slate-400">0.00</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-sans text-slate-600">
                      (c) Other outward supplies (Nil rated, exempted)
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">0.00</td>
                    <td className="px-4 py-3 text-right text-slate-400">0.00</td>
                    <td className="px-4 py-3 text-right text-slate-400">0.00</td>
                    <td className="px-4 py-3 text-right text-slate-400">0.00</td>
                    <td className="px-4 py-3 text-right text-slate-400">0.00</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="px-4 py-3 font-sans text-slate-900">Total Output Tax Liability:</td>
                    <td className="px-4 py-3 text-right">{formatINR(totalTaxable)}</td>
                    <td className="px-4 py-3 text-right text-indigo-700">{formatINR(totalIgst)}</td>
                    <td className="px-4 py-3 text-right">{formatINR(totalCgst)}</td>
                    <td className="px-4 py-3 text-right">{formatINR(totalSgst)}</td>
                    <td className="px-4 py-3 text-right">{formatINR(totalCess)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 3.2 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Table 3.2: Inter-State supplies made to unregistered persons, composition dealers & UIN holders
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3">Place of Supply (State)</th>
                    <th className="px-4 py-3 text-right">Total Taxable Value (₹)</th>
                    <th className="px-4 py-3 text-right">Amount of Integrated Tax (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {interstateB2C.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-400 font-sans">
                        No inter-state supplies to unregistered persons in this period.
                      </td>
                    </tr>
                  ) : (
                    interstateB2C.map(inv => (
                      <tr key={inv.id}>
                        <td className="px-4 py-3 font-sans font-medium text-slate-800">{inv.placeOfSupply}</td>
                        <td className="px-4 py-3 text-right">{formatINR(inv.totalTaxableAmount)}</td>
                        <td className="px-4 py-3 text-right text-indigo-700 font-bold">{formatINR(inv.totalIgstAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Rate-wise GST Output Tax Summary */}
      {reportTab === 'RATE_WISE' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              GST Rate-Wise Output Tax Breakdown (0%, 5%, 12%, 18%, 28%)
            </h3>
            <span className="font-mono text-xs text-slate-500 font-semibold">{selectedMonth}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">GST Slab Rate</th>
                  <th className="px-4 py-3 text-center">Items Count</th>
                  <th className="px-4 py-3 text-right">Taxable Value (₹)</th>
                  <th className="px-4 py-3 text-right">CGST (₹)</th>
                  <th className="px-4 py-3 text-right">SGST (₹)</th>
                  <th className="px-4 py-3 text-right">IGST (₹)</th>
                  <th className="px-4 py-3 text-right">Total Tax (₹)</th>
                  <th className="px-4 py-3 text-right">Gross Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {Object.entries(rateWiseMap).map(([rateStr, v]) => {
                  const rate = Number(rateStr);
                  const tax = v.cgst + v.sgst + v.igst + v.cess;
                  return (
                    <tr key={rate} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-sans font-bold text-teal-900">
                        <span className="px-2.5 py-1 rounded bg-teal-50 border border-teal-200 text-teal-800 font-mono">
                          {rate}% GST
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{v.count}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{formatINR(v.taxable)}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{formatINR(v.cgst)}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{formatINR(v.sgst)}</td>
                      <td className="px-4 py-3 text-right text-indigo-700">{formatINR(v.igst)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">{formatINR(tax)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-800">{formatINR(v.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Detailed Sales Register */}
      {reportTab === 'SALES_REGISTER' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Sales Invoices Register ({filteredInvoices.length} Invoices)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Invoice No.</th>
                  <th className="px-4 py-3">Customer / Buyer</th>
                  <th className="px-4 py-3">Buyer GSTIN</th>
                  <th className="px-4 py-3 text-right">Taxable (₹)</th>
                  <th className="px-4 py-3 text-right">CGST</th>
                  <th className="px-4 py-3 text-right">SGST</th>
                  <th className="px-4 py-3 text-right">IGST</th>
                  <th className="px-4 py-3 text-right font-bold">Net Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-sans text-slate-600">{inv.invoiceDate}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 font-sans font-semibold text-slate-800">{inv.customerName}</td>
                    <td className="px-4 py-3 text-slate-600">{inv.customerGstin || 'B2C'}</td>
                    <td className="px-4 py-3 text-right">{formatINR(inv.totalTaxableAmount)}</td>
                    <td className="px-4 py-3 text-right">{formatINR(inv.totalCgstAmount)}</td>
                    <td className="px-4 py-3 text-right">{formatINR(inv.totalSgstAmount)}</td>
                    <td className="px-4 py-3 text-right text-indigo-700">{formatINR(inv.totalIgstAmount)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">{formatINR(inv.netTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
