'use strict';

const sinon = require('sinon');

const AWS = module.exports = {};

AWS.S3 = sinon.stub();
AWS.S3.mockInstance = {
	upload: sinon.stub(),
	headObject: sinon.stub()
};
AWS.S3.mockUpload = {
	promise: sinon.stub().resolves()
};
AWS.S3.headObject = {
	promise: sinon.stub().resolves()
};

AWS.S3.returns(AWS.S3.mockInstance);
AWS.S3.mockInstance.upload.returns(AWS.S3.mockUpload);
AWS.S3.mockInstance.headObject.returns(AWS.S3.headObject);
