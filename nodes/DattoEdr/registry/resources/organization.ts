import { ResourceDescriptor } from '../types';

export const descriptor: ResourceDescriptor = {
  name: 'organization',
  displayName: 'Organization',
  model: 'Organizations',
  operations: ['getAll', 'get', 'count', 'create', 'update'],
  fields: [
    {
      displayName: 'Name',
      name: 'name',
      property: 'name',
      type: 'string',
      default: '',
      required: true,
      description: 'Name of the organization',
      onOperations: ['create', 'update'],
    },
  ],
  filters: [
    {
      displayName: 'Name',
      name: 'name',
      property: 'name',
      type: 'string',
      default: '',
      description: 'Filter by organization name',
    },
  ],
};
