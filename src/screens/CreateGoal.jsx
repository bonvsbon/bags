import { css } from '../lib/css.js';

export default function CreateGoal({ v }) {
  return (
    <div style={css('min-height:100%;display:flex;flex-direction:column;padding:6px 20px 24px')}>
      <div style={css('display:flex;align-items:center;gap:12px;margin:6px 0 20px')}>
        <button onClick={v.goGoals} style={css('flex:none;width:40px;height:40px;border-radius:12px;background:var(--card);border:1px solid var(--border);font-size:18px;color:var(--muted2);display:flex;align-items:center;justify-content:center')}>‹</button>
        <div style={css('font-size:19px;font-weight:700;white-space:nowrap')}>สร้างเป้าหมาย</div>
      </div>

      <div style={css('font-size:13px;font-weight:600;color:var(--muted2);margin-bottom:10px')}>เลือกไอคอน</div>
      <div className="nl-scroll" style={css('display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;margin-bottom:20px')}>
        {v.goalIconChoices.map((i, idx) => <button key={idx} onClick={i.onClick} style={css(i.style)}>{i.icon}</button>)}
      </div>

      <div style={css('font-size:13px;font-weight:600;color:var(--muted2);margin-bottom:8px')}>ชื่อเป้าหมาย</div>
      <input value={v.goalName} onChange={v.onGoalName} placeholder="เช่น เงินฉุกเฉิน, ดาวน์รถ" style={css('height:50px;border:1px solid var(--border);border-radius:13px;padding:0 15px;font-size:15px;font-family:inherit;background:var(--card);color:var(--text);outline:none;margin-bottom:18px')} />

      <div style={css('font-size:13px;font-weight:600;color:var(--muted2);margin-bottom:8px')}>จำนวนเงินเป้าหมาย</div>
      <div style={css('display:flex;align-items:center;background:var(--card);border:1px solid var(--border);border-radius:13px;padding:0 15px')}>
        <span style={css('font-size:22px;color:#bdbfb5;font-weight:600')}>฿</span>
        <input value={v.goalTargetDisplay} onChange={v.onGoalTarget} inputMode="numeric" placeholder="0" style={css('flex:1;min-width:0;height:54px;border:none;background:transparent;font-size:26px;font-weight:700;font-family:inherit;color:var(--text);outline:none;text-align:right;letter-spacing:-0.01em')} />
      </div>
      {v.goalShowTargetPretty && <div style={css('font-size:12.5px;color:var(--muted);text-align:right;margin:6px 2px 0')}>{v.goalTargetPretty}</div>}

      <div style={css('height:18px')}></div>
      <div style={css('font-size:13px;font-weight:600;color:var(--muted2);margin-bottom:8px')}>ตั้งใจเก็บเดือนละ</div>
      <div style={css('display:flex;align-items:center;background:var(--card);border:1px solid var(--border);border-radius:13px;padding:0 15px')}>
        <span style={css('font-size:18px;color:#bdbfb5;font-weight:600')}>฿</span>
        <input value={v.goalMonthlyDisplay} onChange={v.onGoalMonthly} inputMode="numeric" placeholder="5000" style={css('flex:1;min-width:0;height:50px;border:none;background:transparent;font-size:20px;font-weight:700;font-family:inherit;color:var(--text);outline:none;text-align:right')} />
      </div>
      {v.goalShowMonthlyPretty && <div style={css('font-size:12.5px;color:var(--muted);text-align:right;margin:6px 2px 0')}>{v.goalMonthlyPretty}</div>}

      {v.goalHasEta && (
        <div style={css('margin-top:12px;background:#eef7f1;border:1px solid #d6e9dd;border-radius:13px;padding:13px 15px;display:flex;align-items:center;gap:10px')}>
          <span style={css('width:26px;height:26px;border-radius:8px;background:#2f7d5b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;flex:none')}>📅</span>
          <span style={css('font-size:13.5px;color:#3a4d42')}>เก็บแบบนี้จะถึงเป้าในประมาณ <b>{v.goalEtaMonths} เดือน</b></span>
        </div>
      )}

      <div style={css('flex:1;min-height:24px')}></div>
      <button onClick={v.saveGoal} style={css(v.goalSaveStyle)}>สร้างเป้าหมาย</button>
    </div>
  );
}
