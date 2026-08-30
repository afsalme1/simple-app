import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  Check, 
  Copy, 
  Terminal, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles,
  QrCode,
  Share2,
  Package,
  Layers,
  Zap,
  WifiOff,
  CheckCheck
} from 'lucide-react';
import QRCode from 'qrcode';
import { useApp } from '../../context/AppContext';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  isInstallable?: boolean;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({ 
  isOpen, 
  onClose,
  deferredPrompt,
  isInstallable = false
}) => {
  const { showToast } = useApp();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'instant' | 'apk' | 'qr'>('instant');
  const [isInstalling, setIsInstalling] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    if (isOpen && currentUrl) {
      QRCode.toDataURL(currentUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#0f766e',
          light: '#ffffff'
        }
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR code generation error:', err));
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    showToast('success', 'Copied to Clipboard', `${label} copied successfully.`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          showToast('success', 'App Installing', 'GST Invoice Pro is being added to your Android Home Screen!');
          onClose();
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      } finally {
        setIsInstalling(false);
      }
    } else {
      showToast('info', 'Install via Chrome/Browser', 'Tap the 3 dots (⋮) in your mobile browser and select "Install app" or "Add to Home screen".');
    }
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'GST Invoice Pro',
          text: 'Install GST Invoice Pro offline billing app on your Android phone:',
          url: currentUrl
        });
      } catch (err) {
        // Ignored if cancelled
      }
    } else {
      copyToClipboard(currentUrl, 'App URL');
    }
  };

  const apkCliCommands = `git clone <your-repo> (or Export ZIP)
cd gst-invoice-pro
npm install
npm install @capacitor/core @capacitor/android
npm run build
npx cap add android
cd android && ./gradlew assembleDebug`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white flex items-center justify-center shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Install on Android Phone
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-extrabold uppercase">
                  PWA / APK
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Install as a full-screen offline native app on any Android mobile device.
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

        {/* Tab Navigation */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('instant')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'instant'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-teal-600" />
            <span>1-Tap Install (WebAPK)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-teal-600" />
            <span>Scan QR on Phone</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'apk'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-teal-600" />
            <span>Build .APK File</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
          {activeTab === 'instant' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl border-2 border-teal-500/40 bg-gradient-to-br from-teal-50/70 to-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-ping"></span>
                    <span className="font-bold text-slate-900 text-sm">
                      Recommended: Direct WebAPK Android Install
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-teal-700 text-white rounded text-[10px] font-bold">
                    OFFLINE READY
                  </span>
                </div>

                <p className="text-slate-600 leading-relaxed">
                  Android OS natively converts this application into a verified, standalone <strong>WebAPK</strong> package. It installs directly onto your phone’s home screen and app drawer, runs without browser address bars, and works 100% offline.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center gap-2 p-2 bg-white/90 rounded-lg border border-teal-200 text-slate-700 font-medium text-[11px]">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Real Home Screen App Icon</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white/90 rounded-lg border border-teal-200 text-slate-700 font-medium text-[11px]">
                    <WifiOff className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Works 100% Offline (SQLite/Local)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white/90 rounded-lg border border-teal-200 text-slate-700 font-medium text-[11px]">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Bluetooth / POS Thermal Printing</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white/90 rounded-lg border border-teal-200 text-slate-700 font-medium text-[11px]">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Zero Play Store Account Needed</span>
                  </div>
                </div>

                {/* Direct 1-Tap Trigger Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    disabled={isInstalling}
                    className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 animate-bounce" />
                    <span>{deferredPrompt ? 'Tap to Install on this Android Device' : 'Install App on Phone (WebAPK)'}</span>
                  </button>
                </div>
              </div>

              {/* Instructions if opening from Desktop or without prompt */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                  Manual 2-Step Install in Google Chrome on Android:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] ml-1">
                  <li>Open this web address in <strong>Chrome</strong> or <strong>Samsung Internet</strong> on your Android phone.</li>
                  <li>Tap the <strong>three dots (⋮)</strong> menu in the top right corner.</li>
                  <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>Tap <strong>Install</strong>. The app icon will appear instantly on your Android apps list!</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="text-center space-y-3 py-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl inline-block shadow-xs">
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="Scan with Android Camera" 
                    className="w-48 h-48 mx-auto rounded-lg shadow-xs" 
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">
                  Point your Android Camera at this QR Code
                </h4>
                <p className="text-slate-500 text-xs max-w-md mx-auto">
                  Scan this code to immediately open GST Invoice Pro on your Android phone, then tap "Install App" to add it to your launcher.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleShareLink}
                  className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Link to Phone</span>
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(currentUrl, 'App Link')}
                  className="py-2 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode === 'App Link' ? <CheckCheck className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'App Link' ? 'Link Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'apk' && (
            <div className="space-y-3">
              {/* Method A: Cloud Instant .APK Generator */}
              <div className="p-4 rounded-xl border-2 border-teal-500/40 bg-gradient-to-br from-teal-50/80 to-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-teal-700 text-white font-bold text-[10px] uppercase">
                      Fastest Option (No Coding)
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      Generate Signed .APK in 30 Seconds via PWABuilder
                    </span>
                  </div>
                  <Sparkles className="w-4 h-4 text-teal-600" />
                </div>

                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Microsoft's official <strong>PWABuilder</strong> compiles any verified PWA URL into a signed, installable Android <strong>.APK / .AAB</strong> package in the cloud with zero setup:
                </p>

                <div className="bg-white p-3 rounded-lg border border-teal-200 space-y-2 text-[11px]">
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
                    <li>Copy your live App URL below.</li>
                    <li>Click <strong>Open PWABuilder Cloud APK Generator</strong>.</li>
                    <li>Paste the URL and click <strong>"Start" &rarr; "Build APK"</strong> &rarr; Download your ready <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-800 font-bold">.apk</code>!</li>
                  </ol>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentUrl, 'Live App URL')}
                    className="flex-1 py-2 px-3 bg-white border border-teal-300 hover:bg-teal-50 text-teal-800 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedCode === 'Live App URL' ? <CheckCheck className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'Live App URL' ? 'URL Copied!' : 'Copy Live App URL'}</span>
                  </button>

                  <a
                    href="https://www.pwabuilder.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs text-center"
                  >
                    <span>Open PWABuilder (.APK)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Method B: Native Android Gradle Project inside the repo */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-bold text-[10px] uppercase">
                      Offline Source Code
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      Pre-built Android Gradle Project (<code className="font-mono text-teal-700">/android</code>)
                    </span>
                  </div>
                  <Package className="w-4 h-4 text-teal-600" />
                </div>

                <p className="text-slate-600 leading-relaxed text-[11px]">
                  The full native Android Gradle project is already generated inside the <code className="font-mono bg-slate-200 px-1 rounded">android/</code> directory of this workspace with <code className="font-mono bg-slate-200 px-1 rounded">gradlew</code>, manifest, assets, and Android Studio compatibility.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-[11px]">Compile directly on your computer:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(apkCliCommands, 'APK CLI Commands')}
                      className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCode === 'APK CLI Commands' ? <Check className="w-3 h-3 text-teal-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode === 'APK CLI Commands' ? 'Copied' : 'Copy Commands'}</span>
                    </button>
                  </div>

                  <pre className="p-3 bg-slate-900 text-teal-300 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed">
{`# 1. Export ZIP from AI Studio Settings menu and extract
# 2. Open terminal in the project folder and run:
cd android
./gradlew assembleDebug

# Output APK: android/app/build/outputs/apk/debug/app-debug.apk`}
                  </pre>
                </div>

                <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 text-[11px]">
                  <strong>Windows 1-Click Builder:</strong> Double-click <code className="font-mono font-bold">build-android-apk.bat</code> in the root folder to automatically run Gradle and output <code className="font-mono font-bold">app-debug.apk</code>.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
            Created by <span className="font-bold text-teal-700">BEEMA STORE</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
