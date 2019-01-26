"use strict";

const gulp = require('gulp');
const Hapi = require('hapi');
const del = require('del');
const path = require('path');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const cleanCSS = require('gulp-clean-css');
const eslint = require('gulp-eslint');

const buildConfig = require('./build.json');
const jsOutputDir = buildConfig.jsOutputDir || 'dist/js';
const cssOutputDir = buildConfig.cssOutputDir || 'dist/css';

const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    routes: {
        files: {
            relativeTo: path.join(__dirname, 'dist')
        }
    }
});

const startServer = async () => {
    await server.register(require('inert'));

    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: '.',
                index: ['index.html']
            }
        }
    });

    await server.start();

    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

gulp.task('clean', (next) => {
    return del(['dist/**'], next);
});

gulp.task('compile', ['clean'], () => {
    for(let i=0, j = buildConfig.build.length; i < j; i++) {
        const page = buildConfig.build[i];

        if(page.js.length) {
            gulp.src(page.js)
                .pipe(eslint())
                .pipe(eslint.format())
                .pipe(eslint.failAfterError())
                .pipe(concat(`${page.name}.js`))
                .pipe(gulp.dest(jsOutputDir))
                .pipe(uglify())
                .on('error', (err) => {
                    console.log(err.message);
                })
                .pipe(rename({suffix: '.min'}))
                .pipe(gulp.dest(jsOutputDir));
        }
        if(page.scss.length) {
            gulp.src(page.scss)
                .pipe(sass().on('error', sass.logError))
                .pipe(rename({
                    basename: page.name
                }))
                .pipe(gulp.dest(cssOutputDir))
                .pipe(cleanCSS({compatibility: "*"}))
                .pipe(rename({suffix: '.min'}))
                .pipe(gulp.dest(cssOutputDir));
        }
        gulp.src('src/*.html')
            .pipe(gulp.dest('dist/'));

        gulp.src('src/data/*.json')
            .pipe(gulp.dest('dist/data'));
    }
    gulp.watch([`${buildConfig.jsDir}/**/*.js`,`${buildConfig.scssDir}/**/*.scss`], ['compile']);
});

gulp.task('serve', ['compile'], () => {
    startServer();
});

gulp.task('default', ['serve']);


