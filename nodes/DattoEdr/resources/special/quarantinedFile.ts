/**
 * Special (non-CRUD) action handlers for the Quarantined File resource.
 *
 * Custom operations implemented here:
 *   deleteFiles    POST /QuarantinedFiles/createDeleteFileJobs   (qs: where)
 *   restoreFiles   POST /QuarantinedFiles/createRestoreFileJobs  (qs: where)
 *
 * All other operations (getAll, get, count) are delegated to executeGeneric.
 *
 * NOTE: Both createDeleteFileJobs and createRestoreFileJobs use a LoopBack
 * `where` query-string parameter rather than a request body — the spec shows
 * `params: ['where']` and no requestBody for both endpoints. Callers supply a
 * where-filter JSON object to select which quarantined file records to act on.
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
import { descriptor } from '../../registry/resources/quarantinedFile';
import { dattoEdrApiRequest } from '../../shared/transport';

// ─── Custom operation options ───────────────────────────────────────────────

export const customOperationOptions: INodePropertyOptions[] = [
  {
    name: 'Delete Files',
    value: 'deleteFiles',
    action: 'Create delete jobs for quarantined files',
    description:
      'Schedule agent jobs to permanently delete quarantined files matching the given filter',
  },
  {
    name: 'Restore Files',
    value: 'restoreFiles',
    action: 'Create restore jobs for quarantined files',
    description:
      'Schedule agent jobs to restore quarantined files matching the given filter to their original location',
  },
];

// ─── Custom properties ───────────────────────────────────────────────────────

export const customProperties: INodeProperties[] = [
  // ── deleteFiles ───────────────────────────────────────────────────────────
  {
    displayName: 'Where Filter (JSON)',
    name: 'whereFilter',
    type: 'json',
    default: '{}',
    required: true,
    description: 'LoopBack where-clause JSON object that selects the quarantined files to delete. Example: {"agentId":"agent-ID-1"} or {"ID":"qf-ID-1"}.',
    displayOptions: { show: { resource: ['quarantinedFile'], operation: ['deleteFiles'] } },
  },

  // ── restoreFiles ──────────────────────────────────────────────────────────
  {
    displayName: 'Where Filter (JSON)',
    name: 'whereFilter',
    type: 'json',
    default: '{}',
    required: true,
    description: 'LoopBack where-clause JSON object that selects the quarantined files to restore. Example: {"agentId":"agent-ID-1"} or {"ID":"qf-ID-1"}.',
    displayOptions: { show: { resource: ['quarantinedFile'], operation: ['restoreFiles'] } },
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
    case 'deleteFiles':
    case 'restoreFiles': {
      const whereRaw = this.getNodeParameter('whereFilter', index, '{}') as string | IDataObject;
      const where: IDataObject =
        typeof whereRaw === 'string' ? (JSON.parse(whereRaw) as IDataObject) : whereRaw;
      // The spec shows `params: ['where']` and no requestBody for both endpoints.
      const qs = Object.keys(where).length > 0 ? { where: JSON.stringify(where) } : {};
      const endpoint =
        operation === 'deleteFiles'
          ? 'QuarantinedFiles/createDeleteFileJobs'
          : 'QuarantinedFiles/createRestoreFileJobs';
      const result = await dattoEdrApiRequest.call(this, 'POST', endpoint, qs);
      return this.helpers.returnJsonArray([result as IDataObject]);
    }

    default: {
      throw new NodeOperationError(
        this.getNode(),
        `Unknown quarantinedFile operation: "${operation}"`,
        { itemIndex: index },
      );
    }
  }
}
