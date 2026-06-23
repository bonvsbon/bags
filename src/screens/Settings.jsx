import { css } from '../lib/css.js';

export default function Settings({ v }) {
  return (
    <div style={css('padding:6px 20px 120px;animation:nlSwap .26s ease')}>
      <div style={css('display:flex;align-items:center;gap:12px;margin:6px 0 20px')}>
        <button onClick={v.goMore} style={css('flex:none;width:40px;height:40px;border-radius:12px;background:var(--card);border:1px solid var(--border);font-size:18px;color:var(--muted2);display:flex;align-items:center;justify-content:center')}>‹</button>
        <div style={css('font-size:21px;font-weight:700;white-space:nowrap')}>ตั้งค่า</div>
      </div>

      <div style={css('font-size:13px;font-weight:700;color:var(--muted2);margin:0 0 10px 2px')}>บัญชีและโปรไฟล์</div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin-bottom:22px')}>
        <div style={css('display:flex;align-items:center;gap:14px;padding:15px 16px;border-bottom:1px solid var(--divider)')}>
          <span style={css('font-size:18px;width:24px;text-align:center')}>👤</span>
          <span style={css('flex:1;font-size:14.5px;font-weight:500')}>ข้อมูลส่วนตัว</span>
          <span style={css('font-size:17px;color:#c4c6bc')}>›</span>
        </div>
        <div style={css('display:flex;align-items:center;gap:14px;padding:15px 16px;border-bottom:1px solid var(--divider)')}>
          <span style={css('font-size:18px;width:24px;text-align:center')}>💳</span>
          <span style={css('flex:1;font-size:14.5px;font-weight:500')}>วันเงินเดือนออก</span>
          <span style={css('font-size:13.5px;color:var(--muted)')}>ทุกวันที่ 25 ›</span>
        </div>
        <div style={css('display:flex;align-items:center;gap:14px;padding:15px 16px')}>
          <span style={css('font-size:18px;width:24px;text-align:center')}>🎯</span>
          <span style={css('flex:1;font-size:14.5px;font-weight:500')}>เป้าหมายหลัก</span>
          <span style={css('font-size:13.5px;color:var(--muted)')}>มีเงินเหลือปลายเดือน ›</span>
        </div>
      </div>

      <div style={css('font-size:13px;font-weight:700;color:var(--muted2);margin:0 0 10px 2px')}>การแจ้งเตือน</div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin-bottom:22px')}>
        <Row title="เตือนก่อนบิลถึงกำหนด" sub="ล่วงหน้า 3 วัน" border onClick={v.swBillsClick} track={v.swBillsTrack} knob={v.swBillsKnob} />
        <Row title="เตือนเมื่อใกล้เกินงบ" sub="เมื่อใช้ถึง 80% ของงบ" border onClick={v.swBudgetClick} track={v.swBudgetTrack} knob={v.swBudgetKnob} />
        <Row title="สรุปประจำสัปดาห์" sub="ทุกเช้าวันจันทร์" onClick={v.swWeeklyClick} track={v.swWeeklyTrack} knob={v.swWeeklyKnob} />
      </div>

      {/* theme picker */}
      <div style={css('font-size:13px;font-weight:700;color:var(--muted2);margin:0 0 10px 2px')}>ธีมแอป</div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px;margin-bottom:22px')}>
        <div style={css('font-size:12.5px;color:var(--muted);margin-bottom:14px')}>เลือกสีพื้นของแอป ตัวอักษรจะปรับโทนให้อ่านง่ายอัตโนมัติ</div>
        <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:12px')}>
          {v.themeOptions.map((t) => (
            <div key={t.key}>
              <div onClick={t.onClick} style={css(t.swatchStyle)}>
                <span style={css(t.tickStyle)}>✓</span>
              </div>
              <div style={css(t.labelStyle)}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={css('font-size:13px;font-weight:700;color:var(--muted2);margin:0 0 10px 2px')}>ความปลอดภัยและการแสดงผล</div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin-bottom:22px')}>
        <IconRow icon="🔒" title="ล็อกด้วยสแกนใบหน้า" sub="เปิดแอปต้องยืนยันตัวตน" border onClick={v.swBiometricClick} track={v.swBiometricTrack} knob={v.swBiometricKnob} />
        <IconRow icon="🙈" title="ซ่อนจำนวนเงิน" sub="แสดงเป็น ••• จนกว่าจะแตะ" onClick={v.swHideAmountsClick} track={v.swHideAmountsTrack} knob={v.swHideAmountsKnob} />
      </div>

      <div style={css('font-size:13px;font-weight:700;color:var(--muted2);margin:0 0 10px 2px')}>ทั่วไป</div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin-bottom:22px')}>
        <div style={css('display:flex;align-items:center;gap:14px;padding:15px 16px;border-bottom:1px solid var(--divider)')}>
          <span style={css('font-size:18px;width:24px;text-align:center')}>🌐</span>
          <span style={css('flex:1;font-size:14.5px;font-weight:500')}>ภาษา</span>
          <span style={css('font-size:13.5px;color:var(--muted)')}>ไทย ›</span>
        </div>
        <div style={css('display:flex;align-items:center;gap:14px;padding:15px 16px;border-bottom:1px solid var(--divider)')}>
          <span style={css('font-size:18px;width:24px;text-align:center')}>💱</span>
          <span style={css('flex:1;font-size:14.5px;font-weight:500')}>สกุลเงิน</span>
          <span style={css('font-size:13.5px;color:var(--muted)')}>บาท (฿) ›</span>
        </div>
        <div style={css('display:flex;align-items:center;gap:14px;padding:15px 16px')}>
          <span style={css('font-size:18px;width:24px;text-align:center')}>💬</span>
          <span style={css('flex:1;font-size:14.5px;font-weight:500')}>ช่วยเหลือและติดต่อเรา</span>
          <span style={css('font-size:17px;color:#c4c6bc')}>›</span>
        </div>
      </div>

      <button onClick={v.logout} style={css('width:100%;height:50px;border-radius:14px;background:var(--card);border:1px solid #f0dad5;color:#d9776a;font-size:15px;font-weight:600')}>ออกจากระบบ</button>
      <div style={css('text-align:center;font-size:12px;color:#bdbfb5;margin-top:18px')}>เงินทอน · เวอร์ชัน 1.0.0</div>
    </div>
  );
}

function Toggle({ onClick, track, knob }) {
  return (
    <button onClick={onClick} style={css(track)}>
      <span style={css(knob)}></span>
    </button>
  );
}

function Row({ title, sub, border, onClick, track, knob }) {
  return (
    <div style={css('display:flex;align-items:center;gap:14px;padding:15px 16px;' + (border ? 'border-bottom:1px solid var(--divider)' : ''))}>
      <div>
        <div style={css('font-size:14.5px;font-weight:500')}>{title}</div>
        <div style={css('font-size:12px;color:var(--muted);margin-top:1px')}>{sub}</div>
      </div>
      <div style={css('flex:1')}></div>
      <Toggle onClick={onClick} track={track} knob={knob} />
    </div>
  );
}

function IconRow({ icon, title, sub, border, onClick, track, knob }) {
  return (
    <div style={css('display:flex;align-items:center;gap:14px;padding:15px 16px;' + (border ? 'border-bottom:1px solid var(--divider)' : ''))}>
      <span style={css('font-size:18px;width:24px;text-align:center')}>{icon}</span>
      <div>
        <div style={css('font-size:14.5px;font-weight:500')}>{title}</div>
        <div style={css('font-size:12px;color:var(--muted);margin-top:1px')}>{sub}</div>
      </div>
      <div style={css('flex:1')}></div>
      <Toggle onClick={onClick} track={track} knob={knob} />
    </div>
  );
}
