import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div 
      className={`animate-pulse bg-text-muted/10 rounded-lg ${className}`}
    />
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card p-8 rounded-3xl space-y-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-64" />
          </div>
          <Skeleton className="h-12 w-48 rounded-xl" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-8 rounded-[32px] space-y-6">
              <div className="flex justify-between">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <Skeleton className="w-24 h-6 rounded-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="pt-4 border-t border-border-soft flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const StrategySkeleton = () => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="w-full lg:w-96 border-r border-border-soft p-8 space-y-8">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 border border-border-soft rounded-2xl space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 p-12 space-y-12">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-3/4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card p-8 rounded-3xl space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
          <div className="glass-card p-8 rounded-3xl space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const IntentSkeleton = () => {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-1/2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass-card p-8 rounded-3xl space-y-6">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
};
