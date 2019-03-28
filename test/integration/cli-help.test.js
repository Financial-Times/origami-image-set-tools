'use strict';

const assert = require('proclaim');

describe('oist', () => {

	before(() => {
		return global.cliCall([]);
	});

	it('outputs help', () => {
		assert.match(global.cliCall.lastResult.output, /usage:/i);
	});

	it('exits with a code of 0', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

});

describe('oist --help', () => {

	before(() => {
		return global.cliCall([
			'--help'
		]);
	});

	it('outputs help', () => {
		assert.match(global.cliCall.lastResult.output, /usage:/i);
	});

	it('exits with a code of 0', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

});

describe('oist not-a-command', () => {

	before(() => {
		return global.cliCall([
			'not-a-command'
		]);
	});

	it('outputs an error', () => {
		assert.include(global.cliCall.lastResult.output, 'Command "not-a-command" not found');
	});

	it('exits with a code of 1', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 1);
	});

});
