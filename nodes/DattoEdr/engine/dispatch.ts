import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { registry } from '../registry';
import { executeGeneric } from './crud';
import { specialHandlers } from '../resources/special';

/**
 * Resolve the selected `resource` param to its descriptor and route to the
 * correct handler. Special resources go to their dedicated handler (which
 * may implement custom operations and delegates generic ones to executeGeneric
 * internally); everything else uses the generic CRUD engine.
 *
 * `this` is passed UNCHANGED to every handler.
 */
export async function dispatch(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const resource = this.getNodeParameter('resource', index) as string;
  const descriptor = registry.find((r) => r.name === resource);

  if (!descriptor) {
    throw new NodeOperationError(
      this.getNode(),
      `Unsupported resource: ${resource}`,
      { itemIndex: index },
    );
  }

  if (descriptor.special) {
    const handler = specialHandlers[descriptor.special];
    const operation = this.getNodeParameter('operation', index) as string;
    return handler.execute.call(this, operation, index);
  }

  return executeGeneric.call(this, descriptor, index);
}
