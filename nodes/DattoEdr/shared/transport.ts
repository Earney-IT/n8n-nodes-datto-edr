import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

/**
 * Central HTTP transport for Datto EDR API requests.
 * Reads the `dattoEdrApi` credential, normalises the base URL,
 * and delegates to n8n's authenticated HTTP helper.
 *
 * Error mapping and pagination helpers will be added once the live
 * API surface is verified.
 */
export async function dattoEdrApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	resource: string,
	qs: IDataObject = {},
	body?: IDataObject,
): Promise<IDataObject> {
	const creds = await this.getCredentials('dattoEdrApi');

	// Strip trailing slashes from base URL and leading slashes from resource path
	// so callers can pass either '/endpoint' or 'endpoint' without double-slashing.
	const baseUrl = String(creds.baseUrl).replace(/\/+$/, '');
	const path = String(resource).replace(/^\/+/, '');
	const url = `${baseUrl}/${path}`;

	const options = {
		method,
		url,
		qs,
		body,
		json: true,
	};

	return this.helpers.httpRequestWithAuthentication.call(this, 'dattoEdrApi', options) as Promise<IDataObject>;
}
