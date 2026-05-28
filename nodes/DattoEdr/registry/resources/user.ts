import { ResourceDescriptor } from '../types';

// Note: the /users/me convenience route (credential validation) is handled by the
// transport layer (credential test). Expose getAll/get for agent/admin use cases.
// A dedicated 'me' operation could be added at the node layer in a future DT5 task.
export const descriptor: ResourceDescriptor = {
  name: 'user',
  displayName: 'User',
  model: 'users',
  operations: ['getAll', 'get'],
  fields: [],
  filters: [
    {
      displayName: 'Email',
      name: 'email',
      property: 'email',
      type: 'string',
      default: '',
      placeholder: 'name@email.com',
      description: 'Filter by email address',
    },
    {
      displayName: 'Username',
      name: 'name',
      property: 'username',
      type: 'string',
      default: '',
      description: 'Filter by username',
    },
  ],
};
