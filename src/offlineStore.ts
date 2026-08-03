import { Account, PaymentAccount, Player, Transaction } from './types';

export type OfflineCollection = 'players' | 'accounts' | 'paymentAccounts' | 'transactions' | 'private' | 'privateMeta';

export interface OfflineOperation {
  id: string;
  collection: OfflineCollection;
  type: 'set' | 'delete';
  docId: string;
  data?: any;
  createdAt: string;
}

const PREFIX = 'pf_offline';

function key(uid: string, name: string) {
  return `${PREFIX}:${uid}:${name}`;
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (err) {
    console.error('Failed to parse local data', err);
    return fallback;
  }
}

export function loadLocalArray<T>(uid: string, name: string): T[] {
  if (!uid || typeof window === 'undefined') return [];
  const raw = localStorage.getItem(key(uid, name));
  return safeParse<T[]>(raw, []);
}

export function saveLocalArray<T>(uid: string, name: string, data: T[]) {
  if (!uid || typeof window === 'undefined') return;
  localStorage.setItem(key(uid, name), JSON.stringify(data));
}

export function loadLocalObject<T = any>(uid: string, name: string): T | null {
  if (!uid || typeof window === 'undefined') return null;
  const raw = localStorage.getItem(key(uid, name));
  return raw ? safeParse<T>(raw, null as any) : null;
}

export function saveLocalObject(uid: string, name: string, data: any) {
  if (!uid || typeof window === 'undefined') return;
  localStorage.setItem(key(uid, name), JSON.stringify(data));
}

export function removeLocalKey(uid: string, name: string) {
  if (!uid || typeof window === 'undefined') return;
  localStorage.removeItem(key(uid, name));
}

export function loadPendingQueue(uid: string): OfflineOperation[] {
  return loadLocalArray<OfflineOperation>(uid, 'pendingQueue');
}

export function savePendingQueue(uid: string, queue: OfflineOperation[]) {
  saveLocalArray(uid, 'pendingQueue', queue);
}

export function addPendingOperation(uid: string, operation: OfflineOperation) {
  const queue = loadPendingQueue(uid);
  queue.push(operation);
  savePendingQueue(uid, queue);
  return queue;
}

export function removePendingOperation(uid: string, operationId: string) {
  const queue = loadPendingQueue(uid).filter((op) => op.id !== operationId);
  savePendingQueue(uid, queue);
  return queue;
}

export function clearPendingQueue(uid: string) {
  savePendingQueue(uid, []);
}

export function loadOfflineState(uid: string) {
  return {
    players: loadLocalArray<Player>(uid, 'players'),
    accounts: loadLocalArray<Account>(uid, 'accounts'),
    transactions: loadLocalArray<Transaction>(uid, 'transactions'),
    paymentAccounts: loadLocalArray<PaymentAccount>(uid, 'paymentAccounts'),
    ownerPrivateEncrypted: loadLocalObject(uid, 'ownerPrivateEncrypted'),
    ownerPrivateMeta: loadLocalObject(uid, 'ownerPrivateMeta'),
    pendingQueue: loadPendingQueue(uid),
  };
}

export function saveOfflineState(
  uid: string,
  data: Partial<{
    players: Player[];
    accounts: Account[];
    transactions: Transaction[];
    paymentAccounts: PaymentAccount[];
    ownerPrivateEncrypted: any;
    ownerPrivateMeta: any;
  }>
) {
  if (data.players) saveLocalArray<Player>(uid, 'players', data.players);
  if (data.accounts) saveLocalArray<Account>(uid, 'accounts', data.accounts);
  if (data.transactions) saveLocalArray<Transaction>(uid, 'transactions', data.transactions);
  if (data.paymentAccounts) saveLocalArray<PaymentAccount>(uid, 'paymentAccounts', data.paymentAccounts);
  if (data.ownerPrivateEncrypted) saveLocalObject(uid, 'ownerPrivateEncrypted', data.ownerPrivateEncrypted);
  if (data.ownerPrivateMeta) saveLocalObject(uid, 'ownerPrivateMeta', data.ownerPrivateMeta);
}
