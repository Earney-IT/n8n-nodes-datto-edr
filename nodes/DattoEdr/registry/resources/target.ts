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
      // Required for create; also shown on update.
      displayName: 'Name',
      name: 'name',
      property: 'name',
      type: 'string',
      default: '',
      required: true,
      description: 'Name of the target group',
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
