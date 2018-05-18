const gulp = require('gulp');
const runSequence = require('run-sequence');
const ts = require('gulp-typescript');
const tslint = require('gulp-tslint');
const mocha = require('gulp-mocha');
const clean = require('gulp-clean');
const deleteLines = require('gulp-delete-lines');
const merge = require('merge2');

const folderApp = './dist'; // .
const folderSrc = './src'; // ./src
const folderConf = '.'; // .
const folderTests = `./tests`;
const folderUI = `./web`;
const fileDeviceBase = 'core/bases/device.base.js';

const tsProject = ts.createProject(`${folderConf}/tsconfig.app.json`);
const tsTest = ts.createProject(`${folderConf}/tsconfig.spec.json`);

gulp.task('test:remove-server-mock', () => {
    console.log(`${folderTests}/${fileDeviceBase}`);
    return gulp.src(`${folderTests}/${fileDeviceBase}`)
        .pipe(deleteLines({
            'filters': [
                /__extends\(DeviceBase, _super\)/
            ]
        }))
        .pipe(gulp.dest((file) => file.base));
});

gulp.task('clean:code', () => {
    return gulp.src(folderApp, { read: false, allowEmpty: true })
        .pipe(clean({ force: true }));
});
gulp.task('clean:test', () => {
    return gulp.src(folderTests, { read: false, allowEmpty: true })
        .pipe(clean({ force: true }));
});

gulp.task('build:prod', gulp.series(['clean:code'], () => {
    const tsResult = tsProject.src()
        .pipe(tsProject());

    return merge([
        tsResult.dts.pipe(gulp.dest(folderApp)),
        tsResult.js.pipe(gulp.dest(folderApp)),
    ]);
}));
gulp.task('build:code', gulp.series(['clean:code'], () => {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest(folderApp));
}));
gulp.task('build:test', gulp.series(['clean:test'], () => {
    return tsTest.src()
        .pipe(tsTest())
        .js.pipe(gulp.dest(folderTests));
}));

gulp.task('start:test:unit', (done) => {
    return gulp.src([ `${folderTests}/**/*.spec.js`, `!${folderTests}/thing-it-tests/**/*.spec.js` ])
        .pipe(mocha({
            reporter: 'progress',
        }))
        .on('error', () => {
            try {
                console.log(error);
            } catch (error) { ; }
        });
});
gulp.task('start:test:mock', () => {
    return gulp.src(`${folderTests}/thing-it-tests/**/*.spec.js`)
        .pipe(mocha({
            reporter: 'progress',
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

gulp.task('watch:test:unit', gulp.series([ 'tslint:test', 'build:test' ], 'start:test:unit', () => {
    gulp.watch([ `${folderSrc}/**/*.ts` ],
        gulp.series('tslint:test', 'build:test', 'start:test:unit'));
}));
gulp.task('watch:test:mock', gulp.series([ 'tslint:test', 'build:test' ],
    'test:remove-server-mock', 'start:test:mock', () => {
        gulp.watch([ `${folderSrc}/**/*.ts` ],
            gulp.series('tslint:test', 'build:test', 'test:remove-server-mock', 'start:test:mock'));
    }));

gulp.task('watch:build:test', gulp.series([ 'tslint:test', 'build:test' ], () => {
    gulp.watch([ `${folderSrc}/**/*.ts` ],
        gulp.series('tslint:test', 'build:test'));
}));

gulp.task('watch:build:code', gulp.series([ 'tslint:code', 'build:code' ], () => {
    gulp.start('start');
    gulp.watch([ `${folderSrc}/**/*.ts`, '!./node_modules/**/*', `!${folderSrc}/**/*.spec.ts` ],
        gulp.series('tslint:code', 'build:code', 'start'));
}));

let spawn = require('child_process').spawn;
let node;

gulp.task('start', () => {
    if (node) node.kill();
    node = spawn('node', [`${folderApp}/index.js`], { stdio: 'inherit' });
});
