import { execute } from './target';
import { makeCtx } from '../../__testutils__/makeCtx';

// ─── listAgents ───────────────────────────────────────────────────────────────

test('listAgents GETs Targets/{id}/agents with limit filter', async () => {
  const agents = [{ id: 'ag1' }, { id: 'ag2' }];
  const ctx = makeCtx({
    params: { operation: 'listAgents', targetId: 'tgt-1', returnAll: false, limit: 10 },
    httpResponses: [agents],
  });
  const out = await execute.call(ctx, 'listAgents', 0);
  const call = ctx._calls[0];
  expect(call.method).toBe('GET');
  expect(call.url).toContain('Targets/tgt-1/agents');
  // Filter should encode a limit
  const filter = JSON.parse(call.qs.filter as string);
  expect(filter.limit).toBe(10);
  expect(out).toHaveLength(2);
  expect(out[0].json).toEqual({ id: 'ag1' });
});

test('listAgents with returnAll=true paginates through all agents', async () => {
  // Page 1: 100 items (full page) — triggers second request
  const page1 = Array.from({ length: 100 }, (_, i) => ({ id: `ag-${i}` }));
  // Page 2: fewer than 100 — stops pagination
  const page2 = [{ id: 'ag-100' }, { id: 'ag-101' }];
  const ctx = makeCtx({
    params: { operation: 'listAgents', targetId: 'tgt-2', returnAll: true },
    httpResponses: [page1, page2],
  });
  const out = await execute.call(ctx, 'listAgents', 0);
  // First call should go to Targets/tgt-2/agents
  expect(ctx._calls[0].url).toContain('Targets/tgt-2/agents');
  expect(out).toHaveLength(102);
});

test('listAgents default limit is 50', async () => {
  const ctx = makeCtx({
    params: { operation: 'listAgents', targetId: 'tgt-3', returnAll: false },
    httpResponses: [[{ id: 'ag1' }]],
  });
  await execute.call(ctx, 'listAgents', 0);
  const filter = JSON.parse(ctx._calls[0].qs.filter as string);
  expect(filter.limit).toBe(50);
});

test('listAgents throws when targetId is missing', async () => {
  const ctx = makeCtx({
    params: { operation: 'listAgents', targetId: '', returnAll: false, limit: 10 },
  });
  await expect(execute.call(ctx, 'listAgents', 0)).rejects.toThrow(/targetId/i);
});

// ─── delegation: generic op goes to executeGeneric ───────────────────────────

test('getAll delegates to executeGeneric and hits GET /Targets', async () => {
  const targets = [{ id: 't1' }, { id: 't2' }];
  const ctx = makeCtx({
    params: { operation: 'getAll', returnAll: false, limit: 10, filters: {}, options: {} },
    httpResponses: [targets],
  });
  const out = await execute.call(ctx, 'getAll', 0);
  expect(ctx._calls[0].method).toBe('GET');
  expect(ctx._calls[0].url).toContain('/Targets');
  expect(out).toHaveLength(2);
});

test('get delegates to executeGeneric and hits GET /Targets/{id}', async () => {
  const target = { id: 'tgt-7', name: 'Finance' };
  const ctx = makeCtx({
    params: { operation: 'get', targetId: 'tgt-7', options: {} },
    httpResponses: [target],
  });
  const out = await execute.call(ctx, 'get', 0);
  expect(ctx._calls[0].url).toContain('Targets/tgt-7');
  expect(out[0].json).toEqual(target);
});

test('create delegates to executeGeneric and POSTs to /Targets', async () => {
  const created = { id: 'tgt-new', name: 'NewGroup' };
  const ctx = makeCtx({
    params: { operation: 'create', name: 'NewGroup', description: '' },
    httpResponses: [created],
  });
  const out = await execute.call(ctx, 'create', 0);
  expect(ctx._calls[0].method).toBe('POST');
  expect(ctx._calls[0].url).toContain('/Targets');
  expect(out[0].json).toEqual(created);
});

// ─── unknown op throws ────────────────────────────────────────────────────────

test('unknown operation throws NodeOperationError', async () => {
  const ctx = makeCtx({ params: { operation: 'unknownOp' } });
  await expect(execute.call(ctx, 'unknownOp', 0)).rejects.toThrow(/unknownOp/i);
});
