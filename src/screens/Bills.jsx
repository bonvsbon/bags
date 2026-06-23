import { css } from '../lib/css.js';

export default function Bills({ v }) {
  return (
    <div style={css('padding:6px 20px 120px;animation:nlSwap .26s ease')}>
      <div style={css('margin:8px 0 6px;font-size:21px;font-weight:700')}>บิลที่ต้องจ่าย</div>
      <div style={css('font-size:13px;color:var(--muted);margin-bottom:22px')}>เดือนนี้มี 4 บิล รวม ฿9,409</div>
      <div style={css('position:relative;padding-left:8px')}>
        <div style={css('position:absolute;left:23px;top:14px;bottom:14px;width:2px;background:#ece8df')}></div>
        <div style={css('display:flex;flex-direction:column;gap:14px')}>
          {v.billsTimeline.map((b, i) => (
            <div key={i} style={css('display:flex;gap:16px;align-items:flex-start;position:relative')}>
              <div style={css('flex:none;width:34px;display:flex;flex-direction:column;align-items:center;z-index:1')}>
                <div style={css(b.dotStyle)}></div>
                <div style={css('font-size:10px;color:var(--muted);margin-top:6px;text-align:center;font-weight:600')}>{b.date}</div>
              </div>
              <div style={css('flex:1;background:var(--card);border:1px solid var(--border);border-radius:15px;padding:14px 16px;display:flex;align-items:center;gap:12px;' + b.cardExtra)}>
                <div style={css('width:38px;height:38px;border-radius:11px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:17px')}>{b.icon}</div>
                <div style={css('flex:1')}>
                  <div style={css('font-size:14.5px;font-weight:600')}>{b.name}</div>
                  <div style={css('font-size:14px;font-weight:700;margin-top:2px')}>{b.amount}</div>
                </div>
                <div style={css('display:flex;flex-direction:column;align-items:flex-end;gap:8px')}>
                  <span style={css(b.statusStyle)}>{b.status}</span>
                  <div style={css('display:flex;gap:6px')}>
                    <button onClick={b.onEdit} style={css('width:30px;height:30px;border-radius:9px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:13px')}>✎</button>
                    <button onClick={b.onDelete} style={css('width:30px;height:30px;border-radius:9px;background:#fbecea;color:#d9776a;display:flex;align-items:center;justify-content:center;font-size:13px')}>🗑</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={v.addBill} style={css('margin-top:22px;width:100%;height:50px;border-radius:14px;background:var(--card);border:1.5px dashed #cfe3d8;color:#2f7d5b;font-size:15px;font-weight:600')}>+ เพิ่มบิลประจำ</button>
    </div>
  );
}
