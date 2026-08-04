import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Wallet, Calendar, FileText, Clock, Receipt, CheckCircle2, ArrowLeftRight } from 'lucide-react';
import { Player, Transaction, TransactionCategory, AccountType, Account, PaymentAccount, TransactionType, OwnerCategory } from '../types';

interface AddEditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionData: Omit<Transaction, 'id'>, editId?: string) => Promise<any> | void;
  editTransaction?: Transaction;
  players: Player[];
  defaultPlayerId?: string;
  defaultAccountId?: string;
  defaultPaymentAccountId?: string;
  accounts: Account[];
  paymentAccounts: PaymentAccount[];
  ownerPrivateAccounts?: Array<{ id: string; name: string; type?: string }>;
  initialQuickAction?: 'deposit' | 'withdraw' | 'exchange' | 'transfer';
}

const PLAYER_CATEGORIES: TransactionCategory[] = ['Integral Bought', 'Integral Returned'];
const TYPE_OPTIONS: Array<{ value: TransactionType; label: string }> = [
  { value: 'player', label: 'Player' },
  { value: 'owner', label: 'Owner' },
  { value: 'bill', label: 'Bill' },
  { value: 'transfer', label: 'Transfer' },
];

export default function AddEditTransactionModal({
  isOpen,
  onClose,
  onSave,
  editTransaction,
  players,
  defaultPlayerId,
  defaultAccountId,
  defaultPaymentAccountId,
  accounts,
  paymentAccounts,
  ownerPrivateAccounts = [],
  initialQuickAction,
}: AddEditTransactionModalProps) {
  const [transactionType, setTransactionType] = useState<TransactionType>('player');
  const [playerId, setPlayerId] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('Integral Bought');
  const [ownerCategory, setOwnerCategory] = useState<OwnerCategory>('transfer');
  const [ownerTransferDirection, setOwnerTransferDirection] = useState<'owner_to_business' | 'business_to_owner'>('owner_to_business');
  const [ownerAccountId, setOwnerAccountId] = useState('');
  const [billName, setBillName] = useState('');
  const [transferToAccount, setTransferToAccount] = useState<AccountType>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPlayerPickerOpen, setIsPlayerPickerOpen] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState<AccountType>('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentAccountNumber, setPaymentAccountNumber] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('00:00');
  const [remark, setRemark] = useState('');
  const [staffSign, setStaffSign] = useState('');
  const [staffSignInput, setStaffSignInput] = useState('');
  const [staffSignOptions, setStaffSignOptions] = useState<string[]>([]);
  const [showStaffSignInput, setShowStaffSignInput] = useState(false);
  const [error, setError] = useState('');

  const filteredPlayers = players.filter((p) => {
    const q = playerSearch.toLowerCase();
    return (
      p.playerId.toLowerCase().includes(q) ||
      p.nickName.toLowerCase().includes(q) ||
      p.agency.toLowerCase().includes(q)
    );
  });

  const persistStaffSignState = (nextSigns: string[], nextLastUsed: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('player-finance-staff-signs', JSON.stringify(nextSigns));
    window.localStorage.setItem('player-finance-last-staff-sign', nextLastUsed);
  };

  const persistStaffSignForTransaction = (transactionId: string, sign: string) => {
    if (typeof window === 'undefined' || !transactionId || !sign) return;
    try {
      const existing = JSON.parse(window.localStorage.getItem('player-finance-staff-sign-map') || '{}');
      existing[transactionId] = sign;
      window.localStorage.setItem('player-finance-staff-sign-map', JSON.stringify(existing));
    } catch {
      window.localStorage.setItem('player-finance-staff-sign-map', JSON.stringify({ [transactionId]: sign }));
    }
  };

  const saveStaffSign = (value: string) => {
    const normalized = value.trim().toUpperCase();
    if (!normalized) return;

    const nextSigns = Array.from(new Set([normalized, ...staffSignOptions.filter((item) => item !== normalized)]));
    setStaffSignOptions(nextSigns);
    setStaffSign(normalized);
    setStaffSignInput('');
    setShowStaffSignInput(false);
    persistStaffSignState(nextSigns, normalized);
  };

  const ownerAccountOptions = Array.isArray(ownerPrivateAccounts) ? ownerPrivateAccounts : [];

  useEffect(() => {
    if (!isOpen) {
      setOwnerAccountId('');
    }
  }, [isOpen]);

  const filteredPaymentAccounts = paymentAccounts
    .filter((pa) => {
      if (playerId) {
        return pa.playerId === playerId;
      }
      return true;
    })
    .sort((a, b) => {
      const left = (a.accountName?.trim() || a.type?.trim() || '').toLowerCase();
      const right = (b.accountName?.trim() || b.type?.trim() || '').toLowerCase();
      return left.localeCompare(right);
    });

  const saveTransaction = async (transaction: Omit<Transaction, 'id'>, editId?: string) => {
    setIsSubmitting(true);
    setError('');
    try {
      const savedId = await onSave(transaction, editId);
      const resolvedId = editTransaction?.id || savedId || editId || `tx_${Date.now()}`;
      if (staffSign.trim()) {
        persistStaffSignForTransaction(resolvedId, staffSign.trim().toUpperCase());
      }
      setShowSuccess(true);
      window.setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 650);
    } catch (err: any) {
      console.error('Save transaction failed', err);
      setError(err?.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const defaultAccId = defaultAccountId || accounts.find((a) => a.id === 'Cash' || a.name.toLowerCase() === 'cash')?.id || accounts[0]?.id || '';

    if (editTransaction) {
      const txType = editTransaction.transactionType || 'player';
      const normalizedOwnerCategory = editTransaction.ownerCategory === 'transfer' ? 'transfer' : 'transfer';
      setTransactionType(txType);
      setPlayerId(editTransaction.playerId || '');
      setCategory(editTransaction.category || 'Integral Bought');
      setOwnerCategory(normalizedOwnerCategory as OwnerCategory);
      setOwnerTransferDirection(editTransaction.ownerTransferDirection || 'owner_to_business');
      setOwnerAccountId(editTransaction.ownerAccountId || '');
      setBillName(editTransaction.billName || '');
      setAmount(editTransaction.amount.toString());
      setAccount(editTransaction.account || defaultAccId);
      setPaymentAccountId(editTransaction.paymentAccountId || '');
      setPaymentAccountNumber(editTransaction.paymentAccountNumber || '');
      setTransferToAccount(editTransaction.toAccount || '');

      const txDate = editTransaction.date;
      const datePart = txDate.substring(0, 10);
      const timePart = txDate.length > 10 ? txDate.substring(11, 16) : '00:00';
      setDate(datePart);
      setTime(timePart);
      setRemark(editTransaction.remark || '');

      try {
        const storedMap = JSON.parse(window.localStorage.getItem('player-finance-staff-sign-map') || '{}');
        const storedSign = storedMap[editTransaction.id];
        if (storedSign) {
          setStaffSign(storedSign);
        } else {
          setStaffSign('');
        }
      } catch {
        setStaffSign('');
      }
    } else {
      if (initialQuickAction === 'deposit') {
        setTransactionType('player');
        setCategory('Integral Bought');
        setOwnerCategory('transfer');
        setOwnerTransferDirection('owner_to_business');
      } else if (initialQuickAction === 'withdraw') {
        setTransactionType('player');
        setCategory('Integral Returned');
        setOwnerCategory('transfer');
        setOwnerTransferDirection('owner_to_business');
      } else if (initialQuickAction === 'transfer') {
        setTransactionType('transfer');
        setCategory('Transfer');
      } else if (initialQuickAction === 'exchange') {
        setTransactionType('owner');
        setCategory('Owner Transfer');
        setOwnerCategory('transfer');
        setOwnerTransferDirection('owner_to_business');
      } else {
        setTransactionType('player');
        setCategory('Integral Bought');
        setOwnerCategory('transfer');
        setOwnerTransferDirection('owner_to_business');
      }

      setPlayerId(defaultPlayerId || players[0]?.id || '');
      setBillName('');
      setAmount('');
      setAccount(defaultAccId);
      if (defaultAccountId && !editTransaction) {
        const accountName = accounts.find((acc) => acc.id === defaultAccountId)?.name || '';
        if (accountName) {
          setAccount(defaultAccountId);
        }
      }
      setPaymentAccountId('');
      setPaymentAccountNumber('');
      setOwnerAccountId('');
      setTransferToAccount('');
      if (defaultAccountId && !editTransaction) {
        const selectedAccount = accounts.find((acc) => acc.id === defaultAccountId);
        if (selectedAccount) {
          setAccount(selectedAccount.id);
        }
      }

      const matchingPaymentAccount = paymentAccounts.find((pa) => pa.id === defaultPaymentAccountId);
      if (matchingPaymentAccount) {
        setPaymentAccountId(matchingPaymentAccount.id);
        setPaymentAccountNumber(matchingPaymentAccount.accountNumber?.trim() || '');
      } else {
        setPaymentAccountId('');
        setPaymentAccountNumber('');
      }

      const localNow = new Date();
      const year = localNow.getFullYear();
      const month = String(localNow.getMonth() + 1).padStart(2, '0');
      const day = String(localNow.getDate()).padStart(2, '0');
      const hours = String(localNow.getHours()).padStart(2, '0');
      const minutes = String(localNow.getMinutes()).padStart(2, '0');

      setDate(`${year}-${month}-${day}`);
      setTime(`${hours}:${minutes}`);
      setRemark('');
      const storedSigns = JSON.parse(window.localStorage.getItem('player-finance-staff-signs') || '[]');
      const lastUsedStaffSign = window.localStorage.getItem('player-finance-last-staff-sign') || '';
      setStaffSignOptions(storedSigns);
      setStaffSign(lastUsedStaffSign);
      setShowStaffSignInput(false);
      setStaffSignInput('');
    }
    setError('');
  }, [editTransaction, isOpen, players, defaultPlayerId, defaultAccountId, defaultPaymentAccountId, accounts, paymentAccounts, initialQuickAction]);

  useEffect(() => {
    if (!paymentAccountId) {
      if (paymentAccountNumber) {
        setPaymentAccountNumber('');
      }
      return;
    }

    const selectedAccount = paymentAccounts.find((pa) => pa.id === paymentAccountId);
    if (!selectedAccount) {
      setPaymentAccountId('');
      setPaymentAccountNumber('');
      return;
    }

    setPaymentAccountNumber(selectedAccount.accountNumber?.trim() || '');
  }, [paymentAccountId, paymentAccounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be a valid positive number');
      return;
    }

    if (!date) {
      setError('Date is required');
      return;
    }
    if (!time) {
      setError('Time is required');
      return;
    }

    const selectedPaymentAccount = paymentAccountId ? paymentAccounts.find((pa) => pa.id === paymentAccountId) : undefined;
    const paymentAccountTypeValue = selectedPaymentAccount?.type?.trim() || selectedPaymentAccount?.accountName?.trim() || '';
    const paymentAccountNumberValue = paymentAccountNumber.trim() || undefined;

    if (transactionType === 'transfer') {
      if (!account) {
        setError('Select the source account');
        return;
      }
      if (!transferToAccount) {
        setError('Select the destination account');
        return;
      }
      if (account === transferToAccount) {
        setError('Choose two different accounts for transfer');
        return;
      }
      saveTransaction(
        {
          transactionType: 'transfer',
          playerId: '',
          playerName: '',
          category: 'Transfer',
          amount: numAmount,
          account,
          toAccount: transferToAccount,
          paymentAccountId: selectedPaymentAccount?.id || undefined,
          paymentAccountType: paymentAccountTypeValue || undefined,
          paymentAccountNumber: paymentAccountNumberValue,
          date: `${date}T${time}`,
          remark: remark.trim(),
        },
        editTransaction?.id
      );
      return;
    }

    if (transactionType === 'player') {
      if (!playerId) {
        setError('Please select a player');
        return;
      }
      const selectedPlayer = players.find((p) => p.id === playerId);
      if (!selectedPlayer) {
        setError('Selected player is invalid');
        return;
      }
      saveTransaction(
        {
          transactionType: 'player',
          playerId,
          playerName: selectedPlayer.nickName,
          category,
          amount: numAmount,
          account,
          paymentAccountId: selectedPaymentAccount?.id || undefined,
          paymentAccountType: paymentAccountTypeValue || undefined,
          paymentAccountNumber: paymentAccountNumberValue,
          date: `${date}T${time}`,
          remark: remark.trim(),
        },
        editTransaction?.id
      );
      return;
    }

    if (transactionType === 'owner') {
      if (!account) {
        setError('Select the business account');
        return;
      }
      if (!ownerAccountId) {
        setError('Select the owner account');
        return;
      }
      saveTransaction(
        {
          transactionType: 'owner',
          playerId: '',
          playerName: '',
          category: 'Owner Transfer',
          amount: numAmount,
          account,
          ownerCategory: 'transfer',
          ownerTransferDirection,
          ownerAccountId,
          paymentAccountId: selectedPaymentAccount?.id || undefined,
          paymentAccountType: paymentAccountTypeValue || undefined,
          paymentAccountNumber: paymentAccountNumberValue,
          date: `${date}T${time}`,
          remark: remark.trim(),
        },
        editTransaction?.id
      );
      return;
    }

    if (transactionType === 'bill' && !billName.trim()) {
      setError('Bill name is required');
      return;
    }

    saveTransaction(
      {
        transactionType: 'bill',
        playerId: '',
        playerName: '',
        category: 'Bill',
        amount: numAmount,
        account,
        billName: billName.trim(),
        paymentAccountId: selectedPaymentAccount?.id || undefined,
        paymentAccountType: paymentAccountTypeValue || undefined,
        paymentAccountNumber: paymentAccountNumberValue,
        date: `${date}T${time}`,
        remark: remark.trim(),
      },
      editTransaction?.id
    );
  };

  const swapTransferAccounts = () => {
    const nextFromAccount = transferToAccount || account;
    const nextToAccount = account || transferToAccount;
    setAccount(nextFromAccount);
    setTransferToAccount(nextToAccount);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-800 font-display">
                {editTransaction ? 'Edit Transaction' : initialQuickAction ? `${initialQuickAction.charAt(0).toUpperCase()}${initialQuickAction.slice(1)}` : 'Add Transaction'}
              </h3>
              <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div role="alert" aria-live="polite" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 border-l-4 border-l-red-500">
                  {error}
                </div>
              )}

              {showSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Transaction saved successfully
                </div>
              )}

              {isPlayerPickerOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
                  <div className="bg-white rounded-2xl w-[90%] max-w-md p-4">
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        autoFocus
                        value={playerSearch}
                        onChange={(e) => setPlayerSearch(e.target.value)}
                        placeholder="Search player..."
                        className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {playerSearch && (
                        <button type="button" onClick={() => setPlayerSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                          ✕
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mb-2">{filteredPlayers.length} Player{filteredPlayers.length !== 1 ? 's' : ''}</p>

                    <div className="max-h-80 overflow-y-auto">
                      {filteredPlayers.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setPlayerId(p.id);
                            setPaymentAccountId('');
                            setPaymentAccountNumber('');
                            setPlayerSearch('');
                            setIsPlayerPickerOpen(false);
                          }}
                          className="w-full text-left p-3 rounded-lg hover:bg-slate-100"
                        >
                          <div className="font-bold">{p.playerId}</div>
                          <div className="text-xs text-slate-500">{p.nickName} • {p.agency}</div>
                        </button>
                      ))}

                      {filteredPlayers.length === 0 && <div className="text-center text-slate-400 py-6">No player found</div>}
                    </div>

                    <button type="button" onClick={() => setIsPlayerPickerOpen(false)} className="w-full mt-3 p-3 rounded-lg bg-slate-100 hover:bg-slate-200">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Transaction type</p>
                    <p className="text-sm font-semibold text-slate-800">{TYPE_OPTIONS.find((opt) => opt.value === transactionType)?.label || 'Player'}</p>
                  </div>
                  <div className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
                    {editTransaction ? 'Edit' : 'New'}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TYPE_OPTIONS.map((opt) => {
                    const isSelected = transactionType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTransactionType(opt.value)}
                        disabled={isSubmitting}
                        className={`rounded-xl px-2 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                          isSelected ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {transactionType === 'player' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Player *</label>
                    <button type="button" onClick={() => setIsPlayerPickerOpen(true)} disabled={isSubmitting} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100 transition-all disabled:cursor-not-allowed disabled:opacity-70">
                      {playerId ? (() => {
                        const p = players.find((x) => x.id === playerId);
                        return p ? `${p.playerId} (${p.nickName})` : 'Select Player';
                      })() : 'Select Player'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Category *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {PLAYER_CATEGORIES.map((cat) => {
                        const isSelected = category === cat;
                        return (
                          <button key={cat} type="button" onClick={() => setCategory(cat)} disabled={isSubmitting} className={`py-2.5 text-xs font-medium rounded-lg border transition-all disabled:cursor-not-allowed disabled:opacity-70 ${isSelected ? (cat === 'Integral Bought' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-red-50 text-red-700 border-red-300') : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Business Account *</label>
                    <div className="relative rounded-lg shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Wallet className="h-4 w-4 text-slate-400" />
                      </div>
                      <select value={account} onChange={(e) => { setAccount(e.target.value as AccountType); setPaymentAccountId(''); setPaymentAccountNumber(''); }} className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 text-slate-850 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white appearance-none cursor-pointer transition-all">
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Amount (MMK) *</label>
                    <div className="relative rounded-lg shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 text-sm font-semibold">Ks</span>
                      </div>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 10000" min="1" step="any" className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 text-slate-850 placeholder-slate-400 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Payment Account</label>
                    <select
                      value={paymentAccountId}
                      onChange={(e) => {
                        const selected = paymentAccounts.find((pa) => pa.id === e.target.value);
                        setPaymentAccountId(e.target.value);
                        setPaymentAccountNumber(selected?.accountNumber?.trim() || '');
                      }}
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <option value="">Select payment account</option>
                      {filteredPaymentAccounts.map((pa) => (
                        <option key={pa.id} value={pa.id}>
                          {pa.accountName?.trim() || pa.type || 'Payment account'} • {pa.accountNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={paymentAccountNumber}
                      onChange={(e) => setPaymentAccountNumber(e.target.value)}
                      placeholder="09xxxxxxxx"
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </div>
                </div>
              )}

              {transactionType === 'owner' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Owner Type *</label>
                    <div className="grid grid-cols-1 gap-2">
                      <button type="button" onClick={() => setOwnerCategory('transfer')} disabled={isSubmitting} className={`py-2.5 text-xs font-medium rounded-lg border transition-all disabled:cursor-not-allowed disabled:opacity-70 ${ownerCategory === 'transfer' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                        Transfer
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Direction *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'owner_to_business', label: 'Owner → Business' },
                        { value: 'business_to_owner', label: 'Business → Owner' },
                      ].map((opt) => (
                        <button key={opt.value} type="button" onClick={() => setOwnerTransferDirection(opt.value as 'owner_to_business' | 'business_to_owner')} disabled={isSubmitting} className={`py-2.5 text-xs font-medium rounded-lg border transition-all disabled:cursor-not-allowed disabled:opacity-70 ${ownerTransferDirection === opt.value ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Business Account *</label>
                    <div className="relative rounded-lg shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Wallet className="h-4 w-4 text-slate-400" />
                      </div>
                      <select value={account} onChange={(e) => { setAccount(e.target.value as AccountType); setPaymentAccountId(''); setPaymentAccountNumber(''); }} className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 text-slate-850 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white appearance-none cursor-pointer transition-all">
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Owner Account *</label>
                    <div className="relative rounded-lg shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Wallet className="h-4 w-4 text-slate-400" />
                      </div>
                      <select value={ownerAccountId} onChange={(e) => setOwnerAccountId(e.target.value)} className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 text-slate-850 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white appearance-none cursor-pointer transition-all">
                        <option value="">Select owner account</option>
                        {ownerAccountOptions.map((acc) => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Amount (MMK) *</label>
                    <div className="relative rounded-lg shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 text-sm font-semibold">Ks</span>
                      </div>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 10000" min="1" step="any" className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 text-slate-850 placeholder-slate-400 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Payment Account</label>
                    <select
                      value={paymentAccountId}
                      onChange={(e) => {
                        const selected = paymentAccounts.find((pa) => pa.id === e.target.value);
                        setPaymentAccountId(e.target.value);
                        setPaymentAccountNumber(selected?.accountNumber?.trim() || '');
                      }}
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <option value="">Select payment account</option>
                      {filteredPaymentAccounts.map((pa) => (
                        <option key={pa.id} value={pa.id}>
                          {pa.accountName?.trim() || pa.type || 'Payment account'} • {pa.accountNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={paymentAccountNumber}
                      onChange={(e) => setPaymentAccountNumber(e.target.value)}
                      placeholder="09xxxxxxxx"
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </div>
                </div>
              )}

              {transactionType === 'bill' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Bill Name *</label>
                    <div className="relative rounded-lg shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Receipt className="h-4 w-4 text-slate-400" />
                      </div>
                      <input type="text" value={billName} onChange={(e) => setBillName(e.target.value)} placeholder="Phone Bill, Electricity, Shopping..." disabled={isSubmitting} className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 text-slate-850 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all disabled:cursor-not-allowed disabled:opacity-70" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Business Account *</label>
                    <div className="relative rounded-lg shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Wallet className="h-4 w-4 text-slate-400" />
                      </div>
                      <select value={account} onChange={(e) => setAccount(e.target.value as AccountType)} className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 text-slate-850 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white appearance-none cursor-pointer transition-all">
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Amount (MMK) *</label>
                    <div className="relative rounded-lg shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 text-sm font-semibold">Ks</span>
                      </div>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 10000" min="1" step="any" className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 text-slate-850 placeholder-slate-400 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Payment Account</label>
                    <select
                      value={paymentAccountId}
                      onChange={(e) => {
                        const selected = paymentAccounts.find((pa) => pa.id === e.target.value);
                        setPaymentAccountId(e.target.value);
                        setPaymentAccountNumber(selected?.accountNumber?.trim() || '');
                      }}
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <option value="">Select payment account</option>
                      {filteredPaymentAccounts.map((pa) => (
                        <option key={pa.id} value={pa.id}>
                          {pa.accountName?.trim() || pa.type || 'Payment account'} • {pa.accountNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={paymentAccountNumber}
                      onChange={(e) => setPaymentAccountNumber(e.target.value)}
                      placeholder="09xxxxxxxx"
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </div>
                </div>
              )}

              {transactionType === 'transfer' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">From Account *</label>
                    <div className="relative rounded-lg shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Wallet className="h-4 w-4 text-slate-400" />
                      </div>
                      <select value={account} onChange={(e) => setAccount(e.target.value as AccountType)} className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 text-slate-850 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white appearance-none cursor-pointer transition-all">
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button type="button" onClick={swapTransferAccounts} disabled={isSubmitting} className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70">
                      <ArrowLeftRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">To Account *</label>
                    <div className="relative rounded-lg shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Wallet className="h-4 w-4 text-slate-400" />
                      </div>
                      <select value={transferToAccount} onChange={(e) => setTransferToAccount(e.target.value as AccountType)} disabled={isSubmitting} className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 text-slate-850 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white appearance-none cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-70">
                        <option value="">Select destination</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Amount (MMK) *</label>
                    <div className="relative rounded-lg shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 text-sm font-semibold">Ks</span>
                      </div>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 10000" min="1" step="any" className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 text-slate-850 placeholder-slate-400 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Payment Account</label>
                    <select
                      value={paymentAccountId}
                      onChange={(e) => {
                        const selected = paymentAccounts.find((pa) => pa.id === e.target.value);
                        setPaymentAccountId(e.target.value);
                        setPaymentAccountNumber(selected?.accountNumber?.trim() || '');
                      }}
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <option value="">Select payment account</option>
                      {filteredPaymentAccounts.map((pa) => (
                        <option key={pa.id} value={pa.id}>
                          {pa.accountName?.trim() || pa.type || 'Payment account'} • {pa.accountNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={paymentAccountNumber}
                      onChange={(e) => setPaymentAccountNumber(e.target.value)}
                      placeholder="09xxxxxxxx"
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </div>

                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date *</label>
                  <div className="relative rounded-lg shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 text-slate-850 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Time *</label>
                  <div className="relative rounded-lg shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      disabled={isSubmitting}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 text-slate-850 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Staff sign</p>
                    <p className="mt-1 text-xs text-slate-500">Pick a saved sign or add a new one.</p>
                  </div>
                  <div className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
                    {staffSign || 'None'}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {staffSignOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setStaffSign(option);
                        persistStaffSignState(staffSignOptions, option);
                      }}
                      disabled={isSubmitting}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-70 ${staffSign === option ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                    >
                      {option}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowStaffSignInput((current) => !current)}
                    disabled={isSubmitting}
                    className="rounded-full border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    + Add New
                  </button>
                </div>

                {showStaffSignInput && (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={staffSignInput}
                      onChange={(e) => setStaffSignInput(e.target.value.toUpperCase())}
                      placeholder="Type sign"
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => saveStaffSign(staffSignInput)}
                      disabled={isSubmitting || !staffSignInput.trim()}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Remark</label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start pointer-events-none">
                    <FileText className="h-4 w-4 text-slate-400" />
                  </div>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Enter remark notes..."
                    rows={2}
                    disabled={isSubmitting}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 text-slate-850 placeholder-slate-400 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all resize-none disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 disabled:cursor-not-allowed disabled:opacity-70">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70">
                  {isSubmitting ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
