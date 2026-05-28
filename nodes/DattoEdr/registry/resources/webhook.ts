import { ResourceDescriptor } from '../types';

export const descriptor: ResourceDescriptor = {
  name: 'webhook',
  displayName: 'Webhook',
  model: 'Webhooks',
  operations: ['getAll', 'get', 'create', 'update', 'delete'],
  fields: [
    {
      // Required for create; also shown on update (provide to change the endpoint URL).
      displayName: 'URL',
      name: 'url',
      property: 'url',
      type: 'string',
      default: '',
      required: true,
      description: 'Webhook endpoint URL',
      onOperations: ['create', 'update'],
    },
    {
      displayName: 'Name',
      name: 'name',
      property: 'name',
      type: 'string',
      default: '',
      description: 'Display name for the webhook',
      onOperations: ['create', 'update'],
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
        'Extra model properties as a JSON object, merged into the request body (e.g. {"description":"...","method":"POST","headers":{}})',
      onOperations: ['create', 'update'],
    },
  ],
};
