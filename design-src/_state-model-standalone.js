
class Component extends DCLogic {
  state = {
    view: 'mobile',        // mobile | web | components
    screen: 'onboarding',  // onboarding | home | add | transactions | plan | bills | accounts | goals
    hero: 3,
    onbStep: 1,            // 1..4, 5 = done
    payDay: 25,
    recurring: ['ค่าบ้าน / ค่าเช่า','บัตรเครดิต','Internet'],
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
    dark: false,
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
    const recurNames = ['ค่าบ้าน / ค่าเช่า','ค่ารถ','บัตรเครดิต','ค่าโทรศัพท์','Internet','Streaming','อื่น ๆ'];
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
    const billsTimeline = [
      {date:'23 มิ.ย.',icon:'🎬',name:'Netflix',amt:105,status:'อีก 1 วัน',state:'soon'},
      {date:'25 มิ.ย.',icon:'🌐',name:'Internet',amt:699,status:'อีก 3 วัน',state:'upcoming'},
      {date:'30 มิ.ย.',icon:'💳',name:'บัตรเครดิต',amt:8500,status:'อีก 8 วัน',state:'upcoming'},
      {date:'15 มิ.ย.',icon:'📱',name:'ค่าโทรศัพท์',amt:399,status:'จ่ายแล้ว',state:'paid'},
    ].map(b=>{
      const paid=b.state==='paid', soon=b.state==='soon';
      return {date:b.date,icon:b.icon,name:b.name,amount:this.fmt(b.amt),status:b.status,
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
    const goalCards = [
      {icon:'🛟',iconBg:'#e8f1ec',name:'เงินฉุกเฉิน',target:200000,saved:82000},
      {icon:'🗾',iconBg:'#eaf0f7',name:'เที่ยวญี่ปุ่น',target:50000,saved:12500},
    ].map(g=>{const pct=Math.round(g.saved/g.target*100);return{
      icon:g.icon,iconBg:g.iconBg,name:g.name,target:this.fmt(g.target),saved:this.fmt(g.saved),
      pct:pct+'%',remaining:'เหลืออีก '+this.fmt(g.target-g.saved),
      barStyle:'height:100%;width:'+pct+'%;border-radius:7px;background:linear-gradient(90deg,#3f9d6b,#2f7d5b)' };});

    // ---- web dashboard ----
    const webNavDef = [['หน้าแรก','⌂',true],['รายการ','☰',false],['แผนเงิน','◷',false],['บิล','🔔',false],['บัญชี','▤',false],['เป้าหมาย','◎',false],['รายงาน','▥',false],['ตั้งค่า','⚙',false]];
    const webNav = webNavDef.map(([label,icon,active])=>({label,icon,
      style:'display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:11px;font-size:14px;font-weight:'+(active?'600':'500')+';cursor:pointer;'+
        (active?'background:#e8f1ec;color:#2f7d5b':'color:#6c6e65')}));
    const weekVals=[9200,11400,8600,12600]; const wkMax=14000;
    const weekBars=weekVals.map((v,i)=>({label:'สัปดาห์ '+(i+1),amount:this.fmt(v),
      barStyle:'height:'+Math.round(v/wkMax*100)+'%;background:'+(i===weekVals.length-1?'#2f7d5b':'#cde0d5')}));
    const webRecent=allTxns.slice(0,4).map((t,i,a)=>({icon:t.icon,name:t.name,meta:t.cat+' · '+t.day,
      amount:(t.amt>=0?'+':'-')+this.fmt(t.amt),
      amountStyle:'font-size:14px;font-weight:700;color:'+(t.amt>=0?'#3f9d6b':'var(--text)'),
      rowStyle:'display:flex;align-items:center;gap:12px;padding:11px 0;'+(i<a.length-1?'border-bottom:1px solid #f4f1ea':'')}));

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
      themeAttr: s.dark ? 'dark' : 'light',
      swDarkClick:()=>this.setState(st=>({dark:!st.dark})),
      swDarkTrack:'position:relative;width:46px;height:27px;border-radius:14px;flex:none;transition:.18s;background:'+(s.dark?'#2f7d5b':'#d8d4cb'),
      swDarkKnob:'position:absolute;top:3px;left:'+(s.dark?'22px':'3px')+';width:21px;height:21px;border-radius:50%;background:#fff;transition:.18s;box-shadow:0 1px 2px rgba(0,0,0,0.2)',
      ...(()=>{ const out={}; ['bills','budget','weekly','biometric','hideAmounts'].forEach(key=>{
        const on=s.toggles[key]; const cap=key.charAt(0).toUpperCase()+key.slice(1);
        out['sw'+cap+'Click']=()=>this.setState(st=>({toggles:{...st.toggles,[key]:!st.toggles[key]}}));
        out['sw'+cap+'Track']='position:relative;width:46px;height:27px;border-radius:14px;flex:none;transition:.18s;background:'+(on?'#2f7d5b':'#d8d4cb');
        out['sw'+cap+'Knob']='position:absolute;top:3px;left:'+(on?'22px':'3px')+';width:21px;height:21px;border-radius:50%;background:var(--card);transition:.18s;box-shadow:0 1px 2px rgba(0,0,0,0.2)';
      }); return out; })(),
      txnFilters, txnGroups, txnEmpty, txnHasItems, toggleEmpty:()=>this.setState(st=>({demoEmpty:!st.demoEmpty})),
      planCats, billsTimeline, assetRows, debtRows, goalCards,
      webNav, weekBars, webRecent,
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
      showNav: s.screen!=='onboarding' && s.screen!=='add',
      navItems,
      // sheet/toast
      sheetOpen:s.sheetOpen, toastOpen:!!s.toast, toastMsg:s.toast,
    };
  }
}
