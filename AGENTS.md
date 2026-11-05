# Instrucciones para agentes

## Enfoque Antigravity

Cuando el usuario pida trabajar con Antigravity, actua con autonomia controlada: identifica primero los archivos y flujos que gobiernan el comportamiento, y no realices ningun cambio si hay más de 3 archivos implicados; en ese caso planifica y propón la estrategia del cambio. Si hay dos o menos archivos si puedes proceder con las modificaciones.

## Contexto del proyecto

- Es un sitio estatico HTML/CSS/JavaScript publicado en GitHub Pages; no requiere Jekyll ni un proceso de compilacion.
- La estructura principal es `index.html`, `css/estilos.css`, `js/app.js` y `data/contenido.json`. Hay una página secundaria en similador-test-tic-madrid con su propia estructura.
- El contenido visible de la pagina se mantiene principalmente en `data/contenido.json`; la logica de renderizado esta en `js/app.js`.
- Para el simulador de test la estructura es similar:
    - simulador-test-tic-madrid/index.html con las fichas de cada tipo de test.
    - simulador-test-tic-madrid/examen.html con el motor de test.
    - simulador-test-tic-madrid/css/styles.css para los estilos
    - simulador-test-tic-madrid/js/app.js para el motor javascript de test
    - simulador-test-tic-madrid/js/data-*.js para el contenido de cada test. 
    - simulador-test-tic-madrid/js/exam-registry.js con el catalogo de todos los test. 
- Conserva la identidad visual y las pautas de accesibilidad descritas en [README.md](README.md) y accesibilidad.html.

## Forma de trabajar

- Antes de editar, revisa el README y el archivo o simbolo directamente relacionado con la peticion.
- Mantén los cambios pequenos y compatibles con HTML, CSS y JavaScript sin dependencias de build.
- Para cambios de contenido, edita el JSON y comprueba que sigue siendo JSON valido.
- Para cambios de interfaz, verifica escritorio y movil, navegacion por teclado, foco visible, semantica y contraste.
- No edites `js/siteanalyze_6277594.js`: es un recurso generado de analitica de terceros.
- No introduzcas dependencias o herramientas de compilacion sin una necesidad explicita.
- Antes de consolidar los cambios, asegurate de cumplir la declaracion de accesibilidad. 
- Antes de consolidar los cambios valida sintaxis JSON, revisa errores de consola y abre la pagina con un servidor estatico local cuando el cambio afecte al comportamiento en navegador. Simula algunos test para comprobar la nevgación y que las páginas no contienen errores javascript.


## Convenciones de cambios

- Respeta el idioma espanol y la terminologia institucional existente.
- Usa rutas relativas para recursos locales y conserva `target="_blank"` junto con `rel="noopener noreferrer"` en enlaces externos que ya sigan ese patron.
- Evita reescrituras de formato o refactors no relacionados.