import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react';
import type { PrivateAccount, PrivateTransaction } from '../types';

export interface PrivateAccountBalanceSummary {
  accountBalances: Record<string, number>;
  totalPrivateBalance: number;
  accountLookup: Record<string, string>;
}

export function normalizeTransactionDate(value: string, fallback = new Date().toISOString()) {
  if (!value) return fallback;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

export function getPrivateAccountBalanceSummary(accounts: PrivateAccount[], transactions: PrivateTransaction[]) {
  const accountBalances = accounts.reduce<Record<string, number>>((acc, item) => {
    acc[item.id] = item.baseBalance || 0;
    return acc;
  }, {});
  const validAccountIds = new Set(accounts.map((account) => account.id));

  transactions.forEach((tx) => {
    if (!validAccountIds.has(tx.accountId)) return;

    const current = accountBalances[tx.accountId] || 0;
    const type = tx.type.toLowerCase();
    if (type === 'income') accountBalances[tx.accountId] = current + tx.amount;
    else if (type === 'expense') accountBalances[tx.accountId] = current - tx.amount;
    else accountBalances[tx.accountId] = current;
  });

  const totalPrivateBalance = Object.values(accountBalances).reduce((sum, value) => sum + value, 0);
  const accountLookup = accounts.reduce<Record<string, string>>((acc, item) => {
    acc[item.id] = item.name;
    return acc;
  }, {});

  return { accountBalances, totalPrivateBalance, accountLookup };
}

export function getFilteredPrivateTransactions(
  transactions: PrivateTransaction[],
  search: string,
  filterType: 'all' | 'Income' | 'Expense' | 'Transfer',
  accountLookup: Record<string, string>,
) {
  const query = search.toLowerCase();

  return transactions.filter((t) => {
    const accountName = accountLookup[t.accountId] || '';
    const matchesQuery =
      !query ||
      t.type.toLowerCase().includes(query) ||
      accountName.toLowerCase().includes(query) ||
      (t.remark || '').toLowerCase().includes(query);
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesQuery && matchesType;
  });
}

export function getTransactionVisual(type: string) {
  if (type.toLowerCase() === 'income') {
    return {
      icon: ArrowUpRight,
      accent: 'bg-emerald-50 text-emerald-600',
      amountClass: 'text-emerald-600',
      label: 'Income',
    };
  }

  if (type.toLowerCase() === 'expense') {
    return {
      icon: ArrowDownLeft,
      accent: 'bg-rose-50 text-rose-600',
      amountClass: 'text-rose-600',
      label: 'Expense',
    };
  }

  return {
    icon: ArrowLeftRight,
    accent: 'bg-slate-100 text-slate-700',
    amountClass: 'text-slate-700',
    label: 'Transfer',
  };
}
