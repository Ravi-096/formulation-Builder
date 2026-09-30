import React, { useState, useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import { Search, Filter, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { TableRowSkeleton } from '../ui/Skeleton';

export const ActivityTable = ({
  activities = [],
  isLoading = false,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesSearch =
        act.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || act.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [activities, searchTerm, statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="success" dot size="sm">
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" dot size="sm">
            Pending
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="primary" dot size="sm">
            In Progress
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="danger" dot size="sm">
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            {status}
          </Badge>
        );
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle>Recent Activity & Transactions</CardTitle>
          <CardDescription>
            Live feed of operational events, audit events, and user actions
          </CardDescription>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-500' : ''}`} />
            <span>Refresh Feed</span>
          </button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search activity or user..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
            {['all', 'completed', 'pending', 'in_progress', 'failed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md capitalize font-medium transition-all ${
                  statusFilter === st
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                }`}
              >
                {st === 'in_progress' ? 'In Progress' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action & Details</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Amount / Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
              {isLoading ? (
                <>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </>
              ) : filteredActivities.length > 0 ? (
                filteredActivities.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-850/40 transition-colors group"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.user.avatar}
                          alt={item.user.name}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 bg-zinc-100 shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {item.user.name}
                          </p>
                          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                            {item.user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-medium text-zinc-800 dark:text-zinc-200">
                        {item.action}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-xs">
                        {item.details}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <p className="font-semibold font-mono text-zinc-900 dark:text-zinc-100">
                        {item.amount}
                      </p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center justify-end gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {item.timestamp}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-zinc-400" />
                      <p className="text-sm font-medium">No matching activity records found</p>
                      <p className="text-xs text-zinc-400">
                        Try adjusting your search keyword or active status filters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityTable;
