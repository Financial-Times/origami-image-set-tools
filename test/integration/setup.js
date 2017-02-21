'use strict';

const defaults = require('lodash/defaults');
const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;

global.testDirectory = fs.mkdtempSync('/tmp/oist-integration');

// Export a global cliCall function as a test helper
global.cliCall = cliCall;
global.cliCall.lastResult = null;

function cliCall(cliArguments, environment = {}) {

	const command = path.resolve(__dirname, '../../bin/origami-image-set-tools.js');
	const result = {
		output: '',
		stdout: '',
		stderr: '',
		code: 0
	};

	return new Promise(resolve => {
		const child = spawn(command, cliArguments || [], {
			cwd: global.testDirectory,
			env: defaults({}, environment, process.env)
		});
		child.stdout.on('data', data => {
			result.stdout += data;
			result.output += data;
		});
		child.stderr.on('data', data => {
			result.stderr += data;
			result.output += data;
		});
		child.on('close', code => {
			result.output = result.output.trim();
			result.stdout = result.stdout.trim();
			result.stderr = result.stderr.trim();
			result.code = code;
			global.cliCall.lastResult = result;
			resolve(result);
		});
	});

}
