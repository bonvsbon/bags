package app.ngernthon.notifications;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * CaptureConfig — ค่าตั้งของการดัก notification (เก็บถาวรใน SharedPreferences)
 *
 * เป็น "ตัวกลาง" ที่ทั้งสองฝั่งใช้ร่วมกัน:
 *   • NotiListenerService (native) → อ่าน ทุกครั้งที่ noti เด้ง
 *   • NotiCapturePlugin (จากหน้า Settings React) → เขียน เมื่อผู้ใช้ปรับค่า
 * เขียนจากฝั่งไหน อีกฝั่งอ่านเจอทันที (ไม่ต้อง rebuild)
 *
 * เก็บ 3 อย่าง:
 *   1) enabled       — เปิด/ปิดการดักทั้งหมด
 *   2) verifyMode    — โหมดส่องหา package (ปล่อยผ่านทุกแอปชั่วคราว)
 *   3) enabledPkgs   — เซ็ต package ธนาคารที่เปิดใช้ (whitelist runtime)
 */
public final class CaptureConfig {

    private CaptureConfig() {}

    private static final String PREFS = "ngernthon_capture";
    private static final String KEY_ENABLED = "capture_enabled";
    private static final String KEY_VERIFY = "verify_mode";
    private static final String KEY_PACKAGES = "enabled_packages";

    private static SharedPreferences prefs(Context ctx) {
        // ใช้ applicationContext กันปัญหา leak / คนละ instance ระหว่าง service กับ activity
        return ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    // ---- enabled (เปิด/ปิดการดักทั้งหมด) ----

    /** ค่าเริ่มต้น = เปิด (true) */
    public static boolean isEnabled(Context ctx) {
        return prefs(ctx).getBoolean(KEY_ENABLED, true);
    }

    public static void setEnabled(Context ctx, boolean enabled) {
        prefs(ctx).edit().putBoolean(KEY_ENABLED, enabled).apply();
    }

    // ---- verifyMode (โหมดส่องหา package) ----

    /** ค่าเริ่มต้น = ปิด (false) — เปิดชั่วคราวตอนหา package ธนาคาร */
    public static boolean isVerifyMode(Context ctx) {
        return prefs(ctx).getBoolean(KEY_VERIFY, false);
    }

    public static void setVerifyMode(Context ctx, boolean on) {
        prefs(ctx).edit().putBoolean(KEY_VERIFY, on).apply();
    }

    // ---- enabledPackages (whitelist ธนาคารที่เปิดใช้) ----

    /**
     * เซ็ต package ที่เปิดใช้ — คืน "สำเนา" เสมอ
     * (ห้ามแก้ Set ที่ได้จาก getStringSet ตรง ๆ ตามข้อกำหนดของ Android)
     * ค่าเริ่มต้น = { SCB } (เฟส 0)
     */
    public static Set<String> getEnabledPackages(Context ctx) {
        Set<String> def = Collections.singleton(BankCatalog.DEFAULT_ENABLED_PACKAGE);
        Set<String> stored = prefs(ctx).getStringSet(KEY_PACKAGES, def);
        return new HashSet<>(stored); // สำเนา แก้ไขได้อย่างปลอดภัย
    }

    /** เปิด/ปิดธนาคารทีละตัว */
    public static void setBankEnabled(Context ctx, String packageName, boolean enabled) {
        if (packageName == null || packageName.isEmpty()) return;
        Set<String> current = getEnabledPackages(ctx);
        if (enabled) {
            current.add(packageName);
        } else {
            current.remove(packageName);
        }
        prefs(ctx).edit().putStringSet(KEY_PACKAGES, current).apply();
    }
}
