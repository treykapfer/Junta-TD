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

//SCALING VARIABLES
let level = 1;
let winningScore = 80;
let enemyRate = 650;
let enemyRateIncrease = 20;
let enemyFloor = 120;
let enemyCeiling = enemyRate;
let morassiumRate = 700;

//others
let enemyPositions = [];
let morassium = 0;
let numberOfCredits = 350;
let incrementer = 10;
let frame = 0;
let killCount = 0;
let enemyBaseSpeed = 0.4;

//SWITCHES
let gameOver = false;
let gameWon = false;
let levelCleared = false;
let bossActive = false;

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
const bullet = new Image();
bullet.src = 'assets/bullet.png';

class Projectile {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.power = 15;
        this.speed = 5;
    }
    update(){
        this.x += this.speed;
    }
    draw(){
        ctx.drawImage(bullet, 0, 0, 64, 64, this.x, this.y - 15, this.width, this.height);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
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
// const defender1card = new Image();
// defender1card.src = 'assets/defender1card.png';
const tank = new Image();
tank.src = 'assets/tank.png';
const destroyer = new Image();
destroyer.src = 'assets/destroyer.png';

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
        this.defenderType = defender1;
        //ANIMATION
        this.frameX = 0;
        this.frameY = 0;
        this.minFrame = 0;
        this.maxFrame = 22;
        this.spriteWidth = 181;
        this.spriteHeight = 203;
    }
    draw(){
        // ctx.fillStyle = 'green';
        // ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'gold';
        ctx.font = '14px orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 28, this.y);
        ctx.drawImage(this.defenderType, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    }
    update(){
        //run update if its shooting
        if (frame % 4 === 0) {
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
            if (this.frameX === 4) this.shootNow = true;
        }

        if (this.shooting && this.shootNow) {
                projectiles.push(new Projectile(this.x + 50, this.y + 30));
                this.shootNow = false;
            }
        if (this.shooting) {
            if (this.defenderType === defender1) {
            //shooting animation frames
            this.minFrame = 0;
            this.maxFrame = 16;
            }
            else if (this.defenderType === tank) {
                this.minFrame = 0;
                this.maxFrame = 10;
            }
            else {
                this.minFrame = 0;
                this.maxFrame = 7;
            }
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
                if (defenders[i].defenderType === destroyer) {
                    enemies[j].health -= 0.3;
                    //FIRE ANIMATION
                    ctx.fillStyle = 'rgba(255,0,0,0.333)';
                    ctx.fillRect(enemies[j].x+5+Math.floor(Math.random()*5), enemies[j].y+70+Math.floor(Math.random()*5), 7, 7);
                    ctx.fillStyle = 'rgba(255,0,0,0.333)';
                    ctx.fillRect(enemies[j].x+5+Math.floor(Math.random()*6), enemies[j].y+70+Math.floor(Math.random()*6), 7, 7);
                    ctx.fillStyle = 'rgba(255,165,0,0.333)';
                    ctx.fillRect(enemies[j].x+5 + Math.floor(Math.random()*7), enemies[j].y+70 + Math.floor(Math.random()*7), 5, 5);
                    ctx.fillStyle = 'rgba(139,0,0,0.333)';
                    ctx.fillRect(enemies[j].x+5 + Math.floor(Math.random()*8), enemies[j].y+70 + Math.floor(Math.random()*8), 5, 5);
                    ctx.fillStyle = 'rgba(255,0,0,0.333)';
                    ctx.fillRect(enemies[j].x+10+Math.floor(Math.random()*5), enemies[j].y+65+Math.floor(Math.random()*5), 7, 7);
                    ctx.fillStyle = 'rgba(255,0,0,0.333)';
                    ctx.fillRect(enemies[j].x+10+Math.floor(Math.random()*6), enemies[j].y+65+Math.floor(Math.random()*6), 7, 7);
                    ctx.fillStyle = 'rgba(255,165,0,0.333)';
                    ctx.fillRect(enemies[j].x+10 + Math.floor(Math.random()*7), enemies[j].y+65 + Math.floor(Math.random()*7), 5, 5);
                    ctx.fillStyle = 'rgba(139,0,0,0.333)';
                    ctx.fillRect(enemies[j].x+10 + Math.floor(Math.random()*8), enemies[j].y+65 + Math.floor(Math.random()*8), 5, 5);
                    ctx.fillStyle = 'rgba(255,0,0,0.333)';
                    ctx.fillRect(enemies[j].x+Math.floor(Math.random()*5), enemies[j].y+70+Math.floor(Math.random()*5), 7, 7);
                    ctx.fillStyle = 'rgba(255,0,0,0.333)';
                    ctx.fillRect(enemies[j].x+Math.floor(Math.random()*6), enemies[j].y+70+Math.floor(Math.random()*6), 7, 7);
                    ctx.fillStyle = 'rgba(255,165,0,0.333)';
                    ctx.fillRect(enemies[j].x + Math.floor(Math.random()*7), enemies[j].y+70 + Math.floor(Math.random()*7), 5, 5);
                    ctx.fillStyle = 'rgba(139,0,0,0.333)';
                    ctx.fillRect(enemies[j].x + Math.floor(Math.random()*8), enemies[j].y+70 + Math.floor(Math.random()*8), 5, 5);
                }
            }
            if (defenders[i] && defenders[i].health <= 0){
                defenders.splice(i, 1);
                i--;
                enemies[j].movement = enemies[j].speed;
            }
        }
    }
}

// const card1 = {
//     x: 10,
//     y: 10,
//     width: 70,
//     height: 85
// }
// const card2 = {
//     x: 90,
//     y: 10,
//     width: 70,
//     height: 85,
// }

// const chooseDefender = () => {
//     // img, sx, sy, sw, sh, dx, dy, dw, dh
//     ctx.lineWidth = 1;
//     ctx.fillStyle = 'rgba(0,0,0,0.333)';
//     ctx.fillRect(card1.x, card1.y, card1.width, card1.height);
//     //
//     ctx.drawImage(defender1card, 0, 0, 1000, 1000, 10, 10, 95, 95);

//     ctx.fillRect(card2.x, card2.y, card2.width, card2.height);
// }

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
        ctx.font = this.size + 'px orbitron';
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
const boss = new Image();
boss.src = 'assets/boss.png';
enemyTypes.push(boss);
const speedling = new Image();
speedling.src = 'assets/speedling.png';
const enemy2 = new Image();
enemy2.src = 'assets/enemy2.png'

class Enemy {
    constructor(verticalPosition) {
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.speed = Math.random() * 0.2 + enemyBaseSpeed;
        this.movement = this.speed;
        this.health = 100;
        this.maxHealth = this.health;
        this.enemyType = enemy1;
        //ANIMATION PROPERTIES
        this.frameX = 0;
        this.frameY = 0;
        this.minFrame = 0;
        this.maxFrame = 6;
        this.spriteWidth = 296;
        this.spriteHeight = 156;
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
        ctx.font = '14px orbitron';
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
        //LOSS CONDITION
        if (enemies[i].x < 0){
            gameOver = true;
        }
        if (enemies[i].health <= 0){
            //FLOATERS
            floatingMessages.push(new floatingMessage(`+${enemies[i].maxHealth / 10}`, enemies[i].x, enemies[i].y, 20, 'gold'));
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
        if (enemyRate > enemyFloor) {
            enemyRate -= enemyRateIncrease;
            if (enemyRate < enemyFloor) {
                enemyRate = enemyFloor;
            }
        console.log(`${enemyRate} new enemy spawn rate`);
        }
    }
    //SPAWNS HIGHER LEVEL ENEMIES AT STAGGERED RATE AFTER LEVEL 4
    if (frame % (enemyRate + 200 - (incrementer*5)/2) === 0 && morassium < winningScore && level >= 4) {
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
        let newEnemy2 = new Enemy(verticalPosition);
            newEnemy2.enemyType = enemy2;
            newEnemy2.health = 200;
            newEnemy2.maxHealth = 200;
            newEnemy2.speed = Math.random() * 0.5 + enemyBaseSpeed;
            newEnemy2.movement = newEnemy2.speed;
        enemies.push(newEnemy2);
        enemyPositions.push(verticalPosition);
    }
    //SPAWNS BOSS UNITS EVERY 10K FRAMES
    if (frame % (10000 - (incrementer+level)*100) === 0 && morassium < winningScore && level > 5) {
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
        enemies.push(new Boss(verticalPosition));
        enemyPositions.push(verticalPosition);
        console.log("boss spawned");
    }
}

// SPEEDLING HANDLER //
class Speedling {
    constructor(verticalPosition) {
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.speed = Math.random() * 0.7 + 3 + enemyBaseSpeed;
        this.movement = this.speed;
        this.health = 50;
        this.maxHealth = this.health;
        this.enemyType = speedling;
        //ANIMATION PROPERTIES
        this.frameX = 0;
        this.frameY = 0;
        this.minFrame = 0;
        this.maxFrame = 4;
        this.spriteWidth = 258;
        this.spriteHeight = 258;
    }
    update(){
        this.x -= this.movement;
        if (frame % 3 === 0) {
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
        }

    }
    draw(){
        ctx.fillStyle = 'gold';
        ctx.font = '14px orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 25, this.y);
        ctx.drawImage(this.enemyType, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    }
}

let speedlingMultiplier = 1;
const handleSpeedling = () => {
    if (frame % 2500 === 0 && frame !== 0) {
        for (let i = 0; i < speedlingMultiplier; i++) {
            console.log("speedling spawned")
            let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
            enemies.push(new Speedling(verticalPosition));
            enemyPositions.push(verticalPosition);
        }
        speedlingMultiplier++;
    } 
}

// BOSS HANDLER //
    class Boss {
        constructor(verticalPosition) {
            this.x = canvas.width;
            this.y = verticalPosition;
            this.width = cellSize + 50 - cellGap * 2;
            this.height = cellSize - cellGap * 2;
            this.speed = Math.random() * 0.6 + 0.4 + enemyBaseSpeed;
            this.movement = this.speed;
            this.health = 500;
            this.maxHealth = this.health;
            this.enemyType = boss;
            //ANIMATION PROPERTIES
            this.frameX = 0;
            this.frameY = 0;
            this.minFrame = 0;
            this.maxFrame = 12;
            this.spriteWidth = 578;
            this.spriteHeight = 450;
        }
        update(){
            this.x -= this.movement;
            if (frame % 3 === 0) {
                if (this.frameX < this.maxFrame) this.frameX++;
                else this.frameX = this.minFrame;
            }

        }
        draw(){
            ctx.fillStyle = 'gold';
            ctx.font = '14px orbitron';
            ctx.fillText(Math.floor(this.health), this.x + 25, this.y);
            ctx.drawImage(this.enemyType, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
        }
    }

const handleBoss = () => {
    //SPAWN ON 5's
    if (level % 5 === 0 && bossActive == false) {
        bossActive = true;
        if (level % 5 === 0) {
            for (let i = 0; i < level/2; i++) {
                let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
                enemies.push(new Boss(verticalPosition));
                enemyPositions.push(verticalPosition);
            }
        }
        for (let i = 0; i < level; i++) {
            let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
            enemies.push(new Speedling(verticalPosition));
            enemyPositions.push(verticalPosition);
        }
    }
    //turn off if not on level divisible by 5
    else if (level % 5 !== 0) bossActive = false;
}

//HOTFIX FOR MOVEMENT BUG
const refreshMovement = () => {
    for (let i = 0; i < defenders.length; i++) {
        for (let j = 0; j < enemies.length; j++) {
            if (defenders[i] && !collision(defenders[i], enemies[j])){
                enemies[j].movement = enemies[j].speed;
            }
        }
    }
}

// RESOURCES //
const morassiumImg = new Image();
morassiumImg.src = 'assets/morassium.png';
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
        ctx.drawImage(morassiumImg, 0, 0, 128, 128, this.x - 15, this.y - 15, this.width, this.height);
        ctx.font = '14px orbitron';
        ctx.fillText(this.amount, this.x + 15, this.y + 25);
    }
}
const handleResources = () => {
    if (frame % morassiumRate === 0 && morassium < winningScore && resources.length < 4){
        resources.push(new Resource());
    }
    for (let i = 0; i < resources.length; i++){
        resources[i].draw();
        if (resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)){
            morassium += resources[i].amount;
            floatingMessages.push(new floatingMessage(`+${resources[i].amount}`, resources[i].x, resources[i].y, 20, 'gold'));
            resources.splice(i, 1);
            i--;
        }
    }
}

// utilities //
const handleGameStatus = () => {
    ctx.fillStyle = 'gold';
    ctx.font = '20px orbitron';
    ctx.fillText(`Morassium: ${morassium}/${winningScore}`, 16, 36);
    ctx.fillText('Credits: ' + numberOfCredits, 16, 72);
    ctx.fillText('Level: ' + level, 264, 36);
    ctx.fillText('Kill Count: ' + killCount, 264, 72);

    if (gameOver){
        ctx.fillStyle = 'red';
        ctx.font = '60px orbitron';
        ctx.fillText('GAME OVER', 456, 72);
    }
    if (morassium >= winningScore && enemies.length === 0) {
        ctx.fillStyle = 'green';
        ctx.font = '60px orbitron';
        levelCleared = true;
    }
    if (level > 10) {
        ctx.fillStyle = 'green';
        ctx.font = '60px orbitron';
        ctx.fillText('YOU WON!', 456, 72);
        gameWon = true;
    }
}

const handleLevelClear = () => {
    if (levelCleared === true) {
        ///CLEAR STATS AND CASH IN MORASSIUM
        numberOfCredits += Math.floor(morassium*(incrementer/8));
        morassium = 0;
        
        ////DISPLAY MESSAGE
        if (level !== 10) {
        floatingMessages.push(new floatingMessage('LEVEL CLEARED', 425, 60, 32, 'lime'));
        floatingMessages.push(new floatingMessage('....CREDITS RECIEVED', 425, 120, 32, 'lime'));
        }

        ///INCRIMENT VARIABLES AND DIFFICULTY
        incrementer++;
        level++;
        if (morassiumRate < 300) morassiumRate += (incrementer*2);
        if (winningScore < 999) winningScore = Math.min(Math.floor(winningScore + incrementer*5, 999));
        
        //ENEMY SCALING
        // enemyRate = Math.floor(enemyRate * (incrementer/10));
        enemyCeiling = Math.max(Math.floor(enemyCeiling - (incrementer*2)), 200);
        enemyRate = enemyCeiling;
        enemyBaseSpeed += .05;
        enemyRateIncrease++;
        enemyFloor = Math.max(enemyFloor - (incrementer), 25);

        //CONSOLE LOGS
        console.log(`${enemyBaseSpeed} is new base speed`);
        console.log(`${enemyFloor} is new enemy floor`);
        console.log(`${enemyCeiling} is new enemy ceiling`);
        console.log(`${enemyRateIncrease} is new enemy increase rate`);

        levelCleared = false;
        
    }
}

//HANDLE DEFENDER CLICK
canvas.addEventListener('click', ()=> {
    const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
    const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
    let defenderCost = 100;
    let upgradeCost = 500;
    //STOP IT IF ITS IN THE HEADER
    if (gridPositionY < cellSize) return;
    //LOOP THROUGH THE ARRAY AND CHECK FOR SAME POSITION
    for (let i = 0; i < defenders.length; i++){
        //loop through the defender array and check their position
        //then get out of the loop if theres a stack
        if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY) {
            if (defenders[i].defenderType === tank) {
                if (numberOfCredits >= (upgradeCost*2))
                numberOfCredits -= (upgradeCost*2)
                defenders[i].defenderType = destroyer;
                defenders[i].spriteWidth = 240;
                defenders[i].spriteHeight = 133;
                defenders[i].health = 700;
                defenders[i].shootingSpeed = 45;
                defenders[i].maxFrame = 7;
                return;
            }
            else if (defenders[i].defenderType === defender1) {
                if (numberOfCredits >= upgradeCost) {
                    numberOfCredits -= upgradeCost;
                    defenders[i].defenderType = tank;
                    defenders[i].spriteWidth = 175;
                    defenders[i].spriteHeight = 157;
                    defenders[i].health = 300;
                    defenders[i].shootingSpeed = 65;
                    defenders[i].maxFrame = 10;
                    return;
                }
            }
            else return;
        }
    }
    //BUY DEFENDER
    if (numberOfCredits >= defenderCost) {
        defenders.push(new Defender(gridPositionX, gridPositionY));
        numberOfCredits -= defenderCost;
    } else {
        floatingMessages.push(new floatingMessage("You require more credits", mouse.x, mouse.y, 15, 'red'))
    }
});

//LOAD BACKGROUND
const background = new Image();
background.src = 'assets/background.png';

//DA GAME LOOP
//THIS IS WHAT HAPPENS IN A FRAME
const animate = () => {
    //this clears old highlight
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.drawImage(background, 0, 0, 900, 600, 0, 0, 900, 600);
    // ctx.fillStyle = 'grey';
    //this is passing the game board constrolsBar
    // ctx.fillRect(0,0,controlsBar.width, controlsBar.height);
    handleGameGrid();
    handleLevelClear();
    handleBoss();
    handleSpeedling();
    handleDefenders();
    handleEnemies();
    handleResources();
    handleProjectiles();
    // chooseDefender();
    handleFloatingMessages();
    handleGameStatus();
    refreshMovement();
    frame++;
    if (!gameOver && !gameWon) requestAnimationFrame(animate);
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

//CALL FUNCTIONS // ON LOAD
createGrid();
animate();

//FIX RESIZE
window.addEventListener('resize', ()=> {
    canvasPosition = canvas.getBoundingClientRect();
})