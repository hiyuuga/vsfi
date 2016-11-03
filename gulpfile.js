'use strict'
// -------------------------------
// Define all required Node and Gulp packages
// -------------------------------
const gulp = require('gulp');
const iconfont = require('gulp-iconfont');
const consolidate = require('gulp-consolidate');
const rename = require('gulp-rename');
const foreach = require('gulp-foreach');
const concat = require('gulp-concat');
const merge = require('merge-stream');
const svgmin = require('gulp-svgmin');
const fs = require('fs');
const cheerio = require('gulp-cheerio');
const raster = require('gulp-raster');
const fontName = 'Bowtie';
const svgsrc = 'source/svgs/bowtie/*.svg';
let runTimestamp = Math.round(Date.now() / 1000);

//glimpse options
// let iconFontOptions = {
//     normalize: true,
//     descent: 64,
//     fontHeight: 1000,
//     fontName: fontName,
//     metadata: 'Icon font for glimpse',
//     version: `v1.0.${runTimestamp}`,
//     appendCodepoints: true,
//     fontPath: '../../dist/fonts/',
//     formats: ['ttf', 'eot', 'woff', 'svg'],
//     minsize: 16,
//     maxsize: 1000
// };

// bowtie options
let iconFontOptions = {
    normalize: true,
    fontHeight: 448,
    descent: 64,
    fontName: fontName,
    metadata: 'Bowtie icon font for VSTS',
    version: `v1.0.${runTimestamp}`,
    appendCodepoints: true,
    fontPath: '../../dist/fonts/',
    formats: ['ttf', 'eot', 'woff', 'svg'],
    minsize: 14,
    maxsize: 448
};

//png options
let optionsDefault = {
    run: function($) {
        //set width and height to prevent raster generating wrong dimensions
        $('svg')
            .attr({
                width: iconFontOptions.minsize,
                height: iconFontOptions.minsize
            });
        //set icons to be default color
        $('path')
            .attr({
                fill: "#222222"
            });
        //added a transparent box to preserve padding
        $('path')
            .after(`<rect fill="#fff" fill-opacity="0" width="${iconFontOptions.maxsize}" height="${iconFontOptions.maxsize}"/>`);
    }
};

//white png options
let optionsWhite = {
    run: function($) {
        //set width and height to prevent raster generating wrong dimensions
        $('svg')
            .attr({
                width: iconFontOptions.minsize,
                height: iconFontOptions.minsize
            });
        //set icons to be default color
        $('path')
            .attr({
                fill: "#ffffff"
            });
        //added a transparent box to preserve padding
        $('path')
            .after(`<rect fill="#fff" fill-opacity="0" width="${iconFontOptions.maxsize}" height="${iconFontOptions.maxsize}"/>`);
    }
};

//default
gulp.task('default', ['iconfont', 'png']);

//optimize all svg files by trimming whitespaces and empty tags
//Note: running this task will modify all svg files
//even if there is no more room to compress.
gulp.task('svgmin', function() {
    return gulp.src([svgsrc])
        .pipe(foreach((stream, file) => {
            return stream
                .pipe(svgmin())
                .pipe(concat(file.path))
        }))
        .pipe(gulp.dest(svgsrc));
});

//export png
gulp.task('png', function() {
    let png = gulp.src([svgsrc])
        .pipe(cheerio(optionsDefault))
        .pipe(raster({
            format: 'png'
        }))
        .pipe(rename({
            extname: '.png'
        }))
        .pipe(gulp.dest(`dist/png/${fontName}`));
    return png;
});

//export white png
gulp.task('pngwhite', function() {
    let pngWhite = gulp.src([svgsrc])
        .pipe(cheerio(optionsWhite))
        .pipe(raster({
            format: 'png'
        }))
        .pipe(rename({
            extname: '.png',
            suffix: '-white'
        }))
        .pipe(gulp.dest(`dist/png/${fontName}`));
    return pngWhite;
});

//export png 2x
gulp.task('png2x', function() {
    let png2x = gulp.src([svgsrc])
        .pipe(cheerio(optionsDefault))
        .pipe(raster({
            format: 'png',
            scale: 2
        }))
        .pipe(rename({
            extname: '.png',
            suffix: '-2x'
        }))
        .pipe(gulp.dest(`dist/png/${fontName}`));
    return png2x;
});

//export white png 2x
gulp.task('pngwhite2x', function() {
    let pngWhite2x = gulp.src([svgsrc])
        .pipe(cheerio(optionsWhite))
        .pipe(raster({
            format: 'png',
            scale: 2
        }))
        .pipe(rename({
            extname: '.png',
            suffix: '-white-2x'
        }))
        .pipe(gulp.dest(`dist/png/${fontName}`));
    return pngWhite2x;
});

//generate iconfont, stylesheet and demo page.
gulp.task('iconfont', ['svgmin'], function() {
    gulp.src([svgsrc]) // the location of all the svg files to be created into the font
        .pipe(iconfont(iconFontOptions))
        // automatically assign a unicode value to the icon
        .on('glyphs', function(glyphs) {
            let options = {
                fontName: fontName,
                fontPath: '../fonts/', // set path to font (from your CSS file if relative)
                className: fontName.toLowerCase(), // set class name in your CSS
                glyphs: glyphs.map(function(glyph) {
                    // this line is needed because gulp-iconfont has changed the api from 2.0
                    return {
                        codepoint: glyph.unicode[0].charCodeAt(0).toString(16).toUpperCase(),
                        name: glyph.name
                    }
                })
            };
            console.log(glyphs);
            glyphs.forEach(function(glyph, idx, arr) {
                arr[idx].glyph = glyph.unicode[0].charCodeAt(0).toString(16).toUpperCase()
            });
            gulp.src('templates/template.css') // a template css file, used to generate the css stylesheet
                .pipe(consolidate('lodash', options))
                .pipe(rename(fontName + '.css'))
                .pipe(gulp.dest('dist/css'));
            gulp.src('templates/template_' + fontName + '.html')
                .pipe(consolidate('lodash', options))
                .pipe(rename(fontName + '.html'))
                .pipe(gulp.dest('dist/'));
            // -------------------------------
            // END additional stuff to generate an scss file with all the font characters inside it
            // -------------------------------
        })
        .pipe(gulp.dest('dist/fonts')); // where to save the generated font files
});
