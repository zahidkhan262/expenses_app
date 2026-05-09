import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <Skeleton className="h-28 w-full rounded-[var(--radius)]" />
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-[var(--radius)]" />
        ))}
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-80 rounded-[var(--radius)]" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-44 w-full rounded-[var(--radius)]" />
          <Skeleton className="h-64 w-full rounded-[var(--radius)]" />
        </div>
      </div>
    </div>
  );
}

