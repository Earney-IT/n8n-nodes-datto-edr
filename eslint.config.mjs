import { config } from '@n8n/node-cli/eslint';

export default [
	...config,
	{
		ignores: ['**/*.test.ts', '**/__testutils__/**'],
	},
	{
		// The n8n-nodes-base/node-param-fixed-collection-type-unsorted-items rule
		// crashes (not just warns) on fixedCollection sections built inside a
		// function body (it fails to walk back up to the enclosing node parameter
		// via parent traversal). Disable only that rule for properties.ts.
		files: ['**/engine/properties.ts'],
		rules: {
			'n8n-nodes-base/node-param-fixed-collection-type-unsorted-items': 'off',
		},
	},
];
