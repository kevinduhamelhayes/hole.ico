// Variables globales
let scene, camera, renderer, physics;
let hole, objects = [], collectibles = [];
let score = 0;
let holeSize = 1.0;
let keys = {};
let level = 1;
let targetScore = 50; // Puntuación objetivo para pasar al siguiente nivel
let gameStarted = false;
let gameOver = false;
let levelTime = 120; // Tiempo en segundos para completar el nivel
let timeRemaining = levelTime;
let lastUpdateTime = 0;

// Sonidos
let audioListener;
let sounds = {};

// Física
let world;
let tmpTrans;
let ammoClone;

// Inicializar el juego
async function init() {
    console.log("Inicializando juego...");
    
    try {
        // Crear escena
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB); // Color de cielo
        
        // Crear niebla para dar sensación de profundidad
        scene.fog = new THREE.FogExp2(0x87CEEB, 0.01);

        // Crear cámara
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 20, -20); // Posición más elevada y alejada
        camera.lookAt(0, 0, 0);

        // Crear renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(renderer.domElement);

        // Inicializar física (con manejo de errores)
        try {
            await initPhysics();
            console.log("Física inicializada correctamente");
        } catch (error) {
            console.error("Error al inicializar física:", error);
            // Continuar sin física
        }

        // Inicializar audio
        initAudio();

        // Añadir luces
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -30;
        directionalLight.shadow.camera.right = 30;
        directionalLight.shadow.camera.top = 30;
        directionalLight.shadow.camera.bottom = -30;
        scene.add(directionalLight);

        // Crear suelo (sin física si no está disponible)
        createGround();

        // Crear el agujero
        hole = new Hole(scene);
        console.log("Agujero creado:", hole);
        
        // Mostrar pantalla de inicio
        showStartScreen();

        // Eventos de teclado
        document.addEventListener('keydown', (e) => {
            keys[e.code] = true;
            
            // Iniciar juego con espacio
            if (e.code === 'Space' && !gameStarted) {
                startGame();
            }
        });
        document.addEventListener('keyup', (e) => keys[e.code] = false);

        // Evento de redimensión
        window.addEventListener('resize', onWindowResize);

        // Iniciar bucle de animación
        animate();
        console.log("Juego inicializado correctamente");
    } catch (error) {
        console.error("Error al inicializar el juego:", error);
    }
}

// Inicializar física con Ammo.js
async function initPhysics() {
    console.log("Inicializando física...");
    
    // Verificar si Ammo está disponible
    if (typeof Ammo === 'undefined') {
        console.error("Ammo.js no está disponible");
        return Promise.reject("Ammo.js no está disponible");
    }
    
    // Cargar Ammo.js
    return new Promise((resolve, reject) => {
        try {
            if (typeof Ammo === 'function') {
                console.log("Cargando Ammo.js...");
                Ammo().then((AmmoLib) => {
                    console.log("Ammo.js cargado correctamente");
                    ammoClone = AmmoLib;
                    setupPhysicsWorld();
                    resolve();
                }).catch(error => {
                    console.error("Error al cargar Ammo.js:", error);
                    reject(error);
                });
            } else {
                // Si ya está cargado
                console.log("Ammo.js ya está cargado");
                setupPhysicsWorld();
                resolve();
            }
        } catch (error) {
            console.error("Error en initPhysics:", error);
            reject(error);
        }
    });
}

// Configurar mundo físico
function setupPhysicsWorld() {
    try {
        console.log("Configurando mundo físico...");
        // Configuración de la física
        const collisionConfiguration = new ammoClone.btDefaultCollisionConfiguration();
        const dispatcher = new ammoClone.btCollisionDispatcher(collisionConfiguration);
        const overlappingPairCache = new ammoClone.btDbvtBroadphase();
        const solver = new ammoClone.btSequentialImpulseConstraintSolver();
        
        // Crear mundo físico
        world = new ammoClone.btDiscreteDynamicsWorld(
            dispatcher, overlappingPairCache, solver, collisionConfiguration
        );
        
        // Establecer gravedad
        world.setGravity(new ammoClone.btVector3(0, -9.8, 0));
        
        // Crear transformación temporal para reutilizar
        tmpTrans = new ammoClone.btTransform();
        console.log("Mundo físico configurado correctamente");
    } catch (error) {
        console.error("Error al configurar mundo físico:", error);
    }
}

// Inicializar audio
function initAudio() {
    try {
        console.log("Inicializando audio...");
        // Crear listener de audio
        audioListener = new THREE.AudioListener();
        camera.add(audioListener);
        
        // Cargar sonidos
        loadSound('fall', 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3');
        loadSound('levelUp', 'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3');
        loadSound('gameOver', 'https://assets.mixkit.co/sfx/preview/mixkit-player-losing-or-failing-2042.mp3');
        loadSound('background', 'https://assets.mixkit.co/sfx/preview/mixkit-game-level-music-689.mp3', true);
        console.log("Audio inicializado correctamente");
    } catch (error) {
        console.error("Error al inicializar audio:", error);
    }
}

// Cargar un sonido
function loadSound(name, url, loop = false) {
    try {
        const sound = new THREE.Audio(audioListener);
        const audioLoader = new THREE.AudioLoader();
        
        audioLoader.load(url, function(buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(loop);
            sound.setVolume(0.5);
            sounds[name] = sound;
            console.log(`Sonido '${name}' cargado correctamente`);
            
            // Reproducir música de fondo al cargar
            if (name === 'background' && gameStarted) {
                sound.play();
            }
        }, undefined, function(error) {
            console.error(`Error al cargar sonido '${name}':`, error);
        });
    } catch (error) {
        console.error(`Error al configurar sonido '${name}':`, error);
    }
}

// Reproducir un sonido
function playSound(name) {
    try {
        if (sounds[name] && !sounds[name].isPlaying) {
            sounds[name].play();
        }
    } catch (error) {
        console.error(`Error al reproducir sonido '${name}':`, error);
    }
}

// Crear suelo
function createGround() {
    try {
        console.log("Creando suelo...");
        // Geometría del suelo
        const groundGeometry = new THREE.PlaneGeometry(100, 100, 10, 10);
        
        // Textura del suelo
        const textureLoader = new THREE.TextureLoader();
        const groundTexture = textureLoader.load('https://threejs.org/examples/textures/hardwood2_diffuse.jpg');
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(10, 10);
        
        // Material del suelo
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            map: groundTexture,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Crear malla
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
        
        // Añadir física al suelo si está disponible
        if (ammoClone && world) {
            const groundShape = new ammoClone.btBoxShape(new ammoClone.btVector3(50, 1, 50));
            const groundTransform = new ammoClone.btTransform();
            groundTransform.setIdentity();
            groundTransform.setOrigin(new ammoClone.btVector3(0, -1, 0));
            
            const groundMass = 0; // Masa 0 = objeto estático
            const groundLocalInertia = new ammoClone.btVector3(0, 0, 0);
            
            const groundMotionState = new ammoClone.btDefaultMotionState(groundTransform);
            const groundRbInfo = new ammoClone.btRigidBodyConstructionInfo(
                groundMass, groundMotionState, groundShape, groundLocalInertia
            );
            
            const groundBody = new ammoClone.btRigidBody(groundRbInfo);
            world.addRigidBody(groundBody);
        }
        console.log("Suelo creado correctamente");
    } catch (error) {
        console.error("Error al crear suelo:", error);
    }
}

// Mostrar pantalla de inicio
function showStartScreen() {
    const startScreen = document.createElement('div');
    startScreen.id = 'start-screen';
    startScreen.style.position = 'absolute';
    startScreen.style.top = '0';
    startScreen.style.left = '0';
    startScreen.style.width = '100%';
    startScreen.style.height = '100%';
    startScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    startScreen.style.display = 'flex';
    startScreen.style.flexDirection = 'column';
    startScreen.style.justifyContent = 'center';
    startScreen.style.alignItems = 'center';
    startScreen.style.color = 'white';
    startScreen.style.fontFamily = 'Arial, sans-serif';
    startScreen.style.zIndex = '1000';
    
    const title = document.createElement('h1');
    title.textContent = 'Hole.io Web';
    title.style.fontSize = '3em';
    title.style.marginBottom = '20px';
    
    const instructions = document.createElement('p');
    instructions.textContent = 'Usa las teclas WASD o las flechas para mover el agujero';
    instructions.style.fontSize = '1.5em';
    instructions.style.marginBottom = '10px';
    
    const objective = document.createElement('p');
    objective.textContent = 'Absorbe objetos para crecer y pasar al siguiente nivel';
    objective.style.fontSize = '1.5em';
    objective.style.marginBottom = '30px';
    
    const startButton = document.createElement('button');
    startButton.textContent = 'Presiona ESPACIO para comenzar';
    startButton.style.padding = '15px 30px';
    startButton.style.fontSize = '1.2em';
    startButton.style.backgroundColor = '#4CAF50';
    startButton.style.border = 'none';
    startButton.style.borderRadius = '5px';
    startButton.style.cursor = 'pointer';
    startButton.onclick = startGame;
    
    startScreen.appendChild(title);
    startScreen.appendChild(instructions);
    startScreen.appendChild(objective);
    startScreen.appendChild(startButton);
    
    document.getElementById('game-container').appendChild(startScreen);
}

// Iniciar juego
function startGame() {
    console.log("Iniciando juego...");
    gameStarted = true;
    
    // Ocultar pantalla de inicio
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.style.display = 'none';
    }
    
    // Mostrar HUD
    updateHUD();
    
    // Reproducir música de fondo
    if (sounds.background) {
        sounds.background.play();
    }
    
    // Iniciar temporizador
    lastUpdateTime = Date.now();
    
    // Cargar nivel
    loadLevel(level);
    
    console.log("Juego iniciado correctamente");
}

// Actualizar HUD
function updateHUD() {
    // Actualizar puntuación
    document.getElementById('score-value').textContent = score;
    
    // Actualizar tamaño
    document.getElementById('size-value').textContent = holeSize.toFixed(1);
    
    // Actualizar nivel y tiempo si no existen
    if (!document.getElementById('level')) {
        const levelDiv = document.createElement('div');
        levelDiv.id = 'level';
        levelDiv.style.position = 'absolute';
        levelDiv.style.top = '20px';
        levelDiv.style.left = '50%';
        levelDiv.style.transform = 'translateX(-50%)';
        levelDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        levelDiv.style.color = 'white';
        levelDiv.style.padding = '10px 15px';
        levelDiv.style.borderRadius = '5px';
        levelDiv.style.fontSize = '18px';
        levelDiv.style.zIndex = '100';
        levelDiv.innerHTML = 'Nivel: <span id="level-value">1</span>';
        document.getElementById('game-container').appendChild(levelDiv);
    }
    
    if (!document.getElementById('time')) {
        const timeDiv = document.createElement('div');
        timeDiv.id = 'time';
        timeDiv.style.position = 'absolute';
        timeDiv.style.top = '60px';
        timeDiv.style.left = '50%';
        timeDiv.style.transform = 'translateX(-50%)';
        timeDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        timeDiv.style.color = 'white';
        timeDiv.style.padding = '10px 15px';
        timeDiv.style.borderRadius = '5px';
        timeDiv.style.fontSize = '18px';
        timeDiv.style.zIndex = '100';
        timeDiv.innerHTML = 'Tiempo: <span id="time-value">120</span>';
        document.getElementById('game-container').appendChild(timeDiv);
    }
    
    // Actualizar valores
    document.getElementById('level-value').textContent = level;
    document.getElementById('time-value').textContent = Math.ceil(timeRemaining);
    
    // Actualizar objetivo
    if (!document.getElementById('target')) {
        const targetDiv = document.createElement('div');
        targetDiv.id = 'target';
        targetDiv.style.position = 'absolute';
        targetDiv.style.bottom = '20px';
        targetDiv.style.left = '50%';
        targetDiv.style.transform = 'translateX(-50%)';
        targetDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        targetDiv.style.color = 'white';
        targetDiv.style.padding = '10px 15px';
        targetDiv.style.borderRadius = '5px';
        targetDiv.style.fontSize = '18px';
        targetDiv.style.zIndex = '100';
        targetDiv.innerHTML = 'Objetivo: <span id="score-current">0</span>/<span id="score-target">50</span>';
        document.getElementById('game-container').appendChild(targetDiv);
    }
    
    document.getElementById('score-current').textContent = score;
    document.getElementById('score-target').textContent = targetScore;
}

// Cargar nivel
function loadLevel(levelNum) {
    // Limpiar objetos existentes
    objects.forEach(obj => {
        scene.remove(obj.mesh);
    });
    objects = [];
    
    // Limpiar coleccionables existentes
    collectibles.forEach(collectible => {
        scene.remove(collectible.mesh);
    });
    collectibles = [];
    
    // Configurar nivel
    switch(levelNum) {
        case 1:
            targetScore = 50;
            levelTime = 120;
            createObjects(10, 5, 3, 2, 0); // edificios, coches, árboles, farolas, bancos
            createCollectibles(20); // Puntos pequeños de recolección
            break;
        case 2:
            targetScore = 100;
            levelTime = 100;
            createObjects(15, 8, 5, 4, 3);
            createCollectibles(30);
            break;
        case 3:
            targetScore = 200;
            levelTime = 90;
            createObjects(20, 10, 8, 6, 5);
            createCollectibles(40);
            break;
        default:
            // Niveles infinitos con dificultad creciente
            targetScore = 300 + (levelNum - 3) * 100;
            levelTime = Math.max(60, 90 - (levelNum - 3) * 5);
            createObjects(20 + levelNum, 10 + levelNum, 8 + levelNum, 6 + levelNum, 5 + levelNum);
            createCollectibles(40 + levelNum * 5);
    }
    
    // Reiniciar tiempo
    timeRemaining = levelTime;
    
    // Actualizar HUD
    updateHUD();
}

// Crear objetos que pueden caer en el agujero
function createObjects(numBuildings, numCars, numTrees, numLampposts, numBenches) {
    // Crear edificios
    for (let i = 0; i < numBuildings; i++) {
        const size = Math.random() * 2 + 1;
        const height = Math.random() * 4 + 2;
        
        // Posición aleatoria en un radio alrededor del centro
        const radius = Math.random() * 40 + 10;
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Crear edificio
        const building = new Building(scene, size, height, x, 0, z);
        objects.push(building);
    }
    
    // Crear coches
    for (let i = 0; i < numCars; i++) {
        const radius = Math.random() * 35 + 10;
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        const car = new Car(scene, x, 0, z);
        objects.push(car);
    }
    
    // Crear árboles
    for (let i = 0; i < numTrees; i++) {
        const radius = Math.random() * 35 + 10;
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        const tree = new Tree(scene, x, 0, z);
        objects.push(tree);
    }
    
    // Crear farolas
    for (let i = 0; i < numLampposts; i++) {
        const radius = Math.random() * 35 + 10;
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        const lamppost = new Lamppost(scene, x, 0, z);
        objects.push(lamppost);
    }
    
    // Crear bancos
    for (let i = 0; i < numBenches; i++) {
        const radius = Math.random() * 35 + 10;
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        const bench = new Bench(scene, x, 0, z);
        objects.push(bench);
    }
}

// Crear pequeños puntos de recolección
function createCollectibles(count) {
    for (let i = 0; i < count; i++) {
        // Posición aleatoria en un radio alrededor del centro
        const radius = Math.random() * 40 + 5;
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Crear coleccionable
        const collectible = new Collectible(scene, x, 0.2, z);
        collectibles.push(collectible);
    }
}

// Clase para los puntos de recolección
class Collectible {
    constructor(scene, x, y, z) {
        this.scene = scene;
        this.position = new THREE.Vector3(x, y, z);
        this.size = 0.3;
        this.value = 1; // Valor de puntuación
        this.collected = false;
        
        // Crear geometría
        const geometry = new THREE.SphereGeometry(this.size, 16, 16);
        
        // Material brillante
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
            metalness: 1.0,
            roughness: 0.2
        });
        
        // Crear malla
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Añadir luz
        this.light = new THREE.PointLight(0x00ffff, 0.5, 3);
        this.light.position.copy(this.position);
        this.mesh.add(this.light);
        
        // Añadir a la escena
        this.scene.add(this.mesh);
        
        // Animación flotante
        this.initialY = y;
        this.animationOffset = Math.random() * Math.PI * 2;
    }
    
    update(time) {
        if (!this.collected) {
            // Animación flotante
            this.mesh.position.y = this.initialY + Math.sin(time * 2 + this.animationOffset) * 0.1;
            
            // Rotación
            this.mesh.rotation.y += 0.02;
        }
    }
    
    checkCollision(hole) {
        if (this.collected) return false;
        
        const holePos = hole.getPosition();
        const holeRadius = hole.getRadius();
        
        const dx = this.mesh.position.x - holePos.x;
        const dz = this.mesh.position.z - holePos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < holeRadius) {
            this.collected = true;
            
            // Animación de recolección
            this.collectAnimation();
            
            return true;
        }
        
        return false;
    }
    
    collectAnimation() {
        // Animación de desaparición
        const startTime = Date.now();
        const duration = 500; // 0.5 segundos
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Escalar y elevar
            this.mesh.scale.set(1 - progress, 1 - progress, 1 - progress);
            this.mesh.position.y += 0.05;
            
            // Reducir intensidad de luz
            this.light.intensity = 0.5 * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(this.mesh);
            }
        };
        
        animate();
    }
    
    getValue() {
        return this.value;
    }
}

// Manejar redimensión de ventana
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Actualizar puntuación
function updateScore(points) {
    score += points;
    
    // Actualizar HUD
    document.getElementById('score-value').textContent = score;
    document.getElementById('score-current').textContent = score;
    
    // Comprobar si se ha alcanzado el objetivo
    if (score >= targetScore) {
        levelUp();
    }
}

// Subir de nivel
function levelUp() {
    level++;
    playSound('levelUp');
    
    // Mostrar mensaje de nivel completado
    showLevelCompleteMessage();
    
    // Cargar siguiente nivel
    setTimeout(() => {
        loadLevel(level);
    }, 3000);
}

// Mostrar mensaje de nivel completado
function showLevelCompleteMessage() {
    const message = document.createElement('div');
    message.style.position = 'absolute';
    message.style.top = '50%';
    message.style.left = '50%';
    message.style.transform = 'translate(-50%, -50%)';
    message.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    message.style.color = 'white';
    message.style.padding = '20px 40px';
    message.style.borderRadius = '10px';
    message.style.fontSize = '24px';
    message.style.fontWeight = 'bold';
    message.style.zIndex = '1000';
    message.textContent = `¡Nivel ${level-1} completado!`;
    
    document.getElementById('game-container').appendChild(message);
    
    // Eliminar mensaje después de 3 segundos
    setTimeout(() => {
        document.getElementById('game-container').removeChild(message);
    }, 3000);
}

// Mostrar pantalla de game over
function showGameOverScreen() {
    gameOver = true;
    
    // Detener música de fondo
    if (sounds.background) {
        sounds.background.stop();
    }
    
    // Reproducir sonido de game over
    playSound('gameOver');
    
    const gameOverScreen = document.createElement('div');
    gameOverScreen.id = 'game-over-screen';
    gameOverScreen.style.position = 'absolute';
    gameOverScreen.style.top = '0';
    gameOverScreen.style.left = '0';
    gameOverScreen.style.width = '100%';
    gameOverScreen.style.height = '100%';
    gameOverScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    gameOverScreen.style.display = 'flex';
    gameOverScreen.style.flexDirection = 'column';
    gameOverScreen.style.justifyContent = 'center';
    gameOverScreen.style.alignItems = 'center';
    gameOverScreen.style.color = 'white';
    gameOverScreen.style.fontFamily = 'Arial, sans-serif';
    gameOverScreen.style.zIndex = '1000';
    
    const title = document.createElement('h1');
    title.textContent = '¡Juego Terminado!';
    title.style.fontSize = '3em';
    title.style.marginBottom = '20px';
    
    const scoreText = document.createElement('p');
    scoreText.textContent = `Puntuación final: ${score}`;
    scoreText.style.fontSize = '2em';
    scoreText.style.marginBottom = '10px';
    
    const levelText = document.createElement('p');
    levelText.textContent = `Nivel alcanzado: ${level}`;
    levelText.style.fontSize = '1.5em';
    levelText.style.marginBottom = '30px';
    
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Reiniciar Juego';
    restartButton.style.padding = '15px 30px';
    restartButton.style.fontSize = '1.2em';
    restartButton.style.backgroundColor = '#4CAF50';
    restartButton.style.border = 'none';
    restartButton.style.borderRadius = '5px';
    restartButton.style.cursor = 'pointer';
    restartButton.onclick = restartGame;
    
    gameOverScreen.appendChild(title);
    gameOverScreen.appendChild(scoreText);
    gameOverScreen.appendChild(levelText);
    gameOverScreen.appendChild(restartButton);
    
    document.getElementById('game-container').appendChild(gameOverScreen);
}

// Reiniciar juego
function restartGame() {
    // Reiniciar variables
    score = 0;
    level = 1;
    holeSize = 1.0;
    gameOver = false;
    
    // Reiniciar agujero
    hole.setSize(holeSize);
    
    // Ocultar pantalla de game over
    const gameOverScreen = document.getElementById('game-over-screen');
    if (gameOverScreen) {
        document.getElementById('game-container').removeChild(gameOverScreen);
    }
    
    // Cargar nivel 1
    loadLevel(1);
    
    // Reproducir música de fondo
    if (sounds.background) {
        sounds.background.play();
    }
}

// Actualizar física
function updatePhysics() {
    try {
        if (world) {
            // Paso de simulación física
            world.stepSimulation(1 / 60, 10);
            
            // Actualizar objetos con física
            objects.forEach(object => {
                if (object.rigidBody) {
                    const motionState = object.rigidBody.getMotionState();
                    if (motionState) {
                        motionState.getWorldTransform(tmpTrans);
                        const pos = tmpTrans.getOrigin();
                        const quat = tmpTrans.getRotation();
                        
                        object.mesh.position.set(pos.x(), pos.y(), pos.z());
                        object.mesh.quaternion.set(quat.x(), quat.y(), quat.z(), quat.w());
                    }
                }
            });
        }
    } catch (error) {
        console.error("Error al actualizar física:", error);
    }
}

// Aumentar el tamaño del agujero basado en el valor del objeto
function growHole(objectValue) {
    // Usar el método grow del agujero
    const growAmount = hole.grow(objectValue);
    
    // Actualizar tamaño en HUD
    holeSize = hole.getRadius();
    document.getElementById('size-value').textContent = holeSize.toFixed(1);
    
    // Añadir efecto visual
    addGrowthEffect();
}

// Añadir efecto visual cuando el agujero crece
function addGrowthEffect() {
    // Añadir texto flotante "+SIZE"
    const growthText = document.createElement('div');
    growthText.textContent = '+SIZE';
    growthText.style.position = 'absolute';
    growthText.style.color = '#4CAF50';
    growthText.style.fontWeight = 'bold';
    growthText.style.fontSize = '24px';
    growthText.style.textShadow = '0 0 5px rgba(0, 0, 0, 0.5)';
    growthText.style.zIndex = '100';
    growthText.style.opacity = '1';
    growthText.style.transition = 'all 1s ease-out';
    
    // Posicionar cerca del indicador de tamaño
    const sizeElement = document.getElementById('size');
    const rect = sizeElement.getBoundingClientRect();
    growthText.style.left = rect.left + 'px';
    growthText.style.top = (rect.top + rect.height) + 'px';
    
    document.body.appendChild(growthText);
    
    // Animar el texto
    setTimeout(() => {
        growthText.style.opacity = '0';
        growthText.style.transform = 'translateY(-30px)';
        
        // Eliminar después de la animación
        setTimeout(() => {
            document.body.removeChild(growthText);
        }, 1000);
    }, 50);
    
    // Añadir clase de animación al indicador de tamaño
    const sizeValue = document.getElementById('size-value');
    sizeValue.classList.add('score-increase');
    
    // Eliminar la clase después de la animación
    setTimeout(() => {
        sizeValue.classList.remove('score-increase');
    }, 300);
}

// Bucle de animación
function animate() {
    requestAnimationFrame(animate);
    
    try {
        // No actualizar si el juego no ha comenzado o ha terminado
        if (!gameStarted || gameOver) {
            renderer.render(scene, camera);
            return;
        }
        
        // Tiempo actual para animaciones
        const time = Date.now() * 0.001;
        
        // Actualizar tiempo
        const now = Date.now();
        const deltaTime = (now - lastUpdateTime) / 1000; // en segundos
        lastUpdateTime = now;
        
        // Actualizar tiempo restante
        timeRemaining -= deltaTime;
        document.getElementById('time-value').textContent = Math.ceil(timeRemaining);
        
        // Comprobar si se ha acabado el tiempo
        if (timeRemaining <= 0) {
            showGameOverScreen();
            return;
        }
        
        // Mover el agujero con las teclas
        const moveSpeed = 0.2;
        if (keys['KeyW'] || keys['ArrowUp']) hole.move(0, 0, moveSpeed);
        if (keys['KeyS'] || keys['ArrowDown']) hole.move(0, 0, -moveSpeed);
        if (keys['KeyA'] || keys['ArrowLeft']) hole.move(moveSpeed, 0, 0);
        if (keys['KeyD'] || keys['ArrowRight']) hole.move(-moveSpeed, 0, 0);
        
        // Actualizar cámara para que siga al agujero
        const holePos = hole.getPosition();
        camera.position.x = holePos.x;
        camera.position.z = holePos.z - 15;
        camera.lookAt(holePos.x, 0, holePos.z);
        
        // Actualizar objetos
        for (let i = objects.length - 1; i >= 0; i--) {
            const object = objects[i];
            if (object.checkCollision(hole)) {
                // Si el objeto colisiona con el agujero
                const objectValue = object.getValue();
                
                // Actualizar puntuación
                updateScore(objectValue);
                
                // Aumentar tamaño del agujero basado en el valor del objeto
                growHole(objectValue);
                
                // Eliminar objeto
                scene.remove(object.mesh);
                objects.splice(i, 1);
                
                // Reproducir sonido de caída
                playSound('fall');
                
                // Añadir nuevo objeto si quedan pocos
                if (objects.length < 10) {
                    addRandomObject();
                }
            }
        }
        
        // Actualizar coleccionables
        for (let i = collectibles.length - 1; i >= 0; i--) {
            const collectible = collectibles[i];
            
            // Actualizar animación
            collectible.update(time);
            
            if (collectible.checkCollision(hole)) {
                // Si el coleccionable es recogido
                updateScore(collectible.getValue());
                
                // Reproducir sonido de recolección
                playSound('collect');
                
                // Eliminar de la lista
                collectibles.splice(i, 1);
                
                // Añadir nuevo coleccionable si quedan pocos
                if (collectibles.length < 10) {
                    const radius = Math.random() * 40 + 20;
                    const angle = Math.random() * Math.PI * 2;
                    const x = Math.cos(angle) * radius;
                    const z = Math.sin(angle) * radius;
                    
                    const collectible = new Collectible(scene, x, 0.2, z);
                    collectibles.push(collectible);
                }
            }
        }
        
        // Actualizar física
        if (typeof updatePhysics === 'function') {
            updatePhysics();
        }
        
        // Actualizar agujero
        hole.update();
        
        // Renderizar escena
        renderer.render(scene, camera);
    } catch (error) {
        console.error("Error en el bucle de animación:", error);
    }
}

// Añadir un objeto aleatorio
function addRandomObject() {
    const radius = Math.random() * 40 + 20; // Más lejos para que no aparezca de repente
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    // Tipo aleatorio
    const type = Math.floor(Math.random() * 5);
    let object;
    
    switch(type) {
        case 0:
            const size = Math.random() * 2 + 1;
            const height = Math.random() * 4 + 2;
            object = new Building(scene, size, height, x, 0, z);
            break;
        case 1:
            object = new Car(scene, x, 0, z);
            break;
        case 2:
            object = new Tree(scene, x, 0, z);
            break;
        case 3:
            object = new Lamppost(scene, x, 0, z);
            break;
        case 4:
            object = new Bench(scene, x, 0, z);
            break;
    }
    
    objects.push(object);
}

// Iniciar el juego cuando se cargue la página
window.addEventListener('load', init); 