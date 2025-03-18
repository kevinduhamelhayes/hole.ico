/**
 * Gestor de cámara
 * Se encarga de seguir al agujero con efectos suaves
 */
class CameraManager {
    /**
     * Constructor
     * @param {THREE.Camera} camera - Cámara a gestionar
     * @param {Object} options - Opciones de configuración
     */
    constructor(camera, options = {}) {
        this.camera = camera;
        this.target = options.target || null;
        this.offset = options.offset || new THREE.Vector3(0, 15, -15);
        this.lookAtOffset = options.lookAtOffset || new THREE.Vector3(0, 0, 0);
        this.damping = options.damping || 0.1;
        this.rotationDamping = options.rotationDamping || 0.05;
        this.zoomDamping = options.zoomDamping || 0.1;
        this.minDistance = options.minDistance || 10;
        this.maxDistance = options.maxDistance || 30;
        this.minHeight = options.minHeight || 5;
        this.maxHeight = options.maxHeight || 30;
        
        // Posición actual de la cámara
        this.currentPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        
        // Posición objetivo de la cámara
        this.targetPosition = new THREE.Vector3();
        this.targetLookAt = new THREE.Vector3();
        
        // Efectos de cámara
        this.shakeAmount = 0;
        this.shakeDecay = 0.9;
        this.shakeVector = new THREE.Vector3();
        
        // Inicializar
        this.init();
    }
    
    /**
     * Inicializa el gestor de cámara
     */
    init() {
        // Establecer posición inicial
        if (this.target) {
            const targetPosition = this.target.getPosition();
            
            this.currentPosition.copy(targetPosition).add(this.offset);
            this.currentLookAt.copy(targetPosition).add(this.lookAtOffset);
            
            this.camera.position.copy(this.currentPosition);
            this.camera.lookAt(this.currentLookAt);
        }
    }
    
    /**
     * Establece el objetivo a seguir
     * @param {Object} target - Objeto a seguir (debe tener método getPosition)
     */
    setTarget(target) {
        this.target = target;
        this.init();
    }
    
    /**
     * Actualiza la cámara
     * @param {number} deltaTime - Tiempo transcurrido desde el último frame
     */
    update(deltaTime) {
        if (!this.target) return;
        
        // Obtener posición del objetivo
        const targetPosition = this.target.getPosition();
        
        // Calcular posición objetivo de la cámara
        this.targetPosition.copy(targetPosition).add(this.offset);
        this.targetLookAt.copy(targetPosition).add(this.lookAtOffset);
        
        // Ajustar altura y distancia basado en el tamaño del agujero
        if (this.target.getRadius) {
            const radius = this.target.getRadius();
            const heightFactor = Math.min(radius / 5, 1); // Normalizar entre 0 y 1
            const distanceFactor = Math.min(radius / 5, 1); // Normalizar entre 0 y 1
            
            // Interpolar altura entre min y max
            const height = this.minHeight + (this.maxHeight - this.minHeight) * heightFactor;
            
            // Interpolar distancia entre min y max
            const distance = this.minDistance + (this.maxDistance - this.minDistance) * distanceFactor;
            
            // Actualizar offset
            const direction = new THREE.Vector3(this.offset.x, 0, this.offset.z).normalize();
            this.offset.x = direction.x * distance;
            this.offset.z = direction.z * distance;
            this.offset.y = height;
        }
        
        // Interpolar posición actual hacia posición objetivo
        this.currentPosition.lerp(this.targetPosition, this.damping);
        this.currentLookAt.lerp(this.targetLookAt, this.rotationDamping);
        
        // Aplicar efecto de shake
        if (this.shakeAmount > 0.001) {
            this.shakeVector.set(
                (Math.random() - 0.5) * this.shakeAmount,
                (Math.random() - 0.5) * this.shakeAmount,
                (Math.random() - 0.5) * this.shakeAmount
            );
            
            this.currentPosition.add(this.shakeVector);
            this.shakeAmount *= this.shakeDecay;
        } else {
            this.shakeAmount = 0;
        }
        
        // Actualizar posición y rotación de la cámara
        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);
    }
    
    /**
     * Añade un efecto de shake a la cámara
     * @param {number} amount - Intensidad del shake
     */
    shake(amount) {
        this.shakeAmount = amount;
    }
    
    /**
     * Realiza un zoom in/out
     * @param {number} amount - Cantidad de zoom (positivo = zoom in, negativo = zoom out)
     */
    zoom(amount) {
        // Calcular nueva distancia
        const direction = new THREE.Vector3(this.offset.x, 0, this.offset.z).normalize();
        const currentDistance = new THREE.Vector3(this.offset.x, 0, this.offset.z).length();
        const newDistance = Math.max(this.minDistance, Math.min(this.maxDistance, currentDistance - amount));
        
        // Actualizar offset
        this.offset.x = direction.x * newDistance;
        this.offset.z = direction.z * newDistance;
    }
    
    /**
     * Rota la cámara alrededor del objetivo
     * @param {number} angle - Ángulo de rotación en radianes
     */
    rotate(angle) {
        // Crear matriz de rotación
        const rotationMatrix = new THREE.Matrix4().makeRotationY(angle);
        
        // Aplicar rotación al offset
        const offsetVector = new THREE.Vector3(this.offset.x, 0, this.offset.z);
        offsetVector.applyMatrix4(rotationMatrix);
        
        // Actualizar offset
        this.offset.x = offsetVector.x;
        this.offset.z = offsetVector.z;
    }
    
    /**
     * Cambia la altura de la cámara
     * @param {number} amount - Cantidad a cambiar (positivo = subir, negativo = bajar)
     */
    changeHeight(amount) {
        // Calcular nueva altura
        const newHeight = Math.max(this.minHeight, Math.min(this.maxHeight, this.offset.y + amount));
        
        // Actualizar offset
        this.offset.y = newHeight;
    }
}

// Exportar la clase
window.CameraManager = CameraManager; 