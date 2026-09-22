const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { createMarketingOsHandler } = require("./server");

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function jsonFile(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tervona-marketing-os-test-"));
  const clientData = path.join(root, "clients", "tervona", "data");
  const usersFile = path.join(root, "content", "cms-users.json");
  const permissionKeys = ["products", "content_ai", "knowledge", "content_plan", "analytics", "ads", "site_health", "publish", "members"];
  writeJson(path.join(clientData, "product-catalog.json"), { summary: { category_count: 6, product_or_variant_node_count: 33, priority_group_count: 4 }, categories: [] });
  writeJson(path.join(clientData, "product-source-index.json"), { source_package: { pdf_count: 7 }, documents: [] });
  writeJson(path.join(clientData, "marketing-os-connectors.json"), []);
  writeJson(path.join(clientData, "marketing-os-audit.json"), []);
  writeJson(path.join(clientData, "marketing-os-tasks.json"), []);
  writeJson(path.join(clientData, "code-change-proposals.json"), []);
  writeJson(usersFile, [{ id: "admin", username: "admin", displayName: "客户管理员", role: "super_admin", permissions: [...permissionKeys], active: true }]);
  fs.writeFileSync(path.join(root, "app-v3.js"), "const version = 1;\n");

  const readUsers = () => jsonFile(usersFile, []);
  const handler = createMarketingOsHandler({
    root,
    HttpError,
    sendJson(res, status, payload) { res.status = status; res.payload = payload; },
    async readPayload(req) { return req.payload || {}; },
    readJsonFile: jsonFile,
    writeJsonFile: writeJson,
    readUsers,
    publicUser(user) { return user; },
    passwordHash(password, salt) { return crypto.pbkdf2Sync(String(password), salt, 10, 32, "sha256").toString("hex"); },
    requireUser() { return { session: { csrfToken: "csrf" }, user: readUsers()[0] }; },
    requireCsrf(req) { if (req.headers["x-csrf-token"] !== "csrf") throw new HttpError(403, "csrf"); },
    hasPermission(user, permission) { return user.role === "super_admin" || (user.permissions || []).includes(permission); },
    permissionKeys,
    cmsUsersFile: usersFile,
  });

  async function call(method, url, payload = null, headers = { authorization: "Bearer test-service-token" }) {
    const parsed = new URL(url, "http://test.local");
    const req = { method, headers, payload };
    const res = {};
    await handler(req, res, parsed);
    return res;
  }

  return { root, call, usersFile };
}

test("overview returns the imported Tervona structure without fake metrics", async (t) => {
  process.env.MARKETING_OS_SERVICE_TOKEN = "test-service-token";
  const fx = fixture();
  t.after(() => fs.rmSync(fx.root, { recursive: true, force: true }));
  const response = await fx.call("GET", "/api/marketing-os/v1/overview");
  assert.equal(response.status, 200);
  assert.deepEqual(response.payload.summary, { category_count: 6, product_or_variant_node_count: 33, priority_group_count: 4 });
  assert.equal(Object.hasOwn(response.payload, "traffic"), false);
});

test("content writes use hashes and code changes require proposal plus explicit apply", async (t) => {
  process.env.MARKETING_OS_SERVICE_TOKEN = "test-service-token";
  process.env.MARKETING_OS_ALLOW_CODE_WRITE = "1";
  const fx = fixture();
  t.after(() => fs.rmSync(fx.root, { recursive: true, force: true }));

  const created = await fx.call("PUT", "/api/marketing-os/v1/workspace/file", { kind: "content", path: "clients/tervona/drafts/product.md", content: "# Product\n", expectedSha256: "" });
  assert.equal(created.status, 200);
  assert.equal(fs.readFileSync(path.join(fx.root, "clients", "tervona", "drafts", "product.md"), "utf8"), "# Product\n");

  const stale = await fx.call("PUT", "/api/marketing-os/v1/workspace/file", { kind: "content", path: "clients/tervona/drafts/product.md", content: "changed", expectedSha256: "wrong" });
  assert.equal(stale.status, 409);

  const current = fs.readFileSync(path.join(fx.root, "app-v3.js"));
  const proposal = await fx.call("POST", "/api/marketing-os/v1/code/proposals", { path: "app-v3.js", content: "const version = 2;\n", expectedSha256: crypto.createHash("sha256").update(current).digest("hex"), summary: "版本更新" });
  assert.equal(proposal.status, 202);
  assert.equal(fs.readFileSync(path.join(fx.root, "app-v3.js"), "utf8"), "const version = 1;\n");

  const applied = await fx.call("POST", "/api/marketing-os/v1/code/apply", { id: proposal.payload.proposal.id, confirm: true });
  assert.equal(applied.status, 200);
  assert.equal(fs.readFileSync(path.join(fx.root, "app-v3.js"), "utf8"), "const version = 2;\n");
});

test("administrators can create, change and delete customer members", async (t) => {
  process.env.MARKETING_OS_SERVICE_TOKEN = "test-service-token";
  const fx = fixture();
  t.after(() => fs.rmSync(fx.root, { recursive: true, force: true }));

  const created = await fx.call("POST", "/api/marketing-os/v1/members", { username: "editor.one", displayName: "内容负责人", role: "content_lead", password: "temporary-password" });
  assert.equal(created.status, 201);
  assert.equal(created.payload.user.role, "content_lead");

  const updated = await fx.call("PATCH", `/api/marketing-os/v1/members/${created.payload.user.id}`, { role: "data_viewer", active: false });
  assert.equal(updated.status, 200);
  assert.equal(updated.payload.user.active, false);
  assert.equal(updated.payload.user.role, "data_viewer");

  const removed = await fx.call("DELETE", `/api/marketing-os/v1/members/${created.payload.user.id}`, {});
  assert.equal(removed.status, 200);
  assert.equal(jsonFile(fx.usersFile).length, 1);
});
