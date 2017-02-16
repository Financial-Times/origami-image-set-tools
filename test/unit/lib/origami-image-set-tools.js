'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/origami-image-set-tools', () => {
	let defaults;
	let log;
	let Oist;

	beforeEach(() => {
		defaults = sinon.spy(require('lodash/defaults'));
		mockery.registerMock('lodash/defaults', defaults);

		log = require('../mock/log.mock');
		mockery.registerMock('log', log);

		Oist = require('../../..');
	});

	it('exports a function', () => {
		assert.isFunction(Oist);
	});

	it('has a `defaults` property', () => {
		assert.isObject(Oist.defaults);
	});

	describe('.defaults', () => {

		it('has a `log` property', () => {
			assert.strictEqual(Oist.defaults.log, console);
		});

	});

	describe('new Oist(options)', () => {
		let instance;
		let options;

		beforeEach(() => {
			options = {
				log: log
			};
			instance = new Oist(options);
		});

		it('defaults the passed in options', () => {
			assert.isObject(defaults.firstCall.args[0]);
			assert.strictEqual(defaults.firstCall.args[1], options);
			assert.strictEqual(defaults.firstCall.args[2], Oist.defaults);
		});

		describe('instance', () => {

			it('has an `options` property set to the defaulted `options`', () => {
				assert.strictEqual(instance.options, defaults.firstCall.returnValue);
			});

			it('has a `log` property set to `options.log`', () => {
				assert.strictEqual(instance.log, instance.options.log);
			});

		});

	});

});
