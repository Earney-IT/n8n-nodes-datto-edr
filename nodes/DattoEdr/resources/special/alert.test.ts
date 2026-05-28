import { execute } from './alert';
import { makeCtx } from '../../__testutils__/makeCtx';

// ─── archive ─────────────────────────────────────────────────────────────────

test('archive POSTs to Alerts/archive with where qs param', async () => {
  const ctx = makeCtx({
    params: { operation: 'archive', whereFilter: '{"id":"alert-1"}' },
    httpResponses: [{ count: 1 }],
  });
  const out = await execute.call(ctx, 'archive', 0);
  const call = ctx._calls[0];
  expect(call.method).toBe('POST');
  expect(call.url).toContain('Alerts/archive');
  expect(call.qs).toHaveProperty('where');
  expect(JSON.parse(call.qs.where as string)).toEqual({ id: 'alert-1' });
  expect(call.body).toBeUndefined();
  expect(out[0].json).toEqual({ count: 1 });
});

test('archive with empty where sends no where qs param', async () => {
  const ctx = makeCtx({
    params: { operation: 'archive', whereFilter: '{}' },
    httpResponses: [{}],
  });
  await execute.call(ctx, 'archive', 0);
  expect(ctx._calls[0].qs).not.toHaveProperty('where');
});

test('archive accepts where filter as object (not string)', async () => {
  const ctx = makeCtx({
    params: { operation: 'archive', whereFilter: { agentId: 'agt-1' } },
    httpResponses: [{}],
  });
  await execute.call(ctx, 'archive', 0);
  expect(JSON.parse(ctx._calls[0].qs.where as string)).toEqual({ agentId: 'agt-1' });
});

// ─── unarchive ────────────────────────────────────────────────────────────────

test('unarchive POSTs to Alerts/unarchive with where qs param', async () => {
  const ctx = makeCtx({
    params: { operation: 'unarchive', whereFilter: '{"id":"alert-2"}' },
    httpResponses: [{ count: 1 }],
  });
  await execute.call(ctx, 'unarchive', 0);
  const call = ctx._calls[0];
  expect(call.method).toBe('POST');
  expect(call.url).toContain('Alerts/unarchive');
  expect(JSON.parse(call.qs.where as string)).toEqual({ id: 'alert-2' });
});

// ─── respond ─────────────────────────────────────────────────────────────────

test('respond POSTs to Alerts/response with freeform json body', async () => {
  const bodyObj = { alertId: 'al-1', action: 'quarantine' };
  const ctx = makeCtx({
    params: { operation: 'respond', body: JSON.stringify(bodyObj) },
    httpResponses: [{ status: 'ok' }],
  });
  const out = await execute.call(ctx, 'respond', 0);
  const call = ctx._calls[0];
  expect(call.method).toBe('POST');
  expect(call.url).toContain('Alerts/response');
  expect(call.body).toEqual(bodyObj);
  expect(out[0].json).toEqual({ status: 'ok' });
});

test('respond accepts body as object (not string)', async () => {
  const ctx = makeCtx({
    params: { operation: 'respond', body: { alertId: 'al-2', action: 'delete' } },
    httpResponses: [{}],
  });
  await execute.call(ctx, 'respond', 0);
  expect(ctx._calls[0].body).toEqual({ alertId: 'al-2', action: 'delete' });
});

// ─── getComments ─────────────────────────────────────────────────────────────

test('getComments GETs Alerts/{id}/comments and returns array', async () => {
  const comments = [{ id: 'c1', value: 'noted' }, { id: 'c2', value: 'ok' }];
  const ctx = makeCtx({
    params: { operation: 'getComments', alertId: 'al-10' },
    httpResponses: [comments],
  });
  const out = await execute.call(ctx, 'getComments', 0);
  const call = ctx._calls[0];
  expect(call.method).toBe('GET');
  expect(call.url).toContain('Alerts/al-10/comments');
  expect(out).toHaveLength(2);
  expect(out[0].json).toEqual({ id: 'c1', value: 'noted' });
});

test('getComments throws when alertId is missing', async () => {
  const ctx = makeCtx({
    params: { operation: 'getComments', alertId: '' },
  });
  await expect(execute.call(ctx, 'getComments', 0)).rejects.toThrow(/alertId/i);
});

// ─── addComment ───────────────────────────────────────────────────────────────

test('addComment POSTs to Alerts/{id}/comments with { value: comment }', async () => {
  const created = { id: 'c-new', value: 'test comment' };
  const ctx = makeCtx({
    params: { operation: 'addComment', alertId: 'al-5', comment: 'test comment' },
    httpResponses: [created],
  });
  const out = await execute.call(ctx, 'addComment', 0);
  const call = ctx._calls[0];
  expect(call.method).toBe('POST');
  expect(call.url).toContain('Alerts/al-5/comments');
  expect(call.body).toEqual({ value: 'test comment' });
  expect(out[0].json).toEqual(created);
});

test('addComment throws when alertId is missing', async () => {
  const ctx = makeCtx({
    params: { operation: 'addComment', alertId: '', comment: 'hi' },
  });
  await expect(execute.call(ctx, 'addComment', 0)).rejects.toThrow(/alertId/i);
});

// ─── delegation: generic op goes to executeGeneric ───────────────────────────

test('getAll delegates to executeGeneric and hits GET /Alerts', async () => {
  const alerts = [{ id: 'al-1' }, { id: 'al-2' }];
  const ctx = makeCtx({
    params: { operation: 'getAll', returnAll: false, limit: 10, filters: {}, options: {} },
    httpResponses: [alerts],
  });
  const out = await execute.call(ctx, 'getAll', 0);
  expect(ctx._calls[0].method).toBe('GET');
  expect(ctx._calls[0].url).toContain('/Alerts');
  expect(out).toHaveLength(2);
});

test('get delegates to executeGeneric and hits GET /Alerts/{id}', async () => {
  const alert = { id: 'al-20' };
  const ctx = makeCtx({
    params: { operation: 'get', alertId: 'al-20', options: {} },
    httpResponses: [alert],
  });
  const out = await execute.call(ctx, 'get', 0);
  expect(ctx._calls[0].url).toContain('Alerts/al-20');
  expect(out[0].json).toEqual(alert);
});

// ─── unknown op throws ────────────────────────────────────────────────────────

test('unknown operation throws NodeOperationError', async () => {
  const ctx = makeCtx({ params: { operation: 'unknownOp' } });
  await expect(execute.call(ctx, 'unknownOp', 0)).rejects.toThrow(/unknownOp/i);
});
