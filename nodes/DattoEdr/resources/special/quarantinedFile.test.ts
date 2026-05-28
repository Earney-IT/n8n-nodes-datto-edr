import { execute } from './quarantinedFile';
import { makeCtx } from '../../__testutils__/makeCtx';

// ─── deleteFiles ──────────────────────────────────────────────────────────────

test('deleteFiles POSTs to QuarantinedFiles/createDeleteFileJobs with where qs param', async () => {
  const ctx = makeCtx({
    params: { operation: 'deleteFiles', whereFilter: '{"agentId":"agt-1"}' },
    httpResponses: [{ count: 3 }],
  });
  const out = await execute.call(ctx, 'deleteFiles', 0);
  const call = ctx._calls[0];
  expect(call.method).toBe('POST');
  expect(call.url).toContain('QuarantinedFiles/createDeleteFileJobs');
  expect(call.qs).toHaveProperty('where');
  expect(JSON.parse(call.qs.where as string)).toEqual({ agentId: 'agt-1' });
  expect(call.body).toBeUndefined();
  expect(out[0].json).toEqual({ count: 3 });
});

test('deleteFiles with empty where sends no where qs param', async () => {
  const ctx = makeCtx({
    params: { operation: 'deleteFiles', whereFilter: '{}' },
    httpResponses: [{}],
  });
  await execute.call(ctx, 'deleteFiles', 0);
  expect(ctx._calls[0].qs).not.toHaveProperty('where');
});

test('deleteFiles accepts whereFilter as object (not string)', async () => {
  const ctx = makeCtx({
    params: { operation: 'deleteFiles', whereFilter: { id: 'qf-1' } },
    httpResponses: [{}],
  });
  await execute.call(ctx, 'deleteFiles', 0);
  expect(JSON.parse(ctx._calls[0].qs.where as string)).toEqual({ id: 'qf-1' });
});

// ─── restoreFiles ─────────────────────────────────────────────────────────────

test('restoreFiles POSTs to QuarantinedFiles/createRestoreFileJobs with where qs param', async () => {
  const ctx = makeCtx({
    params: { operation: 'restoreFiles', whereFilter: '{"id":"qf-2"}' },
    httpResponses: [{ count: 1 }],
  });
  const out = await execute.call(ctx, 'restoreFiles', 0);
  const call = ctx._calls[0];
  expect(call.method).toBe('POST');
  expect(call.url).toContain('QuarantinedFiles/createRestoreFileJobs');
  expect(JSON.parse(call.qs.where as string)).toEqual({ id: 'qf-2' });
  expect(call.body).toBeUndefined();
  expect(out[0].json).toEqual({ count: 1 });
});

test('restoreFiles with empty where sends no where qs param', async () => {
  const ctx = makeCtx({
    params: { operation: 'restoreFiles', whereFilter: '{}' },
    httpResponses: [{}],
  });
  await execute.call(ctx, 'restoreFiles', 0);
  expect(ctx._calls[0].qs).not.toHaveProperty('where');
});

// ─── delegation: generic op goes to executeGeneric ───────────────────────────

test('getAll delegates to executeGeneric and hits GET /QuarantinedFiles', async () => {
  const files = [{ id: 'qf1' }, { id: 'qf2' }];
  const ctx = makeCtx({
    params: { operation: 'getAll', returnAll: false, limit: 10, filters: {}, options: {} },
    httpResponses: [files],
  });
  const out = await execute.call(ctx, 'getAll', 0);
  expect(ctx._calls[0].method).toBe('GET');
  expect(ctx._calls[0].url).toContain('/QuarantinedFiles');
  expect(out).toHaveLength(2);
});

test('get delegates to executeGeneric and hits GET /QuarantinedFiles/{id}', async () => {
  const file = { id: 'qf-10', hostname: 'host' };
  const ctx = makeCtx({
    params: { operation: 'get', quarantinedFileId: 'qf-10', options: {} },
    httpResponses: [file],
  });
  const out = await execute.call(ctx, 'get', 0);
  expect(ctx._calls[0].url).toContain('QuarantinedFiles/qf-10');
  expect(out[0].json).toEqual(file);
});

// ─── unknown op throws ────────────────────────────────────────────────────────

test('unknown operation throws NodeOperationError', async () => {
  const ctx = makeCtx({ params: { operation: 'unknownOp' } });
  await expect(execute.call(ctx, 'unknownOp', 0)).rejects.toThrow(/unknownOp/i);
});
