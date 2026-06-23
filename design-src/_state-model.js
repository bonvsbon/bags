
class Component extends DCLogic {
  state = {
    view: 'mobile',        // mobile | web | components
    screen: 'onboarding',  // onboarding | home | add | transactions | plan | bills | accounts | goals
    hero: 3,
    onbStep: 1,            // 1..4, 5 = done
    payDay: 25,            // number 1..31 or 'eom'
    onbIncome: 70000,
    recurring: ['ค่าบ้าน / ค่าเช่า','บัตรเครดิต','Internet'],
    customRecurring: [],
    customDraft: '',
    goalPick: 'มีเงินเหลือปลายเดือน',
    addType: 'expense',
    addAmount: 0,
    addCat: 'อาหาร',
    addSuccess: false,
    sheetOpen: false,
    toast: null,
    txns: [],
    txnFilter: 'all',   // all | expense | income | month
    demoEmpty: false,
    mode: 'beginner',   // beginner | advanced
    toggles: { bills:true, budget:true, weekly:false, biometric:true, hideAmounts:false },
    theme: 'light',  // light | mint | sky | sand | dark | midnight
    webScreen: 'home',
    goals: [
      {id:'g1',icon:'🛟',iconBg:'#e8f1ec',name:'เงินฉุกเฉิน',target:200000,saved:82000},
      {id:'g2',icon:'🗾',iconBg:'#eaf0f7',name:'เที่ยวญี่ปุ่น',target:50000,saved:12500},
    ],
    bills: [
      {id:'b1',date:'23 มิ.ย.',icon:'🎬',name:'Netflix',amt:105,status:'อีก 1 วัน',state:'soon',day:23,cycle:'monthly',remind:1},
      {id:'b2',date:'25 มิ.ย.',icon:'🌐',name:'Internet',amt:699,status:'อีก 3 วัน',state:'upcoming',day:25,cycle:'monthly',remind:3},
      {id:'b3',date:'30 มิ.ย.',icon:'💳',name:'บัตรเครดิต',amt:8500,status:'อีก 8 วัน',state:'upcoming',day:30,cycle:'monthly',remind:7},
      {id:'b4',date:'15 มิ.ย.',icon:'📱',name:'ค่าโทรศัพท์',amt:399,status:'จ่ายแล้ว',state:'paid',day:15,cycle:'monthly',remind:3},
    ],
    goalDraft: { icon:'🎯', name:'', target:0, monthly:5000 },
    billDraft: { id:null, icon:'📄', name:'', amount:0, day:25, cycle:'monthly', remind:3 },
    aiOpen: false,     // messenger-style popup open
    aiChat: [],        // {role:'ai'|'me', kind:'text'|'goal', ...}
    aiInput: '',       // typed message
    aiThinking: false,
    aiGreeted: false,  // seeded greeting yet
    aiPendingGoal: null, // {name,target} parsed, awaiting confirm
  };

  fmt(n){ return '฿' + Math.round(Math.abs(n)).toLocaleString('en-US'); }

  tab(active){
    return 'padding:7px 14px;border-radius:8px;font-size:13px;font-weight:600;font-family:inherit;transition:.15s;' +
      (active ? 'background:var(--card);color:var(--text);box-shadow:0 1px 2px rgba(40,42,33,0.12)' : 'background:transparent;color:#8a8c82');
  }
  chip(active){
    return 'flex:none;padding:9px 16px;border-radius:11px;font-size:13px;font-weight:600;font-family:inherit;white-space:nowrap;transition:.15s;' +
      (active ? 'background:#22251f;color:#fff' : 'background:var(--card);color:var(--muted2);border:1px solid #ddd9d0');
  }
  miniTab(active){
    return 'padding:5px 12px;border-radius:7px;font-size:12px;font-weight:600;font-family:inherit;' +
      (active ? 'background:#2f7d5b;color:#fff' : 'background:transparent;color:#8a8c82');
  }

  go(screen){ this.setState({ screen, addSuccess:false }); }

  renderVals(){
    const s = this.state;
    const set = (p)=>()=>this.setState(p);

    // ---- top tabs ----
    const isMobile = s.view==='mobile', isWeb = s.view==='web', isComponents = s.view==='components';

    // ---- screen chips ----
    const screenList = [
      ['onboarding','เริ่มต้นใช้งาน'],['home','หน้าแรก'],['add','เพิ่มรายการ'],
      ['transactions','รายการ'],['plan','แผนเงิน'],['bills','บิล'],
      ['accounts','บัญชี'],['goals','เป้าหมาย'],
    ];
    const screenTabs = screenList.map(([k,label])=>({
      label, onClick: ()=>this.go(k), style: this.chip(s.screen===k)
    }));

    // ---- onboarding ----
    const onbDots = [1,2,3,4].map(i=>({
      style:'flex:1;height:5px;border-radius:3px;background:'+((i<=Math.min(s.onbStep,4))?'#2f7d5b':'#e3e0d7')
    }));
    const payDays = [1,5,10,15,25,28].map(d=>({
      label:'ทุกวันที่ '+d, onClick:set({payDay:d}),
      style:'padding:14px 6px;border-radius:14px;font-size:13.5px;font-weight:600;font-family:inherit;'+
        (s.payDay===d?'background:#e8f1ec;border:1.5px solid #2f7d5b;color:#2f7d5b':'background:var(--card);border:1px solid #e6e2d9;color:var(--muted2)')
    }));
    const payEomActive = s.payDay==='eom';
    const payEomClick = set({payDay:'eom'});
    const payEomStyle = 'width:100%;margin-top:10px;padding:14px;border-radius:14px;font-size:13.5px;font-weight:600;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;'+
      (payEomActive?'background:#e8f1ec;border:1.5px solid #2f7d5b;color:#2f7d5b':'background:var(--card);border:1px solid #e6e2d9;color:var(--muted2)');

    // step 2 income — editable via keypad
    const onbIncomeDisplay = (s.onbIncome||0).toLocaleString('en-US');
    const incTap = (d)=> this.setState(st=>({onbIncome: Math.min((st.onbIncome*Math.pow(10,(''+d).length))+Number(d), 9999999)}));
    const onbKeypad = ['1','2','3','4','5','6','7','8','9','000','0','⌫'].map(k=>({
      label:k, onClick: k==='⌫' ? ()=>this.setState(st=>({onbIncome: Math.floor(st.onbIncome/10)})) : ()=>incTap(k)
    }));
    const incomePresets = [30000,70000,120000].map(v=>({
      label:'฿'+v.toLocaleString('en-US'), onClick:set({onbIncome:v}),
      style:'font-size:13px;padding:8px 14px;border-radius:20px;font-family:inherit;'+
        (s.onbIncome===v?'background:#e8f1ec;border:1px solid #cfe3d8;color:#2f7d5b;font-weight:600':'background:var(--card);border:1px solid #e6e2d9;color:var(--muted2)')
    }));

    const recurNames = ['ค่าบ้าน / ค่าเช่า','ค่ารถ','บัตรเครดิต','ค่าโทรศัพท์','Internet','Streaming','อื่น ๆ'];
    const otherOn = s.recurring.includes('อื่น ๆ');
    const customChips = s.customRecurring.map(n=>({ label:n,
      onClick:()=>this.setState(st=>({customRecurring:st.customRecurring.filter(x=>x!==n)})) }));
    const customDraft = s.customDraft;
    const onCustomInput = (e)=> this.setState({customDraft:e.target.value});
    const addCustom = ()=>{ const v=(s.customDraft||'').trim(); if(!v) return;
      this.setState(st=>({customRecurring: st.customRecurring.includes(v)?st.customRecurring:[...st.customRecurring,v], customDraft:''})); };
    const recurringOptions = recurNames.map(n=>{
      const on = s.recurring.includes(n);
      return { label:n, onClick:()=>this.setState(st=>({recurring: on?st.recurring.filter(x=>x!==n):[...st.recurring,n]})),
        style:'display:flex;align-items:center;justify-content:space-between;text-align:left;padding:15px 14px;border-radius:14px;font-family:inherit;'+
          (on?'background:#e8f1ec;border:1.5px solid #2f7d5b;color:var(--text)':'background:var(--card);border:1px solid #e6e2d9;color:var(--muted2)'),
        checkStyle:'width:20px;height:20px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:12px;'+
          (on?'background:#2f7d5b;color:#fff':'background:#f0ede5;color:transparent;border:1px solid #e0ddd4') };
    });
    const goalNames = ['มีเงินเหลือปลายเดือน','เก็บเงิน','ลดหนี้','คุมรายจ่าย','เริ่มลงทุน'];
    const goalOptions = goalNames.map(n=>{
      const on = s.goalPick===n;
      return { label:n, onClick:set({goalPick:n}),
        style:'display:flex;align-items:center;gap:14px;text-align:left;padding:16px 16px;border-radius:14px;font-family:inherit;'+
          (on?'background:#e8f1ec;border:1.5px solid #2f7d5b;color:var(--text)':'background:var(--card);border:1px solid #e6e2d9;color:var(--muted2)'),
        dotStyle:'width:20px;height:20px;border-radius:50%;flex:none;'+
          (on?'background:#2f7d5b;border:5px solid #cfe3d8':'background:var(--card);border:2px solid #d8d4cb') };
    });
    const onbNext = ()=>{
      if(s.onbStep>=5){ this.setState({view:'mobile',screen:'home'}); return; }
      this.setState(st=>({onbStep: st.onbStep+1}));
    };
    const onbBack = ()=> this.setState(st=>({onbStep: Math.max(1, st.onbStep-1)}));
    const onbCtaLabel = s.onbStep>=5 ? 'เริ่มใช้งาน' : (s.onbStep===4 ? 'เสร็จสิ้น' : 'ถัดไป');

    // ---- bills ----
    const upcomingBills = [
      {icon:'🌐',name:'Internet',due:'อีก 3 วัน',amount:'฿699'},
      {icon:'💳',name:'บัตรเครดิต',due:'อีก 6 วัน',amount:'฿8,500'},
      {icon:'🎬',name:'Netflix',due:'อีก 8 วัน',amount:'฿105'},
    ].map((b,i,a)=>({...b, rowStyle:'display:flex;align-items:center;gap:13px;padding:14px 16px;'+(i<a.length-1?'border-bottom:1px solid var(--divider)':'')}));

    // ---- watch budgets ----
    const watchBudgets = [
      {name:'อาหาร',pct:80,tag:'ใกล้ถึงงบที่ตั้งไว้',detail:'ใช้ไป ฿4,800 จาก ฿6,000 · เหลือ ฿1,200',color:'#c98a3c',bg:'#faf3e8'},
      {name:'ช้อปปิ้ง',pct:90,tag:'ใช้ไปแล้ว 90%',detail:'ใช้ไป ฿1,800 จาก ฿2,000 · เหลือ ฿200',color:'#d9776a',bg:'#fbecea'},
    ].map(g=>({
      name:g.name, tag:g.tag, detail:g.detail,
      tagStyle:'font-size:11.5px;font-weight:600;padding:4px 10px;border-radius:8px;color:'+g.color+';background:'+g.bg,
      barStyle:'height:100%;width:'+g.pct+'%;border-radius:6px;background:'+g.color
    }));

    // ---- recent txns (seed + user added) ----
    const seed = [
      {icon:'☕',name:'Starbucks',cat:'อาหาร',day:'วันนี้',amt:-145},
      {icon:'🚗',name:'Grab',cat:'เดินทาง',day:'วันนี้',amt:-119},
      {icon:'🏪',name:'7-Eleven',cat:'ของใช้',day:'เมื่อวาน',amt:-220},
      {icon:'💰',name:'เงินเดือน',cat:'รายรับ',day:'25 มิ.ย.',amt:70000},
    ];
    const allTxns = [...s.txns, ...seed];
    const recentTxns = allTxns.slice(0,3).map((t,i,a)=>({
      icon:t.icon, name:t.name, meta:t.cat+' · '+t.day,
      amount:(t.amt>=0?'+':'-')+this.fmt(t.amt),
      amountStyle:'font-size:15px;font-weight:700;color:'+(t.amt>=0?'#3f9d6b':'var(--text)'),
      rowStyle:'display:flex;align-items:center;gap:13px;padding:14px 16px;'+(i<a.length-1?'border-bottom:1px solid var(--divider)':'')
    }));

    // ---- transactions screen ----
    const filterDefs = [['all','ทั้งหมด'],['expense','รายจ่าย'],['income','รายรับ'],['month','เดือนนี้']];
    const txnFilters = filterDefs.map(([k,label])=>({label,onClick:()=>this.setState({txnFilter:k}),style:this.chip(s.txnFilter===k)}));
    const filtered = allTxns.filter(t=> s.txnFilter==='expense'? t.amt<0 : s.txnFilter==='income'? t.amt>0 : true);
    const order = ['วันนี้','เมื่อวาน','25 มิ.ย.'];
    const txnGroups = order.map(label=>{
      const items = filtered.filter(t=>t.day===label);
      if(!items.length) return null;
      const sum = items.reduce((a,t)=>a+t.amt,0);
      return { label, sum:(sum>=0?'+':'-')+this.fmt(sum), items: items.map((t,i,a)=>({
        icon:t.icon, name:t.name, cat:t.cat,
        amount:(t.amt>=0?'+':'-')+this.fmt(t.amt),
        amountStyle:'font-size:15px;font-weight:700;color:'+(t.amt>=0?'#3f9d6b':'var(--text)'),
        rowStyle:'display:flex;align-items:center;gap:13px;padding:14px 16px;'+(i<a.length-1?'border-bottom:1px solid var(--divider)':'')
      })) };
    }).filter(Boolean);
    const txnEmpty = s.demoEmpty;
    const txnHasItems = !s.demoEmpty && txnGroups.length>0;

    // ---- plan categories ----
    const planCats = [
      {icon:'🍜',name:'อาหาร',used:4800,total:6000,color:'#c98a3c',warn:true},
      {icon:'🚗',name:'เดินทาง',used:1250,total:3000,color:'#2f7d5b',warn:false},
      {icon:'🛍️',name:'ช้อปปิ้ง',used:1800,total:2000,color:'#d9776a',warn:true},
      {icon:'🛒',name:'ของใช้',used:900,total:2500,color:'#2f7d5b',warn:false},
      {icon:'💊',name:'สุขภาพ',used:300,total:1500,color:'#2f7d5b',warn:false},
    ].map(c=>{const pct=Math.min(100,Math.round(c.used/c.total*100));const left=c.total-c.used;return{
      icon:c.icon,name:c.name,warn:c.warn,used:this.fmt(c.used),total:this.fmt(c.total),left:this.fmt(left),
      leftColor:c.warn?'#c98a3c':'#2f7d5b',
      barStyle:'height:100%;width:'+pct+'%;border-radius:6px;background:'+c.color };});

    // ---- bills timeline ----
    const editBill = (b)=>this.setState({billDraft:{id:b.id,icon:b.icon,name:b.name,amount:b.amt,day:b.day,cycle:b.cycle,remind:b.remind}, screen:'createBill'});
    const deleteBill = (b)=>{ this.setState(st=>({bills:st.bills.filter(x=>x.id!==b.id)})); toast('ลบบิล “'+b.name+'” แล้ว'); };
    const billsTimeline = s.bills.map(b=>{
      const paid=b.state==='paid', soon=b.state==='soon';
      return {date:b.date,icon:b.icon,name:b.name,amount:this.fmt(b.amt),status:b.status,
        onEdit:()=>editBill(b), onDelete:()=>deleteBill(b),
        dotStyle:'width:14px;height:14px;border-radius:50%;border:3px solid var(--bg);background:'+(paid?'#c5c8bf':soon?'#c98a3c':'#2f7d5b'),
        cardExtra: paid?'opacity:0.62':'',
        statusStyle:'font-size:11.5px;font-weight:600;padding:4px 10px;border-radius:8px;white-space:nowrap;'+
          (paid?'background:var(--track);color:var(--muted)':soon?'background:#faf3e8;color:#c98a3c':'background:#e8f1ec;color:#2f7d5b')};
    });

    // ---- accounts ----
    const assetRows = [
      {icon:'🏦',name:'บัญชีหลัก',amt:28500},{icon:'💵',name:'เงินสด',amt:1200},{icon:'📲',name:'e-Wallet',amt:2300},
    ].map((a,i,arr)=>({icon:a.icon,name:a.name,amount:this.fmt(a.amt),rowStyle:'display:flex;align-items:center;gap:13px;padding:15px 16px;'+(i<arr.length-1?'border-bottom:1px solid var(--divider)':'')}));
    const debtRows = [
      {icon:'💳',name:'บัตรเครดิต KTC',sub:'ครบกำหนด 30 มิ.ย.',amt:8500},
      {icon:'🏠',name:'สินเชื่อบ้าน',sub:'ผ่อนเดือนละ ฿24,000',amt:5700000},
    ].map((d,i,arr)=>({icon:d.icon,name:d.name,sub:d.sub,amount:'-'+this.fmt(d.amt),rowStyle:'display:flex;align-items:center;gap:13px;padding:15px 16px;'+(i<arr.length-1?'border-bottom:1px solid var(--divider)':'')}));

    // ---- goals ----
    const deleteGoal = (g)=>{ this.setState(st=>({goals:st.goals.filter(x=>x.id!==g.id)})); toast('ลบเป้าหมาย “'+g.name+'” แล้ว'); };
    const goalCards = s.goals.map(g=>{const pct=g.target>0?Math.min(100,Math.round(g.saved/g.target*100)):0;return{
      icon:g.icon,iconBg:g.iconBg,name:g.name,target:this.fmt(g.target),saved:this.fmt(g.saved),
      pct:pct+'%',remaining:'เหลืออีก '+this.fmt(g.target-g.saved), onDelete:()=>deleteGoal(g),
      barStyle:'height:100%;width:'+pct+'%;border-radius:7px;background:linear-gradient(90deg,#3f9d6b,#2f7d5b)' };});

    // ---- create goal form ----
    const gd = s.goalDraft;
    const goalIconChoices = ['🎯','🛟','🏠','🚗','✈️','🎓','💍','📱','🐶','🎮'].map(ic=>({
      icon:ic, onClick:()=>this.setState(st=>({goalDraft:{...st.goalDraft,icon:ic}})),
      style:'width:46px;height:46px;border-radius:13px;font-size:21px;display:flex;align-items:center;justify-content:center;flex:none;cursor:pointer;'+
        (gd.icon===ic?'background:#e8f1ec;border:2px solid #2f7d5b':'background:var(--fill);border:1px solid var(--border)')
    }));
    const onGoalName = (e)=> this.setState(st=>({goalDraft:{...st.goalDraft,name:e.target.value}}));
    const parseAmt = (v)=> Math.min(Number((''+v).replace(/[^\d]/g,''))||0, 99999999);
    const onGoalTarget = (e)=> this.setState(st=>({goalDraft:{...st.goalDraft,target:parseAmt(e.target.value)}}));
    const onGoalMonthly = (e)=> this.setState(st=>({goalDraft:{...st.goalDraft,monthly:parseAmt(e.target.value)}}));
    const goalTargetDisplay = gd.target? String(gd.target) : '';
    const goalMonthlyDisplay = gd.monthly? String(gd.monthly) : '';
    const goalTargetPretty = gd.target? '฿'+gd.target.toLocaleString('en-US') : '';
    const goalMonthlyPretty = gd.monthly? '฿'+gd.monthly.toLocaleString('en-US') : '';
    const goalEtaMonths = (gd.target>0 && gd.monthly>0) ? Math.ceil(gd.target/gd.monthly) : 0;
    const goalValid = gd.name.trim().length>0 && gd.target>0;
    const saveGoal = ()=>{
      if(!goalValid) { toast('ใส่ชื่อและจำนวนเงินเป้าหมายก่อนนะ'); return; }
      const g={id:'g'+Date.now(),icon:gd.icon,iconBg:'#e8f1ec',name:gd.name.trim(),target:gd.target,saved:0};
      this.setState(st=>({goals:[g,...st.goals], goalDraft:{icon:'🎯',name:'',target:0,monthly:5000}, screen:'goals'}));
      toast('สร้างเป้าหมาย “'+g.name+'” แล้ว');
    };
    const goalSaveStyle = 'width:100%;height:54px;border-radius:15px;font-size:16px;font-weight:600;font-family:inherit;'+
      (goalValid?'background:#2f7d5b;color:#fff;box-shadow:0 6px 16px -4px rgba(47,125,91,0.5)':'background:var(--track);color:var(--muted)');

    // ---- create bill form ----
    const bd = s.billDraft;
    const billIconChoices = ['📄','🌐','📱','🎬','💳','🏠','🚗','💡','💧','🛡️'].map(ic=>({
      icon:ic, onClick:()=>this.setState(st=>({billDraft:{...st.billDraft,icon:ic}})),
      style:'width:46px;height:46px;border-radius:13px;font-size:21px;display:flex;align-items:center;justify-content:center;flex:none;cursor:pointer;'+
        (bd.icon===ic?'background:#e8f1ec;border:2px solid #2f7d5b':'background:var(--fill);border:1px solid var(--border)')
    }));
    const onBillName = (e)=> this.setState(st=>({billDraft:{...st.billDraft,name:e.target.value}}));
    const onBillAmount = (e)=> this.setState(st=>({billDraft:{...st.billDraft,amount:parseAmt(e.target.value)}}));
    const billAmountDisplay = bd.amount? String(bd.amount) : '';
    const billAmountPretty = bd.amount? '฿'+bd.amount.toLocaleString('en-US') : '';
    const billDayChoices = [1,5,10,15,25,'eom'].map(d=>({
      label: d==='eom'?'สิ้นเดือน':('วันที่ '+d), onClick:()=>this.setState(st=>({billDraft:{...st.billDraft,day:d}})),
      style:'padding:10px 8px;border-radius:12px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;'+
        (bd.day===d?'background:#e8f1ec;border:1.5px solid #2f7d5b;color:#2f7d5b':'background:var(--card);border:1px solid var(--border);color:var(--muted2)')
    }));
    const billCycleM = ()=>this.setState(st=>({billDraft:{...st.billDraft,cycle:'monthly'}}));
    const billCycleY = ()=>this.setState(st=>({billDraft:{...st.billDraft,cycle:'yearly'}}));
    const billCycleMStyle = 'flex:1;height:40px;border-radius:10px;font-size:14px;font-weight:600;font-family:inherit;'+(bd.cycle==='monthly'?'background:var(--card);color:#2f7d5b;box-shadow:0 1px 2px rgba(40,42,33,0.1)':'background:transparent;color:var(--muted)');
    const billCycleYStyle = 'flex:1;height:40px;border-radius:10px;font-size:14px;font-weight:600;font-family:inherit;'+(bd.cycle==='yearly'?'background:var(--card);color:#2f7d5b;box-shadow:0 1px 2px rgba(40,42,33,0.1)':'background:transparent;color:var(--muted)');
    const billRemindChoices = [1,3,7].map(d=>({
      label:'ก่อน '+d+' วัน', onClick:()=>this.setState(st=>({billDraft:{...st.billDraft,remind:d}})),
      style:'flex:1;padding:9px 6px;border-radius:11px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;'+
        (bd.remind===d?'background:#e8f1ec;border:1.5px solid #2f7d5b;color:#2f7d5b':'background:var(--card);border:1px solid var(--border);color:var(--muted2)')
    }));
    const billValid = bd.name.trim().length>0 && bd.amount>0;
    const saveBill = ()=>{
      if(!billValid) { toast('ใส่ชื่อบิลและจำนวนเงินก่อนนะ'); return; }
      const dateLabel = bd.day==='eom'?'สิ้นเดือน':('วันที่ '+bd.day);
      const cycleStatus = bd.cycle==='monthly'?'ทุกเดือน':'ทุกปี';
      const editing = !!bd.id;
      this.setState(st=>{
        if(editing){
          return { bills: st.bills.map(x=> x.id===bd.id ? {...x,icon:bd.icon,name:bd.name.trim(),amt:bd.amount,day:bd.day,cycle:bd.cycle,remind:bd.remind,date:dateLabel, status: x.state==='paid'?x.status:cycleStatus} : x),
            billDraft:{id:null,icon:'📄',name:'',amount:0,day:25,cycle:'monthly',remind:3}, screen:'bills' };
        }
        const b={id:'b'+Date.now(),date:dateLabel,icon:bd.icon,name:bd.name.trim(),amt:bd.amount,status:cycleStatus,state:'upcoming',day:bd.day,cycle:bd.cycle,remind:bd.remind};
        return { bills:[b,...st.bills], billDraft:{id:null,icon:'📄',name:'',amount:0,day:25,cycle:'monthly',remind:3}, screen:'bills' };
      });
      toast(editing ? 'แก้ไขบิล “'+bd.name.trim()+'” แล้ว' : 'เพิ่มบิล “'+bd.name.trim()+'” แล้ว');
    };
    const billSaveStyle = 'width:100%;height:54px;border-radius:15px;font-size:16px;font-weight:600;font-family:inherit;'+
      (billValid?'background:#2f7d5b;color:#fff;box-shadow:0 6px 16px -4px rgba(47,125,91,0.5)':'background:var(--track);color:var(--muted)');

    // ---- AI assistant (messenger-style popup, computes from real data) ----
    const fmt = (n)=>this.fmt(n);
    // live figures
    const incomeM = s.onbIncome || 70000;
    const expenseM = 41800;
    const available = 12800;
    const totalCash = 50000;
    const reserved = 37200;
    const daysLeft = 20;
    const dailyOk = Math.round(available/daysLeft/10)*10;
    const budgets = [
      {name:'อาหาร',used:4800,total:6000},{name:'เดินทาง',used:1250,total:3000},
      {name:'ช้อปปิ้ง',used:1800,total:2000},{name:'ของใช้',used:900,total:2500},
    ];
    const topBudget = budgets.slice().sort((a,b)=>(b.used/b.total)-(a.used/a.total))[0];
    const bigBill = s.bills.filter(b=>b.state!=='paid').slice().sort((a,b)=>b.amt-a.amt)[0];
    const totalGoalSaved = s.goals.reduce((a,g)=>a+g.saved,0);
    const totalGoalTarget = s.goals.reduce((a,g)=>a+g.target,0);

    const parseAmount = (txt)=>{
      // grab number, support "หมื่น"/"พัน"/"แสน"
      let t = txt.replace(/,/g,'');
      let m = t.match(/(\d+(?:\.\d+)?)\s*(แสน|หมื่น|พัน|ล้าน|k|พัน)?/i);
      if(!m) return 0;
      let n = parseFloat(m[1]); const unit=m[2]||'';
      if(unit==='ล้าน') n*=1000000; else if(unit==='แสน') n*=100000;
      else if(unit==='หมื่น') n*=10000; else if(unit==='พัน'||unit.toLowerCase()==='k') n*=1000;
      return Math.round(n);
    };

    // intent → computed answer using real data
    const answerFor = (raw)=>{
      const t = raw.toLowerCase();
      const has = (...ks)=>ks.some(k=>t.includes(k));
      // goal creation intent
      if(has('เป้าหมาย','อยากเก็บ','อยากได้','เก็บเงินซื้อ','ออมเพื่อ','สร้างเป้า')){
        const amt = parseAmount(raw);
        if(amt>=500){
          // derive a name
          let name='เป้าหมายใหม่';
          const nm = raw.match(/(?:ซื้อ|เพื่อ|ไป|ดาวน์|ค่า)\s*([ก-๙a-zA-Z]+)/);
          if(nm) name=nm[1];
          else if(has('ฉุกเฉิน')) name='เงินฉุกเฉิน';
          else if(has('เที่ยว','ทริป','ญี่ปุ่น','ต่างประเทศ')) name='เงินเที่ยว';
          else if(has('รถ')) name='ดาวน์รถ';
          else if(has('บ้าน')) name='ดาวน์บ้าน';
          const perMonth = Math.max(1000, Math.round(amt/12/100)*100);
          const months = Math.ceil(amt/perMonth);
          return { text:'ได้เลยครับ 🎯 ผมตั้งเป้า “'+name+'” ฿'+amt.toLocaleString('en-US')+' ให้ ถ้าเก็บเดือนละ ฿'+perMonth.toLocaleString('en-US')+' จะถึงเป้าในราว '+months+' เดือนครับ กดยืนยันเพื่อสร้างเป้าหมายได้เลย',
            goal:{name, target:amt, monthly:perMonth, months} };
        }
        return { text:'ได้เลยครับ อยากตั้งเป้าหมายเก็บเงินเท่าไรดี? พิมพ์มาได้เลย เช่น “อยากเก็บเงินเที่ยว 50000” แล้วผมจะช่วยคำนวณว่าต้องเก็บเดือนละเท่าไรครับ' };
      }
      if(has('เหลือ','ใช้ได้','เหลือเท่า','available')){
        return { text:'ตอนนี้คุณมีเงินที่ใช้ได้จริง '+fmt(available)+' ครับ 💰 (จากเงินทั้งหมด '+fmt(totalCash)+' หักที่ต้องกันไว้ '+fmt(reserved)+' สำหรับบิลและเป้าหมาย) เฉลี่ยใช้ได้วันละ '+fmt(dailyOk)+' ถึงสิ้นเดือนครับ' };
      }
      if(has('อาหาร','กิน','ข้าว')){
        const left=topBudget.total-topBudget.used; const pct=Math.round(topBudget.used/topBudget.total*100);
        return { text:'หมวด'+topBudget.name+'ใช้ไป '+fmt(topBudget.used)+' จาก '+fmt(topBudget.total)+' ('+pct+'%) เหลือ '+fmt(left)+' ครับ 🍜 ช่วงที่เหลือลองคุมวันละ ~'+fmt(Math.round(left/daysLeft/10)*10)+' จะอยู่ในงบพอดี ไม่ต้องอด' };
      }
      if(has('บิล','จ่าย','ค้าง','ครบกำหนด')){
        if(bigBill) return { text:'บิลก้อนใหญ่สุดที่ต้องระวังคือ '+bigBill.name+' '+fmt(bigBill.amt)+' ('+bigBill.date+') ครับ 🔔 แนะนำกันเงินไว้ล่วงหน้า ตอนนี้คุณกันไว้สำหรับบิลทั้งหมดแล้ว '+fmt(reserved)+' เลยไม่น่ากังวลครับ' };
        return { text:'ตอนนี้ไม่มีบิลค้างที่ต้องรีบจ่ายครับ 👍' };
      }
      if(has('เก็บ','ออม','saving','save')){
        const room=Math.max(0, available-dailyOk*daysLeft);
        const suggest=Math.max(1000, Math.round(available*0.25/100)*100);
        return { text:'จากเงินที่ใช้ได้จริง '+fmt(available)+' ถ้ากันไว้ '+fmt(suggest)+' เข้าเป้าหมายอัตโนมัติ คุณจะยังใช้ได้วันละ ~'+fmt(Math.round((available-suggest)/daysLeft/10)*10)+' และได้เงินเก็บเพิ่มปีละ '+fmt(suggest*12)+' ครับ ✨ อยากให้ผมตั้งเป้าหมายให้ไหม? พิมพ์ เช่น “อยากเก็บ 100000” ได้เลย' };
      }
      if(has('ลงทุน','หุ้น','กองทุน','invest')){
        const emer=s.goals.find(g=>g.name.includes('ฉุกเฉิน'));
        const pct=emer?Math.round(emer.saved/emer.target*100):0;
        return { text:'ตอนนี้เงินสำรองฉุกเฉินอยู่ที่ '+pct+'% ครับ 🌱 แนะนำให้มีสำรองราว 3 เท่าของรายจ่ายต่อเดือน (~'+fmt(expenseM*3)+') ก่อนเริ่มลงทุนจะมั่นคงกว่า ระหว่างนี้เก็บเดือนละ ฿3,000 ไปก่อนก็เยี่ยมแล้ว' };
      }
      if(has('รายจ่าย','ใช้ไป','ใช้เงิน','จ่ายไป')){
        return { text:'เดือนนี้ใช้ไป '+fmt(expenseM)+' จากรายได้ '+fmt(incomeM)+' ครับ น้อยกว่าเดือนก่อน 8% 👏 หมวดที่ใช้เยอะสุดคือ'+topBudget.name+' '+fmt(topBudget.used)+' ครับ' };
      }
      if(has('สวัสดี','หวัดดี','hello','hi','ทัก')){
        return { text:'สวัสดีครับบอล 👋 ถามผมได้เลยว่าตอนนี้เงินเป็นยังไง เช่น “เหลือใช้ได้เท่าไร”, “บิลไหนต้องระวัง” หรือบอกเป้าหมายที่อยากเก็บก็ได้ครับ' };
      }
      // fallback — give an overview from real data
      return { text:'สรุปสั้น ๆ จากข้อมูลของคุณนะครับ 📊 เงินใช้ได้จริง '+fmt(available)+' · ใช้ได้วันละ ~'+fmt(dailyOk)+' · บิลที่ต้องกันไว้รวม '+fmt(reserved)+' · เก็บเข้าเป้าหมายแล้ว '+fmt(totalGoalSaved)+' จาก '+fmt(totalGoalTarget)+'\nลองถามเจาะจง เช่น “ลดค่าอาหารยังไง”, “อยากเก็บเงินเที่ยว 50000” ได้เลยครับ' };
    };

    const pushAi = (raw)=>{
      const reply = answerFor(raw);
      clearTimeout(this._ai);
      this._ai=setTimeout(()=>{
        this.setState(st=>({ aiChat:[...st.aiChat, {role:'ai',kind: reply.goal?'goal':'text', text:reply.text, goal:reply.goal||null}], aiThinking:false, aiPendingGoal: reply.goal||null }));
      }, 850);
    };
    const sendAi = (raw)=>{
      const text=(raw==null? s.aiInput : raw).trim();
      if(!text) return;
      this.setState(st=>({ aiChat:[...st.aiChat, {role:'me',kind:'text',text}], aiInput:'', aiThinking:true }));
      pushAi(text);
    };
    const greetChat = [{role:'ai',kind:'text',text:'สวัสดีครับบอล 👋 ผมช่วยดูเงินของคุณได้ ถามมาได้เลย เช่น “เหลือใช้ได้เท่าไร”, “บิลไหนต้องระวัง” หรือบอกเป้าหมายที่อยากเก็บ เช่น “อยากเก็บเงินเที่ยว 50000” ครับ'}];
    const openAi = ()=> this.setState(st=>({ aiOpen:true, aiChat: st.aiGreeted? st.aiChat : greetChat.slice(), aiGreeted:true }));
    const closeAi = ()=> this.setState({aiOpen:false});
    const onAiInput = (e)=> this.setState({aiInput:e.target.value});
    const onAiKey = (e)=>{ if(e.key==='Enter'){ e.preventDefault(); sendAi(null); } };
    const aiSuggest = ['เหลือใช้ได้เท่าไร','บิลไหนต้องระวัง','อยากเก็บเงินเที่ยว 50000'].map(q=>({
      label:q, onClick:()=>sendAi(q)
    }));
    const confirmGoal = ()=>{
      const g=s.aiPendingGoal; if(!g) return;
      const goal={id:'g'+Date.now(),icon:'🎯',iconBg:'#e8f1ec',name:g.name,target:g.target,saved:0};
      this.setState(st=>({ goals:[goal,...st.goals], aiPendingGoal:null,
        aiChat:[...st.aiChat, {role:'ai',kind:'text',text:'สร้างเป้าหมาย “'+g.name+'” '+fmt(g.target)+' เรียบร้อยแล้วครับ 🎉 ผมใส่ไว้ในหน้าเป้าหมายให้แล้ว สู้ ๆ นะครับ!'}] }));
      toast('สร้างเป้าหมาย “'+g.name+'” แล้ว');
    };
    const dismissGoal = ()=> this.setState(st=>({ aiPendingGoal:null, aiChat:[...st.aiChat,{role:'ai',kind:'text',text:'ได้ครับ ไว้พร้อมเมื่อไรบอกผมได้เลย 😊'}] }));
    let lastGoalIdx = -1;
    s.aiChat.forEach((m,i)=>{ if(m.goal) lastGoalIdx=i; });
    const aiPending = !!s.aiPendingGoal;
    const aiBubbles = s.aiChat.map((m,i)=>({
      isAi: m.role==='ai', text: m.text||'',
      hasGoal: !!(m.goal),
      goalActive: !!(m.goal) && i===lastGoalIdx && aiPending,
      goalName: m.goal? m.goal.name : '', goalTarget: m.goal? fmt(m.goal.target) : '', goalPer: m.goal? fmt(m.goal.monthly) : '',
      rowStyle:'display:flex;'+(m.role==='ai'?'justify-content:flex-start':'justify-content:flex-end'),
      bubbleStyle: m.role==='ai'
        ? 'max-width:84%;background:var(--fill);border-radius:4px 16px 16px 16px;padding:11px 14px;font-size:13.5px;line-height:1.55;color:var(--text);white-space:pre-line'
        : 'max-width:84%;background:#2f7d5b;color:#fff;border-radius:16px 16px 4px 16px;padding:11px 14px;font-size:13.5px;line-height:1.55;white-space:pre-line'
    }));

    // ---- web dashboard ----
    const webNavDef = [['home','หน้าแรก','⌂'],['transactions','รายการ','☰'],['plan','แผนเงิน','◷'],['bills','บิล','🔔'],['accounts','บัญชี','▤'],['goals','เป้าหมาย','◎'],['reports','รายงาน','▥'],['settings','ตั้งค่า','⚙']];
    const webNav = webNavDef.map(([key,label,icon])=>{const active=s.webScreen===key;return {label,icon,
      onClick:()=>this.setState({webScreen:key}),
      style:'display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:11px;font-size:14px;cursor:pointer;font-weight:'+(active?'600':'500')+';'+
        (active?'background:#e8f1ec;color:#2f7d5b':'color:var(--muted2)')};});
    const weekVals=[9200,11400,8600,12600]; const wkMax=14000;
    const weekBars=weekVals.map((v,i)=>({label:'สัปดาห์ '+(i+1),amount:this.fmt(v),
      barStyle:'height:'+Math.round(v/wkMax*100)+'%;background:'+(i===weekVals.length-1?'#2f7d5b':'#cde0d5')}));
    const webRecent=allTxns.slice(0,4).map((t,i,a)=>({icon:t.icon,name:t.name,meta:t.cat+' · '+t.day,
      amount:(t.amt>=0?'+':'-')+this.fmt(t.amt),
      amountStyle:'font-size:14px;font-weight:700;color:'+(t.amt>=0?'#3f9d6b':'var(--text)'),
      rowStyle:'display:flex;align-items:center;gap:12px;padding:11px 0;'+(i<a.length-1?'border-bottom:1px solid var(--divider)':'')}));
    const webTitles={home:'หน้าแรก',transactions:'รายการ',plan:'แผนเงิน',bills:'บิลที่ต้องจ่าย',accounts:'บัญชีของฉัน',goals:'เป้าหมายของฉัน',reports:'รายงาน',settings:'ตั้งค่า'};

    // ---- add screen ----
    const catNames = ['อาหาร','เดินทาง','ของใช้','ช้อปปิ้ง','บิล','สุขภาพ','เที่ยว','อื่น ๆ'];
    const catChips = catNames.map(c=>({
      label:c, onClick:set({addCat:c}),
      style:'flex:none;padding:9px 15px;border-radius:20px;font-size:13px;font-weight:500;font-family:inherit;white-space:nowrap;'+
        (s.addCat===c?'background:#2f7d5b;color:#fff':'background:var(--card);color:var(--muted2);border:1px solid #e6e2d9')
    }));
    const tapDigit = (d)=> this.setState(st=>({addAmount: Math.min(st.addAmount*Math.pow(10,(''+d).length)+Number(d), 99999999)}));
    const keypad = ['1','2','3','4','5','6','7','8','9','00','0','⌫'].map(k=>({
      label:k, onClick: k==='⌫' ? ()=>this.setState(st=>({addAmount: Math.floor(st.addAmount/10)})) : ()=>tapDigit(k)
    }));
    const addAmountDisplay = s.addAmount.toLocaleString('en-US');
    const amountStyle = 'font-size:56px;font-weight:800;letter-spacing:-0.03em;color:'+(s.addAmount>0?'var(--text)':'#c4c6bc');
    const saveTxn = ()=>{
      const expense = s.addType==='expense';
      const amt = (expense?-1:1)*(s.addAmount||0);
      const iconMap={'อาหาร':'🍜','เดินทาง':'🚗','ของใช้':'🛒','ช้อปปิ้ง':'🛍️','บิล':'🧾','สุขภาพ':'💊','เที่ยว':'✈️','อื่น ๆ':'•'};
      const t={icon: expense?(iconMap[s.addCat]||'•'):'💰', name: expense? s.addCat : 'รายรับ', meta:(expense?s.addCat:'รายรับ')+' · วันนี้', amt};
      this.setState(st=>({ txns:[t,...st.txns], addSuccess:true }));
    };

    // ---- nav ----
    const navDef = [
      ['home','หน้าแรก','⌂'],['transactions','รายการ','☰'],['__add','',''],['plan','แผนเงิน','◷'],['more','เพิ่มเติม','⋯'],
    ];
    const navItems = navDef.filter(n=>n[0]!=='__add').map(([k,label,icon])=>({
      label, icon, onClick:()=>this.go(k),
      style:'flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px 0;font-family:inherit;color:'+
        ((s.screen===k||(k==='more'&&['more','accounts','goals','bills','settings'].includes(s.screen)))?'#2f7d5b':'#aeb0a6')
    }));
    // spacer for center button
    navItems.splice(2,0,{label:'',icon:'',onClick:()=>{},style:'flex:1'});

    // toast
    const toast = (msg)=>{ this.setState({toast:msg}); clearTimeout(this._tt); this._tt=setTimeout(()=>this.setState({toast:null}),2600); };

    return {
      isMobile, isWeb, isComponents,
      setMobile:()=>this.setState({view:'mobile'}), setWeb:()=>this.setState({view:'web'}), setComponents:()=>this.setState({view:'components'}),
      tabMobileStyle:this.tab(isMobile), tabWebStyle:this.tab(isWeb), tabCompStyle:this.tab(isComponents),
      screenTabs,
      screenHome:s.screen==='home', screenAdd:s.screen==='add', screenOnboarding:s.screen==='onboarding',
      screenTxns:s.screen==='transactions', screenPlan:s.screen==='plan', screenBills:s.screen==='bills',
      screenAccounts:s.screen==='accounts', screenGoals:s.screen==='goals', screenMore:s.screen==='more',
      screenDetail:s.screen==='detail', goDetail:()=>this.go('detail'),
      aiOpen:s.aiOpen, openAi, closeAi, aiBubbles, aiThinking:s.aiThinking,
      aiInput:s.aiInput, onAiInput, onAiKey, sendAi:()=>sendAi(null), aiSuggest,
      aiPending, aiNotPending:!aiPending, confirmGoal, dismissGoal,
      chatHeadVisible: !s.aiOpen && !['onboarding','add','createGoal','createBill'].includes(s.screen),
      sheetToAi:()=>{ this.setState({sheetOpen:false}); openAi(); },
      screenCreateGoal:s.screen==='createGoal', screenCreateBill:s.screen==='createBill',
      goGoals:()=>this.setState({goalDraft:{icon:'🎯',name:'',target:0,monthly:5000},screen:'goals'}),
      goBillsBack:()=>this.setState({billDraft:{id:null,icon:'📄',name:'',amount:0,day:25,cycle:'monthly',remind:3},screen:'bills'}),
      billEditing: !!bd.id, billFormTitle: bd.id?'แก้ไขบิล':'เพิ่มบิลประจำ', billSaveLabel: bd.id?'บันทึกการแก้ไข':'บันทึกบิล',
      goalIconChoices, onGoalName, onGoalTarget, onGoalMonthly, goalName:gd.name,
      goalTargetDisplay, goalMonthlyDisplay, goalTargetPretty, goalMonthlyPretty, goalShowTargetPretty:gd.target>0, goalShowMonthlyPretty:gd.monthly>0,
      goalEtaMonths, goalHasEta:goalEtaMonths>0, saveGoal, goalSaveStyle,
      billIconChoices, onBillName, onBillAmount, billName:bd.name, billAmountDisplay, billAmountPretty, billShowPretty:bd.amount>0,
      billDayChoices, billCycleM, billCycleY, billCycleMStyle, billCycleYStyle, billRemindChoices, saveBill, billSaveStyle,
      detailItems:[
        {icon:'🧾',label:'บิลที่ต้องจ่าย',sub:'Internet, บัตรเครดิต, Netflix',amount:'−฿9,400'},
        {icon:'💳',label:'ยอดหนี้ที่ตั้งใจจ่ายเดือนนี้',sub:'บัตรเครดิต KTC',amount:'−฿8,500'},
        {icon:'📊',label:'งบใช้จ่ายที่กันไว้',sub:'อาหาร เดินทาง ของใช้ ฯลฯ',amount:'−฿14,300'},
        {icon:'🎯',label:'เงินเก็บเข้าเป้าหมาย',sub:'เงินฉุกเฉิน, เที่ยวญี่ปุ่น',amount:'−฿5,000'},
      ],
      isBeginner:s.mode==='beginner', isAdvanced:s.mode==='advanced',
      setBeginner:()=>this.setState({mode:'beginner'}), setAdvanced:()=>this.setState({mode:'advanced'}),
      modeBeginnerStyle:'flex:1;height:38px;border-radius:10px;font-size:13.5px;font-weight:600;font-family:inherit;'+(s.mode==='beginner'?'background:var(--card);color:#2f7d5b;box-shadow:0 1px 2px rgba(40,42,33,0.12)':'background:transparent;color:#8a8c82'),
      modeAdvancedStyle:'flex:1;height:38px;border-radius:10px;font-size:13.5px;font-weight:600;font-family:inherit;'+(s.mode==='advanced'?'background:var(--card);color:#2f7d5b;box-shadow:0 1px 2px rgba(40,42,33,0.12)':'background:transparent;color:#8a8c82'),
      moreMain:[
        {icon:'🏦',label:'บัญชีของฉัน',sub:'เงินที่มีและยอดที่ต้องจ่าย',onClick:()=>this.go('accounts')},
        {icon:'🎯',label:'เป้าหมายของฉัน',sub:'เงินเก็บและเป้าหมาย',onClick:()=>this.go('goals')},
        {icon:'🔔',label:'บิลที่ต้องจ่าย',sub:'บิลประจำและกำหนดจ่าย',onClick:()=>this.go('bills')},
        {icon:'⚙️',label:'ตั้งค่า',sub:'โปรไฟล์ การแจ้งเตือน ความปลอดภัย',onClick:()=>this.go('settings')},
      ].map((m,i,a)=>({...m,rowStyle:'display:flex;align-items:center;gap:14px;padding:16px;font-family:inherit;text-align:left;width:100%;background:transparent;'+(i<a.length-1?'border-bottom:1px solid var(--divider)':'')})),
      moreAdvanced:[
        {icon:'📊',label:'รายงานเชิงลึก',sub:'แนวโน้มรายจ่ายและสรุปรายปี'},
        {icon:'🏷️',label:'แท็กและหมวดแบบละเอียด',sub:'แยกหมวดย่อยได้เอง'},
        {icon:'📤',label:'ส่งออกข้อมูล (CSV)',sub:'ดาวน์โหลดรายการทั้งหมด'},
        {icon:'💱',label:'หลายสกุลเงิน',sub:'รองรับเงินตราต่างประเทศ'},
      ].map((m,i,a)=>({...m,rowStyle:'display:flex;align-items:center;gap:14px;padding:16px;text-align:left;width:100%;'+(i<a.length-1?'border-bottom:1px solid var(--divider)':'')})),
      // ---- settings ----
      screenSettings:s.screen==='settings',
      themeAttr: s.theme,
      themeOptions: [
        {key:'light',label:'ครีม',sw:'#f5f3ee',ring:'#d8d4cb'},
        {key:'mint',label:'มินต์',sw:'#e9f3ed',ring:'#bcd6c8'},
        {key:'sky',label:'ฟ้า',sw:'#e9f0f8',ring:'#bcd0e8'},
        {key:'sand',label:'ทราย',sw:'#f5efe3',ring:'#dccdb0'},
        {key:'dark',label:'มืด',sw:'#20242b',ring:'#3a414c'},
        {key:'midnight',label:'กลางคืน',sw:'#1a2340',ring:'#33406a'},
      ].map(t=>{
        const active=s.theme===t.key;
        return {key:t.key,label:t.label,onClick:()=>this.setState({theme:t.key}),
          swatchStyle:'width:100%;aspect-ratio:1;border-radius:14px;background:'+t.sw+';border:'+(active?'2.5px solid #2f7d5b':'1.5px solid '+t.ring)+';display:flex;align-items:center;justify-content:center;cursor:pointer',
          tickStyle:'width:20px;height:20px;border-radius:50%;background:#2f7d5b;color:#fff;display:'+(active?'flex':'none')+';align-items:center;justify-content:center;font-size:12px',
          labelStyle:'font-size:11px;text-align:center;margin-top:6px;font-weight:'+(active?'700':'500')+';color:'+(active?'#2f7d5b':'var(--muted)')};
      }),
      ...(()=>{ const out={}; ['bills','budget','weekly','biometric','hideAmounts'].forEach(key=>{
        const on=s.toggles[key]; const cap=key.charAt(0).toUpperCase()+key.slice(1);
        out['sw'+cap+'Click']=()=>this.setState(st=>({toggles:{...st.toggles,[key]:!st.toggles[key]}}));
        out['sw'+cap+'Track']='position:relative;width:46px;height:27px;border-radius:14px;flex:none;transition:.18s;background:'+(on?'#2f7d5b':'#d8d4cb');
        out['sw'+cap+'Knob']='position:absolute;top:3px;left:'+(on?'22px':'3px')+';width:21px;height:21px;border-radius:50%;background:var(--card);transition:.18s;box-shadow:0 1px 2px rgba(0,0,0,0.2)';
      }); return out; })(),
      txnFilters, txnGroups, txnEmpty, txnHasItems, toggleEmpty:()=>this.setState(st=>({demoEmpty:!st.demoEmpty})),
      planCats, billsTimeline, assetRows, debtRows, goalCards,
      webNav, weekBars, webRecent, webTitle:webTitles[s.webScreen],
      webHome:s.webScreen==='home', webTxns:s.webScreen==='transactions', webPlan:s.webScreen==='plan',
      webBills:s.webScreen==='bills', webAccounts:s.webScreen==='accounts', webGoals:s.webScreen==='goals',
      webReports:s.webScreen==='reports', webSettings:s.webScreen==='settings',
      webNotHome:s.webScreen!=='home',
      swatches:[
        {name:'พื้นหลัง',hex:'#F5F3EE',box:'background:var(--bg);border:1px solid #e6e2d9'},
        {name:'การ์ด',hex:'#FFFFFF',box:'background:var(--card);border:1px solid #e6e2d9'},
        {name:'ตัวอักษรหลัก',hex:'#22251F',box:'background:#22251f'},
        {name:'ตัวอักษรรอง',hex:'#9A9C92',box:'background:var(--muted)'},
        {name:'สีหลัก',hex:'#2F7D5B',box:'background:#2f7d5b'},
        {name:'เงินเข้า',hex:'#3F9D6B',box:'background:#3f9d6b'},
        {name:'เงินออก',hex:'#D9776A',box:'background:#d9776a'},
        {name:'เตือน',hex:'#C98A3C',box:'background:#c98a3c'},
      ],
      // hero
      setHero1:set({hero:1}), setHero2:set({hero:2}), setHero3:set({hero:3}),
      hero1Style:this.miniTab(s.hero===1), hero2Style:this.miniTab(s.hero===2), hero3Style:this.miniTab(s.hero===3),
      heroA:s.hero===1, heroB:s.hero===2, heroC:s.hero===3,
      // onboarding
      onbDots, payDays, recurringOptions, goalOptions, onbNext, onbBack, onbCtaLabel,
      payEomStyle, payEomClick,
      onbIncomeDisplay, onbKeypad, incomePresets,
      otherOn, customChips, customDraft, onCustomInput, addCustom, hasCustom:s.customRecurring.length>0,
      onbIsStep1:s.onbStep===1, onbIsStep2:s.onbStep===2, onbIsStep3:s.onbStep===3, onbIsStep4:s.onbStep===4, onbIsDone:s.onbStep>=5,
      onbCanBack: s.onbStep>1 && s.onbStep<5,
      // home
      upcomingBills, watchBudgets, recentTxns,
      goBills:()=>this.go('bills'), goTxns:()=>this.go('transactions'), goHome:()=>this.go('home'), goMore:()=>this.go('more'), goAdd:()=>this.setState({screen:'add',addAmount:0,addSuccess:false}),
      openSheet:()=>this.setState({sheetOpen:true}), closeSheet:()=>this.setState({sheetOpen:false}), stop:(e)=>e.stopPropagation(),
      // add
      addForm: !s.addSuccess, addSuccess:s.addSuccess,
      setExpense:set({addType:'expense'}), setIncome:set({addType:'income'}),
      segExpenseStyle:'flex:1;height:40px;border-radius:10px;font-size:14px;font-weight:600;font-family:inherit;'+(s.addType==='expense'?'background:var(--card);color:#d9776a;box-shadow:0 1px 2px rgba(40,42,33,0.1)':'background:transparent;color:#8a8c82'),
      segIncomeStyle:'flex:1;height:40px;border-radius:10px;font-size:14px;font-weight:600;font-family:inherit;'+(s.addType==='income'?'background:var(--card);color:#3f9d6b;box-shadow:0 1px 2px rgba(40,42,33,0.1)':'background:transparent;color:#8a8c82'),
      addAmountDisplay, amountStyle, catChips, keypad, saveTxn,
      // nav
      showNav: !['onboarding','add','createGoal','createBill'].includes(s.screen),
      navItems,
      // sheet/toast
      sheetOpen:s.sheetOpen, toastOpen:!!s.toast, toastMsg:s.toast,
      // misc button handlers (prototype actions)
      pickAccount:()=>toast('บัญชีหลัก · ฿28,500'),
      pickDate:()=>toast('ตั้งวันที่ของรายการได้ที่นี่'),
      addNote:()=>toast('เพิ่มโน้ตให้รายการนี้ได้'),
      addReceipt:()=>toast('แนบรูปใบเสร็จได้'),
      searchTxn:()=>toast('ค้นหารายการ — พิมพ์ชื่อหรือหมวดได้'),
      addBill:()=>this.go('createBill'),
      createGoal:()=>this.go('createGoal'),
      logout:()=>toast('ออกจากระบบเรียบร้อย'),
      webAddTxn:()=>this.setState({view:'mobile',screen:'add',addAmount:0,addSuccess:false}),
      webCreateGoal:()=>this.setState({view:'mobile',screen:'createGoal'}),
      webAddBill:()=>this.setState({view:'mobile',screen:'createBill'}),
      webSeeAll:(k)=>()=>this.setState({webScreen:k}),
      webViewDetail:()=>toast('เปิดรายละเอียดสรุปของเดือนนี้'),
      webGoTxns:()=>this.setState({webScreen:'transactions'}),
    };
  }
}
