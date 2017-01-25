/*!
 * gulp
 * $ npm install gulp-ruby-sass gulp-autoprefixer gulp-cssnano gulp-jshint gulp-concat gulp-uglify gulp-imagemin gulp-notify gulp-rename gulp-livereload gulp-cache del --save-dev
 */

// Load plugins
var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    cssnano = require('gulp-cssnano'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    htmlreplace = require('gulp-html-replace'),
    embedTemplates = require('gulp-angular-embed-templates');
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    del = require('del');

// Styles
gulp.task('styles', function() {
  return gulp.src(['bower_components/bootstrap/dist/css/bootstrap.min.css',
  'assets/**/*.css'])
    .pipe(concat('huewi.css'))
    //.pipe(gulp.dest('dist/assets/css'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(cssnano())
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(notify({ message: 'Styles task complete' }));
});

// Scripts
gulp.task('scripts', function() {
  return gulp.src(['bower_components/huepi/huepi.js',
  'bower_components/jquery/dist/jquery.min.js',
  'bower_components/bootstrap/dist/js/bootstrap.min.js',
  'bower_components/angular/angular.min.js',
  'bower_components/angular-animate/angular-animate.min.js',
  'bower_components/angular-touch/angular-touch.min.js',
  'app/huewi.js',
  'app/huewi-controller.js',
  'assets/js/*.js',
  'app/components/*.js'])
    //.pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(concat('huewi.js'))
    .pipe(embedTemplates())
    //.pipe(gulp.dest('dist/assets/js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest('dist/assets/js'))
    .pipe(notify({ message: 'Scripts task complete' }));
});

// Fonts
gulp.task('fonts', function() {
  return gulp.src('bower_components/bootstrap/dist/fonts/*.ttf')
    .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
    .pipe(gulp.dest('dist/assets/fonts'))
    .pipe(notify({ message: 'Fonts task complete' }));
});

// Images
gulp.task('images', function() {
  return gulp.src('assets/img/**/*.png')
    .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
    .pipe(gulp.dest('dist/assets/img'))
    .pipe(notify({ message: 'Images task complete' }));
});

// Webpage
gulp.task('webpage', function () {
  gulp.src('*.html')
    .pipe(htmlreplace({
        'css': 'assets/css/huewi.min.css',
        'js': 'assets/js/huewi.min.js'
    }))
    .pipe(gulp.dest('dist/'))
    .pipe(notify({ message: 'Webpages task complete' }));
});

// Components
gulp.task('components', function () {
  /*gulp.src('app/components/*.html')
    .pipe(gulp.dest('dist/app/components'))
    .pipe(notify({ message: 'Components task complete' }));*/
});

// Clean
gulp.task('clean', function() {
  return del(['dist/assets/css', 'dist/assets/fonts', 'dist/assets/js', 'dist/assets/img', 'dist']);
});

// Default task
gulp.task('default', ['clean'], function() {
  gulp.start('styles', 'fonts', 'scripts', 'images', 'webpage', 'components');
});

// Watch
gulp.task('watch', function() {

  // Watch .css files
  gulp.watch('./assets/css/*.css', ['styles']);

  // Watch .js files assets
  gulp.watch('./assets/js/*.js', ['scripts']);

  // Watch .js files app
  gulp.watch('./app/**/*.js', ['scripts']);

  // Watch image files
  gulp.watch('./assets/img/*.png', ['images']);

  // Watch webpage files
  gulp.watch('./*.html', ['webpage']);

  // Watch components files
  gulp.watch('./app/**/*.html', ['components']);

  // Create LiveReload server
  livereload.listen();

  // Watch any files in dist/, reload on change
  gulp.watch(['dist/**']).on('change', livereload.changed);

});
