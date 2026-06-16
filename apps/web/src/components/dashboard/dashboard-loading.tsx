import { SkeletonCard } from "@nexsmsid/ui";

export function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-44 animate-pulse rounded-2xl bg-gradient-to-br from-teal-200 to-emerald-300" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} lines={3} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonCard lines={6} />
        <SkeletonCard lines={6} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonCard lines={5} />
        <SkeletonCard lines={4} />
      </div>
    </div>
  );
}
