# Decisiones UI

## Menu clinico horizontal

- La shell principal usa un menu inferior horizontal tipo tubo, inspirado en paneles medicos curvos y en el efecto de galeria 3D con scroll horizontal.
- El menu se controla por arrastre, rueda del raton y flechas laterales. El elemento central es el destino activo o el siguiente destino seleccionado.
- El area de contenido debe reservar siempre la altura del menu inferior para evitar que paneles, botones o texto queden debajo de la navegacion.
- Las acciones secundarias se concentran en el menu inferior; la barra superior queda para identidad, estado y contexto breve.

## Criterio de solapamiento

- Cada escena que use `FundaShell.build()` debe maquetar sus paneles dentro del rectangulo devuelto por la shell.
- Los botones de accion de una escena deben quedar dentro del area de contenido o en el menu inferior, nunca encima de paneles de evidencias, ejercicios o estado.
