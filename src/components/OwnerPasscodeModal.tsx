import React, { useState } from 'react';
import { LockKeyhole, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (passcode: string) => void;
  allowSet?: boolean;
  onForgot?: () => void;
}

export default function OwnerPasscodeModal({ isOpen, onClose, onSubmit, allowSet = false, onForgot }: Props) {
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleContinue = () => {
    setError('');
    if (!pass || pass.trim().length < 4) {
      setError('Passcode must be at least 4 characters');
      return;
    }
    onSubmit(pass.trim());
    setPass('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Owner Verification</h3>
            <p className="mt-1 text-xs text-slate-500">Enter your owner passcode to unlock private finance.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <label htmlFor="owner-passcode" className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Passcode
          </label>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <LockKeyhole className="h-4 w-4 text-slate-400" />
            <input
              id="owner-passcode"
              className="w-full border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              type="password"
              placeholder={allowSet ? 'Set new passcode' : 'Enter passcode'}
              value={pass}
              onChange={(e) => {
                setPass(e.target.value);
                if (error) setError('');
              }}
            />
          </div>
          {error && (
            <p role="alert" className="mt-2 text-xs font-medium text-rose-600">{error}</p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          {!allowSet && (
            <button type="button" onClick={() => onForgot && onForgot()} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Forgot Passcode?
            </button>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
