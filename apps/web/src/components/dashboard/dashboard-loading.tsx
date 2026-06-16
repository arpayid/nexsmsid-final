import { SkeletonCard } from "@nexsmsid/ui";

export function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-72 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} lines={2} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <div className="grid gap-4 lg:grid-cols-2">
            <SkeletonCard lines={5} />
            <SkeletonCard lines={5} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={4} />
          </div>
        </div>
        <div className="space-y-4 xl:col-span-4">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={3} />
        </div>
      </div>
      <SkeletonCard lines={3} />
      <SkeletonCard lines={4} />
    </div>
  );
}
