const commando = require('discord.js-commando');

const CHARMAP = {
  "0": "`0️⃣`",
  "1": "`1️⃣`",
  "2": "`2️⃣`",
  "3": "`3️⃣`",
  "4": "`4️⃣`",
  "5": "`5️⃣`",
  "6": "`6️⃣`",
  "7": "`7️⃣`",
  "8": "`8️⃣`",
  "9": "`9️⃣`",
  "X": "`💣`"
}

module.exports = class MinesweeperCommand extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'minesweeper',
      aliases: ['ms'],
      group: 'jokes',
      memberName: 'minesweeper',
      description: 'Boop the bot',
      examples: ['minesweeper', 'minesweeper 10', 'minesweeper 10 4'],
      guildOnly: false,
      clientPermissions: [],
      args: [{
          key: 'size',
          label: 'Grid Size',
          prompt: 'How large should the grid be?',
          type: 'integer',
          max: 12,
          min: 1,
          default: 10,
        },
        {
          key: 'bombs',
          label: 'Bombs',
          prompt: 'How many bombs should there be?',
          type: 'integer',
          min: 1,
          default: 7,
        }
      ],
    });
  }
  
  run(msg, args) {
    let grid = this.setupgrid(args.size, args.bombs);
    let retStr = "\n";
    for(let row of grid) {
      let rowStr = "";
      for(let cell of row) {
        rowStr += "||"+CHARMAP[cell]+"||";
      }
      retStr += rowStr+"\n";
    }
    msg.say(retStr);
  }
  
  setupgrid(gridsize, numberofmines) {
    let grid = Array(gridsize).fill(null).map(()=>Array(gridsize).fill('0'));
    let mines = this.getmines(grid, numberofmines);
    for(let mine of mines) {
      grid[mine[0]][mine[1]] = 'X';
    }
    for(let row = 0; row < grid.length; row++) {
      for(let col = 0; col < grid[row].length; col++) {
        if(grid[row][col] === 'X') continue;
        grid[row][col] = this.getNeigbors(grid, row, col).reduce((acc, cell) => grid[cell[0]][cell[1]] === "X"?acc+1:acc, 0);
      }
    }
    return grid;
  }

  getNeigbors(grid, row, col) {
    let rows = grid.length;
    let cols = grid[0].length;
    let neighbors = [];

    for (let i = -1; i < 2; i++) {
      for(let j = -1; j < 2; j++) {
        if (i === 0 && j === 0) continue;
        if (row + i >= 0 && row + i < rows && col + j >= 0 && col + j < cols)
          neighbors.push([row + i, col + j]);
      }
    }

    return neighbors
  }

  getmines(grid, numberofmines) {
    let mines = [];
    for(let i = 0; i < numberofmines; i++) {
      try {
        mines.push(this.getrandomcell(grid, mines));
      } catch (e) {
        throw new commando.FriendlyError("You can't have more bombs than tiles silly!");
      }
    }
    return mines;
  }

  getrandomcell(grid, forbidden) {
    forbidden = forbidden.map(p=>p[0]*grid[0].length+p[1]).sort();
    if(grid.length*grid[0].length-forbidden.length <= 0) throw new Error("Can't pick random cell when all cells are picked");
    let pos = Math.floor(Math.random() * (grid.length*grid[0].length-forbidden.length));
    let oldPos = -1;
    let incr;
    while ((incr = this.countRange(oldPos, pos, forbidden)) !== 0) {
      oldPos = pos;
      pos+=incr;
    }
    return [Math.floor(pos/grid[0].length), pos%grid[0].length];
  }

  countRange(from, to, arr) {
    let count = 0;
    for (let cur of arr) {
      if (cur <= from) continue;
      if (cur > to) break;
      count++;
    }
    return count;
  }
};
