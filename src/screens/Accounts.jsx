import { css } from '../lib/css.js';

export default function Accounts({ v }) {
  return (
    <div style={css('padding:6px 20px 120px;animation:nlSwap .26s ease')}>
      <div style={css('margin:8px 0 18px;font-size:21px;font-weight:700')}>บัญชีของฉัน</div>

      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:18px;margin-bottom:18px')}>
        <div style={css('font-size:13px;color:var(--muted)')}>เงินที่มีรวมทั้งหมด</div>
        <div style={css('font-size:34px;font-weight:800;letter-spacing:-0.02em;margin-top:4px')}>฿32,000</div>
      </div>

      <div style={css('font-size:13px;font-weight:700;color:var(--muted2);margin:0 0 10px 2px')}>เงินที่มี</div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin-bottom:20px')}>
        {v.assetRows.map((a, i) => (
          <div key={i} style={css(a.rowStyle)}>
            <div style={css('width:40px;height:40px;border-radius:12px;background:#e8f1ec;display:flex;align-items:center;justify-content:center;font-size:17px')}>{a.icon}</div>
            <div style={css('flex:1;font-size:14.5px;font-weight:600')}>{a.name}</div>
            <div style={css('font-size:15px;font-weight:700')}>{a.amount}</div>
          </div>
        ))}
      </div>

      <div style={css('font-size:13px;font-weight:700;color:var(--muted2);margin:0 0 10px 2px')}>ยอดที่ต้องจ่าย</div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden')}>
        {v.debtRows.map((d, i) => (
          <div key={i} style={css(d.rowStyle)}>
            <div style={css('width:40px;height:40px;border-radius:12px;background:#fbecea;display:flex;align-items:center;justify-content:center;font-size:17px')}>{d.icon}</div>
            <div style={css('flex:1')}><div style={css('font-size:14.5px;font-weight:600')}>{d.name}</div><div style={css('font-size:11.5px;color:var(--muted);margin-top:1px')}>{d.sub}</div></div>
            <div style={css('font-size:15px;font-weight:700;color:#d9776a')}>{d.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
