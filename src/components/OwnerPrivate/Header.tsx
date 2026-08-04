import React from 'react';
import { formatMMK } from '../../data';

interface Props {
  totalPrivateBalance: number;
  accountCount: number;
  onClose: () => void;
}

export default function Header({ totalPrivateBalance, accountCount, onClose }: Props) {
  return (
    <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm shadow-[0_8px_20px_-12px_rgba(15,23,42,0.12)]">
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Owner private</p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Private Finance</h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-3xs transition-colors hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="mt-4 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-500 via-emerald-400 to-lime-400 p-5 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-950/75">Total balance</p>
              <h2 className="mt-1 text-3xl font-black tracking-tight font-sans text-slate-950">{formatMMK(totalPrivateBalance)}</h2>
            </div>
            <div className="rounded-2xl bg-white/80 px-3 py-2 text-center shadow-sm">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Accounts</div>
              <div className="text-lg font-black text-slate-900">{accountCount}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
