import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import { FieldDescriptor, FilterField, OperationName, ResourceDescriptor } from '../registry/types';

// Operations that require a single-resource ID path param.
// getAll, count, create take no record id.
const ID_EXCLUDED = new Set<OperationName>(['getAll', 'count', 'create']);

// Operations that expose an options collection (order/fields/include).
const OPTIONS_OPS: OperationName[] = ['getAll', 'get'];

function operationDefault(ops: OperationName[]): OperationName {
  if (ops.includes('getAll')) return 'getAll';
  return ops[0];
}

function buildOperationOption(op: OperationName, displayName: string): INodePropertyOptions {
  const map: Record<OperationName, INodePropertyOptions> = {
    getAll: {
      name: 'Get Many',
      value: 'getAll',
      action: `Get many ${displayName} records`,
      description: `Retrieve multiple ${displayName} records with optional LoopBack filters`,
    },
    get: {
      name: 'Get',
      value: 'get',
      action: `Get a ${displayName}`,
      description: `Retrieve a single ${displayName} record by ID`,
    },
    count: {
      name: 'Count',
      value: 'count',
      action: `Count ${displayName} records`,
      description: `Return the count of ${displayName} records matching a filter`,
    },
    create: {
      name: 'Create',
      value: 'create',
      action: `Create a ${displayName}`,
      description: `Create a new ${displayName} record`,
    },
    update: {
      name: 'Update',
      value: 'update',
      action: `Update a ${displayName}`,
      description: `Update an existing ${displayName} record by ID`,
    },
    delete: {
      name: 'Delete',
      value: 'delete',
      action: `Delete a ${displayName}`,
      description: `Delete a ${displayName} record by ID`,
    },
  };
  return map[op];
}

function fieldTypeDefault(type: FieldDescriptor['type']): unknown {
  switch (type) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'dateTime':
      return '';
    case 'json':
      return {};
    case 'options':
      return '';
    default:
      return '';
  }
}

const N8N_TYPE_MAP: Record<FieldDescriptor['type'], INodeProperties['type']> = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  dateTime: 'dateTime',
  json: 'json',
  options: 'options',
};

function n8nType(type: FieldDescriptor['type']): INodeProperties['type'] {
  return N8N_TYPE_MAP[type];
}

function toTitleCase(s: string): string {
  return s.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildFieldProperty(
  f: FieldDescriptor,
  resourceName: string,
  operations: OperationName[],
): INodeProperties {
  const prop: INodeProperties = {
    displayName: f.displayName,
    name: f.name,
    type: n8nType(f.type),
    default: f.default !== undefined ? f.default : fieldTypeDefault(f.type),
    ...(f.required ? { required: true } : {}),
    displayOptions: {
      show: {
        resource: [resourceName],
        operation: operations,
      },
    },
  } as INodeProperties;

  if (f.description !== undefined) {
    prop.description = f.description;
  }

  if (f.type === 'options') {
    if (f.loadOptionsMethod) {
      (prop as INodeProperties & { typeOptions: { loadOptionsMethod: string } }).typeOptions = {
        loadOptionsMethod: f.loadOptionsMethod,
      };
      prop.description =
        f.description ??
        `Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.`;
    } else {
      prop.options = f.options ?? [];
    }
  }

  return prop;
}

function buildFilterOption(f: FilterField): Record<string, unknown> {
  const opt: Record<string, unknown> = {
    displayName: f.displayName,
    name: f.name,
    type: n8nType(f.type as FieldDescriptor['type']),
    default: fieldTypeDefault(f.type as FieldDescriptor['type']),
  };
  if (f.description !== undefined) {
    opt.description = f.description;
  }
  if (f.type === 'options') {
    if (f.loadOptionsMethod) {
      opt.typeOptions = { loadOptionsMethod: f.loadOptionsMethod };
    } else {
      opt.options = f.options ?? [];
    }
  }
  return opt;
}

export function buildResourceProperties(d: ResourceDescriptor): INodeProperties[] {
  if (d.operations.length === 0) {
    throw new Error(`ResourceDescriptor '${d.name}' has no operations. At least one operation is required.`);
  }

  const props: INodeProperties[] = [];

  // 1. Operation dropdown
  const opOptions = d.operations
    .map((op) => buildOperationOption(op, d.displayName))
    .sort((a, b) => (a.name as string).localeCompare(b.name as string));

  props.push({
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: [d.name],
      },
    },
    options: opOptions as INodeProperties['options'],
    default: operationDefault(d.operations),
  });

  // 2. ID param — shown for all ops that address a single record
  const idParamName = d.idParam ?? `${d.name}Id`;
  const idOps = d.operations.filter((op) => !ID_EXCLUDED.has(op));
  if (idOps.length > 0) {
    props.push({
      displayName: `${d.displayName} ID`,
      name: idParamName,
      type: 'string',
      required: true,
      default: '',
      description: `The ID of the ${d.displayName}`,
      displayOptions: {
        show: {
          resource: [d.name],
          operation: idOps,
        },
      },
    });
  }

  // 3. Field properties
  const reserved = new Set(['operation', 'returnAll', 'limit', 'filters', 'options', idParamName]);
  for (const f of d.fields) {
    if (reserved.has(f.name)) {
      throw new Error(
        `ResourceDescriptor '${d.name}': field name '${f.name}' collides with a reserved param name.`,
      );
    }
    const fieldOps = f.onOperations ?? (['create', 'update'] as OperationName[]);
    props.push(buildFieldProperty(f, d.name, fieldOps));
  }

  // 4. getAll extras: returnAll, limit, filters collection
  if (d.operations.includes('getAll')) {
    props.push({
      displayName: 'Return All',
      name: 'returnAll',
      type: 'boolean',
      default: false,
      description: 'Whether to return all results or only up to a given limit',
      displayOptions: {
        show: {
          resource: [d.name],
          operation: ['getAll'],
        },
      },
    });

    props.push({
      displayName: 'Limit',
      name: 'limit',
      type: 'number',
      typeOptions: { minValue: 1 },
      default: 50,
      description: 'Max number of results to return',
      displayOptions: {
        show: {
          resource: [d.name],
          operation: ['getAll'],
          returnAll: [false],
        },
      },
    });
  }

  // 4b. Filters collection — shown on getAll + count (whichever are present)
  if (d.filters && d.filters.length > 0) {
    const filterOps = (['getAll', 'count'] as OperationName[]).filter((op) =>
      d.operations.includes(op),
    );
    if (filterOps.length > 0) {
      props.push({
        displayName: 'Filters',
        name: 'filters',
        type: 'collection',
        placeholder: 'Add Filter',
        default: {},
        displayOptions: {
          show: {
            resource: [d.name],
            operation: filterOps,
          },
        },
        options: d.filters.map(buildFilterOption) as unknown as INodeProperties['options'],
      });
    }
  }

  // 5. Options collection (order, fields, include) — shown on getAll + get
  const optionOps = OPTIONS_OPS.filter((op) => d.operations.includes(op));
  if (optionOps.length > 0) {
    const subOptions: Record<string, unknown>[] = [
      {
        displayName: 'Order',
        name: 'order',
        type: 'string',
        default: '',
        description: 'Sort order for results, e.g. "createdOn DESC"',
      },
      {
        displayName: 'Fields',
        name: 'fields',
        type: 'string',
        default: '',
        description: 'Comma-separated list of fields to include in the response',
      },
    ];

    if (d.includes && d.includes.length > 0) {
      subOptions.push({
        displayName: 'Include',
        name: 'include',
        type: 'multiOptions',
        default: [],
        description: 'Related resources to embed in the response',
        options: [...d.includes]
          .sort((a, b) => a.localeCompare(b))
          .map((i) => ({ name: toTitleCase(i), value: i })),
      });
    }

    props.push({
      displayName: 'Options',
      name: 'options',
      type: 'collection',
      placeholder: 'Add Option',
      default: {},
      displayOptions: {
        show: {
          resource: [d.name],
          operation: optionOps,
        },
      },
      options: subOptions as unknown as INodeProperties['options'],
    });
  }

  return props;
}
