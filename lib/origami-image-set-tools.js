'use strict';

const defaults = require('lodash/defaults');

/**
 * Origami image set tools.
 */
module.exports = class OrigamiImageSetTools {

	/**
	 * Create a tool set.
	 * @param {Object} [options] - The instance options.
	 */
	constructor(options) {
		this.options = defaults({}, options, module.exports.defaults);
		this.log = this.options.log;
	}

};

/**
 * The default options for a tool set.
 * @static
 */
module.exports.defaults = {
	log: console
};
