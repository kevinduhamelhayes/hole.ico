/**
 * Gestor de interfaz de usuario
 * Se encarga de mostrar el menú principal, la pantalla de juego, el puntaje y otros elementos de la UI
 */
class UIManager {
    /**
     * Constructor
     * @param {Object} options - Opciones de configuración
     */
    constructor(options = {}) {
        this.container = options.container || document.body;
        this.audioManager = options.audioManager || null;
        this.gameManager = options.gameManager || null;
        
        // Elementos de la UI
        this.loadingScreen = null;
        this.mainMenu = null;
        this.gameUI = null;
        this.pauseMenu = null;
        this.gameOverScreen = null;
        this.levelCompleteScreen = null;
        
        // Estado actual
        this.currentScreen = 'loading';
        
        // Inicializar
        this.init();
    }
    
    /**
     * Inicializa el gestor de UI
     */
    init() {
        // Crear elementos de la UI
        this.createLoadingScreen();
        this.createMainMenu();
        this.createGameUI();
        this.createPauseMenu();
        this.createGameOverScreen();
        this.createLevelCompleteScreen();
        
        // Mostrar pantalla de carga inicialmente
        this.showScreen('loading');
        
        console.log("UIManager: Inicializado");
    }
    
    /**
     * Crea la pantalla de carga
     */
    createLoadingScreen() {
        this.loadingScreen = document.createElement('div');
        this.loadingScreen.className = 'screen loading-screen';
        
        const loadingContent = document.createElement('div');
        loadingContent.className = 'loading-content';
        
        const title = document.createElement('h1');
        title.textContent = 'Hole.io Web';
        
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        
        const loadingText = document.createElement('p');
        loadingText.className = 'loading-text';
        loadingText.textContent = 'Cargando...';
        
        loadingContent.appendChild(title);
        loadingContent.appendChild(spinner);
        loadingContent.appendChild(loadingText);
        
        this.loadingScreen.appendChild(loadingContent);
        this.container.appendChild(this.loadingScreen);
    }
    
    /**
     * Crea el menú principal
     */
    createMainMenu() {
        this.mainMenu = document.createElement('div');
        this.mainMenu.className = 'screen main-menu';
        
        const menuContent = document.createElement('div');
        menuContent.className = 'menu-content';
        
        const title = document.createElement('h1');
        title.textContent = 'Hole.io Web';
        
        const playButton = document.createElement('button');
        playButton.className = 'menu-button play-button';
        playButton.textContent = 'Jugar';
        playButton.addEventListener('click', () => {
            if (this.audioManager) {
                this.audioManager.playSound('buttonClick');
            }
            this.showScreen('game');
            if (this.gameManager) {
                this.gameManager.startGame();
            }
        });
        
        const optionsButton = document.createElement('button');
        optionsButton.className = 'menu-button options-button';
        optionsButton.textContent = 'Opciones';
        optionsButton.addEventListener('click', () => {
            if (this.audioManager) {
                this.audioManager.playSound('buttonClick');
            }
            this.showOptions();
        });
        
        menuContent.appendChild(title);
        menuContent.appendChild(playButton);
        menuContent.appendChild(optionsButton);
        
        this.mainMenu.appendChild(menuContent);
        this.container.appendChild(this.mainMenu);
    }
    
    /**
     * Crea la UI del juego
     */
    createGameUI() {
        this.gameUI = document.createElement('div');
        this.gameUI.className = 'game-ui';
        
        // Información del jugador
        const playerInfo = document.createElement('div');
        playerInfo.className = 'player-info';
        
        const scoreContainer = document.createElement('div');
        scoreContainer.className = 'score-container';
        
        const scoreLabel = document.createElement('span');
        scoreLabel.className = 'score-label';
        scoreLabel.textContent = 'Puntuación:';
        
        const scoreValue = document.createElement('span');
        scoreValue.className = 'score-value';
        scoreValue.textContent = '0';
        
        scoreContainer.appendChild(scoreLabel);
        scoreContainer.appendChild(scoreValue);
        
        const sizeContainer = document.createElement('div');
        sizeContainer.className = 'size-container';
        
        const sizeLabel = document.createElement('span');
        sizeLabel.className = 'size-label';
        sizeLabel.textContent = 'Tamaño:';
        
        const sizeValue = document.createElement('span');
        sizeValue.className = 'size-value';
        sizeValue.textContent = '1.0';
        
        sizeContainer.appendChild(sizeLabel);
        sizeContainer.appendChild(sizeValue);
        
        const timeContainer = document.createElement('div');
        timeContainer.className = 'time-container';
        
        const timeLabel = document.createElement('span');
        timeLabel.className = 'time-label';
        timeLabel.textContent = 'Tiempo:';
        
        const timeValue = document.createElement('span');
        timeValue.className = 'time-value';
        timeValue.textContent = '60';
        
        timeContainer.appendChild(timeLabel);
        timeContainer.appendChild(timeValue);
        
        playerInfo.appendChild(scoreContainer);
        playerInfo.appendChild(sizeContainer);
        playerInfo.appendChild(timeContainer);
        
        // Botón de pausa
        const pauseButton = document.createElement('button');
        pauseButton.className = 'pause-button';
        pauseButton.textContent = '❚❚';
        pauseButton.addEventListener('click', () => {
            if (this.audioManager) {
                this.audioManager.playSound('buttonClick');
            }
            this.showScreen('pause');
            if (this.gameManager) {
                this.gameManager.pauseGame();
            }
        });
        
        // Barra de progreso
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        
        const progressLabel = document.createElement('span');
        progressLabel.className = 'progress-label';
        progressLabel.textContent = 'Progreso:';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressFill.style.width = '0%';
        
        progressBar.appendChild(progressFill);
        progressContainer.appendChild(progressLabel);
        progressContainer.appendChild(progressBar);
        
        // Controles móviles
        const mobileControls = document.createElement('div');
        mobileControls.className = 'mobile-controls';
        
        const joystickContainer = document.createElement('div');
        joystickContainer.className = 'joystick-container';
        
        const joystickBase = document.createElement('div');
        joystickBase.className = 'joystick-base';
        
        const joystickHandle = document.createElement('div');
        joystickHandle.className = 'joystick-handle';
        
        joystickBase.appendChild(joystickHandle);
        joystickContainer.appendChild(joystickBase);
        mobileControls.appendChild(joystickContainer);
        
        // Añadir elementos a la UI
        this.gameUI.appendChild(playerInfo);
        this.gameUI.appendChild(pauseButton);
        this.gameUI.appendChild(progressContainer);
        this.gameUI.appendChild(mobileControls);
        
        this.container.appendChild(this.gameUI);
        
        // Guardar referencias para actualizar
        this.scoreValue = scoreValue;
        this.sizeValue = sizeValue;
        this.timeValue = timeValue;
        this.progressFill = progressFill;
        this.joystickHandle = joystickHandle;
        this.joystickBase = joystickBase;
        
        // Inicializar joystick para móviles
        this.initJoystick();
    }
    
    /**
     * Inicializa el joystick para controles móviles
     */
    initJoystick() {
        if (!this.joystickBase || !this.joystickHandle) return;
        
        let isDragging = false;
        let startX, startY;
        let currentX, currentY;
        const maxDistance = 50; // Radio máximo del joystick
        
        // Función para actualizar la posición del joystick
        const updateJoystickPosition = (x, y) => {
            const deltaX = x - startX;
            const deltaY = y - startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance > maxDistance) {
                const ratio = maxDistance / distance;
                currentX = startX + deltaX * ratio;
                currentY = startY + deltaY * ratio;
            } else {
                currentX = x;
                currentY = y;
            }
            
            this.joystickHandle.style.left = `${currentX - startX}px`;
            this.joystickHandle.style.top = `${currentY - startY}px`;
            
            // Normalizar valores para el movimiento
            const normalizedX = (currentX - startX) / maxDistance;
            const normalizedY = (currentY - startY) / maxDistance;
            
            // Enviar al gestor de juego
            if (this.gameManager) {
                this.gameManager.setJoystickInput(normalizedX, normalizedY);
            }
        };
        
        // Eventos táctiles
        this.joystickBase.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.joystickBase.getBoundingClientRect();
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
            isDragging = true;
            updateJoystickPosition(touch.clientX, touch.clientY);
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const touch = e.touches[0];
            updateJoystickPosition(touch.clientX, touch.clientY);
        });
        
        document.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            this.joystickHandle.style.left = '0px';
            this.joystickHandle.style.top = '0px';
            
            // Resetear input
            if (this.gameManager) {
                this.gameManager.setJoystickInput(0, 0);
            }
        });
    }
    
    /**
     * Crea el menú de pausa
     */
    createPauseMenu() {
        this.pauseMenu = document.createElement('div');
        this.pauseMenu.className = 'screen pause-menu';
        
        const pauseContent = document.createElement('div');
        pauseContent.className = 'pause-content';
        
        const title = document.createElement('h2');
        title.textContent = 'Pausa';
        
        const resumeButton = document.createElement('button');
        resumeButton.className = 'menu-button resume-button';
        resumeButton.textContent = 'Continuar';
        resumeButton.addEventListener('click', () => {
            if (this.audioManager) {
                this.audioManager.playSound('buttonClick');
            }
            this.showScreen('game');
            if (this.gameManager) {
                this.gameManager.resumeGame();
            }
        });
        
        const optionsButton = document.createElement('button');
        optionsButton.className = 'menu-button options-button';
        optionsButton.textContent = 'Opciones';
        optionsButton.addEventListener('click', () => {
            if (this.audioManager) {
                this.audioManager.playSound('buttonClick');
            }
            this.showOptions();
        });
        
        const mainMenuButton = document.createElement('button');
        mainMenuButton.className = 'menu-button main-menu-button';
        mainMenuButton.textContent = 'Menú Principal';
        mainMenuButton.addEventListener('click', () => {
            if (this.audioManager) {
                this.audioManager.playSound('buttonClick');
            }
            this.showScreen('main');
            if (this.gameManager) {
                this.gameManager.endGame();
            }
        });
        
        pauseContent.appendChild(title);
        pauseContent.appendChild(resumeButton);
        pauseContent.appendChild(optionsButton);
        pauseContent.appendChild(mainMenuButton);
        
        this.pauseMenu.appendChild(pauseContent);
        this.container.appendChild(this.pauseMenu);
    }
    
    /**
     * Crea la pantalla de fin de juego
     */
    createGameOverScreen() {
        this.gameOverScreen = document.createElement('div');
        this.gameOverScreen.className = 'screen game-over-screen';
        
        const gameOverContent = document.createElement('div');
        gameOverContent.className = 'game-over-content';
        
        const title = document.createElement('h2');
        title.textContent = 'Fin del Juego';
        
        const scoreContainer = document.createElement('div');
        scoreContainer.className = 'final-score-container';
        
        const scoreLabel = document.createElement('span');
        scoreLabel.className = 'final-score-label';
        scoreLabel.textContent = 'Puntuación Final:';
        
        const scoreValue = document.createElement('span');
        scoreValue.className = 'final-score-value';
        scoreValue.textContent = '0';
        
        scoreContainer.appendChild(scoreLabel);
        scoreContainer.appendChild(scoreValue);
        
        const restartButton = document.createElement('button');
        restartButton.className = 'menu-button restart-button';
        restartButton.textContent = 'Reintentar';
        restartButton.addEventListener('click', () => {
            if (this.audioManager) {
                this.audioManager.playSound('buttonClick');
            }
            this.showScreen('game');
            if (this.gameManager) {
                this.gameManager.startGame();
            }
        });
        
        const mainMenuButton = document.createElement('button');
        mainMenuButton.className = 'menu-button main-menu-button';
        mainMenuButton.textContent = 'Menú Principal';
        mainMenuButton.addEventListener('click', () => {
            if (this.audioManager) {
                this.audioManager.playSound('buttonClick');
            }
            this.showScreen('main');
        });
        
        gameOverContent.appendChild(title);
        gameOverContent.appendChild(scoreContainer);
        gameOverContent.appendChild(restartButton);
        gameOverContent.appendChild(mainMenuButton);
        
        this.gameOverScreen.appendChild(gameOverContent);
        this.container.appendChild(this.gameOverScreen);
        
        // Guardar referencia para actualizar
        this.finalScoreValue = scoreValue;
    }
    
    /**
     * Crea la pantalla de nivel completado
     */
    createLevelCompleteScreen() {
        this.levelCompleteScreen = document.createElement('div');
        this.levelCompleteScreen.className = 'screen level-complete-screen';
        
        const levelCompleteContent = document.createElement('div');
        levelCompleteContent.className = 'level-complete-content';
        
        const title = document.createElement('h2');
        title.textContent = '¡Nivel Completado!';
        
        const scoreContainer = document.createElement('div');
        scoreContainer.className = 'final-score-container';
        
        const scoreLabel = document.createElement('span');
        scoreLabel.className = 'final-score-label';
        scoreLabel.textContent = 'Puntuación:';
        
        const scoreValue = document.createElement('span');
        scoreValue.className = 'final-score-value';
        scoreValue.textContent = '0';
        
        scoreContainer.appendChild(scoreLabel);
        scoreContainer.appendChild(scoreValue);
        
        const nextLevelButton = document.createElement('button');
        nextLevelButton.className = 'menu-button next-level-button';
        nextLevelButton.textContent = 'Siguiente Nivel';
        nextLevelButton.addEventListener('click', () => {
            if (this.audioManager) {
                this.audioManager.playSound('buttonClick');
            }
            this.showScreen('game');
            if (this.gameManager) {
                this.gameManager.nextLevel();
            }
        });
        
        const mainMenuButton = document.createElement('button');
        mainMenuButton.className = 'menu-button main-menu-button';
        mainMenuButton.textContent = 'Menú Principal';
        mainMenuButton.addEventListener('click', () => {
            if (this.audioManager) {
                this.audioManager.playSound('buttonClick');
            }
            this.showScreen('main');
        });
        
        levelCompleteContent.appendChild(title);
        levelCompleteContent.appendChild(scoreContainer);
        levelCompleteContent.appendChild(nextLevelButton);
        levelCompleteContent.appendChild(mainMenuButton);
        
        this.levelCompleteScreen.appendChild(levelCompleteContent);
        this.container.appendChild(this.levelCompleteScreen);
        
        // Guardar referencia para actualizar
        this.levelCompleteScoreValue = scoreValue;
    }
    
    /**
     * Muestra una pantalla específica
     * @param {string} screen - Pantalla a mostrar ('loading', 'main', 'game', 'pause', 'gameOver', 'levelComplete')
     */
    showScreen(screen) {
        // Ocultar todas las pantallas
        this.loadingScreen.style.display = 'none';
        this.mainMenu.style.display = 'none';
        this.gameUI.style.display = 'none';
        this.pauseMenu.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        this.levelCompleteScreen.style.display = 'none';
        
        // Mostrar la pantalla seleccionada
        switch (screen) {
            case 'loading':
                this.loadingScreen.style.display = 'flex';
                break;
            case 'main':
                this.mainMenu.style.display = 'flex';
                break;
            case 'game':
                this.gameUI.style.display = 'flex';
                break;
            case 'pause':
                this.pauseMenu.style.display = 'flex';
                break;
            case 'gameOver':
                this.gameOverScreen.style.display = 'flex';
                break;
            case 'levelComplete':
                this.levelCompleteScreen.style.display = 'flex';
                break;
        }
        
        this.currentScreen = screen;
    }
    
    /**
     * Muestra el menú de opciones
     */
    showOptions() {
        // Crear menú de opciones dinámicamente
        const optionsOverlay = document.createElement('div');
        optionsOverlay.className = 'options-overlay';
        
        const optionsContent = document.createElement('div');
        optionsContent.className = 'options-content';
        
        const title = document.createElement('h2');
        title.textContent = 'Opciones';
        
        // Volumen general
        const volumeContainer = document.createElement('div');
        volumeContainer.className = 'option-container';
        
        const volumeLabel = document.createElement('label');
        volumeLabel.textContent = 'Volumen General:';
        
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = '0';
        volumeSlider.max = '100';
        volumeSlider.value = this.audioManager ? this.audioManager.volume * 100 : 50;
        volumeSlider.addEventListener('input', () => {
            if (this.audioManager) {
                this.audioManager.setVolume(volumeSlider.value / 100);
            }
        });
        
        volumeContainer.appendChild(volumeLabel);
        volumeContainer.appendChild(volumeSlider);
        
        // Volumen de música
        const musicContainer = document.createElement('div');
        musicContainer.className = 'option-container';
        
        const musicLabel = document.createElement('label');
        musicLabel.textContent = 'Volumen de Música:';
        
        const musicSlider = document.createElement('input');
        musicSlider.type = 'range';
        musicSlider.min = '0';
        musicSlider.max = '100';
        musicSlider.value = this.audioManager ? this.audioManager.musicVolume * 100 : 30;
        musicSlider.addEventListener('input', () => {
            if (this.audioManager) {
                this.audioManager.setMusicVolume(musicSlider.value / 100);
            }
        });
        
        musicContainer.appendChild(musicLabel);
        musicContainer.appendChild(musicSlider);
        
        // Volumen de efectos
        const effectsContainer = document.createElement('div');
        effectsContainer.className = 'option-container';
        
        const effectsLabel = document.createElement('label');
        effectsLabel.textContent = 'Volumen de Efectos:';
        
        const effectsSlider = document.createElement('input');
        effectsSlider.type = 'range';
        effectsSlider.min = '0';
        effectsSlider.max = '100';
        effectsSlider.value = this.audioManager ? this.audioManager.effectsVolume * 100 : 70;
        effectsSlider.addEventListener('input', () => {
            if (this.audioManager) {
                this.audioManager.setEffectsVolume(effectsSlider.value / 100);
            }
        });
        
        effectsContainer.appendChild(effectsLabel);
        effectsContainer.appendChild(effectsSlider);
        
        // Botón para cerrar
        const closeButton = document.createElement('button');
        closeButton.className = 'menu-button close-button';
        closeButton.textContent = 'Cerrar';
        closeButton.addEventListener('click', () => {
            if (this.audioManager) {
                this.audioManager.playSound('buttonClick');
            }
            document.body.removeChild(optionsOverlay);
        });
        
        optionsContent.appendChild(title);
        optionsContent.appendChild(volumeContainer);
        optionsContent.appendChild(musicContainer);
        optionsContent.appendChild(effectsContainer);
        optionsContent.appendChild(closeButton);
        
        optionsOverlay.appendChild(optionsContent);
        document.body.appendChild(optionsOverlay);
    }
    
    /**
     * Actualiza la puntuación
     * @param {number} score - Nueva puntuación
     */
    updateScore(score) {
        if (this.scoreValue) {
            this.scoreValue.textContent = Math.floor(score);
        }
    }
    
    /**
     * Actualiza el tamaño del agujero
     * @param {number} size - Nuevo tamaño
     */
    updateSize(size) {
        if (this.sizeValue) {
            this.sizeValue.textContent = size.toFixed(1);
        }
    }
    
    /**
     * Actualiza el tiempo restante
     * @param {number} time - Tiempo restante en segundos
     */
    updateTime(time) {
        if (this.timeValue) {
            this.timeValue.textContent = Math.ceil(time);
        }
    }
    
    /**
     * Actualiza la barra de progreso
     * @param {number} progress - Progreso (0-1)
     */
    updateProgress(progress) {
        if (this.progressFill) {
            this.progressFill.style.width = `${progress * 100}%`;
        }
    }
    
    /**
     * Muestra la pantalla de fin de juego con la puntuación final
     * @param {number} score - Puntuación final
     */
    showGameOver(score) {
        if (this.finalScoreValue) {
            this.finalScoreValue.textContent = Math.floor(score);
        }
        this.showScreen('gameOver');
    }
    
    /**
     * Muestra la pantalla de nivel completado con la puntuación
     * @param {number} score - Puntuación del nivel
     */
    showLevelComplete(score) {
        if (this.levelCompleteScoreValue) {
            this.levelCompleteScoreValue.textContent = Math.floor(score);
        }
        this.showScreen('levelComplete');
    }
    
    /**
     * Actualiza el texto de la pantalla de carga
     * @param {string} text - Texto a mostrar
     */
    updateLoadingText(text) {
        const loadingText = this.loadingScreen.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = text;
        }
    }
    
    /**
     * Actualiza el progreso de carga
     * @param {number} progress - Progreso de carga (0-1)
     */
    updateLoadingProgress(progress) {
        const spinner = this.loadingScreen.querySelector('.spinner');
        if (spinner) {
            spinner.style.setProperty('--progress', `${progress * 100}%`);
        }
    }
}

// Exportar la clase
window.UIManager = UIManager; 