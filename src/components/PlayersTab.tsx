import { useState, useMemo, memo } from 'react';
import { HelpCircle, Search, User, Plus, Briefcase, Phone } from 'lucide-react';
import { Player, Transaction } from '../types';
import { ActivePlayerSummary, formatMMK, formatTransactionDateTime, getActivePlayers, normalizeTransaction } from '../data';

interface PlayersTabProps {
  players: Player[];
  transactions: Transaction[];
  onAddPlayer: () => void;
  onOpenPlayerDetails: (player: Player) => void;
}

function PlayersTab({
  players,
  transactions,
  onAddPlayer,
  onOpenPlayerDetails,
}: PlayersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activePeriod, setActivePeriod] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');

  const allPlayerSummaries = useMemo(() => {
    const normalized = transactions.map((tx) => normalizeTransaction(tx));

    return players
      .map((player) => {
        const playerTxs = normalized
          .filter((tx) => tx.transactionType === 'player' && tx.playerId === player.id)
          .sort((a, b) => b.date.localeCompare(a.date));

        if (playerTxs.length === 0) {
          return {
            playerId: player.playerId,
            nickName: player.nickName,
            agency: player.agency,
            phoneNumber: player.phoneNumber || '',
            category: 'No Activity',
            amount: 0,
            date: 'N/A',
            time: 'N/A',
            rawDate: '',
          } as ActivePlayerSummary;
        }

        const lastTx = playerTxs[0];
        const formatted = formatTransactionDateTime(lastTx.date);

        return {
          playerId: player.playerId,
          nickName: player.nickName,
          agency: player.agency,
          phoneNumber: player.phoneNumber || '',
          category: lastTx.category,
          amount: lastTx.amount,
          date: formatted.date,
          time: formatted.time,
          rawDate: lastTx.date,
        };
      })
      .sort((a, b) => b.rawDate.localeCompare(a.rawDate));
  }, [players, transactions]);

  const displayedPlayers = useMemo(
    () =>
      activePeriod === 'all'
        ? allPlayerSummaries
        : getActivePlayers(players, transactions, activePeriod),
    [players, transactions, activePeriod, allPlayerSummaries]
  );

  const filteredPlayers = displayedPlayers.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      !query ||
      p.playerId.toLowerCase().includes(query) ||
      p.nickName.toLowerCase().includes(query) ||
      p.agency.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4 pb-24">
      {/* Title Header with Help Icon */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-slate-800 font-display">Player Information</h2>
          <button
            onClick={() => alert('Players page displays current active player details and recent transaction history.')}
            className="rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors p-0.5 cursor-pointer"
          >
            <HelpCircle className="h-4.5 w-4.5" />
          </button>
        </div>

        <button
          onClick={onAddPlayer}
          className="flex items-center space-x-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs hover:shadow-sm cursor-pointer transition-all"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Add Player</span>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {([
          { key: 'all', label: 'All Players', subtitle: 'Show every player' },
          { key: 'daily', label: 'Daily', subtitle: 'Tap to filter players' },
          { key: 'weekly', label: 'Weekly', subtitle: 'Tap to filter players' },
          { key: 'monthly', label: 'Monthly', subtitle: 'Tap to filter players' },
        ] as const).map(({ key, label, subtitle }) => {
          const count =
            key === 'all'
              ? players.length
              : getActivePlayers(players, transactions, key).length;
          const isSelected = activePeriod === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActivePeriod(key)}
              className={`rounded-3xl border p-4 text-left transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              <p className="text-[10px] uppercase tracking-[0.24em] font-semibold mb-2">{label}</p>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Search Input Bar */}
      <div className="relative rounded-xl bg-white border border-slate-100 shadow-3xs">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4.5 w-4.5 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by ID, nickname, or agency..."
          className="block w-full pl-10 pr-4 py-2.5 bg-transparent text-slate-800 placeholder-slate-400 text-sm focus:outline-hidden"
        />
      </div>

      {/* Grid of cards */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-20 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white p-6 shadow-3xs">
          <HelpCircle className="h-10 w-10 text-slate-300 stroke-1 mx-auto mb-2" />
          <p className="text-sm font-medium">{activePeriod === 'all' ? 'No players found' : 'No active players found'}</p>
          <p className="text-xs">{activePeriod === 'all' ? 'Try a different search term' : 'Try a different active period or search term'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredPlayers.map((player) => (
            <button
              key={player.playerId}
              type="button"
              onClick={() => onOpenPlayerDetails(players.find((p) => p.playerId === player.playerId) || players[0])}
              className="group bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-3xs hover:shadow-2xs transition-all duration-200 p-4 text-left"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{player.playerId}</p>
                  <p className="text-xs text-slate-500">{player.nickName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Agency</p>
                  <p className="text-sm font-semibold text-slate-800">{player.agency}</p>
                </div>
              </div>

              <div className="mt-3 space-y-3 text-sm text-slate-700">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Phone Number</p>
                  <p className="font-semibold text-slate-800">{player.phoneNumber || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Last Transaction</p>
                    <p className="font-semibold text-slate-800">{player.category}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Last Integral</p>
                    <p className="font-semibold text-slate-800">{player.amount >= 0 ? '+' : '-'}{formatMMK(Math.abs(player.amount)).split(' ')[0]}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Last Activity Date</p>
                    <p className="font-semibold text-slate-800">{player.date}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Last Activity Time</p>
                    <p className="font-semibold text-slate-800">{player.time}</p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(PlayersTab);
