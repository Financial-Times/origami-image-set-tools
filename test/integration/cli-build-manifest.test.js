'use strict';

const assert = require('proclaim');
const fs = require('fs');
const path = require('path');

describe('oist build-manifest', () => {
	let sourceDirectory;

	before(() => {
		sourceDirectory = path.join(global.testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
		return global.cliCall([
			'build-manifest'
		]);
	});

	after(() => {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.rmdirSync(sourceDirectory);
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
			scheme: 'noscheme',
			images: [
				{
					name: 'example',
					extension: 'png',
					path: 'src/example.png',
					hash: '923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda'
				}
			]
		});
	});
});

describe('oist build-manifest --source-directory is-a-directory', () => {
	let sourceDirectory;

	before(() => {
		sourceDirectory = path.join(global.testDirectory, 'is-a-directory');
		fs.mkdirSync(sourceDirectory);
		return global.cliCall([
			'build-manifest',
			'--source-directory', 'is-a-directory'
		]);
	});

	after(() => {
		fs.rmdirSync(sourceDirectory);
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
			scheme: 'noscheme',
			images: []
		});
	});

});

describe('IMAGESET_SOURCE_DIRECTORY=is-a-directory oist build-manifest', () => {
	let sourceDirectory;

	before(() => {
		sourceDirectory = path.join(global.testDirectory, 'is-a-directory');
		fs.mkdirSync(sourceDirectory);
		return global.cliCall([
			'build-manifest'
		], {
			IMAGESET_SOURCE_DIRECTORY: 'is-a-directory'
		});
	});

	after(() => {
		fs.rmdirSync(sourceDirectory);
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
			scheme: 'noscheme',
			images: []
		});
	});

});

describe('oist build-manifest --scheme test-scheme', () => {
	let sourceDirectory;

	before(() => {
		sourceDirectory = path.join(global.testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		return global.cliCall([
			'build-manifest',
			'--scheme', 'test-scheme'
		]);
	});

	after(() => {
		fs.rmdirSync(sourceDirectory);
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
			scheme: 'test-scheme',
			images: []
		});
	});

});

describe('IMAGESET_SCHEME=test-scheme oist build-manifest', () => {
	let sourceDirectory;

	before(() => {
		sourceDirectory = path.join(global.testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		return global.cliCall([
			'build-manifest'
		], {
			IMAGESET_SCHEME: 'test-scheme'
		});
	});

	after(() => {
		fs.rmdirSync(sourceDirectory);
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
			scheme: 'test-scheme',
			images: []
		});
	});

});

describe('oist build-manifest --legacy', () => {
	let sourceDirectory;

	before(() => {
		sourceDirectory = path.join(global.testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
		return global.cliCall([
			'build-manifest',
			'--legacy'
		]);
	});

	after(() => {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs a success message', () => {
		assert.match(global.cliCall.lastResult.output, /building legacy manifest file/i);
		assert.match(global.cliCall.lastResult.output, /legacy manifest file saved/i);
	});

	it('exits with a code of 0', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

	it('creates the legacy manifest file', () => {
		const manifestPath = path.join(global.testDirectory, 'imageList.json');
		const manifestContents = fs.readFileSync(manifestPath);
		let manifestJson;
		assert.doesNotThrow(() => manifestJson = JSON.parse(manifestContents));
		assert.deepEqual(manifestJson, {
			images: [
				{
					name: 'example'
				}
			]
		});
	});

});

describe('oist build-manifest --source-directory not-a-directory', () => {

	before(() => {
		return global.cliCall([
			'build-manifest',
			'--source-directory', 'not-a-directory'
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