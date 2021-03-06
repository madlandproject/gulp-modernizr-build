#!/usr/bin/env node

// Imports
const Modernizr = require('modernizr');
const through = require('through2');

const log = require('fancy-log');
const colors = require('ansi-colors');
const File = require('vinyl');

const defaults = require('lodash.defaults');

// hidden vars
const PLUGIN_NAME = 'gulp-modernizr-build';

// Store Modernizr metadata to avoid fetching it for every file
let _metadataCache;

const defaultConfig = {
    cssPrefix: null,
    file: 'modernizr.js',
    options: [
        'setClasses', // Set classes is enabled by default

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
    ],
    quiet: false
};

// Modernizr helpers
function getMetadata() {
    return new Promise(function (resolve, reject) {
        if (_metadataCache) {
            resolve(_metadataCache)
        } else {
            Modernizr.metadata((metadata) => {
                if (!metadata) {
                    reject( new Error("Modernizr didn't return any metadata" ) );
                }

                _metadataCache = metadata; // cache metadata
                resolve(metadata);
            });
        }
    });
}

// File helpers
// detect JS files
const JS_FILE_REGEX = /\.(js|coffee|ts|jsx)$/i;
function isJsFile(file) {
    return JS_FILE_REGEX.test(file.path);
}

// Detect style files
const CSS_FILE_REGEX = /\.(css|scss|sass|styl|less)$/i;
function isCSSFile(file) {
    return CSS_FILE_REGEX.test(file.path);
}


/*

 Gulp transform instance

 */
module.exports = function (fileName, buildConfig = {}) {

    let detectedFeatures = [];

    let _featureCache = {};

    // add defaults to the config
    defaults(buildConfig, defaultConfig);

    function searchFile(file, encoding, cb) {

        // Detect stream files
        if (file.isStream()) {
            this.emit('error', new Error('gulp-modernizr-build does not support streams'));
        }

        // save a copy of the contents to a string
        const fileContents = file.contents.toString();

        getMetadata().then(features => {

            features.forEach(feature => {

                // return early if this feature has already been detected
                // TODO see how nested property arrays do with this
                if (_featureCache[feature.property]) {
                    return;
                }

                // start pessimistic
                let featureUsed = false;

                if (isJsFile(file)) {
                    // always treat property as an array of properties
                    let properties = Array.isArray(feature.property) ? feature.property : [feature.property];

                    featureUsed = properties.some(property => {
                        // Create regex for property in JS
                        let jsPropRegex = new RegExp(`(Modernizr)(\\.|\\[('|"))${property}(('|")\\])?\\W`, 'im');
                        return jsPropRegex.test(fileContents);
                    });

                } else if (isCSSFile(file)) {

                    // always treat class an array of classes
                    let classes = Array.isArray(feature.cssclass) ? feature.cssclass : [feature.cssclass];

                    featureUsed = classes.some(cssClass => {
                        let cssPropRegex;
                        cssPropRegex = (buildConfig.cssPrefix) ? new RegExp(`html\\.(${buildConfig.cssPrefix})(no-)?${cssClass}`, 'im') : new RegExp(`html\\.(no-)?${cssClass}`, 'im');
                        return cssPropRegex.test(fileContents);
                    });

                }

                if (featureUsed) {
                    _featureCache[feature.property] = true;
                    detectedFeatures.push(feature);
                }
            });


            cb();
        }, (metadataError) => {
            log.error('Error : ', metadataError);
        });


    }

    function buildModernizr(cb) {

        // get path from feature
        let featurePaths = detectedFeatures.map(feature => feature.path.replace(/\.?\/?feature-detects\/([a-z-0-9\/]+)\.js/, "$1"));

        // Output start message
        if (!buildConfig.quiet) {
            // log detected features
            log('Detected features:');

            if (detectedFeatures.length === 0) {
                log(colors.dim( colors.red('No features were detected')) );
            } else {
                log(featurePaths.map(feat => colors.yellow(feat)).join(', '));
            }

        }

        // added features if needed
        if (buildConfig.addFeatures && typeof Array.isArray(buildConfig.addFeatures)) {

            featurePaths = featurePaths.concat( buildConfig.addFeatures );

            // Log if needed
            if (!buildConfig.quiet) {
                log('Added features :');
                log(buildConfig.addFeatures.map(feat => colors.yellow(feat)).join(', '))
            }

        }

        // assemble modernizr config
        let modernirzConfig = {
            classPrefix: buildConfig.cssPrefix,
            options: buildConfig.options,
            "feature-detects": featurePaths
        };

        if (!buildConfig.quiet) {
            log('Building Modernizr with these additional options :');

            // Log extra options
            log( buildConfig.options.map( option => colors.yellow(option) ).join(', ') );

            // Log CSS prefix if one has been specified
            if (buildConfig.cssPrefix && typeof buildConfig.cssPrefix === 'string') {
                log('CSS class prefix: ', '"' + colors.yellow(buildConfig.cssPrefix) + '"');
            }

        }

        // Start modernizr custom build
        Modernizr.build(modernirzConfig, (buildResult) => {
            let outputFile = new File({
                path: fileName,
                contents: new Buffer(buildResult)
            });

            // used for testing
            if (buildConfig.debug) {
                outputFile.features = detectedFeatures;
                outputFile.config = modernirzConfig;
            }

            this.push(outputFile);
            cb();

        });

    }

    // return transform for gulp
    return through.obj(searchFile, buildModernizr);

};
