import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Layers, 
  Clipboard, 
  Check, 
  AlertCircle, 
  X, 
  BookOpen, 
  Sparkles,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Item, ItemType } from '../../types';
import { GST_RATES, STANDARD_UNITS } from '../../utils/gstEngine';
import { searchHSNDirectory, HSNDirectoryItem } from '../../utils/hsnDirectory';

interface BulkRow {
  id: string;
  name: string;
  itemCode: string;
  itemType: ItemType;
  hsnSacCode: string;
  unit: string;
  purchasePrice: number | string;
  sellingPrice: number | string;
  gstRate: number;
  openingStock: number | string;
  minStockAlert: number | string;
  error?: string;
}

interface BulkAddItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkAddItemsModal: React.FC<BulkAddItemsModalProps> = ({ isOpen, onClose }) => {
  const { company, saveItemsBulk, showToast } = useApp();
  
  const createEmptyRow = (): BulkRow => ({
    id: `bulk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: '',
    itemCode: '',
    itemType: 'GOODS',
    hsnSacCode: '847141',
    unit: 'PCS',
    purchasePrice: '',
    sellingPrice: '',
    gstRate: company.defaultGstRate || 18,
    openingStock: 10,
    minStockAlert: 5,
  });

  const [rows, setRows] = useState<BulkRow[]>([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ]);

  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [activeHsnRowId, setActiveHsnRowId] = useState<string | null>(null);
  const [hsnSearch, setHsnSearch] = useState('');

  if (!isOpen) return null;

  const handleRowChange = (id: string, field: keyof BulkRow, value: any) => {
    setRows(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value, error: undefined };
      }
      return row;
    }));
  };

  const addRows = (count: number = 1) => {
    const newRows: BulkRow[] = [];
    for (let i = 0; i < count; i++) {
      newRows.push(createEmptyRow());
    }
    setRows(prev => [...prev, ...newRows]);
  };

  const duplicateRow = (index: number) => {
    const target = rows[index];
    const dup: BulkRow = {
      ...target,
      id: `bulk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: `${target.name} (Copy)`,
      itemCode: target.itemCode ? `${target.itemCode}-COPY` : '',
    };
    const next = [...rows];
    next.splice(index + 1, 0, dup);
    setRows(next);
  };

  const removeRow = (id: string) => {
    if (rows.length === 1) {
      setRows([createEmptyRow()]);
      return;
    }
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const applyBulkGst = (rate: number) => {
    setRows(prev => prev.map(r => ({ ...r, gstRate: rate })));
    showToast('info', 'GST Rate Applied', `Set ${rate}% GST for all rows in table.`);
  };

  const applyBulkUnit = (unit: string) => {
    setRows(prev => prev.map(r => ({ ...r, unit })));
    showToast('info', 'Unit Applied', `Set measurement unit ${unit} for all rows.`);
  };

  // Parse TSV / CSV / Excel clipboard
  const handleParsePaste = () => {
    if (!pasteText.trim()) return;

    const lines = pasteText.trim().split(/\r?\n/);
    const parsedRows: BulkRow[] = [];

    lines.forEach((line, idx) => {
      // Split by tab (Excel/Sheets) or comma
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      if (parts.length === 0 || !parts[0]?.trim()) return;

      // Skip header row if it contains 'Name' or 'Item'
      if (idx === 0 && (parts[0].toLowerCase().includes('name') || parts[0].toLowerCase().includes('item'))) {
        return;
      }

      const name = parts[0]?.trim() || `Item ${idx + 1}`;
      const hsn = parts[1]?.trim().replace(/[^0-9]/g, '') || '847141';
      const unit = parts[2]?.trim().toUpperCase() || 'PCS';
      const sellPrice = parseFloat(parts[3]?.replace(/[^0-9.]/g, '')) || 0;
      const costPrice = parseFloat(parts[4]?.replace(/[^0-9.]/g, '')) || 0;
      const gstRate = [0, 5, 12, 18, 28].includes(parseInt(parts[5])) ? parseInt(parts[5]) : 18;
      const stock = parseFloat(parts[6]?.replace(/[^0-9.]/g, '')) || 10;
      const sku = parts[7]?.trim() || '';

      parsedRows.push({
        id: `paste-${Date.now()}-${idx}`,
        name,
        itemCode: sku,
        itemType: 'GOODS',
        hsnSacCode: hsn,
        unit,
        sellingPrice: sellPrice,
        purchasePrice: costPrice,
        gstRate,
        openingStock: stock,
        minStockAlert: 5,
      });
    });

    if (parsedRows.length > 0) {
      setRows(parsedRows);
      setPasteModalOpen(false);
      setPasteText('');
      showToast('success', 'Excel Data Pasted', `Loaded ${parsedRows.length} items from spreadsheet clipboard.`);
    } else {
      showToast('error', 'Paste Error', 'Could not parse tabular rows from text.');
    }
  };

  const handleSaveAll = () => {
    // Validate
    const validRows = rows.filter(r => r.name.trim() !== '');
    if (validRows.length === 0) {
      showToast('error', 'Validation Error', 'Please enter at least one item name.');
      return;
    }

    const itemsToSave: Item[] = validRows.map((r, idx) => {
      const sell = Number(r.sellingPrice) || 0;
      const cost = Number(r.purchasePrice) || 0;
      const stock = Number(r.openingStock) || 0;
      const minStock = Number(r.minStockAlert) || 5;

      return {
        id: `item-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        name: r.name.trim(),
        itemCode: r.itemCode.trim().toUpperCase(),
        itemType: r.itemType || 'GOODS',
        hsnSacCode: r.hsnSacCode.trim() || '847141',
        description: '',
        unit: r.unit || 'PCS',
        sellingPrice: sell,
        isPriceTaxInclusive: false,
        purchasePrice: cost,
        gstRate: Number(r.gstRate) || 18,
        cessRate: 0,
        openingStock: stock,
        currentStock: stock,
        minStockAlert: minStock,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    saveItemsBulk(itemsToSave);
    onClose();
  };

  const searchedHsns = searchHSNDirectory(hsnSearch);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              Bulk Add Products & Services
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rapidly type multiple catalog items or copy & paste directly from Excel / Google Sheets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPasteModalOpen(true)}
              className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
              <span>Paste from Excel / CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Batch Setup Toolbar */}
        <div className="py-2.5 px-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-600 text-[11px] uppercase tracking-wider">Quick Fill:</span>
            
            {/* Quick GST rates */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">All GST:</span>
              {[0, 5, 12, 18, 28].map(rate => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => applyBulkGst(rate)}
                  className="px-2 py-0.5 bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 rounded text-[11px] font-mono font-bold text-slate-700 cursor-pointer shadow-2xs"
                >
                  {rate}%
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            {/* Quick Units */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">All Unit:</span>
              {['PCS', 'NOS', 'BOX', 'KGS', 'MTR', 'SET'].map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => applyBulkUnit(u)}
                  className="px-2 py-0.5 bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 cursor-pointer shadow-2xs"
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => addRows(1)}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600" />
              <span>+1 Row</span>
            </button>
            <button
              type="button"
              onClick={() => addRows(5)}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600" />
              <span>+5 Rows</span>
            </button>
          </div>
        </div>

        {/* Spreadsheet Grid Table */}
        <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[300px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/90 sticky top-0 z-10 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-2.5 py-2 w-8 text-center">#</th>
                <th className="px-2.5 py-2 min-w-[200px]">Item / Product Name *</th>
                <th className="px-2.5 py-2 w-28">SKU / Code</th>
                <th className="px-2.5 py-2 w-28">HSN/SAC *</th>
                <th className="px-2.5 py-2 w-24">Unit</th>
                <th className="px-2.5 py-2 w-28 text-right">Cost (₹)</th>
                <th className="px-2.5 py-2 w-32 text-right">Selling Price (₹) *</th>
                <th className="px-2.5 py-2 w-24 text-center">GST %</th>
                <th className="px-2.5 py-2 w-24 text-right">Stock Qty</th>
                <th className="px-2.5 py-2 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={row.id} className="hover:bg-slate-50/70">
                  <td className="px-2.5 py-1.5 text-center text-slate-400 font-mono text-[11px]">
                    {index + 1}
                  </td>
                  
                  {/* Name */}
                  <td className="px-2.5 py-1.5 min-w-[200px]">
                    <input
                      type="text"
                      value={row.name}
                      placeholder="e.g. Wireless Mouse M185"
                      onChange={e => handleRowChange(row.id, 'name', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                    />
                  </td>

                  {/* SKU */}
                  <td className="px-2.5 py-1.5 w-28">
                    <input
                      type="text"
                      value={row.itemCode}
                      placeholder="SKU-001"
                      onChange={e => handleRowChange(row.id, 'itemCode', e.target.value.toUpperCase())}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-mono uppercase focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </td>

                  {/* HSN */}
                  <td className="px-2.5 py-1.5 w-28">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={row.hsnSacCode}
                        placeholder="847141"
                        onChange={e => handleRowChange(row.id, 'hsnSacCode', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-mono text-center focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                  </td>

                  {/* Unit */}
                  <td className="px-2.5 py-1.5 w-24">
                    <select
                      value={row.unit}
                      onChange={e => handleRowChange(row.id, 'unit', e.target.value)}
                      className="w-full px-1.5 py-1.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      {STANDARD_UNITS.map(u => (
                        <option key={u.code} value={u.code}>{u.code}</option>
                      ))}
                    </select>
                  </td>

                  {/* Cost Price */}
                  <td className="px-2.5 py-1.5 w-28 text-right">
                    <input
                      type="number"
                      min={0}
                      value={row.purchasePrice}
                      placeholder="0"
                      onChange={e => handleRowChange(row.id, 'purchasePrice', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-mono text-right text-slate-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </td>

                  {/* Selling Price */}
                  <td className="px-2.5 py-1.5 w-32 text-right">
                    <input
                      type="number"
                      min={0}
                      value={row.sellingPrice}
                      placeholder="0.00"
                      onChange={e => handleRowChange(row.id, 'sellingPrice', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono font-bold text-right text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </td>

                  {/* GST Rate */}
                  <td className="px-2.5 py-1.5 w-24 text-center">
                    <select
                      value={row.gstRate}
                      onChange={e => handleRowChange(row.id, 'gstRate', Number(e.target.value))}
                      className="w-full px-1.5 py-1.5 border border-slate-200 rounded text-xs font-mono font-bold text-center bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      {GST_RATES.map(r => (
                        <option key={r} value={r}>{r}%</option>
                      ))}
                    </select>
                  </td>

                  {/* Stock */}
                  <td className="px-2.5 py-1.5 w-24 text-right">
                    <input
                      type="number"
                      min={0}
                      value={row.openingStock}
                      placeholder="10"
                      onChange={e => handleRowChange(row.id, 'openingStock', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-mono text-right focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </td>

                  {/* Actions */}
                  <td className="px-2.5 py-1.5 w-20 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => duplicateRow(index)}
                        title="Duplicate Row"
                        className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        title="Delete Row"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Total Rows: <span className="font-bold text-slate-800">{rows.length}</span> | 
            Ready to Save: <span className="font-bold text-teal-700">{rows.filter(r => r.name.trim()).length}</span> items
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="py-2 px-5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save All Items to Catalog</span>
            </button>
          </div>
        </div>

        {/* Paste from Excel / CSV Sub-modal */}
        {pasteModalOpen && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                  Paste from Excel or Google Sheets
                </h4>
                <button
                  type="button"
                  onClick={() => setPasteModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Copy columns from your spreadsheet and paste below. Expected order:
              </p>
              <div className="p-2 bg-slate-100 rounded text-[11px] font-mono text-slate-700">
                Item Name | HSN Code | Unit | Selling Price | Cost Price | GST % | Stock | SKU
              </div>

              <textarea
                rows={8}
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder="Paste tab-separated rows copied directly from Excel or Google Sheets..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasteModalOpen(false)}
                  className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleParsePaste}
                  className="py-1.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Import Rows into Grid
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
