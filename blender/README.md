# Britjoy en Blender

`britjoy_rig.py` anima a Britjoy en Blender. La imagen oficial del avatar (`avatar.png`) se pone sobre una
malla plana. Un esqueleto con cuerpo, cabeza, brazo y pata la deforma. La imagen **no se redibuja ni cambia de
color**: el material no recibe luz y el render usa la transformación «Standard», así que los colores son los
originales.

Genera tres bucles con fondo transparente:
- **idle** (reposo): respira y mueve un poco la cabeza y el brazo.
- **talk** (hablar).
- **celebrate** (celebrar): saluda levantando la pata.

```sh
python -m venv bpyenv && bpyenv/bin/pip install bpy==5.2.2
bpyenv/bin/python blender/britjoy_rig.py -- /ruta/salida            # los tres bucles
bpyenv/bin/python blender/britjoy_rig.py -- /ruta/salida celebrate  # solo uno
```

Los fotogramas (PNG de 520 px, a 24 fps) se convierten en WebP animado de 330×300 a 12 fps, recortados
todos con el mismo encuadre (17, 41, 467, 450). Se guardan en `src/assets/britjoy3d/`. La app muestra
primero `britjoy-still.webp` y carga los bucles después. No los carga si el móvil pide reducir movimiento
o ahorrar datos.
