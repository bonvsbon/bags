package app.ngernthon.notifications;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

import org.junit.Test;

/**
 * BankNotificationFilterTest — ทดสอบตรรกะ filter เฟส 0 (JVM ล้วน)
 *
 * filter รับ whitelist + verifyMode เป็น parameter → เทสต์ส่งค่าเองได้ครบ
 */
public class BankNotificationFilterTest {

    private static final String SCB = "com.scb.phone";           // อยู่ใน whitelist
    private static final String LINE = "jp.naver.line.android";  // ไม่อยู่ใน whitelist

    /** whitelist จำลอง: เปิดเฉพาะ SCB */
    private static Set<String> scbOnly() {
        return new HashSet<>(Collections.singletonList(SCB));
    }

    // ---- โหมดปกติ: ผ่าน filter (เก็บไว้) ----

    @Test
    public void scbWithAmount_isCaptured() {
        assertTrue(BankNotificationFilter.shouldCapture(
                SCB, "SCB", "รายการใช้จ่าย 1,250.00 บาท", scbOnly(), false));
    }

    @Test
    public void scbAmountOnlyInTitle_isCaptured() {
        // ตัวเลขอยู่ใน title อย่างเดียวก็พอ (รวม title+text แล้วเช็ก)
        assertTrue(BankNotificationFilter.shouldCapture(
                SCB, "โอนเงิน 500 บาท", "", scbOnly(), false));
    }

    // ---- โหมดปกติ: ถูกทิ้ง (ชั้น 1: whitelist) ----

    @Test
    public void nonBankPackage_isRejected() {
        assertFalse(BankNotificationFilter.shouldCapture(
                LINE, "แม่", "โอนมา 300 นะลูก", scbOnly(), false));
    }

    @Test
    public void nullPackage_isRejected() {
        assertFalse(BankNotificationFilter.shouldCapture(
                null, "อะไรสักอย่าง", "123", scbOnly(), false));
    }

    @Test
    public void bankNotInEnabledSet_isRejected() {
        // KBank ไม่ได้เปิด (whitelist มีแค่ SCB) → ทิ้ง
        assertFalse(BankNotificationFilter.shouldCapture(
                "com.kasikorn.retail.mbanking.wap", "KBank", "จ่าย 99 บาท", scbOnly(), false));
    }

    // ---- โหมดปกติ: ถูกทิ้ง (ชั้น 2: sanity) ----

    @Test
    public void scbWithoutDigits_isRejected() {
        assertFalse(BankNotificationFilter.shouldCapture(
                SCB, "โปรโมชันพิเศษ", "สมัครบัตรวันนี้รับสิทธิพิเศษมากมาย", scbOnly(), false));
    }

    @Test
    public void scbEmptyContent_isRejected() {
        assertFalse(BankNotificationFilter.shouldCapture(SCB, "", "", scbOnly(), false));
    }

    @Test
    public void scbNullContent_isRejected() {
        assertFalse(BankNotificationFilter.shouldCapture(SCB, null, null, scbOnly(), false));
    }

    // ---- โหมด verify: ปล่อยผ่านทุกอย่าง ----

    @Test
    public void verifyMode_capturesNonBankPackage() {
        // แม้ LINE ก็ผ่าน เพราะกำลังส่องหา package (whitelist ถูกข้าม)
        assertTrue(BankNotificationFilter.shouldCapture(
                LINE, "แม่", "สวัสดีจ้ะ", scbOnly(), true));
    }

    @Test
    public void verifyMode_capturesEvenWithoutDigits() {
        assertTrue(BankNotificationFilter.shouldCapture(
                "com.any.app", "ไม่มีตัวเลข", "เลย", Collections.<String>emptySet(), true));
    }
}
