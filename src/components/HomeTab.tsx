import { useState } from 'react';
import { Eye, EyeOff, Settings, ChevronRight, Wallet, Landmark, PhoneCall, TrendingUp, TrendingDown, MoreVertical, Briefcase, SlidersHorizontal } from 'lucide-react';
import { Player, Transaction, Account } from '../types';
import { formatMMK, getAccountBalances, getAgencySummaries, normalizeTransaction } from '../data';
import { ACCOUNT_ICONS } from './AccountManagementModal';

interface HomeTabProps {
  players: Player[];
  transactions: Transaction[];
  accounts: Account[];
  onNavigateToTab: (tab: string) => void;
  onOpenAccountManagement: () => void;
}

export default function HomeTab({
  players,
  transactions,
  accounts,
  onNavigateToTab,
  onOpenAccountManagement,
}: HomeTabProps) {
  const [hideBalances, setHideBalances] = useState(false);

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
              <div
                key={acc.id}
                className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex items-center space-x-3.5 hover:border-slate-200 hover:bg-slate-100/50 transition-all"
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
              </div>
            );
          })}
        </div>
      </div>

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
    </div>
  );
}
