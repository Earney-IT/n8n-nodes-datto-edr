import { ResourceDescriptor } from '../types';

export const descriptor: ResourceDescriptor = {
  name: 'policy',
  displayName: 'Policy',
  model: 'Policies',
  operations: ['getAll', 'get'],
  fields: [],
  filters: [
    {
      displayName: 'Name',
      name: 'name',
      property: 'name',
      type: 'string',
      default: '',
      description: 'Filter by policy name',
    },
    {
      displayName: 'Organization',
      name: 'organizationId',
      property: 'organizationId',
      type: 'options',
      default: '',
      loadOptionsMethod: 'getOrganizations',
      description: 'Filter by organization (via LoopBack where clause on scoped policy lists)',
    },
  ],
};
