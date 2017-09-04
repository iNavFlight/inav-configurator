'use strict';

var gulp = require('gulp');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var del = require('del');
var runSequence = require('run-sequence');
var NwBuilder = require('nw-builder');


// Each key in the *sources* variable must be an array of
// the source files that will be combined into a single
// file and stored in *outputDir*. Each key in *sources*
// must be also present in *output*, whose value indicates
// the filename for the output file which combines the
// contents of the source files.
//
// Keys must be camel cased and end with either 'Css' or
// 'Js' (e.g. someSourcesCss or someSourcesJs). For each
// key, a build task will be generated named by prepending
// 'build-' and converting the key to dash-separated words
// (e.g. someSourcesCss will generate build-some-sources-css).
//
// Tasks with names ending with '-js' will be executed by the
// build-all-js task, while the ones ending with '-css' will
// be done by build-all-css. There's also a build task which
// runs both build-all-css and build-all-js.
//
// The watch task will monitor any files mentioned in the *sources*
// variable and regenerate the corresponding output file when
// they change.
//
// See README.md for details on the other tasks.

var sources = {};

sources.css = [
    './main.css',
    './js/libraries/jquery.nouislider.min.css',
    './js/libraries/jquery.nouislider.pips.min.css',
    './js/libraries/flightindicators.css',
    './src/css/tabs/*.css',
    './src/css/opensans_webfontkit/fonts.css',
    './src/css/font-awesome/css/font-awesome.css',
    './src/css/dropdown-lists/css/style_lists.css',
    './js/libraries/switchery/switchery.css',
    './js/libraries/jbox/jBox.css'
];

sources.js = [
    './js/libraries/google-analytics-bundle.js',
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/jquery-ui-npm/jquery-ui.min.js',
    './js/libraries/d3.min.js',
    './js/libraries/jquery.nouislider.all.min.js',
    './node_modules/three/three.min.js',
    './js/libraries/Projector.js',
    './js/libraries/CanvasRenderer.js',
    './js/libraries/jquery.flightindicators.js',
    './js/libraries/semver.js',
    './js/libraries/jbox/jBox.min.js',
    './js/libraries/switchery/switchery.js',
    './js/libraries/jquery.ba-throttle-debounce.js',
    './node_modules/inflection/inflection.min.js',
    './node_modules/bluebird/js/browser/bluebird.min.js',
    './js/injected_methods.js',
    './js/intervals.js',
    './js/timeouts.js',
    './js/pid_controller.js',
    './js/simple_smooth_filter.js',
    './js/walking_average_filter.js',
    './js/gui.js',
    './js/msp/MSPCodes.js',
    './js/msp/MSPHelper.js',
    './js/msp/MSPchainer.js',
    './js/port_handler.js',
    './js/serial.js',
    './js/model.js',
    './js/serial_backend.js',
    './js/data_storage.js',
    './js/fc.js',
    './js/msp.js',
    './js/protocols/stm32.js',
    './js/protocols/stm32usbdfu.js',
    './js/localization.js',
    './js/boards.js',
    './js/tasks.js',
    './main.js',
    './tabs/*.js',
    './js/eventFrequencyAnalyzer.js',
    './js/periodicStatusUpdater.js',
    './js/serial_queue.js',
    './js/msp_balanced_interval.js',
    './tabs/advanced_tuning.js',
    './js/peripherals.js'
];

sources.mapCss = [
    './node_modules/openlayers/dist/ol.css'
];

sources.mapJs = [
    './node_modules/openlayers/dist/ol.js'
];

sources.receiverCss = [
    './css/opensans_webfontkit/fonts.css',
    './js/libraries/jquery.nouislider.min.css',
    './js/libraries/jquery.nouislider.pips.min.css',
    './tabs/receiver_msp.css'
];

sources.receiverJs = [
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/jquery-ui-npm/jquery-ui.min.js',
    './js/libraries/jquery.nouislider.all.min.js',
    './tabs/receiver_msp.js'
];

sources.hexParserJs = [
    './js/workers/hex_parser.js',
];

var output = {
    css: 'styles.css',
    js: 'script.js',
    mapCss: 'map.css',
    mapJs: 'map.js',
    receiverCss: 'receiver-msp.css',
    receiverJs: 'receiver-msp.js',
    hexParserJs: 'hex_parser.js',
};


var outputDir = './build/';
var distDir = './dist/';

function get_task_name(key) {
    return 'build-' + key.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
}

// Define build tasks dynamically based on the sources
// and output variables.
var buildCssTasks = [];
var buildJsTasks = [];
(function() {
    // Convers fooBarBaz to foo-bar-baz
    for (var k in output) {
        (function (key) {
            var name = get_task_name(key);
            if (name.endsWith('-css')) {
                buildCssTasks.push(name);
            } else if (name.endsWith('-js')) {
                buildJsTasks.push(name);
            } else {
                throw 'Invalid task name: "' + name + '": must end with -css or -js';
            }
            gulp.task(name, function() {
                return gulp.src(sources[key])
                    .pipe(concat(output[key]))
                    .pipe(gulp.dest(outputDir));
            });
        })(k);
    }
})();

gulp.task('build-all-js', buildJsTasks);
gulp.task('build-all-css', buildCssTasks);
gulp.task('build', ['build-all-css', 'build-all-js']);

gulp.task('clean', function() { return del(['./build/**', './dist/**'], {force: true}); });

// Real work for dist task. Done in another task to call it via
// run-sequence.
gulp.task('dist-build', ['build'], function() {
    var distSources = [
        './package.json', // For NW.js
        './manifest.json', // For Chrome app
        './eventPage.js',
        './*.html',
        './tabs/*.html',
        './images/**/*',
        './_locales/**/*',
        './build/*',
        './src/css/font-awesome/fonts/*',
        './src/css/opensans_webfontkit/*.{eot,svg,ttf,woff,woff2}',
        './resources/models/*',
        './resources/osd/*.mcm',
        './resources/motor_order/*.svg',
    ];
    return gulp.src(distSources, { base: '.' })
        .pipe(gulp.dest(distDir));
});

gulp.task('dist', function() {
    return runSequence('clean', 'dist-build');
});

// Create app packages in ./apps
gulp.task('release', ['dist'], function(done) {
    var builder = new NwBuilder({
        files: './dist/**/*',
        buildDir: './apps',
        platforms: ['win32', 'osx64', 'linux64'],
        flavor: 'normal',
        macIcns: './images/inav.icns',
    });
    builder.on('log', console.log);
    builder.build(function (err) {
        if (err) {
            console.log("Error building NW apps:" + err);
        }
        done();
    });
});

gulp.task('watch', function () {
    for(var k in output) {
        gulp.watch(sources[k], [get_task_name(k)]);
    }
});

gulp.task('default', ['build']);
