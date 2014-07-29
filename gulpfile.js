var
  gulp = require('gulp'),
  gutil = require('gulp-util'),
  browserify = require('gulp-browserify'),
  rename = require('gulp-rename'),
  gbump = require('gulp-bump'),
  jasmine = require('jasmine-runner-node');

gulp.task('watch', function() {
  gulp.watch('./lib/**/*', ['build:browser']);
});

var bump = function(type) {
  gulp.src(['./bower.json', './package.json'])
    .pipe(gbump({type: type}))
    .pipe(gulp.dest('./'));
};

gulp.task('bump:major', function() { bump('major'); });
gulp.task('bump:minor', function() { bump('minor'); });
gulp.task('bump:patch', function() { bump('patch'); });

gulp.task('build:browser', function() {
  gulp.src('./lib/index.js')
    .pipe(browserify({
      standalone: 'monorouter',
      transform: ['browserify-shim']
    }))
    .pipe(rename('monorouter.js'))
    .pipe(gulp.dest('./standalone/'));
});

gulp.task('build:tests', function() {
  gulp.src('./lib/**/__tests__/*.js')
    .pipe(browserify({
      insertGlobals : true,
      debug : !gulp.env.production
    }))
    .pipe(gulp.dest('./.tests-built/'));
});

gulp.task('watch:tests', function() {
  gulp.watch('./lib/**/*', ['build:tests']);
});

gulp.task('test', ['build:tests'], function() {
  jasmine.start({
    port: 8888,
    files: {
      spec: './.tests-built/**/*.js'
    }
  });
});

gulp.task('build', ['build:browser']);
