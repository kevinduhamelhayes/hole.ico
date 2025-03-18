/**
 * Clase para objetos coleccionables
 * Pequeños puntos que el jugador puede recoger para crecer rápidamente
 */
class Collectible {
    /**
     * Constructor
     * @param {THREE.Scene} scene - Escena donde se añadirá el coleccionable
     * @param {Object} options - Opciones de configuración
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        this.position = options.position || new THREE.Vector3(0, 0, 0);
        this.radius = options.radius || 0.3;
        this.value = options.value || 0.5;
        this.rotationSpeed = options.rotationSpeed || 2.0;
        this.floatAmplitude = options.floatAmplitude || 0.2;
        this.floatFrequency = options.floatFrequency || 1.5;
        this.initialY = this.position.y;
        this.active = true;
        
        // Crear malla
        this.createMesh(options.color || 0xffcc00);
        
        // Crear efecto de brillo
        this.createGlowEffect();
        
        // Física (opcional)
        this.physics = options.physics || null;
        this.rigidBody = null;
        
        if (this.physics && this.physics.initialized) {
            this.initPhysics();
        }
    }
    
    /**
     * Crea la malla del coleccionable
     * @param {number} color - Color del coleccionable
     */
    createMesh(color) {
        // Geometría de esfera para el coleccionable
        const geometry = new THREE.SphereGeometry(this.radius, 16, 16);
        
        // Material con brillo
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
        });
        
        // Crear malla
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.collectible = this;
        
        // Añadir a la escena
        this.scene.add(this.mesh);
    }
    
    /**
     * Crea el efecto de brillo alrededor del coleccionable
     */
    createGlowEffect() {
        // Geometría de esfera ligeramente más grande
        const glowGeometry = new THREE.SphereGeometry(this.radius * 1.5, 16, 16);
        
        // Material para el brillo
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0xffff00) },
                viewVector: { value: new THREE.Vector3() },
                c: { value: 0.1 },
                p: { value: 4.0 }
            },
            vertexShader: `
                uniform vec3 viewVector;
                uniform float c;
                uniform float p;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(c - dot(vNormal, vNormel), p);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, intensity);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        
        // Crear malla para el brillo
        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glowMesh.position.copy(this.position);
        
        // Añadir a la escena
        this.scene.add(this.glowMesh);
    }
    
    /**
     * Inicializa la física del coleccionable
     */
    initPhysics() {
        if (!this.physics || !this.physics.initialized) return;
        
        try {
            // Crear forma de esfera
            const shape = this.physics.createSphereShape(this.radius);
            
            // Crear cuerpo rígido
            this.rigidBody = this.physics.createRigidBody({
                shape: shape,
                mass: 0, // Masa 0 para que sea estático
                position: {
                    x: this.position.x,
                    y: this.position.y,
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
            
            // Registrar en el motor de física
            this.physics.registerObject(this);
        } catch (error) {
            console.error("Error al inicializar física del coleccionable:", error);
        }
    }
    
    /**
     * Actualiza el coleccionable
     * @param {number} time - Tiempo para la animación
     * @param {THREE.Camera} camera - Cámara para el efecto de brillo
     */
    update(time, camera) {
        if (!this.active) return;
        
        // Rotación
        this.mesh.rotation.y += this.rotationSpeed * 0.01;
        this.glowMesh.rotation.y = this.mesh.rotation.y;
        
        // Flotación
        const floatOffset = Math.sin(time * this.floatFrequency) * this.floatAmplitude;
        this.mesh.position.y = this.initialY + floatOffset;
        this.glowMesh.position.y = this.mesh.position.y;
        
        // Actualizar efecto de brillo
        if (camera) {
            const viewVector = new THREE.Vector3().subVectors(
                camera.position,
                this.glowMesh.position
            );
            this.glowMesh.material.uniforms.viewVector.value = viewVector;
        }
        
        // Pulsar tamaño
        const scale = 1.0 + Math.sin(time * 3) * 0.1;
        this.mesh.scale.set(scale, scale, scale);
        this.glowMesh.scale.set(scale * 1.2, scale * 1.2, scale * 1.2);
    }
    
    /**
     * Comprueba si el coleccionable colisiona con el agujero
     * @param {Hole} hole - Agujero a comprobar
     * @returns {boolean} True si hay colisión
     */
    checkCollision(hole) {
        if (!this.active) return false;
        
        const holePosition = hole.getPosition();
        const holeRadius = hole.getRadius();
        
        // Calcular distancia entre el coleccionable y el agujero
        const distance = new THREE.Vector3(
            this.position.x,
            0,
            this.position.z
        ).distanceTo(new THREE.Vector3(
            holePosition.x,
            0,
            holePosition.z
        ));
        
        // Hay colisión si la distancia es menor que el radio del agujero
        return distance < holeRadius;
    }
    
    /**
     * Recoge el coleccionable
     * @returns {number} Valor del coleccionable
     */
    collect() {
        if (!this.active) return 0;
        
        // Desactivar
        this.active = false;
        
        // Crear efecto de recolección
        this.createCollectEffect();
        
        // Ocultar mallas
        this.mesh.visible = false;
        this.glowMesh.visible = false;
        
        // Eliminar física
        if (this.physics && this.rigidBody) {
            this.physics.removeObject(this);
        }
        
        // Programar eliminación completa
        setTimeout(() => {
            this.dispose();
        }, 1000);
        
        return this.value;
    }
    
    /**
     * Crea un efecto visual al recoger el coleccionable
     */
    createCollectEffect() {
        // Geometría para partículas
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);
        
        // Inicializar partículas
        for (let i = 0; i < particleCount; i++) {
            // Posición aleatoria en una esfera
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const radius = this.radius * 1.2;
            
            particlePositions[i * 3] = this.position.x + radius * Math.sin(phi) * Math.cos(theta);
            particlePositions[i * 3 + 1] = this.position.y + radius * Math.sin(phi) * Math.sin(theta);
            particlePositions[i * 3 + 2] = this.position.z + radius * Math.cos(phi);
            
            // Tamaño aleatorio
            particleSizes[i] = Math.random() * 0.2 + 0.1;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
        
        // Material para partículas
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0xffff00) },
                pointTexture: { value: this.createParticleTexture() }
            },
            vertexShader: `
                attribute float size;
                varying vec3 vColor;
                void main() {
                    vColor = vec3(1.0, 1.0, 0.0);
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                void main() {
                    gl_FragColor = vec4(color * vColor, 1.0);
                    gl_FragColor = gl_FragColor * texture2D(pointTexture, gl_PointCoord);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true
        });
        
        // Crear sistema de partículas
        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.particles);
        
        // Animar partículas
        const positions = this.particles.geometry.attributes.position.array;
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            // Velocidad aleatoria hacia afuera
            velocities.push({
                x: (Math.random() - 0.5) * 0.3,
                y: Math.random() * 0.3,
                z: (Math.random() - 0.5) * 0.3
            });
        }
        
        // Función de animación
        const animate = () => {
            // Actualizar posiciones
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i].x;
                positions[i * 3 + 1] += velocities[i].y;
                positions[i * 3 + 2] += velocities[i].z;
                
                // Aplicar gravedad
                velocities[i].y -= 0.01;
            }
            
            this.particles.geometry.attributes.position.needsUpdate = true;
            
            // Continuar animación
            if (this.particles) {
                requestAnimationFrame(animate);
            }
        };
        
        // Iniciar animación
        animate();
        
        // Eliminar partículas después de un tiempo
        setTimeout(() => {
            if (this.particles) {
                this.scene.remove(this.particles);
                this.particles.geometry.dispose();
                this.particles.material.dispose();
                this.particles = null;
            }
        }, 1000);
    }
    
    /**
     * Crea una textura para las partículas
     * @returns {THREE.Texture} Textura para partículas
     */
    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(
            canvas.width / 2,
            canvas.height / 2,
            0,
            canvas.width / 2,
            canvas.height / 2,
            canvas.width / 2
        );
        
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,0,1)');
        gradient.addColorStop(0.4, 'rgba(255,255,0,0.5)');
        gradient.addColorStop(1, 'rgba(255,255,0,0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    /**
     * Elimina el coleccionable de la escena
     */
    dispose() {
        // Eliminar mallas
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.mesh = null;
        }
        
        if (this.glowMesh) {
            this.scene.remove(this.glowMesh);
            this.glowMesh.geometry.dispose();
            this.glowMesh.material.dispose();
            this.glowMesh = null;
        }
        
        if (this.particles) {
            this.scene.remove(this.particles);
            this.particles.geometry.dispose();
            this.particles.material.dispose();
            this.particles = null;
        }
        
        // Eliminar física
        if (this.physics && this.rigidBody) {
            this.physics.removeObject(this);
        }
    }
}

// Exportar la clase
window.Collectible = Collectible; 