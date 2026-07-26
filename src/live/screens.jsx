import { useCallback, useEffect, useState } from 'react';
import { css } from '../lib/css.js';
import { api } from '../api/client.js';

// Global "hide amounts" flag. Screens remount on navigation, so reading this
// module variable inside baht() is enough for the toggle to take effect app-wide
// (the only screen visible when you flip it — Settings — shows no amounts).
let _amountsHidden = false;
export function setAmountsHidden(v) {
  _amountsHidden = !!v;
}
export const baht = (n) =>
  _amountsHidden
    ? '฿•••'
    : '฿' + Number(n || 0).toLocaleString('th-TH', { maximumFractionDigits: 0 });

// Short Thai date, e.g. "26 มิ.ย." — used where a row has no note to show.
export const shortDate = (s) => {
  if (!s) return '';
  try {
    return new Date(s).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  } catch {
    return s;
  }
};

// Number/money text input: accepts DIGITS ONLY, formats with thousands commas
// as you type (8000 -> 8,000), and stays uncontrolled so it's robust on mobile
// WebViews (no React value-vs-keyboard fight). onValue receives the RAW digit
// string (no commas). Pass inputRef to set the value programmatically.
const fmtDigits = (raw) => (raw ? Number(raw).toLocaleString('en-US') : '');
export function MoneyInput({ defaultValue = '', onValue, inputRef, ...rest }) {
  function handle(e) {
    const el = e.target;
    const caret = el.selectionStart ?? el.value.length;
    const digitsBefore = el.value.slice(0, caret).replace(/\D/g, '').length;
    const raw = el.value.replace(/\D/g, '');
    const formatted = fmtDigits(raw);
    el.value = formatted;
    // keep the caret after the same number of digits despite added commas
    let pos = 0, seen = 0;
    while (pos < formatted.length && seen < digitsBefore) {
      const c = formatted.charCodeAt(pos);
      if (c >= 48 && c <= 57) seen++;
      pos++;
    }
    try { el.setSelectionRange(pos, pos); } catch { /* not focusable yet */ }
    if (onValue) onValue(raw);
  }
  return (
    <input
      ref={inputRef}
      defaultValue={fmtDigits(String(defaultValue ?? ''))}
      onChange={handle}
      inputMode="numeric"
      {...rest}
    />
  );
}

function useLoad(fn, deps = []) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setErr('');
    setData(null);
    fn()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setErr(e.detail || e.message || 'เกิดข้อผิดพลาด'));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return [data, err, () => setTick((t) => t + 1)];
}

const Loading = () => (
  <div style={css('padding:60px 0;text-align:center;color:var(--muted);font-size:14px')}>กำลังโหลด…</div>
);

// Friendly error state with a retry button (shown when the API is unreachable).
export function ErrState({ msg, onRetry }) {
  const offline = /fetch|network|failed/i.test(String(msg || ''));
  return (
    <div style={css('padding:54px 28px;text-align:center')}>
      <div style={css('font-size:40px;margin-bottom:14px')}>{offline ? '📡' : '⚠️'}</div>
      <div style={css('font-size:16px;font-weight:700;margin-bottom:6px')}>{offline ? 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้' : 'เกิดข้อผิดพลาด'}</div>
      <div style={css('font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:22px')}>{offline ? 'ตรวจสอบว่า backend กำลังรันอยู่ (พอร์ต 8000) แล้วลองใหม่อีกครั้ง' : String(msg)}</div>
      {onRetry && <button onClick={onRetry} style={css('height:46px;padding:0 28px;border-radius:13px;background:#2f7d5b;color:#fff;font-size:15px;font-weight:600')}>ลองใหม่</button>}
    </div>
  );
}

// ---------- In-app dialog (replaces window.prompt / window.confirm) ----------
// Native prompt()/confirm() are blocked in many mobile WebViews (incl. Capacitor),
// so we render our own. useDialog() returns promise-based confirm()/prompt().
function DialogView({ state, onClose }) {
  const isPrompt = state.kind === 'prompt';
  const [val, setVal] = useState(isPrompt ? String(state.value ?? '') : '');
  const cancelVal = isPrompt ? null : false;
  return (
    <div onClick={() => onClose(cancelVal)} style={css('position:fixed;inset:0;z-index:60;background:rgba(28,30,26,0.45);display:flex;align-items:center;justify-content:center;padding:28px;animation:nlFade .18s ease')}>
      <div onClick={(e) => e.stopPropagation()} style={css('width:100%;max-width:330px;background:var(--card);border-radius:20px;padding:22px;box-shadow:0 24px 60px -20px rgba(0,0,0,0.45)')}>
        <div style={css('font-size:17px;font-weight:700;color:var(--text)')}>{state.title}</div>
        {state.message && <div style={css('font-size:13.5px;color:var(--muted);line-height:1.5;margin-top:6px')}>{state.message}</div>}
        {isPrompt && (
          <div style={css('display:flex;align-items:center;background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:0 14px;margin-top:16px')}>
            {state.prefix && <span style={css('font-size:18px;color:#bdbfb5;font-weight:600')}>{state.prefix}</span>}
            {state.numeric ? (
              <MoneyInput
                autoFocus
                defaultValue={String(state.value ?? '')}
                onValue={setVal}
                onKeyDown={(e) => e.key === 'Enter' && onClose(val)}
                placeholder={state.placeholder || ''}
                style={css('flex:1;min-width:0;height:50px;border:none;background:transparent;font-size:16px;color:var(--text);outline:none;text-align:right;font-weight:700')}
              />
            ) : (
              <input
                autoFocus
                defaultValue={String(state.value ?? '')}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onClose(val)}
                placeholder={state.placeholder || ''}
                style={css('flex:1;min-width:0;height:50px;border:none;background:transparent;font-size:16px;color:var(--text);outline:none')}
              />
            )}
          </div>
        )}
        <div style={css('display:flex;gap:10px;margin-top:18px')}>
          <button onClick={() => onClose(cancelVal)} style={css('flex:1;height:48px;border-radius:13px;background:var(--fill2);color:var(--muted2);font-size:15px;font-weight:600')}>{state.cancelLabel || 'ยกเลิก'}</button>
          <button onClick={() => onClose(isPrompt ? val : true)} style={css('flex:1;height:48px;border-radius:13px;color:#fff;font-size:15px;font-weight:600;background:' + (state.danger ? '#d9776a' : '#2f7d5b'))}>{state.confirmLabel || (isPrompt ? 'บันทึก' : 'ยืนยัน')}</button>
        </div>
      </div>
    </div>
  );
}

export function useDialog() {
  const [st, setSt] = useState(null);
  const confirm = useCallback((opts) => new Promise((resolve) => setSt({ kind: 'confirm', ...opts, resolve })), []);
  const prompt = useCallback((opts) => new Promise((resolve) => setSt({ kind: 'prompt', ...opts, resolve })), []);
  const close = useCallback((val) => setSt((s) => { if (s) s.resolve(val); return null; }), []);
  const dialog = st ? <DialogView state={st} onClose={close} /> : null;
  return { confirm, prompt, dialog };
}

const card = 'background:var(--card);border:1px solid var(--border);border-radius:16px';

// ---------- Bottom Sheet "สรุปเดือนนี้" (matches showcase Sheet) ----------
export function LiveSheet({ onClose, onPlan }) {
  const [d] = useLoad(() => api.summaryHome());
  const watch = d?.watch_budgets?.[0];
  return (
    <div onClick={onClose} style={css('position:absolute;inset:0;background:rgba(28,30,26,0.4);z-index:30;animation:nlFade .2s ease;display:flex;align-items:flex-end')}>
      <div onClick={(e) => e.stopPropagation()} style={css('width:100%;background:var(--bg);border-radius:26px 26px 44px 44px;padding:10px 22px 30px;animation:nlSheetUp .3s cubic-bezier(.2,.8,.2,1)')}>
        <div style={css('width:40px;height:4px;border-radius:3px;background:#d6d3c9;margin:0 auto 18px')}></div>
        <div style={css('display:flex;align-items:center;gap:9px;margin-bottom:4px')}>
          <span style={css('width:26px;height:26px;border-radius:8px;background:#e8f1ec;display:flex;align-items:center;justify-content:center;font-size:14px')}>✦</span>
          <span style={css('font-size:17px;font-weight:700')}>สรุปสั้น ๆ ของเดือนนี้</span>
        </div>
        <div style={css('font-size:13px;color:var(--muted);margin-bottom:18px')}>เราดูให้แล้ว นี่คือภาพรวมตอนนี้</div>
        {!d ? <Loading /> : (
          <div style={css('display:flex;flex-direction:column;gap:10px')}>
            <div style={css('background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center')}>
              <span style={css('font-size:14px;color:var(--muted2)')}>เดือนนี้คุณใช้เงินไป</span>
              <span style={css('font-size:16px;font-weight:700')}>{baht(d.month_out)}</span>
            </div>
            {watch && (
              <div style={css('background:var(--warn-bg);border:1px solid var(--warn-line);border-radius:14px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center')}>
                <span style={css('font-size:14px;color:var(--warn-ink)')}>{watch.category} {watch.ratio >= 1 ? 'เกินงบแล้ว' : 'ใกล้เต็มงบ'}</span>
                <span style={css('font-size:16px;font-weight:700;color:var(--warn-ink)')}>{Math.round(watch.ratio * 100)}%</span>
              </div>
            )}
            <div style={css('background:var(--good-bg);border:1px solid var(--good-line);border-radius:14px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center')}>
              <span style={css('font-size:14px;color:var(--good-ink)')}>ยังมีเงินใช้ได้จริง</span>
              <span style={css('font-size:16px;font-weight:700;color:var(--good-ink)')}>{baht(d.available)}</span>
            </div>
          </div>
        )}
        {d && (
          <div style={css('background:var(--good-bg);border:1px dashed var(--good-line);border-radius:14px;padding:16px;margin-top:14px')}>
            <div style={css('font-size:14px;font-weight:600;line-height:1.5')}>
              {watch ? `ลองคุม${watch.category}อีกนิดในสัปดาห์นี้` : 'ทำได้ดีมาก ทุกงบยังอยู่ในแผน'}
            </div>
            <div style={css('font-size:12.5px;color:var(--muted);margin-top:4px')}>เฉลี่ยใช้ได้วันละ {baht(d.daily_allowance)} ถึงสิ้นเดือน</div>
          </div>
        )}
        <div style={css('display:flex;gap:10px;margin-top:18px')}>
          <button onClick={onClose} style={css('flex:none;padding:0 22px;height:50px;border-radius:14px;background:var(--fill2);color:var(--muted2);font-size:15px;font-weight:600')}>ไว้ก่อน</button>
          <button onClick={onPlan} style={css('flex:1;height:50px;border-radius:14px;background:#2f7d5b;color:#fff;font-size:15px;font-weight:600')}>ดูแผนเงิน</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Home (matches showcase Home, hero variant A) ----------
export function LiveHome({ go, name, openSheet }) {
  const [d, err, reload] = useLoad(() => api.summaryHome());
  if (err) return <ErrState msg={err} onRetry={reload} />;
  if (!d) return <Loading />;

  const total = d.total_balance || (d.available + d.reserved);
  const availPct = total > 0 ? Math.round((d.available / total) * 100) : 0;
  const reservedPct = 100 - availPct;
  const avatarCh = (name || 'คุณ').trim().charAt(0) || 'บ';
  const inN = d.month_in || 0;
  const outN = d.month_out || 0;

  return (
    <div style={css('padding:6px 20px 24px;animation:nlSwap .26s ease')}>
      {/* header */}
      <div style={css('display:flex;align-items:center;justify-content:space-between;margin:8px 0 20px')}>
        <div>
          <div style={css('font-size:21px;font-weight:700;letter-spacing:-0.01em')}>สวัสดีครับ{name ? ', ' + name : ''}</div>
          <div style={css('font-size:13px;color:var(--muted);margin-top:2px')}>ภาพรวมเดือนนี้</div>
        </div>
        <div style={css('width:42px;height:42px;border-radius:50%;background:#e8f1ec;border:1px solid #d6e6dd;display:flex;align-items:center;justify-content:center;color:#2f7d5b;font-weight:600;font-size:15px')}>{avatarCh}</div>
      </div>

      {/* HERO (variant A) */}
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:20px;padding:22px;box-shadow:0 1px 2px rgba(40,42,33,0.04),0 8px 24px -12px rgba(40,42,33,0.1)')}>
        <div style={css('display:flex;align-items:center;gap:7px;color:var(--muted);font-size:13px;font-weight:500')}><span style={css('width:7px;height:7px;border-radius:50%;background:#2f7d5b;display:inline-block')}></span>เงินที่ใช้ได้จริง</div>
        <div style={css('font-size:46px;font-weight:800;letter-spacing:-0.03em;margin:8px 0 4px;color:var(--text)')}>{baht(d.available)}</div>
        <div style={css('font-size:13px;color:var(--muted)')}>หลังหักบิลและค่าใช้จ่ายที่รอแล้ว</div>
        <div style={css('height:8px;border-radius:6px;background:var(--track);margin:18px 0 0;overflow:hidden;display:flex')}>
          <div style={css('width:' + reservedPct + '%;background:#cde0d5')}></div>
          <div style={css('width:' + availPct + '%;background:#2f7d5b')}></div>
        </div>
        <div style={css('display:flex;justify-content:space-between;margin-top:8px;font-size:11.5px;color:var(--muted)')}>
          <span>กันไว้แล้ว {baht(d.reserved)}</span><span style={css('color:#2f7d5b;font-weight:600')}>ใช้ได้ {baht(d.available)}</span>
        </div>
        <button onClick={() => go('detail')} style={css('margin-top:16px;width:100%;height:42px;border-radius:12px;background:var(--fill);color:#3a4d42;font-size:13.5px;font-weight:600')}>ดูรายละเอียด</button>
      </div>

      {/* secondary cards */}
      <div style={css('display:flex;gap:12px;margin-top:14px')}>
        <div style={css('flex:1;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:15px')}>
          <div style={css('font-size:12px;color:var(--muted)')}>เงินในบัญชีทั้งหมด</div>
          <div style={css('font-size:21px;font-weight:700;margin-top:5px')}>{baht(d.total_balance)}</div>
        </div>
        <div style={css('flex:1;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:15px')}>
          <div style={css('font-size:12px;color:var(--muted)')}>ต้องกันไว้</div>
          <div style={css('font-size:21px;font-weight:700;margin-top:5px;color:#c98a3c')}>{baht(d.reserved)}</div>
        </div>
      </div>

      {/* this month */}
      <div style={css('display:flex;align-items:center;justify-content:space-between;margin:24px 0 12px')}>
        <div style={css('font-size:15px;font-weight:700')}>เดือนนี้เป็นอย่างไร</div>
        <button onClick={openSheet} style={css('font-size:13px;color:#2f7d5b;font-weight:600;display:flex;align-items:center;gap:4px;background:transparent')}>✦ ดูสรุป</button>
      </div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px')}>
        <div style={css('display:flex;justify-content:space-between;gap:14px')}>
          <div style={css('flex:1')}>
            <div style={css('display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--muted)')}><span style={css('width:8px;height:8px;border-radius:3px;background:#3f9d6b')}></span>เงินเข้า</div>
            <div style={css('font-size:20px;font-weight:700;color:#3f9d6b;margin-top:4px')}>{baht(inN)}</div>
          </div>
          <div style={css('width:1px;background:#eee9e0')}></div>
          <div style={css('flex:1')}>
            <div style={css('display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--muted)')}><span style={css('width:8px;height:8px;border-radius:3px;background:#d9776a')}></span>เงินออก</div>
            <div style={css('font-size:20px;font-weight:700;color:#d9776a;margin-top:4px')}>{baht(outN)}</div>
          </div>
        </div>
        <div style={css('margin-top:14px;height:10px;border-radius:6px;overflow:hidden;display:flex;gap:3px')}>
          <div style={css('flex:' + (inN || 1) + ';background:#dcefe2;border-radius:6px')}></div>
          <div style={css('flex:' + (outN || 1) + ';background:#f6dcd6;border-radius:6px')}></div>
        </div>
        <div style={css('margin-top:12px;font-size:12.5px;color:var(--good-ink);background:var(--good-bg);border-radius:10px;padding:9px 12px;display:flex;align-items:center;gap:7px')}>↑ เหลือใช้เฉลี่ยวันละ {baht(d.daily_allowance)} ถึงสิ้นเดือน</div>
      </div>

      {/* upcoming */}
      {d.upcoming_bills?.length > 0 && (
        <>
          <div style={css('display:flex;align-items:center;justify-content:space-between;margin:24px 0 12px')}>
            <div style={css('font-size:15px;font-weight:700')}>ต้องจ่ายเร็ว ๆ นี้</div>
            <button onClick={() => go('bills')} style={css('font-size:13px;color:#2f7d5b;font-weight:600')}>ดูทั้งหมด</button>
          </div>
          <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden')}>
            {d.upcoming_bills.map((b, i) => (
              <div key={i} style={css('display:flex;align-items:center;gap:13px;padding:14px 16px' + (i < d.upcoming_bills.length - 1 ? ';border-bottom:1px solid var(--divider)' : ''))}>
                <div style={css('width:38px;height:38px;border-radius:11px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:16px')}>{b.icon || '🧾'}</div>
                <div style={css('flex:1')}>
                  <div style={css('font-size:14.5px;font-weight:600')}>{b.name}</div>
                  <div style={css('font-size:12px;color:var(--muted);margin-top:1px')}>ครบกำหนดวันที่ {b.due_day || 'สิ้นเดือน'}</div>
                </div>
                <div style={css('font-size:15px;font-weight:700')}>{baht(b.amount)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* watch budgets */}
      {d.watch_budgets?.length > 0 && (
        <>
          <div style={css('margin:24px 0 12px;font-size:15px;font-weight:700')}>งบที่ต้องระวัง</div>
          <div style={css('display:flex;flex-direction:column;gap:12px')}>
            {d.watch_budgets.map((b, i) => {
              const over = b.ratio >= 1;
              return (
                <div key={i} style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px')}>
                  <div style={css('display:flex;justify-content:space-between;align-items:center')}>
                    <span style={css('font-size:14.5px;font-weight:600')}>{b.icon} {b.category}</span>
                    <span style={css('font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:8px;' + (over ? 'background:var(--bad-bg);color:var(--bad-ink)' : 'background:var(--warn-bg);color:var(--warn-ink)'))}>{over ? 'เกินงบแล้ว' : 'ใกล้ถึงงบ'}</span>
                  </div>
                  <div style={css('height:9px;border-radius:6px;background:var(--track);margin:12px 0 8px;overflow:hidden')}>
                    <div style={css('height:100%;width:' + Math.min(b.ratio * 100, 100) + '%;background:' + (over ? '#d9776a' : '#e0a73c'))}></div>
                  </div>
                  <div style={css('font-size:12.5px;color:var(--muted)')}>ใช้ไป {baht(b.used)} จาก {baht(b.limit)}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* recent */}
      {d.recent_txns?.length > 0 && (
        <>
          <div style={css('display:flex;align-items:center;justify-content:space-between;margin:24px 0 12px')}>
            <div style={css('font-size:15px;font-weight:700')}>รายการล่าสุด</div>
            <button onClick={() => go('transactions')} style={css('font-size:13px;color:#2f7d5b;font-weight:600;background:transparent')}>ดูทั้งหมด</button>
          </div>
          <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden')}>
            {d.recent_txns.map((t, i) => (
              <div key={i} style={css('display:flex;align-items:center;gap:13px;padding:14px 16px' + (i < d.recent_txns.length - 1 ? ';border-bottom:1px solid var(--divider)' : ''))}>
                <div style={css('width:38px;height:38px;border-radius:11px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:16px')}>{t.icon || (t.type === 'income' ? '💰' : '•')}</div>
                <div style={css('flex:1')}>
                  <div style={css('font-size:14.5px;font-weight:600')}>{t.category || (t.type === 'income' ? 'รายรับ' : 'รายการ')}</div>
                  <div style={css('font-size:12px;color:var(--muted);margin-top:1px')}>{t.note || shortDate(t.occurred_at)}</div>
                </div>
                <div style={css('font-size:15px;font-weight:700;color:' + (t.type === 'income' ? '#3f9d6b' : 'var(--text)'))}>{t.type === 'income' ? '+' : '−'}{baht(t.amount)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Detail ----------
export function LiveDetail({ back }) {
  const [d, err, reload] = useLoad(() => api.summaryDetail());
  if (err) return <ErrState msg={err} onRetry={reload} />;
  if (!d) return <Loading />;
  return (
    <div style={css('padding:6px 20px 24px')}>
      <div style={css('display:flex;align-items:center;gap:12px;margin:6px 0 18px')}>
        <button onClick={back} style={css('width:40px;height:40px;border-radius:12px;background:var(--card);border:1px solid var(--border);font-size:18px;color:var(--muted2)')}>‹</button>
        <div style={css('font-size:19px;font-weight:700')}>เงินที่ใช้ได้จริง</div>
      </div>
      <div style={css('background:#2f7d5b;border-radius:20px;padding:24px;color:#fff;text-align:center')}>
        <div style={css('font-size:13px;opacity:0.85')}>ตอนนี้คุณใช้ได้จริง</div>
        <div style={css('font-size:44px;font-weight:800;margin:6px 0 2px')}>{baht(d.available)}</div>
        <div style={css('font-size:12.5px;opacity:0.8')}>เฉลี่ยวันละ {baht(d.daily_allowance)} · อีก {d.days_until_payday} วัน</div>
      </div>
      <div style={css('margin:22px 0 12px;font-size:14px;font-weight:700')}>เงินของคุณไปไหนบ้าง</div>
      <div style={css(card + ';overflow:hidden')}>
        <div style={css('display:flex;align-items:center;gap:13px;padding:16px;border-bottom:1px solid var(--divider)')}>
          <span style={css('font-size:18px')}>💰</span>
          <span style={css('flex:1;font-size:14.5px;font-weight:600')}>เงินในบัญชีทั้งหมด</span>
          <span style={css('font-size:16px;font-weight:800')}>{baht(d.total_balance)}</span>
        </div>
        {d.items.map((it, i) => (
          <div key={i} style={css('display:flex;align-items:center;gap:13px;padding:15px 16px;border-bottom:1px solid var(--divider)')}>
            <span style={css('font-size:17px')}>{it.icon || '•'}</span>
            <span style={css('flex:1;font-size:14px;font-weight:600')}>{it.label}</span>
            <span style={css('font-size:15px;font-weight:700;color:#c98a3c')}>−{baht(it.amount)}</span>
          </div>
        ))}
        <div style={css('display:flex;align-items:center;gap:13px;padding:16px;background:var(--good-bg)')}>
          <span style={css('font-size:18px')}>✓</span>
          <span style={css('flex:1;font-size:14.5px;font-weight:700;color:var(--good-ink)')}>เหลือใช้จริง</span>
          <span style={css('font-size:18px;font-weight:800;color:var(--good-ink)')}>{baht(d.available)}</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Add transaction (keypad + success, matches showcase) ----------
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

export function LiveAdd({ back, toast }) {
  const [cats] = useLoad(() => api.listCategories());
  const [accts] = useLoad(() => api.listAccounts());
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('0');
  const [catId, setCatId] = useState(null);
  const [acctIdx, setAcctIdx] = useState(0);
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const { prompt, dialog } = useDialog();

  const list = (cats || []).filter((c) => c.kind === type);
  const assets = (accts || []).filter((a) => a.type === 'asset');
  const acct = assets.length ? assets[acctIdx % assets.length] : null;
  const display = (() => {
    const [i, d] = amount.split('.');
    const intf = Number(i || 0).toLocaleString('th-TH');
    return d !== undefined ? intf + '.' + d : intf;
  })();

  function press(k) {
    setAmount((a) => {
      if (k === '⌫') return a.length <= 1 ? '0' : a.slice(0, -1);
      if (k === '.') return a.includes('.') ? a : a + '.';
      if (a === '0') return k;
      return a.replace('.', '').length >= 9 ? a : a + k;
    });
  }
  async function save() {
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast('ใส่จำนวนเงินก่อน'); return; }
    setBusy(true);
    try {
      await api.createTransaction({ type, amount: amt, category_id: catId, account_id: acct?.id, note });
      setDone(true);
    } catch (e) {
      toast(e.detail || 'บันทึกไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div style={css('min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 30px')}>
        <div style={css('width:84px;height:84px;border-radius:50%;background:#e8f1ec;display:flex;align-items:center;justify-content:center;margin-bottom:24px;animation:nlPop .4s ease')}>
          <div style={css('width:50px;height:50px;border-radius:50%;background:#2f7d5b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px')}>✓</div>
        </div>
        <div style={css('font-size:24px;font-weight:700;margin-bottom:10px')}>บันทึกแล้ว</div>
        <div style={css('font-size:15px;color:var(--muted2);background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 18px;line-height:1.5')}>
          {type === 'expense' ? 'รายจ่าย' : 'รายรับ'} <span style={css('color:#2f7d5b;font-weight:700;font-size:18px')}>{baht(Number(amount))}</span> ถูกบันทึกแล้ว
        </div>
        <button onClick={back} style={css('margin-top:28px;height:50px;padding:0 36px;border-radius:14px;background:#2f7d5b;color:#fff;font-size:15px;font-weight:600')}>เสร็จสิ้น</button>
      </div>
    );
  }

  return (
    <div style={css('min-height:100%;display:flex;flex-direction:column')}>
      <div style={css('flex:none;padding:8px 20px 0;display:flex;align-items:center;justify-content:space-between')}>
        <button onClick={back} style={css('font-size:15px;color:var(--muted2);background:transparent')}>ยกเลิก</button>
        <div style={css('font-size:16px;font-weight:700')}>เพิ่มรายการ</div>
        <div style={css('width:44px')}></div>
      </div>
      <div style={css('flex:none;padding:18px 20px 0')}>
        <div style={css('display:flex;background:var(--fill2);border-radius:13px;padding:4px;gap:3px')}>
          {[['expense', 'รายจ่าย'], ['income', 'รายรับ']].map(([t, l]) => (
            <button key={t} onClick={() => { setType(t); setCatId(null); }} style={css('flex:1;height:40px;border-radius:10px;font-size:14px;font-weight:600;' + (type === t ? 'background:var(--card);color:#2f7d5b;box-shadow:0 1px 2px rgba(0,0,0,.06)' : 'background:transparent;color:var(--muted2)'))}>{l}</button>
          ))}
        </div>
      </div>
      <div style={css('flex:none;display:flex;align-items:baseline;justify-content:center;gap:8px;padding:30px 0 24px')}>
        <span style={css('font-size:30px;color:#c4c6bc;font-weight:600')}>฿</span>
        <span style={css('font-size:52px;font-weight:800;letter-spacing:-0.03em;color:' + (amount === '0' ? '#c4c6bc' : 'var(--text)'))}>{display}</span>
      </div>
      <div className="nl-scroll" style={css('flex:none;padding:0 16px 14px;display:flex;gap:8px;overflow-x:auto')}>
        {list.map((c) => (
          <button key={c.id} onClick={() => setCatId(c.id)} style={css('flex:none;padding:9px 14px;border-radius:11px;font-size:13px;white-space:nowrap;' + (catId === c.id ? 'background:#2f7d5b;color:#fff;border:1px solid #2f7d5b' : 'background:var(--card);border:1px solid var(--border)'))}>{c.icon} {c.name}</button>
        ))}
      </div>
      <div style={css('flex:none;padding:0 20px;display:flex;flex-direction:column;gap:9px')}>
        <button onClick={() => assets.length > 1 && setAcctIdx((i) => i + 1)} style={css('width:100%;display:flex;align-items:center;justify-content:space-between;background:var(--card);border:1px solid var(--border);border-radius:13px;padding:13px 15px')}>
          <span style={css('font-size:13px;color:var(--muted)')}>จ่ายจาก</span>
          <span style={css('font-size:14px;font-weight:600;display:flex;align-items:center;gap:6px')}>{acct ? acct.name : 'บัญชีหลัก'}<span style={css('color:#c4c6bc')}>›</span></span>
        </button>
        <div style={css('display:flex;gap:9px')}>
          <button onClick={() => toast('ใช้วันที่วันนี้')} style={css('flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:var(--card);border:1px solid var(--border);border-radius:13px;padding:11px;font-size:13px;color:var(--muted2)')}>📅 วันนี้</button>
          <button onClick={async () => { const n = await prompt({ title: 'โน้ตรายการนี้', placeholder: 'เช่น กินข้าวกับเพื่อน', value: note || '' }); if (n != null) setNote(n); }} style={css('flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:var(--card);border:1px solid var(--border);border-radius:13px;padding:11px;font-size:13px;color:' + (note ? '#2f7d5b' : 'var(--muted2)'))}>📝 {note ? 'มีโน้ต' : 'โน้ต'}</button>
          <button onClick={() => toast('แนบใบเสร็จ — เร็ว ๆ นี้')} style={css('flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:var(--card);border:1px solid var(--border);border-radius:13px;padding:11px;font-size:13px;color:var(--muted2)')}>📎 ใบเสร็จ</button>
        </div>
      </div>
      <div style={css('flex:1;min-height:10px')}></div>
      <div style={css('flex:none;background:var(--fill2);padding:10px 8px 4px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px')}>
        {KEYS.map((k) => (
          <button key={k} onClick={() => press(k)} style={css('height:50px;border-radius:11px;background:var(--card);font-size:22px;font-weight:600;color:var(--text);box-shadow:0 1px 1px rgba(40,42,33,0.05)')}>{k}</button>
        ))}
      </div>
      <div style={css('flex:none;padding:10px 16px 18px;background:var(--fill2)')}>
        <button disabled={busy} onClick={save} style={css('width:100%;height:54px;border-radius:15px;background:#2f7d5b;color:#fff;font-size:16px;font-weight:600;box-shadow:0 6px 16px -4px rgba(47,125,91,0.5);opacity:' + (busy ? '0.6' : '1'))}>บันทึกรายการ</button>
      </div>
      {dialog}
    </div>
  );
}

// ---------- Bills ----------
export function LiveBills({ toast, onAdd, onEdit, back }) {
  const [tick, setTick] = useState(0);
  const [bills, err, reload2] = useLoad(() => api.listBills(), [tick]);
  const reload = () => setTick((t) => t + 1);
  const { confirm, dialog } = useDialog();

  async function pay(id) {
    try {
      await api.payBill(id);
      toast('จ่ายบิลแล้ว');
      reload();
    } catch (e) {
      toast(e.detail || 'จ่ายไม่สำเร็จ');
    }
  }
  async function remove(id, name) {
    if (!(await confirm({ title: 'ลบบิล', message: 'ต้องการลบบิล "' + name + '" ใช่ไหม?', danger: true, confirmLabel: 'ลบ' }))) return;
    try {
      await api.deleteBill(id);
      toast('ลบบิลแล้ว');
      reload();
    } catch (e) {
      toast(e.detail || 'ลบไม่สำเร็จ');
    }
  }

  if (err) return <ErrState msg={err} onRetry={reload2} />;
  if (!bills) return <Loading />;
  return (
    <div style={css('padding:6px 20px 24px;animation:nlSwap .26s ease')}>
      <div style={css('display:flex;align-items:center;gap:12px;margin:6px 0 18px')}>
        <button onClick={back} style={css('flex:none;width:40px;height:40px;border-radius:12px;background:var(--card);border:1px solid var(--border);font-size:18px;color:var(--muted2);display:flex;align-items:center;justify-content:center')}>‹</button>
        <div style={css('flex:1;font-size:21px;font-weight:700')}>บิล</div>
        <button onClick={onAdd} style={css('font-size:13px;color:#2f7d5b;font-weight:700;background:transparent')}>+ เพิ่มบิล</button>
      </div>
      <div style={css('display:flex;flex-direction:column;gap:10px')}>
        {bills.map((b) => (
          <div key={b.id} style={css(card + ';padding:14px;display:flex;align-items:center;gap:13px')}>
            <div style={css('width:42px;height:42px;border-radius:12px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:18px')}>{b.icon || '🧾'}</div>
            <div style={css('flex:1')}>
              <div style={css('font-size:14.5px;font-weight:700')}>{b.name}</div>
              <div style={css('font-size:12px;color:var(--muted);margin-top:1px')}>ครบกำหนดวันที่ {b.due_day || 'สิ้นเดือน'}</div>
            </div>
            <div style={css('text-align:right')}>
              <div style={css('font-size:15px;font-weight:800')}>{baht(b.amount)}</div>
              {b.paid_this_period ? (
                <span style={css('font-size:12px;color:#2f7d5b;font-weight:600')}>✓ จ่ายแล้ว</span>
              ) : (
                <button onClick={() => pay(b.id)} style={css('font-size:12px;color:#2f7d5b;font-weight:700;background:transparent')}>จ่ายเลย ›</button>
              )}
            </div>
            <button onClick={() => onEdit(b)} style={css('font-size:15px;color:#c4c6bc;background:transparent;padding:0 2px')}>✎</button>
            <button onClick={() => remove(b.id, b.name)} style={css('font-size:16px;color:#c4c6bc;background:transparent;padding:0 2px')}>×</button>
          </div>
        ))}
        {bills.length === 0 && <div style={css('text-align:center;color:var(--muted);padding:40px 0')}>ยังไม่มีบิล — กด “+ เพิ่มบิล”</div>}
      </div>
      {dialog}
    </div>
  );
}

// ---------- Goals ----------
export function LiveGoals({ toast, onAdd, onEdit, back }) {
  const [tick, setTick] = useState(0);
  const [goals, err, reload2] = useLoad(() => api.listGoals(), [tick]);
  const { confirm, prompt, dialog } = useDialog();
  async function contribute(id) {
    const v = await prompt({ title: 'เก็บเข้าเป้าหมาย', placeholder: 'จำนวนเงิน', numeric: true, prefix: '฿', confirmLabel: 'เก็บเงิน' });
    const amt = Number(v || 0);
    if (amt <= 0) return;
    try {
      await api.contributeGoal(id, amt);
      toast('เก็บเงินแล้ว');
      setTick((t) => t + 1);
    } catch (e) {
      toast(e.detail || 'ไม่สำเร็จ');
    }
  }
  async function remove(id, name) {
    if (!(await confirm({ title: 'ลบเป้าหมาย', message: 'ต้องการลบเป้าหมาย "' + name + '" ใช่ไหม?', danger: true, confirmLabel: 'ลบ' }))) return;
    try {
      await api.deleteGoal(id);
      toast('ลบเป้าหมายแล้ว');
      setTick((t) => t + 1);
    } catch (e) {
      toast(e.detail || 'ลบไม่สำเร็จ');
    }
  }
  if (err) return <ErrState msg={err} onRetry={reload2} />;
  if (!goals) return <Loading />;
  return (
    <div style={css('padding:6px 20px 24px;animation:nlSwap .26s ease')}>
      <div style={css('display:flex;align-items:center;gap:12px;margin:6px 0 18px')}>
        <button onClick={back} style={css('flex:none;width:40px;height:40px;border-radius:12px;background:var(--card);border:1px solid var(--border);font-size:18px;color:var(--muted2);display:flex;align-items:center;justify-content:center')}>‹</button>
        <div style={css('flex:1;font-size:21px;font-weight:700')}>เป้าหมาย</div>
        <button onClick={onAdd} style={css('font-size:13px;color:#2f7d5b;font-weight:700;background:transparent')}>+ เพิ่ม</button>
      </div>
      <div style={css('display:flex;flex-direction:column;gap:10px')}>
        {goals.map((g) => {
          const ratio = g.target_amount ? g.saved_amount / g.target_amount : 0;
          return (
            <div key={g.id} style={css(card + ';padding:14px')}>
              <div style={css('display:flex;align-items:center;gap:12px;margin-bottom:10px')}>
                <span style={css('width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:20px;background:' + (g.icon_bg || '#e8f1ec'))}>{g.icon || '🎯'}</span>
                <div style={css('flex:1')}>
                  <div style={css('font-size:14.5px;font-weight:700')}>{g.name}</div>
                  <div style={css('font-size:12px;color:var(--muted)')}>{baht(g.saved_amount)} / {baht(g.target_amount)}</div>
                </div>
                <div style={css('font-size:15px;font-weight:800;color:#2f7d5b')}>{Math.round(ratio * 100)}%</div>
              </div>
              <div style={css('height:7px;background:var(--fill2);border-radius:4px;overflow:hidden')}>
                <div style={css('height:100%;width:' + Math.min(ratio * 100, 100) + '%;background:#2f7d5b')}></div>
              </div>
              <div style={css('display:flex;gap:8px;margin-top:12px')}>
                <button onClick={() => contribute(g.id)} style={css('flex:1;height:38px;border-radius:11px;background:#e8f1ec;color:#2f7d5b;font-size:13px;font-weight:600')}>+ เก็บเงิน</button>
                <button onClick={() => onEdit(g)} style={css('padding:0 16px;height:38px;border-radius:11px;background:var(--fill2);color:var(--muted2);font-size:13px;font-weight:600')}>แก้ไข</button>
                <button onClick={() => remove(g.id, g.name)} style={css('padding:0 16px;height:38px;border-radius:11px;background:var(--fill2);color:var(--muted2);font-size:13px;font-weight:600')}>ลบ</button>
              </div>
            </div>
          );
        })}
        {goals.length === 0 && <div style={css('text-align:center;color:var(--muted);padding:40px 0')}>ยังไม่มีเป้าหมาย — กด “+ เพิ่ม”</div>}
      </div>
      {dialog}
    </div>
  );
}

// ---------- Settings (matches showcase Settings) ----------
const SWATCHES = [
  { key: 'light', label: 'ครีม', sw: '#f5f3ee', ring: '#d8d4cb' },
  { key: 'mint', label: 'มินต์', sw: '#e9f3ed', ring: '#bcd6c8' },
  { key: 'sky', label: 'ฟ้า', sw: '#e9f0f8', ring: '#bcd0e8' },
  { key: 'sand', label: 'ทราย', sw: '#f5efe3', ring: '#dccdb0' },
  { key: 'dark', label: 'มืด', sw: '#20242b', ring: '#3a414c' },
  { key: 'midnight', label: 'กลางคืน', sw: '#1a2340', ring: '#33406a' },
];
const GOAL_LABEL = {
  leftover: 'มีเงินเหลือปลายเดือน', save: 'เก็บเงินให้ได้ตามเป้า',
  debt: 'ปลดหนี้', control: 'คุมค่าใช้จ่าย', invest: 'เริ่มลงทุน',
};
const GOAL_ORDER = ['leftover', 'save', 'debt', 'control', 'invest'];

const secTitle = 'font-size:13px;font-weight:700;color:var(--muted2);margin:0 0 10px 2px';
const group = card + ';overflow:hidden;margin-bottom:22px';

function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} style={css('position:relative;width:46px;height:27px;border-radius:14px;flex:none;background:' + (on ? '#2f7d5b' : '#d8d4cb'))}>
      <span style={css('position:absolute;top:3px;left:' + (on ? '22px' : '3px') + ';width:21px;height:21px;border-radius:50%;background:var(--card);box-shadow:0 1px 2px rgba(0,0,0,0.2)')}></span>
    </button>
  );
}

function ToggleRow({ icon, title, sub, on, onClick, border }) {
  return (
    <div style={css('display:flex;align-items:center;gap:14px;padding:15px 16px;' + (border ? 'border-bottom:1px solid var(--divider)' : ''))}>
      {icon && <span style={css('font-size:18px;width:24px;text-align:center')}>{icon}</span>}
      <div>
        <div style={css('font-size:14.5px;font-weight:500')}>{title}</div>
        <div style={css('font-size:12px;color:var(--muted);margin-top:1px')}>{sub}</div>
      </div>
      <div style={css('flex:1')}></div>
      <Toggle on={on} onClick={onClick} />
    </div>
  );
}

function LinkRow({ icon, title, value, onClick, border }) {
  return (
    <button onClick={onClick} style={css('width:100%;text-align:left;display:flex;align-items:center;gap:14px;padding:15px 16px;background:transparent;' + (border ? 'border-bottom:1px solid var(--divider)' : ''))}>
      <span style={css('font-size:18px;width:24px;text-align:center')}>{icon}</span>
      <span style={css('flex:1;font-size:14.5px;font-weight:500')}>{title}</span>
      <span style={css('font-size:13.5px;color:var(--muted)')}>{value}{value ? ' ' : ''}›</span>
    </button>
  );
}

export function LiveSettings({ theme, setTheme, me, onLogout, toast, back }) {
  const [st, setSt] = useState(null); // settings
  const [pf, setPf] = useState(null); // profile
  const { prompt, dialog } = useDialog();
  useEffect(() => {
    api.getSettings().then((s) => { setSt(s); setAmountsHidden(s?.hide_amounts); }).catch(() => {});
    api.getProfile().then(setPf).catch(() => {});
  }, []);

  async function toggleS(key) {
    const next = !st[key];
    setSt((s) => ({ ...s, [key]: next }));
    if (key === 'hide_amounts') setAmountsHidden(next);
    try {
      await api.patchSettings({ [key]: next });
    } catch {
      toast('บันทึกไม่สำเร็จ');
      setSt((s) => ({ ...s, [key]: !next }));
      if (key === 'hide_amounts') setAmountsHidden(!next);
    }
  }
  async function pickTheme(t) {
    setTheme(t);
    setSt((s) => ({ ...s, theme: t }));
    try {
      await api.patchSettings({ theme: t });
    } catch {
      /* ignore */
    }
  }
  async function editName() {
    const name = await prompt({ title: 'ชื่อที่อยากให้เรียก', value: pf?.display_name || '', placeholder: 'ชื่อเล่น' });
    if (name == null) return;
    setPf((p) => ({ ...p, display_name: name }));
    try {
      await api.patchProfile({ display_name: name });
      toast('บันทึกชื่อแล้ว');
    } catch {
      toast('บันทึกไม่สำเร็จ');
    }
  }
  async function editPayday() {
    const v = await prompt({ title: 'วันเงินเดือนออก', message: 'ใส่วันที่ 1–31 · ใส่ 0 = สิ้นเดือน', value: String(pf?.pay_day ?? 0), numeric: true });
    if (v == null) return;
    const d = Math.max(0, Math.min(32, parseInt(v, 10) || 0));
    setPf((p) => ({ ...p, pay_day: d }));
    try {
      await api.patchProfile({ pay_day: d });
      toast('บันทึกแล้ว');
    } catch {
      toast('บันทึกไม่สำเร็จ');
    }
  }
  async function cycleGoal() {
    const cur = pf?.primary_goal || 'leftover';
    const next = GOAL_ORDER[(GOAL_ORDER.indexOf(cur) + 1) % GOAL_ORDER.length];
    setPf((p) => ({ ...p, primary_goal: next }));
    try {
      await api.patchProfile({ primary_goal: next });
      toast(GOAL_LABEL[next]);
    } catch {
      toast('บันทึกไม่สำเร็จ');
    }
  }

  if (!st || !pf) return <Loading />;
  const payday = pf.pay_day === 0 || pf.pay_day === 32 ? 'สิ้นเดือน' : 'ทุกวันที่ ' + pf.pay_day;
  const soon = () => toast('ฟีเจอร์นี้กำลังมา เร็ว ๆ นี้');

  return (
    <div style={css('padding:6px 20px 28px;animation:nlSwap .26s ease')}>
      <div style={css('display:flex;align-items:center;gap:12px;margin:6px 0 20px')}>
        <button onClick={back} style={css('flex:none;width:40px;height:40px;border-radius:12px;background:var(--card);border:1px solid var(--border);font-size:18px;color:var(--muted2);display:flex;align-items:center;justify-content:center')}>‹</button>
        <div style={css('font-size:21px;font-weight:700')}>ตั้งค่า</div>
      </div>

      {/* บัญชีและโปรไฟล์ */}
      <div style={css(secTitle)}>บัญชีและโปรไฟล์</div>
      <div style={css(group)}>
        <LinkRow icon="👤" title="ข้อมูลส่วนตัว" value={me?.email || (me?.account_type === 'guest' ? 'Guest' : '')} onClick={editName} border />
        <LinkRow icon="💳" title="วันเงินเดือนออก" value={payday} onClick={editPayday} border />
        <LinkRow icon="🎯" title="เป้าหมายหลัก" value={GOAL_LABEL[pf.primary_goal] || '—'} onClick={cycleGoal} />
      </div>

      {/* การแจ้งเตือน */}
      <div style={css(secTitle)}>การแจ้งเตือน</div>
      <div style={css(group)}>
        <ToggleRow title="เตือนก่อนบิลถึงกำหนด" sub="ล่วงหน้า 3 วัน" on={st.notify_bills} onClick={() => toggleS('notify_bills')} border />
        <ToggleRow title="เตือนเมื่อใกล้เกินงบ" sub="เมื่อใช้ถึง 80% ของงบ" on={st.notify_budget} onClick={() => toggleS('notify_budget')} border />
        <ToggleRow title="สรุปประจำสัปดาห์" sub="ทุกเช้าวันจันทร์" on={st.weekly_summary} onClick={() => toggleS('weekly_summary')} />
      </div>

      {/* ธีมแอป */}
      <div style={css(secTitle)}>ธีมแอป</div>
      <div style={css(card + ';padding:18px;margin-bottom:22px')}>
        <div style={css('font-size:12.5px;color:var(--muted);margin-bottom:14px')}>เลือกสีพื้นของแอป ตัวอักษรจะปรับโทนให้อ่านง่ายอัตโนมัติ</div>
        <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:12px')}>
          {SWATCHES.map((t) => {
            const active = theme === t.key;
            return (
              <div key={t.key}>
                <div onClick={() => pickTheme(t.key)} style={css('width:100%;aspect-ratio:1;border-radius:14px;background:' + t.sw + ';border:' + (active ? '2.5px solid #2f7d5b' : '1.5px solid ' + t.ring) + ';display:flex;align-items:center;justify-content:center;cursor:pointer')}>
                  <span style={css('width:20px;height:20px;border-radius:50%;background:#2f7d5b;color:#fff;display:' + (active ? 'flex' : 'none') + ';align-items:center;justify-content:center;font-size:12px')}>✓</span>
                </div>
                <div style={css('font-size:11px;text-align:center;margin-top:6px;font-weight:' + (active ? '700' : '500') + ';color:' + (active ? '#2f7d5b' : 'var(--muted)'))}>{t.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ความปลอดภัยและการแสดงผล */}
      <div style={css(secTitle)}>ความปลอดภัยและการแสดงผล</div>
      <div style={css(group)}>
        <ToggleRow icon="🔒" title="ล็อกด้วยสแกนใบหน้า" sub="เปิดแอปต้องยืนยันตัวตน" on={st.biometric} onClick={() => toggleS('biometric')} border />
        <ToggleRow icon="🙈" title="ซ่อนจำนวนเงิน" sub="แสดงยอดเงินทั้งแอปเป็น •••" on={st.hide_amounts} onClick={() => toggleS('hide_amounts')} />
      </div>

      {/* ทั่วไป */}
      <div style={css(secTitle)}>ทั่วไป</div>
      <div style={css(group)}>
        <LinkRow icon="🌐" title="ภาษา" value="ไทย" onClick={soon} border />
        <LinkRow icon="💱" title="สกุลเงิน" value="บาท (฿)" onClick={soon} border />
        <LinkRow icon="💬" title="ช่วยเหลือและติดต่อเรา" value="" onClick={soon} />
      </div>

      <button onClick={onLogout} style={css('width:100%;height:50px;border-radius:14px;background:var(--card);border:1px solid #f0dad5;color:#d9776a;font-size:15px;font-weight:600')}>ออกจากระบบ</button>
      <div style={css('text-align:center;font-size:12px;color:#bdbfb5;margin-top:18px')}>เงินทอน · เวอร์ชัน 1.0.0</div>
      {dialog}
    </div>
  );
}
