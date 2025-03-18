/**
 * Componente para la malla del agujero
 * Maneja la creación y actualización de la geometría del agujero
 */
class HoleMesh {
    /**
     * Constructor
     * @param {THREE.Scene} scene - Escena donde se añadirá la malla
     * @param {Object} options - Opciones de configuración
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        this.radius = options.radius || 1.0;
        this.depth = options.depth || 2.0;
        this.segments = options.segments || 32;
        this.color = options.color || new THREE.Color(0x000033);
        
        this.mesh = null;
        this.material = null;
        this.edgeMesh = null;
        
        this.createMesh();
    }
    
    /**
     * Crea la malla del agujero
     */
    createMesh() {
        // Geometría del agujero (cilindro con parte superior abierta)
        const geometry = new THREE.CylinderGeometry(
            this.radius, 
            this.radius * 0.8, 
            this.depth, 
            this.segments, 
            10, 
            true
        );
        
        // Shader personalizado para el agujero
        const vertexShader = `
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            void main() {
                vUv = uv;
                vPosition = position;
                vNormal = normal;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = `
            uniform float time;
            uniform vec3 holeColor;
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            void main() {
                // Patrón de vórtice
                float depth = vPosition.y / 2.0;
                float spiral = sin(vUv.y * 20.0 + vUv.x * 10.0 + time * 2.0) * 0.5 + 0.5;
                
                // Color base del agujero (negro con tinte azul)
                vec3 color = holeColor;
                
                // Añadir brillo en los bordes
                float edge = smoothstep(0.8, 1.0, vUv.y);
                color = mix(color, vec3(0.0, 0.5, 1.0), edge * 0.5);
                
                // Añadir efecto de vórtice
                color = mix(color, vec3(0.0, 0.3, 0.8), spiral * (1.0 - depth) * 0.3);
                
                // Oscurecer hacia el fondo
                color *= (1.0 - depth * 0.8);
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;
        
        // Material con shader personalizado
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                holeColor: { value: this.color }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.BackSide
        });
        
        // Crear malla
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.y = -this.depth / 2;
        this.mesh.rotation.x = Math.PI; // Invertir para que la parte abierta esté arriba
        this.mesh.receiveShadow = true;
        
        // Añadir a la escena
        this.scene.add(this.mesh);
        
        // Crear borde del agujero
        this.createEdge();
    }
    
    /**
     * Crea el borde del agujero
     */
    createEdge() {
        // Geometría del borde (anillo)
        const edgeGeometry = new THREE.RingGeometry(this.radius, this.radius + 0.1, this.segments);
        
        // Material del borde
        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 0.2,
            metalness: 0.8,
            side: THREE.DoubleSide
        });
        
        // Crear malla
        this.edgeMesh = new THREE.Mesh(edgeGeometry, edgeMaterial);
        this.edgeMesh.rotation.x = -Math.PI / 2;
        this.edgeMesh.position.y = 0.01; // Ligeramente por encima del suelo
        this.edgeMesh.receiveShadow = true;
        
        // Añadir a la escena
        this.scene.add(this.edgeMesh);
    }
    
    /**
     * Actualiza la malla con un nuevo tamaño
     * @param {number} radius - Nuevo radio
     */
    updateSize(radius) {
        this.radius = radius;
        
        // Eliminar mallas existentes
        this.scene.remove(this.mesh);
        this.scene.remove(this.edgeMesh);
        
        // Actualizar geometría del agujero
        const newGeometry = new THREE.CylinderGeometry(
            this.radius, 
            this.radius * 0.8, 
            this.depth, 
            this.segments, 
            10, 
            true
        );
        this.mesh.geometry.dispose();
        this.mesh.geometry = newGeometry;
        
        // Actualizar borde
        const newEdgeGeometry = new THREE.RingGeometry(this.radius, this.radius + 0.1, this.segments);
        this.edgeMesh.geometry.dispose();
        this.edgeMesh.geometry = newEdgeGeometry;
        
        // Volver a añadir a la escena
        this.scene.add(this.mesh);
        this.scene.add(this.edgeMesh);
    }
    
    /**
     * Actualiza la posición de la malla
     * @param {THREE.Vector3} position - Nueva posición
     */
    updatePosition(position) {
        this.mesh.position.x = position.x;
        this.mesh.position.z = position.z;
        this.mesh.position.y = position.y - this.depth / 2;
        
        this.edgeMesh.position.x = position.x;
        this.edgeMesh.position.z = position.z;
        this.edgeMesh.position.y = 0.01; // Mantener ligeramente por encima del suelo
    }
    
    /**
     * Actualiza el shader
     * @param {number} time - Tiempo para la animación del shader
     */
    update(time) {
        if (this.material && this.material.uniforms) {
            this.material.uniforms.time.value = time;
        }
    }
    
    /**
     * Obtiene la malla principal
     * @returns {THREE.Mesh} Malla principal
     */
    getMesh() {
        return this.mesh;
    }
    
    /**
     * Obtiene el borde
     * @returns {THREE.Mesh} Malla del borde
     */
    getEdgeMesh() {
        return this.edgeMesh;
    }
    
    /**
     * Elimina las mallas de la escena
     */
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        
        if (this.edgeMesh) {
            this.scene.remove(this.edgeMesh);
            this.edgeMesh.geometry.dispose();
            this.edgeMesh.material.dispose();
        }
    }
}

// Exportar la clase
window.HoleMesh = HoleMesh; 