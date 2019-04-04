'use strict';

const assert = require('proclaim');
const fs = require('fs');
const path = require('path');
const nixt = require('nixt');
const oist = path.join(__dirname, '../../', require('../../package.json').bin.oist);

const testDirectory = fs.mkdtempSync('/tmp/oist-integration');

describe('oist build-manifest', function() {
	let sourceDirectory;

	before(function() {
		sourceDirectory = path.join(testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
	});

	after(function() {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs a success message', function(done) {
		nixt()
			.run(`${oist} build-manifest`)
			.stdout(/building manifest file/i)
			.stdout(/manifest file saved/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt()
			.run(`${oist} build-manifest`).code(0).end(done);
	});

	it('creates the manifest file', function() {
		const manifestPath = path.join(testDirectory, 'imageset.json');
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
					hash: '923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda',
					url: 'https://www.ft.com/noscheme/v0/example-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda'
				}
			]
		});
	});
});

describe('oist build-manifest --source-directory is-a-directory', function() {
	let sourceDirectory;

	before(function() {
		sourceDirectory = path.join(testDirectory, 'is-a-directory');
		fs.mkdirSync(sourceDirectory);
	});

	after(function() {
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs a success message', function(done) {
		nixt()
			.run(`${oist} build-manifest --source-directory is-a-directory`)
			.stdout(/building manifest file/i)
			.stdout(/manifest file saved/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt()
			.run(`${oist} build-manifest --source-directory is-a-directory`)
			.code(0)
			.end(done);
	});

	it('creates the manifest file', function() {
		const manifestPath = path.join(testDirectory, 'imageset.json');
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
		sourceDirectory = path.join(testDirectory, 'is-a-directory');
		fs.mkdirSync(sourceDirectory);
	});

	after(function() {
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs a success message', function(done) {
		nixt()
			.env('IMAGESET_SOURCE_DIRECTORY', 'is-a-directory')
			.run(`${oist} build-manifest`)
			.stdout(/building manifest file/i)
			.stdout(/manifest file saved/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt()
			.env('IMAGESET_SOURCE_DIRECTORY', 'is-a-directory')
			.run(`${oist} build-manifest`)
			.code(0)
			.end(done);
	});

	it('creates the manifest file', function() {
		const manifestPath = path.join(testDirectory, 'imageset.json');
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

describe('oist build-manifest --scheme test-scheme', function() {
	let sourceDirectory;

	before(function() {
		sourceDirectory = path.join(testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
	});

	after(function() {
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs a success message', function(done) {
		nixt()
			.run(`${oist} build-manifest --scheme test-scheme`)
			.stdout(/building manifest file/i)
			.stdout(/manifest file saved/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt()
			.run(`${oist} build-manifest --scheme test-scheme`)
			.code(0)
			.end(done);
	});

	it('creates the manifest file', function() {
		const manifestPath = path.join(testDirectory, 'imageset.json');
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

describe('IMAGESET_SCHEME=test-scheme oist build-manifest', function() {
	let sourceDirectory;

	before(function() {
		sourceDirectory = path.join(testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
	});

	after(function() {
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs a success message', function(done) {
		nixt()
			.env('IMAGESET_SCHEME', 'test-scheme')
			.run(`${oist} build-manifest`)
			.stdout(/building manifest file/i)
			.stdout(/manifest file saved/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt()
			.env('IMAGESET_SCHEME', 'test-scheme')
			.run(`${oist} build-manifest`)
			.code(0)
			.end(done);
	});

	it('creates the manifest file', function() {
		const manifestPath = path.join(testDirectory, 'imageset.json');
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

describe('oist build-manifest --legacy', function() {
	let sourceDirectory;

	before(function() {
		sourceDirectory = path.join(testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
	});

	after(function() {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs a success message', function(done) {
		nixt()
			.run(`${oist} build-manifest --legacy`)
			.stdout(/building legacy manifest file/i)
			.stdout(/legacy manifest file saved/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt()
			.run(`${oist} build-manifest --legacy`)
			.code(0)
			.end(done);
	});

	it('creates the legacy manifest file', function() {
		const manifestPath = path.join(testDirectory, 'imageList.json');
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

	it('outputs an error', function(done) {
		nixt()
			.run(`${oist} build-manifest --source-directory not-a-directory`)
			.stdout(/building manifest file/i)
			.stdout(/manifest file could not be saved/i)
			.end(done);
	});

	it('exits with a code of 1', function(done) {
		nixt()
			.run(`${oist} build-manifest --source-directory not-a-directory`)
			.code(1)
			.end(done);
	});

});
