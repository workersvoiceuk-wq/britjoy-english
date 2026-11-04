# Banner de Britjoy English (Blender)

Banners para poner la app en vozunidamundo.com:

| Archivo | Uso |
|---|---|
| `britjoy-banner-web-1920x800.jpg` / `.png` | Cabecera o sección ancha en ordenador |
| `britjoy-banner-movil-1080x1350.jpg` / `.png` | Móvil y redes (formato 4:5) |

## Cómo se hacen

1. **Escena 3D en Blender** (`escena_banner.py`, Blender 5.x / `bpy`, motor Cycles).
   El león es el **avatar oficial** del dueño (`approved-britjoy-lion.png`,
   del repositorio `lumi-uk-beta`, `animation/comun/avatares/`). Se coloca
   como lámina con transparencia sobre un podio. No se redibuja y se ilumina
   con emisión y gestión de color «Standard» para conservar sus colores
   exactos. A su alrededor flotan los bloques A1–C2 en los colores de cada
   nivel, con Nunito Black.
2. **Texto encima** (`componer.cjs`, Playwright): titular, subtítulo, botón
   y cierre de marca («Voz Unida Mundo Academy · te enseña», «Tu voz cuenta»)
   en Nunito.

```sh
# Requisitos: pip install bpy==5.2.2 fonttools; Playwright con Chromium.
fonttools varLib.instancer Nunito[wght].ttf wght=900 -o Nunito-Black.ttf
python escena_banner.py --avatar approved-britjoy-lion.png --fuente Nunito-Black.ttf \
  --salida escena-ancho.png --ancho 1920 --alto 800 --muestras 128
python escena_banner.py --avatar approved-britjoy-lion.png --fuente Nunito-Black.ttf \
  --formato cuadrado --salida escena-movil.png --ancho 1080 --alto 1350 --muestras 128 \
  --blend britjoy-banner-movil.blend   # opcional: guarda la escena editable
node componer.cjs escena-ancho.png escena-movil.png "Nunito[wght].ttf" .
```

El avatar oficial no se guarda en este repositorio, que es público. Se pasa
con `--avatar`.
