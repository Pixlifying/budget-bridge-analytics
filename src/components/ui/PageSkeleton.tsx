import { Skeleton } from '@/components/ui/skeleton';

interface PageSkeletonProps {
  type?: 'cards' | 'table' | 'form';
}

const PageSkeleton = ({ type = 'cards' }: PageSkeletonProps) => {
  return (
    <div className="page-transition">
      {/* Header skeleton */}
      <div className="mx-2 sm:mx-4 mt-2 rounded-2xl bg-sidebar p-4 sm:p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48 bg-sidebar-accent/40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-full bg-sidebar-accent/40" />
            <Skeleton className="h-9 w-9 rounded-full bg-sidebar-accent/40" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-40 bg-sidebar-accent/40" />
          <Skeleton className="h-9 w-24 bg-sidebar-accent/40" />
          <Skeleton className="h-9 w-24 bg-sidebar-accent/40" />
        </div>
      </div>

      <div className="px-3 sm:px-6 md:px-8 pb-8 mt-6">
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        {type === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        )}

        {type === 'table' && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <Skeleton className="h-5 w-40" />
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b border-border/50">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {type === 'form' && (
          <div className="bg-card rounded-xl border border-border p-6 space-y-4 mb-6">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        )}
      </div>
    </div>
  );
};

export default PageSkeleton;
