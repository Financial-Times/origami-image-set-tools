'use strict';

const sinon = require('sinon');

module.exports = {
	createReadStream: sinon.stub(),
	readdir: sinon.stub().resolves(),
	readFile: sinon.stub().resolves(),
	writeFile: sinon.stub().resolves()
};
