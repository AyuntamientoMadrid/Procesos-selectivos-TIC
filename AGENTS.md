# Instrucciones para agentes

## Enfoque Antigravity

Cuando el usuario pida trabajar con Antigravity, actua con autonomia controlada: identifica primero el archivo y flujo que gobiernan el comportamiento, realiza el cambio mas pequeno que pueda probarse y valida el resultado antes de ampliar el alcance. Explica las suposiciones relevantes y deja claro cualquier bloqueo.

## Contexto del proyecto

- Es un sitio estatico HTML/CSS/JavaScript publicado en GitHub Pages; no requiere Jekyll ni un proceso de compilacion.
- La estructura principal es `index.html`, `css/estilos.css`, `js/app.js` y `data/contenido.json`.
- El contenido visible de la pagina se mantiene principalmente en `data/contenido.json`; la logica de renderizado esta en `js/app.js`.
- Conserva la identidad visual y las pautas de accesibilidad descritas en [README.md](README.md).

## Forma de trabajar

- Antes de editar, revisa el README y el archivo o simbolo directamente relacionado con la peticion.
- Mantén los cambios pequenos y compatibles con HTML, CSS y JavaScript sin dependencias de build.
- Para cambios de contenido, edita el JSON y comprueba que sigue siendo JSON valido.
- Para cambios de interfaz, verifica escritorio y movil, navegacion por teclado, foco visible, semantica y contraste.
- No edites `js/siteanalyze_6277594.js`: es un recurso generado de analitica de terceros.
- No introduzcas dependencias o herramientas de compilacion sin una necesidad explicita.
- No hay una suite de pruebas configurada. Como minimo, valida sintaxis JSON, revisa errores de consola y abre la pagina con un servidor estatico local cuando el cambio afecte al comportamiento en navegador.

## Convenciones de cambios

- Respeta el idioma espanol y la terminologia institucional existente.
- Usa rutas relativas para recursos locales y conserva `target="_blank"` junto con `rel="noopener noreferrer"` en enlaces externos que ya sigan ese patron.
- Evita reescrituras de formato o refactors no relacionados.