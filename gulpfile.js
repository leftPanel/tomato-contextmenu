const gulp = require('gulp');
var runSequence = require('gulp-run-sequence');
var gutil = require('gulp-util');

var build = require("./script/build")

const SourcePath = "src";

function handleError(e) {
  gutil.log(e);
}

//监控文件
gulp.task("watch", function () {
  gulp.watch([`${SourcePath}/*.js`, `${SourcePath}/*`, `${SourcePath}/*/*.js`, `${SourcePath}/**/*.js`], ['build']);
});


gulp.task("build", function () {
  try {
    build()
  } catch(e) {
    handleError(e);
  }
})

gulp.task("default", function () {
  runSequence("build", "watch")
})