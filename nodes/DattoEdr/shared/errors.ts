import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import type { INode, JsonObject } from 'n8n-workflow';

type MinimalCtx = { getNode: () => INode };

/**
 * Maps a raw HTTP/transport error to an n8n NodeApiError or NodeOperationError.
 * Reads the LoopBack 3 error envelope: { error: { statusCode, name, message } }.
 * Always throws — return type is `never`.
 */
export function toNodeError(ctx: MinimalCtx, error: unknown): never {
	const err = error as { response?: { status?: number; data?: { error?: { statusCode?: number; message?: string } } }; message?: string };
	if (err.response) {
		const status: number =
			(err.response?.data?.error?.statusCode as number | undefined) ??
			(err.response?.status as number);

		const detail: string =
			(err.response?.data?.error?.message as string | undefined) ??
			(err?.message as string | undefined) ??
			'No detail available';

		// Cast to JsonObject for NodeApiError
		const errorObj = error as unknown as JsonObject;

		switch (status) {
			case 401:
				throw new NodeApiError(ctx.getNode(), errorObj, {
					message: `Datto EDR API error (401): Authentication failed — check the API token. (${detail})`,
					httpCode: '401',
				});
			case 403:
				throw new NodeApiError(ctx.getNode(), errorObj, {
					message: `Datto EDR API error (403): Access forbidden. (${detail})`,
					httpCode: '403',
				});
			case 404:
				throw new NodeApiError(ctx.getNode(), errorObj, {
					message: `Datto EDR API error (404): Not found. (${detail})`,
					httpCode: '404',
				});
			case 429:
				throw new NodeApiError(ctx.getNode(), errorObj, {
					message: `Datto EDR API error (429): Rate limited. (${detail})`,
					httpCode: '429',
				});
			default:
				throw new NodeApiError(ctx.getNode(), errorObj, {
					message: `Datto EDR API error (${status}): ${detail}`,
					httpCode: String(status),
				});
		}
	}

	throw new NodeOperationError(
		ctx.getNode(),
		`Datto EDR request failed: ${(err?.message as string | undefined) ?? 'No error message available'}`,
	);
}
