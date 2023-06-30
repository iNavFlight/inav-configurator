'use strict';

var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var minimist = require('minimist');

var archiver = require('archiver');
var del = require('del');
var semver = require('semver');

var gulp = require('gulp');
var concat = require('gulp-concat');

const commandExistsSync = require('command-exists').sync;

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
    './src/css/logic.css',
    './src/css/defaults_dialog.css',
];

sources.js = [
    './js/libraries/google-analytics-bundle.js',
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/jquery-ui-npm/jquery-ui.min.js',
    './node_modules/marked/lib/marked.js',
    './js/libraries/d3.min.js',
    './js/libraries/jquery.nouislider.all.min.js',
    './node_modules/three/build/three.min.js',
    './node_modules/three/examples/js/loaders/GLTFLoader.js',
    './node_modules/three/examples/js/controls/OrbitControls.js',
    './js/libraries/nw-dialog.js',
    './js/libraries/bundle_xml2js.js',
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
    './js/connection/connection.js',
    './js/connection/connectionBle.js',
    './js/connection/connectionSerial.js',
    './js/connection/connectionTcp.js',
    './js/connection/connectionUdp.js',
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
    './js/logicConditionsStatus.js',
    './js/globalVariablesStatus.js',
    './js/programmingPid.js',
    './js/programmingPidCollection.js',
    './js/programmingPidStatus.js',
    './js/vtx.js',
    './main.js',
    './js/tabs.js',
    './tabs/*.js',
    './js/eventFrequencyAnalyzer.js',
    './js/periodicStatusUpdater.js',
    './js/serial_queue.js',
    './js/msp_balanced_interval.js',
    './tabs/advanced_tuning.js',
    './js/peripherals.js',
    './js/appUpdater.js',
    './js/feature_framework.js',
    './js/defaults_dialog.js',
    './js/safehomeCollection.js',
    './js/safehome.js',
    './js/waypointCollection.js',
    './js/waypoint.js',
    './node_modules/openlayers/dist/ol.js',
    './js/libraries/plotly-latest.min.js',
    './js/sitl.js',
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

function getArguments() {
    return minimist(process.argv.slice(2));
}

function getPlatforms() {
    const defaultPlatforms = ['win32', 'win64', 'osx64', 'linux32', 'linux64'];
    const platform = getArguments().platform;
    if (platform) {
        if (defaultPlatforms.indexOf(platform) < 0) {
            throw new Error(`Invalid platform "${platform}". Available ones are: ${defaultPlatforms}`)
        }
        return [platform];
    }
    return defaultPlatforms;
}

function execSync() {
    const cmd = arguments[0];
    const args = Array.prototype.slice.call(arguments, 1);
    const result = child_process.spawnSync(cmd, args, {stdio: 'inherit'});
    if (result.error) {
        throw result.error;
    }
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
        './src/css/font-awesome/webfonts/*',
        './src/css/opensans_webfontkit/*.{eot,svg,ttf,woff,woff2}',
        './resources/*.json',
        './resources/models/*',
        './resources/osd/analogue/*.mcm',
        './resources/motor_order/*.svg',
        './resources/sitl/windows/*',
        './resources/sitl/linux/*'
    ];
    return gulp.src(distSources, { base: '.' })
        .pipe(gulp.dest(distDir));
}));

gulp.task('dist',  gulp.series('clean', 'dist-build'));

// Create app directories in ./apps
gulp.task('apps', gulp.series('dist', function(done) {
    var NwBuilder = require('nw-builder');
    var builder = new NwBuilder({
        files: './dist/**/*',
        buildDir: appsDir,
        platforms: getPlatforms(),
        flavor: 'normal',
        macIcns: './images/inav.icns',
        winIco: './images/inav.ico',
        version: get_nw_version(),
        zip: false
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

function get_nw_version() {
    return semver.valid(semver.coerce(require('./package.json').dependencies.nw));
}

function get_release_filename_base(platform) {
    return 'INAV-Configurator_' + platform;
}

function get_release_filename(platform, ext, addition = '') {
    var pkg = require('./package.json');
    return get_release_filename_base(platform) + addition + '_' + pkg.version + '.' + ext;
}

function build_win_zip(arch) {
    return function build_win_zip_proc(done) {
        var pkg = require('./package.json');

        // Create ZIP
        console.log(`Creating ${arch} ZIP file...`);
        var src = path.join(appsDir, pkg.name, arch);
        var output = fs.createWriteStream(path.join(appsDir, get_release_filename(arch, 'zip')));
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

function build_win_iss(arch) {
    return function build_win_iss_proc(done) {
        if (!getArguments().installer) {
            done();
            return null;
        }

        // Create Installer
        console.log(`Creating ${arch} Installer...`);
        const innoSetup = require('@quanle94/innosetup');

        const APPS_DIR = './apps/';
        const pkg = require('./package.json');

        // Parameters passed to the installer script
        const parameters = [];

        // Extra parameters to replace inside the iss file
        parameters.push(`/Dversion=${pkg.version}`);
        parameters.push(`/DarchName=${arch}`);
        parameters.push(`/DarchAllowed=${(arch === 'win32') ? 'x86 x64' : 'x64'}`);
        parameters.push(`/DarchInstallIn64bit=${(arch === 'win32') ? '' : 'x64'}`);
        parameters.push(`/DsourceFolder=${APPS_DIR}`);
        parameters.push(`/DtargetFolder=${APPS_DIR}`);

        // Show only errors in console
        parameters.push(`/Q`);

        // Script file to execute
        parameters.push("assets/windows/installer.iss");

        innoSetup(parameters, {},
        function(error) {
            if (error != null) {
                console.error(`Installer for platform ${arch} finished with error ${error}`);
            } else {
                console.log(`Installer for platform ${arch} finished`);
            }
            done();
        });
    }
}

gulp.task('release-win32', gulp.series(build_win_zip('win32'), build_win_iss('win32')));
gulp.task('release-win64', gulp.series(build_win_zip('win64'), build_win_iss('win64')));

gulp.task('release-osx64', function(done) {
    var pkg = require('./package.json');
    var src = path.join(appsDir, pkg.name, 'osx64', pkg.name + '.app');
    // Check if we want to sign the .app bundle
    if (getArguments().codesign) {
        // macapptool can be downloaded from
        // https://github.com/fiam/macapptool
        //
        // Make sure the bundle is well formed
        execSync('macapptool', '-v', '1', 'fix', src);
        // Sign
        const codesignArgs = ['macapptool', '-v', '1', 'sign'];
        const codesignIdentity = getArguments()['codesign-identity'];
        if (codesignIdentity) {
            codesignArgs.push('-i', codesignIdentity);
        }
        codesignArgs.push('-e', 'entitlements.plist');
        codesignArgs.push(src)
        execSync.apply(this, codesignArgs);

        // Check if the bundle is signed
        const codesignCheckArgs = [ 'codesign', '-vvv', '--deep', '--strict', src ];
        execSync.apply(this, codesignCheckArgs);
    }

    // 'old' .zip mode
    if (!getArguments().installer) {
        const zipFilename = path.join(appsDir, get_release_filename('macOS', 'zip'));
        console.log('Creating ZIP file: ' + zipFilename);
        var output = fs.createWriteStream(zipFilename);
        var archive = archiver('zip', {
            zlib: { level: 9 }
        });
        archive.on('warning', function(err) { throw err; });
        archive.on('error', function(err) { throw err; });
        archive.pipe(output);
        archive.directory(src, 'INAV Configurator.app');
        output.on('close', function() {
            if (getArguments().notarize) {
                console.log('Notarizing DMG file: ' + zipFilename);
                const notarizeArgs = ['macapptool', '-v', '1', 'notarize'];
                const notarizationUsername = getArguments()['notarization-username'];
                if (notarizationUsername) {
                    notarizeArgs.push('-u', notarizationUsername)
                }
                const notarizationPassword = getArguments()['notarization-password'];
                if (notarizationPassword) {
                    notarizeArgs.push('-p', notarizationPassword)
                }
                notarizeArgs.push(zipFilename)
                execSync.apply(this, notarizeArgs);
            }
            done();
        });
        archive.finalize();
    }
    // 'new' .dmg mode
    else {
        const appdmg = require('appdmg');

        var target = path.join(appsDir, get_release_filename('macOS', 'dmg'));
        console.log('Creating DMG file: ' + target);
        var basepath = path.join(appsDir, pkg.name, 'osx64');
        console.log('Base path: ' + basepath);

        if (fs.existsSync(target)) {
            fs.unlinkSync(target);
        }

        var specs = {};

        specs["title"] = "INAV Configurator";
        specs["contents"] = [
            { "x": 448, "y": 342, "type": "link", "path": "/Applications" },
            { "x": 192, "y": 344, "type": "file", "path": pkg.name + ".app", "name": "INAV Configurator.app" },
        ];
        specs["background"] = path.join(__dirname, 'assets/osx/dmg-background.png');
        specs["format"] = "UDZO";
        specs["window"] = {
            "size": {
                "width": 638,
                "height": 479,
            }
        };

        const codesignIdentity = getArguments()['codesign-identity'];
        if (getArguments().codesign) {
            specs['code-sign'] = {
                'signing-identity': codesignIdentity,
            }
        }

        const ee = appdmg({
            target: target,
            basepath: basepath,
            specification: specs,
        });

        ee.on('progress', function(info) {
            //console.log(info);
        });

        ee.on('error', function(err) {
            console.log(err);
        });

        ee.on('finish', function() {
            if (getArguments().codesign) {
                // Check if the bundle is signed
                const codesignCheckArgs = [ 'codesign', '-vvv', '--deep', '--strict', target ];
                execSync.apply(this, codesignCheckArgs);
            }
            if (getArguments().notarize) {
                console.log('Notarizing DMG file: ' + target);
                const notarizeArgs = ['xcrun', 'notarytool', 'submit'];
                notarizeArgs.push(target);
                const notarizationUsername = getArguments()['notarization-username'];
                if (notarizationUsername) {
                    notarizeArgs.push('--apple-id', notarizationUsername)
                } else {
                    throw new Error('Missing notarization username');
                }
                const notarizationPassword = getArguments()['notarization-password'];
                if (notarizationPassword) {
                    notarizeArgs.push('--password', notarizationPassword)
                } else {
                    throw new Error('Missing notarization password');
                }
                const notarizationTeamId = getArguments()['notarization-team-id'];
                if (notarizationTeamId) {
                    notarizeArgs.push('--team-id', notarizationTeamId)
                } else {
                    throw new Error('Missing notarization Team ID');
                }
                notarizeArgs.push('--wait');

                const notarizationWebhook = getArguments()['notarization-webhook'];
                if (notarizationWebhook) {
                    notarizeArgs.push('--webhook', notarizationWebhook);
                }
                execSync.apply(this, notarizeArgs);

                console.log('Stapling DMG file: ' + target);
                const stapleArgs = ['xcrun', 'stapler', 'staple'];
                stapleArgs.push(target);
                execSync.apply(this, stapleArgs);

                console.log('Checking DMG file: ' + target);
                const checkArgs = ['spctl', '-vvv', '--assess', '--type', 'install', target];
                execSync.apply(this, checkArgs);
            }
            done();
        });
    }
});

function post_build(arch, folder) {
    return function post_build_linux(done) {
        if ((arch === 'linux32') || (arch === 'linux64')) {
            const metadata = require('./package.json');
            // Copy Ubuntu launcher scripts to destination dir
            const launcherDir = path.join(folder, metadata.name, arch);
            console.log(`Copy Ubuntu launcher scripts to ${launcherDir}`);
            return gulp.src('assets/linux/**')
                    .pipe(gulp.dest(launcherDir));
        }

        return done();
    }
}

// Create the dir directory, with write permissions
function createDirIfNotExists(dir) {
    fs.mkdir(dir, '0775', function(err) {
        if (err && err.code !== 'EEXIST') {
            throw err;
        }
    });
}

function release_deb(arch) {
    return function release_deb_proc(done) {
        if (!getArguments().installer) {
            done();
            return null;
        }

        // Check if dpkg-deb exists
        if (!commandExistsSync('dpkg-deb')) {
            console.warn(`dpkg-deb command not found, not generating deb package for ${arch}`);
            done();
            return null;
        }

        const deb = require('gulp-debian');
        const LINUX_INSTALL_DIR = '/opt/inav';
        const metadata = require('./package.json');

        console.log(`Generating deb package for ${arch}`);

        return gulp.src([path.join(appsDir, metadata.name, arch, '*')])
            .pipe(deb({
                package: metadata.name,
                version: metadata.version,
                section: 'base',
                priority: 'optional',
                architecture: getLinuxPackageArch('deb', arch),
                maintainer: metadata.author,
                description: metadata.description,
                preinst: [`rm -rf ${LINUX_INSTALL_DIR}/${metadata.name}`],
                postinst: [
                    `chown root:root ${LINUX_INSTALL_DIR}`,
                    `chown -R root:root ${LINUX_INSTALL_DIR}/${metadata.name}`,
                    `xdg-desktop-menu install ${LINUX_INSTALL_DIR}/${metadata.name}/${metadata.name}.desktop`,
                ],
                prerm: [`xdg-desktop-menu uninstall ${metadata.name}.desktop`],
                depends: ['libgconf-2-4', 'libatomic1'],
                changelog: [],
                _target: `${LINUX_INSTALL_DIR}/${metadata.name}`,
                _out: appsDir,
                _copyright: 'assets/linux/copyright',
                _clean: true,
        }));
    }
}

function post_release_deb(arch) {
    return function post_release_linux_deb(done) {
        if (!getArguments().installer) {
            done();
            return null;
        }
        if ((arch === 'linux32') || (arch === 'linux64')) {
            var rename = require("gulp-rename");
            const metadata = require('./package.json');
            const renameFrom = path.join(appsDir, metadata.name + '_' + metadata.version + '_' + getLinuxPackageArch('.deb', arch) + '.deb');
            const renameTo = path.join(appsDir, get_release_filename_base(arch) + '_' + metadata.version + '.deb');
            // Rename .deb build to common naming
            console.log(`Renaming .deb installer ${renameFrom} to ${renameTo}`);
            return gulp.src(renameFrom)
                    .pipe(rename(renameTo))
                    .pipe(gulp.dest("."));
        }

        return done();
    }
}

function release_rpm(arch) {
    return function release_rpm_proc(done) {
        if (!getArguments().installer) {
            done();
            return null;
        }

        // Check if rpmbuild exists
        if (!commandExistsSync('rpmbuild')) {
            console.warn(`rpmbuild command not found, not generating rpm package for ${arch}`);
            done();
            return;
        }

        const buildRpm = require('rpm-builder');
        const NAME_REGEX = /-/g;
        const LINUX_INSTALL_DIR = '/opt/inav';
        const metadata = require('./package.json');

        console.log(`Generating rpm package for ${arch}`);

        // The buildRpm does not generate the folder correctly, manually
        createDirIfNotExists(appsDir);

        const options = {
            name: get_release_filename_base(arch), // metadata.name,
            version: metadata.version.replace(NAME_REGEX, '_'), // RPM does not like release candidate versions
            buildArch: getLinuxPackageArch('rpm', arch),
            vendor: metadata.author,
            summary: metadata.description,
            license: 'GNU General Public License v3.0',
            requires: ['libatomic1'],
            prefix: '/opt',
            files: [{
                cwd: path.join(appsDir, metadata.name, arch),
                src: '*',
                dest: `${LINUX_INSTALL_DIR}/${metadata.name}`,
            }],
            postInstallScript: [`xdg-desktop-menu install ${LINUX_INSTALL_DIR}/${metadata.name}/${metadata.name}.desktop`],
            preUninstallScript: [`xdg-desktop-menu uninstall ${metadata.name}.desktop`],
            tempDir: path.join(appsDir, `tmp-rpm-build-${arch}`),
            keepTemp: false,
            verbose: false,
            rpmDest: appsDir,
            execOpts: { maxBuffer: 1024 * 1024 * 16 },
        };

        buildRpm(options, function(err) {
            if (err) {
                console.error(`Error generating rpm package: ${err}`);
            }
            done();
        });
    }
}

function getLinuxPackageArch(type, arch) {
    let packArch;

    switch (arch) {
    case 'linux32':
        packArch = 'i386';
        break;
    case 'linux64':
        if (type === 'rpm') {
            packArch = 'x86_64';
        } else {
            packArch = 'amd64';
        }
        break;
    default:
        console.error(`Package error, arch: ${arch}`);
        process.exit(1);
        break;
    }

    return packArch;
}

function releaseLinux(bits) {
    return function() {
        console.log(`Generating zip package for linux${bits}`);
        var dirname = 'linux' + bits;
        var pkg = require('./package.json');
        var src = path.join(appsDir, pkg.name, dirname);
        var output = fs.createWriteStream(path.join(appsDir, get_release_filename(dirname, 'tar.gz')));
        var archive = archiver('tar', {
            zlib: { level: 9 },
            gzip: true
        });
        archive.on('warning', function(err) { throw err; });
        archive.on('error', function(err) { throw err; });
        archive.pipe(output);
        archive.directory(src, 'INAV Configurator');
        return archive.finalize();
    }
}

gulp.task('release-linux32', gulp.series(releaseLinux(32), post_build('linux32', appsDir), release_deb('linux32'), post_release_deb('linux32')));
gulp.task('release-linux64', gulp.series(releaseLinux(64), post_build('linux64', appsDir), release_deb('linux64'), post_release_deb('linux64'), release_rpm('linux64')));

// Create distributable .zip files in ./apps
gulp.task('release', gulp.series('apps',  getPlatforms().map(function(v) { return 'release-' + v; })));

gulp.task('watch', function () {
    for(var k in output) {
        gulp.watch(sources[k], gulp.series(get_task_name(k)));
    }
});

gulp.task('default', gulp.series('build'));
