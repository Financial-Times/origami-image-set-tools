'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');
const path = require('path');
sinon.assert.expose(assert, {
	includeFail: false,
	prefix: ''
});

describe('lib/origami-image-set-tools', function () {
	let AWS;
	let defaults;
	let fs;
	let fileExists;
	let hasha;
	let log;
	let mime;
	let request;
	let OrigamiImageSetTools;
	let semver;
	let semvish;
	let xml;

	beforeEach(function () {
		mockery.enable({
			useCleanCache: true,
			warnOnUnregistered: false,
			warnOnReplace: false
		});

		AWS = require('../mock/aws-sdk.mock');
		mockery.registerMock('aws-sdk', AWS);

		defaults = sinon.spy(require('lodash/defaults'));
		mockery.registerMock('lodash/defaults', defaults);

		fs = require('../mock/fs-promise.mock');
		mockery.registerMock('fs-promise', fs);

		fileExists = require('../mock/file-exists.mock');
		mockery.registerMock('file-exists', fileExists);

		hasha = require('../mock/hasha.mock');
		mockery.registerMock('hasha', hasha);

		log = require('../mock/log.mock');

		mime = require('../mock/mime-types.mock');
		mockery.registerMock('mime-types', mime);

		request = require('../mock/request-promise-native.mock');
		mockery.registerMock('request-promise-native', request);

		semver = require('../mock/semver.mock');
		mockery.registerMock('semver', semver);

		semvish = require('../mock/semvish.mock');
		mockery.registerMock('semvish', semvish);

		xml = require('../mock/libxmljs.mock');
		mockery.registerMock('libxmljs', xml);

		OrigamiImageSetTools = require('../../..');
	});

	afterEach(function () {
		mockery.deregisterAll();
		mockery.disable();
	});

	it('exports a function', function () {
		assert.isFunction(OrigamiImageSetTools);
	});

	it('has a `defaults` property', function () {
		assert.isObject(OrigamiImageSetTools.defaults);
	});

	describe('.defaults', function () {

		it('has an `awsAccessKey` property', function () {
			assert.isNull(OrigamiImageSetTools.defaults.awsAccessKey);
		});

		it('has an `awsSecretKey` property', function () {
			assert.isNull(OrigamiImageSetTools.defaults.awsSecretKey);
		});

		it('has a `baseDirectory` property', function () {
			assert.strictEqual(OrigamiImageSetTools.defaults.baseDirectory, process.cwd());
		});

		it('has a `log` property', function () {
			assert.isObject(OrigamiImageSetTools.defaults.log);
		});

		it('has a `scheme` property', function () {
			assert.strictEqual(OrigamiImageSetTools.defaults.scheme, 'noscheme');
		});

		it('has a `sourceDirectory` property', function () {
			assert.strictEqual(OrigamiImageSetTools.defaults.sourceDirectory, 'src');
		});

		it('has a `version` property', function () {
			assert.strictEqual(OrigamiImageSetTools.defaults.version, 'v0.0.0');
		});

		it('has a `imageServiceApiKey` property', function () {
			assert.strictEqual(OrigamiImageSetTools.defaults.imageServiceApiKey, null);
		});

		it('has a `imageServiceUrl` property', function () {
			assert.strictEqual(OrigamiImageSetTools.defaults.imageServiceUrl, 'https://www.ft.com/__origami/service/image');
		});

	});

	describe('new OrigamiImageSetTools(options)', function () {
		let instance;
		let options;

		beforeEach(function () {
			options = {
				awsAccessKey: 'mock-aws-key',
				awsSecretKey: 'mock-aws-secret',
				baseDirectory: 'mock-base-directory',
				host: 'https://origami.ft.com',
				imageServiceApiKey: 'mock-image-service-api-key',
				imageServiceUrl: 'mock-image-service-url',
				log: log,
				scheme: 'mock-scheme',
				sourceDirectory: 'mock-source-directory',
				version: 'v1.2.3'
			};
			semver.valid.returns(true);
			semvish.clean.returnsArg(0);
			instance = new OrigamiImageSetTools(options);
		});

		it('defaults the passed in options', function () {
			assert.isObject(defaults.firstCall.args[0]);
			assert.strictEqual(defaults.firstCall.args[1], options);
			assert.strictEqual(defaults.firstCall.args[2], OrigamiImageSetTools.defaults);
		});

		it('cleans the passed in version', function () {
			assert.isTrue(semvish.clean.called);
			assert.strictEqual(semvish.clean.firstCall.args[0], options.version);
		});

		describe('instance', function () {

			it('has an `options` property set to the defaulted `options`', function () {
				assert.strictEqual(instance.options, defaults.firstCall.returnValue);
			});

			it('has a `log` property set to `options.log`', function () {
				assert.strictEqual(instance.log, instance.options.log);
			});

			it('has a `scheme` property set to `options.scheme`', function () {
				assert.strictEqual(instance.scheme, instance.options.scheme);
			});

			it('has a `version` property set to `options.version`', function () {
				assert.strictEqual(instance.version, instance.options.version);
			});

			it('has a `buildImageSetManifest` method', function () {
				assert.isFunction(instance.buildImageSetManifest);
			});

			describe('.buildImageSetManifest()', function () {
				let resolvedValue;
				let returnedPromise;

				beforeEach(function () {
					hasha.fromFileSync.returns('a');

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

				it('returns a promise', function () {
					assert.instanceOf(returnedPromise, Promise);
				});

				it('reads the configured source directory', function () {
					assert.calledOnce(fs.readdir);
					assert.calledWithExactly(fs.readdir, `${options.baseDirectory}/${options.sourceDirectory}`);
				});

				it('resolves with an object that contains the image names', function () {
					assert.deepEqual(resolvedValue, {
						version: options.version,
						host: options.host,
						sourceDirectory: options.sourceDirectory,
						scheme: options.scheme,
						images: [{
							name: 'image-1',
							extension: 'jpg',
							path: `${options.sourceDirectory}/image-1.jpg`,
							hash: 'a',
							previousHash: undefined
						},
						{
							name: 'image-2',
							extension: 'png',
							path: `${options.sourceDirectory}/image-2.png`,
							hash: 'a',
							previousHash: undefined
						},
						{
							name: 'image-3',
							extension: 'svg',
							path: `${options.sourceDirectory}/image-3.svg`,
							hash: 'a',
							previousHash: undefined
						},
						{
							name: 'image-4',
							extension: 'gif',
							path: `${options.sourceDirectory}/image-4.gif`,
							hash: 'a',
							previousHash: undefined
						}
						]
					});
				});

				describe('when a manifest already exists', function () {
					let resolvedValue;

					beforeEach(function () {
						instance.readImageSetManifest = () => Promise.resolve({
							version: options.version,
							host: options.host,
							sourceDirectory: options.sourceDirectory,
							scheme: options.scheme,
							images: [{
								name: 'image-1',
								extension: 'jpg',
								path: `${options.sourceDirectory}/image-1.jpg`,
								hash: 'a',
								previousHash: undefined
							},
							{
								name: 'image-2',
								extension: 'png',
								path: `${options.sourceDirectory}/image-2.png`,
								hash: 'a',
								previousHash: undefined
							},
							{
								name: 'image-3',
								extension: 'svg',
								path: `${options.sourceDirectory}/image-3.svg`,
								hash: 'a',
								previousHash: undefined
							},
							{
								name: 'image-4',
								extension: 'gif',
								path: `${options.sourceDirectory}/image-4.gif`,
								hash: 'a',
								previousHash: undefined
							}
							]
						});

						hasha.fromFileSync.returns('b');

						fs.readdir.resolves([
							'.hidden-1',
							'image-1.jpg',
							'image-2.png',
							'text-1.txt',
							'image-3.svg',
							'image-4.gif',
							'directory-1'
						]);

						return instance.buildImageSetManifest().then(value => {
							resolvedValue = value;
						});
					});

					it('resolves with an object that contains the image names', function () {
						assert.deepEqual(resolvedValue, {
							version: options.version,
							host: options.host,
							sourceDirectory: options.sourceDirectory,
							scheme: options.scheme,
							images: [{
								name: 'image-1',
								extension: 'jpg',
								path: `${options.sourceDirectory}/image-1.jpg`,
								hash: 'b',
								previousHash: 'a'
							},
							{
								name: 'image-2',
								extension: 'png',
								path: `${options.sourceDirectory}/image-2.png`,
								hash: 'b',
								previousHash: 'a'
							},
							{
								name: 'image-3',
								extension: 'svg',
								path: `${options.sourceDirectory}/image-3.svg`,
								hash: 'b',
								previousHash: 'a'
							},
							{
								name: 'image-4',
								extension: 'gif',
								path: `${options.sourceDirectory}/image-4.gif`,
								hash: 'b',
								previousHash: 'a'
							}
							]
						});
					});
				});
			});

			it('has a `buildLegacyImageSetManifest` method', function () {
				assert.isFunction(instance.buildLegacyImageSetManifest);
			});

			describe('.buildLegacyImageSetManifest()', function () {
				let imageSetManifest;
				let resolvedValue;
				let returnedPromise;

				beforeEach(function () {

					imageSetManifest = {
						sourceDirectory: options.sourceDirectory,
						scheme: options.scheme,
						images: [{
							name: 'image-1',
							extension: 'jpg',
							path: `${options.sourceDirectory}/image-1.jpg`
						},
						{
							name: 'image-2',
							extension: 'png',
							path: `${options.sourceDirectory}/image-2.png`
						}
						]
					};
					instance.buildImageSetManifest = sinon.stub().resolves(imageSetManifest);

					return returnedPromise = instance.buildLegacyImageSetManifest().then(value => {
						resolvedValue = value;
					});
				});

				it('returns a promise', function () {
					assert.instanceOf(returnedPromise, Promise);
				});

				it('builds an image set manifest', function () {
					assert.calledOnce(instance.buildImageSetManifest);
				});

				it('resolves with an object that contains the only the image names and no source directory', function () {
					assert.deepEqual(resolvedValue, {
						images: [{
							name: 'image-1'
						},
						{
							name: 'image-2'
						}
						]
					});
				});

			});

			it('has a `buildImageSetManifestFile` method', function () {
				assert.isFunction(instance.buildImageSetManifestFile);
			});

			describe('.buildImageSetManifestFile()', function () {
				let imageSetManifest;
				let resolvedValue;
				let returnedPromise;

				beforeEach(function () {
					imageSetManifest = {
						isMockInfo: true
					};
					instance.buildImageSetManifest = sinon.stub().resolves(imageSetManifest);

					return returnedPromise = instance.buildImageSetManifestFile().then(value => {
						resolvedValue = value;
					});
				});

				it('logs that the manifest file is being built', function () {
					assert.calledWithExactly(log.info, 'Building manifest file…');
				});

				it('returns a promise', function () {
					assert.instanceOf(returnedPromise, Promise);
				});

				it('builds an image set manifest', function () {
					assert.calledOnce(instance.buildImageSetManifest);
				});

				it('saves the image set manifest to a file as JSON', function () {
					assert.calledOnce(fs.writeFile);
					assert.calledWithExactly(fs.writeFile, `${options.baseDirectory}/imageset.json`, JSON.stringify(imageSetManifest, null, '\t'));
				});

				it('logs that the manifest file has been saved', function () {
					assert.calledWithExactly(log.info, '✔︎ Manifest file saved');
				});

				it('resolves with `undefined`', function () {
					assert.isUndefined(resolvedValue);
				});

				describe('when an error occurs', function () {
					let buildError;
					let rejectedError;

					beforeEach(function () {
						log.info.reset();
						buildError = new Error('rejected');
						instance.buildImageSetManifest = sinon.stub().rejects(buildError);
						return returnedPromise = instance.buildImageSetManifestFile().catch(error => {
							rejectedError = error;
						});
					});

					it('does not log that the manifest file has been saved', function () {
						assert.neverCalledWith(log.info, '✔︎ Manifest file saved');
					});

					it('logs that the manifest file could not be saved', function () {
						assert.calledWithExactly(log.error, '✘ Manifest file could not be saved');
					});

					it('rejects with the error', function () {
						assert.strictEqual(rejectedError, buildError);
					});

				});

			});

			it('has a `buildLegacyImageSetManifestFile` method', function () {
				assert.isFunction(instance.buildLegacyImageSetManifestFile);
			});

			describe('.buildLegacyImageSetManifestFile()', function () {
				let imageSetManifest;
				let resolvedValue;
				let returnedPromise;

				beforeEach(function () {
					imageSetManifest = {
						isMockInfo: true
					};
					instance.buildLegacyImageSetManifest = sinon.stub().resolves(imageSetManifest);

					return returnedPromise = instance.buildLegacyImageSetManifestFile().then(value => {
						resolvedValue = value;
					});
				});

				it('logs that the manifest file is being built', function () {
					assert.calledWithExactly(log.info, 'Building legacy manifest file…');
				});

				it('returns a promise', function () {
					assert.instanceOf(returnedPromise, Promise);
				});

				it('builds an image set manifest', function () {
					assert.calledOnce(instance.buildLegacyImageSetManifest);
				});

				it('saves the image set manifest to a file as JSON', function () {
					assert.calledOnce(fs.writeFile);
					assert.calledWithExactly(fs.writeFile, `${options.baseDirectory}/imageList.json`, JSON.stringify(imageSetManifest, null, '\t'));
				});

				it('logs that the manifest file has been saved', function () {
					assert.calledWithExactly(log.info, '✔︎ Legacy manifest file saved');
				});

				it('resolves with `undefined`', function () {
					assert.isUndefined(resolvedValue);
				});

				describe('when an error occurs', function () {
					let buildError;
					let rejectedError;

					beforeEach(function () {
						log.info.reset();
						buildError = new Error('rejected');
						instance.buildLegacyImageSetManifest = sinon.stub().rejects(buildError);
						return returnedPromise = instance.buildLegacyImageSetManifestFile().catch(error => {
							rejectedError = error;
						});
					});

					it('does not log that the manifest file has been saved', function () {
						assert.neverCalledWith(log.info, '✔︎ Legacy manifest file saved');
					});

					it('logs that the manifest file could not be saved', function () {
						assert.calledWithExactly(log.error, '✘ Legacy manifest file could not be saved');
					});

					it('rejects with the error', function () {
						assert.strictEqual(rejectedError, buildError);
					});

				});

			});

			it('has a `findUpdatedImages` method', function () {
				assert.isFunction(instance.findUpdatedImages);
			});

			describe('.findUpdatedImages()', function () {
				describe('when manifest has no images', function () {
					it('returns an empty array', function () {
						const imageSetManifest = {};
						instance.readImageSetManifest = sinon.stub().resolves(imageSetManifest);

						return instance.findUpdatedImages().then(result => {
							assert.deepStrictEqual(result, []);
						});
					});
				});
				describe('when no images have been updated', function () {
					it('returns an empty array', function () {
						const imageSetManifest = {
							images: [{
								name: 'foo-image',
								extension: 'png',
								path: 'src/foo-image.png',
								previousHash: undefined
							},
							{
								name: 'bar-image',
								extension: 'jpg',
								path: 'src/bar-image.jpg',
								hash: 'a'
							},
							{
								name: 'baz-image',
								extension: 'svg',
								path: 'src/baz-image.svg'
							}
							]
						};
						instance.readImageSetManifest = sinon.stub().resolves(imageSetManifest);

						return instance.findUpdatedImages().then(result => {
							assert.deepStrictEqual(result, []);
						});
					});
				});

				describe('when some images have been updated', function () {
					it('returns an array containing only the updated images', function () {
						const imageSetManifest = {
							images: [{
								name: 'foo-image',
								extension: 'png',
								path: 'src/foo-image.png',
								previousHash: 'a',
								hash: 'a'
							},
							{
								name: 'bar-image',
								extension: 'jpg',
								path: 'src/bar-image.jpg',
								previousHash: 'b',
								hash: 'c'
							},
							{
								name: 'baz-image',
								extension: 'svg',
								path: 'src/baz-image.svg'
							}
							]
						};
						instance.readImageSetManifest = sinon.stub().resolves(imageSetManifest);

						return instance.findUpdatedImages().then(result => {
							assert.deepStrictEqual(result, [{
								name: 'bar-image',
								extension: 'jpg',
								path: 'src/bar-image.jpg',
								previousHash: 'b',
								hash: 'c'
							}]);
						});
					});
				});
			});

			it('has a `publishToS3` method', function () {
				assert.isFunction(instance.publishToS3);
			});

			describe('.publishToS3(bucket)', function () {
				let fileStream;
				let imageSetManifest;
				let resolvedValue;
				let returnedPromise;

				beforeEach(function () {
					imageSetManifest = {
						images: [{
							name: 'foo-image',
							extension: 'png',
							path: 'src/foo-image.png',
							previousHash: 'a',
							hash: 'b'
						},
						{
							name: 'bar-image',
							extension: 'jpg',
							path: 'src/bar-image.jpg',
							previousHash: 'c',
							hash: 'd'
						},
						{
							name: 'baz-image',
							extension: 'svg',
							path: 'src/baz-image.svg',
							previousHash: 'e',
							hash: 'f'
						}
						]
					};
					instance.readImageSetManifest = sinon.stub().resolves(imageSetManifest);

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

				it('returns a promise', function () {
					assert.instanceOf(returnedPromise, Promise);
				});

				it('creates an S3 client', function () {
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

				it('reads an image set manifest', function () {
					assert.calledOnce(instance.readImageSetManifest);
				});

				it('logs that each image is being published', function () {
					assert.calledWithExactly(log.info, 'Publishing "src/foo-image.png" to S3…');
					assert.calledWithExactly(log.info, 'Publishing "src/bar-image.jpg" to S3…');
					assert.calledWithExactly(log.info, 'Publishing "src/baz-image.svg" to S3…');
				});

				it('creates a read stream for each image', function () {
					assert.callCount(fs.createReadStream, 6);
					assert.calledWithExactly(fs.createReadStream, path.resolve(options.baseDirectory, 'src/foo-image.png'));
					assert.calledWithExactly(fs.createReadStream, path.resolve(options.baseDirectory, 'src/bar-image.jpg'));
					assert.calledWithExactly(fs.createReadStream, path.resolve(options.baseDirectory, 'src/baz-image.svg'));
				});

				it('looks up the mime type for each image', function () {
					assert.calledThrice(mime.lookup);
					assert.calledWithExactly(mime.lookup, path.resolve(options.baseDirectory, 'src/foo-image.png'));
					assert.calledWithExactly(mime.lookup, path.resolve(options.baseDirectory, 'src/bar-image.jpg'));
					assert.calledWithExactly(mime.lookup, path.resolve(options.baseDirectory, 'src/baz-image.svg'));
				});

				it('creates two S3 uploads for each image, with and without an extension', function () {
					assert.callCount(AWS.S3.mockInstance.upload, 6);
					assert.callCount(AWS.S3.mockUpload.promise, 6);
					assert.calledWith(AWS.S3.mockInstance.upload, {
						ACL: 'public-read',
						Body: fileStream,
						ContentType: 'mock-mimetype',
						Key: 'mock-scheme/v9/foo-image-b'
					});
					assert.calledWith(AWS.S3.mockInstance.upload, {
						ACL: 'public-read',
						Body: fileStream,
						ContentType: 'mock-mimetype',
						Key: 'mock-scheme/v9/foo-image-b.png'
					});
					assert.calledWith(AWS.S3.mockInstance.upload, {
						ACL: 'public-read',
						Body: fileStream,
						ContentType: 'mock-mimetype',
						Key: 'mock-scheme/v9/bar-image-d'
					});
					assert.calledWith(AWS.S3.mockInstance.upload, {
						ACL: 'public-read',
						Body: fileStream,
						ContentType: 'mock-mimetype',
						Key: 'mock-scheme/v9/bar-image-d.jpg'
					});
					assert.calledWith(AWS.S3.mockInstance.upload, {
						ACL: 'public-read',
						Body: fileStream,
						ContentType: 'mock-mimetype',
						Key: 'mock-scheme/v9/baz-image-f'
					});
					assert.calledWith(AWS.S3.mockInstance.upload, {
						ACL: 'public-read',
						Body: fileStream,
						ContentType: 'mock-mimetype',
						Key: 'mock-scheme/v9/baz-image-f.svg'
					});
				});

				it('logs that each image has been published', function () {
					assert.calledWithExactly(log.info, '✔︎ Published "src/foo-image.png" to S3 under "mock-scheme/v9/foo-image-b"');
					assert.calledWithExactly(log.info, '✔︎ Published "src/foo-image.png" to S3 under "mock-scheme/v9/foo-image-b.png"');
					assert.calledWithExactly(log.info, '✔︎ Published "src/bar-image.jpg" to S3 under "mock-scheme/v9/bar-image-d"');
					assert.calledWithExactly(log.info, '✔︎ Published "src/bar-image.jpg" to S3 under "mock-scheme/v9/bar-image-d.jpg"');
					assert.calledWithExactly(log.info, '✔︎ Published "src/baz-image.svg" to S3 under "mock-scheme/v9/baz-image-f"');
					assert.calledWithExactly(log.info, '✔︎ Published "src/baz-image.svg" to S3 under "mock-scheme/v9/baz-image-f.svg"');
				});

				it('resolves with `undefined`', function () {
					assert.isUndefined(resolvedValue);
				});

				describe('when an AWS access key is not provided in instantiation', function () {
					let rejectedError;

					beforeEach(function () {
						log.info.reset();
						delete options.awsAccessKey;
						instance = new OrigamiImageSetTools(options);
						return returnedPromise = instance.publishToS3('mock-bucket').catch(error => {
							rejectedError = error;
						});
					});

					it('rejects with an error', function () {
						assert.instanceOf(rejectedError, Error);
						assert.strictEqual(rejectedError.message, 'No AWS credentials are available');
					});

				});

				describe('when an error occurs', function () {
					let publishError;
					let rejectedError;

					beforeEach(function () {
						log.info.reset();
						imageSetManifest.images = [imageSetManifest.images[0]];
						publishError = new Error('rejected');
						AWS.S3.mockUpload.promise = sinon.stub().rejects(publishError);
						return returnedPromise = instance.publishToS3('mock-bucket').catch(error => {
							rejectedError = error;
						});
					});

					it('does not log that image file has been published', function () {
						assert.neverCalledWith(log.info, '✔︎ Published "src/foo-image.png" to S3 under "mock-scheme/v9/foo-image"');
						assert.neverCalledWith(log.info, '✔︎ Published "src/foo-image.png" to S3 under "mock-scheme/v9/foo-image.png"');
					});

					it('logs that the image file could not be published', function () {
						assert.calledWithExactly(log.error, '✘ File "src/foo-image.png" could not be published');
					});

					it('rejects with the error', function () {
						assert.strictEqual(rejectedError, publishError);
					});

				});

			});

			it('has a `purgeFromImageService` method', function () {
				assert.isFunction(instance.purgeFromImageService);
			});

			describe('.purgeFromImageService()', function () {
				let fileStream;
				let imageSetManifest;
				let resolvedValue;
				let returnedPromise;

				beforeEach(function () {
					imageSetManifest = [{
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
					];
					instance.findUpdatedImages = sinon.stub().resolves(imageSetManifest);

					mime.lookup.returns('mock-mimetype');

					fileStream = {
						isFileStream: true
					};
					fs.createReadStream.returns(fileStream);

					semver.major.returns('9');

					return returnedPromise = instance.purgeFromImageService().then(value => {
						resolvedValue = value;
					});
				});

				it('returns a promise', function () {
					assert.instanceOf(returnedPromise, Promise);
				});

				it('builds an image set manifest', function () {
					assert.calledOnce(instance.findUpdatedImages);
				});

				it('logs that each image is being purged', function () {
					assert.calledWithExactly(log.info, 'Scheduling "src/foo-image.png" to be purged');
					assert.calledWithExactly(log.info, 'Scheduling "src/bar-image.jpg" to be purged');
					assert.calledWithExactly(log.info, 'Scheduling "src/baz-image.svg" to be purged');
				});

				it('creates two purge requests for each image, with and without an extension', function () {
					assert.callCount(request.get, 6);
					assert.calledWith(request.get, {
						uri: options.imageServiceUrl + '/v2/images/purge/' + 'mock-scheme-v9:foo-image?source=oist',
						headers: {
							'ft-origami-api-key': options.imageServiceApiKey
						}
					});
					assert.calledWith(request.get, {
						uri: options.imageServiceUrl + '/v2/images/purge/' + 'mock-scheme-v9:foo-image.png?source=oist',
						headers: {
							'ft-origami-api-key': options.imageServiceApiKey
						}
					});
					assert.calledWith(request.get, {
						uri: options.imageServiceUrl + '/v2/images/purge/' + 'mock-scheme-v9:bar-image?source=oist',
						headers: {
							'ft-origami-api-key': options.imageServiceApiKey
						}
					});
					assert.calledWith(request.get, {
						uri: options.imageServiceUrl + '/v2/images/purge/' + 'mock-scheme-v9:bar-image.jpg?source=oist',
						headers: {
							'ft-origami-api-key': options.imageServiceApiKey
						}
					});
					assert.calledWith(request.get, {
						uri: options.imageServiceUrl + '/v2/images/purge/' + 'mock-scheme-v9:baz-image?source=oist',
						headers: {
							'ft-origami-api-key': options.imageServiceApiKey
						}
					});
					assert.calledWith(request.get, {
						uri: options.imageServiceUrl + '/v2/images/purge/' + 'mock-scheme-v9:baz-image.svg?source=oist',
						headers: {
							'ft-origami-api-key': options.imageServiceApiKey
						}
					});
				});

				it('logs that each image has been published', function () {
					assert.calledWithExactly(log.info, '✔︎ Scheduled purging of "mock-scheme-v9:foo-image" from "mock-image-service-url"');
					assert.calledWithExactly(log.info, '✔︎ Scheduled purging of "mock-scheme-v9:foo-image.png" from "mock-image-service-url"');
					assert.calledWithExactly(log.info, '✔︎ Scheduled purging of "mock-scheme-v9:bar-image" from "mock-image-service-url"');
					assert.calledWithExactly(log.info, '✔︎ Scheduled purging of "mock-scheme-v9:bar-image.jpg" from "mock-image-service-url"');
					assert.calledWithExactly(log.info, '✔︎ Scheduled purging of "mock-scheme-v9:baz-image" from "mock-image-service-url"');
					assert.calledWithExactly(log.info, '✔︎ Scheduled purging of "mock-scheme-v9:baz-image.svg" from "mock-image-service-url"');
				});

				it('resolves with `undefined`', function () {
					assert.isUndefined(resolvedValue);
				});

				describe('when an Origmi Image Service API key is not provided in instantiation', function () {
					let rejectedError;

					beforeEach(function () {
						log.info.reset();
						delete options.imageServiceApiKey;
						instance = new OrigamiImageSetTools(options);
						return returnedPromise = instance.purgeFromImageService().catch(error => {
							rejectedError = error;
						});
					});

					it('rejects with an error', function () {
						assert.instanceOf(rejectedError, Error);
						assert.strictEqual(rejectedError.message, 'No Origami Image Service API key is available');
					});

				});

				describe('when an error occurs', function () {
					let purgeError;
					let rejectedError;

					beforeEach(function () {
						log.info.reset();
						imageSetManifest.images = [imageSetManifest[0]];
						purgeError = new Error('rejected');
						request.get.rejects(purgeError);
						return returnedPromise = instance.purgeFromImageService().catch(error => {
							rejectedError = error;
						});
					});

					it('does not log that image file has been published', function () {
						assert.neverCalledWith(log.info, '✔︎ Published "src/foo-image.png" to S3 under "mock-scheme/v9/foo-image"');
						assert.neverCalledWith(log.info, '✔︎ Published "src/foo-image.png" to S3 under "mock-scheme/v9/foo-image.png"');
					});

					it('logs that the image file could not be published', function () {
						assert.calledWithExactly(log.error, '✘ Could not schedule purge of "mock-scheme-v9:foo-image" "mock-scheme-v9:foo-image.png" from "mock-image-service-url" using {"uri":"mock-image-service-url/v2/images/purge/mock-scheme-v9:foo-image?source=oist","headers":{"ft-origami-api-key":"mock-image-service-api-key"}}');
					});

					it('rejects with the error', function () {
						assert.strictEqual(rejectedError, purgeError);
					});

				});

			});

			it('has a `readImageSetManifest` method', function () {
				assert.isFunction(instance.readImageSetManifest);
			});

			describe('.readImageSetManifest()', function () {
				describe('when no manifests exist', function () {
					it('returns null', function () {
						fileExists.resolves(false);
						return instance.readImageSetManifest().then(result => {
							assert.isNull(result);
						});
					});
				});
				describe('when only new manifest exists', function () {
					describe('is valid JSON', function () {
						it('parses and returns the JSON string', function () {
							fileExists.withArgs(`${options.baseDirectory}/imageset.json`).resolves(true);
							fileExists.withArgs(`${options.baseDirectory}/imageList.json`).resolves(false);

							fs.readFile.withArgs(`${options.baseDirectory}/imageset.json`, 'utf8').resolves('{"hello": "world"}');
							return instance.readImageSetManifest().then(result => {
								assert.deepStrictEqual(result, {
									hello: 'world'
								});
							});
						});
					});
					describe('is not valid JSON', function () {
						it('throws an error', function () {
							fileExists.withArgs(`${options.baseDirectory}/imageset.json`).resolves(true);
							fileExists.withArgs(`${options.baseDirectory}/imageList.json`).resolves(false);
							fs.readFile.withArgs(`${options.baseDirectory}/imageset.json`, 'utf8').resolves('qwertyuiop');
							return instance.readImageSetManifest().catch(error => {
								assert.instanceOf(error, Error);
							});
						});
					});
				});
				describe('when only legacy manifest exists', function () {
					describe('is valid JSON', function () {
						it('parses and returns the JSON string', function () {
							fileExists.withArgs(`${options.baseDirectory}/imageset.json`).resolves(false);
							fileExists.withArgs(`${options.baseDirectory}/imageList.json`).resolves(true);
							fs.readFile.withArgs(`${options.baseDirectory}/imageList.json`, 'utf8').resolves('{"hello": "world"}');
							return instance.readImageSetManifest().then(result => {
								assert.deepStrictEqual(result, {
									hello: 'world'
								});
							});
						});
					});
					describe('is not valid JSON', function () {
						it('throws an error', function () {
							fileExists.withArgs(`${options.baseDirectory}/imageset.json`).resolves(false);
							fileExists.withArgs(`${options.baseDirectory}/imageList.json`).resolves(true);
							fs.readFile.withArgs(`${options.baseDirectory}/imageList.json`, 'utf8').resolves('qwertyuiop');
							return instance.readImageSetManifest().catch(error => {
								assert.instanceOf(error, Error);
							});
						});
					});
				});
				describe('when both manifests exist', function () {
					describe('are valid JSON', function () {
						it('parses and returns the JSON string for the new manifest file', function () {
							fileExists.withArgs(`${options.baseDirectory}/imageset.json`).resolves(true);
							fileExists.withArgs(`${options.baseDirectory}/imageList.json`).resolves(true);
							fs.readFile.withArgs(`${options.baseDirectory}/imageset.json`, 'utf8').resolves('{"hello": "world"}');
							fs.readFile.withArgs(`${options.baseDirectory}/imageList.json`, 'utf8').resolves('{"goodbye": "world"}');
							return instance.readImageSetManifest().then(result => {
								assert.deepStrictEqual(result, {
									hello: 'world'
								});
							});
						});
					});
					describe('are not valid JSON', function () {
						it('throws an error', function () {
							fileExists.withArgs(`${options.baseDirectory}/imageset.json`).resolves(true);
							fileExists.withArgs(`${options.baseDirectory}/imageList.json`).resolves(true);
							fs.readFile.withArgs(`${options.baseDirectory}/imageset.json`, 'utf8').resolves('qwertyuiop');
							fs.readFile.withArgs(`${options.baseDirectory}/imageList.json`, 'utf8').resolves('asdfghjkl');
							return instance.readImageSetManifest().catch(error => {
								assert.instanceOf(error, Error);
							});
						});
					});
				});
			});

			it('has a `verifyImages` method', function () {
				assert.isFunction(instance.verifyImages);
			});

			describe('.verifyImages()', function () {
				let resolvedValue;
				let returnedPromise;

				beforeEach(function () {
					instance.verifySvgImages = sinon.stub().resolves();
					return returnedPromise = instance.verifyImages().then(value => {
						resolvedValue = value;
					});
				});

				it('returns a promise', function () {
					assert.instanceOf(returnedPromise, Promise);
				});

				it('verifies SVG images', function () {
					assert.calledOnce(instance.verifySvgImages);
					assert.calledWithExactly(instance.verifySvgImages);
				});

				it('logs that images are being verified', function () {
					assert.calledWithExactly(log.info, 'Verifying images…');
				});

				it('logs that images have been verified', function () {
					assert.calledWithExactly(log.info, '✔︎ Verified all images');
				});

				it('resolves with `undefined`', function () {
					assert.isUndefined(resolvedValue);
				});

			});

			it('has a `verifySvgImages` method', function () {
				assert.isFunction(instance.verifySvgImages);
			});

			describe('.verifySvgImages()', function () {
				let imageSetManifest;
				let resolvedValue;
				let returnedPromise;

				beforeEach(function () {

					imageSetManifest = {
						images: [{
							name: 'foo-image',
							extension: 'png',
							path: 'src/foo-image.png'
						},
						{
							name: 'bar-image',
							extension: 'svg',
							path: 'src/bar-image.svg'
						},
						{
							name: 'baz-image',
							extension: 'svg',
							path: 'src/baz-image.svg'
						}
						]
					};
					instance.buildImageSetManifest = sinon.stub().resolves(imageSetManifest);

					fs.readFile.resolves('mock-svg-content');

					return returnedPromise = instance.verifySvgImages().then(value => {
						resolvedValue = value;
					});
				});

				it('returns a promise', function () {
					assert.instanceOf(returnedPromise, Promise);
				});

				it('logs that each image is being verified', function () {
					assert.calledWithExactly(log.info, 'Verifying "src/bar-image.svg"…');
					assert.calledWithExactly(log.info, 'Verifying "src/baz-image.svg"…');
				});

				it('reads each SVG image', function () {
					assert.calledTwice(fs.readFile);
					assert.calledWithExactly(fs.readFile, path.resolve(options.baseDirectory, 'src/bar-image.svg'), 'utf-8');
					assert.calledWithExactly(fs.readFile, path.resolve(options.baseDirectory, 'src/baz-image.svg'), 'utf-8');
				});

				it('logs that each image has been verified', function () {
					assert.calledWithExactly(log.info, '✔︎ File "src/bar-image.svg" has no issues');
					assert.calledWithExactly(log.info, '✔︎ File "src/baz-image.svg" has no issues');
				});

				it('resolves with `undefined`', function () {
					assert.isUndefined(resolvedValue);
				});

				describe('when the root SVG element has a width attribute', function () {
					let rejectedError;

					beforeEach(function () {
						log.info.reset();
						xml.mockRootNode.attr.withArgs('width').returns({});
						return returnedPromise = instance.verifySvgImages().catch(error => {
							rejectedError = error;
						});
					});

					it('logs that the image did not pass verification', function () {
						assert.calledWithExactly(log.error, '✘ File "src/bar-image.svg" has some issues:');
						assert.calledWithExactly(log.error, '  - Root SVG element must not have a `width` attribute');
					});

					it('rejects with an error that has a `verificationErrors` property', function () {
						assert.instanceOf(rejectedError, Error);
						assert.isArray(rejectedError.verificationErrors);
						assert.deepEqual(rejectedError.verificationErrors, [
							'Root SVG element must not have a `width` attribute'
						]);
					});

				});

				describe('when the root SVG element has a height attribute', function () {
					let rejectedError;

					beforeEach(function () {
						log.info.reset();
						xml.mockRootNode.attr.withArgs('height').returns({});
						return returnedPromise = instance.verifySvgImages().catch(error => {
							rejectedError = error;
						});
					});

					it('logs that the image did not pass verification', function () {
						assert.calledWithExactly(log.error, '✘ File "src/bar-image.svg" has some issues:');
						assert.calledWithExactly(log.error, '  - Root SVG element must not have a `height` attribute');
					});

					it('rejects with an error that has a `verificationErrors` property', function () {
						assert.instanceOf(rejectedError, Error);
						assert.isArray(rejectedError.verificationErrors);
						assert.deepEqual(rejectedError.verificationErrors, [
							'Root SVG element must not have a `height` attribute'
						]);
					});

				});

				describe('when the SVG cannot be parsed', function () {
					let parseError;
					let rejectedError;

					beforeEach(function () {
						log.info.reset();
						parseError = new Error('parse error');
						xml.parseXml.throws(parseError);
						return returnedPromise = instance.verifySvgImages().catch(error => {
							rejectedError = error;
						});
					});

					it('logs that the image did not pass verification', function () {
						assert.calledWithExactly(log.error, '✘ File "src/bar-image.svg" has some issues:');
						assert.calledWithExactly(log.error, '  - parse error');
					});

					it('rejects with the error', function () {
						assert.strictEqual(rejectedError, parseError);
					});

				});

			});

		});

		describe('when `options.version` is invalid', function () {

			beforeEach(function () {
				semver.valid.returns(false);
				instance = new OrigamiImageSetTools(options);
			});

			describe('instance', function () {

				it('has a `version` property set to "v0.0.0"', function () {
					assert.strictEqual(instance.version, 'v0.0.0');
				});

			});

		});

	});

});