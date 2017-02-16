'use strict';

// This is a proposed new JSON format for Origami image sets.
// We'd need to update both the registry and o-icons if repos
// start to use this. I'd suggest changing the file name to,
// maybe to "imageset.json"
//
// I've tried to keep the basic format as similar as possible,
// so there may not be much to change

{
	// The directory in this repo that images
	// should be sourced from
	"sourceDirectory": "src",

	// A list of the images
	"images": [

		// Each item in here would comply with
		// this format:
		{
			// The name, extension, and full path
			// of the image
			"name": "myimage",
			"extension": "svg",
			"path": "src/myimage.svg"
		}

	]
}
