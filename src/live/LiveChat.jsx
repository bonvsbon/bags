import { useEffect, useRef, useState } from 'react';
import { css } from '../lib/css.js';
import { api } from '../api/client.js';

// Full-screen AI assistant overlay for the live app.
// Gates on PDPA consent before any message reaches a cloud provider.
export default function LiveChat({ me, onClose, onConsented }) {
  const consented = !!me?.ai_consent_at;
  const [needConsent, setNeedConsent] = useState(!consented);
  const [msgs, setMsgs] = useState([
    { role: 'assistant', text: 'สวัสดีค่ะ ถามเรื่องเงินของคุณได้เลย เช่น “เดือนนี้ใช้เยอะไปไหม” หรือ “เงินพอถึงสิ้นเดือนมั้ย”' },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [convId, setConvId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, thinking]);

  async function acceptConsent() {
    try {
      await api.ai.consent();
      setNeedConsent(false);
      onConsented?.();
    } catch {
      /* keep the consent screen up on failure */
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || thinking) return;
    setInput('');
    setMsgs((m) => [...m, { role: 'user', text }]);
    setThinking(true);
    try {
      const res = await api.ai.chat(text, convId);
      setConvId(res.conversation_id);
      setMsgs((m) => [...m, { role: 'assistant', text: res.reply, provider: res.provider }]);
    } catch (e) {
      if (e?.status === 403 && e?.detail === 'consent_required') {
        setNeedConsent(true);
      } else if (e?.status === 503) {
        setMsgs((m) => [...m, { role: 'assistant', text: 'ตอนนี้ผู้ช่วย AI เต็มโควตาชั่วคราว ลองใหม่อีกครั้งภายหลังนะคะ', system: true }]);
      } else {
        setMsgs((m) => [...m, { role: 'assistant', text: 'ขออภัย เกิดข้อผิดพลาด ลองใหม่อีกครั้งนะคะ', system: true }]);
      }
    } finally {
      setThinking(false);
    }
  }

  return (
    <div style={css('position:absolute;inset:0;z-index:60;display:flex;flex-direction:column;background:var(--bg);animation:nlFade .2s ease')}>
      {/* header */}
      <div style={css('flex:none;display:flex;align-items:center;gap:11px;padding:50px 16px 12px;background:linear-gradient(135deg,#3f9d6b,#2f7d5b);color:#fff')}>
        <div style={css('width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:18px')}>✦</div>
        <div style={css('flex:1;line-height:1.25')}>
          <div style={css('font-size:15.5px;font-weight:700')}>ผู้ช่วยเงินทอน</div>
          <div style={css('font-size:11px;opacity:0.92;display:flex;align-items:center;gap:5px')}>
            <span style={css('width:6px;height:6px;border-radius:50%;background:#a8f0c6;display:inline-block')}></span>ตอบจากข้อมูลของคุณ</div>
        </div>
        <button onClick={onClose} style={css('width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.18);color:#fff;font-size:17px;display:flex;align-items:center;justify-content:center')}>✕</button>
      </div>

      {needConsent ? (
        <ConsentPane onAccept={acceptConsent} onDecline={onClose} />
      ) : (
        <>
          {/* messages */}
          <div ref={scrollRef} className="nl-scroll" style={css('flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px')}>
            {msgs.map((m, i) => (
              <div key={i} style={css('display:flex;justify-content:' + (m.role === 'user' ? 'flex-end' : 'flex-start'))}>
                <div style={css('max-width:82%;display:flex;flex-direction:column;gap:3px;align-items:' + (m.role === 'user' ? 'flex-end' : 'flex-start'))}>
                  <div style={css(
                    'padding:11px 15px;font-size:14px;line-height:1.45;border-radius:' +
                    (m.role === 'user' ? '16px 16px 4px 16px;background:#2f7d5b;color:#fff' : '16px 16px 16px 4px;background:' + (m.system ? 'var(--fill2)' : 'var(--fill)') + ';color:var(--text)')
                  )}>{m.text}</div>
                  {m.provider && (
                    <div style={css('font-size:10.5px;color:var(--muted)')}>ตอบโดย {m.provider}</div>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div style={css('display:flex;justify-content:flex-start')}>
                <div style={css('background:var(--fill);border-radius:4px 16px 16px 16px;padding:13px 16px;display:flex;gap:5px')}>
                  <span style={css('width:7px;height:7px;border-radius:50%;background:var(--muted);animation:nlBlink 1s infinite')}></span>
                  <span style={css('width:7px;height:7px;border-radius:50%;background:var(--muted);animation:nlBlink 1s infinite .2s')}></span>
                  <span style={css('width:7px;height:7px;border-radius:50%;background:var(--muted);animation:nlBlink 1s infinite .4s')}></span>
                </div>
              </div>
            )}
          </div>

          {/* input bar */}
          <div style={css('flex:none;padding:10px 14px 28px;display:flex;align-items:center;gap:9px;border-top:1px solid var(--divider)')}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="พิมพ์ถามได้เลย…"
              style={css('flex:1;min-width:0;height:46px;border:1px solid var(--border);border-radius:23px;padding:0 18px;font-size:14px;font-family:inherit;background:var(--card);color:var(--text);outline:none')}
            />
            <button onClick={send} style={css('flex:none;width:46px;height:46px;border-radius:50%;background:#2f7d5b;color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center')}>➤</button>
          </div>
        </>
      )}
    </div>
  );
}

function ConsentPane({ onAccept, onDecline }) {
  return (
    <div style={css('flex:1;overflow-y:auto;padding:28px 22px;display:flex;flex-direction:column;justify-content:center;gap:18px')}>
      <div style={css('font-size:40px;text-align:center')}>🔐</div>
      <div style={css('font-size:18px;font-weight:700;text-align:center;color:var(--text)')}>ก่อนเริ่มใช้ผู้ช่วย AI</div>
      <div style={css('font-size:13.5px;line-height:1.6;color:var(--muted2);text-align:center')}>
        เพื่อช่วยตอบคำถามการเงินของคุณ ระบบจะส่ง<strong>สรุปตัวเลขการเงิน</strong>ของคุณ
        (ยอดคงเหลือ บิล งบประมาณ เป้าหมาย) ไปประมวลผลที่ผู้ให้บริการ AI บนคลาวด์
        โดยจะไม่ส่งข้อมูลนี้หากคุณไม่ยินยอม
      </div>
      <div style={css('display:flex;flex-direction:column;gap:10px;margin-top:6px')}>
        <button onClick={onAccept} style={css('height:48px;border-radius:14px;background:#2f7d5b;color:#fff;font-size:15px;font-weight:700;font-family:inherit')}>ยินยอมและเริ่มใช้งาน</button>
        <button onClick={onDecline} style={css('height:44px;border-radius:14px;background:var(--fill2);color:var(--muted2);font-size:14px;font-weight:600;font-family:inherit')}>ไว้ก่อน</button>
      </div>
    </div>
  );
}
