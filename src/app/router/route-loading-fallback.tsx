import { Skeleton } from "@/shared/ui/skeleton"

export function RouteLoadingFallback() {
  return (
    <main className="flex min-h-svh gap-4 bg-background p-4">
      <Skeleton className="hidden w-60 md:block" />
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <div className="grid flex-1 gap-3 md:grid-cols-2">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    </main>
  )
}
