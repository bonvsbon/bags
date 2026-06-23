import { css } from '../lib/css.js';

export default function Toast({ v }) {
  return (
    <div style={css('position:absolute;left:50%;bottom:108px;transform:translateX(-50%);background:#22251f;color:#fff;padding:12px 18px;border-radius:13px;font-size:13.5px;font-weight:500;display:flex;align-items:center;gap:9px;z-index:40;animation:nlToast .3s ease;white-space:nowrap;box-shadow:0 8px 20px rgba(0,0,0,0.25)')}>
      <span style={css('color:#7fd0a3')}>✓</span>{v.toastMsg}
    </div>
  );
}
