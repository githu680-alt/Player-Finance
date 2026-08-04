import React from 'react';
import type { PrivateAccount } from '../../types';
import { normalizeTransactionDate } from '../../utils/ownerPrivate';

interface Props {
  isOpen: boolean;
  editingTransaction: boolean;
  accounts: PrivateAccount[];
  txForm: { date: string; type: string; amount: number; accountId: string; remark: string };
  onChangeAccount: (value: string) => void;
  onChangeType: (value: string) => void;
  onChangeAmount: (value: number) => void;
  onChangeDate: (value: string) => void;
  onChangeRemark: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

export default function TransactionForm({
  isOpen,
  editingTransaction,
  accounts,
  txForm,
  onChangeAccount,
  onChangeType,
  onChangeAmount,
  onChangeDate,
  onChangeRemark,
  onCancel,
  onSave,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-5 w-full max-w-md">
        <h3 className="text-lg font-bold mb-3">{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-600">Account</label>
            <select value={txForm.accountId} onChange={(e) => onChangeAccount(e.target.value)} className="w-full border rounded-xl p-2 mt-1">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600">Type</label>
            <select value={txForm.type} onChange={(e) => onChangeType(e.target.value)} className="w-full border rounded-xl p-2 mt-1">
              <option>Income</option>
              <option>Expense</option>
              <option>Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600">Amount</label>
            <input type="number" value={txForm.amount} onChange={(e) => onChangeAmount(Number(e.target.value))} className="w-full border rounded-xl p-2 mt-1" />
          </div>
          <div>
            <label className="block text-xs text-slate-600">Date</label>
            <input type="datetime-local" value={txForm.date.slice(0, 16)} onChange={(e) => onChangeDate(normalizeTransactionDate(e.target.value, txForm.date))} className="w-full border rounded-xl p-2 mt-1" />
          </div>
          <div>
            <label className="block text-xs text-slate-600">Remark</label>
            <input value={txForm.remark} onChange={(e) => onChangeRemark(e.target.value)} className="w-full border rounded-xl p-2 mt-1" />
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button onClick={onCancel} className="px-3 py-1 rounded-xl border">Cancel</button>
            <button onClick={onSave} className="px-4 py-1 rounded-xl bg-slate-900 text-white">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
