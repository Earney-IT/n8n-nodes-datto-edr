/**
 * Special (non-CRUD) action handlers for the Agent resource.
 *
 * Custom operations implemented here:
 *   isolate        POST /Agents/toggleIsolation
 *   scan           POST /Agents/scan
 *   uninstall      POST /Agents/{id}/uninstall
 *   rename         PATCH /Agents/{id}/rename
 *   retrieveLogs   POST /Agents/{id}/retrieveLogs
 *   assignTarget   POST /Agents/assignTarget
 *   isActive       GET  /Agents/{id}/isActive
 *   scanHistory    GET  /Agents/scanHistory
 *
 * All other operations (getAll, get, count, update, delete) are delegated
 * to executeGeneric.
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
import { descriptor } from '../../registry/resources/agent';
import { dattoEdrApiRequest } from '../../shared/transport';

/** Parse a comma-separated string or pass-through an already-parsed array. */
export function idsArray(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ─── Custom operation options ───────────────────────────────────────────────

export const customOperationOptions: INodePropertyOptions[] = [
  {
    name: 'Assign Target',
    value: 'assignTarget',
    action: 'Assign agents to a target group',
    description: 'Assign one or more agents to a target group (location) by ID',
  },
  {
    name: 'Is Active',
    value: 'isActive',
    action: 'Check if an agent is active',
    description: 'Return whether the specified agent is currently active/online',
  },
  {
    name: 'Isolate',
    value: 'isolate',
    action: 'Isolate or release agents from the network',
    description:
      'Isolate agents from the network (or release isolation) by toggling the isolation flag. Set Isolate to false to release.',
  },
  {
    name: 'Rename',
    value: 'rename',
    action: 'Rename an agent',
    description: 'Update the display name of the specified agent',
  },
  {
    name: 'Retrieve Logs',
    value: 'retrieveLogs',
    action: 'Request log retrieval from an agent',
    description: 'Trigger a log-retrieval job on the specified agent',
  },
  {
    name: 'Scan',
    value: 'scan',
    action: 'Scan devices',
    description: 'Initiate an on-demand scan on one or more agents; optionally pass scan options',
  },
  {
    name: 'Scan History',
    value: 'scanHistory',
    action: 'Get scan history',
    description: 'Return all scan history records for the tenant',
  },
  {
    name: 'Uninstall',
    value: 'uninstall',
    action: 'Uninstall agent',
    description: 'Queue an uninstall job for the specified agent',
  },
];

// ─── Custom properties ───────────────────────────────────────────────────────

export const customProperties: INodeProperties[] = [
  // ── isolate ──────────────────────────────────────────────────────────────
  {
    displayName: 'Agent IDs',
    name: 'agentIds',
    type: 'string',
    default: '',
    required: true,
    placeholder: 'agent-ID-1, agent-ID-2',
    description: 'Comma-separated list of agent IDs to isolate or release',
    displayOptions: { show: { resource: ['agent'], operation: ['isolate'] } },
  },
  {
    displayName: 'Isolate',
    name: 'isolate',
    type: 'boolean',
    default: true,
    description:
      'Whether to isolate the agents (true) or release them from isolation (false)',
    displayOptions: { show: { resource: ['agent'], operation: ['isolate'] } },
  },

  // ── scan ─────────────────────────────────────────────────────────────────
  {
    displayName: 'Agent IDs',
    name: 'agentIds',
    type: 'string',
    default: '',
    required: true,
    placeholder: 'agent-ID-1, agent-ID-2',
    description: 'Comma-separated list of agent IDs to scan',
    displayOptions: { show: { resource: ['agent'], operation: ['scan'] } },
  },
  {
    displayName: 'Scan Options (JSON)',
    name: 'scanOptions',
    type: 'json',
    default: '{}',
    description:
      'Additional scan options as a JSON object (merged with the agentIds). See API docs for available fields.',
    displayOptions: { show: { resource: ['agent'], operation: ['scan'] } },
  },

  // ── uninstall ─────────────────────────────────────────────────────────────
  {
    displayName: 'Agent ID',
    name: 'agentId',
    type: 'string',
    default: '',
    required: true,
    description: 'The ID of the agent to uninstall',
    displayOptions: { show: { resource: ['agent'], operation: ['uninstall'] } },
  },

  // ── rename ────────────────────────────────────────────────────────────────
  {
    displayName: 'Agent ID',
    name: 'agentId',
    type: 'string',
    default: '',
    required: true,
    description: 'The ID of the agent to rename',
    displayOptions: { show: { resource: ['agent'], operation: ['rename'] } },
  },
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    default: '',
    required: true,
    description: 'New display name for the agent',
    displayOptions: { show: { resource: ['agent'], operation: ['rename'] } },
  },

  // ── retrieveLogs ──────────────────────────────────────────────────────────
  {
    displayName: 'Agent ID',
    name: 'agentId',
    type: 'string',
    default: '',
    required: true,
    description: 'The ID of the agent from which to retrieve logs',
    displayOptions: { show: { resource: ['agent'], operation: ['retrieveLogs'] } },
  },

  // ── assignTarget ──────────────────────────────────────────────────────────
  {
    displayName: 'Agent IDs',
    name: 'agentIds',
    type: 'string',
    default: '',
    required: true,
    placeholder: 'agent-ID-1, agent-ID-2',
    description: 'Comma-separated list of agent IDs to assign to the target group',
    displayOptions: { show: { resource: ['agent'], operation: ['assignTarget'] } },
  },
  {
    displayName: 'Target ID',
    name: 'locationId',
    type: 'string',
    default: '',
    required: true,
    description: 'The ID of the target group (location) to assign the agents to',
    displayOptions: { show: { resource: ['agent'], operation: ['assignTarget'] } },
  },

  // ── isActive ──────────────────────────────────────────────────────────────
  {
    displayName: 'Agent ID',
    name: 'agentId',
    type: 'string',
    default: '',
    required: true,
    description: 'The ID of the agent to check',
    displayOptions: { show: { resource: ['agent'], operation: ['isActive'] } },
  },

  // ── scanHistory — no extra params; returnAll/limit managed by optional body ─
];

// ─── Execute ─────────────────────────────────────────────────────────────────

const CUSTOM_OPS = new Set(customOperationOptions.map((o) => o.value as string));

export async function execute(
  this: IExecuteFunctions,
  operation: string,
  index: number,
): Promise<INodeExecutionData[]> {
  if (!CUSTOM_OPS.has(operation)) {
    // Delegate to generic CRUD engine
    return executeGeneric.call(this, descriptor, index);
  }

  switch (operation) {
    case 'isolate': {
      const agentIds = idsArray(this.getNodeParameter('agentIds', index, '') as string);
      const isolateFlag = this.getNodeParameter('isolate', index, true) as boolean;
      // Body: send agent ids array + isolated flag.
      // The spec's requestBody is the generic Agent schema; the toggleIsolation endpoint
      // accepts { ids: string[], isolated: boolean } based on the endpoint description
      // and the `isolated` boolean property present in the Agent schema.
      const body = { ids: agentIds, isolated: isolateFlag };
      const result = await dattoEdrApiRequest.call(this, 'POST', 'Agents/toggleIsolation', {}, body);
      return this.helpers.returnJsonArray([result as IDataObject]);
    }

    case 'scan': {
      const agentIds = idsArray(this.getNodeParameter('agentIds', index, '') as string);
      const scanOptionsRaw = this.getNodeParameter('scanOptions', index, '{}') as string | IDataObject;
      const scanOptions: IDataObject =
        typeof scanOptionsRaw === 'string' ? (JSON.parse(scanOptionsRaw) as IDataObject) : scanOptionsRaw;
      // Body: merge agentIds into whatever scan options were given.
      // The requestBody references the generic Agent schema — the actual shape accepted
      // by scan is freeform (not documented with specific required fields); we send ids
      // as an array plus any caller-supplied options.
      const body = { ids: agentIds, ...scanOptions };
      const result = await dattoEdrApiRequest.call(this, 'POST', 'Agents/scan', {}, body);
      return this.helpers.returnJsonArray([result as IDataObject]);
    }

    case 'uninstall': {
      const agentId = this.getNodeParameter('agentId', index, '') as string;
      if (!agentId) {
        throw new NodeOperationError(this.getNode(), '"agentId" is required for operation "uninstall".', {
          itemIndex: index,
        });
      }
      // No requestBody — path-only action.
      const result = await dattoEdrApiRequest.call(this, 'POST', `Agents/${agentId}/uninstall`);
      return this.helpers.returnJsonArray([result as IDataObject]);
    }

    case 'rename': {
      const agentId = this.getNodeParameter('agentId', index, '') as string;
      const name = this.getNodeParameter('name', index, '') as string;
      if (!agentId) {
        throw new NodeOperationError(this.getNode(), '"agentId" is required for operation "rename".', {
          itemIndex: index,
        });
      }
      // Body: { name } — only the name property is relevant per the rename endpoint.
      const body = { name };
      const result = await dattoEdrApiRequest.call(this, 'PATCH', `Agents/${agentId}/rename`, {}, body);
      return this.helpers.returnJsonArray([result as IDataObject]);
    }

    case 'retrieveLogs': {
      const agentId = this.getNodeParameter('agentId', index, '') as string;
      if (!agentId) {
        throw new NodeOperationError(this.getNode(), '"agentId" is required for operation "retrieveLogs".', {
          itemIndex: index,
        });
      }
      // No requestBody.
      const result = await dattoEdrApiRequest.call(this, 'POST', `Agents/${agentId}/retrieveLogs`);
      return this.helpers.returnJsonArray([result as IDataObject]);
    }

    case 'assignTarget': {
      const agentIds = idsArray(this.getNodeParameter('agentIds', index, '') as string);
      const locationId = this.getNodeParameter('locationId', index, '') as string;
      // Body: Agent3 schema maps to generic Agent; the locationId field is on the Agent model
      // and assignTarget is documented as "Assigns one or more agents to a location".
      const body = { ids: agentIds, locationId };
      const result = await dattoEdrApiRequest.call(this, 'POST', 'Agents/assignTarget', {}, body);
      return this.helpers.returnJsonArray([result as IDataObject]);
    }

    case 'isActive': {
      const agentId = this.getNodeParameter('agentId', index, '') as string;
      if (!agentId) {
        throw new NodeOperationError(this.getNode(), '"agentId" is required for operation "isActive".', {
          itemIndex: index,
        });
      }
      const result = await dattoEdrApiRequest.call(this, 'GET', `Agents/${agentId}/isActive`);
      return this.helpers.returnJsonArray([result as IDataObject]);
    }

    case 'scanHistory': {
      const result = await dattoEdrApiRequest.call(this, 'GET', 'Agents/scanHistory');
      const items = Array.isArray(result) ? result : [result];
      return this.helpers.returnJsonArray(items as IDataObject[]);
    }

    default: {
      throw new NodeOperationError(
        this.getNode(),
        `Unknown agent operation: "${operation}"`,
        { itemIndex: index },
      );
    }
  }
}
