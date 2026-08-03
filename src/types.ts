export interface Player {
  id: string; // Internal UUID or unique string
  playerId: string; // User-facing Player ID (e.g., "Hein40")
  nickName: string;
  agency: string;
  phoneNumber: string;
  remark: string;
}

export interface PaymentAccount {
  id: string;
  playerId: string;     // Player.id ကိုချိတ်မယ်
  type: string;         // Wave, KBZ, AYA...
  accountName: string;  // Optional (Ko Aung)
  accountNumber: string;
  note?: string;
}

export type TransactionCategory = string;
export type TransactionType = 'player' | 'owner' | 'bill' | 'transfer';
export type OwnerCategory = 'money_in' | 'money_out' | 'income' | 'expense' | 'transfer';
export type OwnerTransferDirection = 'owner_to_business' | 'business_to_owner';

export type AccountType = string;

export interface Account {
  id: string;
  name: string;
  icon: string;
  color: string;
  baseBalance: number;
}

export interface Transaction {
  id: string;
  transactionType?: TransactionType; // player | owner | bill
  playerId: string; // Links to Player.id or Player.playerId
  playerName?: string; // Stored for display convenience, updated if player changes
  category: TransactionCategory;
  amount: number; // in MMK
  account: AccountType;
  toAccount?: AccountType;
  paymentAccountId?: string;
  paymentAccountType?: string;
  paymentAccountNumber?: string;
  ownerCategory?: OwnerCategory;
  ownerTransferDirection?: OwnerTransferDirection;
  billName?: string;
  date: string; // YYYY-MM-DD
  remark: string;
}

export interface AccountInfo {
  type: AccountType;
  label: string;
  color: string;
  baseBalance: number;
}

export interface AgencySummary {
  name: string;
  playerCount: number;
  integralBought: number;
  integralReturned: number;
  integralUsed: number;
}

// Private owner-only types (not used by business flows)
export interface PrivateAccount {
  id: string;
  name: string;
  type: string;
  baseBalance?: number;
}

export interface PrivateTransaction {
  id: string;
  date: string; // ISO
  type: string; // Income | Expense | Transfer
  amount: number;
  accountId: string;
  remark?: string;
}
