import { ResourceDescriptor } from '../types';

export const descriptor: ResourceDescriptor = {
  name: 'location',
  displayName: 'Location',
  model: 'Locations',
  operations: ['getAll', 'get'],
  fields: [],
  filters: [
    {
      displayName: 'Name',
      name: 'name',
      property: 'name',
      type: 'string',
      default: '',
      description: 'Filter by location name',
    },
  ],
};
