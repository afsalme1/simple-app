import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Tag, 
  BookOpen,
  X,
  Sparkles,
  Edit3,
  FileSpreadsheet,
  Camera,
  CheckSquare,
  Square
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Item, ItemType } from '../../types';
import { GST_RATES, STANDARD_UNITS, formatINR } from '../../utils/gstEngine';
import { HSN_DIRECTORY, searchHSNDirectory, HSNDirectoryItem } from '../../utils/hsnDirectory';
import { BulkAddItemsModal } from './BulkAddItemsModal';
import { BulkEditItemsModal } from './BulkEditItemsModal';
import { ScanItemsImageModal } from './ScanItemsImageModal';

export const ItemsManager: React.FC = () => {
  const { items, saveItem, deleteItem, deleteItemsBulk, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | 'GOODS' | 'SERVICES'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHsnPickerOpen, setIsHsnPickerOpen] = useState(false);
  const [hsnSearchQuery, setHsnSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Bulk operation modals
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isScanImageOpen, setIsScanImageOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Form State
  const [formData, setFormData] = useState<Partial<Item>>({
    name: '',
    itemCode: '',
    itemType: 'GOODS',
    hsnSacCode: '847141',
    description: '',
    unit: 'PCS',
    sellingPrice: 0,
    isPriceTaxInclusive: false,
    purchasePrice: 0,
    gstRate: 18,
    cessRate: 0,
    openingStock: 0,
    currentStock: 0,
    minStockAlert: 5,
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      id: `item-${Date.now()}`,
      name: '',
      itemCode: '',
      itemType: 'GOODS',
      hsnSacCode: '847130',
      description: '',
      unit: 'PCS',
      sellingPrice: 0,
      isPriceTaxInclusive: false,
      purchasePrice: 0,
      gstRate: 18,
      cessRate: 0,
      openingStock: 10,
      currentStock: 10,
      minStockAlert: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSelectHsn = (hsn: HSNDirectoryItem) => {
    setFormData(prev => ({
      ...prev,
      hsnSacCode: hsn.code,
      itemType: hsn.type,
      gstRate: hsn.defaultGstRate,
      description: prev.description || hsn.description,
    }));
    setIsHsnPickerOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      showToast('error', 'Required Field', 'Item name is required.');
      return;
    }

    const finalItem: Item = {
      id: formData.id || `item-${Date.now()}`,
      name: formData.name.trim(),
      itemCode: formData.itemCode?.trim() || '',
      itemType: formData.itemType || 'GOODS',
      hsnSacCode: formData.hsnSacCode?.trim() || '998311',
      description: formData.description?.trim() || '',
      unit: formData.unit || 'PCS',
      sellingPrice: Number(formData.sellingPrice) || 0,
      isPriceTaxInclusive: Boolean(formData.isPriceTaxInclusive),
      purchasePrice: Number(formData.purchasePrice) || 0,
      gstRate: Number(formData.gstRate) || 0,
      cessRate: Number(formData.cessRate) || 0,
      openingStock: Number(formData.openingStock) || 0,
      currentStock: editingItem ? (Number(formData.currentStock) || 0) : (Number(formData.openingStock) || 0),
      minStockAlert: Number(formData.minStockAlert) || 0,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveItem(finalItem);
    setIsModalOpen(false);
  };

  const filteredItems = items.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      item.name.toLowerCase().includes(q) ||
      (item.itemCode && item.itemCode.toLowerCase().includes(q)) ||
      item.hsnSacCode.includes(q) ||
      (item.description && item.description.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (selectedTypeFilter === 'ALL') return true;
    return item.itemType === selectedTypeFilter;
  });

  const searchedHsnList = searchHSNDirectory(hsnSearchQuery);

  const toggleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDeleteSelected = () => {
    if (selectedItemIds.size === 0) return;
    deleteItemsBulk(Array.from(selectedItemIds));
    setSelectedItemIds(new Set());
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-600" />
            Items & HSN/SAC Catalog
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage products & services, GST rates (0-28%), HSN codes, and inventory levels.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* AI Image Scanner */}
          <button
            id="btn-scan-items-image"
            onClick={() => setIsScanImageOpen(true)}
            className="py-2 px-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-teal-100" />
            <span>Scan from Image / Gallery</span>
          </button>

          {/* Bulk Add (Spreadsheet / Excel) */}
          <button
            id="btn-bulk-add-items"
            onClick={() => setIsBulkAddOpen(true)}
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>Bulk Add / Paste</span>
          </button>

          {/* Bulk Edit */}
          <button
            id="btn-bulk-edit-items"
            onClick={() => setIsBulkEditOpen(true)}
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-teal-600" />
            <span>Bulk Edit Rates</span>
          </button>

          {/* Single Add */}
          <button
            id="btn-add-item"
            onClick={openAddModal}
            className="py-2 px-3.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Item</span>
          </button>
        </div>
      </div>

      {/* Selected Items Batch Floating/Inline Action Bar */}
      {selectedItemIds.size > 0 && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between gap-3 text-xs shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="font-bold text-teal-900 bg-teal-200/80 px-2 py-0.5 rounded text-xs font-mono">
              {selectedItemIds.size} Selected
            </span>
            <span className="text-teal-800 text-xs">
              Perform batch operations on selected catalog items
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBulkEditOpen(true)}
              className="py-1.5 px-3 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Bulk Edit Selected ({selectedItemIds.size})</span>
            </button>
            <button
              type="button"
              onClick={handleBulkDeleteSelected}
              className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedItemIds(new Set())}
              className="py-1.5 px-2.5 text-slate-500 hover:text-slate-800 text-xs cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by item name, SKU, HSN code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {(['ALL', 'GOODS', 'SERVICES'] as const).map(type => (
            <button
              key={type}
              onClick={() => setSelectedTypeFilter(type)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                selectedTypeFilter === type
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'ALL' ? 'All Items' : type === 'GOODS' ? 'Goods (HSN)' : 'Services (SAC)'}
            </button>
          ))}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-3 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredItems.length > 0 && selectedItemIds.size === filteredItems.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3">Item / Service Name</th>
                <th className="px-4 py-3">HSN / SAC Code</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3 text-right">Selling Price</th>
                <th className="px-4 py-3 text-center">GST Rate</th>
                <th className="px-4 py-3 text-right">Current Stock</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    No catalog items found. Click "Add Single Item", "Bulk Add / Paste", or "Scan from Image" to create items.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isLowStock = item.itemType === 'GOODS' && item.currentStock <= (item.minStockAlert || 5);
                  const isChecked = selectedItemIds.has(item.id);

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/70 transition-colors ${isChecked ? 'bg-teal-50/30' : ''}`}>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectItem(item.id)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                            item.itemType === 'GOODS' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                          }`}>
                            {item.itemType === 'GOODS' ? 'GOODS' : 'SVC'}
                          </span>
                          <span>{item.name}</span>
                        </div>
                        {item.itemCode && (
                          <div className="text-[11px] text-slate-400 font-mono">SKU: {item.itemCode}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.hsnSacCode}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-600 font-medium">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-mono font-bold text-slate-800">{formatINR(item.sellingPrice)}</div>
                        {item.purchasePrice ? (
                          <div className="text-[10px] text-slate-400">Cost: {formatINR(item.purchasePrice)}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-semibold font-mono text-[11px]">
                          {item.gstRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.itemType === 'GOODS' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className={`font-mono font-bold ${isLowStock ? 'text-rose-600' : 'text-slate-700'}`}>
                              {item.currentStock} {item.unit}
                            </span>
                            {isLowStock && (
                              <span title="Low Stock Warning">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Service (N/A)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(item)}
                            title="Edit Item"
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            title="Delete Item"
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

      {/* Add / Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-600" />
                {editingItem ? 'Edit Product / Service' : 'Add New Item to Catalog'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Item Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Samsung 1TB SSD 980 Pro"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    SKU / Item Code
                  </label>
                  <input
                    type="text"
                    value={formData.itemCode || ''}
                    onChange={e => setFormData({ ...formData, itemCode: e.target.value.toUpperCase() })}
                    placeholder="SSD-SAM-1TB"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Item Type
                  </label>
                  <select
                    value={formData.itemType}
                    onChange={e => setFormData({ ...formData, itemType: e.target.value as ItemType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="GOODS">Goods (Physical Product)</option>
                    <option value="SERVICES">Services (SAC Code)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                    <span>HSN / SAC Code <span className="text-rose-500">*</span></span>
                    <button
                      type="button"
                      onClick={() => setIsHsnPickerOpen(true)}
                      className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3" />
                      Browse Indian HSN Directory
                    </button>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.hsnSacCode || ''}
                      onChange={e => setFormData({ ...formData, hsnSacCode: e.target.value })}
                      placeholder="e.g. 847141 or 998311"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    GST Tax Rate (%) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.gstRate}
                    onChange={e => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {GST_RATES.map(rate => (
                      <option key={rate} value={rate}>
                        {rate}% GST {rate === 18 ? '(Standard)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Measurement Unit (UQC)
                  </label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {STANDARD_UNITS.map(u => (
                      <option key={u.code} value={u.code}>
                        {u.code} - {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Cess Rate (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.cessRate || 0}
                    onChange={e => setFormData({ ...formData, cessRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Selling Price (₹ Before GST) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={formData.sellingPrice || 0}
                    onChange={e => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Purchase / Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.purchasePrice || 0}
                    onChange={e => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {formData.itemType === 'GOODS' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {editingItem ? 'Current Stock Qty' : 'Opening Stock Qty'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editingItem ? formData.currentStock : formData.openingStock}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormData({
                          ...formData,
                          currentStock: val,
                          openingStock: editingItem ? formData.openingStock : val,
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Low Stock Alert Threshold
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.minStockAlert || 5}
                      onChange={e => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HSN / SAC Directory Lookup Modal */}
      {isHsnPickerOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                  Indian GST HSN / SAC Directory
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select official GST Harmonized System Code to auto-fill code & standard GST rate.
                </p>
              </div>
              <button
                onClick={() => setIsHsnPickerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search HSN code, product name, software, clothing, electronics..."
                  value={hsnSearchQuery}
                  onChange={e => setHsnSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {searchedHsnList.map(hsn => (
                <div
                  key={hsn.code}
                  onClick={() => handleSelectHsn(hsn)}
                  className="p-3 hover:bg-teal-50/70 transition-colors cursor-pointer flex items-center justify-between group rounded-lg"
                >
                  <div className="space-y-0.5 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-xs">
                        {hsn.code}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-100">
                        {hsn.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium group-hover:text-teal-900">
                      {hsn.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-slate-800 text-xs px-2 py-1 bg-slate-100 rounded group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      {hsn.defaultGstRate}% GST
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Items Modal */}
      <BulkAddItemsModal
        isOpen={isBulkAddOpen}
        onClose={() => setIsBulkAddOpen(false)}
      />

      {/* Bulk Edit Items Modal */}
      <BulkEditItemsModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        selectedItemIds={Array.from(selectedItemIds)}
      />

      {/* Scan Items Image Modal */}
      <ScanItemsImageModal
        isOpen={isScanImageOpen}
        onClose={() => setIsScanImageOpen(false)}
      />
    </div>
  );
};
