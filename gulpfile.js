var gulp = require('gulp');

var usemin = require('gulp-usemin');
var uglify = require('gulp-uglify');
var minifyHtml = require('gulp-minify-html');
var minifyCss = require('gulp-minify-css');
var rev = require('gulp-rev');
var jsonmin = require('gulp-jsonmin');
var newer = require('gulp-newer');
var imagemin = require('gulp-imagemin');
var clean = require('gulp-clean');


gulp.task('default', ['usemin', 'copy', 'images', 'datamin']);


gulp.task('clean', function () {
    return gulp.src(['dist/assets/css', 'dist/assets/js'], {read: false})
        .pipe(clean());
});
gulp.task('usemin', ['clean'], function() {
    return gulp.src('*.html')
        .pipe(usemin({
            css: [minifyCss, rev],
            js: [uglify, rev],
            html: [ function () {return minifyHtml({ empty: true });} ]
        }))
        .pipe(gulp.dest('dist/'));
});

gulp.task('copy', function() {
    return gulp.src('assets/font/*')
        .pipe(newer('assets/font/*'))
        .pipe(gulp.dest('dist/assets/font'));
});

// Minify any new images
gulp.task('images', function() {
    // Add the newer pipe to pass through newer images only
    return gulp.src('assets/img/*')
        .pipe(newer('assets/img/*'))
        .pipe(imagemin())
        .pipe(gulp.dest('dist/assets/img'));
});

gulp.task('datamin', function() {
    return gulp.src('data/*.json')
        .pipe(newer('data/*.json'))
        .pipe(jsonmin())
        .pipe(gulp.dest('dist/data'));
});