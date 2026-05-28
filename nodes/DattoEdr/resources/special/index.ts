/**
 * Special handler registry.
 *
 * Each entry maps the `special` key from a ResourceDescriptor to its handler
 * module, which provides:
 *   - customOperationOptions  extra op dropdown entries (merged by properties.ts)
 *   - customProperties        n8n properties for those custom ops
 *   - execute                 dispatch function (handles custom ops; delegates generic ones)
 */

import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
  INodePropertyOptions,
} from 'n8n-workflow';

import * as agentHandler from './agent';
import * as alertHandler from './alert';
import * as targetHandler from './target';
import * as quarantinedFileHandler from './quarantinedFile';

export interface SpecialHandler {
  customOperationOptions: INodePropertyOptions[];
  customProperties: INodeProperties[];
  execute(
    this: IExecuteFunctions,
    operation: string,
    index: number,
  ): Promise<INodeExecutionData[]>;
}

export const specialHandlers: Record<
  'agents' | 'alerts' | 'targets' | 'quarantinedFiles',
  SpecialHandler
> = {
  agents: agentHandler,
  alerts: alertHandler,
  targets: targetHandler,
  quarantinedFiles: quarantinedFileHandler,
};
