package app.ngernthon.notifications;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * BankCatalog — "แคตตาล็อก" ธนาคารไทยที่ระบบรู้จัก
 *
 * นี่คือรายการเต็มที่จะเอาไปแสดงเป็น checkbox ในหน้าตั้งค่าของแอป
 * ผู้ใช้เลือกว่าจะเปิดดักธนาคารไหนบ้าง (ค่าที่เลือกเก็บใน CaptureConfig)
 *
 * ต่างจากเดิม: แคตตาล็อกนี้ = "ธนาคารที่เลือกได้" (คงที่)
 *             ส่วน "ธนาคารที่เปิดใช้จริง" = ค่า runtime ใน CaptureConfig
 *
 * ⚠️ packageName ต้อง verify ของจริง — ใช้โหมด verify ในแอปช่วยหา
 */
public final class BankCatalog {

    private BankCatalog() {}

    /** ข้อมูลธนาคารหนึ่งราย (immutable) */
    public static final class Bank {
        public final String id;          // รหัสสั้น เช่น "scb"
        public final String packageName; // package แอปธนาคาร เช่น "com.scb.phone"
        public final String displayName; // ชื่อโชว์ในแอป เช่น "SCB — ไทยพาณิชย์"

        Bank(String id, String packageName, String displayName) {
            this.id = id;
            this.packageName = packageName;
            this.displayName = displayName;
        }
    }

    /** รายการธนาคารทั้งหมดที่เลือกเปิด/ปิดได้ (แก้ไม่ได้หลังสร้าง) */
    public static final List<Bank> ALL;

    static {
        List<Bank> list = new ArrayList<>();
        list.add(new Bank("scb",       "com.scb.phone",                       "SCB — ไทยพาณิชย์"));
        list.add(new Bank("ktb",       "com.krungthai.aspire",                "Krungthai NEXT — กรุงไทย"));
        list.add(new Bank("kbank",     "com.kasikorn.retail.mbanking.wap",    "K PLUS — กสิกรไทย"));
        list.add(new Bank("bbl",       "com.bbl.mobilebanking",               "Bangkok Bank — กรุงเทพ"));
        list.add(new Bank("krungsri",  "com.krungsri.kma",                    "KMA — กรุงศรี"));
        list.add(new Bank("ttb",       "com.tmbbank.ttbtouch",                "ttb touch — ทีเอ็มบีธนชาต"));
        list.add(new Bank("gsb",       "com.gsb.mobilebanking",               "MyMo — ออมสิน"));
        list.add(new Bank("baac",      "com.baac.report",                     "ธ.ก.ส. — BAAC"));
        ALL = Collections.unmodifiableList(list);
    }

    /** ค่า default: เฟส 0 เปิดเฉพาะ SCB */
    public static final String DEFAULT_ENABLED_PACKAGE = "com.scb.phone";

    /** หา Bank จาก packageName (null ถ้าไม่รู้จัก) */
    public static Bank byPackage(String packageName) {
        if (packageName == null) return null;
        for (Bank b : ALL) {
            if (b.packageName.equals(packageName)) return b;
        }
        return null;
    }
}
