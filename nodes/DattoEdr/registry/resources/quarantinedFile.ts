// Custom actions (e.g. deleteFiles, restoreFiles) are added by the special handler in resources/special/
// and the node's operation list — see DT4.
import { ResourceDescriptor } from '../types';

export const descriptor: ResourceDescriptor = {
  name: 'quarantinedFile',
  displayName: 'Quarantined File',
  model: 'QuarantinedFiles',
  operations: ['getAll', 'get', 'count'],
  special: 'quarantinedFiles',
  fields: [],
  filters: [
    {
      displayName: 'Hostname',
      name: 'hostname',
      property: 'hostname',
      type: 'string',
      default: '',
      description: 'Filter by hostname',
    },
    {
      displayName: 'Agent ID',
      name: 'agentId',
      property: 'agentId',
      type: 'string',
      default: '',
      description: 'Filter by agent ID',
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
