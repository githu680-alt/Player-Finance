import React from 'react';

interface Props {
  isOpen: boolean;
  editingAccount: boolean;
  accountForm: { name: string; type: string; baseBalance: number };
  onChangeName: (value: string) => void;
  onChangeType: (value: string) => void;
  onChangeBaseBalance: (value: number) => void;
  onCancel: () => void;
  onSave: () => void;
}

export default function AccountForm({
  isOpen,
  editingAccount,
  accountForm,
  onChangeName,
  onChangeType,
  onChangeBaseBalance,
  onCancel,
  onSave,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-5 w-full max-w-md">
        <h3 className="text-lg font-bold mb-3">{editingAccount ? 'Edit Account' : 'Add Account'}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-600">Name</label>
            <input value={accountForm.name} onChange={(e) => onChangeName(e.target.value)} className="w-full border rounded-xl p-2 mt-1" />
          </div>
          <div>
            <label className="block text-xs text-slate-600">Type</label>
            <input value={accountForm.type} onChange={(e) => onChangeType(e.target.value)} className="w-full border rounded-xl p-2 mt-1" />
          </div>
          <div>
            <label className="block text-xs text-slate-600">Starting Balance</label>
            <input type="number" value={accountForm.baseBalance} onChange={(e) => onChangeBaseBalance(Number(e.target.value))} className="w-full border rounded-xl p-2 mt-1" />
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
