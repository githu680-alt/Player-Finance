import { useState, useMemo, memo } from 'react';
import { Briefcase, Users, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Player, Transaction } from '../types';
import { getAgencySummaries, getActivePlayers, formatMMK, ActivityPeriod } from '../data';

interface AgencyTabProps {
  players: Player[];
  transactions: Transaction[];
}

function AgencyTab({ players, transactions }: AgencyTabProps) {
  const summaries = useMemo(() => getAgencySummaries(players, transactions), [players, transactions]);
  const [activePeriod, setActivePeriod] = useState<ActivityPeriod>('daily');
  const dailyActive = useMemo(() => getActivePlayers(players, transactions, 'daily').length, [players, transactions]);
  const weeklyActive = useMemo(() => getActivePlayers(players, transactions, 'weekly').length, [players, transactions]);
  const monthlyActive = useMemo(() => getActivePlayers(players, transactions, 'monthly').length, [players, transactions]);
  const activePlayers = useMemo(() => getActivePlayers(players, transactions, activePeriod), [players, transactions, activePeriod]);

  // Compute grand aggregates
  const totalAgencies = summaries.length;
  const totalPlayers = players.length;
  const totalBought = summaries.reduce((sum, s) => sum + s.integralBought, 0);
  const totalReturned = summaries.reduce((sum, s) => sum + s.integralReturned, 0);

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 font-display">Agencies Overview</h2>
        <p className="text-xs text-slate-400 mt-0.5">Consolidated statistics by player agency connections</p>
      </div>

      {/* Aggregate stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-3xs">
          <div className="flex items-center space-x-2 text-slate-400 mb-1">
            <Briefcase className="h-4.5 w-4.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Agencies</span>
          </div>
          <span className="text-lg font-extrabold text-slate-800 font-sans">{totalAgencies}</span>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-3xs">
          <div className="flex items-center space-x-2 text-slate-400 mb-1">
            <Users className="h-4.5 w-4.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Players</span>
          </div>
          <span className="text-lg font-extrabold text-slate-800 font-sans">{totalPlayers}</span>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-3xs">
          <div className="flex items-center space-x-2 text-slate-400 mb-1">
            <ArrowUpRight className="h-4.5 w-4.5 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Total Bought</span>
          </div>
          <span className="text-sm font-extrabold text-emerald-600 font-sans">{formatMMK(totalBought).split(' ')[0]}</span>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-3xs">
          <div className="flex items-center space-x-2 text-slate-400 mb-1">
            <ArrowDownLeft className="h-4.5 w-4.5 text-red-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Total Returned</span>
          </div>
          <span className="text-sm font-extrabold text-red-500 font-sans">{formatMMK(totalReturned).split(' ')[0]}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setActivePeriod('daily')}
          className={`bg-white border ${activePeriod === 'daily' ? 'border-blue-600 shadow-md' : 'border-slate-100'} rounded-xl p-4 shadow-3xs text-left transition-all cursor-pointer`}
        >
          <div className="flex items-center justify-between mb-3 text-slate-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Daily Active Players</span>
            <span className="text-xs text-slate-400">Today</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{dailyActive}</div>
        </button>

        <button
          type="button"
          onClick={() => setActivePeriod('weekly')}
          className={`bg-white border ${activePeriod === 'weekly' ? 'border-blue-600 shadow-md' : 'border-slate-100'} rounded-xl p-4 shadow-3xs text-left transition-all cursor-pointer`}
        >
          <div className="flex items-center justify-between mb-3 text-slate-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Weekly Active Players</span>
            <span className="text-xs text-slate-400">This week</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{weeklyActive}</div>
        </button>

        <button
          type="button"
          onClick={() => setActivePeriod('monthly')}
          className={`bg-white border ${activePeriod === 'monthly' ? 'border-blue-600 shadow-md' : 'border-slate-100'} rounded-xl p-4 shadow-3xs text-left transition-all cursor-pointer`}
        >
          <div className="flex items-center justify-between mb-3 text-slate-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Monthly Active Players</span>
            <span className="text-xs text-slate-400">This month</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{monthlyActive}</div>
        </button>
      </div>

      <div className="mt-4 bg-white border border-slate-100 rounded-3xl shadow-3xs p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Players</h3>
            <p className="text-xs text-slate-400">Showing players with player transactions in the selected activity window.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['daily', 'weekly', 'monthly'] as ActivityPeriod[]).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setActivePeriod(period)}
                className={`px-3 py-2 text-xs font-semibold rounded-2xl border transition-all ${
                  activePeriod === period ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {period === 'daily' ? 'Daily' : period === 'weekly' ? 'Weekly' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {activePlayers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No active players found for the selected period.
            </div>
          ) : (
            activePlayers.map((player) => (
              <div key={player.playerId} className="rounded-3xl border border-slate-100 p-4 shadow-sm bg-white">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{player.playerId}</span>
                      {player.nickName && player.nickName !== player.playerId ? (
                        <span className="text-xs text-slate-500">({player.nickName})</span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Agency: {player.agency}</div>
                <div className="mt-1 text-xs text-slate-500">Phone: {player.phoneNumber || 'No phone'}</div>
                  </div>

                  <div className="flex flex-col items-start gap-2 text-sm sm:items-end">
                    <span className="text-slate-600">Last Activity: {player.category}</span>
                    <span className="text-lg font-bold text-slate-900">{formatMMK(player.amount).split(' ')[0]}</span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Last Transaction</div>
                    <div className="font-semibold text-slate-900">{player.category}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Last Integral</div>
                    <div className="font-semibold text-slate-900">{formatMMK(player.amount).split(' ')[0]}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Last Activity Date</div>
                    <div>{player.date}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Last Activity Time</div>
                    <div>{player.time}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Agencies details list */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agency Rankings</h3>
        {summaries.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400 bg-white border border-slate-100 rounded-xl shadow-3xs">
            No agencies registered. Assign an agency to players to populate.
          </div>
        ) : (
          summaries.map((agency, index) => {
            const hasPositiveUsed = agency.integralUsed >= 0;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-3xs space-y-4 hover:border-slate-200 transition-all duration-200"
              >
                {/* Agency Name Banner */}
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Briefcase className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                        {agency.name}
                      </span>
                      <p className="text-[10px] text-slate-400 font-medium">Rank #{index + 1}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg text-slate-500 border border-slate-100">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold">{agency.playerCount} Players</span>
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                    <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">Bought</span>
                    <span className="text-xs font-bold font-sans text-emerald-600">
                      {formatMMK(agency.integralBought).split(' ')[0]}
                    </span>
                  </div>

                  <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                    <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">Returned</span>
                    <span className="text-xs font-bold font-sans text-red-500">
                      {formatMMK(agency.integralReturned).split(' ')[0]}
                    </span>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${
                    hasPositiveUsed 
                      ? 'bg-blue-50/40 border-blue-100 text-blue-700' 
                      : 'bg-amber-50/40 border-amber-100 text-amber-700'
                  }`}>
                    <span className={`block text-[9px] uppercase font-bold tracking-wider mb-0.5 ${
                      hasPositiveUsed ? 'text-blue-500' : 'text-amber-500'
                    }`}>Used</span>
                    <span className="text-xs font-bold font-sans">
                      {formatMMK(agency.integralUsed).split(' ')[0]}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default memo(AgencyTab);
