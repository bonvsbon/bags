import { useEffect, useRef, useState } from 'react';
import { css } from '../lib/css.js';
import { api } from '../api/client.js';
import { baht, ErrState, MoneyInput } from './screens.jsx';

const card = 'background:var(--card);border:1px solid var(--border);border-radius:16px';

function useLoad(fn, deps = []) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setErr('');
    setData(null);
    fn().then((d) => alive && setData(d)).catch((e) => alive && setErr(e.detail || e.message || 'เกิดข้อผิดพลาด'));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return [data, err, () => setTick((t) => t + 1)];
}

const Loading = () => (
  <div style={css('padding:60px 0;text-align:center;color:var(--muted);font-size:14px')}>กำลังโหลด…</div>
);

const fieldLabel = 'font-size:13px;font-weight:600;color:var(--muted2);margin-bottom:8px';
const moneyBox = 'display:flex;align-items:center;background:var(--card);border:1px solid var(--border);border-radius:13px;padding:0 15px';

function IconPicker({ icons, value, onPick }) {
  return (
    <div className="nl-scroll" style={css('display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;margin-bottom:20px')}>
      {icons.map((ic) => (
        <button key={ic} onClick={() => onPick(ic)} style={css('flex:none;width:50px;height:50px;border-radius:14px;font-size:22px;display:flex;align-items:center;justify-content:center;' + (value === ic ? 'background:#e8f1ec;border:2px solid #2f7d5b' : 'background:var(--card);border:1px solid var(--border)'))}>{ic}</button>
      ))}
    </div>
  );
}

// ---------- Create / Edit Bill ----------
const BILL_ICONS = ['🏠', '🚗', '💳', '📶', '🛡️', '💡', '📺', '🏥', '📱', '💧', '🎓', '🔌'];
const DAY_CHOICES = [1, 5, 10, 15, 20, 25, 28, 0];

export function LiveCreateBill({ back, toast, editing }) {
  const [icon, setIcon] = useState(editing?.icon || '🏠');
  const [name, setName] = useState(editing?.name || '');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [cycle, setCycle] = useState(editing?.recurrence || 'monthly');
  const [day, setDay] = useState(editing?.due_day ?? 1);
  const [remind, setRemind] = useState(editing?.remind_days ?? 3);
  const [busy, setBusy] = useState(false);

  const valid = name.trim() && Number(amount) > 0;
  async function save() {
    if (!valid) return;
    setBusy(true);
    const payload = { name: name.trim(), amount: Number(amount), icon, recurrence: cycle, due_day: day, remind_days: remind };
    try {
      if (editing) await api.patchBill(editing.id, payload);
      else await api.createBill(payload);
      toast(editing ? 'บันทึกการแก้ไขแล้ว' : 'บันทึกบิลแล้ว');
      back();
    } catch (e) {
      toast(e.detail || 'บันทึกไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  const seg = (active) => 'flex:1;height:42px;border-radius:10px;font-size:14px;font-weight:600;' + (active ? 'background:var(--card);color:#2f7d5b;box-shadow:0 1px 2px rgba(0,0,0,.06)' : 'background:transparent;color:var(--muted2)');
  const chip = (active) => 'height:42px;border-radius:11px;font-size:13.5px;font-weight:600;' + (active ? 'background:#2f7d5b;color:#fff' : 'background:var(--card);border:1px solid var(--border);color:var(--text)');

  return (
    <div style={css('min-height:100%;display:flex;flex-direction:column;padding:6px 20px 24px;animation:nlSwap .26s ease')}>
      <div style={css('display:flex;align-items:center;gap:12px;margin:6px 0 20px')}>
        <button onClick={back} style={css('flex:none;width:40px;height:40px;border-radius:12px;background:var(--card);border:1px solid var(--border);font-size:18px;color:var(--muted2);display:flex;align-items:center;justify-content:center')}>‹</button>
        <div style={css('font-size:19px;font-weight:700')}>{editing ? 'แก้ไขบิล' : 'เพิ่มบิลประจำ'}</div>
      </div>

      <div style={css(fieldLabel)}>เลือกไอคอน</div>
      <IconPicker icons={BILL_ICONS} value={icon} onPick={setIcon} />

      <div style={css(fieldLabel)}>ชื่อบิล</div>
      <input defaultValue={editing?.name || ''} onChange={(e) => setName(e.target.value)} placeholder="เช่น ค่าน้ำ, ประกันรถ" style={css('height:50px;border:1px solid var(--border);border-radius:13px;padding:0 15px;font-size:15px;background:var(--card);color:var(--text);outline:none;margin-bottom:18px')} />

      <div style={css(fieldLabel)}>จำนวนเงิน</div>
      <div style={css(moneyBox)}>
        <span style={css('font-size:22px;color:#bdbfb5;font-weight:600')}>฿</span>
        <MoneyInput defaultValue={editing ? String(editing.amount) : ''} onValue={setAmount} placeholder="0" style={css('flex:1;min-width:0;height:54px;border:none;background:transparent;font-size:26px;font-weight:700;color:var(--text);outline:none;text-align:right')} />
      </div>

      <div style={css('height:18px')}></div>
      <div style={css(fieldLabel)}>รอบการจ่าย</div>
      <div style={css('display:flex;background:var(--fill2);border-radius:13px;padding:4px;gap:3px;margin-bottom:18px')}>
        <button onClick={() => setCycle('monthly')} style={css(seg(cycle === 'monthly'))}>ทุกเดือน</button>
        <button onClick={() => setCycle('yearly')} style={css(seg(cycle === 'yearly'))}>ทุกปี</button>
      </div>

      <div style={css(fieldLabel)}>วันครบกำหนด</div>
      <div style={css('display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:18px')}>
        {DAY_CHOICES.map((d) => (
          <button key={d} onClick={() => setDay(d)} style={css(chip(day === d))}>{d === 0 ? 'สิ้นเดือน' : 'วันที่ ' + d}</button>
        ))}
      </div>

      <div style={css(fieldLabel)}>เตือนล่วงหน้า</div>
      <div style={css('display:flex;gap:8px')}>
        {[1, 3, 7].map((r) => (
          <button key={r} onClick={() => setRemind(r)} style={css('flex:1;' + chip(remind === r))}>ก่อน {r} วัน</button>
        ))}
      </div>

      <div style={css('flex:1;min-height:24px')}></div>
      <button disabled={!valid || busy} onClick={save} style={css('width:100%;height:54px;border-radius:15px;font-size:16px;font-weight:600;' + (valid ? 'background:#2f7d5b;color:#fff;box-shadow:0 6px 16px -4px rgba(47,125,91,0.5)' : 'background:var(--track);color:var(--muted)'))}>{editing ? 'บันทึกการแก้ไข' : 'บันทึกบิล'}</button>
    </div>
  );
}

// ---------- Create Goal ----------
const GOAL_ICONS = ['🎯', '✈️', '🏠', '🚗', '💍', '🎓', '📱', '🏖️', '💰', '🎁', '🐶', '🚑'];

export function LiveCreateGoal({ back, toast, editing }) {
  const [icon, setIcon] = useState(editing?.icon || '🎯');
  const [name, setName] = useState(editing?.name || '');
  const [target, setTarget] = useState(editing ? String(editing.target_amount) : '');
  const [monthly, setMonthly] = useState(editing ? String(editing.monthly_contribution || '') : '5000');
  const [busy, setBusy] = useState(false);

  const valid = name.trim() && Number(target) > 0;
  const eta = Number(monthly) > 0 && Number(target) > 0 ? Math.ceil(Number(target) / Number(monthly)) : 0;

  async function save() {
    if (!valid) return;
    setBusy(true);
    const payload = { name: name.trim(), target_amount: Number(target), monthly_contribution: Number(monthly) || null, icon, icon_bg: '#e8f1ec' };
    try {
      if (editing) await api.patchGoal(editing.id, payload);
      else await api.createGoal({ ...payload, saved_amount: 0 });
      toast(editing ? 'บันทึกการแก้ไขแล้ว' : 'สร้างเป้าหมายแล้ว');
      back();
    } catch (e) {
      toast(e.detail || 'บันทึกไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={css('min-height:100%;display:flex;flex-direction:column;padding:6px 20px 24px;animation:nlSwap .26s ease')}>
      <div style={css('display:flex;align-items:center;gap:12px;margin:6px 0 20px')}>
        <button onClick={back} style={css('flex:none;width:40px;height:40px;border-radius:12px;background:var(--card);border:1px solid var(--border);font-size:18px;color:var(--muted2);display:flex;align-items:center;justify-content:center')}>‹</button>
        <div style={css('font-size:19px;font-weight:700')}>{editing ? 'แก้ไขเป้าหมาย' : 'สร้างเป้าหมาย'}</div>
      </div>

      <div style={css(fieldLabel)}>เลือกไอคอน</div>
      <IconPicker icons={GOAL_ICONS} value={icon} onPick={setIcon} />

      <div style={css(fieldLabel)}>ชื่อเป้าหมาย</div>
      <input defaultValue={editing?.name || ''} onChange={(e) => setName(e.target.value)} placeholder="เช่น เงินฉุกเฉิน, ดาวน์รถ" style={css('height:50px;border:1px solid var(--border);border-radius:13px;padding:0 15px;font-size:15px;background:var(--card);color:var(--text);outline:none;margin-bottom:18px')} />

      <div style={css(fieldLabel)}>จำนวนเงินเป้าหมาย</div>
      <div style={css(moneyBox)}>
        <span style={css('font-size:22px;color:#bdbfb5;font-weight:600')}>฿</span>
        <MoneyInput defaultValue={editing ? String(editing.target_amount) : ''} onValue={setTarget} placeholder="0" style={css('flex:1;min-width:0;height:54px;border:none;background:transparent;font-size:26px;font-weight:700;color:var(--text);outline:none;text-align:right')} />
      </div>

      <div style={css('height:18px')}></div>
      <div style={css(fieldLabel)}>ตั้งใจเก็บเดือนละ</div>
      <div style={css(moneyBox)}>
        <span style={css('font-size:18px;color:#bdbfb5;font-weight:600')}>฿</span>
        <MoneyInput defaultValue={editing ? String(editing.monthly_contribution || '') : '5000'} onValue={setMonthly} placeholder="5000" style={css('flex:1;min-width:0;height:50px;border:none;background:transparent;font-size:20px;font-weight:700;color:var(--text);outline:none;text-align:right')} />
      </div>

      {eta > 0 && (
        <div style={css('margin-top:12px;background:#eef7f1;border:1px solid #d6e9dd;border-radius:13px;padding:13px 15px;display:flex;align-items:center;gap:10px')}>
          <span style={css('width:26px;height:26px;border-radius:8px;background:#2f7d5b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;flex:none')}>📅</span>
          <span style={css('font-size:13.5px;color:#3a4d42')}>เก็บแบบนี้จะถึงเป้าในประมาณ <b>{eta} เดือน</b></span>
        </div>
      )}

      <div style={css('flex:1;min-height:24px')}></div>
      <button disabled={!valid || busy} onClick={save} style={css('width:100%;height:54px;border-radius:15px;font-size:16px;font-weight:600;' + (valid ? 'background:#2f7d5b;color:#fff;box-shadow:0 6px 16px -4px rgba(47,125,91,0.5)' : 'background:var(--track);color:var(--muted)'))}>{editing ? 'บันทึกการแก้ไข' : 'สร้างเป้าหมาย'}</button>
    </div>
  );
}

// ---------- Plan ----------
export function LivePlan() {
  const [d, err, reload] = useLoad(() => api.summaryPlan());
  if (err) return <ErrState msg={err} onRetry={reload} />;
  if (!d) return <Loading />;
  return (
    <div style={css('padding:6px 20px 24px;animation:nlSwap .26s ease')}>
      <div style={css('margin:8px 0 18px')}>
        <div style={css('font-size:21px;font-weight:700')}>แผนเงินเดือนนี้</div>
        <div style={css('font-size:13px;color:var(--muted);margin-top:2px')}>เหลืออีก {d.days_until_payday} วันก่อนเงินเดือนออก</div>
      </div>

      <div style={css('background:#2f7d5b;border-radius:20px;padding:22px;color:#fff;box-shadow:0 10px 28px -12px rgba(47,125,91,0.5)')}>
        <div style={css('font-size:13px;opacity:0.85')}>เดือนนี้คุณยังใช้ได้อีก</div>
        <div style={css('font-size:44px;font-weight:800;letter-spacing:-0.03em;margin-top:4px')}>{baht(d.available)}</div>
      </div>

      <div style={css(card + ';padding:18px;margin-top:12px;display:flex;align-items:center;gap:16px')}>
        <div style={css('width:52px;height:52px;border-radius:15px;background:#e8f1ec;display:flex;flex-direction:column;align-items:center;justify-content:center;flex:none;color:#2f7d5b')}><span style={css('font-size:18px;font-weight:800;line-height:1')}>{d.days_until_payday}</span><span style={css('font-size:9px')}>วัน</span></div>
        <div>
          <div style={css('font-size:13.5px;color:var(--muted)')}>ถ้าอยากให้เงินพอถึงวันเงินเดือนออก</div>
          <div style={css('font-size:16px;font-weight:700;margin-top:3px')}>ใช้ได้ประมาณวันละ <span style={css('color:#2f7d5b')}>{baht(d.daily_allowance)}</span></div>
        </div>
      </div>

      <div style={css('margin:24px 0 12px;font-size:15px;font-weight:700')}>งบแต่ละหมวด</div>
      {d.budgets.length === 0 && <div style={css(card + ';padding:18px;text-align:center;color:var(--muted);font-size:13px')}>ยังไม่ได้ตั้งงบรายหมวด</div>}
      <div style={css('display:flex;flex-direction:column;gap:12px')}>
        {d.budgets.map((c, i) => {
          const pct = Math.min(c.ratio * 100, 100);
          const barColor = c.ratio >= 1 ? '#d9776a' : c.over ? '#e0a73c' : '#2f7d5b';
          return (
            <div key={i} style={css(card + ';padding:16px')}>
              <div style={css('display:flex;justify-content:space-between;align-items:center;margin-bottom:4px')}>
                <div style={css('display:flex;align-items:center;gap:9px')}><span style={css('font-size:17px')}>{c.icon}</span><span style={css('font-size:14.5px;font-weight:600')}>{c.category}</span></div>
                {c.over && <span style={css('font-size:11px;font-weight:600;color:var(--warn-ink);background:var(--warn-bg);padding:3px 9px;border-radius:7px')}>{c.ratio >= 1 ? 'เกินงบ' : 'ใกล้ถึงงบ'}</span>}
              </div>
              <div style={css('height:9px;border-radius:6px;background:var(--track);margin:10px 0 8px;overflow:hidden')}><div style={css('height:100%;width:' + pct + '%;background:' + barColor)}></div></div>
              <div style={css('display:flex;justify-content:space-between;font-size:12.5px')}><span style={css('color:var(--muted)')}>ใช้ไป {baht(c.used)} จาก {baht(c.limit)}</span><span style={css('font-weight:600;color:' + (c.limit - c.used < 0 ? '#d9776a' : '#2f7d5b'))}>เหลือ {baht(c.limit - c.used)}</span></div>
            </div>
          );
        })}
      </div>

      <div style={css('background:var(--good-bg);border:1px solid var(--good-line);border-radius:16px;padding:18px;margin-top:18px')}>
        <div style={css('display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:var(--good-ink);margin-bottom:8px')}><span style={css('width:22px;height:22px;border-radius:7px;background:#2f7d5b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px')}>✦</span>คำแนะนำเล็ก ๆ</div>
        <div style={css('font-size:14px;line-height:1.6;color:var(--good-ink)')}>{d.tip}</div>
      </div>
    </div>
  );
}

// ---------- Transactions ----------
export function LiveTransactions({ go }) {
  const [type, setType] = useState(null);
  const [cats] = useLoad(() => api.listCategories());
  const [groups, err, reload] = useLoad(() => api.listTransactions({ group_by: 'day', ...(type ? { type } : {}) }), [type]);
  const catMap = {};
  (cats || []).forEach((c) => { catMap[c.id] = c; });

  const fmtDate = (s) => {
    try { return new Date(s).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }); } catch { return s; }
  };
  const filters = [[null, 'ทั้งหมด'], ['expense', 'รายจ่าย'], ['income', 'รายรับ']];

  return (
    <div style={css('padding:6px 20px 24px;animation:nlSwap .26s ease')}>
      <div style={css('font-size:21px;font-weight:700;margin:8px 0 16px')}>รายการ</div>
      <div className="nl-scroll" style={css('display:flex;gap:8px;overflow-x:auto;margin-bottom:18px;padding-bottom:2px')}>
        {filters.map(([t, l]) => (
          <button key={l} onClick={() => setType(t)} style={css('flex:none;padding:8px 16px;border-radius:11px;font-size:13px;font-weight:500;' + (type === t ? 'background:#2f7d5b;color:#fff' : 'background:var(--card);border:1px solid var(--border);color:var(--text)'))}>{l}</button>
        ))}
      </div>

      {err && <ErrState msg={err} onRetry={reload} />}
      {!groups && !err && <Loading />}
      {groups && groups.length === 0 && (
        <div style={css('display:flex;flex-direction:column;align-items:center;text-align:center;padding:60px 30px')}>
          <div style={css('width:76px;height:76px;border-radius:24px;background:var(--track);display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:20px')}>🧾</div>
          <div style={css('font-size:17px;font-weight:700;margin-bottom:8px')}>ยังไม่มีรายการ</div>
          <div style={css('font-size:14px;color:var(--muted);line-height:1.5;margin-bottom:24px')}>เริ่มบันทึกรายจ่ายแรกของคุณได้เลย</div>
          <button onClick={() => go('add')} style={css('height:48px;padding:0 26px;border-radius:14px;background:#2f7d5b;color:#fff;font-size:15px;font-weight:600')}>+ เพิ่มรายการแรก</button>
        </div>
      )}
      {groups && groups.length > 0 && (
        <div style={css('display:flex;flex-direction:column;gap:20px')}>
          {groups.map((grp, gi) => {
            const net = grp.items.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
            return (
              <div key={gi}>
                <div style={css('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:9px;padding:0 2px')}>
                  <span style={css('font-size:13px;font-weight:600;color:var(--muted2)')}>{fmtDate(grp.date)}</span>
                  <span style={css('font-size:12px;color:#aeb0a6')}>{net >= 0 ? '+' : '−'}{baht(Math.abs(net))}</span>
                </div>
                <div style={css(card + ';overflow:hidden')}>
                  {grp.items.map((t, i) => {
                    const c = t.category_id ? catMap[t.category_id] : null;
                    return (
                      <div key={i} style={css('display:flex;align-items:center;gap:13px;padding:14px 16px' + (i < grp.items.length - 1 ? ';border-bottom:1px solid var(--divider)' : ''))}>
                        <div style={css('width:38px;height:38px;border-radius:11px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:16px')}>{(c && c.icon) || (t.type === 'income' ? '💰' : '•')}</div>
                        <div style={css('flex:1')}>
                          <div style={css('font-size:14.5px;font-weight:600')}>{(c && c.name) || (t.type === 'income' ? 'รายรับ' : 'รายการ')}</div>
                          <div style={css('font-size:12px;color:var(--muted);margin-top:1px')}>{t.note || ''}</div>
                        </div>
                        <div style={css('font-size:15px;font-weight:700;color:' + (t.type === 'income' ? '#3f9d6b' : 'var(--text)'))}>{t.type === 'income' ? '+' : '−'}{baht(t.amount)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Accounts ----------
export function LiveAccounts() {
  const [accts, err, reload] = useLoad(() => api.listAccounts());
  if (err) return <ErrState msg={err} onRetry={reload} />;
  if (!accts) return <Loading />;
  const assets = accts.filter((a) => a.type === 'asset');
  const debts = accts.filter((a) => a.type === 'debt');
  const total = assets.reduce((s, a) => s + a.balance, 0);

  return (
    <div style={css('padding:6px 20px 24px;animation:nlSwap .26s ease')}>
      <div style={css('margin:8px 0 18px;font-size:21px;font-weight:700')}>บัญชีของฉัน</div>

      <div style={css(card + ';border-radius:18px;padding:18px;margin-bottom:18px')}>
        <div style={css('font-size:13px;color:var(--muted)')}>เงินที่มีรวมทั้งหมด</div>
        <div style={css('font-size:34px;font-weight:800;letter-spacing:-0.02em;margin-top:4px')}>{baht(total)}</div>
      </div>

      <div style={css('font-size:13px;font-weight:700;color:var(--muted2);margin:0 0 10px 2px')}>เงินที่มี</div>
      <div style={css(card + ';overflow:hidden;margin-bottom:20px')}>
        {assets.map((a, i) => (
          <div key={a.id} style={css('display:flex;align-items:center;gap:13px;padding:15px 16px' + (i < assets.length - 1 ? ';border-bottom:1px solid var(--divider)' : ''))}>
            <div style={css('width:40px;height:40px;border-radius:12px;background:#e8f1ec;display:flex;align-items:center;justify-content:center;font-size:17px')}>{a.icon || '🏦'}</div>
            <div style={css('flex:1;font-size:14.5px;font-weight:600')}>{a.name}</div>
            <div style={css('font-size:15px;font-weight:700')}>{baht(a.balance)}</div>
          </div>
        ))}
        {assets.length === 0 && <div style={css('padding:18px;text-align:center;color:var(--muted);font-size:13px')}>ยังไม่มีบัญชี</div>}
      </div>

      {debts.length > 0 && (
        <>
          <div style={css('font-size:13px;font-weight:700;color:var(--muted2);margin:0 0 10px 2px')}>ยอดที่ต้องจ่าย</div>
          <div style={css(card + ';overflow:hidden')}>
            {debts.map((d, i) => (
              <div key={d.id} style={css('display:flex;align-items:center;gap:13px;padding:15px 16px' + (i < debts.length - 1 ? ';border-bottom:1px solid var(--divider)' : ''))}>
                <div style={css('width:40px;height:40px;border-radius:12px;background:#fbecea;display:flex;align-items:center;justify-content:center;font-size:17px')}>{d.icon || '💳'}</div>
                <div style={css('flex:1')}><div style={css('font-size:14.5px;font-weight:600')}>{d.name}</div>{d.note && <div style={css('font-size:11.5px;color:var(--muted);margin-top:1px')}>{d.note}</div>}</div>
                <div style={css('font-size:15px;font-weight:700;color:#d9776a')}>{baht(d.balance)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Onboarding (4 steps, shown for new users) ----------
const PAY_DAYS = [1, 5, 10, 15, 20, 25, 28, 0];
const INCOME_PRESETS = [15000, 20000, 30000, 45000, 60000];
const RECURRING = [
  ['ค่าเช่า/ผ่อนบ้าน', '🏠', 8000, 1],
  ['ผ่อนรถ', '🚗', 6000, 5],
  ['ค่างวดบัตร', '💳', 3000, 25],
  ['เน็ต + มือถือ', '📶', 800, 15],
  ['ประกัน', '🛡️', 1500, 20],
  ['ค่าน้ำค่าไฟ', '💡', 1500, 28],
];
const GOALS = [
  ['leftover', '💰', 'มีเงินเหลือปลายเดือน'],
  ['save', '🎯', 'เก็บเงินให้ได้ตามเป้า'],
  ['debt', '✂️', 'ปลดหนี้ให้หมด'],
  ['control', '📊', 'คุมค่าใช้จ่าย'],
  ['invest', '📈', 'เริ่มลงทุน'],
];

export function LiveOnboarding({ onDone, toast }) {
  const [step, setStep] = useState(0);
  const [payDay, setPayDay] = useState(25);
  const [income, setIncome] = useState('');
  const incomeRef = useRef(null); // uncontrolled input; presets write to it directly
  const [picked, setPicked] = useState({}); // name -> amount string (selected = key present)
  const [goal, setGoal] = useState('leftover');
  const [busy, setBusy] = useState(false);

  const next = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => Math.max(0, s - 1));

  // Toggle a recurring expense. Selected = key present; the amount starts EMPTY
  // (the preset shows only as a placeholder hint) so the user types their own.
  function toggleRecurring(name) {
    setPicked((p) => {
      const nextP = { ...p };
      if (name in nextP) delete nextP[name];
      else nextP[name] = '';
      return nextP;
    });
  }

  async function finish() {
    setBusy(true);
    const recurring = RECURRING
      .filter(([n]) => n in picked && Number(picked[n]) > 0)
      .map(([name, icon, , due_day]) => ({ name, icon, amount: Number(picked[name]), due_day }));
    try {
      await api.onboarding({ pay_day: payDay, monthly_income: Number(income) || 0, recurring, primary_goal: goal });
      toast('ยินดีต้อนรับสู่เงินทอน 🎉');
      onDone();
    } catch (e) {
      toast(e.detail || 'เริ่มต้นไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  const chip = (active) => 'height:46px;border-radius:12px;font-size:14px;font-weight:600;' + (active ? 'background:#2f7d5b;color:#fff' : 'background:var(--card);border:1px solid var(--border);color:var(--text)');
  const primaryBtn = (on) => 'width:100%;height:54px;border-radius:15px;font-size:16px;font-weight:600;' + (on ? 'background:#2f7d5b;color:#fff;box-shadow:0 6px 16px -4px rgba(47,125,91,0.5)' : 'background:var(--track);color:var(--muted)');

  return (
    <div style={css('flex:1;min-height:0;display:flex;flex-direction:column;padding:8px 22px 22px;overflow-y:auto')}>
      {/* progress dots */}
      <div style={css('display:flex;gap:6px;margin:6px 0 22px')}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={css('flex:1;height:4px;border-radius:2px;background:' + (i <= step ? '#2f7d5b' : 'var(--track)'))}></div>
        ))}
      </div>

      {step === 0 && (
        <>
          <div style={css('font-size:22px;font-weight:800;letter-spacing:-0.01em')}>เงินเดือนออกวันไหน</div>
          <div style={css('font-size:13.5px;color:var(--muted);margin:6px 0 22px')}>เราจะคำนวณว่าเงินต้องใช้ถึงวันไหน</div>
          <div style={css('display:grid;grid-template-columns:repeat(4,1fr);gap:10px')}>
            {PAY_DAYS.map((d) => (
              <button key={d} onClick={() => setPayDay(d)} style={css(chip(payDay === d))}>{d === 0 ? 'สิ้นเดือน' : 'วันที่ ' + d}</button>
            ))}
          </div>
          <div style={css('flex:1;min-height:24px')}></div>
          <button onClick={next} style={css(primaryBtn(true))}>ถัดไป</button>
        </>
      )}

      {step === 1 && (
        <>
          <div style={css('font-size:22px;font-weight:800')}>รายได้ต่อเดือนประมาณเท่าไร</div>
          <div style={css('font-size:13.5px;color:var(--muted);margin:6px 0 22px')}>ใส่คร่าว ๆ ก็ได้ ปรับทีหลังได้</div>
          <div style={css('display:flex;align-items:center;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:0 16px;margin-bottom:16px')}>
            <span style={css('font-size:24px;color:#bdbfb5;font-weight:600')}>฿</span>
            <MoneyInput inputRef={incomeRef} defaultValue={income} onValue={setIncome} placeholder="0" style={css('flex:1;min-width:0;height:60px;border:none;background:transparent;font-size:30px;font-weight:800;color:var(--text);outline:none;text-align:right')} />
          </div>
          <div style={css('display:flex;flex-wrap:wrap;gap:8px')}>
            {INCOME_PRESETS.map((p) => (
              <button key={p} onClick={() => { setIncome(String(p)); if (incomeRef.current) incomeRef.current.value = p.toLocaleString('en-US'); }} style={css('padding:8px 14px;border-radius:10px;font-size:13px;background:var(--card);border:1px solid var(--border);color:var(--text)')}>{baht(p)}</button>
            ))}
          </div>
          <div style={css('flex:1;min-height:24px')}></div>
          <div style={css('display:flex;gap:10px')}>
            <button onClick={prevStep} style={css('flex:none;padding:0 22px;height:54px;border-radius:15px;background:var(--fill2);color:var(--muted2);font-size:15px;font-weight:600')}>ย้อนกลับ</button>
            <button onClick={() => Number(income) > 0 && next()} style={css('flex:1;' + primaryBtn(Number(income) > 0))}>ถัดไป</button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div style={css('font-size:22px;font-weight:800')}>มีค่าใช้จ่ายประจำอะไรบ้าง</div>
          <div style={css('font-size:13.5px;color:var(--muted);margin:6px 0 20px')}>เลือกที่มี แล้วใส่จำนวนจริงของคุณได้เลย (ยอดที่ขึ้นเป็นแค่ตัวอย่าง)</div>
          <div style={css('display:flex;flex-direction:column;gap:10px')}>
            {RECURRING.map(([name, icon, preset]) => {
              const on = name in picked;
              return (
                <div key={name} style={css('border-radius:14px;overflow:hidden;' + (on ? 'background:#e8f1ec;border:1.5px solid #2f7d5b' : 'background:var(--card);border:1px solid var(--border)'))}>
                  <button onClick={() => toggleRecurring(name)} style={css('width:100%;display:flex;align-items:center;gap:13px;padding:14px;text-align:left;background:transparent')}>
                    <span style={css('font-size:20px')}>{icon}</span>
                    <div style={css('flex:1')}>
                      <div style={css('font-size:14.5px;font-weight:600')}>{name}</div>
                      {!on && <div style={css('font-size:12px;color:var(--muted)')}>เช่น {baht(preset)}/เดือน</div>}
                    </div>
                    <span style={css('width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;' + (on ? 'background:#2f7d5b;color:#fff' : 'border:1.5px solid #d6d3c9;color:transparent'))}>✓</span>
                  </button>
                  {on && (
                    <div style={css('display:flex;align-items:center;gap:8px;padding:0 14px 14px')}>
                      <span style={css('font-size:13px;color:#3a4d42;font-weight:600')}>จำนวนจริง</span>
                      <div style={css('flex:1;display:flex;align-items:center;background:var(--card);border:1px solid var(--border);border-radius:11px;padding:0 12px')}>
                        <span style={css('font-size:16px;color:#bdbfb5;font-weight:600')}>฿</span>
                        <MoneyInput defaultValue="" onValue={(v) => setPicked((p) => ({ ...p, [name]: v }))} placeholder={'เช่น ' + preset.toLocaleString('en-US')} style={css('flex:1;min-width:0;height:44px;border:none;background:transparent;font-size:18px;font-weight:700;color:var(--text);outline:none;text-align:right')} />
                        <span style={css('font-size:12px;color:var(--muted);margin-left:6px')}>/เดือน</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={css('flex:1;min-height:24px')}></div>
          <div style={css('display:flex;gap:10px')}>
            <button onClick={prevStep} style={css('flex:none;padding:0 22px;height:54px;border-radius:15px;background:var(--fill2);color:var(--muted2);font-size:15px;font-weight:600')}>ย้อนกลับ</button>
            <button onClick={next} style={css('flex:1;' + primaryBtn(true))}>ถัดไป</button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div style={css('font-size:22px;font-weight:800')}>เป้าหมายหลักของคุณ</div>
          <div style={css('font-size:13.5px;color:var(--muted);margin:6px 0 20px')}>เราจะช่วยโฟกัสให้ตรงเป้า</div>
          <div style={css('display:flex;flex-direction:column;gap:10px')}>
            {GOALS.map(([key, icon, label]) => {
              const on = goal === key;
              return (
                <button key={key} onClick={() => setGoal(key)} style={css('display:flex;align-items:center;gap:13px;padding:15px;border-radius:14px;text-align:left;' + (on ? 'background:#e8f1ec;border:1.5px solid #2f7d5b' : 'background:var(--card);border:1px solid var(--border)'))}>
                  <span style={css('font-size:20px')}>{icon}</span>
                  <span style={css('flex:1;font-size:14.5px;font-weight:600')}>{label}</span>
                  <span style={css('width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;' + (on ? 'background:#2f7d5b;color:#fff' : 'border:1.5px solid #d6d3c9;color:transparent'))}>✓</span>
                </button>
              );
            })}
          </div>
          <div style={css('flex:1;min-height:24px')}></div>
          <div style={css('display:flex;gap:10px')}>
            <button onClick={prevStep} style={css('flex:none;padding:0 22px;height:54px;border-radius:15px;background:var(--fill2);color:var(--muted2);font-size:15px;font-weight:600')}>ย้อนกลับ</button>
            <button disabled={busy} onClick={finish} style={css('flex:1;' + primaryBtn(true))}>เริ่มใช้งาน</button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------- More (hub) ----------
export function LiveMore({ go, name }) {
  const MENU = [
    ['bills', '🧾', 'บิลและรายจ่ายประจำ', 'ดูและจัดการบิลทั้งหมด'],
    ['goals', '🎯', 'เป้าหมายการเงิน', 'ออมเงินให้ถึงเป้า'],
    ['accounts', '🏦', 'บัญชีของฉัน', 'เงินที่มีและหนี้สิน'],
    ['settings', '⚙️', 'ตั้งค่า', 'ธีม การแจ้งเตือน โปรไฟล์'],
  ];
  return (
    <div style={css('padding:6px 20px 24px;animation:nlSwap .26s ease')}>
      <div style={css('margin:8px 0 18px;font-size:21px;font-weight:700')}>เพิ่มเติม</div>
      <button onClick={() => go('settings')} style={css('width:100%;text-align:left;' + card + ';border-radius:18px;padding:18px;display:flex;align-items:center;gap:14px;margin-bottom:18px')}>
        <div style={css('width:52px;height:52px;border-radius:50%;background:#e8f1ec;border:1px solid #d6e6dd;display:flex;align-items:center;justify-content:center;color:#2f7d5b;font-weight:700;font-size:19px')}>{(name || 'คุณ').charAt(0)}</div>
        <div style={css('flex:1')}>
          <div style={css('font-size:16px;font-weight:700')}>{name || 'ผู้ใช้เงินทอน'}</div>
          <div style={css('font-size:12.5px;color:var(--muted);margin-top:1px')}>แตะเพื่อแก้ไขโปรไฟล์</div>
        </div>
        <span style={css('font-size:18px;color:#c4c6bc')}>›</span>
      </button>
      <div style={css(card + ';border-radius:18px;overflow:hidden')}>
        {MENU.map(([s, icon, label, sub], i) => (
          <button key={s} onClick={() => go(s)} style={css('width:100%;text-align:left;display:flex;align-items:center;gap:14px;padding:16px;background:transparent' + (i < MENU.length - 1 ? ';border-bottom:1px solid var(--divider)' : ''))}>
            <div style={css('width:40px;height:40px;border-radius:12px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:18px')}>{icon}</div>
            <div style={css('flex:1')}>
              <div style={css('font-size:14.5px;font-weight:600')}>{label}</div>
              <div style={css('font-size:12px;color:var(--muted);margin-top:1px')}>{sub}</div>
            </div>
            <span style={css('font-size:17px;color:#c4c6bc')}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
