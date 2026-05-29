import {
	IDataObject,
	IExecuteFunctions,
	IExecuteSingleFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IPollFunctions,
	NodeOperationError,
} from 'n8n-workflow';
import { toNodeError } from './errors';

type DattoCtx =
	| IExecuteFunctions
	| IExecuteSingleFunctions
	| ILoadOptionsFunctions
	| IPollFunctions
	| IHookFunctions;

/**
 * Builds the LoopBack `?filter=<json>` query-string object.
 * Returns an empty object when the filter is empty or undefined so callers
 * can always spread the result into their `qs`.
 */
export function buildFilterQs(filter?: IDataObject): IDataObject {
	if (!filter || Object.keys(filter).length === 0) return {};
	return { filter: JSON.stringify(filter) };
}

/**
 * Core HTTP transport for all Datto EDR API requests.
 *
 * - Reads `baseUrl` from the `dattoEdrApi` credential; throws if missing.
 * - Normalises double-slash between base URL and resource path.
 * - Delegates auth to n8n's `httpRequestWithAuthentication` — the credential's
 *   `authenticate` block sets `Authorization: <raw token>`.
 * - Maps LoopBack 3 error envelopes (`{ error: { statusCode, name, message } }`)
 *   to typed NodeApiError / NodeOperationError via `toNodeError`.
 *
 * Returns the parsed body as-is (LoopBack returns arrays for list endpoints,
 * plain objects for single-resource endpoints).
 */
export async function dattoEdrApiRequest(
	this: DattoCtx,
	method: IHttpRequestMethods,
	resource: string,
	qs: IDataObject = {},
	body?: IDataObject,
): Promise<unknown> {
	const creds = await this.getCredentials('dattoEdrApi');

	const rawBase = creds.baseUrl;
	if (!rawBase) {
		throw new NodeOperationError(
			this.getNode(),
			'Datto EDR credential is missing the "baseUrl" field.',
		);
	}

	const baseUrl = String(rawBase).replace(/\/+$/, '');
	const path = String(resource).replace(/^\/+/, '');
	const url = `${baseUrl}/${path}`;

	const options: IHttpRequestOptions = {
		method,
		url,
		qs,
		json: true,
	};

	if (body !== undefined && Object.keys(body).length > 0) {
		options.body = body;
	}

	try {
		const response = await this.helpers.httpRequestWithAuthentication.call(this, 'dattoEdrApi', options);
		if (typeof response === 'string') {
			throw new NodeOperationError(
				this.getNode(),
				'Datto EDR returned a non-JSON response (likely the web app, not the API). Check that the credential Base URL ends with /api — e.g. https://YOUR-INSTANCE.infocyte.com/api.',
			);
		}
		return response;
	} catch (error) {
		throw toNodeError(this, error);
	}
}

/**
 * Fetches all pages of a LoopBack list endpoint using limit/skip pagination.
 *
 * @param resource  - LoopBack model path, e.g. `'Agents'`.
 * @param baseFilter - LoopBack filter fields (`where`, `order`, `include`, etc.)
 *                     excluding `limit` and `skip` — those are managed here.
 * @param pageSize  - Records per page (default 100).
 *
 * Stops when a page contains fewer records than `pageSize`.
 * Throws NodeOperationError after 200 pages to prevent runaway loops.
 */
export async function dattoEdrApiRequestAllItems(
	this: DattoCtx,
	resource: string,
	baseFilter: IDataObject = {},
	pageSize = 100,
): Promise<IDataObject[]> {
	const MAX_PAGES = 200;
	let skip = 0;
	const out: IDataObject[] = [];

	for (let page = 0; ; page++) {
		if (page >= MAX_PAGES) {
			throw new NodeOperationError(
				(this as IExecuteFunctions).getNode(),
				`Datto EDR returned more than ${MAX_PAGES} pages. Add a filter to narrow the result set.`,
			);
		}

		const filter: IDataObject = { ...baseFilter, limit: pageSize, skip };
		const result = await dattoEdrApiRequest.call(this, 'GET', resource, buildFilterQs(filter));

		if (!Array.isArray(result)) {
			throw new NodeOperationError(
				(this as IExecuteFunctions).getNode(),
				`dattoEdrApiRequestAllItems: expected an array from ${resource} but got ${typeof result}. If the Base URL is missing /api the API may return HTML — verify the credential Base URL ends with /api (e.g. https://YOUR-INSTANCE.infocyte.com/api).`,
			);
		}

		out.push(...(result as IDataObject[]));

		if (result.length < pageSize) break;

		skip += pageSize;
	}

	return out;
}
