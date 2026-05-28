import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DattoEdrApi implements ICredentialType {
	name = 'dattoEdrApi';

	displayName = 'Datto EDR API';

	icon = 'file:../nodes/DattoEdr/dattoedr.svg' as const;

	documentationUrl = 'https://github.com/Earney-IT/n8n-nodes-datto-edr';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'https://YOURINSTANCE.infocyte.com/api',
			description:
				'Your Datto EDR instance API base URL — your console URL followed by /api (e.g. https://acme.infocyte.com/api)',
		},
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'API token from the Datto EDR console: Admin → Users & Tokens → API Tokens (expires after 1 year)',
		},
	];

	// NOTE: Authorization header uses Bearer scheme — TO BE VERIFIED against live API.
	// Datto EDR (Infocyte) documentation is instance-gated; Bearer is the most likely scheme.
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiToken}}',
			},
		},
	};

	// NOTE: /version is a TENTATIVE test endpoint — TO BE CONFIRMED against live API.
	// A lightweight unauthenticated-or-cheap endpoint should be substituted once verified.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/version',
			method: 'GET',
		},
	};
}
