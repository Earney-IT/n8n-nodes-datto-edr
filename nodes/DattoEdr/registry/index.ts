import { descriptor as agent } from './resources/agent';
import { descriptor as alert } from './resources/alert';
import { descriptor as box } from './resources/box';
import { descriptor as extension } from './resources/extension';
import { descriptor as flag } from './resources/flag';
import { descriptor as location } from './resources/location';
import { descriptor as organization } from './resources/organization';
import { descriptor as policy } from './resources/policy';
import { descriptor as quarantinedFile } from './resources/quarantinedFile';
import { descriptor as report } from './resources/report';
import { descriptor as suppressionRule } from './resources/suppressionRule';
import { descriptor as target } from './resources/target';
import { descriptor as user } from './resources/user';
import { descriptor as webhook } from './resources/webhook';
import { ResourceDescriptor } from './types';

export const registry: ResourceDescriptor[] = [
  agent,
  alert,
  box,
  extension,
  flag,
  location,
  organization,
  policy,
  quarantinedFile,
  report,
  suppressionRule,
  target,
  user,
  webhook,
];

/** All registered resources (no gating — kept for node-layer symmetry). */
export const enabledResources = registry;
