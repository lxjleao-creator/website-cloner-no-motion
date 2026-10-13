const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createMarketingOsHandler } = require("./marketing-os/server");

const root = process.cwd();
const port = Number(process.env.PORT || 8766);
const host = process.env.HOST || "0.0.0.0";
const cmsDir = path.join(root, "content");
const cmsStateFile = path.join(cmsDir, "cms-state.json");
const cmsUsersFile = path.join(cmsDir, "cms-users.json");
const cmsSubmissionsFile = path.join(cmsDir, "submissions.json");
const cmsFormsFile = path.join(cmsDir, "forms.json");
const cmsMailSettingsFile = path.join(path.dirname(root), ".enplus-private", "smtp.local.json");
const permissionKeys = ["pages", "menus", "products", "categories", "news", "downloads", "manuals", "submissions", "seo", "media", "settings", "content_ai", "knowledge", "content_plan", "analytics", "ads", "site_health", "publish", "members"];
const sessionCookieName = "enplus_cms_session";
const sessions = new Map();
const loginAttempts = new Map();

const mime = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".mp4": "video/mp4", ".webm": "video/webm", ".pdf": "application/pdf", ".doc": "application/msword", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".ppt": "application/vnd.ms-powerpoint", ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".txt": "text/plain; charset=utf-8", ".zip": "application/zip", ".rar": "application/vnd.rar", ".7z": "application/x-7z-compressed", ".woff": "font/woff", ".woff2": "font/woff2"
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

function readBody(req, maxBytes = 10 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; if (body.length > maxBytes) { req.destroy(); reject(new HttpError(413, "Request body too large")); } });
    req.on("end", () => resolve(body)); req.on("error", reject);
  });
}

async function readPayload(req, maxBytes) {
  const body = await readBody(req, maxBytes);
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
  const username = String(process.env.CMS_ADMIN_USERNAME || "").trim().toLowerCase();
  const password = String(process.env.CMS_ADMIN_PASSWORD || "");
  if (!username || password.length < 10) return [];
  const salt = crypto.randomBytes(24).toString("hex");
  const now = new Date().toISOString();
  return [{
    id: "user-superadmin", username, displayName: "超级管理员", role: "super_admin", permissions: [...permissionKeys], active: true,
    salt, passwordHash: passwordHash(password, salt), createdAt: now, updatedAt: now,
  }];
}

function readUsers() {
  let users = readJsonFile(cmsUsersFile, null);
  if (!Array.isArray(users) || !users.length) {
    users = seedUsers();
    if (users.length) writeJsonFile(cmsUsersFile, users);
  }
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
  const fields = { pages: "pages", menus: "menus", products: "products", news: "news", downloadCategories: "downloads", media: "media", settings: "settings" };
  for (const [field, permission] of Object.entries(fields)) if (hasPermission(user, permission) && Object.hasOwn(incoming, field)) result[field] = incoming[field];
  if (hasPermission(user, "downloads") && Object.hasOwn(incoming, "downloads")) {
    result.downloads = incoming.downloads;
  } else if (hasPermission(user, "manuals") && Array.isArray(incoming.downloads)) {
    const currentDownloads = Array.isArray(current.downloads) ? current.downloads : [];
    const protectedDownloads = currentDownloads.filter((item) => item.type !== "user-manual");
    const protectedIds = new Set(protectedDownloads.map((item) => item.id));
    const manuals = incoming.downloads.filter((item) => item?.type === "user-manual" && !protectedIds.has(item.id));
    result.downloads = [...manuals, ...protectedDownloads];
  }
  if (Array.isArray(incoming.activity)) result.activity = incoming.activity;
  return result;
}

function safeUploadFolder(folder) {
  const allowed = new Set(["products", "news", "heroes", "downloads", "brand", "product-manual"]);
  const cleaned = String(folder || "products").replace(/[^a-z0-9-]/gi, "").toLowerCase();
  return allowed.has(cleaned) ? cleaned : "products";
}

function uploadTarget(folder) {
  if (folder === "product-manual") {
    return { directory: path.join(root, "product", "manual"), urlBase: "/product/manual" };
  }
  return { directory: path.join(root, "uploads", folder), urlBase: `/uploads/${folder}` };
}

function safeUploadName(name, mimeType) {
  const raw = path.basename(String(name || "media-file").replace(/\\/g, "/"));
  const extFromMime = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/svg+xml": ".svg", "application/pdf": ".pdf" }[mimeType] || "";
  const ext = path.extname(raw) || extFromMime || ".bin";
  const base = path.basename(raw, path.extname(raw)).replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "media";
  return `${Date.now()}-${base}${ext.toLowerCase()}`;
}

function safeManualUploadName(requestedName, sourceName) {
  const sourceRaw = path.basename(String(sourceName || requestedName || "manual.pdf").replace(/\\/g, "/"));
  const extension = path.extname(sourceRaw).toLowerCase();
  const requestedRaw = path.basename(String(requestedName || sourceRaw).replace(/\\/g, "/"));
  const base = path.basename(requestedRaw, path.extname(requestedRaw))
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "") || "manual";
  return `${base}${extension}`;
}

function saveUploadedDataUrl(payload) {
  const match = /^data:([^;,]+);base64,(.+)$/i.exec(String(payload.dataUrl || ""));
  if (!match) throw new HttpError(400, "Invalid upload payload");
  const mimeType = match[1];
  const folder = safeUploadFolder(payload.folder);
  const manualExtension = path.extname(String(payload.sourceFileName || payload.fileName || "")).toLowerCase();
  const allowedManualExtensions = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".zip", ".rar", ".7z"]);
  if (folder === "product-manual") {
    if (!allowedManualExtensions.has(manualExtension)) throw new HttpError(400, "Unsupported User Manual file type");
  } else if (!/^(image\/(jpeg|png|webp|gif|svg\+xml)|application\/pdf)$/i.test(mimeType)) {
    throw new HttpError(400, "Unsupported upload type");
  }
  const fileName = folder === "product-manual"
    ? safeManualUploadName(payload.fileName, payload.sourceFileName)
    : safeUploadName(payload.fileName, mimeType);
  const target = uploadTarget(folder);
  const uploadDir = target.directory;
  fs.mkdirSync(uploadDir, { recursive: true });
  const bytes = Buffer.from(match[2], "base64");
  if (folder === "product-manual" && bytes.length > 40 * 1024 * 1024) throw new HttpError(413, "User Manual file exceeds the 40 MB limit");
  fs.writeFileSync(path.join(uploadDir, fileName), bytes);
  const url = `${target.urlBase}/${fileName}`;
  return { id: url, title: payload.title || fileName, url, folder, type: mimeType.startsWith("image/") ? "image" : "document", usage: payload.usage || "Unassigned", size: bytes.length, mimeType, createdAt: new Date().toISOString() };
}

function submissionText(value, max = 500) {
  return String(value || "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max);
}

function receiveSubmission(payload) {
  if (submissionText(payload.website, 200)) return { honeypot: true };
  const forms = readJsonFile(cmsFormsFile, []);
  const form = (Array.isArray(forms) ? forms : []).find((item) =>
    (payload.formId && item.id === payload.formId) || (payload.formSlug && item.slug === payload.formSlug)
  );
  if (!form || form.status !== "active") throw new HttpError(404, "This form is not available.");
  const rawValues = payload.values && typeof payload.values === "object" ? payload.values : payload;
  const values = [];
  const valueMap = {};
  for (const field of Array.isArray(form.fields) ? form.fields : []) {
    const key = submissionText(field.key, 60);
    const type = submissionText(field.type || "text", 20);
    const raw = rawValues[key] ?? (type === "checkbox" ? false : "");
    let value;
    if (type === "checkbox") {
      value = raw === true || raw === 1 || ["1", "true", "on", "yes"].includes(String(raw).toLowerCase());
      if (field.required && !value) throw new HttpError(422, `Please complete the required field: ${field.label || key}`);
    } else {
      value = submissionText(raw, type === "textarea" ? 5000 : 500);
      if (field.required && !value) throw new HttpError(422, `Please complete the required field: ${field.label || key}`);
      if (type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new HttpError(422, "Please enter a valid email address.");
      if (type === "number" && value && !Number.isFinite(Number(value))) throw new HttpError(422, `Please enter a valid number for: ${field.label || key}`);
      if (type === "select" && value && !(field.options || []).includes(value)) throw new HttpError(422, `Please choose a valid option for: ${field.label || key}`);
    }
    valueMap[key] = value;
    values.push({ key, label: submissionText(field.label || key, 140), type, value, includeInEmail: field.includeInEmail !== false });
  }
  const firstName = submissionText(valueMap.firstName, 80);
  const lastName = submissionText(valueMap.lastName, 80);
  const displayName = submissionText(`${firstName} ${lastName}`.trim() || valueMap.name || valueMap.company || valueMap.email || form.name, 180);
  const record = {
    id: `submission-${crypto.randomBytes(10).toString("hex")}`,
    formId: form.id, formName: form.name, formSlug: form.slug, displayName, values, data: valueMap,
    firstName, lastName,
    email: submissionText(valueMap.email, 180).toLowerCase(), phone: submissionText(valueMap.phone, 80),
    company: submissionText(valueMap.company, 180), position: submissionText(valueMap.position, 180),
    country: submissionText(valueMap.country, 120), state: submissionText(valueMap.state, 120),
    message: submissionText(valueMap.message, 5000), source: submissionText(payload.source || "/contact-us", 300),
    status: "new", createdAt: new Date().toISOString(), mailSent: false, mailStatus: "local-dev",
  };
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

    if (req.method === "GET" && action === "public-forms") {
      const forms = readJsonFile(cmsFormsFile, []);
      sendJson(res, 200, { ok: true, forms: (Array.isArray(forms) ? forms : []).filter((form) => form.status === "active") }); return;
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
      requireCsrf(req, session); const payload = await readPayload(req, 60 * 1024 * 1024);
      if (!payload.state || typeof payload.state !== "object") throw new HttpError(400, "Missing state object");
      const state = authorizedState(user, readJsonFile(cmsStateFile, null), payload.state); writeJsonFile(cmsStateFile, state);
      sendJson(res, 200, { ok: true, source: "node-dev", state }); return;
    }
    if (req.method === "POST" && action === "upload") {
      requireCsrf(req, session); const payload = await readPayload(req, 60 * 1024 * 1024);
      const folder = safeUploadFolder(payload.folder);
      if (folder === "product-manual") {
        if (!hasPermission(user, "manuals") && !hasPermission(user, "media")) throw new HttpError(403, "没有 Manual 上传权限");
      } else if (!hasPermission(user, "media")) throw new HttpError(403, "没有媒体上传权限");
      sendJson(res, 200, { ok: true, source: "node-dev", asset: saveUploadedDataUrl(payload) }); return;
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

const handleMarketingOsApi = createMarketingOsHandler({
  root, HttpError, sendJson, readPayload, readJsonFile, writeJsonFile, readUsers, publicUser, passwordHash,
  requireUser, requireCsrf, hasPermission, permissionKeys, cmsUsersFile,
});

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (parsed.pathname.startsWith("/api/marketing-os/v1/")) { handleMarketingOsApi(req, res, parsed); return; }
  if (parsed.pathname === "/admin/api.php") { handleCmsApi(req, res, parsed); return; }
  if (parsed.pathname.startsWith("/content/") || parsed.pathname.startsWith("/clients/") || parsed.pathname.startsWith("/docs/marketing-os/") || /^\/marketing-os\/(server(?:\.test)?\.js)$/.test(parsed.pathname)) { res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }); res.end("Forbidden"); return; }
  let filePath = safePath(parsed.pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, "index.html");
  if (!fs.existsSync(filePath) && (parsed.pathname.startsWith("/uploads/") || parsed.pathname.startsWith("/product/manual/"))) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("Not found"); return; }
  if (!fs.existsSync(filePath)) filePath = path.join(root, "index.html");
  sendFile(req, res, filePath);
});

server.listen(port, host, () => console.log(`Static frontend listening on http://${host}:${port}`));
