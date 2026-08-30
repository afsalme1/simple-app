import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  QrCode, 
  Building2, 
  FileText, 
  CheckCircle2,
  Layers,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';
import { formatINR } from '../../utils/gstEngine';
import { generateInvoiceUPIQRCode, triggerPrint } from '../../utils/printUtils';

export const InvoiceA4Print: React.FC = () => {
  const { printInvoice, setPrintInvoice, company, printFormat, setPrintFormat } = useApp();
  const [copyType, setCopyType] = useState<'ORIGINAL' | 'DUPLICATE' | 'TRIPLICATE'>('ORIGINAL');
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('');

  const invoice = printInvoice;

  useEffect(() => {
    if (invoice && company.upiId) {
      generateInvoiceUPIQRCode(company, invoice).then(qr => {
        setUpiQrDataUrl(qr);
      });
    }
  }, [invoice, company]);

  if (!invoice || printFormat !== 'A4') return null;

  const docType = invoice.documentType || 'TAX_INVOICE';

  const copyLabels = {
    ORIGINAL: 'ORIGINAL FOR RECIPIENT',
    DUPLICATE: 'DUPLICATE FOR TRANSPORTER',
    TRIPLICATE: 'TRIPLICATE FOR SUPPLIER',
  };

  const documentTitles = {
    TAX_INVOICE: 'TAX INVOICE',
    BILL_OF_SUPPLY: 'BILL OF SUPPLY',
    ESTIMATE: 'ESTIMATE / QUOTATION',
  };

  // Group rate wise GST tax summary
  const rateSummaryMap: Record<number, { taxable: number; cgst: number; sgst: number; igst: number; cess: number }> = {};
  invoice.items.forEach(item => {
    if (!rateSummaryMap[item.gstRate]) {
      rateSummaryMap[item.gstRate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 };
    }
    rateSummaryMap[item.gstRate].taxable += item.taxableAmount;
    rateSummaryMap[item.gstRate].cgst += item.cgstAmount;
    rateSummaryMap[item.gstRate].sgst += item.sgstAmount;
    rateSummaryMap[item.gstRate].igst += item.igstAmount;
    rateSummaryMap[item.gstRate].cess += item.cessAmount;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-4 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Non-Printable Top Action Bar */}
      <div className="w-full max-w-4xl bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between shadow-xl mb-4 print:hidden shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-600 rounded-lg text-white font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{documentTitles[docType]} Preview (A4 Sheet)</h3>
            <p className="text-xs text-slate-400">Doc No: {invoice.invoiceNumber}</p>
          </div>
        </div>

        {/* Copy switcher for Tax Invoices */}
        {docType === 'TAX_INVOICE' && (
          <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
            {(['ORIGINAL', 'DUPLICATE', 'TRIPLICATE'] as const).map(type => (
              <button
                key={type}
                onClick={() => setCopyType(type)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  copyType === type ? 'bg-teal-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                {type === 'ORIGINAL' ? 'Original' : type === 'DUPLICATE' ? 'Duplicate' : 'Triplicate'}
              </button>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPrintFormat('THERMAL_3')}
            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Switch to Thermal
          </button>
          <button
            onClick={() => triggerPrint()}
            className="py-1.5 px-4 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Document</span>
          </button>
          <button
            onClick={() => setPrintInvoice(null)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable A4 Document Sheet */}
      <div 
        id="printable-a4-invoice"
        className="w-full max-w-4xl bg-white text-slate-900 p-8 sm:p-10 shadow-2xl rounded-sm border border-slate-300 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none text-xs leading-normal"
        style={{ minHeight: '297mm' }}
      >
        {/* Document Header & Title */}
        <div className="text-center pb-2 border-b-2 border-slate-900">
          <h1 className="text-xl font-extrabold uppercase tracking-wider text-slate-900">
            {documentTitles[docType]}
          </h1>
          {docType === 'TAX_INVOICE' && (
            <p className="text-[11px] font-semibold text-slate-600 tracking-wide mt-0.5">
              ({copyLabels[copyType]})
            </p>
          )}
          {docType === 'BILL_OF_SUPPLY' && (
            <p className="text-[10px] font-bold text-slate-700 tracking-wide mt-0.5">
              (Composition taxable person, not eligible to collect tax on supplies)
            </p>
          )}
          {docType === 'ESTIMATE' && (
            <p className="text-[10px] font-medium text-slate-600 tracking-wide mt-0.5">
              (This is a commercial quotation/estimate and not a tax invoice under GST laws)
            </p>
          )}
        </div>

        {/* Company and Invoice Info Bar */}
        <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-300">
          {/* Seller / Supplier Details */}
          <div className="space-y-1 pr-4 border-r border-slate-300">
            <div className="flex items-center gap-3">
              {company.logoUrl && (
                <img src={company.logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded" />
              )}
              <div>
                <h2 className="text-sm font-bold uppercase text-slate-900">{company.name}</h2>
                {company.tradeName && <p className="text-[11px] text-slate-600 font-medium">{company.tradeName}</p>}
              </div>
            </div>
            <p className="text-slate-700 leading-tight pt-1">
              {company.address}, {company.city} - {company.pincode}
            </p>
            <div className="font-mono text-[11px] space-y-0.5 pt-1 text-slate-800">
              <div><strong>GSTIN:</strong> {company.gstin}</div>
              <div><strong>PAN:</strong> {company.pan}</div>
              <div><strong>State:</strong> {company.state} (Code: {company.stateCode})</div>
              <div><strong>Phone:</strong> {company.phone} {company.email && `| Email: ${company.email}`}</div>
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="space-y-1.5 pl-2 font-mono text-[11px]">
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-600 font-sans">
                {docType === 'ESTIMATE' ? 'Estimate No:' : 'Document No:'}
              </span>
              <strong className="text-xs text-slate-900">{invoice.invoiceNumber}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-600 font-sans">
                {docType === 'ESTIMATE' ? 'Estimate Date:' : 'Invoice Date:'}
              </span>
              <span className="font-semibold text-slate-800">{invoice.invoiceDate}</span>
            </div>
            {docType === 'ESTIMATE' && invoice.validUntilDate && (
              <div className="flex justify-between border-b border-slate-200 pb-1 text-purple-900 font-bold">
                <span className="font-sans">Quotation Valid Until:</span>
                <span>{invoice.validUntilDate}</span>
              </div>
            )}
            {docType !== 'ESTIMATE' && invoice.dueDate && (
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-600 font-sans">Payment Due Date:</span>
                <span>{invoice.dueDate}</span>
              </div>
            )}
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-600 font-sans">Place of Supply:</span>
              <strong className="text-slate-800">{invoice.placeOfSupply}</strong>
            </div>
            {docType !== 'ESTIMATE' && (
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-600 font-sans">Reverse Charge:</span>
                <span>{invoice.isReverseCharge ? 'Yes' : 'No'}</span>
              </div>
            )}
            {invoice.eWayBillNo && (
              <div className="flex justify-between">
                <span className="text-slate-600 font-sans">E-Way Bill No:</span>
                <span>{invoice.eWayBillNo}</span>
              </div>
            )}
          </div>
        </div>

        {/* Buyer (Bill To & Ship To) Info */}
        <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-300">
          <div className="space-y-1 pr-4 border-r border-slate-300">
            <h4 className="font-bold uppercase text-[11px] text-slate-800 tracking-wider">
              {docType === 'ESTIMATE' ? 'Quotation Prepared For:' : 'Billed To (Recipient):'}
            </h4>
            <div className="font-bold text-slate-900 text-xs">{invoice.customerName}</div>
            <p className="text-slate-700 leading-tight">{invoice.billingAddress}</p>
            <div className="font-mono text-[11px] pt-1 text-slate-800 space-y-0.5">
              <div><strong>GSTIN / UIN:</strong> {invoice.customerGstin || 'Unregistered Consumer'}</div>
              <div><strong>State:</strong> {invoice.customerState} (Code: {invoice.customerStateCode})</div>
              {invoice.customerPhone && <div><strong>Mobile:</strong> {invoice.customerPhone}</div>}
            </div>
          </div>

          <div className="space-y-1 pl-2">
            <h4 className="font-bold uppercase text-[11px] text-slate-800 tracking-wider">
              {docType === 'ESTIMATE' ? 'Delivery Location:' : 'Shipped To (Consignee):'}
            </h4>
            <div className="font-bold text-slate-900 text-xs">{invoice.customerName}</div>
            <p className="text-slate-700 leading-tight">{invoice.shippingAddress || invoice.billingAddress}</p>
            <div className="font-mono text-[11px] pt-1 text-slate-800">
              <div><strong>Destination State:</strong> {invoice.placeOfSupply}</div>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="py-3">
          <table className="w-full border-collapse border border-slate-400 text-left text-[11px]">
            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
              <tr>
                <th className="border border-slate-400 p-1.5 w-8 text-center">#</th>
                <th className="border border-slate-400 p-1.5">Description of Goods / Services</th>
                <th className="border border-slate-400 p-1.5 w-16 text-center">HSN/SAC</th>
                <th className="border border-slate-400 p-1.5 w-12 text-center">Qty</th>
                <th className="border border-slate-400 p-1.5 w-12 text-center">Unit</th>
                <th className="border border-slate-400 p-1.5 w-20 text-right">Rate (₹)</th>
                <th className="border border-slate-400 p-1.5 w-14 text-right">Disc</th>
                <th className="border border-slate-400 p-1.5 w-20 text-right">Taxable (₹)</th>
                {docType !== 'BILL_OF_SUPPLY' && (
                  <th className="border border-slate-400 p-1.5 w-14 text-center">GST %</th>
                )}
                <th className="border border-slate-400 p-1.5 w-24 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {invoice.items.map((it, idx) => (
                <tr key={it.id}>
                  <td className="border border-slate-300 p-1.5 text-center font-mono">{idx + 1}</td>
                  <td className="border border-slate-300 p-1.5 font-medium">{it.name}</td>
                  <td className="border border-slate-300 p-1.5 text-center font-mono">{it.hsnSacCode}</td>
                  <td className="border border-slate-300 p-1.5 text-center font-mono font-semibold">{it.quantity}</td>
                  <td className="border border-slate-300 p-1.5 text-center">{it.unit}</td>
                  <td className="border border-slate-300 p-1.5 text-right font-mono">{it.rate.toFixed(2)}</td>
                  <td className="border border-slate-300 p-1.5 text-right font-mono">
                    {it.discountPercent > 0 ? `${it.discountPercent}%` : '-'}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-right font-mono font-semibold">{it.taxableAmount.toFixed(2)}</td>
                  {docType !== 'BILL_OF_SUPPLY' && (
                    <td className="border border-slate-300 p-1.5 text-center font-mono">{it.gstRate}%</td>
                  )}
                  <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">{it.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* GST Tax Summary Table & Invoice Calculation */}
        <div className="grid grid-cols-12 gap-4 py-2 border-t border-slate-300">
          {/* Rate Wise GST Breakup (Left 7 Cols) */}
          <div className="col-span-7 space-y-2">
            {docType !== 'BILL_OF_SUPPLY' ? (
              <>
                <h4 className="font-bold uppercase text-[10px] text-slate-700 tracking-wider">
                  GST Tax Summary (Rate-wise Breakup)
                </h4>
                <table className="w-full border-collapse border border-slate-300 text-[10px] text-left">
                  <thead className="bg-slate-50 font-bold border-b border-slate-300">
                    <tr>
                      <th className="border border-slate-300 p-1">Rate</th>
                      <th className="border border-slate-300 p-1 text-right">Taxable (₹)</th>
                      {!invoice.isInterState ? (
                        <>
                          <th className="border border-slate-300 p-1 text-right">CGST (₹)</th>
                          <th className="border border-slate-300 p-1 text-right">SGST (₹)</th>
                        </>
                      ) : (
                        <th className="border border-slate-300 p-1 text-right">IGST (₹)</th>
                      )}
                      <th className="border border-slate-300 p-1 text-right">Total Tax (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(rateSummaryMap).map(([rateStr, v]) => {
                      const rate = Number(rateStr);
                      const totalT = v.cgst + v.sgst + v.igst + v.cess;
                      return (
                        <tr key={rate}>
                          <td className="border border-slate-300 p-1 font-mono font-semibold">{rate}%</td>
                          <td className="border border-slate-300 p-1 text-right font-mono">{v.taxable.toFixed(2)}</td>
                          {!invoice.isInterState ? (
                            <>
                              <td className="border border-slate-300 p-1 text-right font-mono">{v.cgst.toFixed(2)}</td>
                              <td className="border border-slate-300 p-1 text-right font-mono">{v.sgst.toFixed(2)}</td>
                            </>
                          ) : (
                            <td className="border border-slate-300 p-1 text-right font-mono">{v.igst.toFixed(2)}</td>
                          )}
                          <td className="border border-slate-300 p-1 text-right font-mono font-bold">{totalT.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px]">
                <strong>Composition Scheme Supply:</strong> Goods/services are supplied under composition scheme or as exempt supply without charging GST.
              </div>
            )}

            {/* Amount In Words */}
            <div className="p-2 bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-900 mt-2">
              <strong>Amount in Words:</strong>
              <div className="italic font-medium">{invoice.netTotalInWords}</div>
            </div>
          </div>

          {/* Totals Table (Right 5 Cols) */}
          <div className="col-span-5 space-y-1 text-[11px] font-mono">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="font-sans text-slate-700">Total Taxable Value:</span>
              <span className="font-bold">{formatINR(invoice.totalTaxableAmount)}</span>
            </div>

            {docType !== 'BILL_OF_SUPPLY' && (
              !invoice.isInterState ? (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="font-sans text-slate-700">Central Tax (CGST):</span>
                    <span>{formatINR(invoice.totalCgstAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="font-sans text-slate-700">State Tax (SGST):</span>
                    <span>{formatINR(invoice.totalSgstAmount)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="font-sans text-slate-700">Integrated Tax (IGST):</span>
                  <span>{formatINR(invoice.totalIgstAmount)}</span>
                </div>
              )
            )}

            {invoice.additionalChargesAmount > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-sans text-slate-700">{invoice.additionalChargesName}:</span>
                <span>{formatINR(invoice.additionalChargesAmount)}</span>
              </div>
            )}

            {invoice.overallDiscountAmount > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-200 text-rose-700">
                <span className="font-sans">Discount:</span>
                <span>-{formatINR(invoice.overallDiscountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
              <span className="font-sans">Round Off:</span>
              <span>{invoice.roundOff >= 0 ? `+${invoice.roundOff}` : invoice.roundOff}</span>
            </div>

            {/* Final Grand Total Box */}
            <div className="flex justify-between py-2 border-t-2 border-b-2 border-slate-900 text-xs font-bold text-slate-900 bg-slate-100 px-2">
              <span className="font-sans uppercase">{docType === 'ESTIMATE' ? 'Quotation Total:' : 'Grand Total:'}</span>
              <span className="text-sm">{formatINR(invoice.netTotal)}</span>
            </div>
          </div>
        </div>

        {/* Bank & UPI QR Code Section */}
        <div className="grid grid-cols-12 gap-4 py-3 border-t border-slate-300">
          <div className="col-span-8 space-y-1">
            <h4 className="font-bold uppercase text-[11px] text-slate-800 tracking-wider">
              Bank Details for Electronic Transfer (NEFT / RTGS / IMPS):
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] font-mono text-slate-800">
              <div><strong>Bank:</strong> {company.bankName}</div>
              <div><strong>A/c No:</strong> {company.accountNumber}</div>
              <div><strong>IFSC:</strong> {company.ifscCode}</div>
              <div><strong>Branch:</strong> {company.branchName}</div>
              <div className="col-span-2"><strong>A/c Name:</strong> {company.accountHolder}</div>
            </div>
            
            {/* Terms and conditions */}
            <div className="pt-2">
              <h5 className="font-bold text-[10px] uppercase text-slate-700">Terms & Conditions:</h5>
              <p className="text-[10px] text-slate-600 whitespace-pre-line leading-tight">
                {company.termsAndConditions}
              </p>
            </div>
          </div>

          {/* Dynamic Bharat / UPI QR Code */}
          <div className="col-span-4 flex flex-col items-center justify-center p-2 border border-slate-300 rounded bg-slate-50 text-center">
            {upiQrDataUrl ? (
              <>
                <img src={upiQrDataUrl} alt="UPI QR Code" className="w-24 h-24 object-contain" />
                <span className="text-[9px] font-mono font-bold text-slate-800 mt-1">Scan to Pay via UPI</span>
                <span className="text-[9px] font-mono text-teal-800">{formatINR(invoice.balanceAmount > 0 ? invoice.balanceAmount : invoice.netTotal)}</span>
              </>
            ) : (
              <div className="text-[10px] text-slate-400 py-4">No UPI Configured</div>
            )}
          </div>
        </div>

        {/* Declaration and Signatory Footer */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-900">
          <div>
            <p className="text-[9px] text-slate-600 italic leading-tight">
              <strong>Declaration:</strong> {company.declaration}
            </p>
          </div>

          <div className="text-right space-y-8 pr-2">
            <span className="text-[10px] font-bold text-slate-800">
              {company.authorizedSignatoryText}
            </span>
            <div className="text-[10px] text-slate-700 font-semibold border-t border-slate-400 pt-1 inline-block min-w-[180px]">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
