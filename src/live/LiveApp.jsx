import { useEffect, useRef, useState } from 'react';
import { css } from '../lib/css.js';
import { api, tokens } from '../api/client.js';
import AuthScreen from './AuthScreen.jsx';
import {
  LiveAdd,
  LiveBills,
  LiveDetail,
  LiveGoals,
  LiveHome,
  LiveSettings,
  LiveSheet,
  setAmountsHidden,
} from './screens.jsx';
import {
  LiveAccounts,
  LiveCreateBill,
  LiveCreateGoal,
  LiveMore,
  LiveOnboarding,
  LivePlan,
  LiveTransactions,
} from './morescreens.jsx';
import LiveWebDashboard from './webdashboard.jsx';
import LiveChat from './LiveChat.jsx';

// 4 tabs around a center "+" FAB (matches showcase BottomNav)
const NAV = [
  ['home', 'หน้าแรก', '⌂'],
  ['transactions', 'รายการ', '☰'],
  ['plan', 'แผนเงิน', '◷'],
  ['more', 'เพิ่มเติม', '⋯'],
];
// which tab is highlighted for each screen
const TAB_OF = {
  home: 'home', detail: 'home',
  transactions: 'transactions',
  plan: 'plan',
  more: 'more', bills: 'more', goals: 'more', accounts: 'more',
  settings: 'more', createBill: 'more', createGoal: 'more',
};
const NO_NAV = ['add', 'createBill', 'createGoal'];

function Shell({ onLogout, onExit, fullBleed }) {
  const [stack, setStack] = useState(['home']);
  const [theme, setTheme] = useState('light');
  const [me, setMe] = useState(null);
  const [name, setName] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [onboard, setOnboard] = useState(false);
  const [webMode, setWebMode] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef();
  const screen = stack[stack.length - 1];

  function toast(msg) {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400);
  }

  useEffect(() => {
    api.me().then(setMe).catch(() => {});
    api.getSettings().then((s) => {
      if (s?.theme) setTheme(s.theme);
      setAmountsHidden(s?.hide_amounts);
    }).catch(() => {});
    api.getProfile().then((p) => {
      if (p?.display_name) setName(p.display_name);
      if (p && !p.monthly_income) setOnboard(true); // new user -> onboarding
    }).catch(() => {});
  }, []);

  const go = (s) => setStack((st) => [...st, s]);       // drill in
  const back = () => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st));
  const goTab = (s) => setStack([s]);                   // reset to a tab
  const isActive = (tab) => TAB_OF[screen] === tab;
  const showNav = !NO_NAV.includes(screen);

  if (webMode) return <LiveWebDashboard onExit={() => setWebMode(false)} theme={theme} name={name} />;

  // Bottom nav padding: respect the device's safe area (gesture bar) when full-bleed.
  const navPad = fullBleed
    ? '8px 14px calc(12px + env(safe-area-inset-bottom, 0px))'
    : '8px 14px 26px';

  const inner = (
    <>
      {/* status bar: real device bar (safe-area spacer) when full-bleed,
          simulated notch + clock + battery in the desktop showcase mockup */}
      {fullBleed ? (
        <div style={css('flex:none;height:env(safe-area-inset-top, 0px);background:var(--bg)')}></div>
      ) : (
        <div style={css('flex:none;height:50px;display:flex;align-items:flex-end;justify-content:space-between;padding:0 30px 8px;font-size:14px;font-weight:600;color:var(--text);z-index:5')}>
          <span>9:41</span>
          <div style={css('position:absolute;left:50%;top:9px;transform:translateX(-50%);width:108px;height:30px;background:#1c1e1a;border-radius:16px')}></div>
          <span style={css('display:flex;gap:6px;align-items:center')}>
            <span style={css('display:flex;gap:2px;align-items:flex-end;height:11px')}><i style={css('width:3px;height:5px;background:var(--text);border-radius:1px')}></i><i style={css('width:3px;height:7px;background:var(--text);border-radius:1px')}></i><i style={css('width:3px;height:9px;background:var(--text);border-radius:1px')}></i><i style={css('width:3px;height:11px;background:var(--text);border-radius:1px')}></i></span>
            <span style={css('display:inline-block;width:15px;height:11px;border:1.5px solid var(--text);border-radius:3px;position:relative')}><i style={css('position:absolute;inset:1.5px;width:8px;background:var(--text);border-radius:1px')}></i></span>
          </span>
        </div>
      )}

      {onboard ? (
        <LiveOnboarding
          toast={toast}
          onDone={() => {
            setOnboard(false);
            setStack(['home']);
            api.getProfile().then((p) => p?.display_name && setName(p.display_name)).catch(() => {});
          }}
        />
      ) : (
      <>
      <div className="nl-scroll" style={css('flex:1;overflow-y:auto;position:relative')}>
        {screen === 'home' && <LiveHome go={go} name={name} openSheet={() => setSheetOpen(true)} />}
        {screen === 'detail' && <LiveDetail back={back} />}
        {screen === 'add' && <LiveAdd back={back} toast={toast} />}
        {screen === 'transactions' && <LiveTransactions go={go} />}
        {screen === 'plan' && <LivePlan />}
        {screen === 'more' && <LiveMore go={go} name={name} />}
        {screen === 'bills' && <LiveBills toast={toast} back={back} onAdd={() => { setEditItem(null); go('createBill'); }} onEdit={(b) => { setEditItem(b); go('createBill'); }} />}
        {screen === 'goals' && <LiveGoals toast={toast} back={back} onAdd={() => { setEditItem(null); go('createGoal'); }} onEdit={(g) => { setEditItem(g); go('createGoal'); }} />}
        {screen === 'accounts' && <LiveAccounts />}
        {screen === 'createBill' && <LiveCreateBill back={back} toast={toast} editing={editItem} />}
        {screen === 'createGoal' && <LiveCreateGoal back={back} toast={toast} editing={editItem} />}
        {screen === 'settings' && (
          <LiveSettings theme={theme} setTheme={setTheme} me={me} onLogout={onLogout} toast={toast} back={back} />
        )}
      </div>

      {/* bottom nav with center FAB */}
      {showNav && (
      <div style={css('flex:none;position:relative;background:var(--card);border-top:1px solid #ece8df;display:flex;align-items:flex-end;justify-content:space-between;padding:' + navPad)}>
        {NAV.slice(0, 2).map(([s, label, icon]) => (
          <button key={s} onClick={() => goTab(s)} style={css('flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px 0;color:' + (isActive(s) ? '#2f7d5b' : '#aeb0a6'))}>
            <span style={css('font-size:20px;line-height:1')}>{icon}</span>
            <span style={css('font-size:10.5px;font-weight:500')}>{label}</span>
          </button>
        ))}
        <div style={css('flex:1')}></div>
        {NAV.slice(2).map(([s, label, icon]) => (
          <button key={s} onClick={() => goTab(s)} style={css('flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px 0;color:' + (isActive(s) ? '#2f7d5b' : '#aeb0a6'))}>
            <span style={css('font-size:20px;line-height:1')}>{icon}</span>
            <span style={css('font-size:10.5px;font-weight:500')}>{label}</span>
          </button>
        ))}
        <button onClick={() => go('add')} style={css('position:absolute;left:50%;top:-18px;transform:translateX(-50%);width:58px;height:58px;border-radius:20px;background:#2f7d5b;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 8px 18px -4px rgba(47,125,91,0.55);font-size:26px;font-weight:300')}>+</button>
      </div>
      )}
      </>
      )}

      {/* AI assistant: floating head + full-screen overlay */}
      {showNav && !onboard && !aiOpen && (
        <button
          onClick={() => setAiOpen(true)}
          style={css('position:absolute;right:16px;bottom:96px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#3f9d6b,#2f7d5b);color:#fff;font-size:24px;display:flex;align-items:center;justify-content:center;z-index:35;box-shadow:0 8px 20px -4px rgba(47,125,91,0.6)')}
        >💬</button>
      )}
      {aiOpen && (
        <LiveChat
          me={me}
          onClose={() => setAiOpen(false)}
          onConsented={() => api.me().then(setMe).catch(() => {})}
        />
      )}

      {sheetOpen && (
        <LiveSheet onClose={() => setSheetOpen(false)} onPlan={() => { setSheetOpen(false); goTab('plan'); }} />
      )}

      {toastMsg && (
        <div style={css('position:absolute;left:50%;bottom:96px;transform:translateX(-50%);background:#1c1e1a;color:#fff;padding:10px 18px;border-radius:12px;font-size:13px;white-space:nowrap;z-index:40;animation:nlToast .3s ease')}>{toastMsg}</div>
      )}
    </>
  );

  // FULL-BLEED: edge-to-edge native-app layout (real phone / installed PWA / Capacitor)
  if (fullBleed) {
    return (
      <div
        className="nl-phone"
        data-theme={theme}
        style={css('position:fixed;inset:0;width:100%;height:100%;background:var(--bg);overflow:hidden;display:flex;flex-direction:column')}
      >
        {inner}
      </div>
    );
  }

  // DESKTOP SHOWCASE: phone mockup centered on a gray stage with dev controls
  return (
    <div style={css('width:100%;min-height:100vh;display:flex;flex-direction:column;align-items:center;background:#dfe3dc;padding:24px 0')}>
      <div style={css('display:flex;align-items:center;gap:10px;margin-bottom:16px')}>
        <span style={css('font-size:13px;color:#5f6b62;font-weight:600')}>เงินทอน · แอปจริง (เชื่อม API)</span>
        <button onClick={() => setWebMode(true)} style={css('font-size:12px;color:#2f7d5b;background:#e8f1ec;border-radius:8px;padding:5px 10px;font-weight:600')}>💻 เปิดแบบเว็บ</button>
        <button onClick={onExit} style={css('font-size:12px;color:#7c8a82;background:#eef1ec;border-radius:8px;padding:5px 10px')}>showcase ›</button>
      </div>

      <div style={css('position:relative;width:392px;height:812px;max-width:96vw;background:#1c1e1a;border-radius:54px;padding:11px;box-shadow:0 30px 60px -20px rgba(40,42,33,0.45)')}>
        <div className="nl-phone" data-theme={theme} style={css('position:relative;width:100%;height:100%;background:var(--bg);border-radius:44px;overflow:hidden;display:flex;flex-direction:column')}>
          {inner}
        </div>
      </div>
    </div>
  );
}

export default function LiveApp({ onExit, fullBleed = false }) {
  const [authed, setAuthed] = useState(tokens.isAuthed);
  if (!authed) return <AuthScreen onAuth={() => setAuthed(true)} onExit={onExit} fullBleed={fullBleed} />;
  return (
    <Shell
      onExit={onExit}
      fullBleed={fullBleed}
      onLogout={async () => {
        await api.logout();
        setAuthed(false);
      }}
    />
  );
}
