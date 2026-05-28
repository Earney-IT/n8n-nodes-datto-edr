// Custom actions (e.g. isolate, scan, archive) are added by the special handler in resources/special/
// and the node's operation list — see DT4.
import { ResourceDescriptor } from '../types';

export const descriptor: ResourceDescriptor = {
  name: 'agent',
  displayName: 'Agent',
  model: 'Agents',
  operations: ['getAll', 'get', 'count', 'update', 'delete'],
  special: 'agents',
  fields: [
    {
      displayName: 'Name',
      name: 'name',
      property: 'name',
      type: 'string',
      default: '',
      description: 'Display name for the agent',
      onOperations: ['update'],
    },
  ],
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
      displayName: 'Active',
      name: 'active',
      property: 'active',
      type: 'boolean',
      default: false,
      description: 'Whether to filter by active status',
    },
    {
      displayName: 'Authorized',
      name: 'authorized',
      property: 'authorized',
      type: 'boolean',
      default: false,
      description: 'Whether to filter by authorized status',
    },
    {
      displayName: 'Isolated',
      name: 'isolated',
      property: 'isolated',
      type: 'boolean',
      default: false,
      description: 'Whether to filter by isolation status',
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
    {
      displayName: 'OS',
      name: 'os',
      property: 'os',
      type: 'string',
      default: '',
      description: 'Filter by operating system (e.g. "windows", "darwin", "linux")',
    },
  ],
};
