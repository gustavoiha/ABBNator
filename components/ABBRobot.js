var _ = require('lodash');
var async = require('async');
var JSFtp = require('jsftp');

//
// Robot Class
//
var Robot = module.exports = function (ftpOpts, targetFolder, targetFile) {
  this.interval = 100;
  this.ftp = new JSFtp(ftpOpts);

  this.folder = targetFolder;
  this.file = targetFile;

  this.callback = null;

  // State
  this.completed = true;
  this.state = {
    speed: 0,
    x: 0,
    y: 0,
    z: 0
  };

  // Offset used in targets
  this.offset = {
    x: 0,
    y: 0,
    z: 0,
  };

  // Check the target file
  // (When deleted, means that action is completed)
  this.verifyCompletion();
}

Robot.prototype.verifyCompletion = function (){
  var self = this;

  self.ftp.ls(self.folder, function (err, files) {
    // Register next check
    self.checker = setTimeout(
      self.verifyCompletion.bind(self),
      self.interval);

    if(err)
      return console.log(err);

    var completed = true;
    for(var k in files){
      if (files[k].name != self.file)
        continue;

      completed = false;
      break;
    }

    self.completed = completed;

    if(completed && self.callback){
      // Save callback before executing
      var cb = self.callback;

      // Clear callback
      self.callback = null;

      // Execute callback
      cb();
    }

  })

}

Robot.prototype.saveFile = function (content, next){
  var data = new Buffer(content, "binary");

  // console.log('putting: '+this.folder + this.file);

  this.ftp.put(data, this.folder + this.file, function (err, res) {
    // console.log('Sent! Took: ', err);
    next && next(err);
  })
}

Robot.prototype.onIddle = function (next) {
  this.callback = next;
}

Robot.prototype.goTo = function (state, next){
  // Set target callback
  this.onIddle(next);

  // Validate file content
  if( !_.isObject(state) ||
      !_.isNumber(state.speed) ||
      !_.isNumber(state.x) ||
      !_.isNumber(state.y) ||
      !_.isNumber(state.z)){

    return console.error('! Invalid target: ', state);
  }

  this.state = state;

  var pack =
    +Math.round(state.speed) + ':' +
    +Math.round(state.y + this.offset.y) + '|' +
    -Math.round(state.x + this.offset.x) + '|' +
    +Math.round(state.z + this.offset.z) + ';';

  console.log(pack);

  this.saveFile(pack);
}


Robot.prototype.line = function(path, next){
  console.log('% line', path.speed);
  var ABBRobot = this;

  // Speed to move when not drawing
  var speedCleared = path.speedCleared || path.speed;

  // Clearence in mm from the z
  var clearence = path.clearence ? path.clearence : null;
  var speed = path.speed;
  var from = path.from;
  var to = path.to;

  var paths = [];
  // Path consists of:
  // 1. Go up pen relative, by `clearence` in Z (if clearence)
  if(clearence)
    paths.push({
      speed: speedCleared,
      x: ABBRobot.state.x,
      y: ABBRobot.state.y,
      z: ABBRobot.state.z + clearence,
    });

  // 2. Go to X/Y pos with `clearence` summed Z (if clearence)
  if(clearence)
    paths.push({
      speed: speedCleared,
      x: from.x,
      y: from.y,
      z: from.z + clearence,
    });

  // 3. Go to X/Y/Z
  paths.push({
    speed: speed,
    x: from.x,
    y: from.y,
    z: from.z,
  });

  // 4. Go to TO point (If set)
  if(path.to){
    paths.push({
      speed: speed,
      x: to.x,
      y: to.y,
      z: to.z,
    });
  }

  this.execute(paths, next);
};


//
// Execute actions in the paths array and callback when done
//
Robot.prototype.execute = function (paths, next) {
  var ABBRobot = this;

  async.eachSeries(paths, ABBRobot.goTo.bind(ABBRobot), function (err) {
    next && next(err);
  });
}
