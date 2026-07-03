'use client';

export function FoodCardSkeleton() {
  return (
    <div className="bg-[rgba(10,9,18,0.4)] rounded-[24px] overflow-hidden border border-white/[0.05] shadow-xl">
      <div className="aspect-[4/3] bg-white/[0.03] animate-pulse border-b border-white/[0.02]" />
      <div className="p-5">
        <div className="h-5 bg-white/[0.04] rounded-lg animate-pulse mb-3 w-3/4" />
        <div className="h-4 bg-white/[0.03] rounded-lg animate-pulse w-1/2 mb-4" />
        <div className="h-6 bg-white/[0.04] rounded-lg animate-pulse w-1/3" />
      </div>
    </div>
  );
}

export function MenuGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <FoodCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function OrderTimelineSkeleton() {
  return (
    <div className="space-y-5 p-6 rounded-[24px] bg-[rgba(10,9,18,0.2)] border border-white/[0.03]">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.05] animate-pulse flex-shrink-0" />
          <div className="flex-1">
            <div className="h-4 bg-white/[0.04] rounded animate-pulse w-1/4 mb-2" />
            <div className="h-3 bg-white/[0.02] rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
