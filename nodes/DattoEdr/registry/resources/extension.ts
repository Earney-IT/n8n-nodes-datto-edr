import { ResourceDescriptor } from '../types';

// NOTE: Live testing showed that GET /Extensions without any filter returns HTTP 400.
// The engine sends buildFilterQs(baseFilter) which includes at least `limit` when
// returnAll=false (limit is added to baseFilter before the call). For returnAll=true,
// dattoEdrApiRequestAllItems always sets limit in the filter. This means a non-empty
// filter (with at least `limit`) is always sent, satisfying the API requirement.
export const descriptor: ResourceDescriptor = {
  name: 'extension',
  displayName: 'Extension',
  model: 'Extensions',
  operations: ['getAll', 'get'],
  fields: [],
  filters: [
    {
      displayName: 'Name',
      name: 'name',
      property: 'name',
      type: 'string',
      default: '',
      description: 'Filter by extension name',
    },
    {
      displayName: 'Type',
      name: 'type',
      property: 'type',
      type: 'string',
      default: '',
      description: 'Filter by extension type',
    },
  ],
};
