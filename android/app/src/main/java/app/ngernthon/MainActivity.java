package app.ngernthon;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import app.ngernthon.notifications.NotiCapturePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // ลงทะเบียน plugin ดัก notification ก่อน bridge เริ่มทำงาน
        registerPlugin(NotiCapturePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
