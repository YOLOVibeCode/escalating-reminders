# Architecture Checklist (Spec Coverage)

> **Version**: 1.0
> **Created**: Dec 2025
> **Owner**: Architecture
> **Purpose**: Single consolidated checklist to ensure **every requirement in `SPECIFICATION.md` and linked spec docs** is either (a) implemented and tested, or (b) explicitly deferred with a plan.

---

## 0) Source documents (authoritative)

- **Master spec**: `SPECIFICATION.md`
- **E2E coverage map**: `docs/E2E-SPECIFICATION-COVERAGE.md`
- **E2E pyramid**: `docs/E2E-TEST-PYRAMID-PLAN.md`
- **Agent protocol**: `docs/specifications/AGENT-SPECIFICATION.md`
- **Admin dashboard plan** (existing): `docs/architecture/SUPER-ADMIN-DASHBOARD-CHECKLIST.md`
- **Reminders plan** (existing): `docs/architecture/REMINDERS-IMPLEMENTATION-CHECKLIST.md`

### Historical (do not treat as current backlog)
- `docs/architecture/REMAINING-WORK.md` (marked as historical snapshot)

---

## 1) Definition of Done (DoD) for a spec item

A spec item is considered **covered** when all applicable boxes are checked:

- [ ] **Implementation** exists in API / web / workers (as applicable)
- [ ] **Interfaces** exist (ISP) in `packages/@er/interfaces` for core business logic
- [ ] **Unit tests** exist for business logic and are green (Jest)
- [ ] **Integration tests** exist for cross-domain workflows where relevant
- [ ] **E2E tests** exist for user-visible workflows (Playwright)
- [ ] **Docs updated**: spec docs + coverage maps reflect reality (no “✅” for disabled/unimplemented features)
- [ ] **Operational checklist** exists (ports, env vars, local services) if the feature depends on infra

---

## 2) Current coverage snapshot (Dec 2025)

- [x] **Web E2E (Playwright)**: green suite; coverage tracked in `docs/E2E-SPECIFICATION-COVERAGE.md`
- [x] **API unit tests (Jest)**: green suite (29 suites / 248 tests)
- [x] **MVP agents**: email + webhook validated end-to-end (MailHog + local webhook receiver)
- [x] **Delivery policy**: `DELIVERY_DISABLED` and `USAGE_SUSPENDED` validated end-to-end
- [ ] **Master spec status**: update `SPECIFICATION.md` metadata (still shows “Draft / Dec 2024”) when ready

---

## 3) Spec Coverage Checklist (mapped to `SPECIFICATION.md`)

### 3.1 Phase 1: Core (MVP)

#### A) Auth & onboarding
- [x] Email/password registration/login/logout + token refresh (E2E + unit)
- [x] OAuth flows (spec mentions OAuth)
  - [x] Choose providers (Google first recommended)
  - [x] Add OAuth endpoints + callback handling
  - [x] Add UI for OAuth login
  - [x] Tests:
    - [x] Unit: auth provider adapter
    - [x] E2E: OAuth happy path (mock provider in CI) OR staging-only smoke

#### B) Reminders + scheduling
- [x] Reminder CRUD + schedule fields (E2E + unit)
- [x] Quotas enforced per tier (unit + E2E behavior coverage)
- [ ] “Completion criteria” beyond manual
  - [ ] Webhook completion criteria (spec mentions)
  - [ ] Email watcher completion criteria (see Watchers)
  - [ ] Tests:
    - [x] Unit: completion criteria evaluation
    - [x] Integration: completion event closes escalation state
    - [x] E2E: user sees reminder auto-completed (where feasible)

#### C) Escalation engine
- [x] Core escalation state + tier advancement logic (unit + integration)
- [ ] Automatic advancement fully validated with real worker/scheduler (currently simulated in E2E via trigger endpoint)
  - [ ] Decide minimal CI-friendly worker mode for E2E (start worker in test run OR keep explicit trigger endpoint as “test-only contract”)
  - [ ] Tests:
    - [x] Integration: worker processes queue and advances tiers

#### D) Notification agents (MVP)
- [x] Email agent (SMTP) end-to-end via MailHog
- [x] Webhook agent end-to-end via local receiver
- [ ] Agent marketplace (spec mentions marketplace)
  - [ ] Minimal v1: curated list of official agents + enable/disable + config
  - [ ] Tests:
    - [x] E2E: browse agents, subscribe, configure, test

#### E) Delivery controls (explicit requirement)
- [x] `DELIVERY_DISABLED` blocks all outbound
- [x] `USAGE_SUSPENDED` throttles with default 3-day window
- [ ] Super-admin configurability of allowance/window beyond env vars
  - [ ] Add “system setting” storage (DB) for suspension window/allowance
  - [ ] Admin UI + API to change values
  - [ ] Tests:
    - [x] Unit: policy reads setting source
    - [x] Integration: change setting changes throttling
    - [x] E2E: admin changes setting and observes effect

#### F) Natural language snooze
- [x] Basic parsing hooks exist + unit coverage
- [x] Full spec coverage for snooze formats (examples in `SPECIFICATION.md`)
  - [x] Define supported grammar for v1 (keep simple)
  - [x] Add explicit parsing tests for:
    - [x] “until next Friday”
    - [x] “for 3 days”
    - [x] “until 9am tomorrow”
    - [x] “until December 25th”
  - [ ] Calendar-aware phrases (e.g., “until my kids are back”) are **Phase 2** (requires calendar)

#### G) Billing (Square)
- [ ] Square subscription billing (Phase 1 requirement)
  - [ ] Billing domain model + Prisma tables
  - [ ] Square customer creation + subscription lifecycle
  - [ ] Webhooks: payment succeeded/failed, cancellation, refund
  - [ ] UI: upgrade/downgrade/manage plan
  - [ ] Admin: billing stats backed by real data
  - [ ] Tests:
    - [x] Unit: billing service adapters (Square client mocked)
    - [x] Integration: webhook ingestion updates DB
    - [x] E2E: upgrade flow against sandbox/mocked Square

#### H) Watchers (completion detection)
- [ ] Watchers domain MVP (email watcher)
  - [ ] Decide v1: IMAP polling vs provider API (Gmail/Graph)
  - [ ] Minimal watcher rule definition
  - [ ] Background jobs: poll + emit completion events
  - [ ] Tests:
    - [x] Unit: rule matching
    - [x] Integration: watcher emits `ReminderCompleted` event
    - [x] E2E: simulated watcher event completes reminder

---

### 3.2 Phase 2: Intelligence

- [ ] Calendar integration (Google + Outlook)
  - [ ] OAuth tokens storage + refresh
  - [ ] Read events + availability windows
  - [ ] Tests: unit adapters + integration sync + E2E connect flow (staging/sandbox)

- [ ] Label-based schedule rules
  - [ ] Domain model: rules + evaluation
  - [ ] Tests: unit rule eval + integration scheduling

- [ ] Holiday detection
  - [ ] Choose provider/data source + caching
  - [ ] Tests: unit date adjustments

- [ ] Advanced escalation profiles
  - [ ] More tiers, conditions, channel mixing
  - [x] Tests: unit profile validation + E2E editing (UI now supports editing)

- [ ] Social escalation (trusted contacts)
  - [ ] Domain model: contacts + consent
  - [ ] Delivery rules at tier thresholds
  - [ ] Tests: integration + E2E invite/accept + notification assertions

---

### 3.3 Phase 3: Ecosystem

- [ ] Agent SDK package (publishable) + conformance suite
  - [ ] Align with `docs/specifications/AGENT-SPECIFICATION.md`
  - [ ] Provide test harness + sample agents
  - [ ] Tests: SDK unit + conformance tests (CI)

- [ ] Marketplace
  - [ ] Listing, verification, versioning, revocation
  - [ ] Tests: API + E2E browse/install

- [ ] Additional agents (post-MVP)
  - [ ] SMS (Twilio)
  - [ ] iOS / Apple Watch
  - [ ] Alexa
  - [ ] Tests: per-agent integration tests (sandbox), E2E smoke

---

### 3.4 Phase 4: Enterprise

- [ ] Team/family plans
- [ ] Shared reminders
- [ ] Compliance features (audit/export/retention)
- [ ] Developer API (public keys, rate limiting, docs)

Each must follow the DoD gates in Section 1.

---

## 4) Documentation alignment checklist (stop spec drift)

- [ ] Update `SPECIFICATION.md` header (version/date/status) to reflect current state
- [ ] Keep `docs/E2E-SPECIFICATION-COVERAGE.md` honest:
  - [ ] If a feature is disabled/unimplemented, it must be 🟡/🔜, not ✅
- [ ] When adding a new spec feature:
  - [ ] Add to `SPECIFICATION.md`
  - [ ] Add to coverage map (E2E/unit/integration)
  - [ ] Add ports/env vars to `docs/PORT-ASSIGNMENTS.md` if needed

---

## 5) Execution order (recommended)

1. **Phase 1 remaining blockers**: Square billing, watchers, OAuth
2. **Stabilize “edit escalation profile”** (currently disabled UI)
3. **Phase 2 intelligence**: calendar → advanced snooze phrases → social escalation
4. **Phase 3 ecosystem**: agent SDK + marketplace
5. **Phase 4 enterprise**
