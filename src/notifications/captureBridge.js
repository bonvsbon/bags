// captureBridge — หุ้ม Capacitor plugin "NotiCapture" ให้ React เรียกง่าย
//
// ฟีเจอร์ดัก notification ทำงานเฉพาะบนแอป Android (native) เท่านั้น
// บนเบราว์เซอร์/เว็บ plugin ไม่มีอยู่ → isSupported() = false และทุกเมธอด
// จะคืนค่าปลอดภัย (ไม่ throw) เพื่อให้หน้า UI แสดงข้อความ "ใช้ได้เฉพาะแอป" ได้

import { registerPlugin, Capacitor } from '@capacitor/core';

const NotiCapture = registerPlugin('NotiCapture');

// รองรับเฉพาะตอนรันเป็นแอป native บน Android
export function isSupported() {
  try {
    return Capacitor?.isNativePlatform?.() === true
      && Capacitor?.getPlatform?.() === 'android';
  } catch {
    return false;
  }
}

// --- สิทธิ์ Notification Access ---

export async function isPermissionGranted() {
  if (!isSupported()) return false;
  try {
    const { granted } = await NotiCapture.isPermissionGranted();
    return !!granted;
  } catch {
    return false;
  }
}

export async function openPermissionSettings() {
  if (!isSupported()) return;
  try {
    await NotiCapture.openPermissionSettings();
  } catch {
    /* ignore */
  }
}

// --- ค่าตั้ง ---

// คืน { enabled, verifyMode, banks:[{id,packageName,name,enabled}] } หรือ null ถ้าไม่รองรับ
export async function getConfig() {
  if (!isSupported()) return null;
  try {
    return await NotiCapture.getConfig();
  } catch {
    return null;
  }
}

export async function setEnabled(enabled) {
  if (!isSupported()) return;
  try {
    await NotiCapture.setEnabled({ enabled });
  } catch {
    /* ignore */
  }
}

export async function setVerifyMode(on) {
  if (!isSupported()) return;
  try {
    await NotiCapture.setVerifyMode({ on });
  } catch {
    /* ignore */
  }
}

export async function setBankEnabled(packageName, enabled) {
  if (!isSupported()) return;
  try {
    await NotiCapture.setBankEnabled({ packageName, enabled });
  } catch {
    /* ignore */
  }
}

// --- รายการที่ดักได้ ---

// คืน array ของ { packageName, bankName, title, text, rawText, postedAt, capturedAt }
export async function getCaptured() {
  if (!isSupported()) return [];
  try {
    const { items } = await NotiCapture.getCaptured();
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export async function clearCaptured() {
  if (!isSupported()) return;
  try {
    await NotiCapture.clearCaptured();
  } catch {
    /* ignore */
  }
}
