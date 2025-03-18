/**
 * Hole.io Web - Juego principal
 * Integra todos los componentes y gestores
 */
class Game {
    /**
     * Constructor
     * @param {Object} options - Opciones de configuración
     */
    constructor(options = {}) {
        // Contenedor del juego
        this.container = options.container || document.body;
        
        // Configuración
        this.config = {
            width: window.innerWidth,
            height: window.innerHeight,
            mapSize: options.mapSize || 100,
            timeLimit: options.timeLimit || 60,
            initialHoleSize: options.initialHoleSize || 1.0,
            maxHoleSize: options.maxHoleSize || 10.0,
            growFactor: options.growFactor || 0.02,
            cameraHeight: options.cameraHeight || 20,
            cameraDistance: options.cameraDistance || 20
        };
        
        // Estado del juego
        this.state = {
            running: false,
            paused: false,
            score: 0,
            level: 1,
            timeRemaining: this.config.timeLimit,
            lastTime: 0,
            inputX: 0,
            inputY: 0,
            keys: {}
        };
        
        // Componentes Three.js
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;
        
        // Gestores
        this.physicsEngine = null;
        this.objectManager = null;
        this.cameraManager = null;
        this.audioManager = null;
        this.uiManager = null;
        
        // Jugador (agujero)
        this.hole = null;
        
        // Inicializar
        this.init();
    }
    
    /**
     * Inicializa el juego
     */
    async init() {
        try {
            console.log("Inicializando juego...");
            
            // Crear escena Three.js
            this.initThree();
            
            // Crear gestores
            this.initManagers();
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Cargar recursos
            await this.loadResources();
            
            // Mostrar menú principal
            this.uiManager.showScreen('main');
            
            // Iniciar bucle de renderizado
            this.animate();
            
            console.log("Juego inicializado correctamente");
        } catch (error) {
            console.error("Error al inicializar el juego:", error);
            this.showError("Error al inicializar el juego: " + error.message);
        }
    }
    
    /**
     * Inicializa Three.js
     */
    initThree() {
        // Crear escena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Color de cielo
        
        // Crear cámara
        this.camera = new THREE.PerspectiveCamera(
            60, 
            this.config.width / this.config.height, 
            0.1, 
            1000
        );
        this.camera.position.set(0, this.config.cameraHeight, -this.config.cameraDistance);
        this.camera.lookAt(0, 0, 0);
        
        // Crear renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.config.width, this.config.height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Añadir canvas al DOM
        this.renderer.domElement.id = 'game-canvas';
        this.container.appendChild(this.renderer.domElement);
        
        // Crear reloj para animaciones
        this.clock = new THREE.Clock();
        
        // Crear luces
        this.createLights();
        
        // Crear suelo
        this.createGround();
        
        // Crear límites del mapa
        this.createMapBoundaries();
    }
    
    /**
     * Crea las luces de la escena
     */
    createLights() {
        // Luz ambiental
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Luz direccional (sol)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        
        // Configurar sombras
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        
        this.scene.add(directionalLight);
    }
    
    /**
     * Crea el suelo
     */
    createGround() {
        // Geometría del suelo
        const groundGeometry = new THREE.PlaneGeometry(
            this.config.mapSize, 
            this.config.mapSize, 
            10, 
            10
        );
        
        // Material del suelo
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x999999,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Crear malla
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        
        this.scene.add(ground);
    }
    
    /**
     * Crea los límites del mapa
     */
    createMapBoundaries() {
        const halfSize = this.config.mapSize / 2;
        const wallHeight = 5;
        const wallThickness = 1;
        
        // Material para los límites
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Crear paredes
        const walls = [
            // Norte
            {
                position: new THREE.Vector3(0, wallHeight / 2, -halfSize - wallThickness / 2),
                size: new THREE.Vector3(this.config.mapSize + wallThickness * 2, wallHeight, wallThickness)
            },
            // Sur
            {
                position: new THREE.Vector3(0, wallHeight / 2, halfSize + wallThickness / 2),
                size: new THREE.Vector3(this.config.mapSize + wallThickness * 2, wallHeight, wallThickness)
            },
            // Este
            {
                position: new THREE.Vector3(halfSize + wallThickness / 2, wallHeight / 2, 0),
                size: new THREE.Vector3(wallThickness, wallHeight, this.config.mapSize)
            },
            // Oeste
            {
                position: new THREE.Vector3(-halfSize - wallThickness / 2, wallHeight / 2, 0),
                size: new THREE.Vector3(wallThickness, wallHeight, this.config.mapSize)
            }
        ];
        
        // Crear mallas para las paredes
        walls.forEach(wall => {
            const geometry = new THREE.BoxGeometry(wall.size.x, wall.size.y, wall.size.z);
            const mesh = new THREE.Mesh(geometry, wallMaterial);
            mesh.position.copy(wall.position);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            this.scene.add(mesh);
        });
    }
    
    /**
     * Inicializa los gestores
     */
    initManagers() {
        // Gestor de física
        this.physicsEngine = new PhysicsEngine();
        
        // Gestor de audio
        this.audioManager = new AudioManager();
        
        // Gestor de UI
        this.uiManager = new UIManager({
            container: this.container,
            audioManager: this.audioManager,
            gameManager: this
        });
        
        // Actualizar texto de carga
        this.uiManager.updateLoadingText("Inicializando componentes...");
    }
    
    /**
     * Configura los eventos
     */
    setupEventListeners() {
        // Redimensionar ventana
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Eventos de teclado
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
    }
    
    /**
     * Carga los recursos del juego
     */
    async loadResources() {
        try {
            // Actualizar texto de carga
            this.uiManager.updateLoadingText("Cargando física...");
            this.uiManager.updateLoadingProgress(0.1);
            
            // Inicializar física
            await this.physicsEngine.init();
            
            // Actualizar texto de carga
            this.uiManager.updateLoadingText("Cargando sonidos...");
            this.uiManager.updateLoadingProgress(0.3);
            
            // Cargar sonidos
            await this.audioManager.loadSounds();
            
            // Actualizar texto de carga
            this.uiManager.updateLoadingText("Preparando juego...");
            this.uiManager.updateLoadingProgress(0.7);
            
            // Crear gestor de cámara
            this.cameraManager = new CameraManager(this.camera, {
                offset: new THREE.Vector3(0, this.config.cameraHeight, -this.config.cameraDistance)
            });
            
            // Actualizar texto de carga
            this.uiManager.updateLoadingText("¡Listo para jugar!");
            this.uiManager.updateLoadingProgress(1.0);
            
            // Pequeña pausa para mostrar que está listo
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error("Error al cargar recursos:", error);
            this.showError("Error al cargar recursos: " + error.message);
            throw error;
        }
    }
    
    /**
     * Inicia el juego
     */
    startGame() {
        try {
            console.log("Iniciando juego...");
            
            // Reiniciar estado
            this.state.running = true;
            this.state.paused = false;
            this.state.score = 0;
            this.state.timeRemaining = this.config.timeLimit;
            this.state.lastTime = this.clock.getElapsedTime();
            
            // Crear agujero
            this.createHole();
            
            // Crear gestor de objetos
            this.objectManager = new ObjectManager(this.scene, {
                physics: this.physicsEngine,
                mapSize: this.config.mapSize,
                buildingCount: 20 + this.state.level * 5,
                carCount: 10 + this.state.level * 2,
                treeCount: 15 + this.state.level * 3,
                lamppostCount: 8 + this.state.level,
                benchCount: 6 + this.state.level,
                collectibleCount: 15 + this.state.level * 2
            });
            
            // Inicializar objetos
            this.objectManager.init();
            
            // Reproducir música de fondo
            this.audioManager.playBackgroundMusic();
            
            // Actualizar UI
            this.uiManager.updateScore(this.state.score);
            this.uiManager.updateSize(this.hole.getRadius());
            this.uiManager.updateTime(this.state.timeRemaining);
            this.uiManager.updateProgress(0);
            
            console.log("Juego iniciado correctamente");
        } catch (error) {
            console.error("Error al iniciar el juego:", error);
            this.showError("Error al iniciar el juego: " + error.message);
        }
    }
    
    /**
     * Crea el agujero (jugador)
     */
    createHole() {
        // Eliminar agujero anterior si existe
        if (this.hole) {
            this.hole.dispose();
        }
        
        // Crear nuevo agujero
        this.hole = new Hole(this.scene, {
            radius: this.config.initialHoleSize,
            depth: 2.0,
            segments: 32,
            color: new THREE.Color(0x000033),
            physics: this.physicsEngine,
            growFactor: this.config.growFactor,
            maxRadius: this.config.maxHoleSize
        });
        
        // Establecer como objetivo de la cámara
        this.cameraManager.setTarget(this.hole);
    }
    
    /**
     * Pausa el juego
     */
    pauseGame() {
        if (!this.state.running) return;
        
        this.state.paused = true;
        this.audioManager.stopBackgroundMusic();
    }
    
    /**
     * Reanuda el juego
     */
    resumeGame() {
        if (!this.state.running) return;
        
        this.state.paused = false;
        this.state.lastTime = this.clock.getElapsedTime();
        this.audioManager.playBackgroundMusic();
    }
    
    /**
     * Finaliza el juego
     */
    endGame() {
        this.state.running = false;
        this.state.paused = false;
        
        // Detener música
        this.audioManager.stopBackgroundMusic();
        
        // Limpiar objetos
        if (this.objectManager) {
            this.objectManager.clear();
        }
        
        // Eliminar agujero
        if (this.hole) {
            this.hole.dispose();
            this.hole = null;
        }
    }
    
    /**
     * Pasa al siguiente nivel
     */
    nextLevel() {
        // Incrementar nivel
        this.state.level++;
        
        // Iniciar nuevo juego
        this.startGame();
    }
    
    /**
     * Actualiza el juego
     * @param {number} deltaTime - Tiempo transcurrido desde el último frame
     */
    update(deltaTime) {
        if (!this.state.running || this.state.paused) return;
        
        try {
            // Actualizar tiempo restante
            this.state.timeRemaining -= deltaTime;
            if (this.state.timeRemaining <= 0) {
                this.state.timeRemaining = 0;
                this.gameOver();
                return;
            }
            
            // Actualizar física
            this.physicsEngine.update(deltaTime);
            
            // Mover agujero
            this.moveHole(deltaTime);
            
            // Actualizar agujero
            if (this.hole) {
                this.hole.update(this.clock.getElapsedTime());
            }
            
            // Actualizar objetos
            if (this.objectManager) {
                this.objectManager.update(this.clock.getElapsedTime(), this.camera, this.hole);
                
                // Comprobar si se han absorbido todos los objetos
                if (this.objectManager.areAllObjectsAbsorbed()) {
                    this.levelComplete();
                    return;
                }
                
                // Actualizar progreso
                const progress = 1 - (this.objectManager.getRemainingObjectsCount() / this.objectManager.getInitialObjectsCount());
                this.uiManager.updateProgress(progress);
            }
            
            // Actualizar cámara
            if (this.cameraManager) {
                this.cameraManager.update(deltaTime);
            }
            
            // Actualizar audio listener
            if (this.audioManager) {
                this.audioManager.updateListener(this.camera);
            }
            
            // Actualizar UI
            this.uiManager.updateTime(this.state.timeRemaining);
            if (this.hole) {
                this.uiManager.updateSize(this.hole.getRadius());
            }
        } catch (error) {
            console.error("Error en la actualización del juego:", error);
            this.showError("Error en la actualización del juego: " + error.message);
        }
    }
    
    /**
     * Mueve el agujero según la entrada del usuario
     * @param {number} deltaTime - Tiempo transcurrido desde el último frame
     */
    moveHole(deltaTime) {
        if (!this.hole) return;
        
        // Velocidad base
        const baseSpeed = 10;
        
        // Velocidad ajustada por tamaño (más grande = más lento)
        const sizeMultiplier = 1 - (this.hole.getRadius() / this.config.maxHoleSize) * 0.5;
        const speed = baseSpeed * sizeMultiplier * deltaTime;
        
        // Calcular dirección de movimiento desde teclado
        let dx = 0;
        let dz = 0;
        
        // Teclas WASD o flechas
        if (this.state.keys['ArrowUp'] || this.state.keys['w'] || this.state.keys['W']) {
            dz = -speed;
        }
        if (this.state.keys['ArrowDown'] || this.state.keys['s'] || this.state.keys['S']) {
            dz = speed;
        }
        if (this.state.keys['ArrowLeft'] || this.state.keys['a'] || this.state.keys['A']) {
            dx = -speed;
        }
        if (this.state.keys['ArrowRight'] || this.state.keys['d'] || this.state.keys['D']) {
            dx = speed;
        }
        
        // Joystick (móvil)
        if (this.state.inputX !== 0 || this.state.inputY !== 0) {
            dx = this.state.inputX * speed;
            dz = this.state.inputY * speed;
        }
        
        // Aplicar movimiento
        if (dx !== 0 || dz !== 0) {
            // Limitar movimiento al tamaño del mapa
            const halfMapSize = this.config.mapSize / 2;
            const holePosition = this.hole.getPosition();
            const holeRadius = this.hole.getRadius();
            
            // Comprobar límites X
            if (holePosition.x + dx - holeRadius < -halfMapSize) {
                dx = -halfMapSize + holeRadius - holePosition.x;
            } else if (holePosition.x + dx + holeRadius > halfMapSize) {
                dx = halfMapSize - holeRadius - holePosition.x;
            }
            
            // Comprobar límites Z
            if (holePosition.z + dz - holeRadius < -halfMapSize) {
                dz = -halfMapSize + holeRadius - holePosition.z;
            } else if (holePosition.z + dz + holeRadius > halfMapSize) {
                dz = halfMapSize - holeRadius - holePosition.z;
            }
            
            // Mover agujero
            this.hole.move(dx, 0, dz);
        }
    }
    
    /**
     * Maneja el fin del juego
     */
    gameOver() {
        // Reproducir sonido de fin de juego
        this.audioManager.playSound('gameOver');
        
        // Mostrar pantalla de fin de juego
        this.uiManager.showGameOver(this.state.score);
        
        // Finalizar juego
        this.endGame();
    }
    
    /**
     * Maneja la finalización del nivel
     */
    levelComplete() {
        // Reproducir sonido de nivel completado
        this.audioManager.playSound('levelComplete');
        
        // Mostrar pantalla de nivel completado
        this.uiManager.showLevelComplete(this.state.score);
        
        // Finalizar juego
        this.endGame();
    }
    
    /**
     * Incrementa la puntuación
     * @param {number} points - Puntos a añadir
     */
    addScore(points) {
        this.state.score += points;
        this.uiManager.updateScore(this.state.score);
    }
    
    /**
     * Establece la entrada del joystick
     * @param {number} x - Entrada horizontal (-1 a 1)
     * @param {number} y - Entrada vertical (-1 a 1)
     */
    setJoystickInput(x, y) {
        this.state.inputX = x;
        this.state.inputY = y;
    }
    
    /**
     * Maneja el evento de redimensionamiento de la ventana
     */
    onWindowResize() {
        // Actualizar dimensiones
        this.config.width = window.innerWidth;
        this.config.height = window.innerHeight;
        
        // Actualizar cámara
        this.camera.aspect = this.config.width / this.config.height;
        this.camera.updateProjectionMatrix();
        
        // Actualizar renderer
        this.renderer.setSize(this.config.width, this.config.height);
    }
    
    /**
     * Maneja el evento de tecla presionada
     * @param {KeyboardEvent} event - Evento de teclado
     */
    onKeyDown(event) {
        this.state.keys[event.key] = true;
    }
    
    /**
     * Maneja el evento de tecla liberada
     * @param {KeyboardEvent} event - Evento de teclado
     */
    onKeyUp(event) {
        this.state.keys[event.key] = false;
    }
    
    /**
     * Muestra un mensaje de error
     * @param {string} message - Mensaje de error
     */
    showError(message) {
        // Crear elemento para el mensaje
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        // Añadir al DOM
        this.container.appendChild(errorElement);
        
        // Eliminar después de un tiempo
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.parentNode.removeChild(errorElement);
            }
        }, 5000);
    }
    
    /**
     * Bucle de animación
     */
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Calcular delta time
        const time = this.clock.getElapsedTime();
        const deltaTime = time - this.state.lastTime;
        this.state.lastTime = time;
        
        // Actualizar juego
        this.update(deltaTime);
        
        // Renderizar escena
        this.renderer.render(this.scene, this.camera);
    }
}

// Iniciar juego cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    // Crear directorio para imágenes si no existe
    const imgDir = document.createElement('div');
    imgDir.style.display = 'none';
    imgDir.id = 'img-directory';
    document.body.appendChild(imgDir);
    
    // Crear directorio para audio si no existe
    const audioDir = document.createElement('div');
    audioDir.style.display = 'none';
    audioDir.id = 'audio-directory';
    document.body.appendChild(audioDir);
    
    // Iniciar juego
    window.game = new Game({
        container: document.body
    });
}); 