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
let enemyRate = 700;
let baseEnemyRate = enemyRate;
let enemyPositions = [];
let morassium = 0;
let numberOfCredits = 400;
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
const defender1 = new Image();
defender1.src = 'assets/defender1.png';
const defender1card = new Image();
defender1card.src = 'assets/defender1card.png';


class Defender {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        //as long as this.shooting = true create projectiles
        this.shooting = false;
        this.shootNow = false;
        this.health = 100;
        this.shootingSpeed = 100;
        //ANIMATION
        this.frameX = 0;
        this.frameY = 0;
        this.minFrame = 0;
        this.maxFrame = 22;
        this.spriteWidth = 920;
        this.spriteHeight = 1033;
    }
    draw(){
        // ctx.fillStyle = 'green';
        // ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'gold';
        ctx.font = '20px Arial';
        ctx.fillText(Math.floor(this.health), this.x + 20, this.y + 93);
        ctx.drawImage(defender1, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    }
    update(){
        //run update if its shooting
        if (frame % 3 === 0) {
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
            if (this.frameX === 4) this.shootNow = true;
        }

        if (this.shooting && this.shootNow) {
                projectiles.push(new Projectile(this.x + 50, this.y + 30));
                this.shootNow = false;
            }
        if (this.shooting) {
            //shooting animation frames
            this.minFrame = 0;
            this.maxFrame = 16;
        } else {
            //idle is not working - fix later
            this.minFrame = 0;
            this.maxFrame = 0;
        }
    }
}

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

const card1 = {
    x: 10,
    y: 10,
    width: 70,
    height: 85
}
const card2 = {
    x: 90,
    y: 10,
    width: 70,
    height: 85,
}

const chooseDefender = () => {
    // img, sx, sy, sw, sh, dx, dy, dw, dh
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.333)';
    ctx.fillRect(card1.x, card1.y, card1.width, card1.height);
    //
    ctx.drawImage(defender1card, 0, 0, 1000, 1000, 10, 10, 95, 95);

    ctx.fillRect(card2.x, card2.y, card2.width, card2.height);
}

// FLOATING MESSAGES //
const floatingMessages = [];
class floatingMessage {
    constructor(value, x, y, size, color){
        this.value = value;
        this.x = x;
        this.y = y;
        this.size = size;
        this.duration = 0;
        this.color = color;
        this.opacity = 1;
    }
    update(){
        this.y -= 0.3;
        this.duration += 1;
        if (this.opacity > 0.01) this.opacity -= 0.01;
    }
    draw(){
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.font = this.size + 'px Arial';
        ctx.fillText(this.value, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}

const handleFloatingMessages = () => {
    for (let i = 0; i < floatingMessages.length; i++) {
        floatingMessages[i].update();
        floatingMessages[i].draw();
        if (floatingMessages[i].duration >= 50){
            floatingMessages.splice(i, 1);
            i--;
        }
    }
}

// ENEMIES //
// SET ENEMY TYPES //
const enemyTypes = [];
const enemy1 = new Image();
enemy1.src = 'assets/enemy1.png';
enemyTypes.push(enemy1);
// const enemy2 = new Image();
// enemy2.src = 'assets/enemy2.png';
// enemyTypes.push(enemy2);

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
        this.enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        //ANIMATION PROPERTIES
        this.frameX = 0;
        this.frameY = 0;
        this.minFrame = 0;
        this.maxFrame = 6;
        this.spriteWidth = 738;
        this.spriteHeight = 388;
    }
    update(){
        //this will make the enemy move to the left
        this.x -= this.movement;
        if (frame % 4 === 0) {
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
        }

    }
    draw(){
        // ctx.fillStyle = 'red';
        // ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'gold';
        ctx.font = '16px Arial';
        ctx.fillText(Math.floor(this.health), this.x + 25, this.y);
        // ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
        ctx.drawImage(this.enemyType, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
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
            floatingMessages.push(new floatingMessage(`+${enemies[i].maxHealth / 10}`, 130, 80, 20, 'gold'))
            killCount += 1;
            floatingMessages.push(new floatingMessage(`+${enemies[i].maxHealth / 10}`, enemies[i].x, enemies[i].y, 20, 'black'))
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
        if (enemyRate > 80) enemyRate -= 10;
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
            floatingMessages.push(new floatingMessage(`+${resources[i].amount}`, resources[i].x, resources[i].y, 20, 'gold'))
            floatingMessages.push(new floatingMessage(`+${resources[i].amount}`, 150, 40, 20, 'gold'))
            resources.splice(i, 1);
            i--;
        }
    }
}

// utilities //
const handleGameStatus = () => {
    ctx.fillStyle = 'gold';
    ctx.font = '20px Arial';
    ctx.fillText('Morassium: ' + morassium, 175, 35);
    ctx.fillText('Credits: ' + numberOfCredits, 175, 75);
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
    } else {
        floatingMessages.push(new floatingMessage("You require more credits", mouse.x, mouse.y, 15, 'red'))
    }
});

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
    chooseDefender();
    handleFloatingMessages();
    frame++;
    if (!gameOver) requestAnimationFrame(animate);
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