package app.ngernthon.notifications;

import android.app.Notification;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

/**
 * NotiListenerService — ตัวรับ notification จากระบบ Android
 *
 * เฟส 0 / Step 1: ยังไม่กรอง ยังไม่ bridge เข้า JS
 * ทำแค่ "ดักทุก noti ที่เข้าเครื่อง แล้ว log ลง Logcat" เพื่อพิสูจน์ว่า
 * service ผูกกับ OS ได้จริงและ callback ทำงาน
 *
 * วิธีดู log: เปิด Logcat แล้วกรองด้วย tag "NgernThonNoti"
 */
public class NotiListenerService extends NotificationListenerService {

    // tag กลางไว้กรองใน Logcat — ใช้ชื่อเดียวกันทุกที่ในไฟล์นี้
    private static final String TAG = "NgernThonNoti";

    /**
     * onListenerConnected — ระบบเรียกตอน service ผูกกับ OS สำเร็จ
     * (คือตอนที่ผู้ใช้เปิดสิทธิ์ Notification Access ให้แล้ว)
     * log ไว้เพื่อยืนยันว่า service มีชีวิตจริง
     */
    @Override
    public void onListenerConnected() {
        Log.i(TAG, "listener connected — พร้อมดัก notification แล้ว");
    }

    /**
     * onNotificationPosted — ระบบเรียกทุกครั้งที่มี notification ใหม่เด้ง (ทุกแอป)
     * นี่คือหัวใจของการดัก noti
     *
     * @param sbn ข้อมูล notification ดิบจากระบบ (StatusBarNotification)
     */
    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        // กันเคสหายาก: บาง noti อาจเป็น null — ทิ้งไปเลย
        if (sbn == null) {
            return;
        }

        // ปิดการดักทั้งหมดจากหน้าตั้งค่า → ไม่ทำอะไรเลย
        if (!CaptureConfig.isEnabled(this)) {
            return;
        }

        // 1) เอาชื่อ package ของแอปที่ส่ง noti (เช่น "com.scb.phone", "jp.naver.line.android")
        String packageName = sbn.getPackageName();

        // 2) ดึงเนื้อหา noti ออกมาจาก "extras" (คลังข้อมูลของ notification)
        Notification notification = sbn.getNotification();
        Bundle extras = (notification != null) ? notification.extras : null;

        String title = "";
        String text = "";
        if (extras != null) {
            // title = หัวข้อ noti / text = เนื้อความหลัก
            // ใช้ CharSequence แล้วแปลงเป็น String กัน null
            CharSequence titleCs = extras.getCharSequence(Notification.EXTRA_TITLE);
            CharSequence textCs = extras.getCharSequence(Notification.EXTRA_TEXT);
            if (titleCs != null) title = titleCs.toString();
            if (textCs != null) text = textCs.toString();
        }

        // 3) โหลด config ปัจจุบันจากหน้าตั้งค่า (whitelist ที่เปิดใช้ + โหมด verify)
        //    อ่านสด ๆ ทุกครั้ง → ปรับค่าในแอปแล้วมีผลทันที ไม่ต้อง rebuild
        java.util.Set<String> enabledPackages = CaptureConfig.getEnabledPackages(this);
        boolean verifyMode = CaptureConfig.isVerifyMode(this);

        // 4) กรองด้วย BankNotificationFilter (whitelist + sanity หรือปล่อยผ่านถ้า verify)
        //    ไม่ผ่าน = ทิ้งเงียบ ๆ ไม่ log ไม่ทำอะไรต่อ
        if (!BankNotificationFilter.shouldCapture(packageName, title, text, enabledPackages, verifyMode)) {
            return;
        }

        // 5) ผ่าน filter แล้ว → เก็บลง local store (ให้หน้าตั้งค่าดึงมาโชว์)
        BankCatalog.Bank bank = BankCatalog.byPackage(packageName);
        String bankName = (bank != null) ? bank.displayName : "";
        CaptureStore.append(this, packageName, bankName, title, text, sbn.getPostTime());

        // 6) log ออก Logcat ไว้ debug ด้วย
        Log.i(TAG, "captured | pkg=" + packageName
                + " | verify=" + verifyMode
                + " | title=" + title
                + " | text=" + text);
    }

    /**
     * onNotificationRemoved — ระบบเรียกตอน noti ถูกปัดทิ้ง/หายไป
     * เฟส 0 ไม่ได้ใช้ แต่ override ไว้เฉย ๆ กันงงตอน debug
     */
    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // เฟสนี้ไม่ทำอะไร
    }
}
