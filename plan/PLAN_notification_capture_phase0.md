# แผนงาน: Notification Capture (Phase 0) — ดัก noti ธนาคาร เข้าระบบเงินทอน

> เอกสารนี้เขียนให้ Claude Code ใช้ต่อในโปรเจกต์ **เงินทอน (Ngern Thon)**
> เป็นแผนสำหรับ **เฟส 0 เท่านั้น**: ดัก notification → กรอง (whitelist) → แสดง/เก็บข้อความดิบ
> ยังไม่ parse ตัวเลข ยังไม่ยิง backend production — เป้าหมายคือ "เห็นข้อมูลจริงก่อน"

---

## 0. Context ของโปรเจกต์ (สิ่งที่มีอยู่แล้ว — อย่าเขียนใหม่)

- **Frontend**: React + Vite (`src/screens/`, `src/components/`, `src/store.js`, `src/api/client.js`)
- **Mobile shell**: **Capacitor** (มีโฟลเดอร์ `android/` ครบแล้ว, `capacitor.config.json`)
  - Android package: `app.ngernthon` (ดู `android/app/src/main/java/app/ngernthon/MainActivity.java`)
- **Backend**: FastAPI (`backend/app/`), มี ledger service, aggregation, job scheduler (`backend/app/jobs/`), AI (Gemini)

**สำคัญ**: โปรเจกต์นี้เป็น Capacitor ไม่ใช่ Flutter — งานดัก noti จะทำเป็น **Capacitor plugin (Android/Java) + bridge เข้า JS** ไม่ต้องเปลี่ยน stack

---

## 1. เป้าหมายของเฟส 0 (Definition of Done)

เมื่อจบเฟสนี้ ต้องได้:

1. แอป Android ขอสิทธิ์ Notification Access ได้ และผู้ใช้เปิดสิทธิ์ได้
2. ดักทุก notification ที่เข้าเครื่องได้ (ผ่าน `NotificationListenerService`)
3. **กรองด้วย whitelist**: เก็บเฉพาะ package ที่กำหนด ที่เหลือทิ้งทันที
4. **sanity check**: ทิ้ง noti ที่ไม่มีตัวเลข (เช่น โปรโมชัน/เตือนอัปเดต)
5. ส่งข้อความดิบที่ผ่าน filter → เข้า JS layer → **แสดงบนหน้าจอ debug + เก็บ local (SQLite/Preferences)**
6. **ยังไม่**ยิง backend, **ยังไม่** parse ตัวเลข/ทิศทางเงินเข้า-ออก

เหตุผลที่หยุดแค่นี้: ต้องเห็นก่อนว่าธนาคารจริง (เริ่มที่ SCB) ส่ง package อะไร + ข้อความหน้าตายังไง แล้วค่อยออกแบบ parser จากข้อมูลจริง ไม่ใช่เดา

---

## 2. หลักการออกแบบ (ห้ามละเมิด)

1. **Whitelist ไม่ใช่ blacklist** — อนุญาตเฉพาะ package ธนาคารที่ระบุ ที่เหลือ (LINE, Messenger, เกม, ทุกอย่าง) ทิ้งหมดโดย default. เหตุผล: แชทเด้งถี่มาก + ข้อความส่วนตัวต้องไม่มีทางหลุดเข้า pipeline
2. **กรองให้เร็วที่สุด ตั้งแต่บรรทัดแรก** — เช็ก package ก่อนแตะอย่างอื่น ไม่ผ่าน = `return` ทันที (ประหยัดแบต/CPU)
3. **มือถือไม่ parse** — มือถือแค่ตัดสิน "เอา/ไม่เอา" แล้วส่ง **raw text ทั้งก้อน** ต่อ. การ parse ตัวเลข/ทิศทางทำที่ backend เฟสหลัง (แก้ parser ที่เดียว ไม่ต้อง build แอปใหม่)
4. **เก็บ raw เสมอ** — แม้ข้อความที่ดูแปลก ก็เก็บดิบไว้ (ไว้ debug + เขียน parser ย้อนหลัง)
5. **แยก Filter ออกจาก Service** — ตรรกะ whitelist อยู่ในคลาสเดียว (`BankNotificationFilter`) เพื่อ unit test ได้โดยไม่ต้องมี Android runtime

---

## 3. สถาปัตยกรรมเฟส 0

```
[Android OS]
   notification เด้ง (ทุกแอป)
        │  onNotificationPosted(sbn)
        ▼
[NotificationListenerService]  ← ตัวรับจาก OS
        │
        ▼
[BankNotificationFilter.shouldCapture()]  ← หัวใจ: whitelist + sanity
        │  ผ่านเท่านั้น
        ▼
[Capacitor Plugin bridge]  ← ยิง event เข้า JS
        │  notifyListeners("bankNotification", {...})
        ▼
[JS layer: src/notifications/*]
        │
        ├─ แสดงบนหน้า Debug (React)
        └─ เก็บ local (Capacitor Preferences หรือ SQLite)
```

**ยังไม่มี**: การส่งออก backend / queue / parser — เก็บไว้เฟสถัดไป แต่ให้ **วาง interface `CapturedNotification` กลางไว้** เพื่อเฟสหน้าต่อยอดโดยไม่ต้องรื้อ

---

## 4. โครงไฟล์ที่ต้องสร้าง

### ฝั่ง Android (Java) — ใต้ `android/app/src/main/java/app/ngernthon/`
```
notifications/
  NotiListenerService.java     # extends NotificationListenerService
  BankNotificationFilter.java  # ตรรกะ whitelist + sanity (แยกออกมา test ได้)
  BankPackages.java            # ค่าคงที่ list package ธนาคาร (เฟส 0 hardcode)
  NotiCapturePlugin.java       # Capacitor @CapacitorPlugin bridge เข้า JS
```

### ฝั่ง JS/React — ใต้ `src/`
```
notifications/
  captureBridge.js   # หุ้ม plugin: ขอ permission, subscribe event
  types.js           # interface CapturedNotification (สัญญากลาง)
  store.js           # เก็บรายการ noti ที่ดักได้ (in-memory + persist)
screens/
  NotiDebug.jsx      # หน้าจอ debug: แสดงรายการ noti ดิบที่ดักได้
```

### Android manifest
- `android/app/src/main/AndroidManifest.xml`: ประกาศ service + permission `BIND_NOTIFICATION_LISTENER_SERVICE`

---

## 5. สัญญากลาง (interface) — `CapturedNotification`

ทุก noti ที่ผ่าน filter แปลงเป็น object นี้ก่อนส่งเข้า JS. เฟสหน้า (parse/ยิง backend) จะพึ่ง interface นี้ ไม่ใช่ raw ของ Android โดยตรง:

```
CapturedNotification {
  id:          string   // hash(packageName + postTime + text) กัน duplicate
  packageName: string   // เช่น "com.scb.phone"
  title:       string   // noti title (อาจว่าง)
  text:        string    // noti body/bigText
  rawText:     string   // title + "\n" + text (ก้อนดิบไว้ debug/parse ทีหลัง)
  postedAt:    number   // epoch millis จาก sbn.getPostTime()
  capturedAt:  number   // epoch millis ตอนแอปรับได้
}
```

> เฟส 0 ไม่มี field `amount`, `direction`, `balance` — พวกนั้นเกิดตอน parse ที่ backend เฟสหลัง

---

## 6. ตรรกะ Filter (ต้องเขียนตามนี้)

```
shouldCapture(packageName, title, text):
    # ชั้น 1: whitelist package (ด่านแรก เร็วสุด)
    if packageName NOT IN BankPackages.WHITELIST:
        return false

    # ชั้น 2: sanity check เนื้อหา
    combined = (title + " " + text).trim()
    if combined is empty:
        return false
    if combined ไม่มีตัวเลขอารบิกเลย ([0-9]):
        return false        # ทิ้งพวกโปรโมชัน/เตือนอัปเดตที่ไม่มีจำนวนเงิน

    return true
```

หมายเหตุ: ชั้น 2 เป็น sanity แบบหยาบ (ถูก+เร็ว) ไม่ใช่การ parse. "มีตัวเลขไหม" พอสำหรับกรองขยะเฟสนี้

---

## 7. Whitelist package ธนาคารไทย (เฟส 0 = SCB ก่อน)

**เฟส 0 ให้เปิดใช้แค่ SCB** แต่ประกาศ list เต็มไว้ comment ให้ครบ:

```
com.scb.phone                          // SCB — ไทยพาณิชย์  (เปิดใช้เฟส 0)
com.krungthai.aspire                   // Krungthai NEXT
com.kasikorn.retail.mbanking.wap       // KBank — K PLUS
com.bbl.mobilebanking                  // Bangkok Bank
com.krungsri.kma                       // Krungsri — KMA
com.tmbbank.ttbtouch                   // TTB touch (อาจมีชื่ออื่น)
com.gsb.mobilebanking                  // GSB — ออมสิน
com.baac.report                        // ธ.ก.ส. (BAAC)
```

> ⚠️ **package เหล่านี้ต้อง verify ของจริง** — ธนาคารเปลี่ยน/มีหลายตัวได้
> วิธี verify: ดูขั้นตอนที่ 8 (โหมด log-all ชั่วคราว)

---

## 8. โหมด verify (สำคัญมาก — ทำก่อน lock whitelist)

ก่อนจะเชื่อ list package ข้างบน ให้มี **flag ชั่วคราว** `CAPTURE_ALL_FOR_VERIFY = true`:
- เมื่อเปิด: **ไม่กรอง package** แต่ log ทุก noti ออกมา (`packageName` + `rawText`) ที่หน้า Debug + Logcat
- ผู้ใช้ (เจ้าของ) เปิดแอปธนาคารทำธุรกรรมจริง แล้วดูว่า:
  - SCB ใช้ packageName อะไรกันแน่
  - ข้อความ noti หน้าตายังไง (เอาไว้ออกแบบ parser เฟสหลัง)
- เก็บตัวอย่างข้อความจริง 10–20 อันไว้ (จะใช้เป็น test fixture ของ parser)
- verify เสร็จ → ตั้ง `CAPTURE_ALL_FOR_VERIFY = false` → กลับมาใช้ whitelist ปกติ

> ระวัง: ตอนเปิดโหมดนี้จะเห็น noti ทุกแอปรวมแชท — เป็นเรื่องปกติของโหมด verify เท่านั้น ปิดทันทีเมื่อได้ package แล้ว และอย่า commit ค่า true

---

## 9. Permission flow (Android Notification Access)

- ต้องขอสิทธิ์พิเศษ: ผู้ใช้ต้องไปเปิดเองใน Settings → Notification access (เปิดให้โปรแกรมพาไปหน้านั้นด้วย `Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS`)
- Plugin ต้องมีเมธอด:
  - `isPermissionGranted()` → เช็กว่าเปิดสิทธิ์แล้วหรือยัง
  - `openPermissionSettings()` → เปิดหน้า settings ให้ผู้ใช้กด
- หน้า `NotiDebug.jsx` ต้องมีปุ่มเรียก 2 เมธอดนี้ + แสดงสถานะสิทธิ์

---

## 10. ลำดับงานให้ Claude Code ทำ (ทีละ step — อย่าทำรวด)

> ขอให้ทำทีละ step แล้วหยุดให้ผมรีวิว/ทดสอบก่อนไป step ถัดไป
> โค้ด Android (Java) เป็นของใหม่สำหรับผม — **อธิบายทุกบล็อกเป็นภาษาไทยว่าทำอะไร**

- **Step 1**: ประกาศ service + permission ใน `AndroidManifest.xml` และสร้าง `NotiListenerService.java` เปล่าๆ ที่ override `onNotificationPosted` แล้ว log packageName + text ลง Logcat เฉยๆ (ยังไม่ filter ยังไม่ bridge) — เป้าหมาย: พิสูจน์ว่า service ทำงาน + ดัก noti ได้จริง
- **Step 2**: เพิ่ม `BankPackages.java` + `BankNotificationFilter.java` (พร้อม flag `CAPTURE_ALL_FOR_VERIFY`) + unit test ของ filter
- **Step 3**: สร้าง `NotiCapturePlugin.java` (Capacitor plugin) + เมธอด permission + ยิง event `bankNotification` เข้า JS
- **Step 4**: ฝั่ง JS — `captureBridge.js`, `types.js` (interface `CapturedNotification`), `store.js`
- **Step 5**: หน้า `NotiDebug.jsx` — ปุ่มขอสิทธิ์ + แสดงรายการ noti ดิบ real-time + ปุ่ม copy/clear
- **Step 6**: รันจริงบนเครื่อง เปิดโหมด verify ทำธุรกรรม SCB จริง เก็บตัวอย่างข้อความ → สรุป package จริง + รูปแบบข้อความ (ส่งมอบเป็น fixture สำหรับ parser เฟสหน้า)

---

## 11. ขอบเขต — สิ่งที่ **ห้ามทำ**ในเฟสนี้

- ❌ อย่า parse จำนวนเงิน/ทิศทาง/merchant ที่มือถือ
- ❌ อย่ายิง backend / สร้าง endpoint ingest (เฟสหน้า)
- ❌ อย่าตั้ง queue (RabbitMQ/Redis) — เฟสหน้าจะเริ่มด้วยตาราง `raw_notification` ก่อน
- ❌ อย่าแตะ ledger/aggregation/AI ที่มีอยู่
- ❌ อย่า hardcode `CAPTURE_ALL_FOR_VERIFY = true` ตอน commit

---

## 12. หมายเหตุด้านความปลอดภัย/ข้อจำกัด (บันทึกไว้)

- ข้อมูล noti การเงินเป็นข้อมูลอ่อนไหว → เก็บ local เท่านั้นในเฟสนี้ (ยังไม่ออกนอกเครื่อง)
- `NotificationListenerService` เป็น permission ที่ Google เข้มมากถ้าจะขึ้น Play Store — เฟสนี้ใช้แบบ sideload ส่วนตัว ไม่มีปัญหา
- **iOS ทำส่วนนี้ไม่ได้** (OS ไม่ให้อ่าน noti แอปอื่น) — เฟส 0 เป็น Android-only; ตัว interface `CapturedNotification` ที่วางไว้จะให้ iOS เฟสหลังป้อนข้อมูลจากช่องทางอื่น (CSV/อื่นๆ) เข้าท่อเดียวกันได้โดยไม่รื้อ
