const canvas = document.getElementById('game_canvas');
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
const enemies = [];
const projectiles = [];
const resources = [];

let level = 1;
let winningScore = 200;
let ledger = 0;
let killCount = 0;
let enemyRate = 600;
let enemyPositions = [];
let morassium = 0;
let numberOfCredits = 500;
let frame = 0;

//features to add
let maxDeficit = -300;
let councilScore = 500;

//SWITCHES
let gameOver = false;

// mouse
const mouse = {
    x: 10,
    y: 10,
    width: 0.1,
    height: 0.1
}

//access mouse position
let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener('mousemove', (e)=> {
    mouse.x = e.x - canvasPosition.left;
    mouse.y = e.y - canvasPosition.top;
});

canvas.addEventListener('mouseleave', (e)=> {
    mouse.x = undefined;
    mouse.y = undefined;
});

// GAME BOARD //
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
// PROJECTILES //
class Projectile {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 10;
        this.power = 20;
        this.speed = 5;
    }
    update(){
        this.x += this.speed;
    }
    draw(){
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
        ctx.fill();
    }
}

const handleProjectiles = () => {
    for (let i = 0; i < projectiles.length; i++){
        projectiles[i].update();
        projectiles[i].draw();

        //handle collision
        for (let j = 0; j < enemies.length; j++){
            if (enemies[j] && projectiles[i] && collision(projectiles[i], enemies[j])) {
                enemies[j].health -= projectiles[i].power;
                projectiles.splice(i, 1);
                i--;
            }
        }

        //lasers need to stop at last cell
        if (projectiles[i] && projectiles[i].x > canvas.width - cellSize) {
            projectiles.splice(i, 1);
            i--;
        }
    }
}

// DEFENDERS //
class Defender {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        //as long as this.shooting = true create projectiles
        this.shooting = false;
        this.health = 100;
        this.timer = 0;
        this.shootingSpeed = 100;
    }
    draw(){
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'gold';
        ctx.font = '20px Arial';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
    }
    update(){
        //run update if its shooting
        if (this.shooting) {
            this.timer++;
            if (this.timer % this.shootingSpeed === 0) {
                projectiles.push(new Projectile(this.x + 50, this.y + 50));
            }
        } else {
            this.timer = 0;
        }
    }
}

//HANDLE DEFENDER CLICK
canvas.addEventListener('click', ()=> {
    const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
    const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
    //STOP IT IF ITS IN THE HEADER
    if (gridPositionY < cellSize) return;
    //THIS PREVENTS STACKING
    for (let i = 0; i < defenders.length; i++){
        //loop through the defender array and check their position
        //then get out of the loop if theres a stack
        if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY) {return}
    }
    let defenderCost = 100;
    //BUY DEFENDER
    if (numberOfCredits >= defenderCost) {
        defenders.push(new Defender(gridPositionX, gridPositionY));
        numberOfCredits -= defenderCost;
    }
});

const handleDefenders = () => {
    for (let i = 0; i < defenders.length; i++) {
        defenders[i].draw();
        defenders[i].update();
        //CHECK IF DEFENDER ON ROW
        if (enemyPositions.indexOf(defenders[i].y) !== -1){
            defenders[i].shooting = true;
        } else {
            defenders[i].shooting = false;
        }
        for (let j = 0; j < enemies.length; j++) {
        //HANDLE COLLISION
            if (defenders[i] && collision(defenders[i], enemies[j])){
                enemies[j].movement = 0;
                defenders[i].health -= 0.2;
            }
            if (defenders[i] && defenders[i].health <= 0){
                defenders.splice(i, 1);
                i--;
                enemies[j].movement = enemies[j].speed;
            }
        }
    }
}

// ENEMIES //
class Enemy {
    constructor(verticalPosition) {
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.speed = Math.random() * 0.2 + 0.4;
        this.movement = this.speed;
        this.health = 100;
        this.maxHealth = this.health;
    }
    update(){
        //this will make the enemy move to the left
        this.x -= this.movement;
    }
    draw(){
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'gold';
        ctx.font = '20px Arial';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
    }
}

//cycle through enemy array with for loop
const handleEnemies = () => {
    for (let i = 0; i < enemies.length; i++){
        enemies[i].update();
        enemies[i].draw();
        if (enemies[i].x < 0){
            gameOver = true;
        }
        if (enemies[i].health <= 0){
            //GAIN KILL
            numberOfCredits += enemies[i].maxHealth / 10;
            killCount += 1;
            //REMOVE VERTICAL POSITION
            const findThisIndex = enemyPositions.indexOf(enemies[i].y);
            enemyPositions.splice(findThisIndex, 1);
            //REMOVE ENEMY
            enemies.splice(i, 1);
            i--;
        }
    }
    //CREATE ENEMY BY RATE
    if (frame % enemyRate === 0 && morassium < winningScore){
        //math.random/floor for a random row on grid
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
        enemies.push(new Enemy(verticalPosition));
        enemyPositions.push(verticalPosition);
        //stagger enemy rate
        if (enemyRate > 150) enemyRate -= 100;
    }
}
// RESOURCES //
const amounts = [20, 30, 40];
class Resource {
    constructor(){
        this.x = Math.random() * (canvas.width - cellSize);
        this.y = (Math.floor(Math.random() * 5) + 1) * cellSize + 25;
        this.width = cellSize * 0.6;
        this.height = cellSize * 0.6;
        this.amount = amounts[Math.floor(Math.random()* amounts.length)];
    }
    draw(){
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.fillText(this.amount, this.x + 15, this.y + 25);
    }
}
const handleResources = () => {
    if (frame % 1000 === 0 && morassium < winningScore){
        resources.push(new Resource());
    }
    for (let i = 0; i < resources.length; i++){
        resources[i].draw();
        if (resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)){
            morassium += resources[i].amount;
            resources.splice(i, 1);
            i--;
        }
    }
}

// utilities //
const handleGameStatus = () => {
    ctx.fillStyle = 'gold';
    ctx.font = '20px Arial';
    ctx.fillText('Morassium: ' + morassium + ` // Collect ${winningScore} to clear level`, 20, 35);
    ctx.fillText('Credits: ' + numberOfCredits, 20, 75);
    if (gameOver){
        ctx.fillStyle = 'red';
        ctx.font = '60px Arial';
        ctx.fillText('GAME OVER', 425, 60);
    }
    if (morassium >= winningScore && enemies.length === 0) {
        ctx.fillStyle = 'green';
        ctx.font = '60px Arial';
        ctx.fillText('LEVEL CLEAR', 425, 60);
    }
}

//DA GAME LOOP
//THIS IS WHAT HAPPENS IN A FRAME
const animate = () => {
    //this clears old highlight
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.fillStyle = 'grey';
    //this is passing the game board constrolsBar
    ctx.fillRect(0,0,controlsBar.width, controlsBar.height);
    handleGameGrid();
    handleGameStatus();
    handleDefenders();
    handleEnemies();
    handleResources();
    handleProjectiles();
    frame++;
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

//FIX RESIZE
window.addEventListener('resize', ()=> {
    canvasPosition = canvas.getBoundingClientRect();
})