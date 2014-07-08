var
  gulp = require('gulp'),
  gutil = require('gulp-util'),
  browserify = require('gulp-browserify'),
  rename = require('gulp-rename'),
  gbump = require('gulp-bump');


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
      standalone: 'ReactRouting',
      transform: ['browserify-shim']
    }))
    .pipe(rename('react-routing.js'))
    .pipe(gulp.dest('./standalone/'));
});


gulp.task('build', ['build:browser']);
