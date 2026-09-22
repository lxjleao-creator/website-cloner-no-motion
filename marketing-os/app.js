(function () {
  "use strict";

  const state = {
    csrfToken: "",
    user: null,
    overview: null,
    catalog: null,
    sources: null,
    tasks: null,
    members: null,
    section: "overview",
  };

  const navItems = [
    { id: "overview", label: "运营总览", icon: "grid", roles: ["administrator", "content_lead", "performance_marketer", "data_viewer"] },
    { id: "workbench", label: "AI 内容工作台", icon: "sparkles", roles: ["administrator", "content_lead"] },
    { id: "products", label: "产品资料", icon: "folder", roles: ["administrator", "content_lead", "data_viewer"] },
    { id: "plan", label: "内容计划", icon: "calendar", roles: ["administrator", "content_lead", "performance_marketer"] },
    { id: "traffic", label: "流量与转化", icon: "trend", roles: ["administrator", "performance_marketer", "data_viewer"] },
    { id: "ads", label: "广告表现", icon: "megaphone", roles: ["administrator", "performance_marketer", "data_viewer"] },
    { id: "health", label: "网站健康", icon: "shield", roles: ["administrator", "content_lead", "performance_marketer", "data_viewer"] },
    { id: "review", label: "审核与发布", icon: "check", roles: ["administrator", "content_lead"] },
    { id: "members", label: "成员与权限", icon: "users", roles: ["administrator"] },
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const icon = (name) => `<svg aria-hidden="true"><use href="#icon-${name}"></use></svg>`;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
  }

  function toast(message, type = "success") {
    const element = $("#toast");
    element.textContent = message;
    element.className = `toast visible${type === "error" ? " error" : ""}`;
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => { element.className = "toast"; }, 3200);
  }

  async function request(url, options = {}) {
    const method = options.method || "GET";
    const headers = { ...(options.headers || {}) };
    if (method !== "GET" && method !== "HEAD" && state.csrfToken) headers["x-csrf-token"] = state.csrfToken;
    if (options.body && typeof options.body !== "string") {
      headers["content-type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }
    const response = await fetch(url, { credentials: "same-origin", ...options, method, headers });
    const payload = await response.json().catch(() => ({ ok: false, error: "服务返回了无法识别的结果" }));
    if (response.status === 401) {
      showLogin();
      throw new Error("登录已失效，请重新登录");
    }
    if (!response.ok || payload.ok === false) throw new Error(payload.error || "操作没有完成");
    return payload;
  }

  async function loadSession() {
    const response = await fetch("/admin/api.php?action=session", { credentials: "same-origin" });
    const payload = await response.json();
    if (!payload.authenticated) { showLogin(); return; }
    state.csrfToken = payload.csrfToken || "";
    await loadConsole();
  }

  async function loadConsole() {
    const payload = await request("/api/marketing-os/v1/overview");
    state.user = payload.user;
    state.overview = payload;
    $("#login-view").hidden = true;
    $("#console-shell").hidden = false;
    $("#user-name").textContent = state.user.displayName;
    $("#user-avatar").textContent = (state.user.displayName || "T").trim().slice(0, 1).toUpperCase();
    $("#user-role").textContent = state.user.roleLabel;
    renderNav();
    await setSection("overview");
  }

  function showLogin() {
    state.user = null;
    state.overview = null;
    $("#console-shell").hidden = true;
    $("#login-view").hidden = false;
    window.setTimeout(() => $("#login-form input")?.focus(), 0);
  }

  function renderNav() {
    const available = navItems.filter((item) => item.roles.includes(state.user.role));
    $("#primary-nav").innerHTML = available.map((item) => `
      <button type="button" class="nav-button${item.id === state.section ? " active" : ""}" data-section="${item.id}">
        ${icon(item.icon)}<span>${item.label}</span>
      </button>`).join("");
    $$("[data-section]", $("#primary-nav")).forEach((button) => button.addEventListener("click", () => setSection(button.dataset.section)));
  }

  function loading() {
    $("#page-content").innerHTML = '<div class="loading">正在准备内容…</div>';
  }

  async function setSection(section) {
    const item = navItems.find((entry) => entry.id === section && entry.roles.includes(state.user.role));
    if (!item) return;
    state.section = section;
    $("#page-title").textContent = item.label;
    renderNav();
    $("#sidebar").classList.remove("open");
    $("#mobile-nav-backdrop").hidden = true;
    $("#mobile-menu").setAttribute("aria-expanded", "false");
    loading();
    try {
      if (section === "overview") renderOverview();
      if (section === "workbench") await renderWorkbench();
      if (section === "products") await renderProducts();
      if (section === "plan") await renderPlan();
      if (section === "traffic") renderChannelPage("流量与转化", "授权自然搜索和网站分析数据后，可以在这里查看访问来源、页面表现、询盘路径和转化趋势。", ["website", "organic-search"]);
      if (section === "ads") renderChannelPage("广告表现", "授权广告账户后，可以统一查看渠道花费、有效询盘和落地页表现。未接入前不会显示推测数据。", ["google-ads", "meta-ads"]);
      if (section === "health") renderHealth();
      if (section === "review") await renderReview();
      if (section === "members") await renderMembers();
      $("#page-content").focus({ preventScroll: true });
    } catch (error) {
      renderError(error.message);
    }
  }

  function renderError(message) {
    $("#page-content").innerHTML = `<section class="section-frame empty-state">${icon("shield")}<div><h3>暂时无法显示</h3><p>${escapeHtml(message)}</p><button class="button" type="button" data-retry>重试</button></div></section>`;
    $("[data-retry]")?.addEventListener("click", () => setSection(state.section));
  }

  function renderOverview() {
    const data = state.overview;
    const summary = data.summary || {};
    $("#page-content").innerHTML = `
      <section class="command-panel">
        <h2>今天想推进什么？</h2>
        <form id="overview-command-form">
          <label class="sr-only" for="overview-command">任务说明</label>
          <textarea id="overview-command" name="objective" placeholder="例如：为 EcoLink 6kW 产品准备英文详情页，并提交审核" required minlength="10"></textarea>
          <div class="command-actions"><button class="button button-primary" type="submit">创建任务</button></div>
        </form>
      </section>
      <div class="overview-grid">
        <section class="section-frame">
          <header class="section-header"><h2>网站内容进度</h2></header>
          <div class="summary-strip">
            <div class="summary-item">${icon("box")}<span><strong>${Number(summary.category_count || 0)}</strong> 个产品大类</span></div>
            <div class="summary-item">${icon("folder")}<span><strong>${Number(summary.product_or_variant_node_count || 0)}</strong> 个产品/规格节点</span></div>
            <div class="summary-item">${icon("check")}<span><strong>${Number(summary.priority_group_count || 0)}</strong> 个优先组</span></div>
          </div>
          <table class="data-table product-progress-table">
            <thead><tr><th>产品大类</th><th>进度状态</th><th>待处理</th></tr></thead>
            <tbody>${data.productProgress.map((item) => `<tr><td><div class="product-cell"><span class="row-icon">${icon("box")}</span>${escapeHtml(item.label)}</div></td><td><span class="status ${item.tone}">${escapeHtml(item.status)}</span></td><td>—</td></tr>`).join("")}</tbody>
          </table>
          <footer class="section-footer"><button type="button" data-go="products">查看全部内容&nbsp; ›</button></footer>
        </section>
        <div class="right-stack">
          <section class="section-frame">
            <header class="section-header"><h2>渠道状态</h2></header>
            ${renderConnectorList(data.connectors)}
          </section>
          <section class="section-frame">
            <header class="section-header"><h2>最近进展</h2></header>
            <ul class="activity-list">${data.recentProgress.map((item) => `<li>${icon("file")}<span>${escapeHtml(item.message)}</span><time datetime="${escapeHtml(item.createdAt)}">${formatDate(item.createdAt)}</time></li>`).join("") || "<li><span>暂无进展记录</span></li>"}</ul>
          </section>
        </div>
      </div>`;
    $("#overview-command-form").addEventListener("submit", createTaskFromForm);
    $$('[data-go]').forEach((button) => button.addEventListener("click", () => setSection(button.dataset.go)));
  }

  function renderConnectorList(connectors, ids = null) {
    const filtered = ids ? connectors.filter((item) => ids.includes(item.id)) : connectors;
    return `<ul class="connector-list">${filtered.map((item) => `<li>${icon("link")}<span>${escapeHtml(item.label)}</span><span class="connector-state${item.status === "connected" ? " connected" : ""}"><i class="status-dot"></i>${escapeHtml(item.statusLabel)}</span>${icon("chevron")}</li>`).join("")}</ul>`;
  }

  async function createTaskFromForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const objective = form.elements.objective.value.trim();
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = "正在创建…";
    try {
      await request("/api/marketing-os/v1/tasks", { method: "POST", body: { objective } });
      form.reset();
      state.tasks = null;
      const refreshed = await request("/api/marketing-os/v1/overview");
      state.overview = refreshed;
      toast("任务已创建，并进入内容计划");
      if (state.section === "overview") renderOverview();
    } catch (error) {
      toast(error.message, "error");
    } finally {
      submit.disabled = false;
      submit.textContent = "创建任务";
    }
  }

  async function ensureTasks() {
    if (!state.tasks) state.tasks = (await request("/api/marketing-os/v1/tasks")).tasks;
    return state.tasks;
  }

  async function renderWorkbench() {
    const tasks = await ensureTasks();
    $("#page-content").innerHTML = `
      <div class="page-head"><div><h2>AI 内容工作台</h2><p>描述你想完成的业务结果。系统会整理资料、生成可审阅的内容，并在发布前等待确认。</p></div></div>
      <section class="command-panel">
        <h2>创建内容任务</h2>
        <form id="workbench-form"><textarea name="objective" placeholder="例如：为 EcoLink 6kW 产品准备英文详情页，并提交审核" required minlength="10"></textarea><div class="command-actions"><button class="button button-primary" type="submit">创建任务</button></div></form>
      </section>
      <section class="section-frame" style="margin-top:18px">
        <header class="section-header"><h2>最近任务</h2><span>${tasks.length} 项</span></header>
        ${renderTaskList(tasks)}
      </section>`;
    $("#workbench-form").addEventListener("submit", async (event) => { await createTaskFromForm(event); if (state.section === "workbench") { await renderWorkbench(); } });
  }

  function renderTaskList(tasks) {
    if (!tasks.length) return `<div class="empty-state"><div>${icon("sparkles")}<h3>还没有内容任务</h3><p>在上方描述你想推进的页面、产品或市场内容。</p></div></div>`;
    const labels = { queued: "已进入计划", in_progress: "进行中", in_review: "待审核", approved: "已批准", published: "已发布" };
    return `<ul class="task-list">${tasks.map((task) => `<li><span class="row-icon">${icon("sparkles")}</span><div class="task-copy"><strong>${escapeHtml(task.objective)}</strong><p>${escapeHtml(labels[task.status] || task.status)}</p></div><time datetime="${escapeHtml(task.createdAt)}">${formatDate(task.createdAt)}</time></li>`).join("")}</ul>`;
  }

  async function renderProducts() {
    if (!state.catalog) state.catalog = (await request("/api/marketing-os/v1/catalog")).catalog;
    if (!state.sources) state.sources = (await request("/api/marketing-os/v1/sources")).sources;
    const catalog = state.catalog;
    $("#page-content").innerHTML = `
      <div class="page-head"><div><h2>产品资料</h2><p>查看当前产品结构和资料整理状态。只有经过确认的信息才会进入正式网站内容。</p></div></div>
      <div class="content-layout">
        <section class="section-frame">
          <header class="section-header"><h2>产品结构</h2><span>${Number(catalog.summary?.category_count || 0)} 个大类</span></header>
          <table class="data-table"><thead><tr><th>产品大类</th><th>当前结构</th><th>优先级</th></tr></thead><tbody>
            ${(catalog.categories || []).map((category) => {
              const groups = (category.groups || []).map((group) => group.name_zh || group.name || group.id).join("、");
              const priority = category.priority || (category.groups || []).some((group) => group.priority);
              return `<tr><td><div class="product-cell"><span class="row-icon">${icon("box")}</span>${escapeHtml(category.name_zh || category.name || category.id)}</div></td><td class="category-groups">${escapeHtml(groups || "具体结构待补充")}</td><td>${priority ? '<span class="priority-marker">优先</span>' : "—"}</td></tr>`;
            }).join("")}
          </tbody></table>
        </section>
        <section class="section-frame">
          <header class="section-header"><h2>已整理资料</h2><span>${Number(state.sources.documentCount || 0)} 份</span></header>
          <ul class="document-list">${(state.sources.documents || []).map((doc) => `<li>${icon("file")}<div><strong>${escapeHtml(doc.title)}</strong><small>${escapeHtml(doc.status)} · ${Number(doc.pages || 0)} 页</small></div></li>`).join("")}</ul>
        </section>
      </div>`;
  }

  async function renderPlan() {
    const tasks = await ensureTasks();
    $("#page-content").innerHTML = `
      <div class="page-head"><div><h2>内容计划</h2><p>集中查看已提出的内容任务、当前状态和下一步审核安排。</p></div>${state.user.role === "performance_marketer" ? "" : '<button class="button button-primary" type="button" data-new-task>创建任务</button>'}</div>
      <section class="section-frame"><header class="section-header"><h2>任务队列</h2><span>${tasks.length} 项</span></header>${renderTaskList(tasks)}</section>`;
    $("[data-new-task]")?.addEventListener("click", () => setSection("workbench"));
  }

  function renderChannelPage(title, description, connectorIds) {
    const connectors = state.overview.connectors || [];
    $("#page-content").innerHTML = `
      <div class="page-head"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div></div>
      <section class="section-frame">
        <header class="section-header"><h2>渠道状态</h2></header>
        ${renderConnectorList(connectors, connectorIds)}
        <div class="empty-state"><div>${icon("trend")}<h3>等待数据授权</h3><p>完成授权后，这里会显示经过核验的渠道数据和优化建议，不会用估算值代替真实表现。</p></div></div>
      </section>`;
  }

  function renderHealth() {
    const connectors = state.overview.connectors || [];
    $("#page-content").innerHTML = `
      <div class="page-head"><div><h2>网站健康</h2><p>查看网站可用性、页面质量、收录和性能状态。外部监控将在相应渠道授权后启用。</p></div></div>
      <section class="section-frame">
        <header class="section-header"><h2>监控状态</h2></header>
        ${renderConnectorList(connectors, ["website", "cloudflare"])}
        <div class="empty-state"><div>${icon("shield")}<h3>基础网站连接正常</h3><p>接入 Cloudflare 和自然搜索数据后，可继续监控可用性、抓取、核心页面和性能变化。</p></div></div>
      </section>`;
  }

  async function renderReview() {
    const tasks = await ensureTasks();
    const reviewTasks = tasks.filter((task) => ["in_review", "approved", "queued"].includes(task.status));
    $("#page-content").innerHTML = `
      <div class="page-head"><div><h2>审核与发布</h2><p>在发布前确认页面内容、影响范围和版本。所有正式发布都保留记录并支持回退。</p></div></div>
      <section class="section-frame"><header class="section-header"><h2>待处理内容</h2><span>${reviewTasks.length} 项</span></header>${renderTaskList(reviewTasks)}</section>`;
  }

  async function renderMembers() {
    state.members = await request("/api/marketing-os/v1/members");
    const data = state.members;
    $("#page-content").innerHTML = `
      <div class="page-head"><div><h2>成员与权限</h2><p>管理团队成员可以查看、编辑、审核和发布的内容。</p></div><button class="button button-primary" type="button" data-invite>${icon("plus")} 邀请成员</button></div>
      <section class="section-frame members-table-wrap">
        <table class="data-table members-table"><thead><tr><th>成员</th><th>角色</th><th>权限范围</th><th>状态</th><th>最近活动</th><th>操作</th></tr></thead><tbody>
          ${data.users.map((user) => `<tr data-member-row="${escapeHtml(user.id)}"><td><div class="member-cell"><span class="avatar">${escapeHtml((user.displayName || "T").slice(0, 1))}</span><div><strong>${escapeHtml(user.displayName)}</strong><br><small>${escapeHtml(user.username)}</small></div></div></td><td><select data-role ${user.id === data.currentUserId ? "disabled" : ""}>${data.roles.map((role) => `<option value="${role.id}" ${role.id === user.role ? "selected" : ""}>${escapeHtml(role.label)}</option>`).join("")}</select></td><td>${escapeHtml(user.permissionScope)}</td><td><span class="status ${user.active ? "active" : "inactive"}">${user.active ? "已启用" : "已停用"}</span> <label class="toggle" aria-label="${user.active ? "停用" : "启用"} ${escapeHtml(user.displayName)}"><input type="checkbox" data-active ${user.active ? "checked" : ""} ${user.id === data.currentUserId ? "disabled" : ""}><span></span></label></td><td>${formatDate(user.lastActivityAt)}</td><td><div class="member-actions"><button type="button" data-edit>管理</button><button type="button" data-delete ${user.id === data.currentUserId ? "disabled" : ""} aria-label="删除 ${escapeHtml(user.displayName)}">${icon("trash")}</button></div></td></tr>`).join("")}
        </tbody></table>
      </section>
      <div class="permissions-grid">
        <section class="section-frame"><header class="section-header"><h2>角色说明</h2></header><ul class="role-list">${data.roles.map((role) => `<li><strong>${escapeHtml(role.label)}</strong><p>${escapeHtml(role.description)}</p></li>`).join("")}</ul></section>
        <section class="section-frame"><header class="section-header"><h2>权限变更记录</h2></header><ul class="activity-list">${data.activity.map((item) => `<li>${icon("edit")}<span>${escapeHtml(item.message)}</span><time datetime="${escapeHtml(item.createdAt)}">${formatDate(item.createdAt)}</time></li>`).join("") || "<li><span>暂无权限变更记录</span></li>"}</ul></section>
      </div>`;
    $("[data-invite]").addEventListener("click", openInviteMember);
    $$('[data-member-row]').forEach((row) => bindMemberRow(row, data.users.find((user) => user.id === row.dataset.memberRow)));
  }

  function bindMemberRow(row, user) {
    $("[data-role]", row)?.addEventListener("change", async (event) => updateMember(user.id, { role: event.target.value, active: user.active }));
    $("[data-active]", row)?.addEventListener("change", async (event) => updateMember(user.id, { role: user.role, active: event.target.checked }));
    $("[data-edit]", row)?.addEventListener("click", () => openEditMember(user));
    $("[data-delete]", row)?.addEventListener("click", () => openDeleteMember(user));
  }

  async function updateMember(id, patch) {
    try {
      await request(`/api/marketing-os/v1/members/${encodeURIComponent(id)}`, { method: "PATCH", body: patch });
      toast("成员权限已更新");
      await renderMembers();
    } catch (error) {
      toast(error.message, "error");
      await renderMembers();
    }
  }

  function openModal(title, description, body) {
    $("#modal-title").textContent = title;
    $("#modal-description").textContent = description || "";
    $("#modal-body").innerHTML = body;
    $("#modal").hidden = false;
    window.setTimeout(() => $("#modal-body input, #modal-body select, #modal-body button")?.focus(), 0);
  }

  function closeModal() {
    $("#modal").hidden = true;
    $("#modal-body").innerHTML = "";
  }

  function roleOptions(selected) {
    return state.members.roles.map((role) => `<option value="${role.id}" ${selected === role.id ? "selected" : ""}>${escapeHtml(role.label)}</option>`).join("");
  }

  function openInviteMember() {
    openModal("邀请成员", "创建账号并设置初始角色。", `
      <form id="invite-form" class="form-grid">
        <label>成员名称<input name="displayName" maxlength="80" required></label>
        <label>登录账号<input name="username" autocomplete="off" pattern="[A-Za-z0-9._-]{3,40}" required></label>
        <label>角色<select name="role">${roleOptions("data_viewer")}</select></label>
        <label>临时密码<input name="password" type="password" minlength="10" autocomplete="new-password" required></label>
        <p class="form-error" data-form-error role="alert"></p>
        <div class="form-actions"><button type="button" class="button" data-close-modal>取消</button><button type="submit" class="button button-primary">创建成员</button></div>
      </form>`);
    $("#invite-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const payload = Object.fromEntries(new FormData(form));
      try {
        await request("/api/marketing-os/v1/members", { method: "POST", body: payload });
        closeModal(); toast("成员已创建"); await renderMembers();
      } catch (error) { $("[data-form-error]", form).textContent = error.message; }
    });
  }

  function openEditMember(user) {
    openModal("管理成员", `更新 ${user.displayName} 的角色、状态或密码。`, `
      <form id="edit-member-form" class="form-grid">
        <label>成员名称<input name="displayName" value="${escapeHtml(user.displayName)}" maxlength="80" required></label>
        <label>角色<select name="role" ${user.id === state.members.currentUserId ? "disabled" : ""}>${roleOptions(user.role)}</select></label>
        <label>账号状态<select name="active" ${user.id === state.members.currentUserId ? "disabled" : ""}><option value="true" ${user.active ? "selected" : ""}>已启用</option><option value="false" ${!user.active ? "selected" : ""}>已停用</option></select></label>
        <label>新密码（可留空）<input name="password" type="password" minlength="10" autocomplete="new-password"></label>
        <p class="form-error" data-form-error role="alert"></p>
        <div class="form-actions"><button type="button" class="button" data-close-modal>取消</button><button type="submit" class="button button-primary">保存变更</button></div>
      </form>`);
    $("#edit-member-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const values = Object.fromEntries(new FormData(form));
      const payload = { displayName: values.displayName, role: values.role || user.role, active: values.active ? values.active === "true" : user.active };
      if (values.password) payload.password = values.password;
      try { await request(`/api/marketing-os/v1/members/${encodeURIComponent(user.id)}`, { method: "PATCH", body: payload }); closeModal(); toast("成员信息已更新"); await renderMembers(); }
      catch (error) { $("[data-form-error]", form).textContent = error.message; }
    });
  }

  function openDeleteMember(user) {
    openModal("删除成员", "删除后该成员将无法再登录。", `<p class="confirm-copy">确认从 Tervona 团队中删除“${escapeHtml(user.displayName)}”吗？此操作会记录在权限变更历史中。</p><div class="form-actions" style="display:flex;justify-content:flex-end;gap:10px"><button class="button" type="button" data-close-modal>取消</button><button class="button button-danger" type="button" data-confirm-delete>删除成员</button></div>`);
    $("[data-confirm-delete]").addEventListener("click", async () => {
      try { await request(`/api/marketing-os/v1/members/${encodeURIComponent(user.id)}`, { method: "DELETE", body: {} }); closeModal(); toast("成员已删除"); await renderMembers(); }
      catch (error) { toast(error.message, "error"); }
    });
  }

  $("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const error = $("#login-error");
    error.textContent = "";
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true; button.textContent = "正在登录…";
    try {
      const payload = await request("/admin/api.php?action=login", { method: "POST", body: Object.fromEntries(new FormData(form)) });
      state.csrfToken = payload.csrfToken || "";
      form.reset();
      await loadConsole();
    } catch (caught) { error.textContent = caught.message; }
    finally { button.disabled = false; button.textContent = "登录"; }
  });

  $("#logout-button").addEventListener("click", async () => {
    try { await request("/admin/api.php?action=logout", { method: "POST", body: {} }); } catch (_) { /* Session may already be gone. */ }
    state.csrfToken = "";
    showLogin();
  });

  $("#user-menu-button").addEventListener("click", () => {
    const menu = $("#user-menu");
    menu.hidden = !menu.hidden;
    $("#user-menu-button").setAttribute("aria-expanded", String(!menu.hidden));
  });

  $("#mobile-menu").addEventListener("click", () => {
    const sidebar = $("#sidebar");
    const open = !sidebar.classList.contains("open");
    sidebar.classList.toggle("open", open);
    $("#mobile-nav-backdrop").hidden = !open;
    $("#mobile-menu").setAttribute("aria-expanded", String(open));
  });
  $("#mobile-nav-backdrop").addEventListener("click", () => {
    $("#sidebar").classList.remove("open");
    $("#mobile-nav-backdrop").hidden = true;
    $("#mobile-menu").setAttribute("aria-expanded", "false");
    $("#mobile-menu").focus();
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal]")) closeModal();
    if (!event.target.closest("#user-menu") && !event.target.closest("#user-menu-button")) { $("#user-menu").hidden = true; $("#user-menu-button").setAttribute("aria-expanded", "false"); }
  });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !$("#modal").hidden) closeModal(); });

  loadSession().catch(() => showLogin());
})();
