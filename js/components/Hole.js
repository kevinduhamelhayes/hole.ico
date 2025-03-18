/**
 * Clase principal del agujero
 * Coordina los componentes de malla y efectos
 */
class Hole {
    /**
     * Constructor
     * @param {THREE.Scene} scene - Escena donde se añadirá el agujero
     * @param {Object} options - Opciones de configuración
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        this.radius = options.radius || 1.0;
        this.position = new THREE.Vector3(0, 0, 0);
        this.growFactor = options.growFactor || 0.02;
        this.maxRadius = options.maxRadius || 10.0;
        
        // Crear componentes
        this.mesh = new HoleMesh(scene, {
            radius: this.radius,
            depth: options.depth || 2.0,
            segments: options.segments || 32,
            color: options.color || new THREE.Color(0x000033)
        });
        
        this.effects = new HoleEffects(scene, {
            radius: this.radius,
            position: this.position
        });
        
        // Física (opcional)
        this.physics = options.physics || null;
        this.rigidBody = null;
        
        if (this.physics && this.physics.initialized) {
            this.initPhysics();
        }
    }
    
    /**
     * Inicializa la física del agujero
     */
    initPhysics() {
        if (!this.physics || !this.physics.initialized) return;
        
        try {
            // Crear forma de cilindro para el agujero
            const shape = this.physics.createCylinderShape({
                radius: this.radius,
                height: 0.1 // Altura muy pequeña para que sea casi plano
            });
            
            // Crear cuerpo rígido
            this.rigidBody = this.physics.createRigidBody({
                shape: shape,
                mass: 0, // Masa 0 para que sea estático
                position: {
                    x: this.position.x,
                    y: 0.05, // Ligeramente por encima del suelo
                    z: this.position.z
                },
                restitution: 0.0,
                friction: 0.0
            });
            
            // Configurar como sensor (trigger)
            if (this.rigidBody) {
                this.rigidBody.setCollisionFlags(
                    this.rigidBody.getCollisionFlags() | 
                    this.physics.ammoClone.btCollisionObject.CF_NO_CONTACT_RESPONSE
                );
            }
        } catch (error) {
            console.error("Error al inicializar física del agujero:", error);
        }
    }
    
    /**
     * Mueve el agujero
     * @param {number} dx - Desplazamiento en X
     * @param {number} dy - Desplazamiento en Y
     * @param {number} dz - Desplazamiento en Z
     */
    move(dx, dy, dz) {
        // Actualizar posición
        this.position.x += dx;
        this.position.y += dy;
        this.position.z += dz;
        
        // Actualizar componentes
        this.mesh.updatePosition(this.position);
        this.effects.updatePosition(this.position);
        
        // Actualizar física
        if (this.physics && this.rigidBody) {
            const transform = new this.physics.ammoClone.btTransform();
            this.rigidBody.getMotionState().getWorldTransform(transform);
            transform.setOrigin(
                new this.physics.ammoClone.btVector3(
                    this.position.x,
                    0.05, // Mantener ligeramente por encima del suelo
                    this.position.z
                )
            );
            this.rigidBody.getMotionState().setWorldTransform(transform);
        }
    }
    
    /**
     * Aumenta el tamaño del agujero
     * @param {number} objectValue - Valor del objeto absorbido
     * @returns {number} Cantidad de crecimiento
     */
    grow(objectValue) {
        // Calcular incremento de tamaño basado en el valor del objeto
        const growAmount = objectValue * this.growFactor;
        
        // Aumentar radio (con límite máximo)
        this.radius = Math.min(this.radius + growAmount, this.maxRadius);
        
        // Actualizar componentes
        this.mesh.updateSize(this.radius);
        this.effects.updateSize(this.radius);
        
        // Añadir efecto visual
        this.effects.addGrowthEffect();
        
        // Actualizar física
        if (this.physics && this.rigidBody) {
            // Eliminar cuerpo rígido anterior
            this.physics.removeObject(this);
            
            // Crear nuevo cuerpo rígido con el tamaño actualizado
            this.initPhysics();
        }
        
        return growAmount;
    }
    
    /**
     * Establece el tamaño del agujero directamente
     * @param {number} size - Nuevo tamaño
     */
    setSize(size) {
        this.radius = Math.min(size, this.maxRadius);
        
        // Actualizar componentes
        this.mesh.updateSize(this.radius);
        this.effects.updateSize(this.radius);
        
        // Actualizar física
        if (this.physics && this.rigidBody) {
            // Eliminar cuerpo rígido anterior
            this.physics.removeObject(this);
            
            // Crear nuevo cuerpo rígido con el tamaño actualizado
            this.initPhysics();
        }
    }
    
    /**
     * Actualiza el agujero
     * @param {number} time - Tiempo para la animación
     */
    update(time) {
        // Actualizar componentes
        this.mesh.update(time);
        this.effects.update(time);
    }
    
    /**
     * Obtiene el radio actual del agujero
     * @returns {number} Radio actual
     */
    getRadius() {
        return this.radius;
    }
    
    /**
     * Obtiene la posición actual del agujero
     * @returns {THREE.Vector3} Posición actual
     */
    getPosition() {
        return this.position;
    }
    
    /**
     * Elimina el agujero de la escena
     */
    dispose() {
        // Eliminar componentes
        this.mesh.dispose();
        this.effects.dispose();
        
        // Eliminar física
        if (this.physics && this.rigidBody) {
            this.physics.removeObject(this);
        }
    }
}

// Exportar la clase
window.Hole = Hole; 