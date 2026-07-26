# Test Results

Folder สำหรับ capture ผลเทสและหลักฐานการตรวจระบบ เช่น log, junit, screenshot, smoke output, หรือไฟล์แนบตอนส่ง defect

โครงสร้างที่แนะนำ:

- `backend/` — ผลรัน pytest หรือ backend logs
- `frontend/` — ผลรัน vitest หรือ frontend coverage/logs
- `smoke/` — ผลรัน contract/API smoke tests
- `screenshots/` — screenshot จาก browser/manual QA

ไฟล์ผลลัพธ์จริงจะถูก ignore โดย default เพื่อกัน artifact หนัก ๆ หรือข้อมูลแวดล้อมหลุดเข้า git หากต้องการเก็บไฟล์ใดเป็นหลักฐานใน repo ให้เพิ่ม rule เฉพาะไฟล์นั้นใน `.gitignore`
