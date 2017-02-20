'use strict';

const sinon = require('sinon');
require('sinon-as-promised');

module.exports = {
	createReadStream: sinon.stub(),
	readdir: sinon.stub().resolves(),
	writeFile: sinon.stub().resolves()
};
