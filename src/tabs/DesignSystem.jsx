import { css } from '../lib/css.js';

export default function DesignSystem({ v }) {
  return (
    <div style={css('width:100%;max-width:1000px;margin:0 auto;padding:40px 24px 0')}>
      <div style={css('margin-bottom:32px')}>
        <div style={css('font-size:26px;font-weight:800;letter-spacing:-0.02em')}>ระบบดีไซน์ · เงินทอน</div>
        <div style={css('font-size:14px;color:var(--muted);margin-top:4px')}>สี ตัวอักษร และคอมโพเนนต์ที่ใช้ซ้ำทั้งแอป — สงบ เป็นมิตร อ่านง่าย</div>
      </div>

      {/* COLORS */}
      <div style={css('font-size:13px;font-weight:700;color:var(--muted2);letter-spacing:0.04em;margin-bottom:12px')}>สี</div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:22px;margin-bottom:28px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px')}>
        {v.swatches.map((c, i) => (
          <div key={i}>
            <div style={css('height:58px;border-radius:12px;' + c.box)}></div>
            <div style={css('font-size:13px;font-weight:600;margin-top:9px')}>{c.name}</div>
            <div style={css('font-size:11.5px;color:var(--muted);font-family:monospace')}>{c.hex}</div>
          </div>
        ))}
      </div>

      {/* TYPE */}
      <div style={css('font-size:13px;font-weight:700;color:var(--muted2);letter-spacing:0.04em;margin-bottom:12px')}>ตัวอักษร · Noto Sans Thai</div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:24px;margin-bottom:28px;display:flex;flex-direction:column;gap:16px')}>
        <div style={css('display:flex;align-items:baseline;gap:16px')}>
          <span style={css('font-size:46px;font-weight:800;letter-spacing:-0.03em')}>฿12,800</span>
          <span style={css('font-size:12px;color:var(--muted)')}>จำนวนเงินหลัก · 46 / 800</span>
        </div>
        <div style={css('height:1px;background:var(--divider)')}></div>
        <div style={css('display:flex;align-items:baseline;gap:16px')}>
          <span style={css('font-size:23px;font-weight:700')}>หัวข้อหน้า</span>
          <span style={css('font-size:12px;color:var(--muted)')}>23 / 700</span>
        </div>
        <div style={css('display:flex;align-items:baseline;gap:16px')}>
          <span style={css('font-size:15px;font-weight:700')}>หัวข้อส่วน</span>
          <span style={css('font-size:12px;color:var(--muted)')}>15 / 700</span>
        </div>
        <div style={css('display:flex;align-items:baseline;gap:16px')}>
          <span style={css('font-size:14px;font-weight:400')}>ข้อความเนื้อหาทั่วไป อ่านสบายตา</span>
          <span style={css('font-size:12px;color:var(--muted)')}>14 / 400</span>
        </div>
        <div style={css('display:flex;align-items:baseline;gap:16px')}>
          <span style={css('font-size:12.5px;color:var(--muted)')}>ข้อความรอง คำอธิบายเล็ก ๆ</span>
          <span style={css('font-size:12px;color:var(--muted)')}>12.5 / muted</span>
        </div>
      </div>

      {/* BUTTONS */}
      <div style={css('font-size:13px;font-weight:700;color:var(--muted2);letter-spacing:0.04em;margin-bottom:12px')}>ปุ่ม</div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:24px;margin-bottom:28px;display:flex;flex-wrap:wrap;gap:14px;align-items:center')}>
        <button style={css('height:48px;padding:0 24px;border-radius:14px;background:#2f7d5b;color:#fff;font-size:15px;font-weight:600;box-shadow:0 6px 16px -4px rgba(47,125,91,0.5)')}>ปุ่มหลัก</button>
        <button style={css('height:48px;padding:0 24px;border-radius:14px;background:var(--track);color:#3a4d42;font-size:15px;font-weight:600')}>ปุ่มรอง</button>
        <button style={css('height:48px;padding:0 24px;border-radius:14px;background:var(--card);border:1.5px dashed #cfe3d8;color:#2f7d5b;font-size:15px;font-weight:600')}>+ เพิ่มบิลประจำ</button>
        <button style={css('width:48px;height:48px;border-radius:14px;background:var(--card);border:1px solid var(--border);font-size:18px;color:var(--muted2)')}>⌕</button>
        <button style={css('height:48px;padding:0 20px;border-radius:14px;background:#fbecea;color:#d9776a;font-size:15px;font-weight:600')}>ลบรายการ</button>
      </div>

      {/* INPUTS + chips + selector */}
      <div style={css('font-size:13px;font-weight:700;color:var(--muted2);letter-spacing:0.04em;margin-bottom:12px')}>ฟิลด์ & ตัวเลือก</div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:24px;margin-bottom:28px;display:grid;grid-template-columns:1fr 1fr;gap:24px')}>
        <div style={css('display:flex;flex-direction:column;gap:14px')}>
          <div>
            <div style={css('font-size:12px;color:var(--muted);margin-bottom:6px')}>ช่องกรอกข้อความ</div>
            <div style={css('height:48px;border:1px solid #e0ddd4;border-radius:13px;display:flex;align-items:center;padding:0 14px;font-size:14px;color:var(--text)')}>ค่ากาแฟเช้านี้</div>
          </div>
          <div>
            <div style={css('font-size:12px;color:var(--muted);margin-bottom:6px')}>ช่องกรอกจำนวนเงิน</div>
            <div style={css('height:60px;border:1.5px solid #2f7d5b;border-radius:13px;display:flex;align-items:center;justify-content:center;gap:6px')}>
              <span style={css('font-size:22px;color:#c4c6bc')}>฿</span>
              <span style={css('font-size:30px;font-weight:800;letter-spacing:-0.02em')}>145</span>
            </div>
          </div>
          <div>
            <div style={css('font-size:12px;color:var(--muted);margin-bottom:6px')}>เลือกบัญชี</div>
            <div style={css('height:48px;border:1px solid #e0ddd4;border-radius:13px;display:flex;align-items:center;justify-content:space-between;padding:0 14px')}>
              <span style={css('font-size:13px;color:var(--muted)')}>จ่ายจาก</span>
              <span style={css('font-size:14px;font-weight:600')}>บัญชีหลัก ›</span>
            </div>
          </div>
        </div>
        <div style={css('display:flex;flex-direction:column;gap:14px')}>
          <div>
            <div style={css('font-size:12px;color:var(--muted);margin-bottom:8px')}>หมวด (chip)</div>
            <div style={css('display:flex;flex-wrap:wrap;gap:8px')}>
              <span style={css('padding:9px 15px;border-radius:20px;background:#2f7d5b;color:#fff;font-size:13px;font-weight:500')}>อาหาร</span>
              <span style={css('padding:9px 15px;border-radius:20px;background:var(--card);border:1px solid #e6e2d9;color:var(--muted2);font-size:13px')}>เดินทาง</span>
              <span style={css('padding:9px 15px;border-radius:20px;background:var(--card);border:1px solid #e6e2d9;color:var(--muted2);font-size:13px')}>ช้อปปิ้ง</span>
            </div>
          </div>
          <div>
            <div style={css('font-size:12px;color:var(--muted);margin-bottom:8px')}>ตัวกรอง (chip)</div>
            <div style={css('display:flex;flex-wrap:wrap;gap:8px')}>
              <span style={css('padding:9px 16px;border-radius:11px;background:#22251f;color:#fff;font-size:13px;font-weight:600')}>ทั้งหมด</span>
              <span style={css('padding:9px 16px;border-radius:11px;background:var(--card);border:1px solid #ddd9d0;color:var(--muted2);font-size:13px;font-weight:600')}>รายจ่าย</span>
            </div>
          </div>
          <div>
            <div style={css('font-size:12px;color:var(--muted);margin-bottom:8px')}>สเต็ปเปอร์ / Segment</div>
            <div style={css('display:inline-flex;background:var(--fill2);border-radius:13px;padding:4px;gap:3px')}>
              <span style={css('padding:9px 22px;border-radius:10px;background:var(--card);color:#d9776a;font-size:14px;font-weight:600;box-shadow:0 1px 2px rgba(40,42,33,0.1)')}>รายจ่าย</span>
              <span style={css('padding:9px 22px;border-radius:10px;color:#8a8c82;font-size:14px;font-weight:600')}>รายรับ</span>
            </div>
          </div>
        </div>
      </div>

      {/* progress + badges */}
      <div style={css('font-size:13px;font-weight:700;color:var(--muted2);letter-spacing:0.04em;margin-bottom:12px')}>Progress & สถานะ</div>
      <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:24px;margin-bottom:28px;display:grid;grid-template-columns:1fr 1fr;gap:28px')}>
        <div style={css('display:flex;flex-direction:column;gap:16px')}>
          <Bar label="ปกติ" pct="40%" labelColor="var(--muted2)" pctColor="var(--muted)" barColor="#2f7d5b" />
          <Bar label="ใกล้ถึงงบ" pct="80%" labelColor="var(--muted2)" pctColor="#c98a3c" barColor="#c98a3c" />
          <Bar label="เกินงบ" pct="100%" labelColor="var(--muted2)" pctColor="#d9776a" barColor="#d9776a" />
        </div>
        <div style={css('display:flex;flex-wrap:wrap;gap:10px;align-content:flex-start')}>
          <span style={css('font-size:12px;font-weight:600;padding:6px 12px;border-radius:9px;background:#e8f1ec;color:#2f7d5b')}>จ่ายแล้ว</span>
          <span style={css('font-size:12px;font-weight:600;padding:6px 12px;border-radius:9px;background:#faf3e8;color:#c98a3c')}>อีก 3 วัน</span>
          <span style={css('font-size:12px;font-weight:600;padding:6px 12px;border-radius:9px;background:#fbecea;color:#d9776a')}>เลยกำหนด</span>
          <span style={css('font-size:12px;font-weight:600;padding:6px 12px;border-radius:9px;background:var(--track);color:var(--muted)')}>รอดำเนินการ</span>
          <span style={css('font-size:12px;font-weight:600;padding:6px 12px;border-radius:9px;background:#eef7f1;color:#3f9d6b')}>รายรับ</span>
        </div>
      </div>

      {/* list items + cards */}
      <div style={css('font-size:13px;font-weight:700;color:var(--muted2);letter-spacing:0.04em;margin-bottom:12px')}>รายการ & การ์ด</div>
      <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px')}>
        <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:8px 16px')}>
          <div style={css('display:flex;align-items:center;gap:13px;padding:13px 0;border-bottom:1px solid var(--divider)')}>
            <div style={css('width:38px;height:38px;border-radius:11px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:16px')}>☕</div>
            <div style={css('flex:1')}>
              <div style={css('font-size:14.5px;font-weight:600')}>Starbucks</div>
              <div style={css('font-size:12px;color:var(--muted)')}>อาหาร · วันนี้</div>
            </div>
            <div style={css('font-size:15px;font-weight:700')}>-฿145</div>
          </div>
          <div style={css('display:flex;align-items:center;gap:13px;padding:13px 0')}>
            <div style={css('width:38px;height:38px;border-radius:11px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:16px')}>💰</div>
            <div style={css('flex:1')}>
              <div style={css('font-size:14.5px;font-weight:600')}>เงินเดือน</div>
              <div style={css('font-size:12px;color:var(--muted)')}>รายรับ · 25 มิ.ย.</div>
            </div>
            <div style={css('font-size:15px;font-weight:700;color:#3f9d6b')}>+฿70,000</div>
          </div>
        </div>
        <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:16px;display:flex;align-items:center;gap:12px')}>
          <div style={css('width:38px;height:38px;border-radius:11px;background:var(--fill);display:flex;align-items:center;justify-content:center;font-size:17px')}>🌐</div>
          <div style={css('flex:1')}>
            <div style={css('font-size:14.5px;font-weight:600')}>Internet</div>
            <div style={css('font-size:14px;font-weight:700;margin-top:2px')}>฿699</div>
          </div>
          <span style={css('font-size:11.5px;font-weight:600;padding:4px 10px;border-radius:8px;background:#e8f1ec;color:#2f7d5b')}>อีก 3 วัน</span>
        </div>
      </div>

      {/* states */}
      <div style={css('font-size:13px;font-weight:700;color:var(--muted2);letter-spacing:0.04em;margin-bottom:12px')}>สถานะพิเศษ — ว่าง / สำเร็จ / Toast / Modal</div>
      <div style={css('display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:50px')}>
        <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:28px 20px;display:flex;flex-direction:column;align-items:center;text-align:center')}>
          <div style={css('width:60px;height:60px;border-radius:18px;background:var(--track);display:flex;align-items:center;justify-content:center;font-size:26px;margin-bottom:14px')}>🧾</div>
          <div style={css('font-size:15px;font-weight:700')}>ยังไม่มีรายการ</div>
          <div style={css('font-size:12.5px;color:var(--muted);margin-top:4px;line-height:1.5')}>เริ่มบันทึกรายจ่ายแรกได้เลย</div>
        </div>
        <div style={css('background:var(--card);border:1px solid var(--border);border-radius:18px;padding:28px 20px;display:flex;flex-direction:column;align-items:center;text-align:center')}>
          <div style={css('width:60px;height:60px;border-radius:50%;background:#e8f1ec;display:flex;align-items:center;justify-content:center;margin-bottom:14px')}>
            <div style={css('width:36px;height:36px;border-radius:50%;background:#2f7d5b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px')}>✓</div>
          </div>
          <div style={css('font-size:15px;font-weight:700')}>บันทึกแล้ว</div>
          <div style={css('font-size:12.5px;color:var(--muted);margin-top:4px;line-height:1.5')}>ยังเหลืองบอาหารอีก ฿1,200</div>
        </div>
        <div style={css('display:flex;flex-direction:column;gap:14px;justify-content:center')}>
          <div style={css('background:#22251f;color:#fff;padding:12px 18px;border-radius:13px;font-size:13.5px;font-weight:500;display:flex;align-items:center;gap:9px')}>
            <span style={css('color:#7fd0a3')}>✓</span>บันทึกรายการแล้ว</div>
          <div style={css('background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:0 8px 24px -12px rgba(40,42,33,0.2)')}>
            <div style={css('font-size:14px;font-weight:700;margin-bottom:6px')}>ลบรายการนี้?</div>
            <div style={css('font-size:12.5px;color:var(--muted);margin-bottom:12px')}>การลบไม่สามารถย้อนกลับได้</div>
            <div style={css('display:flex;gap:8px')}>
              <button style={css('flex:1;height:38px;border-radius:10px;background:var(--fill2);color:var(--muted2);font-size:13px;font-weight:600')}>ยกเลิก</button>
              <button style={css('flex:1;height:38px;border-radius:10px;background:#d9776a;color:#fff;font-size:13px;font-weight:600')}>ลบ</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bar({ label, pct, labelColor, pctColor, barColor }) {
  return (
    <div>
      <div style={css('display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:7px')}>
        <span style={{ color: labelColor }}>{label}</span>
        <span style={{ color: pctColor }}>{pct}</span>
      </div>
      <div style={css('height:9px;border-radius:6px;background:var(--track);overflow:hidden')}>
        <div style={css('height:100%;border-radius:6px;width:' + pct + ';background:' + barColor)}></div>
      </div>
    </div>
  );
}
