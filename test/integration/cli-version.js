'use strict';

const assert = require('proclaim');

describe('oist --version', () => {

	before(() => {
		return global.cliCall([
			'--version'
		]);
	});

	it('outputs a version number', () => {
		assert.strictEqual(global.cliCall.lastResult.output, '0.0.0');
	});

	it('exits with a code of 0', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

});
