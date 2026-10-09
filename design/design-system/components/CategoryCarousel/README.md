# CategoryCarousel

Una sola fila infinita de categorías (foto redonda y nombre) que avanza sola, se detiene al pasar el mouse o al enfocar, tiene "Pausar el carrusel", flechas con tooltip ("Ver categorías anteriores", "Ver más categorías") y se desliza con el dedo.

## Qué aporta quien lo usa

`categories` (`{name, image, href, active}`), `title` ("Explora por categoría" por defecto), `paused` para empezar quieto.

## Reglas

- Avanza a unos 3 s por categoría; con "reducir movimiento" no se mueve solo y queda como fila desplazable.
- Al tocar o usar una flecha deja de moverse solo y pasa a desplazamiento manual, que sigue siendo infinito.
- La copia que hace el bucle es invisible para lectores de pantalla y no recibe foco.
- Es el mismo carrusel en el catálogo y en cada página de categoría (allí marca la actual).
