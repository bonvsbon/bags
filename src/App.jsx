import { useReducer, useRef, useCallback, useState } from 'react';
import { initialState, reducer, computeVals } from './store.js';
import { css } from './lib/css.js';
import { isFullBleed } from './lib/platform.js';
import MobileStage from './components/MobileStage.jsx';
import WebDashboard from './tabs/WebDashboard.jsx';
import DesignSystem from './tabs/DesignSystem.jsx';
import LiveApp from './live/LiveApp.jsx';

// On a real phone (mobile browser, installed PWA, or native build) skip the
// desktop showcase entirely and boot straight into the full-screen app.
const fullBleed = isFullBleed();

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [live, setLive] = useState(fullBleed);
  const toastTimer = useRef();
  const showToast = useCallback((msg) => {
    dispatch({ toast: msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => dispatch({ toast: null }), 2600);
  }, []);
  const v = computeVals(state, dispatch, showToast);

  if (live) return <LiveApp onExit={() => setLive(false)} fullBleed={fullBleed} />;

  return (
    <div style={css('min-height:100vh;width:100%;background:#e6e3da;display:flex;flex-direction:column;align-items:stretch;padding:0 0 64px')}>
      {/* TOP CONTROL BAR */}
      <div style={css('width:100%;position:sticky;top:0;z-index:50;background:rgba(244,242,236,0.85);backdrop-filter:blur(12px);border-bottom:1px solid #dcd8cf;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap')}>
        <div style={css('display:flex;align-items:center;gap:11px')}>
          <img src="/logo.svg" width="32" height="32" alt="เงินทอน" style={css('display:block')} />
          <div style={css('line-height:1.1')}>
            <div style={css('font-weight:700;font-size:16px;letter-spacing:-0.01em')}>เงินทอน</div>
            <div style={css('font-size:11px;color:var(--muted);font-weight:400')}>รู้ว่าเงินไปไหน เหลือใช้จริงเท่าไร</div>
          </div>
        </div>
        <div style={css('display:flex;background:#e9e6dd;border:1px solid #dcd8cf;border-radius:11px;padding:3px;gap:2px')}>
          <button onClick={v.setMobile} style={css(v.tabMobileStyle)}>Mobile App</button>
          <button onClick={v.setWeb} style={css(v.tabWebStyle)}>Web Dashboard</button>
          <button onClick={v.setComponents} style={css(v.tabCompStyle)}>Design System</button>
        </div>
        <button onClick={() => setLive(true)} style={css('background:#2f7d5b;color:#fff;border-radius:11px;padding:9px 16px;font-size:14px;font-weight:700;display:flex;align-items:center;gap:7px')}>
          <span style={css('width:8px;height:8px;border-radius:50%;background:#7ef0a8')}></span>
          เปิดแอปจริง
        </button>
      </div>

      {v.isMobile && <MobileStage v={v} />}
      {v.isWeb && <WebDashboard v={v} />}
      {v.isComponents && <DesignSystem v={v} />}
    </div>
  );
}
