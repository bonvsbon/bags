# เงินทอน · Ngern Thon — คู่มือการรันและใช้งาน

แอปจัดการเงินส่วนตัวภาษาไทย ประกอบด้วย **2 ส่วน**:

| ส่วน | เทคโนโลยี | ที่อยู่ | หน้าที่ |
|---|---|---|---|
| **Frontend** | React 18 + Vite 6 | `src/` | UI ทั้งหมด (showcase + แอปจริง) |
| **Backend** | FastAPI + SQLModel + SQLite/Postgres | `backend/` | API, ฐานข้อมูล, auth, สูตรคำนวณ, jobs, AI assistant |

Frontend มี 2 โหมด: **showcase** (โชว์ดีไซน์ เลขตายตัว) และ **แอปจริง** (login → ดึงข้อมูลจริงจาก backend)

---

## 1. สิ่งที่ต้องติดตั้งก่อน

- **Node.js** ≥ 18 (มากับ npm) — สำหรับ frontend
- **Python** ≥ 3.12 — สำหรับ backend

ตรวจสอบ:
```bash
node --version
python --version
```

---

## 2. เริ่มใช้งานเร็ว (Quick Start)

ต้องเปิด **2 terminal** — อันหนึ่งรัน backend อีกอันรัน frontend

### Terminal 1 — Backend (ครั้งแรก)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
pip install -e ".[dev]"
copy .env.example .env            # macOS/Linux: cp .env.example .env
alembic upgrade head              # สร้างตารางในฐานข้อมูล (SQLite)
python -m app.seed                # ใส่ข้อมูลตัวอย่าง "บอล"
.venv\Scripts\uvicorn app.main:app --reload
```
→ API ขึ้นที่ **http://127.0.0.1:8000** · เอกสาร API: **http://127.0.0.1:8000/docs**

> ครั้งต่อ ๆ ไปแค่: `cd backend` → `.venv\Scripts\activate` → `uvicorn app.main:app --reload`

### Terminal 2 — Frontend
```bash
npm install                        # ครั้งแรกครั้งเดียว
npm run dev
```
→ เปิดเบราว์เซอร์ที่ **http://localhost:5173**

---

## 3. การใช้งานแอป

เปิด http://localhost:5173 จะเจอ **แถบบนสุด 3 แท็บ (showcase)** + ปุ่ม **"เปิดแอปจริง"**

### 3.1 โหมด Showcase (ไม่ต้อง login)
- **Mobile App** — มือถือจำลอง 392×812 มีทุกหน้า + 6 ธีม + สลับ hero A/B/C + AI chat
- **Web Dashboard** — เลย์เอาต์เดสก์ท็อป
- **Design System** — สี ตัวอักษร ปุ่ม ฯลฯ

> เลขใน showcase เป็นค่าตายตัวเพื่อโชว์ดีไซน์ (ทุกคนเห็นเหมือนกัน)

### 3.2 โหมดแอปจริง (เชื่อม API)
กดปุ่ม **"เปิดแอปจริง"** มุมขวาบน → หน้า login

**เข้าได้ 3 วิธี:**
| วิธี | ทำยังไง |
|---|---|
| **บัญชีเดโม** | อีเมล `demo@ngernthon.app` / รหัส `password123` (กรอกให้แล้ว กดเข้าสู่ระบบ) — มีข้อมูลครบ |
| **สมัครใหม่** | แท็บ "สมัครใหม่" → กรอกอีเมล/รหัส (≥8 ตัว) |
| **Guest** | ปุ่ม "ลองใช้แบบ Guest" — ผู้ใช้ใหม่จะเจอ **Onboarding 4 ขั้น** (วันเงินเดือน → รายได้ → ค่าใช้จ่ายประจำ → เป้าหมาย) |

**เมนูล่าง:** หน้าแรก · รายการ · **[+] เพิ่มรายการ** (keypad) · แผนเงิน · เพิ่มเติม
- **หน้าแรก** → กดการ์ดเขียวดูรายละเอียด · ปุ่ม "✦ ดูสรุป" เปิด bottom sheet
- **เพิ่มเติม** → บิล / เป้าหมาย / บัญชี / ตั้งค่า (เพิ่ม–แก้ ✎ –ลบ ได้จริง)
- ปุ่ม **"💻 เปิดแบบเว็บ"** (มุมบน) → Web Dashboard แบบ live (sidebar 7 หน้า)
- ปุ่ม **"showcase ›"** → กลับโหมด showcase

---

## 4. การรันเทสต์

### Backend (pytest) — 68 เทสต์
```bash
cd backend
.venv\Scripts\pytest                # หรือ .venv\Scripts\python -m pytest -q
```
ครอบคลุม: auth, CRUD, สูตรคำนวณ (aggregation), ledger (ยอดเงิน), insights, jobs, money, security regression, AI context/router/chat

### Frontend (vitest) — 23 เทสต์
```bash
npm test
```
ครอบคลุม: `css` parser, `baht` formatter, API client (token/refresh), components (AuthScreen, keypad, Onboarding)

---

## 5. คำสั่งที่ใช้บ่อย

| ทำอะไร | คำสั่ง (ใน `backend/`) |
|---|---|
| รีเซ็ตข้อมูลเดโมให้กลับ 12,800 | `.venv\Scripts\python -m app.seed` |
| สร้าง migration ใหม่ (เมื่อแก้ models) | `.venv\Scripts\alembic revision --autogenerate -m "ข้อความ"` |
| อัปเดตฐานข้อมูลตาม migration | `.venv\Scripts\alembic upgrade head` |
| ดู API ทั้งหมด | เปิด http://127.0.0.1:8000/docs |

| ทำอะไร | คำสั่ง (ที่ root) |
|---|---|
| รัน frontend | `npm run dev` |
| Build production | `npm run build` (ออกที่ `dist/`) |

---

## 6. โครงสร้างโปรเจกต์

```
Bags/
  src/                         Frontend (React)
    App.jsx                    แถบบน + สลับ showcase/แอปจริง
    api/client.js              ตัวเรียก API (token + auto-refresh)
    components/                UI shared: BottomNav, Sheet, Toast, Chat, MobileStage
    lib/                       platform + css helper
    screens/ tabs/ store.js    showcase/prototype state + mobile/web/design-system views
    live/                      แอปจริง: AuthScreen, LiveApp, mobile screens, webdashboard, LiveChat
  backend/                     Backend (FastAPI)
    app/
      main.py config.py db.py  แอป + ตั้งค่า + ฐานข้อมูล
      deps.py security.py      dependency auth/session + hash/JWT
      ai/                      provider abstraction, router/failover, Gemini adapter
      models/                  user/profile/finance/insight/ai tables
      routers/                 auth, CRUD, summary, insights, ai
      schemas/                 request/response schemas
      services/                aggregation, insights, ledger, ownership, ai_context, prompts
      jobs/                    APScheduler (เตือนบิล/งบ/สรุป)
      seed.py                  ข้อมูลเดโม "บอล"
    alembic/                   migrations
    tests/                     pytest
    scripts/smoke.mjs          API smoke test
  android/                     Capacitor Android project + generated assets
  assets/ public/              icon/splash/PWA manifest assets
  test/                        vitest (frontend)
  defects/                     defect tickets จาก SIT/retest
  test-results/                logs, JUnit, screenshots จาก unit/SIT/retest
  PHASE9_AI.md                 แผน/สถานะ AI assistant
  project_tracking.md          แผน backend + สถานะงานทุก phase
  design-src/                  ไฟล์ดีไซน์ต้นฉบับ (อ้างอิงเท่านั้น)
```

---

## 7. การ deploy (production)

- **Backend:** มี `backend/Dockerfile` + `backend/render.yaml` พร้อม deploy บน Render/Railway/Fly
  - เปลี่ยน `DATABASE_URL` ใน `.env` เป็น Postgres (เช่น Neon) — โค้ดรองรับอยู่แล้ว ไม่ต้องแก้
  - ตั้ง `JWT_SECRET`, `CORS_ORIGINS`, (ถ้าใช้ Google) `GOOGLE_CLIENT_ID`
  - ดูรายละเอียดใน [`backend/README.md`](backend/README.md)
- **Frontend:** ตั้ง `VITE_API_URL` ชี้ไปที่ API ที่ deploy แล้ว `npm run build` → เอา `dist/` ขึ้น static host

---

## 8. ทดสอบผ่านมือถือ (เครื่องจริง บน Wi-Fi เดียวกัน)

แอปรองรับการเปิดจากมือถือแล้ว โดย frontend จะเดา URL ของ backend จาก host ที่เปิดอยู่อัตโนมัติ (เปิดที่ `http://<ไอพีเครื่อง>:5173` → ยิง API ไปที่ `http://<ไอพีเครื่อง>:8000` ให้เอง) และ backend เปิด CORS ให้ไอพีวง LAN (`10.x`, `192.168.x`, `172.16–31.x`) บนพอร์ต 5173 ไว้แล้ว

**ขั้นตอน:**

1. ต่อ **คอมพิวเตอร์กับมือถือเข้า Wi-Fi วงเดียวกัน**

2. หาไอพี LAN ของคอม (PowerShell):
   ```powershell
   (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -match '^(192\.168|10\.|172\.)' -and $_.InterfaceAlias -notmatch 'Loopback|vEthernet|WSL'}).IPAddress
   ```
   > เครื่องนี้ตอนเทสต์ได้ `10.39.227.194` — ของคุณจะต่างออกไป ใช้ค่าที่ได้แทนทุกที่ที่เขียน `<LAN_IP>`

3. **Terminal 1 — backend** ต้องผูกกับ `0.0.0.0` (ไม่ใช่ 127.0.0.1) เพื่อให้เครื่องอื่นเข้าถึงได้:
   ```bash
   cd backend
   .venv\Scripts\activate
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

4. **Terminal 2 — frontend** (`vite.config.js` ตั้ง `host: true` ไว้แล้ว เปิดให้เครื่องอื่นเข้าถึงอัตโนมัติ):
   ```bash
   npm run dev
   ```
   จะเห็นบรรทัด `Network: http://<LAN_IP>:5173/`

5. ที่ **มือถือ** เปิดเบราว์เซอร์ไปที่ **`http://<LAN_IP>:5173`** → กด "เปิดแอปจริง" → ล็อกอินด้วยบัญชีเดโม

> **ติดที่ Windows Firewall:** ครั้งแรกที่ผูก `0.0.0.0` Windows อาจถามให้อนุญาต `python`/`node` — กด **Allow access** (เลือก Private networks) ถ้าลืมกดแล้วมือถือต่อไม่ได้ ให้ไปเปิดสิทธิ์ที่ Windows Defender Firewall → Allow an app
>
> **อยากให้รู้สึกเหมือนแอปจริง:** บนมือถือ กดเมนูเบราว์เซอร์ → "เพิ่มลงในหน้าจอโฮม" (Add to Home Screen)

---

## 9. แก้ปัญหาที่เจอบ่อย

| อาการ | วิธีแก้ |
|---|---|
| แอปจริงขึ้น **"Failed to fetch"** | backend ไม่ได้รัน → เปิด Terminal 1 รัน uvicorn |
| **มือถือต่อไม่ได้ / โหลดไม่ขึ้น** | (1) คอม+มือถืออยู่ Wi-Fi เดียวกันไหม (2) backend รันด้วย `--host 0.0.0.0` ไหม (3) Firewall อนุญาต python/node แล้วไหม |
| มือถือเปิดหน้าได้แต่ **ล็อกอินไม่ผ่าน** | เปิดจาก `http://<LAN_IP>:5173` (ไม่ใช่ `localhost`) — frontend ถึงจะยิง API ไปไอพีเดียวกัน และ CORS ถึงจะผ่าน |
| **Port 5173 in use** | มี vite ค้างอยู่ — ปิด process เดิม หรือ vite จะเลือก port ใหม่ให้ |
| **Port 8000 in use** | เปลี่ยน: `uvicorn app.main:app --port 8001` แล้วตั้ง `VITE_API_URL=http://127.0.0.1:8001/api/v1` |
| ข้อมูลเดโมเพี้ยน (ลองกดเล่นจนเลขมั่ว) | `python -m app.seed` รีเซ็ตกลับ |
| ลืมรหัสเดโม | `demo@ngernthon.app` / `password123` |

---

> **สถานะปัจจุบัน:** Phase 0–8 เสร็จ + Phase 9.1–9.3 ของ AI assistant พร้อมโค้ดแล้ว (รอ `GEMINI_API_KEY` เพื่อ verify คุยกับ provider จริง) · Backend 68 pytest + Frontend 23 vitest ผ่าน · ดูแผนเต็มใน [`project_tracking.md`](project_tracking.md)
