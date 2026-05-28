import { registry, enabledResources } from './index';
import { OperationName, FieldDescriptor, FilterField } from './types';

// ── registry completeness ───────────────────────────────────────────────────

const EXPECTED_NAMES = [
  'agent',
  'alert',
  'box',
  'extension',
  'flag',
  'location',
  'organization',
  'policy',
  'quarantinedFile',
  'report',
  'suppressionRule',
  'target',
  'user',
  'webhook',
] as const;

test('registry has exactly 14 descriptors', () => {
  expect(registry).toHaveLength(14);
});

test('registry contains all expected resource names', () => {
  const names = registry.map((d) => d.name);
  for (const expected of EXPECTED_NAMES) {
    expect(names).toContain(expected);
  }
});

test('registry names are unique', () => {
  const names = registry.map((d) => d.name);
  const unique = new Set(names);
  expect(unique.size).toBe(names.length);
});

test('enabledResources is the same array as registry', () => {
  expect(enabledResources).toBe(registry);
});

// ── per-descriptor shape invariants ────────────────────────────────────────

test('every descriptor has a non-empty operations array', () => {
  for (const d of registry) {
    expect(d.operations.length).toBeGreaterThan(0);
  }
});

test('every descriptor has a non-empty model string', () => {
  for (const d of registry) {
    expect(typeof d.model).toBe('string');
    expect(d.model.length).toBeGreaterThan(0);
  }
});

test('every field has name, property, displayName, and type', () => {
  for (const d of registry) {
    for (const f of d.fields as FieldDescriptor[]) {
      expect(typeof f.name).toBe('string');
      expect(f.name.length).toBeGreaterThan(0);
      expect(typeof f.property).toBe('string');
      expect(f.property.length).toBeGreaterThan(0);
      expect(typeof f.displayName).toBe('string');
      expect(f.displayName.length).toBeGreaterThan(0);
      expect(['string', 'number', 'boolean', 'dateTime', 'options', 'json']).toContain(f.type);
    }
  }
});

test('every filter has name, property, and type', () => {
  for (const d of registry) {
    for (const f of (d.filters ?? []) as FilterField[]) {
      expect(typeof f.name).toBe('string');
      expect(f.name.length).toBeGreaterThan(0);
      expect(typeof f.property).toBe('string');
      expect(f.property.length).toBeGreaterThan(0);
      expect(['string', 'number', 'boolean', 'dateTime', 'options']).toContain(f.type);
    }
  }
});

// ── spot-checks ─────────────────────────────────────────────────────────────

test('agent.special === "agents"', () => {
  const d = registry.find((r) => r.name === 'agent')!;
  expect(d.special).toBe('agents');
});

test('alert.special === "alerts"', () => {
  const d = registry.find((r) => r.name === 'alert')!;
  expect(d.special).toBe('alerts');
});

test('target.special === "targets"', () => {
  const d = registry.find((r) => r.name === 'target')!;
  expect(d.special).toBe('targets');
});

test('quarantinedFile.special === "quarantinedFiles"', () => {
  const d = registry.find((r) => r.name === 'quarantinedFile')!;
  expect(d.special).toBe('quarantinedFiles');
});

test('target has create, update, and delete operations', () => {
  const d = registry.find((r) => r.name === 'target')!;
  expect(d.operations).toContain('create');
  expect(d.operations).toContain('update');
  expect(d.operations).toContain('delete');
});

test('alert has no create, update, or delete operations', () => {
  const d = registry.find((r) => r.name === 'alert')!;
  expect(d.operations).not.toContain('create');
  expect(d.operations).not.toContain('update');
  expect(d.operations).not.toContain('delete');
});

test('flag operations are exactly [getAll, get]', () => {
  const d = registry.find((r) => r.name === 'flag')!;
  expect(d.operations).toHaveLength(2);
  expect(d.operations).toContain('getAll');
  expect(d.operations).toContain('get');
});

test('webhook has a url field', () => {
  const d = registry.find((r) => r.name === 'webhook')!;
  const urlField = d.fields.find((f) => f.name === 'url');
  expect(urlField).toBeDefined();
  expect(urlField!.property).toBe('url');
});

test('webhook has an additionalFields field with property __merge', () => {
  const d = registry.find((r) => r.name === 'webhook')!;
  const mergeField = d.fields.find((f) => f.property === '__merge');
  expect(mergeField).toBeDefined();
  expect(mergeField!.type).toBe('json');
});

test('suppressionRule has a name field (required) and additionalFields with __merge', () => {
  const d = registry.find((r) => r.name === 'suppressionRule')!;
  const nameField = d.fields.find((f) => f.name === 'name');
  expect(nameField).toBeDefined();
  expect(nameField!.required).toBe(true);
  const mergeField = d.fields.find((f) => f.property === '__merge');
  expect(mergeField).toBeDefined();
});

test('organization has no special tag', () => {
  const d = registry.find((r) => r.name === 'organization')!;
  expect(d.special).toBeUndefined();
});

test('agent has count operation', () => {
  const d = registry.find((r) => r.name === 'agent')!;
  expect(d.operations).toContain('count');
});

test('agent does not have create operation (uses special handler for all mutations)', () => {
  const d = registry.find((r) => r.name === 'agent')!;
  expect(d.operations).not.toContain('create');
});

test('every valid OperationName in descriptor is a recognised operation', () => {
  const valid: OperationName[] = ['getAll', 'get', 'count', 'create', 'update', 'delete'];
  for (const d of registry) {
    for (const op of d.operations) {
      expect(valid).toContain(op);
    }
  }
});

test('extension descriptor model is "Extensions"', () => {
  const d = registry.find((r) => r.name === 'extension')!;
  expect(d.model).toBe('Extensions');
});
