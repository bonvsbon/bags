import { css } from '../lib/css.js';

export default function Home({ v }) {
  return (
    <div style={css('padding:6px 20px 120px;animation:nlSwap .26s ease')}>
      {/* header */}
      <div style={css('display:flex;align-items:center;justify-content:space-between;margin:8px 0 20px')}>
        <div>
          <div style={css('font-size:21px;font-weight:700;letter-spacing:-0.01em')}>สวัสดีครับ, บอล</div>
          <div style={css('font-size:13px;color:var(--muted);margin-top:2px')}>ภาพรวมเดือนมิถุนายน</div>
        </div>
        <div style={css('width:42px;height:42px;border-radius:50%;background:#e8f1ec;border:1px solid #d6e6dd;display:flex;align-items:center;justify-content:center;color:#2f7d5b;font-weight:600;font-size:15px')}>บ</div>
      </div>

      {/* HERO VARIANT A */}
      {v.heroA && (
        <div style={css('background:var(--card);border:1px solid var(--border);border-radius:20px;padding:22px;box-shadow:0 1px 2px rgba(40,42,33,0.04),0 8px 24px -12px rgba(40,42,33,0.1)')}>
          <div style={css('display:flex;align-items:center;gap:7px;color:var(--muted);font-size:13px;font-weight:500')}><span style={css('width:7px;height:7px;border-radius:50%;background:#2f7d5b;display:inline-block')}></span>เงินที่ใช้ได้จริง</div>
          <div style={css('font-size:46px;font-weight:800;letter-spacing:-0.03em;margin:8px 0 4px;color:var(--text)')}>฿12,800</div>
          <div style={css('font-size:13px;color:var(--muted)')}>หลังหักบิลและค่าใช้จ่ายที่รอแล้ว</div>
          <div style={css('height:8px;border-radius:6px;background:var(--track);margin:18px 0 0;overflow:hidden;display:flex')}>
            <div style={css('width:74%;background:#cde0d5')}></div>
            <div style={css('width:26%;background:#2f7d5b')}></div>
          </div>
          <div style={css('display:flex;justify-content:space-between;margin-top:8px;font-size:11.5px;color:var(--muted)')}>
            <span>กันไว้แล้ว ฿37,200</span><span style={css('color:#2f7d5b;font-weight:600')}>ใช้ได้ ฿12,800</span>
          </div>
          <button onClick={v.goDetail} style={css('margin-top:16px;width:100%;height:42px;border-radius:12px;background:var(--fill);color:#3a4d42;font-size:13.5px;font-weight:600')}>ดูรายละเอียด</button>
        </div>
      )}

      {/* HERO VARIANT B */}
      {v.heroB && (
        <div style={css('background:#2f7d5b;border-radius:20px;padding:24px;box-shadow:0 10px 30px -10px rgba(47,125,91,0.5);color:#fff;position:relative;overflow:hidden')}>
          <div style={css('position:absolute;right:-30px;top:-30px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,0.06)')}></div>
          <div style={css('font-size:13px;font-weight:500;opacity:0.85')}>เงินที่ใช้ได้จริง</div>
          <div style={css('font-size:48px;font-weight:800;letter-spacing:-0.03em;margin:6px 0 4px')}>฿12,800</div>
          <div style={css('font-size:13px;opacity:0.8')}>หลังหักบิลและค่าใช้จ่ายที่รอแล้ว</div>
          <div style={css('display:flex;gap:10px;margin-top:20px')}>
            <div style={css('flex:1;background:rgba(255,255,255,0.12);border-radius:13px;padding:12px 14px')}>
              <div style={css('font-size:11px;opacity:0.8')}>เงินทั้งหมด</div>
              <div style={css('font-size:18px;font-weight:700;margin-top:2px')}>฿50,000</div>
            </div>
            <div style={css('flex:1;background:rgba(255,255,255,0.12);border-radius:13px;padding:12px 14px')}>
              <div style={css('font-size:11px;opacity:0.8')}>ต้องกันไว้</div>
              <div style={css('font-size:18px;font-weight:700;margin-top:2px')}>฿37,200</div>
            </div>
          </div>
        </div>
      )}

      {/* HERO VARIANT C */}
      {v.heroC && (
        <div style={css('background:var(--card);border:1px solid var(--border);border-radius:20px;padding:22px;box-shadow:0 1px 2px rgba(40,42,33,0.04),0 8px 24px -12px rgba(40,42,33,0.1)')}>
          <div style={css('font-size:13px;color:var(--muted);font-weight:500;margin-bottom:14px')}>เงินที่ใช้ได้จริงเดือนนี้</div>
          <div style={css('display:flex;align-items:flex-end;gap:18px')}>
            <div style={css('position:relative;width:96px;height:96px;flex:none')}>
              <div style={css('position:absolute;inset:0;border-radius:50%;background:conic-gradient(#2f7d5b 0% 26%,var(--track) 26% 100%)')}></div>
              <div style={css('position:absolute;inset:11px;border-radius:50%;background:var(--card);display:flex;flex-direction:column;align-items:center;justify-content:center')}><span style={css('font-size:20px;font-weight:800;color:#2f7d5b')}>26%</span><span style={css('font-size:9px;color:var(--muted)')}>ของเงินทั้งหมด</span></div>
            </div>
            <div>
              <div style={css('font-size:40px;font-weight:800;letter-spacing:-0.03em;line-height:1')}>฿12,800</div>
              <div style={css('font-size:12.5px;color:var(--muted);margin-top:6px')}>จากเงินทั้งหมด ฿50,000<br />กันไว้สำหรับบิล &amp; เป้าหมาย ฿37,200</div>
            </div>
          </div>
          <button onClick={v.goDetail} style={css('margin-top:18px;width:100%;height:42px;border-radius:12px;background:var(--fill);color:#3a4d42;font-size:13.5px;font-weight:600')}>ดูรายละเอียด</button>
        </div>
      )}

      {/* secondary cards */}
      <div style={css('display:flex;gap:12px;margin-top:14px')}>
        <div style={css('flex:1;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:15px')}>
          <div style={css('font-size:12px;color:var(--muted)')}>เงินในบัญชีทั้งหมด</div>
          <div style={css('font-size:21px;font-weight:700;margin-top:5px')}>฿50,000</div>
        </div>
        <div style={css('flex:1;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:15px')}>
          <div style={css('font-size:12px;color:var(--muted)')}>ต้องกันไว้</div>
          <div style={css('font-size:21px;font-weight:700;margin-top:5px;color:#c98a3c')}>฿37,200</div>
        </div>
      </div>

      {/* this month */}
      <div style={css('margin:24px 0 12px;font-size:15px;font-weight:700')}>เดือนนี้เป็นอย่างไร</div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px')}>
        <div style={css('display:flex;justify-content:space-between;gap:14px')}>
          <div style={css('flex:1')}>
            <div style={css('display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--muted)')}><span style={css('width:8px;height:8px;border-radius:3px;background:#3f9d6b')}></span>เงินเข้า</div>
            <div style={css('font-size:20px;font-weight:700;color:#3f9d6b;margin-top:4px')}>฿70,000</div>
          </div>
          <div style={css('width:1px;background:#eee9e0')}></div>
          <div style={css('flex:1')}>
            <div style={css('display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--muted)')}><span style={css('width:8px;height:8px;border-radius:3px;background:#d9776a')}></span>เงินออก</div>
            <div style={css('font-size:20px;font-weight:700;color:#d9776a;margin-top:4px')}>฿41,800</div>
          </div>
        </div>
        <div style={css('margin-top:14px;height:10px;border-radius:6px;overflow:hidden;display:flex;gap:3px')}>
          <div style={css('flex:70000;background:#dcefe2;border-radius:6px')}></div>
          <div style={css('flex:41800;background:#f6dcd6;border-radius:6px')}></div>
        </div>
        <div style={css('margin-top:12px;font-size:12.5px;color:#3f9d6b;background:#eef7f1;border-radius:10px;padding:9px 12px;display:flex;align-items:center;gap:7px')}>↓ ใช้จ่ายน้อยกว่าเดือนก่อน 8%</div>
      </div>

      {/* upcoming */}
      <div style={css('display:flex;align-items:center;justify-content:space-between;margin:24px 0 12px')}>
        <div style={css('font-size:15px;font-weight:700')}>ต้องจ่ายเร็ว ๆ นี้</div>
        <button onClick={v.goBills} style={css('font-size:13px;color:#2f7d5b;font-weight:600')}>ดูทั้งหมด</button>
      </div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden')}>
        {v.upcomingBills.map((b, i) => (
          <div key={i} style={css(b.rowStyle)}>
            <div style={css('width:38px;height:38px;border-radius:11px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:16px')}>{b.icon}</div>
            <div style={css('flex:1')}>
              <div style={css('font-size:14.5px;font-weight:600')}>{b.name}</div>
              <div style={css('font-size:12px;color:var(--muted);margin-top:1px')}>{b.due}</div>
            </div>
            <div style={css('font-size:15px;font-weight:700')}>{b.amount}</div>
          </div>
        ))}
      </div>

      {/* watch budgets */}
      <div style={css('margin:24px 0 12px;font-size:15px;font-weight:700')}>งบที่ต้องระวัง</div>
      <div style={css('display:flex;flex-direction:column;gap:12px')}>
        {v.watchBudgets.map((g, i) => (
          <div key={i} style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px')}>
            <div style={css('display:flex;justify-content:space-between;align-items:center')}>
              <span style={css('font-size:14.5px;font-weight:600')}>{g.name}</span>
              <span style={css(g.tagStyle)}>{g.tag}</span>
            </div>
            <div style={css('height:9px;border-radius:6px;background:var(--track);margin:12px 0 8px;overflow:hidden')}>
              <div style={css(g.barStyle)}></div>
            </div>
            <div style={css('font-size:12.5px;color:var(--muted)')}>{g.detail}</div>
          </div>
        ))}
      </div>

      {/* recent */}
      <div style={css('display:flex;align-items:center;justify-content:space-between;margin:24px 0 12px')}>
        <div style={css('font-size:15px;font-weight:700')}>รายการล่าสุด</div>
        <button onClick={v.goTxns} style={css('font-size:13px;color:#2f7d5b;font-weight:600')}>ดูทั้งหมด</button>
      </div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden')}>
        {v.recentTxns.map((t, i) => (
          <div key={i} style={css(t.rowStyle)}>
            <div style={css('width:38px;height:38px;border-radius:11px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:16px')}>{t.icon}</div>
            <div style={css('flex:1')}>
              <div style={css('font-size:14.5px;font-weight:600')}>{t.name}</div>
              <div style={css('font-size:12px;color:var(--muted);margin-top:1px')}>{t.meta}</div>
            </div>
            <div style={css(t.amountStyle)}>{t.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
