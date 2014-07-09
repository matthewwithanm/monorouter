var
  gulp = require('gulp'),
  gutil = require('gulp-util'),
  browserify = require('gulp-browserify'),
  rename = require('gulp-rename'),
  gbump = require('gulp-bump'),
  webpack = require('webpack'),
  examplesWebpackConfig = require('./examples/webpack.config');


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


gulp.task('build:examples', function() {
  webpack(examplesWebpackConfig).run(function(err, stats) {
    if (err) throw err;
    console.log(stats.toString({colors: true, chunks: false}));
  });
});


gulp.task('watch:examples', function () {
  webpack(examplesWebpackConfig).watch(200, function(err, stats) {
    if (err) throw err;
    console.log(stats.toString({colors: true, chunks: false}));
  });
});


gulp.task('build', ['build:browser']);
