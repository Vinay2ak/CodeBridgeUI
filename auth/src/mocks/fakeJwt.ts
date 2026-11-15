export function makeFakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
  return `${header}.${body}.fakesig`;
}

export function makeCorrelationId(): string {
  return `mock-${Math.random().toString(36).slice(2, 10)}`;
}
