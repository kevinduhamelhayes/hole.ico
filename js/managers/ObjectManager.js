/**
 * Gestor de objetos del juego
 * Se encarga de crear y gestionar los edificios, coches, árboles y coleccionables
 */
class ObjectManager {
    /**
     * Constructor
     * @param {THREE.Scene} scene - Escena donde se añadirán los objetos
     * @param {Object} options - Opciones de configuración
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        this.physics = options.physics || null;
        this.mapSize = options.mapSize || 100;
        this.buildingCount = options.buildingCount || 30;
        this.carCount = options.carCount || 15;
        this.treeCount = options.treeCount || 20;
        this.lamppostCount = options.lamppostCount || 10;
        this.benchCount = options.benchCount || 8;
        this.collectibleCount = options.collectibleCount || 25;
        this.collectibleSpawnInterval = options.collectibleSpawnInterval || 5000; // ms
        
        // Listas de objetos
        this.buildings = [];
        this.cars = [];
        this.trees = [];
        this.lampposts = [];
        this.benches = [];
        this.collectibles = [];
        
        // Contador para el spawn de coleccionables
        this.lastCollectibleSpawn = 0;
    }
    
    /**
     * Inicializa el gestor de objetos
     */
    init() {
        // Crear objetos iniciales
        this.createBuildings();
        this.createCars();
        this.createTrees();
        this.createLampposts();
        this.createBenches();
        this.createCollectibles();
        
        console.log("ObjectManager: Objetos inicializados");
    }
    
    /**
     * Crea los edificios
     */
    createBuildings() {
        for (let i = 0; i < this.buildingCount; i++) {
            // Posición aleatoria en el mapa
            const position = this.getRandomPosition();
            
            // Tamaño aleatorio
            const width = Math.random() * 3 + 2;
            const height = Math.random() * 10 + 5;
            const depth = Math.random() * 3 + 2;
            
            // Crear edificio
            const building = new Building(this.scene, {
                position: position,
                width: width,
                height: height,
                depth: depth,
                physics: this.physics
            });
            
            this.buildings.push(building);
        }
    }
    
    /**
     * Crea los coches
     */
    createCars() {
        for (let i = 0; i < this.carCount; i++) {
            // Posición aleatoria en el mapa
            const position = this.getRandomPosition();
            
            // Rotación aleatoria
            const rotation = Math.random() * Math.PI * 2;
            
            // Tipo aleatorio
            const type = Math.floor(Math.random() * 3); // 0: sedan, 1: SUV, 2: sports
            
            // Crear coche
            const car = new Car(this.scene, {
                position: position,
                rotation: rotation,
                type: type,
                physics: this.physics
            });
            
            this.cars.push(car);
        }
    }
    
    /**
     * Crea los árboles
     */
    createTrees() {
        for (let i = 0; i < this.treeCount; i++) {
            // Posición aleatoria en el mapa
            const position = this.getRandomPosition();
            
            // Tamaño aleatorio
            const height = Math.random() * 3 + 2;
            
            // Tipo aleatorio
            const type = Math.floor(Math.random() * 2); // 0: pino, 1: frondoso
            
            // Crear árbol
            const tree = new Tree(this.scene, {
                position: position,
                height: height,
                type: type,
                physics: this.physics
            });
            
            this.trees.push(tree);
        }
    }
    
    /**
     * Crea las farolas
     */
    createLampposts() {
        for (let i = 0; i < this.lamppostCount; i++) {
            // Posición aleatoria en el mapa
            const position = this.getRandomPosition();
            
            // Rotación aleatoria
            const rotation = Math.random() * Math.PI * 2;
            
            // Crear farola
            const lamppost = new Lamppost(this.scene, {
                position: position,
                rotation: rotation,
                physics: this.physics
            });
            
            this.lampposts.push(lamppost);
        }
    }
    
    /**
     * Crea los bancos
     */
    createBenches() {
        for (let i = 0; i < this.benchCount; i++) {
            // Posición aleatoria en el mapa
            const position = this.getRandomPosition();
            
            // Rotación aleatoria
            const rotation = Math.random() * Math.PI * 2;
            
            // Crear banco
            const bench = new Bench(this.scene, {
                position: position,
                rotation: rotation,
                physics: this.physics
            });
            
            this.benches.push(bench);
        }
    }
    
    /**
     * Crea los coleccionables
     */
    createCollectibles() {
        for (let i = 0; i < this.collectibleCount; i++) {
            this.spawnCollectible();
        }
    }
    
    /**
     * Crea un coleccionable en una posición aleatoria
     */
    spawnCollectible() {
        // Posición aleatoria en el mapa
        const position = this.getRandomPosition();
        position.y = 0.5; // Ligeramente por encima del suelo
        
        // Valor aleatorio
        const value = Math.random() * 0.3 + 0.2;
        
        // Color aleatorio
        const colors = [0xffcc00, 0x00ccff, 0xff00cc, 0xccff00];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Crear coleccionable
        const collectible = new Collectible(this.scene, {
            position: position,
            value: value,
            color: color,
            physics: this.physics
        });
        
        this.collectibles.push(collectible);
    }
    
    /**
     * Obtiene una posición aleatoria en el mapa
     * @returns {THREE.Vector3} Posición aleatoria
     */
    getRandomPosition() {
        const halfSize = this.mapSize / 2;
        
        // Posición aleatoria en el mapa
        const x = Math.random() * this.mapSize - halfSize;
        const z = Math.random() * this.mapSize - halfSize;
        
        return new THREE.Vector3(x, 0, z);
    }
    
    /**
     * Actualiza los objetos
     * @param {number} time - Tiempo para la animación
     * @param {THREE.Camera} camera - Cámara para los efectos
     * @param {Hole} hole - Agujero para comprobar colisiones
     */
    update(time, camera, hole) {
        // Actualizar edificios
        for (let i = this.buildings.length - 1; i >= 0; i--) {
            const building = this.buildings[i];
            
            // Comprobar colisión con el agujero
            if (building.checkCollision(hole)) {
                // Aumentar tamaño del agujero
                hole.grow(building.value);
                
                // Eliminar edificio
                if (building.isAbsorbed()) {
                    this.buildings.splice(i, 1);
                }
            }
            
            // Actualizar edificio
            building.update(time);
        }
        
        // Actualizar coches
        for (let i = this.cars.length - 1; i >= 0; i--) {
            const car = this.cars[i];
            
            // Comprobar colisión con el agujero
            if (car.checkCollision(hole)) {
                // Aumentar tamaño del agujero
                hole.grow(car.value);
                
                // Eliminar coche
                if (car.isAbsorbed()) {
                    this.cars.splice(i, 1);
                }
            }
            
            // Actualizar coche
            car.update(time);
        }
        
        // Actualizar árboles
        for (let i = this.trees.length - 1; i >= 0; i--) {
            const tree = this.trees[i];
            
            // Comprobar colisión con el agujero
            if (tree.checkCollision(hole)) {
                // Aumentar tamaño del agujero
                hole.grow(tree.value);
                
                // Eliminar árbol
                if (tree.isAbsorbed()) {
                    this.trees.splice(i, 1);
                }
            }
            
            // Actualizar árbol
            tree.update(time);
        }
        
        // Actualizar farolas
        for (let i = this.lampposts.length - 1; i >= 0; i--) {
            const lamppost = this.lampposts[i];
            
            // Comprobar colisión con el agujero
            if (lamppost.checkCollision(hole)) {
                // Aumentar tamaño del agujero
                hole.grow(lamppost.value);
                
                // Eliminar farola
                if (lamppost.isAbsorbed()) {
                    this.lampposts.splice(i, 1);
                }
            }
            
            // Actualizar farola
            lamppost.update(time);
        }
        
        // Actualizar bancos
        for (let i = this.benches.length - 1; i >= 0; i--) {
            const bench = this.benches[i];
            
            // Comprobar colisión con el agujero
            if (bench.checkCollision(hole)) {
                // Aumentar tamaño del agujero
                hole.grow(bench.value);
                
                // Eliminar banco
                if (bench.isAbsorbed()) {
                    this.benches.splice(i, 1);
                }
            }
            
            // Actualizar banco
            bench.update(time);
        }
        
        // Actualizar coleccionables
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            
            // Comprobar colisión con el agujero
            if (collectible.checkCollision(hole)) {
                // Aumentar tamaño del agujero
                hole.grow(collectible.collect());
                
                // Eliminar coleccionable
                this.collectibles.splice(i, 1);
            } else {
                // Actualizar coleccionable
                collectible.update(time, camera);
            }
        }
        
        // Generar nuevos coleccionables
        if (time - this.lastCollectibleSpawn > this.collectibleSpawnInterval) {
            this.lastCollectibleSpawn = time;
            
            // Mantener un número constante de coleccionables
            if (this.collectibles.length < this.collectibleCount) {
                this.spawnCollectible();
            }
        }
    }
    
    /**
     * Comprueba si todos los objetos han sido absorbidos
     * @returns {boolean} True si todos los objetos han sido absorbidos
     */
    areAllObjectsAbsorbed() {
        return (
            this.buildings.length === 0 &&
            this.cars.length === 0 &&
            this.trees.length === 0 &&
            this.lampposts.length === 0 &&
            this.benches.length === 0
        );
    }
    
    /**
     * Obtiene el número total de objetos restantes
     * @returns {number} Número de objetos restantes
     */
    getRemainingObjectsCount() {
        return (
            this.buildings.length +
            this.cars.length +
            this.trees.length +
            this.lampposts.length +
            this.benches.length
        );
    }
    
    /**
     * Obtiene el número total de objetos iniciales
     * @returns {number} Número de objetos iniciales
     */
    getInitialObjectsCount() {
        return (
            this.buildingCount +
            this.carCount +
            this.treeCount +
            this.lamppostCount +
            this.benchCount
        );
    }
    
    /**
     * Elimina todos los objetos
     */
    clear() {
        // Eliminar edificios
        for (const building of this.buildings) {
            building.dispose();
        }
        this.buildings = [];
        
        // Eliminar coches
        for (const car of this.cars) {
            car.dispose();
        }
        this.cars = [];
        
        // Eliminar árboles
        for (const tree of this.trees) {
            tree.dispose();
        }
        this.trees = [];
        
        // Eliminar farolas
        for (const lamppost of this.lampposts) {
            lamppost.dispose();
        }
        this.lampposts = [];
        
        // Eliminar bancos
        for (const bench of this.benches) {
            bench.dispose();
        }
        this.benches = [];
        
        // Eliminar coleccionables
        for (const collectible of this.collectibles) {
            collectible.dispose();
        }
        this.collectibles = [];
    }
}

// Exportar la clase
window.ObjectManager = ObjectManager; 