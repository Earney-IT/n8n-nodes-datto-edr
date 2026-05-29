import {
  ICredentialTestFunctions,
  ICredentialsDecrypted,
  IExecuteFunctions,
  INodeCredentialTestResult,
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
        testedBy: 'dattoEdrApiTest',
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

  methods = {
    loadOptions,
    credentialTest: {
      async dattoEdrApiTest(
        this: ICredentialTestFunctions,
        credential: ICredentialsDecrypted,
      ): Promise<INodeCredentialTestResult> {
        const data = credential.data ?? {};
        const baseUrl = String((data as Record<string, unknown>).baseUrl ?? '').replace(/\/+$/, '');
        const token = String((data as Record<string, unknown>).apiToken ?? '');

        if (!baseUrl) {
          return {
            status: 'Error',
            message: 'Base URL is required (e.g. https://YOUR-INSTANCE.infocyte.com/api).',
          };
        }

        try {
          // eslint-disable-next-line @n8n/community-nodes/no-deprecated-workflow-functions
          const res = await this.helpers.request({
            method: 'GET',
            uri: `${baseUrl}/users/me`,
            headers: { Authorization: token, Accept: 'application/json' },
            json: true,
            resolveWithFullResponse: false,
          });

          if (
            res &&
            typeof res === 'object' &&
            !Array.isArray(res) &&
            ((res as Record<string, unknown>).id !== undefined ||
              (res as Record<string, unknown>).email !== undefined)
          ) {
            return { status: 'OK', message: 'Connection successful' };
          }

          return {
            status: 'Error',
            message:
              'Connected, but did not receive a valid Datto EDR API response (got HTML/non-JSON). Make sure the Base URL ends with /api — e.g. https://YOUR-INSTANCE.infocyte.com/api.',
          };
        } catch (error) {
          const statusCode =
            (error as { statusCode?: number }).statusCode ??
            (error as { response?: { statusCode?: number } }).response?.statusCode;

          if (statusCode === 401 || statusCode === 403) {
            return {
              status: 'Error',
              message:
                'Authentication failed — check the API token (and that the Base URL ends with /api).',
            };
          }

          const msg = (error as Error).message ?? 'request failed';
          return {
            status: 'Error',
            message: `Could not reach the Datto EDR API: ${msg}. Verify the Base URL ends with /api.`,
          };
        }
      },
    },
  };

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
