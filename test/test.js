#!/bin/env node

// Import gulp to define tasks
const gulp = require('gulp');
const gdebug = require('gulp-debug');
const through = require('through2');

const capcon = require('capture-console');

// Import testing tools
const mocha = require('mocha');
const chai = require('chai');
const chaiArrays = require('chai-arrays');

// Setup chai
const expect = chai.expect;
chai.use( chaiArrays );

// Import our code
const modernizr = require('../src/index');

// other vars

// Threshold for whiwh Modernizr build is considered slow
const BUILD_TIME = 1000;

/*

Info from out mock src files

 */

const simpleJsFeatures = ['indexeddb', 'json', 'touchevents'];
const complexJsFeatures = ['localstorage', 'geolocation'];


/*

Tests suites

 */

describe('Loading plugin', function() {

    it('Should load the plugin module', function() {
        expect(modernizr).to.exist;
    });

    it('Should return a transform stream', function()  {
        const transform = modernizr('test.js');
        expect( transform.read ).to.be.a('function');
        expect( transform.write ).to.be.a('function');
    });

});


describe('Output creation', function() {

    it('Should create a file with the proper output name', function(done) {

        this.slow(BUILD_TIME);

        const testName = 'testfilename.js';

        gulp.src( `${__dirname}/mock-src/js/simple.js` )
            .pipe( modernizr( testName, {debug: true, quiet: true} ) )
            .pipe( through.obj(null, (file) => {
                expect( file.path ).to.be.string( testName );
                done();
            }));

    });

});

describe('Detected output features', function() {


    it('Should attach features array to file when debug option is set', function(done) {

        this.slow(BUILD_TIME);
        const testName = 'testfilename.js';
        gulp.src( `${__dirname}/mock-src/js/simple.js` )
            .pipe( modernizr( testName, {debug: true, quiet: true} ) )
            .pipe( through.obj(null, (file) => {

                expect( file.features ).to.be.array;
                done();
            }));

    });

});

describe('Simple JS detection', function () {


    it('Should detect simple expressions from JS', function(done) {

        this.slow(BUILD_TIME);
        const testName = 'testfilename.js';
        gulp.src( `${__dirname}/mock-src/js/simple.js` )
            .pipe( modernizr( testName, {debug: true, quiet: true} ) )
            .pipe( through.obj(null, (file) => {
                let featureProperties = file.features.map( feature => feature.property );

                expect( featureProperties).to.be.of.length( simpleJsFeatures.length );
                expect( featureProperties ).to.be.containingAllOf( simpleJsFeatures );

                done();
            }));

    });

    it('Should detect complex expression from JS', function(done) {

        this.slow(BUILD_TIME);
        const testName = 'testfilename.js';
        gulp.src( `${__dirname}/mock-src/js/complex.js` )
            .pipe( modernizr( testName, {debug: true, quiet: true} ) )
            .pipe( through.obj(null, (file) => {
                let featureProperties = file.features.map( feature => feature.property );

                expect( featureProperties).to.be.of.length( complexJsFeatures.length );
                expect( featureProperties ).to.be.containingAllOf( complexJsFeatures );

                done();
            }));

    });

});


describe('Output options', function() {

    let output = '';

    it('Should NOT display output with quiet option set to true', function(done) {

        // redirect console to our variable
        capcon.startIntercept( process.stdout, (stdout) => {
            output += stdout;
        });

        this.slow(BUILD_TIME);
        const testName = 'testfilename.js';
        gulp.src( `${__dirname}/mock-src/js/no-features.js` )
            .pipe( modernizr( testName, {debug: true, options: ['setClasses', 'html5shiv'], quiet: true} ) )
            .pipe( through.obj(null, (file) => {
                capcon.stopIntercept(process.stdout);

                expect( output ).to.have.lengthOf(0);
                output = '';

                done();
            }));

    });

    it('Should display output with quiet option set to false', function(done) {

        // redirect console to our variable
        capcon.startIntercept( process.stdout, (stdout) => {
            output += stdout;
        });

        this.slow(BUILD_TIME);
        const testName = 'testfilename.js';
        gulp.src( `${__dirname}/mock-src/js/no-features.js` )
            .pipe( modernizr( testName, {debug: true, options: ['setClasses', 'html5shiv'], quiet: false} ) )
            .pipe( through.obj(null, (file) => {
                capcon.stopIntercept(process.stdout);

                expect( output ).to.have.lengthOf.above(0);
                output = '';

                done();
            }));

    });

    it('Should warn user nothing was detected', function(done) {

        // redirect console to our variable
        capcon.startIntercept( process.stdout, (stdout) => {
            output += stdout;
        });

        this.slow(BUILD_TIME);
        const testName = 'testfilename.js';
        gulp.src( `${__dirname}/mock-src/js/no-features.js` )
            .pipe( modernizr( testName, {debug: true, options: ['setClasses', 'html5shiv'], quiet: false} ) )
            .pipe( through.obj(null, (file) => {
                capcon.stopIntercept(process.stdout);

                expect( file.features ).to.have.lengthOf(0);
                expect( output ).to.include('No features were detected');

                output = '';

                done();
            }));

    });


});