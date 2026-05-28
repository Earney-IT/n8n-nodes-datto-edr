import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class DattoEdr implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Datto EDR',
		name: 'dattoEdr',
		icon: 'file:dattoedr.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Query Datto EDR endpoints, scans, threats, and run response actions',
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
			// ----------------------------------------------------------------
			// Resource selector — real resources will be added once the live
			// API surface has been introspected and verified.
			// ----------------------------------------------------------------
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Endpoint',
						value: 'endpoint',
					},
				],
				default: 'endpoint',
			},

			// ----------------------------------------------------------------
			// Operation — placeholder; full operation set added per-resource later.
			// ----------------------------------------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['endpoint'],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many endpoints',
					},
				],
				default: 'getAll',
			},
		],
	};

	// TODO: wire dispatch once live API verified.
	// Replace passthrough below with a resource/operation router that calls
	// dattoEdrApiRequest from shared/transport.ts.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				returnData.push(items[i]);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
