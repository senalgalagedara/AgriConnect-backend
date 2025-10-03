import fetch from 'node-fetch';

async function run() {
  const base = process.env.BASE_URL || 'http://localhost:5000';
  const email = `authtest_${Date.now()}@example.com`;
  const password = 'secret123';
  const role = 'farmer';

  const log = (label: string, data: any) => console.log(`[auth-flow] ${label}:`, data);

  // Signup
  const signupRes = await fetch(`${base}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role, firstName: 'Auto', lastName: 'Test' })
  });
  const signupBody: any = await signupRes.json().catch(() => ({}));
  log('signup status', signupRes.status);
  log('signup body', signupBody);
  if (signupRes.status !== 201 || !signupBody.user?.id) {
    throw new Error('Signup failed');
  }

  // Extract cookie
  const setCookie = signupRes.headers.get('set-cookie');
  if (!setCookie) throw new Error('No Set-Cookie header from signup');
  const sid = /sid=([^;]+)/.exec(setCookie)?.[1];
  if (!sid) throw new Error('sid cookie missing');

  // Session
  const sessionRes = await fetch(`${base}/api/auth/session`, {
    headers: { Cookie: `sid=${sid}` }
  });
  const sessionBody: any = await sessionRes.json().catch(() => ({}));
  log('session status', sessionRes.status);
  log('session body', sessionBody);
  if (sessionRes.status !== 200) throw new Error('Session fetch failed');

  // Login
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const loginBody: any = await loginRes.json().catch(() => ({}));
  log('login status', loginRes.status);
  if (loginRes.status !== 200) throw new Error('Login failed');

  console.log('AUTH FLOW OK');
}

run().catch(err => {
  console.error('AUTH FLOW FAILED', err);
  process.exit(1);
});
