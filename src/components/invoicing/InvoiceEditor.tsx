import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Zap, 
  CheckCircle2, 
  ArrowLeft, 
  Printer, 
  CreditCard, 
  Calendar, 
  Layers, 
  Sparkles,
  Keyboard,
  TrendingUp,
  Eye,
  EyeOff,
  FileCheck,
  Calculator,
  ShieldCheck,
  AlertCircle,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceItem, Customer, Item, GSTType, DocumentType } from '../../types';
import { GST_STATES, calculateLineItem, calculateInvoiceProfit, numberToWordsIndian, formatINR, formatInvoiceNumber } from '../../utils/gstEngine';
import { ItemDescriptionAutocomplete } from './ItemDescriptionAutocomplete';
import { ScanItemsImageModal } from '../masters/ScanItemsImageModal';

export const InvoiceEditor: React.FC = () => {
  const { 
    company, 
    customers, 
    items, 
    getNextInvoiceNumber, 
    saveInvoice, 
    deleteInvoice,
    editingInvoiceId, 
    setEditingInvoiceId, 
    invoices, 
    setCurrentView, 
    setPrintInvoice, 
    setPrintFormat,
    showToast 
  } = useApp();

  const editingInvoice = editingInvoiceId ? invoices.find(i => i.id === editingInvoiceId) : null;
  const isEditing = Boolean(editingInvoice);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Document Type State
  const [documentType, setDocumentType] = useState<DocumentType>('TAX_INVOICE');
  const [validUntilDate, setValidUntilDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // Profit Details Visibility Toggle
  const [showProfitDetails, setShowProfitDetails] = useState(true);

  // Invoice Header State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [sequenceNumber, setSequenceNumber] = useState(1);
  const [financialYear, setFinancialYear] = useState(company.currentFY);
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Customer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-walkin');
  const [customerName, setCustomerName] = useState('Walk-in Cash Customer');
  const [customerGstin, setCustomerGstin] = useState('');
  const [customerGstType, setCustomerGstType] = useState<GSTType>('CONSUMER');
  const [customerState, setCustomerState] = useState(company.state);
  const [customerStateCode, setCustomerStateCode] = useState(company.stateCode);
  const [placeOfSupplyStateCode, setPlaceOfSupplyStateCode] = useState(company.stateCode);
  const [billingAddress, setBillingAddress] = useState('Counter Sale, Local Store');
  const [shippingAddress, setShippingAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('9999999999');

  // Reverse Charge & Transport
  const [isReverseCharge, setIsReverseCharge] = useState(false);
  const [eWayBillNo, setEWayBillNo] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');

  // Line items
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([]);

  // Additional Charges & Overall Discount
  const [additionalChargesName, setAdditionalChargesName] = useState('Freight & Handling');
  const [additionalChargesAmount, setAdditionalChargesAmount] = useState(0);
  const [overallDiscountPercent, setOverallDiscountPercent] = useState(0);

  // Spot Payment
  const [isPaidOnSpot, setIsPaidOnSpot] = useState(false);
  const [spotPaymentMode, setSpotPaymentMode] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD'>('CASH');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  // Derived Interstate Status
  const isInterState = placeOfSupplyStateCode !== company.stateCode;

  // Initialize or Load Invoice
  useEffect(() => {
    if (editingInvoice) {
      setDocumentType(editingInvoice.documentType || 'TAX_INVOICE');
      setValidUntilDate(editingInvoice.validUntilDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setInvoiceNumber(editingInvoice.invoiceNumber);
      setSequenceNumber(editingInvoice.sequenceNumber);
      setFinancialYear(editingInvoice.financialYear);
      setInvoiceDate(editingInvoice.invoiceDate);
      setDueDate(editingInvoice.dueDate || editingInvoice.invoiceDate);
      setSelectedCustomerId(editingInvoice.customerId);
      setCustomerName(editingInvoice.customerName);
      setCustomerGstin(editingInvoice.customerGstin || '');
      setCustomerGstType(editingInvoice.customerGstType);
      setCustomerState(editingInvoice.customerState);
      setCustomerStateCode(editingInvoice.customerStateCode);
      setPlaceOfSupplyStateCode(editingInvoice.placeOfSupplyStateCode);
      setBillingAddress(editingInvoice.billingAddress);
      setShippingAddress(editingInvoice.shippingAddress || '');
      setCustomerPhone(editingInvoice.customerPhone || '');
      setLineItems(editingInvoice.items);
      setAdditionalChargesName(editingInvoice.additionalChargesName || 'Freight & Handling');
      setAdditionalChargesAmount(editingInvoice.additionalChargesAmount || 0);
      setOverallDiscountPercent(editingInvoice.overallDiscountPercent || 0);
      setIsPaidOnSpot(editingInvoice.paidAmount >= editingInvoice.netTotal && editingInvoice.netTotal > 0);
    } else {
      const nextNum = getNextInvoiceNumber(documentType);
      setInvoiceNumber(nextNum.invoiceNumber);
      setSequenceNumber(nextNum.sequenceNumber);
      setFinancialYear(nextNum.financialYear);

      // Default with 1 blank line item ready for typing or search
      const calc = calculateLineItem(
        1, 
        0, 
        0, 
        0, 
        documentType === 'BILL_OF_SUPPLY' ? 0 : (company.defaultGstRate || 18), 
        0, 
        false, 
        0
      );

      setLineItems([
        {
          id: `line-${Date.now()}`,
          itemId: undefined,
          name: '',
          hsnSacCode: '',
          unit: 'PCS',
          purchasePrice: 0,
          ...calc,
        },
      ]);
    }
  }, [editingInvoiceId]);

  // When changing document type on a new invoice
  const handleDocumentTypeChange = (newType: DocumentType) => {
    if (newType === documentType) return;
    setDocumentType(newType);

    if (!isEditing) {
      const nextNum = getNextInvoiceNumber(newType);
      setInvoiceNumber(nextNum.invoiceNumber);
      setSequenceNumber(nextNum.sequenceNumber);
      setFinancialYear(nextNum.financialYear);
    }

    // If switching to Bill of Supply, zero-out GST rates
    if (newType === 'BILL_OF_SUPPLY') {
      const zeroedLines = lineItems.map(l => {
        const calc = calculateLineItem(l.quantity, l.rate, l.discountPercent, 0, 0, 0, false, l.purchasePrice);
        return { ...l, ...calc, gstRate: 0, cessRate: 0 };
      });
      setLineItems(zeroedLines);
    } else {
      // Re-apply item master GST rates
      const restoredLines = lineItems.map(l => {
        const origItem = items.find(it => it.id === l.itemId);
        const rateToUse = origItem ? origItem.gstRate : 18;
        const calc = calculateLineItem(l.quantity, l.rate, l.discountPercent, 0, rateToUse, 0, isInterState, l.purchasePrice);
        return { ...l, ...calc };
      });
      setLineItems(restoredLines);
    }
  };

  // When Customer dropdown changes
  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const found = customers.find(c => c.id === customerId);
    if (found) {
      setCustomerName(found.name);
      setCustomerGstin(found.gstin || '');
      setCustomerGstType(found.gstType);
      setCustomerState(found.state);
      setCustomerStateCode(found.stateCode);
      setPlaceOfSupplyStateCode(found.stateCode);
      setBillingAddress(found.billingAddress || '');
      setShippingAddress(found.shippingAddress || found.billingAddress || '');
      setCustomerPhone(found.phone || '');

      // Recalculate line taxes based on inter-state status
      const willBeInterState = found.stateCode !== company.stateCode;
      recalculateAllLines(lineItems, willBeInterState);
    }
  };

  // Quick Walk-In shortcut
  const handleWalkInShortcut = () => {
    const walkin = customers.find(c => c.id === 'cust-walkin') || {
      id: 'cust-walkin',
      name: 'Walk-in Cash Customer',
      gstType: 'CONSUMER' as const,
      state: company.state,
      stateCode: company.stateCode,
      billingAddress: 'Counter Sale, Local Store',
      phone: '9999999999',
    };
    setSelectedCustomerId(walkin.id);
    setCustomerName(walkin.name);
    setCustomerGstin('');
    setCustomerGstType('CONSUMER');
    setCustomerState(company.state);
    setCustomerStateCode(company.stateCode);
    setPlaceOfSupplyStateCode(company.stateCode);
    setBillingAddress(walkin.billingAddress);
    setCustomerPhone('9999999999');
    setIsPaidOnSpot(true);
    setSpotPaymentMode('CASH');
    recalculateAllLines(lineItems, false);
  };

  const handlePlaceOfSupplyChange = (code: string) => {
    setPlaceOfSupplyStateCode(code);
    const willBeInterState = code !== company.stateCode;
    recalculateAllLines(lineItems, willBeInterState);
  };

  const recalculateAllLines = (lines: InvoiceItem[], interstate: boolean) => {
    const updated = lines.map(line => {
      const calc = calculateLineItem(
        line.quantity,
        line.rate,
        line.discountPercent,
        line.discountAmount,
        documentType === 'BILL_OF_SUPPLY' ? 0 : line.gstRate,
        line.cessRate,
        interstate,
        line.purchasePrice
      );
      return {
        ...line,
        ...calc,
      };
    });
    setLineItems(updated);
  };

  // Line Item modifications
  const handleItemSelect = (lineIndex: number, itemOrId: Item | string) => {
    const itemObj = typeof itemOrId === 'string' ? items.find(i => i.id === itemOrId) : itemOrId;
    if (!itemObj) return;

    const currentLine = lineItems[lineIndex];
    const gstRateToUse = documentType === 'BILL_OF_SUPPLY' ? 0 : itemObj.gstRate;
    const calc = calculateLineItem(
      currentLine.quantity || 1,
      itemObj.sellingPrice,
      currentLine.discountPercent,
      currentLine.discountAmount,
      gstRateToUse,
      itemObj.cessRate || 0,
      isInterState,
      itemObj.purchasePrice || 0
    );

    const updated = [...lineItems];
    updated[lineIndex] = {
      ...currentLine,
      itemId: itemObj.id,
      name: itemObj.name,
      hsnSacCode: itemObj.hsnSacCode,
      unit: itemObj.unit,
      purchasePrice: itemObj.purchasePrice || 0,
      ...calc,
    };
    setLineItems(updated);
  };

  const handleLineChange = (lineIndex: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...lineItems];
    const current = { ...updated[lineIndex], [field]: val };

    const qty = field === 'quantity' ? parseFloat(val) || 0 : current.quantity;
    const rate = field === 'rate' ? parseFloat(val) || 0 : current.rate;
    const discPct = field === 'discountPercent' ? parseFloat(val) || 0 : current.discountPercent;
    const gstR = documentType === 'BILL_OF_SUPPLY' ? 0 : (field === 'gstRate' ? parseFloat(val) || 0 : current.gstRate);
    const cessR = field === 'cessRate' ? parseFloat(val) || 0 : current.cessRate;
    const purchaseP = field === 'purchasePrice' ? parseFloat(val) || 0 : current.purchasePrice;

    const calc = calculateLineItem(qty, rate, discPct, 0, gstR, cessR, isInterState, purchaseP);

    updated[lineIndex] = {
      ...current,
      ...calc,
    };
    setLineItems(updated);
  };

  const addLineItem = () => {
    const gstRateToUse = documentType === 'BILL_OF_SUPPLY' ? 0 : (company.defaultGstRate || 18);
    const calc = calculateLineItem(1, 0, 0, 0, gstRateToUse, 0, isInterState, 0);

    setLineItems([
      ...lineItems,
      {
        id: `line-${Date.now()}`,
        itemId: undefined,
        name: '',
        hsnSacCode: '',
        unit: 'PCS',
        purchasePrice: 0,
        ...calc,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) {
      showToast('warning', 'Line Item Required', 'A document must have at least one line item.');
      return;
    }
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  const handleInsertScannedLineItems = (scanned: any[]) => {
    if (!scanned || scanned.length === 0) return;

    const newLines: InvoiceItem[] = scanned.map((s, idx) => {
      const qty = Number(s.openingStock) || 1;
      const rate = Number(s.sellingPrice) || 0;
      const cost = Number(s.purchasePrice) || 0;
      const gstRate = documentType === 'BILL_OF_SUPPLY' ? 0 : (Number(s.gstRate) || 18);

      const calc = calculateLineItem(
        qty,
        rate,
        0,
        0,
        gstRate,
        0,
        isInterState,
        cost
      );

      return {
        id: `scanned-line-${Date.now()}-${idx}`,
        name: s.name,
        hsnSacCode: s.hsnSacCode || '847141',
        unit: s.unit || 'PCS',
        purchasePrice: cost,
        ...calc,
      };
    });

    // If current lineItems is just 1 empty line, replace it; else append
    const isSingleEmpty = lineItems.length === 1 && !lineItems[0].name.trim() && lineItems[0].rate === 0;
    if (isSingleEmpty) {
      setLineItems(newLines);
    } else {
      setLineItems(prev => [...prev, ...newLines]);
    }
    showToast('success', 'Items Inserted', `Inserted ${newLines.length} scanned items into current bill.`);
  };

  // Grand Totals & Profit Computation
  const totalTaxableAmount = lineItems.reduce((sum, item) => sum + item.taxableAmount, 0);
  const totalCgstAmount = lineItems.reduce((sum, item) => sum + item.cgstAmount, 0);
  const totalSgstAmount = lineItems.reduce((sum, item) => sum + item.sgstAmount, 0);
  const totalIgstAmount = lineItems.reduce((sum, item) => sum + item.igstAmount, 0);
  const totalCessAmount = lineItems.reduce((sum, item) => sum + item.cessAmount, 0);
  const totalTaxAmount = totalCgstAmount + totalSgstAmount + totalIgstAmount + totalCessAmount;

  // Profit Metrics
  const profitMetrics = calculateInvoiceProfit(lineItems);

  // Overall discount
  let overallDiscountAmount = 0;
  if (overallDiscountPercent > 0) {
    overallDiscountAmount = (totalTaxableAmount * overallDiscountPercent) / 100;
  }

  const subTotal = totalTaxableAmount + totalTaxAmount + Number(additionalChargesAmount || 0) - overallDiscountAmount;
  const netTotal = Math.round(subTotal);
  const roundOff = Number((netTotal - subTotal).toFixed(2));
  const netTotalInWords = numberToWordsIndian(netTotal);

  const handleSaveInvoice = (status: 'ISSUED' | 'DRAFT', autoPrint?: 'A4' | 'THERMAL_3') => {
    if (!customerName?.trim()) {
      showToast('error', 'Customer Missing', 'Please select or enter customer name.');
      return;
    }

    if (lineItems.length === 0 || totalTaxableAmount <= 0) {
      showToast('error', 'Empty Document', 'Please add valid line items with quantities and rates.');
      return;
    }

    const posStateObj = GST_STATES.find(s => s.code === placeOfSupplyStateCode);
    const posString = posStateObj ? `${posStateObj.code}-${posStateObj.name}` : `${placeOfSupplyStateCode}-${customerState}`;

    // For Estimate, payment is not collected upfront on spot
    const paidAmount = documentType === 'ESTIMATE' ? 0 : (isPaidOnSpot ? netTotal : (editingInvoice ? editingInvoice.paidAmount : 0));
    const balanceAmount = Math.max(0, netTotal - paidAmount);

    const finalInvoice: Invoice = {
      id: editingInvoice ? editingInvoice.id : `inv-${Date.now()}`,
      documentType,
      validUntilDate: documentType === 'ESTIMATE' ? validUntilDate : undefined,
      invoiceNumber: invoiceNumber.trim(),
      sequenceNumber,
      financialYear,
      invoiceDate,
      dueDate: documentType === 'ESTIMATE' ? validUntilDate : dueDate,
      customerId: selectedCustomerId,
      customerName: customerName.trim(),
      customerGstin: customerGstin.trim().toUpperCase() || undefined,
      customerGstType,
      customerState,
      customerStateCode,
      placeOfSupply: posString,
      placeOfSupplyStateCode,
      billingAddress,
      shippingAddress: shippingAddress || billingAddress,
      customerPhone,
      isInterState,
      isReverseCharge,
      items: lineItems,
      totalTaxableAmount: Number(totalTaxableAmount.toFixed(2)),
      totalCgstAmount: Number(totalCgstAmount.toFixed(2)),
      totalSgstAmount: Number(totalSgstAmount.toFixed(2)),
      totalIgstAmount: Number(totalIgstAmount.toFixed(2)),
      totalCessAmount: Number(totalCessAmount.toFixed(2)),
      totalTaxAmount: Number(totalTaxAmount.toFixed(2)),
      totalCost: profitMetrics.totalCost,
      grossProfit: profitMetrics.grossProfit,
      profitMarginPercent: profitMetrics.profitMarginPercent,
      additionalChargesName,
      additionalChargesAmount: Number(additionalChargesAmount) || 0,
      overallDiscountPercent,
      overallDiscountAmount: Number(overallDiscountAmount.toFixed(2)),
      subTotal: Number(subTotal.toFixed(2)),
      roundOff,
      netTotal,
      netTotalInWords,
      paidAmount,
      balanceAmount,
      status: status === 'DRAFT' ? 'DRAFT' : (balanceAmount === 0 ? 'PAID' : 'ISSUED'),
      eWayBillNo: eWayBillNo || undefined,
      vehicleNo: vehicleNo || undefined,
      createdAt: editingInvoice ? editingInvoice.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveInvoice(finalInvoice, !isEditing);
    setEditingInvoiceId(null);

    // Trigger celebration confetti
    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.85 } });
    } catch (e) {}

    if (autoPrint) {
      setPrintInvoice(finalInvoice);
      setPrintFormat(autoPrint);
    } else {
      setCurrentView('invoices');
    }
  };

  // Keep latest callbacks in ref for global keyboard shortcuts
  const saveRef = useRef(handleSaveInvoice);
  saveRef.current = handleSaveInvoice;

  const addLineRef = useRef(addLineItem);
  addLineRef.current = addLineItem;

  const walkInRef = useRef(handleWalkInShortcut);
  walkInRef.current = handleWalkInShortcut;

  useEffect(() => {
    const onSave = (e: any) => {
      const format = e.detail?.format || 'A4';
      saveRef.current('ISSUED', format);
    };
    const onSaveDraft = () => {
      saveRef.current('DRAFT');
    };
    const onAddItem = () => {
      addLineRef.current();
    };
    const onWalkIn = () => {
      walkInRef.current();
    };
    const onEscape = () => {
      setEditingInvoiceId(null);
      setCurrentView('invoices');
    };

    window.addEventListener('gst:save-invoice', onSave);
    window.addEventListener('gst:save-draft', onSaveDraft);
    window.addEventListener('gst:add-line-item', onAddItem);
    window.addEventListener('gst:walkin-customer', onWalkIn);
    window.addEventListener('gst:invoice-escape', onEscape);

    return () => {
      window.removeEventListener('gst:save-invoice', onSave);
      window.removeEventListener('gst:save-draft', onSaveDraft);
      window.removeEventListener('gst:add-line-item', onAddItem);
      window.removeEventListener('gst:walkin-customer', onWalkIn);
      window.removeEventListener('gst:invoice-escape', onEscape);
    };
  }, [setCurrentView, setEditingInvoiceId]);

  const handleDeleteCurrentInvoice = () => {
    if (!editingInvoiceId) return;
    deleteInvoice(editingInvoiceId);
    setEditingInvoiceId(null);
    setShowDeleteConfirm(false);
    setCurrentView('invoices');
  };

  const documentTypeTitles = {
    TAX_INVOICE: 'Tax Invoice',
    BILL_OF_SUPPLY: 'Bill of Supply',
    ESTIMATE: 'Estimate / Quotation',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Editing Mode Banner (if editing existing record) */}
      {isEditing && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 px-4 flex items-center justify-between text-amber-900 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Editing Mode:</strong> Updating {documentTypeTitles[documentType]} <strong>{invoiceNumber}</strong>. 
              Stock quantities and customer ledger balances will automatically reconcile upon saving.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingInvoiceId(null);
                setCurrentView('invoices');
              }}
              className="text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              Discard & Return
            </button>
          </div>
        </div>
      )}

      {/* Power-User Keyboard Shortcuts Quick Helper Bar */}
      <div className="bg-slate-900 text-slate-200 px-4 py-2 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs border border-slate-800">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-teal-400 shrink-0" />
          <span className="font-bold text-white">Billing Hotkeys:</span>
          <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-300 font-mono">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-teal-300 font-bold">Ctrl+S</kbd> Save & A4</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-teal-300 font-bold">Ctrl+P</kbd> POS Print</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold">Ctrl+Shift+S</kbd> Draft</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-bold">Alt+A</kbd> Add Item</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-bold">Alt+W</kbd> Walk-in</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-bold">Esc</kbd> Exit</span>
          </div>
        </div>

        {/* Profit Toggle Button */}
        <button
          type="button"
          onClick={() => setShowProfitDetails(!showProfitDetails)}
          className="flex items-center gap-1.5 text-xs text-teal-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors cursor-pointer"
        >
          {showProfitDetails ? <EyeOff className="w-3.5 h-3.5 text-teal-400" /> : <Eye className="w-3.5 h-3.5 text-teal-400" />}
          <span>{showProfitDetails ? 'Hide Profit Details' : 'Show Profit & Cost'}</span>
        </button>
      </div>

      {/* Top Action Bar & Document Type Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            id="btn-invoice-back"
            onClick={() => {
              setEditingInvoiceId(null);
              setCurrentView('invoices');
            }}
            title="Press Esc to return to invoices"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft className="w-5 h-5" />
            <kbd className="hidden sm:inline px-1.5 py-0.5 bg-slate-200 border border-slate-300 text-slate-600 text-[10px] font-mono rounded font-semibold">
              Esc
            </kbd>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                {isEditing ? `Edit ${documentTypeTitles[documentType]}` : `New ${documentTypeTitles[documentType]}`}
              </h2>
              {documentType === 'ESTIMATE' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Non-Tax Quotation
                </span>
              )}
              {documentType === 'BILL_OF_SUPPLY' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Composition / 0% GST
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {documentType === 'TAX_INVOICE' && 'Standard GST tax invoice with CGST/SGST or IGST tax breakdown.'}
              {documentType === 'BILL_OF_SUPPLY' && 'Statutory document for Composition taxable dealers and exempt supplies (0% tax).'}
              {documentType === 'ESTIMATE' && 'Customer price quotation with validity period (does not deduct inventory or update ledger).'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isEditing && (
            <button
              id="btn-invoice-delete-editor"
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="py-2 px-3 border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Permanently delete this document"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          <button
            id="btn-invoice-save-draft"
            type="button"
            onClick={() => handleSaveInvoice('DRAFT')}
            className="py-2 px-3 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Shortcut: Ctrl+Shift+S"
          >
            <span>Save Draft</span>
            <kbd className="hidden sm:inline px-1.5 py-0.5 bg-slate-100 border border-slate-300 text-slate-600 text-[10px] font-mono rounded font-semibold">
              Ctrl+Shift+S
            </kbd>
          </button>

          <button
            id="btn-invoice-save-thermal"
            type="button"
            onClick={() => handleSaveInvoice('ISSUED', 'THERMAL_3')}
            className="py-2 px-3.5 bg-slate-800 hover:bg-slate-900 active:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            title="Shortcut: Ctrl+P"
          >
            <Printer className="w-3.5 h-3.5 text-teal-400" />
            <span>Issue & POS Thermal</span>
            <kbd className="px-1.5 py-0.5 bg-slate-700 text-teal-300 text-[10px] font-mono rounded font-bold">
              Ctrl+P
            </kbd>
          </button>

          <button
            id="btn-invoice-save-a4"
            type="button"
            onClick={() => handleSaveInvoice('ISSUED', 'A4')}
            className="py-2 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            title="Shortcut: Ctrl+S"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isEditing ? 'Save & Update (A4)' : `Issue ${documentTypeTitles[documentType]} (A4)`}</span>
            <kbd className="px-1.5 py-0.5 bg-teal-800 text-teal-100 text-[10px] font-mono rounded font-bold">
              Ctrl+S
            </kbd>
          </button>
        </div>
      </div>

      {/* Document Type Selector Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase px-2">Document Format:</span>
          <button
            type="button"
            onClick={() => handleDocumentTypeChange('TAX_INVOICE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              documentType === 'TAX_INVOICE'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tax Invoice (GST)</span>
          </button>

          <button
            type="button"
            onClick={() => handleDocumentTypeChange('BILL_OF_SUPPLY')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              documentType === 'BILL_OF_SUPPLY'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Bill of Supply (0% / Composition)</span>
          </button>

          <button
            type="button"
            onClick={() => handleDocumentTypeChange('ESTIMATE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              documentType === 'ESTIMATE'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Estimate / Quotation</span>
          </button>
        </div>

        {/* Live Profit Snapshot Pill */}
        {showProfitDetails && (
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-lg text-xs font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Est. Profit: <strong>{formatINR(profitMetrics.grossProfit)}</strong> ({profitMetrics.profitMarginPercent}%)</span>
          </div>
        )}
      </div>

      {/* Invoice Meta Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer & Supply Selection */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>Customer / Billed To</span>
            </h3>
            
            <button
              id="btn-invoice-walkin"
              type="button"
              onClick={handleWalkInShortcut}
              title="Shortcut: Alt+W"
              className="text-xs px-2.5 py-1 rounded bg-amber-50 border border-amber-300 text-amber-900 font-semibold flex items-center gap-1.5 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>⚡ Fast Walk-In Counter Sale</span>
              <kbd className="px-1.5 py-0.5 bg-amber-200/80 border border-amber-300 text-amber-900 text-[10px] font-mono rounded font-bold">
                Alt+W
              </kbd>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Select Saved Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={e => handleCustomerSelect(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.gstin ? `(${c.gstin})` : '(B2C)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Customer / Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="InfraCloud Systems Pvt Ltd"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Buyer GSTIN (15 Chars)
              </label>
              <input
                type="text"
                maxLength={15}
                value={customerGstin}
                onChange={e => setCustomerGstin(e.target.value.toUpperCase())}
                placeholder="29AAACI9876C1Z3"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Place of Supply (POS) <span className="text-rose-500">*</span>
              </label>
              <select
                value={placeOfSupplyStateCode}
                onChange={e => handlePlaceOfSupplyChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {GST_STATES.map(st => (
                  <option key={st.code} value={st.code}>
                    {st.code} - {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tax Type Applied
              </label>
              <div className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${
                documentType === 'BILL_OF_SUPPLY'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : isInterState 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-800' 
                  : 'bg-teal-50 border-teal-200 text-teal-800'
              }`}>
                <span className="w-2 h-2 rounded-full bg-current"></span>
                <span>
                  {documentType === 'BILL_OF_SUPPLY'
                    ? 'Exempt / Composition (0% Tax)'
                    : isInterState 
                    ? 'IGST (Inter-State 100%)' 
                    : 'CGST + SGST (Intra-State 50/50)'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Billing Address
              </label>
              <input
                type="text"
                value={billingAddress}
                onChange={e => setBillingAddress(e.target.value)}
                placeholder="Plot 12, Electronic City Phase 1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Col: Invoice Numbering & Dates */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Series & Dates</span>
            <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-mono font-bold">
              FY {financialYear}
            </span>
          </h3>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Document Number (Seq) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2 border border-teal-300 bg-teal-50/40 text-teal-950 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Document Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {documentType === 'ESTIMATE' ? 'Valid Until' : 'Payment Due Date'}
              </label>
              <input
                type="date"
                value={documentType === 'ESTIMATE' ? validUntilDate : dueDate}
                onChange={e => {
                  if (documentType === 'ESTIMATE') {
                    setValidUntilDate(e.target.value);
                  } else {
                    setDueDate(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                E-Way Bill No. (Optional)
              </label>
              <input
                type="text"
                value={eWayBillNo}
                onChange={e => setEWayBillNo(e.target.value)}
                placeholder="12-digit E-Way No."
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Vehicle No.
              </label>
              <input
                type="text"
                value={vehicleNo}
                onChange={e => setVehicleNo(e.target.value.toUpperCase())}
                placeholder="KA-01-AB-1234"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono uppercase focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table with Profit Calculation Columns */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs pb-12">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>Line Items & Rates Breakdown</span>
            </h3>
            {showProfitDetails && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Profit Analysis Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-invoice-scan-items"
              type="button"
              onClick={() => setIsScanModalOpen(true)}
              className="py-1.5 px-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-100" />
              <span>Scan Bill / Photo</span>
            </button>

            <button
              id="btn-invoice-add-item-row"
              type="button"
              onClick={addLineItem}
              title="Shortcut: Alt+A"
              className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item Line</span>
              <kbd className="px-1.5 py-0.5 bg-teal-800 text-teal-100 text-[10px] font-mono rounded font-bold">
                Alt+A
              </kbd>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[220px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-3 py-2.5 w-10 text-center">#</th>
                <th className="px-3 py-2.5 min-w-[280px]">Item Description (Type to search A-Z)</th>
                <th className="px-3 py-2.5 w-28 min-w-[100px]">HSN/SAC</th>
                <th className="px-3 py-2.5 w-24 min-w-[90px] text-center">Qty</th>
                <th className="px-3 py-2.5 w-24 min-w-[85px] text-center">Unit</th>
                {showProfitDetails && <th className="px-3 py-2.5 w-32 min-w-[120px] text-right bg-slate-200/50">Cost (₹)</th>}
                <th className="px-3 py-2.5 w-36 min-w-[130px] text-right">Selling Rate</th>
                <th className="px-3 py-2.5 w-20 min-w-[80px] text-right">Disc %</th>
                <th className="px-3 py-2.5 w-28 min-w-[110px] text-right">Taxable (₹)</th>
                <th className="px-3 py-2.5 w-24 min-w-[95px] text-center">{documentType === 'BILL_OF_SUPPLY' ? 'Type' : 'GST %'}</th>
                <th className="px-3 py-2.5 w-28 min-w-[110px] text-right">Tax (₹)</th>
                {showProfitDetails && <th className="px-3 py-2.5 w-28 min-w-[110px] text-right bg-emerald-50 text-emerald-900">Profit (₹)</th>}
                <th className="px-3 py-2.5 w-32 min-w-[120px] text-right font-bold">Total (₹)</th>
                <th className="px-3 py-2.5 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lineItems.map((line, index) => {
                const totalTax = line.cgstAmount + line.sgstAmount + line.igstAmount + line.cessAmount;
                const lineProfit = (line.taxableAmount || 0) - ((line.purchasePrice || 0) * (line.quantity || 0));
                const lineProfitMargin = line.taxableAmount > 0 ? ((lineProfit / line.taxableAmount) * 100).toFixed(1) : '0';

                return (
                  <tr key={line.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 text-center text-slate-400 font-mono">{index + 1}</td>
                    
                    {/* Item Description Autocomplete with Alphabetical Dropdown */}
                    <td className="px-3 py-2.5 min-w-[280px]">
                      <ItemDescriptionAutocomplete
                        value={line.name}
                        items={items}
                        onTextChange={val => handleLineChange(index, 'name', val)}
                        onSelectItem={item => handleItemSelect(index, item)}
                        placeholder="Write item description..."
                      />
                    </td>

                    {/* HSN */}
                    <td className="px-3 py-2.5 w-28 min-w-[100px]">
                      <input
                        type="text"
                        required
                        value={line.hsnSacCode}
                        onChange={e => handleLineChange(index, 'hsnSacCode', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-mono text-center focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="px-3 py-2.5 w-24 min-w-[90px]">
                      <input
                        type="number"
                        min={0.01}
                        step="any"
                        required
                        value={line.quantity}
                        onChange={e => handleLineChange(index, 'quantity', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono font-semibold text-center focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                      />
                    </td>

                    {/* Unit */}
                    <td className="px-3 py-2.5 w-24 min-w-[85px]">
                      <input
                        type="text"
                        value={line.unit}
                        onChange={e => handleLineChange(index, 'unit', e.target.value)}
                        placeholder="e.g. PCS"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs text-center uppercase font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                      />
                    </td>

                    {/* Cost / Purchase Price (If Profit View Enabled) */}
                    {showProfitDetails && (
                      <td className="px-3 py-2.5 w-32 min-w-[120px] text-right bg-slate-50/70">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.purchasePrice || ''}
                          onChange={e => handleLineChange(index, 'purchasePrice', e.target.value)}
                          placeholder="Cost ₹"
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-mono text-right text-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                        />
                      </td>
                    )}

                    {/* Selling Rate */}
                    <td className="px-3 py-2.5 w-36 min-w-[130px] text-right">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        required
                        value={line.rate}
                        onChange={e => handleLineChange(index, 'rate', e.target.value)}
                        placeholder="Rate ₹"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono font-bold text-right text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none shadow-2xs"
                      />
                    </td>

                    {/* Discount % */}
                    <td className="px-3 py-2.5 w-20 min-w-[80px] text-right">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={line.discountPercent || ''}
                        onChange={e => handleLineChange(index, 'discountPercent', e.target.value)}
                        placeholder="0%"
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs font-mono text-right focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                      />
                    </td>

                    {/* Taxable Amount */}
                    <td className="px-3 py-2.5 w-28 min-w-[110px] text-right font-mono font-semibold text-slate-800">
                      {formatINR(line.taxableAmount, false)}
                    </td>

                    {/* GST Rate */}
                    <td className="px-3 py-2.5 w-24 min-w-[95px] text-center">
                      {documentType === 'BILL_OF_SUPPLY' ? (
                        <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                          0% Exempt
                        </span>
                      ) : (
                        <select
                          value={line.gstRate}
                          onChange={e => handleLineChange(index, 'gstRate', Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs font-mono font-bold text-center bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                        >
                          {[0, 5, 12, 18, 28].map(r => (
                            <option key={r} value={r}>{r}%</option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Tax Amount */}
                    <td className="px-3 py-2.5 w-28 min-w-[110px] text-right font-mono text-slate-600">
                      {formatINR(totalTax, false)}
                      {documentType !== 'BILL_OF_SUPPLY' && (
                        <div className="text-[10px] text-slate-400">
                          {isInterState ? `IGST: ${line.igstRate}%` : `CGST: ${line.cgstRate}% + SGST: ${line.sgstRate}%`}
                        </div>
                      )}
                    </td>

                    {/* Line Profit (If Profit View Enabled) */}
                    {showProfitDetails && (
                      <td className="px-3 py-2 text-right font-mono bg-emerald-50/50">
                        <div className={`font-bold ${lineProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {formatINR(lineProfit, false)}
                        </div>
                        <div className="text-[10px] text-emerald-800">
                          {lineProfitMargin}%
                        </div>
                      </td>
                    )}

                    {/* Line Total */}
                    <td className="px-3 py-2 text-right font-mono font-bold text-teal-900">
                      {formatINR(line.totalAmount, false)}
                    </td>

                    {/* Delete Line */}
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Calculations, Profit Analytics & Spot Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Additional charges, Profit Analytics & Settlement */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
              Additional Freight, Discounts & Settlement
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Additional Charge Name
                  </label>
                  <input
                    type="text"
                    value={additionalChargesName}
                    onChange={e => setAdditionalChargesName(e.target.value)}
                    placeholder="e.g. Freight & Delivery"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={additionalChargesAmount || ''}
                    onChange={e => setAdditionalChargesAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-right focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Overall Discount (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={overallDiscountPercent || ''}
                  onChange={e => setOverallDiscountPercent(parseFloat(e.target.value) || 0)}
                  placeholder="0%"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Instant Settlement On Spot (Disabled for Estimates) */}
            {documentType !== 'ESTIMATE' ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPaidOnSpot}
                    onChange={e => setIsPaidOnSpot(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800">Mark Full Amount Paid on Spot</span>
                    <p className="text-[11px] text-slate-500">Auto-records full settlement receipt against this invoice.</p>
                  </div>
                </label>

                {isPaidOnSpot && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-medium">Payment Mode:</span>
                    <select
                      value={spotPaymentMode}
                      onChange={e => setSpotPaymentMode(e.target.value as any)}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      <option value="CASH">Cash at Counter</option>
                      <option value="UPI">UPI / Bharat QR</option>
                      <option value="BANK_TRANSFER">Bank IMPS / NEFT</option>
                      <option value="CARD">Credit / Debit Card</option>
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  <strong>Estimate Notice:</strong> Quotations do not alter customer ledger balances or deduct store stock until converted to a Tax Invoice.
                </span>
              </div>
            )}

            {/* Amount in words banner */}
            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg text-xs text-teal-950 font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
              <span><strong>Amount in Words:</strong> {netTotalInWords}</span>
            </div>
          </div>

          {/* Profit Calculation Summary Widget */}
          {showProfitDetails && (
            <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white p-4 rounded-xl border border-teal-900/60 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-teal-800/40 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Estimated Profit & Margin Calculation
                </span>
                <span className="text-[11px] text-teal-400 font-mono font-semibold">
                  Gross Margin: {profitMetrics.profitMarginPercent}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Revenue (Taxable)</span>
                  <span className="font-mono font-bold text-white text-sm">{formatINR(totalTaxableAmount)}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Total Cost (COGS)</span>
                  <span className="font-mono font-bold text-slate-300 text-sm">{formatINR(profitMetrics.totalCost)}</span>
                </div>

                <div>
                  <span className="text-emerald-400 block text-[11px] font-bold">Estimated Profit</span>
                  <span className="font-mono font-bold text-emerald-400 text-base">{formatINR(profitMetrics.grossProfit)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Tax Summary & Final Payable Total */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>{documentTypeTitles[documentType]} Totals</span>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
              {documentType}
            </span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Total Taxable Value:</span>
              <span className="font-mono font-semibold text-slate-800">{formatINR(totalTaxableAmount)}</span>
            </div>

            {documentType !== 'BILL_OF_SUPPLY' && (
              !isInterState ? (
                <>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Central GST (CGST):</span>
                    <span className="font-mono font-semibold text-slate-800">{formatINR(totalCgstAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>State GST (SGST):</span>
                    <span className="font-mono font-semibold text-slate-800">{formatINR(totalSgstAmount)}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between text-indigo-700">
                  <span>Integrated GST (IGST):</span>
                  <span className="font-mono font-semibold">{formatINR(totalIgstAmount)}</span>
                </div>
              )
            )}

            {totalCessAmount > 0 && (
              <div className="flex items-center justify-between text-slate-600">
                <span>GST Cess Amount:</span>
                <span className="font-mono font-semibold text-slate-800">{formatINR(totalCessAmount)}</span>
              </div>
            )}

            {additionalChargesAmount > 0 && (
              <div className="flex items-center justify-between text-slate-600">
                <span>{additionalChargesName}:</span>
                <span className="font-mono font-semibold text-slate-800">{formatINR(additionalChargesAmount)}</span>
              </div>
            )}

            {overallDiscountAmount > 0 && (
              <div className="flex items-center justify-between text-rose-600">
                <span>Overall Discount ({overallDiscountPercent}%):</span>
                <span className="font-mono font-semibold">-{formatINR(overallDiscountAmount)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-500 pt-2 border-t border-slate-100">
              <span>Auto Round-Off:</span>
              <span className="font-mono text-slate-700">{roundOff >= 0 ? `+${roundOff}` : roundOff}</span>
            </div>

            {/* Grand Total Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-teal-950 text-white mt-4 space-y-1">
              <span className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider">
                {documentType === 'ESTIMATE' ? 'Quotation Net Total' : 'Total Amount Payable'}
              </span>
              <div className="text-2xl font-mono font-bold tracking-tight text-white">
                {formatINR(netTotal)}
              </div>
              <div className="text-[11px] text-teal-300/80 font-mono">
                {documentType === 'ESTIMATE' 
                  ? `Valid till ${validUntilDate}` 
                  : (isPaidOnSpot ? '✓ Fully Paid on Spot' : `Balance Due: ${formatINR(netTotal)}`)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && editingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Delete {documentTypeTitles[documentType]}
                  </h3>
                  <p className="text-[11px] text-slate-500">Permanent removal from local database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Details Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Document No:</span>
                <span className="font-bold text-slate-800 font-mono">{editingInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-700">{editingInvoice.customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Date:</span>
                <span className="text-slate-700">{editingInvoice.invoiceDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Grand Total:</span>
                <span className="font-bold text-teal-700">{formatINR(editingInvoice.netTotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold text-slate-700 uppercase text-[10px]">{editingInvoice.status}</span>
              </div>
            </div>

            {/* Auto Reconciliation Notice */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Automatic Stock & Ledger Adjustment</span>
              </div>
              {editingInvoice.status !== 'CANCELLED' && editingInvoice.status !== 'DRAFT' && editingInvoice.documentType !== 'ESTIMATE' ? (
                <p className="text-[11px] leading-relaxed">
                  Deleting this active document will automatically <strong>return goods quantities ({editingInvoice.items.length} items) back to inventory stock</strong> and <strong>reduce the customer's outstanding balance by {formatINR(editingInvoice.balanceAmount)}</strong>.
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
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2 px-4 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium cursor-pointer"
              >
                Keep Document
              </button>
              <button
                type="button"
                onClick={handleDeleteCurrentInvoice}
                className="py-2 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Image / Bill Scanner Modal */}
      <ScanItemsImageModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onImportToInvoice={handleInsertScannedLineItems}
      />
    </div>
  );
};
