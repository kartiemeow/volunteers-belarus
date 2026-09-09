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

export function DirectionCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-7">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
        <Skeleton className="h-6 w-2/3" />
      </div>
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <div className="mt-5">
        <Skeleton className="h-3 w-28" />
        <div className="mt-2 space-y-1.5">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-4/5" />
          ))}
        </div>
      </div>
      <div className="mt-5">
        <Skeleton className="h-3 w-24" />
        <div className="mt-2 space-y-1.5">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
      <Skeleton className="mt-6 h-4 w-56" />
    </div>
  );
}

export function DirectionsPageSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <Skeleton className="mx-auto h-9 w-72" />
        <Skeleton className="mx-auto mt-3 h-4 w-full max-w-xl" />
        <Skeleton className="mx-auto mt-2 h-4 w-2/3 max-w-lg" />
      </div>
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: cards }, (_, i) => (
          <DirectionCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <div className="h-12 w-full max-w-xl animate-pulse rounded-md bg-white/40" />
            <div className="mt-3 h-12 w-3/4 animate-pulse rounded-md bg-white/40" />
            <div className="mt-6 h-4 w-full max-w-xl animate-pulse rounded-md bg-white/25" />
            <div className="mt-3 h-4 w-2/3 animate-pulse rounded-md bg-white/25" />
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="h-12 w-40 animate-pulse rounded-xl bg-white/40" />
              <div className="h-12 w-44 animate-pulse rounded-xl bg-white/25" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="text-center md:text-left">
              <Skeleton className="mx-auto h-8 w-20 md:mx-0" />
              <Skeleton className="mx-auto mt-2 h-3.5 w-28 md:mx-0" />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-96 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="mt-4 h-5 w-3/4" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-5/6" />
              <Skeleton className="mt-4 h-4 w-32" />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-96 max-w-full" />
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <OpportunityCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}