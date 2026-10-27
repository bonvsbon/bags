package app.ngernthon.notifications;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * CaptureStore — ที่เก็บ notification ที่ดักได้ล่าสุด (เก็บใน SharedPreferences)
 *
 * เฟส 0: เก็บ "ดิบ" ไว้เฉพาะในเครื่อง (ยังไม่ส่งออก backend)
 * เพื่อให้หน้าตั้งค่าในแอปดึงมาแสดงเป็นรายการ debug ได้ แม้ปิด-เปิดแอปใหม่
 *
 * เก็บแบบ JSON array วนทับของเก่า (cap ที่ MAX รายการ, ใหม่สุดอยู่บน)
 */
public final class CaptureStore {

    private CaptureStore() {}

    private static final String PREFS = "ngernthon_capture";
    private static final String KEY_ITEMS = "captured_items";
    private static final int MAX = 50; // เก็บล่าสุดกี่รายการ

    private static SharedPreferences prefs(Context ctx) {
        return ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /**
     * บันทึก notification ที่ผ่าน filter หนึ่งรายการ (ใหม่สุดขึ้นบน)
     * เก็บ rawText = title + "\n" + text ไว้เผื่อเขียน parser ย้อนหลังเฟสหน้า
     */
    public static void append(Context ctx, String packageName, String bankName,
                              String title, String text, long postedAt) {
        try {
            SharedPreferences p = prefs(ctx);
            JSONArray old = new JSONArray(p.getString(KEY_ITEMS, "[]"));

            JSONObject item = new JSONObject();
            item.put("packageName", packageName == null ? "" : packageName);
            item.put("bankName", bankName == null ? "" : bankName);
            item.put("title", title == null ? "" : title);
            item.put("text", text == null ? "" : text);
            item.put("rawText", (title == null ? "" : title) + "\n" + (text == null ? "" : text));
            item.put("postedAt", postedAt);
            item.put("capturedAt", System.currentTimeMillis());

            // ประกอบใหม่: ของใหม่ก่อน แล้วตามด้วยของเก่า (ตัดให้ไม่เกิน MAX)
            JSONArray next = new JSONArray();
            next.put(item);
            for (int i = 0; i < old.length() && next.length() < MAX; i++) {
                next.put(old.get(i));
            }
            p.edit().putString(KEY_ITEMS, next.toString()).apply();
        } catch (JSONException e) {
            // เฟส 0: เก็บไม่ได้ก็ข้ามไป ไม่ให้ล้มทั้ง service
        }
    }

    /** คืนรายการทั้งหมดเป็น JSON array string (ใหม่สุดอยู่บน) */
    public static String getAllJson(Context ctx) {
        return prefs(ctx).getString(KEY_ITEMS, "[]");
    }

    /** ล้างรายการทั้งหมด */
    public static void clear(Context ctx) {
        prefs(ctx).edit().remove(KEY_ITEMS).apply();
    }
}
