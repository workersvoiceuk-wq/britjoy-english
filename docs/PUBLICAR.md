# Probar y publicar Britjoy English en Android y iPhone

Esta guía es para el dueño de la app. Hay pasos que solo puedes hacer tú: crear las
cuentas de desarrollador, guardar las claves como secretos y enviar la app a revisión.
**Nunca subas claves, contraseñas ni certificados al repositorio.**

## 1. Probar en tu móvil (gratis, sin cuentas de tienda)

Cada vez que se sube un cambio, GitHub compila y prueba la app en
**Actions → «Britjoy English — tests, Android & iOS»**:

- **web**: tests y una partida completa simulada en el navegador.
- **android**: crea el APK, lo instala en un emulador y hace una captura (`android-emulator-screenshot`).
- **ios**: compila para el simulador de iPhone, la abre y hace una captura (`ios-simulator-screenshot`).

**Android:** abre la ejecución, descarga `britjoy-english-android`, descomprímelo y
abre `app-debug.apk` en el móvil (permite «instalar apps desconocidas»).

**iPhone:** Apple no deja instalar apps sin firmar. Para probar en un iPhone real
necesitas la cuenta de desarrollador (paso 3) y TestFlight.

## 2. Google Play (cuenta de desarrollador: pago único de 25 USD)

1. Crea la cuenta en https://play.google.com/console y completa la verificación de identidad.
2. **Crea tu clave de firma** (una sola vez, en tu ordenador; guárdala en un sitio seguro, si la pierdes no podrás actualizar la app):
   ```sh
   keytool -genkeypair -v -keystore britjoy-release.keystore -alias britjoy \
     -keyalg RSA -keysize 2048 -validity 10000
   base64 -w0 britjoy-release.keystore > keystore.base64.txt   # en Mac: base64 -i britjoy-release.keystore
   ```
3. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**:
   - `ANDROID_KEYSTORE_BASE64`: el contenido de `keystore.base64.txt`
   - `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (p. ej. `britjoy`), `ANDROID_KEY_PASSWORD`
4. En GitHub: **Actions → «Britjoy English — store release» → Run workflow** con `build_number` = 1
   (súbelo en cada versión nueva: 2, 3…). Descarga `britjoy-english-android-release-aab`.
5. En Play Console: **Crear app** → nombre «Britjoy English», idioma español, app gratuita.
   Rellena la ficha con `store/ficha-tienda.md`, las imágenes de `store/` y la política de privacidad.
6. Sube el `.aab` primero a **Pruebas internas** (Internal testing), pruébalo con tu cuenta y,
   cuando todo esté bien, promuévelo a **Producción**. Las cuentas personales nuevas
   pueden tener que pasar antes por una prueba cerrada con varios testers: Play Console te lo indicará.

## 3. App Store (Apple Developer Program: 99 USD al año)

1. Inscríbete en https://developer.apple.com/programs/ .
2. En **App Store Connect → Apps → +**: nueva app iOS, nombre «Britjoy English»,
   Bundle ID `com.workersvoiceuk.britjoyenglish` (regístralo antes en
   **Certificates, Identifiers & Profiles → Identifiers** si no aparece).
3. Crea una **clave de API**: App Store Connect → **Users and Access → Integrations →
   App Store Connect API** → nueva clave con rol **App Manager**. Descarga el `.p8` (solo se puede una vez).
4. En GitHub, crea estos secretos:
   - `APPLE_TEAM_ID` (Membership → Team ID)
   - `ASC_KEY_ID`, `ASC_ISSUER_ID` (de la página de la clave)
   - `ASC_KEY_P8` (el contenido completo del archivo `.p8`)
5. Ejecuta **«Britjoy English — store release»** marcando `upload_testflight`.
   La firma es automática (gestionada por Apple con la clave de API).
6. En App Store Connect → **TestFlight**, instala la build en tu iPhone con la app TestFlight y pruébala.
7. Rellena la ficha (textos de `store/ficha-tienda.md`, capturas de `store/screenshots/ios/`,
   privacidad: «Data Not Collected») y pulsa **Enviar a revisión**.

## 4. Antes de enviar a revisión

- [ ] Probar en un Android y un iPhone reales: voz de Britjoy, sonidos, vídeos y una lección completa.
- [ ] Revisar con una persona experta el contenido de C1/C2 y de «Vivir en UK» (las normas cambian).
- [ ] Confirmar que la política de privacidad abre: https://workersvoiceuk-wq.github.io/britjoy-english/privacidad.html
- [ ] Subir `build_number` en cada nueva versión.

## Lo que este repositorio NO hace

No publica nada por sí solo, no guarda credenciales y no tiene pagos ni anuncios.
Enviar la app a revisión y publicarla lo haces tú desde las consolas de Google y Apple.
