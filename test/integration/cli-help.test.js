'use strict';

const assert = require('proclaim');

describe('oist', function() {

	before(function() {
		return global.cliCall([]);
	});

	it('outputs help', function() {
		assert.match(global.cliCall.lastResult.output, /usage:/i);
	});

	it('exits with a code of 0', function() {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

});

describe('oist --help', function() {

	before(function() {
		return global.cliCall([
			'--help'
		]);
	});

	it('outputs help', function() {
		assert.match(global.cliCall.lastResult.output, /usage:/i);
	});

	it('exits with a code of 0', function() {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

});

describe('oist not-a-command', function() {

	before(function() {
		return global.cliCall([
			'not-a-command'
		]);
	});

	it('outputs an error', function() {
		assert.include(global.cliCall.lastResult.output, 'Command "not-a-command" not found');
	});

	it('exits with a code of 1', function() {
		assert.strictEqual(global.cliCall.lastResult.code, 1);
	});

});
