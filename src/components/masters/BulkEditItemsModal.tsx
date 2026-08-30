import React, { useState } from 'react';
import { 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Percent, 
  Layers, 
  AlertTriangle, 
  Search,
  Filter,
  DollarSign,
  ArrowUpDown,
  Tag
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Item, ItemType } from '../../types';
import { GST_RATES, STANDARD_UNITS, formatINR } from '../../utils/gstEngine';

interface BulkEditItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItemIds?: string[];
}

export const BulkEditItemsModal: React.FC<BulkEditItemsModalProps> = ({
  isOpen,
  onClose,
  selectedItemIds = [],
}) => {
  const { items, saveItemsBulk, deleteItemsBulk, showToast } = useApp();

  // Working state: clone of catalog items to be modified
  const [workingItems, setWorkingItems] = useState<Item[]>(() => {
    if (selectedItemIds.length > 0) {
      return items.filter(i => selectedItemIds.includes(i.id)).map(i => ({ ...i }));
    }
    return items.map(i => ({ ...i }));
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    if (selectedItemIds.length > 0) {
      return new Set(selectedItemIds);
    }
    return new Set(items.map(i => i.id));
  });

  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'GOODS' | 'SERVICES'>('ALL');

  // Batch action tool states
  const [batchGst, setBatchGst] = useState<number | ''>('');
  const [batchUnit, setBatchUnit] = useState<string>('');
  const [batchPriceAdjustmentType, setBatchPriceAdjustmentType] = useState<'PERCENT_INCREASE' | 'PERCENT_DECREASE' | 'FIXED_ADD' | 'MARKUP_OVER_COST'>('PERCENT_INCREASE');
  const [batchPriceValue, setBatchPriceValue] = useState<number | ''>('');
  const [batchHsn, setBatchHsn] = useState<string>('');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  if (!isOpen) return null;

  const handleCellChange = (id: string, field: keyof Item, value: any) => {
    setWorkingItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value, updatedAt: new Date().toISOString() };
      }
      return item;
    }));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  // Batch action: Apply GST to selected
  const applyBatchGst = () => {
    if (batchGst === '' || selectedIds.size === 0) return;
    setWorkingItems(prev => prev.map(item => {
      if (selectedIds.has(item.id)) {
        return { ...item, gstRate: Number(batchGst), updatedAt: new Date().toISOString() };
      }
      return item;
    }));
    showToast('success', 'Batch GST Updated', `Updated GST rate to ${batchGst}% for ${selectedIds.size} selected items.`);
  };

  // Batch action: Apply Unit
  const applyBatchUnit = () => {
    if (!batchUnit || selectedIds.size === 0) return;
    setWorkingItems(prev => prev.map(item => {
      if (selectedIds.has(item.id)) {
        return { ...item, unit: batchUnit, updatedAt: new Date().toISOString() };
      }
      return item;
    }));
    showToast('success', 'Batch Unit Updated', `Updated measurement unit to ${batchUnit} for ${selectedIds.size} selected items.`);
  };

  // Batch action: Apply HSN
  const applyBatchHsn = () => {
    if (!batchHsn.trim() || selectedIds.size === 0) return;
    setWorkingItems(prev => prev.map(item => {
      if (selectedIds.has(item.id)) {
        return { ...item, hsnSacCode: batchHsn.trim(), updatedAt: new Date().toISOString() };
      }
      return item;
    }));
    showToast('success', 'Batch HSN Updated', `Updated HSN code to ${batchHsn} for ${selectedIds.size} items.`);
    setBatchHsn('');
  };

  // Batch action: Price Adjustments
  const applyBatchPriceAdjustment = () => {
    if (batchPriceValue === '' || Number(batchPriceValue) <= 0 || selectedIds.size === 0) return;
    const val = Number(batchPriceValue);

    setWorkingItems(prev => prev.map(item => {
      if (!selectedIds.has(item.id)) return item;

      let newSelling = item.sellingPrice;
      if (batchPriceAdjustmentType === 'PERCENT_INCREASE') {
        newSelling = Number((item.sellingPrice * (1 + val / 100)).toFixed(2));
      } else if (batchPriceAdjustmentType === 'PERCENT_DECREASE') {
        newSelling = Math.max(0, Number((item.sellingPrice * (1 - val / 100)).toFixed(2)));
      } else if (batchPriceAdjustmentType === 'FIXED_ADD') {
        newSelling = Number((item.sellingPrice + val).toFixed(2));
      } else if (batchPriceAdjustmentType === 'MARKUP_OVER_COST') {
        // Selling Price = Cost + (Cost * Markup%)
        const cost = item.purchasePrice || 0;
        newSelling = Number((cost * (1 + val / 100)).toFixed(2));
      }

      return {
        ...item,
        sellingPrice: newSelling,
        updatedAt: new Date().toISOString(),
      };
    }));

    showToast('success', 'Prices Updated', `Adjusted selling rates for ${selectedIds.size} selected items.`);
    setBatchPriceValue('');
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const idsArray = Array.from(selectedIds);
    deleteItemsBulk(idsArray);
    setWorkingItems(prev => prev.filter(i => !selectedIds.has(i.id)));
    setSelectedIds(new Set());
    setIsConfirmDeleteOpen(false);
  };

  const handleSaveAll = () => {
    // Validate that names are not empty
    const invalid = workingItems.some(i => !i.name.trim());
    if (invalid) {
      showToast('error', 'Validation Error', 'Item names cannot be blank.');
      return;
    }

    saveItemsBulk(workingItems);
    onClose();
  };

  const filteredItems = workingItems.filter(item => {
    const q = searchFilter.toLowerCase();
    const match = 
      item.name.toLowerCase().includes(q) ||
      (item.itemCode && item.itemCode.toLowerCase().includes(q)) ||
      item.hsnSacCode.includes(q);

    if (!match) return false;
    if (typeFilter === 'ALL') return true;
    return item.itemType === typeFilter;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full p-6 shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-teal-600" />
              Bulk Edit Catalog Items & Prices
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Edit rates, HSN codes, GST %, stock levels, or perform batch operations across selected items.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Batch Operations Bar */}
        <div className="p-3 bg-teal-50/50 border-b border-teal-100/80 shrink-0 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-teal-900 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-teal-700" />
                Batch Actions ({selectedIds.size} Selected):
              </span>
            </div>

            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.size})</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            {/* Batch GST */}
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[11px] shrink-0">Set GST:</span>
              <select
                value={batchGst}
                onChange={e => setBatchGst(e.target.value === '' ? '' : Number(e.target.value))}
                className="flex-1 px-1 py-1 border border-slate-200 rounded text-xs bg-slate-50 font-mono"
              >
                <option value="">Choose %</option>
                {GST_RATES.map(r => (
                  <option key={r} value={r}>{r}% GST</option>
                ))}
              </select>
              <button
                type="button"
                onClick={applyBatchGst}
                disabled={batchGst === '' || selectedIds.size === 0}
                className="px-2 py-1 bg-teal-600 disabled:opacity-40 text-white rounded text-[11px] font-bold cursor-pointer"
              >
                Apply
              </button>
            </div>

            {/* Batch Unit */}
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[11px] shrink-0">Set Unit:</span>
              <select
                value={batchUnit}
                onChange={e => setBatchUnit(e.target.value)}
                className="flex-1 px-1 py-1 border border-slate-200 rounded text-xs bg-slate-50"
              >
                <option value="">Choose Unit</option>
                {STANDARD_UNITS.map(u => (
                  <option key={u.code} value={u.code}>{u.code}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={applyBatchUnit}
                disabled={!batchUnit || selectedIds.size === 0}
                className="px-2 py-1 bg-teal-600 disabled:opacity-40 text-white rounded text-[11px] font-bold cursor-pointer"
              >
                Apply
              </button>
            </div>

            {/* Batch HSN */}
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[11px] shrink-0">Set HSN:</span>
              <input
                type="text"
                placeholder="e.g. 847141"
                value={batchHsn}
                onChange={e => setBatchHsn(e.target.value)}
                className="flex-1 px-1.5 py-1 border border-slate-200 rounded text-xs font-mono"
              />
              <button
                type="button"
                onClick={applyBatchHsn}
                disabled={!batchHsn.trim() || selectedIds.size === 0}
                className="px-2 py-1 bg-teal-600 disabled:opacity-40 text-white rounded text-[11px] font-bold cursor-pointer"
              >
                Apply
              </button>
            </div>

            {/* Batch Price Modifier */}
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-lg border border-slate-200">
              <select
                value={batchPriceAdjustmentType}
                onChange={e => setBatchPriceAdjustmentType(e.target.value as any)}
                className="px-1 py-1 border border-slate-200 rounded text-[11px] bg-slate-50"
              >
                <option value="PERCENT_INCREASE">+% Rate</option>
                <option value="PERCENT_DECREASE">-% Rate</option>
                <option value="FIXED_ADD">+₹ Rate</option>
                <option value="MARKUP_OVER_COST">Cost + %</option>
              </select>
              <input
                type="number"
                min={0}
                placeholder="Val"
                value={batchPriceValue}
                onChange={e => setBatchPriceValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-14 px-1.5 py-1 border border-slate-200 rounded text-xs font-mono"
              />
              <button
                type="button"
                onClick={applyBatchPriceAdjustment}
                disabled={batchPriceValue === '' || selectedIds.size === 0}
                className="px-2 py-1 bg-teal-600 disabled:opacity-40 text-white rounded text-[11px] font-bold cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="py-2.5 px-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by name, SKU, HSN..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1">
              {(['ALL', 'GOODS', 'SERVICES'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer ${
                    typeFilter === t
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="text-slate-500 text-xs">
            Showing <span className="font-bold text-slate-700">{filteredItems.length}</span> of {workingItems.length} items
          </div>
        </div>

        {/* Editable Spreadsheet Table */}
        <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[320px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/90 sticky top-0 z-10 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-3 py-2 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2 min-w-[220px]">Item / Product Name</th>
                <th className="px-3 py-2 w-28">SKU / Code</th>
                <th className="px-3 py-2 w-28">HSN / SAC</th>
                <th className="px-3 py-2 w-24">Unit</th>
                <th className="px-3 py-2 w-28 text-right">Cost Price (₹)</th>
                <th className="px-3 py-2 w-32 text-right">Selling Rate (₹)</th>
                <th className="px-3 py-2 w-24 text-center">GST %</th>
                <th className="px-3 py-2 w-24 text-right">Stock</th>
                <th className="px-3 py-2 w-24 text-right">Min Alert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => {
                const isSelected = selectedIds.has(item.id);

                return (
                  <tr key={item.id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-teal-50/30' : ''}`}>
                    {/* Checkbox */}
                    <td className="px-3 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                    </td>

                    {/* Name */}
                    <td className="px-3 py-1.5 min-w-[220px]">
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => handleCellChange(item.id, 'name', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                      />
                    </td>

                    {/* SKU */}
                    <td className="px-3 py-1.5 w-28">
                      <input
                        type="text"
                        value={item.itemCode || ''}
                        onChange={e => handleCellChange(item.id, 'itemCode', e.target.value.toUpperCase())}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-mono uppercase focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </td>

                    {/* HSN */}
                    <td className="px-3 py-1.5 w-28">
                      <input
                        type="text"
                        value={item.hsnSacCode}
                        onChange={e => handleCellChange(item.id, 'hsnSacCode', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-mono text-center focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </td>

                    {/* Unit */}
                    <td className="px-3 py-1.5 w-24">
                      <select
                        value={item.unit}
                        onChange={e => handleCellChange(item.id, 'unit', e.target.value)}
                        className="w-full px-1.5 py-1 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      >
                        {STANDARD_UNITS.map(u => (
                          <option key={u.code} value={u.code}>{u.code}</option>
                        ))}
                      </select>
                    </td>

                    {/* Cost */}
                    <td className="px-3 py-1.5 w-28 text-right">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.purchasePrice || 0}
                        onChange={e => handleCellChange(item.id, 'purchasePrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-mono text-right text-slate-600 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </td>

                    {/* Selling Rate */}
                    <td className="px-3 py-1.5 w-32 text-right">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.sellingPrice}
                        onChange={e => handleCellChange(item.id, 'sellingPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono font-bold text-right text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </td>

                    {/* GST */}
                    <td className="px-3 py-1.5 w-24 text-center">
                      <select
                        value={item.gstRate}
                        onChange={e => handleCellChange(item.id, 'gstRate', Number(e.target.value))}
                        className="w-full px-1.5 py-1 border border-slate-200 rounded text-xs font-mono font-bold text-center bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      >
                        {GST_RATES.map(r => (
                          <option key={r} value={r}>{r}%</option>
                        ))}
                      </select>
                    </td>

                    {/* Stock */}
                    <td className="px-3 py-1.5 w-24 text-right">
                      <input
                        type="number"
                        min={0}
                        value={item.currentStock}
                        onChange={e => handleCellChange(item.id, 'currentStock', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-mono text-right focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </td>

                    {/* Min Alert */}
                    <td className="px-3 py-1.5 w-24 text-right">
                      <input
                        type="number"
                        min={0}
                        value={item.minStockAlert || 5}
                        onChange={e => handleCellChange(item.id, 'minStockAlert', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-mono text-right focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Selected: <span className="font-bold text-teal-700">{selectedIds.size}</span> items | 
            Total: <span className="font-bold text-slate-800">{workingItems.length}</span> items
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
              <span>Save All Changes</span>
            </button>
          </div>
        </div>

        {/* Confirm Delete Submodal */}
        {isConfirmDeleteOpen && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Delete {selectedIds.size} Items?</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Are you sure you want to permanently remove these {selectedIds.size} items from the catalog?
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteOpen(false)}
                  className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="py-1.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
