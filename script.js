const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d'); /*creates 2d drawing methods*/
console.log(ctx);
canvas.width = 900;
canvas.height = 600;

//global variables//
const cellSize = 100;
const cellGap = 3;
const gameGrid = [];


// game board //'
const controlsBar = {
    width: canvas.width,
    height: cellSize,
}

class Cell {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
    }
    draw(){
        ctx.strokeStyle = 'black';
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}
// projectiles //
// defenders //
// enemies //
// resources //

// utilities //
const animate = () => {
    ctx.fillStyle = 'blue';
    //this is passing the game board constrolsBar
    ctx.fillRect(0,0,controlsBar.width, controlsBar.height);
    requestAnimationFrame(animate);
    //this is a recursive animation loop//
}

animate();