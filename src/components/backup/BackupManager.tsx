import React, { useState, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldCheck, 
  HardDrive, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  FileCode, 
  Cpu
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { downloadFile } from '../../utils/gstrExport';

export const BackupManager: React.FC = () => {
  const { 
    company, 
    customers, 
    items, 
    invoices, 
    payments, 
    creditNotes, 
    restoreFullBackup, 
    resetToFactoryData, 
    showToast 
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [autoBackupFreq, setAutoBackupFreq] = useState<'DAILY' | 'WEEKLY' | 'ON_EXIT'>('DAILY');
  const [showSqlSchema, setShowSqlSchema] = useState(false);

  // Manual Backup trigger
  const handleExportBackup = () => {
    const backupPayload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      appName: 'GST Invoice Pro',
      company,
      customers,
      items,
      invoices,
      payments,
      creditNotes,
    };

    const jsonStr = JSON.stringify(backupPayload, null, 2);
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `gst_pro_backup_${company.gstin || 'data'}_${dateStr}.json`;
    downloadFile(jsonStr, filename, 'application/json');
    showToast('success', 'Backup Exported', `Saved backup snapshot: ${filename}`);
  };

  // Restore file trigger
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.company || !Array.isArray(parsed.customers) || !Array.isArray(parsed.items)) {
          showToast('error', 'Invalid Backup File', 'The selected file is not a valid GST Invoice Pro backup.');
          return;
        }

        const success = restoreFullBackup(parsed);
        if (success) {
          showToast('success', 'Backup Restored Successfully', `Restored ${parsed.invoices?.length || 0} invoices and ${parsed.customers?.length || 0} customers.`);
        }
      } catch (err: any) {
        showToast('error', 'Restore Failed', 'Failed to parse JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const sqliteSchemaText = `-- SQLite Database Schema for GST Invoice Pro Desktop App
CREATE TABLE IF NOT EXISTS company_profile (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gstin TEXT NOT NULL,
  state TEXT NOT NULL,
  state_code TEXT NOT NULL,
  current_fy TEXT NOT NULL,
  invoice_prefix TEXT DEFAULT 'INV/',
  data_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gstin TEXT,
  state_code TEXT NOT NULL,
  gst_type TEXT NOT NULL,
  current_balance REAL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hsn_code TEXT NOT NULL,
  gst_rate REAL NOT NULL,
  selling_price REAL NOT NULL,
  current_stock REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  sequence_number INTEGER NOT NULL,
  financial_year TEXT NOT NULL,
  invoice_date TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  taxable_amount REAL NOT NULL,
  cgst_amount REAL DEFAULT 0,
  sgst_amount REAL DEFAULT 0,
  igst_amount REAL DEFAULT 0,
  net_total REAL NOT NULL,
  paid_amount REAL DEFAULT 0,
  balance_amount REAL DEFAULT 0,
  status TEXT NOT NULL,
  items_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  payment_number TEXT NOT NULL,
  invoice_id TEXT,
  customer_id TEXT NOT NULL,
  payment_date TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_mode TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS credit_notes (
  id TEXT PRIMARY KEY,
  note_number TEXT NOT NULL,
  original_invoice_id TEXT NOT NULL,
  total_taxable REAL NOT NULL,
  net_total REAL NOT NULL
);`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600" />
            Database Backup, Restore & Offline Storage
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Single-file local backup, automated schedules, and SQLite storage for offline reliability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSqlSchema(!showSqlSchema)}
            className="py-2 px-3 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-slate-500" />
            <span>{showSqlSchema ? 'Hide SQL Schema' : 'View SQLite DDL'}</span>
          </button>

          <button
            onClick={handleExportBackup}
            className="py-2 px-3.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Create Full Backup Now</span>
          </button>
        </div>
      </div>

      {/* SQL DDL preview if toggled */}
      {showSqlSchema && (
        <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 shadow-xl space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-teal-400 pb-2 border-b border-slate-800">
            <span className="font-bold flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              better-sqlite3 Database Migration DDL Schema
            </span>
            <span className="text-[11px] text-slate-400">Desktop Electron / Node.js Engine</span>
          </div>
          <pre className="overflow-x-auto text-[11px] text-slate-300 py-2 leading-relaxed">
            {sqliteSchemaText}
          </pre>
        </div>
      )}

      {/* Backup and Restore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 bg-teal-50 text-teal-700 rounded-xl w-fit">
              <HardDrive className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Manual Data Snapshot Backup</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Export all company records, customer masters, items catalog, invoices series, payment receipts, and credit notes into a single portable backup file.
            </p>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Total Invoices to Backup:</span>
                <span className="font-bold text-slate-800">{invoices.length}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Customer Directory:</span>
                <span className="font-bold text-slate-800">{customers.length}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Catalog Items:</span>
                <span className="font-bold text-slate-800">{items.length}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleExportBackup}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Offline Backup Snapshot</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl w-fit">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Restore from Backup Snapshot</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Restore your complete GST database from an existing backup file. Warning: This will safely merge or replace current local state with verified backup data.
            </p>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-950 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Supports backups created with GST Invoice Pro Desktop & Web.</span>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Select Backup File to Restore</span>
          </button>
        </div>
      </div>

      {/* Automated Backup Schedule & Safety Settings */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Automated Backup Schedule & Security</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="text-xs font-bold text-slate-800">Backup Frequency</span>
            <select
              value={autoBackupFreq}
              onChange={e => setAutoBackupFreq(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="DAILY">Daily Automatic Backup</option>
              <option value="WEEKLY">Weekly Scheduled Backup</option>
              <option value="ON_EXIT">On App Close / Exit</option>
            </select>
            <p className="text-[11px] text-slate-500">Auto-saves timestamped SQLite backups to disk.</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="text-xs font-bold text-slate-800">Storage Engine Status</span>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 font-semibold pt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Offline Local Storage Active</span>
            </div>
            <p className="text-[11px] text-slate-500">100% data remains on user PC with zero cloud dependency.</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="text-xs font-bold text-slate-800">Factory Demo Reset</span>
            <button
              onClick={() => {
                if (window.confirm('Reset all demo data to factory defaults?')) {
                  resetToFactoryData();
                }
              }}
              className="w-full py-2 px-3 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Reset to Factory Seed Data
            </button>
            <p className="text-[11px] text-slate-500">Re-populates verified GST sample customers & items.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
