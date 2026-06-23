import { css } from '../lib/css.js';

export default function Goals({ v }) {
  return (
    <div style={css('padding:6px 20px 120px;animation:nlSwap .26s ease')}>
      <div style={css('margin:8px 0 18px;font-size:21px;font-weight:700')}>เป้าหมายของฉัน</div>
      <div style={css('display:flex;flex-direction:column;gap:14px')}>
        {v.goalCards.map((g, i) => (
          <div key={i} style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:20px;box-shadow:0 1px 2px rgba(40,42,33,0.04),0 8px 22px -14px rgba(40,42,33,0.12)')}>
            <div style={css('display:flex;align-items:center;gap:12px;margin-bottom:16px')}>
              <div style={css('width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;background:' + g.iconBg)}>{g.icon}</div>
              <div style={css('flex:1')}><div style={css('font-size:16px;font-weight:700')}>{g.name}</div><div style={css('font-size:12.5px;color:var(--muted);margin-top:1px')}>เป้าหมาย {g.target}</div></div>
              <div style={css('font-size:20px;font-weight:800;color:#2f7d5b')}>{g.pct}</div>
              <button onClick={g.onDelete} style={css('width:30px;height:30px;border-radius:9px;background:#fbecea;color:#d9776a;display:flex;align-items:center;justify-content:center;font-size:13px;flex:none')}>🗑</button>
            </div>
            <div style={css('height:11px;border-radius:7px;background:var(--track);overflow:hidden')}><div style={css(g.barStyle)}></div></div>
            <div style={css('display:flex;justify-content:space-between;margin-top:10px;font-size:13px')}><span style={css('color:var(--muted2)')}>เก็บแล้ว <b style={css('color:var(--text)')}>{g.saved}</b></span><span style={css('color:var(--muted)')}>{g.remaining}</span></div>
          </div>
        ))}
      </div>
      <button onClick={v.createGoal} style={css('margin-top:16px;width:100%;height:50px;border-radius:14px;background:var(--card);border:1.5px dashed #cfe3d8;color:#2f7d5b;font-size:15px;font-weight:600')}>+ สร้างเป้าหมาย</button>
    </div>
  );
}
