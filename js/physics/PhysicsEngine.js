/**
 * Motor de física para el juego Hole.io Web
 * Maneja la inicialización y actualización de la física usando Ammo.js
 */
class PhysicsEngine {
    constructor() {
        this.world = null;
        this.tmpTrans = null;
        this.ammoClone = null;
        this.gravity = -9.8;
        this.initialized = false;
        this.objects = [];
    }

    /**
     * Inicializa el motor de física
     * @returns {Promise} Promesa que se resuelve cuando la física está inicializada
     */
    async init() {
        console.log("Inicializando motor de física...");
        
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
                        this.ammoClone = AmmoLib;
                        this.setupPhysicsWorld();
                        this.initialized = true;
                        resolve();
                    }).catch(error => {
                        console.error("Error al cargar Ammo.js:", error);
                        reject(error);
                    });
                } else {
                    // Si ya está cargado
                    console.log("Ammo.js ya está cargado");
                    this.ammoClone = Ammo;
                    this.setupPhysicsWorld();
                    this.initialized = true;
                    resolve();
                }
            } catch (error) {
                console.error("Error en initPhysics:", error);
                reject(error);
            }
        });
    }

    /**
     * Configura el mundo físico
     */
    setupPhysicsWorld() {
        try {
            console.log("Configurando mundo físico...");
            // Configuración de la física
            const collisionConfiguration = new this.ammoClone.btDefaultCollisionConfiguration();
            const dispatcher = new this.ammoClone.btCollisionDispatcher(collisionConfiguration);
            const overlappingPairCache = new this.ammoClone.btDbvtBroadphase();
            const solver = new this.ammoClone.btSequentialImpulseConstraintSolver();
            
            // Crear mundo físico
            this.world = new this.ammoClone.btDiscreteDynamicsWorld(
                dispatcher, overlappingPairCache, solver, collisionConfiguration
            );
            
            // Establecer gravedad
            this.world.setGravity(new this.ammoClone.btVector3(0, this.gravity, 0));
            
            // Crear transformación temporal para reutilizar
            this.tmpTrans = new this.ammoClone.btTransform();
            console.log("Mundo físico configurado correctamente");
        } catch (error) {
            console.error("Error al configurar mundo físico:", error);
        }
    }

    /**
     * Actualiza la simulación física
     * @param {number} deltaTime - Tiempo transcurrido desde la última actualización
     */
    update(deltaTime) {
        try {
            if (!this.initialized || !this.world) return;
            
            // Paso de simulación física
            this.world.stepSimulation(deltaTime || 1/60, 10);
            
            // Actualizar objetos con física
            this.objects.forEach(object => {
                if (object.rigidBody) {
                    const motionState = object.rigidBody.getMotionState();
                    if (motionState) {
                        motionState.getWorldTransform(this.tmpTrans);
                        const pos = this.tmpTrans.getOrigin();
                        const quat = this.tmpTrans.getRotation();
                        
                        object.mesh.position.set(pos.x(), pos.y(), pos.z());
                        object.mesh.quaternion.set(quat.x(), quat.y(), quat.z(), quat.w());
                    }
                }
            });
        } catch (error) {
            console.error("Error al actualizar física:", error);
        }
    }

    /**
     * Crea un cuerpo rígido para un objeto
     * @param {Object} params - Parámetros para crear el cuerpo rígido
     * @returns {Object} Cuerpo rígido creado
     */
    createRigidBody(params) {
        if (!this.initialized || !this.world) return null;
        
        try {
            const { 
                shape, 
                mass = 0, 
                position = { x: 0, y: 0, z: 0 }, 
                rotation = { x: 0, y: 0, z: 0, w: 1 },
                restitution = 0.2,
                friction = 0.5
            } = params;
            
            // Crear transformación inicial
            const transform = new this.ammoClone.btTransform();
            transform.setIdentity();
            transform.setOrigin(new this.ammoClone.btVector3(position.x, position.y, position.z));
            
            const quaternion = new this.ammoClone.btQuaternion(rotation.x, rotation.y, rotation.z, rotation.w);
            transform.setRotation(quaternion);
            
            // Calcular inercia local
            const localInertia = new this.ammoClone.btVector3(0, 0, 0);
            if (mass > 0) {
                shape.calculateLocalInertia(mass, localInertia);
            }
            
            // Crear estado de movimiento
            const motionState = new this.ammoClone.btDefaultMotionState(transform);
            
            // Crear información de construcción del cuerpo rígido
            const rbInfo = new this.ammoClone.btRigidBodyConstructionInfo(
                mass, motionState, shape, localInertia
            );
            
            // Crear cuerpo rígido
            const rigidBody = new this.ammoClone.btRigidBody(rbInfo);
            
            // Configurar propiedades físicas
            rigidBody.setRestitution(restitution);
            rigidBody.setFriction(friction);
            
            // Añadir al mundo
            this.world.addRigidBody(rigidBody);
            
            return rigidBody;
        } catch (error) {
            console.error("Error al crear cuerpo rígido:", error);
            return null;
        }
    }

    /**
     * Crea una forma de caja para un cuerpo rígido
     * @param {Object} dimensions - Dimensiones de la caja (width, height, depth)
     * @returns {Object} Forma de caja creada
     */
    createBoxShape(dimensions) {
        if (!this.initialized || !this.ammoClone) return null;
        
        try {
            const { width, height, depth } = dimensions;
            return new this.ammoClone.btBoxShape(
                new this.ammoClone.btVector3(width / 2, height / 2, depth / 2)
            );
        } catch (error) {
            console.error("Error al crear forma de caja:", error);
            return null;
        }
    }

    /**
     * Crea una forma de esfera para un cuerpo rígido
     * @param {number} radius - Radio de la esfera
     * @returns {Object} Forma de esfera creada
     */
    createSphereShape(radius) {
        if (!this.initialized || !this.ammoClone) return null;
        
        try {
            return new this.ammoClone.btSphereShape(radius);
        } catch (error) {
            console.error("Error al crear forma de esfera:", error);
            return null;
        }
    }

    /**
     * Crea una forma de cilindro para un cuerpo rígido
     * @param {Object} dimensions - Dimensiones del cilindro (radius, height)
     * @returns {Object} Forma de cilindro creada
     */
    createCylinderShape(dimensions) {
        if (!this.initialized || !this.ammoClone) return null;
        
        try {
            const { radius, height } = dimensions;
            return new this.ammoClone.btCylinderShape(
                new this.ammoClone.btVector3(radius, height / 2, radius)
            );
        } catch (error) {
            console.error("Error al crear forma de cilindro:", error);
            return null;
        }
    }

    /**
     * Registra un objeto para ser actualizado por el motor de física
     * @param {Object} object - Objeto a registrar
     */
    registerObject(object) {
        if (object && object.rigidBody) {
            this.objects.push(object);
        }
    }

    /**
     * Elimina un objeto del motor de física
     * @param {Object} object - Objeto a eliminar
     */
    removeObject(object) {
        if (!object || !object.rigidBody || !this.world) return;
        
        try {
            this.world.removeRigidBody(object.rigidBody);
            const index = this.objects.indexOf(object);
            if (index !== -1) {
                this.objects.splice(index, 1);
            }
        } catch (error) {
            console.error("Error al eliminar objeto de la física:", error);
        }
    }

    /**
     * Aplica una fuerza a un cuerpo rígido
     * @param {Object} rigidBody - Cuerpo rígido al que aplicar la fuerza
     * @param {Object} force - Fuerza a aplicar (x, y, z)
     */
    applyForce(rigidBody, force) {
        if (!rigidBody) return;
        
        try {
            rigidBody.applyCentralForce(
                new this.ammoClone.btVector3(force.x, force.y, force.z)
            );
        } catch (error) {
            console.error("Error al aplicar fuerza:", error);
        }
    }

    /**
     * Aplica un impulso a un cuerpo rígido
     * @param {Object} rigidBody - Cuerpo rígido al que aplicar el impulso
     * @param {Object} impulse - Impulso a aplicar (x, y, z)
     */
    applyImpulse(rigidBody, impulse) {
        if (!rigidBody) return;
        
        try {
            rigidBody.applyCentralImpulse(
                new this.ammoClone.btVector3(impulse.x, impulse.y, impulse.z)
            );
        } catch (error) {
            console.error("Error al aplicar impulso:", error);
        }
    }

    /**
     * Establece la velocidad lineal de un cuerpo rígido
     * @param {Object} rigidBody - Cuerpo rígido
     * @param {Object} velocity - Velocidad a establecer (x, y, z)
     */
    setLinearVelocity(rigidBody, velocity) {
        if (!rigidBody) return;
        
        try {
            rigidBody.setLinearVelocity(
                new this.ammoClone.btVector3(velocity.x, velocity.y, velocity.z)
            );
        } catch (error) {
            console.error("Error al establecer velocidad lineal:", error);
        }
    }

    /**
     * Establece la velocidad angular de un cuerpo rígido
     * @param {Object} rigidBody - Cuerpo rígido
     * @param {Object} velocity - Velocidad angular a establecer (x, y, z)
     */
    setAngularVelocity(rigidBody, velocity) {
        if (!rigidBody) return;
        
        try {
            rigidBody.setAngularVelocity(
                new this.ammoClone.btVector3(velocity.x, velocity.y, velocity.z)
            );
        } catch (error) {
            console.error("Error al establecer velocidad angular:", error);
        }
    }
}

// Exportar la clase
window.PhysicsEngine = PhysicsEngine; 