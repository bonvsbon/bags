import { useReducer, useRef, useCallback } from 'react';
import { initialState, reducer, computeVals } from './store.js';
import { css } from './lib/css.js';
import MobileStage from './components/MobileStage.jsx';
import WebDashboard from './tabs/WebDashboard.jsx';
import DesignSystem from './tabs/DesignSystem.jsx';

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const toastTimer = useRef();
  const showToast = useCallback((msg) => {
    dispatch({ toast: msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => dispatch({ toast: null }), 2600);
  }, []);
  const v = computeVals(state, dispatch, showToast);

  return (
    <div style={css('min-height:100vh;width:100%;background:#e6e3da;display:flex;flex-direction:column;align-items:stretch;padding:0 0 64px')}>
      {/* TOP CONTROL BAR */}
      <div style={css('width:100%;position:sticky;top:0;z-index:50;background:rgba(244,242,236,0.85);backdrop-filter:blur(12px);border-bottom:1px solid #dcd8cf;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap')}>
        <div style={css('display:flex;align-items:center;gap:11px')}>
          <div style={css('width:30px;height:30px;border-radius:9px;background:#2f7d5b;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px')}>฿</div>
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
      </div>

      {v.isMobile && <MobileStage v={v} />}
      {v.isWeb && <WebDashboard v={v} />}
      {v.isComponents && <DesignSystem v={v} />}
    </div>
  );
}
