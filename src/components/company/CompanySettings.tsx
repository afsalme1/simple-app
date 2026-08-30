import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  CreditCard, 
  Hash, 
  Shield, 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Save, 
  QrCode,
  Lock,
  Printer
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CompanyProfile } from '../../types';
import { GST_STATES, validateGSTIN, validatePAN, formatInvoiceNumber, getFinancialYear } from '../../utils/gstEngine';

export const CompanySettings: React.FC = () => {
  const { company, updateCompany, showToast } = useApp();
  const [formData, setFormData] = useState<CompanyProfile>({ ...company });
  const [gstinError, setGstinError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'invoice_series' | 'bank_upi' | 'security' | 'print'>('profile');
  const [newPassword, setNewPassword] = useState('');

  const handleGstinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, gstin: val }));

    if (val.length === 15) {
      const check = validateGSTIN(val);
      if (check.isValid) {
        setGstinError(null);
        const stateObj = GST_STATES.find(s => s.code === check.stateCode);
        setFormData(prev => ({
          ...prev,
          stateCode: check.stateCode || prev.stateCode,
          state: stateObj ? stateObj.name : prev.state,
          pan: check.pan || prev.pan,
        }));
      } else {
        setGstinError(check.message || 'Invalid GSTIN');
      }
    } else if (val.length > 0) {
      setGstinError('GSTIN must be 15 characters long');
    } else {
      setGstinError(null);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) {
        showToast('error', 'File Too Large', 'Please upload a logo image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate GSTIN if entered
    if (formData.gstin) {
      const check = validateGSTIN(formData.gstin);
      if (!check.isValid) {
        setGstinError(check.message || 'Invalid GSTIN');
        showToast('error', 'Validation Error', check.message || 'Invalid GSTIN format');
        return;
      }
    }

    let updatedPayload = { ...formData };
    if (formData.isPasswordProtected && newPassword.trim()) {
      updatedPayload.passwordHash = newPassword.trim();
    } else if (!formData.isPasswordProtected) {
      updatedPayload.passwordHash = '';
    }

    updateCompany(updatedPayload);
  };

  const sampleInvoiceNumber = formatInvoiceNumber(
    formData.invoicePrefix,
    formData.nextInvoiceSequence || 1,
    formData.currentFY || getFinancialYear().fullFY,
    formData.invoiceNumberingFormat,
    formData.invoicePadding
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Company & Tax Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your GST registration, FY-based gapless invoice sequence, bank details, and print styles.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          className="py-2 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Business & GST Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invoice_series')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'invoice_series'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>FY Invoice Series & Sequences</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bank_upi')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'bank_upi'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Bank & UPI QR Code</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('print')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'print'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Print & Thermal Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>App Lock & Security</span>
        </button>
      </div>

      {/* Tab Contents */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            {/* Left: Company Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-teal-600" />
                Legal Business Identity
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Legal Entity Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Apex Tech & Industrial Solutions Pvt. Ltd."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Trade Name / Brand Name
                </label>
                <input
                  type="text"
                  value={formData.tradeName || ''}
                  onChange={e => setFormData({ ...formData, tradeName: e.target.value })}
                  placeholder="e.g. Apex GST Solutions"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    GSTIN (15 Digits) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={formData.gstin}
                    onChange={handleGstinChange}
                    placeholder="29AABCA1234A1Z5"
                    className={`w-full px-3 py-2 border rounded-lg text-sm font-mono uppercase focus:ring-2 focus:outline-none ${
                      gstinError ? 'border-rose-300 bg-rose-50 focus:ring-rose-500' : 'border-slate-300 focus:ring-teal-500'
                    }`}
                  />
                  {gstinError ? (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {gstinError}
                    </p>
                  ) : formData.gstin && (
                    <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Valid GSTIN Structure
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    PAN (10 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.pan}
                    onChange={e => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    placeholder="AABCA1234A"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Registered State <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.stateCode}
                    onChange={e => {
                      const stateCode = e.target.value;
                      const sObj = GST_STATES.find(s => s.code === stateCode);
                      setFormData({
                        ...formData,
                        stateCode,
                        state: sObj ? sObj.name : formData.state,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {GST_STATES.map(st => (
                      <option key={st.code} value={st.code}>
                        {st.code} - {st.name} {st.isUT ? '(UT)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    State Code
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.stateCode}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-600 rounded-lg text-sm font-mono text-center font-bold"
                  />
                </div>
              </div>

              {/* Logo Upload Box */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Company Logo (Printed on A4 Invoices)
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{formData.logoUrl ? 'Change Logo' : 'Upload PNG/JPG'}</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logoUrl: '' })}
                        className="block text-[11px] text-rose-600 hover:underline cursor-pointer"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Contact & Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <MapPin className="w-4 h-4 text-teal-600" />
                Registered Address & Contact
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Address Line (Plot, Building, Street) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. No. 42, 3rd Floor, Tech Park Road, Koramangala"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    City / District <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Bengaluru"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pincode (6 Digits) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.pincode}
                    onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="560095"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Phone / Mobile <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="billing@apextechsolutions.in"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  value={formData.website || ''}
                  onChange={e => setFormData({ ...formData, website: e.target.value })}
                  placeholder="www.apextechsolutions.in"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Authorized Signatory Header Text
                </label>
                <input
                  type="text"
                  value={formData.authorizedSignatoryText}
                  onChange={e => setFormData({ ...formData, authorizedSignatoryText: e.target.value })}
                  placeholder="For Apex Tech & Industrial Solutions Pvt. Ltd."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invoice_series' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Hash className="w-4 h-4 text-teal-600" />
                Gapless Financial Year Invoice Numbering Engine
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Under Indian GST Rule 46(b), tax invoices must have a unique sequential numbering system conforming to the Financial Year with no gaps.
              </p>
            </div>

            {/* Live Preview Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-teal-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-400">
                  Next Generated Invoice Number Preview
                </span>
                <div className="text-2xl font-mono font-bold tracking-wide mt-1 text-white">
                  {sampleInvoiceNumber}
                </div>
              </div>
              <div className="text-xs text-slate-300 md:text-right">
                <div>Financial Year: <strong className="text-teal-300">{formData.currentFY}</strong></div>
                <div>Sequence Counter: <strong className="text-teal-300">#{formData.nextInvoiceSequence}</strong></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Invoice Prefix (e.g. INV, TAX, BILL)
                </label>
                <input
                  type="text"
                  value={formData.invoicePrefix}
                  onChange={e => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Financial Year
                </label>
                <input
                  type="text"
                  value={formData.currentFY}
                  onChange={e => setFormData({ ...formData, currentFY: e.target.value })}
                  placeholder="2024-25"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Next Sequence Number
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.nextInvoiceSequence}
                  onChange={e => setFormData({ ...formData, nextInvoiceSequence: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Invoice Number Format Structure
                </label>
                <select
                  value={formData.invoiceNumberingFormat}
                  onChange={e => setFormData({ ...formData, invoiceNumberingFormat: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="PREFIX/FY/NUM">PREFIX / FY / NUMBER (e.g. INV/24-25/0001)</option>
                  <option value="PREFIX-FY-NUM">PREFIX - FY - NUMBER (e.g. INV-24-25-0001)</option>
                  <option value="FY/NUM">FY / NUMBER (e.g. 24-25/0001)</option>
                  <option value="PREFIX/NUM">PREFIX / NUMBER (e.g. INV/0001)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Digit Padding (Zero padding)
                </label>
                <select
                  value={formData.invoicePadding}
                  onChange={e => setFormData({ ...formData, invoicePadding: parseInt(e.target.value) || 4 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value={3}>3 Digits (e.g. 001)</option>
                  <option value={4}>4 Digits (e.g. 0001) - Recommended</option>
                  <option value={5}>5 Digits (e.g. 00001)</option>
                  <option value={6}>6 Digits (e.g. 000001)</option>
                </select>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Default Terms & Legal Declarations
              </h4>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  rows={3}
                  value={formData.termsAndConditions}
                  onChange={e => setFormData({ ...formData, termsAndConditions: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Statutory GST Declaration
                </label>
                <textarea
                  rows={2}
                  value={formData.declaration}
                  onChange={e => setFormData({ ...formData, declaration: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bank_upi' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-teal-600" />
                Bank Account & Dynamic UPI QR Code
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Printed on your tax invoices & thermal receipts. When UPI ID is provided, customers can scan the QR code to pay the exact invoice amount directly!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Bank Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.bankName}
                  onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g. HDFC Bank / State Bank of India"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Bank Account Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.accountNumber}
                  onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="50200012345678"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  IFSC Code (11 Digits) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  value={formData.ifscCode}
                  onChange={e => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                  placeholder="HDFC0000123"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Branch Name
                </label>
                <input
                  type="text"
                  value={formData.branchName}
                  onChange={e => setFormData({ ...formData, branchName: e.target.value })}
                  placeholder="e.g. Koramangala Branch, Bengaluru"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Account Beneficiary Holder Name
                </label>
                <input
                  type="text"
                  value={formData.accountHolder}
                  onChange={e => setFormData({ ...formData, accountHolder: e.target.value })}
                  placeholder="Apex Tech & Industrial Solutions Pvt. Ltd."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* UPI Section */}
            <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-teal-700" />
                  <h4 className="text-sm font-semibold text-teal-900">UPI ID for Dynamic Payment QR</h4>
                </div>
                <p className="text-xs text-teal-700">
                  Enter your VPA (e.g. <code className="bg-white px-1 py-0.5 rounded border border-teal-300">yourbusiness@hdfcbank</code>). The app generates scannable Bharat QR codes on every invoice.
                </p>
                <input
                  type="text"
                  value={formData.upiId || ''}
                  onChange={e => setFormData({ ...formData, upiId: e.target.value.trim() })}
                  placeholder="e.g. apextech@hdfcbank or 9876543210@paytm"
                  className="w-full max-w-md mt-2 px-3 py-2 border border-teal-300 rounded-lg text-sm font-mono bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'print' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Printer className="w-4 h-4 text-teal-600" />
                Printing & POS Thermal Defaults
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set default format for quick printing (A4 Standard Tax Invoice or Thermal Receipt for counter sales).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Default Print Layout
                </label>
                <select
                  value={formData.defaultPrintFormat}
                  onChange={e => setFormData({ ...formData, defaultPrintFormat: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="A4">A4 Full Sheet (Standard GST Tax Invoice)</option>
                  <option value="THERMAL_3">3" (80mm) Thermal POS Receipt</option>
                  <option value="THERMAL_2">2" (58mm) Thermal POS Receipt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Thermal Paper Width
                </label>
                <select
                  value={formData.thermalPaperSize}
                  onChange={e => setFormData({ ...formData, thermalPaperSize: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="80mm">80mm (Standard POS Desktop)</option>
                  <option value="58mm">58mm (Handheld Mobile Bluetooth)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600" />
                Offline Desktop App Lock
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Protect your offline GST records and customer database from unauthorized access on shared desktop PCs.
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPasswordProtected}
                  onChange={e => setFormData({ ...formData, isPasswordProtected: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-800">Enable Master App Password</span>
                  <p className="text-xs text-slate-500">Requires entering a password whenever app launches or is locked.</p>
                </div>
              </label>

              {formData.isPasswordProtected && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 max-w-md">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Set / Change Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder={formData.passwordHash ? '•••••••• (Leave blank to keep existing)' : 'Enter strong app password'}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
