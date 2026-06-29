// Contract smoke: exercises the same endpoints src/api/client.js calls.
const BASE = process.env.API || 'http://127.0.0.1:8000/api/v1';
let access, refresh;

async function call(method, path, body, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && access) headers.Authorization = `Bearer ${access}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(data)}`);
  return data;
}

function ok(label, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? '  ' + extra : ''}`);
  if (!cond) process.exitCode = 1;
}

const email = `smoke-${Date.now()}@example.com`;

let t = await call('POST', '/auth/register', { email, password: 'supersecret' }, false);
({ access, refresh } = t);
ok('register issues tokens', !!access && !!refresh);

const me = await call('GET', '/auth/me');
ok('me returns user', me.email === email, me.account_type);

await call('POST', '/onboarding', {
  pay_day: 0,
  monthly_income: 45000,
  primary_goal: 'leftover',
  recurring: [
    { name: 'ค่าเช่า', amount: 12000, due_day: 1 },
    { name: 'ผ่อนรถ', amount: 8500, due_day: 5 },
    { name: 'บัตร', amount: 5000, due_day: 25 },
    { name: 'เน็ต', amount: 1200, due_day: 15 },
    { name: 'ประกัน', amount: 3000, due_day: 20 },
    { name: 'น้ำไฟ', amount: 2500, due_day: 28 },
  ],
});

// Onboarding already creates a primary asset account with the stated income
// (45,000). Add a small secondary asset so total balance is 50,000.
await call('POST', '/accounts', { name: 'เงินสด', type: 'asset', balance: 5000 });
await call('POST', '/goals', {
  name: 'เที่ยว', target_amount: 60000, saved_amount: 18000, monthly_contribution: 5000,
});
const today = new Date().toISOString().slice(0, 10);
await call('POST', '/transactions', { type: 'income', amount: 45000, occurred_at: today });

const detail = await call('GET', '/summary/detail');
ok('detail reconciles available=12,800', detail.available === 12800,
   `reserved=${detail.reserved} total=${detail.total_balance}`);

const home = await call('GET', '/summary/home');
ok('home month_in=45,000', home.month_in === 45000);

const bills = await call('GET', '/bills');
ok('6 bills created via onboarding', bills.length === 6);

// token refresh path (new access string may match if issued the same second)
const pair = await call('POST', '/auth/refresh', { refresh_token: refresh }, false);
ok('refresh returns a new token pair', !!pair.access && !!pair.refresh);
let reused = false;
try {
  await call('POST', '/auth/refresh', { refresh_token: refresh }, false);
} catch {
  reused = true;
}
ok('old refresh token is revoked after rotation', reused);

console.log('\nsmoke done.');
