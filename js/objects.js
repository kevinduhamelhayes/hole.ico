// Clase base para objetos
class GameObject {
    constructor(scene, x, z, width, height, depth, color) {
        this.scene = scene;
        this.position = new THREE.Vector3(x, height / 2, z);
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.color = color;
        this.falling = false;
        this.fallSpeed = 0;
        this.value = Math.ceil(width * height * depth / 5); // Valor basado en el tamaño
        
        // Crear malla
        this.createMesh();
    }
    
    createMesh() {
        // Implementado por subclases
    }
    
    update() {
        if (this.falling) {
            // Aumentar velocidad de caída (gravedad)
            this.fallSpeed += 0.01;
            
            // Mover hacia abajo
            this.mesh.position.y -= this.fallSpeed;
            
            // Añadir rotación mientras cae
            this.mesh.rotation.x += 0.02;
            this.mesh.rotation.z += 0.02;
            
            // Comprobar si ha caído fuera de la escena
            if (this.mesh.position.y < -20) {
                this.scene.remove(this.mesh);
                return true; // Indicar que debe ser eliminado
            }
        }
        
        return false;
    }
    
    checkCollision(hole) {
        if (this.falling) {
            // Si ya está cayendo, comprobar si ha caído lo suficiente para ser absorbido
            if (this.mesh.position.y < -5) {
                return true; // Ha sido absorbido
            }
            return false;
        }
        
        const holePos = hole.getPosition();
        const holeRadius = hole.getRadius();
        
        // Calcular distancia entre el centro del objeto y el centro del agujero
        const dx = this.mesh.position.x - holePos.x;
        const dz = this.mesh.position.z - holePos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Calcular el radio efectivo del objeto (aproximación)
        const objectRadius = Math.max(this.width, this.depth) / 2;
        
        // Si el objeto está completamente dentro del agujero
        if (distance + objectRadius < holeRadius) {
            this.startFalling();
            return false; // No eliminar todavía, esperar a que caiga
        }
        
        return false;
    }
    
    startFalling() {
        if (!this.falling) {
            this.falling = true;
            this.fallSpeed = 0.05;
            
            // Añadir efecto de caída
            this.addFallEffect();
        }
    }
    
    addFallEffect() {
        // Crear partículas de polvo
        const particleCount = 10;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            // Posiciones aleatorias alrededor del objeto
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.max(this.width, this.depth) * 0.6;
            
            particlePositions[i * 3] = this.mesh.position.x + Math.cos(angle) * radius;
            particlePositions[i * 3 + 1] = this.mesh.position.y - this.height / 2;
            particlePositions[i * 3 + 2] = this.mesh.position.z + Math.sin(angle) * radius;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 0.2,
            transparent: true,
            opacity: 0.8
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
        
        // Animar y eliminar partículas
        const startTime = Date.now();
        const duration = 1000; // 1 segundo
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Mover partículas hacia arriba y afuera
            const positions = particles.geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += (Math.random() - 0.5) * 0.1;
                positions[i * 3 + 1] += 0.05;
                positions[i * 3 + 2] += (Math.random() - 0.5) * 0.1;
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
            
            // Desvanecer
            particleMaterial.opacity = 0.8 * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(particles);
                particleGeometry.dispose();
                particleMaterial.dispose();
            }
        };
        
        animate();
    }
    
    getValue() {
        return this.value;
    }
}

// Clase para edificios
class Building extends GameObject {
    constructor(scene, x, z) {
        // Tamaño aleatorio
        const width = 1 + Math.random() * 2;
        const height = 3 + Math.random() * 7;
        const depth = 1 + Math.random() * 2;
        
        // Color aleatorio (tonos grises)
        const color = new THREE.Color(
            0.4 + Math.random() * 0.2,
            0.4 + Math.random() * 0.2,
            0.4 + Math.random() * 0.2
        );
        
        super(scene, x, z, width, height, depth, color);
        
        // Valor basado en el tamaño (edificios más grandes valen más)
        this.value = Math.ceil(width * height * depth / 3);
    }
    
    createMesh() {
        // Crear geometría del edificio
        const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        
        // Crear textura procedural para las ventanas
        const texture = this.createBuildingTexture();
        
        // Material con textura
        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            map: texture,
            roughness: 0.7,
            metalness: 0.2
        });
        
        // Crear malla
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Añadir a la escena
        this.scene.add(this.mesh);
    }
    
    createBuildingTexture() {
        // Crear canvas para la textura
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Fondo del edificio
        ctx.fillStyle = `rgb(
            ${Math.floor(this.color.r * 255)},
            ${Math.floor(this.color.g * 255)},
            ${Math.floor(this.color.b * 255)}
        )`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar ventanas
        const windowSize = 10;
        const windowSpacing = 20;
        const windowRows = Math.floor(canvas.height / windowSpacing);
        const windowCols = Math.floor(canvas.width / windowSpacing);
        
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
                // Algunas ventanas iluminadas, otras no
                const lit = Math.random() > 0.3;
                ctx.fillStyle = lit ? 'rgba(255, 255, 200, 0.9)' : 'rgba(50, 50, 80, 0.8)';
                
                ctx.fillRect(
                    col * windowSpacing + (windowSpacing - windowSize) / 2,
                    row * windowSpacing + (windowSpacing - windowSize) / 2,
                    windowSize,
                    windowSize
                );
            }
        }
        
        // Crear textura desde el canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(this.width, this.height / 2);
        
        return texture;
    }
}

// Clase para coches
class Car extends GameObject {
    constructor(scene, x, z) {
        // Tamaño estándar de coche
        const width = 1.0;
        const height = 0.5;
        const depth = 2.0;
        
        // Color aleatorio
        const colors = [
            0xff0000, // rojo
            0x0000ff, // azul
            0x00ff00, // verde
            0xffff00, // amarillo
            0xff00ff, // magenta
            0x00ffff, // cian
            0xffffff, // blanco
            0x000000  // negro
        ];
        const color = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
        
        super(scene, x, z, width, height, depth, color);
        
        // Valor del coche
        this.value = 5;
    }
    
    createMesh() {
        // Crear grupo para el coche
        this.mesh = new THREE.Group();
        this.mesh.position.copy(this.position);
        
        // Carrocería principal
        const bodyGeometry = new THREE.BoxGeometry(this.width, this.height * 0.7, this.depth);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: this.color,
            roughness: 0.2,
            metalness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0;
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);
        
        // Techo
        const roofGeometry = new THREE.BoxGeometry(this.width * 0.8, this.height * 0.5, this.depth * 0.6);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: this.color,
            roughness: 0.2,
            metalness: 0.8
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = this.height * 0.6;
        roof.position.z = -this.depth * 0.1;
        roof.castShadow = true;
        this.mesh.add(roof);
        
        // Ruedas
        const wheelGeometry = new THREE.CylinderGeometry(this.height * 0.3, this.height * 0.3, this.width * 0.2, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Rueda delantera izquierda
        const wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheelFL.rotation.z = Math.PI / 2;
        wheelFL.position.set(this.width * 0.6, -this.height * 0.3, this.depth * 0.3);
        wheelFL.castShadow = true;
        this.mesh.add(wheelFL);
        
        // Rueda delantera derecha
        const wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheelFR.rotation.z = Math.PI / 2;
        wheelFR.position.set(-this.width * 0.6, -this.height * 0.3, this.depth * 0.3);
        wheelFR.castShadow = true;
        this.mesh.add(wheelFR);
        
        // Rueda trasera izquierda
        const wheelBL = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheelBL.rotation.z = Math.PI / 2;
        wheelBL.position.set(this.width * 0.6, -this.height * 0.3, -this.depth * 0.3);
        wheelBL.castShadow = true;
        this.mesh.add(wheelBL);
        
        // Rueda trasera derecha
        const wheelBR = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheelBR.rotation.z = Math.PI / 2;
        wheelBR.position.set(-this.width * 0.6, -this.height * 0.3, -this.depth * 0.3);
        wheelBR.castShadow = true;
        this.mesh.add(wheelBR);
        
        // Luces delanteras
        const headlightGeometry = new THREE.BoxGeometry(this.width * 0.2, this.height * 0.2, this.depth * 0.05);
        const headlightMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffcc,
            emissive: 0xffffcc,
            emissiveIntensity: 0.5
        });
        
        // Luz izquierda
        const headlightL = new THREE.Mesh(headlightGeometry, headlightMaterial);
        headlightL.position.set(this.width * 0.3, 0, this.depth * 0.5);
        this.mesh.add(headlightL);
        
        // Luz derecha
        const headlightR = new THREE.Mesh(headlightGeometry, headlightMaterial);
        headlightR.position.set(-this.width * 0.3, 0, this.depth * 0.5);
        this.mesh.add(headlightR);
        
        // Luces traseras
        const taillightGeometry = new THREE.BoxGeometry(this.width * 0.2, this.height * 0.2, this.depth * 0.05);
        const taillightMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        
        // Luz trasera izquierda
        const taillightL = new THREE.Mesh(taillightGeometry, taillightMaterial);
        taillightL.position.set(this.width * 0.3, 0, -this.depth * 0.5);
        this.mesh.add(taillightL);
        
        // Luz trasera derecha
        const taillightR = new THREE.Mesh(taillightGeometry, taillightMaterial);
        taillightR.position.set(-this.width * 0.3, 0, -this.depth * 0.5);
        this.mesh.add(taillightR);
        
        // Añadir a la escena
        this.scene.add(this.mesh);
    }
    
    checkCollision(hole) {
        if (this.falling) {
            // Si ya está cayendo, comprobar si ha caído lo suficiente para ser absorbido
            if (this.mesh.position.y < -5) {
                return true; // Ha sido absorbido
            }
            return false;
        }
        
        const holePos = hole.getPosition();
        const holeRadius = hole.getRadius();
        
        // Calcular distancia entre el centro del coche y el centro del agujero
        const dx = this.mesh.position.x - holePos.x;
        const dz = this.mesh.position.z - holePos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Calcular el radio efectivo del coche (aproximación)
        const carRadius = Math.max(this.width, this.depth) / 2;
        
        // Si el coche está completamente dentro del agujero
        if (distance + carRadius < holeRadius) {
            this.startFalling();
            return false; // No eliminar todavía, esperar a que caiga
        }
        
        return false;
    }
}

// Clase para árboles
class Tree extends GameObject {
    constructor(scene, x, z) {
        // Tamaño del árbol
        const width = 0.5;
        const height = 3 + Math.random() * 2;
        const depth = 0.5;
        
        // Color del tronco
        const color = new THREE.Color(0x8B4513); // Marrón
        
        super(scene, x, z, width, height, depth, color);
        
        // Valor del árbol
        this.value = 3;
    }
    
    createMesh() {
        // Crear grupo para el árbol
        this.mesh = new THREE.Group();
        this.mesh.position.copy(this.position);
        
        // Tronco
        const trunkGeometry = new THREE.CylinderGeometry(this.width * 0.3, this.width * 0.4, this.height * 0.6, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: this.color,
            roughness: 0.9,
            metalness: 0.1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = -this.height * 0.2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        this.mesh.add(trunk);
        
        // Copa del árbol (varias capas)
        const leavesColor = new THREE.Color(0x2E8B57); // Verde oscuro
        
        for (let i = 0; i < 3; i++) {
            const coneSize = 1.5 - i * 0.3;
            const coneHeight = this.height * 0.4;
            const coneGeometry = new THREE.ConeGeometry(coneSize, coneHeight, 8);
            const coneMaterial = new THREE.MeshStandardMaterial({
                color: leavesColor,
                roughness: 0.8,
                metalness: 0.1
            });
            const cone = new THREE.Mesh(coneGeometry, coneMaterial);
            cone.position.y = this.height * 0.1 + i * coneHeight * 0.7;
            cone.castShadow = true;
            this.mesh.add(cone);
        }
        
        // Añadir a la escena
        this.scene.add(this.mesh);
    }
    
    checkCollision(hole) {
        if (this.falling) {
            // Si ya está cayendo, comprobar si ha caído lo suficiente para ser absorbido
            if (this.mesh.position.y < -5) {
                return true; // Ha sido absorbido
            }
            return false;
        }
        
        const holePos = hole.getPosition();
        const holeRadius = hole.getRadius();
        
        // Calcular distancia entre el centro del árbol y el centro del agujero
        const dx = this.mesh.position.x - holePos.x;
        const dz = this.mesh.position.z - holePos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Radio del tronco
        const treeRadius = this.width * 0.4;
        
        // Si el árbol está completamente dentro del agujero
        if (distance + treeRadius < holeRadius) {
            this.startFalling();
            return false; // No eliminar todavía, esperar a que caiga
        }
        
        return false;
    }
}

// Clase para farolas
class Lamppost extends GameObject {
    constructor(scene, x, z) {
        // Tamaño de la farola
        const width = 0.2;
        const height = 4;
        const depth = 0.2;
        
        // Color de la farola
        const color = new THREE.Color(0x333333); // Gris oscuro
        
        super(scene, x, z, width, height, depth, color);
        
        // Valor de la farola
        this.value = 2;
    }
    
    createMesh() {
        // Crear grupo para la farola
        this.mesh = new THREE.Group();
        this.mesh.position.copy(this.position);
        
        // Poste
        const poleGeometry = new THREE.CylinderGeometry(this.width * 0.5, this.width * 0.6, this.height, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: this.color,
            roughness: 0.7,
            metalness: 0.3
        });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.castShadow = true;
        pole.receiveShadow = true;
        this.mesh.add(pole);
        
        // Brazo
        const armGeometry = new THREE.BoxGeometry(this.width * 0.4, this.width * 0.4, this.height * 0.3);
        const arm = new THREE.Mesh(armGeometry, poleMaterial);
        arm.position.set(0, this.height * 0.4, this.height * 0.15);
        arm.castShadow = true;
        this.mesh.add(arm);
        
        // Lámpara
        const lampGeometry = new THREE.SphereGeometry(this.width * 1.2, 16, 16);
        const lampMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffcc,
            emissive: 0xffffcc,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.9
        });
        const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
        lamp.position.set(0, this.height * 0.4, this.height * 0.3);
        lamp.castShadow = true;
        this.mesh.add(lamp);
        
        // Luz
        const light = new THREE.PointLight(0xffffcc, 0.8, 10);
        light.position.copy(lamp.position);
        this.mesh.add(light);
        
        // Añadir a la escena
        this.scene.add(this.mesh);
    }
    
    checkCollision(hole) {
        if (this.falling) {
            // Si ya está cayendo, comprobar si ha caído lo suficiente para ser absorbido
            if (this.mesh.position.y < -5) {
                return true; // Ha sido absorbido
            }
            return false;
        }
        
        const holePos = hole.getPosition();
        const holeRadius = hole.getRadius();
        
        // Calcular distancia entre el centro de la farola y el centro del agujero
        const dx = this.mesh.position.x - holePos.x;
        const dz = this.mesh.position.z - holePos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Radio del poste
        const postRadius = this.width * 0.6;
        
        // Si la farola está completamente dentro del agujero
        if (distance + postRadius < holeRadius) {
            this.startFalling();
            return false; // No eliminar todavía, esperar a que caiga
        }
        
        return false;
    }
}

// Clase para bancos
class Bench extends GameObject {
    constructor(scene, x, z) {
        // Tamaño del banco
        const width = 0.6;
        const height = 0.5;
        const depth = 1.5;
        
        // Color del banco
        const color = new THREE.Color(0x8B4513); // Marrón
        
        super(scene, x, z, width, height, depth, color);
        
        // Valor del banco
        this.value = 1;
    }
    
    createMesh() {
        // Crear grupo para el banco
        this.mesh = new THREE.Group();
        this.mesh.position.copy(this.position);
        
        // Base del banco
        const baseGeometry = new THREE.BoxGeometry(this.width, this.height * 0.3, this.depth);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: this.color,
            roughness: 0.8,
            metalness: 0.2
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -this.height * 0.35;
        base.castShadow = true;
        base.receiveShadow = true;
        this.mesh.add(base);
        
        // Respaldo
        const backGeometry = new THREE.BoxGeometry(this.width, this.height * 0.7, this.width * 0.3);
        const back = new THREE.Mesh(backGeometry, baseMaterial);
        back.position.set(0, 0, -this.depth * 0.4);
        back.castShadow = true;
        back.receiveShadow = true;
        this.mesh.add(back);
        
        // Patas (4)
        const legGeometry = new THREE.BoxGeometry(this.width * 0.1, this.height * 0.3, this.width * 0.1);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.5
        });
        
        // Posiciones de las patas
        const legPositions = [
            [this.width * 0.4, -this.height * 0.5, this.depth * 0.4],
            [-this.width * 0.4, -this.height * 0.5, this.depth * 0.4],
            [this.width * 0.4, -this.height * 0.5, -this.depth * 0.4],
            [-this.width * 0.4, -this.height * 0.5, -this.depth * 0.4]
        ];
        
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(...pos);
            leg.castShadow = true;
            leg.receiveShadow = true;
            this.mesh.add(leg);
        });
        
        // Añadir a la escena
        this.scene.add(this.mesh);
    }
    
    checkCollision(hole) {
        if (this.falling) {
            // Si ya está cayendo, comprobar si ha caído lo suficiente para ser absorbido
            if (this.mesh.position.y < -5) {
                return true; // Ha sido absorbido
            }
            return false;
        }
        
        const holePos = hole.getPosition();
        const holeRadius = hole.getRadius();
        
        // Calcular distancia entre el centro del banco y el centro del agujero
        const dx = this.mesh.position.x - holePos.x;
        const dz = this.mesh.position.z - holePos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Radio aproximado del banco
        const benchRadius = Math.max(this.width, this.depth) / 2;
        
        // Si el banco está completamente dentro del agujero
        if (distance + benchRadius < holeRadius) {
            this.startFalling();
            return false; // No eliminar todavía, esperar a que caiga
        }
        
        return false;
    }
} 