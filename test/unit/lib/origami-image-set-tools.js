'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/origami-image-set-tools', () => {
	let defaults;
	let fs;
	let log;
	let OrigamiImageSetTools;

	beforeEach(() => {
		defaults = sinon.spy(require('lodash/defaults'));
		mockery.registerMock('lodash/defaults', defaults);

		fs = require('../mock/fs-promise.mock');
		mockery.registerMock('fs-promise', fs);

		log = require('../mock/log.mock');

		OrigamiImageSetTools = require('../../..');
	});

	it('exports a function', () => {
		assert.isFunction(OrigamiImageSetTools);
	});

	it('has a `defaults` property', () => {
		assert.isObject(OrigamiImageSetTools.defaults);
	});

	describe('.defaults', () => {

		it('has a `baseDirectory` property', () => {
			assert.strictEqual(OrigamiImageSetTools.defaults.baseDirectory, process.cwd());
		});

		it('has a `log` property', () => {
			assert.strictEqual(OrigamiImageSetTools.defaults.log, console);
		});

		it('has a `sourceDirectory` property', () => {
			assert.strictEqual(OrigamiImageSetTools.defaults.sourceDirectory, 'src');
		});

	});

	describe('new OrigamiImageSetTools(options)', () => {
		let instance;
		let options;

		beforeEach(() => {
			options = {
				baseDirectory: 'foo',
				log: log,
				sourceDirectory: 'bar'
			};
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

		});

	});

});
