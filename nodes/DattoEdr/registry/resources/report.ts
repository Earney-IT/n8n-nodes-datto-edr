import { ResourceDescriptor } from '../types';

export const descriptor: ResourceDescriptor = {
  name: 'report',
  displayName: 'Report',
  model: 'Reports',
  operations: ['getAll', 'get'],
  fields: [],
  filters: [
    {
      displayName: 'Name',
      name: 'name',
      property: 'name',
      type: 'string',
      default: '',
      description: 'Filter by report name',
    },
  ],
};
