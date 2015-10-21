var gulp = require('gulp');

//--------------------------------------------------
// Tasks
//--------------------------------------------------
gulp.task('tsd', tsdTask);
gulp.task('test', testTask);
gulp.task('typescript', typescriptTask);
gulp.task('typescriptChanged', typescriptChangedTask);
gulp.task('watch:tests', watchTestsTask);
gulp.task('watch:typescript', watchTypescriptTask);
gulp.task('watch', ['watch:typescript', 'watch:tests']);
gulp.task('build:clean', buildCleanTask);
gulp.task('build:typescript', buildTypescriptTask);
gulp.task('build:test', ['typescript'], buildTestTask);
gulp.task('build:changelog', buildChangelogTask);
gulp.task('build', buildTask);
gulp.task('prepublish:checkEverythingCommitted', prepublishCheckEverythingCommittedTask);
gulp.task('prepublish:checkMasterPushed', prepublishCheckMasterPushedTask);
gulp.task('prepublish', prepublishTask);
require('gulp-release-tasks')(gulp);


//--------------------------------------------------
// Tasks dependencies
//--------------------------------------------------
var tsd = require('gulp-tsd');
var changed = require('gulp-changed');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var conventionalChangelog = require('gulp-conventional-changelog');
var rename = require("gulp-rename");
var runSequence = require('run-sequence');
var gutil = require('gulp-util');
var git = require('gulp-git');
var del = require('del');
var browserify = require('browserify');
var concat = require('gulp-concat-util');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var globby = require('globby');
var through = require('through2');


//--------------------------------------------------
// Tasks implementations
// npm install gulp-cli -g and gulp --tasks
//--------------------------------------------------
tsdTask.description = "Install Typescript description files";
function tsdTask(done) {
  tsd({
    command: 'reinstall',
    config: './tsd.json'
  }, done);
};

testTask.description = "Run unit tests";
function testTask(done) {
  var karmaServerConf = { configFile: __dirname + '/karma.conf.js' };
  var exitCallback = function (exitCode) {
    exitCode === 0 && done();
  };

  var KarmaServer = require('karma').Server;
  new KarmaServer(karmaServerConf, exitCallback).start();
};

typescriptTask.description = "Transpile Typescript files";
var tsProject = ts.createProject('tsconfig.json');
function typescriptTask() {
  return tsProject.src()
  .pipe(sourcemaps.init())
  .pipe(ts(tsProject)).js
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('./'));
};

typescriptTask.description = "Transpile changed Typescript files";
function typescriptChangedTask() {
  return tsProject.src()
  .pipe(changed('.', {extension: '.js'}))
  .pipe(sourcemaps.init())
  .pipe(ts(tsProject)).js
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('./'));
};

watchTestsTask.description = "Run tests everytime a JS file change";
function watchTestsTask(done) {
  var karmaServerConf = { configFile: __dirname + '/karma.conf.js', singleRun: false, autoWatch: true };
  var exitCallback = function (exitCode) {
    exitCode === 0 && done();
  };

  var KarmaServer = require('karma').Server;
  new KarmaServer(karmaServerConf, exitCallback).start();
};

watchTypescriptTask.description = "Transpile Typescript files everytime a change occurs";
function watchTypescriptTask() {
  typescriptTask();
  gulp.watch(tsProject.config.filesGlob, ['typescriptChanged']);
};

/*
* Build tasks
*/
buildCleanTask.description = "Clean build dir";
function buildCleanTask() {
  return del(['./dist']);
};

buildTypescriptTask.description = "Build Typescript files";
function buildTypescriptTask() {
  var buildVersion = require('./package.json');
  var nodeModuleVersion = require('./node_modules/data-validation/package.json');
  var headerString = '/*\n data-validation-angular v.' + buildVersion.version + ', '+buildVersion.homepage;
  headerString += '\n data-validation v.' + nodeModuleVersion.version + ', '+nodeModuleVersion.homepage;
  headerString += '\n Licence ' + buildVersion.license + '\n */\n';

var tsProject = ts.createProject('tsconfig.json', {sourceMap: false});
  var bundledStream = through();

  bundledStream
  .pipe(source('angular.data-validation.js'))
  .pipe(buffer())
  .on('error', gutil.log)
  .pipe(concat.header(headerString))
  .pipe(gulp.dest('./dist'))
  .pipe(uglify())
  .pipe(rename({
    suffix: ".min"
  }))
  .pipe(concat.header(headerString))
  .pipe(gulp.dest('./dist'));


  globby(['./src/**/*.ts']).then(function(entries) {
    var b = browserify({
      entries: entries
    })
    .plugin('tsify', tsProject.options);

    b.bundle().pipe(bundledStream);
  }).catch(function(err) {
    bundledStream.emit('error', err);
  });
  return bundledStream;
};

buildTestTask.description = "Run the tests and stop when fail";
function buildTestTask(done) {
  var karmaServerConf = { configFile: __dirname + '/karma.conf.js' };
  var exitCallback = function (exitCode) {
    exitCode === 0 && done();
  };

  var KarmaServer = require('karma').Server;
  new KarmaServer(karmaServerConf, exitCallback).start();
};

buildChangelogTask.description = "Build the changelog";
function buildChangelogTask() {
  return gulp.src('CHANGELOG.md', { buffer: false })
  .pipe(conventionalChangelog({
    preset: 'angular'
  }))
  .pipe(gulp.dest('./'));
};

buildTask.description = "Build the package";
function buildTask(done) {
  runSequence(
    'build:clean', 'build:test', 'build:typescript', 'build:changelog',
    function (error) {
      done(error ? new gutil.PluginError('build', error.message, {showStack: false}) : undefined);
    }
  );
};

/*
* Prepublish tasks
*/
prepublishCheckEverythingCommittedTask.description = "Check if everything is committed";
function prepublishCheckEverythingCommittedTask(done) {
  git.status({args: '--porcelain', quiet: true}, function (err, stdout) {
    var message = err || (stdout.length !== 0 && "Some files are not committed");
    done(message ? new gutil.PluginError('prepublish:checkEverythingCommitted', message, {showStack: false}) : undefined);
  });
};

prepublishCheckMasterPushedTask.description = "Check if every commits are pushed on origin";
function prepublishCheckMasterPushedTask(done){
  git.exec({args : 'log origin/master..master', quiet: true}, function (err, stdout) {
    var message = err || (stdout.length !== 0 && "Commits are not pushed");
    done(message ? new gutil.PluginError('prepublish:checkMasterPushed', message, {showStack: false}) : undefined);
  });
}

prepublishTask.description = "Run before publish to check if everyhting is fine before the publication";
function prepublishTask(done) {
  runSequence(
    'build', 'prepublish:checkEverythingCommitted', 'prepublish:checkMasterPushed',
    function (error) {
      done(error ? new gutil.PluginError('prepublish', error.message, {showStack: false}) : undefined);
    }
  );
};
