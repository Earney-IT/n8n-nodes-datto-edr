// Custom actions (e.g. listAgents) are added by the special handler in resources/special/
// and the node's operation list — see DT4.
import { ResourceDescriptor } from '../types';

export const descriptor: ResourceDescriptor = {
  name: 'target',
  displayName: 'Target',
  model: 'Targets',
  operations: ['getAll', 'get', 'count', 'create', 'update', 'delete'],
  special: 'targets',
  fields: [
    {
      // Required conceptually when creating; not enforced at the descriptor level
      // so that update does not force an empty name into the PATCH body.
      // The API will reject a create without a name.
      displayName: 'Name',
      name: 'name',
      property: 'name',
      type: 'string',
      default: '',
      required: false,
      description: 'Name of the target group (required when creating)',
      onOperations: ['create', 'update'],
    },
    {
      displayName: 'Description',
      name: 'description',
      property: 'description',
      type: 'string',
      default: '',
      description: 'Description of the target group',
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
      description: 'Filter by target name',
    },
    {
      displayName: 'Organization',
      name: 'organizationId',
      property: 'organizationId',
      type: 'options',
      default: '',
      loadOptionsMethod: 'getOrganizations',
      description: 'Filter by organization',
    },
  ],
};
