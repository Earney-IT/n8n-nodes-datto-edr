import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionTypes,
  NodeOperationError,
} from 'n8n-workflow';

import { enabledResources } from './registry';
import { buildResourceProperties } from './engine/properties';
import { dispatch } from './engine/dispatch';
import { loadOptions } from './methods';
import { specialHandlers } from './resources/special';

const sortedResources = [...enabledResources].sort((a, b) =>
  a.displayName.localeCompare(b.displayName),
);

const resourceOptions = sortedResources.map((d) => ({
  name: d.displayName,
  value: d.name,
}));

const resourceDefault =
  sortedResources.find((d) => d.name === 'agent')?.name ?? sortedResources[0].name;

export class DattoEdr implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Datto EDR',
    name: 'dattoEdr',
    icon: 'file:dattoedr.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description:
      'Datto EDR (Infocyte): list and manage endpoints/agents, threats/alerts, scans, targets, quarantined files, and run response actions — isolate or scan an endpoint, archive or respond to alerts, restore quarantined files. For endpoint security operations, threat triage, and EDR reporting.',
    defaults: {
      name: 'Datto EDR',
    },
    usableAsTool: true,
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [
      {
        name: 'dattoEdrApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: resourceOptions,
        default: resourceDefault,
      },
      ...sortedResources.flatMap((d) => [
        ...buildResourceProperties(
          d,
          specialHandlers[d.special as keyof typeof specialHandlers]?.customOperationOptions ?? [],
        ),
        ...(specialHandlers[d.special as keyof typeof specialHandlers]?.customProperties ?? []),
      ]),
    ],
  };

  methods = { loadOptions };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const out: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const res = await dispatch.call(this, i);
        if (!res || res.length === 0) {
          // n8n #26202: AI Agent tools must never emit an empty array.
          out.push({
            json: {
              found: 0,
              resource: this.getNodeParameter('resource', i, ''),
              operation: this.getNodeParameter('operation', i, ''),
            },
            pairedItem: { item: i },
          });
        } else {
          out.push(...res);
        }
      } catch (err) {
        if (this.continueOnFail()) {
          out.push({ json: { error: (err as Error).message }, pairedItem: i });
        } else {
          const e = err as { context?: { itemIndex?: number } };
          if (e.context) e.context.itemIndex = i;
          throw new NodeOperationError(this.getNode(), err as Error, { itemIndex: i });
        }
      }
    }

    return [out];
  }
}
