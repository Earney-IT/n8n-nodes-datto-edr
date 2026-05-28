import { ResourceDescriptor, FieldDescriptor, FilterField, OperationName } from './types';

test('minimal ResourceDescriptor type-checks and basic shape assertions', () => {
  const op: OperationName = 'getAll';
  const field: FieldDescriptor = {
    displayName: 'Hostname',
    name: 'hostname',
    property: 'hostname',
    type: 'string',
    required: true,
    default: '',
    description: 'The agent hostname',
    onOperations: ['create', 'update'],
  };
  const filter: FilterField = {
    name: 'filterHostname',
    property: 'hostname',
    displayName: 'Hostname',
    type: 'string',
    description: 'Filter by hostname',
  };
  const d: ResourceDescriptor = {
    name: 'agent',
    displayName: 'Agent',
    model: 'Agents',
    operations: [op, 'get', 'count', 'update', 'delete'],
    fields: [field],
    filters: [filter],
    includes: ['target', 'organization'],
  };
  expect(d.fields[0].name).toBe('hostname');
  expect(d.fields[0].property).toBe('hostname');
  expect(d.operations).toContain('getAll');
  expect(d.model).toBe('Agents');
});

test('FieldDescriptor with loadOptionsMethod and options compiles', () => {
  const f: FieldDescriptor = {
    name: 'targetId',
    property: 'targetId',
    displayName: 'Target',
    type: 'options',
    loadOptionsMethod: 'getTargets',
    options: [{ name: 'Group A', value: 'groupA' }],
  };
  expect(f.loadOptionsMethod).toBe('getTargets');
  expect(f.options![0].value).toBe('groupA');
});

test('OperationName covers all six CRUD ops plus count', () => {
  const ops: OperationName[] = ['getAll', 'get', 'count', 'create', 'update', 'delete'];
  expect(ops).toHaveLength(6);
});

test('ResourceDescriptor idParam defaults logic (no idParam field)', () => {
  const d: ResourceDescriptor = {
    name: 'webhook',
    displayName: 'Webhook',
    model: 'Webhooks',
    operations: ['get', 'create'],
    fields: [],
  };
  // idParam is optional; if absent, engine uses `${name}Id`
  expect(d.idParam).toBeUndefined();
});

test('ResourceDescriptor with special tag', () => {
  const d: ResourceDescriptor = {
    name: 'agent',
    displayName: 'Agent',
    model: 'Agents',
    operations: ['getAll'],
    fields: [],
    special: 'agents',
  };
  expect(d.special).toBe('agents');
});
