import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, AlignLeft, Tag, ArrowUpRight, ArrowDownLeft, Calendar, Edit3, Trash2, Plus } from 'lucide-react';
import { Player, Transaction, Account, PaymentAccount } from '../types';
import { formatMMK, getPlayerTotals, formatTransactionDateTime, normalizeTransaction } from '../data';

interface PlayerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  transactions: Transaction[];
  accounts: Account[];
  paymentAccounts: PaymentAccount[];
  onEditPlayer: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
  onAddTransaction: (playerId: string) => void;
  onAddPaymentAccount: (playerId: string) => void;
  onEditPaymentAccount: (account: PaymentAccount) => void;
  onDeletePaymentAccount: (paymentAccountId: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (txId: string) => void;
}

export default function PlayerDetailsModal({
  isOpen,
  onClose,
  player,
  transactions,
  accounts,
  paymentAccounts,
  onEditPlayer,
  onDeletePlayer,
  onAddTransaction,
  onAddPaymentAccount,
  onEditPaymentAccount,
  onDeletePaymentAccount,
  onEditTransaction,
  onDeleteTransaction,
}: PlayerDetailsModalProps) {
  if (!player) return null;

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterPaymentAccount, setFilterPaymentAccount] = useState<string>('all');
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterTo, setFilterTo] = useState<string>('');

  const totals = getPlayerTotals(player.id, transactions);
  const playerTxs = transactions
    .map((tx) => normalizeTransaction(tx))
    .filter((t) => t.playerId === player.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const filteredLedger = playerTxs.filter((t) => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterAccount !== 'all' && t.account !== filterAccount) return false;
    if (filterPaymentAccount !== 'all' && t.paymentAccountId !== filterPaymentAccount) return false;
    if (filterFrom) {
      if (new Date(t.date) < new Date(filterFrom)) return false;
    }
    if (filterTo) {
      const toDate = new Date(filterTo);
      toDate.setDate(toDate.getDate() + 1);
      if (new Date(t.date) >= toDate) return false;
    }
    return true;
  });

  const handleDeletePlayer = () => {
    if (window.confirm(`Are you sure you want to delete Player "${player.playerId}"? This will also delete all associated transactions.`)) {
      onDeletePlayer(player.id);
      onClose();
    }
  };

  const handleDeleteTx = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      onDeleteTransaction(id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-45 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center space-x-2.5">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-850 font-display">Player Details</h3>
                  <p className="text-xs text-slate-400 font-sans">ID: {player.id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEditPlayer(player)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="Edit Player"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDeletePlayer}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete Player"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Profile Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-100">
                <div className="space-y-3.5">
                  <div className="flex items-start space-x-3">
                    <User className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Player ID / Nick Name</span>
                      <span className="text-sm font-semibold text-slate-800">{player.playerId} {player.nickName !== player.playerId && `(${player.nickName})`}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Tag className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Agency</span>
                      <span className="text-sm font-medium text-slate-700">{player.agency}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phone Number</span>
                      <span className="text-sm text-slate-700 font-sans">{player.phoneNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5 border-t border-slate-200 md:border-t-0 md:border-l md:pl-6 pt-3.5 md:pt-0">
                  <div className="flex items-start space-x-3">
                    <AlignLeft className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Remark</span>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{player.remark || 'No remarks added.'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balances */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Integral Summary</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                    <span className="block text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">Bought</span>
                    <span className="text-sm md:text-base font-bold text-emerald-700 font-sans">{formatMMK(totals.bought)}</span>
                  </div>

                  <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-center">
                    <span className="block text-[10px] font-semibold text-red-600 uppercase tracking-wider mb-1">Returned</span>
                    <span className="text-sm md:text-base font-bold text-red-700 font-sans">{formatMMK(totals.returned)}</span>
                  </div>

                  <div className={`p-4 rounded-xl text-center border ${
                    totals.used >= 0 
                      ? 'bg-blue-50 border-blue-100 text-blue-700' 
                      : 'bg-amber-50 border-amber-100 text-amber-700'
                  }`}>
                    <span className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                      totals.used >= 0 ? 'text-blue-600' : 'text-amber-600'
                    }`}>Used</span>
                    <span className="text-sm md:text-base font-bold font-sans">{formatMMK(totals.used)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Accounts */}
<div>
  <div className="flex items-center justify-between mb-3">
    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
      Payment Accounts
    </h4>

    <button
  onClick={() => onAddPaymentAccount(player.id)}
  className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-lg transition-all cursor-pointer"
>
      <Plus className="h-3 w-3" />
      <span>Add Account</span>
    </button>
  </div>

  {paymentAccounts.filter(a => a.playerId === player.id).length === 0 ? (
  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400">
    No payment accounts yet.
  </div>
) : (
  <div className="space-y-2">
    {paymentAccounts
      .filter(a => a.playerId === player.id)
      .map(account => (
        <div
          key={account.id}
          className="rounded-xl border border-slate-200 bg-white p-3"
        >
          <div className="font-semibold text-slate-800">
            {account.accountName || account.type}
          </div>

          <div className="text-sm text-slate-500">
            {account.type}
          </div>

          <div className="text-sm font-sans text-slate-700">
            {account.accountNumber}
          </div>

          {account.note && (
            <div className="text-xs text-slate-400 mt-1">
              {account.note}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => onEditPaymentAccount(account)}
              className="px-3 py-1 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
            >
              Edit
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this payment account?')) {
                  onDeletePaymentAccount(account.id);
                }
              }}
              className="px-3 py-1 text-xs font-semibold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
  </div>
)}
</div>

              {/* Transactions Section (Ledger) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction Ledger</h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onAddTransaction(player.id)}
                      className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-lg transition-all cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-100 rounded-lg"
                    >
                      Scroll
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  <select
                    className="p-2 rounded-lg border border-slate-200 bg-white text-sm"
                    onChange={(e) => setFilterCategory(e.target.value)}
                    value={filterCategory}
                  >
                    <option value="all">All Categories</option>
                    <option value="Integral Bought">Integral Bought</option>
                    <option value="Integral Returned">Integral Returned</option>
                  </select>

                  <select
                    className="p-2 rounded-lg border border-slate-200 bg-white text-sm"
                    onChange={(e) => setFilterAccount(e.target.value)}
                    value={filterAccount}
                  >
                    <option value="all">All Accounts</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>

                  <select
                    className="p-2 rounded-lg border border-slate-200 bg-white text-sm"
                    onChange={(e) => setFilterPaymentAccount(e.target.value)}
                    value={filterPaymentAccount}
                  >
                    <option value="all">All Player Accounts</option>
                    {paymentAccounts.filter(pa => pa.playerId === player.id).map(pa => (
                      <option key={pa.id} value={pa.id}>{pa.accountNumber} ({pa.type})</option>
                    ))}
                  </select>

                  <div className="flex items-center space-x-2">
                    <input type="date" className="p-2 rounded-lg border border-slate-200 bg-white text-sm" onChange={(e) => setFilterFrom(e.target.value)} value={filterFrom} />
                    <input type="date" className="p-2 rounded-lg border border-slate-200 bg-white text-sm" onChange={(e) => setFilterTo(e.target.value)} value={filterTo} />
                  </div>
                </div>

                {/* Ledger List */}
                {filteredLedger.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-slate-400 text-sm">No transactions found for selected filters.</div>
                ) : (
                  <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                    {filteredLedger.map(tx => {
                      const isBought = tx.category === 'Integral Bought';
                      const formatted = formatTransactionDateTime(tx.date);
                      const pa = paymentAccounts.find(x => x.id === tx.paymentAccountId);
                      return (
                        <div key={tx.id} className="p-3 rounded-xl border bg-white flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${isBought ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {isBought ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-800">{tx.category}</div>
                              <div className="text-[12px] text-slate-500">{formatted.full} • {accounts.find(a => a.id === tx.account)?.name || tx.account}</div>
                              <div className="text-xs text-slate-500 mt-1">{pa ? `${pa.accountNumber} (${pa.type})` : (tx.paymentAccountNumber ? `${tx.paymentAccountNumber} (${tx.paymentAccountType})` : 'No player account')}</div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className={`text-sm font-black font-sans ${isBought ? 'text-emerald-600' : 'text-red-600'}`}>{isBought ? '+' : '-'}{formatMMK(tx.amount).split(' ')[0]}</div>
                            <div className="text-xs text-slate-500 mt-1">{tx.remark}</div>
                            <div className="flex items-center gap-2 mt-2">
                              <button onClick={() => onEditTransaction(tx)} className="px-2 py-1 text-xs text-blue-600 border border-blue-100 rounded-lg">Edit</button>
                              <button onClick={() => { if(window.confirm('Delete transaction?')){ onDeleteTransaction(tx.id); } }} className="px-2 py-1 text-xs text-rose-600 border border-rose-100 rounded-lg">Delete</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
