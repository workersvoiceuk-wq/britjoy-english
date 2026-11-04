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

**En la app**, Britjoy no usa vídeos grabados. `src/lib/britjoyRig.ts` reproduce **el mismo esqueleto** en el navegador
con WebGL: los mismos huesos, las mismas zonas de cada hueso y los mismos fotogramas clave, con transiciones suaves.
Así se mueve con fluidez a la velocidad de la pantalla y solo descarga la imagen original (65 KB). Si cambias el
movimiento en Blender, copia los mismos ángulos en `LOOPS` de ese archivo; `tests/britjoyRig.test.ts` comprueba que
celebrar levanta la pata, que el reposo es sutil y que los ciclos empalman.

Si el móvil pide reducir el movimiento o no tiene WebGL, se muestra la imagen fija.
