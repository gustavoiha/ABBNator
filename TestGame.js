'use strict';

//
// Plays a game with itself, just to check if algorithm works
//

var _ = require('lodash');

var TicTacToe = require('./components/TicTacToe');

var game = new TicTacToe();
game.state = [
  ['X', null, null],
  [null, null, null],
  [null, null, null]
];
game.turn = 'O';

console.log();
console.log('== Next games:');
console.log();

game.print();
while(!game.winner()){

  if(game.turn == 'X'){
    game.minimax();
    game = game.choice;
    game.turn = 'O';
  }else{
    game = _.sample(game.nextGames());
    game.turn = 'X';
  }

  // if(game.turn == 'O')
  // else

  game.print();
  // console.log(game.choice.print());
  // break;
}

// var nexts = game.nextGames();

// nexts.map((game) => {
//   game.print();
// });
