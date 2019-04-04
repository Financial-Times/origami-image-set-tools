'use strict';

const assert = require('proclaim');
const fs = require('fs');
const path = require('path');
const nixt = require('nixt');
const oist = path.join(__dirname, '../../', require('../../package.json').bin.oist);

describe('oist verify', function() {
	let sourceDirectory;

	before(function() {
		sourceDirectory = path.join(global.testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
		fs.writeFileSync(path.join(sourceDirectory, 'valid.svg'), '<svg></svg>');
	});

	after(function() {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.unlinkSync(path.join(sourceDirectory, 'valid.svg'));
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs a success message', function(done) {
		nixt()
			.run(`${oist} verify`)
			.stdout(/verifying images/i)
			.stdout(/verified all images/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt()
			.run(`${oist} verify`)
			.code(0)
			.end(done);
	});

});

describe('oist verify (with invalid images present)', function() {
	let sourceDirectory;

	before(function() {
		sourceDirectory = path.join(global.testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
		fs.writeFileSync(path.join(sourceDirectory, 'valid.svg'), '<svg width="100" height="100"></svg>');
	});

	after(function() {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.unlinkSync(path.join(sourceDirectory, 'valid.svg'));
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs an error', function(done) {
		nixt()
			.run(`${oist} verify`)
			.stdout(/verifying images/i)
			.stdout(/root svg element must not have a `width` attribute/i)
			.stdout(/root svg element must not have a `height` attribute/i)
			.end(done);
	});

	it('exits with a code of 1', function(done) {
		nixt()
			.run(`${oist} verify`)
			.code(1)
			.end(done);
	});

});

describe('oist verify --source-directory is-a-directory', function() {
	let sourceDirectory;

	before(function() {
		sourceDirectory = path.join(global.testDirectory, 'is-a-directory');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
		fs.writeFileSync(path.join(sourceDirectory, 'valid.svg'), '<svg></svg>');
	});

	after(function() {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.unlinkSync(path.join(sourceDirectory, 'valid.svg'));
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs a success message', function(done) {
		nixt()
			.run(`${oist} verify --source-directory is-a-directory`)
			.stdout(/verifying images/i)
			.stdout(/verified all images/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt()
			.run(`${oist} verify --source-directory is-a-directory`)
			.code(0)
			.end(done);
	});

});

describe('IMAGESET_SOURCE_DIRECTORY=is-a-directory oist verify', function() {
	let sourceDirectory;

	before(function() {
		sourceDirectory = path.join(global.testDirectory, 'is-a-directory');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
		fs.writeFileSync(path.join(sourceDirectory, 'valid.svg'), '<svg></svg>');
	});

	after(function() {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.unlinkSync(path.join(sourceDirectory, 'valid.svg'));
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs a success message', function(done) {
		nixt()
			.env('IMAGESET_SOURCE_DIRECTORY', 'is-a-directory')
			.run(`${oist} verify`)
			.stdout(/verifying images/i)
			.stdout(/verified all images/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt()
			.env('IMAGESET_SOURCE_DIRECTORY', 'is-a-directory')
			.run(`${oist} verify`)
			.code(0)
			.end(done);
	});

});

describe('oist verify --source-directory not-a-directory', function() {
	it('exits with a code of 1', function(done) {
		nixt()
			.run(`${oist} verify --source-directory is-a-directory`)
			.code(1)
			.end(done);
	});

});
