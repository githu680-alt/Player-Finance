import React, { useState } from 'react';
import { Wallet, Landmark, PhoneCall, Plus, ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from 'lucide-react';
import { formatMMK } from '../data';
import { PrivateAccount, PrivateTransaction, Transaction } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: { accounts: PrivateAccount[]; transactions: PrivateTransaction[] } | null;
  businessTransactions?: Transaction[];
  onSave: (data: { accounts: PrivateAccount[]; transactions: PrivateTransaction[] }) => void;
  onChangePasscode?: (currentPass: string, newPass: string) => Promise<boolean>;
  onLockNow?: () => void;
}

const PRIVATE_ICONS: Record<string, any> = {
  cash: Wallet,
  kbz: Landmark,
  wave: PhoneCall,
  bank: Landmark,
  default: Wallet,
};

function getTxVisual(type: string) {
  if (type.toLowerCase() === 'income') {
    return {
      icon: <ArrowUpRight className="h-4.5 w-4.5" />,
      accent: 'bg-emerald-50 text-emerald-600',
      amountClass: 'text-emerald-600',
      label: 'Income',
    };
  }

  if (type.toLowerCase() === 'expense') {
    return {
      icon: <ArrowDownLeft className="h-4.5 w-4.5" />,
      accent: 'bg-rose-50 text-rose-600',
      amountClass: 'text-rose-600',
      label: 'Expense',
    };
  }

  return {
    icon: <ArrowLeftRight className="h-4.5 w-4.5" />,
    accent: 'bg-slate-100 text-slate-700',
    amountClass: 'text-slate-700',
    label: 'Transfer',
  };
}

export default function OwnerPrivateModal({ isOpen, onClose, data, businessTransactions, onSave, onChangePasscode, onLockNow }: Props) {
  const [local, setLocal] = useState(data || { accounts: [], transactions: [] });
  const [activeTab, setActiveTab] = useState<'accounts'|'transactions'|'settings'>('accounts');
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [changeCurrentPass, setChangeCurrentPass] = useState('');
  const [changeNewPass, setChangeNewPass] = useState('');
  const [changeNewPass2, setChangeNewPass2] = useState('');

  React.useEffect(() => {
    setLocal(data || { accounts: [], transactions: [] });
  }, [data]);

  React.useEffect(() => {
    if (!isOpen) return;
    // Inactivity auto-lock timer
    let timeout: number | undefined;
    const reset = () => {
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        if (onLockNow) onLockNow();
      }, 5 * 60 * 1000); // 5 minutes
    };
    const activity = () => reset();
    window.addEventListener('mousemove', activity);
    window.addEventListener('keydown', activity);
    window.addEventListener('touchstart', activity);
    reset();
    return () => {
      if (timeout) window.clearTimeout(timeout);
      window.removeEventListener('mousemove', activity);
      window.removeEventListener('keydown', activity);
      window.removeEventListener('touchstart', activity);
    };
  }, [isOpen, onLockNow]);

  if (!isOpen) return null;

  const mergedAccounts = [...local.accounts];

  const accountBalances = mergedAccounts.reduce<Record<string, number>>((acc, item) => {
    acc[item.id] = item.baseBalance || 0;
    return acc;
  }, {});

  local.transactions.forEach((tx) => {
    const current = accountBalances[tx.accountId] || 0;
    const type = tx.type.toLowerCase();
    if (type === 'income') accountBalances[tx.accountId] = current + tx.amount;
    else if (type === 'expense') accountBalances[tx.accountId] = current - tx.amount;
    else accountBalances[tx.accountId] = current;
  });

  const totalPrivateBalance = Object.values(accountBalances).reduce((sum, value) => sum + value, 0);
  const accountLookup = mergedAccounts.reduce<Record<string, string>>((acc, item) => {
    acc[item.id] = item.name;
    return acc;
  }, {});

  const displayTransactions = [...local.transactions].sort((a, b) => b.date.localeCompare(a.date));

  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PrivateAccount | null>(null);
  const [accountForm, setAccountForm] = useState<{ name: string; type: string; baseBalance: number }>({ name: '', type: 'cash', baseBalance: 0 });

  const [showTxForm, setShowTxForm] = useState(false);
  const [editingTx, setEditingTx] = useState<PrivateTransaction | null>(null);
  const [txSearch, setTxSearch] = useState('');
  const [txFilterType, setTxFilterType] = useState<'all'|'Income'|'Expense'|'Transfer'>('all');
  const [txForm, setTxForm] = useState<{ date: string; type: string; amount: number; accountId: string; remark: string }>({ date: new Date().toISOString(), type: 'Income', amount: 0, accountId: local.accounts[0]?.id || '', remark: '' });

  const resetAccountForm = () => setAccountForm({ name: '', type: 'cash', baseBalance: 0 });
  const resetTxForm = () => setTxForm({ date: new Date().toISOString(), type: 'Income', amount: 0, accountId: local.accounts[0]?.id || '', remark: '' });

  const openAddAccount = () => {
    setEditingAccount(null);
    resetAccountForm();
    setShowAccountForm(true);
  };

  const openEditAccount = (account: PrivateAccount) => {
    setEditingAccount(account);
    setAccountForm({ name: account.name, type: account.type || 'cash', baseBalance: account.baseBalance || 0 });
    setShowAccountForm(true);
  };

  const saveAccountForm = () => {
    const name = accountForm.name.trim();
    if (!name) return alert('Account name required');
    if (editingAccount) {
      const next = {
        ...local,
        accounts: local.accounts.map((item) => item.id === editingAccount.id ? { ...item, name, type: accountForm.type, baseBalance: accountForm.baseBalance } : item),
      };
      setLocal(next);
      onSave(next);
    } else {
      const id = 'priv_acc_' + Date.now().toString();
      const acc: PrivateAccount = { id, name, type: accountForm.type, baseBalance: accountForm.baseBalance };
      const next = { ...local, accounts: [...local.accounts, acc] };
      setLocal(next);
      onSave(next);
    }
    setShowAccountForm(false);
  };

  const deleteAccount = (id: string) => {
    if (!confirm('Delete private account?')) return;
    const next = {
      ...local,
      accounts: local.accounts.filter((item) => item.id !== id),
      transactions: local.transactions.filter((item) => item.accountId !== id),
    };
    setLocal(next);
    onSave(next);
  };

  const openAddTransaction = () => {
    setEditingTx(null);
    resetTxForm();
    setShowTxForm(true);
  };

  const openEditTransaction = (transaction: PrivateTransaction) => {
    setEditingTx(transaction);
    setTxForm({ date: transaction.date, type: transaction.type, amount: transaction.amount, accountId: transaction.accountId, remark: transaction.remark || '' });
    setShowTxForm(true);
  };

  const saveTxForm = () => {
    if (!txForm.accountId) return alert('Select account');
    if (!txForm.amount || isNaN(txForm.amount)) return alert('Amount required');
    if (editingTx) {
      const next = { ...local, transactions: local.transactions.map((t) => t.id === editingTx.id ? { ...t, date: txForm.date, type: txForm.type, amount: txForm.amount, accountId: txForm.accountId, remark: txForm.remark } : t) };
      setLocal(next);
      onSave(next);
    } else {
      const id = 'priv_tx_' + Date.now().toString();
      const tx: PrivateTransaction = { id, date: txForm.date, type: txForm.type, amount: txForm.amount, accountId: txForm.accountId, remark: txForm.remark };
      const next = { ...local, transactions: [tx, ...local.transactions] };
      setLocal(next);
      onSave(next);
    }
    setShowTxForm(false);
  };

  const deleteTx = (id: string) => {
    if (!confirm('Delete private transaction?')) return;
    const next = { ...local, transactions: local.transactions.filter((t) => t.id !== id) };
    setLocal(next);
    onSave(next);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm shadow-[0_8px_20px_-12px_rgba(15,23,42,0.12)]">
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Owner private</p>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">Private Finance</h1>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-3xs transition-colors hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <div className="mt-4 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-500 via-emerald-400 to-lime-400 p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-950/75">Total balance</p>
                <h2 className="mt-1 text-3xl font-black tracking-tight font-sans text-slate-950">{formatMMK(totalPrivateBalance)}</h2>
              </div>
              <div className="rounded-2xl bg-white/80 px-3 py-2 text-center shadow-sm">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Accounts</div>
                <div className="text-lg font-black text-slate-900">{mergedAccounts.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-2">
        <div className="flex flex-wrap items-center gap-2 rounded-3xl bg-slate-100 p-2 shadow-sm">
            {[
              { key: 'accounts', label: 'Accounts' },
              { key: 'transactions', label: 'Transactions' },
              { key: 'settings', label: 'Settings' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`rounded-2xl px-4 py-2 text-xs font-semibold transition ${activeTab === tab.key ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                {tab.label}
              </button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {activeTab === 'accounts' && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.28)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Private accounts</h2>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Personal balances stay separate from business accounts.</p>
                </div>
                <button
                  type="button"
                  onClick={openAddAccount}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Account
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {mergedAccounts.length === 0 ? (
                  <div className="col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                    No private accounts yet.
                  </div>
                ) : (
                  mergedAccounts.map((acc) => {
                    const Icon = PRIVATE_ICONS[acc.type.toLowerCase()] || PRIVATE_ICONS.default;
                    const isDerived = !local.accounts.some((localAcc) => localAcc.id === acc.id);
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
                              <button type="button" onClick={() => openEditAccount(acc)} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">Edit</button>
                              <button type="button" onClick={() => deleteAccount(acc.id)} className="text-[11px] font-semibold text-rose-500 hover:text-rose-600">Delete</button>
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
        )}

        {activeTab === 'transactions' && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.28)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Transaction history</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Private personal activity stays visible only here.</p>
                </div>
                <button
                  type="button"
                  onClick={openAddTransaction}
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
                    onChange={(e) => setTxSearch(e.target.value)}
                    placeholder="Search transactions"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 shadow-sm"
                  />
                </div>
                <div className="flex gap-2">
                  {(['all', 'Income', 'Expense', 'Transfer'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTxFilterType(type)}
                      className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${txFilterType === type ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {type === 'all' ? 'All' : type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                {displayTransactions.filter((t) => {
                  const query = txSearch.toLowerCase();
                  const accountName = accountLookup[t.accountId] || '';
                  const matchesQuery =
                    !query ||
                    t.type.toLowerCase().includes(query) ||
                    accountName.toLowerCase().includes(query) ||
                    (t.remark || '').toLowerCase().includes(query);
                  const matchesType = txFilterType === 'all' || t.type === txFilterType;
                  return matchesQuery && matchesType;
                }).length === 0 ? (                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                    No private transactions yet.
                  </div>
                ) : (
                  displayTransactions.filter((t) => {
                    const query = txSearch.toLowerCase();
                    const accountName = accountLookup[t.accountId] || '';
                    const matchesQuery =
                      !query ||
                      t.type.toLowerCase().includes(query) ||
                      accountName.toLowerCase().includes(query) ||
                      (t.remark || '').toLowerCase().includes(query);
                    const matchesType = txFilterType === 'all' || t.type === txFilterType;
                    return matchesQuery && matchesType;
                  }).map((t) => {
                    const visual = getTxVisual(t.type);
                    const accountName = accountLookup[t.accountId] || 'Unassigned';
                    const dateTime = new Date(t.date);
                    return (
                      <div key={t.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 shadow-3xs">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${visual.accent}`}>
                            {visual.icon}
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
                            {t.type.toLowerCase() === 'expense'
                              ? `-${formatMMK(t.amount)}`
                              : `+${formatMMK(t.amount)}`}
                          </div>
                          <div className="mt-1 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditTransaction(t)}
                                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteTx(t.id)}
                                className="text-[11px] font-semibold text-rose-500 hover:text-rose-600"
                              >
                                Delete
                              </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.28)]">
              <h3 className="text-sm font-bold text-slate-800">Settings</h3>
              <div className="mt-3 space-y-3">
                <button onClick={() => { if (onLockNow) onLockNow(); }} className="w-full text-left rounded-lg border px-3 py-3">🔒 Lock Now</button>
                <button onClick={() => setShowChangePassModal(true)} className="w-full text-left rounded-lg border px-3 py-3">🔑 Change Passcode</button>
                <div className="text-sm text-slate-500">❓ Forgot Passcode? Use the recovery option on the unlock screen.</div>
              </div>
            </div>
        )}
      </div>

      {/* Account Form Modal */}
      {showAccountForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl p-5 w-full max-w-md">
              <h3 className="text-lg font-bold mb-3">{editingAccount ? 'Edit Account' : 'Add Account'}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-600">Name</label>
                  <input value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} className="w-full border rounded-xl p-2 mt-1" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Type</label>
                  <input value={accountForm.type} onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })} className="w-full border rounded-xl p-2 mt-1" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Starting Balance</label>
                  <input type="number" value={accountForm.baseBalance} onChange={(e) => setAccountForm({ ...accountForm, baseBalance: Number(e.target.value) })} className="w-full border rounded-xl p-2 mt-1" />
                </div>
                <div className="flex items-center justify-end gap-2 mt-4">
                  <button onClick={() => setShowAccountForm(false)} className="px-3 py-1 rounded-xl border">Cancel</button>
                  <button onClick={saveAccountForm} className="px-4 py-1 rounded-xl bg-slate-900 text-white">Save</button>
                </div>
              </div>
            </div>
        </div>
      )}

      {/* Transaction Form Modal */}
      {showTxForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl p-5 w-full max-w-md">
              <h3 className="text-lg font-bold mb-3">{editingTx ? 'Edit Transaction' : 'Add Transaction'}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-600">Account</label>
                  <select value={txForm.accountId} onChange={(e) => setTxForm({ ...txForm, accountId: e.target.value })} className="w-full border rounded-xl p-2 mt-1">
                    {local.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Type</label>
                  <select value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value })} className="w-full border rounded-xl p-2 mt-1">
                    <option>Income</option>
                    <option>Expense</option>
                    <option>Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Amount</label>
                  <input type="number" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: Number(e.target.value) })} className="w-full border rounded-xl p-2 mt-1" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Date</label>
                  <input type="datetime-local" value={txForm.date.slice(0,16)} onChange={(e) => setTxForm({ ...txForm, date: new Date(e.target.value).toISOString() })} className="w-full border rounded-xl p-2 mt-1" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Remark</label>
                  <input value={txForm.remark} onChange={(e) => setTxForm({ ...txForm, remark: e.target.value })} className="w-full border rounded-xl p-2 mt-1" />
                </div>
                <div className="flex items-center justify-end gap-2 mt-4">
                  <button onClick={() => setShowTxForm(false)} className="px-3 py-1 rounded-xl border">Cancel</button>
                  <button onClick={saveTxForm} className="px-4 py-1 rounded-xl bg-slate-900 text-white">Save</button>
                </div>
              </div>
            </div>
        </div>
      )}

      {/* Change Passcode Modal */}
      {showChangePassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
              <h3 className="text-lg font-bold mb-3">Change Owner Passcode</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-600">Current Passcode</label>
                  <input type="password" value={changeCurrentPass} onChange={(e) => setChangeCurrentPass(e.target.value)} className="w-full border rounded-xl p-2 mt-1" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">New Passcode</label>
                  <input type="password" value={changeNewPass} onChange={(e) => setChangeNewPass(e.target.value)} className="w-full border rounded-xl p-2 mt-1" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Confirm New Passcode</label>
                  <input type="password" value={changeNewPass2} onChange={(e) => setChangeNewPass2(e.target.value)} className="w-full border rounded-xl p-2 mt-1" />
                </div>
                <div className="flex items-center justify-end gap-2 mt-4">
                  <button onClick={() => setShowChangePassModal(false)} className="px-3 py-1 rounded-xl border">Cancel</button>
                  <button onClick={async () => {
                    if (!changeCurrentPass || !changeNewPass || !changeNewPass2) return alert('All fields required');
                    if (changeNewPass !== changeNewPass2) return alert('New passcodes do not match');
                    if (!onChangePasscode) return alert('Change passcode handler not available');
                    const ok = await onChangePasscode(changeCurrentPass, changeNewPass);
                    if (ok) {
                      alert('Passcode changed');
                      setShowChangePassModal(false);
                    } else {
                      alert('Change passcode failed — check current passcode');
                    }
                  }} className="px-4 py-1 rounded-xl bg-slate-900 text-white">Change Passcode</button>
                </div>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}
