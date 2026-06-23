# เงินทอน (Ngern Thon) — Backend Plan & Tracking

> เอกสารนี้เป็นทั้ง **แผนออกแบบ backend** และ **ตัวติดตามงาน** (มี checkbox ต่อ phase)
> Frontend = React + Vite (อยู่ที่ `src/`) ทำเสร็จแล้ว — backend จะต้อง “ป้อนข้อมูลจริง” ให้ทุกหน้าจอที่มีอยู่
> สถานะ: 🟡 *Planning* — ยังไม่เริ่มเขียนโค้ด
>
> **อัปเดตดีไซน์ (2026-06-23):** แอปเปลี่ยนชื่อ **เงินเหลือ → เงินทอน**; เพิ่ม **6 ธีม** (light/mint/sky/sand/dark/midnight) แทน dark on/off, หน้า **รายละเอียด "เงินที่ใช้ได้จริง"**, ฟอร์ม **สร้างเป้าหมาย / สร้าง-แก้ไขบิล**, **ลบ/แก้ไข** bill & goal, onboarding แก้รายได้ได้ + วันสิ้นเดือน (EOM) + ค่าใช้จ่าย custom, และ **Web Dashboard แบบหลายหน้า** (home/รายการ/แผน/บิล/บัญชี/เป้าหมาย/รายงาน/ตั้งค่า). ผลกระทบต่อ data model/endpoint สรุปไว้ใน §3, §4, §10 และ §12 (changelog).

---

## 1. Decisions (สรุปสิ่งที่ตกลงแล้ว)

| หัวข้อ | เลือก | หมายเหตุ |
|---|---|---|
| ภาษา/เฟรมเวิร์ก | **Python 3.12 + FastAPI** | async, auto OpenAPI `/docs` |
| Validation/Schema | **Pydantic v2** | request/response models |
| ORM | **SQLModel** (SQLAlchemy core + Pydantic) | + **Alembic** migrations |
| Database | **PostgreSQL แบบ online (managed)** | ค่าเริ่มต้น **Neon** (serverless, free tier, branching); ทางเลือก Supabase / Railway |
| Auth | **JWT** (access + refresh) ทำเองใน FastAPI | email/password ใช้ bcrypt hashing (passlib) |
| Social Auth | **Google OAuth/OIDC (Gmail)** | Frontend ใช้ Google Identity Services; backend verify Google ID token แล้วออก JWT ของระบบ |
| Guest mode | **Guest user/session** | ใช้งานแบบไม่สมัครได้ทันที; ข้อมูลผูกกับ guest `user_id` และ upgrade เป็น account จริงได้ภายหลัง |
| Jobs/cron | **APScheduler** (in-process) สำหรับ MVP | ถ้าสเกลค่อยย้ายไป Celery + Redis |
| ขอบเขต | **MVP + insights & jobs** | Auth + CRUD + aggregation + rule-based insights + scheduled jobs |
| เงิน (money) | เก็บเป็น **integer “สตางค์” (satang)** `BIGINT` | กัน floating-point; API รับ/ส่งเป็นบาท (decimal) |

**ยังต้องยืนยัน (Open questions) → ดู §11**

---

## 2. Architecture (ภาพรวม)

```
React (Vite)  ──HTTPS/JSON──▶  FastAPI (Uvicorn/Gunicorn)
  src/store.js                   │
  (เปลี่ยนจาก seed ในเครื่อง       ├── Routers (auth, txn, bill, budget, ...)
   ไปเรียก API client)            ├── Services (aggregation, insights, bills)
                                  ├── APScheduler (cron jobs)
                                  └── SQLModel/SQLAlchemy
                                          │
                                  Managed PostgreSQL (Neon, online)
```

- **Stateless API** + JWT → ขยาย/deploy ง่าย
- **Service layer** แยก business logic ออกจาก router (อ่าน/ทดสอบง่าย)
- Aggregation endpoints ออกแบบให้ **map 1:1 กับหน้าจอ frontend** (ดู §5)

---

## 3. Data Model (ตาราง + ความสัมพันธ์)

ดึงมาจาก state model ของ frontend (`design-src/_state-model.js`) โดยตรง

### `users`
| field | type | note |
|---|---|---|
| id | UUID PK | |
| email | citext unique nullable | null ได้สำหรับ guest |
| password_hash | text nullable | bcrypt; null ได้สำหรับ Google/guest |
| account_type | enum(`registered`/`guest`) | guest ใช้ทดลองก่อนสมัคร |
| created_at | timestamptz | |
| guest_expires_at | timestamptz nullable | optional cleanup policy สำหรับ guest ที่ไม่ upgrade |

### `auth_identities` — ผูก social login เช่น Google/Gmail
`id` · `user_id` FK · `provider` enum(`google`) · `provider_subject` text (Google `sub`) · `provider_email` citext · `email_verified` bool · `created_at`
→ unique(`provider`, `provider_subject`) และใช้ link/upgrade guest เป็น account จริงโดยไม่เสียข้อมูลเดิม

### `guest_sessions` (optional) — ถ้าต้องแยก guest token ออกจาก refresh token ปกติ
`id` · `user_id` FK · `device_id` · `created_at` · `last_seen_at` · `expires_at`
→ MVP สามารถใช้ `refresh_tokens` แทนได้ก่อน แล้วเพิ่มตารางนี้เมื่ออยากคุม guest lifecycle ละเอียดขึ้น

### `profiles` (1:1 กับ user)
`user_id` FK · `display_name` (เช่น "บอล") · `pay_day` smallint(1–31, รองรับ **EOM**: เก็บ `0` หรือ `32` = วันสิ้นเดือน) · `monthly_income` bigint(satang) · `primary_goal` enum(`leftover`/`save`/`debt`/`control`/`invest`) · `mode` enum(`beginner`/`advanced`) · `currency` default `THB` · `locale` default `th`

### `settings` (1:1) — toggles ในหน้า Settings
`user_id` FK · `theme` enum(`light`/`mint`/`sky`/`sand`/`dark`/`midnight`) default `light` *(แทน `dark` bool เดิม — UI เป็น theme picker 6 สี)* · `notify_bills` bool · `notify_budget` bool · `weekly_summary` bool · `biometric` bool · `hide_amounts` bool

### `accounts` — หน้า Accounts (assets + debts)
`id` · `user_id` · `name` · `type` enum(`asset`/`debt`) · `kind` enum(`bank`/`cash`/`ewallet`/`credit_card`/`loan`) · `balance` bigint(satang) · `icon` · `note` (เช่น "ครบกำหนด 30 มิ.ย." / "ผ่อนเดือนละ ฿24,000") · `sort` int

### `categories` — chips ในหน้า Add / Plan
`id` · `user_id` (null = default ของระบบ) · `name` (อาหาร/เดินทาง/…) · `icon` · `color` · `kind` enum(`expense`/`income`) · `is_default` bool

### `transactions` — หัวใจของระบบ
`id` · `user_id` · `account_id` FK · `category_id` FK · `type` enum(`expense`/`income`) · `amount` bigint(satang, >0) · `note` · `occurred_at` date · `created_at` timestamptz · (`icon`, `name` derive จาก category/type)

### `bills` — หน้า Bills + “ต้องจ่ายเร็ว ๆ นี้” + ฟอร์ม Create/Edit Bill
`id` · `user_id` · `name` · `amount` bigint · `icon` · `due_day` smallint(1–31, รองรับ **EOM** = 0/32) · `recurrence` enum(`monthly`/`yearly`/`once`) · `remind_days` smallint(เตือนล่วงหน้า — UI ให้เลือก 1/3/7) · `account_id` (nullable) · `category_id` (nullable)
→ สถานะ (`paid`/`soon`/`upcoming`/`overdue`) เป็น **computed** ต่อรอบเดือน (ดู `bill_payments`)
→ รองรับ **เพิ่ม/แก้ไข/ลบ** (POST/PATCH/DELETE) จากฟอร์มในแอป; custom recurring จาก onboarding ก็สร้างเป็น bill ที่นี่

### `bill_payments` — บันทึกว่าบิลถูกจ่ายในรอบไหน
`id` · `bill_id` FK · `period` (YYYY-MM) · `paid_at` · `transaction_id` (nullable)

### `budgets` — หน้า Plan (งบต่อหมวด/เดือน)
`id` · `user_id` · `category_id` FK · `period` (YYYY-MM) · `limit_amount` bigint
→ `used` เป็น **computed** จาก transactions

### `goals` — หน้า Goals
`id` · `user_id` · `name` · `icon` · `icon_bg` · `target_amount` bigint · `saved_amount` bigint · `monthly_contribution` bigint (nullable) · `created_at`

### `insights` — ผลจาก insights engine / jobs
`id` · `user_id` · `type` enum · `title` · `body` · `severity` enum(`info`/`warn`/`good`) · `period` · `created_at` · `read_at` (nullable)

### `notifications` — จาก cron (bill reminder ฯลฯ)
`id` · `user_id` · `kind` · `title` · `body` · `scheduled_for` · `sent_at` · `read_at`

### `ai_conversations` — เก็บประวัติถาม-ตอบ AI (Phase 9)
`id` · `user_id` · `title` · `created_at` · `updated_at`
→ ใช้ให้ผู้ใช้ย้อนดูคำถามเดิมได้ เช่น "วางแผนลดรายจ่ายเดือนนี้"

### `ai_messages` — ข้อความในห้องสนทนา AI (Phase 9)
`id` · `conversation_id` FK · `role` enum(`user`/`assistant`/`system`) · `content` text · `metadata` jsonb · `created_at`
→ `metadata` เก็บ snapshot/summary ของข้อมูลที่ AI ใช้ตอบ เพื่อ audit ได้ว่า AI อ้างอิงอะไร

### `refresh_tokens` — รองรับ refresh-token rotation
`id` · `user_id` · `token_hash` · `expires_at` · `revoked_at`

---

## 4. API Surface (REST · prefix `/api/v1`)

ทุก endpoint (ยกเว้น auth) ต้องมี `Authorization: Bearer <access>`

**Auth**
- `POST /auth/register` · `POST /auth/login` → `{access, refresh}` · `POST /auth/refresh` · `POST /auth/logout` · `GET /auth/me`
- `POST /auth/google` → รับ Google `id_token`, verify `aud`/`iss`/`sub`/`email_verified`, สร้างหรือ link user แล้วคืน `{access, refresh}`
- `POST /auth/guest` → สร้าง guest user + default profile/settings แล้วคืน `{access, refresh}` เพื่อให้ลองใช้แอปได้ทันที
- `POST /auth/guest/upgrade` → แปลง guest เป็น account จริงด้วย email/password หรือ Google โดยคง `user_id` และข้อมูลเดิมไว้

**Onboarding** (จบ flow 4 ขั้นในแอป)
- `POST /onboarding` → รับ `pay_day`, `monthly_income`, `recurring[]` (สร้าง bills), `primary_goal` แล้ว seed ข้อมูลตั้งต้น

**Profile / Settings**
- `GET·PATCH /profile` · `GET·PATCH /settings`

**Accounts** — `GET·POST /accounts` · `GET·PATCH·DELETE /accounts/{id}`
**Categories** — `GET·POST /categories` · `PATCH·DELETE /categories/{id}`
**Transactions** — `GET /transactions` (filter: `type`,`category_id`,`account_id`,`date_from`,`date_to`,`group_by=day`,paginate) · `POST` · `GET·PATCH·DELETE /transactions/{id}`
**Bills** — `GET·POST /bills` · `PATCH·DELETE /bills/{id}` · `POST /bills/{id}/pay`
**Budgets** — `GET /budgets?period=YYYY-MM` · `POST` · `PATCH·DELETE /budgets/{id}`
**Goals** — `GET·POST /goals` · `PATCH·DELETE /goals/{id}` · `POST /goals/{id}/contribute`

**Aggregation / Views (map ตรงกับหน้าจอ — §5)**
- `GET /summary/home` → ป้อนหน้า Home ทั้งหน้า
- `GET /summary/detail` → หน้า "เงินที่ใช้ได้จริง" (breakdown: เงินทั้งหมด − บิล − หนี้ที่ตั้งใจจ่าย − งบที่กันไว้ − เงินเข้าเป้าหมาย = เหลือใช้จริง + daily allowance)
- `GET /summary/plan` → หน้า Plan (daily allowance + budgets + tip)
- `GET /summary/dashboard` → Web Dashboard หน้า home (stats + weekly bars + watch + recent + goal highlight)
- `GET /summary/reports` → Web Dashboard หน้า "รายงาน" (เงินเข้า/ออก/เหลือเก็บ + weekly bars + รายจ่ายแยกตามหมวด)

**Insights / Notifications**
- `GET /insights` · `POST /insights/{id}/read`
- `GET /notifications` · `POST /notifications/{id}/read`

**AI Q/A & Financial Planning (Phase 9)**
- `POST /ai/chat` → ถามข้อมูลการเงิน/ให้ AI ช่วยวิเคราะห์จากข้อมูลของผู้ใช้ เช่น "เดือนนี้ควรลดอะไร" หรือ "เงินเหลือพอถึงวันเงินเดือนไหม"
- `POST /ai/plan` → ให้ AI ช่วยร่างแผนการเงินเบื้องต้นจาก summary, budgets, bills, goals
- `GET /ai/conversations` · `GET /ai/conversations/{id}` · `DELETE /ai/conversations/{id}` → ประวัติถาม-ตอบ

**Misc** — `GET /health` · `GET /docs` (OpenAPI auto)

---

## 5. Aggregation & Insight rules (สูตรคำนวณ)

> เก็บ logic ไว้ที่ `services/aggregation.py` และ `services/insights.py` (pure functions, unit-test ได้)

**สูตรหลัก**
- `total_balance` = Σ balance ของ accounts ที่ `type=asset`
- `reserved` (“ต้องกันไว้”) = Σ(บิลที่ยังไม่จ่ายในเดือนนี้) + Σ(goal monthly_contribution) *(นิยามต้องยืนยัน → §11)*
- `available` (“เงินที่ใช้ได้จริง”) = `total_balance − reserved`
- `daily_allowance` = `available / days_until_payday`
- `month_in` / `month_out` = Σ income / Σ expense ของเดือนปัจจุบัน
- `budget.used` = Σ expense ของ category นั้นในเดือน · เตือนเมื่อ `used/limit ≥ 0.8`
- `weekly_bars` = Σ expense ต่อสัปดาห์ (4 สัปดาห์ล่าสุด)

**Insight rules (rule-based, deterministic)**
- หมวดใช้เกินปกติ: `month_spend(cat) > 1.1 × avg_3เดือน(cat)` → “ค่า{cat}สูงกว่าปกติ +฿X”
- เทียบเดือนก่อน: `(out_now − out_prev)/out_prev` → “ใช้จ่ายน้อย/มากกว่าเดือนก่อน X%”
- ใกล้เกินงบ: `used/limit ≥ 0.8` → tag “ใกล้ถึงงบ”
- คำแนะนำ pace: ถ้า projected_spend > available → “ลองลดวันละ ฿X”
- บิลใกล้ครบกำหนด: ภายใน 3 วัน → reminder

> ⚠️ ข้อมูล demo ใน frontend ไม่ reconcile กัน (Accounts รวม assets = ฿32,000 แต่ Home “เงินทั้งหมด” = ฿50,000) — seed data ของ backend ต้องทำให้ **สอดคล้องกันจริงตามสูตร** (ดู §11)

---

## 6. Scheduled Jobs (APScheduler)

| job | ตาราง | ทำอะไร |
|---|---|---|
| Bill reminder | ทุกวัน 08:00 | หาบิลครบกำหนดใน 3 วัน/1 วัน → สร้าง `notifications` (ถ้า `notify_bills`) |
| Budget alert | ทุกวัน 08:00 | สแกนงบที่ `used/limit ≥ 0.8` → insight/notification (ถ้า `notify_budget`) |
| Weekly summary | จันทร์ 08:00 | สรุปรายจ่ายสัปดาห์ → `insights` (ถ้า `weekly_summary`) |
| Month rollover | วันที่ 1 เวลา 00:05 | reset สถานะบิลรอบใหม่, สร้าง budget period ใหม่, recompute |

---

## 7. Security & Conventions

- รหัสผ่าน hash ด้วย **bcrypt** (passlib) · JWT access ~15 นาที, refresh ~30 วัน + **rotation** (เก็บ hash ใน `refresh_tokens`)
- Google/Gmail auth ต้อง verify ID token ฝั่ง backend ทุกครั้ง: ตรวจ `aud` ตรงกับ Google Client ID, `iss` ถูกต้อง, `sub` เป็น stable user id, และ `email_verified=true`
- Guest mode ใช้ JWT เหมือน user ปกติแต่ mark `account_type=guest`; จำกัดงานเสี่ยง เช่น export/delete account จนกว่าจะ upgrade
- การ upgrade guest ให้พยายามคง `user_id` เดิมเพื่อให้ transactions/bills/goals ไม่ต้อง migrate; ถ้า Google/email ตรงกับ account เดิม ต้องมี flow merge ที่ชัดเจน
- **CORS**: allow `http://localhost:5173` (dev) + โดเมน prod
- เงินเป็น **integer satang** ใน DB; แปลงเป็นบาท (Decimal) ที่ชั้น schema
- Multi-tenant: ทุก query กรองด้วย `user_id` เสมอ (กันข้อมูลรั่ว) — ใส่ใน dependency `get_current_user`
- AI Q/A ต้องดึงข้อมูลผ่าน service layer แบบ read-only และส่งเฉพาะข้อมูลที่จำเป็นต่อคำตอบ; ห้ามส่ง secret/token/PII ที่ไม่จำเป็นเข้า model
- คำตอบ AI เป็นคำแนะนำการเงินเบื้องต้น ไม่ใช่คำแนะนำการลงทุน/กฎหมาย/ภาษีแบบมืออาชีพ; UI ต้องมี disclaimer สั้น ๆ
- Config ผ่าน `pydantic-settings` + `.env` (`DATABASE_URL`, `JWT_SECRET`, …) — ห้าม commit `.env`
- (option) rate-limit ด้วย `slowapi`
- `biometric` เป็นแค่ flag (ปลดล็อกฝั่ง client) — backend ไม่ยุ่งกับ biometric จริง

---

## 8. Project Structure (เป้าหมาย)

```
backend/
  app/
    main.py            FastAPI app, CORS, include routers, start scheduler
    config.py          pydantic-settings (env)
    db.py              engine + session (online Postgres, SSL)
    deps.py            get_db, get_current_user
    security.py        hash + JWT
    models/            SQLModel tables (§3)
    schemas/           Pydantic request/response (บาท ↔ satang)
    routers/           auth, profile, settings, accounts, categories,
                       transactions, bills, budgets, goals, summary, insights,
                       ai
    services/          aggregation.py, insights.py, bills.py, ai_context.py
    jobs/              scheduler.py, tasks.py
    seed.py            default categories + demo data (reconcile ตามสูตร)
  alembic/             migrations
  tests/               pytest (services + endpoints)
  pyproject.toml       deps (uv/pip)
  .env.example
  Dockerfile
```

---

## 9. Roadmap & Tracking (เช็กลิสต์)

### Phase 0 — Setup  🟡
- [ ] โครง `backend/`, `pyproject.toml`, FastAPI skeleton, `/health`
- [ ] เชื่อม Neon (online Postgres) ผ่าน `DATABASE_URL` (SSL), ทดสอบ connect
- [ ] Alembic init + baseline migration
- [ ] `config.py` (.env), CORS สำหรับ Vite, `.env.example`

### Phase 1 — Auth
- [ ] models: `users`, `auth_identities`, `refresh_tokens` · security: hash + JWT
- [ ] `POST /auth/register|login|refresh|logout`, `POST /auth/google`, `POST /auth/guest`, `POST /auth/guest/upgrade`, `GET /auth/me`
- [ ] dependency `get_current_user`

### Phase 2 — Core models + migrations
- [ ] models §3 ทั้งหมด + relations · Alembic migrate ขึ้น Neon
- [ ] `seed.py`: default categories + demo user “บอล” (reconcile ตามสูตร §5)

### Phase 3 — CRUD + Onboarding
- [ ] routers: accounts, categories, transactions, bills, budgets, goals
- [ ] `POST /onboarding`, `GET·PATCH /profile|/settings`
- [ ] filters/pagination ของ `/transactions`, `POST /bills/{id}/pay`, `POST /goals/{id}/contribute`

### Phase 4 — Aggregation
- [ ] `services/aggregation.py` (สูตร §5) + unit tests กับเลข demo
- [ ] `GET /summary/home | /summary/plan | /summary/dashboard`

### Phase 5 — Insights engine
- [ ] `services/insights.py` (rules §5) · `GET /insights`, mark read

### Phase 6 — Jobs
- [ ] `notifications` model · APScheduler (§6) · 4 jobs

### Phase 7 — Frontend integration
- [ ] API client ใน `src/` (fetch + token store) แทน seed ใน `store.js`
- [ ] หน้า Login/Register · ปุ่ม “เข้าสู่ระบบด้วย Google” · ปุ่ม “ลองใช้แบบ Guest” · ผูก Add/Bills/Goals/Settings เข้ากับ API
- [ ] map `/summary/*` เข้าหน้า Home/Plan/Dashboard

### Phase 8 — QA & Deploy
- [ ] pytest (services + endpoints) · ตรวจ OpenAPI `/docs`
- [ ] Dockerfile · deploy (Railway/Render/Fly) · env prod · run migration

### Phase 9 — AI Q/A & Financial Planning
- [ ] `ai_conversations`, `ai_messages` models + migrations
- [ ] `services/ai_context.py`: สรุปข้อมูลผู้ใช้แบบปลอดภัยจาก `/summary/*`, transactions, bills, budgets, goals
- [ ] `POST /ai/chat`, `POST /ai/plan`, `GET/DELETE /ai/conversations`
- [ ] Prompt/policy: ตอบเป็นภาษาไทย, อธิบายจากข้อมูลจริง, ถามกลับเมื่อข้อมูลไม่พอ, ไม่ฟันธงเรื่องลงทุน/กฎหมาย/ภาษี
- [ ] Frontend: หน้าหรือ sheet “ถาม AI” สำหรับถามข้อมูลและขอแผนการเงินเบื้องต้น
- [ ] Tests: unit tests สำหรับ context builder + integration tests ว่า AI เห็นเฉพาะข้อมูลของ user ตัวเอง

---

## 10. Frontend ↔ Backend mapping (traceability)

| หน้าจอ frontend | endpoint หลัก |
|---|---|
| Login/Register | `POST /auth/register` · `POST /auth/login` · `POST /auth/google` · `POST /auth/guest` |
| Onboarding | `POST /onboarding` |
| Home (hero A/B/C) | `GET /summary/home` |
| Detail "เงินที่ใช้ได้จริง" | `GET /summary/detail` |
| Add Transaction | `POST /transactions` (+ `GET /categories`,`/accounts`) |
| Transactions | `GET /transactions?group_by=day` |
| Plan | `GET /summary/plan` |
| Bills (timeline + แก้/ลบ) | `GET /bills` · `POST /bills` · `PATCH·DELETE /bills/{id}` · `POST /bills/{id}/pay` |
| Create / Edit Bill (ฟอร์ม) | `POST /bills` · `PATCH /bills/{id}` |
| Accounts | `GET /accounts` |
| Goals (+ ลบ) | `GET /goals` · `DELETE /goals/{id}` · `POST /goals/{id}/contribute` |
| Create Goal (ฟอร์ม) | `POST /goals` |
| More / Settings (+ theme picker) | `GET·PATCH /profile|/settings` (`settings.theme`) |
| Web Dashboard (home) | `GET /summary/dashboard` |
| Web · รายงาน | `GET /summary/reports` |
| Web · บัญชี/บิล/เป้าหมาย/แผน/รายการ | reuse `GET /accounts` · `/bills` · `/goals` · `/summary/plan` · `/transactions` |
| AI Q/A | `POST /ai/chat` · `POST /ai/plan` · `GET /ai/conversations` |
| Design System | (static, ไม่ใช้ API) |

---

## 11. Open Questions (ต้องยืนยันก่อน/ระหว่าง Phase 2)

1. **นิยาม `reserved` (“ต้องกันไว้”)** = บิลค้างจ่าย + goal contribution เท่านั้น หรือรวม “งบที่เหลือของเดือน” ด้วย? → กระทบเลข `available`
2. **Online DB เจ้าไหน** — เริ่มที่ **Neon** (default ที่เสนอ) หรืออยากใช้ Supabase/Railway? ต้องการ provision ให้ หรือมี `DATABASE_URL` อยู่แล้ว?
3. **ผูกธนาคารจริง/นำเข้า statement** — รอบนี้ไม่รวม (อยู่ใน “Full platform”) ยืนยันว่าข้าม
4. **Reconcile demo data** — ให้ทำ seed ให้เลขตรงตามสูตร (เลิกใช้เลข demo ที่ขัดกัน) ใช่ไหม
5. **Deploy target** ของ backend (Railway/Render/Fly) — มี preference ไหม
6. **Guest lifecycle** — guest data จะหมดอายุไหม (เช่น 30/90 วัน) หรือเก็บถาวรจนกว่าผู้ใช้ลบ?
7. **Google account linking** — ถ้า guest กด upgrade ด้วย Gmail ที่มี account อยู่แล้ว ให้ merge ข้อมูล guest เข้าบัญชีเดิม หรือให้ผู้ใช้เลือกก่อน?
8. **AI provider/model** — ใช้ provider ไหน, เก็บ conversation นานแค่ไหน, และต้องการให้ AI อ่านข้อมูลระดับ transaction detail หรือเฉพาะ summary?

---

## 12. Design Changelog (frontend)

**2026-06-23 — Design update (re-imported จาก Claude Design):**
- เปลี่ยนชื่อแบรนด์ **เงินเหลือ → เงินทอน** (top bar, web sidebar, settings version, design system)
- **Theme system 6 สี** (light/mint/sky/sand/dark/midnight) ใช้ `data-theme` ทั้ง phone (`.nl-phone`) และ web (`.nl-themed`) → `settings.theme`
- หน้าใหม่ **Detail** ("เงินที่ใช้ได้จริง" breakdown) → `GET /summary/detail`
- ฟอร์มใหม่ **Create Goal** (icon/ชื่อ/เป้า/เก็บต่อเดือน + ETA) และ **Create/Edit Bill** (icon/ชื่อ/จำนวน/รอบ/วันครบกำหนด/เตือนล่วงหน้า)
- **Bills & Goals เป็น stateful** + แก้ไข/ลบได้ (มี toast ยืนยัน)
- **Onboarding** ขยาย: แก้รายได้ด้วย keypad + presets, เลือกวันสิ้นเดือน (EOM), เพิ่มค่าใช้จ่าย custom
- **Web Dashboard หลายหน้า**: home / รายการ / แผนเงิน / บิล / บัญชี / เป้าหมาย / รายงาน / ตั้งค่า (sidebar nav, `webScreen`)
- ปุ่ม prototype หลายจุดยิง **toast** (เลือกบัญชี, แนบใบเสร็จ, ค้นหา, logout ฯลฯ)

> ✅ ฝั่ง frontend ทั้งหมดนี้ implement + verify แล้วใน `src/` (state model port 1:1 จาก `design-src/_state-model.js`)

---

*อัปเดตล่าสุด: 2026-06-23 · สถานะ: Planning (backend) — frontend อัปเดตตามดีไซน์ใหม่แล้ว, รออนุมัติเพื่อเริ่ม Phase 0*
