import Header from './OwnerPrivate/Header';
import TabBar from './OwnerPrivate/TabBar';
import AccountsTab from './OwnerPrivate/AccountsTab';
import TransactionsTab from './OwnerPrivate/TransactionsTab';
import SettingsTab from './OwnerPrivate/SettingsTab';
import AccountForm from './OwnerPrivate/AccountForm';
import TransactionForm from './OwnerPrivate/TransactionForm';
import ChangePasscodeModal from './OwnerPrivate/ChangePasscodeModal';
import { useOwnerPrivate } from '../hooks/useOwnerPrivate';
import type { PrivateAccount, PrivateTransaction, Transaction } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: { accounts: PrivateAccount[]; transactions: PrivateTransaction[] } | null;
  businessTransactions?: Transaction[];
  onSave: (data: { accounts: PrivateAccount[]; transactions: PrivateTransaction[] }) => void;
  onChangePasscode?: (currentPass: string, newPass: string) => Promise<boolean>;
  onLockNow?: () => void;
}

export default function OwnerPrivateModal({ isOpen, onClose, data, businessTransactions, onSave, onChangePasscode, onLockNow }: Props) {
  const {
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
    mergedAccounts,
    accountBalances,
    totalPrivateBalance,
    accountLookup,
    local,
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
  } = useOwnerPrivate({
    isOpen,
    data,
    onSave,
    onChangePasscode,
    onLockNow,
  });

  if (!isOpen) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header totalPrivateBalance={totalPrivateBalance} accountCount={mergedAccounts.length} onClose={onClose} />
      <TabBar activeTab={activeTab} onChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {activeTab === 'accounts' && (
          <AccountsTab
            accounts={mergedAccounts}
            accountBalances={accountBalances}
            localAccounts={local.accounts}
            onAddAccount={openAddAccount}
            onEditAccount={openEditAccount}
            onDeleteAccount={deleteAccount}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab
            transactions={filteredTransactions}
            accountLookup={accountLookup}
            txSearch={txSearch}
            txFilterType={txFilterType}
            onSearchChange={setTxSearch}
            onFilterChange={setTxFilterType}
            onAddTransaction={openAddTransaction}
            onEditTransaction={openEditTransaction}
            onDeleteTransaction={deleteTx}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab onLockNow={() => { if (onLockNow) onLockNow(); }} onChangePasscode={() => setShowChangePassModal(true)} />
        )}
      </div>

      <AccountForm
        isOpen={showAccountForm}
        editingAccount={Boolean(editingAccount)}
        accountForm={accountForm}
        onChangeName={(value) => setAccountForm({ ...accountForm, name: value })}
        onChangeType={(value) => setAccountForm({ ...accountForm, type: value })}
        onChangeBaseBalance={(value) => setAccountForm({ ...accountForm, baseBalance: value })}
        onCancel={() => setShowAccountForm(false)}
        onSave={saveAccountForm}
      />

      <TransactionForm
        isOpen={showTxForm}
        editingTransaction={Boolean(editingTx)}
        accounts={local.accounts}
        txForm={txForm}
        onChangeAccount={(value) => setTxForm({ ...txForm, accountId: value })}
        onChangeType={(value) => setTxForm({ ...txForm, type: value })}
        onChangeAmount={(value) => setTxForm({ ...txForm, amount: value })}
        onChangeDate={(value) => setTxForm({ ...txForm, date: value })}
        onChangeRemark={(value) => setTxForm({ ...txForm, remark: value })}
        onCancel={() => setShowTxForm(false)}
        onSave={saveTxForm}
      />

      <ChangePasscodeModal
        isOpen={showChangePassModal}
        currentPass={changeCurrentPass}
        newPass={changeNewPass}
        newPass2={changeNewPass2}
        onChangeCurrentPass={setChangeCurrentPass}
        onChangeNewPass={setChangeNewPass}
        onChangeNewPass2={setChangeNewPass2}
        onCancel={() => setShowChangePassModal(false)}
        onSubmit={handleChangePasscode}
      />
    </div>
  );
}
