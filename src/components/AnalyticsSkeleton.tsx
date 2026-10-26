import React from 'react';
import { Skeleton } from './ui/Skeleton.tsx';

export const AnalyticsSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16 pt-2 animate-pulse" aria-busy="true" aria-label="Loading analytics dashboard">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-80 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-[var(--bg-raised)] border border-[var(--border-subtle)] space-y-3">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Visual Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[var(--bg-raised)] border border-[var(--border-subtle)] space-y-4">
          <Skeleton className="h-5 w-44 rounded" />
          <div className="h-64 flex items-center justify-center">
            <Skeleton className="h-44 w-44 rounded-full" />
          </div>
          <div className="flex justify-center gap-4 pt-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--bg-raised)] border border-[var(--border-subtle)] space-y-4">
          <Skeleton className="h-5 w-48 rounded" />
          <div className="h-64 flex flex-col justify-around py-4">
            <Skeleton className="h-6 w-5/6 rounded" />
            <Skeleton className="h-6 w-3/4 rounded" />
            <Skeleton className="h-6 w-2/3 rounded" />
            <Skeleton className="h-6 w-1/2 rounded" />
          </div>
          <Skeleton className="h-3 w-48 mx-auto rounded" />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSkeleton;
