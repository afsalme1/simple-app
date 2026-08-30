import { Invoice, CreditNote, CompanyProfile, GSTR1HSNSummary } from '../types';

export interface GSTR1ExportData {
  gstin: string;
  fp: string; // MMYYYY e.g. "082026"
  cur_gt: number;
  gt: number;
  version: string;
  hash: string;
  b2b: Array<{
    ctin: string;
    inv: Array<{
      inum: string;
      idt: string;
      val: number;
      pos: string;
      rchrg: string;
      inv_typ: string;
      itms: Array<{
        num: number;
        itm_det: {
          rt: number;
          txval: number;
          iamt: number;
          camt: number;
          samt: number;
          csamt: number;
        };
      }>;
    }>;
  }>;
  b2cl: Array<{
    pos: string;
    inv: Array<{
      inum: string;
      idt: string;
      val: number;
      itms: Array<{
        num: number;
        itm_det: {
          rt: number;
          txval: number;
          iamt: number;
          csamt: number;
        };
      }>;
    }>;
  }>;
  b2cs: Array<{
    sply_ty: 'INTRA' | 'INTER';
    pos: string;
    typ: 'OE';
    rt: number;
    txval: number;
    iamt: number;
    camt: number;
    samt: number;
    csamt: number;
  }>;
  cdnr: Array<{
    ctin: string;
    nt: Array<{
      ntty: 'C';
      nt_num: string;
      nt_dt: string;
      inum: string;
      idt: string;
      val: number;
      pos: string;
      rchrg: string;
      itms: Array<{
        num: number;
        itm_det: {
          rt: number;
          txval: number;
          iamt: number;
          camt: number;
          samt: number;
          csamt: number;
        };
      }>;
    }>;
  }>;
  hsn: {
    data: Array<{
      num: number;
      hsn_sc: string;
      desc: string;
      uqc: string;
      qty: number;
      val: number;
      txval: number;
      iamt: number;
      camt: number;
      samt: number;
      csamt: number;
    }>;
  };
  doc_issue: {
    doc_det: Array<{
      doc_num: number;
      doc_typ: string;
      docs: Array<{
        num: number;
        from: string;
        to: string;
        totnum: number;
        canc: number;
        net_issue: number;
      }>;
    }>;
  };
}

export function generateGSTR1JSON(
  company: CompanyProfile,
  invoices: Invoice[],
  creditNotes: CreditNote[],
  returnPeriodMonthYear: string // e.g. "2026-08" -> fp "082026"
): GSTR1ExportData {
  const parts = returnPeriodMonthYear.split('-');
  const fp = parts.length === 2 ? `${parts[1]}${parts[0]}` : '082026';
  
  // Filter non-cancelled valid invoices for this period
  const periodInvoices = invoices.filter(inv => {
    return inv.invoiceDate.startsWith(returnPeriodMonthYear) && inv.status !== 'DRAFT';
  });

  const periodCreditNotes = creditNotes.filter(cn => {
    return cn.creditNoteDate.startsWith(returnPeriodMonthYear);
  });

  // B2B Grouping (Registered Customers with valid GSTIN)
  const b2bMap: Record<string, any[]> = {};
  // B2CL (Interstate, Unregistered, Invoice Value > 2,50,000)
  const b2clMap: Record<string, any[]> = {};
  // B2CS (All other unregistered) Map key: `${pos}_${rate}`
  const b2csMap: Record<string, {
    sply_ty: 'INTRA' | 'INTER';
    pos: string;
    rt: number;
    txval: number;
    iamt: number;
    camt: number;
    samt: number;
    csamt: number;
  }> = {};

  let totalGrossTurnover = 0;

  periodInvoices.forEach(inv => {
    if (inv.status === 'CANCELLED') return;
    totalGrossTurnover += inv.netTotal;

    const isB2B = Boolean(inv.customerGstin && inv.customerGstin.trim().length === 15);
    const isInterState = inv.isInterState;
    const isB2CLarge = !isB2B && isInterState && inv.netTotal > 250000;

    // Rate wise item breakdown
    const itemRatesMap: Record<number, { txval: number; iamt: number; camt: number; samt: number; csamt: number }> = {};
    inv.items.forEach(item => {
      if (!itemRatesMap[item.gstRate]) {
        itemRatesMap[item.gstRate] = { txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 };
      }
      itemRatesMap[item.gstRate].txval += item.taxableAmount;
      itemRatesMap[item.gstRate].iamt += item.igstAmount;
      itemRatesMap[item.gstRate].camt += item.cgstAmount;
      itemRatesMap[item.gstRate].samt += item.sgstAmount;
      itemRatesMap[item.gstRate].csamt += item.cessAmount;
    });

    const itms = Object.entries(itemRatesMap).map(([rateStr, val], idx) => ({
      num: idx + 1,
      itm_det: {
        rt: Number(rateStr),
        txval: Number(val.txval.toFixed(2)),
        iamt: Number(val.iamt.toFixed(2)),
        camt: Number(val.camt.toFixed(2)),
        samt: Number(val.samt.toFixed(2)),
        csamt: Number(val.csamt.toFixed(2)),
      },
    }));

    const formattedDate = inv.invoiceDate.split('-').reverse().join('-'); // DD-MM-YYYY

    if (isB2B && inv.customerGstin) {
      const ctin = inv.customerGstin.toUpperCase();
      if (!b2bMap[ctin]) b2bMap[ctin] = [];
      b2bMap[ctin].push({
        inum: inv.invoiceNumber,
        idt: formattedDate,
        val: inv.netTotal,
        pos: inv.placeOfSupplyStateCode || company.stateCode,
        rchrg: inv.isReverseCharge ? 'Y' : 'N',
        inv_typ: 'Regular',
        itms,
      });
    } else if (isB2CLarge) {
      const pos = inv.placeOfSupplyStateCode || '00';
      if (!b2clMap[pos]) b2clMap[pos] = [];
      b2clMap[pos].push({
        inum: inv.invoiceNumber,
        idt: formattedDate,
        val: inv.netTotal,
        itms: itms.map(it => ({
          num: it.num,
          itm_det: {
            rt: it.itm_det.rt,
            txval: it.itm_det.txval,
            iamt: it.itm_det.iamt,
            csamt: it.itm_det.csamt,
          },
        })),
      });
    } else {
      // B2CS
      const pos = inv.placeOfSupplyStateCode || company.stateCode;
      const sply_ty = isInterState ? 'INTER' : 'INTRA';
      inv.items.forEach(item => {
        const key = `${sply_ty}_${pos}_${item.gstRate}`;
        if (!b2csMap[key]) {
          b2csMap[key] = {
            sply_ty,
            pos,
            rt: item.gstRate,
            txval: 0,
            iamt: 0,
            camt: 0,
            samt: 0,
            csamt: 0,
          };
        }
        b2csMap[key].txval += item.taxableAmount;
        b2csMap[key].iamt += item.igstAmount;
        b2csMap[key].camt += item.cgstAmount;
        b2csMap[key].samt += item.sgstAmount;
        b2csMap[key].csamt += item.cessAmount;
      });
    }
  });

  // Format B2B output
  const b2bOutput = Object.entries(b2bMap).map(([ctin, invList]) => ({
    ctin,
    inv: invList,
  }));

  // Format B2CL output
  const b2clOutput = Object.entries(b2clMap).map(([pos, invList]) => ({
    pos,
    inv: invList,
  }));

  // Format B2CS output
  const b2csOutput = Object.values(b2csMap).map(item => ({
    sply_ty: item.sply_ty,
    pos: item.pos,
    typ: 'OE' as const,
    rt: item.rt,
    txval: Number(item.txval.toFixed(2)),
    iamt: Number(item.iamt.toFixed(2)),
    camt: Number(item.camt.toFixed(2)),
    samt: Number(item.samt.toFixed(2)),
    csamt: Number(item.csamt.toFixed(2)),
  }));

  // CDNR (Credit Notes)
  const cdnrMap: Record<string, any[]> = {};
  periodCreditNotes.forEach(cn => {
    const ctin = cn.customerGstin?.toUpperCase() || 'UNREGISTERED';
    if (!cdnrMap[ctin]) cdnrMap[ctin] = [];

    const itms = cn.items.map((item, idx) => ({
      num: idx + 1,
      itm_det: {
        rt: item.gstRate,
        txval: item.taxableAmount,
        iamt: item.igstAmount,
        camt: item.cgstAmount,
        samt: item.sgstAmount,
        csamt: item.cessAmount,
      },
    }));

    cdnrMap[ctin].push({
      ntty: 'C' as const,
      nt_num: cn.creditNoteNumber,
      nt_dt: cn.creditNoteDate.split('-').reverse().join('-'),
      inum: cn.originalInvoiceNumber,
      idt: cn.originalInvoiceDate.split('-').reverse().join('-'),
      val: cn.netTotal,
      pos: company.stateCode,
      rchrg: 'N',
      itms,
    });
  });

  const cdnrOutput = Object.entries(cdnrMap).map(([ctin, ntList]) => ({
    ctin,
    nt: ntList,
  }));

  // HSN Summary
  const hsnMap: Record<string, GSTR1HSNSummary> = {};
  periodInvoices.forEach(inv => {
    if (inv.status === 'CANCELLED') return;
    inv.items.forEach(item => {
      const code = item.hsnSacCode || 'OTHERS';
      if (!hsnMap[code]) {
        hsnMap[code] = {
          hsn: code,
          description: item.name || 'Goods/Services',
          uqc: item.unit || 'PCS',
          totalQuantity: 0,
          totalValue: 0,
          taxableValue: 0,
          integratedTaxAmount: 0,
          centralTaxAmount: 0,
          stateTaxAmount: 0,
          cessAmount: 0,
        };
      }
      hsnMap[code].totalQuantity += item.quantity;
      hsnMap[code].totalValue += item.totalAmount;
      hsnMap[code].taxableValue += item.taxableAmount;
      hsnMap[code].integratedTaxAmount += item.igstAmount;
      hsnMap[code].centralTaxAmount += item.cgstAmount;
      hsnMap[code].stateTaxAmount += item.sgstAmount;
      hsnMap[code].cessAmount += item.cessAmount;
    });
  });

  const hsnOutput = Object.values(hsnMap).map((h, idx) => ({
    num: idx + 1,
    hsn_sc: h.hsn,
    desc: h.description,
    uqc: h.uqc,
    qty: Number(h.totalQuantity.toFixed(2)),
    val: Number(h.totalValue.toFixed(2)),
    txval: Number(h.taxableValue.toFixed(2)),
    iamt: Number(h.integratedTaxAmount.toFixed(2)),
    camt: Number(h.centralTaxAmount.toFixed(2)),
    samt: Number(h.stateTaxAmount.toFixed(2)),
    csamt: Number(h.cessAmount.toFixed(2)),
  }));

  // Document Issue summary
  const issuedList = periodInvoices.filter(i => i.status !== 'DRAFT');
  const cancelledCount = periodInvoices.filter(i => i.status === 'CANCELLED').length;
  const fromNum = issuedList[0]?.invoiceNumber || 'INV-0001';
  const toNum = issuedList[issuedList.length - 1]?.invoiceNumber || 'INV-0001';

  return {
    gstin: company.gstin || '27AAAAA0000A1Z5',
    fp,
    cur_gt: totalGrossTurnover,
    gt: totalGrossTurnover,
    version: 'GST3.0.4',
    hash: 'hash-gstin-v1',
    b2b: b2bOutput,
    b2cl: b2clOutput,
    b2cs: b2csOutput,
    cdnr: cdnrOutput,
    hsn: {
      data: hsnOutput,
    },
    doc_issue: {
      doc_det: [
        {
          doc_num: 1,
          doc_typ: 'Invoices for outward supply',
          docs: [
            {
              num: 1,
              from: fromNum,
              to: toNum,
              totnum: issuedList.length,
              canc: cancelledCount,
              net_issue: issuedList.length - cancelledCount,
            },
          ],
        },
      ],
    },
  };
}

export function generateGSTR1B2BCSV(invoices: Invoice[]): string {
  const headers = [
    'GSTIN/UIN of Recipient',
    'Receiver Name',
    'Invoice Number',
    'Invoice Date',
    'Invoice Value',
    'Place Of Supply',
    'Reverse Charge',
    'Applicable % of Tax Rate',
    'Invoice Type',
    'E-Commerce GSTIN',
    'Rate (%)',
    'Taxable Value',
    'Cess Amount',
  ];

  const rows: string[][] = [];

  invoices
    .filter(i => i.customerGstin && i.customerGstin.trim().length === 15 && i.status !== 'CANCELLED' && i.status !== 'DRAFT')
    .forEach(inv => {
      inv.items.forEach(item => {
        rows.push([
          inv.customerGstin || '',
          `"${(inv.customerName || '').replace(/"/g, '""')}"`,
          inv.invoiceNumber,
          inv.invoiceDate,
          inv.netTotal.toFixed(2),
          inv.placeOfSupply || '',
          inv.isReverseCharge ? 'Y' : 'N',
          '100',
          'Regular',
          '',
          item.gstRate.toString(),
          item.taxableAmount.toFixed(2),
          item.cessAmount.toFixed(2),
        ]);
      });
    });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function generateGSTR1B2CSCSV(invoices: Invoice[]): string {
  const headers = [
    'Type',
    'Place Of Supply',
    'Applicable % of Tax Rate',
    'Rate (%)',
    'Taxable Value',
    'Cess Amount',
    'E-Commerce GSTIN',
  ];

  const map: Record<string, { pos: string; rate: number; taxable: number; cess: number }> = {};

  invoices
    .filter(i => (!i.customerGstin || i.customerGstin.trim().length !== 15) && i.status !== 'CANCELLED' && i.status !== 'DRAFT')
    .forEach(inv => {
      const pos = inv.placeOfSupply || '27-Maharashtra';
      inv.items.forEach(item => {
        const key = `${pos}_${item.gstRate}`;
        if (!map[key]) {
          map[key] = { pos, rate: item.gstRate, taxable: 0, cess: 0 };
        }
        map[key].taxable += item.taxableAmount;
        map[key].cess += item.cessAmount;
      });
    });

  const rows = Object.values(map).map(r => [
    'OE',
    r.pos,
    '100',
    r.rate.toString(),
    r.taxable.toFixed(2),
    r.cess.toFixed(2),
    '',
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function generateGSTR1HSNCSV(invoices: Invoice[]): string {
  const headers = [
    'HSN',
    'Description',
    'UQC',
    'Total Quantity',
    'Total Value',
    'Taxable Value',
    'Integrated Tax Amount',
    'Central Tax Amount',
    'State/UT Tax Amount',
    'Cess Amount',
  ];

  const hsnMap: Record<string, {
    hsn: string;
    desc: string;
    uqc: string;
    qty: number;
    val: number;
    txval: number;
    iamt: number;
    camt: number;
    samt: number;
    csamt: number;
  }> = {};

  invoices.filter(i => i.status !== 'CANCELLED' && i.status !== 'DRAFT').forEach(inv => {
    inv.items.forEach(item => {
      const code = item.hsnSacCode || 'OTHERS';
      if (!hsnMap[code]) {
        hsnMap[code] = {
          hsn: code,
          desc: item.name,
          uqc: item.unit || 'PCS',
          qty: 0,
          val: 0,
          txval: 0,
          iamt: 0,
          camt: 0,
          samt: 0,
          csamt: 0,
        };
      }
      hsnMap[code].qty += item.quantity;
      hsnMap[code].val += item.totalAmount;
      hsnMap[code].txval += item.taxableAmount;
      hsnMap[code].iamt += item.igstAmount;
      hsnMap[code].camt += item.cgstAmount;
      hsnMap[code].samt += item.sgstAmount;
      hsnMap[code].csamt += item.cessAmount;
    });
  });

  const rows = Object.values(hsnMap).map(h => [
    h.hsn,
    `"${h.desc.replace(/"/g, '""')}"`,
    h.uqc,
    h.qty.toFixed(2),
    h.val.toFixed(2),
    h.txval.toFixed(2),
    h.iamt.toFixed(2),
    h.camt.toFixed(2),
    h.samt.toFixed(2),
    h.csamt.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
