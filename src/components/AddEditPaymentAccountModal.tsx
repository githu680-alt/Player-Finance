import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, Tag, AlignLeft } from 'lucide-react';
import { PaymentAccount } from '../types';
import { App as CapacitorApp } from "@capacitor/app";

interface AddEditPaymentAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Omit<PaymentAccount, 'id'>, editId?: string) => void;
editAccount?: PaymentAccount;
playerId: string;
}

export default function AddEditPaymentAccountModal({
  isOpen,
  onClose,
  onSave,
  editAccount,
playerId,
}: AddEditPaymentAccountModalProps) {
  const [type, setType] = useState('');
const [accountName, setAccountName] = useState('');
const [accountNumber, setAccountNumber] = useState('');
const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const listener = CapacitorApp.addListener("backButton", () => {
      onClose();
    });

    return () => {
      listener.then((l) => l.remove());
    };
  }, [isOpen, onClose]);

  useEffect(() => {
  if (editAccount) {
    setType(editAccount.type);
    setAccountName(editAccount.accountName);
    setAccountNumber(editAccount.accountNumber);
    setNote(editAccount.note || '');
  } else {
    setType('');
    setAccountName('');
    setAccountNumber('');
    setNote('');
  }

  setError('');
}, [editAccount, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (!type.trim()) {
    setError("Account type is required");
    return;
  }

  if (!accountNumber.trim()) {
    setError("Account number is required");
    return;
  }

  setIsSubmitting(true);
  onSave(
    {
      playerId,
      type: type.trim(),
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      note: note.trim(),
    },
    editAccount?.id
  );

  window.setTimeout(() => {
    setIsSubmitting(false);
    onClose();
  }, 120);
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
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-800 font-display">
                {editAccount ? 'Edit Payment Account' : 'Add New Payment Account'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div role="alert" aria-live="polite" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              {/* Account Type */}
<div>
  <label htmlFor="account-type" className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
    Account Type *
  </label>

  <input
    id="account-type"
    type="text"
    value={type}
    onChange={(e) => setType(e.target.value)}
    placeholder="Wave / KBZ / AYA"
    disabled={isSubmitting}
    aria-invalid={Boolean(error && !type.trim())}
    className="block w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm disabled:bg-slate-100 disabled:text-slate-400"
  />
</div>

{/* Account Name */}
<div>
  <label htmlFor="account-name" className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
    Account Name
  </label>

  <input
    id="account-name"
    type="text"
    value={accountName}
    onChange={(e) => setAccountName(e.target.value)}
    placeholder="Ko Aung"
    disabled={isSubmitting}
    className="block w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm disabled:bg-slate-100 disabled:text-slate-400"
  />
</div>

{/* Account Number */}
<div>
  <label htmlFor="account-number" className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
    Account Number *
  </label>

  <input
    id="account-number"
    type="text"
    value={accountNumber}
    onChange={(e) => setAccountNumber(e.target.value)}
    placeholder="09123456789"
    disabled={isSubmitting}
    aria-invalid={Boolean(error && !accountNumber.trim())}
    className="block w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm disabled:bg-slate-100 disabled:text-slate-400"
  />
</div>

{/* Note */}
<div>
  <label htmlFor="account-note" className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
    Note
  </label>

  <textarea
    id="account-note"
    value={note}
    onChange={(e) => setNote(e.target.value)}
    rows={3}
    placeholder="Optional"
    disabled={isSubmitting}
    className="block w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm disabled:bg-slate-100 disabled:text-slate-400"
  />
</div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
