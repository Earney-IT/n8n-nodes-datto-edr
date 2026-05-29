import type {
	IAuthenticateGeneric,
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

	// VERIFIED against the live Datto EDR ("Pulse") API (2026-05-20): the token is sent
	// RAW in the Authorization header — NOT a "Bearer" scheme. (Bearer returns HTTP 500;
	// raw token returns 200; missing token returns 401.)
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{$credentials.apiToken}}',
			},
		},
	};

}
