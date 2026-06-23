import { css } from '../lib/css.js';

export default function Transactions({ v }) {
  return (
    <div style={css('padding:6px 20px 120px;animation:nlSwap .26s ease')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;margin:8px 0 16px')}>
        <div style={css('font-size:21px;font-weight:700')}>รายการ</div>
        <div style={css('display:flex;gap:8px')}>
          <button onClick={v.searchTxn} style={css('width:40px;height:40px;border-radius:12px;background:var(--card);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:16px')}>⌕</button>
          <button onClick={v.toggleEmpty} style={css('width:40px;height:40px;border-radius:12px;background:var(--card);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:15px')}>⊜</button>
        </div>
      </div>
      <div className="nl-scroll" style={css('display:flex;gap:8px;overflow-x:auto;margin-bottom:18px;padding-bottom:2px')}>
        {v.txnFilters.map((f, i) => <button key={i} onClick={f.onClick} style={css(f.style)}>{f.label}</button>)}
      </div>

      {v.txnEmpty && (
        <div style={css('display:flex;flex-direction:column;align-items:center;text-align:center;padding:60px 30px')}>
          <div style={css('width:76px;height:76px;border-radius:24px;background:var(--track);display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:20px')}>🧾</div>
          <div style={css('font-size:17px;font-weight:700;margin-bottom:8px')}>ยังไม่มีรายการ</div>
          <div style={css('font-size:14px;color:var(--muted);line-height:1.5;margin-bottom:24px')}>เริ่มบันทึกรายจ่ายแรกของคุณได้เลย<br />ใช้เวลาไม่ถึงนาที</div>
          <button onClick={v.goAdd} style={css('height:48px;padding:0 26px;border-radius:14px;background:#2f7d5b;color:#fff;font-size:15px;font-weight:600')}>+ เพิ่มรายการแรก</button>
        </div>
      )}

      {v.txnHasItems && (
        <div style={css('display:flex;flex-direction:column;gap:20px')}>
          {v.txnGroups.map((grp, gi) => (
            <div key={gi}>
              <div style={css('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:9px;padding:0 2px')}>
                <span style={css('font-size:13px;font-weight:600;color:var(--muted2)')}>{grp.label}</span>
                <span style={css('font-size:12px;color:#aeb0a6')}>{grp.sum}</span>
              </div>
              <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden')}>
                {grp.items.map((t, i) => (
                  <div key={i} style={css(t.rowStyle)}>
                    <div style={css('width:38px;height:38px;border-radius:11px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:16px')}>{t.icon}</div>
                    <div style={css('flex:1')}>
                      <div style={css('font-size:14.5px;font-weight:600')}>{t.name}</div>
                      <div style={css('font-size:12px;color:var(--muted);margin-top:1px')}>{t.cat}</div>
                    </div>
                    <div style={css(t.amountStyle)}>{t.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div style={css('text-align:center;font-size:12px;color:#bdbfb5;padding:4px')}>ปัดซ้ายที่รายการเพื่อแก้ไขหรือลบ</div>
        </div>
      )}
    </div>
  );
}
