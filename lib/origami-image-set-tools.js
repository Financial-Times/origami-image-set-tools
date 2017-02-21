'use strict';

const AWS = require('aws-sdk');
const defaults = require('lodash/defaults');
const fs = require('fs-promise');
const mime = require('mime-types');
const path = require('path');
const semver = require('semver');

/**
 * Origami image set tools.
 */
module.exports = class OrigamiImageSetTools {

	/**
	 * Create a image tool set.
	 * @param {Object} [options] - The instance options.
	 */
	constructor(options) {
		this.options = defaults({}, options, module.exports.defaults);
		this.log = this.options.log;
		this.scheme = this.options.scheme;
		this.version = (semver.valid(this.options.version) ? this.options.version : module.exports.defaults.version);
	}

	/**
	 * Generate an object containing information about the image set.
	 * @returns {Promise} A promise which resolves with a manifest object.
	 */
	buildImageSetManifest() {
		const sourceDirectory = this.options.sourceDirectory;
		const fullDirectory = path.join(this.options.baseDirectory, sourceDirectory);

		// Read the source directory...
		return fs.readdir(fullDirectory).then(filePaths => {

			// Iterate over the file paths, creating image objects
			const images = filePaths.filter(isImageFile).map(filePath => {
				const fileExtension = path.extname(filePath);
				const fileName = path.basename(filePath, fileExtension);
				return {
					name: fileName,
					extension: fileExtension.slice(1),
					path: path.join(sourceDirectory, filePath)
				};
			});
			return {
				sourceDirectory,
				images
			};
		});
	}

	/**
	 * Generate an object containing information about the image set in the legacy format.
	 * @returns {Promise} A promise which resolves with a legacy manifest object.
	 */
	buildLegacyImageSetManifest() {
		return this.buildImageSetManifest().then(manifest => {
			return {
				images: manifest.images.map(image => {
					return {
						name: image.name
					};
				})
			};
		});
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

	/**
	 * Generate an image set manifest and publish each image to an S3 bucket.
	 * @param {String} bucket - The name of the S3 bucket.
	 * @returns {Promise} A promise which resolves when all the images are published.
	 */
	publishToS3(bucket) {
		if (!this.options.awsAccessKey) {
			return Promise.reject(new Error('No AWS credentials are available'));
		}
		const s3 = new AWS.S3({
			accessKeyId: this.options.awsAccessKey,
			secretAccessKey: this.options.awsSecretKey,
			params: {
				Bucket: bucket
			}
		});
		const s3BasePath = `${this.scheme}/v${semver.major(this.options.version)}`;
		return this.buildImageSetManifest().then(imageSetManifest => {
			return Promise.all(imageSetManifest.images.map(image => {
				const fullPath = path.resolve(this.options.baseDirectory, image.path);
				const s3Path = `${s3BasePath}/${image.name}.${image.extension}`;
				const s3Config = {
					ACL: 'public-read',
					Body: fs.createReadStream(fullPath),
					ContentType: mime.lookup(fullPath),
					Key: s3Path
				};
				this.log.info(`Publishing "${image.path}" to S3…`);
				return s3.upload(s3Config).promise()
					.then(() => {
						this.log.info(`✔︎ Published "${image.path}" to S3 under "${s3Path}"`);
					})
					.catch(error => {
						this.log.error(`✘ File "${image.path}" could not be published`);
						throw error;
					});
			})).then(() => {
				// empty block used to ensure that the promise resolves with `undefined`
			});
		});
	}

};

/**
 * The default options for a tool set.
 * @static
 */
module.exports.defaults = {
	awsAccessKey: null,
	awsSecretKey: null,
	baseDirectory: process.cwd(),
	log: console,
	scheme: 'noscheme',
	sourceDirectory: 'src',
	version: 'v0.0.0'
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
