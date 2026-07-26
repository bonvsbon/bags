import { useState } from 'react';
import { css } from '../lib/css.js';
import { api } from '../api/client.js';

export default function AuthScreen({ onAuth, onExit, fullBleed = false }) {
  const [mode, setMode] = useState('login'); // login | register
  const [email, setEmail] = useState('demo@ngernthon.app');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function go(fn) {
    setBusy(true);
    setErr('');
    try {
      await fn();
      onAuth();
    } catch (e) {
      setErr(e.detail || e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setBusy(false);
    }
  }

  const tab = (m, label) => (
    <button
      onClick={() => setMode(m)}
      style={css(
        `flex:1;height:38px;border-radius:10px;font-size:14px;font-weight:600;` +
          (mode === m ? 'background:#fff;color:#2f7d5b;box-shadow:0 1px 3px rgba(0,0,0,.08)' : 'background:transparent;color:#7c8a82')
      )}
    >
      {label}
    </button>
  );

  return (
    <div style={css('width:100%;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#eef1ec;padding:24px')}>
      <div style={css('width:100%;max-width:380px;background:#fff;border-radius:24px;padding:28px 24px;box-shadow:0 24px 60px -24px rgba(40,60,48,.35)')}>
        <div style={css('display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:22px')}>
          <img src="/logo.svg" width="58" height="58" alt="เงินทอน" style={css('display:block')} />
          <div style={css('font-size:20px;font-weight:800')}>เงินทอน</div>
          <div style={css('font-size:13px;color:#7c8a82')}>เข้าสู่ระบบเพื่อใช้ข้อมูลจริง</div>
        </div>

        <div style={css('display:flex;background:#eef1ec;border-radius:12px;padding:4px;gap:4px;margin-bottom:18px')}>
          {tab('login', 'เข้าสู่ระบบ')}
          {tab('register', 'สมัครใหม่')}
        </div>

        {mode === 'register' && (
          <input
            defaultValue={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อที่อยากให้เรียก (ไม่บังคับ)"
            style={css('width:100%;height:48px;border:1px solid #dfe4df;border-radius:12px;padding:0 14px;font-size:15px;margin-bottom:10px')}
          />
        )}
        <input
          defaultValue={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="อีเมล"
          style={css('width:100%;height:48px;border:1px solid #dfe4df;border-radius:12px;padding:0 14px;font-size:15px;margin-bottom:10px')}
        />
        <input
          defaultValue={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="รหัสผ่าน (อย่างน้อย 8 ตัว)"
          onKeyDown={(e) => e.key === 'Enter' && go(() => mode === 'login' ? api.login(email, password) : api.register(email, password, name || undefined))}
          style={css('width:100%;height:48px;border:1px solid #dfe4df;border-radius:12px;padding:0 14px;font-size:15px;margin-bottom:14px')}
        />

        {err && <div style={css('font-size:13px;color:#c0392b;margin-bottom:12px;text-align:center')}>{err}</div>}

        <button
          disabled={busy}
          onClick={() => go(() => mode === 'login' ? api.login(email, password) : api.register(email, password, name || undefined))}
          style={css('width:100%;height:50px;border-radius:14px;background:#2f7d5b;color:#fff;font-size:16px;font-weight:700;opacity:' + (busy ? '0.6' : '1'))}
        >
          {busy ? 'กำลังดำเนินการ…' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครและเริ่มใช้'}
        </button>

        <div style={css('display:flex;align-items:center;gap:10px;margin:16px 0;color:#aab4ac;font-size:12px')}>
          <div style={css('flex:1;height:1px;background:#e4e8e3')}></div>หรือ<div style={css('flex:1;height:1px;background:#e4e8e3')}></div>
        </div>

        <button
          disabled={busy}
          onClick={() => go(() => api.guest())}
          style={css('width:100%;height:48px;border-radius:14px;background:#eef1ec;color:#2f7d5b;font-size:15px;font-weight:600')}
        >
          ลองใช้แบบ Guest (ไม่ต้องสมัคร)
        </button>

        <div style={css('text-align:center;margin-top:8px')}>
          <span style={css('font-size:12px;color:#9aa69e')}>เดโม: demo@ngernthon.app / password123</span>
        </div>
      </div>

      {!fullBleed && (
        <button onClick={onExit} style={css('margin-top:18px;font-size:13px;color:#7c8a82;background:transparent')}>‹ กลับไปหน้า showcase</button>
      )}
    </div>
  );
}
