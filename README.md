
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

Running the Origami Set module requires [Node.js] 6.x and [npm]. You can install with:

```sh
npm install @financial-times/origami-image-set-tools
```

### Command-Line Interface

This module exposes an `oist` command which can be used to manage image sets from the command line:

```
Usage: oist [options] [command]


Commands:

  build-manifest [options]   build an image set manifest file and save to "imageset.json"
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

#### `toolSet.buildImageSetManifestFile()`

This function returns a promise which builds image set information (using `buildImageSetManifest`) then saves it to a file as JSON.

This uses the `baseDirectory` and `sourceDirectory` [options](#options) to determine where to find images and where to save the file. The file will be created at `<baseDirectory>/imageset.json`.

#### `toolSet.publishToS3( bucket )`

This function returns a promise which builds image set information (using `buildImageSetManifest`) then publishes each image to the given S3 bucket.

This uses the `awsAccessKey` and `awsSecretKey` [options](#options) to gain access to the bucket – these should grant write access.

The `scheme` and `version` options are also used to calculate where the images will be uploaded to. If `scheme` is set to `myscheme` and `version` is set to `v4.5.6`, then:

```
[LOCAL]/src/myimage.png === [S3]/myscheme/v4/myimage.png
```

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

This module has a full suite of unit tests, and is verified with ESLint. You can use the following commands to check your code before opening a pull request.

```sh
make verify  # verify JavaScript code with ESLint
make test    # run the unit tests and check coverage
```

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
