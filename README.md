
Origami Image Set Tools
=======================

Tools for managing and uploading Origami image sets.

[![NPM version](https://img.shields.io/npm/v/@financial-times/origami-image-set-tools.svg)](https://www.npmjs.com/package/@financial-times/origami-image-set-tools)
[![Build status](https://img.shields.io/circleci/project/Financial-Times/origami-image-set-tools.svg)](https://circleci.com/gh/Financial-Times/origami-image-set-tools)
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)][license]


Table Of Contents
-----------------

  - [Usage](#usage)
    - [Requirements](#requirements)
    - [Command-Line Interface](#command-line-interface)
    - [API Documentation](#api-documentation)
    - [Options](#options)
  - [Contributing](#contributing)
  - [Publishing](#publishing)
  - [Contact](#contact)
  - [Licence](#licence)


Usage
-----

### Requirements

Running the Origami Set module requires [Node.js] 10.x and [npm]. You can install with:

```sh
npm install @financial-times/origami-image-set-tools
```

### Command-Line Interface

This module exposes an `oist` command which can be used to manage image sets from the command line:

```
Usage: oist [options] [command]


Commands:

  build-manifest [options]   build an image set manifest file and save to "imageset.json"
  publish-s3 [options]       publish the image set to an S3 bucket for use by the Image Service
  purge [options]            request each image in the image set to be purged from the Origami Image Service
  verify [options]           verify that images in the source directory are valid and have no issues
  *                          unrecognised commands will output this help page

Options:

  -h, --help     output usage information
  -V, --version  output the version number
```

#### Build Manifest

The `oist build-manifest` command creates a JSON manifest file detailing all of the images in the set. An `imageset.json` file will be created in the current working directory. The output JSON format is [documented here](#toolsetgenerateimagesetinfo).

```
Usage: oist build-manifest [options]

build an image set manifest file and save to "imageset.json"

Options:

  -h, --help                    output usage information
  -s, --source-directory <dir>  The directory to look for source images in
  -c, --scheme <scheme>         The custom scheme this image set should be published under
  -l, --legacy                  Whether to output the legacy manifest format
```

Options can also be set as environment variables:

  - `--source-directory` can be set with `IMAGESET_SOURCE_DIRECTORY`
  - `--scheme` can be set with `IMAGESET_SCHEME`

#### Publish to S3

```
Usage: publish-s3 [options]

publish the image set to an S3 bucket for use by the Image Service

Options:

  -h, --help                      output usage information
  -a, --aws-access-key <key>      The AWS access key to use in authentication
  -S, --aws-secret-key <key>      The AWS access key secret to use in authentication
  -b, --bucket <bucket>           The name of the S3 bucket to publish to
  -s, --source-directory <dir>    The directory to look for source images in
  -c, --scheme <scheme>           The custom scheme to publish this image set under
  -v, --scheme-version <version>  The version to publish this image set under
```

Options can also be set as environment variables:

  - `--aws-access-key` can be set with `AWS_ACCESS_KEY`
  - `--aws-secret-key` can be set with `AWS_SECRET_KEY`
  - `--bucket` can be set with `AWS_BUCKET`
  - `--source-directory` can be set with `IMAGESET_SOURCE_DIRECTORY`
  - `--scheme` can be set with `IMAGESET_SCHEME`
  - `--scheme-version` can be set with `IMAGESET_VERSION`

#### Purging an image set

The `oist purge` command will trigger a purge request for all images in the set.

```
Usage: purge [options]

request each image in the image set to be purged from the Origami Image Service


Options:

  -s, --source-directory <dir>    The directory to look for source images in
  -c, --scheme <scheme>           The custom scheme to purge this image set under
  -v, --scheme-version <version>  The version to publish this image set under
  --image-service-api-key <key>   The API key used to communicate with the Origami Image Service
  -h, --help                      output usage information
```

#### Verify

The `oist verify` command checks all of the images in the set to ensure that they're valid.

```
Usage: oist verify [options]

  verify that images in the source directory are valid and have no issues

  Options:

    -h, --help                    output usage information
    -s, --source-directory <dir>  The directory to look for source images in
```

Options can also be set as environment variables:

  - `--source-directory` can be set with `IMAGESET_SOURCE_DIRECTORY`

### API Documentation

This library makes use of [promises], and provides a wrapper around part of [S3] – familiarity is assumed in the rest of the API documentation. You'll also need to require the module with:

```js
const OrigamiImageSetTools = require('@financial-times/origami-image-set-tools');
```

#### `new OrigamiImageSetTools( [options] )`

This function returns a new Origami Image Set Tools instance. You can configure the created tool set with [an options object](#options) if you need to override any defaults.

```js
const toolSet = new OrigamiImageSetTools({
    example: 'value'
});
```

#### `toolSet.buildImageSetManifest()`

This function returns a promise which resolves with a built image set manifest. This uses the `baseDirectory` and `sourceDirectory` [options](#options) to determine where to find images.

The image manifest has the following format:

```js
{
    // The directory the images were sourced from
    sourceDirectory: 'src',

    // The custom scheme the images should be stored
    // under in the Image Service
    scheme: 'ftexample',

    // A list of the found images
    images: [

        // The name, extension, and full path of each image
        {
            name: 'myimage',
            extension: 'svg',
            path: 'src/myimage.svg'
        }

    ]
}
```

#### `toolSet.buildLegacyImageSetManifest()`

This function returns a promise which resolves with a built legacy image set manifest. This is a stripped down version of the `buildImageSetManifest` method.

The legacy image manifest has the following format:

```js
{
    // A list of the found images
    images: [

        // The name of each image
        {
            name: 'myimage'
        }

    ]
}
```

#### `toolSet.buildImageSetManifestFile()`

This function returns a promise which builds image set information (using `buildImageSetManifest`) then saves it to a file as JSON.

This uses the `baseDirectory` and `sourceDirectory` [options](#options) to determine where to find images and where to save the file. The file will be created at `<baseDirectory>/imageset.json`.

#### `toolSet.buildLegacyImageSetManifestFile()`

This function returns a promise which builds legacy image set information (using `buildLegacyImageSetManifest`) then saves it to a file as JSON.

This uses the `baseDirectory` and `sourceDirectory` [options](#options) to determine where to find images and where to save the file. The file will be created at `<baseDirectory>/imageList.json`.

#### `toolSet.publishToS3( bucket )`

This function returns a promise which builds image set information (using `buildImageSetManifest`) then publishes each image to the given S3 bucket.

This uses the `awsAccessKey` and `awsSecretKey` [options](#options) to gain access to the bucket – these should grant write access.

The `scheme` and `version` options are also used to calculate where the images will be uploaded to. If `scheme` is set to `myscheme` and `version` is set to `v4.5.6`, then:

```
[LOCAL]/src/myimage.png === [S3]/myscheme/v4/myimage
```

#### `toolSet.verifyImages()`

This function returns a promise which verifies that each image in the set is valid.

This uses the `baseDirectory` and `sourceDirectory` [options](#options) to determine where to find images. If any verification fails, this method will reject with an error that has a `verificationErrors` property.

#### Options

The Origami Image Set Tools module can be configured with a variety of options, passed in as an object to the `OrigamiImageSetTools` function. The available options are as follows:

  - `awsAccessKey`: The AWS Access Key ID to use when publishing images to S3. Required when using the `publishToS3` method. Defaults to `null`
  - `awsSecretKey`: The AWS Secret Key to use when publishing images to S3. Required when using the `publishToS3` method. Defaults to `null`
  - `baseDirectory`: The base directory of the image set, where the manifest files sit. Image set JSON files will be created here. Defaults to the current working directory
  - `log`: A console object used to output non-request logs. Defaults to the global `console` object
  - `scheme`: The custom scheme to use when publishing to S3. This will dictate the folder structure of the S3 bucket. Defaults to `"noscheme"`
  - `sourceDirectory`: The directory relative to `baseDirectory` where the actual image files are located. Defaults to `"src"`
  - `version`: The version to use when publishing to S3. The major part of this version number will dictate the folder structure of the S3 bucket. Defaults to `"v0.0.0"`


Contributing
------------

This module has a full suite of unit and integration tests, and is verified with ESLint. You can use the following commands to check your code before opening a pull request.

```sh
make verify  # verify JavaScript code with ESLint
make test    # run the unit tests and check coverage
```

You'll need to provide `TEST_AWS_ACCESS_KEY` and `TEST_AWS_SECRET_KEY` environment variables in order to run integration tests. You may also provide a `TEST_AWS_BUCKET` variable to override the test bucket name.

You can find the AWS keys in the Origami shared LastPass folder under "Imageset S3 Bucket credentials" – be sure to use the development/QA ones!


Publishing
----------

New versions of the module are published automatically by CI when a new tag is created matching the pattern `/v.*/`.


Contact
-------

If you have any questions or comments about this module, or need help using it, please either [raise an issue][issues], visit [#ft-origami] or email [Origami Support].


Licence
-------

This software is published by the Financial Times under the [MIT licence][license].



[#ft-origami]: https://financialtimes.slack.com/messages/ft-origami/
[environment variables]: https://en.wikipedia.org/wiki/Environment_variable
[issues]: https://github.com/Financial-Times/origami-image-set-tools/issues
[license]: http://opensource.org/licenses/MIT
[node.js]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[origami support]: mailto:origami-support@ft.com
[promises]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise
[s3]: https://en.wikipedia.org/wiki/Amazon_S3
