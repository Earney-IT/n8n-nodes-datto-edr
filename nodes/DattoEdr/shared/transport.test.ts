import { dattoEdrApiRequest, dattoEdrApiRequestAllItems, buildFilterQs } from './transport';
import { makeCtx } from '../__testutils__/makeCtx';

test('builds url from baseUrl + resource, single slash, json, returns body', async () => {
  const ctx = makeCtx({ httpResponses: [[{ id: '1' }]] });
  const res = await dattoEdrApiRequest.call(ctx, 'GET', 'Agents', { a: 1 });
  expect(ctx._calls[0].url).toBe('https://x.infocyte.com/api/Agents');
  expect(ctx._calls[0].method).toBe('GET');
  expect(ctx._calls[0].qs).toEqual({ a: 1 });
  expect(res).toEqual([{ id: '1' }]);
});

test('leading slash on resource does not double', async () => {
  const ctx = makeCtx({ httpResponses: [[]] });
  await dattoEdrApiRequest.call(ctx, 'GET', '/Agents');
  expect(ctx._calls[0].url).toBe('https://x.infocyte.com/api/Agents');
});

test('trailing slash on baseUrl is normalized', async () => {
  const ctx = makeCtx({ credentials: { baseUrl: 'https://x.infocyte.com/api/', apiToken: 't' }, httpResponses: [[]] });
  await dattoEdrApiRequest.call(ctx, 'GET', 'Agents');
  expect(ctx._calls[0].url).toBe('https://x.infocyte.com/api/Agents');
});

test('buildFilterQs JSON-encodes the filter under "filter" key; empty => {}', () => {
  expect(buildFilterQs({ where: { active: true }, limit: 10 })).toEqual({ filter: JSON.stringify({ where: { active: true }, limit: 10 }) });
  expect(buildFilterQs({})).toEqual({});
  expect(buildFilterQs(undefined)).toEqual({});
});

test('maps LoopBack error envelope to NodeApiError', async () => {
  const ctx = makeCtx();
  ctx.helpers.httpRequestWithAuthentication = async () => { const e: any = new Error('x'); e.response = { status: 401, data: { error: { statusCode: 401, name: 'AuthorizationError', message: 'Access denied' } } }; throw e; };
  await expect(dattoEdrApiRequest.call(ctx, 'GET', 'Agents')).rejects.toThrow(/Authentication failed|Access denied/);
});

test('apiRequestAllItems paginates via limit/skip until short page', async () => {
  const page1 = Array.from({ length: 100 }, (_, i) => ({ id: String(i) }));
  const page2 = [{ id: '100' }];
  const ctx = makeCtx({ httpResponses: [page1, page2] });
  const all = await dattoEdrApiRequestAllItems.call(ctx, 'Agents', { where: { active: true } }, 100);
  expect(all).toHaveLength(101);
  // first call skip 0, second skip 100
  const f0 = JSON.parse(ctx._calls[0].qs.filter); const f1 = JSON.parse(ctx._calls[1].qs.filter);
  expect(f0.skip).toBe(0); expect(f0.limit).toBe(100);
  expect(f1.skip).toBe(100);
});

// ── A: fail loud on non-JSON / HTML response ──────────────────────────────

test('dattoEdrApiRequest throws NodeOperationError with /api hint when response is an HTML string', async () => {
  const ctx = makeCtx({ httpResponses: ['<!doctype html><html><body>404</body></html>'] });
  await expect(dattoEdrApiRequest.call(ctx, 'GET', 'Agents')).rejects.toThrow(
    /non-JSON response|ends with \/api/i,
  );
});

test('dattoEdrApiRequest throws when response is any non-object string', async () => {
  const ctx = makeCtx({ httpResponses: ['just a plain string'] });
  await expect(dattoEdrApiRequest.call(ctx, 'GET', 'users/me')).rejects.toThrow(
    /non-JSON/i,
  );
});

test('dattoEdrApiRequestAllItems throws with /api hint when page is a string', async () => {
  const ctx = makeCtx({ httpResponses: ['<!doctype html>...'] });
  await expect(dattoEdrApiRequestAllItems.call(ctx, 'Agents', {})).rejects.toThrow(
    /\/api/i,
  );
});
