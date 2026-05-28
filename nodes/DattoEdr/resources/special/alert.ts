/**
 * Special (non-CRUD) action handlers for the Alert resource.
 *
 * Custom operations implemented here:
 *   archive        POST /Alerts/archive      (qs: where)
 *   unarchive      POST /Alerts/unarchive    (qs: where)
 *   respond        POST /Alerts/response     (freeform Alert body — json passthrough)
 *   getComments    GET  /Alerts/{id}/comments
 *   addComment     POST /Alerts/{id}/comments
 *
 * All other operations (getAll, get, count) are delegated to executeGeneric.
 *
 * NOTE: archive/unarchive use a LoopBack `where` query-string parameter rather
 * than a request body — the spec shows `params: ['where']` and no requestBody.
 * The caller supplies an alert ID filter (single alertId) or a raw where JSON
 * string for bulk selection.
 *
 * NOTE: respond — the requestBody is the generic Alert schema (freeform). We
 * expose a single `body` JSON param so callers can pass any shape required.
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
import { descriptor } from '../../registry/resources/alert';
import { dattoEdrApiRequest } from '../../shared/transport';

// ─── Custom operation options ───────────────────────────────────────────────

export const customOperationOptions: INodePropertyOptions[] = [
  {
    name: 'Add Comment',
    value: 'addComment',
    action: 'Add a comment to an alert',
    description: 'Post a new comment on the specified alert',
  },
  {
    name: 'Archive',
    value: 'archive',
    action: 'Archive alerts',
    description: 'Archive one or more alerts matching the given where filter',
  },
  {
    name: 'Get Comments',
    value: 'getComments',
    action: 'Get comments for an alert',
    description: 'Retrieve all comments associated with the specified alert',
  },
  {
    name: 'Respond',
    value: 'respond',
    action: 'Trigger an AV response action on alerts',
    description:
      'Send an AV response action payload for the specified alert(s). The body is freeform — pass a JSON object with the fields required by the API.',
  },
  {
    name: 'Unarchive',
    value: 'unarchive',
    action: 'Unarchive alerts',
    description: 'Unarchive one or more alerts matching the given where filter',
  },
];

// ─── Custom properties ───────────────────────────────────────────────────────

export const customProperties: INodeProperties[] = [
  // ── archive ───────────────────────────────────────────────────────────────
  {
    displayName: 'Where Filter (JSON)',
    name: 'whereFilter',
    type: 'json',
    default: '{}',
    required: true,
    description: 'LoopBack where-clause JSON object that selects the alerts to archive. Example: {"ID":"alert-ID-1"} or {"agentId":"agent-ID-1"}.',
    displayOptions: { show: { resource: ['alert'], operation: ['archive'] } },
  },

  // ── unarchive ─────────────────────────────────────────────────────────────
  {
    displayName: 'Where Filter (JSON)',
    name: 'whereFilter',
    type: 'json',
    default: '{}',
    required: true,
    description: 'LoopBack where-clause JSON object that selects the alerts to unarchive. Example: {"ID":"alert-ID-1"} or {"agentId":"agent-ID-1"}.',
    displayOptions: { show: { resource: ['alert'], operation: ['unarchive'] } },
  },

  // ── respond ───────────────────────────────────────────────────────────────
  {
    displayName: 'Body (JSON)',
    name: 'body',
    type: 'json',
    default: '{}',
    required: true,
    description:
      // SCHEMA NOTE: The requestBody for POST /Alerts/response is the generic Alert schema
      // (no specific documented shape for the response action fields). Pass a JSON object
      // matching the API contract — e.g. { "alertId": "...", "action": "quarantine" }.
      'JSON body for the alert response action. The exact fields depend on the response type (e.g. quarantine, delete). Consult the Datto EDR API docs for the required shape.',
    displayOptions: { show: { resource: ['alert'], operation: ['respond'] } },
  },

  // ── getComments ───────────────────────────────────────────────────────────
  {
    displayName: 'Alert ID',
    name: 'alertId',
    type: 'string',
    default: '',
    required: true,
    description: 'The ID of the alert whose comments to retrieve',
    displayOptions: { show: { resource: ['alert'], operation: ['getComments'] } },
  },

  // ── addComment ────────────────────────────────────────────────────────────
  {
    displayName: 'Alert ID',
    name: 'alertId',
    type: 'string',
    default: '',
    required: true,
    description: 'The ID of the alert to comment on',
    displayOptions: { show: { resource: ['alert'], operation: ['addComment'] } },
  },
  {
    displayName: 'Comment',
    name: 'comment',
    type: 'string',
    default: '',
    required: true,
    description: 'The comment text to add to the alert (maps to the "value" field in UserComment)',
    displayOptions: { show: { resource: ['alert'], operation: ['addComment'] } },
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
    case 'archive':
    case 'unarchive': {
      const whereRaw = this.getNodeParameter('whereFilter', index, '{}') as string | IDataObject;
      const where: IDataObject =
        typeof whereRaw === 'string' ? (JSON.parse(whereRaw) as IDataObject) : whereRaw;
      // The spec shows `params: ['where']` and no requestBody — pass where as qs param.
      const qs = Object.keys(where).length > 0 ? { where: JSON.stringify(where) } : {};
      const endpoint = operation === 'archive' ? 'Alerts/archive' : 'Alerts/unarchive';
      const result = await dattoEdrApiRequest.call(this, 'POST', endpoint, qs);
      return this.helpers.returnJsonArray([result as IDataObject]);
    }

    case 'respond': {
      const bodyRaw = this.getNodeParameter('body', index, '{}') as string | IDataObject;
      const body: IDataObject = typeof bodyRaw === 'string' ? (JSON.parse(bodyRaw) as IDataObject) : bodyRaw;
      // SCHEMA NOTE: requestBody for POST /Alerts/response is generic Alert schema —
      // no specific response-action fields are documented. This is a json passthrough.
      const result = await dattoEdrApiRequest.call(this, 'POST', 'Alerts/response', {}, body);
      return this.helpers.returnJsonArray([result as IDataObject]);
    }

    case 'getComments': {
      const alertId = this.getNodeParameter('alertId', index, '') as string;
      if (!alertId) {
        throw new NodeOperationError(this.getNode(), '"alertId" is required for operation "getComments".', {
          itemIndex: index,
        });
      }
      const result = await dattoEdrApiRequest.call(this, 'GET', `Alerts/${alertId}/comments`);
      const items = Array.isArray(result) ? result : [result];
      return this.helpers.returnJsonArray(items as IDataObject[]);
    }

    case 'addComment': {
      const alertId = this.getNodeParameter('alertId', index, '') as string;
      const comment = this.getNodeParameter('comment', index, '') as string;
      if (!alertId) {
        throw new NodeOperationError(this.getNode(), '"alertId" is required for operation "addComment".', {
          itemIndex: index,
        });
      }
      // Body: UserComment2 schema uses `value` for the comment text.
      const body = { value: comment };
      const result = await dattoEdrApiRequest.call(this, 'POST', `Alerts/${alertId}/comments`, {}, body);
      return this.helpers.returnJsonArray([result as IDataObject]);
    }

    default: {
      throw new NodeOperationError(
        this.getNode(),
        `Unknown alert operation: "${operation}"`,
        { itemIndex: index },
      );
    }
  }
}
