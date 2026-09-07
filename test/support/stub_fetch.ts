export interface StubCall { url: string; init: RequestInit }
export type StubHandler = (url: URL, init: RequestInit) => Response | undefined | Promise<Response | undefined>;

export function stubFetch(...routes: [RegExp | string, Response | ((url: URL, init: RequestInit) => Response)][]) {
  const handlerMap = routes.map(([matcher, response]) => ({ matcher, response }));
  const calls: StubCall[] = [];
  const fetchImpl = (async (input: string | URL | Request, init: RequestInit = {}) => {
    const raw = typeof input === "string" || input instanceof URL ? String(input) : input.url;
    const url = new URL(raw);
    calls.push({ url: raw, init });
    for (const { matcher, response } of handlerMap) {
      const hit = matcher instanceof RegExp ? matcher.test(raw) : raw.startsWith(matcher);
      if (hit) return typeof response === "function" ? response(url, init) : response;
    }
    throw new TypeError(`no stub for ${raw}`);   // falha de rede simulada
  }) as unknown as typeof globalThis.fetch;
  return { fetchImpl, calls };
}

export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

export function textResponse(body: string, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(body, { status, headers: { "content-type": "text/plain", ...headers } });
}
