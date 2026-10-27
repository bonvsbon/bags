package app.ngernthon.notifications;

import android.content.Intent;
import android.provider.Settings;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.Set;

/**
 * NotiCapturePlugin — สะพานระหว่างหน้าตั้งค่า (React) กับ native
 *
 * ให้หน้า Settings เรียกได้:
 *   • isPermissionGranted / openPermissionSettings — จัดการสิทธิ์ Notification Access
 *   • getConfig / setEnabled / setVerifyMode / setBankEnabled — อ่าน/ปรับค่าตั้ง
 *   • getCaptured / clearCaptured — ดึง/ล้างรายการ noti ที่ดักได้
 *
 * ค่าทั้งหมดวิ่งผ่าน CaptureConfig/CaptureStore (SharedPreferences) →
 * NotiListenerService อ่านเจอทันที
 */
@CapacitorPlugin(name = "NotiCapture")
public class NotiCapturePlugin extends Plugin {

    // ---- สิทธิ์ Notification Access ----

    /** เช็กว่าผู้ใช้เปิดสิทธิ์ Notification Access ให้แอปเราแล้วหรือยัง */
    @PluginMethod
    public void isPermissionGranted(PluginCall call) {
        Set<String> enabled = NotificationManagerCompat.getEnabledListenerPackages(getContext());
        boolean granted = enabled.contains(getContext().getPackageName());
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    /** เปิดหน้า Settings → Notification access ให้ผู้ใช้ไปกดเปิดสิทธิ์เอง */
    @PluginMethod
    public void openPermissionSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    // ---- ค่าตั้ง (config) ----

    /** อ่านค่าตั้งปัจจุบัน + รายการธนาคารในแคตตาล็อก + แอปอื่นที่ผู้ใช้เพิ่มเอง */
    @PluginMethod
    public void getConfig(PluginCall call) {
        Set<String> enabledPkgs = CaptureConfig.getEnabledPackages(getContext());

        // ธนาคารในแคตตาล็อก (พร้อมสถานะเปิด/ปิด)
        JSArray banks = new JSArray();
        for (BankCatalog.Bank b : BankCatalog.ALL) {
            JSObject o = new JSObject();
            o.put("id", b.id);
            o.put("packageName", b.packageName);
            o.put("name", b.displayName);
            o.put("enabled", enabledPkgs.contains(b.packageName));
            banks.put(o);
        }

        // แอปที่เปิดใช้แต่ "ไม่อยู่ในแคตตาล็อก" = แอปที่ผู้ใช้เพิ่มเอง
        JSArray custom = new JSArray();
        for (String pkg : enabledPkgs) {
            if (BankCatalog.byPackage(pkg) == null) {
                custom.put(pkg);
            }
        }

        JSObject ret = new JSObject();
        ret.put("enabled", CaptureConfig.isEnabled(getContext()));
        ret.put("verifyMode", CaptureConfig.isVerifyMode(getContext()));
        ret.put("banks", banks);
        ret.put("custom", custom);
        call.resolve(ret);
    }

    /** เปิด/ปิดการดักทั้งหมด */
    @PluginMethod
    public void setEnabled(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", true);
        CaptureConfig.setEnabled(getContext(), enabled);
        call.resolve();
    }

    /** เปิด/ปิดโหมด verify (ส่องหา package) */
    @PluginMethod
    public void setVerifyMode(PluginCall call) {
        boolean on = call.getBoolean("on", false);
        CaptureConfig.setVerifyMode(getContext(), on);
        call.resolve();
    }

    /** เปิด/ปิดธนาคารทีละตัว */
    @PluginMethod
    public void setBankEnabled(PluginCall call) {
        String packageName = call.getString("packageName");
        boolean enabled = call.getBoolean("enabled", false);
        if (packageName == null || packageName.isEmpty()) {
            call.reject("packageName is required");
            return;
        }
        CaptureConfig.setBankEnabled(getContext(), packageName, enabled);
        call.resolve();
    }

    // ---- รายการที่ดักได้ ----

    /** ดึงรายการ noti ที่ดักได้ล่าสุด (ใหม่สุดอยู่บน) */
    @PluginMethod
    public void getCaptured(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            ret.put("items", new JSArray(CaptureStore.getAllJson(getContext())));
        } catch (JSONException e) {
            ret.put("items", new JSArray());
        }
        call.resolve(ret);
    }

    /** ล้างรายการที่ดักได้ทั้งหมด */
    @PluginMethod
    public void clearCaptured(PluginCall call) {
        CaptureStore.clear(getContext());
        call.resolve();
    }
}
