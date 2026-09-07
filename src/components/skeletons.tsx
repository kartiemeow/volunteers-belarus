import type { ComponentProps } from "react";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-gray-200/80 ${className ?? ""}`}
    />
  );
}

export function PageTitleSkeleton() {
  return (
    <div>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
    </div>
  );
}

export function FilterBarSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Skeleton className="h-10 w-36 rounded-lg" />
      <Skeleton className="h-10 w-40 rounded-lg" />
      <Skeleton className="h-10 w-56 rounded-lg" />
    </div>
  );
}

export function OpportunityCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <div className="mt-5 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function OrgCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function NewsItemSkeleton() {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-7">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-6 w-3/4" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
    </article>
  );
}

export function PageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <PageTitleSkeleton />
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, i) => (
          <OpportunityCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function OpportunitiesPageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <PageTitleSkeleton />
      <div className="mt-8">
        <FilterBarSkeleton />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, i) => (
          <OpportunityCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function OrganizationsPageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <PageTitleSkeleton />
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        {Array.from({ length: cards }, (_, i) => (
          <OrgCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function NewsPageSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <PageTitleSkeleton />
      <div className="mt-8 space-y-6">
        {Array.from({ length: items }, (_, i) => (
          <NewsItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}