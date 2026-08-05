const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = process.cwd();
const port = Number(process.env.PORT || 8766);
const host = process.env.HOST || "0.0.0.0";
const cmsDir = path.join(root, "content");
const cmsStateFile = path.join(cmsDir, "cms-state.json");
const cmsUsersFile = path.join(cmsDir, "cms-users.json");
const cmsSubmissionsFile = path.join(cmsDir, "submissions.json");
const cmsMailSettingsFile = path.join(path.dirname(root), ".enplus-private", "smtp.local.json");
const permissionKeys = ["pages", "menus", "products", "categories", "news", "downloads", "submissions", "seo", "media", "settings"];
const sessionCookieName = "enplus_cms_session";
const sessions = new Map();
const loginAttempts = new Map();

const mime = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".mp4": "video/mp4", ".webm": "video/webm", ".pdf": "application/pdf", ".woff": "font/woff", ".woff2": "font/woff2"
};

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function safePath(urlPath) {
  let decoded = "/";
  try { decoded = decodeURIComponent(urlPath); } catch { decoded = urlPath; }
  const cleaned = decoded.replace(/^\/+/, "");
  const resolved = path.resolve(root, cleaned || "index.html");
  return resolved.startsWith(root) ? resolved : path.join(root, "index.html");
}

function sendFile(req, res, filePath) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("Not found"); return; }
    const type = mime[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    const headers = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "no-store" };
    const range = req.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (match) {
        const start = match[1] ? Number(match[1]) : 0;
        const end = match[2] ? Number(match[2]) : stat.size - 1;
        if (start <= end && end < stat.size) {
          Object.assign(headers, { "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": end - start + 1 });
          res.writeHead(206, headers); fs.createReadStream(filePath, { start, end }).pipe(res); return;
        }
      }
    }
    headers["Content-Length"] = stat.size;
    res.writeHead(200, headers); fs.createReadStream(filePath).pipe(res);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; if (body.length > 10 * 1024 * 1024) { req.destroy(); reject(new HttpError(413, "Request body too large")); } });
    req.on("end", () => resolve(body)); req.on("error", reject);
  });
}

async function readPayload(req) {
  const body = await readBody(req);
  if (!body) return {};
  try { return JSON.parse(body); } catch { throw new HttpError(400, "请求格式不正确"); }
}

function sendJson(res, status, payload, extraHeaders = {}) {
  const text = JSON.stringify(payload, null, 2);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Length": Buffer.byteLength(text), ...extraHeaders });
  res.end(text);
}

function readJsonFile(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJsonFile(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function seedUsers() {
  return [{
    id: "user-superadmin", username: "admin", displayName: "超级管理员", role: "super_admin", permissions: [...permissionKeys], active: true,
    salt: "a7cd7cdeeee0da73256c3944adfdf3f4ca34126d46be9a07", passwordHash: "c71b8a47ec5ae6281f33924f9e9d25eaefe0a384da6bc54615801f04e10c766d",
    createdAt: "2026-08-04T00:00:00+08:00", updatedAt: "2026-08-04T00:00:00+08:00"
  }];
}

function readUsers() {
  let users = readJsonFile(cmsUsersFile, null);
  if (!Array.isArray(users) || !users.length) { users = seedUsers(); writeJsonFile(cmsUsersFile, users); }
  return users;
}

function publicUser(user) {
  return { id: user.id, username: user.username, displayName: user.displayName || user.username, role: user.role || "editor", permissions: [...(user.permissions || [])], active: user.active !== false, createdAt: user.createdAt || "", updatedAt: user.updatedAt || "" };
}

function passwordHash(password, salt) {
  return crypto.pbkdf2Sync(String(password), salt, 210000, 32, "sha256").toString("hex");
}

function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || "").split(";").map((part) => part.trim()).filter(Boolean).map((part) => { const index = part.indexOf("="); return [decodeURIComponent(index < 0 ? part : part.slice(0, index)), decodeURIComponent(index < 0 ? "" : part.slice(index + 1))]; }));
}

function sessionForRequest(req) {
  const token = parseCookies(req)[sessionCookieName];
  const session = token ? sessions.get(token) : null;
  if (!session) return null;
  if (session.expiresAt < Date.now()) { sessions.delete(token); return null; }
  session.expiresAt = Date.now() + 12 * 60 * 60 * 1000;
  return { token, ...session };
}

function currentUser(req) {
  const session = sessionForRequest(req);
  if (!session) return { session: null, user: null };
  const user = readUsers().find((item) => item.id === session.userId && item.active !== false) || null;
  if (!user) sessions.delete(session.token);
  return { session: user ? session : null, user };
}

function requireUser(req) {
  const auth = currentUser(req);
  if (!auth.user) throw new HttpError(401, "请先登录");
  return auth;
}

function requireCsrf(req, session) {
  if (!session?.csrfToken || req.headers["x-csrf-token"] !== session.csrfToken) throw new HttpError(403, "安全令牌已失效，请重新登录");
}

function requireSuperAdmin(user) {
  if (user.role !== "super_admin") throw new HttpError(403, "只有超级管理员可以管理人员和权限");
}

function hasPermission(user, permission) {
  return user.role === "super_admin" || (user.permissions || []).includes(permission);
}

function cleanPermissions(permissions) {
  return [...new Set((Array.isArray(permissions) ? permissions : []).filter((item) => permissionKeys.includes(item)))];
}

function authorizedState(user, current, incoming) {
  if (user.role === "super_admin" || !current) return incoming;
  const result = structuredClone(current);
  const fields = { pages: "pages", menus: "menus", products: "products", news: "news", downloads: "downloads", downloadCategories: "downloads", media: "media", settings: "settings" };
  for (const [field, permission] of Object.entries(fields)) if (hasPermission(user, permission) && Object.hasOwn(incoming, field)) result[field] = incoming[field];
  if (Array.isArray(incoming.activity)) result.activity = incoming.activity;
  return result;
}

function safeUploadFolder(folder) {
  const allowed = new Set(["products", "news", "heroes", "downloads", "brand"]);
  const cleaned = String(folder || "products").replace(/[^a-z0-9-]/gi, "").toLowerCase();
  return allowed.has(cleaned) ? cleaned : "products";
}

function safeUploadName(name, mimeType) {
  const raw = path.basename(String(name || "media-file").replace(/\\/g, "/"));
  const extFromMime = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/svg+xml": ".svg", "application/pdf": ".pdf" }[mimeType] || "";
  const ext = path.extname(raw) || extFromMime || ".bin";
  const base = path.basename(raw, path.extname(raw)).replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "media";
  return `${Date.now()}-${base}${ext.toLowerCase()}`;
}

function saveUploadedDataUrl(payload) {
  const match = /^data:([^;,]+);base64,(.+)$/i.exec(String(payload.dataUrl || ""));
  if (!match) throw new HttpError(400, "Invalid upload payload");
  const mimeType = match[1];
  if (!/^(image\/(jpeg|png|webp|gif|svg\+xml)|application\/pdf)$/i.test(mimeType)) throw new HttpError(400, "Unsupported upload type");
  const folder = safeUploadFolder(payload.folder);
  const fileName = safeUploadName(payload.fileName, mimeType);
  const uploadDir = path.join(root, "uploads", folder);
  fs.mkdirSync(uploadDir, { recursive: true });
  const bytes = Buffer.from(match[2], "base64");
  fs.writeFileSync(path.join(uploadDir, fileName), bytes);
  const url = `/uploads/${folder}/${fileName}`;
  return { id: url, title: payload.title || fileName, url, folder, type: mimeType.startsWith("image/") ? "image" : "document", usage: payload.usage || "Unassigned", size: bytes.length, mimeType, createdAt: new Date().toISOString() };
}

function submissionText(value, max = 500) {
  return String(value || "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max);
}

function receiveSubmission(payload) {
  if (submissionText(payload.website, 200)) return { honeypot: true };
  const record = {
    id: `submission-${crypto.randomBytes(10).toString("hex")}`,
    firstName: submissionText(payload.firstName, 80), lastName: submissionText(payload.lastName, 80),
    email: submissionText(payload.email, 180).toLowerCase(), phone: submissionText(payload.phone, 80),
    company: submissionText(payload.company, 180), position: submissionText(payload.position, 180),
    country: submissionText(payload.country, 120), state: submissionText(payload.state, 120),
    message: submissionText(payload.message, 5000), source: submissionText(payload.source || "/contact-us", 300),
    status: "new", createdAt: new Date().toISOString(), mailSent: false, mailStatus: "local-dev",
  };
  if (!record.firstName || !record.lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email) || !record.phone || !record.country || !record.state || !record.message) {
    throw new HttpError(422, "Please complete all required fields with a valid email address.");
  }
  const submissions = readJsonFile(cmsSubmissionsFile, []);
  writeJsonFile(cmsSubmissionsFile, [record, ...(Array.isArray(submissions) ? submissions : [])].slice(0, 2000));
  return record;
}

function publicMailSettings(settings = {}) {
  return { host: settings.host || "smtp.exmail.qq.com", port: Number(settings.port || 465), encryption: settings.encryption || "ssl", username: settings.username || "ads@en-plus.com.cn", fromName: settings.fromName || "Tervona Website", recipient: "ads@en-plus.com.cn", configured: !!(settings.password && settings.username && settings.host) };
}

async function handleCmsApi(req, res, parsed) {
  const action = parsed.searchParams.get("action") || "state";
  try {
    if (req.method === "GET" && action === "session") {
      const { session, user } = currentUser(req);
      sendJson(res, 200, { ok: true, authenticated: !!user, user: user ? publicUser(user) : null, csrfToken: session?.csrfToken || "" }); return;
    }

    if (req.method === "POST" && action === "login") {
      const key = req.socket.remoteAddress || "local";
      const attempt = loginAttempts.get(key);
      if (attempt?.lockedUntil > Date.now()) throw new HttpError(429, "登录尝试过多，请稍后再试");
      const payload = await readPayload(req);
      const username = String(payload.username || "").trim().toLowerCase();
      const user = readUsers().find((item) => String(item.username).toLowerCase() === username && item.active !== false);
      const candidate = user ? passwordHash(payload.password || "", user.salt) : crypto.randomBytes(32).toString("hex");
      const valid = !!user && candidate.length === user.passwordHash.length && crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(user.passwordHash));
      if (!valid) {
        const failures = (attempt?.failures || 0) + 1;
        loginAttempts.set(key, failures >= 6 ? { failures: 0, lockedUntil: Date.now() + 5 * 60 * 1000 } : { failures, lockedUntil: 0 });
        throw new HttpError(401, "账号或密码不正确");
      }
      loginAttempts.delete(key);
      const token = crypto.randomBytes(32).toString("hex");
      const csrfToken = crypto.randomBytes(24).toString("hex");
      sessions.set(token, { userId: user.id, csrfToken, expiresAt: Date.now() + 12 * 60 * 60 * 1000 });
      sendJson(res, 200, { ok: true, authenticated: true, user: publicUser(user), csrfToken }, { "Set-Cookie": `${sessionCookieName}=${token}; Path=/; HttpOnly; SameSite=Strict` }); return;
    }

    // Published CMS content is public data used by the storefront templates.
    // Mutating actions below still require an authenticated session and CSRF.
    if (req.method === "GET" && action === "state") { sendJson(res, 200, { ok: true, source: "node-dev", state: readJsonFile(cmsStateFile, null) }); return; }

    if (req.method === "POST" && action === "submission") {
      const record = receiveSubmission(await readPayload(req));
      sendJson(res, record.honeypot ? 200 : 201, { ok: true, message: "Thank you. Your enquiry has been received.", submissionId: record.id || "" }); return;
    }

    const { session, user } = requireUser(req);

    if (req.method === "POST" && action === "logout") {
      requireCsrf(req, session); sessions.delete(session.token);
      sendJson(res, 200, { ok: true }, { "Set-Cookie": `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0` }); return;
    }
    if (req.method === "POST" && action === "save") {
      requireCsrf(req, session); const payload = await readPayload(req);
      if (!payload.state || typeof payload.state !== "object") throw new HttpError(400, "Missing state object");
      const state = authorizedState(user, readJsonFile(cmsStateFile, null), payload.state); writeJsonFile(cmsStateFile, state);
      sendJson(res, 200, { ok: true, source: "node-dev", state }); return;
    }
    if (req.method === "POST" && action === "upload") {
      requireCsrf(req, session); if (!hasPermission(user, "media")) throw new HttpError(403, "没有媒体上传权限");
      sendJson(res, 200, { ok: true, source: "node-dev", asset: saveUploadedDataUrl(await readPayload(req)) }); return;
    }
    if (req.method === "GET" && action === "users") {
      requireSuperAdmin(user); sendJson(res, 200, { ok: true, users: readUsers().map(publicUser) }); return;
    }
    if (req.method === "GET" && action === "submissions") {
      if (!hasPermission(user, "submissions")) throw new HttpError(403, "No permission to view submissions");
      sendJson(res, 200, { ok: true, submissions: readJsonFile(cmsSubmissionsFile, []) || [] }); return;
    }
    if (req.method === "GET" && action === "mail-settings") {
      requireSuperAdmin(user); sendJson(res, 200, { ok: true, settings: publicMailSettings(readJsonFile(cmsMailSettingsFile, {}) || {}) }); return;
    }
    if (req.method === "POST" && action === "mail-settings-save") {
      requireCsrf(req, session); requireSuperAdmin(user); const payload = await readPayload(req); const current = readJsonFile(cmsMailSettingsFile, {}) || {};
      const settings = { host: submissionText(payload.host || "smtp.exmail.qq.com", 180), port: Number(payload.port || 465), encryption: ["ssl", "tls", "none"].includes(payload.encryption) ? payload.encryption : "ssl", username: submissionText(payload.username, 180).toLowerCase(), password: String(payload.password || current.password || ""), fromName: submissionText(payload.fromName || "Tervona Website", 100), updatedAt: new Date().toISOString() };
      if (!/^[a-z0-9.-]+$/i.test(settings.host) || settings.port < 1 || settings.port > 65535 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.username) || !settings.password) throw new HttpError(422, "SMTP configuration is invalid");
      writeJsonFile(cmsMailSettingsFile, settings); sendJson(res, 200, { ok: true, settings: publicMailSettings(settings) }); return;
    }
    if (req.method === "POST" && action === "mail-test") {
      requireCsrf(req, session); requireSuperAdmin(user); sendJson(res, 200, { ok: true, message: "Local development SMTP test is simulated; verify delivery on Hostinger." }); return;
    }
    if (req.method === "POST" && action === "submission-status") {
      requireCsrf(req, session); if (!hasPermission(user, "submissions")) throw new HttpError(403, "No permission to manage submissions");
      const payload = await readPayload(req); const submissions = readJsonFile(cmsSubmissionsFile, []) || [];
      for (const item of submissions) if (item.id === payload.id) { item.status = ["new", "read", "handled"].includes(payload.status) ? payload.status : "read"; item.updatedAt = new Date().toISOString(); }
      writeJsonFile(cmsSubmissionsFile, submissions); sendJson(res, 200, { ok: true, submissions }); return;
    }
    if (req.method === "POST" && action === "submission-delete") {
      requireCsrf(req, session); if (!hasPermission(user, "submissions")) throw new HttpError(403, "No permission to manage submissions");
      const payload = await readPayload(req); const submissions = (readJsonFile(cmsSubmissionsFile, []) || []).filter((item) => item.id !== payload.id);
      writeJsonFile(cmsSubmissionsFile, submissions); sendJson(res, 200, { ok: true, submissions }); return;
    }
    if (req.method === "POST" && action === "user-create") {
      requireCsrf(req, session); requireSuperAdmin(user); const payload = await readPayload(req);
      const username = String(payload.username || "").trim().toLowerCase(); const password = String(payload.password || "");
      if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new HttpError(400, "账号需为 3-40 位字母、数字、点、下划线或短横线");
      if (password.length < 10) throw new HttpError(400, "密码至少需要 10 位");
      const users = readUsers(); if (users.some((item) => String(item.username).toLowerCase() === username)) throw new HttpError(409, "账号已存在");
      const role = payload.role === "super_admin" ? "super_admin" : "editor"; const salt = crypto.randomBytes(24).toString("hex"); const now = new Date().toISOString();
      users.push({ id: `user-${crypto.randomBytes(8).toString("hex")}`, username, displayName: String(payload.displayName || "").trim() || username, role, permissions: role === "super_admin" ? [...permissionKeys] : cleanPermissions(payload.permissions), active: true, salt, passwordHash: passwordHash(password, salt), createdAt: now, updatedAt: now });
      writeJsonFile(cmsUsersFile, users); sendJson(res, 201, { ok: true, users: users.map(publicUser) }); return;
    }
    if (req.method === "POST" && action === "user-update") {
      requireCsrf(req, session); requireSuperAdmin(user); const payload = await readPayload(req); const users = readUsers(); const index = users.findIndex((item) => item.id === payload.id);
      if (index < 0) throw new HttpError(404, "人员不存在");
      const username = String(payload.username || users[index].username).trim().toLowerCase(); if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new HttpError(400, "账号格式不正确");
      if (users.some((item, i) => i !== index && String(item.username).toLowerCase() === username)) throw new HttpError(409, "账号已存在");
      const role = payload.role === "super_admin" ? "super_admin" : "editor"; const active = payload.active !== false;
      if (users[index].id === user.id && (!active || role !== "super_admin")) throw new HttpError(400, "不能停用或降级当前超级管理员账号");
      Object.assign(users[index], { username, displayName: String(payload.displayName || "").trim() || username, role, permissions: role === "super_admin" ? [...permissionKeys] : cleanPermissions(payload.permissions), active, updatedAt: new Date().toISOString() });
      if (payload.password) { if (String(payload.password).length < 10) throw new HttpError(400, "新密码至少需要 10 位"); users[index].salt = crypto.randomBytes(24).toString("hex"); users[index].passwordHash = passwordHash(payload.password, users[index].salt); }
      if (!users.some((item) => item.role === "super_admin" && item.active !== false)) throw new HttpError(400, "必须保留至少一个启用的超级管理员");
      writeJsonFile(cmsUsersFile, users); sendJson(res, 200, { ok: true, users: users.map(publicUser) }); return;
    }
    if (req.method === "POST" && action === "user-delete") {
      requireCsrf(req, session); requireSuperAdmin(user); const payload = await readPayload(req);
      if (payload.id === user.id) throw new HttpError(400, "不能删除当前登录账号");
      const users = readUsers().filter((item) => item.id !== payload.id); if (!users.some((item) => item.role === "super_admin" && item.active !== false)) throw new HttpError(400, "必须保留至少一个启用的超级管理员");
      writeJsonFile(cmsUsersFile, users); sendJson(res, 200, { ok: true, users: users.map(publicUser) }); return;
    }
    throw new HttpError(404, "Unknown CMS action");
  } catch (error) {
    sendJson(res, error.status || 500, { ok: false, authenticated: error.status === 401 ? false : undefined, error: error.message || "CMS API error" });
  }
}

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (parsed.pathname === "/admin/api.php") { handleCmsApi(req, res, parsed); return; }
  if (parsed.pathname.startsWith("/content/")) { res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }); res.end("Forbidden"); return; }
  let filePath = safePath(parsed.pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, "index.html");
  if (!fs.existsSync(filePath) && parsed.pathname.startsWith("/uploads/")) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("Not found"); return; }
  if (!fs.existsSync(filePath)) filePath = path.join(root, "index.html");
  sendFile(req, res, filePath);
});

server.listen(port, host, () => console.log(`Static frontend listening on http://${host}:${port}`));
