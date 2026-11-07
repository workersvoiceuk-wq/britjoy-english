// «Inglés para el día a día»: estado de acceso y contenido de los módulos de pago (02–12). Exige sesión (verify_jwt)
// y decide SOLO con la fila de course_access que escribe el webhook tras eventos firmados de Stripe.
// El contenido de pago NO está en este repositorio ni en la web: vive en el bucket PRIVADO de Supabase Storage
// «vida-diaria-premium» (lo sube el dueño con el paquete privado) y solo esta función lo lee, con service role.
//   POST { action: "status" }                                  → AccessStatus
//   POST { action: "module", module: "02-…" }                  → { module } | 402 | 404
//   POST { action: "media", module, kind: video|es|en, source } → MP4 / VTT | 402 | 404
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { admin, cors, currentUser, json, preflight } from "../_shared/http.ts";
import { VD_PRODUCT, accessStatus, decideModule, type CourseAccessRow } from "../_shared/vida-diaria.ts";

const BUCKET = "vida-diaria-premium";

Deno.serve(async (req: Request) => {
  const headers = { ...cors(req.headers.get("origin")), "Cache-Control": "private, no-store" };
  const early = preflight(req, headers);
  if (early) return early;
  const user = await currentUser(req);
  if (!user) return json({ error: "sign_in" }, 401, headers);

  const body = (await req.json().catch(() => ({}))) as { action?: unknown; module?: unknown; kind?: unknown; source?: unknown };
  const db = admin();
  const { data } = await db.from("course_access").select("*").eq("user_id", user.id).eq("product", VD_PRODUCT).maybeSingle();
  const row = (data as CourseAccessRow | null) ?? null;
  if (body.action === "status") return json(accessStatus(row), 200, headers);

  if (body.action !== "module" && body.action !== "media") return json({ error: "invalid_action" }, 400, headers);
  const decision = decideModule(body.module, row);
  if (decision === "unknown_module") return json({ error: decision }, 404, headers);
  if (decision === "payment_required") return json({ error: decision, status: accessStatus(row) }, 402, headers);
  if (decision === "sample") return json({ error: "public_sample" }, 400, headers); // la muestra va en la web pública
  const module = String(body.module);

  if (body.action === "module") {
    const { data: file, error } = await db.storage.from(BUCKET).download(`modules/${module}.json`);
    if (error || !file) return json({ error: "content_missing" }, 503, headers);
    return json({ module: JSON.parse(await file.text()) }, 200, headers);
  }
  // Media: el clip realista de Google Flow (source "flow") o la animación del capítulo.
  const ext = body.kind === "es" ? ".es.vtt" : body.kind === "en" ? ".en.vtt" : body.kind === "video" ? ".mp4" : null;
  if (!ext) return json({ error: "invalid_kind" }, 400, headers);
  const source = body.source === "flow" ? "flow" : "capitulo";
  const { data: file, error } = await db.storage.from(BUCKET).download(`media/dia-${module}-${source}${ext}`);
  if (error || !file) return json({ error: "media_missing" }, 404, headers);
  return new Response(file, { status: 200, headers: { ...headers, "Content-Type": ext === ".mp4" ? "video/mp4" : "text/vtt; charset=utf-8" } });
});
