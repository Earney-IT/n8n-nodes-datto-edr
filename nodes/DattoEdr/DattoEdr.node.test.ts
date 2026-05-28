import { DattoEdr } from './DattoEdr.node';

// ─── Static description checks ───────────────────────────────────────────────

test('node is usableAsTool with correct name', () => {
  const n = new DattoEdr();
  expect(n.description.usableAsTool).toBe(true);
  expect(n.description.name).toBe('dattoEdr');
});

test('resource options include agent, alert, target, quarantinedFile', () => {
  const n = new DattoEdr();
  const resourceProp = n.description.properties.find((p) => p.name === 'resource')!;
  const vals = (resourceProp.options as Array<{ value: string }>).map((o) => o.value);
  expect(vals).toContain('agent');
  expect(vals).toContain('alert');
  expect(vals).toContain('target');
  expect(vals).toContain('quarantinedFile');
});

test('agent operation dropdown includes generic (getAll) and custom (isolate, scan) options', () => {
  const n = new DattoEdr();
  // Find the operation property scoped to resource=agent
  const agentOpProp = n.description.properties.find(
    (p) =>
      p.name === 'operation' &&
      (p.displayOptions?.show as any)?.resource?.includes('agent'),
  )!;
  expect(agentOpProp).toBeDefined();
  const values = (agentOpProp.options as Array<{ value: string }>).map((o) => o.value);
  // Generic op
  expect(values).toContain('getAll');
  // Custom ops from the agent special handler
  expect(values).toContain('isolate');
  expect(values).toContain('scan');
});

// ─── Execute passthrough (flag getAll) ───────────────────────────────────────

test('execute returns flag records for resource=flag operation=getAll', async () => {
  const node = new DattoEdr();
  const ctx: any = {
    getInputData: () => [{ json: {} }],
    getNode: () => ({ name: 'Datto EDR', type: 'dattoEdr', parameters: {} }),
    getMode: () => 'manual',
    isToolExecution: () => false,
    continueOnFail: () => false,
    getNodeParameter: (nm: string, _i: number, d?: unknown) =>
      ({
        resource: 'flag',
        operation: 'getAll',
        returnAll: false,
        limit: 1,
        filters: {},
        options: {},
      } as any)[nm] ?? d,
    getCredentials: async () => ({ baseUrl: 'https://x.infocyte.com/api', apiToken: 't' }),
    helpers: {
      httpRequestWithAuthentication: async () => [{ id: '1' }],
      returnJsonArray: (x: any) =>
        (Array.isArray(x) ? x : [x]).map((j: any) => ({ json: j })),
    },
  };
  const out = await node.execute.call(ctx);
  expect(out[0][0].json.id).toBe('1');
});

// ─── n8n #26202: empty result → found:0 envelope ────────────────────────────

test('empty result yields found:0 envelope (n8n #26202)', async () => {
  const node = new DattoEdr();
  const ctx: any = {
    getInputData: () => [{ json: {} }],
    getNode: () => ({ name: 'Datto EDR', type: 'dattoEdr', parameters: {} }),
    getMode: () => 'manual',
    isToolExecution: () => false,
    continueOnFail: () => false,
    getNodeParameter: (nm: string, _i: number, d?: unknown) =>
      ({
        resource: 'flag',
        operation: 'getAll',
        returnAll: false,
        limit: 50,
        filters: {},
        options: {},
      } as any)[nm] ?? d,
    getCredentials: async () => ({ baseUrl: 'https://x.infocyte.com/api', apiToken: 't' }),
    helpers: {
      httpRequestWithAuthentication: async () => [],
      returnJsonArray: (x: any) =>
        (Array.isArray(x) ? x : [x]).map((j: any) => ({ json: j })),
    },
  };
  const out = await node.execute.call(ctx);
  expect(out[0][0].json.found).toBe(0);
  expect(out[0][0].json.resource).toBe('flag');
});
