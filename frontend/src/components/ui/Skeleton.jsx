import React from 'react';

export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-800/80 ${className}`}
      {...props}
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-20 mt-1" />
      <div className="flex items-center gap-2 mt-2">
        <Skeleton className="h-4 w-12 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
};

export const TableRowSkeleton = () => {
  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800/60">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <Skeleton className="h-3.5 w-28" />
      </td>
      <td className="py-4 px-4">
        <Skeleton className="h-5 w-16 rounded-full" />
      </td>
      <td className="py-4 px-4">
        <Skeleton className="h-3.5 w-16" />
      </td>
      <td className="py-4 px-4 text-right">
        <Skeleton className="h-3.5 w-12 ml-auto" />
      </td>
    </tr>
  );
};

export default Skeleton;
