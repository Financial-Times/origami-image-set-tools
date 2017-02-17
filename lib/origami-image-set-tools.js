'use strict';

const defaults = require('lodash/defaults');
const fs = require('fs-promise');
const path = require('path');

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

};

/**
 * The default options for a tool set.
 * @static
 */
module.exports.defaults = {
	baseDirectory: process.cwd(),
	log: console,
	sourceDirectory: 'src'
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
