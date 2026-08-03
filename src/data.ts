import { Player, Transaction, TransactionType, AgencySummary, AccountType, AccountInfo, Account } from './types';

export const INITIAL_PLAYERS: Player[] = [
  {
    id: 'p1',
    playerId: 'Hein40',
    nickName: 'Hein40',
    agency: 'winnerplayer',
    phoneNumber: '09-450123456',
    remark: 'Regular player, high volume'
  },
  {
    id: 'p2',
    playerId: 'WZH1563',
    nickName: 'WZH1563',
    agency: 'winnerplayer',
    phoneNumber: '09-450234567',
    remark: 'Frequent player'
  },
  {
    id: 'p3',
    playerId: 'Toe159',
    nickName: 'Toe159',
    agency: 'winnerplayer',
    phoneNumber: '09-450345678',
    remark: 'Steady contributor'
  },
  {
    id: 'p4',
    playerId: 'KHANT9',
    nickName: 'KHANT9',
    agency: 'winnerplayer',
    phoneNumber: '09-450456789',
    remark: 'Active agent connection'
  },
  {
    id: 'p5',
    playerId: 'zinminko9',
    nickName: 'zinminko9',
    agency: 'winnerplayer',
    phoneNumber: '09-450567890',
    remark: 'VIP player'
  },
  {
    id: 'p6',
    playerId: 'Myomin428',
    nickName: 'Myomin428',
    agency: 'winnerplayer',
    phoneNumber: '09-450678901',
    remark: 'Loyal player'
  },
  {
    id: 'p7',
    playerId: 'zinmaung',
    nickName: 'zinmaung',
    agency: 'winnerplayer',
    phoneNumber: '09-450789012',
    remark: 'Plays daily'
  },
  {
    id: 'p8',
    playerId: 'PPA671',
    nickName: 'PPA671',
    agency: 'winnerplayer',
    phoneNumber: '09-450890123',
    remark: 'New registrant'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    transactionType: 'player',
    playerId: 'p1',
    playerName: 'Hein40',
    category: 'Integral Bought',
    amount: 10000,
    account: 'Kbz',
    date: '2026-07-01',
    remark: 'Bought credit'
  },
  {
    id: 't2',
    transactionType: 'player',
    playerId: 'p2',
    playerName: 'WZH1563',
    category: 'Integral Bought',
    amount: 66000,
    account: 'Wave',
    date: '2026-07-02',
    remark: 'Credit top up'
  },
  {
    id: 't3',
    transactionType: 'player',
    playerId: 'p2',
    playerName: 'WZH1563',
    category: 'Integral Returned',
    amount: 100000,
    account: 'Cb',
    date: '2026-07-03',
    remark: 'Integral returned cash'
  },
  {
    id: 't4',
    transactionType: 'player',
    playerId: 'p3',
    playerName: 'Toe159',
    category: 'Integral Bought',
    amount: 5000,
    account: 'Cash',
    date: '2026-07-04',
    remark: 'Cash buy integral'
  },
  {
    id: 't5',
    transactionType: 'player',
    playerId: 'p4',
    playerName: 'KHANT9',
    category: 'Integral Bought',
    amount: 30500,
    account: 'Bank account',
    date: '2026-07-05',
    remark: 'Bought from bank'
  },
  {
    id: 't6',
    transactionType: 'player',
    playerId: 'p5',
    playerName: 'zinminko9',
    category: 'Integral Bought',
    amount: 70000,
    account: 'Kbz',
    date: '2026-07-06',
    remark: 'High roller bought'
  },
  {
    id: 't7',
    transactionType: 'player',
    playerId: 'p5',
    playerName: 'zinminko9',
    category: 'Integral Returned',
    amount: 30000,
    account: 'Cash',
    date: '2026-07-07',
    remark: 'Partial return'
  },
  {
    id: 't8',
    transactionType: 'player',
    playerId: 'p6',
    playerName: 'Myomin428',
    category: 'Integral Bought',
    amount: 20000,
    account: 'Wave',
    date: '2026-07-08',
    remark: 'Wave top up'
  },
  {
    id: 't9',
    transactionType: 'player',
    playerId: 'p7',
    playerName: 'zinmaung',
    category: 'Integral Bought',
    amount: 10000,
    account: 'Cb',
    date: '2026-07-09',
    remark: 'Regular buy'
  }
];

export const ACCOUNTS_CONFIG: AccountInfo[] = [
  { type: 'Cash', label: 'Cash', color: 'bg-emerald-500', baseBalance: 500000 },
  { type: 'Bank account', label: 'Bank account', color: 'bg-blue-600', baseBalance: 1500000 },
  { type: 'Kbz', label: 'Kbz', color: 'bg-indigo-600', baseBalance: 2000000 },
  { type: 'Wave', label: 'Wave', color: 'bg-sky-500', baseBalance: 1000000 },
  { type: 'Cb', label: 'Cb', color: 'bg-violet-600', baseBalance: 1200000 }
];

const CATEGORY_REMAP: Record<string, string> = {
  Salary: 'Player Payment',
  Other: 'Bill Payment',
  Bill: 'Bill Payment',
  'Owner Income': 'Owner Transfer',
  'Owner Expense': 'Owner Transfer',
};

const DEFAULT_CATEGORY_BY_TYPE: Record<TransactionType, string> = {
  player: 'Integral Bought',
  owner: 'Owner Transfer',
  bill: 'Bill Payment',
  transfer: 'Transfer',
};

export function normalizeTransaction(tx: Partial<Transaction> & { id: string }): Transaction {
  const explicitType = tx.transactionType;
  const transactionType = explicitType === 'owner' || explicitType === 'bill' || explicitType === 'transfer'
    ? explicitType
    : 'player';

  const resolvedCategory = tx.category || DEFAULT_CATEGORY_BY_TYPE[transactionType];
  const category = CATEGORY_REMAP[resolvedCategory] || resolvedCategory;

  const normalizedOwnerCategory = tx.ownerCategory === 'money_in' ? 'income'
    : tx.ownerCategory === 'money_out' ? 'expense'
    : tx.ownerCategory === 'transfer' ? 'transfer'
    : tx.ownerCategory;

  return {
    id: tx.id || `tx_${Date.now()}`,
    transactionType,
    playerId: tx.playerId || '',
    playerName: tx.playerName || '',
    category: transactionType === 'transfer' ? 'Transfer' : category,
    amount: typeof tx.amount === 'number' ? tx.amount : Number(tx.amount || 0),
    account: tx.account || '',
    toAccount: tx.toAccount || '',
    paymentAccountId: tx.paymentAccountId,
    paymentAccountType: tx.paymentAccountType,
    paymentAccountNumber: tx.paymentAccountNumber,
    ownerCategory: normalizedOwnerCategory,
    ownerTransferDirection: tx.ownerTransferDirection,
    billName: tx.billName?.trim() || (transactionType === 'bill' ? 'Bill Payment' : ''),
    date: tx.date || '',
    remark: tx.remark || '',
  };
}

export function getTransactionDisplayCategory(tx: Transaction) {
  if (tx.transactionType === 'owner') {
    return 'Owner Transfer';
  }

  if (tx.transactionType === 'transfer') {
    return 'Transfer';
  }

  if (tx.transactionType === 'bill') {
    return tx.category === 'Bill Payment' ? 'Bill Payment' : tx.billName ? tx.billName : 'Bill Payment';
  }

  return CATEGORY_REMAP[tx.category] || tx.category;
}

export function getPlayerTotals(playerId: string, transactions: Transaction[]) {
  const playerTx = transactions
    .map((tx) => normalizeTransaction(tx))
    .filter((t) => t.playerId === playerId && t.transactionType === 'player');
  const bought = playerTx
    .filter((t) => t.category === 'Integral Bought')
    .reduce((sum, t) => sum + t.amount, 0);
  const returned = playerTx
    .filter((t) => t.category === 'Integral Returned')
    .reduce((sum, t) => sum + t.amount, 0);
  const used = bought - returned;

  return { bought, returned, used };
}

export function getPlayersWithTotals(players: Player[], transactions: Transaction[]) {
  return players.map(player => {
    const totals = getPlayerTotals(player.id, transactions);
    return {
      ...player,
      integralBought: totals.bought,
      integralReturned: totals.returned,
      integralUsed: totals.used
    };
  });
}

export type ActivityPeriod = 'daily' | 'weekly' | 'monthly';

export interface ActivePlayerSummary {
  playerId: string;
  nickName: string;
  agency: string;
  phoneNumber: string;
  category: string;
  amount: number;
  date: string;
  time: string;
  rawDate: string;
}

function getPeriodStart(period: ActivityPeriod, now: Date) {
  if (period === 'daily') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (period === 'weekly') {
    const start = new Date(now);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getActivePlayers(players: Player[], transactions: Transaction[], period: ActivityPeriod): ActivePlayerSummary[] {
  const now = new Date();
  const periodStart = getPeriodStart(period, now);
  const normalized = transactions.map((tx) => normalizeTransaction(tx));

  const activePlayers: ActivePlayerSummary[] = [];

  players.forEach((player) => {
    const playerTxs = normalized
      .filter((tx) => tx.transactionType === 'player' && tx.playerId === player.id)
      .filter((tx) => {
        const txDate = new Date(tx.date);
        if (Number.isNaN(txDate.getTime())) return false;

        if (period === 'daily') {
          return tx.date.substring(0, 10) === now.toISOString().substring(0, 10);
        }

        if (period === 'weekly' || period === 'monthly') {
          return txDate >= periodStart && txDate <= now;
        }

        return false;
      });

    if (playerTxs.length === 0) return;

    const sorted = playerTxs.sort((a, b) => b.date.localeCompare(a.date));
    const lastTx = sorted[0];
    const formatted = formatTransactionDateTime(lastTx.date);

    activePlayers.push({
      playerId: player.playerId,
      nickName: player.nickName,
      agency: player.agency,
      phoneNumber: player.phoneNumber || '',
      category: lastTx.category,
      amount: lastTx.amount,
      date: formatted.date,
      time: formatted.time,
      rawDate: lastTx.date,
    });
  });

  return activePlayers.sort((a, b) => b.rawDate.localeCompare(a.rawDate));
}

export function getAgencySummaries(players: Player[], transactions: Transaction[]): AgencySummary[] {
  const agencyMap = new Map<string, { count: number; bought: number; returned: number }>();

  // Initialize agencies from players
  players.forEach(p => {
    const current = agencyMap.get(p.agency) || { count: 0, bought: 0, returned: 0 };
    current.count += 1;
    agencyMap.set(p.agency, current);
  });

  // Accumulate transactions
  transactions
    .map((tx) => normalizeTransaction(tx))
    .forEach((t) => {
      if (t.transactionType !== 'player') return;

      const player = players.find(p => p.id === t.playerId);
      if (player) {
        const current = agencyMap.get(player.agency) || { count: 0, bought: 0, returned: 0 };
        if (t.category === 'Integral Bought') {
          current.bought += t.amount;
        } else if (t.category === 'Integral Returned') {
          current.returned += t.amount;
        }
        agencyMap.set(player.agency, current);
      }
    });

  return Array.from(agencyMap.entries()).map(([name, data]) => ({
    name,
    playerCount: data.count,
    integralBought: data.bought,
    integralReturned: data.returned,
    integralUsed: data.bought - data.returned
  }));
}

export function getAccountBalances(transactions: Transaction[], accounts?: Account[]) {
  let activeAccounts = accounts;

  // If no active accounts, fall back to defaults
  if (!activeAccounts || activeAccounts.length === 0) {
    activeAccounts = [
      { id: 'Cash', name: 'Cash', icon: 'Wallet', color: 'bg-emerald-500', baseBalance: 500000 },
      { id: 'Bank account', name: 'Bank account', icon: 'Landmark', color: 'bg-blue-600', baseBalance: 1500000 },
      { id: 'Kbz', name: 'Kbz', icon: 'Landmark', color: 'bg-indigo-600', baseBalance: 2000000 },
      { id: 'Wave', name: 'Wave', icon: 'PhoneCall', color: 'bg-sky-500', baseBalance: 1000000 },
      { id: 'Cb', name: 'Cb', icon: 'Landmark', color: 'bg-violet-600', baseBalance: 1200000 }
    ];
  }

  const balances: Record<string, number> = {};
  activeAccounts.forEach(acc => {
    balances[acc.id] = acc.baseBalance;
  });

  transactions
    .map((tx) => normalizeTransaction(tx))
    .forEach((t) => {
      if (balances[t.account] !== undefined) {
        if (t.transactionType === 'owner') {
          if (t.ownerCategory === 'income' || t.ownerCategory === 'money_in') {
            balances[t.account] += t.amount;
          } else if (t.ownerCategory === 'expense' || t.ownerCategory === 'money_out') {
            balances[t.account] -= t.amount;
          } else if (t.ownerCategory === 'transfer') {
            if (t.ownerTransferDirection === 'business_to_owner') {
              balances[t.account] -= t.amount;
            } else {
              balances[t.account] += t.amount;
            }
          }
        } else if (t.transactionType === 'bill') {
          balances[t.account] -= t.amount;
        } else if (t.transactionType === 'transfer') {
          balances[t.account] -= t.amount;
          if (t.toAccount && balances[t.toAccount] !== undefined) {
            balances[t.toAccount] += t.amount;
          }
        } else if (t.category === 'Integral Bought') {
          balances[t.account] += t.amount;
        } else if (t.category === 'Integral Returned') {
          balances[t.account] -= t.amount;
        }
      }
    });

  return balances;
}

export function formatMMK(amount: number): string {
  return new Intl.NumberFormat('en-US').format(amount) + ' MMK';
}

export function formatTransactionDateTime(dateTimeStr: string) {
  const datePart = dateTimeStr.substring(0, 10);
  const timePart = dateTimeStr.length > 10 ? dateTimeStr.substring(11, 16) : '00:00';

  // Format date part: YYYY-MM-DD -> DD Jul YYYY
  const parts = datePart.split('-');
  let displayDate = datePart;
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (monthIndex >= 0 && monthIndex < 12) {
      displayDate = `${day} ${months[monthIndex]} ${year}`;
    }
  }

  // Format time part: "HH:mm" -> "hh:mm AM/PM"
  const timeParts = timePart.split(':');
  let displayTime = '';
  if (timeParts.length === 2) {
    let hour = parseInt(timeParts[0], 10);
    const minute = timeParts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12; // the hour '0' should be '12'
    displayTime = `${String(hour).padStart(2, '0')}:${minute} ${ampm}`;
  } else {
    displayTime = '12:00 AM';
  }

  return {
    date: displayDate,
    time: displayTime,
    full: `${displayDate} ${displayTime}`
  };
}
