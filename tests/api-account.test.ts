import assert from "node:assert/strict";
import test from "node:test";
import { accountHandlers, type AccountDependencies } from "../src/lib/api-account";

process.env.AUTH_URL = "http://localhost:3000";

const account = { email: "viewer@example.com", morningEnabled: true, airtimeEnabled: true, ntfyTopic: "encrypted-private-topic" };
function request(body: unknown, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/account", { method: "PATCH", headers: { "content-type": "application/json", origin }, body: JSON.stringify(body) });
}
function setup(overrides: Partial<AccountDependencies> = {}) {
  const writes: unknown[] = [];
  const handlers = accountHandlers({
    authenticate: async () => "owner",
    find: async (userId) => { assert.equal(userId, "owner"); return account; },
    update: async (userId, data) => { writes.push({ userId, data }); return { ...account, ...data }; },
    remove: async (userId) => { writes.push(userId); },
    encrypt: (topic) => `encrypted:${topic}`,
    ...overrides,
  });
  return { handlers, writes };
}

test("account settings never expose the private topic", async () => {
  const { handlers } = setup();
  const response = await handlers.GET();
  assert.deepEqual(await response.json(), { settings: { email: account.email, morningEnabled: true, airtimeEnabled: true, topicConfigured: true } });
});

test("settings encrypt replacement topics and preserve independent preferences", async () => {
  const { handlers, writes } = setup();
  const response = await handlers.PATCH(request({ morningEnabled: false, ntfyTopic: "replacement-topic" }));
  assert.equal(response.status, 200);
  assert.deepEqual(writes, [{ userId: "owner", data: { morningEnabled: false, ntfyTopic: "encrypted:replacement-topic" } }]);
  const body = await response.json();
  assert.equal(body.settings.airtimeEnabled, true);
  assert.equal(JSON.stringify(body).includes("replacement"), false);
});

test("all account writes require authentication and same origin", async () => {
  const anonymous = setup({ authenticate: async () => null });
  assert.equal((await anonymous.handlers.GET()).status, 401);
  assert.equal((await anonymous.handlers.PATCH(request({ morningEnabled: false }))).status, 401);
  assert.equal((await anonymous.handlers.DELETE(request({}))).status, 401);
  assert.deepEqual(anonymous.writes, []);
  const crossOrigin = setup();
  assert.equal((await crossOrigin.handlers.PATCH(request({ morningEnabled: false }, "https://evil.example"))).status, 403);
  assert.equal((await crossOrigin.handlers.DELETE(request({}, "https://evil.example"))).status, 403);
  assert.deepEqual(crossOrigin.writes, []);
});

test("account writes reject malformed or extra data without touching storage", async () => {
  const { handlers, writes } = setup();
  assert.equal((await handlers.PATCH(request({ email: "attacker@example.com" }))).status, 400);
  const malformed = request({});
  assert.equal((await handlers.PATCH(new Request(malformed.url, { method: "PATCH", headers: malformed.headers, body: "{" }))).status, 400);
  assert.deepEqual(writes, []);
});

test("account removal always uses the authenticated owner", async () => {
  const { handlers, writes } = setup();
  assert.equal((await handlers.DELETE(request({ userId: "someone-else" }))).status, 200);
  assert.deepEqual(writes, ["owner"]);
});
