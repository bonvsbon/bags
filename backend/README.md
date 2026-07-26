# เงินทอน (Ngern Thon) — Backend

FastAPI + SQLModel + Alembic. See [`../project_tracking.md`](../project_tracking.md) for the full plan and roadmap.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -e ".[dev]"
cp .env.example .env              # then edit secrets
```

Default `DATABASE_URL` is local SQLite (`sqlite:///./ngernthon.db`). Switch to managed
Postgres (Neon) later by changing `DATABASE_URL` in `.env` — no code changes needed.

## Run

```bash
cd backend
.venv\Scripts\uvicorn app.main:app --reload
```

- API: http://127.0.0.1:8000
- Health check: http://127.0.0.1:8000/health
- Interactive docs (OpenAPI): http://127.0.0.1:8000/docs

## Migrations (Alembic)

`alembic/env.py` reads `DATABASE_URL` from `app.config` and targets `SQLModel.metadata`.
Once table models exist under `app/models/` (Phase 2):

```bash
cd backend
.venv\Scripts\alembic revision --autogenerate -m "baseline"
.venv\Scripts\alembic upgrade head
```

## Tests

```bash
cd backend
.venv\Scripts\pytest
```

## Deploy (Docker)

```bash
cd backend
docker build -t ngern-thon-api .
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql+psycopg://USER:PASS@HOST/db?sslmode=require" \
  -e JWT_SECRET="$(openssl rand -hex 32)" \
  -e CORS_ORIGINS="https://your-frontend.example.com" \
  -e ENABLE_SCHEDULER=true \
  ngern-thon-api
```

The container runs `alembic upgrade head` before serving, so the schema is created
on first boot. For Render, [`render.yaml`](render.yaml) is a ready blueprint — set
`DATABASE_URL`, `CORS_ORIGINS`, and optional keys such as `GOOGLE_CLIENT_ID` and
`GEMINI_API_KEY`.

Frontend: set `VITE_API_URL` to the deployed API base (e.g.
`https://ngern-thon-api.onrender.com/api/v1`) when building the Vite app.

## Layout

```
app/
  main.py              FastAPI app, CORS, router wiring, optional scheduler lifespan
  config.py            pydantic-settings (.env), CORS, auth, AI provider config
  db.py                engine + session (SQLite local → Postgres via DATABASE_URL)
  deps.py              request-scoped DB session + current-user dependency
  security.py          password hashing + JWT access/refresh helpers
  ai/
    base.py            provider protocol, result type, shared error taxonomy
    router.py          provider pool + cooldown/failover
    factory.py         tier-aware pool builder; skips providers with missing keys
    providers/         cloud adapters, currently Gemini
  models/
    user.py            users, Google identities, refresh tokens, AI consent/tier
    profile.py         profile/settings
    finance.py         accounts, categories, transactions, bills, budgets, goals
    insight.py         insights + notifications
    ai.py              conversations + messages
  routers/             auth/profile/onboarding/accounts/categories/transactions/
                       bills/budgets/goals/summary/insights/ai
  schemas/             request/response models that convert baht ↔ satang
  services/
    aggregation.py     screen payload formulas
    ledger.py          account balance adjustments
    ownership.py       multi-tenant guards used by routers
    insights.py        rule-based insight generation
    ai_context.py      read-only grounded financial snapshot for AI
    prompts.py         Thai AI system prompt + guardrails
  jobs/                APScheduler wiring and testable task bodies
  seed.py              idempotent demo user/category/data reset
alembic/               migrations
scripts/smoke.mjs      end-to-end API smoke path
tests/                 pytest coverage: 68 passing tests
```
