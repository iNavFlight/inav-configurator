var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var minifyCSS = require('gulp-minify-css');

var sources = {};

sources.css = [
    './main.css',
    './js/libraries/jquery.nouislider.min.css',
    './js/libraries/jquery.nouislider.pips.min.css',
    './js/libraries/flightindicators.css',
    './tabs/*.css',
    './css/opensans_webfontkit/fonts.css',
    './css/dropdown-lists/css/style_lists.css',
    './js/libraries/switchery/switchery.css',
    './js/libraries/jbox/jBox.css'
];

sources.receiver = [
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/jquery-ui-npm/jquery-ui.min.js',
    './js/libraries/jquery.nouislider.all.min.js',
    './tabs/receiver_msp.js'
];

sources.receiverCss = [
    './css/opensans_webfontkit/fonts.css',
    './js/libraries/jquery.nouislider.min.css',
    './js/libraries/jquery.nouislider.pips.min.css',
    './tabs/receiver_msp.css'
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
    './tabs/advanced_tuning.js'
];

sources.mapJs = [
    './node_modules/openlayers/dist/ol.js'
];

sources.mapCss = [
    './node_modules/openlayers/dist/ol.css'
];

gulp.task('build-css', function () {

    return gulp.src(sources.css)
        .pipe(concat('styles.css'))
        .pipe(gulp.dest('./build/'));
});

gulp.task('build-js', function () {

    return gulp.src(sources.js)
        .pipe(concat('script.js'))
        .pipe(gulp.dest('./build/'));
});

gulp.task('build-map-css', function () {

    return gulp.src(sources.mapCss)
        .pipe(concat('map.css'))
        .pipe(gulp.dest('./build/'));
});

gulp.task('build-map-js', function () {

    return gulp.src(sources.mapJs)
        .pipe(concat('map.js'))
        .pipe(gulp.dest('./build/'));
});

gulp.task('deploy-css', function () {

    return gulp.src(sources.css)
        .pipe(concat('styles.css'))
        .pipe(minifyCSS())
        .pipe(gulp.dest('./build/'));
});

gulp.task('deploy-js', function () {

    return gulp.src(sources.js)
        .pipe(concat('script.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./build/'));
});

gulp.task('build-receiver-css', function () {

    return gulp.src(sources.receiverCss)
        .pipe(concat('receiver-msp.css'))
        .pipe(gulp.dest('./build/'));
});

gulp.task('deploy-receiver-css', function () {

    return gulp.src(sources.receiverCss)
        .pipe(concat('receiver-msp.css'))
        .pipe(uglify())
        .pipe(gulp.dest('./build/'));
});

gulp.task('build-receiver-msp-js', function () {

    return gulp.src(sources.receiver)
        .pipe(concat('receiver-msp.js'))
        .pipe(gulp.dest('./build/'));
});

gulp.task('deploy-receiver-msp-js', function () {

    return gulp.src(sources.receiver)
        .pipe(concat('receiver-msp.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./build/'));
});

gulp.task('deploy', ['deploy-css', 'deploy-js', 'deploy-receiver-msp-js', 'deploy-receiver-css']);

gulp.task('watch', function () {
    gulp.watch('js/*.js', ['build-js']);
    gulp.watch('css/*.css', ['build-css']);
    gulp.watch('main.css', ['build-css']);
    gulp.watch('main.js', ['build-js']);
    gulp.watch('tabs/*.js', ['build-js']);
    gulp.watch('tabs/*.css', ['build-css']);
    gulp.watch('eventPage.js', ['build-js']);
});

gulp.task('default', ['build-js', 'build-css', 'build-receiver-msp-js', 'build-receiver-css', 'build-map-js', 'build-map-css']);