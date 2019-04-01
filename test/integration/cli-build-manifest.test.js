'use strict';

const assert = require('proclaim');
const fs = require('fs');
const path = require('path');

describe('oist build-manifest', function() {
	let sourceDirectory;

	before(function() {
		sourceDirectory = path.join(global.testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
		return global.cliCall([
			'build-manifest'
		]);
	});

	after(function() {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs a success message', function() {
		assert.match(global.cliCall.lastResult.output, /building manifest file/i);
		assert.match(global.cliCall.lastResult.output, /manifest file saved/i);
	});

	it('exits with a code of 0', function() {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

	it('creates the manifest file', function() {
		const manifestPath = path.join(global.testDirectory, 'imageset.json');
		const manifestContents = fs.readFileSync(manifestPath);
		let manifestJson;
		assert.doesNotThrow(() => manifestJson = JSON.parse(manifestContents));
		assert.deepEqual(manifestJson, {
			version: '0.0.0',
			'host': 'https://www.ft.com',
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

describe('oist build-manifest --source-directory is-a-directory', function() {
	let sourceDirectory;

	before(function() {
		sourceDirectory = path.join(global.testDirectory, 'is-a-directory');
		fs.mkdirSync(sourceDirectory);
		return global.cliCall([
			'build-manifest',
			'--source-directory', 'is-a-directory'
		]);
	});

	after(function() {
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs a success message', function() {
		assert.match(global.cliCall.lastResult.output, /building manifest file/i);
		assert.match(global.cliCall.lastResult.output, /manifest file saved/i);
	});

	it('exits with a code of 0', function() {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

	it('creates the manifest file', function() {
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

describe('IMAGESET_SOURCE_DIRECTORY=is-a-directory oist build-manifest', function() {
	let sourceDirectory;

	before(function() {
		sourceDirectory = path.join(global.testDirectory, 'is-a-directory');
		fs.mkdirSync(sourceDirectory);
		return global.cliCall([
			'build-manifest'
		], {
			IMAGESET_SOURCE_DIRECTORY: 'is-a-directory'
		});
	});

	after(function() {
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs a success message', function() {
		assert.match(global.cliCall.lastResult.output, /building manifest file/i);
		assert.match(global.cliCall.lastResult.output, /manifest file saved/i);
	});

	it('exits with a code of 0', function() {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

	it('creates the manifest file', function() {
		const manifestPath = path.join(global.testDirectory, 'imageset.json');
		const manifestContents = fs.readFileSync(manifestPath);
		let manifestJson;
		assert.doesNotThrow(() => manifestJson = JSON.parse(manifestContents));
		assert.deepEqual(manifestJson, {
			version: '0.0.0',
			'host': 'https://www.ft.com',
			sourceDirectory: 'is-a-directory',
			scheme: 'noscheme',
			images: []
		});
	});

});

describe('oist build-manifest --scheme test-scheme', function() {
	let sourceDirectory;

	before(function() {
		sourceDirectory = path.join(global.testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		return global.cliCall([
			'build-manifest',
			'--scheme', 'test-scheme'
		]);
	});

	after(function() {
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs a success message', function() {
		assert.match(global.cliCall.lastResult.output, /building manifest file/i);
		assert.match(global.cliCall.lastResult.output, /manifest file saved/i);
	});

	it('exits with a code of 0', function() {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

	it('creates the manifest file', function() {
		const manifestPath = path.join(global.testDirectory, 'imageset.json');
		const manifestContents = fs.readFileSync(manifestPath);
		let manifestJson;
		assert.doesNotThrow(() => manifestJson = JSON.parse(manifestContents));
		assert.deepEqual(manifestJson, {
			version: '0.0.0',
			'host': 'https://www.ft.com',
			sourceDirectory: 'src',
			scheme: 'test-scheme',
			images: []
		});
	});

});

describe('IMAGESET_SCHEME=test-scheme oist build-manifest', function() {
	let sourceDirectory;

	before(function() {
		sourceDirectory = path.join(global.testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		return global.cliCall([
			'build-manifest'
		], {
			IMAGESET_SCHEME: 'test-scheme'
		});
	});

	after(function() {
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs a success message', function() {
		assert.match(global.cliCall.lastResult.output, /building manifest file/i);
		assert.match(global.cliCall.lastResult.output, /manifest file saved/i);
	});

	it('exits with a code of 0', function() {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

	it('creates the manifest file', function() {
		const manifestPath = path.join(global.testDirectory, 'imageset.json');
		const manifestContents = fs.readFileSync(manifestPath);
		let manifestJson;
		assert.doesNotThrow(() => manifestJson = JSON.parse(manifestContents));
		assert.deepEqual(manifestJson, {
			version: '0.0.0',
			'host': 'https://www.ft.com',
			sourceDirectory: 'src',
			scheme: 'test-scheme',
			images: []
		});
	});

});

describe('oist build-manifest --legacy', function() {
	let sourceDirectory;

	before(function() {
		sourceDirectory = path.join(global.testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
		return global.cliCall([
			'build-manifest',
			'--legacy'
		]);
	});

	after(function() {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs a success message', function() {
		assert.match(global.cliCall.lastResult.output, /building legacy manifest file/i);
		assert.match(global.cliCall.lastResult.output, /legacy manifest file saved/i);
	});

	it('exits with a code of 0', function() {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

	it('creates the legacy manifest file', function() {
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

describe('oist build-manifest --source-directory not-a-directory', function() {

	before(function() {
		return global.cliCall([
			'build-manifest',
			'--source-directory', 'not-a-directory'
		]);
	});

	it('outputs an error', function() {
		assert.match(global.cliCall.lastResult.output, /building manifest file/i);
		assert.match(global.cliCall.lastResult.output, /manifest file could not be saved/i);
	});

	it('exits with a code of 1', function() {
		assert.strictEqual(global.cliCall.lastResult.code, 1);
	});

});
