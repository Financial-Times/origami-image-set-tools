'use strict';

const nixt = require('nixt');
const path = require('path');
const oist = path.join(__dirname, '../../', require('../../package.json').bin.oist);

describe('oist', function() {
	it('outputs help', function(done) {
		nixt().cwd(testDirectory)
			.run(`${oist}`)
			.stdout(/usage:/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt().cwd(testDirectory)
			.run(`${oist}`)
			.code(0)
			.end(done);
	});

});

describe('oist --help', function() {

	it('outputs help', function(done) {
		nixt().cwd(testDirectory)
			.run(`${oist} --help`)
			.stdout(/usage:/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt().cwd(testDirectory)
			.run(`${oist} --help`)
			.code(0)
			.end(done);
	});

});

describe('oist not-a-command', function() {

	it('outputs an error', function(done) {
		nixt().cwd(testDirectory)
			.run(`${oist} not-a-command`)
			.stdout('Command "not-a-command" not found')
			.end(done);
	});

	it('exits with a code of 1', function(done) {
		nixt().cwd(testDirectory)
			.run(`${oist} not-a-command`)
			.code(1)
			.end(done);
	});

});
