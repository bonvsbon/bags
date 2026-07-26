import { css } from '../lib/css.js';

export default function Sheet({ v }) {
  return (
    <div onClick={v.closeSheet} style={css('position:absolute;inset:0;background:rgba(28,30,26,0.4);z-index:30;animation:nlFade .2s ease;display:flex;align-items:flex-end')}>
      <div onClick={v.stop} style={css('width:100%;background:var(--bg);border-radius:26px 26px 44px 44px;padding:10px 22px 30px;animation:nlSheetUp .3s cubic-bezier(.2,.8,.2,1)')}>
        <div style={css('width:40px;height:4px;border-radius:3px;background:#d6d3c9;margin:0 auto 18px')}></div>
        <div style={css('display:flex;align-items:center;gap:9px;margin-bottom:4px')}>
          <span style={css('width:26px;height:26px;border-radius:8px;background:#e8f1ec;display:flex;align-items:center;justify-content:center;font-size:14px')}>✦</span>
          <span style={css('font-size:17px;font-weight:700')}>สรุปสั้น ๆ ของเดือนนี้</span>
        </div>
        <div style={css('font-size:13px;color:var(--muted);margin-bottom:18px')}>เราดูให้แล้ว ไม่มีอะไรต้องกังวล</div>
        <div style={css('display:flex;flex-direction:column;gap:10px')}>
          <div style={css('background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center')}>
            <span style={css('font-size:14px;color:var(--muted2)')}>เดือนนี้คุณใช้เงินไป</span>
            <span style={css('font-size:16px;font-weight:700')}>฿41,800</span>
          </div>
          <div style={css('background:#faf3e8;border:1px solid #f0e3cd;border-radius:14px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center')}>
            <span style={css('font-size:14px;color:#9a7b40')}>ค่าอาหารสูงกว่าปกติ</span>
            <span style={css('font-size:16px;font-weight:700;color:#c98a3c')}>+฿1,100</span>
          </div>
          <div style={css('background:#eef7f1;border:1px solid #d6e9dd;border-radius:14px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center')}>
            <span style={css('font-size:14px;color:#2f7d5b')}>ยังมีเงินใช้ได้จริง</span>
            <span style={css('font-size:16px;font-weight:700;color:#2f7d5b')}>฿12,800</span>
          </div>
        </div>
        <div style={css('background:var(--card);border:1px dashed #cfe3d8;border-radius:14px;padding:16px;margin-top:14px')}>
          <div style={css('font-size:14px;font-weight:600;line-height:1.5')}>ลองตั้งเป้าลดค่าอาหารวันละ ฿100 ในสัปดาห์นี้</div>
          <div style={css('font-size:12.5px;color:var(--muted);margin-top:4px')}>ทำได้สบาย ๆ แล้วคุณจะกลับมาอยู่ในแผนพอดี</div>
        </div>
        <div style={css('display:flex;gap:10px;margin-top:18px')}>
          <button onClick={v.closeSheet} style={css('flex:none;padding:0 22px;height:50px;border-radius:14px;background:var(--fill2);color:var(--muted2);font-size:15px;font-weight:600')}>ไว้ก่อน</button>
          <button onClick={v.sheetToAi} style={css('flex:1;height:50px;border-radius:14px;background:#2f7d5b;color:#fff;font-size:15px;font-weight:600')}>วางแผนกับ AI</button>
        </div>
      </div>
    </div>
  );
}
