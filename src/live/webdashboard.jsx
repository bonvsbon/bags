import { useEffect, useState } from 'react';
import { css } from '../lib/css.js';
import { api } from '../api/client.js';
import { baht, ErrState } from './screens.jsx';

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

const card = 'background:var(--card);border:1px solid var(--border);border-radius:18px';
const Loading = () => <div style={css('padding:60px;color:var(--muted)')}>กำลังโหลด…</div>;

function H({ title, sub }) {
  return (
    <div style={css('margin-bottom:22px')}>
      <div style={css('font-size:26px;font-weight:800;letter-spacing:-0.01em')}>{title}</div>
      {sub && <div style={css('font-size:14px;color:var(--muted);margin-top:4px')}>{sub}</div>}
    </div>
  );
}

function WeeklyBars({ bars }) {
  const max = Math.max(...bars.map((b) => b.amount), 1);
  return (
    <div style={css('display:flex;align-items:flex-end;gap:14px;height:140px;padding-top:10px')}>
      {bars.map((b, i) => (
        <div key={i} style={css('flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;height:100%;justify-content:flex-end')}>
          <div style={css('font-size:11px;color:var(--muted)')}>{baht(b.amount)}</div>
          <div style={css('width:100%;max-width:48px;border-radius:8px 8px 0 0;background:#2f7d5b;height:' + Math.max((b.amount / max) * 100, 3) + '%')}></div>
          <div style={css('font-size:11px;color:var(--muted2)')}>{b.week_start.slice(5)}</div>
        </div>
      ))}
    </div>
  );
}

function Overview() {
  const [d, err, reload] = useLoad(() => api.summaryDashboard());
  if (err) return <ErrState msg={err} onRetry={reload} />;
  if (!d) return <Loading />;
  const kpis = [
    ['เงินที่ใช้ได้จริง', baht(d.available), '#2f7d5b'],
    ['เงินในบัญชีทั้งหมด', baht(d.total_balance), 'var(--text)'],
    ['เดือนนี้เข้า', baht(d.month_in), '#3f9d6b'],
    ['เดือนนี้ออก', baht(d.month_out), '#c98a3c'],
  ];
  return (
    <>
      <H title="ภาพรวม" sub="สรุปการเงินเดือนนี้" />
      <div style={css('display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px')}>
        {kpis.map(([label, val, color]) => (
          <div key={label} style={css(card + ';padding:18px')}>
            <div style={css('font-size:13px;color:var(--muted)')}>{label}</div>
            <div style={css('font-size:26px;font-weight:800;margin-top:6px;color:' + color)}>{val}</div>
          </div>
        ))}
      </div>
      <div style={css('display:grid;grid-template-columns:1.4fr 1fr;gap:16px')}>
        <div style={css(card + ';padding:22px')}>
          <div style={css('font-size:15px;font-weight:700;margin-bottom:6px')}>รายจ่ายรายสัปดาห์</div>
          <WeeklyBars bars={d.weekly_bars} />
        </div>
        <div style={css(card + ';padding:22px')}>
          <div style={css('font-size:15px;font-weight:700;margin-bottom:14px')}>งบที่ต้องระวัง</div>
          {d.watch_budgets.length === 0 && <div style={css('font-size:13px;color:var(--muted)')}>ทุกงบยังอยู่ในแผน 👍</div>}
          {d.watch_budgets.map((b, i) => (
            <div key={i} style={css('margin-bottom:12px')}>
              <div style={css('display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px')}><span>{b.icon} {b.category}</span><span style={css('font-weight:600')}>{Math.round(b.ratio * 100)}%</span></div>
              <div style={css('height:8px;border-radius:5px;background:var(--track);overflow:hidden')}><div style={css('height:100%;width:' + Math.min(b.ratio * 100, 100) + '%;background:' + (b.ratio >= 1 ? '#d9776a' : '#e0a73c'))}></div></div>
            </div>
          ))}
          {d.goal && (
            <div style={css('margin-top:18px;padding-top:16px;border-top:1px solid var(--divider)')}>
              <div style={css('font-size:13px;color:var(--muted);margin-bottom:6px')}>เป้าหมาย</div>
              <div style={css('display:flex;align-items:center;gap:10px')}>
                <span style={css('font-size:22px')}>{d.goal.icon}</span>
                <div style={css('flex:1')}><div style={css('font-size:14px;font-weight:700')}>{d.goal.name}</div><div style={css('font-size:12px;color:var(--muted)')}>{baht(d.goal.saved)} / {baht(d.goal.target)}</div></div>
                <span style={css('font-size:15px;font-weight:800;color:#2f7d5b')}>{Math.round(d.goal.ratio * 100)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={css(card + ';padding:22px;margin-top:16px')}>
        <div style={css('font-size:15px;font-weight:700;margin-bottom:12px')}>รายการล่าสุด</div>
        {d.recent_txns.map((t, i) => (
          <div key={i} style={css('display:flex;align-items:center;gap:13px;padding:11px 0' + (i < d.recent_txns.length - 1 ? ';border-bottom:1px solid var(--divider)' : ''))}>
            <span style={css('font-size:18px')}>{t.icon || (t.type === 'income' ? '💰' : '•')}</span>
            <div style={css('flex:1')}><div style={css('font-size:14px;font-weight:600')}>{t.category || (t.type === 'income' ? 'รายรับ' : 'รายการ')}</div><div style={css('font-size:12px;color:var(--muted)')}>{t.note || t.occurred_at}</div></div>
            <span style={css('font-size:14px;font-weight:700;color:' + (t.type === 'income' ? '#3f9d6b' : 'var(--text)'))}>{t.type === 'income' ? '+' : '−'}{baht(t.amount)}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function Reports() {
  const [d, err, reload] = useLoad(() => api.summaryReports());
  if (err) return <ErrState msg={err} onRetry={reload} />;
  if (!d) return <Loading />;
  return (
    <>
      <H title="รายงาน" sub="เงินเข้า–ออก และรายจ่ายแยกหมวด" />
      <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px')}>
        {[['เงินเข้า', d.month_in, '#3f9d6b'], ['เงินออก', d.month_out, '#c98a3c'], ['เหลือเก็บ', d.net, '#2f7d5b']].map(([l, v, c]) => (
          <div key={l} style={css(card + ';padding:18px')}><div style={css('font-size:13px;color:var(--muted)')}>{l}</div><div style={css('font-size:26px;font-weight:800;margin-top:6px;color:' + c)}>{baht(v)}</div></div>
        ))}
      </div>
      <div style={css('display:grid;grid-template-columns:1.4fr 1fr;gap:16px')}>
        <div style={css(card + ';padding:22px')}>
          <div style={css('font-size:15px;font-weight:700;margin-bottom:6px')}>รายจ่ายรายสัปดาห์</div>
          <WeeklyBars bars={d.weekly_bars} />
        </div>
        <div style={css(card + ';padding:22px')}>
          <div style={css('font-size:15px;font-weight:700;margin-bottom:14px')}>รายจ่ายแยกตามหมวด</div>
          {d.by_category.length === 0 && <div style={css('font-size:13px;color:var(--muted)')}>ยังไม่มีรายจ่าย</div>}
          {d.by_category.map((c, i) => (
            <div key={i} style={css('margin-bottom:12px')}>
              <div style={css('display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px')}><span>{c.icon} {c.category}</span><span style={css('font-weight:600')}>{baht(c.amount)}</span></div>
              <div style={css('height:8px;border-radius:5px;background:var(--track);overflow:hidden')}><div style={css('height:100%;width:' + Math.round(c.ratio * 100) + '%;background:#2f7d5b')}></div></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ListView({ title, sub, load, render }) {
  const [d, err, reload] = useLoad(load);
  return (
    <>
      <H title={title} sub={sub} />
      {err && <ErrState msg={err} onRetry={reload} />}
      {!d && !err && <Loading />}
      {d && render(d)}
    </>
  );
}

function Transactions() {
  const [cats] = useLoad(() => api.listCategories());
  const map = {};
  (cats || []).forEach((c) => { map[c.id] = c; });
  return (
    <ListView title="รายการ" sub="ทุกธุรกรรม จัดกลุ่มตามวัน" load={() => api.listTransactions({ group_by: 'day' })} render={(groups) => (
      groups.length === 0 ? <div style={css(card + ';padding:30px;text-align:center;color:var(--muted)')}>ยังไม่มีรายการ</div> :
      <div style={css('display:flex;flex-direction:column;gap:18px')}>
        {groups.map((g, gi) => (
          <div key={gi}>
            <div style={css('font-size:13px;font-weight:600;color:var(--muted2);margin-bottom:8px')}>{g.date}</div>
            <div style={css(card + ';overflow:hidden')}>
              {g.items.map((t, i) => {
                const c = t.category_id ? map[t.category_id] : null;
                return (
                  <div key={i} style={css('display:flex;align-items:center;gap:13px;padding:13px 18px' + (i < g.items.length - 1 ? ';border-bottom:1px solid var(--divider)' : ''))}>
                    <span style={css('font-size:18px')}>{(c && c.icon) || (t.type === 'income' ? '💰' : '•')}</span>
                    <div style={css('flex:1')}><div style={css('font-size:14px;font-weight:600')}>{(c && c.name) || (t.type === 'income' ? 'รายรับ' : 'รายการ')}</div><div style={css('font-size:12px;color:var(--muted)')}>{t.note || ''}</div></div>
                    <span style={css('font-size:14px;font-weight:700;color:' + (t.type === 'income' ? '#3f9d6b' : 'var(--text)'))}>{t.type === 'income' ? '+' : '−'}{baht(t.amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    )} />
  );
}

function Bills() {
  return (
    <ListView title="บิล" sub="บิลและรายจ่ายประจำ" load={() => api.listBills()} render={(bills) => (
      <div style={css(card + ';overflow:hidden')}>
        {bills.map((b, i) => (
          <div key={b.id} style={css('display:flex;align-items:center;gap:14px;padding:15px 18px' + (i < bills.length - 1 ? ';border-bottom:1px solid var(--divider)' : ''))}>
            <span style={css('font-size:20px')}>{b.icon || '🧾'}</span>
            <div style={css('flex:1')}><div style={css('font-size:14.5px;font-weight:600')}>{b.name}</div><div style={css('font-size:12px;color:var(--muted)')}>ครบกำหนดวันที่ {b.due_day || 'สิ้นเดือน'}</div></div>
            {b.paid_this_period && <span style={css('font-size:12px;color:#2f7d5b;font-weight:600')}>✓ จ่ายแล้ว</span>}
            <span style={css('font-size:15px;font-weight:800')}>{baht(b.amount)}</span>
          </div>
        ))}
        {bills.length === 0 && <div style={css('padding:30px;text-align:center;color:var(--muted)')}>ยังไม่มีบิล</div>}
      </div>
    )} />
  );
}

function Accounts() {
  return (
    <ListView title="บัญชี" sub="เงินที่มีและหนี้สิน" load={() => api.listAccounts()} render={(accts) => {
      const assets = accts.filter((a) => a.type === 'asset');
      const debts = accts.filter((a) => a.type === 'debt');
      const total = assets.reduce((s, a) => s + a.balance, 0);
      return (
        <>
          <div style={css(card + ';padding:22px;margin-bottom:18px')}><div style={css('font-size:13px;color:var(--muted)')}>เงินที่มีรวมทั้งหมด</div><div style={css('font-size:32px;font-weight:800;margin-top:4px')}>{baht(total)}</div></div>
          <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:16px')}>
            <div style={css(card + ';overflow:hidden')}>
              <div style={css('padding:14px 18px;font-size:13px;font-weight:700;color:var(--muted2);border-bottom:1px solid var(--divider)')}>เงินที่มี</div>
              {assets.map((a) => (<div key={a.id} style={css('display:flex;align-items:center;gap:12px;padding:14px 18px')}><span style={css('font-size:17px')}>{a.icon || '🏦'}</span><span style={css('flex:1;font-size:14px;font-weight:600')}>{a.name}</span><span style={css('font-weight:700')}>{baht(a.balance)}</span></div>))}
            </div>
            <div style={css(card + ';overflow:hidden')}>
              <div style={css('padding:14px 18px;font-size:13px;font-weight:700;color:var(--muted2);border-bottom:1px solid var(--divider)')}>ยอดที่ต้องจ่าย</div>
              {debts.length === 0 && <div style={css('padding:18px;color:var(--muted);font-size:13px')}>ไม่มีหนี้สิน 🎉</div>}
              {debts.map((a) => (<div key={a.id} style={css('display:flex;align-items:center;gap:12px;padding:14px 18px')}><span style={css('font-size:17px')}>{a.icon || '💳'}</span><span style={css('flex:1;font-size:14px;font-weight:600')}>{a.name}</span><span style={css('font-weight:700;color:#d9776a')}>{baht(a.balance)}</span></div>))}
            </div>
          </div>
        </>
      );
    }} />
  );
}

function Goals() {
  return (
    <ListView title="เป้าหมาย" sub="ความคืบหน้าการออม" load={() => api.listGoals()} render={(goals) => (
      <div style={css('display:grid;grid-template-columns:repeat(2,1fr);gap:16px')}>
        {goals.map((g) => {
          const ratio = g.target_amount ? g.saved_amount / g.target_amount : 0;
          return (
            <div key={g.id} style={css(card + ';padding:20px')}>
              <div style={css('display:flex;align-items:center;gap:12px;margin-bottom:12px')}>
                <span style={css('width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;background:' + (g.icon_bg || '#e8f1ec'))}>{g.icon || '🎯'}</span>
                <div style={css('flex:1')}><div style={css('font-size:15px;font-weight:700')}>{g.name}</div><div style={css('font-size:12.5px;color:var(--muted)')}>{baht(g.saved_amount)} / {baht(g.target_amount)}</div></div>
                <span style={css('font-size:16px;font-weight:800;color:#2f7d5b')}>{Math.round(ratio * 100)}%</span>
              </div>
              <div style={css('height:8px;border-radius:5px;background:var(--track);overflow:hidden')}><div style={css('height:100%;width:' + Math.min(ratio * 100, 100) + '%;background:#2f7d5b')}></div></div>
            </div>
          );
        })}
        {goals.length === 0 && <div style={css(card + ';padding:30px;text-align:center;color:var(--muted)')}>ยังไม่มีเป้าหมาย</div>}
      </div>
    )} />
  );
}

function Plan() {
  const [d, err, reload] = useLoad(() => api.summaryPlan());
  if (err) return <ErrState msg={err} onRetry={reload} />;
  if (!d) return <Loading />;
  return (
    <>
      <H title="แผนเงิน" sub={'เหลืออีก ' + d.days_until_payday + ' วันก่อนเงินเดือนออก'} />
      <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px')}>
        <div style={css('background:#2f7d5b;border-radius:18px;padding:22px;color:#fff')}><div style={css('font-size:13px;opacity:.85')}>ยังใช้ได้อีก</div><div style={css('font-size:32px;font-weight:800;margin-top:4px')}>{baht(d.available)}</div></div>
        <div style={css(card + ';padding:22px;display:flex;align-items:center')}><div><div style={css('font-size:13px;color:var(--muted)')}>ใช้ได้ประมาณวันละ</div><div style={css('font-size:26px;font-weight:800;margin-top:4px;color:#2f7d5b')}>{baht(d.daily_allowance)}</div></div></div>
      </div>
      <div style={css('font-size:15px;font-weight:700;margin-bottom:12px')}>งบแต่ละหมวด</div>
      <div style={css('display:grid;grid-template-columns:repeat(2,1fr);gap:14px')}>
        {d.budgets.map((c, i) => {
          const barColor = c.ratio >= 1 ? '#d9776a' : c.over ? '#e0a73c' : '#2f7d5b';
          return (
            <div key={i} style={css(card + ';padding:18px')}>
              <div style={css('display:flex;justify-content:space-between;margin-bottom:8px')}><span style={css('font-size:14px;font-weight:600')}>{c.icon} {c.category}</span>{c.over && <span style={css('font-size:11px;color:#c98a3c')}>{c.ratio >= 1 ? 'เกินงบ' : 'ใกล้งบ'}</span>}</div>
              <div style={css('height:9px;border-radius:6px;background:var(--track);overflow:hidden;margin-bottom:8px')}><div style={css('height:100%;width:' + Math.min(c.ratio * 100, 100) + '%;background:' + barColor)}></div></div>
              <div style={css('font-size:12.5px;color:var(--muted)')}>ใช้ไป {baht(c.used)} จาก {baht(c.limit)}</div>
            </div>
          );
        })}
        {d.budgets.length === 0 && <div style={css(card + ';padding:24px;text-align:center;color:var(--muted)')}>ยังไม่ได้ตั้งงบ</div>}
      </div>
      <div style={css('background:#eef7f1;border:1px solid #d6e9dd;border-radius:16px;padding:18px;margin-top:18px;font-size:14px;color:#3a4d42')}>✦ {d.tip}</div>
    </>
  );
}

const VIEWS = [
  ['overview', '🏠', 'ภาพรวม', Overview],
  ['transactions', '☰', 'รายการ', Transactions],
  ['plan', '◷', 'แผนเงิน', Plan],
  ['bills', '🧾', 'บิล', Bills],
  ['accounts', '🏦', 'บัญชี', Accounts],
  ['goals', '🎯', 'เป้าหมาย', Goals],
  ['reports', '📊', 'รายงาน', Reports],
];

export default function LiveWebDashboard({ onExit, theme, name }) {
  const [view, setView] = useState('overview');
  const Active = VIEWS.find((v) => v[0] === view)[3];
  return (
    <div className="nl-themed" data-theme={theme} style={css('display:flex;min-height:100vh;width:100%;background:var(--bg);color:var(--text)')}>
      {/* sidebar */}
      <aside style={css('width:248px;flex:none;background:var(--card);border-right:1px solid var(--border);padding:24px 16px;display:flex;flex-direction:column;gap:6px')}>
        <div style={css('display:flex;align-items:center;gap:11px;padding:0 8px 22px')}>
          <img src="/logo.svg" width="36" height="36" alt="เงินทอน" style={css('display:block')} />
          <div><div style={css('font-weight:800;font-size:17px')}>เงินทอน</div><div style={css('font-size:11px;color:var(--muted)')}>แดชบอร์ด</div></div>
        </div>
        {VIEWS.map(([key, icon, label]) => (
          <button key={key} onClick={() => setView(key)} style={css('display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:12px;font-size:14.5px;font-weight:600;text-align:left;' + (view === key ? 'background:#e8f1ec;color:#2f7d5b' : 'background:transparent;color:var(--muted2)'))}>
            <span style={css('font-size:17px')}>{icon}</span>{label}
          </button>
        ))}
        <div style={css('flex:1')}></div>
        <button onClick={onExit} style={css('display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:12px;font-size:14px;color:var(--muted2);background:var(--fill2)')}>📱 กลับไปแอปมือถือ</button>
      </aside>
      {/* main */}
      <main style={css('flex:1;min-width:0;padding:32px 36px;overflow-y:auto;max-height:100vh')}>
        <Active />
      </main>
    </div>
  );
}
