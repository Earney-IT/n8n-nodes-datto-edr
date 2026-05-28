import { IDataObject } from 'n8n-workflow';

export function makeCtx(opts: {
  params?: Record<string, unknown>;
  credentials?: IDataObject;
  httpResponses?: any[];          // queued responses returned in order (arrays, objects, etc.)
  mode?: string;                  // execution mode, default 'manual'
  isTool?: boolean;               // simulate AI-tool invocation
} = {}) {
  const responses = [...(opts.httpResponses ?? [])];
  const calls: any[] = [];
  const ctx: any = {
    getInputData: () => [{ json: {} }],
    getNode: () => ({ name: 'Datto EDR', type: 'dattoEdr', parameters: opts.isTool ? { __isToolCall: true } : {} }),
    getMode: () => opts.mode ?? 'manual',
    isToolExecution: () => !!opts.isTool,
    continueOnFail: () => false,
    getNodeParameter: (n: string, _i: number, d?: unknown) =>
      (opts.params && n in opts.params) ? opts.params[n] : d,
    getCredentials: async () => opts.credentials ?? { baseUrl: 'https://x.infocyte.com/api', apiToken: 't' },
    helpers: {
      httpRequestWithAuthentication: async (_c: string, o: any) => { calls.push(o); return responses.shift() ?? []; },
      httpRequest: async (o: any) => { calls.push(o); return responses.shift() ?? []; },
      returnJsonArray: (d: any) => (Array.isArray(d) ? d : [d]).map((j: any) => ({ json: j })),
    },
    additionalData: opts.isTool ? { isToolExecution: true } : {},
    _calls: calls,
  };
  return ctx;
}
