'use strict';

const AWS = require('aws-sdk');
const defaults = require('lodash/defaults');
const fs = require('fs').promises;
const createReadStream = require('fs').createReadStream;
const mime = require('mime-types');
const path = require('path');
const semver = require('semver');
const semvish = require('semvish');
const xml = require('libxmljs');
const request = require('request-promise-native');
const hasha = require('hasha');
const fileExists = require('file-exists');
const URL = require('url').URL;

const defaultOptions = {
	awsAccessKey: null,
	awsSecretKey: null,
	baseDirectory: process.cwd(),
	imageServiceApiKey: null,
	imageServiceUrl: 'https://www.ft.com/__origami/service/image',
	log: console,
	scheme: 'noscheme',
	sourceDirectory: 'src',
	version: 'v0.0.0',
	host: 'https://www.ft.com'
};

/**
 * Origami image set tools.
 */
module.exports = class OrigamiImageSetTools {

	/**
	 * Create a image tool set.
	 * @param {Object} [options] - The instance options.
	 */
	constructor(options) {
		this.options = defaults({}, options, OrigamiImageSetTools.defaults);
		this.log = this.options.log;
		this.scheme = this.options.scheme;
		this.options.version = semvish.clean(this.options.version);
		this.version = (semver.valid(this.options.version) ? this.options.version : OrigamiImageSetTools.defaults.version);
		this.host = this.options.host;
	}

	/**
	 * The default options for a tool set.
	 * @static
	 */
	static get defaults() {
		return defaultOptions;
	}

	/**
	 * Generate an object containing information about the image set.
	 * @returns {Promise} A promise which resolves with a manifest object.
	 */
	buildImageSetManifest() {
		const currentManifest = this.readImageSetManifest();
		const sourceDirectory = this.options.sourceDirectory;
		const fullDirectory = path.join(this.options.baseDirectory, sourceDirectory);
		const scheme = this.options.scheme;
		const filePaths = fs.readdir(fullDirectory);
		const version = this.version;
		const host = this.host;

		// Read the source directory...
		return Promise.all([filePaths, currentManifest]).then(([filePaths, currentManifest]) => {
			// Iterate over the file paths, creating image objects
			const images = filePaths.filter(isImageFile).map(filePath => {
				const fileExtension = path.extname(filePath);
				const name = path.basename(filePath, fileExtension);
				const extension = fileExtension.slice(1);
				const relativePath = path.join(sourceDirectory, filePath);
				const hash = hasha.fromFileSync(path.join(fullDirectory, filePath));
				let previousHash;
				let deprecated;
				if (currentManifest && Array.isArray(currentManifest.images)) {
					const imageManifest = currentManifest.images.find(image => image.name === name && image.extension === extension && image.path === relativePath);
					if (imageManifest) {
						previousHash = imageManifest.hash;
						deprecated = imageManifest.deprecated;
					}
				}
				const s3BasePath = `${this.scheme}/v${semver.major(version)}`;
				const s3Path = `${s3BasePath}/${name}-${hash}`;
				const url = new URL(s3Path, host).toString();
				const imageConfig = {
					name,
					extension,
					path: relativePath,
					previousHash,
					hash,
					url,
				};
				if (deprecated || deprecated === '') {
					imageConfig.deprecated = deprecated;
				}
				return imageConfig;
			});
			return {
				sourceDirectory,
				scheme,
				images
			};
		});
	}

	/**
	 * Generate an object containing information about the image set in the legacy format.
	 * @returns {Promise} A promise which resolves with a legacy manifest object.
	 */
	buildLegacyImageSetManifest() {
		return this.buildImageSetManifest().then(manifest => ({
			images: manifest.images.map(image => ({
				name: image.name
			}))
		}));
	}

	/**
	 * Generate an image set manifest and saves it to a file.
	 * @returns {Promise} A promise which resolves when the file is written.
	 */
	buildImageSetManifestFile() {
		this.log.info('Building manifest file…');
		return this.buildImageSetManifest()
			.then(imageSetManifest => {
				const filePath = path.join(this.options.baseDirectory, 'imageset.json');
				const fileContents = JSON.stringify(imageSetManifest, null, '\t');
				return fs.writeFile(filePath, fileContents);
			})
			.then(() => {
				this.log.info('✔︎ Manifest file saved');
			})
			.catch(error => {
				this.log.error('✘ Manifest file could not be saved');
				throw error;
			});
	}

	/**
	 * Generate a legacy image set manifest and saves it to a file.
	 * @returns {Promise} A promise which resolves when the file is written.
	 */
	buildLegacyImageSetManifestFile() {
		this.log.info('Building legacy manifest file…');
		return this.buildLegacyImageSetManifest()
			.then(legacyImageSetManifest => {
				const filePath = path.join(this.options.baseDirectory, 'imageList.json');
				const fileContents = JSON.stringify(legacyImageSetManifest, null, '\t');
				return fs.writeFile(filePath, fileContents);
			})
			.then(() => {
				this.log.info('✔︎ Legacy manifest file saved');
			})
			.catch(error => {
				this.log.error('✘ Legacy manifest file could not be saved');
				throw error;
			});
	}

	findUpdatedImages() {
		return this.readImageSetManifest().then(manifest => {
			if (manifest && Array.isArray(manifest.images)) {
				const updatedImages = manifest.images.filter(image => {
					if (image.previousHash !== undefined) {
						if (image.previousHash !== image.hash) {
							return true;
						}
					}
					return false;
				});

				return updatedImages;
			} else {
				return [];
			}
		});

	}

	/**
	 * Generate an image set manifest and publish each image to an S3 bucket.
	 * @param {String} bucket - The name of the S3 bucket.
	 * @returns {Promise} A promise which resolves when all the images are published.
	 */
	async publishToS3(bucket) {
		if (!this.options.awsAccessKey) {
			throw new Error('No AWS credentials are available');
		}
		const s3 = new AWS.S3({
			accessKeyId: this.options.awsAccessKey,
			secretAccessKey: this.options.awsSecretKey,
			params: {
				Bucket: bucket
			}
		});
		const s3BasePath = `${this.scheme}/v${semver.major(this.options.version)}`;
		const imageSetManifest = await (this.buildImageSetManifest());
		for (const image of imageSetManifest.images) {

			const fullPath = path.resolve(this.options.baseDirectory, image.path);
			const s3Path = `${s3BasePath}/${image.name}-${image.hash}`;
			const s3PathExt = `${s3Path}.${image.extension}`;
			const s3Config = {
				ACL: 'public-read',
				Body: createReadStream(fullPath),
				ContentType: mime.lookup(fullPath),
				Key: s3Path
			};
			const s3ConfigExt = {
				ACL: s3Config.ACL,
				Body: createReadStream(fullPath),
				ContentType: s3Config.ContentType,
				Key: s3PathExt
			};
			const s3HeadConfig = {
				Key: s3Path
			};
			const s3HeadConfigExt = {
				Key: s3PathExt
			};
			this.log.info(`Publishing "${image.path}" to S3…`);
			try {
				try {
					await s3.headObject(s3HeadConfig).promise();
					this.log.info(`✔︎ Already published "${image.path}" to S3 under "${s3Path}"`);
				} catch (err) {
					if (err.code === 'NotFound') {
						await s3.upload(s3Config).promise();
						this.log.info(`✔︎ Published "${image.path}" to S3 under "${s3Path}"`);
					} else {
						throw err;
					}
				}
				try {
					await s3.headObject(s3HeadConfigExt).promise();
					this.log.info(`✔︎ Already published "${image.path}" to S3 under "${s3PathExt}"`);
				} catch (err) {
					if (err.code === 'NotFound') {
						await s3.upload(s3ConfigExt).promise();
						this.log.info(`✔︎ Published "${image.path}" to S3 under "${s3PathExt}"`);
					} else {
						throw err;
					}
				}
			} catch (error) {
				this.log.error(`✘ File "${image.path}" could not be published`);
				throw error;
			}
		}
	}

	/**
	 * Schedules updated images in the image set to be purged from the Origami Image Service
	 * @returns {Promise} A promise which resolves when all images are scheduled to be purged.
	 */
	purgeFromImageService() {
		if (!this.options.imageServiceApiKey) {
			return Promise.reject(new Error('No Origami Image Service API key is available'));
		}
		const versionedScheme = `${this.scheme}-v${semver.major(this.options.version)}`;
		const purgeUrl = `${this.options.imageServiceUrl}/v2/images/purge/`;
		return this.findUpdatedImages().then(images => Promise.all(images.map(image => {
			const schemeAndPath = `${versionedScheme}:${image.name}`;
			const schemeAndPathAndExtension = `${schemeAndPath}.${image.extension}`;

			const requestConfig = {
				uri: purgeUrl + schemeAndPath + '?source=oist',
				headers: {
					'ft-origami-api-key': this.options.imageServiceApiKey
				}
			};
			const requestConfigExtension = {
				uri: purgeUrl + schemeAndPathAndExtension + '?source=oist',
				headers: {
					'ft-origami-api-key': this.options.imageServiceApiKey
				}
			};
			this.log.info(`Scheduling "${image.path}" to be purged`);
			return Promise.all([
				request.get(requestConfig),
				request.get(requestConfigExtension)
			])
				.then(() => {
					this.log.info(`✔︎ Scheduled purging of "${schemeAndPath}" from "${this.options.imageServiceUrl}"`);
					this.log.info(`✔︎ Scheduled purging of "${schemeAndPathAndExtension}" from "${this.options.imageServiceUrl}"`);
				})
				.catch(error => {
					this.log.error(`✘ Could not schedule purge of "${schemeAndPath}" "${schemeAndPathAndExtension}" from "${this.options.imageServiceUrl}" using ${JSON.stringify(requestConfig)}`);
					throw error;
				});
		})).then(() => {
			// empty block used to ensure that the promise resolves with `undefined`
		}));
	}

	readImageSetManifest() {
		const filePath = path.join(this.options.baseDirectory, 'imageset.json');
		const legacyFilePath = path.join(this.options.baseDirectory, 'imageList.json');
		const imageSetExists = fileExists(filePath);
		const imageListExists = fileExists(legacyFilePath);
		return Promise.all([imageSetExists, imageListExists])
			.then(([imageSet, imageList]) => {
				if (imageSet) {
					return fs.readFile(filePath, 'utf8');
				} else if (imageList) {
					return fs.readFile(legacyFilePath, 'utf8');
				} else {
					return null;
				}
			})
			.then(JSON.parse)
			.catch(error => {
				this.log.error('✘ Error reading manifest file as JSON');
				throw error;
			});
	}

	/**
	 * Verify images in the manifest.
	 * @returns {Promise} A promise which resolves when all the images pass verification.
	 */
	verifyImages() {
		this.log.info('Verifying images…');
		return this.verifySvgImages()
			.then(() => {
				this.log.info('✔︎ Verified all images');
			});
	}

	/**
	 * Verify SVG images in the manifest.
	 * @returns {Promise} A promise which resolves when all the SVG images pass verification.
	 */
	verifySvgImages() {
		return this.buildImageSetManifest().then(imageSetManifest => {
			const svgImages = imageSetManifest.images.filter(image => image.extension.toLowerCase() === 'svg');
			return Promise.all(svgImages.map(image => {
				const fullPath = path.resolve(this.options.baseDirectory, image.path);
				this.log.info(`Verifying "${image.path}"…`);
				return fs.readFile(fullPath, 'utf-8')
					.then(fileContents => {
						const verificationErrors = [];
						const svg = xml.parseXml(fileContents);

						if (svg.root().attr('width')) {
							verificationErrors.push('Root SVG element must not have a `width` attribute');
						}
						if (svg.root().attr('height')) {
							verificationErrors.push('Root SVG element must not have a `height` attribute');
						}

						if (verificationErrors.length) {
							const error = new Error('Verification errors');
							error.verificationErrors = verificationErrors;
							throw error;
						} else {
							this.log.info(`✔︎ File "${image.path}" has no issues`);
						}
					})
					.catch(error => {
						this.log.error(`✘ File "${image.path}" has some issues:`);
						if (error.verificationErrors) {
							error.verificationErrors.forEach(verificationError => {
								this.log.error(`  - ${verificationError}`);
							});
						} else {
							this.log.error(`  - ${error.message}`);
						}
						throw error;
					});
			})).then(() => {
				// empty block used to ensure that the promise resolves with `undefined`
			});
		});
	}

};

/**
 * A list of valid image file extensions.
 * @access private
 */
const imageFileExtensions = [
	'gif',
	'jpg',
	'png',
	'svg'
];

/**
 * Determine whether a file path points to an image file.
 * @access private
 * @param {String} filePath - The file path to check.
 * @returns {Boolean} Whether the file path points to an image file.
 */
function isImageFile(filePath) {
	const fileExtension = path.extname(filePath).slice(1);
	return imageFileExtensions.includes(fileExtension);
}
