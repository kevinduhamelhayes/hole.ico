# Hole.io Web

Una implementación web del popular juego Hole.io utilizando Three.js para la renderización 3D y Ammo.js para la física.

![Hole.io Web Screenshot](screenshots/game.jpg)

## Descripción

Hole.io Web es un juego donde controlas un agujero negro que absorbe objetos de la ciudad. A medida que absorbes objetos, el agujero crece, permitiéndote absorber estructuras más grandes. El objetivo es conseguir la mayor puntuación antes de que se acabe el tiempo o absorber todos los objetos del nivel.

## Características

- Renderizado 3D con Three.js
- Física realista con Ammo.js
- Diferentes tipos de objetos: edificios, coches, árboles, farolas, bancos, etc.
- Sistema de niveles progresivos
- Efectos visuales para el agujero (vórtice, partículas)
- Controles táctiles para dispositivos móviles
- Sistema de audio con música y efectos de sonido
- Interfaz de usuario interactiva

## Requisitos

- Navegador web moderno con soporte para WebGL
- Conexión a Internet (solo para la carga inicial)

## Instalación

1. Clona este repositorio:
```
git clone https://github.com/tu-usuario/web-hole-io.git
```

2. Navega al directorio del proyecto:
```
cd web-hole-io
```

3. Puedes servir el juego utilizando cualquier servidor web. Una opción simple es usar Python:

```
# Python 3
python -m http.server

# Python 2
python -m SimpleHTTPServer
```

4. Abre tu navegador y ve a `http://localhost:8000`

## Cómo jugar

- Usa las teclas WASD o las flechas del teclado para mover el agujero.
- En dispositivos móviles, utiliza el joystick en pantalla.
- Absorbe objetos pasando sobre ellos con tu agujero.
- Recoge los coleccionables para conseguir puntos adicionales.
- Intenta absorber todos los objetos antes de que se acabe el tiempo.

## Estructura del proyecto

```
web-hole-io/
├── index.html          # Archivo HTML principal
├── css/                # Estilos CSS
│   └── style.css       # Estilos del juego
├── js/                 # Código JavaScript
│   ├── game.js         # Clase principal del juego
│   ├── hole.js         # Clase del agujero (jugador)
│   ├── objects.js      # Definición de los objetos del juego
│   ├── components/     # Componentes reutilizables
│   │   └── ...
│   ├── effects/        # Efectos visuales
│   │   └── ...
│   ├── managers/       # Gestores del juego
│   │   ├── AudioManager.js
│   │   ├── CameraManager.js
│   │   ├── ObjectManager.js
│   │   └── UIManager.js
│   └── physics/        # Motor de física
│       └── PhysicsEngine.js
├── assets/             # Recursos del juego
│   ├── audio/          # Archivos de audio
│   │   ├── music/      # Música de fondo
│   │   └── sfx/        # Efectos de sonido
│   └── textures/       # Texturas
└── screenshots/        # Capturas de pantalla del juego
```

## Desarrollo futuro

- Modo multijugador
- Más tipos de objetos
- Mejoras de rendimiento
- Personalización del agujero (colores, efectos)
- Tablas de clasificación

## Créditos

Este juego es una adaptación del popular Hole.io para navegadores web, desarrollado con tecnologías web modernas.

## Licencia

[MIT License](LICENSE) 