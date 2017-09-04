'use strict';

var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var minifyCSS = require('gulp-minify-css');
var del = require('del');
var runSequence = require('run-sequence');
var NwBuilder = require('nw-builder');

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

var output = {
    css: 'styles.css',
    js: 'script.js',
    mapCss: 'map.css',
    mapJs: 'map.js',
    receiverCss: 'receiver-msp.css',
    receiverJs: 'receiver-msp.js',
};

var outputDir = './build/';
var distDir = './dist/';

gulp.task('build-css', function () {

    return gulp.src(sources.css)
        .pipe(concat(output.css))
        .pipe(gulp.dest(outputDir));
});

gulp.task('build-js', function () {

    return gulp.src(sources.js)
        .pipe(concat(output.js))
        .pipe(gulp.dest(outputDir));
});

gulp.task('build-map-css', function () {

    return gulp.src(sources.mapCss)
        .pipe(concat(output.mapCss))
        .pipe(gulp.dest(outputDir));
});

gulp.task('build-map-js', function () {

    return gulp.src(sources.mapJs)
        .pipe(concat(output.mapJs))
        .pipe(gulp.dest(outputDir));
});

gulp.task('build-receiver-css', function () {

    return gulp.src(sources.receiverCss)
        .pipe(concat(output.receiverCss))
        .pipe(gulp.dest(outputDir));
});

gulp.task('build-receiver-msp-js', function () {

    return gulp.src(sources.receiverJs)
        .pipe(concat(output.receiverJs))
        .pipe(gulp.dest(outputDir));
});

gulp.task('build-all-js', ['build-js', 'build-receiver-msp-js', 'build-map-js']);
gulp.task('build-all-css', ['build-css', 'build-receiver-css', 'build-map-css']);
gulp.task('build', ['build-all-css', 'build-all-js']);

function get_outputs(ext) {
    var src = [];
    for (var k in output) {
        var val = output[k];
        if (val.endsWith('.' + ext)) {
            src.push(outputDir + val);
        }
    }
    return src;
}

gulp.task('minify-js', ['build-all-js'], function () {
    return gulp.src(get_outputs('js'))
        .pipe(uglify())
        .pipe(gulp.dest(outputDir));
});

gulp.task('minify-css', ['build-all-css'], function () {
    return gulp.src(get_outputs('css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest(outputDir));
});

gulp.task('minify', ['minify-css', 'minify-js']);

gulp.task('clean', function() { return del(['./build/**', './dist/**'], {force: true}); });

// Real work for dist task. Done in another task to call it via
// run-sequence.
gulp.task('dist-build', ['minify'], function() {
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
        './js/workers/hex_parser.js',
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
    gulp.watch('js/**/*.js', ['build-js']);
    gulp.watch('css/*.css', ['build-css']);
    gulp.watch('main.css', ['build-css']);
    gulp.watch('main.js', ['build-js']);
    gulp.watch('tabs/*.js', ['build-js']);
    gulp.watch('tabs/*.css', ['build-css']);
    gulp.watch('eventPage.js', ['build-js']);
});

gulp.task('default', ['build']);
