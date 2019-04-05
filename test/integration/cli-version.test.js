'use strict';

const nixt = require('nixt');
const path = require('path');
const oist = path.join(__dirname, '../../', require('../../package.json').bin.oist);
describe('oist --version', function() {
	it('outputs a version number', function(done) {
		nixt({ colors: false })
			.run(`${oist} --version`).stdout('0.0.0')
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt({ colors: false })
			.run(`${oist} --version`)
			.code(0)
			.end(done);
	});

});
