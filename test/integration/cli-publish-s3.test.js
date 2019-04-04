/* eslint-disable no-console */
'use strict';

const assert = require('proclaim');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const nixt = require('nixt');

const oist = path.join(__dirname, '../../', require('../../package.json').bin.oist);
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

describe('oist publish-s3', function() {
	this.timeout(30000);

	describe('oist publish-s3 --aws-access-key XXXXX --aws-secret-key XXXXX --bucket origami-imageset-testing', function() {
		let sourceDirectory;

		before(function() {
			sourceDirectory = path.join(global.testDirectory, 'src');
			fs.mkdirSync(sourceDirectory);
			fs.writeFileSync(path.join(sourceDirectory, 'example1.png'), 'not-really-a-png');
			fs.writeFileSync(path.join(sourceDirectory, 'example2.jpg'), 'not-really-a-jpg');
			return clearBucket();
		});

		after(function() {
			fs.unlinkSync(path.join(sourceDirectory, 'example1.png'));
			fs.unlinkSync(path.join(sourceDirectory, 'example2.jpg'));
			fs.rmdirSync(sourceDirectory);
			return clearBucket();
		});

		it('outputs a success message', function(done) {
			nixt()
				.run(`${oist} publish-s3
				--aws-access-key ${process.env.TEST_AWS_ACCESS_KEY}
				--aws-secret-key ${process.env.TEST_AWS_SECRET_KEY}
				--bucket ${process.env.TEST_AWS_BUCKET}`)
				.stdout(/publishing "src\/example1.png" to s3/i)
				.stdout(/published "src\/example1.png" to s3 under "noscheme\/v0\/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda"/i)
				.stdout(/published "src\/example1.png" to s3 under "noscheme\/v0\/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda.png"/i)
				.stdout(/publishing "src\/example2.jpg" to s3/i)
				.stdout(/published "src\/example2.jpg" to s3 under "noscheme\/v0\/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5"/i)
				.stdout(/published "src\/example2.jpg" to s3 under "noscheme\/v0\/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5.jpg"/i)
				.end(done);
		});

		it('exits with a code of 0', function(done) {
			nixt()
				.run(`${oist} publish-s3
				--aws-access-key ${process.env.TEST_AWS_ACCESS_KEY}
				--aws-secret-key ${process.env.TEST_AWS_SECRET_KEY}
				--bucket ${process.env.TEST_AWS_BUCKET}`).code(0).end(done);
		});

		it('publishes the images to S3 under the expected keys', function() {
			const s3 = createS3Instance();
			return Promise.all([
				s3.getObject({Key: 'noscheme/v0/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda'}).promise(),
				s3.getObject({Key: 'noscheme/v0/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda.png'}).promise(),
				s3.getObject({Key: 'noscheme/v0/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5'}).promise(),
				s3.getObject({Key: 'noscheme/v0/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5.jpg'}).promise()
			]).then(data => {
				assert.strictEqual(data[0].ContentType, 'image/png');
				assert.strictEqual(data[0].Body.toString(), 'not-really-a-png');
				assert.strictEqual(data[1].ContentType, 'image/png');
				assert.strictEqual(data[1].Body.toString(), 'not-really-a-png');
				assert.strictEqual(data[2].ContentType, 'image/jpeg');
				assert.strictEqual(data[2].Body.toString(), 'not-really-a-jpg');
				assert.strictEqual(data[3].ContentType, 'image/jpeg');
				assert.strictEqual(data[3].Body.toString(), 'not-really-a-jpg');
			});
		});

	});

	describe('AWS_ACCESS_KEY=XXXXX AWS_SECRET_KEY=XXXXX AWS_BUCKET=origami-imageset-testing oist publish-s3', function() {
		let sourceDirectory;

		before(function() {
			sourceDirectory = path.join(global.testDirectory, 'src');
			fs.mkdirSync(sourceDirectory);
			fs.writeFileSync(path.join(sourceDirectory, 'example1.png'), 'not-really-a-png');
			fs.writeFileSync(path.join(sourceDirectory, 'example2.jpg'), 'not-really-a-jpg');
			return clearBucket();
		});

		after(function() {
			fs.unlinkSync(path.join(sourceDirectory, 'example1.png'));
			fs.unlinkSync(path.join(sourceDirectory, 'example2.jpg'));
			fs.rmdirSync(sourceDirectory);
			return clearBucket();
		});

		it('outputs a success message', function(done) {
			nixt()
				.run(`${oist} publish-s3
				--aws-access-key ${process.env.TEST_AWS_ACCESS_KEY}
				--aws-secret-key ${process.env.TEST_AWS_SECRET_KEY}
				--bucket ${process.env.TEST_AWS_BUCKET}`)
				.stdout(/publishing "src\/example1.png" to s3/i)
				.stdout(/published "src\/example1.png" to s3 under "noscheme\/v0\/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda"/i)
				.stdout(/published "src\/example1.png" to s3 under "noscheme\/v0\/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda.png"/i)
				.stdout(/publishing "src\/example2.jpg" to s3/i)
				.stdout(/published "src\/example2.jpg" to s3 under "noscheme\/v0\/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5"/i)
				.stdout(/published "src\/example2.jpg" to s3 under "noscheme\/v0\/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5.jpg"/i)
				.end(done);
		});

		it('exits with a code of 0', function(done) {
			nixt()
				.run(`${oist} publish-s3
				--aws-access-key ${process.env.TEST_AWS_ACCESS_KEY}
				--aws-secret-key ${process.env.TEST_AWS_SECRET_KEY}
				--bucket ${process.env.TEST_AWS_BUCKET}`).code(0).end(done);
		});

		it('publishes the images to S3 under the expected keys', function() {
			const s3 = createS3Instance();
			return Promise.all([
				s3.getObject({Key: 'noscheme/v0/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda'}).promise(),
				s3.getObject({Key: 'noscheme/v0/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda.png'}).promise(),
				s3.getObject({Key: 'noscheme/v0/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5'}).promise(),
				s3.getObject({Key: 'noscheme/v0/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5.jpg'}).promise()
			]).then(data => {
				assert.strictEqual(data[0].ContentType, 'image/png');
				assert.strictEqual(data[0].Body.toString(), 'not-really-a-png');
				assert.strictEqual(data[1].ContentType, 'image/png');
				assert.strictEqual(data[1].Body.toString(), 'not-really-a-png');
				assert.strictEqual(data[2].ContentType, 'image/jpeg');
				assert.strictEqual(data[2].Body.toString(), 'not-really-a-jpg');
				assert.strictEqual(data[3].ContentType, 'image/jpeg');
				assert.strictEqual(data[3].Body.toString(), 'not-really-a-jpg');
			});
		});

	});

	describe('oist publish-s3 … --scheme test-scheme --scheme-version v4.5.6', function() {
		let sourceDirectory;

		before(function() {
			sourceDirectory = path.join(global.testDirectory, 'src');
			fs.mkdirSync(sourceDirectory);
			fs.writeFileSync(path.join(sourceDirectory, 'example1.png'), 'not-really-a-png');
			fs.writeFileSync(path.join(sourceDirectory, 'example2.jpg'), 'not-really-a-jpg');
			return clearBucket().then(function() {
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

		after(function() {
			fs.unlinkSync(path.join(sourceDirectory, 'example1.png'));
			fs.unlinkSync(path.join(sourceDirectory, 'example2.jpg'));
			fs.rmdirSync(sourceDirectory);
			return clearBucket();
		});

		it('outputs a success message', function(done) {
			nixt()
				.run(`${oist} publish-s3
				--aws-access-key ${process.env.TEST_AWS_ACCESS_KEY}
				--aws-secret-key ${process.env.TEST_AWS_SECRET_KEY}
				--bucket ${process.env.TEST_AWS_BUCKET}
				--source-directory ${sourceDirectory}
				--scheme test-scheme
				--scheme-version v4.5.6`)
				.stdout(/publishing "src\/example1.png" to s3/i)
				.stdout(/published "src\/example1.png" to s3 under "test-scheme\/v4\/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda"/i)
				.stdout(/published "src\/example1.png" to s3 under "test-scheme\/v4\/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda.png"/i)
				.stdout(/publishing "src\/example2.jpg" to s3/i)
				.stdout(/published "src\/example2.jpg" to s3 under "test-scheme\/v4\/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5"/i)
				.stdout(/published "src\/example2.jpg" to s3 under "test-scheme\/v4\/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5.jpg"/i)
				.end(done);
		});

		it('exits with a code of 0', function(done) {
			nixt()
				.run(`${oist} publish-s3
				--aws-access-key ${process.env.TEST_AWS_ACCESS_KEY}
				--aws-secret-key ${process.env.TEST_AWS_SECRET_KEY}
				--bucket ${process.env.TEST_AWS_BUCKET}
				--source-directory ${sourceDirectory}
				--scheme test-scheme
				--scheme-version v4.5.6`)
				.code(0).end(done);
		});

		it('publishes the images to S3 under the expected keys', function() {
			const s3 = createS3Instance();
			return Promise.all([
				s3.getObject({Key: 'test-scheme/v4/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda'}).promise(),
				s3.getObject({Key: 'test-scheme/v4/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda.png'}).promise(),
				s3.getObject({Key: 'test-scheme/v4/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5'}).promise(),
				s3.getObject({Key: 'test-scheme/v4/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5.jpg'}).promise()
			]).then(data => {
				assert.strictEqual(data[0].ContentType, 'image/png');
				assert.strictEqual(data[0].Body.toString(), 'not-really-a-png');
				assert.strictEqual(data[1].ContentType, 'image/png');
				assert.strictEqual(data[1].Body.toString(), 'not-really-a-png');
				assert.strictEqual(data[2].ContentType, 'image/jpeg');
				assert.strictEqual(data[2].Body.toString(), 'not-really-a-jpg');
				assert.strictEqual(data[3].ContentType, 'image/jpeg');
				assert.strictEqual(data[3].Body.toString(), 'not-really-a-jpg');
			});
		});

	});

	describe('IMAGESET_SCHEME=test-scheme IMAGESET_VERSION=v4.5.6 … oist publish-s3', function() {
		let sourceDirectory;

		before(function() {
			sourceDirectory = path.join(global.testDirectory, 'src');
			fs.mkdirSync(sourceDirectory);
			fs.writeFileSync(path.join(sourceDirectory, 'example1.png'), 'not-really-a-png');
			fs.writeFileSync(path.join(sourceDirectory, 'example2.jpg'), 'not-really-a-jpg');
			return clearBucket();
		});

		after(function() {
			fs.unlinkSync(path.join(sourceDirectory, 'example1.png'));
			fs.unlinkSync(path.join(sourceDirectory, 'example2.jpg'));
			fs.rmdirSync(sourceDirectory);
			return clearBucket();
		});

		it('outputs a success message', function(done) {
			nixt()
				.run(`${oist} publish-s3
				--aws-access-key ${process.env.TEST_AWS_ACCESS_KEY}
				--aws-secret-key ${process.env.TEST_AWS_SECRET_KEY}
				--bucket ${process.env.TEST_AWS_BUCKET}
				--source-directory ${sourceDirectory}
				--scheme test-scheme
				--scheme-version v4.5.6`)
				.stdout(/publishing "src\/example1.png" to s3/i)
				.stdout(/published "src\/example1.png" to s3 under "test-scheme\/v4\/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda"/i)
				.stdout(/published "src\/example1.png" to s3 under "test-scheme\/v4\/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda.png"/i)
				.stdout(/publishing "src\/example2.jpg" to s3/i)
				.stdout(/published "src\/example2.jpg" to s3 under "test-scheme\/v4\/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5"/i)
				.stdout(/published "src\/example2.jpg" to s3 under "test-scheme\/v4\/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5.jpg"/i)
				.end(done);
		});

		it('exits with a code of 0', function(done) {
			nixt()
				.run(`${oist} publish-s3
				--aws-access-key ${process.env.TEST_AWS_ACCESS_KEY}
				--aws-secret-key ${process.env.TEST_AWS_SECRET_KEY}
				--bucket ${process.env.TEST_AWS_BUCKET}
				--source-directory ${sourceDirectory}
				--scheme test-scheme
				--scheme-version v4.5.6`).code(0).end(done);
		});

		it('publishes the images to S3 under the expected keys', function() {
			const s3 = createS3Instance();
			return Promise.all([
				s3.getObject({Key: 'test-scheme/v4/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda'}).promise(),
				s3.getObject({Key: 'test-scheme/v4/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda.png'}).promise(),
				s3.getObject({Key: 'test-scheme/v4/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5'}).promise(),
				s3.getObject({Key: 'test-scheme/v4/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5.jpg'}).promise()
			]).then(data => {
				assert.strictEqual(data[0].ContentType, 'image/png');
				assert.strictEqual(data[0].Body.toString(), 'not-really-a-png');
				assert.strictEqual(data[1].ContentType, 'image/png');
				assert.strictEqual(data[1].Body.toString(), 'not-really-a-png');
				assert.strictEqual(data[2].ContentType, 'image/jpeg');
				assert.strictEqual(data[2].Body.toString(), 'not-really-a-jpg');
				assert.strictEqual(data[3].ContentType, 'image/jpeg');
				assert.strictEqual(data[3].Body.toString(), 'not-really-a-jpg');
			});
		});

	});

	describe('oist publish-s3 … --source-directory is-a-directory', function() {
		let sourceDirectory;

		before(function() {
			sourceDirectory = path.join(global.testDirectory, 'is-a-directory');
			fs.mkdirSync(sourceDirectory);
			fs.writeFileSync(path.join(sourceDirectory, 'example1.png'), 'not-really-a-png');
			fs.writeFileSync(path.join(sourceDirectory, 'example2.jpg'), 'not-really-a-jpg');
			return clearBucket();
		});

		after(function() {
			fs.unlinkSync(path.join(sourceDirectory, 'example1.png'));
			fs.unlinkSync(path.join(sourceDirectory, 'example2.jpg'));
			fs.rmdirSync(sourceDirectory);
			return clearBucket();
		});

		it('outputs a success message', function(done) {
			nixt()
				.run(`${oist} publish-s3
				--aws-access-key ${process.env.TEST_AWS_ACCESS_KEY}
				--aws-secret-key ${process.env.TEST_AWS_SECRET_KEY}
				--bucket ${process.env.TEST_AWS_BUCKET}
				--source-directory ${sourceDirectory}`)
				.stdout(/publishing "is-a-directory\/example1.png" to s3/i)
				.stdout(/published "is-a-directory\/example1.png" to s3 under "noscheme\/v0\/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda"/i)
				.stdout(/publishing "is-a-directory\/example2.jpg" to s3/i)
				.stdout(/published "is-a-directory\/example2.jpg" to s3 under "noscheme\/v0\/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5"/i)
				.end(done);
		});

		it('exits with a code of 0', function(done) {
			nixt()
				.run(`${oist} publish-s3
				--aws-access-key ${process.env.TEST_AWS_ACCESS_KEY}
				--aws-secret-key ${process.env.TEST_AWS_SECRET_KEY}
				--bucket ${process.env.TEST_AWS_BUCKET}
				--source-directory ${sourceDirectory}`)
				.code(0).end(done);
		});

		it('publishes the images to S3 under the expected keys', function() {
			const s3 = createS3Instance();
			return Promise.all([
				s3.getObject({Key: 'noscheme/v0/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda'}).promise(),
				s3.getObject({Key: 'noscheme/v0/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda.png'}).promise(),
				s3.getObject({Key: 'noscheme/v0/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5'}).promise(),
				s3.getObject({Key: 'noscheme/v0/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5.jpg'}).promise()
			]).then(data => {
				assert.strictEqual(data[0].ContentType, 'image/png');
				assert.strictEqual(data[0].Body.toString(), 'not-really-a-png');
				assert.strictEqual(data[1].ContentType, 'image/png');
				assert.strictEqual(data[1].Body.toString(), 'not-really-a-png');
				assert.strictEqual(data[2].ContentType, 'image/jpeg');
				assert.strictEqual(data[2].Body.toString(), 'not-really-a-jpg');
				assert.strictEqual(data[3].ContentType, 'image/jpeg');
				assert.strictEqual(data[3].Body.toString(), 'not-really-a-jpg');
			});
		});

	});

	describe('IMAGESET_SOURCE_DIRECTORY=is-a-directory … oist publish-s3', function() {
		let sourceDirectory;

		beforeEach(function() {
			sourceDirectory = path.join(global.testDirectory, 'is-a-directory');
			fs.mkdirSync(sourceDirectory);
			fs.writeFileSync(path.join(sourceDirectory, 'example1.png'), 'not-really-a-png');
			fs.writeFileSync(path.join(sourceDirectory, 'example2.jpg'), 'not-really-a-jpg');
			return clearBucket();
		});

		afterEach(function() {
			fs.unlinkSync(path.join(sourceDirectory, 'example1.png'));
			fs.unlinkSync(path.join(sourceDirectory, 'example2.jpg'));
			fs.rmdirSync(sourceDirectory);
			return clearBucket();
		});

		it('outputs a success message', function(done) {
			nixt()
				.run(`${oist} publish-s3
				--aws-access-key ${process.env.TEST_AWS_ACCESS_KEY}
				--aws-secret-key ${process.env.TEST_AWS_SECRET_KEY}
				--bucket ${process.env.TEST_AWS_BUCKET}
				--source-directory ${sourceDirectory}`)
				.stdout(/publishing "is-a-directory\/example1.png" to s3/i)
				.stdout(/published "is-a-directory\/example1.png" to s3 under "noscheme\/v0\/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda"/i)
				.stdout(/publishing "is-a-directory\/example2.jpg" to s3/i)
				.stdout(/published "is-a-directory\/example2.jpg" to s3 under "noscheme\/v0\/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5"/i)
				.end(done);
		});

		it('exits with a code of 0', function(done) {
			nixt()
				.run(`${oist} publish-s3
				--aws-access-key ${process.env.TEST_AWS_ACCESS_KEY}
				--aws-secret-key ${process.env.TEST_AWS_SECRET_KEY}
				--bucket ${process.env.TEST_AWS_BUCKET}
				--source-directory ${sourceDirectory}`)
				.code(0)
				.end(done);
		});

		it('publishes the images to S3 under the expected keys', function() {
			const s3 = createS3Instance();
			return Promise.all([
				s3.getObject({Key: 'noscheme/v0/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda'}).promise(),
				s3.getObject({Key: 'noscheme/v0/example1-923d4b188453ddd83f5cc175a445805db10f129ba5fcb509a67369a3165c538604a00a0fc1b8cc4afc929c71a6be204128d398eeac24fdb395769db92a43adda.png'}).promise(),
				s3.getObject({Key: 'noscheme/v0/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5'}).promise(),
				s3.getObject({Key: 'noscheme/v0/example2-50e86c00c0815c1bd1c92e157ab234eb9b4f1f816b63f48ef9f9633e3ab9749d73086516db5f29e43b15fb2d3dd4ce96f7949cd8906198c78f039f86f8f671a5.jpg'}).promise()
			]).then(data => {
				assert.strictEqual(data[0].ContentType, 'image/png');
				assert.strictEqual(data[0].Body.toString(), 'not-really-a-png');
				assert.strictEqual(data[1].ContentType, 'image/png');
				assert.strictEqual(data[1].Body.toString(), 'not-really-a-png');
				assert.strictEqual(data[2].ContentType, 'image/jpeg');
				assert.strictEqual(data[2].Body.toString(), 'not-really-a-jpg');
				assert.strictEqual(data[3].ContentType, 'image/jpeg');
				assert.strictEqual(data[3].Body.toString(), 'not-really-a-jpg');
			});
		});

	});

	describe('oist publish-s3', function() {
		it('outputs an error', function(done) {
			nixt()
				.run(`${oist} publish-s3`)
				.stderr(/No AWS credentials are available/i)
				.end(done);
		});

		it('exits with a code of 1', function(done) {
			nixt()
				.run(`${oist} publish-s3`)
				.code(1)
				.end(done);
		});

	});

	describe('oist publish-s3 … --source-directory not-a-directory', function() {

		it('outputs an error', function(done) {
			nixt()
				.run(`${oist} publish-s3
				--aws-access-key ${process.env.TEST_AWS_ACCESS_KEY}
				--aws-secret-key ${process.env.TEST_AWS_SECRET_KEY}
				--bucket ${process.env.TEST_AWS_BUCKET}
				--source-directory not-a-directory`)
				.stderr(/ENOENT: no such file or directory/i)
				// .stderr(/Can not publish because there is no imageset manifest. Run `oist build-manifest` to create one./i)
				.end(done);
		});

		it('exits with a code of 1', function(done) {
			nixt()
				.run(`${oist} publish-s3
				--aws-access-key ${process.env.TEST_AWS_ACCESS_KEY}
				--aws-secret-key ${process.env.TEST_AWS_SECRET_KEY}
				--bucket ${process.env.TEST_AWS_BUCKET}
				--source-directory not-a-directory`)
				.code(1)
				.end(done);
		});

	});
});