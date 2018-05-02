
const gulp = require('gulp');
const runSequence = require('run-sequence');
const ts = require('gulp-typescript');
const tslint = require('gulp-tslint');
const mocha = require('gulp-mocha');
const deleteLines = require('gulp-delete-lines');

const folderApp = '../dist'; // .
const folderSrc = '.'; // ./src
const folderConf = '..'; // .
const folderTests = `../tests`;
const fileDeviceBase = 'core/bases/device.base.js';

const tsProject = ts.createProject(`${folderConf}/tsconfig.app.json`);
const tsTest = ts.createProject(`${folderConf}/tsconfig.spec.json`);

gulp.task('test:remove-server-mock', function () {
    gulp.src(`${folderTests}/${fileDeviceBase}`)
        .pipe(deleteLines({
            'filters': [
                /__extends\(DeviceBase, _super\)/
            ]
        }))
        .pipe(gulp.dest((file) => file.base));
});

gulp.task('build:code', () => {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest(folderApp));
});
gulp.task('build:test', () => {
    return tsTest.src()
        .pipe(tsTest())
        .js.pipe(gulp.dest(folderTests));
});

gulp.task('start:test:unit', () => {
    return gulp.src([ `${folderTests}/**/*.spec.js`, `!${folderTests}/thing-it-tests/**/*.spec.js` ])
        .pipe(mocha({
            reporter: 'progress'
        }));
});
gulp.task('start:test:mock', () => {
    return gulp.src(`${folderTests}/thing-it-tests/**/*.spec.js`)
        .pipe(mocha({
            reporter: 'progress'
        }));
});

gulp.task('tslint:test', () =>
    gulp.src([ `${folderSrc}/**/*`, '!node_modules/**' ])
        .pipe(tslint({
            configuration: `${folderConf}/tslint.json`,
        }))
        .pipe(tslint.report())
);
gulp.task('tslint:code', () =>
    gulp.src([ `${folderSrc}/**/*.ts`, '!./node_modules/**/*', `!${folderSrc}/**/*.spec.ts` ])
        .pipe(tslint({
            configuration: `${folderConf}/tslint.json`,
        }))
        .pipe(tslint.report())
);

gulp.task('watch:test:unit', [ 'tslint:test', 'build:test' ], () => {
    runSequence('start:test:unit');
    gulp.watch([ `${folderSrc}/**/*.ts` ], () => {
        runSequence('tslint:test', 'build:test', 'start:test:unit');
    });
});
gulp.task('watch:test:mock', [ 'tslint:test', 'build:test' ], () => {
    runSequence('test:remove-server-mock', 'start:test:mock');
    gulp.watch([ `${folderSrc}/**/*.ts` ], () => {
        runSequence('tslint:test', 'build:test', 'test:remove-server-mock', 'start:test:mock');
    });
});

gulp.task('watch:build:test', [ 'tslint:test', 'build:test' ], () => {
    gulp.start('test:remove-server-mock');
    gulp.watch([ `${folderSrc}/**/*.ts` ], () => {
        runSequence('tslint:test', 'build:test', 'test:remove-server-mock');
    });
});

gulp.task('watch:build:code', [ 'tslint:code', 'build:code' ], () => {
    gulp.watch([ `${folderSrc}/**/*.ts`, '!./node_modules/**/*', `!${folderSrc}/**/*.spec.ts` ], () => {
        runSequence('tslint:code', 'build:code');
    });
});
