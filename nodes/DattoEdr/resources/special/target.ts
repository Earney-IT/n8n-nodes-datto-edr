/**
 * Special (non-CRUD) action handlers for the Target resource.
 *
 * Custom operations implemented here:
 *   listAgents     GET /Targets/{id}/agents   (with optional filter + pagination)
 *
 * All other operations (getAll, get, count, create, update, delete) are
 * delegated to executeGeneric.
 */

import {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
  INodePropertyOptions,
  NodeOperationError,
} from 'n8n-workflow';
import { executeGeneric } from '../../engine/crud';
import { descriptor } from '../../registry/resources/target';
import { dattoEdrApiRequest, dattoEdrApiRequestAllItems, buildFilterQs } from '../../shared/transport';

// ─── Custom operation options ───────────────────────────────────────────────

export const customOperationOptions: INodePropertyOptions[] = [
  {
    name: 'List Agents',
    value: 'listAgents',
    action: 'List agents assigned to a target group',
    description: 'Retrieve the agents that belong to the specified target group, with optional pagination',
  },
];

// ─── Custom properties ───────────────────────────────────────────────────────

export const customProperties: INodeProperties[] = [
  // ── listAgents ────────────────────────────────────────────────────────────
  {
    displayName: 'Target ID',
    name: 'targetId',
    type: 'string',
    default: '',
    required: true,
    description: 'The ID of the target group whose agents to list',
    displayOptions: { show: { resource: ['target'], operation: ['listAgents'] } },
  },
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    description: 'Whether to return all results or only up to a given limit',
    displayOptions: { show: { resource: ['target'], operation: ['listAgents'] } },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    typeOptions: { minValue: 1 },
    default: 50,
    description: 'Max number of results to return',
    displayOptions: {
      show: { resource: ['target'], operation: ['listAgents'], returnAll: [false] },
    },
  },
];

// ─── Execute ─────────────────────────────────────────────────────────────────

const CUSTOM_OPS = new Set(customOperationOptions.map((o) => o.value as string));

export async function execute(
  this: IExecuteFunctions,
  operation: string,
  index: number,
): Promise<INodeExecutionData[]> {
  if (!CUSTOM_OPS.has(operation)) {
    return executeGeneric.call(this, descriptor, index);
  }

  switch (operation) {
    case 'listAgents': {
      const targetId = this.getNodeParameter('targetId', index, '') as string;
      if (!targetId) {
        throw new NodeOperationError(this.getNode(), '"targetId" is required for operation "listAgents".', {
          itemIndex: index,
        });
      }

      const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;

      if (returnAll) {
        // Paginate through GET /Targets/{id}/agents using limit/skip filter
        const items = await dattoEdrApiRequestAllItems.call(
          this,
          `Targets/${targetId}/agents`,
          {},
        );
        return this.helpers.returnJsonArray(items);
      } else {
        const limit = this.getNodeParameter('limit', index, 50) as number;
        const filter: IDataObject = { limit };
        const qs = buildFilterQs(filter);
        const result = await dattoEdrApiRequest.call(this, 'GET', `Targets/${targetId}/agents`, qs);
        const items = Array.isArray(result) ? result : [result];
        return this.helpers.returnJsonArray(items as IDataObject[]);
      }
    }

    default: {
      throw new NodeOperationError(
        this.getNode(),
        `Unknown target operation: "${operation}"`,
        { itemIndex: index },
      );
    }
  }
}
