export default function AdminLoading() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <div className="h-8 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-36 bg-muted rounded mt-2" />
        </div>
        <div className="h-10 w-40 bg-muted rounded-lg" />
      </div>

      {/* Search skeleton */}
      <div className="mb-4">
        <div className="h-10 w-full bg-muted rounded-lg" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="bg-secondary px-6 py-3 flex gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-3 w-20 bg-muted rounded" />
          ))}
        </div>
        {/* Table rows */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="px-6 py-4 flex gap-8 border-t border-border"
          >
            <div className="h-4 w-28 bg-muted rounded" />
            <div className="h-4 w-36 bg-muted rounded" />
            <div className="h-4 w-16 bg-muted rounded" />
            <div className="h-4 w-8 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
