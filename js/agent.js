// helper functions
function randomInt(n) {
    return Math.floor(Math.random() * n);
};

function AgentBrain(gameEngine) {
    this.size = 4;
    this.previousState = gameEngine.grid.serialize();
    this.reset();
    this.score = 0;
};

AgentBrain.prototype.reset = function () {
    this.score = 0;
    this.grid = new Grid(this.previousState.size, this.previousState.cells);
};

// Adds a tile in a random position
AgentBrain.prototype.addRandomTile = function () {
    if (this.grid.cellsAvailable()) {
        var value = Math.random() < 0.9 ? 2 : 4;
        var tile = new Tile(this.grid.randomAvailableCell(), value);

        this.grid.insertTile(tile);
    }
};

AgentBrain.prototype.moveTile = function (tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
AgentBrain.prototype.move = function (direction) {
    // 0: up, 1: right, 2: down, 3: left
    var self = this;

    var cell, tile;

    var vector = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved = false;

    //console.log(vector);

    //console.log(traversals);

    // Traverse the grid in the right direction and move tiles
    traversals.x.forEach(function (x) {
        traversals.y.forEach(function (y) {
            cell = { x: x, y: y };
            tile = self.grid.cellContent(cell);

            if (tile) {
                var positions = self.findFarthestPosition(cell, vector);
                var next = self.grid.cellContent(positions.next);

                // Only one merger per row traversal?
                if (next && next.value === tile.value && !next.mergedFrom) {
                    var merged = new Tile(positions.next, tile.value * 2);
                    merged.mergedFrom = [tile, next];

                    self.grid.insertTile(merged);
                    self.grid.removeTile(tile);

                    // Converge the two tiles' positions
                    tile.updatePosition(positions.next);

                    // Update the score
                    self.score += merged.value;

                } else {
                    self.moveTile(tile, positions.farthest);
                }

                if (!self.positionsEqual(cell, tile)) {
                    moved = true; // The tile moved from its original cell!
                }
            }
        });
    });
    //console.log(moved);
    if (moved) {
        //this.addRandomTile();
    }
    return moved;
};

// Get the vector representing the chosen direction
AgentBrain.prototype.getVector = function (direction) {
    // Vectors representing tile movement
    var map = {
        0: { x: 0, y: -1 }, // Up
        1: { x: 1, y: 0 },  // Right
        2: { x: 0, y: 1 },  // Down
        3: { x: -1, y: 0 }   // Left
    };

    return map[direction];
};

// Build a list of positions to traverse in the right order
AgentBrain.prototype.buildTraversals = function (vector) {
    var traversals = { x: [], y: [] };

    for (var pos = 0; pos < this.size; pos++) {
        traversals.x.push(pos);
        traversals.y.push(pos);
    }

    // Always traverse from the farthest cell in the chosen direction
    if (vector.x === 1) traversals.x = traversals.x.reverse();
    if (vector.y === 1) traversals.y = traversals.y.reverse();

    return traversals;
};

AgentBrain.prototype.findFarthestPosition = function (cell, vector) {
    var previous;

    // Progress towards the vector direction until an obstacle is found
    do {
        previous = cell;
        cell = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(cell) &&
    this.grid.cellAvailable(cell));

    return {
        farthest: previous,
        next: cell // Used to check if a merge is required
    };
};

AgentBrain.prototype.positionsEqual = function (first, second) {
    return first.x === second.x && first.y === second.y;
};

function Agent() {
};

Agent.prototype.selectMove = function (gameManager) {
    var brain = new AgentBrain(gameManager);
    brain.score = gameManager.score;

    // Use the brain to simulate moves
    // brain.move(i)
    // i = 0: up, 1: right, 2: down, 3: left
    // brain.reset() resets the brain to the current game board

    let moves = [0, 0, 0, 0];

    for (let i = 0; i < moves.length; i ++) {
        let brainCpy = new AgentBrain(brain);
        brainCpy.depth = 0;
        brainCpy.score = brain.score;
        if (brainCpy.move(i)) {
            moves[i] = this.expectimax(brainCpy);
        }
    }

    return moves.indexOf(Math.max(...moves));
};

Agent.prototype.evaluateGrid = function (gameManager) {
    // calculate a score for the current grid configuration
    // 0: top-right, 1: top-left, 2: bottom-right, 3: bottom-left, 4: snake
    let sumArr = [0, 0, 0, 0, 0];

    for (let i = 0; i < gameManager.grid.cells.length; i++) {
        for (let j = 0; j < gameManager.grid.cells[i].length; j++) {
            let tileVal = gameManager.grid.cells[i][j];

            if (tileVal != null) {
                tileVal = tileVal.value;
                let tr = 0;
                let tl = 0;
                let br = 0;
                let bl = 0;
                let w = 0;

            //     // 1s
            //     if (i === 0) {
            //         br = 1;
            //         bl = 1;
            //     } else if ( i === 3) {
            //         tr = 1;
            //         tl = 1;
            //     }
            //     if (j === 0) {
            //         tr = 1;
            //         br = 1;
            //     } else if (j === 3) {
            //         tl = 1;
            //         br = 1;
            //     }
            //
            //     // 10s
            //     if (i === 3 && j === 0) {
            //         bl = 20;
            //     } else if (i === 0 && j === 0) {
            //         tl = 20;
            //     } else if (i === 3 &&  j === 3) {
            //         br = 20;
            //     } else if (i === 0 && j === 3) {
            //         tr = 20;
            //     }
            //
            //     //2s
            //     if ((i === 1 && j !== 3) || (i !== 0 && j === 2)) {
            //         bl = 2;
            //     }
            //     if ((i === 2 && j !== 3) || (j === 2 && i !== 3)) {
            //         tl = 2;
            //     }
            //     if ((i === 2 && j !== 0) || (j === 1 && i !== 3)) {
            //         tr = 2;
            //     }
            //     if ((i === 1 && j !== 0) || (j === 1 && i !== 0)) {
            //         br = 2;
            //     }
            //
            //     // 5s
            //     if ((i === 2 && (j === 0 || j === 1)) || (i === 3 && j === 1)) {
            //         bl = 5;
            //     }
            //     if ((i === 1 && (j === 0 || j === 1)) || (i === 0 && j === 1)) {
            //         tl = 5;
            //     }
            //     if ((i === 1 && (j === 2 || j === 3)) || (i === 0 && j === 2)) {
            //         tr = 5;
            //     }
            //     if ((i === 2 && (j === 2 || j === 3)) || (i === 3 && j === 2)) {
            //         br = 5;
            //     }

                if (i === 0) {
                    if (j === 0) {
                        w = 32768;
                    } else if (j === 1) {
                        w = 16384;
                    } else if (j === 2) {
                        w = 8192;
                    } else {
                        w = 4096;
                    }
                } else if (i === 1) {
                    if (j === 0) {
                        w = 256;
                    } else if (j === 1) {
                        w = 512;
                    } else if (j === 2) {
                        w = 1024;
                    } else {
                        w = 2048;
                    }
                } else if (i === 2) {
                    if (j === 0) {
                        w = 128;
                    } else if (j === 1) {
                        w = 64;
                    } else if (j === 2) {
                        w = 32;
                    } else {
                        w = 16;
                    }
                } else if (i === 3) {
                    if (j === 0) {
                        w = 2;
                    } else if (j === 1) {
                        w = 2;
                    } else if (j === 2) {
                        w = 4;
                    } else {
                        w = 8;
                    }
                }

                sumArr[0] += Math.log2(tileVal) * tr;
                sumArr[1] += Math.log2(tileVal) * tl;
                sumArr[2] += Math.log2(tileVal) * br;
                sumArr[3] += Math.log2(tileVal) * bl;
                sumArr[4] += Math.log2(tileVal) * w;
            }
        }
    }

    return Math.max(...sumArr) +
        gameManager.score +
        (gameManager.grid.availableCells().length * 32768);
};

Agent.prototype.expectimax = function(brain) {
    let anyMoves = false;
    let moves = [];
    for (let i = 0; i < 4; i++) {
        let cpy = new AgentBrain(brain);
        moves.push(cpy.move(i));
        if (moves[i]) anyMoves = true;
    }
    if (!anyMoves || brain.depth > 1) return this.evaluateGrid(brain);

    let optimum = 0;
    for (let i = 0; i < moves.length; i++) {
        if (moves[i]) {
            // Make the move
            let brainCpy = new AgentBrain(brain);
            brainCpy.depth = brain.depth + 1;
            brainCpy.score = brain.score;
            brainCpy.move(i);
            let val = 0;
            /* For every available cell, evaluate the utility and
            calulate weighted sum.             */
            let availableCells = brain.grid.availableCells();
            let numAvailCells = availableCells.length;
            for (let i = 0; i < numAvailCells; i++) {
                brainCpy.grid.insertTile(new Tile(availableCells[i], 2));
                val += this.expectimax(brainCpy) / numAvailCells;
                brainCpy.reset();
                brainCpy.score = brain.score;
            }
            optimum = Math.max(optimum, val);
        }
    }

    return optimum;
};

// Agent.prototype.selectMove = function (gameManager) {
//     var brain = new AgentBrain(gameManager);
//
//     // Use the brain to simulate moves
//     // brain.move(i)
//     // i = 0: up, 1: right, 2: down, 3: left
//     // brain.reset() resets the brain to the current game board
//
//     if (brain.move(0)) return 0;
//     if (brain.move(1)) return 1;
//     if (brain.move(3)) return 3;
//     if (brain.move(2)) return 2;
// };
//
// Agent.prototype.evaluateGrid = function (gameManager) {
//     // calculate a score for the current grid configuration
//
// };