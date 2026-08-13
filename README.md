# Administratum 88k — Petition Workflow Engine

A ServiceNow-inspired approval engine that turns a request into a formal state-machine-governed workflow, with automated review, human sign-off, and a scheduled job that closes out anything left undecided — built as a portfolio piece to demonstrate state machines, queue-driven background work, and real-time UI updates end to end.

**Live demo:** https://administratum.eitikobata.com

## What it does

- A Petitioner files a Petition (any type — resource allocation, planet colonization, whatever the fiction calls for) and it starts life as `DRAFT`.
- Submitting it hands the Petition to a queue-driven pipeline: an automated review worker moves it through `UNDER_REVIEW`, then either rejects it outright or advances it to `PENDING_APPROVAL`.
- One or two Approvers (depending on the Petition's declared impact) cast a decision. A single rejection closes the Petition immediately — it never waits for a second vote it no longer needs. Enough approvals close it as `APPROVED`.
- A recurring background sweep checks every Petition still in flight against its deadline and closes anything overdue as `EXPIRED`, with no manual intervention.
- Every state transition — automated or human — is written to an append-only history table alongside the reason it happened, so the full life of a Petition can be reconstructed after the fact.
- Every transition also broadcasts over WebSocket, so the dashboard and both consoles update live, without polling.

## Architecture

```
┌──────────────┐   POST /petitions    ┌─────────────────────────┐
│  Petitioner   │ ───────────────────▶│   NestJS Backend          │
│  Console      │                      │                            │
└──────────────┘                      │  ┌──────────────────────┐  │
                                        │  │ Petitions Service      │  │
                                        │  │ (create, submit,        │  │
                                        │  │  record approval)       │  │
                                        │  └─────────┬────────────┘  │
                                        │            │                │
                                        │            ▼                │
                                        │  ┌──────────────────────┐  │      ┌───────────┐
                                        │  │ Petition Workflow      │◀────▶│ PostgreSQL │
                                        │  │ Service (state machine, │  │      │           │
                                        │  │  the only writer of     │  │      └───────────┘
                                        │  │  Petition.state)        │  │
                                        │  └─────┬──────────┬───────┘  │
                                        │        │          │          │
                                enqueue │        ▼          ▼ emits    │
                                        │  ┌───────────┐ ┌──────────┐ │      ┌───────────┐
                                        │  │ BullMQ      │ │EventEmitter│──────▶│  Redis     │
                                        │  │ (review job,│ │2 (internal)│ │      │  (shared)  │
                                        │  │  expiry     │ └─────┬────┘ │      └───────────┘
                                        │  │  sweep)     │       │      │
                                        │  └──────┬─────┘       ▼      │
                                        │         │      ┌──────────┐  │
                                        │         │      │ WebSocket  │ │
                                        │         │      │ Gateway    │ │
                                        │         │      └─────┬────┘  │
                                        └─────────┼────────────┼───────┘
                                                   │ processes  │ live push
                                                   ▼            ▼
                                        ┌──────────────────────────┐
                                        │   Next.js Frontend         │
                                        │  (Dashboard, Petitioner    │
                                        │   Console, Approver         │
                                        │   Console)                  │
                                        └──────────────────────────┘
```

## Key features

- **A single, non-negotiable state machine** — every legal transition (`DRAFT → SUBMITTED → UNDER_REVIEW → PENDING_APPROVAL → APPROVED/REJECTED`, plus `EXPIRED` from any in-flight state) is defined in one place. Nothing in the codebase is allowed to write `Petition.state` directly except the workflow service, so a state change and its audit record either both happen or neither does.
- **Queue-driven review, not inline processing** — submitting a Petition doesn't run its review synchronously; it enqueues a BullMQ job that a worker picks up independently, with automatic retry and backoff if it fails.
- **A self-scheduling expiry sweep** — a repeatable BullMQ job, registered once at boot via a fixed job-scheduler ID (so restarts reconfirm the schedule instead of stacking duplicates), periodically closes out anything that missed its deadline.
- **Early-exit approval logic** — a HIGH-impact Petition needs two approvals to pass, but a single rejection ends it immediately. The system never makes a second Approver vote on something that's already decided.
- **Decoupled real-time layer** — the workflow service has no idea a WebSocket gateway exists. It emits a domain event through EventEmitter2 after every transition; the gateway subscribes independently and rebroadcasts to every connected browser. Same separation-of-concerns pattern used in Nexus Dispatch, applied to a simpler transport.
- **Dynamic approver/petitioner identity, no hardcoding** — both consoles pull their dropdowns live from the database (`GET /approvers`, `GET /petitioners`) instead of a fixed list baked into the frontend, so registering someone new in the API makes them usable in the UI with no redeploy.
- **A self-sustaining, self-pruning demo** — a background simulator files and decides a handful of fictional petitions on a long interval (default 15 min) so the public demo always has something moving, without a constant stream of fake noise. A separate daily cleanup job then removes only simulated petitions that are closed and past a configurable age — real, visitor-filed activity is never touched by either job. See [Simulator & cleanup](#simulator--cleanup) below.

## Simulator & cleanup

Unlike the other projects in this portfolio, Administratum 88k has no reset-and-reseed self-heal. That's a deliberate choice, not an oversight: a bureaucratic archive that resets itself would undercut the whole premise — the point of a record is that it doesn't disappear. Instead, two independent background jobs keep the public demo alive without ever touching real activity:

- **Simulator tick** (default every 15 min) — files one fictional petition from a small fixed cast of simulated petitioners, and casts a decision (mostly approvals, occasionally a rejection) on any simulated petition still waiting on one. It reuses the exact same `PetitionsService` code path a real visitor's click would hit — there's no separate, parallel shortcut that could drift from the real flow.
- **Cleanup sweep** (default once every 24h) — deletes simulated petitions that are closed (`APPROVED`/`REJECTED`/`EXPIRED`) *and* have been sitting closed for longer than a configurable age (default 3 days). Approvals and state history cascade-delete automatically alongside the petition.

Every petition the simulator creates is flagged `simulated: true` in the database — a flag no public endpoint ever sets. That flag is the entire safeguard: **a real, visitor-filed petition is never eligible for cleanup, no matter how old or how long it's been closed.** The archive of real activity only ever grows; only the synthetic noise gets pruned.

The simulator is off by default (`SIMULATOR_ENABLED=false`) so a plain local checkout never gets synthetic data cluttering a dev database. Production sets it to `true`.

## Technical decisions & trade-offs

- **A dedicated `PetitionWorkflowService`, separate from both `PetitionsService` and the queue module** — putting transition logic directly in `PetitionsService` would have created a circular dependency: `PetitionsModule` needs `QueueModule` to enqueue review jobs, and `QueueModule`'s processors need to call the same transition logic. Extracting that logic into its own module that both sides depend on (instead of depending on each other) avoids the cycle entirely.
- **BullMQ over Redis Streams** (the pattern already used in Section 8½) — this project's work is discrete, one-shot tasks with a clear start and end ("review this Petition," "sweep for expired ones"), not a continuous stream of events to correlate. A job queue with retry, backoff, and a completion state fits that shape better than a consumer group reading an event log.
- **Early-exit rejection over always collecting every required vote** — waiting for a second Approver's vote on a Petition that's already been rejected would cost that Approver real effort for a decision that can no longer change the outcome. The first rejection closes the case.
- **EventEmitter2 + WebSocket gateway over injecting the gateway into the workflow service directly** — same reasoning as Nexus Dispatch's transport/domain separation: the workflow service emitting a plain domain event, with no reference to Socket.IO, means a future listener (an audit log, a notifier) can be added without ever touching the file that owns business logic.
- **Full re-fetch on any WebSocket event over patching individual records client-side** — merging partial updates into nested client state (a Petition with its approvals and history) gets fiddly fast and easy to get subtly wrong. Re-querying the whole list on any change is simpler to reason about and, at this scale, cheap enough not to matter.
- **A `simulated` boolean flag over deleting-and-reseeding like the other projects** — the other portfolio projects reset their entire dataset periodically because their premise is a live operational feed, where stale demo state is actively misleading. Administratum 88k's premise is the opposite: a permanent bureaucratic record. Flagging only the synthetic petitions and pruning exclusively those preserves that premise while still keeping the public demo visibly active.

## Known limitations (intentional, not overlooked)

- No authentication — same reasoning as every other project in this portfolio: identity (Petitioner, Approver) is selected from a live dropdown rather than logged into, deferred deliberately until a real multi-tenant flow needs it.
- Petition type is a free-text string, not a managed catalog — adding structure/validation per petition type is a natural next step, not implemented here on purpose to keep the workflow engine generic.
- No horizontal scaling story for the review worker or the WebSocket gateway yet — fine at demo scale; a production version would need each to be made cluster-aware.

## Stack

| Layer | Tech |
|---|---|
| Backend | NestJS, TypeScript, Prisma |
| Workflow | Custom state machine + BullMQ (review queue, expiry sweep) |
| Real-time | Socket.IO (WebSocket) + EventEmitter2 (internal domain events) |
| Database | PostgreSQL (shared instance) |
| Queue/cache | Redis (shared instance) |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, socket.io-client |
| Infra | Docker (multi-stage builds), EasyPanel, shared services across projects |

## Running locally

Requires Docker and Docker Compose.

```bash
git clone https://github.com/eitikobata/administratum-88k.git
cd administratum-88k

# spin up local Postgres + Redis
cd infra
docker compose -f docker-compose.dev.yml up -d
cd ..

# backend
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev

# frontend (separate terminal)
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend: http://localhost:3001
Backend: http://localhost:3000

Minimum environment variables (`backend/.env`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis connection |
| `FRONTEND_URL` | Allowed CORS origin (used by both REST and the WebSocket gateway) |
| `PETITION_DEADLINE_HOURS` | Hours a Petition has to be decided before the expiry sweep closes it |
| `EXPIRY_SWEEP_INTERVAL_MS` | How often the expiry sweep job runs |
| `SIMULATOR_ENABLED` | `true`/`false` — turns the background simulator on (production only by default) |
| `SIMULATOR_TICK_INTERVAL_MS` | How often the simulator files a new petition and decides pending ones (default 15 min) |
| `SIMULATOR_CLEANUP_INTERVAL_MS` | How often the cleanup sweep runs (default once/day) |
| `SIMULATOR_CLEANUP_MAX_AGE_DAYS` | How many days a simulated petition stays closed before it's eligible for cleanup (default 3) |

Frontend (`frontend/.env.local`): `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`.

## Project structure

```
administratum-88k/
├── backend/          # NestJS API — petitions, workflow, queue, realtime
│   ├── src/
│   └── prisma/         # schema + migrations + seed
├── frontend/          # Next.js dashboard + Petitioner/Approver consoles
│   └── src/
├── infra/             # local-dev-only docker-compose (never deployed)
├── backend/Dockerfile
├── frontend/Dockerfile
└── frontend/docker-entrypoint.sh
```

`infra/` never ships to production — Postgres and Redis run as separate, shared EasyPanel services in production, reused across every project in this portfolio rather than provisioned per-project.

## Author

Built by Eiti Kobata as a portfolio project. "Administratum" is used in its plain Latin sense (an administrative body); every other name, entity, and mechanism in this project is original — no licensed IP.
