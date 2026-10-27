// BankCaptureSettings — ส่วน "ดักการแจ้งเตือนธนาคาร" ในหน้าตั้งค่า
//
// ทำงานเฉพาะบนแอป Android (native). บนเว็บจะแสดงข้อความบอกว่าใช้ได้เฉพาะแอป
// ตั้งค่าได้: สิทธิ์ · เปิด/ปิดการดัก · โหมด verify · เลือกธนาคาร · ดูรายการที่ดักได้

import { useCallback, useEffect, useState } from 'react';
import { css } from '../lib/css.js';
import * as bridge from './captureBridge.js';

const secTitle = 'font-size:13px;font-weight:700;color:var(--muted2);margin:0 0 10px 2px';
const card = 'background:var(--card);border:1px solid var(--border)';
const group = card + ';border-radius:18px;overflow:hidden;margin-bottom:22px';

function Toggle({ on, onClick, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={css(
        'position:relative;width:46px;height:27px;border-radius:14px;flex:none;' +
        'opacity:' + (disabled ? '0.4' : '1') + ';background:' + (on ? '#2f7d5b' : '#d8d4cb')
      )}
    >
      <span style={css('position:absolute;top:3px;left:' + (on ? '22px' : '3px') + ';width:21px;height:21px;border-radius:50%;background:var(--card);box-shadow:0 1px 2px rgba(0,0,0,0.2)')}></span>
    </button>
  );
}

function Row({ title, sub, right, border }) {
  return (
    <div style={css('display:flex;align-items:center;gap:14px;padding:15px 16px;' + (border ? 'border-bottom:1px solid var(--divider)' : ''))}>
      <div style={css('flex:1')}>
        <div style={css('font-size:14.5px;font-weight:500')}>{title}</div>
        {sub && <div style={css('font-size:12px;color:var(--muted);margin-top:1px')}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function timeAgo(ms) {
  if (!ms) return '';
  const diff = Date.now() - Number(ms);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'เมื่อครู่';
  if (m < 60) return m + ' นาทีที่แล้ว';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' ชม.ที่แล้ว';
  return Math.floor(h / 24) + ' วันก่อน';
}

export default function BankCaptureSettings({ toast }) {
  const supported = bridge.isSupported();
  const [granted, setGranted] = useState(false);
  const [cfg, setCfg] = useState(null); // { enabled, verifyMode, banks:[] }
  const [items, setItems] = useState([]);
  const [showExport, setShowExport] = useState(false); // เผยกล่อง JSON ไว้คัดลอกเอง

  const refresh = useCallback(async () => {
    setGranted(await bridge.isPermissionGranted());
    setCfg(await bridge.getConfig());
    setItems(await bridge.getCaptured());
  }, []);

  useEffect(() => {
    if (!supported) return;
    refresh();
    // ดึงรายการใหม่เป็นระยะ + ตอนกลับมาหน้านี้ (เผื่อมี noti เด้งระหว่างเปิดค้าง)
    const iv = setInterval(async () => {
      setItems(await bridge.getCaptured());
      setGranted(await bridge.isPermissionGranted());
    }, 4000);
    const onVis = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, [supported, refresh]);

  // บนเว็บ/เบราว์เซอร์ — บอกว่าใช้ได้เฉพาะแอป
  if (!supported) {
    return (
      <>
        <div style={css(secTitle)}>ดักการแจ้งเตือนธนาคาร</div>
        <div style={css(card + ';border-radius:18px;padding:16px;margin-bottom:22px;font-size:12.5px;color:var(--muted);line-height:1.6')}>
          ฟีเจอร์นี้ดักข้อความแจ้งเตือนจากแอปธนาคารเพื่อบันทึกรายการให้อัตโนมัติ
          — ใช้ได้เฉพาะบน <b>แอป Android</b> เท่านั้น (เปิดผ่านเบราว์เซอร์ไม่ได้)
        </div>
      </>
    );
  }

  async function toggleEnabled() {
    const next = !cfg.enabled;
    setCfg((c) => ({ ...c, enabled: next }));
    await bridge.setEnabled(next);
  }
  async function toggleVerify() {
    const next = !cfg.verifyMode;
    setCfg((c) => ({ ...c, verifyMode: next }));
    await bridge.setVerifyMode(next);
    toast?.(next ? 'เปิดโหมดส่องหา — จะเห็นทุกแอปชั่วคราว' : 'ปิดโหมดส่องหาแล้ว');
  }
  async function toggleBank(b) {
    const next = !b.enabled;
    setCfg((c) => ({ ...c, banks: c.banks.map((x) => (x.packageName === b.packageName ? { ...x, enabled: next } : x)) }));
    await bridge.setBankEnabled(b.packageName, next);
  }
  async function doClear() {
    await bridge.clearCaptured();
    setItems([]);
    setShowExport(false);
    toast?.('ล้างรายการแล้ว');
  }
  // เพิ่มแอปเข้า whitelist (จากรายการที่ดักได้ในโหมด verify)
  async function addApp(pkg) {
    if (!pkg) return;
    await bridge.setBankEnabled(pkg, true);
    setCfg(await bridge.getConfig());
    toast?.('เพิ่มแอปแล้ว');
  }
  // เอาแอปที่เพิ่มเองออก
  async function removeCustom(pkg) {
    await bridge.setBankEnabled(pkg, false);
    setCfg(await bridge.getConfig());
  }
  // เซ็ต package ที่เปิดใช้อยู่ตอนนี้ (แคตตาล็อกที่ติ๊ก + แอปที่เพิ่มเอง)
  const enabledSet = new Set([
    ...(cfg?.banks || []).filter((b) => b.enabled).map((b) => b.packageName),
    ...(cfg?.custom || []),
  ]);

  const exportJson = JSON.stringify(items, null, 2);
  async function copyExport() {
    try {
      await navigator.clipboard.writeText(exportJson);
      toast?.('คัดลอก JSON แล้ว');
    } catch {
      // WebView บางตัวคัดลอกอัตโนมัติไม่ได้ → เผยกล่องให้เลือกคัดลอกเอง
      setShowExport(true);
      toast?.('เลือกข้อความในกล่องแล้วคัดลอก');
    }
  }

  return (
    <>
      <div style={css(secTitle)}>ดักการแจ้งเตือนธนาคาร</div>

      {/* สิทธิ์ */}
      {!granted && (
        <div style={css(card + ';border-radius:18px;padding:16px;margin-bottom:14px')}>
          <div style={css('font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:12px')}>
            ต้องเปิดสิทธิ์ <b>การเข้าถึงการแจ้งเตือน</b> ก่อน แอปจึงจะอ่านข้อความธนาคารได้
          </div>
          <button
            onClick={async () => { await bridge.openPermissionSettings(); }}
            style={css('width:100%;height:46px;border-radius:12px;background:#2f7d5b;color:#fff;font-size:14.5px;font-weight:600')}
          >
            เปิดหน้าตั้งค่าสิทธิ์
          </button>
        </div>
      )}

      {cfg && (
        <>
          {/* สวิตช์หลัก */}
          <div style={css(group)}>
            <Row
              title="เปิดการดักการแจ้งเตือน"
              sub={granted ? 'อ่านข้อความจากธนาคารที่เลือก' : 'ยังไม่ได้เปิดสิทธิ์'}
              border
              right={<Toggle on={cfg.enabled} onClick={toggleEnabled} disabled={!granted} />}
            />
            <Row
              title="โหมดส่องหา (verify)"
              sub="ชั่วคราว: เห็นทุกแอปเพื่อหา package ธนาคาร"
              right={<Toggle on={cfg.verifyMode} onClick={toggleVerify} disabled={!granted} />}
            />
          </div>

          {/* เลือกธนาคาร */}
          <div style={css('font-size:12px;color:var(--muted);margin:0 0 8px 2px')}>ธนาคารที่เปิดดัก</div>
          <div style={css(group)}>
            {cfg.banks.map((b, i) => (
              <Row
                key={b.packageName}
                title={b.name}
                sub={b.packageName}
                border={i < cfg.banks.length - 1}
                right={<Toggle on={b.enabled} onClick={() => toggleBank(b)} disabled={!granted} />}
              />
            ))}
          </div>

          {/* แอปอื่นที่เพิ่มเอง (ไม่อยู่ในแคตตาล็อก) */}
          {cfg.custom && cfg.custom.length > 0 && (
            <>
              <div style={css('font-size:12px;color:var(--muted);margin:0 0 8px 2px')}>แอปอื่นที่เพิ่มเอง</div>
              <div style={css(group)}>
                {cfg.custom.map((pkg, i) => (
                  <Row
                    key={pkg}
                    title={pkg}
                    sub="แตะสวิตช์เพื่อเอาออก"
                    border={i < cfg.custom.length - 1}
                    right={<Toggle on onClick={() => removeCustom(pkg)} disabled={!granted} />}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* รายการที่ดักได้ */}
      <div style={css('display:flex;align-items:center;gap:14px;margin:0 2px 8px')}>
        <div style={css('flex:1;font-size:12px;color:var(--muted)')}>ที่ดักได้ล่าสุด ({items.length})</div>
        {items.length > 0 && (
          <>
            <button onClick={copyExport} style={css('font-size:12px;color:#2f7d5b;background:transparent;font-weight:600')}>ส่งออก JSON</button>
            <button onClick={doClear} style={css('font-size:12px;color:#d9776a;background:transparent;font-weight:600')}>ล้าง</button>
          </>
        )}
      </div>

      {/* กล่อง JSON สำหรับคัดลอกเอง (เผยเมื่อคัดลอกอัตโนมัติไม่ได้) */}
      {showExport && items.length > 0 && (
        <textarea
          readOnly
          value={exportJson}
          onFocus={(e) => e.target.select()}
          style={css('width:100%;height:160px;margin-bottom:14px;padding:12px;border-radius:12px;border:1px solid var(--border);background:var(--card);color:var(--muted2);font-family:monospace;font-size:11px;line-height:1.5;resize:vertical')}
        />
      )}
      <div style={css(group)}>
        {items.length === 0 ? (
          <div style={css('padding:18px 16px;font-size:12.5px;color:var(--muted);text-align:center')}>
            ยังไม่มีรายการ — ลองทำธุรกรรมกับธนาคารที่เปิดไว้
          </div>
        ) : (
          items.map((it, i) => (
            <div key={i} style={css('padding:13px 16px;' + (i < items.length - 1 ? 'border-bottom:1px solid var(--divider)' : ''))}>
              <div style={css('display:flex;align-items:center;gap:8px;margin-bottom:3px')}>
                <span style={css('font-size:13.5px;font-weight:600;flex:1')}>{it.bankName || it.packageName}</span>
                {it.packageName && (enabledSet.has(it.packageName)
                  ? <span style={css('font-size:11px;color:#2f7d5b')}>✓ เปิดอยู่</span>
                  : <button onClick={() => addApp(it.packageName)} style={css('font-size:11px;color:#2f7d5b;background:transparent;font-weight:700')}>➕ เพิ่มแอปนี้</button>
                )}
                <span style={css('font-size:11px;color:var(--muted)')}>{timeAgo(it.capturedAt)}</span>
              </div>
              {it.title && <div style={css('font-size:13px;font-weight:500')}>{it.title}</div>}
              {it.text && <div style={css('font-size:12.5px;color:var(--muted);line-height:1.5;margin-top:1px')}>{it.text}</div>}
            </div>
          ))
        )}
      </div>
    </>
  );
}
