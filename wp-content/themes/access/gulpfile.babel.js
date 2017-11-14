// WordPress Starterkit Gulpfile
// (c) Blue State Digital
// Maintained by NYC Opportunity

// TASKS
// ------
// `gulp`: watch, compile styles and scripts; Browserify
// `gulp build`: default compile task

'use strict';

// PLUGINS
// --------
import 'dotenv/config';
import browserify from 'browserify';
import browserSync from 'browser-sync';
import del from 'del';
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import path from 'path';
import buffer from 'vinyl-buffer';
import sourcestream from 'vinyl-source-stream';
import es from 'event-stream';
import p from './package.json';
import envify from 'envify/custom';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';


const $ = gulpLoadPlugins();
const reload = function() {
  browserSync.reload();
  $.notify({ message: 'Reload' });
};

// VARIABLES
// ----------
const dist = 'assets';
const appRoot = '/wp-content/themes/access/assets';
const src = 'src';


// ERROR HANDLING
// ---------------
function handleError() {
  this.emit('end');
}

// BUILD SUBTASKS
// ---------------
// Styles
gulp.task('styles', () => {
  let plugins = [
    autoprefixer('last 2 versions'),
    cssnano()
  ];
  return gulp.src([
    `${src}/scss/style-latin.scss`,
    `${src}/scss/style-*.scss`
  ]).pipe($.jsonToSass({
    jsonPath: `${src}/variables.json`,
    scssPath: `${src}/scss/_variables-json.scss`
  }))
  .pipe($.sourcemaps.init())
  .pipe($.sass({
    includePaths: ['node_modules']
      .concat(require('bourbon').includePaths)
      .concat(require('bourbon-neat').includePaths)
  })
  .on('error', $.notify.onError())
  .on('error', $.sass.logError))
  .pipe($.postcss(plugins))
  .pipe($.hashFilename())
  .pipe($.sourcemaps.write('./'))
  .pipe(gulp.dest('./'));
});


// Script Linter
gulp.task('lint', () =>
    gulp.src(`${src}/js/**/*.js`)
      .pipe($.eslint({
        "parser": "babel-eslint",
        "rules": {
          "strict": 0
        }
      }
  ))
  .pipe($.eslint.format())
  .pipe($.if(!browserSync.active, $.eslint.failOnError()))
);


// Scripts
gulp.task('scripts', () => {
  const apps = [
    'main', 'main.field'
  ];
  let tasks = apps.map(function(entry) {
    const b = browserify({
      entries: [`${src}/js/${entry}.js`],
      debug: false,
      paths: ['node_modules',`${src}/js`]
    });
    return b.transform('babelify', {
      presets: ['es2015']
    }).transform(
      // Required in order to process node_modules files
      { global: true },
      envify({ NODE_ENV: 'production' })
    ).bundle()
    .pipe(sourcestream(`${entry}.js`))
    .pipe(buffer())
    .pipe($.hashFilename())
    .pipe(gulp.dest(`${dist}/js`))
    .pipe($.uglify())
    .pipe($.rename((path)=>{
      if (path.basename.indexOf('.js') > -1) {
        path.basename.split('.js')[0] += '.min.js';
      } else {
        path.basename += '.min';
      }
    }))
    .pipe(gulp.dest(`${dist}/js`));
  });
  return es.merge.apply(null, tasks);
});


// Clean Scripts
gulp.task('clean (scripts)', (callback) => {
  del([`${dist}/js/*`], callback);
});

// Clean Styles
gulp.task('clean (styles)', (callback) => {
  del(['style-*.css', 'style-*.css.map'], callback);
});

gulp.task('clean', ['clean (scripts)', 'clean (styles)']);


// Images
gulp.task('images', () => {
  return gulp.src([
    `${src}/img/**/*.jpg`,
    `${src}/img/**/*.png`,
    `${src}/img/**/*.gif`,
    `${src}/img/**/*.svg`,
    `!${src}/img/sprite/**/*`

  ])
  .pipe($.cache($.imagemin({
    optimizationLevel: 5,
    progressive: true,
    interlaced: true
  })))
  .pipe(gulp.dest(`${dist}/img`))
  .pipe($.notify({ message: 'Images task complete' }));
});


// SVG Sprite
gulp.task('svg-sprites', () => {
  return gulp.src(`${src}/img/sprite/**/*.svg`)
  .pipe($.svgmin())
  .pipe($.svgstore())
  .pipe($.rename('icons.svg'))
  .pipe(gulp.dest(`${dist}/img`))
  .pipe($.notify({ message: 'SVG task complete' }));
});


// BUILD TASKS
// ------------

// Watch
gulp.task('default', ['build'], function() {

  browserSync.init({
    // Create a .env file in the theme directory to define this.
    proxy: process.env.WP_DEV_URL,
    port:3001,
    ghostMode: {
      scroll: true
    },
    open:false
  });

  // Watch .scss files
  gulp.watch(`${src}/scss/**/*.scss`, ['clean (styles)', 'styles', reload]);

  // Watch .js files
  gulp.watch(`${src}/js/**/*.js`, ['lint', 'clean (scripts)', 'scripts', reload]);

  // Watch image files
  gulp.watch(`${src}/img/**/*`, ['images', reload]);

  gulp.watch([
    'access/**/*',
    'views/**/*',
  ], { dot: true })
  .on('change', reload);

});

// Build
gulp.task('build', ['clean', 'styles', 'lint', 'scripts', 'svg-sprites']);
