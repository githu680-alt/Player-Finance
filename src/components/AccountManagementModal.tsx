import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Wallet, Landmark, PhoneCall, CreditCard, Smartphone,
  DollarSign, Coins, Gem, Award, ShieldCheck, Plus, Edit3, Trash2,
  ChevronLeft, AlertCircle
} from 'lucide-react';
import { Account, Transaction } from '../types';
import { formatMMK, getAccountBalances } from '../data';

// Export the mapping of icon strings to Lucide icon components so other tabs can use it too!
export const ACCOUNT_ICONS: Record<string, React.ComponentType<any>> = {
  Wallet,
  Landmark,
  PhoneCall,
  CreditCard,
  Smartphone,
  DollarSign,
  Coins,
  Gem,
  Award,
  ShieldCheck,
};

export const COLOR_OPTIONS = [
  { label: 'Emerald', class: 'bg-emerald-500', hoverClass: 'hover:bg-emerald-600', text: 'text-emerald-500' },
  { label: 'Blue', class: 'bg-blue-600', hoverClass: 'hover:bg-blue-700', text: 'text-blue-600' },
  { label: 'Indigo', class: 'bg-indigo-600', hoverClass: 'hover:bg-indigo-700', text: 'text-indigo-600' },
  { label: 'Sky', class: 'bg-sky-500', hoverClass: 'hover:bg-sky-600', text: 'text-sky-500' },
  { label: 'Violet', class: 'bg-violet-600', hoverClass: 'hover:bg-violet-700', text: 'text-violet-600' },
  { label: 'Purple', class: 'bg-purple-500', hoverClass: 'hover:bg-purple-600', text: 'text-purple-500' },
  { label: 'Amber', class: 'bg-amber-500', hoverClass: 'hover:bg-amber-600', text: 'text-amber-500' },
  { label: 'Rose', class: 'bg-rose-500', hoverClass: 'hover:bg-rose-600', text: 'text-rose-500' },
  { label: 'Cyan', class: 'bg-cyan-500', hoverClass: 'hover:bg-cyan-600', text: 'text-cyan-500' },
  { label: 'Slate', class: 'bg-slate-500', hoverClass: 'hover:bg-slate-600', text: 'text-slate-500' },
];

interface AccountManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onSaveAccount: (accountData: Omit<Account, 'id'>, editId?: string) => void;
  onDeleteAccount: (accountId: string) => void;
  transactions: Transaction[];
}

export default function AccountManagementModal({
  isOpen,
  onClose,
  accounts,
  onSaveAccount,
  onDeleteAccount,
  transactions,
}: AccountManagementModalProps) {
  // Navigation: 'list' | 'add' | 'edit'
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Wallet');
  const [color, setColor] = useState('bg-emerald-500');
  const [baseBalance, setBaseBalance] = useState('');
  const [error, setError] = useState('');

  // Suggestions
  const suggestions = ['Cash', 'KBZ', 'Wave', 'CB', 'AYA', 'UAB', 'Yoma', 'MAB', 'TrueMoney', 'Other'];

  const accountBalances = getAccountBalances(transactions, accounts);

  const handleOpenAdd = () => {
    setName('');
    setIcon('Wallet');
    setColor('bg-emerald-500');
    setBaseBalance('0');
    setError('');
    setEditingId(null);
    setView('form');
  };

  const handleOpenEdit = (acc: Account) => {
    setName(acc.name);
    setIcon(acc.icon);
    setColor(acc.color);
    setBaseBalance(String(acc.baseBalance));
    setError('');
    setEditingId(acc.id);
    setView('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Account name is required');
      return;
    }

    const numBase = parseFloat(baseBalance) || 0;

    // Check for duplicate name (case insensitive) among other accounts
    const isDuplicate = accounts.some(
      (a) => a.name.toLowerCase().trim() === name.toLowerCase().trim() && a.id !== editingId
    );

    if (isDuplicate) {
      setError(`An account named "${name}" already exists.`);
      return;
    }

    onSaveAccount(
      {
        name: name.trim(),
        icon,
        color,
        baseBalance: numBase,
      },
      editingId || undefined
    );

    setView('list');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this account? Transactions associated with this account will be migrated to the default available account.')) {
      onDeleteAccount(id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-100 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center space-x-2">
                {view === 'form' && (
                  <button
                    onClick={() => setView('list')}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-200/60 transition-colors mr-1"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <h3 className="text-lg font-bold text-slate-800 font-display">
                  {view === 'list'
                    ? 'Account Management'
                    : editingId
                    ? 'Edit Account'
                    : 'Add New Account'}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List View */}
            {view === 'list' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Your Accounts ({accounts.length})
                  </span>
                  <button
                    onClick={handleOpenAdd}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-3xs"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Add Account</span>
                  </button>
                </div>

                {accounts.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs font-semibold">No accounts found</p>
                    <p className="text-[10px] mt-0.5">Create your first account to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {accounts.map((acc) => {
                      const IconComponent = ACCOUNT_ICONS[acc.icon] || Wallet;
                      const balance = accountBalances[acc.id] || 0;

                      return (
                        <div
                          key={acc.id}
                          className="flex items-center justify-between bg-slate-55/40 hover:bg-slate-50 border border-slate-100 p-3.5 rounded-xl transition-all"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2.5 ${acc.color || 'bg-slate-500'} text-white rounded-xl shadow-3xs`}>
                              <IconComponent className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <span className="block text-sm font-bold text-slate-800">{acc.name}</span>
                              <span className="text-[10.5px] font-bold font-sans text-slate-500">
                                {formatMMK(balance)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleOpenEdit(acc)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(acc.id)}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Form View (Add/Edit) */}
            {view === 'form' && (
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100 flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter account name..."
                    maxLength={30}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 text-slate-850 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  />
                  {/* Suggestions list */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {suggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setName(sug)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                          name.toLowerCase() === sug.toLowerCase()
                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Base Balance */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Initial Base Balance (MMK)
                  </label>
                  <input
                    type="number"
                    value={baseBalance}
                    onChange={(e) => setBaseBalance(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="block w-full px-3.5 py-2.5 bg-slate-50 text-slate-850 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">This amount will be added to calculations as the opening balance.</p>
                </div>

                {/* Choose Color */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Account Theme Color
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {COLOR_OPTIONS.map((option) => (
                      <button
                        key={option.class}
                        type="button"
                        onClick={() => setColor(option.class)}
                        className={`h-9 w-full rounded-xl transition-all relative flex items-center justify-center text-white ${
                          option.class
                        } ${option.hoverClass}`}
                      >
                        {color === option.class && (
                          <span className="absolute inset-0 m-auto h-2 w-2 bg-white rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Choose Icon */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Choose Icon
                  </label>
                  <div className="grid grid-cols-5 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {Object.entries(ACCOUNT_ICONS).map(([iconName, IconComp]) => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setIcon(iconName)}
                        className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
                          icon === iconName
                            ? 'bg-blue-600 text-white shadow-sm scale-110'
                            : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200/60'
                        }`}
                      >
                        <IconComp className="h-4.5 w-4.5" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-3xs"
                  >
                    {editingId ? 'Save Changes' : 'Create Account'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
