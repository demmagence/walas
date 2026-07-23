export default function DashboardLoading() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8 space-y-8 max-w-7xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-64 bg-muted rounded-lg" />
        <div className="h-4 w-48 bg-muted rounded mt-2" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-5 w-5 bg-muted rounded" />
            </div>
            <div className="h-9 w-16 bg-muted rounded" />
            <div className="h-2 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-40 bg-muted rounded" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-muted rounded-lg" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-48 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
