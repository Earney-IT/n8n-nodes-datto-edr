// Custom actions (e.g. archive, unarchive, respond) are added by the special handler in resources/special/
// and the node's operation list — see DT4.
import { ResourceDescriptor } from '../types';

export const descriptor: ResourceDescriptor = {
  name: 'alert',
  displayName: 'Alert',
  model: 'Alerts',
  operations: ['getAll', 'get', 'count'],
  special: 'alerts',
  fields: [],
  filters: [
    {
      displayName: 'Severity',
      name: 'severity',
      property: 'severity',
      type: 'options',
      default: 'low',
      description: 'Filter by alert severity',
      options: [
        { name: 'Low', value: 'low' },
        { name: 'Medium', value: 'medium' },
        { name: 'High', value: 'high' },
        { name: 'Critical', value: 'critical' },
      ],
    },
    {
      displayName: 'Type',
      name: 'type',
      property: 'type',
      type: 'string',
      default: '',
      description: 'Filter by alert type',
    },
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
      displayName: 'Archived',
      name: 'archived',
      property: 'archived',
      type: 'boolean',
      default: false,
      description: 'Whether to filter by archived status',
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
      displayName: 'MITRE ID',
      name: 'mitreId',
      property: 'mitreId',
      type: 'string',
      default: '',
      description: 'Filter by MITRE ATT&CK technique ID',
    },
  ],
};
