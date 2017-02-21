#!/usr/bin/env node
'use strict';

const OrigamiImageSetTools = require('../');
const pkg = require('../package.json');
const program = require('commander');

// Command to build a manifest file
program
	.command('build-manifest')
	.option('-s, --source-directory <dir>', 'The directory to look for source images in', process.env.IMAGESET_SOURCE_DIRECTORY || null)
	.description('build an image set manifest file and save to "imageset.json"')
	.action(options => {
		const toolSet = new OrigamiImageSetTools({
			sourceDirectory: options.sourceDirectory
		});
		toolSet.buildImageSetManifestFile().catch(error => {
			toolSet.log.error(error.stack);
			process.exit(1);
		});
	});

// Output help for all unrecognised commands
program
	.command('*')
	.description('unrecognised commands will output this help page')
	.action(command => {
		console.error(`Command "${command}" not found`);
		process.exit(1);
	});

program
	.version(pkg.version)
	.parse(process.argv);

if (!process.argv.slice(2).length) {
	program.outputHelp();
}
