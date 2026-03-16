// Water Quest is a beginner-friendly whack-a-mole style game.
// The player clicks the water droplet before it disappears.

// -----------------------------
// 1. Store the main DOM elements
// -----------------------------
const grid = document.querySelector('.game-grid');
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score');
const messageDisplay = document.getElementById('message');
const startButton = document.getElementById('start-game');
const resetButton = document.getElementById('reset-game');

// -----------------------------
// 2. Set up game constants
// -----------------------------
const GRID_CELL_COUNT = 6;
const STARTING_TIME = 60;
const WINNING_SCORE = 20;
const DIRTY_DROPLET_CHANCE = 0.3;
const DROPLET_VISIBLE_TIME = 1500;
const CLEAN_DROPLET_SYMBOL = '💧';
const DIRTY_DROPLET_IMAGE_PATH = 'img/Dirty%20Water%20Droplet.jpg';
const CONFETTI_COLORS = ['#FFC907', '#2E9DF7', '#8BD1CB', '#4FCB53', '#FF902A', '#F16061'];

// These arrays store possible messages for the end of the game.
// The game will choose one message at random depending on the score.
const winningMessages = [
  'Amazing work! You collected plenty of clean water drops!',
  'You win! Your quick clicks helped gather lots of clean water!',
  'Great job! You reached the goal and finished your water quest!'
];

const losingMessages = [
  'Nice try! Keep practicing and see if you can reach 20 drops next time.',
  'Almost there! Try again and collect even more clean water drops.',
  'Keep going! Start another round and aim for 20 or more drops.'
];

// -----------------------------
// 3. Keep track of game state
// -----------------------------
let gameState = 'idle';
let score = 0;
let timeLeft = STARTING_TIME;
let timerIntervalId = null;
let dropletIntervalId = null;
let currentDropletIndex = -1;
let previousDropletIndex = -1;
let currentDropletType = 'clean';
let confettiTimeoutId = null;

// This array will store the 6 grid cells after we create them.
let cells = [];

// --------------------------------
// 4. Build the 3x2 game board once
// --------------------------------
function createGrid() {
  grid.innerHTML = '';
  cells = [];

  for (let index = 0; index < GRID_CELL_COUNT; index += 1) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    cell.dataset.index = index;

    // Each cell listens for clicks.
    // The handler checks if this cell currently contains the droplet.
    cell.addEventListener('click', handleCellClick);

    grid.appendChild(cell);
    cells.push(cell);
  }
}

// -------------------------------------------------
// 5. Update the score, timer, and message on screen
// -------------------------------------------------
function updateDisplay() {
  timerDisplay.textContent = timeLeft;
  scoreDisplay.textContent = score;
}

function setMessage(text, styleType) {
  messageDisplay.textContent = text;
  messageDisplay.classList.remove('message-win', 'message-loss');

  if (styleType === 'win') {
    messageDisplay.classList.add('message-win');
  }

  if (styleType === 'loss') {
    messageDisplay.classList.add('message-loss');
  }
}

function getRandomMessage(messages) {
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

// -------------------------------------------
// 6.5 Show a confetti celebration on a win
// -------------------------------------------
function launchConfetti() {
  // Remove any existing confetti layer first.
  const existingLayer = document.querySelector('.confetti-layer');
  if (existingLayer) {
    existingLayer.remove();
  }

  const confettiLayer = document.createElement('div');
  confettiLayer.className = 'confetti-layer';

  for (let index = 0; index < 70; index += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.backgroundColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.animationDelay = Math.random() * 0.5 + 's';
    piece.style.animationDuration = 1.6 + Math.random() * 1.2 + 's';
    piece.style.transform = 'rotate(' + Math.floor(Math.random() * 360) + 'deg)';
    confettiLayer.appendChild(piece);
  }

  document.body.appendChild(confettiLayer);

  // Clean up the confetti elements after the animation ends.
  clearTimeout(confettiTimeoutId);
  confettiTimeoutId = setTimeout(function () {
    confettiLayer.remove();
  }, 3200);
}

// ---------------------------------------------------------
// 6. Keep each droplet visible for 1.5 seconds on the board
// ---------------------------------------------------------
function getDropletSpeed() {
  return DROPLET_VISIBLE_TIME;
}

// -------------------------------------------------
// 7. Remove the droplet from every grid cell first
// -------------------------------------------------
function clearDroplet() {
  cells.forEach(function (cell) {
    cell.textContent = '';
    cell.classList.remove('has-droplet', 'has-dirty-droplet', 'collected', 'dirty-hit');
  });

  currentDropletIndex = -1;
  currentDropletType = 'clean';
}

// ---------------------------------------------------------
// 8. Choose a random cell and avoid repeating the last one
// ---------------------------------------------------------
function getRandomCellIndex() {
  let randomIndex = Math.floor(Math.random() * cells.length);

  // If we pick the same cell twice in a row, try again.
  while (cells.length > 1 && randomIndex === previousDropletIndex) {
    randomIndex = Math.floor(Math.random() * cells.length);
  }

  return randomIndex;
}

// -------------------------------------------------
// 9. Show one droplet in one random cell at a time
// -------------------------------------------------
function spawnDroplet() {
  if (gameState !== 'playing') {
    return;
  }

  clearDroplet();

  const randomIndex = getRandomCellIndex();
  const randomCell = cells[randomIndex];

  // Dirty droplets are less common than clean droplets.
  const shouldSpawnDirtyDroplet = Math.random() < DIRTY_DROPLET_CHANCE;

  if (shouldSpawnDirtyDroplet) {
    const dirtyImage = document.createElement('img');
    dirtyImage.className = 'dirty-droplet';
    dirtyImage.src = DIRTY_DROPLET_IMAGE_PATH;
    dirtyImage.alt = 'Dirty water droplet';

    // If the image fails to load, still show something visible.
    dirtyImage.addEventListener('error', function () {
      randomCell.innerHTML = '<span class="droplet">⚠️</span>';
    });

    randomCell.appendChild(dirtyImage);
    randomCell.classList.add('has-dirty-droplet');
    currentDropletType = 'dirty';
  } else {
    // Put the clean droplet styling on a child span so the cell can keep its own color.
    randomCell.innerHTML = '<span class="droplet">' + CLEAN_DROPLET_SYMBOL + '</span>';
    randomCell.classList.add('has-droplet');
    currentDropletType = 'clean';
  }

  currentDropletIndex = randomIndex;
  previousDropletIndex = randomIndex;
}

// ----------------------------------------------------------------
// 10. Start or restart the interval that moves the droplet around
// ----------------------------------------------------------------
function startDropletInterval() {
  clearInterval(dropletIntervalId);
  dropletIntervalId = setInterval(spawnDroplet, getDropletSpeed());
}

// --------------------------------------------------
// 11. Handle clicks and only count them while playing
// --------------------------------------------------
function handleCellClick(event) {
  if (gameState !== 'playing') {
    return;
  }

  const clickedIndex = Number(event.currentTarget.dataset.index);

  if (clickedIndex !== currentDropletIndex) {
    return;
  }

  if (currentDropletType === 'dirty') {
    score = Math.max(0, score - 1);
    setMessage('Oops! That was dirty water. You lost 1 point.');
    event.currentTarget.classList.add('dirty-hit');
  } else {
    score += 1;
    event.currentTarget.classList.add('collected');
  }

  updateDisplay();

  // Let the feedback color flash briefly, then fully clear and spawn again.
  setTimeout(function () {
    clearDroplet();
    spawnDroplet();
    startDropletInterval();
  }, 180);
}

// -------------------------------------------------
// 12. Count down from 30 seconds to 0 seconds left
// -------------------------------------------------
function startTimer() {
  clearInterval(timerIntervalId);

  timerIntervalId = setInterval(function () {
    timeLeft -= 1;
    updateDisplay();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

// -------------------------------------------
// 13. Reset values and begin a brand-new game
// -------------------------------------------
function startGame() {
  gameState = 'playing';
  score = 0;
  timeLeft = STARTING_TIME;
  currentDropletIndex = -1;
  previousDropletIndex = -1;
  currentDropletType = 'clean';

  updateDisplay();
  setMessage('Collect as many clean water drops as you can.');

  startButton.disabled = true;
  startButton.textContent = 'Game In Progress';

  clearDroplet();
  spawnDroplet();
  startTimer();
  startDropletInterval();
}

// -------------------------------------------------
// 14. Reset the game to idle without auto-restarting
// -------------------------------------------------
function resetGame() {
  clearInterval(timerIntervalId);
  clearInterval(dropletIntervalId);
  clearTimeout(confettiTimeoutId);

  const existingLayer = document.querySelector('.confetti-layer');
  if (existingLayer) {
    existingLayer.remove();
  }

  gameState = 'idle';
  score = 0;
  timeLeft = STARTING_TIME;
  currentDropletIndex = -1;
  previousDropletIndex = -1;
  currentDropletType = 'clean';

  clearDroplet();
  updateDisplay();

  startButton.disabled = false;
  startButton.textContent = 'Start Game';

  setMessage('Game reset. Press Start Game when you are ready.');
}

// ------------------------------------------
// 15. Stop the game and show the final score
// ------------------------------------------
function endGame() {
  gameState = 'gameOver';

  const didPlayerWin = score >= WINNING_SCORE;
  const messageList = didPlayerWin ? winningMessages : losingMessages;
  const randomEndMessage = getRandomMessage(messageList);

  clearInterval(timerIntervalId);
  clearInterval(dropletIntervalId);
  clearDroplet();

  startButton.disabled = false;
  startButton.textContent = 'Play Again';

  if (didPlayerWin) {
    launchConfetti();
  }

  setMessage(
    'Game Over! You collected ' + score + ' drops of clean water! ' + randomEndMessage,
    didPlayerWin ? 'win' : 'loss'
  );
}

// -------------------------------------------------
// 16. Prepare the page when it first loads in HTML
// -------------------------------------------------
createGrid();
updateDisplay();

// The start button can begin a new round from idle or game over.
startButton.addEventListener('click', function () {
  if (gameState === 'playing') {
    return;
  }

  startGame();
});

resetButton.addEventListener('click', function () {
  resetGame();
});
