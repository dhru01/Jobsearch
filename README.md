# Fieldwork

Week 1 foundation plus Week 2 job ingestion for South African graduates and early-career professionals: account registration, CV upload, a confirmed profile, and a dashboard of matched vacancies.

Tailored documents, assisted applications, email, and billing are later weeks. Matching scores use tuning weights (qualifications 30%, skills 30%, experience 20%, location 10%, preferences 10%). They are not interview probabilities.

## Setup

Install Docker, then the [Supabase CLI](https://supabase.com/docs/guides/local-development). From this directory:

```bash
supabase start
supabase status
```

Copy `.env.example` to `.env.local` and fill in the local API URL and anon key from `supabase status`. Put production values only in the hosted environment.

```bash
npm install
npm run dev
```

`supabase start` applies the migrations and the synthetic job seed. To reapply them:

```bash
supabase db reset
```

CV extraction calls OpenAI when `OPENAI_API_KEY` is set. Without that key, the file is still stored and the profile form stays editable.

## Apify job search

Configure `APIFY_API_TOKEN`, actor IDs (`APIFY_PNET_ACTOR_ID`, `APIFY_INDEED_ACTOR_ID`, `APIFY_LINKEDIN_ACTOR_ID`), and set `APIFY_ENABLE_*=true` only for sources you have permission to use. On **Find jobs**, a confirmed candidate searches by title, location, and employment type. That search runs the enabled Apify actors (small batch; LinkedIn actor minimum 10) with those terms. Results are stored, scored against the **confirmed profile**, and listed (employment type also filters ingested rows when set). Location autocomplete reads from the **`SA_Locations`** GeoNames table in Supabase (see migration `20261024120000_sa_locations_search.sql` for indexes and read policies). Defaults target South Africa. No scheduled Apify runs.

## Job ingestion (Week 2)

Listings are imported with the service role, deduplicated by a content fingerprint, normalised to South African cities and provinces, and enriched with minimum qualification, years, skills, and stale flags.

1. Add `SERPAPI_API_KEY` from [SerpAPI](https://serpapi.com/) to `.env.local` (Google Jobs engine, South Africa).
2. Optionally set `GREENHOUSE_BOARD_TOKENS` to comma-separated public board slugs.
3. Apply migrations, then run:

```bash
npm run ingest:jobs
```

Without `SERPAPI_API_KEY`, the ingest command falls back to `fixtures/ingested-jobs.sample.json`. Use `npm run ingest:jobs:fixtures` to force fixtures.

Schedule production imports with `GET /api/cron/ingest-jobs` and `Authorization: Bearer $INGEST_CRON_SECRET`.

Target scale for Week 2 is 500–1,000 unique live vacancies per run when SerpAPI is configured.

## Auto-apply (assisted + mock)

Fieldwork still does **not** auto-submit on PNet, LinkedIn, or Indeed. Users set mode on **Auto-apply**: manual, approval required (default), or automatic with explicit consent.

Queue eligible matches from that page. The Playwright worker only fills the local **mock form** at `/apply/mock`:

```bash
npx playwright install chromium
npm run apply:worker -- --application-id=<uuid>
```

`GET /api/cron/process-apply-queue` enqueues matches; it does not launch a browser. Set `APPLY_LIVE=false`.

## Week 3: apply, email, billing

**Tailored documents** — Saved → Prepare documents → generate, review, download PDFs (OpenAI optional).

**Assisted apply** — Same flow tracks steps on the application page. You apply on the employer site, then mark **I submitted on the employer site**. Fieldwork labels this **submitted (unverified)**; it never auto-submits.

**Email** — Pro users can enable a **daily digest** on Profile. Schedule with `GET /api/cron/daily-digest` and `Authorization: Bearer $DIGEST_CRON_SECRET` (falls back to `INGEST_CRON_SECRET`). Requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.

**Billing** — Free: 3 tailored document sets per month. Pro (R99/month): unlimited tailoring + digest. Checkout uses Paystack (`PAYSTACK_SECRET_KEY`, webhook `/api/billing/paystack/webhook`). For local testing, set `BILLING_DEV_UPGRADE=true` on `/dashboard/plan`.

## Row-level security

```bash
npm run test:rls
```

The pgTAP file checks that one signed-in user cannot read or change another user's profile, documents, matches, applications, events, subscription, or CV files, and cannot insert jobs.

## Scripts

```bash
npm run dev
npm run build
npm run test:score
npm run test:jobs
npm run test:rls
npm run ingest:jobs
npm run ingest:jobs:fixtures
```
