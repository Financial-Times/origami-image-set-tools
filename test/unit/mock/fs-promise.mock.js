'use strict';

const sinon = require('sinon');
require('sinon-as-promised');

module.exports = {
	readdir: sinon.stub().resolves(),
	writeFile: sinon.stub().resolves()
};
