'use strict';

var async = require('async');
var TicTacToe = require('./TicTacToe');

//
//  ^ y
//
//  . (0,0)   > x
//   __|__|__
//   __|__|__
//     |  |

var GameController = module.exports = function(robot, sensor, size){

  this.sensor = sensor;
  this.robot = robot;
  this.size = size;

  this.game = new TicTacToe();
}


GameController.prototype._callLine = function (line, next){
  console.log('$ _callLine');
  var opts = {
    from: {
      x: line.x,
      y: line.y,
      z: 0,
    },
    to: {
      x: line.x + line.dX,
      y: line.y + line.dY,
      z: 0,
    },
    speedCleared: 400,
    clearence: 40,
    speed: 75,
  }

  this.robot.line(opts, next);
}


GameController.prototype.drawGame = function (next) {
  console.log('$ drawGame');
  var self = this;

  var size = self.size / 3;

  var lines = [
      {
        x: 0, y: -(size * 1),
        dX: size * 3, dY: 0
      },
      {
        x: (size * 3), y: -(size * 2),
        dX: -size * 3, dY: 0,
      },
      {
        x: (size * 1), y: -(size * 3),
        dX: 0, dY: size * 3,
      },
      {
        x: (size * 2), y: 0,
        dX: 0, dY: -size * 3,
      }
  ];

  async.eachSeries(lines, this._callLine.bind(this), next);
}


GameController.prototype.drawX = function (pos, next){
  console.log('$ drawX', pos);

  var self = this;

  var x = pos.x * 1;
  var y = pos.y * 1;

  // Play move
  // this.game.play(pos.x, pos.y, 'X');

  // Prepare lines
  var size = self.size / 3;
  var space = size / 6;

  var lines = [
      {
        x: x * size + space, y:  -(y + 0) * size - space,
        dX: size - 2 * space, dY: -size + 2 * space
      },
      {
        x: x * size + space, y:  -(y + 1) * size + space,
        dX: size - 2 * space, dY: size - 2 * space
      },
  ];

  async.eachSeries(lines, this._callLine.bind(this), next);
}

GameController.prototype.goToWaitPosition = function (next) {
  console.log('$ goToWaitPosition');

  this.robot.goTo({
    speed: 400,
    x: 0,
    y: -400,
    z: 300
  }, () =>{
    console.log('!!! IN HOLD POSITION!');
    next();
  });
}

GameController.prototype.readMove = function (next) {
  console.log('$ readMove');

  var self = this;

  // Find out possible moves
  var moves = this.game.possibleMoves();

  if(moves.length <= 0)
    return next();

  var currentIndex = 0;
  function callNext() {
    if(currentIndex >= moves.length)
      return next();

    var move = moves[currentIndex];
    currentIndex++;

    self.readPosition(move, (err, val) => {

      console.log('readMove on', move.x, move.y, 'got', val);
      // If found, return this move
      if(val > 850)
        return next(move);

      // Or, call next check
      callNext();
    });
  }

  callNext();
}

GameController.prototype.drawWinner = function (next) {
  console.log('$ drawGame');
  var self = this;

  var size = self.size / 3;

  var lines = null;

  // Find out who win
  var winner = this.game.winner();

  if(winner == 'DRAW'){
    // Draws a "V"
    lines = [
      {
        x: size / 2, y: -(size / 2),
        dX: size, dY: -size * 2
      },
      {
        x: size / 2 + size, y: -(size / 2) - size * 2,
        dX: size, dY: size * 2
      },
    ];

  }else if(winner = 'X'){
    var start = null;
    var end = null;

    // Find winning position
    var state = this.game.state;

    for(var k = 0; k < 3; k++){
      if(state[k][0] &&
        state[k][0] == state[k][1] &&
        state[k][1] == state[k][2]){
          start = {x: k, y: 0};
          end = {x: k, y: 2};
          break;
      }

      if(state[0][k] &&
        state[0][k] == state[1][k] &&
        state[1][k] == state[2][k]){
          start = {x: 0, y: k};
          end = {x: 2, y: k};
          break;
      }
    }

    if(state[0][0] &&
      state[0][0] == state[1][1] &&
      state[1][1] == state[2][2]){
        start = {x: 0, y: 0};
        end = {x: 2, y: 2};
    }

    if(state[2][0] &&
      state[2][0] == state[1][1] &&
      state[1][1] == state[0][2]){
        start = {x: 2, y: 0};
        end = {x: 0, y: 2};
    }

    var dX = end.x - start.x;
    var dY = end.y - start.y;

    lines = [
      {
        x: start.x * size + size / 2, y: -start.y * size - size / 2,
        dX: (dX * size), dY: -(dY * size)
      },
    ];

  }else{
    console.error('\n\nIMPOSSIBLE TO LOOOOSSSEEE!\n\n');
    process.exit();
  }

  async.eachSeries(lines, this._callLine.bind(this), next);

}



GameController.prototype.readPosition = function (pos, next) {
  console.log('$ readPosition', pos);

  var self = this;

  var size = self.size / 3;

  var center = {
    x: +pos.x * size + size / 2,
    y: -pos.y * size - size / 2 - 30
  };

  var opts = {
    from: {
      x: center.x,
      y: center.y,
      z: 33,
    },
    // speedCleared: 400,
    // clearence: 20,
    speed: 400,
  }

  var sensorVal = null;
  var steps = [
    (next) => {
      self.robot.line(opts, next);
    },

    (next) => {
      self.sensor.activate(next);
    },

    (next) => {
      self.sensor.readSensor((err, val) => {
        sensorVal = val;
        next(err);
      })
    },

    (next) => {
      this.sensor.deactivate(next);
    },
  ]

  async.series(steps, (err, results) => {
    // console.log('Executed steps. Err: ', err);
    // console.log(results);
    next(err, sensorVal);
  });

}
