import React from 'react';
import { Plus } from 'lucide-react';
import { formatMMK } from '../../data';
import { PRIVATE_TRANSACTION_FILTER_OPTIONS } from '../../constants/ownerPrivate';
import { getTransactionVisual } from '../../utils/ownerPrivate';
import type { PrivateTransaction } from '../../types';

interface Props {
  transactions: PrivateTransaction[];
  accountLookup: Record<string, string>;
  txSearch: string;
  txFilterType: 'all' | 'Income' | 'Expense' | 'Transfer';
  onSearchChange: (value: string) => void;
  onFilterChange: (value: 'all' | 'Income' | 'Expense' | 'Transfer') => void;
  onAddTransaction: () => void;
  onEditTransaction: (transaction: PrivateTransaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export default function TransactionsTab({
  transactions,
  accountLookup,
  txSearch,
  txFilterType,
  onSearchChange,
  onFilterChange,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.28)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Transaction history</h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Private personal activity stays visible only here.</p>
        </div>
        <button
          type="button"
          onClick={onAddTransaction}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-3xs transition-colors hover:bg-slate-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Transaction
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <input
            type="text"
            value={txSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search transactions"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          {PRIVATE_TRANSACTION_FILTER_OPTIONS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onFilterChange(type)}
              className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${txFilterType === type ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {type === 'all' ? 'All' : type}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
            No private transactions yet.
          </div>
        ) : (
          transactions.map((t) => {
            const visual = getTransactionVisual(t.type);
            const accountName = accountLookup[t.accountId] || 'Unassigned';
            const dateTime = new Date(t.date);
            return (
              <div key={t.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 shadow-3xs">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${visual.accent}`}>
                    {React.createElement(visual.icon, { className: 'h-4.5 w-4.5' })}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{visual.label}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {accountName}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-500">{dateTime.toLocaleDateString()}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-sans text-[10.5px] text-slate-500">{dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {t.remark ? (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="truncate max-w-[120px] italic text-slate-500">{t.remark}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-bold font-sans ${visual.amountClass}`}>
                    {t.type.toLowerCase() === 'expense' ? `-${formatMMK(t.amount)}` : `+${formatMMK(t.amount)}`}
                  </div>
                  <div className="mt-1 flex items-center justify-end gap-2">
                    <button type="button" onClick={() => onEditTransaction(t)} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">Edit</button>
                    <button type="button" onClick={() => onDeleteTransaction(t.id)} className="text-[11px] font-semibold text-rose-500 hover:text-rose-600">Delete</button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
