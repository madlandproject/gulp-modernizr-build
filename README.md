Gulp Modernizr Build
====================
> Build custom Modernizr.js file 

## Description ##
Build Modernizr with Gulp. This plugin scans input files for references to Modernizr feature detects (only on the `Modernizr` object in JS and only on a `html` element selector in CSS) and builds a custom Modernizr build with only the necessary detections.

## Install ##

Install the plugin with NPM:
`npm install --save gulp-modernizr-build`

Require it in your gulpfile:

`const modernizr = require('gulp-modernizr-build')`


## Usage ##

```javascript

gulp.src([ 
    './**/*.js',
    './**/*.css',
    '!./**/modernizr*.js']) // Don't forget to exclude any other Modernizr files you may have in your sources.
    .pipe( modernizr('modernizr.js', {
        cssPrefix   : 'feat-'
    })
    .pipe( uglify() ); // this plugin won't do it for  you.

```

## Config
The plugin function accepts two parameters: The file name and a config object with the following properties:

- `cssPrefix`
    
    Prefix for CSS classes applied to the `<html />` element

- `quiet`
    
    Supress console output
    
## Testing
Testing is done with Mocha and Chai : 

`npm test`

## Contributors
Thank you to following people for contributing to this plugin.

- Danielle McLean ([@00dani](https://github.com/00dani))

## Changelog
- 0.0.4 - Added LESS and Stylus file extensions for CSS detection. added quiet option. Added basic tests.
- 0.0.3 - Bug fixes for RegExp objects (#1, #2). Updated README.
- 0.0.2 - Removed unwanted files from NPM.
- 0.0.1 - The plugin was born.

## Todo ##
- Accept an `allFeatures` parameter to build every available feature detection. Useful for building dev versions of Modernizr.
- Accept a `addFeatures` parameter to force addition of features manually
- Add .editorconfig file & lintconfig for consistency
- Tests

    * Include references to every feature in JS and CSS to check they are detected correctly
    * Test for false positives with sub-features (video & videoautoplay for example)

- Better documentation.
- Generate compatibility report based on [CanIUse](https://github.com/ben-eb/caniuse-lite) support and [Browserslist](https://github.com/ai/browserslist).