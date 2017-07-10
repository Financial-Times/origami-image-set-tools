'use strict';

const sinon = require('sinon');
require('sinon-as-promised');

const xml = module.exports = {
	parseXml: sinon.stub()
};

xml.mockInstance = {
	root: sinon.stub()
};

xml.mockRootNode = {
	attr: sinon.stub().returns(null)
};

xml.parseXml.returns(xml.mockInstance);
xml.mockInstance.root.returns(xml.mockRootNode);
