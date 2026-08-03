import { useState, useMemo, memo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, RefreshCcw, PieChart as PieIcon } from 'lucide-react';
import { Transaction, Player, Account } from '../types';
import { formatMMK, getAccountBalances, getAgencySummaries, getPlayersWithTotals, normalizeTransaction } from '../data';

interface AnalyticsTabProps {
  transactions: Transaction[];
  players: Player[];
  accounts: Account[];
}

function AnalyticsTab({ transactions, players, accounts }: AnalyticsTabProps) {
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 6, 10)); // July 2026
  const [activeSubTab, setActiveSubTab] = useState<'flow' | 'categories'>('flow');

  const handlePrevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const monthLabel = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Filter transactions of the selected month
  const monthlyTxs = useMemo(
    () =>
      transactions
        .map((tx) => normalizeTransaction(tx))
        .filter((t) => {
          const tDate = new Date(t.date.substring(0, 10));
          return (
            tDate.getFullYear() === selectedDate.getFullYear() &&
            tDate.getMonth() === selectedDate.getMonth()
          );
        }),
    [transactions, selectedDate]
  );

  const totalBought = monthlyTxs
    .filter((t) => t.transactionType === 'player' && t.category === 'Integral Bought')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReturned = monthlyTxs
    .filter((t) => t.transactionType === 'player' && t.category === 'Integral Returned')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalNet = totalBought - totalReturned;

  // Group by day for the chart
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const dailyData: { day: number; bought: number; returned: number }[] = Array.from(
    { length: daysInMonth },
    (_, i) => ({
      day: i + 1,
      bought: 0,
      returned: 0,
    })
  );

  monthlyTxs.forEach((tx) => {
    if (tx.transactionType !== 'player') return;
    const day = new Date(tx.date.substring(0, 10)).getDate();
    if (day >= 1 && day <= daysInMonth) {
      if (tx.category === 'Integral Bought') {
        dailyData[day - 1].bought += tx.amount;
      } else if (tx.category === 'Integral Returned') {
        dailyData[day - 1].returned += tx.amount;
      }
    }
  });

  // Consolidate into 4-day buckets for chart readability
  const bucketSize = 4;
  const chartBuckets: { label: string; bought: number; returned: number }[] = [];

  for (let i = 0; i < daysInMonth; i += bucketSize) {
    const end = Math.min(i + bucketSize, daysInMonth);
    const label = `Jul ${String(i + 1).padStart(2, '0')}`;
    let boughtSum = 0;
    let returnedSum = 0;

    for (let k = i; k < end; k++) {
      boughtSum += dailyData[k].bought;
      returnedSum += dailyData[k].returned;
    }

    chartBuckets.push({
      label,
      bought: boughtSum,
      returned: returnedSum,
    });
  }

  // Calculate Averages
  const activeDays = new Set(monthlyTxs.map((t) => t.date.substring(0, 10))).size || 1;
  const avgDailyBought = totalBought / daysInMonth;
  const avgDailyReturned = totalReturned / daysInMonth;

  // Categories expense distributions
  const accountExpenses = monthlyTxs
    .filter((t) => t.transactionType === 'player' && t.category === 'Integral Returned')
    .reduce((acc, t) => {
      acc[t.account] = (acc[t.account] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const expenseItems = Object.entries(accountExpenses).map(([account, amount]) => ({
    account,
    amount,
    percentage: totalReturned > 0 ? Math.round((amount / totalReturned) * 100) : 0,
  }));

  const maxChartValue = Math.max(
    ...chartBuckets.map((b) => Math.max(b.bought, b.returned)),
    10000 // default minimum scale
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 font-display">Analytics</h2>
      </div>

      {/* Date Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 bg-white px-3.5 py-2 rounded-xl border border-slate-100 shadow-3xs">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">{monthLabel}</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handlePrevMonth}
            className="p-2 bg-white border border-slate-100 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer shadow-3xs transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 bg-white border border-slate-100 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer shadow-3xs transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Sub Tabs Toggle */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
        <button
          onClick={() => setActiveSubTab('flow')}
          className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeSubTab === 'flow'
              ? 'bg-white text-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <RefreshCcw className="h-3.5 w-3.5 inline mr-1.5" />
          Cash Flow
        </button>
        <button
          onClick={() => setActiveSubTab('categories')}
          className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeSubTab === 'categories'
              ? 'bg-white text-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <PieIcon className="h-3.5 w-3.5 inline mr-1.5" />
          Accounts Outflow
        </button>
      </div>

      {activeSubTab === 'flow' ? (
        <>
          {/* Chart Wrapper */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cash flow over time</span>
              <div className="flex items-center space-x-3 text-[10px] font-bold">
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />Bought</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5" />Returned</span>
              </div>
            </div>

            {/* SVG Custom Bar Chart */}
            <div className="h-44 w-full flex items-end justify-between px-1 border-b border-slate-150 pb-2.5">
              {chartBuckets.map((b, idx) => {
                const boughtHeight = Math.max((b.bought / maxChartValue) * 100, 2);
                const returnedHeight = Math.max((b.returned / maxChartValue) * 100, 2);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center space-y-2 group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-slate-850 text-white text-[9px] rounded-sm py-1 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-md font-sans whitespace-nowrap">
                      <div>Bought: {formatMMK(b.bought).split(' ')[0]}</div>
                      <div>Returned: {formatMMK(b.returned).split(' ')[0]}</div>
                    </div>

                    <div className="w-full flex justify-center items-end space-x-1.5 h-32">
                      <div
                        style={{ height: `${boughtHeight}%` }}
                        className="w-2 rounded-t-xs bg-emerald-500 transition-all duration-500"
                      />
                      <div
                        style={{ height: `${returnedHeight}%` }}
                        className="w-2 rounded-t-xs bg-red-400 transition-all duration-500"
                      />
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400 font-sans">{b.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cash flow overview */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cash flow</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Income</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 font-sans">{formatMMK(totalBought)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Expenses</span>
                </div>
                <span className="text-xs font-bold text-red-500 font-sans">{formatMMK(totalReturned)}</span>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Total:</span>
                <span className={`text-sm font-black font-sans ${totalNet >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {formatMMK(totalNet)}
                </span>
              </div>
            </div>
          </div>

          {/* Averages */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Day</span>
                <div className="space-x-2 text-right font-sans">
                  <span className="font-bold text-emerald-600">{formatMMK(Math.round(avgDailyBought)).split(' ')[0]}</span>
                  <span className="font-bold text-red-500">{formatMMK(Math.round(avgDailyReturned)).split(' ')[0]}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Week</span>
                <div className="space-x-2 text-right font-sans">
                  <span className="font-bold text-emerald-600">{formatMMK(Math.round(avgDailyBought * 7)).split(' ')[0]}</span>
                  <span className="font-bold text-red-500">{formatMMK(Math.round(avgDailyReturned * 7)).split(' ')[0]}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Month</span>
                <div className="space-x-2 text-right font-sans">
                  <span className="font-bold text-emerald-600">{formatMMK(totalBought).split(' ')[0]}</span>
                  <span className="font-bold text-red-500">{formatMMK(totalReturned).split(' ')[0]}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Categories expense distribution layout from Screenshot 3 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-6">
            <div className="flex flex-col items-center justify-center py-6">
              {/* Circular representation */}
              <div className="relative w-40 h-40 rounded-full border-12 border-slate-100 flex flex-col items-center justify-center bg-slate-50/50">
                <span className="text-xs font-bold text-red-500 font-sans">-{formatMMK(totalReturned).split(' ')[0]}</span>
                <span className="text-[10px] font-semibold text-emerald-600 font-sans mt-0.5">+{formatMMK(totalBought).split(' ')[0]}</span>
              </div>
            </div>

            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outflow by Accounts</h3>
              {expenseItems.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-100 rounded-xl">
                  No expense transactions found for this month.
                </div>
              ) : (
                expenseItems.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">{item.account}</span>
                      <span className="font-bold text-slate-800 font-sans">{formatMMK(item.amount)}</span>
                    </div>
                    {/* Progress slider bar */}
                    <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${item.percentage}%` }}
                        className="h-full bg-red-400 rounded-full transition-all duration-300"
                      />
                    </div>
                    <div className="text-right text-[10px] font-semibold text-slate-400 font-sans uppercase tracking-wider">
                      {item.percentage}% of total returns
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default memo(AnalyticsTab);
