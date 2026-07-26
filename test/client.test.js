import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, tokens } from '../src/api/client.js';

const ok = (body, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => body,
});

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('api client', () => {
  it('register stores the returned token pair', async () => {
    global.fetch = vi.fn(async () => ok({ access: 'A', refresh: 'R' }));
    await api.register('e@x.com', 'password12');
    expect(tokens.access).toBe('A');
    expect(tokens.refresh).toBe('R');
    expect(global.fetch.mock.calls[0][0]).toContain('/auth/register');
  });

  it('attaches a Bearer header when authenticated', async () => {
    tokens.set({ access: 'TOK', refresh: 'R' });
    global.fetch = vi.fn(async () => ok({ id: '1' }));
    await api.me();
    const opts = global.fetch.mock.calls[0][1];
    expect(opts.headers.Authorization).toBe('Bearer TOK');
  });

  it('refreshes once on 401 then retries with the new token', async () => {
    tokens.set({ access: 'OLD', refresh: 'R' });
    let protectedCalls = 0;
    global.fetch = vi.fn(async (url) => {
      if (url.includes('/auth/refresh')) return ok({ access: 'NEW', refresh: 'R2' });
      protectedCalls += 1;
      return protectedCalls === 1 ? ok({ detail: 'expired' }, 401) : ok({ id: 'me' });
    });
    const res = await api.me();
    expect(res).toEqual({ id: 'me' });
    expect(tokens.access).toBe('NEW');
    expect(protectedCalls).toBe(2); // original + retry
  });

  it('clears tokens if the refresh itself fails', async () => {
    tokens.set({ access: 'OLD', refresh: 'BAD' });
    global.fetch = vi.fn(async (url) => {
      if (url.includes('/auth/refresh')) return ok({ detail: 'nope' }, 401);
      return ok({ detail: 'expired' }, 401);
    });
    await expect(api.me()).rejects.toMatchObject({ status: 401 });
    expect(tokens.access).toBeNull();
  });

  it('returns null for 204 responses', async () => {
    tokens.set({ access: 'T', refresh: 'R' });
    global.fetch = vi.fn(async () => ({ ok: true, status: 204, json: async () => { throw new Error('no body'); } }));
    const res = await api.deleteAccount('id1');
    expect(res).toBeNull();
  });

  it('throws ApiError carrying status and detail', async () => {
    global.fetch = vi.fn(async () => ok({ detail: 'Email already registered' }, 409));
    await expect(api.register('e', 'password12')).rejects.toMatchObject({
      status: 409,
      detail: 'Email already registered',
    });
  });
});
