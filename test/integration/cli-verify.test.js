'use strict';

const assert = require('proclaim');
const fs = require('fs');
const path = require('path');

describe('oist verify', () => {
	let sourceDirectory;

	before(() => {
		sourceDirectory = path.join(global.testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
		fs.writeFileSync(path.join(sourceDirectory, 'valid.svg'), '<svg></svg>');
		return global.cliCall([
			'verify'
		]);
	});

	after(() => {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.unlinkSync(path.join(sourceDirectory, 'valid.svg'));
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs a success message', () => {
		assert.match(global.cliCall.lastResult.output, /verifying images/i);
		assert.match(global.cliCall.lastResult.output, /verified all images/i);
	});

	it('exits with a code of 0', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

});

describe('oist verify (with invalid images present)', () => {
	let sourceDirectory;

	before(() => {
		sourceDirectory = path.join(global.testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
		fs.writeFileSync(path.join(sourceDirectory, 'valid.svg'), '<svg width="100" height="100"></svg>');
		return global.cliCall([
			'verify'
		]);
	});

	after(() => {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.unlinkSync(path.join(sourceDirectory, 'valid.svg'));
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs an error', () => {
		assert.match(global.cliCall.lastResult.output, /verifying images/i);
		assert.match(global.cliCall.lastResult.output, /root svg element must not have a `width` attribute/i);
		assert.match(global.cliCall.lastResult.output, /root svg element must not have a `height` attribute/i);
	});

	it('exits with a code of 1', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 1);
	});

});

describe('oist verify --source-directory is-a-directory', () => {
	let sourceDirectory;

	before(() => {
		sourceDirectory = path.join(global.testDirectory, 'is-a-directory');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
		fs.writeFileSync(path.join(sourceDirectory, 'valid.svg'), '<svg></svg>');
		return global.cliCall([
			'verify',
			'--source-directory', 'is-a-directory'
		]);
	});

	after(() => {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.unlinkSync(path.join(sourceDirectory, 'valid.svg'));
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs a success message', () => {
		assert.match(global.cliCall.lastResult.output, /verifying images/i);
		assert.match(global.cliCall.lastResult.output, /verified all images/i);
	});

	it('exits with a code of 0', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

});

describe('IMAGESET_SOURCE_DIRECTORY=is-a-directory oist verify', () => {
	let sourceDirectory;

	before(() => {
		sourceDirectory = path.join(global.testDirectory, 'is-a-directory');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
		fs.writeFileSync(path.join(sourceDirectory, 'valid.svg'), '<svg></svg>');
		return global.cliCall([
			'verify'
		], {
			IMAGESET_SOURCE_DIRECTORY: 'is-a-directory'
		});
	});

	after(() => {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.unlinkSync(path.join(sourceDirectory, 'valid.svg'));
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs a success message', () => {
		assert.match(global.cliCall.lastResult.output, /verifying images/i);
		assert.match(global.cliCall.lastResult.output, /verified all images/i);
	});

	it('exits with a code of 0', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

});

describe('oist verify --source-directory not-a-directory', () => {

	before(() => {
		return global.cliCall([
			'verify',
			'--source-directory', 'not-a-directory'
		]);
	});

	it('exits with a code of 1', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 1);
	});

});
