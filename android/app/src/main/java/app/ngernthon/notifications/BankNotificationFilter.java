package app.ngernthon.notifications;

import java.util.Set;

/**
 * BankNotificationFilter — หัวใจของเฟส 0: ตัดสิน "เอา / ไม่เอา" notification
 *
 * ทำแค่กรอง ไม่ parse ตัวเลข/ทิศทางเงิน (นั่นเป็นงาน backend เฟสหลัง)
 * เป็นคลาส Java ล้วน (ไม่พึ่ง Android, ไม่อ่าน SharedPreferences เอง) →
 * รับ config มาเป็น parameter เพื่อ unit test ได้ตรง ๆ
 *
 * ตรรกะ:
 *   • verifyMode = true  → ผ่านทุกอย่าง (โหมดส่องหา package ธนาคาร)
 *   • verifyMode = false → 2 ชั้น: whitelist package + sanity (ต้องมีตัวเลข)
 */
public final class BankNotificationFilter {

    private BankNotificationFilter() {}

    /**
     * ตัดสินว่าจะดัก notification นี้ไว้หรือไม่
     *
     * @param packageName      ชื่อ package ของแอปที่ส่ง noti
     * @param title            หัวข้อ noti (อาจว่าง/null)
     * @param text             เนื้อความ noti (อาจว่าง/null)
     * @param enabledPackages  เซ็ต package ที่เปิดใช้ (whitelist runtime)
     * @param verifyMode       true = โหมดส่องหา package (ปล่อยผ่านทุกแอป)
     * @return true ถ้าควรเก็บไว้ (ผ่าน filter)
     */
    public static boolean shouldCapture(String packageName, String title, String text,
                                        Set<String> enabledPackages, boolean verifyMode) {
        // โหมด verify: ปล่อยผ่านทุกอย่างเพื่อดูว่าธนาคารใช้ package/ข้อความแบบไหน
        if (verifyMode) {
            return true;
        }

        // ชั้น 1: whitelist package (ด่านแรก เร็วสุด)
        if (packageName == null
                || enabledPackages == null
                || !enabledPackages.contains(packageName)) {
            return false;
        }

        // ชั้น 2: sanity check เนื้อหา
        String combined = (safe(title) + " " + safe(text)).trim();

        // ว่างเปล่า = ทิ้ง
        if (combined.isEmpty()) {
            return false;
        }

        // ไม่มีตัวเลขอารบิก [0-9] เลย = ทิ้ง (พวกโปรโมชัน/เตือนอัปเดต)
        if (!hasArabicDigit(combined)) {
            return false;
        }

        return true;
    }

    /** แปลง null เป็นสตริงว่าง เพื่อให้ต่อสตริงได้อย่างปลอดภัย */
    private static String safe(String s) {
        return (s == null) ? "" : s;
    }

    /** มีตัวเลขอารบิก 0-9 อย่างน้อยหนึ่งตัวหรือไม่ */
    private static boolean hasArabicDigit(String s) {
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c >= '0' && c <= '9') {
                return true;
            }
        }
        return false;
    }
}
