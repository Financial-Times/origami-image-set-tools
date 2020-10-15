'use strict';

const assert = require('proclaim');
const fs = require('fs');
const path = require('path');
const nixt = require('nixt');
const rimraf = require('rimraf');
const oist = path.join(__dirname, '../../', require('../../package.json').bin.oist);

describe('oist build-manifest', function() {
	let sourceDirectory;
	let testDirectory;

	beforeEach(function() {
		testDirectory = fs.mkdtempSync('/tmp/oist-integration');
		sourceDirectory = path.join(testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
	});

	afterEach(function() {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		rimraf.sync(sourceDirectory);
		rimraf.sync(testDirectory);
	});

	it('outputs a success message', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.run(`${oist} build-manifest`)
			.stdout(/building manifest file/i)
			.stdout(/manifest file saved/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.run(`${oist} build-manifest`).code(0).end(done);
	});

	it('creates the manifest file', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.run(`${oist} build-manifest`)
			.end(function(err) {
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
				if (err) {
					done(err);
				} else {
					done();
				}
			});
	});

	it('does not modify the manifest deprecated image property on an already existing manifest file', function(done) {
		const manifestPath = path.join(testDirectory, 'imageset.json');
		const manifestContents = {
			sourceDirectory: 'src',
			scheme: 'noscheme',
			images: [
				{
					name: 'example',
					extension: 'png',
					path: 'src/example.png',
					hash: '923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda',
					url: 'https://www.ft.com/noscheme/v0/example-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda',
					deprecated: 'This image is deprecated because it is only an example image.'
				}
			]
		};
		fs.writeFileSync(manifestPath, JSON.stringify(manifestContents), 'utf-8');

		nixt({ colors: false }).cwd(testDirectory)
			.run(`${oist} build-manifest`)
			.end(function(err) {
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
							previousHash: '923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda',
							hash: '923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda',
							url: 'https://www.ft.com/noscheme/v0/example-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda',
							deprecated: 'This image is deprecated because it is only an example image.'
						}
					]
				});
				if (err) {
					done(err);
				} else {
					done();
				}
			});
	});
});

describe('oist build-manifest --source-directory is-a-directory', function() {
	let sourceDirectory;
	let testDirectory;

	beforeEach(function() {
		testDirectory = fs.mkdtempSync('/tmp/oist-integration');
		sourceDirectory = path.join(testDirectory, 'is-a-directory');
		fs.mkdirSync(sourceDirectory);
	});

	afterEach(function() {
		rimraf.sync(testDirectory);
	});

	it('outputs a success message', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.run(`${oist} build-manifest --source-directory is-a-directory`)
			.stdout(/building manifest file/i)
			.stdout(/manifest file saved/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.run(`${oist} build-manifest --source-directory is-a-directory`)
			.code(0)
			.end(done);
	});

	it('creates the manifest file', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.run(`${oist} build-manifest --source-directory is-a-directory`)
			.end(function(err) {
				const manifestPath = path.join(testDirectory, 'imageset.json');
				const manifestContents = fs.readFileSync(manifestPath);
				let manifestJson;
				assert.doesNotThrow(() => manifestJson = JSON.parse(manifestContents));
				assert.deepEqual(manifestJson, {
					sourceDirectory: 'is-a-directory',
					scheme: 'noscheme',
					images: []
				});
				if (err) {
					done(err);
				} else {
					done();
				}
			});
	});

});

describe('IMAGESET_SOURCE_DIRECTORY=is-a-directory oist build-manifest', function() {
	let sourceDirectory;
	let testDirectory;

	beforeEach(function() {
		testDirectory = fs.mkdtempSync('/tmp/oist-integration');
		sourceDirectory = path.join(testDirectory, 'is-a-directory');
		fs.mkdirSync(sourceDirectory);
	});

	afterEach(function() {
		rimraf.sync(testDirectory);
	});

	it('outputs a success message', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.env('IMAGESET_SOURCE_DIRECTORY', 'is-a-directory')
			.run(`${oist} build-manifest`)
			.stdout(/building manifest file/i)
			.stdout(/manifest file saved/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.env('IMAGESET_SOURCE_DIRECTORY', 'is-a-directory')
			.run(`${oist} build-manifest`)
			.code(0)
			.end(done);
	});

	it('creates the manifest file', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.env('IMAGESET_SOURCE_DIRECTORY', 'is-a-directory')
			.run(`${oist} build-manifest`)
			.end(function(err) {
				const manifestPath = path.join(testDirectory, 'imageset.json');
				const manifestContents = fs.readFileSync(manifestPath);
				let manifestJson;
				assert.doesNotThrow(() => manifestJson = JSON.parse(manifestContents));
				assert.deepEqual(manifestJson, {
					sourceDirectory: 'is-a-directory',
					scheme: 'noscheme',
					images: []
				});
				if (err) {
					done(err);
				} else {
					done();
				}
			});
	});

});

describe('oist build-manifest --scheme test-scheme', function() {
	let sourceDirectory;
	let testDirectory;

	beforeEach(function() {
		testDirectory = fs.mkdtempSync('/tmp/oist-integration');
		sourceDirectory = path.join(testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
	});

	afterEach(function() {
		rimraf.sync(testDirectory);
	});

	it('outputs a success message', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.run(`${oist} build-manifest --scheme test-scheme`)
			.stdout(/building manifest file/i)
			.stdout(/manifest file saved/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.run(`${oist} build-manifest --scheme test-scheme`)
			.code(0)
			.end(done);
	});

	it('creates the manifest file', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.run(`${oist} build-manifest --scheme test-scheme`)
			.end(function(err) {
				const manifestPath = path.join(testDirectory, 'imageset.json');
				const manifestContents = fs.readFileSync(manifestPath);
				let manifestJson;
				assert.doesNotThrow(() => manifestJson = JSON.parse(manifestContents));
				assert.deepEqual(manifestJson, {
					sourceDirectory: 'src',
					scheme: 'test-scheme',
					images: []
				});
				if (err) {
					done(err);
				} else {
					done();
				}
			});
	});

});

describe('IMAGESET_SCHEME=test-scheme oist build-manifest', function() {
	let sourceDirectory;
	let testDirectory;

	beforeEach(function() {
		testDirectory = fs.mkdtempSync('/tmp/oist-integration');
		sourceDirectory = path.join(testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
	});

	afterEach(function() {
		rimraf.sync(testDirectory);
	});

	it('outputs a success message', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.env('IMAGESET_SCHEME', 'test-scheme')
			.run(`${oist} build-manifest`)
			.stdout(/building manifest file/i)
			.stdout(/manifest file saved/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.env('IMAGESET_SCHEME', 'test-scheme')
			.run(`${oist} build-manifest`)
			.code(0)
			.end(done);
	});

	it('creates the manifest file', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.env('IMAGESET_SCHEME', 'test-scheme')
			.run(`${oist} build-manifest`)
			.end(function(err) {
				const manifestPath = path.join(testDirectory, 'imageset.json');
				const manifestContents = fs.readFileSync(manifestPath);
				let manifestJson;
				assert.doesNotThrow(() => manifestJson = JSON.parse(manifestContents));
				assert.deepEqual(manifestJson, {
					sourceDirectory: 'src',
					scheme: 'test-scheme',
					images: []
				});
				if (err) {
					done(err);
				} else {
					done();
				}
			});
	});

});

describe('oist build-manifest --legacy', function() {
	let sourceDirectory;
	let testDirectory;

	beforeEach(function() {
		testDirectory = fs.mkdtempSync('/tmp/oist-integration');
		sourceDirectory = path.join(testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
	});

	afterEach(function() {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		rimraf.sync(testDirectory);
	});

	it('outputs a success message', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.run(`${oist} build-manifest --legacy`)
			.stdout(/building legacy manifest file/i)
			.stdout(/legacy manifest file saved/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.run(`${oist} build-manifest --legacy`)
			.code(0)
			.end(done);
	});

	it('creates the legacy manifest file', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.run(`${oist} build-manifest --legacy`)
			.code(0)
			.end(function(err) {
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
				if (err) {
					done(err);
				} else {
					done();
				}
			});
	});

});

describe('oist build-manifest --source-directory not-a-directory', function() {
	let testDirectory;
	beforeEach(function() {
		testDirectory = fs.mkdtempSync('/tmp/oist-integration');
	});

	afterEach(function() {
		rimraf.sync(testDirectory);
	});

	it('outputs an error', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.run(`${oist} build-manifest --source-directory not-a-directory`)
			.stdout(/building manifest file/i)
			.stderr(/manifest file could not be saved/i)
			.end(done);
	});

	it('exits with a code of 1', function(done) {
		nixt({ colors: false }).cwd(testDirectory)
			.run(`${oist} build-manifest --source-directory not-a-directory`)
			.code(1)
			.end(done);
	});

});
