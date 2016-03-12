'use strict';
var _ = require('lodash');

var _initialGame = [
  [null, null, null],
  [null, null, null],
  [null, null, null]
];

var TicTacGame = module.exports = function (game){
  var state = game && game.state ? game.state : _initialGame;

  this.state = _.cloneDeep(state);

  this.turn = 'X';

  if(game){
    this.turn = TicTacGame.nextTurnName(game.turn);
  }
}

TicTacGame.prototype.winner = function () {
  var state = this.state;
  var draw = true;
  for(var k = 0; k < 3; k++){
    if(state[k][0] &&
      state[k][0] == state[k][1] &&
      state[k][1] == state[k][2])
      return state[k][0];

    if(state[0][k] &&
      state[0][k] == state[1][k] &&
      state[1][k] == state[2][k])
      return state[0][k];

    draw =
      draw &&
      (!!state[k][0]) &&
      (!!state[k][1]) &&
      (!!state[k][2]);
  }

  if(state[0][0] &&
    state[0][0] == state[1][1] &&
    state[1][1] == state[2][2])
    return state[0][0];

  if(state[2][0] &&
    state[2][0] == state[1][1] &&
    state[1][1] == state[0][2])
    return state[2][0];

  return draw ? 'DRAW' : false;
}

TicTacGame.prototype.possibleMoves = function (){
  var moves = [];
  for(var x in this.state){
    for(var y in this.state[x]){
      if(this.state[x][y] !== null)
        continue;
      moves.push({x: x, y: y});
    }
  }
  return moves;
}

TicTacGame.prototype.nextGames = function (moves){
  var moves = moves ? moves : this.possibleMoves();
  var games = [];
  for(var k in moves){
    var move = moves[k];

    var game = new TicTacGame(this);
    game.play(move.x, move.y, this.turn);
    games.push(game);
  }
  return games;
}

TicTacGame.prototype.print = function (){
  console.log('============');
  console.log(`GAME TURN: ${this.turn}`);
  console.log(`IS OVER: ${this.winner()}`);

  var none = ' ';
  var game = '';

  game += ` ${this.state[0][0] || none} |`;
  game += ` ${this.state[1][0] || none} |`;
  game += ` ${this.state[2][0] || none} \n`;

  game += `-----------\n`;

  game += ` ${this.state[0][1] || none} |`;
  game += ` ${this.state[1][1] || none} |`;
  game += ` ${this.state[2][1] || none} \n`;

  game += `-----------\n`;

  game += ` ${this.state[0][2] || none} |`;
  game += ` ${this.state[1][2] || none} |`;
  game += ` ${this.state[2][2] || none} \n`;

  console.log(game);
}

TicTacGame.prototype.play = function (x, y, who){
  who = who ? who : this.turn;

  if(this.state[x][y] !== null)
    return console.error('FAILED TO PLAY! IMPOSSIBLE MOVE:', x,y,who);

  // Play
  this.state[x][y] = who;
}

var n = 0;
TicTacGame.prototype.minimax = function (depth){

  depth = depth ? depth : 0;

  // console.log('minimax #', n++);
  var winner = this.winner();

  if(winner == 'X')
    return 10 - depth;

  if(winner == 'O')
    return depth - 10;

  if(winner == 'DRAW')
    return 0;

  depth += 1;

  // Compute next possible states
  var nextMoves = this.possibleMoves();
  var nextStates = this.nextGames(nextMoves);
  var nextStatesScore = [];

  nextStates.map((state) => {
    nextStatesScore.push(state.minimax(depth));
  });

  // console.log(depth);
  if(depth == 1){
    console.log(nextMoves);
    console.log(nextStatesScore);
  }

  var score = 0;
  if(this.turn == 'X')
    score = _.max(nextStatesScore);
  else
    score = _.min(nextStatesScore);

  var stateIndex = nextStatesScore.indexOf(score);
  var nextState = nextStates[stateIndex];
  var nextMove = nextMoves[stateIndex];

  this.choice = nextState;
  this.choiceMove = nextMove;

  // if(log){
  //   console.log('Best state: ', stateIndex);
  //   console.log(this.choice.print);
  //   console.log(this.choiceMove);
  // }

  return score;
}

TicTacGame.nextTurnName = function (thisTurn) {
  if (thisTurn == 'X')
    return 'O';
  return 'X';
}
