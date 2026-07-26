# Phase 9 — ผู้ช่วยการเงิน AI (เงินทอน)

> สถานะ: 🚧 **9.1–9.3 เสร็จ (รอ Gemini key)** · เริ่ม 2026-07-06 · (9.4–9.6 ยังไม่เริ่ม)
> Phase 0–8 เสร็จแล้ว (backend + แอปจริง + Android) · ตอนนี้ **68 pytest / 23 vitest ผ่าน**
> 9.1–9.3: snapshot builder + router/failover + Gemini adapter + `/ai/chat` + consent PDPA +
> ประวัติแชท + หน้าแชทจริงในแอป — โค้ดพร้อม "เสียบ `GEMINI_API_KEY` ใน `.env` แล้ววิ่งได้ทันที"
> **แนวทาง: ใช้ free-tier cloud หลายเจ้า "หมุนกัน" — เจ้าไหนหมด limit สลับเจ้าถัดไปอัตโนมัติ + เผื่อ subscription tier**

---

## 0. หลักการสำคัญ (ยึดตั้งแต่แรก)

**A. AI ห้ามคิดเลขเอง — ป้อนตัวเลขที่คำนวณแล้วให้มัน (grounding)**
ระบบมี source of truth อยู่แล้ว:
- `backend/app/services/aggregation.py` — สูตรคำนวณ (ยอดเหลือใช้จริง, budget usage, reserved, daily allowance)
- `backend/app/services/insights.py` — rule-based engine (หมวดใช้เกิน, เทียบเดือนก่อน, บิลใกล้ครบกำหนด, pace)

Phase 9 จะ **pre-compute snapshot** จาก 2 ตัวนี้แล้ว inject เข้า context ให้ LLM อธิบาย/วางแผน
**ห้าม** ปล่อยให้ LLM บวกเลขเงินเอง (เสี่ยง hallucinate ตัวเลข ซึ่งรับไม่ได้ในแอปการเงิน)

**B. ขอบเขต = "ผู้ช่วยจัดงบ" ไม่ใช่ "ที่ปรึกษาการลงทุน"** ⚠️
- ✅ อธิบายรายจ่ายของตัวเอง / วางแผน cash-flow ถึงวันเงินเดือน / เตือนบิล / แนะนำลดหมวดไหน
- ❌ "ควรซื้อหุ้น/คริปโต/กองทุนตัวไหน", คำแนะนำการลงทุนเฉพาะบุคคล → system prompt ต้องปฏิเสธ + บอกให้ปรึกษาผู้เชี่ยวชาญที่มีใบอนุญาต

**C. AI ห้ามแตะ ledger ตรง ๆ**
ทุก action ที่ AI เสนอ (สร้างรายการ / ปรับงบ) ต้องผ่าน **endpoint เดิม** ที่ hardening แล้ว
(`ownership.py` guards + `Field(gt=0)`) และ **ยืนยันผ่าน dialog** ก่อนเสมอ (ใช้ `useDialog` ที่มีอยู่)

**D. Provider-agnostic + auto-failover เมื่อชน limit** ⭐ (หัวใจของรอบนี้)
free tier ทุกเจ้า **มี limit** (ต่อนาที/ต่อวัน) → พอเจ้านึงหมด ต้องสลับเจ้าถัดไปเอง
โค้ดเรียก LLM ผ่าน interface เดียว (`AiProvider`) + **router** ที่:
- เรียง provider เป็น "pool" (เช่น `gemini → groq → openrouter → cerebras`)
- เจ้าไหน **ชน rate-limit/quota (429)** → mark cooldown ถึงเวลา reset แล้ว **ข้ามไปเจ้าถัดไปทันที** ในคำขอเดียว
- หมุนแบบนี้ = ได้ "โควตาฟรีรวม" จากหลายเจ้า ยืดการใช้ฟรีให้นานที่สุด

**E. Subscription-aware routing** 💳 (โมเดลธุรกิจ: **แอปขาย subscription ให้ผู้ใช้**)
routing เลือก pool + เพดานตาม **`subscription_tier` ของ user** → subscription = ตัวปลดล็อก AI ที่ดีขึ้น:

| | **Free user** | **Subscriber (paid)** |
|---|---|---|
| pool | free pool ล้วน (หมุนกันตาม §D) | premium (paid API) นำ + free เป็น overflow |
| คุณภาพ/ความเสถียร | ตามที่ free tier เหลือ | สูง/นิ่งกว่า (ไม่ต้องรอ reset) |
| เพดานต่อวัน | จำกัด (เช่น N ข้อความ/วัน) | สูงขึ้น/ไม่จำกัด |
| ชนเพดาน | แจ้ง "AI เต็มโควตา — อัปเกรดเพื่อใช้ต่อ" | แทบไม่ชน |

- เก็บ `subscription_tier` ที่ user (ค่าเริ่ม `free`); **free user ห้ามหลุดไปยิง provider paid เด็ดขาด** (บังคับใน `factory.router_for`) → กันต้นทุน AI รั่วให้ผู้ใช้ที่ไม่ได้จ่าย
- **ระบบเก็บเงิน/billing เอง (Stripe / App Store IAP ฯลฯ) = คนละเฟส** — Phase 9 แค่ **อ่าน** `subscription_tier`; ตัวตั้งค่า tier (webhook จาก billing) ทำแยกใน Phase ถัดไป

---

## 1. ฟีเจอร์ (เรียงตาม value / effort)

| # | ฟีเจอร์ | ทำอะไร | งานหนัก/เบา |
|---|---------|--------|:---:|
| 1 | **Chat ถาม-ตอบการเงิน** | "เดือนนี้ใช้เยอะไปไหม" / "เงินพอถึงสิ้นเดือนมั้ย" → ตอบจาก snapshot จริง | หนัก |
| 2 | **สรุปเดือนเป็นภาษาคน** | เอา `insights.evaluate()` (มีแล้ว) มาเรียบเรียงเป็นย่อหน้า + คำแนะนำ | เบา |
| 3 | **บันทึกรายการด้วยข้อความ** | "จ่ายค่ากาแฟ 60" → parse {หมวด, จำนวน} → เด้ง dialog ยืนยัน → สร้างผ่าน endpoint เดิม | เบา |
| 4 | **ช่วยร่างแผน** | จาก summary+budgets+bills+goals → เสนอแผนลดรายจ่าย/แบ่งเงินเข้าเป้า | หนัก |
| 5 | **ประวัติแชท** | `ai_conversations`/`ai_messages` ให้ย้อนดู + เก็บว่า provider ไหนตอบ | — |

> ไม่ผูก model รายฟีเจอร์ — แต่ละฟีเจอร์บอกแค่ระดับความเก่ง (`task`: cheap/chat/plan) แล้ว router เลือก provider/รุ่นที่ยังไม่ชน limit ใน pool ให้เอง

---

## 2. Provider abstraction + auto-failover (§D — ส่วนสำคัญสุด)

### 2.1 Interface เดียว ทุก provider หน้าตาเหมือนกัน

```python
# backend/app/ai/base.py
@dataclass
class AiResult:
    text: str
    provider: str          # "gemini" | "groq" | "openrouter" | ...
    model: str             # รุ่นจริงที่ตอบ

class AiProvider(Protocol):
    name: str
    tier: str              # "free" | "paid"
    def chat(self, *, system: str, messages: list[dict], task: str) -> AiResult: ...

# error taxonomy — router ใช้ตัดสินใจว่าจะข้ามหรือไม่
class ProviderExhausted(Exception):   # ชน rate-limit/quota (429) → cooldown ถึง reset แล้วข้าม
    retry_after: float | None         #   ← อ่านจาก header Retry-After ถ้ามี
class ProviderUnavailable(Exception): # ล่ม/timeout/5xx → cooldown สั้น แล้วข้าม
class ProviderBadRequest(Exception):  # 400/พังฝั่งเรา → อย่าข้าม, โยนขึ้น (บั๊กเรา)
```

### 2.2 Router = pool + cooldown + เลือกตัวที่ยังไม่ชนเพดาน

```python
# backend/app/ai/router.py
class AiRouter:
    def __init__(self, pool: list[AiProvider]):
        self.pool = pool
        self._cooldown: dict[str, float] = {}   # provider → เวลาพร้อมใช้อีกครั้ง (epoch)

    def chat(self, *, system, messages, task) -> AiResult:
        errors = []
        for p in self.pool:
            if time.time() < self._cooldown.get(p.name, 0):
                continue                          # เจ้านี้ยังชนเพดานอยู่ ข้าม
            try:
                return p.chat(system=system, messages=messages, task=task)
            except ProviderExhausted as e:
                self._cooldown[p.name] = time.time() + (e.retry_after or _default_cd(e))
                errors.append((p.name, "limit"))
            except ProviderUnavailable:
                self._cooldown[p.name] = time.time() + 30
                errors.append((p.name, "down"))
            # ProviderBadRequest → เด้งขึ้นทันที (ไม่ใช่เพดานหมด)
        raise AllProvidersExhausted(errors)       # ทุกเจ้าเต็ม → frontend แจ้ง "AI เต็มโควตา ลองใหม่ภายหลัง / อัปเกรด"
```

**cooldown default** (เมื่อไม่มี `Retry-After`):
- rate-limit ต่อนาที → 60 วินาที
- quota รายวันหมด → จนถึงเวลา reset ของเจ้านั้น (ปกติเที่ยงคืน UTC/PT — ตั้งต่อ provider)

### 2.3 เลือก pool ตาม tier ของ user (§E)

```python
# backend/app/ai/factory.py
def router_for(user) -> AiRouter:
    free  = build_pool(settings.ai_free_chain)      # ["gemini","groq","openrouter","cerebras"]
    if user.subscription_tier == "paid" and settings.ai_allow_paid:
        return AiRouter(build_pool(settings.ai_paid_chain) + free)   # paid นำ + free เป็น overflow
    return AiRouter(free)                            # free user: free pool ล้วน
```
- provider ไม่มี key → **ข้ามตอน build pool** (ไม่ error) → ใส่เท่าที่สมัคร
- `AI_FREE_CHAIN=gemini,groq,openrouter,cerebras` · `AI_PAID_CHAIN=` (เว้นไว้จนพร้อม subscribe) · `AI_ALLOW_PAID=false`

### 2.4 free-tier cloud providers ที่จะหมุน (ไม่มี local)

| provider | ไทยดีแค่ไหน | free limit (โดยประมาณ*) | reset | key |
|---|---|---|---|---|
| **Gemini** (Google AI Studio) ⭐ | ดีมาก | จำกัด req/นาที + req/วัน (Flash) | รายวัน | ฟรี |
| **Groq** | ดี (Qwen/Llama) | token/นาที + /วัน, เร็วมาก | นาที/วัน | ฟรี |
| **OpenRouter** (`:free`) | ปาน–ดี | หลายโมเดลฟรีใน key เดียว, rate-limit | นาที | ฟรี |
| **Cerebras** | ดี (Llama/Qwen) | req/วัน, เร็วมาก | รายวัน | ฟรี |
| **GitHub Models** | ดี (หลายรุ่น) | req/วัน ต่อผู้ใช้ GitHub | รายวัน | ฟรี |
| **Mistral** (La Plateforme) | ปาน | free experimental tier | นาที/วัน | ฟรี |

> *limit เปลี่ยนได้ตลอด — จึงทำเป็น **config-driven** ไม่ hard-code. ลำดับใน pool เรียงตาม "ไทยดี + limit เยอะ" (แนะนำเริ่ม Gemini → Groq)
> หมุนหลายเจ้า = รวมโควตาฟรีได้เยอะ; แต่ทุกเจ้าเป็น cloud → **ต้องมี PDPA consent** (ดู §8)

---

## 3. Data flow (chat 1 ครั้ง)

```
user พิมพ์ ──► POST /api/v1/ai/chat
  1. build snapshot: aggregation + insights.evaluate() + budgets + บิลค้าง
  2. router = router_for(user)  ← เลือก pool ตาม subscription_tier
  3. router.chat(system=guardrail+persona, messages, task="chat")
        → ลอง gemini → 429 quota หมด → groq → 429 → openrouter → ...
  4. ตอบกลับ + save ai_messages (meta เก็บ snapshot + provider/model ที่ตอบจริง)
  5. frontend โชว์ "ตอบโดย Gemini Flash"
```

---

## 4. Data model

```python
# backend/app/models/ai.py
class AiConversation(SQLModel, table=True):
    __tablename__ = "ai_conversations"
    id / user_id(FK) / title / created_at / updated_at

class AiMessage(SQLModel, table=True):
    __tablename__ = "ai_messages"
    id / conversation_id(FK) / role            # user|assistant|system
    content: str
    provider: str | None      # ✚ provider ที่ตอบ
    model: str | None         # ✚ รุ่นที่ตอบ
    meta: str | None          # JSON: snapshot ที่ใช้ตอบ (audit)
    created_at

# users: เพิ่มฟิลด์ (§E)
subscription_tier: str = "free"   # free | paid   ← เผื่อ subscribe
ai_consent_at: datetime | None    # ✚ PDPA: เวลาที่ยินยอมส่งข้อมูลไป cloud AI
```
> เพิ่ม `require_owned_conversation()` ใน `ownership.py`

---

## 5. Endpoints (`routers/ai.py`)

| Method | Path | ทำอะไร |
|--------|------|--------|
| POST | `/api/v1/ai/chat` | ถาม-ตอบ (#1) |
| POST | `/api/v1/ai/summary` | สรุปเดือน (#2) |
| POST | `/api/v1/ai/plan` | ร่างแผน (#4) |
| POST | `/api/v1/ai/parse-transaction` | NL → draft (#3, ไม่สร้างเอง) |
| GET/DELETE | `/api/v1/ai/conversations[/{id}]` | ประวัติ |
| POST | `/api/v1/ai/consent` | ✚ บันทึกความยินยอม PDPA (§8-2) |
| GET | `/api/v1/ai/status` | ✚ สถานะ provider (up / cooldown ถึงเมื่อไหร่ / โควตาเหลือ) |

---

## 6. ไฟล์ที่จะเพิ่ม / แก้

**Backend**
- `backend/app/ai/base.py` *(ใหม่)* — `AiProvider`, `AiResult`, error taxonomy (§2.1)
- `backend/app/ai/router.py` *(ใหม่)* — `AiRouter` pool + cooldown + failover (§2.2)
- `backend/app/ai/factory.py` *(ใหม่)* — เลือก pool ตาม tier + ข้าม provider ไม่มี key (§2.3)
- `backend/app/ai/providers/gemini.py`, `groq.py`, `openrouter.py`, `cerebras.py` *(ใหม่)* — adapter (เรียก REST ผ่าน `httpx`, map `task`→รุ่น, แปลง 429/5xx เป็น error taxonomy + อ่าน `Retry-After`)
- `backend/app/services/ai_context.py` *(ใหม่)* — snapshot builder
- `backend/app/services/prompts.py` *(ใหม่)* — system prompts (guardrail + persona ไทย)
- `backend/app/models/ai.py` *(ใหม่)* + Alembic migration (2 ตาราง + ฟิลด์ user)
- `backend/app/routers/ai.py` *(ใหม่)* — endpoints §5
- `backend/app/services/ownership.py` — `require_owned_conversation()`
- `backend/app/config.py` — `ai_free_chain`, `ai_paid_chain`, `ai_allow_paid`, `ai_daily_message_limit`, keys
- `backend/requirements.txt` — `httpx`

**Frontend**
- `src/api/client.js` — `ai.chat/summary/plan/parseTransaction/consent/status()`
- `src/live/` — wire หน้า chat จริง (มี mockup แล้ว) + แสดง "ตอบโดย <provider>" + หน้า **consent ครั้งแรก** + NL entry (#3) → `useDialog` → `transactions.create()`
- (เผื่อ subscribe) หน้าอัปเกรด/สถานะ tier — เฟสหลัง

**Env** (`backend/.env`, gitignored)
- `AI_FREE_CHAIN=gemini,groq,openrouter,cerebras` · `AI_PAID_CHAIN=` · `AI_ALLOW_PAID=false`
- `GEMINI_API_KEY=...` · `GROQ_API_KEY=...` · `OPENROUTER_API_KEY=...` · `CEREBRAS_API_KEY=...` (ใส่เท่าที่สมัคร)

---

## 7. แบ่ง sub-phase (ลำดับลงมือ)

| Phase | งาน | ต้องมี key? | สถานะ |
|-------|-----|:---:|:---:|
| **9.1** | `ai_context.py` snapshot builder + **unit test ตัวเลขตรงกับ aggregation** | ✘ | ✅ เสร็จ |
| **9.2** | **abstraction + router + failover** (`base/router/factory`) + **unit test failover** (mock provider raise Exhausted → เช็คเด้งไปเจ้าถัดไป + cooldown ไม่ยิงซ้ำ + เลือก pool ตาม tier) | ✘ | ✅ เสร็จ |
| **9.3** | provider แรก: **Gemini adapter** + `/ai/chat` + guardrail + consent flow + save history + wire หน้า chat จริง | ✔ (Gemini free) | ✅ เสร็จ (รอ key เพื่อ verify คุยจริง) |
| **9.4** | provider สำรอง: **Groq + OpenRouter (+Cerebras) adapter** → auto-failover หมุนกันจริง | ✔ (free keys) |
| **9.5** | สรุปเดือน (#2) + `/ai/plan` (#4) + NL entry (#3) | ✔ |
| **9.6** | เพดาน free/วัน + `/ai/status` + **tier-aware routing** (อ่าน `subscription_tier`) + **paid provider adapter** (หลัง `AI_ALLOW_PAID`) — *billing จริงเป็น Phase แยก* | ✔ |

> เริ่ม **9.1 → 9.2 ได้เลยโดยไม่ต้องมี key** (test snapshot + test failover ด้วย mock provider)
> ก้อนแรกที่ใช้งานจริง = **9.1→9.2→9.3** (chat ตอบจาก Gemini free) → พอ 9.4 ก็มี backup หมุนกันครบ

---

## 8. ต้องตัดสินใจ

1. **PDPA consent จำเป็นแล้ว** — ทุก provider เป็น cloud (ไม่มี local) → **ต้องมีหน้าขอความยินยอม** ส่งข้อมูลการเงินไปประมวลผลที่ผู้ให้บริการ AI ก่อนใช้ครั้งแรก + เก็บ `ai_consent_at`; ไม่ยินยอม = ปิดฟีเจอร์ AI
2. **subscribe = แอปขาย subscription ให้ผู้ใช้** (ตัดสินแล้ว) → per-user `subscription_tier` (§E). **billing จริง (Stripe/App Store IAP) เป็น Phase แยก**; Phase 9 แค่อ่าน tier แล้ว route/จำกัดเพดานตามนั้น. ต้องกำหนด: เพดาน free/วันเท่าไร + premium ใช้ provider อะไร
3. **กันจ่ายเงินเกิน** — free user ห้ามหลุดไป provider paid (บังคับใน `factory.router_for`); เปิด paid ต้องตั้ง `AI_ALLOW_PAID=true` + ควรมี daily spend cap
4. **ทุกเจ้าเต็มพร้อมกัน** — free tier รวมกันก็มีเพดาน → เมื่อ `AllProvidersExhausted` ให้ frontend แจ้งสุภาพ + เสนออัปเกรด (เชื่อมกับ §E)
5. **Streaming** — เริ่มรอทีเดียวก่อน (failover ง่ายกว่า), เพิ่ม SSE ทีหลัง

---

## 9. Definition of Done (ก้อนแรก = 9.1–9.3)

- [ ] `/ai/chat` ตอบจาก **snapshot จริง** ผ่าน **Gemini free** (ไม่ hallucinate ตัวเลข)
- [ ] ถามเรื่องลงทุน → ปฏิเสธตาม guardrail
- [ ] **router failover**: unit test — provider แรก raise `ProviderExhausted(429)` → เด้งไปเจ้าถัดไป + เจ้าแรกเข้า cooldown ไม่ถูกยิงซ้ำจน reset
- [ ] **tier routing**: free user ได้ free pool ล้วน, ไม่มีทางหลุดไป paid
- [ ] **PDPA**: ต้องยินยอมก่อนถึงใช้ AI ได้; เก็บ `ai_consent_at`
- [ ] ประวัติแชท save/list/delete + ownership guard (user อื่น → 404) + เก็บ provider ที่ตอบ
- [ ] หน้า chat จริงในแอปโชว์ "ตอบโดย <provider>" ได้ทั้ง web + Android

---

## 10. ประเมินคร่าว ๆ

- **9.1–9.3:** chat ใช้งานได้จริงด้วย Gemini free (คุ้มสุด) — คอขวด: สมัคร **Gemini API key** (ฟรี ที่ Google AI Studio)
- **9.4:** สมัคร Groq/OpenRouter/Cerebras (ฟรี) เพิ่ม → failover หมุนกันครบ ยืดโควตาฟรี
- **9.6:** subscription tier + paid provider — ทำเมื่อโมเดลธุรกิจ subscribe พร้อม
