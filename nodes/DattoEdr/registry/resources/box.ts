import { ResourceDescriptor } from '../types';

export const descriptor: ResourceDescriptor = {
  name: 'box',
  displayName: 'Box',
  model: 'Boxes',
  operations: ['getAll', 'get'],
  fields: [],
  filters: [
    {
      displayName: 'Name',
      name: 'name',
      property: 'name',
      type: 'string',
      default: '',
      description: 'Filter by box name',
    },
    {
      displayName: 'Target ID',
      name: 'targetId',
      property: 'targetId',
      type: 'string',
      default: '',
      description: 'Filter by target group ID',
    },
  ],
};
