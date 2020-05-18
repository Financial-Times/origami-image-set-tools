module.exports = {
	'env': {
		'mocha': true,
	},
	'plugins': [
		'mocha',
	],
	'rules': {
		'mocha/no-exclusive-tests': process.env.CI ? 'error' : 'warn',
		'mocha/no-global-tests': 'error',
		'mocha/no-mocha-arrows': 'error',
		'mocha/no-pending-tests': process.env.CI ? 'error' : 'warn',
		'mocha/no-return-and-callback': 'error',
		'mocha/no-setup-in-describe': 'warn',
		'mocha/no-sibling-hooks': 'error',
		'mocha/no-skipped-tests': process.env.CI ? 'error' : 'warn',
		'mocha/no-top-level-hooks': 'error',
		'mocha/no-async-describe': 'error',
	}
};
