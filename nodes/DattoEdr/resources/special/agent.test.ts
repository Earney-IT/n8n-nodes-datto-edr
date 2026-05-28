import { execute, idsArray } from './agent';
import { makeCtx } from '../../__testutils__/makeCtx';

// ─── idsArray helper ─────────────────────────────────────────────────────────

test('idsArray splits comma-separated string into trimmed array', () => {
  expect(idsArray('a, b , c')).toEqual(['a', 'b', 'c']);
});

test('idsArray handles single id with no comma', () => {
  expect(idsArray('abc-123')).toEqual(['abc-123']);
});

test('idsArray filters out empty segments', () => {
  expect(idsArray('  ,  , a  ,  ')).toEqual(['a']);
});

// ─── isolate ─────────────────────────────────────────────────────────────────

test('isolate POSTs to Agents/toggleIsolation with ids array and isolated=true', async () => {
  const ctx = makeCtx({
    params: { operation: 'isolate', agentIds: 'id1, id2', isolate: true },
    httpResponses: [{ success: true }],
  });
  const out = await execute.call(ctx, 'isolate', 0);
  const call = ctx._calls[0];
  expect(call.method).toBe('POST');
  expect(call.url).toContain('Agents/toggleIsolation');
  expect(call.body).toEqual({ ids: ['id1', 'id2'], isolated: true });
  expect(out[0].json).toEqual({ success: true });
});

test('isolate with isolate=false sends isolated=false (release)', async () => {
  const ctx = makeCtx({
    params: { operation: 'isolate', agentIds: 'id3', isolate: false },
    httpResponses: [{ success: true }],
  });
  await execute.call(ctx, 'isolate', 0);
  expect(ctx._calls[0].body).toEqual({ ids: ['id3'], isolated: false });
});

// ─── scan ────────────────────────────────────────────────────────────────────

test('scan POSTs to Agents/scan with ids array and empty scan options', async () => {
  const ctx = makeCtx({
    params: { operation: 'scan', agentIds: 'id1, id2', scanOptions: '{}' },
    httpResponses: [{ jobId: 'j1' }],
  });
  const out = await execute.call(ctx, 'scan', 0);
  const call = ctx._calls[0];
  expect(call.method).toBe('POST');
  expect(call.url).toContain('Agents/scan');
  expect(call.body).toEqual({ ids: ['id1', 'id2'] });
  expect(out[0].json).toEqual({ jobId: 'j1' });
});

test('scan merges extra scanOptions into body', async () => {
  const ctx = makeCtx({
    params: { operation: 'scan', agentIds: 'id1', scanOptions: '{"type":"full"}' },
    httpResponses: [{}],
  });
  await execute.call(ctx, 'scan', 0);
  expect(ctx._calls[0].body).toEqual({ ids: ['id1'], type: 'full' });
});

// ─── uninstall ────────────────────────────────────────────────────────────────

test('uninstall POSTs to Agents/{id}/uninstall with no body', async () => {
  const ctx = makeCtx({
    params: { operation: 'uninstall', agentId: 'agt-99' },
    httpResponses: [{}],
  });
  await execute.call(ctx, 'uninstall', 0);
  const call = ctx._calls[0];
  expect(call.method).toBe('POST');
  expect(call.url).toContain('Agents/agt-99/uninstall');
  // No body should be set (transport skips empty body)
  expect(call.body).toBeUndefined();
});

test('uninstall throws when agentId is missing', async () => {
  const ctx = makeCtx({
    params: { operation: 'uninstall', agentId: '' },
  });
  await expect(execute.call(ctx, 'uninstall', 0)).rejects.toThrow(/agentId/i);
});

// ─── rename ──────────────────────────────────────────────────────────────────

test('rename PATCHes Agents/{id}/rename with { name }', async () => {
  const ctx = makeCtx({
    params: { operation: 'rename', agentId: 'agt-7', name: 'new-name' },
    httpResponses: [{ id: 'agt-7', name: 'new-name' }],
  });
  const out = await execute.call(ctx, 'rename', 0);
  const call = ctx._calls[0];
  expect(call.method).toBe('PATCH');
  expect(call.url).toContain('Agents/agt-7/rename');
  expect(call.body).toEqual({ name: 'new-name' });
  expect(out[0].json).toEqual({ id: 'agt-7', name: 'new-name' });
});

test('rename throws when agentId is missing', async () => {
  const ctx = makeCtx({
    params: { operation: 'rename', agentId: '', name: 'x' },
  });
  await expect(execute.call(ctx, 'rename', 0)).rejects.toThrow(/agentId/i);
});

// ─── retrieveLogs ─────────────────────────────────────────────────────────────

test('retrieveLogs POSTs to Agents/{id}/retrieveLogs with no body', async () => {
  const ctx = makeCtx({
    params: { operation: 'retrieveLogs', agentId: 'agt-5' },
    httpResponses: [{}],
  });
  await execute.call(ctx, 'retrieveLogs', 0);
  const call = ctx._calls[0];
  expect(call.method).toBe('POST');
  expect(call.url).toContain('Agents/agt-5/retrieveLogs');
  expect(call.body).toBeUndefined();
});

test('retrieveLogs throws when agentId is missing', async () => {
  const ctx = makeCtx({
    params: { operation: 'retrieveLogs', agentId: '' },
  });
  await expect(execute.call(ctx, 'retrieveLogs', 0)).rejects.toThrow(/agentId/i);
});

// ─── assignTarget ─────────────────────────────────────────────────────────────

test('assignTarget POSTs to Agents/assignTarget with ids and locationId', async () => {
  const ctx = makeCtx({
    params: { operation: 'assignTarget', agentIds: 'a1, a2', locationId: 'loc-3' },
    httpResponses: [{ count: 2 }],
  });
  const out = await execute.call(ctx, 'assignTarget', 0);
  const call = ctx._calls[0];
  expect(call.method).toBe('POST');
  expect(call.url).toContain('Agents/assignTarget');
  expect(call.body).toEqual({ ids: ['a1', 'a2'], locationId: 'loc-3' });
  expect(out[0].json).toEqual({ count: 2 });
});

// ─── isActive ────────────────────────────────────────────────────────────────

test('isActive GETs Agents/{id}/isActive', async () => {
  const ctx = makeCtx({
    params: { operation: 'isActive', agentId: 'agt-2' },
    httpResponses: [{ active: true }],
  });
  const out = await execute.call(ctx, 'isActive', 0);
  const call = ctx._calls[0];
  expect(call.method).toBe('GET');
  expect(call.url).toContain('Agents/agt-2/isActive');
  expect(out[0].json).toEqual({ active: true });
});

test('isActive throws when agentId is missing', async () => {
  const ctx = makeCtx({
    params: { operation: 'isActive', agentId: '' },
  });
  await expect(execute.call(ctx, 'isActive', 0)).rejects.toThrow(/agentId/i);
});

// ─── scanHistory ─────────────────────────────────────────────────────────────

test('scanHistory GETs Agents/scanHistory and returns array', async () => {
  const ctx = makeCtx({
    params: { operation: 'scanHistory' },
    httpResponses: [[{ scanId: 's1' }, { scanId: 's2' }]],
  });
  const out = await execute.call(ctx, 'scanHistory', 0);
  const call = ctx._calls[0];
  expect(call.method).toBe('GET');
  expect(call.url).toContain('Agents/scanHistory');
  expect(out).toHaveLength(2);
  expect(out[0].json).toEqual({ scanId: 's1' });
});

// ─── delegation: generic op goes to executeGeneric ───────────────────────────

test('getAll delegates to executeGeneric and hits GET /Agents', async () => {
  const items = [{ id: 'ag1' }, { id: 'ag2' }];
  const ctx = makeCtx({
    params: { operation: 'getAll', returnAll: false, limit: 10, filters: {}, options: {} },
    httpResponses: [items],
  });
  const out = await execute.call(ctx, 'getAll', 0);
  const call = ctx._calls[0];
  expect(call.method).toBe('GET');
  expect(call.url).toContain('/Agents');
  expect(out).toHaveLength(2);
});

test('get delegates to executeGeneric and hits GET /Agents/{id}', async () => {
  const agent = { id: 'ag-10', hostname: 'host' };
  const ctx = makeCtx({
    params: { operation: 'get', agentId: 'ag-10', options: {} },
    httpResponses: [agent],
  });
  const out = await execute.call(ctx, 'get', 0);
  expect(ctx._calls[0].method).toBe('GET');
  expect(ctx._calls[0].url).toContain('Agents/ag-10');
  expect(out[0].json).toEqual(agent);
});

// ─── unknown op throws ────────────────────────────────────────────────────────

test('unknown operation throws NodeOperationError', async () => {
  const ctx = makeCtx({ params: { operation: 'unknownOp' } });
  await expect(execute.call(ctx, 'unknownOp', 0)).rejects.toThrow(/unknownOp/i);
});
