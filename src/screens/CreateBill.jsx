import { css } from '../lib/css.js';

export default function CreateBill({ v }) {
  return (
    <div style={css('min-height:100%;display:flex;flex-direction:column;padding:6px 20px 24px')}>
      <div style={css('display:flex;align-items:center;gap:12px;margin:6px 0 20px')}>
        <button onClick={v.goBillsBack} style={css('flex:none;width:40px;height:40px;border-radius:12px;background:var(--card);border:1px solid var(--border);font-size:18px;color:var(--muted2);display:flex;align-items:center;justify-content:center')}>‹</button>
        <div style={css('font-size:19px;font-weight:700;white-space:nowrap')}>{v.billFormTitle}</div>
      </div>

      <div style={css('font-size:13px;font-weight:600;color:var(--muted2);margin-bottom:10px')}>เลือกไอคอน</div>
      <div className="nl-scroll" style={css('display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;margin-bottom:20px')}>
        {v.billIconChoices.map((i, idx) => <button key={idx} onClick={i.onClick} style={css(i.style)}>{i.icon}</button>)}
      </div>

      <div style={css('font-size:13px;font-weight:600;color:var(--muted2);margin-bottom:8px')}>ชื่อบิล</div>
      <input value={v.billName} onChange={v.onBillName} placeholder="เช่น ค่าน้ำ, ประกันรถ" style={css('height:50px;border:1px solid var(--border);border-radius:13px;padding:0 15px;font-size:15px;font-family:inherit;background:var(--card);color:var(--text);outline:none;margin-bottom:18px')} />

      <div style={css('font-size:13px;font-weight:600;color:var(--muted2);margin-bottom:8px')}>จำนวนเงิน</div>
      <div style={css('display:flex;align-items:center;background:var(--card);border:1px solid var(--border);border-radius:13px;padding:0 15px')}>
        <span style={css('font-size:22px;color:#bdbfb5;font-weight:600')}>฿</span>
        <input value={v.billAmountDisplay} onChange={v.onBillAmount} inputMode="numeric" placeholder="0" style={css('flex:1;min-width:0;height:54px;border:none;background:transparent;font-size:26px;font-weight:700;font-family:inherit;color:var(--text);outline:none;text-align:right;letter-spacing:-0.01em')} />
      </div>
      {v.billShowPretty && <div style={css('font-size:12.5px;color:var(--muted);text-align:right;margin:6px 2px 0')}>{v.billAmountPretty}</div>}

      <div style={css('height:18px')}></div>
      <div style={css('font-size:13px;font-weight:600;color:var(--muted2);margin-bottom:8px')}>รอบการจ่าย</div>
      <div style={css('display:flex;background:var(--fill2);border-radius:13px;padding:4px;gap:3px;margin-bottom:18px')}>
        <button onClick={v.billCycleM} style={css(v.billCycleMStyle)}>ทุกเดือน</button>
        <button onClick={v.billCycleY} style={css(v.billCycleYStyle)}>ทุกปี</button>
      </div>

      <div style={css('font-size:13px;font-weight:600;color:var(--muted2);margin-bottom:8px')}>วันครบกำหนด</div>
      <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px')}>
        {v.billDayChoices.map((d, i) => <button key={i} onClick={d.onClick} style={css(d.style)}>{d.label}</button>)}
      </div>

      <div style={css('font-size:13px;font-weight:600;color:var(--muted2);margin-bottom:8px')}>เตือนล่วงหน้า</div>
      <div style={css('display:flex;gap:8px')}>
        {v.billRemindChoices.map((r, i) => <button key={i} onClick={r.onClick} style={css(r.style)}>{r.label}</button>)}
      </div>

      <div style={css('flex:1;min-height:24px')}></div>
      <button onClick={v.saveBill} style={css(v.billSaveStyle)}>{v.billSaveLabel}</button>
    </div>
  );
}
