import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Settings, ChevronRight, Wallet, Landmark, PhoneCall, TrendingUp, TrendingDown, MoreVertical, Briefcase, SlidersHorizontal, Search, Plus, X, Edit3, Trash2, ArrowUpRight, ArrowDownLeft, Building2, Receipt, ArrowLeftRight } from 'lucide-react';
import { Player, Transaction, Account, PaymentAccount } from '../types';
import { formatMMK, getAccountBalances, getAgencySummaries, normalizeTransaction, formatTransactionDateTime, getTransactionDisplayCategory } from '../data';
import { ACCOUNT_ICONS } from './AccountManagementModal';

interface HomeTabProps {
  players: Player[];
  transactions: Transaction[];
  accounts: Account[];
  paymentAccounts: PaymentAccount[];
  onNavigateToTab: (tab: string) => void;
  onOpenAccountManagement: () => void;
  onAddTransaction: (accountId?: string, preferredPaymentAccountName?: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (txId: string) => void;
}

export default function HomeTab({
  players,
  transactions,
  accounts,
  paymentAccounts,
  onNavigateToTab,
  onOpenAccountManagement,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: HomeTabProps) {
  const [hideBalances, setHideBalances] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedPaymentAccountId, setSelectedPaymentAccountId] = useState<string | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'player' | 'owner' | 'bill' | 'transfer'>('all');

  // Compute stats
  const accountBalances = getAccountBalances(transactions, accounts);
  const totalBalance = Object.values(accountBalances).reduce((sum, b) => sum + b, 0);

  // Current month stats
  const today = new Date();
  const currentMonthStr = today.toLocaleString('default', { month: 'long', year: 'numeric' }); // "July 2026"

  // Filter transactions for current month
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-indexed
  const monthlyTxs = transactions
    .map((tx) => normalizeTransaction(tx))
    .filter((t) => {
      const tDate = new Date(t.date.substring(0, 10));
      return tDate.getFullYear() === currentYear && (tDate.getMonth() + 1) === currentMonth;
    });

  const monthlyBought = monthlyTxs
    .filter((t) => t.transactionType === 'player' && t.category === 'Integral Bought')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyReturned = monthlyTxs
    .filter((t) => t.transactionType === 'player' && t.category === 'Integral Returned')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyNet = monthlyBought - monthlyReturned;

  const agencySummaries = getAgencySummaries(players, transactions);
  const normalizedTransactions = useMemo(() => transactions.map((tx) => normalizeTransaction(tx)), [transactions]);
  const selectedAccount = selectedAccountId ? accounts.find((acc) => acc.id === selectedAccountId) || null : null;
  const selectedPaymentAccount = selectedPaymentAccountId ? paymentAccounts.find((acc) => acc.id === selectedPaymentAccountId) || null : null;

  const selectedAccountTransactions = useMemo(() => {
    if (!selectedAccount) return [];
    return normalizedTransactions
      .filter((tx) => {
        if (tx.transactionType === 'transfer') {
          return tx.account === selectedAccount.id || tx.toAccount === selectedAccount.id;
        }
        return tx.account === selectedAccount.id;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [normalizedTransactions, selectedAccount]);

  const selectedPaymentAccountTransactions = useMemo(() => {
    if (!selectedPaymentAccount) return [];
    return normalizedTransactions
      .filter((tx) => tx.paymentAccountId === selectedPaymentAccount.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [normalizedTransactions, selectedPaymentAccount]);

  const filteredAccountTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return selectedAccountTransactions.filter((tx) => {
      if (historyFilter !== 'all' && tx.transactionType !== historyFilter) {
        return false;
      }

      if (!query) return true;

      const player = players.find((p) => p.id === tx.playerId);
      const paymentLabel = paymentAccounts.find((pa) => pa.id === tx.paymentAccountId)?.accountName?.trim() || tx.paymentAccountType?.trim() || tx.paymentAccountNumber?.trim() || '';
      const searchText = [
        player?.playerId || '',
        player?.nickName || '',
        player?.agency || '',
        tx.category || '',
        tx.remark || '',
        paymentLabel,
        tx.paymentAccountNumber || '',
        tx.billName || '',
        tx.account || '',
        tx.toAccount || '',
      ].join(' ').toLowerCase();
      return searchText.includes(query);
    });
  }, [historyFilter, paymentAccounts, players, searchQuery, selectedAccountTransactions]);

  const filteredPaymentAccountTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return selectedPaymentAccountTransactions.filter((tx) => {
      if (historyFilter !== 'all' && tx.transactionType !== historyFilter) {
        return false;
      }

      if (!query) return true;

      const player = players.find((p) => p.id === tx.playerId);
      const paymentLabel = paymentAccounts.find((pa) => pa.id === tx.paymentAccountId)?.accountName?.trim() || tx.paymentAccountType?.trim() || tx.paymentAccountNumber?.trim() || '';
      const searchText = [
        player?.playerId || '',
        player?.nickName || '',
        player?.agency || '',
        tx.category || '',
        tx.remark || '',
        paymentLabel,
        tx.paymentAccountNumber || '',
        tx.billName || '',
        tx.account || '',
        tx.toAccount || '',
      ].join(' ').toLowerCase();
      return searchText.includes(query);
    });
  }, [historyFilter, paymentAccounts, players, searchQuery, selectedPaymentAccountTransactions]);

  const groupedAccountTransactions = useMemo(() => {
    const groups = new Map<string, Transaction[]>();

    filteredAccountTransactions.forEach((tx) => {
      const datePart = tx.date.substring(0, 10);
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      let label = formatTransactionDateTime(tx.date).date.toUpperCase();
      if (datePart === todayKey) {
        label = 'TODAY';
      } else if (datePart === yesterdayKey) {
        label = 'YESTERDAY';
      }

      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)?.push(tx);
    });

    return Array.from(groups.entries()).map(([label, transactions]) => ({ label, transactions }));
  }, [filteredAccountTransactions]);

  const groupedPaymentAccountTransactions = useMemo(() => {
    const groups = new Map<string, Transaction[]>();

    filteredPaymentAccountTransactions.forEach((tx) => {
      const datePart = tx.date.substring(0, 10);
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      let label = formatTransactionDateTime(tx.date).date.toUpperCase();
      if (datePart === todayKey) {
        label = 'TODAY';
      } else if (datePart === yesterdayKey) {
        label = 'YESTERDAY';
      }

      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)?.push(tx);
    });

    return Array.from(groups.entries()).map(([label, transactions]) => ({ label, transactions }));
  }, [filteredPaymentAccountTransactions]);

  const activeHistoryTransactions = selectedPaymentAccount ? selectedPaymentAccountTransactions : selectedAccountTransactions;
  const filteredHistoryTransactions = selectedPaymentAccount ? filteredPaymentAccountTransactions : filteredAccountTransactions;
  const groupedHistoryTransactions = selectedPaymentAccount ? groupedPaymentAccountTransactions : groupedAccountTransactions;
  const selectedDetailTx = selectedTransactionId ? activeHistoryTransactions.find((tx) => tx.id === selectedTransactionId) || null : null;

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      onDeleteTransaction(id);
      setSelectedTransactionId(null);
    }
  };

  const openAccountDetail = (accountId: string) => {
    setSelectedAccountId(accountId);
    setSelectedPaymentAccountId(null);
    setSelectedTransactionId(null);
    setSearchQuery('');
  };

  const openPaymentAccountDetail = (paymentAccountId: string) => {
    setSelectedPaymentAccountId(paymentAccountId);
    setSelectedAccountId(null);
    setSelectedTransactionId(null);
    setSearchQuery('');
    setHistoryFilter('all');
  };

  const openAddForSelectedContext = () => {
    if (selectedPaymentAccount) {
      onAddTransaction(undefined, selectedPaymentAccount.accountName?.trim() || selectedPaymentAccount.type?.trim() || 'Payment account');
    } else if (selectedAccount) {
      onAddTransaction(selectedAccount.id, selectedAccount.name);
    }
  };

  const getTransactionTypeLabel = (tx: Transaction) => {
    if (tx.transactionType === 'player') {
      if (tx.category === 'Integral Bought') return 'Bought';
      if (tx.category === 'Integral Returned') return 'Return';
      return 'Player';
    }
    if (tx.transactionType === 'transfer') return 'Transfer';
    if (tx.transactionType === 'owner') {
      return tx.ownerTransferDirection === 'business_to_owner' ? 'Business → Owner' : 'Owner → Business';
    }
    return 'Bill';
  };

  const getTransactionBadgeClass = (tx: Transaction) => {
    if (tx.transactionType === 'player') {
      if (tx.category === 'Integral Bought') return 'bg-emerald-50 text-emerald-700';
      if (tx.category === 'Integral Returned') return 'bg-rose-50 text-rose-700';
      return 'bg-slate-100 text-slate-700';
    }
    if (tx.transactionType === 'transfer') return 'bg-slate-100 text-slate-700';
    if (tx.transactionType === 'owner') return 'bg-blue-50 text-blue-700';
    return 'bg-amber-50 text-amber-700';
  };

  const getPaymentAccountLabel = (tx: Transaction) => {
    const paymentAccount = paymentAccounts.find((item) => item.id === tx.paymentAccountId);
    return paymentAccount?.accountName?.trim() || paymentAccount?.type?.trim() || tx.paymentAccountType?.trim() || 'Payment';
  };

  const getPaymentBadgeClass = (paymentLabel: string) => {
    const normalized = paymentLabel.toLowerCase();
    if (normalized.includes('wave')) return 'bg-sky-500 text-white';
    if (normalized.includes('kpay') || normalized.includes('kbz')) return 'bg-indigo-600 text-white';
    if (normalized.includes('cb') || normalized.includes('cbpay')) return 'bg-violet-600 text-white';
    if (normalized.includes('aya')) return 'bg-blue-600 text-white';
    if (normalized.includes('cash')) return 'bg-emerald-500 text-white';
    return 'bg-slate-900 text-white';
  };

  const getAmountColorClass = (tx: Transaction) => {
    if (tx.transactionType === 'player' && tx.category === 'Integral Bought') return 'text-emerald-600';
    if (tx.transactionType === 'player' && tx.category === 'Integral Returned') return 'text-rose-600';
    if (tx.transactionType === 'transfer') return 'text-blue-600';
    return 'text-slate-900';
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display">Home</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setHideBalances(!hideBalances)}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
          >
            {hideBalances ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
          <button className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="relative overflow-hidden rounded-[24px] border border-slate-900/10 bg-[#7df43d] p-6 text-slate-900 shadow-sm">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl" />
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-12 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl" />

        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Total balance</p>
            <h1 className="text-3xl font-black tracking-tight font-sans mt-1 text-slate-950">
              {hideBalances ? '****** MMK' : formatMMK(totalBalance)}
            </h1>
            <p className="text-xs text-slate-800 font-sans mt-1.5 font-semibold">
              {hideBalances ? '****** MMK' : formatMMK(monthlyNet)} {currentMonthStr}
            </p>
          </div>
          <button className="rounded-xl bg-slate-950/5 p-2 text-slate-800 transition-all hover:bg-slate-950/10 hover:text-slate-950">
            <SlidersHorizontal className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Fancy Indicator line */}
        <div className="w-full h-[3px] bg-slate-950/10 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-slate-950/80 rounded-full w-2/3" />
        </div>
      </div>

      {/* Accounts Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-slate-800 font-display">
            Accounts
          </span>
          <button
            onClick={onOpenAccountManagement}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            Manage
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {accounts.map((acc) => {
            const IconComp = ACCOUNT_ICONS[acc.icon] || Wallet;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => openAccountDetail(acc.id)}
                className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex items-center space-x-3.5 hover:border-slate-200 hover:bg-slate-100/50 transition-all text-left"
              >
                <div className={`p-2 shrink-0 ${acc.color || 'bg-slate-500'} text-white rounded-xl shadow-3xs`}>
                  <IconComp className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                    {acc.name}
                  </span>
                  <span className="text-xs font-bold font-sans text-slate-800 block truncate">
                    {hideBalances ? '***' : formatMMK(accountBalances[acc.id] || 0).split(' ')[0]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment Accounts removed from Home per UI spec (they belong to players, not business) */}

      {/* Cash Flow Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 font-display">Cash flow</h3>
            <p className="text-[11px] text-slate-400 font-medium font-sans uppercase mt-0.5">{currentMonthStr}</p>
          </div>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer">
            <MoreVertical className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Income */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Income (Bought)</span>
            </div>
            <span className="text-xs font-bold text-emerald-600 font-sans">
              {hideBalances ? '****** MMK' : formatMMK(monthlyBought)}
            </span>
          </div>

          {/* Expenses */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                <TrendingDown className="h-4.5 w-4.5" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Expenses (Returned)</span>
            </div>
            <span className="text-xs font-bold text-red-500 font-sans">
              {hideBalances ? '****** MMK' : formatMMK(monthlyReturned)}
            </span>
          </div>

          <div className="border-t border-slate-150 pt-3.5 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Total:</span>
            <span className={`text-sm font-black font-sans ${monthlyNet >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {hideBalances ? '****** MMK' : formatMMK(monthlyNet)}
            </span>
          </div>
        </div>
      </div>

      {/* Top Agencies Distribution Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 font-display">Agencies</h3>
            <p className="text-[11px] text-slate-400 font-medium font-sans uppercase mt-0.5">Top agency shares</p>
          </div>
          <button
            onClick={() => onNavigateToTab('Agency')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg transition-all cursor-pointer"
          >
            See All
          </button>
        </div>

        {agencySummaries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs text-slate-400">
            No agency data available.
          </div>
        ) : (
          <div className="space-y-4">
            {agencySummaries.slice(0, 3).map((agency, index) => {
              const maxBought = Math.max(...agencySummaries.map((a) => a.integralBought), 1);
              const percentage = Math.round((agency.integralBought / maxBought) * 100);

              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <Briefcase className="h-4.5 w-4.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">{agency.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 font-sans">
                      {hideBalances ? '****** MMK' : formatMMK(agency.integralBought)}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{agency.playerCount} active players</span>
                    <span className="font-sans">{percentage}% relative weight</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {(selectedAccount || selectedPaymentAccount) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 24, stiffness: 220 }} className="absolute inset-x-0 bottom-0 rounded-t-[32px] bg-white p-4 shadow-2xl">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{selectedPaymentAccount ? 'Payment account history' : 'Account history'}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{selectedPaymentAccount ? (selectedPaymentAccount.accountName?.trim() || selectedPaymentAccount.type?.trim() || 'Payment account') : selectedAccount?.name}</h3>
                </div>
                <button type="button" onClick={() => { setSelectedAccountId(null); setSelectedPaymentAccountId(null); }} className="rounded-full border border-slate-200 p-2 text-slate-500">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">{selectedPaymentAccount ? 'Payment Account' : 'Account Name'}</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{selectedPaymentAccount ? (selectedPaymentAccount.accountName?.trim() || selectedPaymentAccount.type?.trim() || 'Payment account') : selectedAccount?.name}</p>
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">{selectedPaymentAccount ? 'Phone Number' : 'Current Balance'}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{selectedPaymentAccount ? (selectedPaymentAccount.accountNumber?.trim() || '—') : (hideBalances ? '****** MMK' : formatMMK(accountBalances[selectedAccount?.id || ''] || 0))}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <Search className="h-4 w-4 text-slate-400" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={selectedPaymentAccount ? 'Search this payment account history' : 'Search this account history'} className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(['all', 'player', 'owner', 'bill', 'transfer'] as const).map((filter) => (
                  <button key={filter} type="button" onClick={() => setHistoryFilter(filter)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${historyFilter === filter ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {filter === 'all' ? 'All' : filter}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-3 overflow-y-auto pb-24">
                {filteredHistoryTransactions.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    {selectedPaymentAccount ? 'No transactions found for this payment account.' : 'No transactions found for this account.'}
                  </div>
                ) : (
                  groupedHistoryTransactions.map((group) => (
                    <div key={group.label} className="space-y-2">
                      <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{group.label}</p>
                      {group.transactions.map((tx) => {
                        const player = players.find((p) => p.id === tx.playerId);
                        const formattedDateTime = formatTransactionDateTime(tx.date);
                        const playerLabel = player?.nickName || player?.playerId || tx.playerName || 'Player';
                        const paymentLabel = getPaymentAccountLabel(tx);
                        const transactionLabel = getTransactionTypeLabel(tx);
                        const staffSign = typeof window !== 'undefined' ? (() => {
                          try {
                            const storedMap = JSON.parse(window.localStorage.getItem('player-finance-staff-sign-map') || '{}');
                            return storedMap[tx.id] || '';
                          } catch {
                            return '';
                          }
                        })() : '';

                        return (
                          <button
                            key={tx.id}
                            type="button"
                            onClick={() => setSelectedTransactionId(tx.id)}
                            className="w-full rounded-[16px] border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
                          >
                            <div className="flex items-start justify-between gap-3">
                              {/* LEFT: compact stacked info */}
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-col gap-1">
                                  {/* Row 1: Transaction type badge */}
                                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${getTransactionBadgeClass(tx)}`}>
                                    {transactionLabel}
                                  </span>

                                  {/* Row 2: Business account badge */}
                                  <span className={`inline-flex mt-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${getPaymentBadgeClass(paymentLabel)}`}>
                                    {paymentLabel}
                                  </span>

                                  {/* Row 3: Player name + staff sign */}
                                  <div className="mt-2 flex items-center gap-2">
                                    <p className="truncate text-sm font-semibold text-slate-900">{playerLabel}</p>
                                    {staffSign ? (
                                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{staffSign}</span>
                                    ) : null}
                                  </div>

                                  {/* Row 4: Payment account number (optional) */}
                                  {tx.paymentAccountNumber?.trim() ? (
                                    <p className="mt-1 truncate text-[11px] text-slate-500">{tx.paymentAccountNumber.trim()}</p>
                                  ) : null}
                                </div>
                              </div>

                              {/* RIGHT: Amount and time */}
                              <div className="flex shrink-0 flex-col items-end justify-center">
                                <p className={`text-lg font-black leading-none ${getAmountColorClass(tx)}`}>
                                  {tx.transactionType === 'player' && tx.category === 'Integral Bought' ? '+' : tx.transactionType === 'transfer' ? '' : '-'}{formatMMK(tx.amount)}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1 whitespace-nowrap">{formattedDateTime.time}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              <div className="fixed bottom-24 right-5 z-40">
                <button type="button" onClick={openAddForSelectedContext} className="rounded-full bg-slate-950 p-4 text-white shadow-xl transition hover:scale-105">
                  <Plus className="h-6 w-6" />
                </button>
              </div>
            </motion.div>
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
                      <span className="text-slate-500">Player</span>
                      <span className="font-semibold">{players.find((player) => player.id === selectedDetailTx.playerId)?.nickName || selectedDetailTx.playerName || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 py-2">
                      <span className="text-slate-500">Agency</span>
                      <span className="font-semibold">{players.find((player) => player.id === selectedDetailTx.playerId)?.agency || '—'}</span>
                    </div>
                    {(() => {
                      const paymentLabel = paymentAccounts.find((paymentAccount) => paymentAccount.id === selectedDetailTx.paymentAccountId)?.accountName?.trim() || selectedDetailTx.paymentAccountType?.trim() || '';
                      return (
                        <>
                          {paymentLabel ? (
                            <div className="flex items-center justify-between border-t border-slate-200 py-2">
                              <span className="text-slate-500">Payment Account</span>
                              <span className="font-semibold">{paymentLabel}</span>
                            </div>
                          ) : null}
                          {selectedDetailTx.paymentAccountNumber?.trim() ? (
                            <div className="flex items-center justify-between border-t border-slate-200 py-2">
                              <span className="text-slate-500">Phone Number</span>
                              <span className="font-semibold">{selectedDetailTx.paymentAccountNumber.trim()}</span>
                            </div>
                          ) : null}
                        </>
                      );
                    })()}
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
