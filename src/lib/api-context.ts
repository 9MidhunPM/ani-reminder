import { hasSameOrigin, readJson, RequestError } from "./request-security";

export type Authenticate = () => Promise<string | null>;

export async function authorize(authenticate: Authenticate, request?: Request) {
  const userId = await authenticate();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (request && !hasSameOrigin(request)) {
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  }
  return userId;
}

export async function parseJson(request: Request) {
  try {
    return { body: await readJson(request) };
  } catch (error) {
    if (error instanceof RequestError) {
      return { response: Response.json({ error: error.message }, { status: error.status }) };
    }
    throw error;
  }
}
