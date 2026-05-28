import { INodePropertyOptions } from 'n8n-workflow';

export type OperationName = 'getAll' | 'get' | 'count' | 'create' | 'update' | 'delete';

export interface FieldDescriptor {
  name: string;             // n8n param (camelCase)
  property: string;         // LoopBack model property name (camelCase; sent as-is in create/update body)
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'dateTime' | 'options' | 'json';
  required?: boolean;
  default?: unknown;
  description?: string;
  loadOptionsMethod?: string;
  options?: INodePropertyOptions[];
  onOperations?: OperationName[]; // default ['create','update']
}

export interface FilterField {
  // Becomes a LoopBack where clause field on getAll/count
  name: string;             // n8n param
  property: string;         // model property for the where clause
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'dateTime' | 'options';
  default?: unknown;        // used by n8n ESLint rule; properties.ts uses fieldTypeDefault() instead
  placeholder?: string;     // used by n8n ESLint rule for email fields
  loadOptionsMethod?: string;
  options?: INodePropertyOptions[];
  description?: string;
}

export interface ResourceDescriptor {
  name: string;             // resource value e.g. 'agent'
  displayName: string;      // 'Agent'
  model: string;            // LoopBack path segment e.g. 'Agents'
  idParam?: string;         // default `${name}Id`
  operations: OperationName[];
  fields: FieldDescriptor[];
  filters?: FilterField[];
  includes?: string[];      // LoopBack include relation names
  special?: 'agents' | 'alerts' | 'targets' | 'quarantinedFiles';
}
