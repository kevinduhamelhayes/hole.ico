/**
 * Componente para los efectos visuales del agujero
 * Maneja la creación y actualización de efectos como vórtice, partículas y luz
 */
class HoleEffects {
    /**
     * Constructor
     * @param {THREE.Scene} scene - Escena donde se añadirán los efectos
     * @param {Object} options - Opciones de configuración
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        this.radius = options.radius || 1.0;
        this.position = options.position || new THREE.Vector3(0, 0, 0);
        
        this.vortexMesh = null;
        this.particles = null;
        this.particleVelocities = [];
        this.particlePositions = null;
        this.light = null;
        
        // Crear efectos
        this.createVortexEffect();
        this.createParticleEffect();
        this.createLightEffect();
    }
    
    /**
     * Crea el efecto de vórtice
     */
    createVortexEffect() {
        // Geometría para el vórtice (espiral dentro del agujero)
        const vortexGeometry = new THREE.PlaneGeometry(this.radius * 2, this.radius * 2, 20, 20);
        
        // Shader para el vórtice
        const vertexShader = `
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = `
            uniform float time;
            varying vec2 vUv;
            
            void main() {
                // Calcular distancia al centro
                vec2 center = vec2(0.5, 0.5);
                float dist = distance(vUv, center);
                
                // Crear patrón de espiral
                float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
                float spiral = sin(dist * 20.0 - time * 3.0 + angle * 10.0) * 0.5 + 0.5;
                
                // Color basado en la distancia y el patrón
                vec3 color = mix(
                    vec3(0.0, 0.2, 0.5),
                    vec3(0.0, 0.0, 0.2),
                    spiral
                );
                
                // Transparencia basada en la distancia al centro
                float alpha = smoothstep(0.5, 0.0, dist);
                
                gl_FragColor = vec4(color, alpha * 0.7);
            }
        `;
        
        // Material con shader
        const vortexMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        
        // Crear malla
        this.vortexMesh = new THREE.Mesh(vortexGeometry, vortexMaterial);
        this.vortexMesh.rotation.x = -Math.PI / 2;
        this.vortexMesh.position.copy(this.position);
        this.vortexMesh.position.y = 0.05; // Ligeramente por encima del suelo
        
        // Añadir a la escena
        this.scene.add(this.vortexMesh);
    }
    
    /**
     * Crea el efecto de partículas
     */
    createParticleEffect() {
        // Número de partículas
        const particleCount = 100;
        
        // Geometría para las partículas
        const particleGeometry = new THREE.BufferGeometry();
        
        // Posiciones iniciales (alrededor del borde del agujero)
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Posición aleatoria en el borde
            const angle = Math.random() * Math.PI * 2;
            const radius = this.radius * (0.8 + Math.random() * 0.2);
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = 0.1 + Math.random() * 0.2; // Ligeramente por encima del suelo
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // Velocidad hacia el centro
            velocities.push({
                x: -positions[i * 3] * 0.05,
                y: -0.05 - Math.random() * 0.05,
                z: -positions[i * 3 + 2] * 0.05
            });
            
            // Tamaño aleatorio
            sizes[i] = 0.05 + Math.random() * 0.1;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Shader para las partículas
        const vertexShader = `
            attribute float size;
            varying vec3 vColor;
            
            void main() {
                vColor = vec3(0.0, 0.3, 0.8);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;
        
        const fragmentShader = `
            varying vec3 vColor;
            
            void main() {
                // Crear partícula circular con desvanecimiento en los bordes
                float dist = length(gl_PointCoord - vec2(0.5, 0.5));
                if (dist > 0.5) discard;
                
                float alpha = smoothstep(0.5, 0.0, dist);
                gl_FragColor = vec4(vColor, alpha);
            }
        `;
        
        // Material para las partículas
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {},
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            depthWrite: false
        });
        
        // Crear sistema de partículas
        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.particles.position.copy(this.position);
        this.particleVelocities = velocities;
        this.particlePositions = positions;
        
        // Añadir a la escena
        this.scene.add(this.particles);
    }
    
    /**
     * Crea el efecto de luz
     */
    createLightEffect() {
        // Luz dentro del agujero
        this.light = new THREE.PointLight(0x0033ff, 1, 5);
        this.light.position.copy(this.position);
        this.light.position.y = -1;
        this.scene.add(this.light);
    }
    
    /**
     * Actualiza los efectos
     * @param {number} time - Tiempo para la animación
     */
    update(time) {
        // Actualizar vórtice
        if (this.vortexMesh && this.vortexMesh.material.uniforms) {
            this.vortexMesh.material.uniforms.time.value = time;
        }
        
        // Actualizar partículas
        this.updateParticles();
        
        // Pulso de luz
        if (this.light) {
            this.light.intensity = 1 + Math.sin(time * 3) * 0.3;
        }
    }
    
    /**
     * Actualiza las partículas
     */
    updateParticles() {
        if (!this.particles) return;
        
        const positions = this.particlePositions;
        const velocities = this.particleVelocities;
        
        for (let i = 0; i < positions.length / 3; i++) {
            // Actualizar posición
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y;
            positions[i * 3 + 2] += velocities[i].z;
            
            // Si la partícula está muy cerca del centro o por debajo del agujero, reiniciarla
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const z = positions[i * 3 + 2];
            
            const distToCenter = Math.sqrt(x * x + z * z);
            
            if (distToCenter < 0.2 || y < -1) {
                // Reiniciar en el borde
                const angle = Math.random() * Math.PI * 2;
                const radius = this.radius * (0.8 + Math.random() * 0.2);
                
                positions[i * 3] = Math.cos(angle) * radius;
                positions[i * 3 + 1] = 0.1 + Math.random() * 0.2;
                positions[i * 3 + 2] = Math.sin(angle) * radius;
                
                // Actualizar velocidad
                velocities[i].x = -positions[i * 3] * 0.05;
                velocities[i].y = -0.05 - Math.random() * 0.05;
                velocities[i].z = -positions[i * 3 + 2] * 0.05;
            }
        }
        
        // Actualizar buffer de posiciones
        this.particles.geometry.attributes.position.needsUpdate = true;
    }
    
    /**
     * Actualiza la posición de los efectos
     * @param {THREE.Vector3} position - Nueva posición
     */
    updatePosition(position) {
        this.position.copy(position);
        
        if (this.vortexMesh) {
            this.vortexMesh.position.x = position.x;
            this.vortexMesh.position.z = position.z;
            this.vortexMesh.position.y = 0.05; // Mantener ligeramente por encima del suelo
        }
        
        if (this.particles) {
            this.particles.position.x = position.x;
            this.particles.position.z = position.z;
            this.particles.position.y = 0;
        }
        
        if (this.light) {
            this.light.position.x = position.x;
            this.light.position.z = position.z;
            this.light.position.y = -1;
        }
    }
    
    /**
     * Actualiza el tamaño de los efectos
     * @param {number} radius - Nuevo radio
     */
    updateSize(radius) {
        this.radius = radius;
        
        // Actualizar vórtice
        if (this.vortexMesh) {
            this.scene.remove(this.vortexMesh);
            const newVortexGeometry = new THREE.PlaneGeometry(this.radius * 2, this.radius * 2, 20, 20);
            this.vortexMesh.geometry.dispose();
            this.vortexMesh.geometry = newVortexGeometry;
            this.scene.add(this.vortexMesh);
        }
        
        // No es necesario actualizar las partículas, se adaptarán automáticamente
        // al regenerarse en el borde del nuevo radio
    }
    
    /**
     * Añade un efecto de crecimiento
     */
    addGrowthEffect() {
        // Crear onda expansiva
        const ringGeometry = new THREE.RingGeometry(this.radius, this.radius + 0.2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(this.position);
        ring.position.y = 0.05;
        this.scene.add(ring);
        
        // Animar la onda
        const startTime = Date.now();
        const duration = 500; // 0.5 segundos
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Expandir el anillo
            ring.scale.set(1 + progress, 1 + progress, 1);
            
            // Desvanecer
            ringMaterial.opacity = 0.7 * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(ring);
                ringGeometry.dispose();
                ringMaterial.dispose();
            }
        };
        
        animate();
    }
    
    /**
     * Elimina los efectos de la escena
     */
    dispose() {
        if (this.vortexMesh) {
            this.scene.remove(this.vortexMesh);
            this.vortexMesh.geometry.dispose();
            this.vortexMesh.material.dispose();
        }
        
        if (this.particles) {
            this.scene.remove(this.particles);
            this.particles.geometry.dispose();
            this.particles.material.dispose();
        }
        
        if (this.light) {
            this.scene.remove(this.light);
        }
    }
}

// Exportar la clase
window.HoleEffects = HoleEffects; 