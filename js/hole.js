class Hole {
    constructor(scene) {
        this.scene = scene;
        this.radius = 1.0;
        this.depth = 2.0;
        this.position = new THREE.Vector3(0, 0, 0);
        
        // Crear geometría del agujero
        this.createHoleMesh();
        
        // Crear efecto de vórtice
        this.createVortexEffect();
        
        // Crear efecto de partículas
        this.createParticleEffect();
        
        // Crear efecto de luz
        this.createLightEffect();
    }
    
    createHoleMesh() {
        // Geometría del agujero (cilindro con parte superior abierta)
        const geometry = new THREE.CylinderGeometry(this.radius, this.radius * 0.8, this.depth, 32, 10, true);
        
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
                holeColor: { value: new THREE.Color(0x000033) }
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
        this.createHoleEdge();
    }
    
    createHoleEdge() {
        // Geometría del borde (anillo)
        const edgeGeometry = new THREE.RingGeometry(this.radius, this.radius + 0.1, 32);
        
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
        this.vortexMesh.position.y = 0.05; // Ligeramente por encima del suelo
        
        // Añadir a la escena
        this.scene.add(this.vortexMesh);
    }
    
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
        this.particleVelocities = velocities;
        this.particlePositions = positions;
        
        // Añadir a la escena
        this.scene.add(this.particles);
    }
    
    createLightEffect() {
        // Luz dentro del agujero
        this.light = new THREE.PointLight(0x0033ff, 1, 5);
        this.light.position.set(0, -1, 0);
        this.scene.add(this.light);
    }
    
    update() {
        // Actualizar tiempo para los shaders
        const time = Date.now() * 0.001;
        this.material.uniforms.time.value = time;
        if (this.vortexMesh) {
            this.vortexMesh.material.uniforms.time.value = time;
        }
        
        // Actualizar partículas
        this.updateParticles();
        
        // Pulso de luz
        if (this.light) {
            this.light.intensity = 1 + Math.sin(time * 3) * 0.3;
        }
    }
    
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
    
    move(dx, dy, dz) {
        // Actualizar posición
        this.position.x += dx;
        this.position.y += dy;
        this.position.z += dz;
        
        // Actualizar posición de las mallas
        this.mesh.position.x = this.position.x;
        this.mesh.position.z = this.position.z;
        
        this.edgeMesh.position.x = this.position.x;
        this.edgeMesh.position.z = this.position.z;
        
        if (this.vortexMesh) {
            this.vortexMesh.position.x = this.position.x;
            this.vortexMesh.position.z = this.position.z;
        }
        
        if (this.light) {
            this.light.position.x = this.position.x;
            this.light.position.z = this.position.z;
        }
        
        // Actualizar posición de las partículas
        if (this.particles) {
            this.particles.position.x = this.position.x;
            this.particles.position.z = this.position.z;
        }
    }
    
    // Método para hacer crecer el agujero basado en el valor del objeto absorbido
    grow(objectValue) {
        // Calcular incremento de tamaño basado en el valor del objeto
        // Objetos más grandes/valiosos hacen crecer más el agujero
        const growFactor = 0.02; // Factor de crecimiento base
        const growAmount = objectValue * growFactor;
        
        // Aumentar radio
        this.radius += growAmount;
        
        // Actualizar geometrías
        this.updateGeometries();
        
        // Añadir efecto visual de crecimiento
        this.addGrowthEffect();
        
        return growAmount;
    }
    
    // Actualizar geometrías después de cambiar el tamaño
    updateGeometries() {
        // Eliminar mallas existentes
        this.scene.remove(this.mesh);
        this.scene.remove(this.edgeMesh);
        if (this.vortexMesh) this.scene.remove(this.vortexMesh);
        
        // Recrear con el nuevo tamaño
        // Actualizar geometría del agujero
        const newGeometry = new THREE.CylinderGeometry(this.radius, this.radius * 0.8, this.depth, 32, 10, true);
        this.mesh.geometry.dispose();
        this.mesh.geometry = newGeometry;
        
        // Actualizar borde
        const newEdgeGeometry = new THREE.RingGeometry(this.radius, this.radius + 0.1, 32);
        this.edgeMesh.geometry.dispose();
        this.edgeMesh.geometry = newEdgeGeometry;
        
        // Actualizar vórtice
        if (this.vortexMesh) {
            const newVortexGeometry = new THREE.PlaneGeometry(this.radius * 2, this.radius * 2, 20, 20);
            this.vortexMesh.geometry.dispose();
            this.vortexMesh.geometry = newVortexGeometry;
        }
        
        // Volver a añadir a la escena
        this.scene.add(this.mesh);
        this.scene.add(this.edgeMesh);
        if (this.vortexMesh) this.scene.add(this.vortexMesh);
    }
    
    // Añadir efecto visual cuando el agujero crece
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
        ring.position.copy(this.mesh.position);
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
    
    // Método para establecer el tamaño directamente
    setSize(size) {
        this.radius = size;
        this.updateGeometries();
    }
    
    // Obtener radio actual
    getRadius() {
        return this.radius;
    }
    
    // Obtener posición actual
    getPosition() {
        return this.position;
    }
} 