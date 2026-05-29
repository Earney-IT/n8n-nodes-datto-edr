import { IDataObject, IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { FieldDescriptor, OperationName, ResourceDescriptor } from '../registry/types';
import {
  buildFilterQs,
  dattoEdrApiRequest,
  dattoEdrApiRequestAllItems,
} from '../shared/transport';

/** Returns [] when getAll finds zero records. */
export async function executeGeneric(
  this: IExecuteFunctions,
  d: ResourceDescriptor,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as OperationName;
  const idParamName = d.idParam ?? `${d.name}Id`;

  // Arrow functions capture `this` lexically — no alias needed.

  /** Read a required ID param; throw if missing. */
  const requireId = (): string => {
    const id = this.getNodeParameter(idParamName, index, '') as string;
    if (!id && id !== '0') {
      throw new NodeOperationError(
        this.getNode(),
        `"${idParamName}" is required for operation "${operation}" on ${d.displayName}.`,
        { itemIndex: index },
      );
    }
    return id;
  };

  /** Collect create/update body from d.fields matching the current operation. */
  const collectBody = (): IDataObject => {
    const body: IDataObject = {};
    for (const f of d.fields as FieldDescriptor[]) {
      const onOps = f.onOperations ?? (['create', 'update'] as OperationName[]);
      if (!onOps.includes(operation)) continue;
      const v = this.getNodeParameter(f.name, index, undefined);
      if (v === undefined) continue;
      if (v === '' && !f.required) continue;
      // Special __merge property: parse the JSON value and spread it into body
      // rather than assigning to body['__merge']. Used for "Additional Fields" json fields.
      if (f.property === '__merge' && f.type === 'json') {
        const parsed =
          typeof v === 'string'
            ? (JSON.parse(v) as IDataObject)
            : (v as IDataObject);
        Object.assign(body, parsed);
        continue;
      }
      // For json-type fields, parse string → object
      if (f.type === 'json' && typeof v === 'string') {
        body[f.property] = JSON.parse(v) as IDataObject;
      } else {
        body[f.property] = v as IDataObject[keyof IDataObject];
      }
    }
    return body;
  };

  /**
   * Coerce a string to a number when it looks numeric; otherwise return as-is.
   * Used for gt/gte/lt/lte/eq operators so numeric fields aren't sent as strings.
   */
  const coerceNumeric = (v: string): string | number => {
    if (v.trim() !== '' && !isNaN(Number(v))) return Number(v);
    return v;
  };

  /**
   * Build a LoopBack where clause from the new operator-aware fixedCollection.
   * Input shape: { condition: [{field, operator, value}, ...] }
   */
  const buildWhereFromFilters = (): IDataObject => {
    const where: IDataObject = {};
    const filtersParam = this.getNodeParameter('filters', index, {}) as IDataObject;
    const conditions = Array.isArray(filtersParam.condition)
      ? (filtersParam.condition as Array<{ field: string; operator: string; value: string }>)
      : [];

    for (const { field, operator, value } of conditions) {
      if (!field || value === undefined || value === null || value === '') continue;

      switch (operator) {
        case 'eq':
          where[field] = coerceNumeric(value);
          break;
        case 'neq':
          where[field] = { neq: value };
          break;
        case 'gt':
          where[field] = { gt: coerceNumeric(value) };
          break;
        case 'gte':
          where[field] = { gte: coerceNumeric(value) };
          break;
        case 'lt':
          where[field] = { lt: coerceNumeric(value) };
          break;
        case 'lte':
          where[field] = { lte: coerceNumeric(value) };
          break;
        case 'like':
          where[field] = { like: `%${value}%` };
          break;
        case 'inq':
          where[field] = {
            inq: value
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s.length > 0),
          };
          break;
        default:
          where[field] = value;
      }
    }

    return where;
  };

  /** Read filter options: where (from filters fixedCollection + options.whereJson), order, fields, include. */
  const readOptions = (): {
    where: IDataObject;
    order: string | undefined;
    fields: string[] | undefined;
    include: string[] | undefined;
  } => {
    // Build where from the operator-aware conditions
    const where = buildWhereFromFilters();

    // Read from options collection
    const optionsParam = this.getNodeParameter('options', index, {}) as IDataObject;
    const order = optionsParam.order ? String(optionsParam.order) : undefined;
    const fieldsRaw = optionsParam.fields ? String(optionsParam.fields) : undefined;
    const fields = fieldsRaw
      ? fieldsRaw
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : undefined;
    const include = Array.isArray(optionsParam.include)
      ? (optionsParam.include as string[])
      : undefined;

    // Merge whereJson over conditions (raw LoopBack where JSON, advanced)
    const whereJsonRaw = optionsParam.whereJson;
    if (whereJsonRaw && typeof whereJsonRaw === 'string' && whereJsonRaw.trim() !== '' && whereJsonRaw.trim() !== '{}') {
      try {
        const parsed = JSON.parse(whereJsonRaw) as IDataObject;
        Object.assign(where, parsed);
      } catch {
        // Silently ignore invalid JSON — the build step / lint will catch schema issues
      }
    }

    return { where, order, fields, include };
  };

  switch (operation) {
    case 'getAll': {
      const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
      const { where, order, fields, include } = readOptions();

      const baseFilter: IDataObject = {};
      if (Object.keys(where).length > 0) baseFilter.where = where;
      if (order) baseFilter.order = order;
      if (fields && fields.length > 0) baseFilter.fields = fields;
      if (include && include.length > 0) baseFilter.include = include;

      let items: IDataObject[];
      if (returnAll) {
        items = await dattoEdrApiRequestAllItems.call(this, d.model, baseFilter);
      } else {
        const limit = this.getNodeParameter('limit', index, 50) as number;
        const filter = { ...baseFilter, limit };
        const result = await dattoEdrApiRequest.call(this, 'GET', d.model, buildFilterQs(filter));
        items = Array.isArray(result) ? (result as IDataObject[]) : [];
      }
      return this.helpers.returnJsonArray(items);
    }

    case 'get': {
      const id = requireId();
      const { fields, include } = readOptions();
      const getFilter: IDataObject = {};
      if (fields && fields.length > 0) getFilter.fields = fields;
      if (include && include.length > 0) getFilter.include = include;
      const qs = Object.keys(getFilter).length > 0 ? buildFilterQs(getFilter) : {};
      const result = await dattoEdrApiRequest.call(this, 'GET', `${d.model}/${id}`, qs);
      return this.helpers.returnJsonArray([result as IDataObject]);
    }

    case 'count': {
      const where = buildWhereFromFilters();
      const qs: IDataObject = {};
      if (Object.keys(where).length > 0) {
        qs.where = JSON.stringify(where);
      }
      const result = await dattoEdrApiRequest.call(this, 'GET', `${d.model}/count`, qs);
      return this.helpers.returnJsonArray([result as IDataObject]);
    }

    case 'create': {
      const body = collectBody();
      const result = await dattoEdrApiRequest.call(this, 'POST', d.model, {}, body);
      return this.helpers.returnJsonArray([result as IDataObject]);
    }

    case 'update': {
      const id = requireId();
      const body = collectBody();
      const result = await dattoEdrApiRequest.call(this, 'PATCH', `${d.model}/${id}`, {}, body);
      return this.helpers.returnJsonArray([result as IDataObject]);
    }

    case 'delete': {
      const id = requireId();
      await dattoEdrApiRequest.call(this, 'DELETE', `${d.model}/${id}`);
      return this.helpers.returnJsonArray([{ success: true, id }]);
    }

    default: {
      // Exhaustive never check
      const _exhaustive: never = operation;
      throw new Error(`Unknown operation: ${String(_exhaustive)}`);
    }
  }
}
