'use strict';

const assert = require('proclaim');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Require S3 credentials as environment variables
if (!process.env.TEST_AWS_ACCESS_KEY || !process.env.TEST_AWS_SECRET_KEY) {
	console.error('Error: test AWS credentials are required to run the integration tests.');
	console.error('Please provide TEST_AWS_ACCESS_KEY and TEST_AWS_SECRET_KEY environment');
	console.error('variables - you can find these in the shared Origami LastPass folder.');
	process.exit(1);
}
process.env.TEST_AWS_BUCKET = process.env.TEST_AWS_BUCKET || 'origami-imageset-testing';

// Helper function to clear all objects in a bucket
function clearBucket() {
	const s3 = createS3Instance();
	return s3.listObjects().promise()
		.then(list => {
			if (!list.Contents.length) {
				return;
			}
			return s3.deleteObjects({
				Delete: {
					Objects: list.Contents.map(object => {
						return {
							Key: object.Key
						};
					})
				}
			}).promise();
		});
}

// Helper function to create a configured S3 instance
function createS3Instance() {
	return new AWS.S3({
		accessKeyId: process.env.TEST_AWS_ACCESS_KEY,
		secretAccessKey: process.env.TEST_AWS_SECRET_KEY,
		params: {
			Bucket: process.env.TEST_AWS_BUCKET
		}
	});
}

// The actual tests

describe('oist publish-s3 --aws-access-key XXXXX --aws-secret-key XXXXX --bucket origami-imageset-testing', () => {
	let sourceDirectory;

	before(() => {
		sourceDirectory = path.join(global.testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
		fs.writeFileSync(path.join(sourceDirectory, 'example.jpg'), 'not-really-a-jpg');
		return clearBucket().then(() => {
			return global.cliCall([
				'publish-s3',
				'--aws-access-key', process.env.TEST_AWS_ACCESS_KEY,
				'--aws-secret-key', process.env.TEST_AWS_SECRET_KEY,
				'--bucket', process.env.TEST_AWS_BUCKET
			]);
		});
	});

	after(() => {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.unlinkSync(path.join(sourceDirectory, 'example.jpg'));
		fs.rmdirSync(sourceDirectory);
		return clearBucket();
	});

	it('outputs a success message', () => {
		assert.match(global.cliCall.lastResult.output, /publishing "src\/example.png" to s3/i);
		assert.match(global.cliCall.lastResult.output, /published "src\/example.png" to s3 under "noscheme\/v0\/example.png"/i);
		assert.match(global.cliCall.lastResult.output, /publishing "src\/example.jpg" to s3/i);
		assert.match(global.cliCall.lastResult.output, /published "src\/example.jpg" to s3 under "noscheme\/v0\/example.jpg"/i);
	});

	it('exits with a code of 0', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

	it('publishes the images to S3 under the expected key', () => {
		const s3 = createS3Instance();
		return Promise.all([
			s3.getObject({Key: 'noscheme/v0/example.png'}).promise(),
			s3.getObject({Key: 'noscheme/v0/example.jpg'}).promise()
		]).then(data => {
			assert.strictEqual(data[0].ContentType, 'image/png');
			assert.strictEqual(data[0].Body.toString(), 'not-really-a-png');
			assert.strictEqual(data[1].ContentType, 'image/jpeg');
			assert.strictEqual(data[1].Body.toString(), 'not-really-a-jpg');
		});
	});

});

describe('AWS_ACCESS_KEY=XXXXX AWS_SECRET_KEY=XXXXX AWS_BUCKET=origami-imageset-testing oist publish-s3', () => {
	let sourceDirectory;

	before(() => {
		sourceDirectory = path.join(global.testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
		fs.writeFileSync(path.join(sourceDirectory, 'example.jpg'), 'not-really-a-jpg');
		return clearBucket().then(() => {
			return global.cliCall([
				'publish-s3'
			], {
				'AWS_ACCESS_KEY': process.env.TEST_AWS_ACCESS_KEY,
				'AWS_SECRET_KEY': process.env.TEST_AWS_SECRET_KEY,
				'AWS_BUCKET': process.env.TEST_AWS_BUCKET
			});
		});
	});

	after(() => {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.unlinkSync(path.join(sourceDirectory, 'example.jpg'));
		fs.rmdirSync(sourceDirectory);
		return clearBucket();
	});

	it('outputs a success message', () => {
		assert.match(global.cliCall.lastResult.output, /publishing "src\/example.png" to s3/i);
		assert.match(global.cliCall.lastResult.output, /published "src\/example.png" to s3 under "noscheme\/v0\/example.png"/i);
		assert.match(global.cliCall.lastResult.output, /publishing "src\/example.jpg" to s3/i);
		assert.match(global.cliCall.lastResult.output, /published "src\/example.jpg" to s3 under "noscheme\/v0\/example.jpg"/i);
	});

	it('exits with a code of 0', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

	it('publishes the images to S3 under the expected key', () => {
		const s3 = createS3Instance();
		return Promise.all([
			s3.getObject({Key: 'noscheme/v0/example.png'}).promise(),
			s3.getObject({Key: 'noscheme/v0/example.jpg'}).promise()
		]).then(data => {
			assert.strictEqual(data[0].ContentType, 'image/png');
			assert.strictEqual(data[0].Body.toString(), 'not-really-a-png');
			assert.strictEqual(data[1].ContentType, 'image/jpeg');
			assert.strictEqual(data[1].Body.toString(), 'not-really-a-jpg');
		});
	});

});

describe('oist publish-s3 … --scheme test-scheme --scheme-version v4.5.6', () => {
	let sourceDirectory;

	before(() => {
		sourceDirectory = path.join(global.testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
		fs.writeFileSync(path.join(sourceDirectory, 'example.jpg'), 'not-really-a-jpg');
		return clearBucket().then(() => {
			return global.cliCall([
				'publish-s3',
				'--aws-access-key', process.env.TEST_AWS_ACCESS_KEY,
				'--aws-secret-key', process.env.TEST_AWS_SECRET_KEY,
				'--bucket', process.env.TEST_AWS_BUCKET,
				'--scheme', 'test-scheme',
				'--scheme-version', 'v4.5.6'
			]);
		});
	});

	after(() => {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.unlinkSync(path.join(sourceDirectory, 'example.jpg'));
		fs.rmdirSync(sourceDirectory);
		return clearBucket();
	});

	it('outputs a success message', () => {
		assert.match(global.cliCall.lastResult.output, /publishing "src\/example.png" to s3/i);
		assert.match(global.cliCall.lastResult.output, /published "src\/example.png" to s3 under "test-scheme\/v4\/example.png"/i);
		assert.match(global.cliCall.lastResult.output, /publishing "src\/example.jpg" to s3/i);
		assert.match(global.cliCall.lastResult.output, /published "src\/example.jpg" to s3 under "test-scheme\/v4\/example.jpg"/i);
	});

	it('exits with a code of 0', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

	it('publishes the images to S3 under the expected key', () => {
		const s3 = createS3Instance();
		return Promise.all([
			s3.getObject({Key: 'test-scheme/v4/example.png'}).promise(),
			s3.getObject({Key: 'test-scheme/v4/example.jpg'}).promise()
		]).then(data => {
			assert.strictEqual(data[0].ContentType, 'image/png');
			assert.strictEqual(data[0].Body.toString(), 'not-really-a-png');
			assert.strictEqual(data[1].ContentType, 'image/jpeg');
			assert.strictEqual(data[1].Body.toString(), 'not-really-a-jpg');
		});
	});

});

describe('IMAGESET_SCHEME=test-scheme IMAGESET_VERSION=v4.5.6 … oist publish-s3', () => {
	let sourceDirectory;

	before(() => {
		sourceDirectory = path.join(global.testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
		fs.writeFileSync(path.join(sourceDirectory, 'example.jpg'), 'not-really-a-jpg');
		return clearBucket().then(() => {
			return global.cliCall([
				'publish-s3'
			], {
				'AWS_ACCESS_KEY': process.env.TEST_AWS_ACCESS_KEY,
				'AWS_SECRET_KEY': process.env.TEST_AWS_SECRET_KEY,
				'AWS_BUCKET': process.env.TEST_AWS_BUCKET,
				'IMAGESET_SCHEME': 'test-scheme',
				'IMAGESET_VERSION': 'v4.5.6'
			});
		});
	});

	after(() => {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.unlinkSync(path.join(sourceDirectory, 'example.jpg'));
		fs.rmdirSync(sourceDirectory);
		return clearBucket();
	});

	it('outputs a success message', () => {
		assert.match(global.cliCall.lastResult.output, /publishing "src\/example.png" to s3/i);
		assert.match(global.cliCall.lastResult.output, /published "src\/example.png" to s3 under "test-scheme\/v4\/example.png"/i);
		assert.match(global.cliCall.lastResult.output, /publishing "src\/example.jpg" to s3/i);
		assert.match(global.cliCall.lastResult.output, /published "src\/example.jpg" to s3 under "test-scheme\/v4\/example.jpg"/i);
	});

	it('exits with a code of 0', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

	it('publishes the images to S3 under the expected key', () => {
		const s3 = createS3Instance();
		return Promise.all([
			s3.getObject({Key: 'test-scheme/v4/example.png'}).promise(),
			s3.getObject({Key: 'test-scheme/v4/example.jpg'}).promise()
		]).then(data => {
			assert.strictEqual(data[0].ContentType, 'image/png');
			assert.strictEqual(data[0].Body.toString(), 'not-really-a-png');
			assert.strictEqual(data[1].ContentType, 'image/jpeg');
			assert.strictEqual(data[1].Body.toString(), 'not-really-a-jpg');
		});
	});

});

describe('oist publish-s3 … --source-directory is-a-directory', () => {
	let sourceDirectory;

	before(() => {
		sourceDirectory = path.join(global.testDirectory, 'is-a-directory');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
		fs.writeFileSync(path.join(sourceDirectory, 'example.jpg'), 'not-really-a-jpg');
		return clearBucket().then(() => {
			return global.cliCall([
				'publish-s3',
				'--aws-access-key', process.env.TEST_AWS_ACCESS_KEY,
				'--aws-secret-key', process.env.TEST_AWS_SECRET_KEY,
				'--bucket', process.env.TEST_AWS_BUCKET,
				'--source-directory', 'is-a-directory'
			]);
		});
	});

	after(() => {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.unlinkSync(path.join(sourceDirectory, 'example.jpg'));
		fs.rmdirSync(sourceDirectory);
		return clearBucket();
	});

	it('outputs a success message', () => {
		assert.match(global.cliCall.lastResult.output, /publishing "is-a-directory\/example.png" to s3/i);
		assert.match(global.cliCall.lastResult.output, /published "is-a-directory\/example.png" to s3 under "noscheme\/v0\/example.png"/i);
		assert.match(global.cliCall.lastResult.output, /publishing "is-a-directory\/example.jpg" to s3/i);
		assert.match(global.cliCall.lastResult.output, /published "is-a-directory\/example.jpg" to s3 under "noscheme\/v0\/example.jpg"/i);
	});

	it('exits with a code of 0', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

	it('publishes the images to S3 under the expected key', () => {
		const s3 = createS3Instance();
		return Promise.all([
			s3.getObject({Key: 'noscheme/v0/example.png'}).promise(),
			s3.getObject({Key: 'noscheme/v0/example.jpg'}).promise()
		]).then(data => {
			assert.strictEqual(data[0].ContentType, 'image/png');
			assert.strictEqual(data[0].Body.toString(), 'not-really-a-png');
			assert.strictEqual(data[1].ContentType, 'image/jpeg');
			assert.strictEqual(data[1].Body.toString(), 'not-really-a-jpg');
		});
	});

});

describe('IMAGESET_SOURCE_DIRECTORY=is-a-directory … oist publish-s3', () => {
	let sourceDirectory;

	before(() => {
		sourceDirectory = path.join(global.testDirectory, 'is-a-directory');
		fs.mkdirSync(sourceDirectory);
		fs.writeFileSync(path.join(sourceDirectory, 'example.png'), 'not-really-a-png');
		fs.writeFileSync(path.join(sourceDirectory, 'example.jpg'), 'not-really-a-jpg');
		return clearBucket().then(() => {
			return global.cliCall([
				'publish-s3'
			], {
				'AWS_ACCESS_KEY': process.env.TEST_AWS_ACCESS_KEY,
				'AWS_SECRET_KEY': process.env.TEST_AWS_SECRET_KEY,
				'AWS_BUCKET': process.env.TEST_AWS_BUCKET,
				'IMAGESET_SOURCE_DIRECTORY': 'is-a-directory'
			});
		});
	});

	after(() => {
		fs.unlinkSync(path.join(sourceDirectory, 'example.png'));
		fs.unlinkSync(path.join(sourceDirectory, 'example.jpg'));
		fs.rmdirSync(sourceDirectory);
		return clearBucket();
	});

	it('outputs a success message', () => {
		assert.match(global.cliCall.lastResult.output, /publishing "is-a-directory\/example.png" to s3/i);
		assert.match(global.cliCall.lastResult.output, /published "is-a-directory\/example.png" to s3 under "noscheme\/v0\/example.png"/i);
		assert.match(global.cliCall.lastResult.output, /publishing "is-a-directory\/example.jpg" to s3/i);
		assert.match(global.cliCall.lastResult.output, /published "is-a-directory\/example.jpg" to s3 under "noscheme\/v0\/example.jpg"/i);
	});

	it('exits with a code of 0', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 0);
	});

	it('publishes the images to S3 under the expected key', () => {
		const s3 = createS3Instance();
		return Promise.all([
			s3.getObject({Key: 'noscheme/v0/example.png'}).promise(),
			s3.getObject({Key: 'noscheme/v0/example.jpg'}).promise()
		]).then(data => {
			assert.strictEqual(data[0].ContentType, 'image/png');
			assert.strictEqual(data[0].Body.toString(), 'not-really-a-png');
			assert.strictEqual(data[1].ContentType, 'image/jpeg');
			assert.strictEqual(data[1].Body.toString(), 'not-really-a-jpg');
		});
	});

});

describe('oist publish-s3', () => {
	let sourceDirectory;

	before(() => {
		sourceDirectory = path.join(global.testDirectory, 'src');
		fs.mkdirSync(sourceDirectory);
		return global.cliCall([
			'publish-s3'
		]);
	});

	after(() => {
		fs.rmdirSync(sourceDirectory);
	});

	it('outputs an error', () => {
		assert.match(global.cliCall.lastResult.output, /No AWS credentials are available/i);
	});

	it('exits with a code of 1', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 1);
	});

});

describe('oist publish-s3 … --source-directory not-a-directory', () => {

	before(() => {
		return global.cliCall([
			'publish-s3',
			'--aws-access-key', process.env.TEST_AWS_ACCESS_KEY,
			'--aws-secret-key', process.env.TEST_AWS_SECRET_KEY,
			'--bucket', process.env.TEST_AWS_BUCKET,
			'--source-directory', 'not-a-directory'
		]);
	});

	it('outputs an error', () => {
		assert.match(global.cliCall.lastResult.output, /ENOENT: no such file or directory/i);
	});

	it('exits with a code of 1', () => {
		assert.strictEqual(global.cliCall.lastResult.code, 1);
	});

});
