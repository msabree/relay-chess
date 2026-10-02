import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLeaderboard, useUserPosition } from '@/hooks/useLeaderboard';
import { useSession } from 'next-auth/react';
import { useUser } from '@/hooks/useUser';
import FirstPlace from '@/icons/FirstPlace';
import SecondPlace from '@/icons/SecondPlace';
import ThirdPlace from '@/icons/ThirdPlace';
import dynamic from 'next/dynamic';

import {
  ColumnDef,
  PaginationState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { LeaderboardRow } from '@/types';

const Flame = dynamic(() => import('lucide-react').then(mod => mod.Flame), { ssr: false });
const Star = dynamic(() => import('lucide-react').then(mod => mod.Star), { ssr: false });

interface LeaderboardProps {
  showHeader?: boolean;
  showPagination?: boolean;
  pageSize?: number;
}

type PeriodType = 'all-time' | 'weekly' | 'monthly' | 'daily';

const Leaderboard = ({showHeader, showPagination, pageSize = 25}: LeaderboardProps) => {  
  const router = useRouter();
  const { data: session } = useSession();
  const userQuery = useUser();
  
  // Get period from URL params, default to 'all-time'
  const getPeriodFromUrl = (): PeriodType => {
    if (!router.isReady) return 'all-time';
    const range = router.query.range as string;
    const period = router.query.period as string;
    const urlPeriod = range || period; // Support both 'range' and 'period' params
    
    if (urlPeriod && ['all-time', 'weekly', 'monthly', 'daily'].includes(urlPeriod)) {
      return urlPeriod as PeriodType;
    }
    return 'all-time';
  };
  
  const [period, setPeriod] = useState<PeriodType>('all-time');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  });
  
  // Sync period with URL params on mount and when URL changes
  useEffect(() => {
    if (!router.isReady) return;
    const urlPeriod = getPeriodFromUrl();
    if (urlPeriod !== period) {
      setPeriod(urlPeriod);
    }
  }, [router.isReady, router.query.range, router.query.period]);
  
  // Update URL when period changes (without page reload)
  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, range: newPeriod },
      },
      undefined,
      { shallow: true } // Shallow routing - doesn't reload the page
    );
  };
  
  const leaderboard = useLeaderboard(pagination.pageIndex, pagination.pageSize, period);
  const userPosition = useUserPosition(userQuery.data?._id, period);
  
  // Reset to first page when period changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [period]);
  
  // Navigate to user's page when position is loaded
  useEffect(() => {
    if (userPosition.data && showPagination) {
      const userPage = Math.floor((userPosition.data.rank - 1) / pagination.pageSize);
      if (userPage !== pagination.pageIndex) {
        // Optionally auto-navigate - commented out for now
        // setPagination(prev => ({ ...prev, pageIndex: userPage }));
      }
    }
  }, [userPosition.data, pagination.pageSize, showPagination]);
  
  const columns = useMemo<ColumnDef<LeaderboardRow>[]>(
    () => [
      {
        header: "Rank",
        accessorKey: '_rank',
        size: 80,
      },
      {
        header: "Player",
        accessorKey: '_userId',
        size: 200,
        cell: ({ getValue }) => {
          const userId = getValue() as string;
          return <span className="font-medium text-fg">{userId}</span>;
        },
      },
      {
        id: 'record',
        header: "Record",
        accessorKey: 'wins',
        size: 200,
        cell: ({ row }) => {
          const { wins, losses, draws } = row.original;
          return (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <span className="text-success font-bold text-xs sm:text-sm">{wins}W</span>
              <span className="text-fg-subtle">-</span>
              <span className="text-danger font-bold text-xs sm:text-sm">{losses}L</span>
              <span className="text-fg-subtle">-</span>
              <span className="text-fg-muted font-bold text-xs sm:text-sm">{draws}D</span>
            </div>
          );
        },
      },
      {
        id: 'streaks',
        header: "Streaks",
        accessorKey: 'currentStreak',
        size: 150,
        cell: ({ row }) => {
          const { currentStreak = 0, highestStreak = 0 } = row.original;
          return (
            <div className="flex items-center gap-2 sm:gap-3">
              {currentStreak > 0 && (
                <div className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-ink" />
                  <span className="text-accent-ink font-bold text-xs sm:text-sm">{currentStreak}</span>
                </div>
              )}
              {highestStreak > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-ink" />
                  <span className="text-accent-ink font-bold text-xs">{highestStreak}</span>
                </div>
              )}
              {currentStreak === 0 && highestStreak === 0 && (
                <span className="text-fg-subtle text-xs">-</span>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: leaderboard.data?.rows ?? [],
    columns,
    // pageCount: dataQuery.data?.pageCount ?? -1, //you can now pass in `rowCount` instead of pageCount and `pageCount` will be calculated internally (new in v8.13.0)
    rowCount: leaderboard.data?.total ?? -1, // new in v8.13.0 - alternatively, just pass in `pageCount` directly
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, //we're doing manual "server-side" pagination
    // getPaginationRowModel: getPaginationRowModel(), // If only doing manual pagination, you don't need this
    debugTable: true,
  });

  const currentUserId = userQuery.data?._id;
  const userRank = userPosition.data?.rank;
  const isUserRow = (row: LeaderboardRow) => {
    if (!currentUserId || !userPosition.data) return false;
    return row._userId === userPosition.data.user._userId;
  };

  return (
    <div className="mx-auto mt-5 w-[95%] sm:w-[90%] md:w-[80%] lg:w-[70%] max-w-7xl space-y-4 sm:space-y-6">
      {showHeader && (
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-fg mb-1">{"Leaderboard"}</h1>
              <p className="text-fg/40 text-xs font-medium tracking-widest uppercase">{"Top Players & Rankings"}</p>
            </div>
            
            {/* Period Selector - Horizontal scroll on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 scrollbar-hide">
              {(['all-time', 'weekly', 'monthly', 'daily'] as PeriodType[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0 ${
                    period === p
                      ? 'bg-accent text-accent-fg'
                      : 'bg-fg/5 text-fg/60 hover:text-fg hover:bg-fg/10 border border-line'
                  }`}
                >
                  {p === 'all-time' ? 'All Time' : p === 'weekly' ? 'Weekly' : p === 'monthly' ? 'Monthly' : 'Daily'}
                </button>
              ))}
            </div>
          </div>
          
          {/* User Position Banner */}
          {session && userPosition.data && (
            <div className="mb-4 p-3 sm:p-4 rounded-xl bg-accent/20 border border-accent/30">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-xl sm:text-2xl font-black text-fg italic">#{userRank}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-fg font-bold text-sm sm:text-base">{"Your Rank"}</div>
                  <div className="text-fg/60 text-xs sm:text-sm truncate">
                    {userPosition.data.user.wins}W - {userPosition.data.user.losses}L - {userPosition.data.user.draws}D
                    {userPosition.data.user.currentStreak && userPosition.data.user.currentStreak > 0 && (
                      <span className="ml-2 text-accent-ink">
                        🔥 {`${userPosition.data.user.currentStreak} streak`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Leaderboard Table */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-line bg-surface p-1">
        {/* Subtle glow */}
        
        <div className="relative bg-surface rounded-[18px] sm:rounded-[22px] p-3 sm:p-6 border border-line">
          <div className="rounded-xl overflow-x-auto -mx-3 sm:mx-0">
            <div className="min-w-[600px] sm:min-w-0">
              <table className="w-full">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="border-b border-line">
                    {headerGroup.headers.map(header => {
                      const isStreaksHeader = header.id === 'streaks';
                      return (
                        <th 
                          key={header.id} 
                          colSpan={header.colSpan}
                          className={`px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-black text-accent-ink uppercase tracking-widest ${
                            isStreaksHeader ? 'hidden sm:table-cell' : ''
                          }`}
                        >
                          {header.isPlaceholder ? null : (
                            <div>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row, index) => {
                  const rank = row.original._rank;
                  const isTopThree = rank <= 3;
                  const isCurrentUser = isUserRow(row.original);
                  
                  return (
                    <tr 
                      key={row.id} 
                      className={`border-b border-line last:border-b-0 transition-all ${
                        isCurrentUser
                          ? 'bg-accent/20 border-l-4 border-l-cyan-400'
                          : isTopThree 
                            ? 'bg-gradient-to-r from-yellow-500/5 to-transparent hover:from-yellow-500/10' 
                            : 'hover:bg-fg/5'
                      }`}
                    >
                      {row.getVisibleCells().map(cell => {
                        const isRankCell = cell.column.id === '_rank';
                        const isPlayerCell = cell.column.id === '_userId';
                        
                        const isStreaksCell = cell.column.id === 'streaks';
                        return (
                          <td 
                            key={cell.id}
                            className={`px-3 sm:px-6 py-3 sm:py-4 ${
                              isTopThree ? 'text-fg' : 'text-fg/90'
                            } ${isStreaksCell ? 'hidden sm:table-cell' : ''}`}
                          >
                            {isRankCell ? (
                              <div className="flex items-center">
                                {rank === 1 ? (
                                  <div className="flex items-center justify-center">
                                    <FirstPlace />
                                  </div>
                                ) : rank === 2 ? (
                                  <div className="flex items-center justify-center">
                                    <SecondPlace />
                                  </div>
                                ) : rank === 3 ? (
                                  <div className="flex items-center justify-center">
                                    <ThirdPlace />
                                  </div>
                                ) : (
                                  <div className="text-fg-muted font-bold text-xs sm:text-sm">#{rank}</div>
                                )}
                              </div>
                            ) : isPlayerCell ? (
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`font-black italic tracking-tight truncate ${
                                  isTopThree ? 'text-fg' : 'text-fg/90'
                                }`}>
                                  {cell.getValue() as string}
                                </span>
                                {isTopThree && (
                                  <span className="px-1.5 sm:px-2 py-0.5 bg-accent/20 border border-accent/30 rounded text-[9px] sm:text-[10px] font-black text-accent-ink uppercase tracking-widest flex-shrink-0">
                                    {"Top 3"}
                                  </span>
                                )}
                              </div>
                            ) : (
                              flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
          
          {showPagination && (
            <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 flex-wrap">
                  <button
                    className="px-3 sm:px-4 py-2 rounded-xl bg-fg/5 hover:bg-fg/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-line text-fg font-bold text-xs sm:text-sm min-w-[44px]"
                    onClick={() => table.firstPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    {'<<'}
                  </button>
                  <button
                    className="px-3 sm:px-4 py-2 rounded-xl bg-fg/5 hover:bg-fg/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-line text-fg font-bold text-xs sm:text-sm min-w-[44px]"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    {'<'}
                  </button>
                  <span className="flex items-center gap-1 text-xs sm:text-sm text-fg-muted px-2">
                    <span className="text-fg/60 hidden sm:inline">{"Page"}</span>
                    <strong className="text-fg font-black">
                      {table.getState().pagination.pageIndex + 1} / {table.getPageCount().toLocaleString('en-US')}
                    </strong>
                  </span>
                  <button
                    className="px-3 sm:px-4 py-2 rounded-xl bg-fg/5 hover:bg-fg/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-line text-fg font-bold text-xs sm:text-sm min-w-[44px]"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    {'>'}
                  </button>
                  <button
                    className="px-3 sm:px-4 py-2 rounded-xl bg-fg/5 hover:bg-fg/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-line text-fg font-bold text-xs sm:text-sm min-w-[44px]"
                    onClick={() => table.lastPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    {'>>'}
                  </button>
                </div>

                <div className="flex items-center justify-center sm:justify-end gap-2">
                  <span className="text-xs sm:text-sm text-fg-muted hidden sm:inline">{"Show"}</span>
                  <select
                    value={table.getState().pagination.pageSize}
                    onChange={e => {
                      table.setPageSize(Number(e.target.value));
                    }}
                    className="px-3 py-2 rounded-xl bg-fg/5 text-fg border border-line focus:outline-none focus:ring-2 focus:ring-accent/50 font-medium text-xs sm:text-sm min-h-[44px]"
                  >
                    {[10, 20, 30, 40, 50].map(size => (
                      <option key={size} value={size} className="bg-raised">
                        {size}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs sm:text-sm text-fg-muted hidden sm:inline">{"entries"}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
                <div className="text-fg-muted text-center sm:text-left">
                  {"Showing"} <span className="text-fg font-bold">{table.getRowModel().rows.length.toLocaleString('en-US')}</span> {"of"}{' '}
                  <span className="text-fg font-bold">{leaderboard.data?.total.toLocaleString('en-US')}</span> {"entries"}
                </div>
                {leaderboard.isFetching && (
                  <div className="text-accent-ink flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold uppercase tracking-widest">{"Loading..."}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;