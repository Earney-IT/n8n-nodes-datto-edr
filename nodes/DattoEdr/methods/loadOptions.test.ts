import { getOrganizations, getTargets, getLocations } from './loadOptions';

/** Minimal ILoadOptionsFunctions context. */
function makeLoadCtx(responses: unknown[]) {
  const calls: any[] = [];
  const q = [...responses];
  const ctx: any = {
    getNode: () => ({ name: 'Datto EDR', type: 'dattoEdr', parameters: {} }),
    getCredentials: async () => ({ baseUrl: 'https://x.infocyte.com/api', apiToken: 't' }),
    helpers: {
      httpRequestWithAuthentication: async (_c: string, o: any) => {
        calls.push(o);
        return q.shift() ?? [];
      },
    },
    _calls: calls,
  };
  return ctx;
}

test('getOrganizations maps and sorts by name', async () => {
  const ctx = makeLoadCtx([
    [
      { id: '2', name: 'Bravo Corp' },
      { id: '1', name: 'Alpha Inc' },
      { id: '3', name: 'Charlie LLC' },
    ],
  ]);
  const opts = await getOrganizations.call(ctx);
  expect(opts).toEqual([
    { name: 'Alpha Inc', value: '1' },
    { name: 'Bravo Corp', value: '2' },
    { name: 'Charlie LLC', value: '3' },
  ]);
});

test('getOrganizations filters items without id', async () => {
  const ctx = makeLoadCtx([
    [
      { id: '1', name: 'Alpha Inc' },
      { name: 'No ID Org' },           // missing id — must be filtered
      { id: '2', name: 'Beta Inc' },
    ],
  ]);
  const opts = await getOrganizations.call(ctx);
  expect(opts.length).toBe(2);
  expect(opts.map((o: any) => o.value)).toEqual(['1', '2']);
});

test('getOrganizations falls back to id when name is missing', async () => {
  const ctx = makeLoadCtx([
    [
      { id: '99' },                 // no name property
      { id: '1', name: 'Alpha Inc' },
    ],
  ]);
  const opts = await getOrganizations.call(ctx);
  // id '99' should appear (with name '99'), sorted after 'Alpha Inc' by string
  const noName = opts.find((o: any) => o.value === '99');
  expect(noName).toBeDefined();
  expect(noName!.name).toBe('99');
});

test('getTargets maps and sorts by name', async () => {
  const ctx = makeLoadCtx([
    [
      { id: 't2', name: 'Target B' },
      { id: 't1', name: 'Target A' },
    ],
  ]);
  const opts = await getTargets.call(ctx);
  expect(opts[0]).toEqual({ name: 'Target A', value: 't1' });
  expect(opts[1]).toEqual({ name: 'Target B', value: 't2' });
});

test('getLocations maps and sorts by name', async () => {
  const ctx = makeLoadCtx([
    [
      { id: 'l2', name: 'Site B' },
      { id: 'l1', name: 'Site A' },
    ],
  ]);
  const opts = await getLocations.call(ctx);
  expect(opts[0]).toEqual({ name: 'Site A', value: 'l1' });
  expect(opts[1]).toEqual({ name: 'Site B', value: 'l2' });
});
