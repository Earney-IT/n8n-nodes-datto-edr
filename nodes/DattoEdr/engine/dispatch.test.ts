import { dispatch } from './dispatch';
import { makeCtx } from '../__testutils__/makeCtx';

// ─── Non-special resource routes to executeGeneric ──────────────────────────

test('routes a non-special resource (flag getAll) to executeGeneric → GET /Flags', async () => {
  const ctx = makeCtx({
    params: { resource: 'flag', operation: 'getAll', returnAll: false, limit: 2 },
    httpResponses: [[{ id: 'f1' }, { id: 'f2' }]],
  });
  const out = await dispatch.call(ctx, 0);
  expect(out).toHaveLength(2);
  expect(ctx._calls[0].url).toMatch(/\/Flags/);
});

// ─── Special resource routes to its handler ──────────────────────────────────

test('routes a special resource (agent isolate) to the special handler → POST /Agents/toggleIsolation', async () => {
  const ctx = makeCtx({
    params: {
      resource: 'agent',
      operation: 'isolate',
      agentIds: 'a1, a2',
      isolate: true,
    },
    httpResponses: [{ ok: true }],
  });
  const out = await dispatch.call(ctx, 0);
  expect(out).toHaveLength(1);
  // Should have called POST /Agents/toggleIsolation
  expect(ctx._calls[0].url).toMatch(/\/Agents\/toggleIsolation/);
  expect(ctx._calls[0].method).toBe('POST');
});

// ─── Unknown resource throws ─────────────────────────────────────────────────

test('unknown resource throws NodeOperationError', async () => {
  const ctx = makeCtx({
    params: { resource: 'unknownResourceXYZ', operation: 'getAll' },
  });
  await expect(dispatch.call(ctx, 0)).rejects.toThrow(/Unsupported resource/);
});
