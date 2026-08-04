import React from 'react';

interface Props {
  onLockNow: () => void;
  onChangePasscode: () => void;
}

export default function SettingsTab({ onLockNow, onChangePasscode }: Props) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.28)]">
      <h3 className="text-sm font-bold text-slate-800">Settings</h3>
      <div className="mt-3 space-y-3">
        <button onClick={onLockNow} className="w-full text-left rounded-lg border px-3 py-3">🔒 Lock Now</button>
        <button onClick={onChangePasscode} className="w-full text-left rounded-lg border px-3 py-3">🔑 Change Passcode</button>
        <div className="text-sm text-slate-500">❓ Forgot Passcode? Use the recovery option on the unlock screen.</div>
      </div>
    </div>
  );
}
