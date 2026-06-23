import { css } from '../lib/css.js';

export default function Plan({ v }) {
  return (
    <div style={css('padding:6px 20px 120px;animation:nlSwap .26s ease')}>
      <div style={css('margin:8px 0 18px')}>
        <div style={css('font-size:21px;font-weight:700')}>แผนเงินเดือนนี้</div>
        <div style={css('font-size:13px;color:var(--muted);margin-top:2px')}>มิถุนายน · เหลืออีก 20 วันก่อนเงินเดือนออก</div>
      </div>

      <div style={css('background:#2f7d5b;border-radius:20px;padding:22px;color:#fff;box-shadow:0 10px 28px -12px rgba(47,125,91,0.5)')}>
        <div style={css('font-size:13px;opacity:0.85')}>เดือนนี้คุณยังใช้ได้อีก</div>
        <div style={css('font-size:44px;font-weight:800;letter-spacing:-0.03em;margin-top:4px')}>฿12,800</div>
      </div>

      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px;margin-top:12px;display:flex;align-items:center;gap:16px')}>
        <div style={css('width:52px;height:52px;border-radius:15px;background:#e8f1ec;display:flex;flex-direction:column;align-items:center;justify-content:center;flex:none;color:#2f7d5b')}><span style={css('font-size:18px;font-weight:800;line-height:1')}>20</span><span style={css('font-size:9px')}>วัน</span></div>
        <div>
          <div style={css('font-size:13.5px;color:var(--muted)')}>ถ้าอยากให้เงินพอถึงวันเงินเดือนออก</div>
          <div style={css('font-size:16px;font-weight:700;margin-top:3px')}>ใช้ได้ประมาณวันละ <span style={css('color:#2f7d5b')}>฿640</span></div>
        </div>
      </div>

      <div style={css('margin:24px 0 12px;font-size:15px;font-weight:700')}>งบแต่ละหมวด</div>
      <div style={css('display:flex;flex-direction:column;gap:12px')}>
        {v.planCats.map((c, i) => (
          <div key={i} style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px')}>
            <div style={css('display:flex;justify-content:space-between;align-items:center;margin-bottom:4px')}>
              <div style={css('display:flex;align-items:center;gap:9px')}><span style={css('font-size:17px')}>{c.icon}</span><span style={css('font-size:14.5px;font-weight:600')}>{c.name}</span></div>
              {c.warn && <span style={css('font-size:11px;font-weight:600;color:#c98a3c;background:#faf3e8;padding:3px 9px;border-radius:7px')}>ใกล้ถึงงบ</span>}
            </div>
            <div style={css('height:9px;border-radius:6px;background:var(--track);margin:10px 0 8px;overflow:hidden')}><div style={css(c.barStyle)}></div></div>
            <div style={css('display:flex;justify-content:space-between;font-size:12.5px')}><span style={css('color:var(--muted)')}>ใช้ไป {c.used} จาก {c.total}</span><span style={{ fontWeight: 600, color: c.leftColor }}>เหลือ {c.left}</span></div>
          </div>
        ))}
      </div>

      <div style={css('background:#eef7f1;border:1px solid #d6e9dd;border-radius:16px;padding:18px;margin-top:18px')}>
        <div style={css('display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#2f7d5b;margin-bottom:8px')}><span style={css('width:22px;height:22px;border-radius:7px;background:#2f7d5b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px')}>✦</span>คำแนะนำเล็ก ๆ</div>
        <div style={css('font-size:14px;line-height:1.6;color:#3a4d42')}>เดือนนี้ค่าอาหารสูงกว่าปกติเล็กน้อย ถ้าลดลงวันละประมาณ <b>฿100</b> ใน 7 วันที่เหลือ คุณจะกลับมาอยู่ในแผนได้พอดี ไม่ต้องกังวลครับ</div>
      </div>
    </div>
  );
}
