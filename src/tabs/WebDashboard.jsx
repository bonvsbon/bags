import { css } from '../lib/css.js';

export default function WebDashboard({ v }) {
  return (
    <div className="nl-themed" data-theme={v.themeAttr} style={css('width:1208px;margin:34px auto 0;padding:0 24px;color:var(--text)')}>
      {/* browser chrome */}
      <div style={css('background:#1c1e1a;border-radius:16px 16px 0 0;padding:11px 16px;display:flex;align-items:center;gap:14px')}>
        <div style={css('display:flex;gap:7px')}>
          <span style={css('width:11px;height:11px;border-radius:50%;background:#ff5f57')}></span>
          <span style={css('width:11px;height:11px;border-radius:50%;background:#febc2e')}></span>
          <span style={css('width:11px;height:11px;border-radius:50%;background:#28c840')}></span>
        </div>
        <div style={css('flex:1;max-width:420px;margin:0 auto;background:#33352f;border-radius:8px;padding:5px 14px;font-size:12px;color:#9a9c92;text-align:center')}>app.ngernluea.co/dashboard</div>
        <div style={css('width:54px')}></div>
      </div>

      <div style={css('display:flex;background:var(--bg);border-radius:0 0 16px 16px;overflow:hidden;min-height:760px;border:1px solid var(--border);border-top:none')}>
        {/* SIDEBAR */}
        <div style={css('width:236px;flex:none;background:var(--card);border-right:1px solid var(--divider);padding:22px 16px;display:flex;flex-direction:column')}>
          <div style={css('display:flex;align-items:center;gap:10px;padding:0 8px 22px')}>
            <div style={css('width:32px;height:32px;border-radius:9px;background:#2f7d5b;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:17px')}>฿</div>
            <span style={css('font-weight:700;font-size:16px')}>เงินทอน</span>
          </div>
          <div style={css('display:flex;flex-direction:column;gap:3px')}>
            {v.webNav.map((n, i) => (
              <div key={i} onClick={n.onClick} style={css(n.style)}>
                <span style={css('font-size:16px;width:20px;text-align:center')}>{n.icon}</span>{n.label}
              </div>
            ))}
          </div>
          <div style={css('flex:1')}></div>
          <div style={css('display:flex;align-items:center;gap:10px;padding:10px 8px;border-top:1px solid var(--divider)')}>
            <div style={css('width:34px;height:34px;border-radius:50%;background:#e8f1ec;display:flex;align-items:center;justify-content:center;color:#2f7d5b;font-weight:600;font-size:14px')}>บ</div>
            <div style={css('line-height:1.2')}>
              <div style={css('font-size:13.5px;font-weight:600')}>บอล</div>
              <div style={css('font-size:11px;color:var(--muted)')}>ดูโปรไฟล์</div>
            </div>
          </div>
        </div>

        {/* CONTENT REGION */}
        <div style={css('flex:1;display:flex;min-width:0')}>
          {v.webHome && <WebHome v={v} />}
          {v.webTxns && <WebTransactions v={v} />}
          {v.webPlan && <WebPlan v={v} />}
          {v.webBills && <WebBills v={v} />}
          {v.webAccounts && <WebAccounts v={v} />}
          {v.webGoals && <WebGoals v={v} />}
          {v.webReports && <WebReports v={v} />}
          {v.webSettings && <WebSettings v={v} />}
        </div>
      </div>
      <div style={css('height:34px')}></div>

      {v.toastOpen && (
        <div style={css('position:fixed;left:50%;bottom:36px;transform:translateX(-50%);background:#22251f;color:#fff;padding:13px 20px;border-radius:13px;font-size:14px;font-weight:500;display:flex;align-items:center;gap:9px;z-index:90;animation:nlToast .3s ease;white-space:nowrap;box-shadow:0 10px 26px rgba(0,0,0,0.28)')}>
          <span style={css('color:#7fd0a3')}>✓</span>{v.toastMsg}
        </div>
      )}
    </div>
  );
}

const scroll = 'flex:1;padding:30px 32px;overflow-y:auto;max-height:760px';

function WebHome({ v }) {
  return (
    <div style={css('flex:1;display:flex;min-width:0')}>
      <div style={css('flex:1;padding:30px 32px;min-width:0')}>
        <div style={css('display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px')}>
          <div>
            <div style={css('font-size:23px;font-weight:700;letter-spacing:-0.01em')}>สวัสดีครับ, บอล</div>
            <div style={css('font-size:13.5px;color:var(--muted);margin-top:3px')}>ภาพรวมเดือนมิถุนายน 2568</div>
          </div>
          <button onClick={v.webAddTxn} style={css('height:42px;padding:0 20px;border-radius:12px;background:#2f7d5b;color:#fff;font-size:14px;font-weight:600;display:flex;align-items:center;gap:7px')}>+ เพิ่มรายการ</button>
        </div>
        <div style={css('display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:16px')}>
          <div style={css('background:#2f7d5b;border-radius:18px;padding:22px;color:#fff;position:relative;overflow:hidden')}>
            <div style={css('position:absolute;right:-26px;top:-26px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.07)')}></div>
            <div style={css('font-size:13px;opacity:0.85')}>เงินที่ใช้ได้จริง</div>
            <div style={css('font-size:40px;font-weight:800;letter-spacing:-0.02em;margin:6px 0 4px')}>฿12,800</div>
            <div style={css('font-size:12.5px;opacity:0.8')}>หลังหักบิลและค่าใช้จ่ายที่รอแล้ว</div>
          </div>
          <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:22px')}>
            <div style={css('font-size:12.5px;color:var(--muted)')}>เงินในบัญชีทั้งหมด</div>
            <div style={css('font-size:27px;font-weight:700;margin-top:8px')}>฿50,000</div>
            <div style={css('font-size:12px;color:#3f9d6b;margin-top:8px')}>↑ มากกว่าเดือนก่อน</div>
          </div>
          <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:22px')}>
            <div style={css('font-size:12.5px;color:var(--muted)')}>ต้องกันไว้</div>
            <div style={css('font-size:27px;font-weight:700;margin-top:8px;color:#c98a3c')}>฿37,200</div>
            <div style={css('font-size:12px;color:var(--muted);margin-top:8px')}>บิล หนี้ และเป้าหมาย</div>
          </div>
        </div>
        <div style={css('display:grid;grid-template-columns:1.6fr 1fr;gap:16px;margin-top:16px')}>
          <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:22px')}>
            <div style={css('display:flex;justify-content:space-between;align-items:center;margin-bottom:20px')}>
              <span style={css('font-size:15px;font-weight:700')}>รายจ่ายรายสัปดาห์</span>
              <span style={css('font-size:12.5px;color:var(--muted)')}>4 สัปดาห์ล่าสุด</span>
            </div>
            <div style={css('display:flex;align-items:flex-end;justify-content:space-around;gap:18px;height:170px')}>
              {v.weekBars.map((w, i) => (
                <div key={i} style={css('flex:1;display:flex;flex-direction:column;align-items:center;gap:10px;height:100%;justify-content:flex-end')}>
                  <span style={css('font-size:12px;font-weight:600;color:var(--muted2)')}>{w.amount}</span>
                  <div style={css('width:100%;max-width:56px;border-radius:10px 10px 4px 4px;' + w.barStyle)}></div>
                  <span style={css('font-size:12px;color:var(--muted)')}>{w.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:22px;display:flex;flex-direction:column;justify-content:center;gap:20px')}>
            <div>
              <div style={css('display:flex;align-items:center;gap:7px;font-size:13px;color:var(--muted)')}><span style={css('width:9px;height:9px;border-radius:3px;background:#3f9d6b')}></span>เงินเข้าเดือนนี้</div>
              <div style={css('font-size:28px;font-weight:700;color:#3f9d6b;margin-top:5px')}>฿70,000</div>
            </div>
            <div style={css('height:1px;background:var(--divider)')}></div>
            <div>
              <div style={css('display:flex;align-items:center;gap:7px;font-size:13px;color:var(--muted)')}><span style={css('width:9px;height:9px;border-radius:3px;background:#d9776a')}></span>เงินออกเดือนนี้</div>
              <div style={css('font-size:28px;font-weight:700;color:#d9776a;margin-top:5px')}>฿41,800</div>
            </div>
            <div style={css('font-size:12.5px;color:#3f9d6b;background:#eef7f1;border-radius:10px;padding:9px 12px')}>↓ ใช้จ่ายน้อยกว่าเดือนก่อน 8%</div>
          </div>
        </div>
        <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px')}>
          <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:22px')}>
            <div style={css('font-size:15px;font-weight:700;margin-bottom:16px')}>งบที่ต้องระวัง</div>
            <div style={css('display:flex;flex-direction:column;gap:16px')}>
              {v.watchBudgets.map((g, i) => (
                <div key={i}>
                  <div style={css('display:flex;justify-content:space-between;align-items:center;margin-bottom:9px')}>
                    <span style={css('font-size:13.5px;font-weight:600')}>{g.name}</span>
                    <span style={css(g.tagStyle)}>{g.tag}</span>
                  </div>
                  <div style={css('height:9px;border-radius:6px;background:var(--track);overflow:hidden')}><div style={css(g.barStyle)}></div></div>
                  <div style={css('font-size:12px;color:var(--muted);margin-top:7px')}>{g.detail}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:22px')}>
            <div style={css('display:flex;justify-content:space-between;align-items:center;margin-bottom:14px')}>
              <span style={css('font-size:15px;font-weight:700')}>รายการล่าสุด</span>
              <button onClick={v.webGoTxns} style={css('font-size:12.5px;color:#2f7d5b;font-weight:600')}>ดูทั้งหมด</button>
            </div>
            <div style={css('display:flex;flex-direction:column')}>
              {v.webRecent.map((t, i) => (
                <div key={i} style={css(t.rowStyle)}>
                  <div style={css('width:36px;height:36px;border-radius:10px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:15px')}>{t.icon}</div>
                  <div style={css('flex:1')}>
                    <div style={css('font-size:13.5px;font-weight:600')}>{t.name}</div>
                    <div style={css('font-size:11.5px;color:var(--muted)')}>{t.meta}</div>
                  </div>
                  <div style={css(t.amountStyle)}>{t.amount}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* RIGHT PANEL */}
      <div style={css('width:312px;flex:none;background:var(--card);border-left:1px solid var(--divider);padding:26px 22px;display:flex;flex-direction:column;gap:22px')}>
        <div>
          <div style={css('font-size:14.5px;font-weight:700;margin-bottom:13px')}>บิลที่ใกล้ถึง</div>
          <div style={css('display:flex;flex-direction:column;gap:10px')}>
            {v.upcomingBills.map((b, i) => (
              <div key={i} style={css('background:var(--card);border:1px solid var(--border);border-radius:14px;padding:13px 14px;display:flex;align-items:center;gap:11px')}>
                <div style={css('width:34px;height:34px;border-radius:10px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:15px')}>{b.icon}</div>
                <div style={css('flex:1')}>
                  <div style={css('font-size:13.5px;font-weight:600')}>{b.name}</div>
                  <div style={css('font-size:11.5px;color:var(--muted)')}>{b.due}</div>
                </div>
                <div style={css('font-size:13.5px;font-weight:700')}>{b.amount}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={css('background:#eef7f1;border:1px solid #d6e9dd;border-radius:16px;padding:18px')}>
          <div style={css('display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#2f7d5b;margin-bottom:10px')}><span style={css('width:22px;height:22px;border-radius:7px;background:#2f7d5b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px')}>✦</span>สรุปสั้น ๆ</div>
          <div style={css('font-size:13.5px;line-height:1.65;color:#3a4d42')}>เดือนนี้ค่าอาหารสูงกว่าปกติ ฿1,100 แต่คุณยังมีเงินใช้ได้จริง ฿12,800 ลองลดค่าอาหารวันละ ฿100 ในสัปดาห์นี้ก็กลับมาอยู่ในแผนได้ครับ</div>
          <button onClick={v.webViewDetail} style={css('margin-top:14px;width:100%;height:40px;border-radius:11px;background:#2f7d5b;color:#fff;font-size:13.5px;font-weight:600')}>ดูรายละเอียด</button>
        </div>
        <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px')}>
          <div style={css('font-size:14px;font-weight:700;margin-bottom:12px')}>เป้าหมายใกล้สำเร็จ</div>
          <div style={css('display:flex;align-items:center;gap:11px;margin-bottom:10px')}>
            <div style={css('width:36px;height:36px;border-radius:11px;background:#e8f1ec;display:flex;align-items:center;justify-content:center;font-size:17px')}>🛟</div>
            <div style={css('flex:1')}>
              <div style={css('font-size:13px;font-weight:600')}>เงินฉุกเฉิน</div>
              <div style={css('font-size:11.5px;color:var(--muted)')}>฿82,000 / ฿200,000</div>
            </div>
            <span style={css('font-size:15px;font-weight:800;color:#2f7d5b')}>41%</span>
          </div>
          <div style={css('height:9px;border-radius:6px;background:var(--track);overflow:hidden')}><div style={css('height:100%;width:41%;border-radius:6px;background:linear-gradient(90deg,#3f9d6b,#2f7d5b)')}></div></div>
        </div>
      </div>
    </div>
  );
}

function WebTransactions({ v }) {
  return (
    <div className="nl-scroll" style={css(scroll)}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:22px')}>
        <div style={css('font-size:23px;font-weight:700')}>รายการทั้งหมด</div>
        <button onClick={v.webAddTxn} style={css('height:42px;padding:0 20px;border-radius:12px;background:#2f7d5b;color:#fff;font-size:14px;font-weight:600')}>+ เพิ่มรายการ</button>
      </div>
      <div style={css('display:flex;gap:8px;margin-bottom:20px')}>
        {v.txnFilters.map((f, i) => <button key={i} onClick={f.onClick} style={css(f.style)}>{f.label}</button>)}
      </div>
      <div style={css('max-width:720px;display:flex;flex-direction:column;gap:22px')}>
        {v.txnGroups.map((grp, gi) => (
          <div key={gi}>
            <div style={css('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:9px;padding:0 2px')}>
              <span style={css('font-size:13px;font-weight:600;color:var(--muted2)')}>{grp.label}</span>
              <span style={css('font-size:12px;color:var(--muted)')}>{grp.sum}</span>
            </div>
            <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden')}>
              {grp.items.map((t, i) => (
                <div key={i} style={css(t.rowStyle)}>
                  <div style={css('width:38px;height:38px;border-radius:11px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:16px')}>{t.icon}</div>
                  <div style={css('flex:1')}>
                    <div style={css('font-size:14.5px;font-weight:600')}>{t.name}</div>
                    <div style={css('font-size:12px;color:var(--muted);margin-top:1px')}>{t.cat}</div>
                  </div>
                  <div style={css(t.amountStyle)}>{t.amount}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WebPlan({ v }) {
  return (
    <div className="nl-scroll" style={css(scroll)}>
      <div style={css('font-size:23px;font-weight:700;margin-bottom:4px')}>แผนเงินเดือนนี้</div>
      <div style={css('font-size:13.5px;color:var(--muted);margin-bottom:22px')}>มิถุนายน · เหลืออีก 20 วันก่อนเงินเดือนออก</div>
      <div style={css('display:grid;grid-template-columns:1.3fr 1fr;gap:16px;margin-bottom:16px')}>
        <div style={css('background:#2f7d5b;border-radius:18px;padding:24px;color:#fff')}>
          <div style={css('font-size:13px;opacity:0.85')}>เดือนนี้คุณยังใช้ได้อีก</div>
          <div style={css('font-size:42px;font-weight:800;letter-spacing:-0.02em;margin-top:4px')}>฿12,800</div>
        </div>
        <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:22px;display:flex;align-items:center;gap:16px')}>
          <div style={css('width:54px;height:54px;border-radius:15px;background:#e8f1ec;display:flex;flex-direction:column;align-items:center;justify-content:center;flex:none;color:#2f7d5b')}>
            <span style={css('font-size:19px;font-weight:800;line-height:1')}>20</span>
            <span style={css('font-size:9px')}>วัน</span>
          </div>
          <div>
            <div style={css('font-size:13px;color:var(--muted)')}>ใช้ได้ประมาณวันละ</div>
            <div style={css('font-size:22px;font-weight:800;color:#2f7d5b')}>฿640</div>
          </div>
        </div>
      </div>
      <div style={css('font-size:15px;font-weight:700;margin:8px 0 12px')}>งบแต่ละหมวด</div>
      <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:14px')}>
        {v.planCats.map((c, i) => (
          <div key={i} style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px')}>
            <div style={css('display:flex;justify-content:space-between;align-items:center;margin-bottom:4px')}>
              <div style={css('display:flex;align-items:center;gap:9px')}><span style={css('font-size:17px')}>{c.icon}</span><span style={css('font-size:14.5px;font-weight:600')}>{c.name}</span></div>
              {c.warn && <span style={css('font-size:11px;font-weight:600;color:#c98a3c;background:#faf3e8;padding:3px 9px;border-radius:7px')}>ใกล้ถึงงบ</span>}
            </div>
            <div style={css('height:9px;border-radius:6px;background:var(--track);margin:10px 0 8px;overflow:hidden')}><div style={css(c.barStyle)}></div></div>
            <div style={css('display:flex;justify-content:space-between;font-size:12.5px')}><span style={css('color:var(--muted)')}>ใช้ไป {c.used} จาก {c.total}</span><span style={{ fontWeight: 600, color: c.leftColor }}>เหลือ {c.left}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WebBills({ v }) {
  return (
    <div className="nl-scroll" style={css(scroll)}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:22px')}>
        <div>
          <div style={css('font-size:23px;font-weight:700')}>บิลที่ต้องจ่าย</div>
          <div style={css('font-size:13.5px;color:var(--muted);margin-top:3px')}>เดือนนี้มี 4 บิล รวม ฿9,409</div>
        </div>
        <button onClick={v.webAddBill} style={css('height:42px;padding:0 20px;border-radius:12px;background:var(--card);border:1.5px dashed #cfe3d8;color:#2f7d5b;font-size:14px;font-weight:600')}>+ เพิ่มบิลประจำ</button>
      </div>
      <div style={css('max-width:720px;display:flex;flex-direction:column;gap:10px')}>
        {v.billsTimeline.map((b, i) => (
          <div key={i} style={css('background:var(--card);border:1px solid var(--border);border-radius:15px;padding:15px 18px;display:flex;align-items:center;gap:14px;' + b.cardExtra)}>
            <div style={css('width:48px;text-align:center;font-size:12px;font-weight:700;color:var(--muted2)')}>{b.date}</div>
            <div style={css('width:40px;height:40px;border-radius:12px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:18px')}>{b.icon}</div>
            <div style={css('flex:1')}>
              <div style={css('font-size:14.5px;font-weight:600')}>{b.name}</div>
              <div style={css('font-size:14px;font-weight:700;margin-top:2px')}>{b.amount}</div>
            </div>
            <span style={css(b.statusStyle)}>{b.status}</span>
            <button onClick={b.onEdit} style={css('width:34px;height:34px;border-radius:10px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:14px')}>✎</button>
            <button onClick={b.onDelete} style={css('width:34px;height:34px;border-radius:10px;background:#fbecea;color:#d9776a;display:flex;align-items:center;justify-content:center;font-size:14px')}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function WebAccounts({ v }) {
  return (
    <div className="nl-scroll" style={css(scroll)}>
      <div style={css('font-size:23px;font-weight:700;margin-bottom:22px')}>บัญชีของฉัน</div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:22px;margin-bottom:22px;max-width:420px')}>
        <div style={css('font-size:13px;color:var(--muted)')}>เงินที่มีรวมทั้งหมด</div>
        <div style={css('font-size:36px;font-weight:800;letter-spacing:-0.02em;margin-top:4px')}>฿32,000</div>
      </div>
      <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:760px')}>
        <div>
          <div style={css('font-size:13px;font-weight:700;color:var(--muted2);margin:0 0 10px 2px')}>เงินที่มี</div>
          <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden')}>
            {v.assetRows.map((a, i) => (
              <div key={i} style={css(a.rowStyle)}>
                <div style={css('width:40px;height:40px;border-radius:12px;background:#e8f1ec;display:flex;align-items:center;justify-content:center;font-size:17px')}>{a.icon}</div>
                <div style={css('flex:1;font-size:14.5px;font-weight:600')}>{a.name}</div>
                <div style={css('font-size:15px;font-weight:700')}>{a.amount}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={css('font-size:13px;font-weight:700;color:var(--muted2);margin:0 0 10px 2px')}>ยอดที่ต้องจ่าย</div>
          <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden')}>
            {v.debtRows.map((d, i) => (
              <div key={i} style={css(d.rowStyle)}>
                <div style={css('width:40px;height:40px;border-radius:12px;background:#fbecea;display:flex;align-items:center;justify-content:center;font-size:17px')}>{d.icon}</div>
                <div style={css('flex:1')}><div style={css('font-size:14.5px;font-weight:600')}>{d.name}</div><div style={css('font-size:11.5px;color:var(--muted);margin-top:1px')}>{d.sub}</div></div>
                <div style={css('font-size:15px;font-weight:700;color:#d9776a')}>{d.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WebGoals({ v }) {
  return (
    <div className="nl-scroll" style={css(scroll)}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:22px')}>
        <div style={css('font-size:23px;font-weight:700')}>เป้าหมายของฉัน</div>
        <button onClick={v.webCreateGoal} style={css('height:42px;padding:0 20px;border-radius:12px;background:var(--card);border:1.5px dashed #cfe3d8;color:#2f7d5b;font-size:14px;font-weight:600')}>+ สร้างเป้าหมาย</button>
      </div>
      <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:760px')}>
        {v.goalCards.map((g, i) => (
          <div key={i} style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:22px')}>
            <div style={css('display:flex;align-items:center;gap:12px;margin-bottom:16px')}>
              <div style={css('width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:23px;background:' + g.iconBg)}>{g.icon}</div>
              <div style={css('flex:1')}><div style={css('font-size:16px;font-weight:700')}>{g.name}</div><div style={css('font-size:12.5px;color:var(--muted);margin-top:1px')}>เป้าหมาย {g.target}</div></div>
              <div style={css('font-size:21px;font-weight:800;color:#2f7d5b')}>{g.pct}</div>
              <button onClick={g.onDelete} style={css('width:34px;height:34px;border-radius:10px;background:#fbecea;color:#d9776a;display:flex;align-items:center;justify-content:center;font-size:14px;flex:none')}>🗑</button>
            </div>
            <div style={css('height:11px;border-radius:7px;background:var(--track);overflow:hidden')}><div style={css(g.barStyle)}></div></div>
            <div style={css('display:flex;justify-content:space-between;margin-top:10px;font-size:13px')}><span style={css('color:var(--muted2)')}>เก็บแล้ว {g.saved}</span><span style={css('color:var(--muted)')}>{g.remaining}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WebReports({ v }) {
  return (
    <div className="nl-scroll" style={css(scroll)}>
      <div style={css('font-size:23px;font-weight:700;margin-bottom:4px')}>รายงาน</div>
      <div style={css('font-size:13.5px;color:var(--muted);margin-bottom:22px')}>ภาพรวมการใช้เงินเดือนมิถุนายน — เข้าใจง่าย ไม่ซับซ้อน</div>
      <div style={css('display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px')}>
        <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px')}>
          <div style={css('font-size:12.5px;color:var(--muted)')}>เงินเข้า</div>
          <div style={css('font-size:26px;font-weight:800;color:#3f9d6b;margin-top:6px')}>฿70,000</div>
        </div>
        <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px')}>
          <div style={css('font-size:12.5px;color:var(--muted)')}>เงินออก</div>
          <div style={css('font-size:26px;font-weight:800;color:#d9776a;margin-top:6px')}>฿41,800</div>
        </div>
        <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px')}>
          <div style={css('font-size:12.5px;color:var(--muted)')}>เหลือเก็บ</div>
          <div style={css('font-size:26px;font-weight:800;color:#2f7d5b;margin-top:6px')}>฿28,200</div>
        </div>
      </div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:24px;margin-bottom:16px;max-width:760px')}>
        <div style={css('font-size:15px;font-weight:700;margin-bottom:20px')}>รายจ่ายรายสัปดาห์</div>
        <div style={css('display:flex;align-items:flex-end;justify-content:space-around;gap:24px;height:200px')}>
          {v.weekBars.map((w, i) => (
            <div key={i} style={css('flex:1;display:flex;flex-direction:column;align-items:center;gap:10px;height:100%;justify-content:flex-end')}>
              <span style={css('font-size:12px;font-weight:600;color:var(--muted2)')}>{w.amount}</span>
              <div style={css('width:100%;max-width:64px;border-radius:10px 10px 4px 4px;' + w.barStyle)}></div>
              <span style={css('font-size:12px;color:var(--muted)')}>{w.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:24px;max-width:760px')}>
        <div style={css('font-size:15px;font-weight:700;margin-bottom:18px')}>รายจ่ายแยกตามหมวด</div>
        <div style={css('display:flex;flex-direction:column;gap:14px')}>
          {v.planCats.map((c, i) => (
            <div key={i}>
              <div style={css('display:flex;justify-content:space-between;font-size:13px;margin-bottom:7px')}>
                <span style={css('display:flex;align-items:center;gap:8px')}>{c.icon} {c.name}</span>
                <span style={css('color:var(--muted2);font-weight:600')}>{c.used}</span>
              </div>
              <div style={css('height:9px;border-radius:6px;background:var(--track);overflow:hidden')}><div style={css(c.barStyle)}></div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WebSettings({ v }) {
  return (
    <div className="nl-scroll" style={css(scroll)}>
      <div style={css('font-size:23px;font-weight:700;margin-bottom:22px')}>ตั้งค่า</div>
      <div style={css('max-width:620px;display:flex;flex-direction:column;gap:22px')}>
        <div>
          <div style={css('font-size:13px;font-weight:700;color:var(--muted2);margin:0 0 10px 2px')}>ธีมแอป</div>
          <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px')}>
            <div style={css('font-size:12.5px;color:var(--muted);margin-bottom:16px')}>เลือกสีพื้นของแดชบอร์ด ตัวอักษรจะปรับโทนให้อ่านง่ายอัตโนมัติ</div>
            <div style={css('display:grid;grid-template-columns:repeat(6,1fr);gap:12px')}>
              {v.themeOptions.map((t) => (
                <div key={t.key}>
                  <div onClick={t.onClick} style={css(t.swatchStyle)}><span style={css(t.tickStyle)}>✓</span></div>
                  <div style={css(t.labelStyle)}>{t.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div style={css('font-size:13px;font-weight:700;color:var(--muted2);margin:0 0 10px 2px')}>การแจ้งเตือน</div>
          <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden')}>
            <div style={css('display:flex;align-items:center;gap:14px;padding:16px 18px;border-bottom:1px solid var(--divider)')}>
              <div style={css('flex:1')}>
                <div style={css('font-size:14.5px;font-weight:500')}>เตือนก่อนบิลถึงกำหนด</div>
                <div style={css('font-size:12px;color:var(--muted);margin-top:1px')}>ล่วงหน้า 3 วัน</div>
              </div>
              <button onClick={v.swBillsClick} style={css(v.swBillsTrack)}><span style={css(v.swBillsKnob)}></span></button>
            </div>
            <div style={css('display:flex;align-items:center;gap:14px;padding:16px 18px')}>
              <div style={css('flex:1')}>
                <div style={css('font-size:14.5px;font-weight:500')}>สรุปประจำสัปดาห์</div>
                <div style={css('font-size:12px;color:var(--muted);margin-top:1px')}>ทุกเช้าวันจันทร์</div>
              </div>
              <button onClick={v.swWeeklyClick} style={css(v.swWeeklyTrack)}><span style={css(v.swWeeklyKnob)}></span></button>
            </div>
          </div>
        </div>
        <div>
          <div style={css('font-size:13px;font-weight:700;color:var(--muted2);margin:0 0 10px 2px')}>ทั่วไป</div>
          <div style={css('background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden')}>
            <div style={css('display:flex;align-items:center;gap:14px;padding:16px 18px;border-bottom:1px solid var(--divider)')}>
              <span style={css('flex:1;font-size:14.5px;font-weight:500')}>ภาษา</span>
              <span style={css('font-size:13.5px;color:var(--muted)')}>ไทย ›</span>
            </div>
            <div style={css('display:flex;align-items:center;gap:14px;padding:16px 18px')}>
              <span style={css('flex:1;font-size:14.5px;font-weight:500')}>สกุลเงิน</span>
              <span style={css('font-size:13.5px;color:var(--muted)')}>บาท (฿) ›</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
