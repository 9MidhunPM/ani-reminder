export class ClientError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ClientError";
  }
}

/** Same-origin JSON requests with readable, recoverable failures. */
export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(20_000)]) : AbortSignal.timeout(20_000),
      headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    if (error instanceof Error && error.name === "TimeoutError") throw new ClientError("The request took too long. Please try again.", 0);
    throw new ClientError("Could not connect. Check your connection and try again.", 0);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ClientError(
      response.status === 401 ? "Your session has expired. Sign in again to continue."
        : typeof body?.error === "string" ? body.error : "Something went wrong. Please try again.",
      response.status,
    );
  }
  if (body === null) throw new ClientError("The server returned an incomplete response. Please try again.", response.status);
  return body as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
