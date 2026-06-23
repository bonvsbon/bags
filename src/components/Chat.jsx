import { Fragment } from 'react';
import { css } from '../lib/css.js';

export function ChatHead({ v }) {
  return (
    <button onClick={v.openAi} style={css('position:absolute;right:16px;bottom:96px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#3f9d6b,#2f7d5b);color:#fff;font-size:24px;display:flex;align-items:center;justify-content:center;z-index:35;box-shadow:0 8px 20px -4px rgba(47,125,91,0.6);animation:nlPop .3s ease')}>💬</button>
  );
}

export function ChatPopup({ v }) {
  return (
    <div style={css('position:absolute;inset:0;z-index:60;display:flex;flex-direction:column;background:var(--bg);animation:nlFade .2s ease')}>
      {/* header */}
      <div style={css('flex:none;display:flex;align-items:center;gap:11px;padding:50px 16px 12px;background:linear-gradient(135deg,#3f9d6b,#2f7d5b);color:#fff')}>
        <div style={css('width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:18px')}>✦</div>
        <div style={css('flex:1;line-height:1.25')}>
          <div style={css('font-size:15.5px;font-weight:700')}>ผู้ช่วยเงินทอน</div>
          <div style={css('font-size:11px;opacity:0.92;display:flex;align-items:center;gap:5px')}>
            <span style={css('width:6px;height:6px;border-radius:50%;background:#a8f0c6;display:inline-block')}></span>ออนไลน์ · ตอบจากข้อมูลของคุณ</div>
        </div>
        <button onClick={v.closeAi} style={css('width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.18);color:#fff;font-size:17px;display:flex;align-items:center;justify-content:center')}>✕</button>
      </div>

      {/* messages */}
      <div className="nl-scroll" style={css('flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px')}>
        {v.aiBubbles.map((m, i) => (
          <Fragment key={i}>
            <div style={css(m.rowStyle)}>
              <div style={css(m.bubbleStyle)}>{m.text}</div>
            </div>
            {m.hasGoal && (
              <div style={css('display:flex;justify-content:flex-start')}>
                <div style={css('max-width:88%;background:var(--card);border:1px solid #cfe3d8;border-radius:14px;padding:14px;box-shadow:0 6px 16px -10px rgba(40,42,33,0.18)')}>
                  <div style={css('display:flex;align-items:center;gap:10px;margin-bottom:10px')}>
                    <span style={css('width:38px;height:38px;border-radius:11px;background:#e8f1ec;display:flex;align-items:center;justify-content:center;font-size:18px')}>🎯</span>
                    <div>
                      <div style={css('font-size:14px;font-weight:700')}>{m.goalName}</div>
                      <div style={css('font-size:12px;color:var(--muted)')}>เป้า {m.goalTarget} · เก็บเดือนละ {m.goalPer}</div>
                    </div>
                  </div>
                  {m.goalActive && (
                    <div style={css('display:flex;gap:8px')}>
                      <button onClick={v.dismissGoal} style={css('flex:none;padding:0 16px;height:40px;border-radius:11px;background:var(--fill2);color:var(--muted2);font-size:13.5px;font-weight:600;font-family:inherit')}>ไว้ก่อน</button>
                      <button onClick={v.confirmGoal} style={css('flex:1;height:40px;border-radius:11px;background:#2f7d5b;color:#fff;font-size:13.5px;font-weight:600;font-family:inherit')}>สร้างเป้าหมายนี้</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Fragment>
        ))}
        {v.aiThinking && (
          <div style={css('display:flex;justify-content:flex-start')}>
            <div style={css('background:var(--fill);border-radius:4px 16px 16px 16px;padding:13px 16px;display:flex;gap:5px')}>
              <span style={css('width:7px;height:7px;border-radius:50%;background:var(--muted);animation:nlBlink 1s infinite')}></span>
              <span style={css('width:7px;height:7px;border-radius:50%;background:var(--muted);animation:nlBlink 1s infinite .2s')}></span>
              <span style={css('width:7px;height:7px;border-radius:50%;background:var(--muted);animation:nlBlink 1s infinite .4s')}></span>
            </div>
          </div>
        )}
      </div>

      {/* suggestion chips */}
      <div className="nl-scroll" style={css('flex:none;padding:8px 14px 4px;display:flex;gap:8px;overflow-x:auto')}>
        {v.aiSuggest.map((q, i) => <button key={i} onClick={q.onClick} style={css('flex:none;white-space:nowrap;padding:8px 13px;border-radius:18px;background:var(--card);border:1px solid #cfe3d8;color:#2f7d5b;font-size:12.5px;font-weight:600;font-family:inherit')}>{q.label}</button>)}
      </div>

      {/* input bar */}
      <div style={css('flex:none;padding:10px 14px 28px;display:flex;align-items:center;gap:9px;border-top:1px solid var(--divider)')}>
        <input value={v.aiInput} onChange={v.onAiInput} onKeyDown={v.onAiKey} placeholder="พิมพ์ถามได้เลย…" style={css('flex:1;min-width:0;height:46px;border:1px solid var(--border);border-radius:23px;padding:0 18px;font-size:14px;font-family:inherit;background:var(--card);color:var(--text);outline:none')} />
        <button onClick={v.sendAi} style={css('flex:none;width:46px;height:46px;border-radius:50%;background:#2f7d5b;color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center')}>➤</button>
      </div>
    </div>
  );
}
