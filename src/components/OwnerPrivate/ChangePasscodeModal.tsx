import React from 'react';

interface Props {
  isOpen: boolean;
  currentPass: string;
  newPass: string;
  newPass2: string;
  onChangeCurrentPass: (value: string) => void;
  onChangeNewPass: (value: string) => void;
  onChangeNewPass2: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export default function ChangePasscodeModal({
  isOpen,
  currentPass,
  newPass,
  newPass2,
  onChangeCurrentPass,
  onChangeNewPass,
  onChangeNewPass2,
  onCancel,
  onSubmit,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
        <h3 className="text-lg font-bold mb-3">Change Owner Passcode</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-600">Current Passcode</label>
            <input type="password" value={currentPass} onChange={(e) => onChangeCurrentPass(e.target.value)} className="w-full border rounded-xl p-2 mt-1" />
          </div>
          <div>
            <label className="block text-xs text-slate-600">New Passcode</label>
            <input type="password" value={newPass} onChange={(e) => onChangeNewPass(e.target.value)} className="w-full border rounded-xl p-2 mt-1" />
          </div>
          <div>
            <label className="block text-xs text-slate-600">Confirm New Passcode</label>
            <input type="password" value={newPass2} onChange={(e) => onChangeNewPass2(e.target.value)} className="w-full border rounded-xl p-2 mt-1" />
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button onClick={onCancel} className="px-3 py-1 rounded-xl border">Cancel</button>
            <button onClick={onSubmit} className="px-4 py-1 rounded-xl bg-slate-900 text-white">Change Passcode</button>
          </div>
        </div>
      </div>
    </div>
  );
}
