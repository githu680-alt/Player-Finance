import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (passcode: string) => void;
  allowSet?: boolean;
  onForgot?: () => void;
}

export default function OwnerPasscodeModal({ isOpen, onClose, onSubmit, allowSet = false, onForgot }: Props) {
  const [pass, setPass] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
        <h3 className="text-lg font-bold">Owner Verification</h3>
        <p className="text-xs text-slate-500 mt-1">Enter your owner passcode to unlock private finance.</p>

        <div className="mt-4">
          <input
            className="w-full px-3 py-2 border rounded-md"
            type="password"
            placeholder={allowSet ? 'Set new passcode' : 'Enter passcode'}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          {!allowSet && (
            <button type="button" onClick={() => onForgot && onForgot()} className="text-xs text-blue-600 hover:underline">Forgot Passcode?</button>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!pass || pass.trim().length < 4) {
                  alert('Passcode must be at least 4 characters');
                  return;
                }
                onSubmit(pass.trim());
                setPass('');
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
