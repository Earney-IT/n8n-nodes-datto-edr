import { executeGeneric } from './crud';
import { makeCtx } from '../__testutils__/makeCtx';
import { ResourceDescriptor } from '../registry/types';

const agentDescriptor: ResourceDescriptor = {
  name: 'agent',
  displayName: 'Agent',
  model: 'Agents',
  operations: ['getAll', 'get', 'count', 'create', 'update', 'delete'],
  fields: [
    {
      name: 'hostname',
      property: 'hostname',
      displayName: 'Hostname',
      type: 'string',
      required: true,
    },
    {
      name: 'osVersion',
      property: 'osVersion',
      displayName: 'OS Version',
      type: 'string',
    },
  ],
  filters: [
    {
      name: 'filterHostname',
      property: 'hostname',
      displayName: 'Hostname',
      type: 'string',
    },
    {
      name: 'filterActive',
      property: 'active',
      displayName: 'Active',
      type: 'boolean',
    },
  ],
  includes: ['target', 'organization'],
};

// ── create ─────────────────────────────────────────────────────────────────

test('create POSTs plain JSON body to /Agents and returns the created object', async () => {
  const created = { id: '42', hostname: 'myhost', osVersion: '10' };
  const ctx = makeCtx({
    params: { operation: 'create', hostname: 'myhost', osVersion: '10' },
    httpResponses: [created],
  });
  const out = await executeGeneric.call(ctx, agentDescriptor, 0);
  expect(ctx._calls[0].method).toBe('POST');
  expect(ctx._calls[0].url).toBe('https://x.infocyte.com/api/Agents');
  expect(ctx._calls[0].body).toEqual({ hostname: 'myhost', osVersion: '10' });
  expect(out[0].json).toEqual(created);
});

test('create skips optional fields with empty string value', async () => {
  const created = { id: '43', hostname: 'host2' };
  const ctx = makeCtx({
    params: { operation: 'create', hostname: 'host2', osVersion: '' },
    httpResponses: [created],
  });
  await executeGeneric.call(ctx, agentDescriptor, 0);
  expect(ctx._calls[0].body).toEqual({ hostname: 'host2' });
});

test('create includes required field even when value is empty string', async () => {
  // required=true means we include it regardless
  const created = { id: '44', hostname: '' };
  const ctx = makeCtx({
    params: { operation: 'create', hostname: '' },
    httpResponses: [created],
  });
  await executeGeneric.call(ctx, agentDescriptor, 0);
  expect(ctx._calls[0].body).toHaveProperty('hostname', '');
});

// ── getAll ─────────────────────────────────────────────────────────────────

test('getAll with returnAll=false and limit=2 GETs /Agents with filter containing limit 2', async () => {
  const items = [{ id: '1' }, { id: '2' }];
  const ctx = makeCtx({
    params: { operation: 'getAll', returnAll: false, limit: 2, filters: {}, options: {} },
    httpResponses: [items],
  });
  const out = await executeGeneric.call(ctx, agentDescriptor, 0);
  expect(ctx._calls[0].method).toBe('GET');
  expect(ctx._calls[0].url).toBe('https://x.infocyte.com/api/Agents');
  const filter = JSON.parse(ctx._calls[0].qs.filter as string);
  expect(filter.limit).toBe(2);
  expect(out).toHaveLength(2);
  expect(out[0].json).toEqual({ id: '1' });
});

test('getAll with returnAll=true calls dattoEdrApiRequestAllItems (no filter.limit)', async () => {
  const page1 = Array.from({ length: 100 }, (_, i) => ({ id: String(i) }));
  const page2 = [{ id: '100' }];
  const ctx = makeCtx({
    params: { operation: 'getAll', returnAll: true, filters: {}, options: {} },
    httpResponses: [page1, page2],
  });
  const out = await executeGeneric.call(ctx, agentDescriptor, 0);
  expect(out).toHaveLength(101);
  // each call has a filter but none has user-set limit=2
  const f0 = JSON.parse(ctx._calls[0].qs.filter as string);
  expect(f0.limit).toBe(100); // pagination page size, not user limit
});

test('getAll applies where filters correctly', async () => {
  const items = [{ id: '5', hostname: 'srv-01' }];
  const ctx = makeCtx({
    params: {
      operation: 'getAll',
      returnAll: false,
      limit: 50,
      filters: { filterHostname: 'srv-01' },
      options: {},
    },
    httpResponses: [items],
  });
  await executeGeneric.call(ctx, agentDescriptor, 0);
  const filter = JSON.parse(ctx._calls[0].qs.filter as string);
  expect(filter.where).toEqual({ hostname: 'srv-01' });
});

test('getAll applies order and fields from options collection', async () => {
  const items: unknown[] = [];
  const ctx = makeCtx({
    params: {
      operation: 'getAll',
      returnAll: false,
      limit: 10,
      filters: {},
      options: { order: 'createdOn DESC', fields: 'id,hostname' },
    },
    httpResponses: [items],
  });
  await executeGeneric.call(ctx, agentDescriptor, 0);
  const filter = JSON.parse(ctx._calls[0].qs.filter as string);
  expect(filter.order).toBe('createdOn DESC');
  expect(filter.fields).toEqual(['id', 'hostname']);
});

test('getAll applies include from options collection', async () => {
  const items: unknown[] = [];
  const ctx = makeCtx({
    params: {
      operation: 'getAll',
      returnAll: false,
      limit: 10,
      filters: {},
      options: { include: ['target', 'organization'] },
    },
    httpResponses: [items],
  });
  await executeGeneric.call(ctx, agentDescriptor, 0);
  const filter = JSON.parse(ctx._calls[0].qs.filter as string);
  expect(filter.include).toEqual(['target', 'organization']);
});

// ── get ────────────────────────────────────────────────────────────────────

test('get GETs /Agents/{id} and returns the object', async () => {
  const agent = { id: '7', hostname: 'host-7' };
  const ctx = makeCtx({
    params: { operation: 'get', agentId: '7', options: {} },
    httpResponses: [agent],
  });
  const out = await executeGeneric.call(ctx, agentDescriptor, 0);
  expect(ctx._calls[0].method).toBe('GET');
  expect(ctx._calls[0].url).toBe('https://x.infocyte.com/api/Agents/7');
  expect(out[0].json).toEqual(agent);
});

test('get with include passes include in filter qs', async () => {
  const agent = { id: '7' };
  const ctx = makeCtx({
    params: { operation: 'get', agentId: '7', options: { include: ['target'] } },
    httpResponses: [agent],
  });
  await executeGeneric.call(ctx, agentDescriptor, 0);
  const filter = JSON.parse(ctx._calls[0].qs.filter as string);
  expect(filter.include).toEqual(['target']);
});

// ── count ──────────────────────────────────────────────────────────────────

test('count GETs /Agents/count and returns {count:n}', async () => {
  const ctx = makeCtx({
    params: { operation: 'count', filters: {} },
    httpResponses: [{ count: 42 }],
  });
  const out = await executeGeneric.call(ctx, agentDescriptor, 0);
  expect(ctx._calls[0].method).toBe('GET');
  expect(ctx._calls[0].url).toBe('https://x.infocyte.com/api/Agents/count');
  expect(out[0].json).toEqual({ count: 42 });
});

test('count with where filter passes where as JSON string in qs', async () => {
  const ctx = makeCtx({
    params: { operation: 'count', filters: { filterHostname: 'box-1' } },
    httpResponses: [{ count: 3 }],
  });
  await executeGeneric.call(ctx, agentDescriptor, 0);
  const qs = ctx._calls[0].qs as Record<string, unknown>;
  const where = JSON.parse(qs.where as string);
  expect(where).toEqual({ hostname: 'box-1' });
});

test('count with no filters sends no where qs param', async () => {
  const ctx = makeCtx({
    params: { operation: 'count', filters: {} },
    httpResponses: [{ count: 100 }],
  });
  await executeGeneric.call(ctx, agentDescriptor, 0);
  expect(ctx._calls[0].qs).not.toHaveProperty('where');
});

// ── update ─────────────────────────────────────────────────────────────────

test('update PATCHes /Agents/{id} with partial body', async () => {
  const updated = { id: '7', hostname: 'new-host' };
  const ctx = makeCtx({
    params: { operation: 'update', agentId: '7', hostname: 'new-host', osVersion: '' },
    httpResponses: [updated],
  });
  const out = await executeGeneric.call(ctx, agentDescriptor, 0);
  expect(ctx._calls[0].method).toBe('PATCH');
  expect(ctx._calls[0].url).toBe('https://x.infocyte.com/api/Agents/7');
  expect(ctx._calls[0].body).toEqual({ hostname: 'new-host' });
  expect(out[0].json).toEqual(updated);
});

// ── delete ─────────────────────────────────────────────────────────────────

test('delete DELETEs /Agents/{id} and returns {success:true,id}', async () => {
  const ctx = makeCtx({
    params: { operation: 'delete', agentId: '9' },
    httpResponses: [{ count: 1 }],
  });
  const out = await executeGeneric.call(ctx, agentDescriptor, 0);
  expect(ctx._calls[0].method).toBe('DELETE');
  expect(ctx._calls[0].url).toBe('https://x.infocyte.com/api/Agents/9');
  expect(out[0].json).toEqual({ success: true, id: '9' });
});

// ── missing id errors ──────────────────────────────────────────────────────

test('get with missing agentId throws descriptive NodeOperationError', async () => {
  const ctx = makeCtx({
    params: { operation: 'get', options: {} },
    httpResponses: [{}],
  });
  await expect(executeGeneric.call(ctx, agentDescriptor, 0)).rejects.toThrow(
    /agentId.*required|required.*agentId/i,
  );
});

test('update with missing agentId throws', async () => {
  const ctx = makeCtx({
    params: { operation: 'update', hostname: 'x' },
    httpResponses: [{}],
  });
  await expect(executeGeneric.call(ctx, agentDescriptor, 0)).rejects.toThrow(/agentId/i);
});

test('delete with missing agentId throws', async () => {
  const ctx = makeCtx({
    params: { operation: 'delete' },
    httpResponses: [{}],
  });
  await expect(executeGeneric.call(ctx, agentDescriptor, 0)).rejects.toThrow(/agentId/i);
});

// ── json field type ────────────────────────────────────────────────────────

test('json-type field: string value is parsed to object before sending', async () => {
  const d: ResourceDescriptor = {
    name: 'webhook',
    displayName: 'Webhook',
    model: 'Webhooks',
    operations: ['create'],
    fields: [
      {
        name: 'headers',
        property: 'headers',
        displayName: 'Headers',
        type: 'json',
      },
    ],
  };
  const ctx = makeCtx({
    params: { operation: 'create', headers: '{"X-Custom":"value"}' },
    httpResponses: [{ id: '1' }],
  });
  await executeGeneric.call(ctx, d, 0);
  expect(ctx._calls[0].body).toEqual({ headers: { 'X-Custom': 'value' } });
});

// ── custom idParam ─────────────────────────────────────────────────────────

test('custom idParam used for get/update/delete', async () => {
  const d: ResourceDescriptor = {
    name: 'alert',
    displayName: 'Alert',
    model: 'Alerts',
    idParam: 'alertId',
    operations: ['get', 'delete'],
    fields: [],
  };
  const alert = { id: '55' };
  const ctx = makeCtx({
    params: { operation: 'get', alertId: '55', options: {} },
    httpResponses: [alert],
  });
  const out = await executeGeneric.call(ctx, d, 0);
  expect(ctx._calls[0].url).toBe('https://x.infocyte.com/api/Alerts/55');
  expect(out[0].json).toEqual(alert);
});

// ── get with a real empty-object response ──────────────────────────────────

test('get returns empty object from API without throwing', async () => {
  // makeCtx queues: null → shift() returns null → null ?? [] → [] (from makeCtx)
  // So empty array is the neutral "nothing queued" case; empty object {} is a valid stub response.
  const ctx = makeCtx({
    params: { operation: 'get', agentId: '99', options: {} },
    httpResponses: [{}],
  });
  const out = await executeGeneric.call(ctx, agentDescriptor, 0);
  // Engine returns whatever the transport returned, wrapped in returnJsonArray
  expect(out[0].json).toEqual({});
});

// ── __merge / additionalFields convention ──────────────────────────────────

test('__merge field: parsed JSON is spread into the body, not set as body["__merge"]', async () => {
  const d: ResourceDescriptor = {
    name: 'suppressionRule',
    displayName: 'Suppression Rule',
    model: 'SuppressionRules',
    operations: ['create'],
    fields: [
      {
        name: 'name',
        property: 'name',
        displayName: 'Name',
        type: 'string',
        required: true,
        onOperations: ['create'],
      },
      {
        name: 'additionalFields',
        property: '__merge',
        displayName: 'Additional Fields',
        type: 'json',
        default: '{}',
        onOperations: ['create'],
      },
    ],
  };
  const ctx = makeCtx({
    params: {
      operation: 'create',
      name: 'Block Mimikatz',
      additionalFields: '{"description":"Suppress known FP","organizationId":"org-1"}',
    },
    httpResponses: [{ id: '99' }],
  });
  await executeGeneric.call(ctx, d, 0);
  expect(ctx._calls[0].body).not.toHaveProperty('__merge');
  expect(ctx._calls[0].body).toEqual({
    name: 'Block Mimikatz',
    description: 'Suppress known FP',
    organizationId: 'org-1',
  });
});

test('__merge field with empty JSON object {} does not alter body', async () => {
  const d: ResourceDescriptor = {
    name: 'webhook',
    displayName: 'Webhook',
    model: 'Webhooks',
    operations: ['create'],
    fields: [
      {
        name: 'url',
        property: 'url',
        displayName: 'URL',
        type: 'string',
        required: true,
        onOperations: ['create'],
      },
      {
        name: 'additionalFields',
        property: '__merge',
        displayName: 'Additional Fields',
        type: 'json',
        default: '{}',
        onOperations: ['create'],
      },
    ],
  };
  const ctx = makeCtx({
    params: {
      operation: 'create',
      url: 'https://example.com/hook',
      additionalFields: '{}',
    },
    httpResponses: [{ id: '1' }],
  });
  await executeGeneric.call(ctx, d, 0);
  expect(ctx._calls[0].body).not.toHaveProperty('__merge');
  expect(ctx._calls[0].body).toEqual({ url: 'https://example.com/hook' });
});
