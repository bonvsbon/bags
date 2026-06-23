import { css } from '../lib/css.js';
import Onboarding from '../screens/Onboarding.jsx';
import Home from '../screens/Home.jsx';
import Detail from '../screens/Detail.jsx';
import CreateGoal from '../screens/CreateGoal.jsx';
import CreateBill from '../screens/CreateBill.jsx';
import AddTransaction from '../screens/AddTransaction.jsx';
import Transactions from '../screens/Transactions.jsx';
import Plan from '../screens/Plan.jsx';
import Bills from '../screens/Bills.jsx';
import Accounts from '../screens/Accounts.jsx';
import Goals from '../screens/Goals.jsx';
import More from '../screens/More.jsx';
import Settings from '../screens/Settings.jsx';
import BottomNav from './BottomNav.jsx';
import Sheet from './Sheet.jsx';
import Toast from './Toast.jsx';
import { ChatHead, ChatPopup } from './Chat.jsx';

export default function MobileStage({ v }) {
  return (
    <div style={css('width:100%;max-width:1040px;margin:0 auto;padding:34px 24px 0;display:flex;flex-direction:column;align-items:center;gap:22px')}>
      {/* screen chips */}
      <div className="nl-scroll" style={css('max-width:100%;overflow-x:auto;display:flex;gap:8px;padding:2px')}>
        {v.screenTabs.map((t, i) => <button key={i} onClick={t.onClick} style={css(t.style)}>{t.label}</button>)}
      </div>

      {/* hero variant switch (only on home) */}
      {v.screenHome && (
        <div style={css('display:flex;align-items:center;gap:10px;font-size:12px;color:var(--muted2)')}>
          <span>การ์ด “เงินที่ใช้ได้จริง”:</span>
          <div style={css('display:flex;background:var(--card);border:1px solid #ddd9d0;border-radius:9px;padding:3px;gap:2px')}>
            <button onClick={v.setHero1} style={css(v.hero1Style)}>แบบ A</button>
            <button onClick={v.setHero2} style={css(v.hero2Style)}>แบบ B</button>
            <button onClick={v.setHero3} style={css(v.hero3Style)}>แบบ C</button>
          </div>
        </div>
      )}

      {/* PHONE */}
      <div style={css('position:relative;width:392px;height:812px;background:#1c1e1a;border-radius:54px;padding:11px;box-shadow:0 30px 60px -20px rgba(40,42,33,0.45),0 8px 20px rgba(40,42,33,0.12)')}>
        <div className="nl-phone" data-theme={v.themeAttr} style={css('position:relative;width:100%;height:100%;background:var(--bg);border-radius:44px;overflow:hidden;display:flex;flex-direction:column')}>

          {/* status bar */}
          <div style={css('flex:none;height:50px;display:flex;align-items:flex-end;justify-content:space-between;padding:0 30px 8px;font-size:14px;font-weight:600;color:var(--text);z-index:5')}>
            <span>9:41</span>
            <div style={css('position:absolute;left:50%;top:9px;transform:translateX(-50%);width:108px;height:30px;background:#1c1e1a;border-radius:16px')}></div>
            <span style={css('display:flex;gap:6px;align-items:center')}>
              <span style={css('display:flex;gap:2px;align-items:flex-end;height:11px')}><i style={css('width:3px;height:5px;background:var(--text);border-radius:1px')}></i><i style={css('width:3px;height:7px;background:var(--text);border-radius:1px')}></i><i style={css('width:3px;height:9px;background:var(--text);border-radius:1px')}></i><i style={css('width:3px;height:11px;background:var(--text);border-radius:1px')}></i></span>
              <span style={css('display:inline-block;width:15px;height:11px;border:1.5px solid var(--text);border-radius:3px;position:relative')}><i style={css('position:absolute;inset:1.5px;width:8px;background:var(--text);border-radius:1px')}></i></span>
            </span>
          </div>

          {/* SCROLL AREA */}
          <div className="nl-scroll" style={css('flex:1;overflow-y:auto;position:relative')}>
            {v.screenOnboarding && <Onboarding v={v} />}
            {v.screenHome && <Home v={v} />}
            {v.screenDetail && <Detail v={v} />}
            {v.screenCreateGoal && <CreateGoal v={v} />}
            {v.screenCreateBill && <CreateBill v={v} />}
            {v.screenAdd && <AddTransaction v={v} />}
            {v.screenTxns && <Transactions v={v} />}
            {v.screenPlan && <Plan v={v} />}
            {v.screenBills && <Bills v={v} />}
            {v.screenAccounts && <Accounts v={v} />}
            {v.screenGoals && <Goals v={v} />}
            {v.screenMore && <More v={v} />}
            {v.screenSettings && <Settings v={v} />}
          </div>

          {v.showNav && <BottomNav v={v} />}
          {v.sheetOpen && <Sheet v={v} />}
          {v.chatHeadVisible && <ChatHead v={v} />}
          {v.aiOpen && <ChatPopup v={v} />}
          {v.toastOpen && <Toast v={v} />}
        </div>
      </div>
    </div>
  );
}
