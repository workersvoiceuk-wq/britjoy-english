# Modo IA · servidor del tutor Britjoy (Supabase)

`functions/britjoy-tutor/index.ts` es el intermediario seguro entre la app y la API de Claude.
La clave de la API **solo** vive aquí, como secreto de Supabase (`ANTHROPIC_API_KEY`);
nunca va dentro de la web ni de las apps.

- Modelo: `claude-opus-5-5` con esfuerzo bajo (respuestas rápidas y cortas). Si el modelo
  declina una petición, el API la reintenta con un modelo de reserva (`fallbacks: "default"`).
- Solo acepta peticiones de la web (GitHub Pages) y de las apps (Capacitor).
- Límite de 8 mensajes por minuto por usuario, mensajes de 1.200 caracteres como máximo
  y 20 turnos de historial.
- El texto del sistema es fijo para aprovechar la caché de prompts.

## Ponerlo en marcha (una vez)

1. Crea una clave de API en https://console.anthropic.com/ (Settings → API keys) y fija un
   límite de gasto mensual en Billing.
2. Crea un proyecto en https://supabase.com/dashboard (por ejemplo `britjoy-english-ai`, región Londres).
3. En el proyecto: **Edge Functions → Secrets** → añade `ANTHROPIC_API_KEY` con tu clave.
4. Despliega la función (o pídeselo a Claude con permiso para usar tu cuenta de Supabase):
   ```sh
   npx supabase functions deploy britjoy-tutor --project-ref <REF_DEL_PROYECTO>
   ```
5. Copia en GitHub (repositorio britjoy-english → Settings → Secrets and variables → Actions →
   **Variables**) dos variables **no secretas**:
   - `VITE_AI_ENDPOINT` = `https://<REF_DEL_PROYECTO>.supabase.co/functions/v1/britjoy-tutor`
   - `VITE_SUPABASE_ANON_KEY` = la clave pública «anon» del proyecto (está pensada para ir en la app).
   La próxima publicación de la web y de las apps activará el Modo IA.
