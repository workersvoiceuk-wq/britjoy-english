import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('Modo IA client', () => {
  it('reports not configured when no endpoint is set (no key is ever in the app)', async () => {
    vi.stubEnv('VITE_AI_ENDPOINT', '');
    const ai = await import('../src/lib/ai');
    expect(ai.aiConfigured()).toBe(false);
    await expect(ai.askBritjoy([{ role: 'user', content: 'Hi' }], 'A1')).rejects.toThrow('no está activado');
  });

  it('posts the conversation and level to the tutor endpoint with the public anon key', async () => {
    vi.stubEnv('VITE_AI_ENDPOINT', 'https://example.supabase.co/functions/v1/britjoy-tutor');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ reply: 'Hello, Ana!' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const ai = await import('../src/lib/ai');
    const reply = await ai.askBritjoy([{ role: 'user', content: 'Hola' }], 'B1');
    expect(reply).toBe('Hello, Ana!');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('britjoy-tutor');
    expect(JSON.parse(init.body)).toEqual({ messages: [{ role: 'user', content: 'Hola' }], level: 'B1' });
    expect(init.headers.Authorization).toBe('Bearer public-anon');
  });

  it('turns server errors into friendly Spanish messages', async () => {
    vi.stubEnv('VITE_AI_ENDPOINT', 'https://example.supabase.co/functions/v1/britjoy-tutor');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429 })));
    const ai = await import('../src/lib/ai');
    await expect(ai.askBritjoy([{ role: 'user', content: 'Hola' }], 'A1')).rejects.toThrow('Espera un minuto');
  });
});
