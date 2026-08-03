import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  HelpCircle,
  Sparkles,
  Wallet,
  Landmark,
  PhoneCall,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  X,
  ArrowLeftRight,
  Receipt,
} from 'lucide-react';
import { memo } from 'react';
import { Transaction, Player, Account, PaymentAccount } from '../types';
import { formatMMK, formatTransactionDateTime, normalizeTransaction, getTransactionDisplayCategory, getAccountBalances } from '../data';

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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeDateFilter, setActiveDateFilter] = useState<DateFilterType>('all');
  const [activeAccountFilter, setActiveAccountFilter] = useState<'all' | string>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [swipedTxId, setSwipedTxId] = useState<string | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const normalizedTransactions = useMemo(() => transactions.map((tx) => normalizeTransaction(tx)), [transactions]);
  const balances = useMemo(() => getAccountBalances(transactions, accounts), [transactions, accounts]);

  const handlePrevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const monthLabel = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const monthTransactions = useMemo(() => {
    return normalizedTransactions.filter((tx) => {
      const txDate = new Date(tx.date.substring(0, 10));
      return txDate.getFullYear() === selectedDate.getFullYear() && txDate.getMonth() === selectedDate.getMonth();
    });
  }, [normalizedTransactions, selectedDate]);

  const monthBought = monthTransactions.filter((t) => t.transactionType === 'player' && t.category === 'Integral Bought').reduce((sum, t) => sum + t.amount, 0);
  const monthReturned = monthTransactions.filter((t) => t.transactionType === 'player' && t.category === 'Integral Returned').reduce((sum, t) => sum + t.amount, 0);
  const monthNet = monthBought - monthReturned;

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      onDeleteTransaction(id);
      setSelectedTransactionId(null);
      setSwipedTxId(null);
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

  const matchesDateFilter = (tx: Transaction) => {
    const txDate = new Date(tx.date.substring(0, 10));
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const weekStart = new Date();
    weekStart.setDate(today.getDate() - 6);

    const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    if (activeDateFilter === 'today') return sameDay(txDate, today);
    if (activeDateFilter === 'yesterday') return sameDay(txDate, yesterday);
    if (activeDateFilter === 'week') return txDate >= weekStart && txDate <= today;
    if (activeDateFilter === 'month') return txDate.getFullYear() === today.getFullYear() && txDate.getMonth() === today.getMonth();
    if (activeDateFilter === 'custom') {
      if (customStartDate && txDate < new Date(customStartDate)) return false;
      if (customEndDate && txDate > new Date(customEndDate)) return false;
      return true;
    }
    return true;
  };

  const historyItems = useMemo(() => {
    const filtered = monthTransactions.filter((tx) => {
      if (!getFilterMatches(tx)) return false;
      if (!matchesDateFilter(tx)) return false;
      if (activeAccountFilter !== 'all' && tx.account !== activeAccountFilter) return false;
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const player = players.find((p) => p.id === tx.playerId);
      const paymentNumber = (tx.paymentAccountNumber || '').toLowerCase();
      const playerText = `${player?.playerId || ''} ${player?.nickName || ''} ${player?.agency || ''}`.toLowerCase();
      return [playerText, tx.category.toLowerCase(), tx.account.toLowerCase(), tx.remark.toLowerCase(), tx.billName?.toLowerCase() || '', paymentNumber, (tx.account || '').toLowerCase(), (tx.toAccount || '').toLowerCase()].some((value) => value.includes(query));
    });

    const selectedAccount = selectedAccountId ? accounts.find((acc) => acc.id === selectedAccountId) : null;
    const withAccount = selectedAccount ? filtered.filter((tx) => tx.account === selectedAccount.id) : filtered;

    return [...withAccount].sort((a, b) => b.date.localeCompare(a.date));
  }, [accounts, activeAccountFilter, activeDateFilter, activeFilter, customEndDate, customStartDate, monthTransactions, players, searchQuery, selectedAccountId]);

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

  const selectedAccount = selectedAccountId ? accounts.find((acc) => acc.id === selectedAccountId) : null;
  const selectedDetailTx = selectedTransactionId ? normalizedTransactions.find((tx) => tx.id === selectedTransactionId) || null : null;

  const openAddTransaction = () => {
    const preferredAccountId = selectedAccountId || selectedAccount?.id || undefined;
    onAddTransaction(undefined, preferredAccountId);
    setShowAddForm(false);
  };

  const todayTransactions = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return normalizedTransactions.filter((tx) => tx.date.startsWith(today));
  }, [normalizedTransactions]);

  const handleTouchStart = (clientX: number) => {
    touchStartXRef.current = clientX;
  };

  const handleTouchEnd = (clientX: number, tx: Transaction) => {
    if (touchStartXRef.current === null) return;
    const delta = clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (delta > 80) {
      setSwipedTxId(null);
      onEditTransaction(tx);
    } else if (delta < -80) {
      handleDelete(tx.id);
    } else {
      setSelectedTransactionId(tx.id);
    }
  };

  return (
    <div className="relative pb-28 font-sans">
      <div className="rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-white shadow-[0_20px_45px_-20px_rgba(15,23,42,0.55)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-300">Exchange</p>
            <h2 className="text-xl font-semibold">Money flow</h2>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-2.5">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5">
          <Search className="h-4 w-4 text-slate-300" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by player, agency, account, category, remark, phone" className="w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-400" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-300">Bought</p>
            <p className="mt-1 text-sm font-semibold text-emerald-300">{formatMMK(monthBought)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-300">Returned</p>
            <p className="mt-1 text-sm font-semibold text-rose-300">{formatMMK(monthReturned)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-300">Net</p>
            <p className={`mt-1 text-sm font-semibold ${monthNet >= 0 ? 'text-white' : 'text-rose-200'}`}>{formatMMK(monthNet)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-slate-100 bg-white p-3 shadow-sm">
        <div className="mt-3 flex flex-wrap gap-2">
          {(['all', 'player', 'owner', 'bill', 'transfer'] as FilterType[]).map((filter) => (
            <button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${activeFilter === filter ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {filter === 'all' ? 'All' : filter}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['all', 'today', 'yesterday', 'week', 'month', 'custom'] as DateFilterType[]).map((filter) => (
            <button key={filter} type="button" onClick={() => setActiveDateFilter(filter)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${activeDateFilter === filter ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
              {filter === 'all' ? 'All dates' : filter === 'week' ? 'This week' : filter === 'month' ? 'This month' : filter}
            </button>
          ))}
        </div>
        {activeDateFilter === 'custom' && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input type="date" value={customStartDate} onChange={(event) => setCustomStartDate(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            <input type="date" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setActiveAccountFilter('all')} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${activeAccountFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>All accounts</button>
          {accounts.map((account) => (
            <button key={account.id} type="button" onClick={() => setActiveAccountFilter(account.id)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${activeAccountFilter === account.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{account.name}</button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-slate-100 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">{monthLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handlePrevMonth} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={handleNextMonth} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {accounts.map((account) => {
            const Icon = account.icon === 'Landmark' ? Landmark : account.icon === 'PhoneCall' ? PhoneCall : Wallet;
            const balance = balances[account.id] || 0;
            const accountTransactions = todayTransactions.filter((tx) => tx.account === account.id);
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => {
                  setSelectedAccountId(account.id);
                  setHistoryOpen(false);
                  setSelectedTransactionId(null);
                }}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-slate-200 hover:bg-slate-100"
              >
                <div className="flex items-center gap-2">
                  <div className={`rounded-xl p-2 text-white ${account.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{account.name}</p>
                    <p className="text-[11px] text-slate-500">{accountTransactions.length} today</p>
                  </div>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{formatMMK(balance)}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {groupedHistory.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <HelpCircle className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-600">No transactions found</p>
            <p className="text-xs text-slate-400">Try another filter or search.</p>
          </div>
        ) : (
          groupedHistory.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">{group.label}</div>
              {group.entries.map((tx) => {
                const player = players.find((p) => p.id === tx.playerId);
                const accountLabel = accounts.find((acc) => acc.id === tx.account)?.name || tx.account;
                const counterAccountLabel = tx.transactionType === 'owner' && tx.ownerTransferDirection === 'business_to_owner'
                  ? 'Owner'
                  : tx.transactionType === 'owner' && tx.ownerTransferDirection === 'owner_to_business'
                  ? 'Business'
                  : tx.transactionType === 'bill'
                  ? 'Business'
                  : null;
                const playerName = tx.transactionType === 'player' ? (player?.nickName || player?.playerId || tx.playerName || '') : '';
                const agencyName = tx.transactionType === 'player' ? (player?.agency || '') : '';
                const paymentDisplay = tx.paymentAccountNumber?.trim() ? `${tx.paymentAccountNumber.trim()}` : '';
                const remarkText = tx.remark?.trim() || '';
                const amountStyle = tx.transactionType === 'player' && tx.category === 'Integral Bought' ? 'text-emerald-600' : tx.transactionType === 'player' && tx.category === 'Integral Returned' ? 'text-rose-600' : tx.transactionType === 'transfer' ? 'text-blue-600' : 'text-slate-800';
                const formatted = formatTransactionDateTime(tx.date);
                const isSwipeActive = swipedTxId === tx.id;
                const transferLabel = tx.transactionType === 'transfer' && tx.toAccount ? `${accountLabel} → ${accounts.find((acc) => acc.id === tx.toAccount)?.name || tx.toAccount}` : '';
                const title = tx.transactionType === 'transfer' ? '🔄 Transfer' : getTransactionDisplayCategory(tx);
                const icon = tx.transactionType === 'transfer' ? <ArrowLeftRight className="h-4 w-4" /> : tx.transactionType === 'player' ? (tx.category === 'Integral Bought' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />) : tx.transactionType === 'bill' ? <Receipt className="h-4 w-4" /> : <Building2 className="h-4 w-4" />;
                const detailLines = [
                  playerName ? { label: 'Player', value: playerName } : null,
                  agencyName ? { label: 'Agency', value: agencyName } : null,
                  tx.transactionType === 'transfer' && transferLabel ? { label: 'Transfer', value: transferLabel } : null,
                  tx.transactionType !== 'transfer' && accountLabel ? { label: 'Business Account', value: accountLabel } : null,
                  tx.transactionType !== 'transfer' && counterAccountLabel ? { label: 'Counter Account', value: counterAccountLabel } : null,
                  paymentDisplay ? { label: 'Phone', value: paymentDisplay } : null,
                  remarkText ? { label: 'Remark', value: remarkText } : null,
                  { label: 'Date', value: formatted.date },
                  { label: 'Time', value: formatted.time },
                ].filter(Boolean) as Array<{label:string; value:string}>;
                return (
                  <motion.div
                    key={tx.id}
                    layout
                    whileTap={{ scale: 0.99 }}
                    onTouchStart={(event) => handleTouchStart(event.touches[0].clientX)}
                    onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0].clientX, tx)}
                    className={`rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm transition ${isSwipeActive ? 'translate-x-0' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className={`mt-0.5 rounded-2xl p-2 ${tx.transactionType === 'player' && tx.category === 'Integral Bought' ? 'bg-emerald-50 text-emerald-600' : tx.transactionType === 'player' && tx.category === 'Integral Returned' ? 'bg-rose-50 text-rose-600' : tx.transactionType === 'transfer' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                          {icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
                          <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                            {detailLines.slice(0, 4).map((item) => (
                              <p key={item.label} className="truncate">{item.label}: {item.value}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${amountStyle}`}>{tx.transactionType === 'player' && tx.category === 'Integral Bought' ? '+' : tx.transactionType === 'transfer' ? '' : '-'}{formatMMK(tx.amount)}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{formatted.time}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button type="button" onClick={() => onEditTransaction(tx)} className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:bg-slate-100">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => handleDelete(tx.id)} className="rounded-full border border-slate-200 bg-slate-50 p-2 text-rose-600 transition hover:bg-rose-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
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
        {selectedAccount && !historyOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 24, stiffness: 220 }} className="absolute inset-x-0 bottom-0 rounded-t-[32px] bg-white p-5 shadow-2xl">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Current Balance</p>
                  <h3 className="text-2xl font-semibold text-slate-900">{formatMMK(balances[selectedAccount.id] || 0)}</h3>
                </div>
                <button type="button" onClick={() => setSelectedAccountId(null)} className="rounded-full border border-slate-200 p-2 text-slate-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Today&apos;s transactions</p>
                  <p className="text-xs text-slate-500">{todayTransactions.filter((tx) => tx.account === selectedAccount.id).length} entries</p>
                </div>
                <div className="mt-3 space-y-2">
                  {todayTransactions.filter((tx) => tx.account === selectedAccount.id).slice(0, 3).map((tx) => (
                    <button key={tx.id} type="button" onClick={() => setSelectedTransactionId(tx.id)} className="flex w-full items-center justify-between rounded-2xl bg-white px-3 py-2 text-left shadow-sm">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{getTransactionDisplayCategory(tx)}</p>
                        <p className="text-xs text-slate-500">{tx.remark || 'No remark'}</p>
                      </div>
                      <p className={`text-sm font-semibold ${tx.transactionType === 'player' && tx.category === 'Integral Bought' ? 'text-emerald-600' : tx.transactionType === 'player' && tx.category === 'Integral Returned' ? 'text-rose-600' : 'text-slate-800'}`}>{formatMMK(tx.amount)}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => { setHistoryOpen(true); }} className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                  View Full History
                </button>
                <button type="button" onClick={() => { setSelectedAccountId(selectedAccount.id); openAddTransaction(); }} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                  Add Transaction
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {historyOpen && selectedAccount && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <button type="button" onClick={() => setHistoryOpen(false)} className="rounded-full border border-slate-200 p-2">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">History</p>
                <h3 className="text-sm font-semibold text-slate-800">{selectedAccount.name}</h3>
              </div>
              <div className="w-9" />
            </div>
            <div className="space-y-3 p-4 pb-28">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(['all', 'player', 'owner', 'bill', 'transfer'] as FilterType[]).map((filter) => (
                  <button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${activeFilter === filter ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {filter === 'all' ? 'All' : filter}
                  </button>
                ))}
              </div>
              {groupedHistory.map((group) => (
                <div key={group.label} className="space-y-2">
                  <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">{group.label}</div>
                  {group.entries.map((tx) => {
                    const player = players.find((p) => p.id === tx.playerId);
                    const accountLabel = accounts.find((acc) => acc.id === tx.account)?.name || tx.account;
                    const counterAccountLabel = tx.transactionType === 'owner' && tx.ownerTransferDirection === 'business_to_owner'
                      ? 'Owner'
                      : tx.transactionType === 'owner' && tx.ownerTransferDirection === 'owner_to_business'
                      ? 'Business'
                      : tx.transactionType === 'bill'
                      ? 'Business'
                      : null;
                    const playerName = tx.transactionType === 'player' ? (player?.nickName || player?.playerId || tx.playerName || '') : '';
                    const agencyName = tx.transactionType === 'player' ? (player?.agency || '') : '';
                    const paymentDisplay = tx.paymentAccountNumber?.trim() ? `${tx.paymentAccountNumber.trim()}` : '';
                    const remarkText = tx.remark?.trim() || '';
                    const formatted = formatTransactionDateTime(tx.date);
                    const transferLabel = tx.transactionType === 'transfer' && tx.toAccount ? `${accountLabel} → ${accounts.find((acc) => acc.id === tx.toAccount)?.name || tx.toAccount}` : '';
                    const detailLines = [
                      playerName ? { label: 'Player', value: playerName } : null,
                      agencyName ? { label: 'Agency', value: agencyName } : null,
                      tx.transactionType === 'transfer' && transferLabel ? { label: 'Transfer', value: transferLabel } : null,
                      tx.transactionType !== 'transfer' && accountLabel ? { label: 'Business Account', value: accountLabel } : null,
                      tx.transactionType !== 'transfer' && counterAccountLabel ? { label: 'Counter Account', value: counterAccountLabel } : null,
                      paymentDisplay ? { label: 'Phone', value: paymentDisplay } : null,
                      remarkText ? { label: 'Remark', value: remarkText } : null,
                      { label: 'Date', value: formatted.date },
                      { label: 'Time', value: formatted.time },
                    ].filter(Boolean) as Array<{label:string; value:string}>;
                    return (
                      <button key={tx.id} type="button" onClick={() => setSelectedTransactionId(tx.id)} className="flex w-full items-start justify-between rounded-[24px] border border-slate-100 bg-white px-3 py-3 text-left shadow-sm">
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="text-sm font-semibold text-slate-900">{tx.transactionType === 'transfer' ? 'Transfer' : getTransactionDisplayCategory(tx)}</p>
                          <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                            {detailLines.slice(0, 4).map((item) => (
                              <p key={item.label} className="truncate">{item.label}: {item.value}</p>
                            ))}
                          </div>
                        </div>
                        <p className={`text-sm font-semibold ${tx.transactionType === 'player' && tx.category === 'Integral Bought' ? 'text-emerald-600' : tx.transactionType === 'player' && tx.category === 'Integral Returned' ? 'text-rose-600' : tx.transactionType === 'transfer' ? 'text-blue-600' : 'text-slate-800'}`}>{formatMMK(tx.amount)}</p>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                      <span className="text-slate-500">Business Account</span>
                      <span className="font-semibold">{accounts.find((acc) => acc.id === selectedDetailTx.account)?.name || selectedDetailTx.account || '—'}</span>
                    </div>
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
                      <span className="font-semibold">{paymentAccounts.find((paymentAccount) => paymentAccount.id === selectedDetailTx.paymentAccountId)?.accountName?.trim() || '—'}</span>
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
                  <span className="text-slate-500">Date</span>
                  <span className="font-semibold">{formatTransactionDateTime(selectedDetailTx.date).date}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 py-2">
                  <span className="text-slate-500">Time</span>
                  <span className="font-semibold">{formatTransactionDateTime(selectedDetailTx.date).time}</span>
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
