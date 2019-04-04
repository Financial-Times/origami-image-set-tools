'use strict';

const nixt = require('nixt');
const path = require('path');
const oist = path.join(__dirname, '../../', require('../../package.json').bin.oist);
describe('oist --version', function() {
	it('outputs a version number', function(done) {
		nixt().cwd(testDirectory)
			.run(`${oist} publish-s3`).stdout('0.0.0')
			.end(done);
	});

	it('exits with a code of 0', function(done) {
		nixt().cwd(testDirectory)
			.run(`${oist} publish-s3`)
			.code(0)
			.end(done);
	});

});
