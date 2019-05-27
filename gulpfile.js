'use strict';

var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var minimist = require('minimist');

var archiver = require('archiver');
var del = require('del');
var NwBuilder = require('nw-builder');

var gulp = require('gulp');
var concat = require('gulp-concat');

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
    './js/libraries/jbox/jBox.css',
    './node_modules/openlayers/dist/ol.css',
    './src/css/logic.css'
];

sources.js = [
    './js/libraries/google-analytics-bundle.js',
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/jquery-ui-npm/jquery-ui.min.js',
    './node_modules/marked/lib/marked.js',
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
    './js/helpers.js',
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
    './js/servoMixRule.js',
    './js/motorMixRule.js',
    './js/logicCondition.js',
    './js/settings.js',
    './js/outputMapping.js',
    './js/model.js',
    './js/serial_backend.js',
    './js/data_storage.js',
    './js/fc.js',
    './js/msp.js',
    './js/protocols/stm32.js',
    './js/protocols/stm32usbdfu.js',
    './js/localization.js',
    './js/boards.js',
    './js/servoMixerRuleCollection.js',
    './js/motorMixerRuleCollection.js',
    './js/logicConditionsCollection.js',
    './js/vtx.js',
    './main.js',
    './tabs/*.js',
    './js/eventFrequencyAnalyzer.js',
    './js/periodicStatusUpdater.js',
    './js/serial_queue.js',
    './js/msp_balanced_interval.js',
    './tabs/advanced_tuning.js',
    './js/peripherals.js',
    './js/appUpdater.js',
    './node_modules/openlayers/dist/ol.js'
];

sources.receiverCss = [
    './src/css/tabs/receiver_msp.css',
    './src/css/opensans_webfontkit/fonts.css',
    './js/libraries/jquery.nouislider.min.css',
    './js/libraries/jquery.nouislider.pips.min.css',
];

sources.receiverJs = [
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/jquery-ui-npm/jquery-ui.min.js',
    './js/libraries/jquery.nouislider.all.min.js',
    './tabs/receiver_msp.js'
];

sources.debugTraceJs = [
    './js/debug_trace.js'
];

sources.hexParserJs = [
    './js/workers/hex_parser.js',
];

var output = {
    css: 'styles.css',
    js: 'script.js',
    receiverCss: 'receiver-msp.css',
    receiverJs: 'receiver-msp.js',
    debugTraceJs: 'debug-trace.js',
    hexParserJs: 'hex_parser.js',
};


var outputDir = './build/';
var distDir = './dist/';
var appsDir = './apps/';

function get_task_name(key) {
    return 'build-' + key.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
}

function getPlatforms() {
    var defaultPlatforms = ['win32', 'win64', 'osx64', 'linux32', 'linux64'];
    var argv = minimist(process.argv.slice(2));
    if (argv.platform) {
        if (defaultPlatforms.indexOf(argv.platform) < 0) {
            throw "Invalid platform '" + argv.platform + "'. Available ones are: " + defaultPlatforms;
        }
        return [argv.platform];
    }
    return defaultPlatforms;
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

gulp.task('build-all-js', gulp.parallel(buildJsTasks))
gulp.task('build-all-css', gulp.parallel(buildCssTasks));
gulp.task('build', gulp.parallel('build-all-css', 'build-all-js'));

gulp.task('clean', function() { return del(['./build/**', './dist/**'], {force: true}); });

// Real work for dist task. Done in another task to call it via
// run-sequence.
gulp.task('dist-build', gulp.series('build', function() {
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
        './resources/*.json',
        './resources/models/*',
        './resources/osd/*.mcm',
        './resources/motor_order/*.svg',
    ];
    return gulp.src(distSources, { base: '.' })
        .pipe(gulp.dest(distDir));
}));

gulp.task('dist',  gulp.series('clean', 'dist-build'));

// Create app directories in ./apps
gulp.task('apps', gulp.series('dist', function(done) {
    var builder = new NwBuilder({
        files: './dist/**/*',
        buildDir: appsDir,
        platforms: getPlatforms(),
        flavor: 'normal',
        macIcns: './images/inav.icns',
        winIco: './images/inav.ico',
    });
    builder.on('log', console.log);
    builder.build(function (err) {
        if (err) {
            console.log("Error building NW apps:" + err);
            done();
            return;
        }
        // Package apps as .zip files
        done();
    });
}));

function get_release_filename(platform, ext) {
    var pkg = require('./package.json');
    return 'INAV-Configurator_' + platform + '_' + pkg.version + '.' + ext;
}

gulp.task('release-win32', function() {
    var pkg = require('./package.json');
    var src = path.join(appsDir, pkg.name, 'win32');
    var output = fs.createWriteStream(path.join(appsDir, get_release_filename('win32', 'zip')));
    var archive = archiver('zip', {
        zlib: { level: 9 }
    });
    archive.on('warning', function(err) { throw err; });
    archive.on('error', function(err) { throw err; });
    archive.pipe(output);
    archive.directory(src, 'INAV Configurator');
    return archive.finalize();
});

gulp.task('release-win64', function() {
    var pkg = require('./package.json');
    var src = path.join(appsDir, pkg.name, 'win64');
    var output = fs.createWriteStream(path.join(appsDir, get_release_filename('win64', 'zip')));
    var archive = archiver('zip', {
        zlib: { level: 9 }
    });
    archive.on('warning', function(err) { throw err; });
    archive.on('error', function(err) { throw err; });
    archive.pipe(output);
    archive.directory(src, 'INAV Configurator');
    return archive.finalize();
});

gulp.task('release-osx64', function() {
    var pkg = require('./package.json');
    var src = path.join(appsDir, pkg.name, 'osx64', pkg.name + '.app');
    // Check if we want to sign the .app bundle
    if (process.env.CODESIGN_IDENTITY) {
        var sign_cmd = 'codesign --verbose --force --sign "' + process.env.CODESIGN_IDENTITY + '" ' + src;
        child_process.execSync(sign_cmd);
    }
    var output = fs.createWriteStream(path.join(appsDir, get_release_filename('macOS', 'zip')));
    var archive = archiver('zip', {
        zlib: { level: 9 }
    });
    archive.on('warning', function(err) { throw err; });
    archive.on('error', function(err) { throw err; });
    archive.pipe(output);
    archive.directory(src, 'INAV Configurator.app');
    return archive.finalize();
});

function releaseLinux(bits) {
    return function() {
        var dirname = 'linux' + bits;
        var pkg = require('./package.json');
        var src = path.join(appsDir, pkg.name, dirname);
        var output = fs.createWriteStream(path.join(appsDir, get_release_filename(dirname, 'zip')));
        var archive = archiver('zip', {
            zlib: { level: 9 }
        });
        archive.on('warning', function(err) { throw err; });
        archive.on('error', function(err) { throw err; });
        archive.pipe(output);
        archive.directory(src, 'INAV Configurator');
        return archive.finalize();
    }
}

gulp.task('release-linux32', releaseLinux(32));
gulp.task('release-linux64', releaseLinux(64));

// Create distributable .zip files in ./apps
gulp.task('release', gulp.series('apps',  getPlatforms().map(function(v) { return 'release-' + v; })));

gulp.task('watch', function () {
    for(var k in output) {
        gulp.watch(sources[k], gulp.series(get_task_name(k)));
    }
});

gulp.task('default', gulp.series('build'));
