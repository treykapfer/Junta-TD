const canvas = document.getElementById('canvas1');
//this is our context
//context is a "super object" that creates all our methods
const ctx = canvas.getContext('2d'); /*creates 2d drawing methods*/
canvas.width = 900;
canvas.height = 600;

//global variables//
const cellSize = 100;
const cellGap = 3;
//we will be storing all of our stuff inside of arrays
const gameGrid = [];
const defenders = [];
let numberOfResources = 300;

// mouse
const mouse = {
    x: 10,
    y: 10,
    width: 0.1,
    height: 0.1
}

//this allows us to access mouse position later
let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener('mousemove', (e)=> {
    mouse.x = e.x - canvasPosition.left;
    mouse.y = e.y - canvasPosition.top;
});
canvas.addEventListener('mouseleave', (e)=> {
    mouse.x = undefined;
    mouse.y = undefined;
});

// game board //
const controlsBar = {
    width: canvas.width,
    height: cellSize,
}

class Cell {
//interlinked//
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
    }
    draw(){
        //this highlights the current cell
        if (mouse.x && mouse.y && collision(this, mouse)){
            ctx.strokeStyle = 'black';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}

const createGrid = () => {
    for (let y = cellSize; y < canvas.height; y += cellSize){
        for (let x=0; x < canvas.width; x += cellSize){
            gameGrid.push(new Cell(x, y));
        }
    }
}

const handleGameGrid = () => {
    for (let i = 0; i < gameGrid.length; i++){
        gameGrid[i].draw();
    }
}
// projectiles //
// defenders //
class Defender {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
        //as long as this.shooting = true create projectiles
        //projectiles will be array we push into
        this.shooting = false;
        this.health = 100;
        this.projectiles = [];
        this.timer = 0;
    }
    draw(){
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'gold';
        ctx.font = '20px Arial';
        ctx.fillText(Math.floor(this.health), this.x, this.y);
    }
}

//HANDLE DEFENDER CLICK
canvas.addEventListener('click', ()=> {
    const gridPositionX = mouse.x - (mouse.x % cellSize);
    const gridPositionY = mouse.y - (mouse.y % cellSize);
    //STOP IT IF ITS IN THE HEADER
    if (gridPositionY < cellSize) return;
    let defenderCost = 100;
    //BUY DEFENDER
    if (numberOfResources => defenderCost) {
        defenders.push(new Defender(gridPositionX, gridPositionY));
        numberOfResources -= defenderCost;
    }
})

// enemies //
// resources //

// utilities //

//ANIMATION GAME LOOP
const animate = () => {
    //this clears old highlight
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.fillStyle = 'grey';
    //this is passing the game board constrolsBar
    ctx.fillRect(0,0,controlsBar.width, controlsBar.height);
    handleGameGrid();
    requestAnimationFrame(animate);
    //this is a recursive animation loop//
}

//HANDLE COLLISION
const collision = (first, second) => {
//RETURN TRUE IF COLLIDE
// OR OPERATOR ||
    if (    !(  first.x > second.x + second.width ||
                first.x + first.width < second.x ||
                first.y > second.y + second.height ||
                first.y + first.height < second.y
            )
    ) {return true};
//ELSE RETURNS FALSE
}

//CALL FUNCTIONS
createGrid();
animate();
console.log(gameGrid);