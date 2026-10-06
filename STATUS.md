# Status

The one current status page. Files under `docs/` named `*-STATUS`, `*-COMPLETE`,
`WHAT-IS-LEFT`, `PHASE-1-REMAINING-WORK` and similar are history from Dec 2025;
read them for context, not for the current state. Update this file in the PR
that changes the state.

_Last verified: 2026-10-04 locally, 2026-10-06 on Railway dev/uat_

_Earlier: 2026-10-04, locally (Postgres, Redis, MailHog in Docker; API,
worker, scheduler from `dist/`)._

## The core loop

| Step | State | Evidence |
| --- | --- | --- |
| Migrations apply to an empty database | Works | `prisma migrate deploy` on a fresh DB; `migrate diff` against `schema.prisma` reports no drift |
| API, worker, scheduler start | Works | `/health`, BullMQ workers registered, scheduler passes every 60 s |
| A due reminder fires tier 1 | Works | Email in MailHog within one scheduler pass |
| A one-time reminder fires once | Works | `nextTriggerAt` is cleared when it fires; 3 reminders, one tier-1 email each |
| Tiers 2…n follow at each tier's delay | Works | Profile 0 / 1 / 2 min: tiers 1, 2, 3 sent once each, then it stays at tier 3 |
| Acknowledge stops the escalation | Works | Acknowledged after tier 1; nothing further sent over 6 minutes |
| Snooze pauses, then restarts at tier 1 | Works | Snoozed "in 2 minutes": silent while snoozed, then tier 1 and tier 2 again |
| Recurring and interval schedules | **Not implemented** | `CreateReminderDto.schedule` is not persisted; only `triggerAt` becomes `nextTriggerAt` |

Delays are honoured to the scheduler's resolution: a tier goes out on the first
pass (every 60 s) after its delay has passed.

## Gaps, in the order they block a release

1. **Recurring / interval schedules.** Persist `ReminderSchedule`, compute the
   next occurrence after each trigger, start a fresh escalation per occurrence.
2. **Email through the Noctusoft mail relay.** `email-agent.executor.ts` speaks raw
   SMTP to MailHog. Production mail goes through `POST /email/send` with
   `X-App-Env`.
3. **Billing.** `webhooks/store` verifies signatures and ignores the event. Store
   events must update `Subscription` / `PaymentHistory`; users need a plan page.
4. **Deploy.** dev and uat are live on Railway (2026-10-06), each running api, worker,
   scheduler, web, Postgres, Redis from its branch:
   - dev (`develop`): https://web-dev-8fe7.up.railway.app · https://api-dev-03d7.up.railway.app/health
   - uat (`uat`): https://web-uat-4363.up.railway.app · https://api-uat-a875.up.railway.app/health

   A reminder fires and the worker attempts delivery on dev. Still open: relay and
   OAuth secrets in 1Password (`NOCTUSOFT_API_KEY`, `RELAY_WEBHOOK_SECRET`,
   `RELAY_INBOUND_SECRET`, `GOOGLE_CLIENT_ID/SECRET`), so SMS, store events, and
   Google sign-in are off; email has no transport until it moves to the relay (gap 2);
   production is not provisioned; custom domains; rulesets are still advisory.
5. **CI.** Runs on every PR and on pushes to `develop`, `uat`, `main`; lint is advisory.
6. **Lint.** ~1.7k pre-existing findings (api 1,207, web 532). Advisory in CI
   until burned down.
7. **Phase 1 features not started:** email watchers (completion detection),
   super-admin settings, minimal agent marketplace. Calendar is post-release.

## Run the loop locally

```bash
cd infrastructure && docker compose up -d postgres redis mailhog && cd ..
npm ci
cd apps/api
npm run prisma:generate
npx prisma migrate deploy --schema=./prisma/schema.prisma
npm run build
node dist/apps/api/src/main.js &              # :3801
node dist/apps/api/src/workers/worker.js &
node dist/apps/api/src/workers/scheduler.js &
curl -X POST localhost:3801/v1/seeding/seed   # testuser@example.com / TestUser123!
```

Create an escalation profile with short delays and a reminder with
`schedule.triggerAt` = now; watch MailHog at http://localhost:3810.
