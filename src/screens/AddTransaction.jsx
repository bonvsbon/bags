import { css } from '../lib/css.js';

export default function AddTransaction({ v }) {
  return (
    <div style={css('min-height:100%;display:flex;flex-direction:column')}>
      {v.addSuccess && (
        <div style={css('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 30px')}>
          <div style={css('width:84px;height:84px;border-radius:50%;background:#e8f1ec;display:flex;align-items:center;justify-content:center;margin-bottom:24px;animation:nlPop .4s ease')}>
            <div style={css('width:50px;height:50px;border-radius:50%;background:#2f7d5b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px')}>✓</div>
          </div>
          <div style={css('font-size:24px;font-weight:700;margin-bottom:10px')}>บันทึกแล้ว</div>
          <div style={css('font-size:15px;color:var(--muted2);background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 18px;line-height:1.5')}>วันนี้คุณยังเหลืองบอาหารอีก<br /><span style={css('color:#2f7d5b;font-weight:700;font-size:18px')}>฿1,200</span></div>
          <button onClick={v.goHome} style={css('margin-top:28px;height:50px;padding:0 36px;border-radius:14px;background:#2f7d5b;color:#fff;font-size:15px;font-weight:600')}>เสร็จสิ้น</button>
        </div>
      )}

      {v.addForm && (
        <>
          <div style={css('flex:none;padding:8px 20px 0;display:flex;align-items:center;justify-content:space-between')}>
            <button onClick={v.goHome} style={css('font-size:15px;color:var(--muted2)')}>ยกเลิก</button>
            <div style={css('font-size:16px;font-weight:700')}>เพิ่มรายการ</div>
            <div style={css('width:44px')}></div>
          </div>
          {/* segment */}
          <div style={css('flex:none;padding:18px 20px 0')}>
            <div style={css('display:flex;background:var(--fill2);border-radius:13px;padding:4px;gap:3px')}>
              <button onClick={v.setExpense} style={css(v.segExpenseStyle)}>รายจ่าย</button>
              <button onClick={v.setIncome} style={css(v.segIncomeStyle)}>รายรับ</button>
            </div>
          </div>
          {/* amount */}
          <div style={css('flex:none;display:flex;align-items:baseline;justify-content:center;gap:8px;padding:34px 0 28px')}>
            <span style={css('font-size:30px;color:#c4c6bc;font-weight:600')}>฿</span>
            <span style={css(v.amountStyle)}>{v.addAmountDisplay}</span>
          </div>
          {/* categories */}
          <div className="nl-scroll" style={css('flex:none;padding:0 16px 16px;display:flex;gap:8px;overflow-x:auto')}>
            {v.catChips.map((c, i) => <button key={i} onClick={c.onClick} style={css(c.style)}>{c.label}</button>)}
          </div>
          {/* account + optional */}
          <div style={css('flex:none;padding:0 20px;display:flex;flex-direction:column;gap:9px')}>
            <button onClick={v.pickAccount} style={css('width:100%;display:flex;align-items:center;justify-content:space-between;background:var(--card);border:1px solid var(--border);border-radius:13px;padding:13px 15px')}>
              <span style={css('font-size:13px;color:var(--muted)')}>จ่ายจาก</span>
              <span style={css('font-size:14px;font-weight:600;display:flex;align-items:center;gap:6px')}>บัญชีหลัก<span style={css('color:#c4c6bc')}>›</span></span>
            </button>
            <div style={css('display:flex;gap:9px')}>
              <button onClick={v.pickDate} style={css('flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:var(--card);border:1px solid var(--border);border-radius:13px;padding:11px;font-size:13px;color:var(--muted2)')}>📅 วันนี้</button>
              <button onClick={v.addNote} style={css('flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:var(--card);border:1px solid var(--border);border-radius:13px;padding:11px;font-size:13px;color:var(--muted2)')}>📝 โน้ต</button>
              <button onClick={v.addReceipt} style={css('flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:var(--card);border:1px solid var(--border);border-radius:13px;padding:11px;font-size:13px;color:var(--muted2)')}>📎 ใบเสร็จ</button>
            </div>
          </div>
          <div style={css('flex:1')}></div>
          {/* keypad */}
          <div style={css('flex:none;background:var(--fill2);padding:10px 8px 4px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px')}>
            {v.keypad.map((k, i) => <button key={i} onClick={k.onClick} style={css('height:50px;border-radius:11px;background:var(--card);font-size:22px;font-weight:600;color:var(--text);box-shadow:0 1px 1px rgba(40,42,33,0.05)')}>{k.label}</button>)}
          </div>
          <div style={css('flex:none;padding:10px 16px 18px;background:var(--fill2)')}>
            <button onClick={v.saveTxn} style={css('width:100%;height:54px;border-radius:15px;background:#2f7d5b;color:#fff;font-size:16px;font-weight:600;box-shadow:0 6px 16px -4px rgba(47,125,91,0.5)')}>บันทึกรายการ</button>
          </div>
        </>
      )}
    </div>
  );
}
