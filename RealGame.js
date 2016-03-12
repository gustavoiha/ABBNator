'use strict';

//
// Plays a game with a human, with the ABB Robot ARM
//

var async = require('async');

var ABBRobot = require('./components/ABBRobot');
var TicTacToe = require('./components/TicTacToe');
var GameController = require('./components/GameController');
var SerialSensor = require('./components/SerialSensor');

//
// Instantiate a robot
// (Configure your ABB Robot IP, PASSWORD and USER here)
// Also, setup the PATH for the target file
// (Separate folder and file)
//
var myRobot = new ABBRobot({
  host: '192.168.125.1',
  user: 'ROB',
  pass: 'PWD'
}, '/hd0a/abbnator/', 'target.txt');

console.log('Waiting for robot...');

// Set robot offset
myRobot.offset.x = -300;
myRobot.offset.y = 500;
myRobot.offset.z = -5;

//
// Setup sensor
// (Configure your bluetooth path)
//
var sensor = new SerialSensor('/dev/cu.MonsterBT-DevB');

//
// Setup TicTacToe game controller
//
var gameSizeMM = 300;
var game = new GameController(myRobot, sensor, gameSizeMM);


//
// Initialize both systems asyncronously
// (ABB connection and Bluetooth)
//
async.parallel([
  myRobot.onIddle.bind(myRobot),
  sensor.waitConnect.bind(sensor),
], prestart);


function prestart() {
  // Raise arm
  sensor.deactivate();

  // Wait 5 secs to begin, just for safety
  console.log('Starting in 5secs...');
  setTimeout(init, 5000);
}


//
// Here the magic happens.
//
function init(){

  console.log('Started!');

  // Draw game, and then play it's move
  game.drawGame(playMove);

  //
  // Compute best move, and draw X on that position
  // After that, wait for movement
  // (Wait user vary sensor value)
  //
  function playMove(){

    console.log('# playMove');

    game.game.turn = 'X';
    game.game.minimax();
    var nextMove = game.game.choiceMove;
    console.log('# playMove.nextMove:', nextMove);

    game.game.play(nextMove.x, nextMove.y, 'X');
    game.game.print();

    game.drawX(nextMove, waitMove);
  }


  //
  // Verify if there was a winner or a DRAW.
  //  -> Then, show that winner
  // Or,
  //  -> Goes to the WAIT POSITION, and wait for sensor to vary
  //
  function waitMove(val){
    console.log('# waitMove');

    if(game.game.winner())
      return showWinner();

    game.goToWaitPosition(waitSensor)
  }


  //
  // Keeps pinging the sensor value, and readMove when detected
  //
  function waitSensor(){
    // console.log('# waitSensor');
    sensor.activate();

    sensor.readSensor((err, val) => {

      if(err)
        return setTimeout(waitSensor, 200);

      // console.log('# waitSensor.callback ', val);

      if(val > 500)
        return setTimeout(waitSensor, 200);

      sensor.deactivate();
      return setTimeout(readMove, 2000);
    });
  }

  //
  // Goes through all possible positions,
  // and check if there is something there (A dark circle?)
  // If found something, return that position, and play the
  // move in the TicTacToe game (in memory)
  // After that, play it's move (and close the cycle);
  //
  function readMove(){
    console.log('# readMove');

    game.readMove( (move) => {

      console.log('# readMove.finished');

      if(!move){
        console.log('No move detected! waiting');
        // process.exit();
        return waitMove();
      }

      // Make move
      game.game.play(move.x, move.y, 'O');

      playMove();

    });
  }

  //
  // Shows the winner, by drawing a LINE on the winner line,
  // Or, drawing a 'V' (From portuguese: VELHA).
  //
  function showWinner(){
    console.log('# showWinner');

    game.drawWinner(() => {
      console.log('END OF GAME!');
      process.exit();
    });

  }
}
