import { useEffect, useState } from 'react';
import {
  createDefaultAccountForm,
  createDefaultTransactionForm,
  type PrivateTabKey,
} from '../constants/ownerPrivate';
import {
  getFilteredPrivateTransactions,
  getPrivateAccountBalanceSummary,
  normalizeTransactionDate,
} from '../utils/ownerPrivate';
import type { PrivateAccount, PrivateTransaction, Transaction } from '../types';

interface OwnerPrivateData {
  accounts: PrivateAccount[];
  transactions: PrivateTransaction[];
}

interface UseOwnerPrivateArgs {
  isOpen: boolean;
  data: OwnerPrivateData | null;
  onSave: (data: OwnerPrivateData) => void;
  onChangePasscode?: (currentPass: string, newPass: string) => Promise<boolean>;
  onLockNow?: () => void;
}

export function useOwnerPrivate({ isOpen, data, onSave, onChangePasscode, onLockNow }: UseOwnerPrivateArgs) {
  const [local, setLocal] = useState<OwnerPrivateData>(data || { accounts: [], transactions: [] });
  const [activeTab, setActiveTab] = useState<PrivateTabKey>('accounts');
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [changeCurrentPass, setChangeCurrentPass] = useState('');
  const [changeNewPass, setChangeNewPass] = useState('');
  const [changeNewPass2, setChangeNewPass2] = useState('');

  useEffect(() => {
    setLocal(data || { accounts: [], transactions: [] });
  }, [data]);

  useEffect(() => {
    if (!isOpen) return;

    let timeout: number | undefined;
    const reset = () => {
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        if (onLockNow) onLockNow();
      }, 5 * 60 * 1000);
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

  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PrivateAccount | null>(null);
  const [accountForm, setAccountForm] = useState(createDefaultAccountForm());

  const [showTxForm, setShowTxForm] = useState(false);
  const [editingTx, setEditingTx] = useState<PrivateTransaction | null>(null);
  const [txSearch, setTxSearch] = useState('');
  const [txFilterType, setTxFilterType] = useState<'all' | 'Income' | 'Expense' | 'Transfer'>('all');
  const [txForm, setTxForm] = useState(createDefaultTransactionForm(local.accounts[0]?.id || ''));

  const resetAccountForm = () => setAccountForm(createDefaultAccountForm());
  const resetTxForm = () => setTxForm(createDefaultTransactionForm(local.accounts[0]?.id || ''));

  const mergedAccounts = [...local.accounts];
  const { accountBalances, totalPrivateBalance, accountLookup } = getPrivateAccountBalanceSummary(mergedAccounts, local.transactions);
  const displayTransactions = [...local.transactions].sort((a, b) => b.date.localeCompare(a.date));

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
        accounts: local.accounts.map((item) =>
          item.id === editingAccount.id
            ? { ...item, name, type: accountForm.type, baseBalance: accountForm.baseBalance }
            : item,
        ),
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
    setTxForm({
      date: transaction.date,
      type: transaction.type,
      amount: transaction.amount,
      accountId: transaction.accountId,
      remark: transaction.remark || '',
    });
    setShowTxForm(true);
  };

  const saveTxForm = () => {
    if (!txForm.accountId) return alert('Select account');
    if (!local.accounts.some((account) => account.id === txForm.accountId)) return alert('Select account');
    if (!txForm.amount || Number.isNaN(txForm.amount)) return alert('Amount required');

    const safeDate = normalizeTransactionDate(txForm.date);

    if (editingTx) {
      const next = {
        ...local,
        transactions: local.transactions.map((t) =>
          t.id === editingTx.id
            ? { ...t, date: safeDate, type: txForm.type, amount: txForm.amount, accountId: txForm.accountId, remark: txForm.remark }
            : t,
        ),
      };
      setLocal(next);
      onSave(next);
    } else {
      const id = 'priv_tx_' + Date.now().toString();
      const tx: PrivateTransaction = {
        id,
        date: safeDate,
        type: txForm.type,
        amount: txForm.amount,
        accountId: txForm.accountId,
        remark: txForm.remark,
      };
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

  const handleChangePasscode = async () => {
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
  };

  const filteredTransactions = getFilteredPrivateTransactions(displayTransactions, txSearch, txFilterType, accountLookup);

  return {
    activeTab,
    setActiveTab,
    showChangePassModal,
    setShowChangePassModal,
    changeCurrentPass,
    setChangeCurrentPass,
    changeNewPass,
    setChangeNewPass,
    changeNewPass2,
    setChangeNewPass2,
    showAccountForm,
    setShowAccountForm,
    editingAccount,
    accountForm,
    setAccountForm,
    showTxForm,
    setShowTxForm,
    editingTx,
    txSearch,
    setTxSearch,
    txFilterType,
    setTxFilterType,
    txForm,
    setTxForm,
    local,
    mergedAccounts,
    accountBalances,
    totalPrivateBalance,
    accountLookup,
    displayTransactions,
    filteredTransactions,
    openAddAccount,
    openEditAccount,
    saveAccountForm,
    deleteAccount,
    openAddTransaction,
    openEditTransaction,
    saveTxForm,
    deleteTx,
    handleChangePasscode,
  };
}
