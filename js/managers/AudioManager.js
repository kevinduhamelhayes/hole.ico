/**
 * Gestor de audio
 * Se encarga de cargar y reproducir los efectos de sonido
 */
class AudioManager {
    /**
     * Constructor
     * @param {Object} options - Opciones de configuración
     */
    constructor(options = {}) {
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        this.volume = options.volume || 0.5;
        this.musicVolume = options.musicVolume || 0.3;
        this.effectsVolume = options.effectsVolume || 0.7;
        
        // Listener para audio 3D
        this.listener = new THREE.AudioListener();
        
        // Cargador de audio
        this.audioLoader = new THREE.AudioLoader();
        
        // Sonidos
        this.sounds = {};
        
        // Música de fondo
        this.backgroundMusic = null;
        
        // Inicializar
        this.init();
    }
    
    /**
     * Inicializa el gestor de audio
     */
    init() {
        // Crear sonidos
        this.createSounds();
        
        console.log("AudioManager: Inicializado");
    }
    
    /**
     * Crea los sonidos del juego
     */
    createSounds() {
        // Música de fondo
        this.backgroundMusic = new THREE.Audio(this.listener);
        
        // Efectos de sonido
        this.sounds.absorb = new THREE.Audio(this.listener);
        this.sounds.collect = new THREE.Audio(this.listener);
        this.sounds.grow = new THREE.Audio(this.listener);
        this.sounds.levelComplete = new THREE.Audio(this.listener);
        this.sounds.gameOver = new THREE.Audio(this.listener);
        this.sounds.buttonClick = new THREE.Audio(this.listener);
        this.sounds.fall = new THREE.PositionalAudio(this.listener);
        this.sounds.impact = new THREE.PositionalAudio(this.listener);
    }
    
    /**
     * Carga los sonidos del juego
     * @returns {Promise} Promesa que se resuelve cuando todos los sonidos están cargados
     */
    loadSounds() {
        if (!this.enabled) {
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            // Contador de sonidos cargados
            let loadedCount = 0;
            const totalCount = 8; // Número total de sonidos a cargar
            
            // Función para verificar si todos los sonidos están cargados
            const checkAllLoaded = () => {
                loadedCount++;
                if (loadedCount === totalCount) {
                    console.log("AudioManager: Todos los sonidos cargados");
                    resolve();
                }
            };
            
            // Cargar música de fondo
            this.audioLoader.load(
                'audio/background.mp3',
                (buffer) => {
                    this.backgroundMusic.setBuffer(buffer);
                    this.backgroundMusic.setLoop(true);
                    this.backgroundMusic.setVolume(this.musicVolume * this.volume);
                    checkAllLoaded();
                },
                (xhr) => {
                    console.log('AudioManager: Cargando música de fondo: ' + (xhr.loaded / xhr.total * 100) + '%');
                },
                (error) => {
                    console.warn('AudioManager: Error al cargar música de fondo', error);
                    checkAllLoaded();
                }
            );
            
            // Cargar efecto de absorción
            this.audioLoader.load(
                'audio/absorb.mp3',
                (buffer) => {
                    this.sounds.absorb.setBuffer(buffer);
                    this.sounds.absorb.setVolume(this.effectsVolume * this.volume);
                    checkAllLoaded();
                },
                null,
                (error) => {
                    console.warn('AudioManager: Error al cargar efecto de absorción', error);
                    checkAllLoaded();
                }
            );
            
            // Cargar efecto de recolección
            this.audioLoader.load(
                'audio/collect.mp3',
                (buffer) => {
                    this.sounds.collect.setBuffer(buffer);
                    this.sounds.collect.setVolume(this.effectsVolume * this.volume);
                    checkAllLoaded();
                },
                null,
                (error) => {
                    console.warn('AudioManager: Error al cargar efecto de recolección', error);
                    checkAllLoaded();
                }
            );
            
            // Cargar efecto de crecimiento
            this.audioLoader.load(
                'audio/grow.mp3',
                (buffer) => {
                    this.sounds.grow.setBuffer(buffer);
                    this.sounds.grow.setVolume(this.effectsVolume * this.volume);
                    checkAllLoaded();
                },
                null,
                (error) => {
                    console.warn('AudioManager: Error al cargar efecto de crecimiento', error);
                    checkAllLoaded();
                }
            );
            
            // Cargar efecto de nivel completado
            this.audioLoader.load(
                'audio/level_complete.mp3',
                (buffer) => {
                    this.sounds.levelComplete.setBuffer(buffer);
                    this.sounds.levelComplete.setVolume(this.effectsVolume * this.volume);
                    checkAllLoaded();
                },
                null,
                (error) => {
                    console.warn('AudioManager: Error al cargar efecto de nivel completado', error);
                    checkAllLoaded();
                }
            );
            
            // Cargar efecto de game over
            this.audioLoader.load(
                'audio/game_over.mp3',
                (buffer) => {
                    this.sounds.gameOver.setBuffer(buffer);
                    this.sounds.gameOver.setVolume(this.effectsVolume * this.volume);
                    checkAllLoaded();
                },
                null,
                (error) => {
                    console.warn('AudioManager: Error al cargar efecto de game over', error);
                    checkAllLoaded();
                }
            );
            
            // Cargar efecto de clic de botón
            this.audioLoader.load(
                'audio/button_click.mp3',
                (buffer) => {
                    this.sounds.buttonClick.setBuffer(buffer);
                    this.sounds.buttonClick.setVolume(this.effectsVolume * this.volume);
                    checkAllLoaded();
                },
                null,
                (error) => {
                    console.warn('AudioManager: Error al cargar efecto de clic de botón', error);
                    checkAllLoaded();
                }
            );
            
            // Cargar efecto de caída
            this.audioLoader.load(
                'audio/fall.mp3',
                (buffer) => {
                    this.sounds.fall.setBuffer(buffer);
                    this.sounds.fall.setVolume(this.effectsVolume * this.volume);
                    this.sounds.fall.setRefDistance(10);
                    checkAllLoaded();
                },
                null,
                (error) => {
                    console.warn('AudioManager: Error al cargar efecto de caída', error);
                    checkAllLoaded();
                }
            );
        });
    }
    
    /**
     * Reproduce la música de fondo
     */
    playBackgroundMusic() {
        if (!this.enabled || !this.backgroundMusic.buffer) return;
        
        if (!this.backgroundMusic.isPlaying) {
            this.backgroundMusic.play();
        }
    }
    
    /**
     * Detiene la música de fondo
     */
    stopBackgroundMusic() {
        if (this.backgroundMusic.isPlaying) {
            this.backgroundMusic.stop();
        }
    }
    
    /**
     * Reproduce un efecto de sonido
     * @param {string} name - Nombre del efecto
     */
    playSound(name) {
        if (!this.enabled) return;
        
        const sound = this.sounds[name];
        if (sound && sound.buffer) {
            if (sound.isPlaying) {
                sound.stop();
            }
            sound.play();
        }
    }
    
    /**
     * Reproduce un efecto de sonido posicional
     * @param {string} name - Nombre del efecto
     * @param {THREE.Vector3} position - Posición del sonido
     */
    playPositionalSound(name, position) {
        if (!this.enabled) return;
        
        const sound = this.sounds[name];
        if (sound && sound.buffer) {
            // Clonar el sonido para poder reproducir múltiples instancias
            const soundClone = sound.clone();
            soundClone.position.copy(position);
            
            // Reproducir y eliminar después
            soundClone.play();
            soundClone.onEnded = () => {
                soundClone.parent.remove(soundClone);
            };
        }
    }
    
    /**
     * Establece el volumen general
     * @param {number} volume - Volumen (0-1)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        // Actualizar volumen de todos los sonidos
        this.backgroundMusic.setVolume(this.musicVolume * this.volume);
        
        for (const name in this.sounds) {
            this.sounds[name].setVolume(this.effectsVolume * this.volume);
        }
    }
    
    /**
     * Establece el volumen de la música
     * @param {number} volume - Volumen (0-1)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.backgroundMusic.setVolume(this.musicVolume * this.volume);
    }
    
    /**
     * Establece el volumen de los efectos
     * @param {number} volume - Volumen (0-1)
     */
    setEffectsVolume(volume) {
        this.effectsVolume = Math.max(0, Math.min(1, volume));
        
        for (const name in this.sounds) {
            this.sounds[name].setVolume(this.effectsVolume * this.volume);
        }
    }
    
    /**
     * Activa/desactiva el audio
     * @param {boolean} enabled - True para activar, false para desactivar
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (!this.enabled) {
            this.stopBackgroundMusic();
        } else {
            this.playBackgroundMusic();
        }
    }
    
    /**
     * Actualiza el listener de audio 3D
     * @param {THREE.Camera} camera - Cámara para actualizar el listener
     */
    updateListener(camera) {
        this.listener.position.copy(camera.position);
        this.listener.rotation.copy(camera.rotation);
    }
    
    /**
     * Obtiene el listener de audio 3D
     * @returns {THREE.AudioListener} Listener de audio 3D
     */
    getListener() {
        return this.listener;
    }
}

// Exportar la clase
window.AudioManager = AudioManager; 