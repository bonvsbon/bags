# ลงแอป "เงินทอน" บนมือถือ Android ของตัวเอง (APK ผ่าน Capacitor)

แอปถูกห่อด้วย **Capacitor** เป็นโปรเจกต์ Android เรียบร้อยแล้ว (โฟลเดอร์ `android/`)
ตัวแอปจะเรียก **API ที่รันบนคอมพิวเตอร์ของคุณ** ผ่าน Wi-Fi เดียวกัน

```
มือถือ (แอป APK)  ──Wi-Fi──►  คอม: http://192.168.4.117:8000  (FastAPI)
```

> ⚙️ ที่ตั้งค่าไว้แล้ว: appId `app.ngernthon` · ชื่อแอป "เงินทอน" · API = `http://192.168.4.117:8000/api/v1`
> (ฝังไว้ใน `.env.production` — ถ้า **IP เครื่องเปลี่ยน** ให้แก้ไฟล์นี้แล้วสั่ง `npm run android:build` ใหม่)

---

## ครั้งแรก: สิ่งที่ต้องลง (บนคอม)

1. **Android Studio** → https://developer.android.com/studio
   - ลงแบบ Standard — มันจะลง **JDK + Android SDK** ให้อัตโนมัติ (ดาวน์โหลด ~1–1.5 GB)
   - เปิด Android Studio ครั้งแรก ปล่อยให้มันโหลด SDK ให้เสร็จ

2. **เปิด Developer Mode บนมือถือ**
   - ตั้งค่า → เกี่ยวกับโทรศัพท์ → แตะ "หมายเลขบิวด์" (Build number) 7 ครั้ง
   - กลับมา ตั้งค่า → ระบบ → ตัวเลือกนักพัฒนา → เปิด **USB debugging**

---

## ทุกครั้งที่จะใช้: รัน API ก่อน (บนคอม)

เปิด terminal ที่โฟลเดอร์ `backend`:
```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
> ⚠️ ต้องเป็น `--host 0.0.0.0` (ไม่ใช่ 127.0.0.1) มือถือถึงจะเข้าถึงได้
> ครั้งแรก Windows Firewall อาจถามให้อนุญาต `python` → กด **Allow access** (Private networks)
> คอมกับมือถือต้องอยู่ **Wi-Fi เดียวกัน**

---

## ติดตั้งแอปลงมือถือ

1. เสียบมือถือกับคอมด้วยสาย USB → บนมือถือกด **อนุญาต (Allow)** การ debug
2. เปิดโปรเจกต์ Android ใน Android Studio — สั่งจากที่ root ของโปรเจกต์:
   ```bash
   npm run android:open
   ```
   (หรือเปิด Android Studio → Open → เลือกโฟลเดอร์ `android`)
3. รอ **Gradle sync** เสร็จ (แถบล่างหยุดหมุน — ครั้งแรกนานหน่อย)
4. เลือกมือถือคุณตรงมุมบน (ช่องเลือกอุปกรณ์) แล้วกดปุ่ม **▶ Run** (สีเขียว)
5. แอป "เงินทอน" จะถูกติดตั้งและเปิดบนมือถือ — เข้าด้วยบัญชีเดโม `demo@ngernthon.app` / `password123`

> ได้ไฟล์ `.apk` ตรง ๆ ไหม? ได้ — เมนู **Build → Build Bundle(s) / APK(s) → Build APK(s)**
> ไฟล์อยู่ที่ `android/app/build/outputs/apk/debug/app-debug.apk` (ก๊อปไปลงเครื่องอื่นได้)

---

## แก้ปัญหา

| อาการ | วิธีแก้ |
|---|---|
| แอปเปิดมา "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" | (1) รัน uvicorn ด้วย `--host 0.0.0.0` แล้วยัง (2) คอม+มือถือ Wi-Fi เดียวกันไหม (3) Firewall อนุญาต python แล้วไหม |
| IP เครื่องเปลี่ยน (เช่นย้าย Wi-Fi) | แก้ `VITE_API_URL` ใน `.env.production` → `npm run android:build` → Run ใหม่ |
| Android Studio หา SDK ไม่เจอ | เปิด Android Studio → More Actions → SDK Manager → ลง "Android SDK Platform" ล่าสุด |
| อยากได้ไอคอน ฿ สวย ๆ แทนไอคอนเริ่มต้น | ใช้ `@capacitor/assets` กับรูป PNG 1024×1024 (ทำทีหลังได้) |

---

## คำสั่งสรุป (ที่ root ของโปรเจกต์)

| ทำอะไร | คำสั่ง |
|---|---|
| build เว็บใหม่ + sync เข้า Android (หลังแก้โค้ด/IP) | `npm run android:build` |
| เปิดโปรเจกต์ใน Android Studio | `npm run android:open` |

> ขั้นต่อไปสู่ Play Store: ทำ **signed AAB** (Build → Generate Signed Bundle) — ดู [README §8](README.md) บอกผมได้เลยถ้าจะทำ
