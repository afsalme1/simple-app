import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Building, 
  FileText,
  CreditCard,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, GSTType } from '../../types';
import { GST_STATES, validateGSTIN, validatePAN, formatINR } from '../../utils/gstEngine';

export const CustomersManager: React.FC = () => {
  const { customers, saveCustomer, deleteCustomer, setSelectedCustomer, setCurrentView, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGstFilter, setSelectedGstFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    companyName: '',
    gstin: '',
    pan: '',
    gstType: 'REGULAR',
    state: 'Karnataka',
    stateCode: '29',
    billingAddress: '',
    shippingAddress: '',
    city: '',
    pincode: '',
    phone: '',
    email: '',
    openingBalance: 0,
    creditLimit: 0,
    notes: '',
  });

  const [gstinError, setGstinError] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      id: `cust-${Date.now()}`,
      name: '',
      companyName: '',
      gstin: '',
      pan: '',
      gstType: 'REGULAR',
      state: 'Karnataka',
      stateCode: '29',
      billingAddress: '',
      shippingAddress: '',
      city: '',
      pincode: '',
      phone: '',
      email: '',
      openingBalance: 0,
      currentBalance: 0,
      creditLimit: 0,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setGstinError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({ ...cust });
    setGstinError(null);
    setIsModalOpen(true);
  };

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
          gstType: 'REGULAR',
        }));
      } else {
        setGstinError(check.message || 'Invalid GSTIN');
      }
    } else if (val.length > 0) {
      setGstinError('GSTIN must be 15 characters');
    } else {
      setGstinError(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      showToast('error', 'Required Field', 'Customer name is required.');
      return;
    }

    if (formData.gstin && formData.gstType === 'REGULAR') {
      const check = validateGSTIN(formData.gstin);
      if (!check.isValid) {
        showToast('error', 'GSTIN Error', check.message || 'Invalid GSTIN');
        return;
      }
    }

    const finalCustomer: Customer = {
      id: formData.id || `cust-${Date.now()}`,
      name: formData.name.trim(),
      companyName: formData.companyName?.trim() || '',
      gstin: formData.gstin?.trim().toUpperCase() || undefined,
      pan: formData.pan?.trim().toUpperCase() || undefined,
      gstType: (formData.gstType as GSTType) || 'REGULAR',
      state: formData.state || 'Karnataka',
      stateCode: formData.stateCode || '29',
      billingAddress: formData.billingAddress?.trim() || '',
      shippingAddress: formData.shippingAddress?.trim() || formData.billingAddress?.trim() || '',
      city: formData.city?.trim() || '',
      pincode: formData.pincode?.trim() || '',
      phone: formData.phone?.trim() || '',
      email: formData.email?.trim() || '',
      openingBalance: Number(formData.openingBalance) || 0,
      currentBalance: editingCustomer ? editingCustomer.currentBalance : (Number(formData.openingBalance) || 0),
      creditLimit: Number(formData.creditLimit) || 0,
      notes: formData.notes?.trim() || '',
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveCustomer(finalCustomer);
    setIsModalOpen(false);
  };

  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      c.name.toLowerCase().includes(q) ||
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      (c.gstin && c.gstin.toLowerCase().includes(q)) ||
      c.phone.includes(q) ||
      c.city.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (selectedGstFilter === 'ALL') return true;
    return c.gstType === selectedGstFilter;
  });

  const totalReceivables = customers.reduce((sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Customers Master Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage GST Registered B2B clients, composition dealers, and consumer walk-in accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs">
            Total Outstanding: <strong>{formatINR(totalReceivables)}</strong>
          </div>

          <button
            id="btn-add-customer"
            onClick={openAddModal}
            className="py-2 px-3.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, GSTIN, mobile, city..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'REGULAR', 'UNREGISTERED', 'CONSUMER', 'COMPOSITION'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedGstFilter(type)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedGstFilter === type
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'ALL' ? 'All Customers' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Customer / Trade Name</th>
                <th className="px-4 py-3">GSTIN & Type</th>
                <th className="px-4 py-3">State & Location</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-right">Balance Due</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => {
                  const isWalkin = cust.id === 'cust-walkin';
                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          {isWalkin && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">WALK-IN</span>}
                          <span>{cust.name}</span>
                        </div>
                        {cust.companyName && cust.companyName !== cust.name && (
                          <div className="text-[11px] text-slate-500">{cust.companyName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {cust.gstin ? (
                          <span className="font-mono font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            {cust.gstin}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unregistered</span>
                        )}
                        <div className="text-[10px] text-teal-700 font-semibold mt-0.5">
                          {cust.gstType}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700 font-medium">{cust.stateCode} - {cust.state}</div>
                        <div className="text-slate-400 text-[11px] truncate max-w-xs">{cust.city || cust.billingAddress}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{cust.phone || 'N/A'}</span>
                        </div>
                        {cust.email && (
                          <div className="text-slate-500 text-[11px] flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{cust.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono font-bold ${cust.currentBalance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {formatINR(cust.currentBalance)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedCustomer(cust);
                              setCurrentView('payments');
                            }}
                            title="View Customer Ledger"
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(cust)}
                            title="Edit Customer"
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {!isWalkin && (
                            <button
                              onClick={() => deleteCustomer(cust.id)}
                              title="Delete Record"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Customer Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                {editingCustomer ? 'Edit Customer Record' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Customer / Contact Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. InfraCloud Systems Pvt Ltd"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Trade / Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName || ''}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. InfraCloud"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    GST Registration Type
                  </label>
                  <select
                    value={formData.gstType}
                    onChange={e => setFormData({ ...formData, gstType: e.target.value as GSTType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="REGULAR">Regular GST Registered</option>
                    <option value="COMPOSITION">Composition Dealer</option>
                    <option value="UNREGISTERED">Unregistered Business</option>
                    <option value="CONSUMER">Consumer (B2C)</option>
                    <option value="OVERSEAS">Overseas / SEZ</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    GSTIN (15 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={formData.gstin || ''}
                    onChange={handleGstinChange}
                    placeholder="29AAACI9876C1Z3"
                    className={`w-full px-3 py-2 border rounded-lg text-xs font-mono uppercase focus:ring-2 focus:outline-none ${
                      gstinError ? 'border-rose-300 bg-rose-50 focus:ring-rose-500' : 'border-slate-300 focus:ring-teal-500'
                    }`}
                  />
                  {gstinError && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {gstinError}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    State (Place of Supply) <span className="text-rose-500">*</span>
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {GST_STATES.map(st => (
                      <option key={st.code} value={st.code}>
                        {st.code} - {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Phone / Mobile <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={formData.billingAddress || ''}
                  onChange={e => setFormData({ ...formData, billingAddress: e.target.value })}
                  placeholder="Plot 12, Electronic City Phase 1, Hosur Road"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Bengaluru"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pincode || ''}
                    onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="560100"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Opening Balance (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.openingBalance || 0}
                    onChange={e => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="accounts@client.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
