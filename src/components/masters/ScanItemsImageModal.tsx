import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Image as ImageIcon, 
  Upload, 
  Sparkles, 
  Check, 
  X, 
  AlertCircle, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Layers, 
  HelpCircle,
  Maximize2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Item, ItemType } from '../../types';
import { GST_RATES, STANDARD_UNITS, formatINR } from '../../utils/gstEngine';

interface ScannedRow {
  id: string;
  name: string;
  itemCode?: string;
  itemType: ItemType;
  hsnSacCode: string;
  unit: string;
  purchasePrice: number | string;
  sellingPrice: number | string;
  gstRate: number;
  openingStock: number | string;
  minStockAlert: number | string;
  description?: string;
}

interface ScanItemsImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportToInvoice?: (items: ScannedRow[]) => void;
}

export const ScanItemsImageModal: React.FC<ScanItemsImageModalProps> = ({ isOpen, onClose, onImportToInvoice }) => {
  const { company, saveItemsBulk, showToast } = useApp();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isScanning, setIsScanning] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [scannedItems, setScannedItems] = useState<ScannedRow[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanNotes, setScanNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Invalid File', 'Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    setImageMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
      setHasScanned(false);
      setScannedItems([]);
      setScanNotes('');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      showToast('error', 'Invalid File', 'Please drop a valid image file.');
      return;
    }

    setImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
      setHasScanned(false);
      setScannedItems([]);
      setScanNotes('');
    };
    reader.readAsDataURL(file);
  };

  const handleScanImage = async () => {
    if (!selectedImage) {
      showToast('error', 'No Image', 'Please select or upload an image first.');
      return;
    }

    setIsScanning(true);
    try {
      const res = await fetch('/api/scan-items-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: imageMimeType,
          instructions: customInstructions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to scan items from image.');
      }

      const detected = (data.items || []).map((it: any, idx: number): ScannedRow => ({
        id: `scanned-${Date.now()}-${idx}`,
        name: it.name || `Scanned Item ${idx + 1}`,
        itemCode: it.itemCode || '',
        itemType: (it.itemType === 'SERVICES' ? 'SERVICES' : 'GOODS') as ItemType,
        hsnSacCode: it.hsnSacCode || '847141',
        unit: it.unit || 'PCS',
        purchasePrice: it.purchasePrice || 0,
        sellingPrice: it.sellingPrice || 0,
        gstRate: [0, 5, 12, 18, 28].includes(Number(it.gstRate)) ? Number(it.gstRate) : (company.defaultGstRate || 18),
        openingStock: it.openingStock || 10,
        minStockAlert: it.minStockAlert || 5,
        description: it.description || '',
      }));

      setScannedItems(detected);
      setScanNotes(data.notes || '');
      setHasScanned(true);

      if (detected.length === 0) {
        showToast('warning', 'No Items Found', 'AI could not find clear products or items in this image. Try a clearer photo or add custom instructions.');
      } else {
        showToast('success', 'Scan Complete', `Extracted ${detected.length} items from image with GST rates and prices.`);
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      showToast('error', 'Scan Failed', err.message || 'Could not analyze image.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleRowChange = (id: string, field: keyof ScannedRow, value: any) => {
    setScannedItems(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  const removeRow = (id: string) => {
    setScannedItems(prev => prev.filter(r => r.id !== id));
  };

  const addManualRow = () => {
    const newRow: ScannedRow = {
      id: `manual-${Date.now()}`,
      name: '',
      itemCode: '',
      itemType: 'GOODS',
      hsnSacCode: '847141',
      unit: 'PCS',
      purchasePrice: 0,
      sellingPrice: 0,
      gstRate: company.defaultGstRate || 18,
      openingStock: 10,
      minStockAlert: 5,
    };
    setScannedItems(prev => [...prev, newRow]);
  };

  const applyBulkGst = (rate: number) => {
    setScannedItems(prev => prev.map(r => ({ ...r, gstRate: rate })));
  };

  const handleSaveAll = () => {
    const valid = scannedItems.filter(r => r.name.trim() !== '');
    if (valid.length === 0) {
      showToast('error', 'Validation Error', 'No valid items to import.');
      return;
    }

    const itemsToSave: Item[] = valid.map((r, idx) => ({
      id: `item-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: r.name.trim(),
      itemCode: (r.itemCode || '').trim().toUpperCase(),
      itemType: r.itemType || 'GOODS',
      hsnSacCode: (r.hsnSacCode || '847141').trim(),
      description: r.description || '',
      unit: r.unit || 'PCS',
      sellingPrice: Number(r.sellingPrice) || 0,
      isPriceTaxInclusive: false,
      purchasePrice: Number(r.purchasePrice) || 0,
      gstRate: Number(r.gstRate) || 18,
      cessRate: 0,
      openingStock: Number(r.openingStock) || 0,
      currentStock: Number(r.openingStock) || 0,
      minStockAlert: Number(r.minStockAlert) || 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    saveItemsBulk(itemsToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              AI Image Scanner — Bulk Item Importer
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload or snap a photo of supplier bills, price lists, product catalogs, shelf stickers, or handwritten rate sheets.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {!hasScanned ? (
            /* Upload & Scan Stage */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Image Upload Area (7 cols) */}
              <div className="md:col-span-7 space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />

                {selectedImage ? (
                  <div className="relative rounded-xl border border-slate-200 bg-slate-950/5 p-2 flex flex-col items-center justify-center min-h-[260px] max-h-[360px] overflow-hidden group">
                    <img
                      src={selectedImage}
                      alt="Uploaded Catalog Preview"
                      className="max-h-[340px] max-w-full object-contain rounded-lg shadow-sm"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="py-1.5 px-3 bg-white text-slate-800 rounded-lg text-xs font-semibold shadow hover:bg-slate-100 cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Change Image</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50 hover:bg-teal-50/30 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors min-h-[260px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-teal-100/70 text-teal-700 flex items-center justify-center mb-3">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                      Click to choose image or drag & drop here
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Upload from phone gallery, scanner, photos of paper invoices, price lists, or catalog screenshots.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Browse Gallery / Files</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions & Actions (5 cols) */}
              <div className="md:col-span-5 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Smart Vision Settings
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Special Parsing Hint (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={customInstructions}
                    onChange={e => setCustomInstructions(e.target.value)}
                    placeholder="e.g. Rate column is MRP. Default GST to 18%. Unit is KGS for fruits."
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="p-2.5 bg-teal-50 rounded-lg border border-teal-100 text-[11px] text-teal-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-teal-700" />
                    What AI Vision extracts:
                  </div>
                  <ul className="list-disc list-inside text-teal-800 text-[10px] space-y-0.5 ml-1">
                    <li>Product Names & Model / SKU</li>
                    <li>Official GST HSN / SAC Codes</li>
                    <li>Selling Rates, Wholesale Costs</li>
                    <li>GST Rate % (0%, 5%, 12%, 18%, 28%)</li>
                    <li>Units (PCS, KGS, BOX, etc.) & Stock counts</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleScanImage}
                  disabled={!selectedImage || isScanning}
                  className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analyzing Image with Gemini Vision...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Scan & Extract Items</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Review & Edit Extracted Items Stage */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold">
                    Successfully extracted {scannedItems.length} items from image.
                  </span>
                  {scanNotes && (
                    <span className="text-[11px] text-emerald-800 font-normal">({scanNotes})</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHasScanned(false)}
                    className="py-1 px-2.5 bg-white border border-emerald-300 text-emerald-800 rounded-md text-[11px] font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    Rescan Another Image
                  </button>
                  <button
                    type="button"
                    onClick={addManualRow}
                    className="py-1 px-2.5 bg-teal-700 text-white rounded-md text-[11px] font-semibold hover:bg-teal-800 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Row</span>
                  </button>
                </div>
              </div>

              {/* Quick GST bar */}
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="text-[11px] font-semibold">Bulk Set GST %:</span>
                {[0, 5, 12, 18, 28].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => applyBulkGst(r)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 rounded text-[11px] font-mono font-bold border border-slate-200 cursor-pointer"
                  >
                    {r}%
                  </button>
                ))}
              </div>

              {/* Editable Scanned Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[380px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-2.5 py-2 w-8 text-center">#</th>
                      <th className="px-2.5 py-2 min-w-[200px]">Item Name</th>
                      <th className="px-2.5 py-2 w-28">HSN/SAC</th>
                      <th className="px-2.5 py-2 w-20">Unit</th>
                      <th className="px-2.5 py-2 w-24 text-right">Cost (₹)</th>
                      <th className="px-2.5 py-2 w-28 text-right">Selling (₹)</th>
                      <th className="px-2.5 py-2 w-20 text-center">GST %</th>
                      <th className="px-2.5 py-2 w-20 text-right">Stock</th>
                      <th className="px-2.5 py-2 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scannedItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-2.5 py-1.5 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="px-2.5 py-1.5 min-w-[200px]">
                          <input
                            type="text"
                            value={item.name}
                            onChange={e => handleRowChange(item.id, 'name', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-2.5 py-1.5 w-28">
                          <input
                            type="text"
                            value={item.hsnSacCode}
                            onChange={e => handleRowChange(item.id, 'hsnSacCode', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-mono text-center focus:ring-2 focus:ring-teal-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-2.5 py-1.5 w-20">
                          <select
                            value={item.unit}
                            onChange={e => handleRowChange(item.id, 'unit', e.target.value)}
                            className="w-full px-1 py-1 border border-slate-200 rounded text-xs bg-white"
                          >
                            {STANDARD_UNITS.map(u => (
                              <option key={u.code} value={u.code}>{u.code}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2.5 py-1.5 w-24 text-right">
                          <input
                            type="number"
                            min={0}
                            value={item.purchasePrice}
                            onChange={e => handleRowChange(item.id, 'purchasePrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-mono text-right text-slate-600"
                          />
                        </td>
                        <td className="px-2.5 py-1.5 w-28 text-right">
                          <input
                            type="number"
                            min={0}
                            value={item.sellingPrice}
                            onChange={e => handleRowChange(item.id, 'sellingPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono font-bold text-right text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-2.5 py-1.5 w-20 text-center">
                          <select
                            value={item.gstRate}
                            onChange={e => handleRowChange(item.id, 'gstRate', Number(e.target.value))}
                            className="w-full px-1 py-1 border border-slate-200 rounded text-xs font-mono font-bold text-center bg-white"
                          >
                            {GST_RATES.map(r => (
                              <option key={r} value={r}>{r}%</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2.5 py-1.5 w-20 text-right">
                          <input
                            type="number"
                            min={0}
                            value={item.openingStock}
                            onChange={e => handleRowChange(item.id, 'openingStock', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-mono text-right"
                          />
                        </td>
                        <td className="px-2.5 py-1.5 w-12 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {hasScanned && (
              <span>Ready to add <strong className="text-teal-700">{scannedItems.length}</strong> items to database.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {hasScanned && (
              <>
                {onImportToInvoice && (
                  <button
                    type="button"
                    onClick={() => {
                      onImportToInvoice(scannedItems.filter(r => r.name.trim() !== ''));
                      onClose();
                    }}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Insert into Current Bill ({scannedItems.length})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="py-2 px-5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save to Master Catalog</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
