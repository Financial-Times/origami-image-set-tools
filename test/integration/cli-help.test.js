'use strict';

const nixt = require('nixt');
const path = require('path');
const oist = path.join(__dirname, '../../', require('../../package.json').bin.oist);

describe('oist', function() {
	it('outputs help', function(done) {
		nixt()
			.run(`${oist}`)
			.stdout(/usage:/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt()
			.run(`${oist}`)
			.code(0)
			.end(done);
	});

});

describe('oist --help', function() {

	before(function() {
		return global.cliCall([
			'--help'
		]);
	});

	it('outputs help', function(done) {
		nixt()
			.run(`${oist} --help`)
			.stdout(/usage:/i)
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt()
			.run(`${oist} --help`)
			.code(0)
			.end(done);
	});

});

describe('oist not-a-command', function() {

	before(function() {
		return global.cliCall([
			'not-a-command'
		]);
	});

	it('outputs an error', function(done) {
		nixt()
			.run(`${oist} not-a-command`)
			.stdout('Command "not-a-command" not found')
			.end(done);
	});

	it('exits with a code of 1', function(done) {
		nixt()
			.run(`${oist} not-a-command`)
			.code(1)
			.end(done);
	});

});
