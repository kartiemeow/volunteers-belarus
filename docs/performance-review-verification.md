# Performance review fixes and verification

Branch: `imprfct/performance-review-fixes`, based on `origin/main` at `b6e544e`.

## Changes

- Application reservation, status changes, counters, hours and related notifications commit atomically. Serializable transactions retry PostgreSQL conflicts. Approving an already reserved last slot does not reserve twice; reactivating a rejected application reserves capacity; leaving DONE recalculates hours.
- Email verification creates the account/profile and consumes the verification record in one transaction. OTP generation uses `crypto.randomInt`; OTP logging and the fixed SMTP IP fallback are removed. SMTP DNS/connect/greeting/socket phases and HTTP delivery have timeouts. SMTP delivery is still awaited; this is not a durable mail queue.
- Public data has a 60-second cache with mutation-specific domain tags. Sessions and personal action areas remain outside that cache. React `cache` deduplicates detail/metadata loaders. The authenticated root layout still makes HTML dynamic.
- Home statistics and recent cards stream independently of the hero. Detail ratings and personal controls have separate Suspense boundaries. The unused Geist Mono preloads are removed.
- Catalog, news, organizations, volunteer history, organizer lists/attendance/participants and admin lists paginate at 24 records with an `id` tie-breaker. Counts are independent of the current page; volunteer tabs filter in PostgreSQL.
- Organizations use aggregate counts, distinct volunteer counts and grouped ratings. Participant reliability uses aggregates for the visible participants. Lists no longer fetch complete histories for statistics.
- The map opens on demand, uses the same filters as the catalog and receives one count plus at most three examples per city. Mobile cards precede the map. Search follows URL changes after Back; filters show pending state and retain scroll position.
- Notifications load a separate total unread count and refresh when opened. Mark-read updates local state without revalidating the root layout.
- Request-time attendance deadlines, internal Link navigation and finite confetti animation are corrected.

## Verification

- `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- 11 PostgreSQL integration tests: capacity races, duplicate transitions, last-slot approval, reactivation, ownership, decline notifications, concurrent hours, injected transactional failures, both registration profiles, invalid OTPs and unread counts.
- 8 Chromium E2E scenarios: search/Back/category, mobile layout/map, public pagination/dates/aggregates, organizer decisions and notifications, volunteer totals/tabs, admin pagination and route guards, news publish/unpublish/republish/delete cache invalidation, reschedule cache invalidation.
- E2E records console and page errors. Videos use local synthetic accounts only.
- All migrations apply to a fresh PostgreSQL 17 database; `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code` reports no drift.
- Query plans use `Opportunity_organizerId_createdAt_id_idx` and `Application_volunteerId_status_createdAt_id_idx` for representative limited queries. On the local fixture these were index-only scans, 0.021 ms and 0.009 ms respectively. Small-table sequential scans remain normal.

## Local comparison

Both production builds used the same PostgreSQL fixture (1,201 opportunities, 4,831 applications, 27 organizations). One warm-up plus ten sequential requests per route; local HTTP timings are not production latency or Core Web Vitals. HTML gzip is calculated locally from decoded response bodies.

| Route | Before HTML | After HTML | Before gzip | After gzip | Before p50 | After p50 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 86.3 KB | 85.3 KB | 12.3 KB | 15.9 KB | 11.9 ms | 7.2 ms |
| `/zayavki` | 6,266 KB | 176 KB | 104.6 KB | 12.6 KB | 185.8 ms | 10.1 ms |
| `/organizacii` | 165.5 KB | 154.4 KB | 10.3 KB | 11.4 KB | 20.6 ms | 8.4 ms |
| `/novosti` | 75.6 KB | 67.3 KB | 7.9 KB | 8.2 KB | 8.1 ms | 6.2 ms |

The new map response is 954 bytes for three cities and nine examples. The catalog initially sends no map request. Font preloads decrease from four to two (approximately 35 KB removed according to the original review). Gzip grows on some small pages because of the changed streaming/RSC structure; the claim is not that every individual resource shrinks.

The migration does not add speculative city/category combinations or trigram indexes. A move to Cache Components, a durable email queue, map animation profiling, production mobile LCP/CLS/INP, deployment region and connection-pool measurements remain separate follow-ups. This PR does not claim field-performance validation or email-provider delivery testing.

## Reproduction

Use a disposable local PostgreSQL database whose name ends in `_test`. The preview seed deliberately replaces its contents; both integration tests and seed reject non-local/non-test database URLs.

```sh
docker run --detach --rm --name volunteers-performance-test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=volunteers_test -p 127.0.0.1:55439:5432 postgres:17
export DATABASE_URL=postgresql://postgres:test@127.0.0.1:55439/volunteers_test
export AUTH_SECRET=local-test-secret-do-not-use-in-production
export AUTH_TRUST_HOST=true
npm ci
npx prisma migrate deploy
npm run test:db
npx tsx tests/seed-preview.ts
npm run build
npm run start -- --port 3107
```

In a second terminal, `npx playwright install chromium` and `npm run test:e2e`. Run the full E2E sequence after a fresh seed; the organizer scenario intentionally changes the state subsequently checked by the volunteer scenario. Stop the preview server and clear its generated `.next/cache/fetch-cache` before reseeding an existing preview. To record readable demos, set `PREVIEW_SLOW_MO=350` and `PREVIEW_OUTPUT_DIR` to an absolute directory. Test credentials are `organizer@example.test`, `volunteer@example.test`, `admin@example.test` / `PreviewOnly123!` and exist only in this fixture.

Migration `20260908120000_query_indexes` must be applied in the deployment environment before evaluating its query-plan benefits. It was applied only to the local test database during this work.
