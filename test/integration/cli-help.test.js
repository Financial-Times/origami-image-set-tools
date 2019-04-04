'use strict';

const nixt = require('nixt');
const path = require('path');
const oist = path.join(__dirname, '../../', require('../../package.json').bin.oist);

describe('oist', function() {
	it('outputs help', function(done) {
		nixt({ colors: false })
			.run(`${oist}`)
			.stdout(/usage:/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt({ colors: false })
			.run(`${oist}`)
			.code(0)
			.end(done);
	});

});

describe('oist --help', function() {

	it('outputs help', function(done) {
		nixt({ colors: false })
			.run(`${oist} --help`)
			.stdout(/usage:/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt({ colors: false })
			.run(`${oist} --help`)
			.code(0)
			.end(done);
	});

});

describe('oist not-a-command', function() {

	it('outputs an error and exits with a code of 1', function(done) {
		nixt({ colors: false })
			.run(`${oist} not-a-command`)
			.stderr(/^Command "not-a-command" not found/i)
			.stdout(/usage:/i)
			.end(done);
	});

	it('exits with a code of 1', function(done) {
		nixt({ colors: false })
			.run(`${oist} not-a-command`)
			.end(done);
	});

});
