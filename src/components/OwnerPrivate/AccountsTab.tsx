import React from 'react';
import { Plus } from 'lucide-react';
import { formatMMK } from '../../data';
import { PRIVATE_ICONS } from '../../constants/ownerPrivate';
import type { PrivateAccount } from '../../types';

interface Props {
  accounts: PrivateAccount[];
  accountBalances: Record<string, number>;
  localAccounts: PrivateAccount[];
  onAddAccount: () => void;
  onEditAccount: (account: PrivateAccount) => void;
  onDeleteAccount: (id: string) => void;
}

export default function AccountsTab({
  accounts,
  accountBalances,
  localAccounts,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.28)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Private accounts</h2>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Personal balances stay separate from business accounts.</p>
        </div>
        <button
          type="button"
          onClick={onAddAccount}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Account
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {accounts.length === 0 ? (
          <div className="col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
            No private accounts yet.
          </div>
        ) : (
          accounts.map((acc) => {
            const Icon = PRIVATE_ICONS[acc.type.toLowerCase()] || PRIVATE_ICONS.default;
            const isDerived = !localAccounts.some((localAcc) => localAcc.id === acc.id);
            return (
              <div key={acc.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 shadow-3xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{acc.name}</div>
                    <div className="mt-1 text-sm font-bold font-sans text-slate-800">{formatMMK(accountBalances[acc.id] || 0)}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  {!isDerived ? (
                    <>
                      <button type="button" onClick={() => onEditAccount(acc)} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">Edit</button>
                      <button type="button" onClick={() => onDeleteAccount(acc.id)} className="text-[11px] font-semibold text-rose-500 hover:text-rose-600">Delete</button>
                    </>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-500">Derived from business transfer</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
