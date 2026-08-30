import React, { useState } from 'react';
import { 
  Monitor, 
  Download, 
  Check, 
  Copy, 
  Terminal, 
  Layers, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles,
  Laptop
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface WindowsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsAppModal: React.FC<WindowsAppModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useApp();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    showToast('success', 'Copied to Clipboard', `${label} copied.`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const cliCommands = `git clone <your-repo> (or Export ZIP)
cd gst-invoice-pro
npm install
npm run build:exe`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Run / Install as Windows Desktop App (.EXE)
              </h3>
              <p className="text-xs text-slate-500">
                Two ways to use GST Invoice Pro as a standalone Windows desktop app.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-5 text-xs">
          {/* Method 1: Instant 1-Click Desktop App (PWA) */}
          <div className="p-4 rounded-xl border-2 border-teal-500/30 bg-teal-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-teal-700 text-white font-bold text-[10px] uppercase">
                  Option 1 (Instant)
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  1-Click Windows App Installation (No Coding Required)
                </span>
              </div>
              <Laptop className="w-4 h-4 text-teal-600" />
            </div>

            <p className="text-slate-600 leading-relaxed">
              You can instantly install this app directly onto your Windows 10/11 Desktop, Start Menu, and Taskbar using Chrome or Microsoft Edge. It runs in its own dedicated, native desktop window with full offline access.
            </p>

            <div className="bg-white p-3 rounded-lg border border-teal-200/80 space-y-2">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                How to install on Windows in 5 seconds:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] ml-1">
                <li>Open this app in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> on your Windows PC.</li>
                <li>Look for the <strong>"Install App" (🖥️ or ⊕)</strong> icon in your browser URL address bar (top right).</li>
                <li>Click <strong>Install</strong>. A desktop shortcut will appear on your Windows desktop and taskbar.</li>
              </ol>
            </div>
          </div>

          {/* Method 2: Standalone .EXE Installer via Electron */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-700 text-white font-bold text-[10px] uppercase">
                  Option 2
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  Build Standalone Windows Installer (<code className="font-mono text-teal-700">Setup.exe</code>)
                </span>
              </div>
              <Download className="w-4 h-4 text-slate-600" />
            </div>

            <p className="text-slate-600 leading-relaxed">
              We have pre-configured <strong>Electron</strong> and <strong>electron-builder</strong> inside this project with <code className="font-mono bg-slate-200 px-1 rounded">electron-main.cjs</code> and <code className="font-mono bg-slate-200 px-1 rounded">build-windows-exe.bat</code>.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 text-[11px]">Commands to generate .EXE on Windows:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(cliCommands, 'CLI Commands')}
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode === 'CLI Commands' ? <Check className="w-3 h-3 text-teal-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode === 'CLI Commands' ? 'Copied' : 'Copy Commands'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed">
                {cliCommands}
              </pre>
            </div>

            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px]">
              <strong>Tip:</strong> In AI Studio, open the top-right Settings menu &rarr; <strong>Export to ZIP</strong>. Extract the ZIP on your Windows PC and double-click <code>build-windows-exe.bat</code> to automatically compile <code>GST Invoice Pro Setup.exe</code>!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
