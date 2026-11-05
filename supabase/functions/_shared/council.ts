// "Tu council": finds a UK postcode's local council with GOV.UK's official local-authority API.
// The app then links each service to https://www.gov.uk/<service>/<slug>: GOV.UK keeps the
// council's own page for every service and sends two-tier areas to the right council (district
// or county). Plain fetch, no secrets: also runs under Node for tests.

export interface Council {
  name: string;
  homepage: string;
  slug: string;
  tier: string;
  parent?: { name: string; homepage: string; slug: string };
}
export type CouncilResult =
  | { status: "ok"; council: Council }
  | { status: "invalid" | "not_found" | "multiple" | "error" };

const UK_POSTCODE = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/;
export function normalisePostcode(input: string): string | null {
  const p = input.toUpperCase().replace(/\s+/g, "").trim();
  if (!UK_POSTCODE.test(p)) return null;
  return p;
}

const GOV = "https://www.gov.uk";
type Fetch = typeof fetch;


export async function findCouncil(input: string, f: Fetch = fetch): Promise<CouncilResult> {
  const postcode = normalisePostcode(input);
  if (!postcode) return { status: "invalid" };
  const res = await f(`${GOV}/api/local-authority?postcode=${postcode}`, { redirect: "follow" });
  if (res.status === 404) return { status: "not_found" };
  if (res.status === 300) return { status: "multiple" }; // the postcode spans two councils
  if (!res.ok) return { status: "error" };
  const body = (await res.json()) as { local_authority?: Record<string, any> };
  const la = body.local_authority;
  if (!la) return { status: "error" };
  const council: Council = {
    name: la.name,
    homepage: la.homepage_url,
    slug: la.slug,
    tier: la.tier,
    ...(la.parent ? { parent: { name: la.parent.name, homepage: la.parent.homepage_url, slug: la.parent.slug } } : {}),
  };
  return { status: "ok", council };
}
