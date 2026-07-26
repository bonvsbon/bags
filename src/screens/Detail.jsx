import { css } from '../lib/css.js';

export default function Detail({ v }) {
  return (
    <div style={css('padding:6px 20px 120px')}>
      <div style={css('display:flex;align-items:center;gap:12px;margin:6px 0 18px')}>
        <button onClick={v.goHome} style={css('flex:none;width:40px;height:40px;border-radius:12px;background:var(--card);border:1px solid var(--border);font-size:18px;color:var(--muted2);display:flex;align-items:center;justify-content:center')}>‹</button>
        <div style={css('font-size:19px;font-weight:700;white-space:nowrap')}>เงินที่ใช้ได้จริง</div>
      </div>
      <div style={css('background:#2f7d5b;border-radius:20px;padding:24px;color:#fff;text-align:center;box-shadow:0 10px 28px -12px rgba(47,125,91,0.5)')}>
        <div style={css('font-size:13px;opacity:0.85')}>ตอนนี้คุณใช้ได้จริง</div>
        <div style={css('font-size:46px;font-weight:800;letter-spacing:-0.03em;margin:6px 0 2px')}>฿12,800</div>
        <div style={css('font-size:12.5px;opacity:0.8')}>คิดจากเงินทั้งหมด หักสิ่งที่กันไว้แล้ว</div>
      </div>
      <div style={css('margin:22px 0 12px;font-size:14px;font-weight:700')}>เงินของคุณไปไหนบ้าง</div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden')}>
        <div style={css('display:flex;align-items:center;gap:13px;padding:16px;border-bottom:1px solid var(--divider)')}>
          <div style={css('width:40px;height:40px;border-radius:12px;background:#e8f1ec;display:flex;align-items:center;justify-content:center;font-size:18px')}>💰</div>
          <div style={css('flex:1')}>
            <div style={css('font-size:14.5px;font-weight:600')}>เงินในบัญชีทั้งหมด</div>
            <div style={css('font-size:12px;color:var(--muted);margin-top:1px')}>รวมทุกบัญชีและเงินสด</div>
          </div>
          <div style={css('font-size:16px;font-weight:800')}>฿50,000</div>
        </div>
        {v.detailItems.map((d, i) => (
          <div key={i} style={css('display:flex;align-items:center;gap:13px;padding:15px 16px;border-bottom:1px solid var(--divider)')}>
            <div style={css('width:40px;height:40px;border-radius:12px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:17px')}>{d.icon}</div>
            <div style={css('flex:1')}>
              <div style={css('font-size:14px;font-weight:600')}>{d.label}</div>
              <div style={css('font-size:11.5px;color:var(--muted);margin-top:1px')}>{d.sub}</div>
            </div>
            <div style={css('font-size:15px;font-weight:700;color:#c98a3c')}>{d.amount}</div>
          </div>
        ))}
        <div style={css('display:flex;align-items:center;gap:13px;padding:16px;background:#eef7f1')}>
          <div style={css('width:40px;height:40px;border-radius:12px;background:#2f7d5b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px')}>✓</div>
          <div style={css('flex:1')}>
            <div style={css('font-size:14.5px;font-weight:700;color:#2f7d5b')}>เหลือใช้จริง</div>
            <div style={css('font-size:11.5px;color:#5a8a72;margin-top:1px')}>ใช้ได้สบายใจถึงสิ้นเดือน</div>
          </div>
          <div style={css('font-size:18px;font-weight:800;color:#2f7d5b')}>฿12,800</div>
        </div>
      </div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;margin-top:12px;display:flex;align-items:center;gap:14px')}>
        <div style={css('width:46px;height:46px;border-radius:14px;background:#e8f1ec;display:flex;flex-direction:column;align-items:center;justify-content:center;flex:none;color:#2f7d5b')}>
          <span style={css('font-size:16px;font-weight:800;line-height:1')}>20</span>
          <span style={css('font-size:9px')}>วัน</span>
        </div>
        <div style={css('flex:1')}>
          <div style={css('font-size:13px;color:var(--muted)')}>เฉลี่ยใช้ได้วันละ</div>
          <div style={css('font-size:18px;font-weight:800')}>฿640 <span style={css('font-size:12px;font-weight:500;color:var(--muted)')}>ถึงวันเงินเดือนออก</span></div>
        </div>
      </div>
      <button onClick={v.openAi} style={css('margin-top:12px;width:100%;background:linear-gradient(135deg,#3f9d6b,#2f7d5b);border-radius:16px;padding:16px 18px;display:flex;align-items:center;gap:14px;text-align:left;color:#fff;box-shadow:0 10px 24px -12px rgba(47,125,91,0.6)')}>
        <div style={css('width:44px;height:44px;border-radius:13px;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;font-size:20px;flex:none')}>💬</div>
        <div style={css('flex:1')}>
          <div style={css('font-size:15px;font-weight:700')}>ถามผู้ช่วยเงินทอน</div>
          <div style={css('font-size:12px;opacity:0.9;margin-top:1px')}>พิมพ์ถามได้เลย ผมคำนวณจากเงินของคุณให้</div>
        </div>
        <span style={css('font-size:18px;opacity:0.8')}>›</span>
      </button>
    </div>
  );
}
