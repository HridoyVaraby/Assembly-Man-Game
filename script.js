/**
 * Assembly Line Man Game
 * A mobile-first sorting game where players drag items to correct bins
 */

// Game configuration
const gameConfig = {
    // Difficulty settings
    difficulty: {
        easy: {
            itemSpeed: 15, // seconds to cross screen
            spawnRate: 3000, // ms between item spawns
            powerUpChance: 0.2 // probability of power-up appearing
        },
        medium: {
            itemSpeed: 10,
            spawnRate: 2000,
            powerUpChance: 0.15
        },
        hard: {
            itemSpeed: 7,
            spawnRate: 1500,
            powerUpChance: 0.1
        }
    },
    // Item types and their properties
    items: {
        fruit: [
            { emoji: '🍎', name: 'apple' },
            { emoji: '🍌', name: 'banana' },
            { emoji: '🍊', name: 'orange' },
            { emoji: '🍓', name: 'strawberry' },
            { emoji: '🍇', name: 'grapes' }
        ],
        tech: [
            { emoji: '📱', name: 'phone' },
            { emoji: '💻', name: 'laptop' },
            { emoji: '🎧', name: 'headphones' },
            { emoji: '⌚', name: 'smartwatch' },
            { emoji: '🖱️', name: 'mouse' }
        ],
        defective: [
            { emoji: '🍎⚠️', name: 'defective apple' },
            { emoji: '📱⚠️', name: 'defective phone' },
            { emoji: '🍌⚠️', name: 'defective banana' },
            { emoji: '💻⚠️', name: 'defective laptop' }
        ]
    },
    // Power-up settings
    powerUps: {
        slow: {
            duration: 5000, // ms
            cooldown: 15000 // ms
        },
        autoSort: {
            duration: 5000,
            cooldown: 20000
        },
        bonus: {
            duration: 10000,
            cooldown: 25000
        }
    },
    // Scoring settings
    scoring: {
        correctSort: 10,
        defectiveSort: 15,
        missedItem: -5,
        incorrectSort: -10,
        bonusMultiplier: 2
    },
    // Initial game state
    initialLives: 3
};

// Game state
let gameState = {
    isRunning: false,
    isPaused: false,
    score: 0,
    lives: gameConfig.initialLives,
    currentSettings: {
        difficulty: 'medium',
        soundEnabled: true
    },
    activePowerUps: {
        slow: false,
        autoSort: false,
        bonus: false
    },
    powerUpCooldowns: {
        slow: false,
        autoSort: false,
        bonus: false
    },
    spawnInterval: null,
    items: []
};

// Audio elements
const sounds = {
    correctSort: new Audio('./assets/correct.mp3'),
    incorrectSort: new Audio('./assets/incorrect.mp3'),
    missedItem: new Audio('./assets/missed.mp3'),
    powerUp: new Audio('./assets/powerup.mp3'),
    gameOver: new Audio('./assets/gameover.mp3')
};

// DOM Elements
const elements = {
    startScreen: document.getElementById('start-screen'),
    settingsScreen: document.getElementById('settings-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    pauseScreen: document.getElementById('pause-screen'),
    gameContainer: document.getElementById('game-container'),
    conveyorContainer: document.getElementById('conveyor-container'),
    conveyorBelt: document.getElementById('conveyor-belt'),
    itemsContainer: document.getElementById('items-container'),
    bins: document.querySelectorAll('.bin'),
    score: document.getElementById('score'),
    finalScore: document.getElementById('final-score'),
    lives: document.getElementById('lives'),
    pauseButton: document.getElementById('pause-button'),
    powerUps: {
        slow: document.getElementById('slow-power'),
        autoSort: document.getElementById('auto-sort-power'),
        bonus: document.getElementById('bonus-power')
    },
    // Buttons
    startButton: document.getElementById('start-button'),
    settingsButton: document.getElementById('settings-button'),
    settingsBackButton: document.getElementById('settings-back'),
    restartButton: document.getElementById('restart-button'),
    mainMenuButton: document.getElementById('main-menu-button'),
    resumeButton: document.getElementById('resume-button'),
    pauseMainMenuButton: document.getElementById('pause-main-menu'),
    // Settings
    difficultySelect: document.getElementById('difficulty'),
    soundToggle: document.getElementById('sound-toggle'),
    soundStatus: document.getElementById('sound-status')
};

/**
 * Initialize the game
 */
function initGame() {
    // Set up event listeners
    setupEventListeners();
    
    // Load settings if previously saved
    loadSettings();
    
    // Preload audio
    preloadAudio();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Menu buttons
    elements.startButton.addEventListener('click', startGame);
    elements.settingsButton.addEventListener('click', showSettings);
    elements.settingsBackButton.addEventListener('click', hideSettings);
    elements.restartButton.addEventListener('click', restartGame);
    elements.mainMenuButton.addEventListener('click', showMainMenu);
    elements.pauseButton.addEventListener('click', togglePause);
    elements.resumeButton.addEventListener('click', resumeGame);
    elements.pauseMainMenuButton.addEventListener('click', showMainMenu);
    
    // Settings
    elements.difficultySelect.addEventListener('change', updateDifficulty);
    elements.soundToggle.addEventListener('change', toggleSound);
    
    // Power-ups
    elements.powerUps.slow.addEventListener('click', activateSlowPowerUp);
    elements.powerUps.autoSort.addEventListener('click', activateAutoSortPowerUp);
    elements.powerUps.bonus.addEventListener('click', activateBonusPowerUp);
    
    // Set up bin event listeners for drag and drop
    elements.bins.forEach(bin => {
        bin.addEventListener('dragover', handleDragOver);
        bin.addEventListener('drop', handleDrop);
        bin.addEventListener('dragenter', handleDragEnter);
        bin.addEventListener('dragleave', handleDragLeave);
        
        // Touch events for mobile
        bin.addEventListener('touchstart', handleTouchStart);
        bin.addEventListener('touchmove', handleTouchMove);
        bin.addEventListener('touchend', handleTouchEnd);
    });
    
    // Keyboard accessibility
    document.addEventListener('keydown', handleKeyDown);
}

/**
 * Preload audio files
 */
function preloadAudio() {
    // Set volume for all sounds
    Object.values(sounds).forEach(sound => {
        sound.volume = 0.5;
        // Attempt to load the audio file
        sound.load();
    });
}

/**
 * Load saved settings from localStorage
 */
function loadSettings() {
    const savedSettings = localStorage.getItem('assemblyManSettings');
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            gameState.currentSettings = { ...gameState.currentSettings, ...settings };
            
            // Apply loaded settings to UI
            elements.difficultySelect.value = gameState.currentSettings.difficulty;
            elements.soundToggle.checked = gameState.currentSettings.soundEnabled;
            elements.soundStatus.textContent = gameState.currentSettings.soundEnabled ? 'On' : 'Off';
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }
}

/**
 * Save current settings to localStorage
 */
function saveSettings() {
    try {
        localStorage.setItem('assemblyManSettings', JSON.stringify(gameState.currentSettings));
    } catch (e) {
        console.error('Error saving settings:', e);
    }
}

/**
 * Update difficulty setting
 */
function updateDifficulty() {
    gameState.currentSettings.difficulty = elements.difficultySelect.value;
    saveSettings();
}

/**
 * Toggle sound on/off
 */
function toggleSound() {
    gameState.currentSettings.soundEnabled = elements.soundToggle.checked;
    elements.soundStatus.textContent = gameState.currentSettings.soundEnabled ? 'On' : 'Off';
    saveSettings();
}

/**
 * Play a sound if sound is enabled
 * @param {string} soundName - The name of the sound to play
 */
function playSound(soundName) {
    if (gameState.currentSettings.soundEnabled && sounds[soundName]) {
        // Clone the audio to allow overlapping sounds
        const sound = sounds[soundName].cloneNode();
        sound.volume = 0.5;
        sound.play().catch(e => console.error('Error playing sound:', e));
    }
}

/**
 * Show settings screen
 */
function showSettings() {
    elements.startScreen.classList.add('hidden');
    elements.settingsScreen.classList.remove('hidden');
}

/**
 * Hide settings screen
 */
function hideSettings() {
    elements.settingsScreen.classList.add('hidden');
    elements.startScreen.classList.remove('hidden');
}

/**
 * Start the game
 */
function startGame() {
    // Hide start screen
    elements.startScreen.classList.add('hidden');
    
    // Show game container and pause button
    elements.gameContainer.classList.remove('hidden');
    elements.pauseButton.classList.remove('hidden');
    
    // Reset game state
    resetGameState();
    
    // Start spawning items
    startItemSpawning();
    
    // Set game as running
    gameState.isRunning = true;
    gameState.isPaused = false;
}

/**
 * Reset the game state to initial values
 */
function resetGameState() {
    // Reset score and lives
    gameState.score = 0;
    gameState.lives = gameConfig.initialLives;
    gameState.items = [];
    
    // Reset power-ups
    gameState.activePowerUps = {
        slow: false,
        autoSort: false,
        bonus: false
    };
    
    gameState.powerUpCooldowns = {
        slow: false,
        autoSort: false,
        bonus: false
    };
    
    // Reset UI
    elements.score.textContent = '0';
    updateLivesDisplay();
    
    // Clear any existing items
    elements.itemsContainer.innerHTML = '';
    
    // Reset power-up buttons
    Object.keys(elements.powerUps).forEach(key => {
        elements.powerUps[key].disabled = false;
        elements.powerUps[key].classList.remove('power-up-active', 'ready');
    });
}

/**
 * Update the lives display
 */
function updateLivesDisplay() {
    elements.lives.innerHTML = '';
    for (let i = 0; i < gameState.lives; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart text-red-500 text-2xl mx-1';
        heart.textContent = '❤️';
        elements.lives.appendChild(heart);
    }
}

/**
 * Start spawning items on the conveyor belt
 */
function startItemSpawning() {
    const settings = gameConfig.difficulty[gameState.currentSettings.difficulty];
    
    // Clear any existing interval
    if (gameState.spawnInterval) {
        clearInterval(gameState.spawnInterval);
    }
    
    // Set new spawn interval
    gameState.spawnInterval = setInterval(() => {
        if (!gameState.isPaused && gameState.isRunning) {
            spawnItem();
        }
    }, settings.spawnRate);
}

/**
 * Spawn a new item on the conveyor belt
 */
function spawnItem() {
    const settings = gameConfig.difficulty[gameState.currentSettings.difficulty];
    
    // Determine item type
    let itemType, itemData;
    const rand = Math.random();
    
    if (rand < 0.1) {
        // 10% chance for defective item
        itemType = 'defective';
        itemData = gameConfig.items.defective[Math.floor(Math.random() * gameConfig.items.defective.length)];
    } else if (rand < 0.55) {
        // 45% chance for fruit
        itemType = 'fruit';
        itemData = gameConfig.items.fruit[Math.floor(Math.random() * gameConfig.items.fruit.length)];
    } else {
        // 45% chance for tech
        itemType = 'tech';
        itemData = gameConfig.items.tech[Math.floor(Math.random() * gameConfig.items.tech.length)];
    }
    
    // Create item element
    const item = document.createElement('div');
    item.className = 'game-item';
    item.setAttribute('draggable', 'true');
    item.setAttribute('data-type', itemType);
    item.setAttribute('data-name', itemData.name);
    item.setAttribute('aria-label', `${itemData.name} - drag to ${itemType} bin`);
    item.textContent = itemData.emoji;
    
    // Set random vertical position
    const containerHeight = elements.conveyorContainer.offsetHeight;
    const itemHeight = 60; // Matches CSS height
    const maxTop = containerHeight - itemHeight - 10;
    const minTop = 10;
    const topPosition = Math.floor(Math.random() * (maxTop - minTop)) + minTop;
    item.style.top = `${topPosition}px`;
    
    // Add to container
    elements.itemsContainer.appendChild(item);
    
    // Add to game state
    const itemId = Date.now() + Math.random().toString(16).slice(2);
    item.setAttribute('id', itemId);
    
    // Calculate animation duration based on difficulty and power-ups
    let duration = settings.itemSpeed;
    if (gameState.activePowerUps.slow) {
        duration *= 1.5; // 50% slower
    }
    
    // Set animation
    item.style.animation = `move-right ${duration}s linear forwards`;
    
    // Add to game state items array
    gameState.items.push({
        id: itemId,
        element: item,
        type: itemType,
        name: itemData.name
    });
    
    // Set up event listeners for dragging
    setupItemEventListeners(item);
    
    // Set timeout for when item reaches end of conveyor
    setTimeout(() => {
        if (document.getElementById(itemId)) {
            handleMissedItem(itemId);
        }
    }, duration * 1000);
    
    // Randomly enable a power-up
    if (Math.random() < settings.powerUpChance) {
        enableRandomPowerUp();
    }
}

/**
 * Set up event listeners for a draggable item
 * @param {HTMLElement} item - The item element
 */
function setupItemEventListeners(item) {
    // Drag events
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    
    // Touch events for mobile
    item.addEventListener('touchstart', handleItemTouchStart);
    item.addEventListener('touchmove', handleItemTouchMove);
    item.addEventListener('touchend', handleItemTouchEnd);
    
    // Make item container allow pointer events
    elements.itemsContainer.classList.remove('pointer-events-none');
}

/**
 * Handle drag start event
 * @param {DragEvent} e - The drag event
 */
function handleDragStart(e) {
    this.classList.add('dragging');
    e.dataTransfer.setData('text/plain', this.id);
    e.dataTransfer.effectAllowed = 'move';
}

/**
 * Handle drag end event
 */
function handleDragEnd() {
    this.classList.remove('dragging');
}

/**
 * Handle drag over event
 * @param {DragEvent} e - The drag event
 */
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

/**
 * Handle drag enter event
 */
function handleDragEnter() {
    this.classList.add('highlight');
}

/**
 * Handle drag leave event
 */
function handleDragLeave() {
    this.classList.remove('highlight');
}

/**
 * Handle drop event
 * @param {DragEvent} e - The drop event
 */
function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('highlight');
    
    const itemId = e.dataTransfer.getData('text/plain');
    const item = document.getElementById(itemId);
    
    if (item) {
        const itemType = item.getAttribute('data-type');
        const binType = this.getAttribute('data-type');
        
        handleItemSorting(item, itemType, binType);
    }
}

/**
 * Handle touch start on item
 * @param {TouchEvent} e - The touch event
 */
function handleItemTouchStart(e) {
    e.preventDefault();
    this.classList.add('dragging');
    
    // Create touch feedback
    createTouchFeedback(e.touches[0].clientX, e.touches[0].clientY);
}

/**
 * Handle touch move on item
 * @param {TouchEvent} e - The touch event
 */
function handleItemTouchMove(e) {
    if (!this.classList.contains('dragging')) return;
    
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    
    // Move the item with the touch
    this.style.position = 'fixed';
    this.style.left = `${x - 30}px`; // Center horizontally (item width is 60px)
    this.style.top = `${y - 30}px`; // Center vertically (item height is 60px)
    this.style.zIndex = '1000';
    
    // Check if touch is over a bin
    const elemBelow = document.elementFromPoint(x, y);
    const bin = elemBelow ? elemBelow.closest('.bin') : null;
    
    // Remove highlight from all bins
    elements.bins.forEach(b => b.classList.remove('highlight'));
    
    // Highlight bin if touch is over it
    if (bin) {
        bin.classList.add('highlight');
    }
}

/**
 * Handle touch end on item
 * @param {TouchEvent} e - The touch event
 */
function handleItemTouchEnd(e) {
    if (!this.classList.contains('dragging')) return;
    
    this.classList.remove('dragging');
    
    // Get the last touch position
    const touch = e.changedTouches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    
    // Find the bin element at the touch position
    const elemBelow = document.elementFromPoint(x, y);
    const bin = elemBelow ? elemBelow.closest('.bin') : null;
    
    // Remove highlight from all bins
    elements.bins.forEach(b => b.classList.remove('highlight'));
    
    if (bin) {
        const itemType = this.getAttribute('data-type');
        const binType = bin.getAttribute('data-type');
        
        handleItemSorting(this, itemType, binType);
    } else {
        // Reset item position if not dropped on a bin
        this.style.position = '';
        this.style.left = '';
        this.style.top = '';
        this.style.zIndex = '';
    }
}

/**
 * Handle touch events on bins
 * @param {TouchEvent} e - The touch event
 */
function handleTouchStart(e) {
    // Prevent default to avoid scrolling
    e.preventDefault();
}

/**
 * Handle touch move over bins
 * @param {TouchEvent} e - The touch event
 */
function handleTouchMove(e) {
    // This is handled by the item's touch move event
}

/**
 * Handle touch end on bins
 * @param {TouchEvent} e - The touch event
 */
function handleTouchEnd(e) {
    // This is handled by the item's touch end event
}

/**
 * Create visual feedback for touch events
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function createTouchFeedback(x, y) {
    const feedback = document.createElement('div');
    feedback.className = 'touch-feedback';
    feedback.style.left = `${x}px`;
    feedback.style.top = `${y}px`;
    
    document.body.appendChild(feedback);
    
    // Remove after animation completes
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.parentNode.removeChild(feedback);
        }
    }, 600);
}

/**
 * Handle item sorting logic
 * @param {HTMLElement} item - The item element
 * @param {string} itemType - The type of the item
 * @param {string} binType - The type of the bin
 */
function handleItemSorting(item, itemType, binType) {
    const isCorrect = itemType === binType;
    const itemId = item.id;
    
    // Remove item from DOM and game state
    removeItem(itemId);
    
    // Show feedback
    showSortingFeedback(item, isCorrect);
    
    // Update score
    if (isCorrect) {
        // Correct sorting
        let points = itemType === 'defective' ? 
            gameConfig.scoring.defectiveSort : 
            gameConfig.scoring.correctSort;
        
        // Apply bonus multiplier if active
        if (gameState.activePowerUps.bonus) {
            points *= gameConfig.scoring.bonusMultiplier;
        }
        
        updateScore(points);
        playSound('correctSort');
    } else {
        // Incorrect sorting
        updateScore(gameConfig.scoring.incorrectSort);
        playSound('incorrectSort');
    }
}

/**
 * Show visual feedback for sorting
 * @param {HTMLElement} item - The sorted item
 * @param {boolean} isCorrect - Whether sorting was correct
 */
function showSortingFeedback(item, isCorrect) {
    const feedback = document.createElement('div');
    feedback.className = `feedback-text ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`;
    feedback.textContent = isCorrect ? '+10' : '-10';
    
    // Position feedback near where the item was
    const rect = item.getBoundingClientRect();
    feedback.style.left = `${rect.left}px`;
    feedback.style.top = `${rect.top}px`;
    
    document.body.appendChild(feedback);
    
    // Remove after animation completes
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.parentNode.removeChild(feedback);
        }
    }, 1000);
}

/**
 * Handle missed item (reached end of conveyor)
 * @param {string} itemId - The ID of the missed item
 */
function handleMissedItem(itemId) {
    const item = document.getElementById(itemId);
    if (!item) return; // Item might have been sorted already
    
    // Remove item
    removeItem(itemId);
    
    // Update score
    updateScore(gameConfig.scoring.missedItem);
    
    // Reduce lives
    gameState.lives--;
    updateLivesDisplay();
    
    // Play sound
    playSound('missedItem');
    
    // Check for game over
    if (gameState.lives <= 0) {
        endGame();
    }
}

/**
 * Remove an item from the game
 * @param {string} itemId - The ID of the item to remove
 */
function removeItem(itemId) {
    // Remove from DOM
    const item = document.getElementById(itemId);
    if (item && item.parentNode) {
        item.parentNode.removeChild(item);
    }
    
    // Remove from game state
    gameState.items = gameState.items.filter(item => item.id !== itemId);
}

/**
 * Update the score
 * @param {number} points - Points to add (can be negative)
 */
function updateScore(points) {
    gameState.score += points;
    // Prevent negative score
    if (gameState.score < 0) gameState.score = 0;
    
    elements.score.textContent = gameState.score;
}

/**
 * End the game
 */
function endGame() {
    // Stop the game
    gameState.isRunning = false;
    
    // Clear spawn interval
    if (gameState.spawnInterval) {
        clearInterval(gameState.spawnInterval);
        gameState.spawnInterval = null;
    }
    
    // Play game over sound
    playSound('gameOver');
    
    // Update final score
    elements.finalScore.textContent = gameState.score;
    
    // Hide game container and pause button
    elements.gameContainer.classList.add('hidden');
    elements.pauseButton.classList.add('hidden');
    
    // Show game over screen
    elements.gameOverScreen.classList.remove('hidden');
}

/**
 * Restart the game
 */
function restartGame() {
    // Hide game over screen
    elements.gameOverScreen.classList.add('hidden');
    
    // Start a new game
    startGame();
}

/**
 * Show the main menu
 */
function showMainMenu() {
    // Hide all screens
    elements.gameOverScreen.classList.add('hidden');
    elements.pauseScreen.classList.add('hidden');
    elements.gameContainer.classList.add('hidden');
    elements.pauseButton.classList.add('hidden');
    
    // Stop the game
    gameState.isRunning = false;
    gameState.isPaused = false;
    
    // Clear spawn interval
    if (gameState.spawnInterval) {
        clearInterval(gameState.spawnInterval);
        gameState.spawnInterval = null;
    }
    
    // Clear any existing items
    elements.itemsContainer.innerHTML = '';
    
    // Show start screen
    elements.startScreen.classList.remove('hidden');
}

/**
 * Toggle game pause state
 */
function togglePause() {
    if (gameState.isPaused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

/**
 * Pause the game
 */
function pauseGame() {
    if (!gameState.isRunning) return;
    
    gameState.isPaused = true;
    
    // Pause all item animations
    document.querySelectorAll('.game-item').forEach(item => {
        const computedStyle = window.getComputedStyle(item);
        const animation = computedStyle.getPropertyValue('animation');
        
        // Store current animation state
        item.dataset.pausedAnimation = animation;
        
        // Pause the animation
        item.style.animationPlayState = 'paused';
    });
    
    // Show pause screen
    elements.pauseScreen.classList.remove('hidden');
}

/**
 * Resume the game
 */
function resumeGame() {
    if (!gameState.isRunning) return;
    
    gameState.isPaused = false;
    
    // Resume all item animations
    document.querySelectorAll('.game-item').forEach(item => {
        item.style.animationPlayState = 'running';
    });
    
    // Hide pause screen
    elements.pauseScreen.classList.add('hidden');
}

/**
 * Enable a random power-up
 */
function enableRandomPowerUp() {
    // Get all power-ups that are not in cooldown
    const availablePowerUps = Object.keys(gameState.powerUpCooldowns).filter(
        key => !gameState.powerUpCooldowns[key]
    );
    
    if (availablePowerUps.length === 0) return;
    
    // Select a random power-up
    const powerUp = availablePowerUps[Math.floor(Math.random() * availablePowerUps.length)];
    
    // Enable the power-up
    elements.powerUps[powerUp].disabled = false;
    elements.powerUps[powerUp].classList.add('ready');
}

/**
 * Activate the slow power-up
 */
function activateSlowPowerUp() {
    if (gameState.powerUpCooldowns.slow) return;
    
    // Play power-up sound
    playSound('powerUp');
    
    // Activate power-up
    gameState.activePowerUps.slow = true;
    gameState.powerUpCooldowns.slow = true;
    
    // Update UI
    elements.powerUps.slow.disabled = true;
    elements.powerUps.slow.classList.remove('ready');
    elements.powerUps.slow.classList.add('power-up-active');
    
    // Slow down all current items
    document.querySelectorAll('.game-item').forEach(item => {
        // Get current animation duration
        const computedStyle = window.getComputedStyle(item);
        const animationDuration = parseFloat(computedStyle.animationDuration);
        
        // Slow down by 50%
        item.style.animationDuration = `${animationDuration * 1.5}s`;
    });
    
    // Set timeout to deactivate
    setTimeout(() => {
        gameState.activePowerUps.slow = false;
        elements.powerUps.slow.classList.remove('power-up-active');
        
        // Reset item speeds to normal
        document.querySelectorAll('.game-item').forEach(item => {
            const computedStyle = window.getComputedStyle(item);
            const animationDuration = parseFloat(computedStyle.animationDuration);
            
            // Return to normal speed
            item.style.animationDuration = `${animationDuration / 1.5}s`;
        });
    }, gameConfig.powerUps.slow.duration);
    
    // Set cooldown
    setTimeout(() => {
        gameState.powerUpCooldowns.slow = false;
        if (gameState.isRunning && !gameState.isPaused) {
            elements.powerUps.slow.disabled = false;
        }
    }, gameConfig.powerUps.slow.cooldown);
}

/**
 * Activate the auto-sort power-up
 */
function activateAutoSortPowerUp() {
    if (gameState.powerUpCooldowns.autoSort) return;
    
    // Play power-up sound
    playSound('powerUp');
    
    // Activate power-up
    gameState.activePowerUps.autoSort = true;
    gameState.powerUpCooldowns.autoSort = true;
    
    // Update UI
    elements.powerUps.autoSort.disabled = true;
    elements.powerUps.autoSort.classList.remove('ready');
    elements.powerUps.autoSort.classList.add('power-up-active');
    
    // Auto-sort the next few items
    const autoSortInterval = setInterval(() => {
        if (!gameState.isRunning || gameState.isPaused || !gameState.activePowerUps.autoSort) {
            clearInterval(autoSortInterval);
            return;
        }
        
        // Find the oldest item on the conveyor
        if (gameState.items.length > 0) {
            const oldestItem = gameState.items[0];
            const item = document.getElementById(oldestItem.id);
            
            if (item) {
                // Find the correct bin
                const binType = oldestItem.type;
                const bin = document.querySelector(`.bin[data-type="${binType}"]`);
                
                if (bin) {
                    // Auto-sort the item
                    handleItemSorting(item, binType, binType);
                }
            }
        }
    }, 1000); // Auto-sort an item every second
    
    // Set timeout to deactivate
    setTimeout(() => {
        gameState.activePowerUps.autoSort = false;
        elements.powerUps.autoSort.classList.remove('power-up-active');
        clearInterval(autoSortInterval);
    }, gameConfig.powerUps.autoSort.duration);
    
    // Set cooldown
    setTimeout(() => {
        gameState.powerUpCooldowns.autoSort = false;
        if (gameState.isRunning && !gameState.isPaused) {
            elements.powerUps.autoSort.disabled = false;
        }
    }, gameConfig.powerUps.autoSort.cooldown);
}

/**
 * Activate the bonus power-up
 */
function activateBonusPowerUp() {
    if (gameState.powerUpCooldowns.bonus) return;
    
    // Play power-up sound
    playSound('powerUp');
    
    // Activate power-up
    gameState.activePowerUps.bonus = true;
    gameState.powerUpCooldowns.bonus = true;
    
    // Update UI
    elements.powerUps.bonus.disabled = true;
    elements.powerUps.bonus.classList.remove('ready');
    elements.powerUps.bonus.classList.add('power-up-active');
    
    // Show bonus active indicator
    const bonusIndicator = document.createElement('div');
    bonusIndicator.className = 'fixed top-16 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 rounded-lg z-50';
    bonusIndicator.textContent = '⭐ BONUS ACTIVE: 2x Points!';
    bonusIndicator.id = 'bonus-indicator';
    document.body.appendChild(bonusIndicator);
    
    // Set timeout to deactivate
    setTimeout(() => {
        gameState.activePowerUps.bonus = false;
        elements.powerUps.bonus.classList.remove('power-up-active');
        
        // Remove bonus indicator
        const indicator = document.getElementById('bonus-indicator');
        if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }, gameConfig.powerUps.bonus.duration);
    
    // Set cooldown
    setTimeout(() => {
        gameState.powerUpCooldowns.bonus = false;
        if (gameState.isRunning && !gameState.isPaused) {
            elements.powerUps.bonus.disabled = false;
        }
    }, gameConfig.powerUps.bonus.cooldown);
}

/**
 * Handle keyboard events for accessibility
 * @param {KeyboardEvent} e - The keyboard event
 */
function handleKeyDown(e) {
    // Only process keyboard events when game is running
    if (!gameState.isRunning) return;
    
    switch (e.key) {
        case 'p':
        case 'P':
            // Pause/resume game
            togglePause();
            break;
        case '1':
            // Activate slow power-up
            if (!elements.powerUps.slow.disabled) {
                activateSlowPowerUp();
            }
            break;
        case '2':
            // Activate auto-sort power-up
            if (!elements.powerUps.autoSort.disabled) {
                activateAutoSortPowerUp();
            }
            break;
        case '3':
            // Activate bonus power-up
            if (!elements.powerUps.bonus.disabled) {
                activateBonusPowerUp();
            }
            break;
        case 'Escape':
            // Pause game
            if (!gameState.isPaused) {
                pauseGame();
            }
            break;
    }
}

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initGame);