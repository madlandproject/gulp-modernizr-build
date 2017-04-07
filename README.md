Gulp Modernizr Build
====================
> Build custom Modernizr.js file 

## Description ##
Build Modernizr with Gulp. This plugin scans input files for references to Modernizr feature detects (only on the `Modernizr` object in JS and only after on a `html` element selector in CSS) and builds a custom modernizr build with only the necessary detections.

## Install ##

Install the plugin with NPM:
`npm install --save gulp-modernizr-build`

Require it in your `gulpfile.js`:
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
The plugin function accepts two parameters. The file name and a config object with the following properties:

- `file`
    
    Name of the output file.

- `cssPrefix`
    
    Prefix for CSS classes applied to the `<html />` element
    

## Todo ##
- Tests

    * Include references to every feature in JS and CSS to check they are detected correctly

- Better documentation.