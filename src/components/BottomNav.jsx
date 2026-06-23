import { css } from '../lib/css.js';

export default function BottomNav({ v }) {
  return (
    <div style={css('flex:none;position:relative;background:var(--card);border-top:1px solid #ece8df;padding:8px 14px 26px;display:flex;align-items:flex-end;justify-content:space-between')}>
      {v.navItems.map((n, i) => (
        <button key={i} onClick={n.onClick} style={css(n.style)}>
          <span style={css('font-size:20px;line-height:1')}>{n.icon}</span>
          <span style={css('font-size:10.5px;font-weight:500')}>{n.label}</span>
        </button>
      ))}
      <button onClick={v.goAdd} style={css('position:absolute;left:50%;top:-18px;transform:translateX(-50%);width:58px;height:58px;border-radius:20px;background:#2f7d5b;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 8px 18px -4px rgba(47,125,91,0.55);font-size:26px;font-weight:300')}>+</button>
    </div>
  );
}
