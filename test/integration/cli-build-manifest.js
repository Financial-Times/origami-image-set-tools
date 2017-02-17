'use strict';

const assert = require('proclaim');
const fs = require('fs');
const path = require('path');

describe('oist build-manifest', () => {

	before(() => {
		fs.mkdirSync(path.join(global.testDirectory, 'src'));
		fs.writeFileSync(path.join(global.testDirectory, 'src', 'example.png'), '');
		return global.cliCall([
			'build-manifest'
		]);
	});

	it('outputs a success message', () => {
		assert.match(global.cliCall.lastResult.output, /building manifest file/i);
		assert.match(global.cliCall.lastResult.output, /manifest file saved/i);
	});

	it('exits with a code of 0', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

	it('creates the manifest file', () => {
		const manifestPath = path.join(global.testDirectory, 'imageset.json');
		const manifestContents = fs.readFileSync(manifestPath);
		let manifestJson;
		assert.doesNotThrow(() => manifestJson = JSON.parse(manifestContents));
		assert.deepEqual(manifestJson, {
			sourceDirectory: 'src',
			images: [
				{
					name: 'example',
					extension: 'png',
					path: 'src/example.png'
				}
			]
		});
	});

});

describe('oist build-manifest --source-directory is-a-directory', () => {

	before(() => {
		fs.mkdirSync(path.join(global.testDirectory, 'is-a-directory'));
		return global.cliCall([
			'build-manifest',
			'--source-directory',
			'is-a-directory'
		]);
	});

	it('outputs a success message', () => {
		assert.match(global.cliCall.lastResult.output, /building manifest file/i);
		assert.match(global.cliCall.lastResult.output, /manifest file saved/i);
	});

	it('exits with a code of 0', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

	it('creates the manifest file', () => {
		const manifestPath = path.join(global.testDirectory, 'imageset.json');
		const manifestContents = fs.readFileSync(manifestPath);
		let manifestJson;
		assert.doesNotThrow(() => manifestJson = JSON.parse(manifestContents));
		assert.deepEqual(manifestJson, {
			sourceDirectory: 'is-a-directory',
			images: []
		});
	});

});

describe('oist build-manifest --source-directory not-a-directory', () => {

	before(() => {
		return global.cliCall([
			'build-manifest',
			'--source-directory',
			'not-a-directory'
		]);
	});

	it('outputs an error', () => {
		assert.match(global.cliCall.lastResult.output, /building manifest file/i);
		assert.match(global.cliCall.lastResult.output, /manifest file could not be saved/i);
	});

	it('exits with a code of 1', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 1);
	});

});
