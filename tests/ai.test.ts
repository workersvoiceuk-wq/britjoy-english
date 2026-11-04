import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.doUnmock('@supabase/supabase-js');
});

/** Fake Supabase client: only the auth session matters to the AI client. */
function mockSupabase(session: { access_token: string } | null) {
  vi.doMock('@supabase/supabase-js', () => ({
    createClient: () => ({
      auth: { getSession: async () => ({ data: { session } }) },
    }),
  }));
}

function configure() {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon');
}

describe('Modo IA client', () => {
  it('reports not configured when there is no backend (no key is ever in the app)', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    const ai = await import('../src/lib/ai');
    expect(ai.aiConfigured()).toBe(false);
    await expect(ai.askBritjoy([{ role: 'user', content: 'Hi' }], 'A1')).rejects.toThrow('no está activado');
  });

  it('asks the learner to sign in before calling the tutor', async () => {
    configure();
    mockSupabase(null);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const ai = await import('../src/lib/ai');
    await expect(ai.askBritjoy([{ role: 'user', content: 'Hola' }], 'A1')).rejects.toMatchObject({ code: 'sign_in' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the conversation with the learner's token and records the usage", async () => {
    configure();
    mockSupabase({ access_token: 'learner-jwt' });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ reply: 'Hello, Ana!', usage: { paidWith: 'free', freeLeft: 4, credits: 0 } }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const ai = await import('../src/lib/ai');
    const { useAccount } = await import('../src/lib/backend');
    const reply = await ai.askBritjoy([{ role: 'user', content: 'Hola' }], 'B1');
    expect(reply).toBe('Hello, Ana!');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.supabase.co/functions/v1/britjoy-tutor');
    expect(JSON.parse(init.body)).toEqual({ messages: [{ role: 'user', content: 'Hola' }], level: 'B1' });
    expect(init.headers.Authorization).toBe('Bearer learner-jwt');
    expect(init.headers.apikey).toBe('public-anon');
    expect(useAccount.getState().freeLeft).toBe(4);
  });

  it('turns server errors into friendly Spanish messages with a code', async () => {
    configure();
    mockSupabase({ access_token: 'learner-jwt' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429 })));
    const ai = await import('../src/lib/ai');
    await expect(ai.askBritjoy([{ role: 'user', content: 'Hola' }], 'A1')).rejects.toThrow('Espera un minuto');
  });

  it('reports no credits so the screen can offer Britjoy Plus', async () => {
    configure();
    mockSupabase({ access_token: 'learner-jwt' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'no_credits', usage: { freeLeft: 0, credits: 0 } }), { status: 402 })),
    );
    const ai = await import('../src/lib/ai');
    await expect(ai.askBritjoy([{ role: 'user', content: 'Hola' }], 'A1')).rejects.toMatchObject({ code: 'no_credits' });
  });
});
