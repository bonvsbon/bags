import { css } from '../lib/css.js';

export default function Onboarding({ v }) {
  return (
    <div style={css('min-height:100%;display:flex;flex-direction:column;padding:8px 26px 30px')}>
      {/* progress */}
      <div style={css('display:flex;gap:6px;margin:6px 0 30px')}>
        {v.onbDots.map((d, i) => <div key={i} style={css(d.style)}></div>)}
      </div>

      {v.onbIsStep1 && (
        <div>
          <div style={css('font-size:13px;color:#2f7d5b;font-weight:600;margin-bottom:10px')}>ขั้นที่ 1 จาก 4</div>
          <h1 style={css('font-size:27px;font-weight:700;line-height:1.3;margin:0 0 8px;letter-spacing:-0.01em')}>เงินเดือนหรือรายได้หลัก<br />เข้าวันไหน?</h1>
          <p style={css('font-size:14px;color:var(--muted);margin:0 0 26px')}>เลือกวันที่ใกล้เคียงก็ได้ ปรับทีหลังได้เสมอ</p>
          <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:10px')}>
            {v.payDays.map((d, i) => <button key={i} onClick={d.onClick} style={css(d.style)}>{d.label}</button>)}
          </div>
          <button onClick={v.payEomClick} style={css(v.payEomStyle)}>
            <span style={css('font-size:16px')}>📅</span>วันสิ้นเดือน (วันสุดท้ายของเดือน)</button>
        </div>
      )}

      {v.onbIsStep2 && (
        <div style={css('display:flex;flex-direction:column;min-height:100%')}>
          <div style={css('font-size:13px;color:#2f7d5b;font-weight:600;margin-bottom:10px')}>ขั้นที่ 2 จาก 4</div>
          <h1 style={css('font-size:27px;font-weight:700;line-height:1.3;margin:0 0 8px;letter-spacing:-0.01em')}>รายได้ต่อเดือน<br />ประมาณเท่าไร?</h1>
          <p style={css('font-size:14px;color:var(--muted);margin:0 0 18px')}>ใส่โดยประมาณก็ได้ แก้ทีหลังได้เสมอ</p>
          <div style={css('display:flex;align-items:baseline;justify-content:center;gap:8px;padding:18px 0;border-bottom:2px solid #2f7d5b')}>
            <span style={css('font-size:34px;color:#bdbfb5;font-weight:600')}>฿</span>
            <span style={css('font-size:50px;font-weight:700;letter-spacing:-0.02em')}>{v.onbIncomeDisplay}</span>
          </div>
          <div style={css('display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;justify-content:center')}>
            {v.incomePresets.map((p, i) => <button key={i} onClick={p.onClick} style={css(p.style)}>{p.label}</button>)}
          </div>
          <div style={css('flex:1;min-height:14px')}></div>
          <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px')}>
            {v.onbKeypad.map((k, i) => <button key={i} onClick={k.onClick} style={css('height:48px;border-radius:13px;background:var(--card);border:1px solid #e6e2d9;font-size:21px;font-weight:600;color:var(--text)')}>{k.label}</button>)}
          </div>
        </div>
      )}

      {v.onbIsStep3 && (
        <div>
          <div style={css('font-size:13px;color:#2f7d5b;font-weight:600;margin-bottom:10px')}>ขั้นที่ 3 จาก 4</div>
          <h1 style={css('font-size:27px;font-weight:700;line-height:1.3;margin:0 0 8px;letter-spacing:-0.01em')}>มีค่าใช้จ่ายอะไร<br />ที่ต้องจ่ายทุกเดือนไหม?</h1>
          <p style={css('font-size:14px;color:var(--muted);margin:0 0 22px')}>เลือกได้หลายอย่าง ไม่มีก็ข้ามได้</p>
          <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:10px')}>
            {v.recurringOptions.map((o, i) => (
              <button key={i} onClick={o.onClick} style={css(o.style)}>
                <span style={css('font-size:14px;font-weight:500')}>{o.label}</span>
                <span style={css(o.checkStyle)}>✓</span>
              </button>
            ))}
          </div>
          {v.otherOn && (
            <div style={css('margin-top:14px;background:var(--card);border:1px solid #e6e2d9;border-radius:14px;padding:14px')}>
              <div style={css('font-size:12.5px;color:var(--muted);margin-bottom:10px')}>พิมพ์ชื่อค่าใช้จ่ายอื่น ๆ แล้วกดเพิ่มได้เรื่อย ๆ</div>
              <div style={css('display:flex;gap:8px')}>
                <input value={v.customDraft} onChange={v.onCustomInput} placeholder="เช่น ค่าฟิตเนส, ประกัน" style={css('flex:1;height:44px;border:1px solid #e0ddd4;border-radius:11px;padding:0 13px;font-size:14px;font-family:inherit;background:var(--bg);color:var(--text);outline:none')} />
                <button onClick={v.addCustom} style={css('flex:none;height:44px;padding:0 18px;border-radius:11px;background:#2f7d5b;color:#fff;font-size:14px;font-weight:600;font-family:inherit')}>เพิ่ม</button>
              </div>
              {v.hasCustom && (
                <div style={css('display:flex;flex-wrap:wrap;gap:8px;margin-top:12px')}>
                  {v.customChips.map((c, i) => (
                    <button key={i} onClick={c.onClick} style={css('display:flex;align-items:center;gap:7px;padding:8px 12px;border-radius:20px;background:#e8f1ec;border:1px solid #cfe3d8;color:#2f7d5b;font-size:13px;font-weight:500;font-family:inherit')}>{c.label}<span style={css('font-size:14px;opacity:0.6')}>✕</span></button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {v.onbIsStep4 && (
        <div>
          <div style={css('font-size:13px;color:#2f7d5b;font-weight:600;margin-bottom:10px')}>ขั้นที่ 4 จาก 4</div>
          <h1 style={css('font-size:27px;font-weight:700;line-height:1.3;margin:0 0 8px;letter-spacing:-0.01em')}>ตอนนี้อยากให้เงิน<br />ช่วยเรื่องไหนมากที่สุด?</h1>
          <p style={css('font-size:14px;color:var(--muted);margin:0 0 22px')}>เลือก 1 ข้อ เปลี่ยนได้ทุกเมื่อ</p>
          <div style={css('display:flex;flex-direction:column;gap:10px')}>
            {v.goalOptions.map((o, i) => (
              <button key={i} onClick={o.onClick} style={css(o.style)}>
                <span style={css(o.dotStyle)}></span>
                <span style={css('font-size:15px;font-weight:500')}>{o.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {v.onbIsDone && (
        <div style={css('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding-bottom:40px')}>
          <div style={css('width:88px;height:88px;border-radius:50%;background:#e8f1ec;display:flex;align-items:center;justify-content:center;margin-bottom:26px;animation:nlPop .4s ease')}>
            <div style={css('width:54px;height:54px;border-radius:50%;background:#2f7d5b;display:flex;align-items:center;justify-content:center;color:#fff;font-size:26px')}>✓</div>
          </div>
          <h1 style={css('font-size:26px;font-weight:700;line-height:1.35;margin:0 0 12px')}>พร้อมแล้ว</h1>
          <p style={css('font-size:15px;color:var(--muted2);line-height:1.6;margin:0;max-width:280px')}>เราจะช่วยดูว่าเงินของคุณไปไหน<br />และเหลือใช้จริงเท่าไรในแต่ละเดือน</p>
        </div>
      )}

      <div style={css('flex:1')}></div>
      <div style={css('display:flex;gap:12px;margin-top:30px')}>
        {v.onbCanBack && (
          <button onClick={v.onbBack} style={css('flex:none;width:54px;height:54px;border-radius:16px;background:var(--card);border:1px solid #e6e2d9;font-size:18px;color:var(--muted2);display:flex;align-items:center;justify-content:center')}>‹</button>
        )}
        <button onClick={v.onbNext} style={css('flex:1;height:54px;border-radius:16px;background:#2f7d5b;color:#fff;font-size:16px;font-weight:600;box-shadow:0 6px 16px -4px rgba(47,125,91,0.5)')}>{v.onbCtaLabel}</button>
      </div>
    </div>
  );
}
