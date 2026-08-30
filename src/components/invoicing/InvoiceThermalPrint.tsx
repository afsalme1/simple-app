import React, { useState, useEffect } from 'react';
import { Printer, X, Receipt, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/gstEngine';
import { generateInvoiceUPIQRCode, triggerPrint } from '../../utils/printUtils';

export const InvoiceThermalPrint: React.FC = () => {
  const { printInvoice, setPrintInvoice, company, printFormat, setPrintFormat } = useApp();
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('');

  const invoice = printInvoice;

  useEffect(() => {
    if (invoice && company.upiId) {
      generateInvoiceUPIQRCode(company, invoice).then(qr => {
        setUpiQrDataUrl(qr);
      });
    }
  }, [invoice, company]);

  if (!invoice || (printFormat !== 'THERMAL_2' && printFormat !== 'THERMAL_3')) return null;

  const docType = invoice.documentType || 'TAX_INVOICE';

  const docTitles = {
    TAX_INVOICE: 'TAX INVOICE / POS RECEIPT',
    BILL_OF_SUPPLY: 'BILL OF SUPPLY / POS RECEIPT',
    ESTIMATE: 'PRICE ESTIMATE / QUOTATION',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-4 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Top Action Bar */}
      <div className="w-full max-w-md bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between shadow-xl mb-4 print:hidden shrink-0">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-bold">{docTitles[docType]}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Paper Size selector */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded text-[11px]">
            <button
              onClick={() => setPaperWidth('58mm')}
              className={`px-2 py-0.5 rounded cursor-pointer ${paperWidth === '58mm' ? 'bg-teal-600 text-white font-bold' : 'text-slate-300'}`}
            >
              2" (58mm)
            </button>
            <button
              onClick={() => setPaperWidth('80mm')}
              className={`px-2 py-0.5 rounded cursor-pointer ${paperWidth === '80mm' ? 'bg-teal-600 text-white font-bold' : 'text-slate-300'}`}
            >
              3" (80mm)
            </button>
          </div>

          <button
            onClick={() => setPrintFormat('A4')}
            className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
          >
            A4 Sheet
          </button>

          <button
            onClick={() => triggerPrint()}
            className="py-1 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={() => setPrintInvoice(null)}
            className="p-1 text-slate-400 hover:text-white rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thermal Receipt Container */}
      <div
        id="printable-thermal-invoice"
        className={`bg-white text-black p-4 shadow-2xl border border-slate-300 print:shadow-none print:border-none print:p-0 print:m-0 font-mono text-[11px] leading-tight ${
          paperWidth === '58mm' ? 'w-[58mm] max-w-[58mm] text-[9.5px]' : 'w-[80mm] max-w-[80mm]'
        }`}
      >
        {/* Store Title */}
        <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-black">
          <h2 className="text-xs font-bold uppercase tracking-wider">{company.name}</h2>
          {company.tradeName && <div className="text-[10px]">{company.tradeName}</div>}
          <div className="text-[10px]">{company.address}, {company.city}</div>
          <div className="text-[10px]">GSTIN: <strong>{company.gstin}</strong></div>
          <div className="text-[10px]">Ph: {company.phone}</div>
        </div>

        {/* Invoice Title & Details */}
        <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
          <div className="text-center font-bold uppercase">{docTitles[docType]}</div>
          {docType === 'BILL_OF_SUPPLY' && (
            <div className="text-center text-[8.5px] italic pb-1">
              (Composition dealer - not eligible to collect tax)
            </div>
          )}
          {docType === 'ESTIMATE' && (
            <div className="text-center text-[8.5px] italic pb-1">
              (Quotation only - not a tax invoice)
            </div>
          )}
          <div className="flex justify-between">
            <span>Doc No:</span>
            <strong>{invoice.invoiceNumber}</strong>
          </div>
          <div className="flex justify-between">
            <span>Date & Time:</span>
            <span>{invoice.invoiceDate}</span>
          </div>
          {docType === 'ESTIMATE' && invoice.validUntilDate && (
            <div className="flex justify-between font-bold">
              <span>Valid Until:</span>
              <span>{invoice.validUntilDate}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Customer:</span>
            <span className="font-semibold">{invoice.customerName}</span>
          </div>
          {invoice.customerGstin && (
            <div className="flex justify-between">
              <span>Cust GSTIN:</span>
              <span>{invoice.customerGstin}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>POS (State):</span>
            <span>{invoice.placeOfSupply}</span>
          </div>
        </div>

        {/* Line Items */}
        <div className="py-2 border-b border-dashed border-black">
          <div className="flex justify-between font-bold border-b border-black pb-0.5 mb-1 text-[10px]">
            <span>Item / HSN</span>
            <span className="text-right">Qty x Rate = Net</span>
          </div>

          <div className="space-y-1.5">
            {invoice.items.map((it, idx) => (
              <div key={it.id} className="text-[10px]">
                <div className="font-semibold">{idx + 1}. {it.name}</div>
                <div className="flex justify-between text-slate-700">
                  <span>[{it.hsnSacCode}] {it.quantity} {it.unit} @ ₹{it.rate} {docType !== 'BILL_OF_SUPPLY' ? `(${it.gstRate}%)` : ''}</span>
                  <span className="font-bold text-black">₹{it.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GST Tax Breakdown */}
        <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
          <div className="flex justify-between">
            <span>Taxable Value:</span>
            <span>{formatINR(invoice.totalTaxableAmount)}</span>
          </div>

          {docType !== 'BILL_OF_SUPPLY' && (
            !invoice.isInterState ? (
              <>
                <div className="flex justify-between">
                  <span>CGST:</span>
                  <span>{formatINR(invoice.totalCgstAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST:</span>
                  <span>{formatINR(invoice.totalSgstAmount)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span>IGST:</span>
                <span>{formatINR(invoice.totalIgstAmount)}</span>
              </div>
            )
          )}

          {invoice.additionalChargesAmount > 0 && (
            <div className="flex justify-between">
              <span>{invoice.additionalChargesName}:</span>
              <span>{formatINR(invoice.additionalChargesAmount)}</span>
            </div>
          )}

          {invoice.overallDiscountAmount > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{formatINR(invoice.overallDiscountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Round Off:</span>
            <span>{invoice.roundOff >= 0 ? `+${invoice.roundOff}` : invoice.roundOff}</span>
          </div>

          <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
            <span>{docType === 'ESTIMATE' ? 'QUOTATION TOTAL:' : 'GRAND TOTAL:'}</span>
            <span>{formatINR(invoice.netTotal)}</span>
          </div>

          {docType !== 'ESTIMATE' && (
            <>
              <div className="flex justify-between text-[10px] pt-0.5">
                <span>Amount Paid:</span>
                <span>{formatINR(invoice.paidAmount)}</span>
              </div>

              {invoice.balanceAmount > 0 && (
                <div className="flex justify-between font-bold text-[10px] text-rose-700">
                  <span>Balance Due:</span>
                  <span>{formatINR(invoice.balanceAmount)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Payment UPI QR Code */}
        {upiQrDataUrl && (
          <div className="py-3 flex flex-col items-center justify-center text-center border-b border-dashed border-black">
            <img src={upiQrDataUrl} alt="UPI QR" className="w-24 h-24 object-contain" />
            <div className="text-[9px] font-bold mt-1">SCAN & PAY VIA UPI</div>
            <div className="text-[9px]">{company.upiId}</div>
          </div>
        )}

        {/* Footer Greetings */}
        <div className="pt-2 text-center text-[9px] space-y-0.5">
          <div>Thank you for your business!</div>
          <div>Goods once sold cannot be returned without bill.</div>
          <div className="font-bold text-[8px] pt-1">*** END OF RECEIPT ***</div>
        </div>
      </div>
    </div>
  );
};
