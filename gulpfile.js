var
  gulp = require('gulp'),
  gutil = require('gulp-util'),
  browserify = require('gulp-browserify'),
  rename = require('gulp-rename'),
  connect = require('gulp-connect'),
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


// A server for the test page
gulp.task('testserver', connect.server({
  root: [__dirname],
  port: 1337,
  livereload: false,
  open: {
    file: 'test/index.html',
    browser: 'Google Chrome'
  }
}));


gulp.task('test', ['build:browser', 'testserver']);
gulp.task('build', ['build:browser']);
