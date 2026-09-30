import React from 'react';
import Card from '../ui/Card';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  change,
  trend = 'up',
  period = 'vs last month',
  icon: Icon,
  color = 'brand',
}) => {
  const isUp = trend === 'up';

  const colorStyles = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
  };

  return (
    <Card hover className="p-5 flex flex-col justify-between relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        {Icon && (
          <div
            className={`p-2.5 rounded-xl ${colorStyles[color] || colorStyles.brand} transition-transform group-hover:scale-110 duration-200`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
          {value}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
              isUp
                ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/60'
                : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/60'
            }`}
          >
            {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {change}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{period}</span>
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
