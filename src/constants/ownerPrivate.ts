import { Landmark, PhoneCall, Wallet, type LucideIcon } from 'lucide-react';

export const PRIVATE_TABS = [
  { key: 'accounts', label: 'Accounts' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'settings', label: 'Settings' },
] as const;

export type PrivateTabKey = (typeof PRIVATE_TABS)[number]['key'];

export const PRIVATE_TRANSACTION_FILTER_OPTIONS = ['all', 'Income', 'Expense', 'Transfer'] as const;

export type PrivateTransactionFilter = (typeof PRIVATE_TRANSACTION_FILTER_OPTIONS)[number];

export const PRIVATE_ICONS: Record<string, LucideIcon> = {
  cash: Wallet,
  kbz: Landmark,
  wave: PhoneCall,
  bank: Landmark,
  default: Wallet,
};

export function createDefaultAccountForm() {
  return { name: '', type: 'cash', baseBalance: 0 };
}

export function createDefaultTransactionForm(accountId = '') {
  return { date: new Date().toISOString(), type: 'Income', amount: 0, accountId, remark: '' };
}
