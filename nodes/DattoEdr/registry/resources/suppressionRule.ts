import { ResourceDescriptor } from '../types';

export const descriptor: ResourceDescriptor = {
  name: 'suppressionRule',
  displayName: 'Suppression Rule',
  model: 'SuppressionRules',
  operations: ['getAll', 'get', 'create'],
  fields: [
    {
      displayName: 'Name',
      name: 'name',
      property: 'name',
      type: 'string',
      default: '',
      required: true,
      description: 'Name for the suppression rule',
      onOperations: ['create'],
    },
    {
      // The engine's collectBody spreads __merge-property fields into the body
      // rather than setting body['__merge']. Allows passing extra model properties.
      displayName: 'Additional Fields',
      name: 'additionalFields',
      property: '__merge',
      type: 'json',
      default: '{}',
      description:
        'Extra model properties as a JSON object, merged into the request body (e.g. {"description":"...","organizationId":"..."})',
      onOperations: ['create'],
    },
  ],
};
