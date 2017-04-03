#!/usr/bin/env node

// Imports
const Modernizr = require('modernizr');
const through = require('through2');
const gutil = require('gulp-util');
const defaults = require('lodash.defaults');

// hidden vars
let _metadataCache;

const defaultConfig = {
    cssPrefix : null,
    file : 'modernizr.js',
    options : [

        /*
            For reference below : the list of options supported by Modernizr
        */

        // "addTest",
        // "atRule",
        // "domPrefixes",
        // "hasEvent",
        // "html5shiv",
        // "html5printshiv",
        // "load",
        // "mq",
        // "prefixed",
        // "prefixes",
        // "prefixedCSS",
        // "setClasses",
        // "testAllProps",
        // "testProp",
        // "testStyles"
    ]
};

// Modernizr helpers
function getMetadata() {
    return new Promise(function (resolve, reject) {
        if (_metadataCache) {
            resolve(_metadataCache)
        } else {
            Modernizr.metadata((metadata) => {
                _metadataCache = metadata; // cache metadata
                resolve(metadata);
            });
        }
    });
}

// File helpers
const JS_FILE_REGEX = /\.(js|coffee|ts|jsx)$/i;
function isJsFile(file) {
    return JS_FILE_REGEX.test(file.path);
}

const CSS_FILE_REGEX = /\.(css|scss|sass)$/i;
function isCSSFile(file) {
    return CSS_FILE_REGEX.test(file.path);
}


/*

 Gulp transform instance

 */
module.exports = function (buildConfig) {

    let outputFile;
    let detectedFeatures = [];

    let _featureCache = {};

    // add defaults to the config
    defaults(buildConfig, defaultConfig);

    function searchFile(file, encoding, cb) {

        // save a copy of the contents to a string
        const fileContents = file.contents.toString();

        getMetadata().then(features => {

            features.forEach( feature => {

                // return early if this feature has already been detected
                if ( _featureCache[feature.property] ) {
                    return;
                }

                // start pessimistic
                let featureUsed = false;

                if (isJsFile(file)) {
                    // always treat as an array
                    let properties = Array.isArray(feature.property) ? feature.property : [feature.property];

                    featureUsed = properties.some( property => {
                        // Create regex for property in JS
                        let jsPropRegex = new RegExp(`(Modernizr)(\\.|\\[('|"))${property}(('|")\\])?\\W`, 'im');
                        return jsPropRegex.test(fileContents);
                    });

                } else if (isCSSFile(file)) {

                    let classes = Array.isArray(feature.cssclass) ? feature.cssclass : [feature.cssclass];

                    featureUsed = classes.some( cssclass => {
                        let cssPropRegex;
                        cssPropRegex = (buildConfig.cssPrefix) ? new RegExp(`html\\.(${buildConfig.cssPrefix})(no-)${cssclass}`, 'im') : new RegExp(`html\\.(no-)?${cssclass}`, 'im');
                        return cssPropRegex.test(fileContents);
                    });

                }

                if (featureUsed) {
                    _featureCache[ feature.property ] = true;
                    detectedFeatures.push( feature );
                }
            });

            cb();
        });


    }

    function buildModernizr(cb) {

        // get path from feature
        let featurePaths = detectedFeatures.map( feature => feature.path.replace(/\.?\/?feature-detects\/([a-z-\/]+)\.js/, "$1") );

        // Output start message
        gutil.log( 'Detected features : ', gutil.colors.grey( featurePaths.join(', ') ) );

        // assemble modernizr config
        let modernirConfig = {
            classPrefix : buildConfig.cssPrefix,
            options: buildConfig.options,
            "feature-detects" : featurePaths
        };

        Modernizr.build( modernirConfig, (buildResult) => {

            outputFile = new gutil.File({
                path: buildConfig.file,
                contents: new Buffer( buildResult )
            });

            this.push(outputFile);
            cb();

        });

    }

    // return transform for gulp
    return through.obj(searchFile, buildModernizr);

};
