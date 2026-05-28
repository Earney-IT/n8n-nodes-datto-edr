import { IDataObject, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { buildFilterQs, dattoEdrApiRequest } from '../shared/transport';

/**
 * Generic loadOptions factory.
 * - Calls GET /<model> with a limit=1000 filter and only id+name fields.
 * - Filters items that have no id.
 * - Falls back to id as the display name when name is missing.
 * - Sorts alphabetically by name.
 */
function makeLoader(model: string) {
  return async function (this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const qs = buildFilterQs({ limit: 1000, fields: ['id', 'name'] });
    const result = await dattoEdrApiRequest.call(this, 'GET', model, qs);
    const items = Array.isArray(result) ? (result as IDataObject[]) : [];
    const opts = items
      .filter((item) => item && item.id !== undefined && item.id !== null)
      .map((item) => {
        const rawName = item.name;
        const displayName = rawName != null ? String(rawName) : String(item.id);
        return { name: displayName, value: String(item.id) };
      });
    opts.sort((a, b) => a.name.localeCompare(b.name));
    return opts;
  };
}

/** Organisations — used as a filter on Agents, Alerts, Targets, Policies, QuarantinedFiles. */
export const getOrganizations = makeLoader('Organizations');

/** Targets — used when assigning agents to a target group. */
export const getTargets = makeLoader('Targets');

/** Locations — used where location dropdowns are needed. */
export const getLocations = makeLoader('Locations');
