import { css } from '../lib/css.js';

export default function More({ v }) {
  return (
    <div style={css('padding:6px 20px 120px;animation:nlSwap .26s ease')}>
      <div style={css('margin:8px 0 18px;font-size:21px;font-weight:700')}>เพิ่มเติม</div>
      {/* profile */}
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:18px;display:flex;align-items:center;gap:14px;margin-bottom:18px')}>
        <div style={css('width:52px;height:52px;border-radius:50%;background:#e8f1ec;border:1px solid #d6e6dd;display:flex;align-items:center;justify-content:center;color:#2f7d5b;font-weight:700;font-size:19px')}>บ</div>
        <div style={css('flex:1')}>
          <div style={css('font-size:16px;font-weight:700')}>บอล</div>
          <div style={css('font-size:12.5px;color:var(--muted);margin-top:1px')}>แตะเพื่อแก้ไขโปรไฟล์</div>
        </div>
        <span style={css('font-size:18px;color:#c4c6bc')}>›</span>
      </div>
      {/* mode toggle */}
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:18px;margin-bottom:18px')}>
        <div style={css('font-size:14.5px;font-weight:700;margin-bottom:4px')}>โหมดการใช้งาน</div>
        <div style={css('font-size:12.5px;color:var(--muted);margin-bottom:14px')}>เริ่มแบบง่ายก่อน เปิดฟีเจอร์ละเอียดเมื่อพร้อม</div>
        <div style={css('display:flex;background:var(--fill2);border-radius:13px;padding:4px;gap:3px')}>
          <button onClick={v.setBeginner} style={css(v.modeBeginnerStyle)}>เริ่มต้นใช้ง่าย</button>
          <button onClick={v.setAdvanced} style={css(v.modeAdvancedStyle)}>ขั้นสูง</button>
        </div>
      </div>
      {/* main menu */}
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;overflow:hidden;margin-bottom:18px')}>
        {v.moreMain.map((m, i) => (
          <button key={i} onClick={m.onClick} style={css(m.rowStyle)}>
            <div style={css('width:40px;height:40px;border-radius:12px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:18px')}>{m.icon}</div>
            <div style={css('flex:1')}>
              <div style={css('font-size:14.5px;font-weight:600')}>{m.label}</div>
              <div style={css('font-size:12px;color:var(--muted);margin-top:1px')}>{m.sub}</div>
            </div>
            <span style={css('font-size:17px;color:#c4c6bc')}>›</span>
          </button>
        ))}
      </div>
      {/* advanced features (hidden until advanced mode) */}
      {v.isAdvanced && (
        <div>
          <div style={css('font-size:13px;font-weight:700;color:var(--muted2);margin:0 0 10px 2px;display:flex;align-items:center;gap:7px')}>
            <span style={css('width:7px;height:7px;border-radius:50%;background:#2f7d5b')}></span>ฟีเจอร์ขั้นสูง</div>
          <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;overflow:hidden')}>
            {v.moreAdvanced.map((m, i) => (
              <div key={i} style={css(m.rowStyle)}>
                <div style={css('width:40px;height:40px;border-radius:12px;background:#e8f1ec;display:flex;align-items:center;justify-content:center;font-size:18px')}>{m.icon}</div>
                <div style={css('flex:1')}>
                  <div style={css('font-size:14.5px;font-weight:600')}>{m.label}</div>
                  <div style={css('font-size:12px;color:var(--muted);margin-top:1px')}>{m.sub}</div>
                </div>
                <span style={css('font-size:17px;color:#c4c6bc')}>›</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {v.isBeginner && (
        <div style={css('background:#eef7f1;border:1px solid #d6e9dd;border-radius:16px;padding:16px;display:flex;gap:12px;align-items:flex-start')}>
          <span style={css('width:26px;height:26px;border-radius:8px;background:#2f7d5b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;flex:none')}>✦</span>
          <div style={css('font-size:13px;color:#3a4d42;line-height:1.55')}>ตอนนี้คุณใช้โหมดเริ่มต้น เรียบง่าย ไม่ซับซ้อน เมื่อพร้อมอยากดูรายงานละเอียดหรือส่งออกข้อมูล เปิด “ขั้นสูง” ได้ตลอดครับ</div>
        </div>
      )}
    </div>
  );
}
