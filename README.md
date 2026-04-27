# meowspace

Pet-first social MVP where one human account can manage multiple pet profiles, post media, follow other pets, and browse a feed.

## Prerequisites

- Node.js 20+
- npm
- Docker (for local Postgres workflow)

## Quick start (in-memory mode)

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Stable dev mode (EMFILE workaround)

If you hit watcher instability (`EMFILE`, repeated hot-reload crashes), use:

```bash
npm run dev:stable
```

This raises file descriptor limits in the shell session before `next dev`.

## Local Postgres workflow

1) Start DB:

```bash
npm run db:up
```

2) Configure env (copy from `.env.example`):

- `PERSISTENCE_DRIVER=postgres`
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/meowspace`
- `PGSSLMODE=disable`

3) Run migrations:

```bash
npm run db:migrate
```

Or do step 1 + 3 in one command:

```bash
npm run db:prepare
```

4) Stop DB:

```bash
npm run db:down
```

## Test and build

```bash
npm test
npm run build
```

## Feed latency smoke check

Run a quick p95 gate against `/api/feed`:

```bash
npm run perf:feed-smoke
```

Optional env vars:

- `FEED_SMOKE_BASE_URL` (default: `http://localhost:3000`)
- `FEED_SMOKE_RUNS` (default: `10`)
- `FEED_SMOKE_WARMUP_RUNS` (default: `1`)
- `FEED_SMOKE_LIMIT` (default: `20`)
- `FEED_SMOKE_P95_MS` (default: `250`)
- `FEED_SMOKE_USER` (default: `perf-smoke-user`)

## API contract

See `API_CONTRACT.md` for request/response envelopes, request IDs, and error codes.
