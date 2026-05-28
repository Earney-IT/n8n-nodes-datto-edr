import { INodeProperties } from 'n8n-workflow';
import { buildResourceProperties } from './properties';
import { ResourceDescriptor } from '../registry/types';

// typed helpers to avoid implicit-any in .find
function byName(name: string) {
  return (p: INodeProperties) => p.name === name;
}

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
  ],
  filters: [
    {
      name: 'filterHostname',
      property: 'hostname',
      displayName: 'Hostname',
      type: 'string',
    },
  ],
};

// ── operation dropdown ─────────────────────────────────────────────────────

test('emits operation dropdown scoped to the resource', () => {
  const props = buildResourceProperties(agentDescriptor);
  const op = props.find(byName('operation'))!;
  expect(op).toBeDefined();
  expect(op.displayOptions!.show!.resource).toEqual(['agent']);
  expect(op.noDataExpression).toBe(true);
});

test('operation options are sorted alphabetically', () => {
  const props = buildResourceProperties(agentDescriptor);
  const op = props.find(byName('operation'))!;
  const names = (op.options as any[]).map((o: any) => o.name as string);
  expect(names).toEqual([...names].sort());
});

test('operation options include all six ops with correct display names', () => {
  const props = buildResourceProperties(agentDescriptor);
  const op = props.find(byName('operation'))!;
  const opts = op.options as any[];
  const values = opts.map((o: any) => o.value as string);
  expect(values).toContain('getAll');
  expect(values).toContain('get');
  expect(values).toContain('count');
  expect(values).toContain('create');
  expect(values).toContain('update');
  expect(values).toContain('delete');
  expect(opts.find((o: any) => o.value === 'getAll').name).toBe('Get Many');
  expect(opts.find((o: any) => o.value === 'get').name).toBe('Get');
  expect(opts.find((o: any) => o.value === 'count').name).toBe('Count');
  expect(opts.find((o: any) => o.value === 'create').name).toBe('Create');
  expect(opts.find((o: any) => o.value === 'update').name).toBe('Update');
  expect(opts.find((o: any) => o.value === 'delete').name).toBe('Delete');
});

test('each operation option has action and description', () => {
  const props = buildResourceProperties(agentDescriptor);
  const op = props.find(byName('operation'))!;
  for (const opt of op.options as any[]) {
    expect(typeof opt.action).toBe('string');
    expect((opt.action as string).length).toBeGreaterThan(0);
    expect(typeof opt.description).toBe('string');
    expect((opt.description as string).length).toBeGreaterThan(0);
  }
});

test('default is getAll when present', () => {
  const props = buildResourceProperties(agentDescriptor);
  const op = props.find(byName('operation'))!;
  expect(op.default).toBe('getAll');
});

test('default is first op when getAll not present', () => {
  const d: ResourceDescriptor = {
    name: 'report',
    displayName: 'Report',
    model: 'Reports',
    operations: ['get', 'delete'],
    fields: [],
  };
  const props = buildResourceProperties(d);
  const op = props.find(byName('operation'))!;
  expect(op.default).toBe('get');
});

// ── ID param ───────────────────────────────────────────────────────────────

test('id param emitted for get, update, delete but NOT getAll, count, create', () => {
  const props = buildResourceProperties(agentDescriptor);
  const idProp = props.find(byName('agentId'))!;
  expect(idProp).toBeDefined();
  expect(idProp.required).toBe(true);
  const shown = idProp.displayOptions!.show!.operation as string[];
  expect(shown).toContain('get');
  expect(shown).toContain('update');
  expect(shown).toContain('delete');
  expect(shown).not.toContain('getAll');
  expect(shown).not.toContain('count');
  expect(shown).not.toContain('create');
});

test('custom idParam name is used', () => {
  const d: ResourceDescriptor = {
    name: 'alert',
    displayName: 'Alert',
    model: 'Alerts',
    idParam: 'alertId',
    operations: ['get', 'delete'],
    fields: [],
  };
  const props = buildResourceProperties(d);
  expect(props.find(byName('alertId'))).toBeDefined();
});

test('no id param when only getAll/count/create', () => {
  const d: ResourceDescriptor = {
    name: 'flag',
    displayName: 'Flag',
    model: 'Flags',
    operations: ['getAll', 'count', 'create'],
    fields: [],
  };
  const props = buildResourceProperties(d);
  expect(props.find(byName('flagId'))).toBeUndefined();
});

// ── field properties ───────────────────────────────────────────────────────

test('field onOperations defaults to [create, update]', () => {
  const props = buildResourceProperties(agentDescriptor);
  const hostname = props.find(byName('hostname'))!;
  expect(hostname.displayOptions!.show!.operation).toEqual(['create', 'update']);
});

test('explicit onOperations used', () => {
  const d: ResourceDescriptor = {
    name: 'agent',
    displayName: 'Agent',
    model: 'Agents',
    operations: ['getAll', 'get'],
    fields: [
      {
        name: 'active',
        property: 'active',
        displayName: 'Active',
        type: 'boolean',
        onOperations: ['getAll', 'get'],
      },
    ],
  };
  const props = buildResourceProperties(d);
  const active = props.find(byName('active'))!;
  expect(active.displayOptions!.show!.operation).toEqual(['getAll', 'get']);
});

test('required field has required:true', () => {
  const props = buildResourceProperties(agentDescriptor);
  const hostname = props.find(byName('hostname'))!;
  expect(hostname.required).toBe(true);
});

test('loadOptions field gets typeOptions.loadOptionsMethod', () => {
  const d: ResourceDescriptor = {
    name: 'agent',
    displayName: 'Agent',
    model: 'Agents',
    operations: ['create'],
    fields: [
      {
        name: 'targetId',
        property: 'targetId',
        displayName: 'Target',
        type: 'options',
        loadOptionsMethod: 'getTargets',
      },
    ],
  };
  const props = buildResourceProperties(d);
  const targetProp = props.find(byName('targetId')) as any;
  expect(targetProp).toBeDefined();
  expect(targetProp.typeOptions.loadOptionsMethod).toBe('getTargets');
});

test('options field without loadOptionsMethod gets inline options', () => {
  const d: ResourceDescriptor = {
    name: 'agent',
    displayName: 'Agent',
    model: 'Agents',
    operations: ['create'],
    fields: [
      {
        name: 'status',
        property: 'status',
        displayName: 'Status',
        type: 'options',
        options: [
          { name: 'Active', value: 'active' },
          { name: 'Inactive', value: 'inactive' },
        ],
      },
    ],
  };
  const props = buildResourceProperties(d);
  const statusProp = props.find(byName('status'))!;
  expect((statusProp.options as any[]).length).toBe(2);
});

// ── getAll extras ──────────────────────────────────────────────────────────

test('getAll adds returnAll (boolean, default false)', () => {
  const props = buildResourceProperties(agentDescriptor);
  const ra = props.find(byName('returnAll'))!;
  expect(ra).toBeDefined();
  expect(ra.type).toBe('boolean');
  expect(ra.default).toBe(false);
  expect(ra.displayOptions!.show!.operation).toEqual(['getAll']);
  expect(ra.description as string).toMatch(/Whether/i);
});

test('getAll adds limit (number, default 50, shown when returnAll=false)', () => {
  const props = buildResourceProperties(agentDescriptor);
  const lim = props.find(byName('limit'))!;
  expect(lim).toBeDefined();
  expect(lim.type).toBe('number');
  expect(lim.default).toBe(50);
  expect(lim.displayName).toBe('Limit');
  expect(lim.displayOptions!.show!.returnAll).toEqual([false]);
  expect(lim.description as string).toMatch(/Max number of results to return/i);
});

test('getAll adds filters collection from d.filters', () => {
  const props = buildResourceProperties(agentDescriptor);
  const filters = props.find(byName('filters'))!;
  expect(filters).toBeDefined();
  expect(filters.type).toBe('collection');
  const opts = filters.options as any[];
  expect(opts.some((o: any) => (o.displayName as string) === 'Hostname')).toBe(true);
  expect(filters.displayOptions!.show!.operation).toEqual(
    expect.arrayContaining(['getAll']),
  );
});

test('filters collection shown on both getAll and count', () => {
  const props = buildResourceProperties(agentDescriptor);
  const filters = props.find(byName('filters'))!;
  const shown = filters.displayOptions!.show!.operation as string[];
  expect(shown).toContain('getAll');
  expect(shown).toContain('count');
});

test('no filters collection when d.filters is empty/absent', () => {
  const d: ResourceDescriptor = {
    name: 'report',
    displayName: 'Report',
    model: 'Reports',
    operations: ['getAll', 'get'],
    fields: [],
  };
  const props = buildResourceProperties(d);
  expect(props.find(byName('filters'))).toBeUndefined();
});

// ── options collection (order, fields, include) ────────────────────────────

test('options collection on getAll/get contains order and fields sub-options', () => {
  const props = buildResourceProperties(agentDescriptor);
  const options = props.find(byName('options'))!;
  expect(options).toBeDefined();
  const opts = options.options as any[];
  expect(opts.some((o: any) => o.name === 'order')).toBe(true);
  expect(opts.some((o: any) => o.name === 'fields')).toBe(true);
});

test('options collection shown for getAll and get', () => {
  const props = buildResourceProperties(agentDescriptor);
  const options = props.find(byName('options'))!;
  const shown = options.displayOptions!.show!.operation as string[];
  expect(shown).toContain('getAll');
  expect(shown).toContain('get');
});

test('include multiOptions emitted inside options collection when d.includes provided', () => {
  const d: ResourceDescriptor = {
    name: 'agent',
    displayName: 'Agent',
    model: 'Agents',
    operations: ['getAll', 'get'],
    fields: [],
    includes: ['target', 'organization'],
  };
  const props = buildResourceProperties(d);
  const options = props.find(byName('options'))!;
  expect(options).toBeDefined();
  const opts = options.options as any[];
  const includeOpt = opts.find((o: any) => o.name === 'include');
  expect(includeOpt).toBeDefined();
  expect(includeOpt.type).toBe('multiOptions');
});

test('no options collection when only count/create/update/delete ops', () => {
  const d: ResourceDescriptor = {
    name: 'agent',
    displayName: 'Agent',
    model: 'Agents',
    operations: ['create', 'update', 'delete'],
    fields: [],
  };
  const props = buildResourceProperties(d);
  expect(props.find(byName('options'))).toBeUndefined();
});

// ── empty operations guard ─────────────────────────────────────────────────

test('throws when operations array is empty', () => {
  expect(() =>
    buildResourceProperties({
      name: 'x',
      displayName: 'X',
      model: 'Xs',
      operations: [],
      fields: [],
    }),
  ).toThrow(/no operations/i);
});

// ── extraOperationOptions merge ────────────────────────────────────────────

test('extraOperationOptions are merged into the operation dropdown options', () => {
  const extra = [
    {
      name: 'Isolate',
      value: 'isolate',
      action: 'Isolate agents',
      description: 'Isolate agents from the network',
    },
    {
      name: 'Scan',
      value: 'scan',
      action: 'Scan agents',
      description: 'Scan agents for threats',
    },
  ];
  const props = buildResourceProperties(agentDescriptor, extra);
  const op = props.find(byName('operation'))!;
  const values = (op.options as any[]).map((o: any) => o.value as string);
  expect(values).toContain('getAll');
  expect(values).toContain('isolate');
  expect(values).toContain('scan');
});

test('extraOperationOptions are alpha-sorted with built-in ops', () => {
  const extra = [
    { name: 'Zzz Action', value: 'zzz', action: 'Zzz', description: 'z' },
    { name: 'Aaa Action', value: 'aaa', action: 'Aaa', description: 'a' },
  ];
  const props = buildResourceProperties(agentDescriptor, extra);
  const op = props.find(byName('operation'))!;
  const names = (op.options as any[]).map((o: any) => o.name as string);
  // Verify sorted order
  expect(names).toEqual([...names].sort());
  // Aaa Action should appear before Get and Zzz after Update
  expect(names.indexOf('Aaa Action')).toBeLessThan(names.indexOf('Get Many'));
  expect(names.indexOf('Zzz Action')).toBeGreaterThan(names.indexOf('Update'));
});

test('calling buildResourceProperties with no extra options behaves identically to old signature', () => {
  const withEmpty = buildResourceProperties(agentDescriptor, []);
  const withDefault = buildResourceProperties(agentDescriptor);
  const opWithEmpty = withEmpty.find(byName('operation'))!;
  const opWithDefault = withDefault.find(byName('operation'))!;
  expect(opWithEmpty.options).toEqual(opWithDefault.options);
});
