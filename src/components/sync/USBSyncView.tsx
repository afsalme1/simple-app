import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  HardDrive, 
  Smartphone, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  FileText, 
  Users, 
  Package, 
  CreditCard, 
  ArrowRightLeft, 
  Info,
  Clock,
  Usb,
  Share2,
  FolderInput,
  FolderOutput
} from 'lucide-react';
import { SyncDiffResult } from '../../utils/syncEngine';

export const USBSyncView: React.FC = () => {
  const { 
    currentUser, 
    invoices, 
    customers, 
    items, 
    payments, 
    syncLogs, 
    exportUSBSyncPackage, 
    importUSBSyncPackage, 
    applyUSBSyncMerge,
    showToast 
  } = useApp();

  const [deviceName, setDeviceName] = useState(() => {
    if (typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)) {
      return 'Salesman Android Phone';
    }
    return 'Main Office PC';
  });

  const [diffResult, setDiffResult] = useState<SyncDiffResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportSync = () => {
    try {
      setIsExporting(true);
      const { filename, jsonString, packageData } = exportUSBSyncPackage(deviceName);

      const blobSuite = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blobSuite);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      showToast(
        'success', 
        'USB Sync Package Created', 
        `Saved "${filename}". Copy this file to your USB drive or connect Android phone via USB.`
      );
    } catch (e: any) {
      setIsExporting(false);
      showToast('error', 'Export Failed', e.message || 'Could not create sync bundle.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setIsImporting(true);

    const reader不易 = new FileReader();
    reader不易.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) {
        setIsImporting(false);
        showToast('error', 'File Read Error', 'Selected sync file is empty.');
        return;
      }

      const result = importUSBSyncPackage(content);
      setIsImporting(false);

      if (!result.success || !result.diff) {
        showToast('error', 'Sync Parse Failed', result.error || 'Invalid sync bundle file.');
        return;
      }

      setDiffResult(result.diff);
      showToast('info', 'Sync Package Analyzed', 'Review changes below and click "Confirm Merge".');
    };

    reader不易.onerror = () => {
      setIsImporting(false);
      showToast('error', 'File Read Error', 'Failed to read the sync file.');
    };

    reader不易.readAsText(file);
  };

  const handleConfirmMerge = () => {
    if (!diffResult) return;
    applyUSBSyncMerge(diffResult);
    setDiffResult(null);
    setImportFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2 border border-blue-500/20">
              <Usb className="w-3.5 h-3.5" />
              <span>Offline USB & Mobile Bridge</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              USB Sync (Computer ↔ Android Phone)
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Seamlessly synchronize invoices, customer collections, and inventory catalog between PC and salesman Android phones without needing internet connection.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Device: <strong className="text-white">{deviceName}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Col Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1: Export USB Sync Package */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <FolderOutput className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-bold text-white">1. Export Sync Bundle to USB</h2>
            <p className="text-sm text-slate-400 mt-1">
              Creates a portable, encrypted <code className="text-blue-400 font-mono text-xs">.gstsync</code> bundle containing all local invoices, customer dues, items, and payments created on this device.
            </p>

            <div className="mt-4 p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span>Invoices included:</span>
                <span className="font-bold text-white">{invoices.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Customer records:</span>
                <span className="font-bold text-white">{customers.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Product items:</span>
                <span className="font-bold text-white">{items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Exported by:</span>
                <span className="font-bold text-blue-400">{currentUser?.name} ({currentUser?.role})</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Label This Device Name
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleExportSync}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating Bundle...' : 'Export .gstsync to USB Drive'}</span>
            </button>
          </div>
        </div>

        {/* Box 2: Import & Merge USB Sync Package */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <FolderInput className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-bold text-white">2. Import & Merge from USB / Phone</h2>
            <p className="text-sm text-slate-400 mt-1">
              Select a <code className="text-emerald-400 font-mono text-xs">.gstsync</code> file generated from another computer or salesman phone. Smart 2-way conflict-free merger will incorporate new orders and payments.
            </p>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".gstsync,.json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="mt-4 p-5 border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl bg-slate-950/40 text-center transition-all cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-white">
                {importFileName ? importFileName : 'Click to Browse USB Drive / Phone Storage'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Select .gstsync file from Flash Drive or USB OTG
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isImporting ? 'animate-spin' : ''}`} />
              <span>{isImporting ? 'Reading File...' : 'Select File to Merge'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Diff Result / Confirmation Modal Banner */}
      {diffResult && (
        <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-2xl p-6 shadow-2xl space-y-4 animate-scaleUp">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Sync Analysis Ready for Merge</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Package: <span className="font-mono text-emerald-300">{importFileName}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDiffResult(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm font-medium"
              >
                Dismiss
              </button>
              <button
                onClick={handleConfirmMerge}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
              >
                Confirm & Merge Records
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">New Invoices</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">+{diffResult.newInvoices.length}</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Updated Invoices</div>
              <div className="text-xl font-bold text-blue-400 mt-0.5">{diffResult.updatedInvoices.length}</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">New Payments</div>
              <div className="text-xl font-bold text-amber-400 mt-0.5">+{diffResult.newPayments.length}</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">New Customers</div>
              <div className="text-xl font-bold text-purple-400 mt-0.5">+{diffResult.newCustomers.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* USB Connection Step-by-Step Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400" />
          How USB Sync Works (Computer ↔ Android Phone)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Option A: USB Flash Drive</span>
            </div>
            <p className="text-slate-400">
              Plug USB Pen Drive into PC or Phone (via USB OTG adapter). Click <strong>"Export .gstsync"</strong> and save directly to USB. Plug drive into the target device and click <strong>"Import & Merge"</strong>.
            </p>
          </div>

          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span>Option B: USB Cable Connection</span>
            </div>
            <p className="text-slate-400">
              Connect Android phone to Computer via USB cable. Set phone to "File Transfer (MTP)". Copy the exported <code className="text-blue-400">.gstsync</code> file directly to the phone's Download folder.
            </p>
          </div>

          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
              <span>Automatic Deduplication</span>
            </div>
            <p className="text-slate-400">
              The built-in engine checks invoice numbers and timestamps. No duplicate invoices or overwritten payments will occur during two-way sync.
            </p>
          </div>
        </div>
      </div>

      {/* Sync Log History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>USB Sync History</span>
          </h3>
          <span className="text-xs text-slate-500">{syncLogs.length} sync operations recorded</span>
        </div>

        <div className="space-y-2.5">
          {syncLogs.slice(0, 8).map((log) => (
            <div
              key={log.id}
              className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    log.direction === 'EXPORT'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {log.direction === 'EXPORT' ? <Download className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {log.direction === 'EXPORT' ? 'Exported USB Package' : 'Merged Incoming USB Package'}
                  </div>
                  <div className="text-slate-400 text-[11px]">{log.details}</div>
                </div>
              </div>

              <div className="text-right text-slate-500 font-mono text-[11px]">
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
          ))}

          {syncLogs.length === 0 && (
            <div className="p-6 text-center text-slate-500 text-xs">
              No USB sync operations performed yet. Click Export or Import above to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
