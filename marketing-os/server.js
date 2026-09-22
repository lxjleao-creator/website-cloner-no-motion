const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const API_PREFIX = "/api/marketing-os/v1";
const MAX_WORKSPACE_BYTES = 2 * 1024 * 1024;

const marketingRoleDefinitions = {
  administrator: {
    label: "管理员",
    description: "管理全部模块、成员、数据授权和发布。",
    cmsRole: "super_admin",
    permissions: "all",
  },
  content_lead: {
    label: "内容负责人",
    description: "管理产品资料和内容计划，可提交审核和执行已批准的发布。",
    cmsRole: "editor",
    permissions: ["products", "categories", "news", "downloads", "media", "seo", "content_ai", "knowledge", "content_plan", "publish", "site_health"],
  },
  performance_marketer: {
    label: "市场投放",
    description: "查看并分析流量与广告，创建投放和优化任务。",
    cmsRole: "editor",
    permissions: ["analytics", "ads", "content_plan", "site_health"],
  },
  data_viewer: {
    label: "数据只读",
    description: "只读查看内容、流量、广告和网站健康。",
    cmsRole: "editor",
    permissions: ["knowledge", "analytics", "ads", "site_health"],
  },
};

function createMarketingOsHandler(options) {
  const {
    root,
    HttpError,
    sendJson,
    readPayload,
    readJsonFile,
    writeJsonFile,
    readUsers,
    publicUser,
    passwordHash,
    requireUser,
    requireCsrf,
    hasPermission,
    permissionKeys,
    cmsUsersFile,
  } = options;

  const clientRoot = path.join(root, "clients", "tervona");
  const catalogFile = path.join(clientRoot, "data", "product-catalog.json");
  const sourceIndexFile = path.join(clientRoot, "data", "product-source-index.json");
  const taskFile = path.join(clientRoot, "data", "marketing-os-tasks.json");
  const auditFile = path.join(clientRoot, "data", "marketing-os-audit.json");
  const connectorFile = path.join(clientRoot, "data", "marketing-os-connectors.json");
  const proposalFile = path.join(clientRoot, "data", "code-change-proposals.json");

  function sha256(content) {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  function isServiceRequest(req) {
    const expected = String(process.env.MARKETING_OS_SERVICE_TOKEN || "");
    const header = String(req.headers.authorization || "");
    if (!expected || !header.startsWith("Bearer ")) return false;
    const candidate = header.slice(7);
    if (candidate.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
  }

  function authContext(req) {
    if (isServiceRequest(req)) {
      return { kind: "service", session: null, user: { id: "marketing-os-service", displayName: "Marketing OS", role: "super_admin", permissions: [...permissionKeys] } };
    }
    const { session, user } = requireUser(req);
    return { kind: "session", session, user };
  }

  function requireMutationAuth(req, context) {
    if (context.kind === "session") requireCsrf(req, context.session);
  }

  function requirePermission(user, permission, message = "没有执行此操作的权限") {
    if (!hasPermission(user, permission)) throw new HttpError(403, message);
  }

  function requireAdministrator(context) {
    if (context.user.role !== "super_admin") throw new HttpError(403, "只有管理员可以管理成员与权限");
  }

  function requireInternalAccess(context) {
    if (context.kind !== "service" && context.user.role !== "super_admin") throw new HttpError(403, "此操作仅限受保护的系统服务");
  }

  function readArray(file) {
    const value = readJsonFile(file, []);
    return Array.isArray(value) ? value : [];
  }

  function appendAudit(event) {
    const records = readArray(auditFile);
    records.unshift({ id: `audit-${crypto.randomBytes(8).toString("hex")}`, createdAt: new Date().toISOString(), ...event });
    writeJsonFile(auditFile, records.slice(0, 2000));
  }

  function marketingRoleForUser(user) {
    if (user.role === "super_admin") return "administrator";
    if (user.marketingRole && marketingRoleDefinitions[user.marketingRole]) return user.marketingRole;
    const permissions = new Set(user.permissions || []);
    if (permissions.has("ads") || permissions.has("analytics")) return "performance_marketer";
    if (permissions.has("content_ai") || permissions.has("publish")) return "content_lead";
    return "data_viewer";
  }

  function roleScope(roleKey) {
    return {
      administrator: "全部模块",
      content_lead: "产品资料、内容计划、审核与发布",
      performance_marketer: "流量与转化、广告表现",
      data_viewer: "只读访问",
    }[roleKey] || "只读访问";
  }

  function clientUser(user) {
    const roleKey = marketingRoleForUser(user);
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      role: roleKey,
      roleLabel: marketingRoleDefinitions[roleKey].label,
      permissionScope: roleScope(roleKey),
      active: user.active !== false,
      lastActivityAt: user.lastActivityAt || user.updatedAt || user.createdAt || "",
      createdAt: user.createdAt || "",
      updatedAt: user.updatedAt || "",
    };
  }

  function publicRoles() {
    return Object.entries(marketingRoleDefinitions).map(([id, role]) => ({ id, label: role.label, description: role.description, permissionScope: roleScope(id) }));
  }

  function cleanUsername(value) {
    const username = String(value || "").trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new HttpError(422, "账号需为 3-40 位字母、数字、点、下划线或短横线");
    return username;
  }

  function cleanDisplayName(value, fallback) {
    return String(value || "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 80) || fallback;
  }

  function requestedRole(value) {
    const role = String(value || "data_viewer");
    if (!marketingRoleDefinitions[role]) throw new HttpError(422, "请选择有效角色");
    return role;
  }

  function productProgress(catalog) {
    const categoryById = new Map((catalog?.categories || []).map((item) => [item.id, item]));
    return [
      { id: "low-voltage-battery", label: "低压电池", status: "资料待补充", tone: "attention", available: !!categoryById.get("battery-pack") },
      { id: "ecolink", label: "EcoLink 混合逆变器", status: "待审核", tone: "attention", available: !!categoryById.get("hybrid-inverter") },
      { id: "all-in-one", label: "一体机", status: "可开始", tone: "ready", available: !!categoryById.get("all-in-one-ess") },
      { id: "off-grid", label: "离网逆变器", status: "资料待补充", tone: "attention", available: !!categoryById.get("off-grid-inverter") },
    ];
  }

  function overviewPayload() {
    const catalog = readJsonFile(catalogFile, {}) || {};
    const connectors = readArray(connectorFile);
    const audit = readArray(auditFile).filter((item) => item.clientVisible !== false).slice(0, 8);
    const tasks = readArray(taskFile);
    return {
      summary: catalog.summary || { category_count: 0, product_or_variant_node_count: 0, priority_group_count: 0 },
      productProgress: productProgress(catalog),
      connectors,
      recentProgress: audit.map((item) => ({ id: item.id, message: item.publicMessage, createdAt: item.createdAt })),
      taskSummary: {
        active: tasks.filter((item) => !["published", "archived", "cancelled"].includes(item.status)).length,
        pendingReview: tasks.filter((item) => item.status === "in_review").length,
      },
    };
  }

  function sanitizeCatalog() {
    const catalog = readJsonFile(catalogFile, {}) || {};
    return { client: catalog.client, updatedAt: catalog.updated_at, summary: catalog.summary, categories: catalog.categories || [], priorityGroups: catalog.priority_groups || [] };
  }

  function sanitizeSources() {
    const index = readJsonFile(sourceIndexFile, {}) || {};
    return {
      updatedAt: index.updated_at || "",
      documentCount: index.source_package?.pdf_count || 0,
      documents: (index.documents || []).map((doc, indexValue) => ({
        id: `document-${indexValue + 1}`,
        category: doc.category,
        title: path.basename(doc.file || `产品资料 ${indexValue + 1}`),
        pages: doc.pages || 0,
        status: doc.text_status === "embedded_text_extracted" ? "已整理" : doc.text_status === "ocr_unverified" ? "待复核" : "待整理",
        covers: doc.covers || [],
      })),
    };
  }

  function workspaceTarget(relativePath, kind) {
    const normalized = String(relativePath || "").replace(/\\/g, "/");
    if (!normalized || normalized.includes("\0") || path.posix.isAbsolute(normalized)) throw new HttpError(400, "文件路径无效");
    const parts = normalized.split("/");
    if (parts.some((part) => !part || part === "." || part === ".." || part.startsWith("."))) throw new HttpError(400, "文件路径无效");

    const codeAllowlist = new Set(["app-v3.js", "styles.css", "cms-model.js", "cms-pages-v3.js", "product-media.js", "clickable-routes.json", "marketing-os/app.js", "marketing-os/styles.css", "marketing-os/index.html"]);
    const contentPrefixes = ["clients/tervona/data/", "clients/tervona/drafts/", "clients/tervona/content/", "docs/marketing-os/"];
    const ext = path.extname(normalized).toLowerCase();
    if (kind === "code") {
      if (!codeAllowlist.has(normalized) || ![".js", ".css", ".html", ".json"].includes(ext)) throw new HttpError(403, "该代码文件不在允许范围内");
    } else if (!contentPrefixes.some((prefix) => normalized.startsWith(prefix)) || ![".json", ".md", ".txt", ".html"].includes(ext)) {
      throw new HttpError(403, "该内容文件不在允许范围内");
    }

    const target = path.resolve(root, normalized);
    const relative = path.relative(root, target);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new HttpError(403, "文件路径超出工作区");
    let current = root;
    for (const segment of relative.split(path.sep)) {
      current = path.join(current, segment);
      if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new HttpError(403, "工作区不允许符号链接");
    }
    return { target, relative: relative.split(path.sep).join("/") };
  }

  function writeWorkspaceFile(relativePath, kind, content, expectedSha256) {
    const { target, relative } = workspaceTarget(relativePath, kind);
    const text = String(content ?? "");
    if (Buffer.byteLength(text) > MAX_WORKSPACE_BYTES) throw new HttpError(413, "文件内容过大");
    if (path.extname(target).toLowerCase() === ".json") {
      try { JSON.parse(text); } catch { throw new HttpError(422, "JSON 格式不正确"); }
    }

    const exists = fs.existsSync(target);
    const current = exists ? fs.readFileSync(target) : Buffer.alloc(0);
    const currentHash = exists ? sha256(current) : "";
    if (exists && (!expectedSha256 || expectedSha256 !== currentHash)) throw new HttpError(409, "文件已发生变化，请读取最新版本后重试");

    if (exists) {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backup = path.join(clientRoot, "backups", stamp, relative);
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      fs.copyFileSync(target, backup, fs.constants.COPYFILE_EXCL);
    }

    fs.mkdirSync(path.dirname(target), { recursive: true });
    const temp = `${target}.marketing-os-${crypto.randomBytes(6).toString("hex")}.tmp`;
    try {
      fs.writeFileSync(temp, text, { encoding: "utf8", flag: "wx", mode: 0o644 });
      fs.renameSync(temp, target);
    } catch (error) {
      if (fs.existsSync(temp)) fs.unlinkSync(temp);
      throw error;
    }
    return { path: relative, sha256: sha256(Buffer.from(text)), bytes: Buffer.byteLength(text), created: !exists };
  }

  function createCodeProposal(payload, context) {
    const { target, relative } = workspaceTarget(payload.path, "code");
    const content = String(payload.content ?? "");
    if (Buffer.byteLength(content) > MAX_WORKSPACE_BYTES) throw new HttpError(413, "代码变更过大");
    const current = fs.existsSync(target) ? fs.readFileSync(target) : Buffer.alloc(0);
    const currentHash = fs.existsSync(target) ? sha256(current) : "";
    if (fs.existsSync(target) && payload.expectedSha256 !== currentHash) throw new HttpError(409, "代码文件已发生变化，请基于最新版本重新生成变更");
    const proposals = readArray(proposalFile);
    const proposal = {
      id: `proposal-${crypto.randomBytes(8).toString("hex")}`,
      path: relative,
      expectedSha256: currentHash,
      proposedSha256: sha256(Buffer.from(content)),
      content,
      summary: String(payload.summary || "网站代码变更").trim().slice(0, 500),
      status: "proposed",
      createdBy: context.user.id,
      createdAt: new Date().toISOString(),
    };
    proposals.unshift(proposal);
    writeJsonFile(proposalFile, proposals.slice(0, 200));
    appendAudit({ type: "code_proposal", actorId: context.user.id, publicMessage: "一项网站变更已提交审核", clientVisible: true, metadata: { proposalId: proposal.id } });
    return { id: proposal.id, path: proposal.path, status: proposal.status, expectedSha256: proposal.expectedSha256, proposedSha256: proposal.proposedSha256, summary: proposal.summary, createdAt: proposal.createdAt };
  }

  function applyCodeProposal(payload, context) {
    if (process.env.MARKETING_OS_ALLOW_CODE_WRITE !== "1") throw new HttpError(403, "代码直接写入未启用");
    if (payload.confirm !== true) throw new HttpError(422, "必须明确确认代码变更");
    const proposals = readArray(proposalFile);
    const proposal = proposals.find((item) => item.id === payload.id);
    if (!proposal || proposal.status !== "proposed") throw new HttpError(404, "待处理变更不存在");
    const result = writeWorkspaceFile(proposal.path, "code", proposal.content, proposal.expectedSha256);
    proposal.status = "applied";
    proposal.appliedAt = new Date().toISOString();
    proposal.appliedBy = context.user.id;
    writeJsonFile(proposalFile, proposals);
    appendAudit({ type: "code_applied", actorId: context.user.id, publicMessage: "一项已审核的网站变更已应用", clientVisible: true, metadata: { proposalId: proposal.id, path: proposal.path } });
    return result;
  }

  async function handleOverview(req, res, pathname) {
    const context = authContext(req);
    if (req.method === "GET" && pathname === `${API_PREFIX}/overview`) {
      sendJson(res, 200, { ok: true, user: clientUser(context.user), ...overviewPayload() }); return true;
    }
    if (req.method === "GET" && pathname === `${API_PREFIX}/catalog`) {
      requirePermission(context.user, "knowledge");
      sendJson(res, 200, { ok: true, catalog: sanitizeCatalog() }); return true;
    }
    if (req.method === "GET" && pathname === `${API_PREFIX}/sources`) {
      requirePermission(context.user, "knowledge");
      sendJson(res, 200, { ok: true, sources: sanitizeSources() }); return true;
    }
    if (req.method === "GET" && pathname === `${API_PREFIX}/connectors`) {
      requirePermission(context.user, "analytics");
      sendJson(res, 200, { ok: true, connectors: readArray(connectorFile), metricsAvailable: false, message: "授权数据渠道后即可查看自然流量、广告流量和转化表现。" }); return true;
    }
    return false;
  }

  async function handleTasks(req, res, pathname) {
    if (pathname !== `${API_PREFIX}/tasks`) return false;
    const context = authContext(req);
    if (req.method === "GET") {
      requirePermission(context.user, "content_ai");
      sendJson(res, 200, { ok: true, tasks: readArray(taskFile) }); return true;
    }
    if (req.method === "POST") {
      requireMutationAuth(req, context);
      requirePermission(context.user, "content_ai");
      const payload = await readPayload(req);
      const objective = String(payload.objective || "").replace(/[\u0000-\u001f\u007f]/g, "").trim();
      if (objective.length < 10 || objective.length > 2000) throw new HttpError(422, "任务内容需要 10–2000 个字符");
      const tasks = readArray(taskFile);
      const task = { id: `task-${crypto.randomBytes(8).toString("hex")}`, objective, status: "queued", createdBy: context.user.id, createdByName: context.user.displayName || context.user.username, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      tasks.unshift(task);
      writeJsonFile(taskFile, tasks.slice(0, 1000));
      appendAudit({ type: "task_created", actorId: context.user.id, publicMessage: "新的内容任务已进入计划", clientVisible: true, metadata: { taskId: task.id } });
      sendJson(res, 201, { ok: true, task }); return true;
    }
    throw new HttpError(405, "不支持的请求方法");
  }

  async function handleMembers(req, res, pathname) {
    if (pathname !== `${API_PREFIX}/members` && !pathname.startsWith(`${API_PREFIX}/members/`)) return false;
    const context = authContext(req);
    requireAdministrator(context);
    if (req.method === "GET" && pathname === `${API_PREFIX}/members`) {
      sendJson(res, 200, { ok: true, users: readUsers().map(clientUser), roles: publicRoles(), currentUserId: context.user.id, activity: readArray(auditFile).filter((item) => item.type.startsWith("member_")).slice(0, 30).map((item) => ({ id: item.id, message: item.publicMessage, createdAt: item.createdAt })) }); return true;
    }

    requireMutationAuth(req, context);
    const payload = await readPayload(req);
    const users = readUsers();
    if (req.method === "POST" && pathname === `${API_PREFIX}/members`) {
      const username = cleanUsername(payload.username);
      const password = String(payload.password || "");
      if (password.length < 10) throw new HttpError(422, "临时密码至少需要 10 位");
      if (users.some((item) => String(item.username).toLowerCase() === username)) throw new HttpError(409, "账号已存在");
      const roleKey = requestedRole(payload.role);
      const role = marketingRoleDefinitions[roleKey];
      const salt = crypto.randomBytes(24).toString("hex");
      const now = new Date().toISOString();
      const user = {
        id: `user-${crypto.randomBytes(8).toString("hex")}`,
        username,
        displayName: cleanDisplayName(payload.displayName, username),
        role: role.cmsRole,
        marketingRole: roleKey,
        permissions: role.permissions === "all" ? [...permissionKeys] : [...role.permissions],
        active: true,
        salt,
        passwordHash: passwordHash(password, salt),
        createdAt: now,
        updatedAt: now,
      };
      users.push(user);
      writeJsonFile(cmsUsersFile, users);
      appendAudit({ type: "member_created", actorId: context.user.id, publicMessage: `${context.user.displayName || context.user.username} 邀请了 ${user.displayName} 加入团队`, clientVisible: true, metadata: { userId: user.id } });
      sendJson(res, 201, { ok: true, user: clientUser(user) }); return true;
    }

    const userId = decodeURIComponent(pathname.slice(`${API_PREFIX}/members/`.length));
    const index = users.findIndex((item) => item.id === userId);
    if (index < 0) throw new HttpError(404, "成员不存在");

    if (req.method === "PATCH") {
      const roleKey = requestedRole(payload.role || marketingRoleForUser(users[index]));
      const role = marketingRoleDefinitions[roleKey];
      const active = payload.active !== false;
      if (users[index].id === context.user.id && (!active || roleKey !== "administrator")) throw new HttpError(422, "不能停用或降级当前管理员账号");
      Object.assign(users[index], {
        displayName: cleanDisplayName(payload.displayName, users[index].displayName || users[index].username),
        role: role.cmsRole,
        marketingRole: roleKey,
        permissions: role.permissions === "all" ? [...permissionKeys] : [...role.permissions],
        active,
        updatedAt: new Date().toISOString(),
      });
      if (payload.password) {
        if (String(payload.password).length < 10) throw new HttpError(422, "新密码至少需要 10 位");
        users[index].salt = crypto.randomBytes(24).toString("hex");
        users[index].passwordHash = passwordHash(payload.password, users[index].salt);
      }
      if (!users.some((item) => item.role === "super_admin" && item.active !== false)) throw new HttpError(422, "必须保留至少一个已启用管理员");
      writeJsonFile(cmsUsersFile, users);
      appendAudit({ type: "member_updated", actorId: context.user.id, publicMessage: `${context.user.displayName || context.user.username} 更新了 ${users[index].displayName} 的权限`, clientVisible: true, metadata: { userId } });
      sendJson(res, 200, { ok: true, user: clientUser(users[index]) }); return true;
    }

    if (req.method === "DELETE") {
      if (userId === context.user.id) throw new HttpError(422, "不能删除当前登录账号");
      const remaining = users.filter((item) => item.id !== userId);
      if (!remaining.some((item) => item.role === "super_admin" && item.active !== false)) throw new HttpError(422, "必须保留至少一个已启用管理员");
      const removed = users[index];
      writeJsonFile(cmsUsersFile, remaining);
      appendAudit({ type: "member_deleted", actorId: context.user.id, publicMessage: `${context.user.displayName || context.user.username} 从团队中移除了 ${removed.displayName || removed.username}`, clientVisible: true, metadata: { userId } });
      sendJson(res, 200, { ok: true }); return true;
    }
    throw new HttpError(405, "不支持的请求方法");
  }

  async function handleWorkspace(req, res, pathname, parsed) {
    if (pathname !== `${API_PREFIX}/workspace/file` && pathname !== `${API_PREFIX}/code/proposals` && pathname !== `${API_PREFIX}/code/apply`) return false;
    const context = authContext(req);
    requireInternalAccess(context);

    if (pathname === `${API_PREFIX}/workspace/file` && req.method === "GET") {
      const kind = parsed.searchParams.get("kind") === "code" ? "code" : "content";
      const resolved = workspaceTarget(parsed.searchParams.get("path"), kind);
      if (!fs.existsSync(resolved.target) || !fs.statSync(resolved.target).isFile()) throw new HttpError(404, "文件不存在");
      const content = fs.readFileSync(resolved.target);
      if (content.length > MAX_WORKSPACE_BYTES) throw new HttpError(413, "文件过大");
      sendJson(res, 200, { ok: true, file: { path: resolved.relative, kind, content: content.toString("utf8"), sha256: sha256(content), bytes: content.length } }); return true;
    }

    requireMutationAuth(req, context);
    const payload = await readPayload(req);
    if (pathname === `${API_PREFIX}/workspace/file` && req.method === "PUT") {
      const kind = payload.kind === "code" ? "code" : "content";
      if (kind === "code") {
        const proposal = createCodeProposal(payload, context);
        sendJson(res, 202, { ok: true, proposal, message: "代码变更已进入审核队列" }); return true;
      }
      const result = writeWorkspaceFile(payload.path, "content", payload.content, payload.expectedSha256 || "");
      appendAudit({ type: "content_file_updated", actorId: context.user.id, publicMessage: String(payload.publicMessage || "网站内容资料已更新").slice(0, 180), clientVisible: true, metadata: { path: result.path, sha256: result.sha256 } });
      sendJson(res, 200, { ok: true, file: result }); return true;
    }
    if (pathname === `${API_PREFIX}/code/proposals` && req.method === "POST") {
      const proposal = createCodeProposal(payload, context);
      sendJson(res, 202, { ok: true, proposal }); return true;
    }
    if (pathname === `${API_PREFIX}/code/apply` && req.method === "POST") {
      const result = applyCodeProposal(payload, context);
      sendJson(res, 200, { ok: true, file: result }); return true;
    }
    throw new HttpError(405, "不支持的请求方法");
  }

  return async function handleMarketingOsApi(req, res, parsed) {
    if (!parsed.pathname.startsWith(`${API_PREFIX}/`)) return false;
    try {
      if (await handleOverview(req, res, parsed.pathname)) return true;
      if (await handleTasks(req, res, parsed.pathname)) return true;
      if (await handleMembers(req, res, parsed.pathname)) return true;
      if (await handleWorkspace(req, res, parsed.pathname, parsed)) return true;
      throw new HttpError(404, "请求的功能不存在");
    } catch (error) {
      const status = error.status || 500;
      sendJson(res, status, { ok: false, authenticated: status === 401 ? false : undefined, error: status >= 500 ? "服务暂时不可用" : error.message });
      return true;
    }
  };
}

module.exports = { createMarketingOsHandler, marketingRoleDefinitions };
