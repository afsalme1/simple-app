import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppUser, UserRole, UserPermissions } from '../../types';
import { getRoleDefaultPermissions } from '../../db/storage';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Key, 
  Sliders, 
  Activity, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Lock, 
  Unlock, 
  Smartphone, 
  Briefcase, 
  Calculator, 
  FileText, 
  DollarSign, 
  Percent, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  AlertCircle,
  Clock,
  ArrowRightLeft
} from 'lucide-react';

export const AdminUsersView: React.FC = () => {
  const { 
    users, 
    currentUser, 
    saveUser, 
    deleteUser, 
    updateUserPermissions, 
    activityLogs, 
    switchUser,
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'activity'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [permissionsModalUser, setPermissionsModalUser] = useState<AppUser | null>(null);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);

  // Form State for User Edit/Create
  const [formData, setFormData] = useState<{
    id: string;
    username: string;
    name: string;
    password: string;
    role: UserRole;
    phone: string;
    email: string;
    isActive: boolean;
    salesCommission: number;
    maxDiscount: number;
  }>({
    id: '',
    username: '',
    name: '',
    password: '',
    role: 'SALESMAN',
    phone: '',
    email: '',
    isActive: true,
    salesCommission: 3.5,
    maxDiscount: 10,
  });

  const openNewUserModal = () => {
    setFormData({
      id: `usr-${Date.now()}`,
      username: '',
      name: '',
      password: '',
      role: 'SALESMAN',
      phone: '',
      email: '',
      isActive: true,
      salesCommission: 3.5,
      maxDiscount: 10,
    });
    setEditingUser(null);
    setIsNewUserModalOpen(true);
  };

  const openEditUserModal = (user: AppUser) => {
    setEditingUser(user);
    setFormData({
      id: user.id,
      username: user.username,
      name: user.name,
      password: user.passwordHash,
      role: user.role,
      phone: user.phone || '',
      email: user.email || '',
      isActive: user.isActive,
      salesCommission: user.permissions?.salesCommissionPercent ?? (user.role === 'SALESMAN' ? 3.5 : 0),
      maxDiscount: user.permissions?.maxDiscountPercent ?? 10,
    });
    setIsNewUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.name.trim() || !formData.password.trim()) {
      showToast('error', 'Validation Error', 'Please provide Username, Full Name, and Password.');
      return;
    }

    // Check duplicate username if new
    if (!editingUser) {
      const exists = users.some(u => u.username.toLowerCase() === formData.username.trim().toLowerCase());
      if (exists) {
        showToast('error', 'User ID Taken', 'A user with this User ID already exists.');
        return;
      }
    }

    const defaultPerms = getRoleDefaultPermissions(formData.role);
    const existingPerms = editingUser?.permissions || defaultPerms;

    const userToSave: AppUser = {
      id: formData.id || `usr-${Date.now()}`,
      username: formData.username.trim().toLowerCase(),
      name: formData.name.trim(),
      passwordHash: formData.password.trim(),
      role: formData.role,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      isActive: formData.isActive,
      permissions: {
        ...existingPerms,
        salesCommissionPercent: Number(formData.salesCommission) || 0,
        maxDiscountPercent: Number(formData.maxDiscount) || 0,
      },
      lastLoginAt: editingUser?.lastLoginAt,
      createdAt: editingUser?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveUser(userToSave);
    setIsNewUserModalOpen(false);
  };

  const handleTogglePermission = (key: keyof UserPermissions) => {
    if (!permissionsModalUser) return;
    const currentVal = permissionsModalUser.permissions[key];
    const updated = { [key]: !currentVal };
    updateUserPermissions(permissionsModalUser.id, updated);
    setPermissionsModalUser(prev => prev ? { ...prev, permissions: { ...prev.permissions, ...updated } } : null);
  };

  const handlePermissionValueChange = (key: keyof UserPermissions, value: any) => {
    if (!permissionsModalUser) return;
    const updated = { [key]: value };
    updateUserPermissions(permissionsModalUser.id, updated);
    setPermissionsModalUser(prev => prev ? { ...prev, permissions: { ...prev.permissions, ...updated } } : null);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Shield className="w-3.5 h-3.5" /> Administrator
          </span>
        );
      case 'SALESMAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Briefcase className="w-3.5 h-3.5" /> Salesman
          </span>
        );
      case 'STAFF':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <FileText className="w-3.5 h-3.5" /> Billing Staff
          </span>
        );
      case 'ACCOUNTANT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Calculator className="w-3.5 h-3.5" /> Senior Accountant
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Custom Role
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Control Center</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              User Management & Access Permissions
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Configure user credentials (ID/Password), role assignments, and granular action permissions.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={openNewUserModal}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Active Users ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'activity'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Audit & Activity Log ({activityLogs.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user, ID, or role..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs text-slate-400">
              Showing <span className="font-semibold text-white">{filteredUsers.length}</span> configured system accounts
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const isCurrent = currentUser?.id === user.id;
              return (
                <div
                  key={user.id}
                  className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition-all relative ${
                    isCurrent ? 'border-blue-500/60 shadow-lg shadow-blue-500/10' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/40 text-[11px] font-semibold text-blue-300">
                      Active Session
                    </div>
                  )}

                  <div>
                    <div className="flex items-start gap-3.5 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-lg text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white truncate">{user.name}</h3>
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                          <span>@{user.username}</span>
                          <span>•</span>
                          <span className="text-slate-500">Pass: {user.passwordHash}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">{getRoleBadge(user.role)}</div>

                    {/* Permissions summary chips */}
                    <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 mb-4 space-y-1.5 text-xs text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Invoices:</span>
                        <span className="font-medium">
                          {user.permissions.canCreateInvoice ? 'Create' : 'No Create'} • {user.permissions.canEditInvoice ? 'Edit' : 'Read-only'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Max Discount:</span>
                        <span className="font-medium text-emerald-400">{user.permissions.maxDiscountPercent}%</span>
                      </div>
                      {user.role === 'SALESMAN' && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Commission:</span>
                          <span className="font-medium text-blue-400">{user.permissions.salesCommissionPercent}%</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Profit Margins:</span>
                        <span className={`font-medium ${user.permissions.canViewProfit ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {user.permissions.canViewProfit ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditUserModal(user)}
                        title="Edit User Profile & Credentials"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setPermissionsModalUser(user)}
                        title="Configure Granular Access Permissions"
                        className="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 transition-colors flex items-center gap-1.5 text-xs font-medium"
                      >
                        <Sliders className="w-4 h-4" />
                        <span>Permissions</span>
                      </button>

                      {!isCurrent && (
                        <button
                          onClick={() => switchUser(user.id)}
                          title="Switch to this user session"
                          className="p-2 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {user.username !== 'admin' && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete user ${user.name}?`)) {
                            deleteUser(user.id);
                          }
                        }}
                        title="Delete User"
                        className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Audit & Activity Log Tab */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              System Activity & Audit Log
            </h2>
            <span className="text-xs text-slate-500">Live offline tracking</span>
          </div>

          <div className="space-y-3">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-start justify-between gap-4 text-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{log.action}</span>
                      <span className="text-xs font-normal text-slate-400">by {log.userName}</span>
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">{log.details}</div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 font-mono whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Create / Edit User */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Users className="w-5 h-5 text-blue-400" />
                <span>{editingUser ? 'Edit User Credentials' : 'Create New User Account'}</span>
              </div>
              <button
                onClick={() => setIsNewUserModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    User ID / Login Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. sales2, staff2"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Full Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Suresh Kumar"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    System Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ADMIN">ADMIN (Full Control)</option>
                    <option value="SALESMAN">SALESMAN (Orders & Sales)</option>
                    <option value="STAFF">STAFF (Billing & POS Counter)</option>
                    <option value="ACCOUNTANT">ACCOUNTANT (Audit & Ledgers)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Phone / Mobile (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98000 00000"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@business.in"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Max Discount Allowed (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Sales Commission (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.salesCommission}
                    onChange={(e) => setFormData({ ...formData, salesCommission: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4 bg-slate-950"
                />
                <label htmlFor="isActiveToggle" className="text-sm font-medium text-slate-300 cursor-pointer">
                  Account Active & Enabled for Sign-In
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-lg shadow-blue-600/20"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Granular Permissions Matrix */}
      {permissionsModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                  Admin Permission Manager
                </div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                  <Sliders className="w-5 h-5 text-blue-400" />
                  Access Rules for {permissionsModalUser.name} (@{permissionsModalUser.username})
                </h2>
              </div>
              <button
                onClick={() => setPermissionsModalUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Category 1: Invoicing & Billing */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Invoicing & Billing Capabilities
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <PermissionToggleItem
                    title="Create Tax Invoices"
                    description="Issue new GST Tax Invoices and Bills of Supply"
                    enabled={Boolean(permissionsModalUser.permissions.canCreateInvoice)}
                    onToggle={() => handleTogglePermission('canCreateInvoice')}
                  />

                  <PermissionToggleItem
                    title="Create Quotations / Estimates"
                    description="Create pre-order quotations and proforma estimates"
                    enabled={Boolean(permissionsModalUser.permissions.canCreateEstimate)}
                    onToggle={() => handleTogglePermission('canCreateEstimate')}
                  />

                  <PermissionToggleItem
                    title="Edit Existing Invoices"
                    description="Modify finalized invoice items and customer billing"
                    enabled={Boolean(permissionsModalUser.permissions.canEditInvoice)}
                    onToggle={() => handleTogglePermission('canEditInvoice')}
                  />

                  <PermissionToggleItem
                    title="Cancel Invoices"
                    description="Cancel invoices with audit reason"
                    enabled={Boolean(permissionsModalUser.permissions.canCancelInvoice)}
                    onToggle={() => handleTogglePermission('canCancelInvoice')}
                  />

                  <PermissionToggleItem
                    title="Delete Invoices"
                    description="Permanently purge invoice records from local database"
                    enabled={Boolean(permissionsModalUser.permissions.canDeleteInvoice)}
                    onToggle={() => handleTogglePermission('canDeleteInvoice')}
                  />

                  <PermissionToggleItem
                    title="Custom Line Item Discounts"
                    description="Allow manual discount percentages per line item"
                    enabled={Boolean(permissionsModalUser.permissions.allowDiscountEditing)}
                    onToggle={() => handleTogglePermission('allowDiscountEditing')}
                  />
                </div>
              </div>

              {/* Category 2: Financial & Masters */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Financials, Pricing & Masters
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <PermissionToggleItem
                    title="View Cost & Profit Margins"
                    description="Show purchase cost price, gross profit & profit margin %"
                    enabled={Boolean(permissionsModalUser.permissions.canViewProfit)}
                    onToggle={() => handleTogglePermission('canViewProfit')}
                  />

                  <PermissionToggleItem
                    title="GST Audit & Financial Reports"
                    description="Access GSTR-1, P&L, customer ledgers, and tax analytics"
                    enabled={Boolean(permissionsModalUser.permissions.canViewReports)}
                    onToggle={() => handleTogglePermission('canViewReports')}
                  />

                  <PermissionToggleItem
                    title="Record Customer Payments"
                    description="Collect and record Cash, UPI, and Bank settlements"
                    enabled={Boolean(permissionsModalUser.permissions.canRecordPayment)}
                    onToggle={() => handleTogglePermission('canRecordPayment')}
                  />

                  <PermissionToggleItem
                    title="Issue GST Credit Notes"
                    description="Generate credit notes for returns and price differences"
                    enabled={Boolean(permissionsModalUser.permissions.canCreateCreditNote)}
                    onToggle={() => handleTogglePermission('canCreateCreditNote')}
                  />

                  <PermissionToggleItem
                    title="Manage Product Catalog"
                    description="Add, edit, or delete items, HSN codes, and pricing"
                    enabled={Boolean(permissionsModalUser.permissions.canManageItems)}
                    onToggle={() => handleTogglePermission('canManageItems')}
                  />

                  <PermissionToggleItem
                    title="Manage Customer Accounts"
                    description="Create and edit customer master profiles and GSTINs"
                    enabled={Boolean(permissionsModalUser.permissions.canManageCustomers)}
                    onToggle={() => handleTogglePermission('canManageCustomers')}
                  />
                </div>
              </div>

              {/* Category 3: USB Sync & Administration */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  USB Sync & Administration
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <PermissionToggleItem
                    title="USB Sync (PC & Mobile)"
                    description="Export and merge sync packages across USB and phones"
                    enabled={Boolean(permissionsModalUser.permissions.canSyncUSB)}
                    onToggle={() => handleTogglePermission('canSyncUSB')}
                  />

                  <PermissionToggleItem
                    title="Full Database Backup/Restore"
                    description="Download or restore complete JSON database snapshots"
                    enabled={Boolean(permissionsModalUser.permissions.canBackupRestore)}
                    onToggle={() => handleTogglePermission('canBackupRestore')}
                  />

                  <PermissionToggleItem
                    title="Company Profile & Settings"
                    description="Edit GSTIN, legal address, bank info, and invoice format"
                    enabled={Boolean(permissionsModalUser.permissions.canManageCompanySettings)}
                    onToggle={() => handleTogglePermission('canManageCompanySettings')}
                  />

                  <PermissionToggleItem
                    title="User Management"
                    description="Create, modify, and delete other user accounts"
                    enabled={Boolean(permissionsModalUser.permissions.canManageUsers)}
                    onToggle={() => handleTogglePermission('canManageUsers')}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setPermissionsModalUser(null)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PermissionToggleItem: React.FC<{
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}> = ({ title, description, enabled, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`p-3 rounded-xl border text-left flex items-start justify-between gap-3 transition-all ${
        enabled
          ? 'bg-blue-600/10 border-blue-500/40 text-white'
          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className={`text-xs font-bold ${enabled ? 'text-blue-300' : 'text-slate-300'}`}>
          {title}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{description}</div>
      </div>
      <div
        className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
          enabled ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
        }`}
      >
        {enabled ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
      </div>
    </button>
  );
};
