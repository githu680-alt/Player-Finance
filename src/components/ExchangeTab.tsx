import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  HelpCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  X,
  ArrowLeftRight,
  Receipt,
} from 'lucide-react';
import { memo } from 'react';
import { Transaction, Player, Account, PaymentAccount } from '../types';
import { formatMMK, formatTransactionDateTime, normalizeTransaction, getTransactionDisplayCategory } from '../data';

interface ExchangeTabProps {
  transactions: Transaction[];
  players: Player[];
  accounts: Account[];
  paymentAccounts: PaymentAccount[];
  onAddTransaction: (preset?: 'deposit' | 'withdraw' | 'exchange' | 'transfer', accountId?: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (txId: string) => void;
}

type FilterType = 'all' | 'player' | 'owner' | 'bill' | 'transfer';
type DateFilterType = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';
type QuickAction = 'deposit' | 'withdraw' | 'exchange' | 'transfer';

function ExchangeTab({
  transactions,
  players,
  accounts,
  paymentAccounts,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: ExchangeTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  const normalizedTransactions = useMemo(() => transactions.map((tx) => normalizeTransaction(tx)), [transactions]);

  const filteredTransactions = useMemo(() => {
    return normalizedTransactions.filter((tx) => {
      if (activeFilter !== 'all' && tx.transactionType !== activeFilter) {
        return false;
      }

      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const player = players.find((p) => p.id === tx.playerId);
      const paymentLabel = paymentAccounts.find((paymentAccount) => paymentAccount.id === tx.paymentAccountId)?.accountName?.trim() || tx.paymentAccountType?.trim() || tx.paymentAccountNumber?.trim() || '';
      const playerText = `${player?.playerId || ''} ${player?.nickName || ''} ${player?.agency || ''}`.toLowerCase();
      return [playerText, tx.category.toLowerCase(), tx.remark.toLowerCase(), tx.billName?.toLowerCase() || '', paymentLabel.toLowerCase(), (tx.account || '').toLowerCase(), (tx.toAccount || '').toLowerCase()].some((value) => value.includes(query));
    });
  }, [activeFilter, normalizedTransactions, paymentAccounts, players, searchQuery]);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      onDeleteTransaction(id);
      setSelectedTransactionId(null);
    }
  };

  const getRelativeDateLabel = (dateValue: string) => {
    const target = new Date(dateValue.substring(0, 10));
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    if (sameDay(target, today)) return 'Today';
    if (sameDay(target, yesterday)) return 'Yesterday';
    return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getFilterMatches = (tx: Transaction) => {
    if (activeFilter === 'player') return tx.transactionType === 'player';
    if (activeFilter === 'owner') return tx.transactionType === 'owner';
    if (activeFilter === 'bill') return tx.transactionType === 'bill';
    if (activeFilter === 'transfer') return tx.transactionType === 'transfer';
    return true;
  };

  const historyItems = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredTransactions]);

  const groupedHistory = useMemo(() => {
    const groups: Array<{ label: string; entries: Transaction[] }> = [];
    historyItems.forEach((tx) => {
      const label = getRelativeDateLabel(tx.date);
      const last = groups[groups.length - 1];
      if (last && last.label === label) {
        last.entries.push(tx);
      } else {
        groups.push({ label, entries: [tx] });
      }
    });
    return groups;
  }, [historyItems]);

  const selectedDetailTx = selectedTransactionId ? normalizedTransactions.find((tx) => tx.id === selectedTransactionId) || null : null;

  const openAddTransaction = () => {
    onAddTransaction();
  };

  return (
    <div className="relative pb-28 font-sans">
      <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Exchange</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900">Transactions</h2>
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search transactions" className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['all', 'player', 'owner', 'bill', 'transfer'] as FilterType[]).map((filter) => (
            <button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${activeFilter === filter ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {filter === 'all' ? 'All' : filter}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {groupedHistory.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <HelpCircle className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-600">No transactions found</p>
            <p className="mt-1 text-xs text-slate-400">Try another filter or search.</p>
          </div>
        ) : (
          groupedHistory.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">{group.label}</div>
              {group.entries.map((tx) => {
                const player = players.find((p) => p.id === tx.playerId);
                const amountStyle = tx.transactionType === 'player' && tx.category === 'Integral Bought' ? 'text-emerald-600' : tx.transactionType === 'player' && tx.category === 'Integral Returned' ? 'text-rose-600' : tx.transactionType === 'transfer' ? 'text-blue-600' : 'text-slate-800';
                const formatted = formatTransactionDateTime(tx.date);
                const icon = tx.transactionType === 'transfer' ? <ArrowLeftRight className="h-4 w-4" /> : tx.transactionType === 'player' ? (tx.category === 'Integral Bought' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />) : tx.transactionType === 'bill' ? <Receipt className="h-4 w-4" /> : <Building2 className="h-4 w-4" />;
                const paymentLabel = paymentAccounts.find((paymentAccount) => paymentAccount.id === tx.paymentAccountId)?.accountName?.trim() || tx.paymentAccountType?.trim() || 'Payment';
                const playerName = tx.transactionType === 'player' ? (player?.nickName || player?.playerId || tx.playerName || 'Player') : 'Transfer';
                const transactionLabel = tx.transactionType === 'player' ? (tx.category === 'Integral Bought' ? 'Bought' : tx.category === 'Integral Returned' ? 'Return' : 'Player') : tx.transactionType === 'transfer' ? 'Transfer' : tx.transactionType === 'owner' ? 'Owner' : 'Bill';
                const staffSign = typeof window !== 'undefined' ? (() => {
                  try {
                    const storedMap = JSON.parse(window.localStorage.getItem('player-finance-staff-sign-map') || '{}');
                    return storedMap[tx.id] || '';
                  } catch {
                    return '';
                  }
                })() : '';

                return (
                  <motion.button
                    key={tx.id}
                    type="button"
                    layout
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedTransactionId(tx.id)}
                    className="flex w-full items-center justify-between rounded-[18px] border border-slate-200 bg-white px-3 py-3 text-left shadow-sm"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <div className={`rounded-2xl p-2 ${tx.transactionType === 'player' && tx.category === 'Integral Bought' ? 'bg-emerald-50 text-emerald-600' : tx.transactionType === 'player' && tx.category === 'Integral Returned' ? 'bg-rose-50 text-rose-600' : tx.transactionType === 'transfer' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                        {icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{paymentLabel}</p>
                        <p className="mt-0.5 truncate text-[12px] text-slate-600">{playerName}</p>
                        {staffSign ? <p className="mt-0.5 text-[11px] font-semibold text-slate-500">Sign • {staffSign}</p> : null}
                        <p className="mt-0.5 text-[11px] uppercase tracking-[0.22em] text-slate-400">{transactionLabel}</p>
                      </div>
                    </div>
                    <div className="ml-3 text-right">
                      <p className={`text-sm font-semibold ${amountStyle}`}>{tx.transactionType === 'player' && tx.category === 'Integral Bought' ? '+' : tx.transactionType === 'transfer' ? '' : '-'}{formatMMK(tx.amount)}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{formatted.time}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-24 right-5 z-40">
        <button type="button" onClick={() => openAddTransaction()} className="rounded-full bg-slate-950 p-4 text-white shadow-xl transition hover:scale-105">
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <AnimatePresence>
        {selectedDetailTx && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 24, stiffness: 220 }} className="absolute inset-x-0 bottom-0 rounded-t-[32px] bg-white p-5 shadow-2xl">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Transaction Details</p>
                  <h3 className="text-xl font-semibold text-slate-900">{getTransactionDisplayCategory(selectedDetailTx)}</h3>
                </div>
                <button type="button" onClick={() => setSelectedTransactionId(null)} className="rounded-full border border-slate-200 p-2 text-slate-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 rounded-[24px] border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Transaction Type</span>
                  <span className="font-semibold capitalize">{selectedDetailTx.transactionType || 'player'}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 py-2">
                  <span className="text-slate-500">Amount</span>
                  <span className={`font-semibold ${selectedDetailTx.transactionType === 'player' && selectedDetailTx.category === 'Integral Bought' ? 'text-emerald-600' : selectedDetailTx.transactionType === 'player' && selectedDetailTx.category === 'Integral Returned' ? 'text-rose-600' : selectedDetailTx.transactionType === 'transfer' ? 'text-blue-600' : 'text-slate-800'}`}>{formatMMK(selectedDetailTx.amount)}</span>
                </div>
                {selectedDetailTx.transactionType === 'transfer' ? (
                  <>
                    <div className="flex items-center justify-between border-t border-slate-200 py-2">
                      <span className="text-slate-500">From Account</span>
                      <span className="font-semibold">{accounts.find((acc) => acc.id === selectedDetailTx.account)?.name || selectedDetailTx.account || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 py-2">
                      <span className="text-slate-500">To Account</span>
                      <span className="font-semibold">{accounts.find((acc) => acc.id === selectedDetailTx.toAccount)?.name || selectedDetailTx.toAccount || '—'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-t border-slate-200 py-2">
                      <span className="text-slate-500">Category</span>
                      <span className="font-semibold">{selectedDetailTx.category || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 py-2">
                      <span className="text-slate-500">Player</span>
                      <span className="font-semibold">{players.find((player) => player.id === selectedDetailTx.playerId)?.nickName || selectedDetailTx.playerName || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 py-2">
                      <span className="text-slate-500">Agency</span>
                      <span className="font-semibold">{players.find((player) => player.id === selectedDetailTx.playerId)?.agency || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 py-2">
                      <span className="text-slate-500">Payment Account</span>
                      <span className="font-semibold">{paymentAccounts.find((paymentAccount) => paymentAccount.id === selectedDetailTx.paymentAccountId)?.accountName?.trim() || selectedDetailTx.paymentAccountType?.trim() || selectedDetailTx.account || '—'}</span>
                    </div>
                    {selectedDetailTx.paymentAccountNumber?.trim() ? (
                      <div className="flex items-center justify-between border-t border-slate-200 py-2">
                        <span className="text-slate-500">Phone Number</span>
                        <span className="font-semibold">{selectedDetailTx.paymentAccountNumber.trim()}</span>
                      </div>
                    ) : null}
                  </>
                )}
                {selectedDetailTx.remark?.trim() ? (
                  <div className="flex items-center justify-between border-t border-slate-200 py-2">
                    <span className="text-slate-500">Remark</span>
                    <span className="font-semibold">{selectedDetailTx.remark.trim()}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between border-t border-slate-200 py-2">
                  <span className="text-slate-500">Staff Sign</span>
                  <span className="font-semibold">{(() => {
                    if (typeof window === 'undefined') return '—';
                    try {
                      const storedMap = JSON.parse(window.localStorage.getItem('player-finance-staff-sign-map') || '{}');
                      return storedMap[selectedDetailTx.id] || '—';
                    } catch {
                      return '—';
                    }
                  })()}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 py-2">
                  <span className="text-slate-500">Date</span>
                  <span className="font-semibold">{formatTransactionDateTime(selectedDetailTx.date).date}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 py-2">
                  <span className="text-slate-500">Time</span>
                  <span className="font-semibold">{formatTransactionDateTime(selectedDetailTx.date).time}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 py-2">
                  <span className="text-slate-500">Reference No</span>
                  <span className="font-semibold">{selectedDetailTx.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => { setSelectedTransactionId(null); onEditTransaction(selectedDetailTx); }} className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                  Edit Transaction
                </button>
                <button type="button" onClick={() => handleDelete(selectedDetailTx.id)} className="flex-1 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white">
                  Delete Transaction
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(ExchangeTab);
