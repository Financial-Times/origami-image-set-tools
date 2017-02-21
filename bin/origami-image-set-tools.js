#!/usr/bin/env node
'use strict';

const OrigamiImageSetTools = require('../');
const pkg = require('../package.json');
const program = require('commander');

// Command to build a manifest file
program
	.command('build-manifest')
	.option('-s, --source-directory <dir>', 'The directory to look for source images in', process.env.IMAGESET_SOURCE_DIRECTORY)
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

// Command to publish the image set to an S3 bucket
program
	.command('publish-s3')
	.option('-a, --aws-access-key <key>', 'The AWS access key to use in authentication', process.env.AWS_ACCESS_KEY)
	.option('-S, --aws-secret-key <key>', 'The AWS access key secret to use in authentication', process.env.AWS_SECRET_KEY)
	.option('-b, --bucket <bucket>', 'The name of the S3 bucket to publish to', process.env.AWS_BUCKET)
	.option('-s, --source-directory <dir>', 'The directory to look for source images in', process.env.IMAGESET_SOURCE_DIRECTORY)
	.option('-c, --scheme <scheme>', 'The custom scheme to publish this image set under', process.env.IMAGESET_SCHEME)
	.option('-v, --scheme-version <version>', 'The version to publish this image set under', process.env.IMAGESET_VERSION)
	.description('publish the image set to an S3 bucket for use by the Image Service')
	.action(options => {
		const toolSet = new OrigamiImageSetTools({
			awsAccessKey: options.awsAccessKey,
			awsSecretKey: options.awsSecretKey,
			scheme: options.scheme,
			sourceDirectory: options.sourceDirectory,
			version: options.schemeVersion
		});
		toolSet.publishToS3(options.bucket).catch(error => {
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
