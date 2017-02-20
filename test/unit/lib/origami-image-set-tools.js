'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const path = require('path');
const sinon = require('sinon');

describe('lib/origami-image-set-tools', () => {
	let AWS;
	let defaults;
	let fs;
	let log;
	let mime;
	let OrigamiImageSetTools;
	let semver;

	beforeEach(() => {
		AWS = require('../mock/aws-sdk.mock');
		mockery.registerMock('aws-sdk', AWS);

		defaults = sinon.spy(require('lodash/defaults'));
		mockery.registerMock('lodash/defaults', defaults);

		fs = require('../mock/fs-promise.mock');
		mockery.registerMock('fs-promise', fs);

		log = require('../mock/log.mock');

		mime = require('../mock/mime-types.mock');
		mockery.registerMock('mime-types', mime);

		semver = require('../mock/semver.mock');
		mockery.registerMock('semver', semver);

		OrigamiImageSetTools = require('../../..');
	});

	it('exports a function', () => {
		assert.isFunction(OrigamiImageSetTools);
	});

	it('has a `defaults` property', () => {
		assert.isObject(OrigamiImageSetTools.defaults);
	});

	describe('.defaults', () => {

		it('has an `awsAccessKey` property', () => {
			assert.isNull(OrigamiImageSetTools.defaults.awsAccessKey);
		});

		it('has an `awsSecretKey` property', () => {
			assert.isNull(OrigamiImageSetTools.defaults.awsSecretKey);
		});

		it('has a `baseDirectory` property', () => {
			assert.strictEqual(OrigamiImageSetTools.defaults.baseDirectory, process.cwd());
		});

		it('has a `log` property', () => {
			assert.strictEqual(OrigamiImageSetTools.defaults.log, console);
		});

		it('has a `scheme` property', () => {
			assert.strictEqual(OrigamiImageSetTools.defaults.scheme, 'noscheme');
		});

		it('has a `sourceDirectory` property', () => {
			assert.strictEqual(OrigamiImageSetTools.defaults.sourceDirectory, 'src');
		});

		it('has a `version` property', () => {
			assert.strictEqual(OrigamiImageSetTools.defaults.version, 'v0.0.0');
		});

	});

	describe('new OrigamiImageSetTools(options)', () => {
		let instance;
		let options;

		beforeEach(() => {
			options = {
				awsAccessKey: 'mock-aws-key',
				awsSecretKey: 'mock-aws-secret',
				baseDirectory: 'mock-base-directory',
				log: log,
				scheme: 'mock-scheme',
				sourceDirectory: 'mock-source-directory',
				version: 'v1.2.3'
			};
			semver.valid.returns(true);
			instance = new OrigamiImageSetTools(options);
		});

		it('defaults the passed in options', () => {
			assert.isObject(defaults.firstCall.args[0]);
			assert.strictEqual(defaults.firstCall.args[1], options);
			assert.strictEqual(defaults.firstCall.args[2], OrigamiImageSetTools.defaults);
		});

		describe('instance', () => {

			it('has an `options` property set to the defaulted `options`', () => {
				assert.strictEqual(instance.options, defaults.firstCall.returnValue);
			});

			it('has a `log` property set to `options.log`', () => {
				assert.strictEqual(instance.log, instance.options.log);
			});

			it('has a `scheme` property set to `options.scheme`', () => {
				assert.strictEqual(instance.scheme, instance.options.scheme);
			});

			it('has a `version` property set to `options.version`', () => {
				assert.strictEqual(instance.version, instance.options.version);
			});

			it('has a `buildImageSetManifest` method', () => {
				assert.isFunction(instance.buildImageSetManifest);
			});

			describe('.buildImageSetManifest()', () => {
				let resolvedValue;
				let returnedPromise;

				beforeEach(() => {

					fs.readdir.resolves([
						'.hidden-1',
						'image-1.jpg',
						'image-2.png',
						'text-1.txt',
						'image-3.svg',
						'image-4.gif',
						'directory-1'
					]);

					return returnedPromise = instance.buildImageSetManifest().then(value => {
						resolvedValue = value;
					});
				});

				it('returns a promise', () => {
					assert.instanceOf(returnedPromise, Promise);
				});

				it('reads the configured source directory', () => {
					assert.calledOnce(fs.readdir);
					assert.calledWithExactly(fs.readdir, `${options.baseDirectory}/${options.sourceDirectory}`);
				});

				it('resolves with an object that contains the image names', () => {
					assert.deepEqual(resolvedValue, {
						sourceDirectory: options.sourceDirectory,
						images: [
							{
								name: 'image-1',
								extension: 'jpg',
								path: `${options.sourceDirectory}/image-1.jpg`
							},
							{
								name: 'image-2',
								extension: 'png',
								path: `${options.sourceDirectory}/image-2.png`
							},
							{
								name: 'image-3',
								extension: 'svg',
								path: `${options.sourceDirectory}/image-3.svg`
							},
							{
								name: 'image-4',
								extension: 'gif',
								path: `${options.sourceDirectory}/image-4.gif`
							}
						]
					});
				});

			});

			it('has a `buildImageSetManifestFile` method', () => {
				assert.isFunction(instance.buildImageSetManifestFile);
			});

			describe('.buildImageSetManifestFile()', () => {
				let imageSetManifest;
				let resolvedValue;
				let returnedPromise;

				beforeEach(() => {
					imageSetManifest = {
						isMockInfo: true
					};
					instance.buildImageSetManifest = sinon.stub().resolves(imageSetManifest);

					return returnedPromise = instance.buildImageSetManifestFile().then(value => {
						resolvedValue = value;
					});
				});

				it('logs that the manifest file is being built', () => {
					assert.calledWithExactly(log.info, 'Building manifest file…');
				});

				it('returns a promise', () => {
					assert.instanceOf(returnedPromise, Promise);
				});

				it('builds an image set manifest', () => {
					assert.calledOnce(instance.buildImageSetManifest);
				});

				it('saves the image set manifest to a file as JSON', () => {
					assert.calledOnce(fs.writeFile);
					assert.calledWithExactly(fs.writeFile, `${options.baseDirectory}/imageset.json`, JSON.stringify(imageSetManifest, null, '\t'));
				});

				it('logs that the manifest file has been saved', () => {
					assert.calledWithExactly(log.info, '✔︎ Manifest file saved');
				});

				it('resolves with `undefined`', () => {
					assert.isUndefined(resolvedValue);
				});

				describe('when an error occurs', () => {
					let buildError;
					let rejectedError;

					beforeEach(() => {
						log.info.reset();
						buildError = new Error('rejected');
						instance.buildImageSetManifest = sinon.stub().rejects(buildError);
						return returnedPromise = instance.buildImageSetManifestFile().catch(error => {
							rejectedError = error;
						});
					});

					it('does not log that the manifest file has been saved', () => {
						assert.neverCalledWith(log.info, '✔︎ Manifest file saved');
					});

					it('logs that the manifest file could not be saved', () => {
						assert.calledWithExactly(log.error, '✘ Manifest file could not be saved');
					});

					it('rejects with the error', () => {
						assert.strictEqual(rejectedError, buildError);
					});

				});

			});

			it('has a `publishToS3` method', () => {
				assert.isFunction(instance.publishToS3);
			});

			describe('.publishToS3(bucket)', () => {
				let fileStream;
				let imageSetManifest;
				let resolvedValue;
				let returnedPromise;

				beforeEach(() => {
					imageSetManifest = {
						images: [
							{
								name: 'foo-image',
								extension: 'png',
								path: 'src/foo-image.png'
							},
							{
								name: 'bar-image',
								extension: 'jpg',
								path: 'src/bar-image.jpg'
							},
							{
								name: 'baz-image',
								extension: 'svg',
								path: 'src/baz-image.svg'
							}
						]
					};
					instance.buildImageSetManifest = sinon.stub().resolves(imageSetManifest);

					mime.lookup.returns('mock-mimetype');

					fileStream = {
						isFileStream: true
					};
					fs.createReadStream.returns(fileStream);

					semver.major.returns('9');

					return returnedPromise = instance.publishToS3('mock-bucket').then(value => {
						resolvedValue = value;
					});
				});

				it('returns a promise', () => {
					assert.instanceOf(returnedPromise, Promise);
				});

				it('creates an S3 client', () => {
					assert.calledOnce(AWS.S3);
					assert.calledWithNew(AWS.S3);
					assert.calledWithExactly(AWS.S3, {
						accessKeyId: options.awsAccessKey,
						secretAccessKey: options.awsSecretKey,
						params: {
							Bucket: 'mock-bucket'
						}
					});
				});

				it('builds an image set manifest', () => {
					assert.calledOnce(instance.buildImageSetManifest);
				});

				it('logs that each image is being published', () => {
					assert.calledWithExactly(log.info, 'Publishing "src/foo-image.png" to S3…');
					assert.calledWithExactly(log.info, 'Publishing "src/bar-image.jpg" to S3…');
					assert.calledWithExactly(log.info, 'Publishing "src/baz-image.svg" to S3…');
				});

				it('creates a read stream for each image', () => {
					assert.calledThrice(fs.createReadStream);
					assert.calledWithExactly(fs.createReadStream, path.resolve(options.baseDirectory, 'src/foo-image.png'));
					assert.calledWithExactly(fs.createReadStream, path.resolve(options.baseDirectory, 'src/bar-image.jpg'));
					assert.calledWithExactly(fs.createReadStream, path.resolve(options.baseDirectory, 'src/baz-image.svg'));
				});

				it('looks up the mime type for each image', () => {
					assert.calledThrice(mime.lookup);
					assert.calledWithExactly(mime.lookup, path.resolve(options.baseDirectory, 'src/foo-image.png'));
					assert.calledWithExactly(mime.lookup, path.resolve(options.baseDirectory, 'src/bar-image.jpg'));
					assert.calledWithExactly(mime.lookup, path.resolve(options.baseDirectory, 'src/baz-image.svg'));
				});

				it('creates an S3 upload for each image', () => {
					assert.calledThrice(AWS.S3.mockInstance.upload);
					assert.calledThrice(AWS.S3.mockUpload.promise);
					assert.calledWith(AWS.S3.mockInstance.upload, {
						ACL: 'public-read',
						Body: fileStream,
						ContentType: 'mock-mimetype',
						Key: 'mock-scheme/v9/foo-image.png'
					});
					assert.calledWith(AWS.S3.mockInstance.upload, {
						ACL: 'public-read',
						Body: fileStream,
						ContentType: 'mock-mimetype',
						Key: 'mock-scheme/v9/bar-image.jpg'
					});
					assert.calledWith(AWS.S3.mockInstance.upload, {
						ACL: 'public-read',
						Body: fileStream,
						ContentType: 'mock-mimetype',
						Key: 'mock-scheme/v9/baz-image.svg'
					});
				});

				it('logs that each image has been published', () => {
					assert.calledWithExactly(log.info, '✔︎ Published "src/foo-image.png" to S3 under "mock-scheme/v9/foo-image.png"');
					assert.calledWithExactly(log.info, '✔︎ Published "src/bar-image.jpg" to S3 under "mock-scheme/v9/bar-image.jpg"');
					assert.calledWithExactly(log.info, '✔︎ Published "src/baz-image.svg" to S3 under "mock-scheme/v9/baz-image.svg"');
				});

				it('resolves with `undefined`', () => {
					assert.isUndefined(resolvedValue);
				});

				describe('when an AWS access key is not provided in instantiation', () => {
					let rejectedError;

					beforeEach(() => {
						log.info.reset();
						delete options.awsAccessKey;
						instance = new OrigamiImageSetTools(options);
						return returnedPromise = instance.publishToS3('mock-bucket').catch(error => {
							rejectedError = error;
						});
					});

					it('rejects with an error', () => {
						assert.instanceOf(rejectedError, Error);
						assert.strictEqual(rejectedError.message, 'No AWS credentials are available');
					});

				});

				describe('when an error occurs', () => {
					let publishError;
					let rejectedError;

					beforeEach(() => {
						log.info.reset();
						imageSetManifest.images = [imageSetManifest.images[0]];
						publishError = new Error('rejected');
						AWS.S3.mockUpload.promise = sinon.stub().rejects(publishError);
						return returnedPromise = instance.publishToS3('mock-bucket').catch(error => {
							rejectedError = error;
						});
					});

					it('does not log that image file has been published', () => {
						assert.neverCalledWith(log.info, '✔︎ Published "src/foo-image.png" to S3 under "mock-scheme/v9/foo-image.png"');
					});

					it('logs that the image file could not be published', () => {
						assert.calledWithExactly(log.error, '✘ File "src/foo-image.png" could not be published');
					});

					it('rejects with the error', () => {
						assert.strictEqual(rejectedError, publishError);
					});

				});

			});

		});

		describe('when `options.version` is invalid', () => {

			beforeEach(() => {
				semver.valid.returns(false);
				instance = new OrigamiImageSetTools(options);
			});

			describe('instance', () => {

				it('has a `version` property set to "v0.0.0"', () => {
					assert.strictEqual(instance.version, 'v0.0.0');
				});

			});

		});

	});

});
