window.CRAWLED_PAGES_FALLBACK = [];
window.CRAWLED_PAGES = window.CRAWLED_PAGES || window.CRAWLED_PAGES_FALLBACK;
const ASSET = "/assets";
const FALLBACK_SCENE = "/assets/tervona-products/category-scene-tervona-v2.png";
const SITE_BASE_PATH = String(window.__SITE_BASE_PATH__ || "").replace(/\/+$/, "");

function stripSiteBasePath(pathname) {
  const value = String(pathname || "/");
  if (!SITE_BASE_PATH) return value;
  if (value === SITE_BASE_PATH) return "/";
  return value.startsWith(`${SITE_BASE_PATH}/`) ? value.slice(SITE_BASE_PATH.length) || "/" : value;
}

function withSiteBaseUrls(markup) {
  if (!SITE_BASE_PATH) return markup;
  return String(markup).replace(/(["'(=])\/(assets|uploads)\//g, `$1${SITE_BASE_PATH}/$2/`);
}

const data = {
  nav: [
    {
      label: "Products",
      href: "#products",
      intro: "Reliable Products that Meet Diverse Needs",
      columns: [
        {
          title: "Product Categories",
          links: [
            ["Low-Voltage Batteries", "/products/low-voltage-battery"],
            ["Hybrid Inverters", "/products/hybrid-inverter"],
            ["Off-Grid Inverters", "/products/off-grid-inverter"],
            ["All-in-One Energy Storage", "/products/all-in-one-ess"],
          ],
        },
        {
          title: "Popular Products",
          links: [
            ["Residential Energy Storage", "#detail-residential"],
            ["Commercial Storage", "#detail-commercial"],
            ["EV Charging", "#detail-ev-charging"],
          ],
        },
      ],
    },
    { label: "Company", href: "#company" },
    { label: "Downloads", href: "#downloads" },
    {
      label: "Partner",
      href: "/partner",
      columns: [],
    },
  ],
  hero: [
    {
      title: "Smart Energy for Every Home",
      text: "Residential energy storage, hybrid inverters and integrated solar solutions.",
      image: "/assets/tervona-home-20260922/home-hero-pc.jpg",
      mobileImage: "/assets/tervona-home-20260922/home-hero-mobile.jpg",
    },
  ],
  solutions: [
    {
      title: "Residential",
      text: "Smart energy storage for homes, solar roofs and EV charging.",
      image: "/assets/tervona-home-20260922/home-solutions-pc.jpg",
    },
    {
      title: "Commercial & Industrial",
      text: "Scalable products for business sites, retail assets and facilities.",
      image: "/assets/tervona-products-home-banner-v2.png",
    },
    {
      title: "Utility Scale",
      text: "Reliable power conversion and storage across wider project sites.",
      image: "/assets/tervona-downloads-hero-v2.png",
    },
    {
      title: "EV Charging",
      text: "Connected charging hardware designed for smarter mobility.",
      image: "/assets/tervona-partner-home-hero-v2.png",
    },
  ],
  products: [
    {
      id: "ev-chargers",
      label: "EV Chargers",
      stat: 95000,
      statFormat: "plain",
      statText: "Global EV charger sold over past three years",
      image: "/assets/tervona-products/catalog-v2/aio-500w-1kwh-cutout.png",
    },
    {
      id: "batteries",
      label: "Batteries",
      stat: 1500000,
      statText: "Global battery installed over past three years",
      image: "/assets/tervona-products/catalog-v2/battery-5-kwh-cutout.png",
    },
    {
      id: "pv-inverters",
      label: "PV Inverters",
      stat: 950000,
      statText: "Global PV inverter installed over the past three years",
      image: "/assets/tervona-products/catalog-v2/off-grid-single-phase-cutout.png",
    },
    {
      id: "hybrid-inverters",
      label: "Hybrid Inverters",
      stat: 950000,
      statText: "Global hybrid inverter installed over past three years",
      image: "/assets/tervona-products/catalog-v2/ecolink-series-cutout.png",
    },
  ],
  frames: [],
  cases: [
    ["Residential Solar Home", "Australia", "Residential solar and energy storage concept", "/assets/tervona-products/core-advantages-scene-v1.png"],
    ["Integrated Home Energy", "Australia", "Tervona residential energy solution", "/assets/tervona-products-home-banner-v2.png"],
    ["Installation Partnership", "Australia", "Installer planning and project support", "/assets/tervona-partner-home-hero-v2.png"],
    ["Energy System Planning", "Australia", "System design and technical documentation", "/assets/tervona-downloads-hero-v2.png"],
  ],
  news: [],
};

let heroIndex = 0;
let lastHeroInteractionAt = 0;
let solutionIndex = 0;
let caseIndex = 0;
let productReferenceIndex = 0;
let newsIndex = 0;
const PUBLIC_NEWS_ENABLED = false;
let route = location.hash || "#home";
let lastScrollY = window.scrollY;
let scrollRaf = 0;
let sourceRevealNodes = [];
let sourceRevealObserver = null;
let cmsActiveSection = "dashboard";
const CMS_SECTION_IDS = new Set(["dashboard", "pages", "menus", "products", "categories", "news", "downloads", "submissions", "seo", "media", "settings", "users", "roadmap"]);
let cmsEditing = { products: "", news: "", pages: "", templates: "", downloads: "" };
let cmsUploadOpen = false;
let cmsEditingMediaId = "";
let cmsDownloadCategoriesOpen = false;
let cmsVisualEditorOpen = false;
let cmsVisualSelected = "hero-title";
let cmsVisualTab = "content";
let cmsVisualDevice = "desktop";
let cmsVisualMediaOpen = false;
let cmsPageBuilderOpen = false;
let cmsPageBuilderPageId = "";
let cmsPageBuilderSelectedId = "";
let cmsPageBuilderDevice = "desktop";
const CMS_ADMIN_STORAGE_KEY = "tervona-cms-admin-state-v2";
const CMS_API_URL = SITE_BASE_PATH ? `${SITE_BASE_PATH}/preview-api.json` : "/admin/api.php";
let cmsRemoteState = null;
let cmsBackendLoadStarted = false;
let cmsBackendStatus = "Connecting";
let cmsBackendSource = "local draft";
const CMS_PERMISSION_OPTIONS = [
  ["pages", "页面"], ["menus", "导航"], ["products", "产品"], ["categories", "分类"], ["news", "新闻"],
  ["downloads", "下载"], ["submissions", "询盘"], ["seo", "SEO"], ["media", "媒体"], ["settings", "网站设置"],
];
let cmsAuthStatus = "checking";
let cmsAuthUser = null;
let cmsAuthCsrf = "";
let cmsAuthError = "";
let cmsAuthCheckStarted = false;
let cmsManagedUsers = [];
let cmsUsersStatus = "idle";
let cmsUsersError = "";
let cmsSubmissions = [];
let cmsSubmissionsStatus = "idle";
let cmsSubmissionsError = "";
let cmsViewingSubmissionId = "";
const DEFAULT_PUBLIC_FORMS = [{
  id: "form-contact-us", name: "Contact Us", slug: "contact-us", title: "Tell us how we can help",
  description: "Share your project, product selection or technical support requirements and the appropriate team can follow up.",
  submitLabel: "Submit", successMessage: "Thank you. Your enquiry has been received. Our team will follow up shortly.", status: "active",
  fields: [
    { id: "field-first-name", key: "firstName", label: "First Name", type: "text", required: true, placeholder: "Please enter your name", width: "half", includeInEmail: true, options: [] },
    { id: "field-last-name", key: "lastName", label: "Last Name", type: "text", required: true, placeholder: "Please enter your name", width: "half", includeInEmail: true, options: [] },
    { id: "field-email", key: "email", label: "Email", type: "email", required: true, placeholder: "Please enter your Email", width: "half", includeInEmail: true, options: [] },
    { id: "field-phone", key: "phone", label: "Phone", type: "phone", required: true, placeholder: "Please enter your Phone", width: "half", includeInEmail: true, options: [] },
    { id: "field-company", key: "company", label: "Company", type: "text", required: false, placeholder: "Please enter your Company", width: "half", includeInEmail: true, options: [] },
    { id: "field-position", key: "position", label: "Department / Position", type: "text", required: false, placeholder: "Please enter your position", width: "half", includeInEmail: true, options: [] },
    { id: "field-country", key: "country", label: "Country / Region", type: "text", required: true, placeholder: "Please enter your Country/Region", width: "half", includeInEmail: true, options: [] },
    { id: "field-state", key: "state", label: "Province / State", type: "text", required: true, placeholder: "Please enter your Province/State", width: "half", includeInEmail: true, options: [] },
    { id: "field-message", key: "message", label: "Please enter the product you want to know, the selection requirements or more technical advice:", type: "textarea", required: true, placeholder: "Message", width: "full", includeInEmail: true, options: [] },
    { id: "field-consent", key: "consent", label: "I have carefully read and agree to the Privacy Statement.", type: "checkbox", required: true, placeholder: "", width: "full", includeInEmail: false, options: [] },
  ],
}, {
  id: "form-partner", name: "Partner Application", slug: "partner", title: "Start a partnership conversation",
  description: "Choose a partnership model and tell us how you would like to work with Tervona.",
  submitLabel: "Submit application", successMessage: "Thank you. Your partnership application has been received.", status: "active",
  fields: [
    { id: "field-partnership-model", key: "partnershipModel", label: "Partnership Model", type: "select", required: true, placeholder: "Choose a partnership model", width: "full", includeInEmail: true, options: ["Distributor", "Joint Venture", "Installer", "ODM"] },
    { id: "field-partner-name", key: "name", label: "Full Name", type: "text", required: true, placeholder: "Your full name", width: "half", includeInEmail: true, options: [] },
    { id: "field-partner-company", key: "company", label: "Company", type: "text", required: true, placeholder: "Company name", width: "half", includeInEmail: true, options: [] },
    { id: "field-partner-email", key: "email", label: "Work Email", type: "email", required: true, placeholder: "name@company.com", width: "half", includeInEmail: true, options: [] },
    { id: "field-partner-phone", key: "phone", label: "Phone", type: "phone", required: true, placeholder: "Your phone number", width: "half", includeInEmail: true, options: [] },
    { id: "field-partner-country", key: "country", label: "Country / Region", type: "text", required: true, placeholder: "Your market", width: "half", includeInEmail: true, options: [] },
    { id: "field-partner-website", key: "companyWebsite", label: "Company Website", type: "text", required: false, placeholder: "https://", width: "half", includeInEmail: true, options: [] },
    { id: "field-partner-message", key: "message", label: "Market and Capabilities", type: "textarea", required: true, placeholder: "Tell us about your market, capabilities and partnership plans", width: "full", includeInEmail: true, options: [] },
    { id: "field-partner-consent", key: "consent", label: "I have carefully read and agree to the Privacy Statement.", type: "checkbox", required: true, placeholder: "", width: "full", includeInEmail: false, options: [] },
  ],
}];
let publicForms = DEFAULT_PUBLIC_FORMS.map((form) => ({ ...form, fields: form.fields.map((field) => ({ ...field })) }));
let publicFormsStatus = "idle";
let cmsForms = [];
let cmsFormsStatus = "idle";
let cmsFormsError = "";
let cmsActiveFormId = "form-contact-us";
let cmsFormMessage = "";
let cmsMailSettings = { host: "smtp.exmail.qq.com", port: 465, encryption: "ssl", username: "ads@en-plus.com.cn", fromName: "Tervona Website", recipient: "ads@en-plus.com.cn", configured: false };
let cmsMailSettingsStatus = "idle";
let cmsMailSettingsMessage = "";

function markHeroInteraction() {
  lastHeroInteractionAt = Date.now();
}

function icon(name) {
  const map = {
    search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path>',
    globe: '<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3c3 3 3 15 0 18"></path><path d="M12 3c-3 3-3 15 0 18"></path>',
    arrow: '<path d="M5 12h14"></path><path d="m13 5 7 7-7 7"></path>',
    chevron: '<path d="m9 18 6-6-6-6"></path>',
    menu: '<path d="M4 7h16"></path><path d="M4 12h16"></path><path d="M4 17h16"></path>',
    close: '<path d="M5 5l14 14"></path><path d="M19 5 5 19"></path>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>',
    bolt: '<path d="m13 2-9 13h7l-1 7 10-14h-7l0-6Z"></path>',
    eye: '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path><circle cx="12" cy="12" r="2.6"></circle>',
    download: '<path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1"></path><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"></path>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${map[name]}</svg>`;
}

function esc(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function cmsLogoSource(value) {
  const source = String(value || "").trim();
  if (!source || /\/tervona-logo(?:-web|-transparent)?\.(?:jpe?g|png)(?:\?.*)?$/i.test(source)) {
    return "/assets/tervona-logo-transparent.png?v=20260812-logo2";
  }
  return source;
}

function logo() {
  const settings = cmsSiteSettings();
  return `<a class="fox-logo" href="${localHref("/")}" aria-label="Tervona home">
    <img class="logo-light" src="${esc(cmsLogoSource(settings.logoLight))}" alt="Tervona">
    <img class="logo-dark" src="${esc(cmsLogoSource(settings.logoDark))}" alt="Tervona">
  </a>`;
}

function render() {
  route = location.hash || "#home";
  const app = document.getElementById("app");
  app.innerHTML = route.startsWith("#detail-") ? renderDetail(route.replace("#detail-", "")) : renderHome();
  bind();
  requestAnimationFrame(syncScrollEffects);
}

function renderHeader() {
  return `<header class="topbar">
    <div class="top-small">
      <a href="#detail-support">Online Support</a>
      <button class="region">${icon("globe")} Australia - English <span>⌄</span></button>
    </div>
    <div class="main-nav">
      ${logo()}
      <nav class="nav-links">
        ${data.nav.map((item) => `<div class="nav-item">
          <a href="${item.href}">${item.label}</a>
          ${item.columns ? renderMega(item) : ""}
        </div>`).join("")}
      </nav>
      <a class="contact-pill" href="#contact">Contact Us</a>
      <button class="mobile-menu" title="Menu">${icon("menu")}</button>
    </div>
  </header>`;
}

function renderMega(item) {
  const productLike = item.label === "Products";
  const links = productLike
    ? [
        ["Low-Voltage Batteries", "/products/low-voltage-battery", "/assets/tervona-products/low-voltage-battery-series.png"],
        ["Hybrid Inverters", "/products/hybrid-inverter", "/assets/tervona-products/ecolink-series.png"],
        ["Off-Grid Inverters", "/products/off-grid-inverter", "/assets/tervona-products/category-scene-tervona-v2.png"],
        ["All-in-One Energy Storage", "/products/all-in-one-ess", "/assets/tervona-products/all-in-one-ess-series.png"],
      ]
    : [
        ["Project References", "/resource-support/references", "/assets/tervona-partner-home-hero-v2.png"],
        ["Warranty Registration", "#detail-warranty", "/assets/tervona-downloads-hero-v2.png"],
        ["Careers", "#detail-careers", "/assets/tervona-products-home-banner-v2.png"],
      ];

  return `<div class="mega fox-dropdown ${productLike ? "" : "support-drop"}">
    <div class="drop-inner">
      <div class="drop-top">
        <div>
          <h3>${esc(item.label)}</h3>
          <p>${esc(item.intro)}</p>
        </div>
        ${productLike ? `<a class="all-products" href="#products"><span>${icon("arrow")}</span>All Products</a>` : ""}
      </div>
      <div class="drop-grid">
        ${links.map(([text, href, img]) => `<a class="drop-pill" href="${href}">
          <img src="${img}" alt="">
          <span>${esc(text)}</span>
        </a>`).join("")}
      </div>
    </div>
  </div>`;
}

function renderHome() {
  const visual = cmsHomeVisualSettings();
  const homeState = cmsAdminState();
  const homeProductItems = visual.productsSource === "cms" ? homeState.products.filter((item) => item.status !== "Hidden").slice(0, 4).map((item, index) => {
    return {
      id: item.id,
      href: item.path,
      label: item.title,
    };
  }) : data.products.map((item) => ({ ...item, href: legacyDetailPath(item.id) }));
  const homeNewsItems = visual.newsSource === "cms" ? homeState.news.filter((item) => item.status !== "Hidden").slice(0, visual.newsCount) : data.news.slice(0, visual.newsCount).map((item, index) => ({ date:item[0], title:item[1], coverImage:item[2], path:`/news/${[41,40,39,37,38][index] || 41}` }));
  const homeHero = data.hero.map((item, index) => index === 0 ? {
    ...item,
    title: visual.heroTitle,
    text: visual.heroText,
    image: visual.heroImage || item.image,
    video: visual.heroVideo || item.video,
  } : item);
  const newsShift = newsTrackOffset();
  return `${renderHeader()}
    <main>
      <section class="hero">
        <div class="hero-track" style="transform: translateX(${-heroIndex * 100}%);">
          ${homeHero.map((slide) => `<article class="hero-slide">
            ${slide.video
              ? `<video class="hero-desktop-video" autoplay muted loop playsinline poster="${slide.image}" src="${slide.video}"></video>
                ${slide.mobileImage ? `<picture class="hero-mobile-poster" aria-hidden="true">
                  <img src="${slide.mobileImage}" alt="">
                </picture>` : ""}`
              : `<picture>
                  ${slide.mobileImage ? `<source media="(max-width: 1020px) and (orientation: portrait)" srcset="${slide.mobileImage}">` : ""}
                  <img src="${slide.image}" alt="">
                </picture>`}
            <div class="hero-shade"></div>
            <div class="hero-text" style="padding-top:${esc(visual.sectionTop)}px;padding-bottom:${esc(visual.sectionBottom)}px">
              <h1 style="font-size:${esc(visual.heroTitleSize)}px;font-weight:${esc(visual.heroTitleWeight)};line-height:${esc(visual.heroTitleLineHeight)};color:${esc(visual.heroTitleColor)}">${esc(slide.title)}</h1>
              <p style="font-size:${esc(visual.heroTextSize)}px;color:${esc(visual.heroTextColor)}">${esc(slide.text)}</p>
            </div>
          </article>`).join("")}
        </div>
        ${homeHero.length > 1 ? `<button class="round-arrow prev" data-hero-prev>${icon("chevron")}</button>
        <button class="round-arrow next" data-hero-next>${icon("chevron")}</button>
        <div class="hero-lines">${homeHero.map((_, i) => `<button class="${i === heroIndex ? "active" : ""}" data-hero="${i}"></button>`).join("")}</div>` : ""}
      </section>

      <section class="solutions" id="solutions" style="${visual.sectionVisibility.solutions ? "" : "display:none"}">
        <div class="solutions-pin">
          <div class="solution-bg">
            <picture>
              <source media="(max-width: 1199px) and (orientation: portrait)" srcset="${esc(visual.solutionsMobileImage)}">
              <img src="${esc(visual.solutionsImage)}" alt="">
            </picture>
            ${visual.solutionsVideo ? `<video autoplay muted loop playsinline poster="${esc(visual.solutionsImage)}" src="${esc(visual.solutionsVideo)}"></video>` : ""}
          </div>
          <div class="solution-glass">
            <div class="solution-head">
              <span>${esc(visual.solutionsEyebrow)}</span>
              <h2>${esc(visual.solutionsTitle)}</h2>
            </div>
            <p>${esc(visual.solutionsText)}</p>
            <div class="solution-explore" aria-hidden="true"><i></i><span>Explore Our Solutions</span></div>
          </div>
          <div class="solution-scene-links">
            <div class="solution-line l0"></div>
            <div class="solution-line l1"></div>
            <div class="solution-line l2"></div>
            <a class="solution-point p0" href="${localHref('/products/hybrid-inverter')}"><b>Hybrid Inverters</b><i></i></a>
            <a class="solution-point p1" href="${localHref('/products/low-voltage-battery')}"><b>Batteries</b><i></i></a>
            <a class="solution-point p2" href="${localHref('/products/all-in-one-ess')}"><b>All-in-One ESS</b><i></i></a>
          </div>
        </div>
      </section>

      <section class="products" id="products" style="${visual.sectionVisibility.products ? "" : "display:none"};padding-top:${esc(visual.sectionSpacing.products)}px;padding-bottom:${esc(visual.sectionSpacing.products)}px">
        <div class="section-title">
          <span>${esc(visual.productsEyebrow)}</span>
          <h2>${esc(visual.productsTitle).replace("Smarter Energy", "<mark>Smarter Energy</mark>")}</h2>
        </div>
        <div class="product-cloud">
          <img class="main-product" src="${esc(visual.productsImage)}" alt="">
          ${homeProductItems.map((item, i) => `<a class="hotspot h${i}" href="${localHref(item.href || item.id)}">
            <span>${esc(item.label)}</span><i></i>
          </a>`).join("")}
        </div>
      </section>

      <section class="about-unbox" id="company" style="${visual.sectionVisibility.about ? "" : "display:none"}">
        <div class="about-bg">
          <picture>
            <source media="(max-width: 1020px) and (orientation: portrait)" srcset="${esc(visual.aboutMobileImage)}">
            <img src="${esc(visual.aboutImage)}" alt="">
          </picture>
          ${visual.aboutVideo ? `<video autoplay muted loop playsinline poster="${esc(visual.aboutImage)}" src="${esc(visual.aboutVideo)}"></video>` : ""}
        </div>
        <div class="about-inner">
          <div class="about-kicker">${esc(visual.aboutEyebrow)}</div>
          <h2>${esc(visual.aboutTitle)}</h2>
          <a class="outline-cta about-more" href="${localHref("/company")}">${icon("arrow")} Learn More</a>
          <p>${esc(visual.aboutText)}</p>
        </div>
      </section>

      <section class="constant-sequence" id="innovation" style="${visual.sectionVisibility.innovation ? "" : "display:none"}">
        <div class="constant-sticky">
          <a class="constant-card" href="${localHref("/innovation")}">
            <img src="${esc(visual.innovationImage)}" alt="">
            ${visual.innovationVideo ? `<video class="constant-video" autoplay muted loop playsinline poster="${esc(visual.innovationImage)}" src="${esc(visual.innovationVideo)}"></video>` : ""}
            <div class="constant-shade"></div>
            <div class="constant-card-copy">
              <span>${esc(visual.innovationEyebrow)}</span>
              <h2>${esc(visual.innovationTitle)}</h2>
            </div>
          </a>
        </div>
      </section>

      <section class="news" id="news" style="${PUBLIC_NEWS_ENABLED && visual.sectionVisibility.news ? "" : "display:none"};padding-top:${esc(visual.sectionSpacing.news)}px;padding-bottom:${esc(visual.sectionSpacing.news)}px">
        <div class="section-title left">
          <span>${esc(visual.newsEyebrow)}</span>
          <h2>${esc(visual.newsTitle)}</h2>
        </div>
        <div class="news-track" style="transform: translateX(${-newsShift}px)">
          ${homeNewsItems.map((item) => `<a class="news-card" href="${localHref(item.path)}">
            <div><time>${esc(item.date)}</time><h3>${esc(item.title)}</h3></div>
            <img src="${esc(item.coverImage)}" alt="">
          </a>`).join("")}
        </div>
        <div class="slider-actions"><button data-news-prev>${icon("chevron")}</button><button data-news-next>${icon("chevron")}</button></div>
      </section>

      ${visual.sectionVisibility.footer ? renderFooterCta(visual) : ""}
    </main>
    ${renderFooter()}`;
}

function cmsHomeVisualDefaults() {
  return {
    heroTitle: "Smart Energy for Every Home",
    heroText: "Residential energy storage, hybrid inverters and integrated solar solutions.",
    heroImage: "/assets/tervona-home-20260922/home-hero-pc.jpg",
    heroVideo: "",
    heroTitleSize: 56,
    heroTitleWeight: 600,
    heroTitleLineHeight: 1.08,
    heroTitleColor: "#ffffff",
    heroTextSize: 18,
    heroTextColor: "#ffffff",
    sectionTop: 0,
    sectionBottom: 0,
    solutionsEyebrow: "OUR SOLUTIONS",
    solutionsTitle: "Integrated Residential Energy Solutions",
    solutionsText: "Residential energy storage, hybrid inverters and integrated solar solutions.",
    solutionsImage: "/assets/tervona-home-20260922/home-solutions-pc.jpg",
    solutionsMobileImage: "/assets/tervona-home-20260922/home-solutions-mobile.jpg",
    solutionsVideo: "",
    productsEyebrow: "Our Products",
    productsTitle: "Reliable Products for Smarter Energy",
    productsImage: "/assets/tervona-home-20260922/home-products.png",
    productsSource: "cms",
    aboutEyebrow: "ABOUT TERVONA",
    aboutTitle: "Built for Smarter Energy",
    aboutText: "Tervona provides residential energy storage products and integrated home energy solutions.",
    aboutImage: "/assets/tervona-home-20260922/home-about-pc.jpg",
    aboutMobileImage: "/assets/tervona-home-20260922/home-about-mobile.jpg",
    aboutVideo: "",
    innovationEyebrow: "PRODUCT TECHNOLOGY",
    innovationTitle: "Designed for Reliable Home Energy",
    innovationImage: "/assets/tervona-home-20260922/home-rd.jpg",
    innovationVideo: "",
    newsEyebrow: "Events and News",
    newsTitle: "We Never Stop Exploring",
    newsSource: "cms",
    newsCount: 5,
    footerTitle: "Start Your Energy Project",
    footerButtonText: "Contact Us",
    footerImage: "/assets/tervona-home-20260922/home-contact-cta.jpg",
    footerMobileImage: "/assets/tervona-home-20260922/home-contact-cta.jpg",
    footerVideo: "",
    sectionVisibility: { solutions: true, products: true, about: true, innovation: true, news: true, footer: true },
    sectionSpacing: { solutions: 80, products: 100, about: 80, innovation: 80, news: 100, footer: 64 },
  };
}

function cmsHomeVisualSettings(state = cmsAdminState()) {
  const home = state.pages.find((page) => routePathOnly(page.path) === "/");
  return { ...cmsHomeVisualDefaults(), ...(home?.visual || {}) };
}

function renderFooter() {
  return `<footer class="footer">
    ${logo()}
    <div class="footer-cols">
      <div><h4>Products</h4><a href="#detail-pv-inverters">PV inverters</a><a href="#detail-hybrid-inverters">Hybrid inverters</a><a href="#detail-batteries">Batteries</a><a href="#detail-ev-chargers">EV chargers</a></div>
      <div><h4>Support & Resources</h4><a href="${localHref("/resource-support/references")}">Project References</a><a href="#detail-warranty">Warranty Registration</a><a href="#detail-support">Online Support</a></div>
      <div><h4>Company</h4><a href="#company">Company</a><a href="#innovation">Innovation</a><a href="#news">News</a><a href="#contact">Contact Us</a></div>
    </div>
  </footer>`;
}

function renderDetail(slug) {
  const product = data.products.find((item) => slug.includes(item.id));
  const newsMatch = slug.match(/^news-(\d+)/);
  const caseMatch = slug.match(/^case-(\d+)/);
  let title = "Tervona Detail";
  let image = "/assets/tervona-products-home-banner-v2.png";
  let body = "This page is generated by the local CMS prototype. Replace this placeholder detail content with your own copy, documents and media before launch.";

  if (product) {
    title = product.label;
    image = product.image;
    body = `${product.label} detail page with overview, specifications, downloads, compatible products and contact actions. This mirrors the content-management structure needed for product pages.`;
  } else if (newsMatch) {
    const item = data.news[Number(newsMatch[1])] || data.news[0];
    title = item[1];
    image = item[2];
    body = "News detail page placeholder with publish date, article body, related news and sharing controls. The real CMS can store rich text, SEO fields and image galleries.";
  } else if (caseMatch) {
    const item = data.cases[Number(caseMatch[1])] || data.cases[0];
    title = item[0];
    image = item[3];
    body = `${item[1]} project reference page with project background, product configuration, system benefits and image gallery.`;
  }

  return `${renderHeader()}
    <main class="detail-page">
      <section class="detail-hero">
        <img src="${image}" alt="">
        <div>
          <a href="#home" class="back-link">Back to Home</a>
          <h1>${esc(title)}</h1>
          <p>${esc(body)}</p>
          <a class="contact-pill" href="#contact">Contact Us</a>
        </div>
      </section>
      <section class="detail-content">
        <article>
          <h2>Overview</h2>
          <p>${esc(body)}</p>
          <p>The code is fully rewritten for this local preview. Images and public text are temporary placeholders and can be replaced later from the CMS data model.</p>
        </article>
        <aside>
          <h3>CMS fields</h3>
          <span>Title</span><span>Hero image</span><span>SEO description</span><span>Rich text body</span><span>Related products</span><span>Downloads</span>
        </aside>
      </section>
    </main>
    ${renderFooter()}`;
}

function bind() {
  document.querySelectorAll(".innovation-page-motion video[autoplay]").forEach((video) => {
    video.muted = true;
    video.play().catch(() => {});
  });
  document.querySelectorAll('a[href^="/"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.defaultPrevented || link.hasAttribute("download") || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.target && link.target !== "_self") return;
      const href = link.getAttribute("href");
      if (!href) return;
      event.preventDefault();
      history.pushState({ path: href }, "", href);
      render();
    });
  });
  document.querySelectorAll(".nav-item").forEach((item) => {
    const mega = item.querySelector(".mega");
    if (!mega) return;
    const trigger = item.querySelector(":scope > a");
    item.addEventListener("mouseenter", () => item.classList.add("open"));
    item.addEventListener("mouseleave", () => item.classList.remove("open"));
    item.addEventListener("focusin", () => item.classList.add("open"));
    item.addEventListener("focusout", () => item.classList.remove("open"));
    trigger?.addEventListener("click", (event) => {
      event.preventDefault();
      document.querySelectorAll(".nav-item.open").forEach((openItem) => {
        if (openItem !== item) openItem.classList.remove("open");
      });
      item.classList.toggle("open");
    });
  });
  const getHeroCount = () => document.querySelectorAll("[data-hero]").length || data.hero.length;
  const getActiveHeroIndex = () => Number(document.querySelector("[data-hero].active")?.dataset.hero ?? heroIndex);
  document.querySelectorAll("[data-hero]").forEach((button) => button.addEventListener("click", (event) => {
    event.preventDefault();
    markHeroInteraction();
    heroIndex = Number(button.dataset.hero);
    render();
  }));
  document.querySelector("[data-hero-prev]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    markHeroInteraction();
    const count = getHeroCount();
    const current = getActiveHeroIndex();
    heroIndex = (current + count - 1) % count;
    render();
  });
  document.querySelector("[data-hero-next]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    markHeroInteraction();
    const count = getHeroCount();
    const current = getActiveHeroIndex();
    heroIndex = (current + 1) % count;
    render();
  });
  document.querySelectorAll("[data-solution]").forEach((button) => button.addEventListener("click", () => {
    solutionIndex = Number(button.dataset.solution);
    render();
  }));
  document.querySelector("[data-case-prev]")?.addEventListener("click", () => {
    caseIndex = Math.max(0, caseIndex - 1);
    render();
  });
  document.querySelector("[data-case-next]")?.addEventListener("click", () => {
    caseIndex = Math.min(data.cases.length - 2, caseIndex + 1);
    render();
  });
  document.querySelector("[data-news-prev]")?.addEventListener("click", () => {
    newsIndex = Math.max(0, newsIndex - 1);
    render();
  });
  document.querySelector("[data-news-next]")?.addEventListener("click", () => {
    newsIndex = Math.min(data.news.length - 2, newsIndex + 1);
    render();
  });
}

function syncScrollEffects() {
  const y = window.scrollY;
  const header = document.querySelector(".topbar");
  header?.classList.toggle("solid", y > 80);
  const explicitInnerPageMotion = Boolean(document.querySelector(".innovation-page-motion"));
  if (window.SITE_NO_MOTION && !explicitInnerPageMotion) {
    header?.classList.remove("hide");
    lastScrollY = y;
    animateCounters();
    return;
  }
  if (header) {
    const scrollingDown = y > lastScrollY + 4;
    const scrollingUp = y < lastScrollY - 4;
    if (y < 90 || scrollingUp) header.classList.remove("hide");
    if (scrollingDown && y > 120) header.classList.add("hide");
  }
  lastScrollY = y;

  const solutions = document.querySelector(".solutions");
  if (solutions) {
    const rect = solutions.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / (rect.height - window.innerHeight)));
    const desktop = window.innerWidth >= 1200;
    const headReveal = desktop
      ? Math.min(1, Math.max(0, (window.innerHeight * 0.30 - rect.top) / (window.innerHeight * 0.13)))
      : 1;
    const introReveal = desktop
      ? Math.min(1, Math.max(0, (window.innerHeight * 0.30 - rect.top) / (window.innerHeight * 0.17)))
      : 1;
    const mouseReveal = desktop
      ? Math.min(1, Math.max(0, (window.innerHeight * 0.203 - rect.top) / (window.innerHeight * 0.135)))
      : 1;
    // The source site first grows the frosted card from a narrow centered panel
    // to the full 20px-inset width. This wide-screen entrance completes before
    // the copy becomes readable and before the later curtain lift begins.
    const wideEntry = window.innerWidth >= 1600;
    const cardGrow = wideEntry
      ? Math.min(1, Math.max(0, (window.innerHeight * 0.72 - rect.top) / (window.innerHeight * 0.48)))
      : 1;
    const cardSide = wideEntry
      ? 20 + (window.innerWidth * 0.104 - 20) * (1 - cardGrow)
      : 20;
    const reveal = Math.min(1, Math.max(0, (progress - 0.22) / 0.46));
    const copyFade = Math.min(1, Math.max(0, (progress - 0.34) / 0.18));
    const markerReveal = Math.min(1, Math.max(0, (progress - 0.58) / 0.12));
    const scale = desktop ? 1.2 - reveal * 0.2 : 1.2 - Math.min(progress, 0.52) / 0.52 * 0.2;
    const clip = Math.max(0, 10 - Math.min(progress, 0.28) / 0.28 * 10);
    const pin = document.querySelector(".solutions-pin");
    if (pin) {
      pin.style.setProperty("--solution-side", `${cardSide.toFixed(1)}px`);
      pin.style.setProperty("--solution-scale", scale.toFixed(3));
      pin.style.setProperty("--solution-info-y", desktop ? `${(-reveal * 100).toFixed(2)}%` : "0%");
      pin.style.setProperty("--solution-head-opacity", headReveal.toFixed(3));
      pin.style.setProperty("--solution-head-y", `${((1 - headReveal) * 19).toFixed(1)}px`);
      pin.style.setProperty("--solution-intro-opacity", introReveal.toFixed(3));
      pin.style.setProperty("--solution-intro-y", `${((1 - introReveal) * 31).toFixed(1)}px`);
      pin.style.setProperty("--solution-mouse-opacity", mouseReveal.toFixed(3));
      pin.style.setProperty("--solution-mouse-y", `${((1 - mouseReveal) * 31).toFixed(1)}px`);
      pin.style.setProperty("--solution-y", "0vh");
      pin.style.setProperty("--solution-radius", `${18 - Math.min(progress, 1) * 10}px`);
      pin.style.setProperty("--solution-clip", `${clip.toFixed(2)}%`);
      pin.style.setProperty("--glass-opacity", desktop ? "1" : `${0.86 * (1 - reveal)}`);
      pin.style.setProperty("--glass-blur", desktop ? "34px" : `${32 * (1 - reveal)}px`);
      pin.style.setProperty("--flow-opacity", desktop ? "1" : `${reveal * 0.9}`);
      pin.style.setProperty("--day-opacity", `${1 - Math.max(0, (progress - 0.58) / 0.34) * 0.42}`);
      pin.style.setProperty("--solution-copy-opacity", desktop ? "1" : `${1 - copyFade}`);
      pin.style.setProperty("--solution-copy-y", desktop ? "0px" : `${copyFade * -34}px`);
      pin.style.setProperty("--solution-marker-opacity", markerReveal.toFixed(3));
      pin.style.setProperty("--solution-marker-y", `${(26 - markerReveal * 26).toFixed(1)}px`);
      pin.style.setProperty("--solution-marker-events", markerReveal > 0.9 ? "auto" : "none");
    }
  }

  const constant = document.querySelector(".constant-sequence");
  if (constant) {
    const motionPriority = constant.classList.contains("innovation-page-motion") ? "important" : "";
    const rect = constant.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / (rect.height - window.innerHeight)));
    const cardReveal = Math.min(1, progress / 0.24);
    const copyIn = Math.min(1, Math.max(0, (progress - 0.16) / 0.1));
    const copyOut = Math.min(1, Math.max(0, (progress - 0.37) / 0.13));
    const fadeProgress = Math.min(1, Math.max(0, (progress - 0.42) / 0.24));
    const logoProgress = Math.min(1, Math.max(0, (progress - 0.52) / 0.2));
    const titleProgress = Math.min(1, Math.max(0, (progress - 0.7) / 0.14));
    const copyOpacity = Math.max(0, copyIn * (1 - copyOut));
    const card = document.querySelector(".constant-sticky");
    if (card) {
      card.style.setProperty("--constant-clip-x", `${20 - cardReveal * 20}%`, motionPriority);
      card.style.setProperty("--constant-clip-y", `${20 - cardReveal * 20}%`, motionPriority);
      card.style.setProperty("--constant-round", `${20 - cardReveal * 20}px`, motionPriority);
      card.style.setProperty("--constant-card-opacity", `${1 - fadeProgress}`, motionPriority);
      card.style.setProperty("--constant-card-copy-opacity", `${copyOpacity}`, motionPriority);
      card.style.setProperty("--constant-card-copy-y", `${(26 - copyIn * 26 + copyOut * -18).toFixed(1)}px`, motionPriority);
      card.style.setProperty("--constant-logo-opacity", `${logoProgress}`, motionPriority);
      card.style.setProperty("--constant-logo-scale", `${2.65 - logoProgress * 1.65}`, motionPriority);
      card.style.setProperty("--constant-title-opacity", `${titleProgress}`, motionPriority);
      card.style.setProperty("--constant-title-y", `${32 - titleProgress * 32}px`, motionPriority);
    }
  }

  const seriesHero = document.querySelector(".series-hero");
  if (seriesHero) {
    const rect = seriesHero.getBoundingClientRect();
    const range = Math.max(1, rect.height * 0.72);
    const progress = Math.min(1, Math.max(0, -rect.top / range));
    const statsProgress = Math.min(1, Math.max(0, (progress - 0.46) / 0.2));
    const easedStats = statsProgress * statsProgress * (3 - 2 * statsProgress);
    seriesHero.style.setProperty("--detail-bg-scale", "1.045");
    seriesHero.style.setProperty("--detail-bg-inset", "-18px");
    seriesHero.style.setProperty("--detail-bg-radius", "0px");
    seriesHero.style.setProperty("--detail-stats-opacity", easedStats.toFixed(3));
    seriesHero.style.setProperty("--detail-stats-y", `${(34 - easedStats * 34).toFixed(1)}px`);
  }

  updateProductHubScroll();

  animateCounters();
}

function updateProductHubScroll() {
  const grid = document.querySelector(".product-hub-source .product-hub-category-grid");
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll(".product-hub-category-card"));
  const reduceMotion = window.SITE_NO_MOTION || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const desktopMotion = window.innerWidth > 1020 && !reduceMotion;

  if (!desktopMotion) {
    cards.forEach((card) => {
      card.style.setProperty("--hub-motion-x", "0px");
      card.style.setProperty("--hub-motion-y", "0px");
      card.style.setProperty("--hub-opacity", "1");
    });
    grid.style.setProperty("--product-line-height", `${Math.max(0, grid.offsetHeight + 26)}px`);
    grid.style.setProperty("--product-line-opacity", "1");
    return;
  }

  const viewportHeight = Math.max(1, window.innerHeight);
  const gridRect = grid.getBoundingClientRect();
  const revealStart = viewportHeight - 50;
  const revealRange = Math.min(viewportHeight * 0.9, 680);

  cards.forEach((card, index) => {
    const baseY = index % 2 === 1 ? -64 : 0;
    const finalTop = gridRect.top + card.offsetTop + baseY;
    const progress = Math.min(1, Math.max(0, (revealStart - finalTop) / revealRange));
    const remaining = 1 - progress;
    const direction = index % 2 === 0 ? -1 : 1;
    card.style.setProperty("--hub-motion-x", `${(direction * 50 * remaining).toFixed(2)}px`);
    card.style.setProperty("--hub-motion-y", `${(50 * remaining).toFixed(2)}px`);
    card.style.setProperty("--hub-opacity", progress.toFixed(4));
  });

  // Match the source site's scroll-linked centre line: it begins level with
  // the raised right-hand card, grows with scroll distance, and carries its
  // node at the live end of the line.
  const lineStartTop = gridRect.top - 64;
  const lineMax = Math.max(0, grid.offsetHeight + 26);
  const lineTrigger = viewportHeight * 0.5 - 42;
  const lineHeight = Math.min(lineMax, Math.max(0, (lineTrigger - lineStartTop) * 1.05));
  grid.style.setProperty("--product-line-height", `${lineHeight.toFixed(2)}px`);
  grid.style.setProperty("--product-line-opacity", lineHeight > 2 ? "1" : "0");
}

function animateCounters() {
  document.querySelectorAll("[data-count]").forEach((node) => {
    if (window.SITE_NO_MOTION) {
      const target = Number(node.dataset.count);
      node.dataset.done = "1";
      node.textContent = node.dataset.countFormat === "plain" ? String(target) : target.toLocaleString();
      return;
    }
    const rect = node.getBoundingClientRect();
    const groupRect = node.closest(".mini-stats")?.getBoundingClientRect();
    const triggerRect = groupRect || rect;
    if (triggerRect.top > window.innerHeight || triggerRect.bottom < 0 || node.dataset.done) return;
    node.dataset.done = "1";
    const target = Number(node.dataset.count);
    const start = performance.now();
    const duration = 1200;
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = Math.round(target * eased);
      node.textContent = node.dataset.countFormat === "plain" ? String(value) : value.toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

function cmsPages() {
  const merged = [];
  const seen = new Set();
  const hasTervonaProductCatalog = tervonaCatalogProducts().length > 0;
  [window.CRAWLED_PAGES, window.CLICKABLE_PAGES].forEach((source) => {
    if (!Array.isArray(source)) return;
    source.forEach((page) => {
      const route = normalizePath(page.path || "/");
      if (hasTervonaProductCatalog && routePathOnly(route).startsWith("/products/") && routePathOnly(route) !== "/products") return;
      if (seen.has(route)) return;
      seen.add(route);
      const entry = { ...page, path: route };
      merged.push(entry);
    });
  });
  if (hasTervonaProductCatalog) {
    productCategories().forEach((category) => merged.push({
      path: `/products/${category.slug}`,
      title: `${category.title}-Tervona`,
      description: category.intro,
      assets: [category.heroImage].filter(Boolean),
    }));
    tervonaCatalogProducts().filter((product) => product.status === "Published").forEach((product) => merged.push({
      path: product.path,
      title: `${product.title}-Tervona`,
      description: product.summary,
      assets: [product.heroImage].filter(Boolean),
    }));
  }
  return merged;
}

function normalizePath(path) {
  let raw = String(path || "").trim();
  if (!raw) return "/";
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      raw = `${url.pathname}${url.search}`;
    } catch {
      raw = "/";
    }
  }
  raw = raw.split("#")[0];
  const queryAt = raw.indexOf("?");
  const query = queryAt >= 0 ? raw.slice(queryAt) : "";
  const pathOnly = queryAt >= 0 ? raw.slice(0, queryAt) : raw;
  const cleaned = (`/${pathOnly.replace(/^#?\/*/, "")}`).replace(/\/+/g, "/");
  const route = cleaned === "/index.html" ? "/" : cleaned.replace(/\/$/, "") || "/";
  return `${route}${query}`;
}

function routePathOnly(path) {
  return normalizePath(path).split("?")[0];
}

function routeParams(path) {
  const query = normalizePath(path).split("?")[1] || "";
  return new URLSearchParams(query);
}

function getRoutePath() {
  const hash = decodeURIComponent(location.hash || "");
  if (hash.startsWith("#/")) return normalizePath(hash.slice(1));
  if (hash.startsWith("#detail-")) return legacyDetailPath(hash.slice(8));
  const pathname = stripSiteBasePath(location.pathname);
  if (pathname && pathname !== "/" && pathname !== "/index.html") {
    return normalizePath(`${pathname}${location.search || ""}`);
  }
  return "/";
}

function localHref(path) {
  const normalized = normalizePath(path);
  if (!SITE_BASE_PATH) return normalized;
  if (/^\/(?:assets|uploads)\//.test(routePathOnly(normalized))) return `${SITE_BASE_PATH}${normalized}`;
  return `${SITE_BASE_PATH}/#${normalized}`;
}

function cmsSectionPath(section) {
  const target = CMS_SECTION_IDS.has(section) ? section : "dashboard";
  return localHref(`/cms?section=${encodeURIComponent(target)}`);
}

function cmsSetActiveSection(section, syncUrl = true) {
  if (!CMS_SECTION_IDS.has(section)) return false;
  cmsActiveSection = section;
  if (syncUrl && routePathOnly(getRoutePath()) === "/cms") {
    history.replaceState(null, "", cmsSectionPath(section));
  }
  return true;
}

function hrefFor(path) {
  return /^https?:\/\//i.test(String(path || "")) ? String(path) : localHref(path);
}

function sourceUrl(path) {
  return normalizePath(path) === "/" ? FALLBACK_SCENE : normalizePath(path);
}

function pageFor(path) {
  const route = normalizePath(path);
  const routeOnly = routePathOnly(route);
  const managedPages = cmsAdminState().pages || [];
  return managedPages.find((page) => normalizePath(page.path) === route)
    || managedPages.find((page) => routePathOnly(page.path) === routeOnly)
    || cmsPages().find((page) => normalizePath(page.path) === route)
    || cmsPages().find((page) => routePathOnly(page.path) === routeOnly)
    || {
    path: route,
    title: route === "/" ? "Tervona" : `${titleFromSlug(route.split("/").filter(Boolean).pop())}-Tervona`,
    description: "Local CMS page generated from the full-site sitemap.",
    assets: [],
  };
}

function cleanTitle(title) {
  return esc(String(title || "Tervona").replace(/-Tervona$/i, "").trim());
}

function plainTitle(title) {
  return String(title || "Tervona").replace(/-Tervona$/i, "").trim();
}

function titleFromSlug(slug) {
  return String(slug || "page").split("-").map((word) => word ? word[0].toUpperCase() + word.slice(1) : "").join(" ");
}

function sourceAsset(path) {
  if (!path) return FALLBACK_SCENE;
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

function legacyDetailPath(slug) {
  const map = {
    "pv-inverters": "/products",
    "hybrid-inverters": "/products/hybrid-inverter",
    "batteries": "/products/low-voltage-battery",
    "ev-chargers": "/products",
    company: "/company",
    innovation: "/innovation",
    contact: "/contact-us",
    support: "/resource-support/references",
    warranty: "/download/warranties",
  };
  if (/^news-(\d+)/.test(slug)) return `/news/${Number(RegExp.$1) + 9}`;
  if (/^case-/.test(slug)) return "/resource-support/references";
  return map[slug] || "/";
}

function tervonaCatalog() {
  return window.TERVONA_PRODUCT_CATALOG || { categories: [], products: [] };
}

function tervonaCatalogProducts() {
  const products = tervonaCatalog().products;
  return Array.isArray(products) ? products : [];
}

function productCategories() {
  const categories = tervonaCatalog().categories;
  if (Array.isArray(categories) && categories.length) {
    return categories.filter((category) => category.status !== "Hidden" && category.status !== "Draft");
  }
  return [
    { slug: "low-voltage-battery", title: "Low-Voltage Batteries", icon: "/assets/tervona-products/low-voltage-battery-series.png", intro: "Low-voltage batteries in rack-mount and floor-standing formats." },
    { slug: "hybrid-inverter", title: "Low-Voltage Hybrid Inverters", icon: "/assets/tervona-products/ecolink-series.png", intro: "EcoLink single-phase low-voltage hybrid inverter models." },
    { slug: "off-grid-inverter", title: "Single-Phase Off-Grid Inverters", icon: "/assets/tervona-products/category-scene-tervona-v2.png", intro: "Single-phase IP54 off-grid inverter products." },
    { slug: "all-in-one-ess", title: "All-in-One Energy Storage", icon: "/assets/tervona-products/all-in-one-ess-series.png", intro: "Integrated home energy storage configurations." },
  ];
}

function productTaxonomy() {
  const taxonomy = tervonaCatalog().taxonomy;
  if (Array.isArray(taxonomy) && taxonomy.length) return taxonomy;
  return productCategories().map((category, index) => ({
    slug: category.slug,
    label: category.navTitle || category.title,
    code: `P${index + 1}`,
    href: `/products/${category.slug}`,
    aliases: [],
    children: [],
  }));
}

function activeProductTaxonomySlug() {
  const route = routePathOnly(getRoutePath());
  const active = productTaxonomy().find((category) => {
    const routeSlugs = [category.slug, ...(Array.isArray(category.aliases) ? category.aliases : [])];
    return routeSlugs.some((slug) => route === `/products/${slug}` || route.startsWith(`/products/${slug}/`));
  });
  return active?.slug || "";
}

function productMegaPresentation(category) {
  const presentations = {
    "battery-pack": {
      description: "Store solar energy for backup and everyday use.",
      image: "/assets/tervona-products/catalog-v2/battery-5-kwh-cutout.png",
    },
    "hybrid-inverter": {
      description: "Manage solar, battery and grid power intelligently.",
      image: "/assets/tervona-products/catalog-v2/ecolink-series-cutout.png",
    },
    "off-grid-inverter": {
      description: "Reliable power for homes beyond the utility grid.",
      image: "/assets/tervona-products/catalog-v2/off-grid-single-phase-cutout.png",
    },
    "all-in-one-ess": {
      description: "Battery and inverter combined in one complete system.",
      image: "/assets/tervona-products/catalog-v2/aio-12kw-16kwh-cutout.png",
    },
    "ev-charger": {
      description: "Smart charging for homes and destination parking.",
      icon: "ev-charger",
    },
    cloud: {
      description: "Monitor and manage energy systems from anywhere.",
      icon: "cloud",
    },
  };
  return presentations[category?.slug] || {
    description: "Explore Tervona energy products and solutions.",
    icon: "energy",
  };
}

function productMegaVisual(category) {
  const presentation = productMegaPresentation(category);
  if (presentation.image) {
    return `<img src="${esc(presentation.image)}" alt="" loading="eager">`;
  }
  const paths = {
    "ev-charger": '<rect x="6.5" y="3.5" width="16" height="27" rx="4"></rect><path d="M12 9h5l-3.1 5.2h4.1L11.8 23l1.5-6.1H10z"></path><path d="M22.5 11h2.2c2 0 3.8 1.7 3.8 3.8v7.7c0 2.4 1.8 4.3 4.1 4.3"></path><circle cx="33" cy="27" r="2.6"></circle>',
    cloud: '<path d="M10.5 27.5h18.2a6.8 6.8 0 0 0 .7-13.5A10.3 10.3 0 0 0 9.8 11.2a7.7 7.7 0 0 0 .7 15.3Z"></path><path d="M13.5 22.5h4.2l2.2-6 3.1 9 2.1-5h3.4"></path>',
    energy: '<path d="m22 4-11 16h8l-2 12 12-18h-8z"></path>',
  };
  return `<svg viewBox="0 0 40 36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[presentation.icon] || paths.energy}</svg>`;
}

function defaultDownloadCategories() {
  return [
    ["datasheets", "Datasheets"],
    ["user-manual", "User Manual"],
    ["quick-install-guides", "Quick Install Guides"],
    ["warranties", "Warranties"],
    ["certificates", "Certificates"],
    ["declaration", "Declaration"],
    ["faqs", "FAQs"],
    ["pre", "Pre Installation"],
    ["installation", "Installation"],
    ["commissioning", "Commissioning"],
  ];
}

function downloadCategories(state = null) {
  const direct = state?.downloadCategories || cmsRemoteState?.downloadCategories;
  if (Array.isArray(direct) && direct.length) return direct.map((item) => Array.isArray(item) ? item : [item.slug, item.label]);
  try {
    const stored = JSON.parse(localStorage.getItem(CMS_ADMIN_STORAGE_KEY) || "{}");
    if (Array.isArray(stored.downloadCategories) && stored.downloadCategories.length) {
      return stored.downloadCategories.map((item) => Array.isArray(item) ? item : [item.slug, item.label]);
    }
  } catch {
    // Use defaults when local storage is unavailable.
  }
  return defaultDownloadCategories();
}

function cmsDefaultMenus() {
  return [
    {
      id: "products",
      label: "Products",
      href: "/products",
      intro: "Reliable Products that Meet Diverse Needs",
      kind: "products",
      children: productTaxonomy().map((category) => ({
        label: category.label,
        href: category.href || "/products",
        code: category.code,
        taxonomySlug: category.slug,
      })),
    },
    { id: "company", label: "Company", href: "/company", children: [] },
    { id: "downloads", label: "Downloads", href: "/download/datasheets", children: [] },
    {
      id: "support",
      label: "Partner",
      href: "/partner",
      intro: "",
      kind: "partner",
      children: [],
    },
  ];
}

function cmsDefaultSettings() {
  return {
    logoLight: `${ASSET}/tervona-logo-transparent.png`,
    logoDark: `${ASSET}/tervona-logo-transparent.png`,
    primaryColor: "#18aeb2",
    buttonColor: "#18aeb2",
    buttonTextColor: "#ffffff",
    fontFamily: "Poppins",
    headingFontFamily: "Poppins",
    baseFontSize: "19px",
    bodyFontWeight: "400",
    bodyLineHeight: "1.55",
    navFontSize: "20px",
    navFontWeight: "400",
    buttonFontSize: "19px",
    buttonFontWeight: "700",
    heroTitleSize: "clamp(52px, 6vw, 100px)",
    sectionTitleSize: "clamp(36px, 5vw, 64px)",
    cardTitleSize: "23px",
    headingFontWeight: "600",
    cardTitleWeight: "600",
    buttonRadius: "999px",
    headerContactText: "Contact Us",
    headerContactHref: "/contact-us",
    regionLabel: "Australia - English",
    translateEnabled: "yes",
    translateDefaultLanguage: "en",
    translateLanguages: [
      "en | English",
      "zh-CN | 简体中文",
      "zh-TW | 繁體中文",
      "es | Español",
      "fr | Français",
      "de | Deutsch",
      "it | Italiano",
      "pt | Português",
      "ja | 日本語",
      "ko | 한국어",
      "ar | العربية",
    ].join("\n"),
    footerCtaTitle: "Life by Sunshine",
    footerCtaButtonText: "Contact Us",
    footerCtaButtonHref: "/contact-us",
    footerCtaImage: "/assets/tervona-life-by-sunshine-v1.png",
    footerCtaMobileImage: "/assets/tervona-life-by-sunshine-v1.png",
    footerCtaVideo: "",
  };
}

function cmsDefaultDownloads() {
  return cmsSeedProducts().slice(0, 10).map((product, index) => ({
    id: `download-${index + 1}`,
    title: `${product.title} Datasheet`,
    type: "datasheets",
    product: product.path,
    productLabel: product.title,
    fileUrl: `/uploads/downloads/${product.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-datasheet.pdf`,
    version: `V${index + 1}.0`,
    status: "Published",
  }));
}

function cmsSiteSettings(state = null) {
  const settings = state?.settings || cmsRemoteState?.settings || {};
  const merged = { ...cmsDefaultSettings(), ...settings };
  return {
    ...merged,
    logoLight: cmsLogoSource(merged.logoLight),
    logoDark: cmsLogoSource(merged.logoDark),
  };
}

function cmsMenus(state = null) {
  const menus = state?.menus || cmsRemoteState?.menus;
  if (!Array.isArray(menus) || !menus.length) return cmsDefaultMenus();
  // Remove the empty menu record created by the old navigation demo. Keeping
  // this cleanup at the shared template level also repairs older saved states.
  return menus.filter((item) => !(
    !item?.id
    && String(item?.label || "").trim() === "新导航"
    && normalizePath(item?.href || "/") === "/"
    && !(item?.children || []).length
  )).map((item) => {
    if (item.id === "products") return {
      ...item,
      label: "Products",
      href: "/products",
      intro: "Tervona energy products for solar, storage and backup power",
      kind: "products",
      children: productTaxonomy().map((category) => ({
        label: category.label,
        href: category.href || "/products",
        code: category.code,
        taxonomySlug: category.slug,
      })),
    };
    if (item.id === "support" || item.label === "Support & Resources") return {
      ...item,
      label: "Partner",
      href: "/partner",
      intro: "",
      kind: "partner",
      children: [],
    };
    return item;
  });
}

function cmsTranslateLanguages(settings = cmsSiteSettings()) {
  const fallback = cmsDefaultSettings().translateLanguages;
  const lines = String(settings.translateLanguages || fallback).split(/\r?\n/);
  const languages = lines
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter(([code, label]) => code && label)
    .map(([code, label]) => ({ code, label }));
  return languages.length ? languages : [{ code: "en", label: "English" }];
}

function googleTranslateCookieValue() {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function currentTranslateLanguage(settings = cmsSiteSettings()) {
  const cookie = googleTranslateCookieValue();
  const current = cookie.split("/").filter(Boolean).pop();
  return current || settings.translateDefaultLanguage || "en";
}

function renderLanguageSwitcher(settings, mode = "desktop") {
  if (settings.translateEnabled === "no") {
    return `<span class="region-static">${icon("globe")} ${esc(settings.regionLabel)}</span>`;
  }
  const languages = cmsTranslateLanguages(settings);
  const current = currentTranslateLanguage(settings);
  const active = languages.find((item) => item.code === current) || languages[0];
  return `<div class="language-switcher language-switcher-${mode}" data-language-switcher>
    <button class="region" type="button" data-language-toggle aria-expanded="false">
      ${icon("globe")} <span>${esc(active?.label || settings.regionLabel)}</span><i>⌄</i>
    </button>
    <div class="language-menu" data-language-menu>
      ${languages.map((language) => `<button type="button" class="${language.code === current ? "active" : ""}" data-google-lang="${esc(language.code)}">${esc(language.label)}</button>`).join("")}
    </div>
  </div>`;
}

function cmsApplySiteSettings() {
  const settings = cmsSiteSettings(cmsAdminState());
  document.documentElement.style.setProperty("--purple", settings.primaryColor || "#18aeb2");
  document.documentElement.style.setProperty("--button-color", settings.buttonColor || settings.primaryColor || "#18aeb2");
  document.documentElement.style.setProperty("--button-text-color", settings.buttonTextColor || "#ffffff");
  document.documentElement.style.setProperty("--button-radius", settings.buttonRadius || "999px");
  document.documentElement.style.setProperty("--site-font-family", `"${settings.fontFamily || "Poppins"}", "Microsoft YaHei", Arial, sans-serif`);
  document.documentElement.style.setProperty("--heading-font-family", `"${settings.headingFontFamily || settings.fontFamily || "Poppins"}", "Microsoft YaHei", Arial, sans-serif`);
  document.documentElement.style.setProperty("--base-font-size", settings.baseFontSize || "19px");
  document.documentElement.style.setProperty("--body-font-weight", settings.bodyFontWeight || "400");
  document.documentElement.style.setProperty("--body-line-height", settings.bodyLineHeight || "1.55");
  document.documentElement.style.setProperty("--nav-font-size", settings.navFontSize || "20px");
  document.documentElement.style.setProperty("--nav-font-weight", settings.navFontWeight || "400");
  document.documentElement.style.setProperty("--button-font-size", settings.buttonFontSize || "19px");
  document.documentElement.style.setProperty("--button-font-weight", settings.buttonFontWeight || "700");
  document.documentElement.style.setProperty("--hero-title-size", settings.heroTitleSize || "clamp(52px, 6vw, 100px)");
  document.documentElement.style.setProperty("--section-title-size", settings.sectionTitleSize || "clamp(36px, 5vw, 64px)");
  document.documentElement.style.setProperty("--card-title-size", settings.cardTitleSize || "23px");
  document.documentElement.style.setProperty("--heading-font-weight", settings.headingFontWeight || "600");
  document.documentElement.style.setProperty("--card-title-weight", settings.cardTitleWeight || "600");
}

function ensureGoogleTranslate(settings = cmsSiteSettings()) {
  if (settings.translateEnabled === "no") return;
  if (!document.getElementById("google_translate_element")) {
    const holder = document.createElement("div");
    holder.id = "google_translate_element";
    holder.setAttribute("aria-hidden", "true");
    document.body.appendChild(holder);
  }
  if (window.google?.translate?.TranslateElement) return;
  window.googleTranslateElementInit = () => {
    const latest = cmsSiteSettings(cmsAdminState());
    const languageCodes = cmsTranslateLanguages(latest).map((item) => item.code).join(",");
    new window.google.translate.TranslateElement({
      pageLanguage: latest.translateDefaultLanguage || "en",
      includedLanguages: languageCodes,
      autoDisplay: false,
      layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
    }, "google_translate_element");
  };
  if (document.querySelector("script[data-google-translate-script]")) return;
  const script = document.createElement("script");
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  script.dataset.googleTranslateScript = "true";
  document.head.appendChild(script);
}

function setTranslateCookie(value) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `googtrans=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
  if (location.hostname && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
    document.cookie = `googtrans=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; domain=.${location.hostname}`;
  }
}

function applyGoogleLanguage(lang) {
  const settings = cmsSiteSettings(cmsAdminState());
  const source = settings.translateDefaultLanguage || "en";
  setTranslateCookie(`/${source}/${lang}`);
  window.location.reload();
}

function productPages(slug) {
  const products = tervonaCatalogProducts();
  if (products.length) {
    return products.filter((product) => product.category === slug && product.status === "Published");
  }
  return cmsPages().filter((page) => normalizePath(page.path).startsWith(`/products/${slug}/`));
}

function categoryForSlug(slug) {
  return productCategories().find((item) => item.slug === slug) || productCategories()[0];
}

function pageHero(page, label, image) {
  return `<section class="inside-hero">
    <img src="${image || "/assets/tervona-products/category-scene-tervona-v2.png"}" alt="">
    <div class="inside-hero-shade"></div>
    <div class="inside-hero-copy">
      <span>${esc(label || "Tervona")}</span>
      <h1>${cleanTitle(page.title)}</h1>
      <p>${esc(page.description || "Smart renewable energy products, resources and support.")}</p>
    </div>
  </section>`;
}

function sourceBannerHero(title, image, trail) {
  const bannerClass = `source-banner-${String(title || "page").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  const crumb = (trail && trail.length ? trail : ["Home", title])
    .map((item) => `<span>${esc(item)}</span>`)
    .join("<i>/</i>");
  return `<section class="source-banner-hero ${bannerClass} ${title.length > 24 ? "source-banner-long" : ""}">
    <img src="${image}" alt="">
    <div class="source-banner-shade"></div>
    <div class="source-banner-copy">
      <h1>${esc(title)}</h1>
      <div class="source-breadcrumb">${crumb}</div>
    </div>
  </section>`;
}

function productImageFor(path) {
  const route = normalizePath(path);
  return (window.PRODUCT_MEDIA && window.PRODUCT_MEDIA[route]) || "/assets/tervona-products/category-scene-tervona-v2.png";
}

function render(options = {}) {
  const path = getRoutePath();
  const publicRoute = routePathOnly(path);
  const app = document.getElementById("app");
  const preservedScrollY = options.preserveScroll ? window.scrollY : 0;
  document.title = ((!PUBLIC_NEWS_ENABLED && /^\/news(?:\/|-|$)/.test(publicRoute)) || isRetiredPublicRoute(publicRoute))
    ? "Page Not Found - Tervona"
    : publicRoute === "/cms" ? "后台管理 - Tervona" : path === "/" ? "Tervona" : `${cleanTitle(pageFor(path).title || "CMS Manager")} - Tervona`;
  app.innerHTML = withSiteBaseUrls(path === "/" ? renderHome() : renderRoute(path));
  bind();
  requestAnimationFrame(() => {
    syncScrollEffects();
    if (options.preserveScroll) {
      window.scrollTo({ top: preservedScrollY, left: 0 });
    } else if (location.hash && !location.hash.startsWith("#/")) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo({ top: 0, left: 0 });
    }
  });
}

function renderHeader(options = {}) {
  const state = cmsAdminState();
  const nav = cmsMenus(state);
  const settings = cmsSiteSettings(state);
  const currentRoute = routePathOnly(getRoutePath());
  const overlay = !options.forceSolid && (currentRoute === "/"
    || currentRoute === "/news"
    || currentRoute === "/company"
    || currentRoute === "/innovation"
    || currentRoute === "/contact-us"
    || currentRoute.startsWith("/products")
    || currentRoute.startsWith("/download/")
    || currentRoute.startsWith("/resource-support/"));
  return `<header class="topbar ${overlay ? "topbar-overlay" : ""} ${options.className || ""}">
    <div class="top-small">
      <a href="${localHref("/contact-us")}">Online Support</a>
      ${renderLanguageSwitcher(settings)}
    </div>
    <div class="main-nav">
      ${logo()}
      <nav class="nav-links">
        ${nav.map((item) => `<div class="nav-item">
          <a href="${hrefFor(item.href)}">${esc(item.label)}</a>
          ${item.children?.length ? renderMega(item) : ""}
        </div>`).join("")}
      </nav>
      <a class="contact-pill" href="${hrefFor(settings.headerContactHref)}">${esc(settings.headerContactText)}</a>
      <button class="mobile-menu" type="button" title="Menu" aria-label="Open menu" aria-expanded="false" data-mobile-menu-toggle>${icon("menu")}</button>
    </div>
    ${renderMobileDrawer(nav, settings)}
  </header>`;
}

function renderMega(item) {
  const productLike = item.kind === "products";
  if (productLike) return renderProductMega(item);
  const links = (item.children?.length ? item.children : []).map((child) => [child.label, child.href, child.icon || FALLBACK_SCENE]);
  return `<div class="mega fox-dropdown support-drop">
    <div class="drop-inner">
      <div class="drop-top">
        <div><h3>${esc(item.label)}</h3><p>${esc(item.intro)}</p></div>
      </div>
      <div class="drop-grid">
        ${links.map(([text, href, img]) => `<a class="drop-pill" href="${hrefFor(href)}">
          <img src="${img}" alt=""><span>${esc(text)}</span>
        </a>`).join("")}
      </div>
    </div>
  </div>`;
}

function renderProductTaxonomyTree(nodes, level = 0) {
  if (!Array.isArray(nodes) || !nodes.length) return "";
  return `<ul class="product-taxonomy-level level-${level}">
    ${nodes.map((node) => `<li>
      <div class="product-taxonomy-node">
        ${node.href ? `<a href="${hrefFor(node.href)}">${esc(node.label)}</a>` : `<span>${esc(node.label)}</span>`}
      </div>
      ${renderProductTaxonomyTree(node.children, level + 1)}
    </li>`).join("")}
  </ul>`;
}

function renderProductMega(item) {
  const taxonomy = productTaxonomy();
  const activeSlug = activeProductTaxonomySlug();
  return `<div class="mega fox-dropdown product-taxonomy-drop" data-product-mega>
    <div class="drop-inner">
      <div class="drop-top">
        <div><h3>${esc(item.label)}</h3><p>${esc(item.intro)}</p></div>
        <a class="all-products" href="${localHref("/products")}"><span>${icon("arrow")}</span>All Products</a>
      </div>
      <div class="product-taxonomy-tabs" role="tablist" aria-label="Product categories">
        ${taxonomy.map((category) => `<button type="button" class="product-taxonomy-tab ${category.slug === activeSlug ? "active" : ""}" role="tab" aria-selected="${category.slug === activeSlug ? "true" : "false"}" data-product-category-tab="${esc(category.slug)}">
          <span class="product-taxonomy-tab-media">${productMegaVisual(category)}</span>
          <span class="product-taxonomy-tab-copy"><strong>${esc(category.label)}</strong><small>${esc(productMegaPresentation(category).description)}</small></span>
        </button>`).join("")}
      </div>
      <div class="product-taxonomy-panels">
        ${taxonomy.map((category) => `<section class="product-taxonomy-panel ${category.slug === activeSlug ? "active" : ""}" role="tabpanel" ${category.slug === activeSlug ? "" : "hidden"} data-product-category-panel="${esc(category.slug)}">
          <header>
            <div><small>Product Category</small><h4>${esc(category.label)}</h4><p>${esc(productMegaPresentation(category).description)}</p></div>
            <a href="${localHref(category.href || `/products/${category.slug}`)}">View Category ${icon("arrow")}</a>
          </header>
          ${renderProductTaxonomyTree(category.children)}
        </section>`).join("")}
      </div>
    </div>
  </div>`;
}

function renderMobileProductTaxonomy() {
  const activeSlug = activeProductTaxonomySlug();
  return productTaxonomy().map((category) => `<a class="mobile-product-category-link ${category.slug === activeSlug ? "active" : ""}" href="${localHref(category.href || `/products/${category.slug}`)}">${esc(category.label)}</a>`).join("");
}

function renderMobileDrawer(nav, settings) {
  return `<div class="mobile-drawer" data-mobile-drawer>
    <div class="mobile-drawer-panel">
      <div class="mobile-drawer-head">
        <button class="mobile-drawer-close" type="button" aria-label="Close menu" data-mobile-menu-close>${icon("close")}</button>
        ${logo()}
        <div class="mobile-drawer-head-language">${renderLanguageSwitcher(settings, "mobile")}</div>
      </div>
      <nav class="mobile-drawer-nav">
        ${nav.map((item, index) => `<section class="mobile-drawer-item ${item.children?.length ? "has-children" : ""}">
          <div>
            ${item.children?.length
              ? `<button class="mobile-drawer-section-toggle" type="button" data-mobile-submenu="${index}" aria-expanded="false"><span>${esc(item.label)}</span><i aria-hidden="true">+</i></button>`
              : `<a href="${hrefFor(item.href)}">${esc(item.label)}</a>`}
          </div>
          ${item.children?.length ? `<div class="mobile-submenu ${item.kind === "products" ? "mobile-product-submenu" : ""}" data-mobile-submenu-panel="${index}">
            ${item.kind === "products" ? renderMobileProductTaxonomy() : item.children.map((child) => `<a href="${hrefFor(child.href)}">${child.icon ? `<img src="${esc(child.icon)}" alt="">` : ""}<span>${esc(child.label)}</span></a>`).join("")}
          </div>` : ""}
        </section>`).join("")}
        <section class="mobile-drawer-item mobile-drawer-utility"><div><a href="${localHref("/contact-us")}">Online Support</a></div></section>
      </nav>
      <a class="mobile-contact" href="${hrefFor(settings.headerContactHref)}">${esc(settings.headerContactText)}</a>
    </div>
  </div>`;
}

function renderRoute(path) {
  const route = routePathOnly(path);
  const params = routeParams(path);
  if (!PUBLIC_NEWS_ENABLED && /^\/news(?:\/|-|$)/.test(route)) return renderUnavailablePage();
  if (isRetiredPublicRoute(route)) return renderUnavailablePage();
  if (route === "/cms/editor") return renderCmsContentEditor(params);
  if (route !== "/" && Array.isArray(pageFor(route).blocks) && pageFor(route).blocks.length) return renderGenericPage(route);
  if (route === "/products") return renderProductHub();
  if (/^\/products\/[^/]+\/[^/]+$/.test(route)) return renderProductDetailPage(route);
  if (/^\/products\/[^/]+$/.test(route)) return renderProductCategory(route.split("/")[2]);
  if (/^\/download\/[^/]+$/.test(route)) return renderDownloadPage(route.split("/")[2], params, normalizePath(path));
  if (route === "/resource-support/references" && params.has("case")) return renderReferenceDetailPage(Number(params.get("case")) || 1);
  if (route === "/resource-support/references") return renderReferencesPage();
  if (route === "/company") return renderCompanyPage();
  if (route === "/partner") return renderPartnerPage();
  if (route === "/innovation") return renderInnovationPage();
  if (route === "/news") return renderNewsList();
  if (/^\/news-\d+$/.test(route)) return renderNewsList(Number(route.split("-").pop()) || 1);
  if (/^\/news\/[^/]+$/.test(route)) return renderNewsDetailPage(route);
  if (route === "/contact-us") return renderContactPage();
  if (/^\/forms\/[^/]+$/.test(route)) return renderStandaloneFormPage(route.split("/")[2]);
  if (route === "/cms") return renderCmsAdmin(params);
  return renderGenericPage(route);
}

function isRetiredPublicRoute(route) {
  if (route === "/privacy" || route === "/sitemap.html") return true;
  if (!route.startsWith("/products/") || route === "/products") return false;
  const categoryPaths = new Set(productCategories().map((category) => `/products/${category.slug}`));
  const productPaths = new Set(tervonaCatalogProducts()
    .filter((product) => product.status === "Published")
    .map((product) => routePathOnly(product.path)));
  return !categoryPaths.has(route) && !productPaths.has(route);
}

function renderUnavailablePage() {
  return `${renderHeader({ forceSolid: true })}<main class="inside-main"><article class="article-page"><h1>Page not found</h1><p>The requested page is not available.</p><p><a class="contact-pill" href="${localHref("/")}">Return to Home</a></p></article></main>${renderFooter()}`;
}

function renderProductHub() {
  const categories = productCategories();
  const systemImage = categories.find((category) => category.slug === "all-in-one-ess")?.heroImage || categories[0]?.heroImage;
  return `${renderHeader()}<main class="inside-main">
    ${productCenterHero("Product Center", "/assets/tervona-products-home-banner-v2.png")}
    <section class="product-index product-hub-source">
      <div class="section-title product-hub-title"><span>Our Products</span><h2>Energy products built<br>around <mark>real system needs</mark></h2><p>Explore Tervona low-voltage batteries, EcoLink hybrid inverters, single-phase off-grid inverters and integrated energy storage systems.</p><i class="product-hub-scroll-cue">${icon("arrow")}</i></div>
      <div class="product-hub-category-grid">
        ${categories.map((cat) => `<a class="product-hub-category-card" href="${localHref(`/products/${cat.slug}`)}" aria-label="View ${esc(cat.title)}">
          <div class="product-hub-card-copy"><h3>${esc(cat.title)}</h3><p>${esc(cat.intro)}</p></div>
          <div class="product-hub-card-media"><img src="${esc(cat.heroImage || `${ASSET}/tervona-products-home-banner-v2.png`)}" alt="${esc(cat.title)}"></div>
          <span class="product-hub-card-arrow">${icon("arrow")}</span>
        </a>`).join("")}
      </div>
    </section>
    <section class="product-projects tervona-product-assist">
      <div><span>PRODUCT SELECTION</span><h2>Choose the right power and storage combination</h2><p>Tell us about the load, PV array, backup requirement and installation environment. Tervona can help narrow the product family and configuration for the project.</p><a class="source-learn dark" href="${localHref("/contact-us")}">${icon("arrow")} Talk to Tervona</a></div>
      <img src="${esc(systemImage)}" alt="Tervona all-in-one energy storage range">
    </section>
    ${renderFooterCta()}
  </main>${renderFooter()}`;
}

function newsTrackOffset() {
  const cardWidth = Math.min(540, Math.max(420, window.innerWidth * 0.281));
  return Math.round(newsIndex * (cardWidth + 24));
}

function renderProductCategory(slug) {
  const cat = categoryForSlug(slug);
  const page = pageFor(`/products/${slug}`);
  const pages = productPages(slug);
  const records = pages.map((item) => cmsNormalizeProductRecord(cmsProductRecordForPath(item.path), item.path));
  const heroProduct = records[0];
  const displayProducts = records;
  return `${renderHeader({ forceSolid: true, className: "product-category-header" })}<main class="inside-main">
    <section class="source-category-hero source-category-hero-static source-category-${esc(slug)}" data-category-hero>
      <div class="source-category-sticky">
        ${heroProduct ? `<article class="source-hero-panel source-hero-panel-hot source-hero-panel-static tervona-category-banner">
          <picture class="source-category-scene">
            <img src="${esc(cat.bannerBackground || categoryHotDesktopHero(slug, heroProduct))}" alt="">
          </picture>
          <div class="source-category-hero-shade hot"></div>
          <div class="source-category-product-art" aria-hidden="true"><img src="${esc(heroProduct.heroImage)}" alt=""></div>
          <div class="source-hot-product">
            <h1>${esc(heroProduct.title)}</h1>
            <p>${esc(productKind(heroProduct, slug))}</p>
            <a class="source-learn" href="${localHref(heroProduct.path)}">${icon("arrow")} Learn More</a>
          </div>
        </article>` : `<article class="source-hero-panel source-hero-panel-main">
          <picture>
            <source media="(max-width: 767px)" srcset="${esc(categoryMobileHero(slug))}">
            <img src="${esc(categoryDesktopHero(slug))}" alt="">
          </picture>
          <div class="source-category-hero-shade"></div>
          <div class="source-category-copy">
            <h1>${esc(plainTitle(page.title))}</h1>
            <p>${esc(categoryIntro(slug, cat))}</p>
            <nav class="source-breadcrumb"><a href="${localHref("/")}">Home</a><i>|</i><a href="${localHref("/products")}">Products</a><i>|</i><span>${esc(cat.title)}</span></nav>
          </div>
        </article>`}
      </div>
    </section>
    <section class="source-product-list">
      ${displayProducts.map((record) => renderSourceProductRow(record, slug)).join("") || `<article class="source-product-row empty"><h2>${esc(cat.title)}</h2><p>${esc(cat.intro)}</p></article>`}
    </section>
    <section class="source-resource-band">
      <img src="${esc(cat.heroImage || categoryDesktopHero(slug))}" alt="${esc(cat.title)}">
      <div>
        <span>Product Support</span>
        <h2>Need help selecting a model?</h2>
        <p>Share your target load, battery capacity, PV array and backup requirements. Our team can help identify the right configuration and provide the current product documentation.</p>
        <a class="source-learn dark" href="${localHref("/contact-us")}">${icon("arrow")} Contact Tervona</a>
      </div>
    </section>
    ${renderFooterCta()}
  </main>${renderFooter()}`;
}

function categoryIntro(slug, cat) {
  if (slug === "pv-inverter") return "Tervona PV inverters are precision engineered to provide maximum performance, efficiency, reliability and longevity.";
  return cat.intro;
}

function categoryDesktopHero(slug) {
  const category = categoryForSlug(slug);
  if (category?.heroImage) return category.heroImage;
  return "/assets/tervona-products/category-scene-tervona-v2.png";
}

function categoryMobileHero(slug) {
  return categoryDesktopHero(slug);
}

function categoryHotDesktopHero(slug, record) {
  if (tervonaCatalogProducts().length) return categoryForSlug(slug)?.heroImage || record.heroImage || categoryDesktopHero(slug);
  return record.heroImage || categoryDesktopHero(slug);
}

function categoryHotMobileHero(slug, record) {
  return categoryHotDesktopHero(slug, record);
}

function sourceAsset(path) {
  if (!path) return FALLBACK_SCENE;
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

function productKind(record, slug) {
  if (record?.productType) return record.productType;
  const title = (record?.title || "").toLowerCase();
  if (slug === "pv-inverter") {
    return title.includes("t series") ? "THREE-PHASE PV INVERTER" : "SINGLE-PHASE PV INVERTER";
  }
  if (slug === "hybrid-inverter") return "HYBRID INVERTER";
  if (slug === "battery") return "BATTERY STORAGE";
  if (slug === "ev-charger") return "EV CHARGER";
  return (record?.categoryLabel || categoryForSlug(slug).title).toUpperCase();
}

function productPowerRange(record, slug) {
  if (record?.rangeLabel) return record.rangeLabel;
  const title = record?.title || "";
  if (slug === "pv-inverter") {
    if (/^G Series/i.test(title)) return "Power Range 7~10.5kW";
    if (/^T Series/i.test(title)) return "Power Range 3~25kW";
    if (/^F Series/i.test(title)) return "Power Range 0.7~3.3kW";
  }
  return record?.summary || record?.categoryLabel || categoryForSlug(slug).intro;
}

function productListImage(record, slug) {
  const route = routePathOnly(record?.path || record?.id || "");
  return record?.listImage
    || (window.PRODUCT_LIST_MEDIA && window.PRODUCT_LIST_MEDIA[route])
    || record?.heroImage
    || categoryDesktopHero(slug);
}

function renderSourceProductRow(record, slug) {
  const fallbackHighlights = [
    { title: "Remote Monitoring", body: "Monitor your system remotely via smartphone app or web portal." },
    { title: "High Performance", body: "Low start-up voltage, wide voltage range and high maximum efficiency." },
    { title: "Easy Installation", body: "Flexible configuration, plug and play set-up." },
    { title: "IP65 Rated", body: "Engineered to last with maximum flexibility." },
  ];
  const rawHighlights = record.highlights && record.highlights.length ? record.highlights : fallbackHighlights;
  const highlights = rawHighlights.slice(0, 4).map((item, index) => {
    const title = item?.title || fallbackHighlights[index]?.title || fallbackHighlights[0].title;
    const fallback = /monitor/i.test(title)
      ? fallbackHighlights[0]
      : /performance|efficien/i.test(title)
        ? fallbackHighlights[1]
        : /install/i.test(title)
          ? fallbackHighlights[2]
          : fallbackHighlights[3];
    const placeholderBody = /editable product highlight|cms product model/i.test(item?.body || "");
    return {
      title,
      body: placeholderBody || !item?.body ? fallback.body : item.body,
    };
  });
  const marquee = `${record.title} ${productKind(record, slug)}`;
  return `<article class="source-product-row">
    <div class="source-product-media"><img src="${esc(productListImage(record, slug))}" alt="${esc(record.title)}"></div>
    <div class="source-product-info">
      <div class="source-product-top">
        <div><span>${esc(productKind(record, slug))}</span><h2>${esc(record.title)}</h2></div>
        <div><span>Power Range</span><h3>${esc(productPowerRange(record, slug).replace(/^Power Range\s*/i, ""))}</h3></div>
      </div>
      <div class="source-product-bottom">
        <div class="source-feature-slider">${highlights.map((item, index) => `<section class="${index === 0 ? "active" : ""}"><b>${icon("bolt")}</b><h4>${esc(item.title)}</h4><p>${esc(item.body)}</p></section>`).join("")}<small>1<span>/</span>${highlights.length}</small></div>
        <a class="source-detail-link" href="${localHref(record.path)}"><span>View Product Details</span>${icon("arrow")}</a>
      </div>
    </div>
    <div class="source-product-marquee"><span>${esc(marquee)}</span><span>${esc(marquee)}</span><span>${esc(marquee)}</span></div>
  </article>`;
}

function productCenterHero(label, image = "") {
  return `<section class="product-source-hero">
    <img src="${esc(image || `${ASSET}/tervona-products-home-banner-v2.png`)}" alt="Tervona residential solar and energy storage system at a modern home">
    <div class="product-source-hero-shade"></div>
    <div class="product-source-hero-copy"><span>TERVONA RESIDENTIAL ENERGY</span><h1>Power for the way<br>homes really live</h1><p>Solar, storage and backup products designed as one practical home energy system.</p></div>
    <div class="product-scroll-mark"><span></span><b>${esc(label || "Product Center")}</b></div>
  </section>`;
}

function renderSeriesStatValue(value, attributes = "") {
  const text = String(value || "").trim();
  const measurement = text.match(/^([+-]?\d+(?:\.\d+)?)\s*(kWh|kW|W|Ah|A|V|ms|kg|mm)$/i);
  if (measurement) {
    return `<strong class="is-multiline" ${attributes}>${esc(measurement[1])}<small>${esc(measurement[2])}</small></strong>`;
  }
  if (text.length > 10 && /[-\s]/.test(text)) {
    const parts = text.split(/[-\s]+/).filter(Boolean);
    const midpoint = Math.ceil(parts.length / 2);
    return `<strong class="is-compact" ${attributes}>${esc(parts.slice(0, midpoint).join(" "))}<br>${esc(parts.slice(midpoint).join(" "))}</strong>`;
  }
  return `<strong ${attributes}>${esc(text)}</strong>`;
}

function renderProductAdvantages(record, { preview = false } = {}) {
  const highlightIcons = ["bolt", "eye", "link", "globe"];
  const sceneImage = record?.advantagesSceneImage || "/assets/tervona-products/core-advantages-scene-v1.png";
  const previewAttributes = (index, field) => preview ? ` data-live-preview="highlight${index}${field}"` : "";
  return `<section class="product-advantages${preview ? " cms-preview-advantages" : ""}" aria-labelledby="product-advantages-title">
    <div class="product-advantages-content">
      <h2 id="product-advantages-title">Core Advantages</h2>
      <div class="product-advantages-grid">
        ${record.highlights.map((item, index) => `<article>
          <b aria-hidden="true">${icon(highlightIcons[index] || "bolt")}</b>
          <h3${previewAttributes(index, "Title")}>${esc(item.title)}</h3>
          <p${previewAttributes(index, "Body")}>${esc(item.body)}</p>
        </article>`).join("")}
      </div>
    </div>
    <div class="product-advantages-scene">
      <img src="${esc(sceneImage)}" alt="Tervona home energy system in a residential solar setting">
      <a class="product-advantages-cta" href="${preview ? "#" : localHref("/contact-us")}">
        <span>Get Product</span><i aria-hidden="true">${icon("arrow")}</i>
      </a>
    </div>
  </section>`;
}

function renderProductDetailPage(path) {
  const page = pageFor(path);
  const parts = normalizePath(path).split("/");
  const cat = categoryForSlug(parts[2]);
  const productRecord = cmsNormalizeProductRecord(cmsProductRecordForPath(path), path);
  const categoryLabel = cat.title.replace(/ies$/, "y").replace(/s$/, "");
  const isTervonaProductDetail = tervonaCatalogProducts().some((product) => routePathOnly(product.path) === routePathOnly(path));
  const bannerImage = productRecord.bannerImage || productRecord.heroImage;
  const bannerTitle = productRecord.title || cleanTitle(page.title);
  const directDatasheetUrl = String(productRecord.datasheetUrl || "").trim();
  const productDownloadCards = downloadCategories().slice(0, 4).map(([slug, label]) => {
    const isDirectDatasheet = slug === "datasheets" && directDatasheetUrl;
    const target = isDirectDatasheet ? hrefFor(directDatasheetUrl) : localHref(`/download/${slug}`);
    const attributes = isDirectDatasheet ? ` target="_blank" rel="noopener" aria-label="Open ${esc(bannerTitle)} datasheet PDF"` : "";
    return `<a href="${esc(target)}"${attributes}><span>${esc(label)}</span>${icon("arrow")}</a>`;
  }).join("");
  return `${renderHeader()}<main class="series-main">
    <section class="series-hero unified-product-banner">
      <div class="series-hero-bg"><img src="${esc(bannerImage)}" alt="${esc(bannerTitle)}"></div>
      <div class="series-hero-copy">
        <a class="back-link" href="${localHref(`/products/${cat.slug}`)}">${esc(categoryLabel)}</a>
        <h1>${esc(bannerTitle)}</h1>
        <p>${esc(productRecord.heroText)}</p>
      </div>
      <div class="series-hero-stats">
        ${productRecord.stats.map((stat) => `<article class="series-hero-stat"><span>${esc(stat.label)}</span>${renderSeriesStatValue(stat.value)}</article>`).join("")}
      </div>
      <nav class="series-hero-breadcrumb"><a href="${localHref("/")}">Home</a><i>|</i><a href="${localHref("/products")}">Products</a><i>|</i><a href="${localHref(`/products/${cat.slug}`)}">${esc(cat.title)}</a></nav>
    </section>
    ${renderProductAdvantages(productRecord)}
    ${isTervonaProductDetail ? `<section class="product-downloads" aria-labelledby="product-downloads-title">
      <h2 id="product-downloads-title">Download</h2>
      <div class="resource-grid">
        ${productDownloadCards}
      </div>
    </section>` : `${renderProductModels(productRecord.models)}
    ${renderProductTechnicalData(productRecord.technicalSections)}
    <section class="product-detail-contact"><div><span>PROJECT SUPPORT</span><h2>Confirm the right configuration for your project</h2><p>Contact Tervona for model availability, installation guidance and the latest approved product documentation.</p></div><a class="source-learn dark" href="${localHref("/contact-us")}">${icon("arrow")} Contact Tervona</a></section>`}
    ${renderFooterCta()}
  </main>${renderFooter()}`;
}

function renderProductModels(models) {
  if (!models?.columns?.length || !models?.rows?.length) return "";
  return `<section class="product-models-section">
    <header><span>MODEL RANGE</span><h2>${esc(models.title || "Available Configurations")}</h2></header>
    <div class="product-models-table-wrap"><table class="product-models-table">
      <thead><tr>${models.columns.map((column) => `<th>${esc(column)}</th>`).join("")}</tr></thead>
      <tbody>${models.rows.map((row) => `<tr>${row.map((value, index) => `<${index === 0 ? "th" : "td"}>${esc(value)}</${index === 0 ? "th" : "td"}>`).join("")}</tr>`).join("")}</tbody>
    </table></div>
  </section>`;
}

function renderProductTechnicalData(sections) {
  if (!Array.isArray(sections) || !sections.length) return "";
  return `<section class="product-technical-section">
    <header><span>TECHNICAL DATA</span><h2>Key Specifications</h2></header>
    <div class="product-technical-grid">${sections.map((section) => `<article><h3>${esc(section.title)}</h3><dl>${(section.rows || []).map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl></article>`).join("")}</div>
  </section>`;
}

function downloadBaseSlug(segment) {
  return String(segment || "datasheets").replace(/-\d+$/, "");
}

function productIdFromPath(path) {
  return routePathOnly(path).split("/").filter(Boolean).pop();
}

function renderDownloadPage(segment, params = new URLSearchParams(), currentPath = "") {
  const slug = downloadBaseSlug(segment);
  const active = downloadCategories().find((item) => item[0] === slug) || downloadCategories()[0];
  const state = cmsAdminState();
  const categories = downloadCategories(state);
  const selectedProduct = params.get("product") || "";
  const selectedTypes = params.getAll("type").length ? params.getAll("type") : [slug];
  const keyword = params.get("keyword") || "";
  const downloadRecords = (state.downloads || []).filter((item) => item.status !== "Hidden");
  const productOptions = [...new Map(downloadRecords.map((item) => [String(item.product || item.productLabel || ""), item.productLabel || item.product || "Unassigned"])).entries()]
    .filter(([value]) => value);
  const initialMatches = downloadRecords.filter((item) => {
    const matchesType = !selectedTypes.length || selectedTypes.includes(item.type);
    const matchesProduct = !selectedProduct || String(item.product || item.productLabel || "") === selectedProduct;
    const haystack = `${item.title || ""} ${item.productLabel || ""} ${item.type || ""}`.toLowerCase();
    return matchesType && matchesProduct && (!keyword || haystack.includes(keyword.toLowerCase()));
  });
  return `${renderHeader()}<main class="inside-main">
    ${sourceBannerHero("DOWNLOADS", "/assets/tervona-downloads-hero-v2.png", ["Home", "Downloads", active[1]])}
    <section class="source-download-center" data-download-center>
      <form class="source-download-search" data-download-filter>
        <div class="source-download-search-row">
          <label class="source-download-keyword"><span>Search files</span>${icon("search")}<input type="search" value="${esc(keyword)}" placeholder="Please enter keywords for search" data-download-keyword></label>
          <label class="source-download-product"><span>Product Type</span><select data-download-product><option value="">Product Type</option>${productOptions.map(([value, label]) => `<option value="${esc(value)}" ${selectedProduct === value ? "selected" : ""}>${esc(label)}</option>`).join("")}</select></label>
        </div>
        <fieldset class="source-download-types"><legend>File Type：</legend><div>${categories.map(([key, label]) => `<label><input type="checkbox" value="${esc(key)}" ${selectedTypes.includes(key) ? "checked" : ""} data-download-type><span>${esc(label)}</span></label>`).join("")}</div></fieldset>
        <div class="source-download-submit"><span>Show Results:</span><button type="reset">Reset</button><button type="submit">Retrieval</button></div>
      </form>
      <div class="source-download-results">
        <p class="source-download-total">Total <strong data-download-count>${initialMatches.length}</strong> Results</p>
        <div class="source-download-table" role="table" aria-label="Download files">
          <div class="source-download-row source-download-head" role="row"><b>File Name</b><b>Product Type</b><b>File Type</b><b><span class="visually-hidden">Actions</span></b></div>
          ${downloadRecords.map((item) => {
            const fileUrl = String(item.fileUrl || "").trim();
            const fileHref = fileUrl ? hrefFor(fileUrl) : "";
            const categoryLabel = categories.find(([key]) => key === item.type)?.[1] || item.type || "File";
            const downloadName = `${String(item.title || "download").replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "download"}.pdf`;
            const haystack = `${item.title || ""} ${item.productLabel || ""} ${categoryLabel}`.toLowerCase();
            const initiallyVisible = initialMatches.includes(item);
            return `<article class="source-download-row" role="row" data-download-row data-download-search="${esc(haystack)}" data-download-product-value="${esc(String(item.product || item.productLabel || ""))}" data-download-type-value="${esc(item.type || "")}" ${initiallyVisible ? "" : "hidden"}>
              <strong>${esc(item.title)}</strong><span>${esc(item.productLabel || item.product || "—")}</span><span>${esc(categoryLabel)}</span>
              <nav class="source-download-actions" aria-label="${esc(item.title)} actions">${fileHref
                ? `<a href="${esc(fileHref)}" target="_blank" rel="noopener" aria-label="Preview ${esc(item.title)}" title="Preview">${icon("eye")}</a><a href="${esc(fileHref)}" download="${esc(downloadName)}" aria-label="Download ${esc(item.title)}" title="Download">${icon("download")}</a>`
                : `<span>Pending</span>`}</nav>
            </article>`;
          }).join("")}
          <div class="source-download-empty" data-download-empty ${initialMatches.length ? "hidden" : ""}>No relevant content</div>
        </div>
      </div>
    </section>
    ${renderFooterCta()}
  </main>${renderFooter()}`;
}

function renderDownloadPagination(slug, segment) {
  const pageNumber = Number(String(segment || "").match(/-(\d+)$/)?.[1] || 1);
  const maxBySlug = slug === "certificates" ? 4 : (slug === "datasheets" || slug === "user-manual" ? 3 : (slug === "quick-install-guides" ? 2 : 1));
  if (maxBySlug <= 1) return "";
  return `<nav class="page-dots">${Array.from({ length: maxBySlug }).map((_, i) => {
    const page = i + 1;
    const target = page === 1 ? `/download/${slug}` : `/download/${slug}-${page}`;
    return `<a class="${page === pageNumber ? "active" : ""}" href="${localHref(target)}">${page}</a>`;
  }).join("")}</nav>`;
}

function renderReferencesPage() {
  const page = pageFor("/resource-support/references");
  return `${renderHeader()}<main class="inside-main">
    ${sourceBannerHero("PROJECT REFERENCES", "/assets/tervona-partner-home-hero-v2.png", ["Home", "Support & Resources", "Project References"])}
    <section class="reference-grid">${data.cases.concat(data.cases).map((item, i) => `<a class="reference-card" href="${localHref(`/resource-support/references?case=${i + 1}`)}"><img src="${item[3]}" alt=""><div><span>${esc(item[1])}</span><h3>${esc(item[0])}</h3><p>${esc(item[2])}</p></div></a>`).join("")}</section>
    ${renderFooterCta()}
  </main>${renderFooter()}`;
}

function renderReferenceDetailPage(index) {
  const cases = data.cases.concat(data.cases);
  const item = cases[(Math.max(index, 1) - 1) % cases.length];
  return `${renderHeader()}<main class="inside-main">
    ${sourceBannerHero("PROJECT REFERENCES", "/assets/tervona-partner-home-hero-v2.png", ["Home", "Support & Resources", item[0]])}
    <article class="case-detail-page">
      <a class="back-link" href="${localHref("/resource-support/references")}">Back to Project References</a>
      <div class="case-detail-grid">
        <img src="${item[3]}" alt="">
        <div>
          <span>${esc(item[1])}</span>
          <h2>${esc(item[0])}</h2>
          <p>${esc(item[2])}</p>
          <p>Explore the system configuration, site context and clean-energy results represented by this project reference.</p>
        </div>
      </div>
    </article>
    ${renderFooterCta()}
  </main>${renderFooter()}`;
}

function renderCompanyPage() {
  return `${renderHeader()}<main class="inside-main">
    ${sourceBannerHero("RESIDENTIAL ENERGY, BUILT IN SHENZHEN", "/assets/tervona-products-home-banner-v2.png", ["Home", "Company"])}
    <section class="company-story source-company-story"><div><span>ABOUT TERVONA</span><h2>Practical energy technology for modern homes</h2></div><p>Shenzhen Tervona Tech Co., Ltd. was established in Shenzhen in 2026. We focus on residential energy storage technology, photovoltaic equipment, intelligent power distribution and energy software.</p></section>
    <section class="company-facts" aria-label="Tervona company facts"><article><span>Founded</span><strong>2026</strong></article><article><span>Headquarters</span><strong>Shenzhen, China</strong></article><article><span>Primary Focus</span><strong>Residential Energy Storage</strong></article></section>
    <section class="company-image-band"><img src="/assets/tervona-partner-home-hero-v2.png" alt="Tervona residential energy solution"><div><span>ENGINEERING &amp; SUPPLY</span><h2>From product development to reliable residential energy solutions</h2></div></section>
    ${renderFooterCta()}
  </main>${renderFooter()}`;
}

function partnerModeIcon(mode) {
  const paths = {
    distributor: '<rect x="6" y="5" width="12" height="7" rx="1.5"></rect><rect x="3" y="17" width="7" height="5" rx="1.2"></rect><rect x="14" y="17" width="7" height="5" rx="1.2"></rect><path d="M12 12v3M6.5 15h11M6.5 15v2M17.5 15v2"></path>',
    venture: '<path d="M4 21V10l5-3v14M9 21V4l6 3v14M15 21v-9l5-2v11M2 21h20"></path><path d="M7 12h.01M7 16h.01M12 9h.01M12 13h.01M12 17h.01M18 15h.01M18 18h.01"></path>',
    installer: '<path d="m14.2 6.2 3.6 3.6M6.8 19.2l7.7-7.7a5 5 0 0 0 5.2-7.2l-3.1 3.1-2.8-.8-.8-2.8 3.1-3.1a5 5 0 0 0-7.2 5.2l-7.7 7.7a2.3 2.3 0 0 0 0 3.3l2.3 2.3a2.3 2.3 0 0 0 3.3 0Z"></path><path d="m15 15 6 6M18 18l-2 2"></path>',
    odm: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"></path><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v8.7"></path><path d="m8 5.2 8 4.5"></path>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[mode] || paths.odm}</svg>`;
}

function renderPartnerForm(form) {
  const fallback = DEFAULT_PUBLIC_FORMS.find((item) => item.slug === "partner");
  const activeForm = form || fallback;
  const fields = (activeForm?.fields || fallback.fields).filter((field) => field.key !== "partnershipModel");
  const modes = ["Distributor", "Joint Venture", "Installer", "ODM"];
  return `<form class="partner-form" data-public-form data-form-id="${esc(activeForm.id)}" data-form-slug="partner">
    <label class="contact-honeypot" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
    <fieldset class="partner-form-models"><legend>Partnership Model *</legend><div>${modes.map((mode) => `<label><input type="radio" name="partnershipModel" value="${esc(mode)}" required><span>${esc(mode)}</span></label>`).join("")}</div></fieldset>
    ${fields.map(renderConfiguredField).join("")}
    <button type="submit" class="contact-pill">${esc(activeForm.submitLabel || "Submit application")}</button><p class="contact-form-status" role="status" aria-live="polite"></p>
  </form>`;
}

function renderPartnerPage() {
  const modes = [
    { key: "distributor", label: "Distributor" },
    { key: "venture", label: "Joint Venture" },
    { key: "installer", label: "Installer" },
    { key: "odm", label: "ODM" },
  ];
  const form = publicFormBySlug("partner");
  return `${renderHeader()}<main class="inside-main partner-page">
    <section class="partner-hero">
      <img src="/assets/tervona-partner-home-hero-v2.png" alt="Tervona Ecolink 6 kW residential inverter installed at a solar home">
      <div class="partner-hero-shade"></div>
      <div class="partner-hero-copy"><span>PARTNER WITH TERVONA</span><h1>Build the future of<br>home energy together</h1><p>Work with Tervona to bring dependable residential energy solutions to more homes.</p></div>
    </section>
    <section class="partner-models" id="partner-models">
      <header><span>PARTNERSHIP MODELS</span><h2>Choose how we grow together</h2></header>
      <div class="partner-model-grid">${modes.map((mode) => `<button type="button" data-partner-mode="${esc(mode.label)}" aria-pressed="false"><i>${partnerModeIcon(mode.key)}</i><strong>${esc(mode.label)}</strong></button>`).join("")}</div>
    </section>
    <section class="partner-application" id="partner-application">
      <div class="partner-application-copy"><span>PARTNER APPLICATION</span><h2>Start a partnership conversation</h2><p>Select one cooperation model and share your company details with our team.</p></div>
      ${renderPartnerForm(form)}
    </section>
  </main>${renderFooter()}`;
}

function renderInnovationPage() {
  return `${renderHeader()}<main class="inside-main">
    ${sourceBannerHero("INNOVATION", "/assets/tervona-downloads-hero-v2.png", ["Home", "Innovation"])}
    <section class="innovation-overview">
      <header><h2><mark>Constant Innovation</mark> and <mark>Meticulous Manufacturing</mark> to Build Trust with Every Delivery</h2><p>At the heart of our operation is an advanced R&amp;D centre where engineers and technicians refine solar inverter and energy storage technology, from product development through rigorous manufacturing and quality control.</p></header>
    </section>
    <section class="constant-sequence innovation-page-motion">
      <div class="constant-sticky">
        <div class="constant-card">
          <img src="/assets/tervona-products/category-scene-tervona-v2.png" alt="Tervona product development environment">
          <div class="constant-shade"></div>
          <div class="constant-card-copy"><span>Innovation &amp; Manufacturing</span><h2>Precision in Every Process</h2></div>
        </div>
        <div class="constant-logo-stage innovation-logo-stage"><img class="constant-mark" src="/assets/tervona-logo-transparent.png" alt="Tervona"><h2>Constant Innovation and Meticulous<br>Manufacturing</h2></div>
      </div>
    </section>
    <section class="innovation-stats"><article><strong>70+</strong><span>Operations in countries</span></article><article><strong>5000+</strong><span>Employees worldwide</span></article><article><strong>6</strong><span>R&amp;D Centers</span></article></section>
    ${renderFooterCta()}
  </main>${renderFooter()}`;
}

function renderNewsList(pageNumber = 1) {
  const news = cmsAdminState().news
    .filter((item) => item.status !== "Hidden" && /^\/news\/[^/]+$/.test(normalizePath(item.path)));
  const perPage = 9;
  const current = Math.max(1, pageNumber);
  const pageNews = news.slice((current - 1) * perPage, current * perPage);
  const pageCount = Math.max(1, Math.ceil(news.length / perPage));
  const featured = pageNews[0];
  const listNews = pageNews.slice(1);
  return `${renderHeader()}<main class="inside-main">
    ${sourceBannerHero("WE NEVER STOP EXPLORING", "/assets/tervona-downloads-hero-v2.png", ["Home", "News"])}
    ${featured ? `<section class="news-featured">
      <a href="${localHref(featured.path)}" class="news-featured-link">
        <div class="news-featured-media"><img src="${esc(featured.coverImage || "/assets/tervona-downloads-hero-v2.png")}" alt=""></div>
        <div class="news-featured-copy">
          <time>${esc(featured.date || "")}</time>
          <h2>${cleanTitle(featured.title)}</h2>
          <p>${esc(featured.excerpt || "Tervona news article and media update.")}</p>
          <span class="news-page-arrow">${icon("arrow")}</span>
        </div>
      </a>
    </section>` : ""}
    <section class="news-list-page source-news-list"><div class="news-page-grid">${listNews.map((item, index) => {
      return `<a class="news-page-card" style="--reveal-delay:${(index % 3 * 0.08).toFixed(2)}s" href="${localHref(item.path)}">
        <div class="news-page-media"><img src="${esc(item.coverImage || "/assets/tervona-downloads-hero-v2.png")}" alt=""></div>
        <time>${esc(item.date || "")}</time>
        <h3>${cleanTitle(item.title)}</h3>
        <span class="news-page-arrow">${icon("arrow")}</span>
      </a>`;
    }).join("")}</div>${renderNewsPagination(current, pageCount)}</section>
    ${renderFooterCta()}
  </main>${renderFooter()}`;
}

function renderNewsPagination(current, total) {
  return `<nav class="page-dots">${Array.from({ length: total }).map((_, i) => {
    const page = i + 1;
    const target = page === 1 ? "/news" : `/news-${page}`;
    return `<a class="${page === current ? "active" : ""}" href="${localHref(target)}">${page}</a>`;
  }).join("")}</nav>`;
}

function renderNewsDetailPage(path) {
  const route = routePathOnly(path);
  const news = cmsAdminState().news.filter((item) => item.status !== "Hidden");
  const article = news.find((item) => routePathOnly(item.path) === route) || {
    ...pageFor(path),
    path: route,
    date: "",
    excerpt: pageFor(path).description || "",
    coverImage: "/assets/tervona-downloads-hero-v2.png",
  };
  const currentIndex = news.findIndex((item) => routePathOnly(item.path) === route);
  const previous = currentIndex > 0 ? news[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < news.length - 1 ? news[currentIndex + 1] : null;
  const body = article.body
    ? sanitizeNewsBody(article.body)
    : `<p>${esc(article.excerpt || "Tervona news article and media update.")}</p><p><img src="${esc(article.coverImage || "/assets/tervona-downloads-hero-v2.png")}" alt="${esc(article.title || "News")}"></p>`;
  const latest = news.slice(0, 6);
  return `${renderHeader()}<main class="inside-main">
    <article class="news-detail-template">
      <nav class="news-detail-breadcrumb"><a href="${localHref("/")}">Home</a><i>/</i><a href="${localHref("/news")}">News</a></nav>
      <header class="news-detail-heading"><h1>${cleanTitle(article.title)}</h1><time>${esc(article.date || "")}</time></header>
      <div class="news-detail-body">${body}</div>
    </article>
    <aside class="news-detail-toolbar" aria-label="Article navigation and sharing">
      <div class="news-detail-nav"><a href="${localHref("/news")}">Return</a>${previous ? `<a href="${localHref(previous.path)}">Previous Article <span>${icon("arrow")}</span></a>` : ""}${next ? `<a href="${localHref(next.path)}">Next Article <span>${icon("arrow")}</span></a>` : ""}</div>
      <div class="news-detail-share"><span>Share the Article</span><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}" target="_blank" aria-label="Share on Facebook">f</a><a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(location.href)}" target="_blank" aria-label="Share on LinkedIn">in</a></div>
    </aside>
    <section class="news-latest"><h2>Latest Posts</h2><div class="news-latest-track">${latest.map((item) => `<a class="news-latest-card" href="${localHref(item.path)}"><img src="${esc(item.coverImage || "/assets/tervona-downloads-hero-v2.png")}" alt=""><time>${esc(item.date || "")}</time><h3>${cleanTitle(item.title)}</h3></a>`).join("")}</div></section>
    ${renderFooterCta()}
  </main>${renderFooter()}`;
}

function sanitizeNewsBody(html) {
  const template = document.createElement("template");
  template.innerHTML = String(html || "");
  const allowed = new Set(["P", "BR", "STRONG", "EM", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "LI", "BLOCKQUOTE", "HR", "IMG", "A"]);
  Array.from(template.content.querySelectorAll("*")).forEach((node) => {
    if (!allowed.has(node.tagName)) {
      node.replaceWith(...node.childNodes);
      return;
    }
    Array.from(node.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on") || !["href", "src", "alt", "title", "target"].includes(name)) node.removeAttribute(attribute.name);
    });
    if (node.tagName === "IMG") {
      const src = node.getAttribute("src") || "";
      if (src.startsWith("/Public/")) node.setAttribute("src", FALLBACK_SCENE);
      node.setAttribute("loading", "lazy");
    }
    if (node.tagName === "A") {
      const href = node.getAttribute("href") || "";
      if (/^javascript:/i.test(href)) node.removeAttribute("href");
      if (/^https?:\/\//i.test(href)) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
    }
  });
  Array.from(template.content.querySelectorAll("p")).forEach((paragraph) => {
    if (!paragraph.textContent.trim() && !paragraph.querySelector("img")) paragraph.remove();
  });
  return template.innerHTML;
}

function publicFormBySlug(slug = "contact-us") {
  return publicForms.find((form) => form.slug === slug && form.status === "active") || DEFAULT_PUBLIC_FORMS.find((form) => form.slug === slug && form.status === "active") || null;
}

function renderConfiguredField(field) {
  const required = field.required ? "required" : "";
  const requiredMark = field.required ? " *" : "";
  const width = field.width === "full" ? " contact-field-full" : "";
  const common = `name="${esc(field.key)}" ${required} placeholder="${esc(field.placeholder || "")}"`;
  if (field.type === "checkbox") {
    const label = esc(field.label);
    return `<label class="contact-consent${width}"><input type="checkbox" ${common}><span>${label}</span></label>`;
  }
  if (field.type === "textarea") return `<label class="contact-message${width}">${esc(field.label)}${requiredMark}<textarea ${common}></textarea></label>`;
  if (field.type === "select") return `<label class="${width.trim()}">${esc(field.label)}${requiredMark}<select ${common}><option value="">Please select</option>${(field.options || []).map((option) => `<option value="${esc(option)}">${esc(option)}</option>`).join("")}</select></label>`;
  const type = field.type === "phone" ? "tel" : ["email", "number"].includes(field.type) ? field.type : "text";
  return `<label class="${width.trim()}">${esc(field.label)}${requiredMark}<input type="${type}" ${common}></label>`;
}

function renderConfiguredForm(form) {
  if (!form) return `<div class="configured-form-empty"><h2>Form unavailable</h2><p>This form is currently not published.</p></div>`;
  return `<form data-public-form data-form-id="${esc(form.id)}" data-form-slug="${esc(form.slug)}">
    <label class="contact-honeypot" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
    ${(form.fields || []).map(renderConfiguredField).join("")}
    <button type="submit" class="contact-pill">${esc(form.submitLabel || "Submit")}</button><p class="contact-form-status" role="status" aria-live="polite"></p>
  </form>`;
}

function renderContactPage() {
  const form = publicFormBySlug("contact-us");
  return `${renderHeader()}<main class="inside-main">
    ${sourceBannerHero("GET IN TOUCH WITH TERVONA", "/assets/tervona-partner-home-hero-v2.png", ["Home", "Contact Us"])}
    <section class="contact-layout source-contact-layout"><div><span>CONTACT TERVONA</span><h2>${esc(form?.title || "Tell us how we can help")}</h2><p>${esc(form?.description || "")}</p><address class="contact-office"><b>Registered Office</b><strong>Shenzhen Tervona Tech Co., Ltd.</strong><span>Plant 401, Nangang No. 2 Industrial Park, No. 1026 Songbai Road, Yangguang Community, Xili Street, Nanshan District, Shenzhen, China</span></address></div>${renderConfiguredForm(form)}</section>
    ${renderFooterCta()}
  </main>${renderFooter()}`;
}

function renderStandaloneFormPage(slug) {
  const form = publicFormBySlug(slug);
  return `${renderHeader()}<main class="inside-main">
    ${sourceBannerHero(form ? form.name.toUpperCase() : "FORM", "/assets/tervona-partner-home-hero-v2.png", ["Home", form?.name || "Form"])}
    <section class="contact-layout source-contact-layout standalone-form-layout"><div><span>TERVONA FORM</span><h2>${esc(form?.title || "Form unavailable")}</h2><p>${esc(form?.description || "This form is currently not published.")}</p></div>${renderConfiguredForm(form)}</section>
    ${renderFooterCta()}
  </main>${renderFooter()}`;
}

async function loadPublicForms(force = false) {
  if ((publicFormsStatus === "loading" || publicFormsStatus === "loaded") && !force) return;
  publicFormsStatus = "loading";
  try {
    const response = await fetch(`${CMS_API_URL}?action=public-forms`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to load forms");
    publicForms = payload.forms?.length ? payload.forms : DEFAULT_PUBLIC_FORMS;
    publicFormsStatus = "loaded";
    render({ preserveScroll: true });
  } catch {
    publicFormsStatus = "error";
  }
}

function cmsModel() {
  return window.CMS_MODEL || {
    globals: [],
    collections: [],
    templates: [],
    assets: [],
    implementationPlan: [],
  };
}

function cmsSeedProducts() {
  const catalogProducts = tervonaCatalogProducts();
  if (catalogProducts.length) return catalogProducts.map((product) => ({ ...product }));
  return productCategories().flatMap((cat) => productPages(cat.slug).map((page) => ({
    id: routePathOnly(page.path),
    title: plainTitle(page.title),
    category: cat.slug,
    categoryLabel: cat.title,
    path: routePathOnly(page.path),
    heroImage: productImageFor(page.path),
    summary: page.description || cat.intro,
    status: "Published",
  })));
}

function cmsSeedNews() {
  return [];
}

function cmsPageTemplateFor(route) {
  if (route === "/") return "templates/pages/home";
  if (route === "/company") return "templates/pages/about";
  if (route === "/innovation") return "templates/pages/innovation";
  if (route === "/contact-us") return "templates/pages/contact";
  if (route === "/resource-support/references") return "templates/pages/references";
  return "templates/pages/default";
}

function cmsPageHeroFor(route) {
  if (route === "/") return `${ASSET}/tervona-home-20260922/home-hero-pc.jpg`;
  if (route === "/company") return "/assets/tervona-products-home-banner-v2.png";
  if (route === "/innovation") return "/assets/tervona-downloads-hero-v2.png";
  if (route === "/contact-us") return "/assets/tervona-partner-home-hero-v2.png";
  if (route === "/resource-support/references") return "/assets/tervona-partner-home-hero-v2.png";
  return "/assets/tervona-products/category-scene-tervona-v2.png";
}

function cmsSeedPages() {
  const sourcePages = [
    { path: "/", title: "Tervona", description: "Tervona residential energy storage and inverter solutions." },
    { path: "/company", title: "Company-Tervona", description: "About Shenzhen Tervona Tech Co., Ltd." },
    { path: "/innovation", title: "Innovation-Tervona", description: "Tervona product development and quality engineering." },
    { path: "/contact-us", title: "Contact Us-Tervona", description: "Contact the Tervona team." },
    { path: "/resource-support/references", title: "Project References-Tervona", description: "Tervona residential energy applications." },
  ];
  return sourcePages.map((page) => {
    const route = routePathOnly(page.path);
    const title = cmsPageAdminTitle({ ...page, path: route, title: plainTitle(page.title) });
    return {
      id: route,
      title,
      path: route,
      template: cmsPageTemplateFor(route),
      heroImage: cmsPageHeroFor(route),
      summary: page.description || `${title} page`,
      status: "Published",
    };
  });
}

function cmsSeedMedia() {
  const seedAssets = [];
  const push = (url, title, folder, usage, size = "") => {
    if (!url || seedAssets.some((asset) => asset.url === url)) return;
    seedAssets.push({
      id: url,
      title,
      url,
      folder,
      type: /\.(pdf)$/i.test(url) ? "document" : (/\.(mp4|webm|mov)$/i.test(url) ? "video" : "image"),
      usage,
      size,
      mimeType: "",
      altText: "",
      caption: "",
      description: usage || "",
    });
  };
  cmsSeedProducts().forEach((product) => push(product.heroImage, `${product.title} 主图`, "products", "产品详情首屏和产品卡片"));
  [
    ["/assets/tervona-home-20260922/home-hero-pc.jpg", "Tervona 首页 Hero PC", "heroes", "首页首屏", "1920 x 960 px"],
    ["/assets/tervona-home-20260922/home-hero-mobile.jpg", "Tervona 首页 Hero 手机", "heroes", "首页首屏", "750 x 1200 px"],
    ["/assets/tervona-home-20260922/home-solutions-pc.jpg", "Tervona 解决方案 PC", "heroes", "首页解决方案", "1920 x 960 px"],
    ["/assets/tervona-home-20260922/home-solutions-mobile.jpg", "Tervona 解决方案手机", "heroes", "首页解决方案", "750 x 1200 px"],
    ["/assets/tervona-home-20260922/home-products.png", "Tervona 产品组合", "products", "首页产品展示", "透明 PNG"],
    ["/assets/tervona-home-20260922/home-about-pc.jpg", "Tervona 关于我们 PC", "heroes", "首页关于我们", "1920 x 2130 px"],
    ["/assets/tervona-home-20260922/home-about-mobile.jpg", "Tervona 关于我们手机", "heroes", "首页关于我们", "768 x 2554 px"],
    ["/assets/tervona-home-20260922/home-rd.jpg", "Tervona 产品技术", "heroes", "首页产品技术", ""],
    ["/assets/tervona-home-20260922/home-contact-cta.jpg", "Tervona 联系 CTA", "heroes", "首页和全站底部联系", ""],
    ["/assets/tervona-products-home-banner-v2.png", "Tervona 产品中心场景", "brand", "产品中心和公司页面"],
    ["/assets/tervona-partner-home-hero-v2.png", "Tervona 合作与联系场景", "brand", "合作、联系和项目案例页面"],
    ["/assets/tervona-downloads-hero-v2.png", "Tervona 技术与下载场景", "brand", "创新和下载页面"],
    ["/assets/tervona-life-by-sunshine-v1.png", "Life by Sunshine", "brand", "全站底部 CTA"],
  ].forEach(([url, title, folder, usage, size]) => push(url, title, folder, usage, size));
  return seedAssets;
}

function cmsHomeMaterialGuide() {
  const slots = [
    ["首页 Hero", "1 张 PC 图 + 1 张手机图", "PC 建议 1920 x 960 px；手机建议 750 x 1200 px", "使用 Tervona 最新设计稿和新版 slogan。"],
    ["解决方案", "1 张 PC 图 + 1 张手机图", "建议分别针对横屏和竖屏裁切", "保持住宅储能与产品应用信息清晰。"],
    ["首页产品展示", "1 张透明产品组合图", "透明 PNG/WebP，宽度建议 1600 px 以上", "产品热点和文字在首页模板字段维护。"],
    ["关于我们", "1 张 PC 图 + 1 张手机图", "分别针对桌面和手机比例输出", "标题、按钮和介绍文字保持独立可编辑。"],
    ["产品技术与底部 CTA", "2 张 Tervona 场景图", "建议宽度 1920 px 以上", "用于产品技术板块和全站联系入口。"],
  ];
  return `<div class="cms-home-guide">
    <div class="cms-section-head compact">
      <div><span>首页素材设置</span><h2>首页按 Tervona 设计稿拆分素材位</h2></div>
      <a href="${localHref("/cms?section=media")}">打开媒体库</a>
    </div>
    <div class="cms-home-guide-grid">
      ${slots.map(([name, count, size, note]) => `<article>
        <h3>${esc(name)}</h3>
        <b>${esc(count)}</b>
        <p>${esc(size)}</p>
        <em>${esc(note)}</em>
      </article>`).join("")}
    </div>
  </div>`;
}

function cmsDefaultState() {
  return {
    products: cmsSeedProducts(),
    news: cmsSeedNews(),
    pages: cmsSeedPages(),
    media: cmsSeedMedia(),
    templates: cmsModel().templates,
    menus: cmsDefaultMenus(),
    settings: cmsDefaultSettings(),
    downloads: cmsDefaultDownloads(),
    downloadCategories: defaultDownloadCategories(),
  };
}

function cmsSanitizeState(state) {
  const defaults = cmsDefaultState();
  if (!state || typeof state !== "object") return defaults;
  const savedProducts = Array.isArray(state.products) ? state.products : [];
  const productRecords = tervonaCatalogProducts().length
    ? defaults.products.map((seed) => {
        const saved = savedProducts.find((record) => routePathOnly(record.path || record.id) === routePathOnly(seed.path || seed.id));
        return saved ? { ...seed, ...saved, id: seed.id, path: seed.path, category: seed.category } : seed;
      })
    : (savedProducts.length ? savedProducts : defaults.products);
  const newsRecords = Array.isArray(state.news) ? state.news.map((record) => {
    const seed = defaults.news.find((item) => routePathOnly(item.path) === routePathOnly(record.path));
    return { ...seed, ...record, body: record.body || seed?.body || "" };
  }) : defaults.news;
  return {
    products: productRecords,
    news: newsRecords,
    pages: Array.isArray(state.pages) ? state.pages : defaults.pages,
    media: Array.isArray(state.media) ? [...state.media, ...defaults.media.filter((seed) => !state.media.some((item) => item.url === seed.url))] : defaults.media,
    templates: Array.isArray(state.templates) ? state.templates : defaults.templates,
    menus: Array.isArray(state.menus) ? state.menus : defaults.menus,
    settings: state.settings && typeof state.settings === "object" ? { ...defaults.settings, ...state.settings } : defaults.settings,
    downloads: Array.isArray(state.downloads) ? state.downloads : defaults.downloads,
    downloadCategories: Array.isArray(state.downloadCategories) && state.downloadCategories.length ? state.downloadCategories : defaults.downloadCategories,
    activity: Array.isArray(state.activity) ? state.activity.slice(0, 30) : [],
  };
}

function cmsStatusCounts(state = cmsAdminState()) {
  const records = [...state.pages, ...state.products, ...state.news];
  return records.reduce((summary, record) => {
    const key = String(record.status || "Draft").toLowerCase();
    if (key === "published") summary.published += 1;
    else if (key === "hidden") summary.hidden += 1;
    else summary.draft += 1;
    return summary;
  }, { published: 0, draft: 0, hidden: 0, total: records.length });
}

function cmsSeoScore(record = {}) {
  const checks = [record.title, record.summary || record.excerpt, record.path, record.heroImage];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}

function cmsRecentContent(state = cmsAdminState()) {
  return [
    ...state.pages.map((item) => ({ ...item, contentType: "页面" })),
    ...state.products.map((item) => ({ ...item, contentType: "产品" })),
    ...state.news.map((item) => ({ ...item, contentType: "新闻" })),
  ].sort((a, b) => String(b.updatedAt || b.date || "").localeCompare(String(a.updatedAt || a.date || ""))).slice(0, 8);
}

function cmsCategoryRecords(state = cmsAdminState()) {
  return productCategories().map((category, index) => ({
    ...category,
    id: category.slug,
    count: state.products.filter((product) => product.category === category.slug).length,
    status: "Published",
    order: index + 1,
  }));
}

function cmsIsSuperAdmin() {
  return cmsAuthUser?.role === "super_admin";
}

function cmsCanAccess(section) {
  if (section === "dashboard") return !!cmsAuthUser;
  if (section === "users") return cmsIsSuperAdmin();
  return cmsIsSuperAdmin() || !!cmsAuthUser?.permissions?.includes(section);
}

function cmsAuthHeaders(extra = {}) {
  return { ...extra, ...(cmsAuthCsrf ? { "X-CSRF-Token": cmsAuthCsrf } : {}) };
}

function cmsSetSignedOut(message = "") {
  cmsAuthStatus = "signed-out";
  cmsAuthUser = null;
  cmsAuthCsrf = "";
  cmsAuthError = message;
  cmsRemoteState = null;
  cmsBackendLoadStarted = false;
  cmsManagedUsers = [];
  cmsUsersStatus = "idle";
  cmsSubmissions = [];
  cmsSubmissionsStatus = "idle";
  cmsMailSettingsStatus = "idle";
  cmsMailSettingsMessage = "";
}

function cmsCheckSession() {
  if (cmsAuthCheckStarted || typeof fetch !== "function") return;
  cmsAuthCheckStarted = true;
  cmsAuthStatus = "checking";
  fetch(`${CMS_API_URL}?action=session`, { cache: "no-store" })
    .then((response) => response.json())
    .then((payload) => {
      if (payload.authenticated && payload.user) {
        cmsAuthStatus = "authenticated";
        cmsAuthUser = payload.user;
        cmsAuthCsrf = payload.csrfToken || "";
        cmsAuthError = "";
      } else {
        cmsSetSignedOut();
      }
      cmsRefreshAdminIfActive();
    })
    .catch(() => {
      cmsSetSignedOut("暂时无法连接登录服务，请确认后台服务已启动。");
      cmsRefreshAdminIfActive();
    });
}

async function cmsLogin(form) {
  const values = Object.fromEntries(new FormData(form).entries());
  cmsAuthError = "";
  const response = await fetch(`${CMS_API_URL}?action=login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: values.username, password: values.password }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.error || "登录失败");
  cmsAuthStatus = "authenticated";
  cmsAuthUser = payload.user;
  cmsAuthCsrf = payload.csrfToken || "";
  cmsAuthError = "";
  cmsBackendLoadStarted = false;
  cmsBackendStatus = "Connecting";
  cmsActiveSection = "dashboard";
  history.replaceState(null, "", cmsSectionPath("dashboard"));
  cmsLoadBackendState();
  render();
}

async function cmsLogout() {
  try {
    await fetch(`${CMS_API_URL}?action=logout`, { method: "POST", headers: cmsAuthHeaders() });
  } finally {
    cmsSetSignedOut();
    render();
  }
}

function renderCmsAuthLoading() {
  return `<main class="cms-login-shell"><section class="cms-login-card is-loading"><img src="/assets/tervona-logo-transparent.png" alt="Tervona"><div class="cms-login-spinner"></div><h1>正在验证登录状态</h1><p>正在安全连接内容管理后台…</p></section></main>`;
}

function renderCmsLogin() {
  return `<main class="cms-login-shell">
    <section class="cms-login-card">
      <header><span><img src="/assets/tervona-logo-transparent.png" alt="Tervona"></span><div><b>Tervona</b></div></header>
      <div class="cms-login-copy"><span>安全登录</span><h1>登录网站后台</h1><p>请输入管理员分配给你的账号和密码。</p></div>
      <form data-cms-login>
        <label>账号<input name="username" autocomplete="username" required autofocus placeholder="请输入账号"></label>
        <label>密码<input name="password" type="password" autocomplete="current-password" required placeholder="请输入密码"></label>
        ${cmsAuthError ? `<p class="cms-login-error">${esc(cmsAuthError)}</p>` : ""}
        <button type="submit">登录后台</button>
      </form>
      <footer><span>受账号权限和安全会话保护</span><a href="${localHref("/")}">返回网站</a></footer>
    </section>
  </main>`;
}

async function cmsLoadManagedUsers(force = false) {
  if (!cmsIsSuperAdmin() || (cmsUsersStatus === "loading" && !force) || (cmsUsersStatus === "loaded" && !force)) return;
  cmsUsersStatus = "loading";
  cmsUsersError = "";
  try {
    const response = await fetch(`${CMS_API_URL}?action=users`, { cache: "no-store" });
    const payload = await response.json();
    if (response.status === 401) { cmsSetSignedOut("登录已过期，请重新登录。"); render(); return; }
    if (!response.ok || !payload.ok) throw new Error(payload.error || "无法读取人员列表");
    cmsManagedUsers = payload.users || [];
    cmsUsersStatus = "loaded";
  } catch (error) {
    cmsUsersStatus = "error";
    cmsUsersError = error.message || "无法读取人员列表";
  }
  cmsRefreshAdminIfActive();
}

async function cmsUserAction(action, payload) {
  const response = await fetch(`${CMS_API_URL}?action=${action}`, {
    method: "POST",
    headers: cmsAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (response.status === 401) { cmsSetSignedOut("登录已过期，请重新登录。"); render(); return null; }
  if (!response.ok || !result.ok) throw new Error(result.error || "操作失败");
  cmsManagedUsers = result.users || cmsManagedUsers;
  cmsUsersStatus = "loaded";
  cmsUsersError = "";
  render();
  return result;
}

async function cmsLoadSubmissions(force = false) {
  if (!cmsCanAccess("submissions") || (cmsSubmissionsStatus === "loading" && !force) || (cmsSubmissionsStatus === "loaded" && !force)) return;
  cmsSubmissionsStatus = "loading";
  cmsSubmissionsError = "";
  try {
    const response = await fetch(`${CMS_API_URL}?action=submissions`, { cache: "no-store" });
    const payload = await response.json();
    if (response.status === 401) { cmsSetSignedOut("登录已过期，请重新登录。"); render(); return; }
    if (!response.ok || !payload.ok) throw new Error(payload.error || "无法读取询盘列表");
    cmsSubmissions = payload.submissions || [];
    cmsSubmissionsStatus = "loaded";
  } catch (error) {
    cmsSubmissionsStatus = "error";
    cmsSubmissionsError = error.message || "无法读取询盘列表";
  }
  cmsRefreshAdminIfActive();
}

async function cmsSubmissionAction(action, payload) {
  const response = await fetch(`${CMS_API_URL}?action=${action}`, {
    method: "POST",
    headers: cmsAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (response.status === 401) { cmsSetSignedOut("登录已过期，请重新登录。"); render(); return null; }
  if (!response.ok || !result.ok) throw new Error(result.error || "操作失败");
  cmsSubmissions = result.submissions || cmsSubmissions;
  cmsSubmissionsStatus = "loaded";
  cmsSubmissionsError = "";
  render();
  return result;
}

async function cmsLoadForms(force = false) {
  if (!cmsCanAccess("submissions") || (cmsFormsStatus === "loading" && !force) || (cmsFormsStatus === "loaded" && !force)) return;
  cmsFormsStatus = "loading";
  cmsFormsError = "";
  try {
    const response = await fetch(`${CMS_API_URL}?action=forms`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "无法读取表单列表");
    cmsForms = payload.forms || [];
    cmsActiveFormId = cmsForms.some((form) => form.id === cmsActiveFormId) ? cmsActiveFormId : (cmsForms[0]?.id || "");
    cmsFormsStatus = "loaded";
  } catch (error) {
    cmsFormsStatus = "error";
    cmsFormsError = error.message || "无法读取表单列表";
  }
  cmsRefreshAdminIfActive();
}

async function cmsFormAction(action, payload) {
  const response = await fetch(`${CMS_API_URL}?action=${action}`, {
    method: "POST",
    headers: cmsAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (response.status === 401) { cmsSetSignedOut("登录已过期，请重新登录。"); render(); return null; }
  if (!response.ok || !result.ok) throw new Error(result.error || "表单操作失败");
  cmsForms = result.forms || cmsForms;
  if (result.form?.id) cmsActiveFormId = result.form.id;
  cmsFormsStatus = "loaded";
  cmsFormsError = "";
  return result;
}

function cmsCurrentForm() {
  return cmsForms.find((form) => form.id === cmsActiveFormId) || cmsForms[0] || null;
}

function cmsRenderFormFieldEditor(field, index) {
  const types = [["text", "Text"], ["email", "Email"], ["phone", "Phone"], ["number", "Number"], ["textarea", "Text Area"], ["select", "Select"], ["checkbox", "Checkbox"]];
  return `<article class="cms-form-field-row" data-cms-form-field-row>
    <div class="cms-form-field-order"><span>${String(index + 1).padStart(2, "0")}</span><button type="button" data-cms-form-field-up="${index}" aria-label="上移字段">↑</button><button type="button" data-cms-form-field-down="${index}" aria-label="下移字段">↓</button></div>
    <div class="cms-form-field-main"><label>字段名称<input name="fieldLabel${index}" value="${esc(field.label || "")}" required></label><label>字段标识<input name="fieldKey${index}" value="${esc(field.key || "")}" pattern="[A-Za-z][A-Za-z0-9_]*" required></label><label>字段类型<select name="fieldType${index}">${types.map(([value, label]) => `<option value="${value}" ${field.type === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><label>占位提示<input name="fieldPlaceholder${index}" value="${esc(field.placeholder || "")}"></label>${field.type === "select" ? `<label class="cms-form-options">下拉选项（每行一个）<textarea name="fieldOptions${index}">${esc((field.options || []).join("\n"))}</textarea></label>` : ""}</div>
    <div class="cms-form-field-flags"><label><input type="checkbox" name="fieldRequired${index}" ${field.required ? "checked" : ""}><span>必填</span></label><label><input type="checkbox" name="fieldEmail${index}" ${field.includeInEmail ? "checked" : ""}><span>显示在邮件</span></label><label>宽度<select name="fieldWidth${index}"><option value="half" ${field.width !== "full" ? "selected" : ""}>半行</option><option value="full" ${field.width === "full" ? "selected" : ""}>整行</option></select></label><button type="button" class="danger" data-cms-form-field-delete="${index}">删除字段</button></div>
    <input type="hidden" name="fieldId${index}" value="${esc(field.id || "")}">
  </article>`;
}

function renderCmsFormBuilder() {
  if (cmsFormsStatus === "idle") cmsLoadForms();
  const form = cmsCurrentForm();
  if (cmsFormsStatus === "loading" && !form) return `<div class="cms-form-builder-loading">正在加载表单编辑器…</div>`;
  if (!form) return `<div class="cms-form-builder-loading error">${esc(cmsFormsError || "暂无表单")}</div>`;
  const publicPath = form.slug === "contact-us" ? "/contact-us" : `/forms/${form.slug}`;
  return `<section class="cms-form-builder">
    <header class="cms-form-builder-head"><div><span>FORM BUILDER</span><h3>多表单与邮件字段管理</h3><p>每张表单可拥有不同字段；关闭“显示在邮件”后，该项仍会保存到后台，但不会转发给销售。</p></div><div><button type="button" data-cms-form-new>+ 新建表单</button><a href="${localHref(publicPath)}" target="_blank">打开前台表单</a></div></header>
    ${cmsFormMessage ? `<p class="cms-form-message ${cmsFormsError ? "error" : ""}">${esc(cmsFormMessage)}</p>` : ""}
    <div class="cms-form-builder-grid">
      <aside class="cms-form-list"><div><b>表单</b><span>${cmsForms.length}</span></div>${cmsForms.map((item) => `<button type="button" class="${item.id === form.id ? "active" : ""}" data-cms-form-select="${esc(item.id)}"><i></i><span><strong>${esc(item.name)}</strong><small>/${item.slug}</small></span><em>${item.status === "active" ? "已发布" : "草稿"}</em></button>`).join("")}</aside>
      <form class="cms-form-editor" data-cms-form-builder-form>
        <input type="hidden" name="id" value="${esc(form.id)}"><input type="hidden" name="fieldCount" value="${form.fields?.length || 0}">
        <div class="cms-form-meta-grid"><label>表单名称<input name="name" value="${esc(form.name)}" required></label><label>URL 标识<input name="slug" value="${esc(form.slug)}" pattern="[a-z0-9-]+" required></label><label>前台标题<input name="title" value="${esc(form.title || "")}" required></label><label>状态<select name="status"><option value="active" ${form.status === "active" ? "selected" : ""}>已发布</option><option value="draft" ${form.status !== "active" ? "selected" : ""}>草稿</option></select></label><label class="full">表单说明<textarea name="description">${esc(form.description || "")}</textarea></label><label>提交按钮文字<input name="submitLabel" value="${esc(form.submitLabel || "Submit")}"></label><label>提交成功提示<input name="successMessage" value="${esc(form.successMessage || "")}"></label></div>
        <div class="cms-form-fields-head"><div><span>FIELDS</span><h4>填写内容</h4></div><button type="button" data-cms-form-field-add>+ 增加字段</button></div>
        <div class="cms-form-fields">${(form.fields || []).map(cmsRenderFormFieldEditor).join("")}</div>
        <footer class="cms-form-editor-actions"><button type="submit">保存表单</button><button type="button" class="danger" data-cms-form-delete ${cmsForms.length <= 1 ? "disabled" : ""}>删除表单</button><small>前台地址：${esc(publicPath)}</small></footer>
      </form>
    </div>
    <div class="cms-form-preview"><header><span>LIVE PREVIEW</span><h4>${esc(form.title || form.name)}</h4></header><div class="cms-form-preview-canvas">${renderConfiguredForm(form)}</div></div>
  </section>`;
}

function cmsCollectFormEditor(editor) {
  const values = new FormData(editor);
  const fieldCount = Number(values.get("fieldCount") || 0);
  const fields = Array.from({ length: fieldCount }, (_, index) => ({
    id: String(values.get(`fieldId${index}`) || `field-${Date.now()}-${index}`),
    label: String(values.get(`fieldLabel${index}`) || "").trim(),
    key: String(values.get(`fieldKey${index}`) || "").trim(),
    type: String(values.get(`fieldType${index}`) || "text"),
    placeholder: String(values.get(`fieldPlaceholder${index}`) || "").trim(),
    required: values.has(`fieldRequired${index}`),
    includeInEmail: values.has(`fieldEmail${index}`),
    width: values.get(`fieldWidth${index}`) === "full" ? "full" : "half",
    options: String(values.get(`fieldOptions${index}`) || "").split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean),
  }));
  return {
    id: String(values.get("id") || ""), name: String(values.get("name") || "").trim(), slug: String(values.get("slug") || "").trim(),
    title: String(values.get("title") || "").trim(), description: String(values.get("description") || "").trim(), status: String(values.get("status") || "draft"),
    submitLabel: String(values.get("submitLabel") || "Submit").trim(), successMessage: String(values.get("successMessage") || "").trim(), fields,
  };
}

function cmsSyncActiveFormFromEditor() {
  const editor = document.querySelector("[data-cms-form-builder-form]");
  if (!editor) return cmsCurrentForm();
  const draft = cmsCollectFormEditor(editor);
  const index = cmsForms.findIndex((item) => item.id === cmsActiveFormId);
  if (index >= 0) cmsForms[index] = { ...cmsForms[index], ...draft };
  return cmsForms[index] || draft;
}

async function cmsLoadMailSettings(force = false) {
  if (!cmsIsSuperAdmin() || (cmsMailSettingsStatus === "loading" && !force) || (cmsMailSettingsStatus === "loaded" && !force)) return;
  cmsMailSettingsStatus = "loading";
  cmsMailSettingsMessage = "";
  try {
    const response = await fetch(`${CMS_API_URL}?action=mail-settings`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "无法读取 SMTP 配置");
    cmsMailSettings = { ...cmsMailSettings, ...(payload.settings || {}) };
    cmsMailSettingsStatus = "loaded";
  } catch (error) {
    cmsMailSettingsStatus = "error";
    cmsMailSettingsMessage = error.message || "无法读取 SMTP 配置";
  }
  cmsRefreshAdminIfActive();
}

async function cmsMailSettingsAction(action, payload = {}) {
  const response = await fetch(`${CMS_API_URL}?action=${action}`, {
    method: "POST",
    headers: cmsAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error || "SMTP 操作失败");
  if (result.settings) cmsMailSettings = { ...cmsMailSettings, ...result.settings };
  cmsMailSettingsStatus = "loaded";
  cmsMailSettingsMessage = result.message || "SMTP 配置已保存";
  render();
  return result;
}

function renderCmsMailSettings() {
  if (!cmsIsSuperAdmin()) return "";
  if (cmsMailSettingsStatus === "idle") cmsLoadMailSettings();
  const settings = cmsMailSettings;
  return `<section class="cms-mail-settings">
    <header><div><span>邮件转发</span><h3>腾讯企业邮箱 SMTP</h3></div><em class="${settings.configured ? "is-ready" : ""}">${settings.configured ? "已配置" : "等待应用密码"}</em></header>
    <form data-cms-mail-settings>
      <div class="cms-mail-grid"><label>SMTP 主机<input name="host" value="${esc(settings.host || "smtp.exmail.qq.com")}" required></label><label>端口<input name="port" type="number" min="1" max="65535" value="${esc(settings.port || 465)}" required></label><label>加密方式<select name="encryption"><option value="ssl" ${settings.encryption === "ssl" ? "selected" : ""}>SSL/TLS</option><option value="tls" ${settings.encryption === "tls" ? "selected" : ""}>STARTTLS</option><option value="none" ${settings.encryption === "none" ? "selected" : ""}>无加密</option></select></label><label>发件账号<input name="username" type="email" value="${esc(settings.username || "ads@en-plus.com.cn")}" required></label><label>发件名称<input name="fromName" value="${esc(settings.fromName || "Tervona Website")}" required></label><label>客户端专用密码<input name="password" type="password" autocomplete="new-password" placeholder="${settings.configured ? "留空则保持现有密码" : "粘贴腾讯企业邮箱客户端专用密码"}"></label></div>
      <p>收件地址固定为 <b>ads@en-plus.com.cn</b>。密码保存在网站根目录之外，不会进入公开 CMS 数据。</p>
      ${cmsMailSettingsMessage ? `<div class="cms-mail-message ${cmsMailSettingsStatus === "error" ? "is-error" : ""}">${esc(cmsMailSettingsMessage)}</div>` : ""}
      <footer><button type="submit">保存 SMTP</button><button type="button" data-cms-mail-test ${settings.configured ? "" : "disabled"}>发送测试邮件</button></footer>
    </form>
  </section>`;
}

function renderCmsSubmissionManagerLegacy() {
  if (cmsSubmissionsStatus === "idle") cmsLoadSubmissions();
  const statusLabel = { new: "新询盘", read: "已查看", handled: "已处理" };
  return `${renderCmsMailSettings()}<div class="cms-submission-manager">
    <header class="cms-submission-tools"><div><b>${cmsSubmissions.length}</b><span> 条询盘记录</span></div><button type="button" data-cms-refresh-submissions>刷新</button></header>
    ${cmsSubmissionsStatus === "loading" ? `<p class="cms-users-message">正在加载询盘…</p>` : ""}
    ${cmsSubmissionsError ? `<p class="cms-users-message error">${esc(cmsSubmissionsError)}</p>` : ""}
    <div class="cms-submission-list">
      ${cmsSubmissions.length ? cmsSubmissions.map((item) => `<article class="${item.status === "new" ? "is-new" : ""}">
        <header><div><strong>${esc(`${item.firstName || ""} ${item.lastName || ""}`.trim() || "未命名询盘")}</strong><span>${esc(item.company || item.position || "个人询盘")}</span></div><time>${esc(item.createdAt ? new Date(item.createdAt).toLocaleString("zh-CN") : "")}</time></header>
        <div class="cms-submission-contact"><a href="mailto:${esc(item.email)}">${esc(item.email)}</a><a href="tel:${esc(item.phone)}">${esc(item.phone)}</a><span>${esc([item.country, item.state].filter(Boolean).join(" / "))}</span></div>
        <p>${esc(item.message || "")}</p>
        <footer><span class="cms-submission-status ${esc(item.status || "new")}">${esc(statusLabel[item.status] || statusLabel.new)}</span><span class="cms-mail-status ${item.mailSent ? "sent" : "failed"}">${item.mailSent ? "邮件已转发" : (item.mailStatus === "local-dev" ? "本地测试未发邮件" : "邮件待重试")}</span><a href="${esc(item.source || "/contact-us")}" target="_blank">来源页面</a><select data-cms-submission-status="${esc(item.id)}"><option value="new" ${item.status === "new" ? "selected" : ""}>新询盘</option><option value="read" ${item.status === "read" ? "selected" : ""}>已查看</option><option value="handled" ${item.status === "handled" ? "selected" : ""}>已处理</option></select><button type="button" class="danger" data-cms-submission-delete="${esc(item.id)}">删除</button></footer>
      </article>`).join("") : (cmsSubmissionsStatus === "loaded" ? `<div class="cms-empty-state"><b>暂时没有询盘</b><p>访客提交 Contact Us 表单后，记录会立即出现在这里。</p></div>` : "")}
    </div>
  </div>`;
}

function renderCmsSubmissionManagerCards() {
  if (cmsSubmissionsStatus === "idle") cmsLoadSubmissions();
  const statusLabel = { new: "新询盘", read: "已查看", handled: "已处理" };
  return `<div class="cms-submission-manager">
    <header class="cms-submission-tools"><div><b>${cmsSubmissions.length}</b><span> 条询盘记录</span></div><button type="button" data-cms-refresh-submissions>刷新</button></header>
    ${cmsSubmissionsStatus === "loading" ? `<p class="cms-users-message">正在加载询盘…</p>` : ""}
    ${cmsSubmissionsError ? `<p class="cms-users-message error">${esc(cmsSubmissionsError)}</p>` : ""}
    <div class="cms-submission-list">
      ${cmsSubmissions.length ? cmsSubmissions.map((item) => {
        const dynamicValues = Array.isArray(item.values) ? item.values.filter((entry) => entry.type !== "checkbox" && String(entry.value ?? "").trim()) : [];
        const detailValues = dynamicValues.filter((entry) => entry.type !== "textarea");
        const longValues = dynamicValues.filter((entry) => entry.type === "textarea");
        const name = item.displayName || `${item.firstName || ""} ${item.lastName || ""}`.trim() || "未命名询盘";
        return `<article class="${item.status === "new" ? "is-new" : ""}">
          <header><div><strong>${esc(name)}</strong><span>${esc(item.formName || item.company || item.position || "网站表单")}</span></div><time>${esc(item.createdAt ? new Date(item.createdAt).toLocaleString("zh-CN") : "")}</time></header>
          ${detailValues.length ? `<dl class="cms-submission-values">${detailValues.map((entry) => `<div><dt>${esc(entry.label)}</dt><dd>${esc(entry.value)}</dd></div>`).join("")}</dl>` : `<div class="cms-submission-contact">${item.email ? `<a href="mailto:${esc(item.email)}">${esc(item.email)}</a>` : ""}${item.phone ? `<a href="tel:${esc(item.phone)}">${esc(item.phone)}</a>` : ""}<span>${esc([item.country, item.state].filter(Boolean).join(" / "))}</span></div>`}
          ${longValues.map((entry) => `<div class="cms-submission-message"><b>${esc(entry.label)}</b><p>${esc(entry.value)}</p></div>`).join("") || `<p>${esc(item.message || "")}</p>`}
          <footer><span class="cms-submission-status ${esc(item.status || "new")}">${esc(statusLabel[item.status] || statusLabel.new)}</span><span class="cms-mail-status ${item.mailSent ? "sent" : "failed"}">${item.mailSent ? "邮件已转发" : "邮件待重试"}</span><a href="${esc(item.source || "/contact-us")}" target="_blank">来源页面</a><select data-cms-submission-status="${esc(item.id)}"><option value="new" ${item.status === "new" ? "selected" : ""}>新询盘</option><option value="read" ${item.status === "read" ? "selected" : ""}>已查看</option><option value="handled" ${item.status === "handled" ? "selected" : ""}>已处理</option></select><button type="button" class="danger" data-cms-submission-delete="${esc(item.id)}">删除</button></footer>
        </article>`;
      }).join("") : (cmsSubmissionsStatus === "loaded" ? `<div class="cms-empty-state"><b>暂时没有询盘</b><p>访客提交任一已发布表单后，记录会立即出现在这里。</p></div>` : "")}
    </div>
  </div>`;
}

function cmsSubmissionDisplayName(item) {
  return item.displayName || `${item.firstName || ""} ${item.lastName || ""}`.trim() || item.company || "未命名客户";
}

function cmsSubmissionEmail(item) {
  const emailField = Array.isArray(item.values) ? item.values.find((entry) => entry.type === "email" && String(entry.value || "").trim()) : null;
  return item.email || emailField?.value || "未提供邮箱";
}

function cmsSubmissionContent(item) {
  const messageField = Array.isArray(item.values) ? item.values.find((entry) => entry.type === "textarea" && String(entry.value || "").trim()) : null;
  return messageField?.value || item.message || "客户未填写询盘内容";
}

function renderCmsSubmissionManager() {
  if (cmsSubmissionsStatus === "idle") cmsLoadSubmissions();
  const viewing = cmsSubmissions.find((item) => item.id === cmsViewingSubmissionId) || null;
  const statusLabel = { new: "新询盘", read: "已查看", handled: "已处理" };
  const legacyDetailValues = viewing ? [
    ["电话", viewing.phone],
    ["公司", viewing.company],
    ["部门 / 职位", viewing.position],
    ["国家 / 地区", viewing.country],
    ["省 / 州", viewing.state],
  ].filter(([, value]) => String(value || "").trim()).map(([label, value]) => ({ label, value })) : [];
  const dynamicDetailValues = viewing && Array.isArray(viewing.values)
    ? viewing.values.filter((entry) => !["checkbox", "textarea", "email"].includes(entry.type) && String(entry.value ?? "").trim())
    : [];
  const detailValues = [...legacyDetailValues, ...dynamicDetailValues].filter((entry, index, values) =>
    values.findIndex((candidate) => String(candidate.label || "").trim() === String(entry.label || "").trim() && String(candidate.value || "").trim() === String(entry.value || "").trim()) === index
  );
  return `<section class="cms-inquiry-panel">
    <header class="cms-inquiry-toolbar"><div><strong>${cmsSubmissions.length}</strong><span>条询盘</span></div><button type="button" data-cms-refresh-submissions>刷新列表</button></header>
    ${cmsSubmissionsStatus === "loading" ? `<p class="cms-inquiry-feedback">正在加载询盘…</p>` : ""}
    ${cmsSubmissionsError ? `<p class="cms-inquiry-feedback error">${esc(cmsSubmissionsError)}</p>` : ""}
    <div class="cms-inquiry-list" role="table" aria-label="客户询盘列表">
      <div class="cms-inquiry-list-head" role="row"><span>询盘时间</span><span>客户姓名</span><span>邮件</span><span>询盘内容</span><span aria-hidden="true"></span></div>
      ${cmsSubmissions.length ? cmsSubmissions.map((item) => {
        const name = cmsSubmissionDisplayName(item);
        const email = cmsSubmissionEmail(item);
        const content = cmsSubmissionContent(item);
        const date = item.createdAt ? new Date(item.createdAt) : null;
        return `<button type="button" class="cms-inquiry-row ${item.status === "new" ? "is-new" : ""}" data-cms-submission-open="${esc(item.id)}" role="row">
          <time><b>${esc(date ? date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }) : "—")}</b><small>${esc(date ? date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) : "")}</small></time>
          <span class="cms-inquiry-customer"><i>${esc(name.slice(0, 1).toUpperCase())}</i><b>${esc(name)}</b></span>
          <span class="cms-inquiry-email">${esc(email)}</span>
          <span class="cms-inquiry-preview">${esc(content)}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
        </button>`;
      }).join("") : (cmsSubmissionsStatus === "loaded" ? `<div class="cms-inquiry-empty"><b>暂时没有询盘</b><p>客户提交网站表单后，询盘会按时间显示在这里。</p></div>` : "")}
    </div>
  </section>
  ${viewing ? `<div class="cms-inquiry-detail-layer" data-cms-submission-close-overlay>
    <aside class="cms-inquiry-detail" role="dialog" aria-modal="true" aria-labelledby="cms-inquiry-detail-title">
      <header><div><span>${esc(viewing.formName || "网站询盘")}</span><h2 id="cms-inquiry-detail-title">${esc(cmsSubmissionDisplayName(viewing))}</h2><a href="mailto:${esc(cmsSubmissionEmail(viewing))}">${esc(cmsSubmissionEmail(viewing))}</a></div><button type="button" data-cms-submission-close aria-label="关闭详情"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header>
      <div class="cms-inquiry-detail-meta"><span><b>提交时间</b>${esc(viewing.createdAt ? new Date(viewing.createdAt).toLocaleString("zh-CN") : "—")}</span><span><b>处理状态</b>${esc(statusLabel[viewing.status] || statusLabel.new)}</span></div>
      ${detailValues.length ? `<dl>${detailValues.map((entry) => `<div><dt>${esc(entry.label)}</dt><dd>${esc(entry.value)}</dd></div>`).join("")}</dl>` : ""}
      <section><h3>询盘内容</h3><p>${esc(cmsSubmissionContent(viewing))}</p></section>
      <footer><a href="${esc(viewing.source || "/contact-us")}" target="_blank">查看来源页面</a><button type="button" data-cms-submission-close>关闭</button></footer>
    </aside>
  </div>` : ""}`;
}

function cmsPermissionChecks(selected = [], prefix = "permission") {
  return `<div class="cms-permission-grid">${CMS_PERMISSION_OPTIONS.map(([id, label]) => `<label><input type="checkbox" name="permissions" value="${id}" ${selected.includes(id) ? "checked" : ""}><span>${label}</span></label>`).join("")}</div>`;
}

function renderCmsUserManager() {
  if (cmsUsersStatus === "idle") cmsLoadManagedUsers();
  const roleLabel = (role) => role === "super_admin" ? "超级管理员" : "内容人员";
  return `<div class="cms-user-manager">
    <section class="cms-user-create">
      <header><span>新增人员</span><h3>创建后台账号并分配权限</h3></header>
      <form data-cms-user-create>
        <div class="cms-user-form-row"><label>姓名<input name="displayName" required placeholder="例如：内容编辑"></label><label>登录账号<input name="username" required placeholder="例如：editor.li"></label></div>
        <div class="cms-user-form-row"><label>初始密码<input name="password" type="password" minlength="10" required placeholder="至少 10 位"></label><label>角色<select name="role"><option value="editor">内容人员</option><option value="super_admin">超级管理员</option></select></label></div>
        <div><span class="cms-field-label">允许管理的板块</span>${cmsPermissionChecks([])}</div>
        <button type="submit">新增人员</button>
      </form>
    </section>
    <section class="cms-user-list">
      <header><div><span>人员列表</span><h3>${cmsManagedUsers.length} 个后台账号</h3></div><button type="button" data-cms-refresh-users>刷新</button></header>
      ${cmsUsersStatus === "loading" ? `<p class="cms-users-message">正在加载人员…</p>` : ""}
      ${cmsUsersError ? `<p class="cms-users-message error">${esc(cmsUsersError)}</p>` : ""}
      ${cmsManagedUsers.map((user) => `<article class="${user.active ? "" : "is-disabled"}">
        <form data-cms-user-update>
          <input type="hidden" name="id" value="${esc(user.id)}">
          <header><div class="cms-user-avatar">${esc((user.displayName || user.username).slice(0, 2).toUpperCase())}</div><div><b>${esc(user.displayName)}</b><span>@${esc(user.username)} · ${roleLabel(user.role)}</span></div><em>${user.active ? "已启用" : "已停用"}</em></header>
          <div class="cms-user-form-row"><label>姓名<input name="displayName" value="${esc(user.displayName)}" required></label><label>账号<input name="username" value="${esc(user.username)}" required></label></div>
          <div class="cms-user-form-row"><label>角色<select name="role"><option value="editor" ${user.role === "editor" ? "selected" : ""}>内容人员</option><option value="super_admin" ${user.role === "super_admin" ? "selected" : ""}>超级管理员</option></select></label><label>重置密码<input name="password" type="password" minlength="10" placeholder="留空则不修改"></label></div>
          <label class="cms-user-active"><input type="checkbox" name="active" ${user.active ? "checked" : ""}><span>允许登录后台</span></label>
          <div><span class="cms-field-label">板块权限</span>${cmsPermissionChecks(user.permissions || [])}</div>
          <footer><button type="submit">保存账号</button><button type="button" class="danger" data-cms-user-delete="${esc(user.id)}" ${user.id === cmsAuthUser?.id ? "disabled" : ""}>删除人员</button></footer>
        </form>
      </article>`).join("")}
    </section>
  </div>`;
}

function cmsAdminState() {
  if (cmsRemoteState) return cmsSanitizeState(cmsRemoteState);
  const defaults = cmsDefaultState();
  try {
    const stored = JSON.parse(localStorage.getItem(CMS_ADMIN_STORAGE_KEY) || "{}");
    return cmsSanitizeState({ ...defaults, ...stored });
  } catch {
    return defaults;
  }
}

function cmsSaveState(state) {
  const cleanState = cmsSanitizeState(state);
  cmsRemoteState = cleanState;
  try {
    localStorage.setItem(CMS_ADMIN_STORAGE_KEY, JSON.stringify(cleanState));
  } catch {
    // Keep the in-memory draft even when localStorage is unavailable.
  }
  cmsPersistBackendState(cleanState);
  return true;
}

function cmsStampRecord(record, previous = {}) {
  const now = new Date().toISOString();
  return {
    ...record,
    createdAt: previous.createdAt || record.createdAt || now,
    updatedAt: now,
    publishedAt: record.status === "Published" ? (previous.publishedAt || now) : (previous.publishedAt || ""),
  };
}

function cmsTrackActivity(state, action, record, type) {
  state.activity = [{
    id: `activity-${Date.now()}`,
    action,
    title: record.title || record.label || "未命名内容",
    type,
    status: record.status || "Updated",
    date: new Date().toISOString(),
  }, ...(state.activity || [])].slice(0, 30);
}

function cmsRefreshAdminIfActive() {
  const current = routePathOnly(getRoutePath());
  if (current === "/cms" || current === "/cms/editor") render();
  else render({ preserveScroll: true });
}

function cmsLoadBackendState() {
  if (cmsBackendLoadStarted || typeof fetch !== "function") return;
  cmsBackendLoadStarted = true;
  cmsBackendStatus = "Connecting";
  fetch(`${CMS_API_URL}?action=state`, { cache: "no-store" })
    .then((response) => {
      if (response.status === 401) {
        cmsSetSignedOut("登录已过期，请重新登录。");
        cmsRefreshAdminIfActive();
        throw new Error("CMS_AUTH_REQUIRED");
      }
      if (!response.ok) throw new Error(`CMS API ${response.status}`);
      return response.json();
    })
    .then((payload) => {
      if (!payload.ok) throw new Error(payload.error || "CMS API rejected state");
      cmsBackendSource = payload.source || "cms-api";
      cmsBackendStatus = "Connected";
      if (payload.state) {
        cmsRemoteState = cmsSanitizeState(payload.state);
        try {
          localStorage.setItem(CMS_ADMIN_STORAGE_KEY, JSON.stringify(cmsRemoteState));
        } catch {}
      } else {
        cmsRemoteState = cmsAdminState();
        cmsPersistBackendState(cmsRemoteState);
      }
      cmsRefreshAdminIfActive();
    })
    .catch((error) => {
      if (error.message === "CMS_AUTH_REQUIRED" || cmsAuthStatus === "signed-out") return;
      cmsBackendStatus = "Local fallback";
      cmsBackendSource = "localStorage";
      cmsRefreshAdminIfActive();
    });
}

function cmsPersistBackendState(state) {
  if (typeof fetch !== "function") {
    cmsBackendStatus = "Local fallback";
    cmsBackendSource = "localStorage";
    return;
  }
  cmsBackendStatus = "Saving";
  fetch(`${CMS_API_URL}?action=save`, {
    method: "POST",
    headers: cmsAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ state: cmsSanitizeState(state) }),
  })
    .then((response) => {
      if (response.status === 401) {
        cmsSetSignedOut("登录已过期，请重新登录。");
        cmsRefreshAdminIfActive();
        throw new Error("CMS_AUTH_REQUIRED");
      }
      if (!response.ok) throw new Error(`CMS save ${response.status}`);
      return response.json();
    })
    .then((payload) => {
      if (!payload.ok) throw new Error(payload.error || "CMS save failed");
      cmsBackendStatus = "Connected";
      cmsBackendSource = payload.source || "cms-api";
      cmsRefreshAdminIfActive();
    })
    .catch((error) => {
      if (error.message === "CMS_AUTH_REQUIRED" || cmsAuthStatus === "signed-out") return;
      cmsBackendStatus = "Local fallback";
      cmsBackendSource = "localStorage";
      cmsRefreshAdminIfActive();
    });
}

function cmsConnectionClass() {
  if (cmsBackendStatus === "Connected") return "connected";
  if (cmsBackendStatus === "Saving" || cmsBackendStatus === "Connecting") return "syncing";
  return "fallback";
}

function cmsStatusLabel(status) {
  return {
    Published: "已发布",
    Draft: "草稿",
    Hidden: "隐藏",
  }[status] || status || "已发布";
}

function cmsBackendStatusLabel(status) {
  return {
    Connected: "已连接",
    Saving: "保存中",
    Connecting: "连接中",
    "Local fallback": "本地草稿模式",
  }[status] || status || "连接中";
}

function cmsBackendSourceLabel(source) {
  return {
    "local draft": "本地草稿",
    localStorage: "浏览器本地",
    upload: "上传中",
  }[source] || source || "本地草稿";
}

function cmsUsageLabel(usage) {
  return {
    "Product detail hero and product card": "产品详情首屏和产品卡片",
    "News card and news detail hero": "新闻卡片和新闻详情首屏",
    "Home page hero": "首页首屏",
    "About page hero": "关于我们首屏",
    "Footer CTA template": "底部 CTA 模板",
    "Brand asset": "品牌素材",
    Unassigned: "未分配",
  }[usage] || usage || "未分配";
}

function cmsFormatBytes(value) {
  if (typeof value === "string" && value.trim() && /px|源站|建议/i.test(value)) return value.trim();
  const size = Number(value);
  if (!Number.isFinite(size) || size <= 0) return "未知";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function cmsMediaMimeLabel(asset) {
  if (asset?.mimeType) return asset.mimeType;
  if (asset?.type === "document") return "PDF / 文档";
  return "图片";
}

function cmsMediaSlotSpec(usageHint = "") {
  const usage = String(usageHint || "");
  if (usage.includes("产品详情")) {
    return {
      label: "产品详情首屏主图",
      display: "桌面首屏约 1920 x 940 px",
      recommended: "建议出图 2400 x 1180 px，最低 1920 x 940 px",
      safe: "左侧会叠加标题文字，产品主体建议放在右侧中部。",
    };
  }
  if (usage.includes("新闻")) {
    return {
      label: "新闻封面 / 新闻详情图",
      display: "新闻卡片约 540 x 250 px，详情首屏约 1920 x 720 px",
      recommended: "建议出图 1920 x 900 px 或 1200 x 675 px",
      safe: "重要人物和文字尽量放中间，避免卡片裁切。",
    };
  }
  if (usage.includes("首页首屏")) {
    return {
      label: "首页首屏背景",
      display: "桌面首屏约 1920 x 900 px",
      recommended: "建议出图 2400 x 1200 px，最低 1920 x 900 px",
      safe: "移动端会居中裁切，主体放中间偏右更稳。",
    };
  }
  if (usage.includes("页面首屏") || usage.includes("关于我们")) {
    return {
      label: "页面首屏背景",
      display: "桌面首屏约 1920 x 720 px",
      recommended: "建议出图 1920 x 900 px",
      safe: "标题区域通常在左侧或中间，背景文字不要贴边。",
    };
  }
  if (usage.includes("底部 CTA")) {
    return {
      label: "底部 CTA 背景",
      display: "桌面显示约 1920 x 360 px",
      recommended: "建议出图 1920 x 720 px",
      safe: "中间会覆盖 CTA 标题和按钮，主体不要压在正中央。",
    };
  }
  if (usage.includes("下载文件")) {
    return {
      label: "下载中心文件",
      display: "PDF / 文档资源",
      recommended: "建议上传 PDF，文件名使用英文和数字，便于 Hostinger 路径管理",
      safe: "上传后会保存到 /uploads/downloads/，再关联到产品和下载分类。",
    };
  }
  if (usage.includes("产品中心")) {
    return {
      label: "产品中心图",
      display: "桌面区域约 1920 x 820 px",
      recommended: "建议出图 2400 x 1200 px",
      safe: "产品组合建议居中，四周保留留白。",
    };
  }
  return {
    label: "通用图片位",
    display: "按页面容器自适应显示",
    recommended: "建议出图 1920 x 1080 px",
    safe: "主体居中，四周保留安全边距。",
  };
}

function cmsPageAdminTitle(page) {
  const route = routePathOnly(page.path);
  return {
    "/": "首页",
    "/company": "关于我们",
    "/innovation": "创新研发",
    "/contact-us": "联系我们",
    "/resource-support/references": "项目案例",
  }[route] || page.title;
}

function cmsNewProductRecord() {
  const cat = productCategories()[0];
  const id = `/products/${cat.slug}/new-product-${Date.now()}`;
  return {
    id,
    title: "新产品",
    category: cat.slug,
    categoryLabel: cat.title,
    path: id,
    heroImage: "/uploads/products/new-product.webp",
    listImage: "",
    summary: "新的产品简介。",
    status: "Draft",
  };
}

function cmsProductRecordForPath(path, state = cmsAdminState()) {
  const route = routePathOnly(path);
  return state.products.find((product) => routePathOnly(product.path || product.id) === route || product.id === route)
    || tervonaCatalogProducts().find((product) => routePathOnly(product.path || product.id) === route || product.id === route);
}

function cmsDefaultHeroText(categorySlug, catTitle) {
  if (categorySlug === "pv-inverter") {
    return "Tervona inverters are precision engineered to provide maximum performance, efficiency, reliability and longevity.";
  }
  return `${catTitle} are engineered for reliable energy performance, clear monitoring and long-term everyday use.`;
}

function cmsDefaultProductStats(categorySlug) {
  return categorySlug === "pv-inverter"
    ? [
        { label: "Max. Efficiency", value: "97.4%" },
        { label: "MPPT Efficiency", value: "99%" },
      ]
    : [
        { label: "Smart Monitoring", value: "24/7" },
        { label: "Reliable Design", value: "IP65" },
      ];
}

function cmsDefaultProductHighlights() {
  return [
    { title: "High conversion efficiency", body: "Editable product highlight stored in the CMS product model." },
    { title: "Smart monitoring", body: "Editable product highlight stored in the CMS product model." },
    { title: "Flexible installation", body: "Editable product highlight stored in the CMS product model." },
    { title: "Reliable protection", body: "Editable product highlight stored in the CMS product model." },
  ];
}

function cmsNormalizeProductRecord(record, fallbackPath = "") {
  const path = cmsNormalizeRecordPath(record?.path || fallbackPath, fallbackPath || "/products/product");
  const parts = path.split("/").filter(Boolean);
  const categorySlug = record?.category || parts[1] || productCategories()[0].slug;
  const cat = categoryForSlug(categorySlug);
  const title = record?.title || cleanTitle(pageFor(path).title) || "Product";
  const defaultStats = cmsDefaultProductStats(categorySlug);
  const stats = Array.isArray(record?.stats) && record.stats.length ? record.stats : defaultStats;
  const highlights = Array.isArray(record?.highlights) && record.highlights.length ? record.highlights : cmsDefaultProductHighlights();
  return {
    ...(record || {}),
    id: record?.id || path,
    title,
    category: cat.slug,
    categoryLabel: record?.categoryLabel || cat.title,
    path,
    heroImage: record?.heroImage || productImageFor(path),
    listImage: record?.listImage || (window.PRODUCT_LIST_MEDIA && window.PRODUCT_LIST_MEDIA[path]) || "",
    summary: record?.summary || pageFor(path).description || cat.intro,
    status: record?.status || "Published",
    heroText: record?.heroText || cmsDefaultHeroText(cat.slug, cat.title),
    stats: [0, 1].map((index) => ({
      label: stats[index]?.label || defaultStats[index]?.label || `Metric ${index + 1}`,
      value: stats[index]?.value || defaultStats[index]?.value || "",
    })),
    advantagesEyebrow: record?.advantagesEyebrow || "Key Advantages",
    advantagesTitle: record?.advantagesTitle || "Key Advantages",
    advantagesBody: record?.advantagesBody || "High conversion efficiency, stable MPPT tracking and smart monitoring help each system deliver dependable clean energy across homes and businesses.",
    advantagesImage: record?.advantagesImage || record?.heroImage || productImageFor(path),
    productType: record?.productType || "",
    rangeLabel: record?.rangeLabel || "",
    models: record?.models || null,
    technicalSections: Array.isArray(record?.technicalSections) ? record.technicalSections : [],
    highlights: [0, 1, 2, 3].map((index) => ({
      title: highlights[index]?.title || cmsDefaultProductHighlights()[index].title,
      body: highlights[index]?.body || cmsDefaultProductHighlights()[index].body,
    })),
    seoTitle: record?.seoTitle || `${title}-Tervona`,
    seoDescription: record?.seoDescription || record?.summary || pageFor(path).description || cat.intro,
    seoKeywords: record?.seoKeywords || `${title}, ${cat.title}, Tervona`,
    canonicalUrl: record?.canonicalUrl || path,
    seoIndexing: record?.seoIndexing || "index, follow",
  };
}

function cmsNewNewsRecord() {
  const id = `/news/new-article-${Date.now()}`;
  return {
    id,
    title: "新文章",
    path: id,
    date: "Draft",
    coverImage: "/uploads/news/new-article.webp",
    excerpt: "新的新闻摘要。",
    body: "<p>在这里输入新闻正文。</p>",
    status: "Draft",
  };
}

function cmsNewPageRecord() {
  const id = `/page-${Date.now()}`;
  return {
    id,
    title: "新页面",
    path: id,
    template: "templates/pages/default",
    heroImage: "/assets/tervona-products/category-scene-tervona-v2.png",
    summary: "新的页面摘要。",
    status: "Draft",
    blocks: cmsDefaultPageBlocks(),
  };
}

function cmsDefaultPageBlocks() {
  return [
    { id: `widget-${Date.now()}-title`, type: "heading", title: "新页面标题", text: "", image: "", href: "", buttonText: "", background: "#ffffff", color: "#17131f", padding: 64 },
    { id: `widget-${Date.now()}-text`, type: "text", title: "", text: "在这里输入页面内容。你可以继续添加图片、按钮、双栏、产品、新闻和 CTA。", image: "", href: "", buttonText: "", background: "#ffffff", color: "#5f5966", padding: 36 },
  ];
}

const CMS_PAGE_WIDGETS = [
  ["heading", "标题", "H"],
  ["text", "富文本", "¶"],
  ["image", "图片", "▧"],
  ["button", "按钮", "↗"],
  ["spacer", "间距", "↕"],
  ["columns", "双栏", "▥"],
  ["products", "产品列表", "◫"],
  ["news", "新闻列表", "▤"],
  ["cta", "CTA", "◎"],
];

function cmsCreatePageBlock(type) {
  const defaults = {
    heading: { title: "新的标题", padding: 44 },
    text: { text: "输入正文内容。", padding: 32 },
    image: { title: "图片说明", image: "/assets/tervona-products/category-scene-tervona-v2.png", padding: 24 },
    button: { buttonText: "了解更多", href: "/contact-us", padding: 28 },
    spacer: { padding: 72 },
    columns: { title: "双栏标题", text: "左侧内容", secondaryText: "右侧内容", padding: 48 },
    products: { title: "产品推荐", count: 3, padding: 56 },
    news: { title: "最新动态", count: 3, padding: 56 },
    cta: { title: "准备好开始了吗？", text: "联系我们，了解更多解决方案。", buttonText: "联系我们", href: "/contact-us", background: "#17131f", color: "#ffffff", padding: 64 },
  }[type] || {};
  return { id: `widget-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type, title: "", text: "", secondaryText: "", image: "", href: "", buttonText: "", background: "#ffffff", color: "#17131f", padding: 36, count: 3, ...defaults };
}

function cmsNewTemplateRecord() {
  const id = `custom-template-${Date.now()}`;
  return {
    id,
    label: "新模板",
    scope: "自定义页面",
    file: `templates/custom/${id}`,
    controls: ["首屏媒体", "标题", "正文模块", "CTA"],
    notes: "",
  };
}

function cmsCollectionCount(id, state = cmsAdminState()) {
  if (id === "products") return state.products.length;
  if (id === "product-categories") return productCategories().length;
  if (id === "news") return state.news.length;
  if (id === "pages") return state.pages.length;
  if (id === "media") return state.media.length;
  if (id === "downloads") return (state.downloads || []).length;
  const pages = cmsPages();
  return pages.filter((item) => {
    const route = routePathOnly(item.path);
    return !route.startsWith("/products") && !route.startsWith("/news") && !route.startsWith("/download");
  }).length;
}

function cmsProductRows(state = cmsAdminState()) {
  return productCategories().map((cat) => {
    const products = state.products.filter((product) => product.category === cat.slug);
    return {
      ...cat,
      count: products.length,
      sample: products.slice(0, 3),
    };
  });
}

function renderCmsFieldTags(fields) {
  return `<div class="cms-tags">${(fields || []).map((field) => `<span>${esc(field)}</span>`).join("")}</div>`;
}

function renderCmsActionRow(primaryLabel, secondaryLabel, href = "/cms") {
  return `<div class="cms-actions">
    <button type="button">${esc(primaryLabel)}</button>
    <a href="${localHref(href)}">${esc(secondaryLabel)}</a>
  </div>`;
}

function cmsImageMedia(state = cmsAdminState()) {
  return state.media.filter((asset) => asset.type !== "document");
}

function renderCmsMediaPicker(name, selectedUrl, usageHint = "产品详情首屏和产品卡片") {
  const media = cmsImageMedia();
  const slotSpec = cmsMediaSlotSpec(usageHint);
  const selectedAsset = media.find((asset) => asset.url === selectedUrl) || {
    title: selectedUrl || "未选择素材",
    url: selectedUrl || "",
    usage: usageHint,
    size: "",
    type: "image",
  };
  const mediaList = selectedUrl && !media.some((asset) => asset.url === selectedUrl)
    ? [selectedAsset, ...media]
    : media;
  return `<div class="cms-media-picker-field">
    <input type="hidden" name="${esc(name)}" value="${esc(selectedUrl || "")}" data-cms-picked-media>
    <div class="cms-media-picker-head">
      <div><b>从媒体库选择主图</b><p>点击缩略图即可选择，不需要记住文件名。</p></div>
      <button type="button" data-cms-open-media>打开媒体库</button>
    </div>
    <div class="cms-slot-spec">
      <span>${esc(slotSpec.label)}</span>
      <b>${esc(slotSpec.display)}</b>
      <p>${esc(slotSpec.recommended)}</p>
      <em>${esc(slotSpec.safe)}</em>
    </div>
    <div class="cms-media-picker" data-cms-media-picker>
      ${mediaList.map((asset) => `<button type="button" class="${asset.url === selectedUrl ? "active" : ""}" data-cms-pick-media="${esc(asset.url)}" data-cms-title="${esc(asset.title)}" data-cms-size="${esc(cmsFormatBytes(asset.size))}" data-cms-mime="${esc(cmsMediaMimeLabel(asset))}" data-cms-usage="${esc(cmsUsageLabel(asset.usage))}">
        <span>${asset.type === "document" ? "PDF" : `<img src="${esc(asset.url)}" alt="">`}</span>
        <b>${esc(asset.title)}</b>
        <small>${esc(cmsUsageLabel(asset.usage))}</small>
      </button>`).join("")}
    </div>
    <div class="cms-selected-media-details">
      <div><b>当前选中</b><span data-cms-selected-title>${esc(selectedAsset.title)}</span></div>
      <p><span>链接</span><code data-cms-selected-url>${esc(selectedAsset.url || "未选择")}</code></p>
      <p><span>大小</span><em data-cms-selected-size>${esc(cmsFormatBytes(selectedAsset.size))}</em></p>
      <p><span>类型</span><em data-cms-selected-mime>${esc(cmsMediaMimeLabel(selectedAsset))}</em></p>
      <p><span>用途</span><em data-cms-selected-usage>${esc(cmsUsageLabel(selectedAsset.usage))}</em></p>
      <p><span>当前图片像素</span><em data-cms-selected-pixels>读取中</em></p>
    </div>
  </div>`;
}

function renderCmsProductEditor(record) {
  const selected = record || cmsNewProductRecord();
  const isNew = /^\/products\/[^/]+\/new-product-/.test(selected.id || "");
  const selectedImage = selected.heroImage || `${ASSET}/tervona-products-home-banner-v2.png`;
  return `<div class="cms-edit-panel">
    <div class="cms-edit-panel-head">
      <div><span>${isNew ? "新增产品" : "正在编辑产品"}</span><h3>${esc(selected.title || "未命名产品")}</h3></div>
      <button type="button" data-cms-close="products">← 返回产品列表</button>
    </div>
    <div class="cms-media-placement">
      <img src="${esc(selectedImage)}" alt="">
      <div><b>产品图片显示位置</b><p>这张图片会显示在产品详情页首屏、产品分类/集合页卡片，以及后台记录缩略图中。</p><small>原位置尺寸：桌面首屏约 1920 x 940 px；建议出图 2400 x 1180 px。</small></div>
    </div>
    <form class="cms-editor-form" data-cms-editor="products">
      <input type="hidden" name="originalId" value="${esc(selected.id)}">
      <label>产品标题<input name="title" value="${esc(selected.title)}"></label>
      <label>产品分类<select name="category">
        ${productCategories().map((cat) => `<option value="${esc(cat.slug)}" ${cat.slug === selected.category ? "selected" : ""}>${esc(cat.title)}</option>`).join("")}
      </select></label>
      <label>页面路径<input name="path" value="${esc(selected.path)}"></label>
      ${renderCmsMediaPicker("heroImage", selectedImage, "产品详情首屏和产品卡片")}
      <label>或粘贴图片地址<input name="heroImageManual" value="" placeholder="/uploads/products/example.webp"></label>
      <label>状态<select name="status">
        ${["Published", "Draft", "Hidden"].map((status) => `<option value="${status}" ${status === selected.status ? "selected" : ""}>${cmsStatusLabel(status)}</option>`).join("")}
      </select></label>
      <label>简短说明<textarea name="summary">${esc(selected.summary)}</textarea></label>
      <button type="submit">保存产品</button>
    </form>
  </div>`;
}

function renderCmsContentEditor(params) {
  cmsCheckSession();
  if (cmsAuthStatus === "checking") return renderCmsAuthLoading();
  if (!cmsAuthUser) return renderCmsLogin();
  if (!cmsCanAccess(params.get("type") || "products")) return renderCmsAdmin(new URLSearchParams("section=dashboard"));
  cmsLoadBackendState();
  const type = params.get("type") || "products";
  if (type !== "products") {
    return `<main class="inside-main cms-admin cms-admin-shell">
      <div class="cms-wp-bar"><b>Tervona 后台</b><a href="${cmsSectionPath(type)}">← 返回对应内容列表</a></div>
      <section class="cms-live-editor cms-live-empty"><h1>暂未支持这个内容类型</h1><p>当前实时编辑器先接入产品详情页。</p></section>
    </main>`;
  }
  const rawId = params.get("id") || "";
  const id = decodeURIComponent(rawId);
  const state = cmsAdminState();
  const fallback = state.products[0] || cmsNewProductRecord();
  const record = state.products.find((item) => item.id === id || item.path === id) || fallback;
  return renderCmsLiveProductEditor(cmsNormalizeProductRecord(record), record.id || record.path);
}

function renderCmsLiveProductEditor(record, originalId) {
  const cat = categoryForSlug(record.category);
  return `<main class="inside-main cms-admin cms-admin-shell cms-live-shell">
    <div class="cms-wp-bar">
      <b>Tervona 后台</b>
      <a href="${cmsSectionPath("products")}">← 返回产品列表</a>
      <a href="${localHref(record.path)}">查看前台</a>
      <span class="cms-connection ${cmsConnectionClass()}">${esc(cmsBackendStatusLabel(cmsBackendStatus))} · ${esc(cmsBackendSourceLabel(cmsBackendSource))}</span>
    </div>
    <form class="cms-live-editor" data-cms-live-editor="products">
      <input type="hidden" name="originalId" value="${esc(originalId || record.id)}">
      <input type="hidden" name="heroImage" value="${esc(record.heroImage)}" data-cms-picked-media>
      <aside class="cms-live-fields">
        <div class="cms-live-title">
          <a class="cms-editor-back" href="${cmsSectionPath("products")}">← 返回产品列表</a>
          <span>产品详情页模板</span>
          <h1>编辑 ${esc(record.title)}</h1>
          <p>左侧修改文字和图片，右侧实时预览产品详情页首屏、优势区、亮点卡片和 SEO 信息。</p>
        </div>
        <section class="cms-editor-box">
          <h2>基础信息</h2>
          <label>产品标题<input name="title" value="${esc(record.title)}" data-live-field="title"></label>
          <label>产品分类<select name="category" data-live-field="category">
            ${productCategories().map((item) => `<option value="${esc(item.slug)}" ${item.slug === record.category ? "selected" : ""}>${esc(item.title)}</option>`).join("")}
          </select></label>
          <label>页面路径<input name="path" value="${esc(record.path)}" data-live-field="path"></label>
          <label>产品摘要<textarea name="summary" data-live-field="summary">${esc(record.summary)}</textarea></label>
          <label>首屏说明<textarea name="heroText" data-live-field="heroText">${esc(record.heroText)}</textarea></label>
          <label>状态<select name="status">
            ${["Published", "Draft", "Hidden"].map((status) => `<option value="${status}" ${status === record.status ? "selected" : ""}>${cmsStatusLabel(status)}</option>`).join("")}
          </select></label>
        </section>
        <section class="cms-editor-box">
          <h2>主图</h2>
          <div class="cms-size-note"><b>产品详情首屏主图尺寸</b><span>原位置桌面约 1920 x 940 px</span><span>建议设计 2400 x 1180 px，最低 1920 x 940 px</span><em>左侧会叠加标题文字，产品主体建议放在右侧中部。</em></div>
          ${renderCmsMediaPicker("heroImagePicker", record.heroImage, "产品详情首屏和产品卡片")}
          <label>或粘贴图片地址<input name="heroImageManual" value="" placeholder="/uploads/products/example.webp" data-live-field="heroImageManual"></label>
        </section>
        <section class="cms-editor-box">
          <h2>数据卡片</h2>
          ${record.stats.map((stat, index) => `<div class="cms-inline-fields">
            <label>指标 ${index + 1} 名称<input name="stat${index}Label" value="${esc(stat.label)}" data-live-field="stat${index}Label"></label>
            <label>指标 ${index + 1} 数值<input name="stat${index}Value" value="${esc(stat.value)}" data-live-field="stat${index}Value"></label>
          </div>`).join("")}
        </section>
        <section class="cms-editor-box">
          <h2>优势板块</h2>
          <label>小标题<input name="advantagesEyebrow" value="${esc(record.advantagesEyebrow)}" data-live-field="advantagesEyebrow"></label>
          <label>标题<input name="advantagesTitle" value="${esc(record.advantagesTitle)}" data-live-field="advantagesTitle"></label>
          <label>正文<textarea name="advantagesBody" data-live-field="advantagesBody">${esc(record.advantagesBody)}</textarea></label>
        </section>
        <section class="cms-editor-box">
          <h2>亮点卡片</h2>
          ${record.highlights.map((item, index) => `<div class="cms-highlight-editor">
            <b>亮点 ${index + 1}</b>
            <label>标题<input name="highlight${index}Title" value="${esc(item.title)}" data-live-field="highlight${index}Title"></label>
            <label>说明<textarea name="highlight${index}Body" data-live-field="highlight${index}Body">${esc(item.body)}</textarea></label>
          </div>`).join("")}
        </section>
        <section class="cms-editor-box cms-seo-box">
          <h2>SEO 设置</h2>
          <label>SEO 标题<input name="seoTitle" value="${esc(record.seoTitle)}" data-live-field="seoTitle"></label>
          <label>SEO 描述<textarea name="seoDescription" data-live-field="seoDescription">${esc(record.seoDescription)}</textarea></label>
          <label>关键词<input name="seoKeywords" value="${esc(record.seoKeywords)}"></label>
          <label>Canonical URL<input name="canonicalUrl" value="${esc(record.canonicalUrl)}"></label>
          <label>Robots<select name="seoIndexing">
            ${["index, follow", "noindex, follow", "noindex, nofollow"].map((value) => `<option value="${value}" ${value === record.seoIndexing ? "selected" : ""}>${value}</option>`).join("")}
          </select></label>
          <div class="cms-seo-preview"><span>搜索结果预览</span><b data-live-preview="seoTitle">${esc(record.seoTitle)}</b><p data-live-preview="seoDescription">${esc(record.seoDescription)}</p><em>${esc(record.path)}</em></div>
        </section>
      </aside>
      <section class="cms-live-preview">
        <div class="cms-live-toolbar">
          <div><span>实时预览 · 桌面画布 1440px 等比例缩放</span><b data-live-preview="title">${esc(record.title)}</b></div>
          <button type="submit">保存修改</button>
        </div>
        <div class="cms-preview-stage" data-cms-preview-stage>
          <div class="cms-preview-frame" data-cms-preview-frame>
            <section class="series-hero cms-preview-series-hero">
              <div class="series-hero-bg"><img src="${esc(record.heroImage)}" alt="" data-live-preview="heroImage"></div>
              <div class="series-hero-copy">
                <a class="back-link" data-live-preview="categoryLabel">${esc(cat.title.replace(/ies$/, "y").replace(/s$/, ""))}</a>
                <h1 data-live-preview="title">${esc(record.title)}</h1>
                <p data-live-preview="heroText">${esc(record.heroText)}</p>
              </div>
              <div class="series-hero-stats">
                ${record.stats.map((stat, index) => `<article class="series-hero-stat"><span data-live-preview="stat${index}Label">${esc(stat.label)}</span><strong data-live-preview="stat${index}Value">${esc(stat.value)}</strong></article>`).join("")}
              </div>
            </section>
            <section class="series-effi cms-preview-effi">
              <div class="series-effi-bg"><img src="${ASSET}/tervona-home-20260922/home-solutions-pc.jpg" alt=""></div>
              <div class="series-effi-copy"><span data-live-preview="advantagesEyebrow">${esc(record.advantagesEyebrow)}</span><h2 data-live-preview="advantagesTitle">${esc(record.advantagesTitle)}</h2><p data-live-preview="advantagesBody">${esc(record.advantagesBody)}</p></div>
            </section>
            ${renderProductAdvantages(record, { preview: true })}
          </div>
        </div>
      </section>
    </form>
  </main>`;
}

function renderCmsNewsEditor(record) {
  const selected = record || cmsNewNewsRecord();
  const isNew = /^\/news\/new-article-/.test(selected.id || "");
  return `<div class="cms-edit-panel">
    <div class="cms-edit-panel-head">
      <div><span>${isNew ? "新增新闻" : "正在编辑新闻"}</span><h3>${esc(selected.title || "未命名新闻")}</h3></div>
      <button type="button" data-cms-close="news">← 返回新闻列表</button>
    </div>
    <form class="cms-editor-form" data-cms-editor="news">
      <input type="hidden" name="originalId" value="${esc(selected.id)}">
      <label>新闻标题<input name="title" value="${esc(selected.title)}"></label>
      <label>页面路径<input name="path" value="${esc(selected.path)}"></label>
      <label>发布日期<input name="date" value="${esc(selected.date)}"></label>
      <label>封面图片<input name="coverImage" value="${esc(selected.coverImage)}"></label>
      <label>状态<select name="status">
        ${["Published", "Draft", "Hidden"].map((status) => `<option value="${status}" ${status === selected.status ? "selected" : ""}>${cmsStatusLabel(status)}</option>`).join("")}
      </select></label>
      <label>摘要 / 正文概述<textarea name="excerpt">${esc(selected.excerpt)}</textarea></label>
      <label class="cms-editor-span-2">新闻正文（支持段落、标题、列表、粗体、链接和图片等基础 HTML）<textarea name="body" rows="16" placeholder="<p>新闻正文</p>">${esc(selected.body || "")}</textarea></label>
      <button type="submit">保存新闻</button>
    </form>
  </div>`;
}

function renderCmsVisualControl(label, name, value, options = {}) {
  const { type = "text", min = "", max = "", step = "", suffix = "" } = options;
  if (type === "range") {
    return `<label class="cms-visual-range"><span>${esc(label)}</span><div><input type="range" name="${esc(name)}" value="${esc(value)}" min="${esc(min)}" max="${esc(max)}" step="${esc(step || 1)}"><output>${esc(value)}${esc(suffix)}</output></div></label>`;
  }
  if (type === "color") {
    return `<label class="cms-visual-color"><span>${esc(label)}</span><div><input type="color" name="${esc(name)}" value="${esc(value)}"><code>${esc(value)}</code></div></label>`;
  }
  return `<label><span>${esc(label)}</span><input type="${esc(type)}" name="${esc(name)}" value="${esc(value)}"></label>`;
}

function renderCmsVisualMediaModal(state, visual) {
  const allMedia = cmsImageMedia(state);
  const needsVideo = ["hero-section", "solutions", "about", "innovation", "footer"].includes(cmsVisualSelected);
  const media = [...allMedia].sort((a, b) => needsVideo ? (a.type === "video" ? -1 : 1) - (b.type === "video" ? -1 : 1) : (a.type === "image" ? -1 : 1) - (b.type === "image" ? -1 : 1)).slice(0, 24);
  return `<div class="cms-visual-media-modal ${cmsVisualMediaOpen ? "open" : ""}" data-visual-media-modal>
    <div class="cms-visual-modal-head"><div><b>媒体库</b><span>选择已有素材，或上传新的图片和视频</span></div><button type="button" data-visual-close-media aria-label="关闭">×</button></div>
    <div class="cms-visual-media-tools"><nav><button class="active" type="button">全部</button><button type="button">图片</button><button type="button">视频</button></nav><input type="search" placeholder="搜索素材…"><button type="button" data-visual-upload-trigger>上传素材</button></div>
    <div class="cms-visual-media-grid">
      ${media.map((asset) => `<button type="button" class="${asset.url === visual.heroImage ? "active" : ""}" data-visual-media="${esc(asset.url)}" data-visual-media-type="${esc(asset.type)}" title="${esc(asset.title)}">${asset.type === "video" ? `<video src="${esc(asset.url)}" muted preload="metadata"></video><i>VIDEO</i>` : `<img src="${esc(asset.url)}" alt="">`}<span>${esc(asset.title)}</span></button>`).join("")}
    </div>
    <div class="cms-visual-modal-foot"><span>选择一张图片作为当前板块背景</span><button type="button" class="primary" data-visual-insert-media>插入页面</button></div>
  </div>`;
}

function renderCmsAssetHandoff(section) {
  const specs = {
    "hero-section": { type:"图片 / 视频轮播", original:"视频 1920×940 px · 15 秒 · MP4；PC 图 1920×960 px；手机图 750×1200 px", output:"视频 MP4(H.264)，建议 8–20 秒、静音循环；图片 JPG/WebP", ratio:"PC 约 2:1；手机约 5:8，必须分别出图", position:"标题在左侧；人物、产品和核心物体放中间偏右，左右各留 10% 安全边距", motion:"首帧必须能独立作为封面，禁止把关键信息只放在视频最后几秒" },
    solutions: { type:"背景图片 + 能量流动动画", original:"底图 1880×940 px；动画 1920×960 px · 13.04 秒 · MP4", output:"底图 JPG/WebP；动画 MP4(H.264)，无声、无缝循环", ratio:"2:1 横版，桌面建议交付 2400×1200 px", position:"房屋/产品主体居中偏右；左侧 38% 保留给标题和说明，热点设备位置不要贴边", motion:"动画应表现能量流向，不要移动镜头；首尾帧需要自然衔接" },
    products: { type:"透明产品组合图", original:"当前透明 PNG；建议宽度至少 1600 px", output:"PNG 或 WebP，必须透明背景；不要用 JPG", ratio:"建议 16:9 画布，产品组合占画布 70%–80%", position:"主产品居中，逆变器/电池/充电桩之间留出热点标注空间；底部保留数据卡区域", motion:"如需动画，另交透明 WebM 或带 Alpha 的视频版本，并保留静态 PNG 兜底" },
    about: { type:"长背景图片 + 地球动画", original:"PC 背景 1920×2130 px；手机背景 768×2554 px；动画 1920×1080 px · 15 秒 · MP4", output:"PC/手机两套 JPG/WebP；动画 MP4(H.264)", ratio:"背景为纵向长图；动画 16:9", position:"地球主体居中偏下；左侧标题和按钮区域避免高亮复杂纹理；数字区域保持干净", motion:"地球缓慢旋转或粒子流动，无快速闪烁；手机端允许只使用静态图" },
    innovation: { type:"制造产线视频 + 视频封面", original:"视频 2254×1080 px · 11.45 秒 · MP4", output:"MP4(H.264)，建议码率 4–8 Mbps；封面 JPG/WebP 同比例", ratio:"约 2.09:1 超宽横版", position:"产线或产品主体放中央下半区；中央标题安全区保持低对比，顶部/底部各留 12%", motion:"固定机位或缓慢推进，无声循环；避免剪辑点落在循环衔接处" },
    news: { type:"后台新闻封面自动调用", original:"卡片显示约 540×304 px", output:"推荐 1920×1080 或 1200×675 px，JPG/WebP", ratio:"统一 16:9", position:"人物、产品和标题主体放画面中间 70% 安全区，避免边缘裁切", motion:"新闻列表使用静态封面；视频新闻也必须单独提供静态封面" },
    footer: { type:"超宽背景视频 + PC/手机兜底图", original:"视频 4692×1080 px · 10.01 秒 · MP4；背景图 1920×440 px", output:"MP4(H.264) + PC/手机 JPG/WebP", ratio:"视频约 4.34:1；图片约 4.36:1", position:"标题与按钮在正中央；中央 40% 不放复杂主体，视觉元素放两侧", motion:"只做轻微环境运动，无声循环；首帧和静态兜底图视觉必须一致" },
  };
  const spec = specs[section];
  if (!spec) return "";
  return `<section class="cms-asset-handoff"><header><div><span>设计交接</span><b>替换素材规范</b></div><em>${esc(spec.type)}</em></header><dl><dt>原素材规格</dt><dd>${esc(spec.original)}</dd><dt>推荐交付</dt><dd>${esc(spec.output)}</dd><dt>画布比例</dt><dd>${esc(spec.ratio)}</dd><dt>主体位置</dt><dd>${esc(spec.position)}</dd><dt>动画说明</dt><dd>${esc(spec.motion)}</dd></dl><p>替换时请保持相同画布比例；尺寸可以更大，但不要低于推荐尺寸。</p></section>`;
}

function renderCmsHomeVisualEditor(state = cmsAdminState()) {
  const visual = cmsHomeVisualSettings(state);
  const selectedLabel = { "hero-title": "标题", "hero-text": "说明文字", "hero-image": "背景媒体", "hero-section": "首屏 Hero", solutions: "家庭能源方案", products: "产品展示", about: "关于我们", innovation: "研发制造", news: "新闻动态", footer: "页脚 CTA" }[cmsVisualSelected] || "标题";
  let inspector = cmsVisualSelected === "hero-text" ? `
    <label><span>说明文字</span><textarea name="heroText">${esc(visual.heroText)}</textarea></label>
    ${renderCmsVisualControl("字号", "heroTextSize", visual.heroTextSize, { type: "range", min: 12, max: 34, suffix: "px" })}
    ${renderCmsVisualControl("文字颜色", "heroTextColor", visual.heroTextColor, { type: "color" })}` : cmsVisualSelected === "hero-image" ? `
    <div class="cms-visual-media-field"><span>背景图片 / 视频</span><img src="${esc(visual.heroImage)}" alt=""><div><button type="button" data-visual-open-media>选择素材</button><button type="button" data-visual-upload-trigger>上传</button></div></div>` : cmsVisualSelected === "hero-section" ? `
    ${renderCmsVisualControl("上间距", "sectionTop", visual.sectionTop, { type: "range", min: 0, max: 160, suffix: "px" })}
    ${renderCmsVisualControl("下间距", "sectionBottom", visual.sectionBottom, { type: "range", min: 0, max: 160, suffix: "px" })}
    <div class="cms-visual-media-field"><span>首屏背景视频</span><video src="${esc(visual.heroVideo)}" poster="${esc(visual.heroImage)}" muted loop autoplay playsinline></video><button type="button" data-visual-open-media>替换视频素材</button></div>` : `
    <label><span>标题文字</span><textarea name="heroTitle">${esc(visual.heroTitle)}</textarea></label>
    <label><span>字体</span><select name="heroFont"><option>Poppins</option><option>Arial</option><option>Georgia</option></select></label>
    ${renderCmsVisualControl("字号", "heroTitleSize", visual.heroTitleSize, { type: "range", min: 36, max: 108, suffix: "px" })}
    <label><span>字重</span><select name="heroTitleWeight">${[400,500,600,700,800].map((weight) => `<option value="${weight}" ${Number(visual.heroTitleWeight) === weight ? "selected" : ""}>${weight}</option>`).join("")}</select></label>
    ${renderCmsVisualControl("文字颜色", "heroTitleColor", visual.heroTitleColor, { type: "color" })}
    ${renderCmsVisualControl("行高", "heroTitleLineHeight", visual.heroTitleLineHeight, { type: "range", min: .8, max: 1.8, step: .05 })}`;

  const sectionEditors = {
    solutions: `<label><span>板块标签</span><input name="solutionsEyebrow" value="${esc(visual.solutionsEyebrow)}"></label><label><span>板块标题</span><textarea name="solutionsTitle">${esc(visual.solutionsTitle)}</textarea></label><label><span>板块说明</span><textarea name="solutionsText">${esc(visual.solutionsText)}</textarea></label><div class="cms-visual-media-field"><span>能量流动动画</span><video src="${esc(visual.solutionsVideo)}" poster="${esc(visual.solutionsImage)}" muted loop autoplay playsinline></video><button type="button" data-visual-open-media>替换视频素材</button></div>${renderCmsVisualControl("板块间距", "solutionsSpacing", visual.sectionSpacing.solutions, { type: "range", min: 20, max: 180, suffix: "px" })}`,
    products: `<label><span>板块标签</span><input name="productsEyebrow" value="${esc(visual.productsEyebrow)}"></label><label><span>板块标题</span><textarea name="productsTitle">${esc(visual.productsTitle)}</textarea></label><label><span>内容来源</span><select name="productsSource"><option value="cms" ${visual.productsSource === "cms" ? "selected" : ""}>自动调用产品后台</option><option value="manual" ${visual.productsSource === "manual" ? "selected" : ""}>手动配置</option></select></label><div class="cms-visual-source-tip">自动模式会读取“产品”模块中的已发布内容，新增产品后无需重复维护首页。</div><div class="cms-visual-media-field"><span>产品组合主图</span><img src="${esc(visual.productsImage)}" alt=""><button type="button" data-visual-open-media>从素材库替换</button></div>${renderCmsVisualControl("板块间距", "productsSpacing", visual.sectionSpacing.products, { type: "range", min: 20, max: 180, suffix: "px" })}`,
    about: `<label><span>板块标签</span><input name="aboutEyebrow" value="${esc(visual.aboutEyebrow)}"></label><label><span>板块标题</span><input name="aboutTitle" value="${esc(visual.aboutTitle)}"></label><label><span>介绍文字</span><textarea name="aboutText">${esc(visual.aboutText)}</textarea></label><div class="cms-visual-media-field"><span>地球动画视频</span><video src="${esc(visual.aboutVideo)}" poster="${esc(visual.aboutImage)}" muted loop autoplay playsinline></video><button type="button" data-visual-open-media>替换视频素材</button></div>${renderCmsVisualControl("板块间距", "aboutSpacing", visual.sectionSpacing.about, { type: "range", min: 20, max: 180, suffix: "px" })}`,
    innovation: `<label><span>板块标签</span><input name="innovationEyebrow" value="${esc(visual.innovationEyebrow)}"></label><label><span>板块标题</span><textarea name="innovationTitle">${esc(visual.innovationTitle)}</textarea></label><div class="cms-visual-media-field"><span>制造产线视频</span><video src="${esc(visual.innovationVideo)}" poster="${esc(visual.innovationImage)}" muted loop autoplay playsinline></video><button type="button" data-visual-open-media>替换视频素材</button></div>${renderCmsVisualControl("板块间距", "innovationSpacing", visual.sectionSpacing.innovation, { type: "range", min: 20, max: 180, suffix: "px" })}`,
    news: `<label><span>板块标签</span><input name="newsEyebrow" value="${esc(visual.newsEyebrow)}"></label><label><span>板块标题</span><input name="newsTitle" value="${esc(visual.newsTitle)}"></label><label><span>内容来源</span><select name="newsSource"><option value="cms" selected>自动调用新闻后台</option></select></label>${renderCmsVisualControl("显示数量", "newsCount", visual.newsCount, { type: "range", min: 1, max: 8 })}<div class="cms-visual-source-tip">按发布时间自动读取最新新闻封面、标题和链接。</div>${renderCmsVisualControl("板块间距", "newsSpacing", visual.sectionSpacing.news, { type: "range", min: 20, max: 180, suffix: "px" })}`,
    footer: `<label><span>CTA 标题</span><input name="footerTitle" value="${esc(visual.footerTitle)}"></label><label><span>按钮文字</span><input name="footerButtonText" value="${esc(visual.footerButtonText)}"></label><div class="cms-visual-media-field"><span>超宽背景视频</span><video src="${esc(visual.footerVideo)}" poster="${esc(visual.footerImage)}" muted loop autoplay playsinline></video><button type="button" data-visual-open-media>替换视频素材</button></div>${renderCmsVisualControl("板块间距", "footerSpacing", visual.sectionSpacing.footer, { type: "range", min: 20, max: 140, suffix: "px" })}`,
  };
  if (sectionEditors[cmsVisualSelected]) inspector = `<label class="cms-visual-visibility"><input type="checkbox" name="sectionVisible" ${visual.sectionVisibility[cmsVisualSelected] ? "checked" : ""}><span>在首页显示此板块</span></label>${sectionEditors[cmsVisualSelected]}`;

  return `<div class="cms-visual-editor" data-visual-editor>
    <header class="cms-visual-toolbar">
      <div class="cms-visual-page-name"><button type="button" data-visual-exit aria-label="返回页面列表">‹</button><b>首页</b><span>可视化编辑</span></div>
      <div class="cms-visual-devices">${[["desktop","桌面"],["tablet","平板"],["mobile","手机"]].map(([id,label]) => `<button type="button" class="${cmsVisualDevice === id ? "active" : ""}" data-visual-device="${id}">${label}</button>`).join("")}</div>
      <div class="cms-visual-toolbar-actions"><button type="button" data-visual-undo>↶ 撤销</button><button type="button" data-visual-redo>↷ 重做</button><a href="${localHref("/")}" target="_blank">预览</a><button type="button" class="primary" data-visual-publish>发布</button></div>
    </header>
    <div class="cms-visual-body">
      <form class="cms-visual-inspector" data-visual-form>
        <div class="cms-visual-tabs">${[["content","内容"],["style","样式"],["advanced","高级"]].map(([id,label]) => `<button type="button" class="${cmsVisualTab === id ? "active" : ""}" data-visual-tab="${id}">${label}</button>`).join("")}</div>
        <div class="cms-visual-inspector-title"><span>正在编辑</span><b>${esc(selectedLabel)}</b></div>
        <div class="cms-visual-fields ${cmsVisualTab !== "content" ? "is-secondary" : ""}">
          ${cmsVisualTab === "content" ? `${inspector}${renderCmsAssetHandoff(["hero-title","hero-text","hero-image"].includes(cmsVisualSelected) ? "hero-section" : cmsVisualSelected)}` : cmsVisualTab === "style" ? `${renderCmsVisualControl("标题字号", "heroTitleSize", visual.heroTitleSize, { type: "range", min: 36, max: 108, suffix: "px" })}${renderCmsVisualControl("标题颜色", "heroTitleColor", visual.heroTitleColor, { type: "color" })}${renderCmsVisualControl("正文字号", "heroTextSize", visual.heroTextSize, { type: "range", min: 12, max: 34, suffix: "px" })}${renderCmsVisualControl("正文颜色", "heroTextColor", visual.heroTextColor, { type: "color" })}` : `${renderCmsVisualControl("板块上间距", "sectionTop", visual.sectionTop, { type: "range", min: 0, max: 160, suffix: "px" })}${renderCmsVisualControl("板块下间距", "sectionBottom", visual.sectionBottom, { type: "range", min: 0, max: 160, suffix: "px" })}<div class="cms-visual-note">更多响应式边距、定位和动画控制将在下一版加入。</div>`}
        </div>
        <input type="hidden" name="${esc({"hero-section":"heroVideo",solutions:"solutionsVideo",products:"productsImage",about:"aboutVideo",innovation:"innovationVideo",footer:"footerVideo"}[cmsVisualSelected] || "heroImage")}" value="${esc({"hero-section":visual.heroVideo,solutions:visual.solutionsVideo,products:visual.productsImage,about:visual.aboutVideo,innovation:visual.innovationVideo,footer:visual.footerVideo}[cmsVisualSelected] || visual.heroImage)}" data-visual-image-value>
      </form>
      <section class="cms-visual-canvas-wrap">
        <div class="cms-visual-canvas ${cmsVisualDevice}" data-visual-canvas>
          <div class="cms-visual-site-header"><img src="${ASSET}/tervona-logo-transparent.png" alt="Tervona"><nav><span>Products</span><span>Company</span><span>Downloads</span><span>Partner</span></nav><button>Contact Us</button></div>
          <div class="cms-visual-hero" data-visual-select="hero-section" style="background-image:url('${esc(visual.heroImage)}');padding-top:${esc(visual.sectionTop)}px;padding-bottom:${esc(visual.sectionBottom)}px">
            <video class="cms-visual-hero-video" src="${esc(visual.heroVideo)}" poster="${esc(visual.heroImage)}" muted loop autoplay playsinline></video>
            <div class="cms-visual-hero-shade"></div>
            <div class="cms-visual-hero-copy">
              <div class="cms-visual-selectable ${cmsVisualSelected === "hero-title" ? "selected" : ""}" data-visual-select="hero-title"><div class="cms-visual-element-tools">↕　✎　⧉</div><h1 style="font-size:${esc(visual.heroTitleSize)}px;font-weight:${esc(visual.heroTitleWeight)};line-height:${esc(visual.heroTitleLineHeight)};color:${esc(visual.heroTitleColor)}">${esc(visual.heroTitle)}</h1></div>
              <div class="cms-visual-selectable ${cmsVisualSelected === "hero-text" ? "selected" : ""}" data-visual-select="hero-text"><p style="font-size:${esc(visual.heroTextSize)}px;color:${esc(visual.heroTextColor)}">${esc(visual.heroText)}</p></div>
              <button class="cms-visual-preview-cta">Contact Us →</button>
            </div>
            <button type="button" class="cms-visual-image-handle ${cmsVisualSelected === "hero-image" ? "active" : ""}" data-visual-select="hero-image">更换背景</button>
          </div>
          <div class="cms-visual-page-section cms-visual-solutions ${cmsVisualSelected === "solutions" ? "selected" : ""}" data-visual-select="solutions"><div><span>${esc(visual.solutionsEyebrow)}</span><h2>${esc(visual.solutionsTitle)}</h2><p>${esc(visual.solutionsText)}</p></div><video src="${esc(visual.solutionsVideo)}" poster="${esc(visual.solutionsImage)}" muted loop autoplay playsinline></video></div>
          <div class="cms-visual-page-section cms-visual-products ${cmsVisualSelected === "products" ? "selected" : ""}" data-visual-select="products"><div><span>${esc(visual.productsEyebrow)}</span><h2>${esc(visual.productsTitle)}</h2><em>自动调用产品后台 · ${cmsProductRows(state).reduce((sum,row)=>sum+row.count,0)} 项内容</em></div><img src="${esc(visual.productsImage)}" alt=""></div>
          <div class="cms-visual-page-section cms-visual-about ${cmsVisualSelected === "about" ? "selected" : ""}" data-visual-select="about" style="background-image:url('${esc(visual.aboutImage)}')"><video src="${esc(visual.aboutVideo)}" poster="${esc(visual.aboutImage)}" muted loop autoplay playsinline></video><div><span>${esc(visual.aboutEyebrow)}</span><h2>${esc(visual.aboutTitle)}</h2><p>${esc(visual.aboutText)}</p><button>Learn More →</button></div></div>
          <div class="cms-visual-page-section cms-visual-innovation ${cmsVisualSelected === "innovation" ? "selected" : ""}" data-visual-select="innovation"><video src="${esc(visual.innovationVideo)}" poster="${esc(visual.innovationImage)}" muted loop autoplay playsinline></video><div><span>${esc(visual.innovationEyebrow)}</span><h2>${esc(visual.innovationTitle)}</h2></div></div>
          <div class="cms-visual-page-section cms-visual-news ${cmsVisualSelected === "news" ? "selected" : ""}" data-visual-select="news"><header><span>${esc(visual.newsEyebrow)}</span><h2>${esc(visual.newsTitle)}</h2><em>自动调用最新 ${esc(visual.newsCount)} 篇</em></header><div>${state.news.slice(0,3).map(item=>`<article><img src="${esc(item.coverImage)}" alt=""><b>${esc(item.title)}</b></article>`).join("")}</div></div>
          <div class="cms-visual-page-section cms-visual-footer-preview ${cmsVisualSelected === "footer" ? "selected" : ""}" data-visual-select="footer" style="background-image:url('${esc(visual.footerImage)}')"><video src="${esc(visual.footerVideo)}" poster="${esc(visual.footerImage)}" muted loop autoplay playsinline></video><h2>${esc(visual.footerTitle)}</h2><button>${esc(visual.footerButtonText)} →</button></div>
        </div>
        ${renderCmsVisualMediaModal(state, visual)}
        <footer class="cms-visual-status"><span>图层</span><span>网格</span><span>80%</span><span>画布宽度：1200px</span><b data-visual-save-status>已保存</b></footer>
      </section>
      <aside class="cms-visual-layers"><div class="cms-visual-layers-head"><b>页面结构</b><span>✓ 已保存</span></div>
        ${[["header","页头"],["hero-section","首屏 Hero"],["hero-title","标题"],["hero-text","说明文字"],["solutions","家庭能源方案"],["products","产品展示"],["about","关于我们"],["innovation","研发制造"],["news","新闻动态"],["footer","页脚 CTA"]].map(([id,label]) => `<button type="button" class="${cmsVisualSelected === id ? "active" : ""} ${["hero-title","hero-text"].includes(id) ? "child" : ""}" data-visual-layer="${id}"><span>${esc(label)}</span><em>⋮</em></button>`).join("")}
      </aside>
    </div>
  </div>`;
}

function renderCmsPageEditor(record) {
  const selected = record || cmsSeedPages()[0];
  const selectedImage = selected.heroImage || "/assets/tervona-products/category-scene-tervona-v2.png";
  const templates = (cmsAdminState().templates || cmsModel().templates).filter((template) => String(template.file || "").startsWith("templates/pages"));
  const templateOptions = templates.length ? templates : [
    { id: "page-default", label: "默认页面模板", file: "templates/pages/default" },
    { id: "page-home", label: "首页模板", file: "templates/pages/home" },
  ];
  return `<div class="cms-edit-panel">
    <div class="cms-edit-panel-head">
      <div><span>正在编辑页面</span><h3>${esc(cmsPageAdminTitle(selected) || "未命名页面")}</h3></div>
      <button type="button" data-cms-close="pages">← 返回页面列表</button>
    </div>
    <div class="cms-media-placement">
      <img src="${esc(selectedImage)}" alt="">
      <div><b>页面主图显示位置</b><p>这张图会用于页面首屏、页面列表缩略图，以及后台记录缩略图。</p></div>
    </div>
    <form class="cms-editor-form" data-cms-editor="pages">
      <input type="hidden" name="originalId" value="${esc(selected.id)}">
      <label>页面标题<input name="title" value="${esc(cmsPageAdminTitle(selected) || selected.title || "")}"></label>
      <label>页面路径<input name="path" value="${esc(selected.path || "/")}"></label>
      <label>页面模板<select name="template">
        ${templateOptions.map((template) => `<option value="${esc(template.file)}" ${template.file === selected.template ? "selected" : ""}>${esc(template.label || template.id)} - ${esc(template.file)}</option>`).join("")}
      </select></label>
      <label>状态<select name="status">
        ${["Published", "Draft", "Hidden"].map((status) => `<option value="${status}" ${status === selected.status ? "selected" : ""}>${cmsStatusLabel(status)}</option>`).join("")}
      </select></label>
      ${renderCmsMediaPicker("heroImage", selectedImage, "页面首屏")}
      <label>或粘贴图片地址<input name="heroImageManual" value="" placeholder="/uploads/heroes/page.webp"></label>
      <label>摘要 / SEO 描述<textarea name="summary">${esc(selected.summary || selected.description || "")}</textarea></label>
      <button type="submit">保存页面</button>
    </form>
  </div>`;
}

function renderCmsTemplateEditor(record) {
  const selected = record || (cmsAdminState().templates || cmsModel().templates)[0];
  const controlsText = Array.isArray(selected.controls) ? selected.controls.join("\n") : String(selected.controls || "");
  return `<div class="cms-edit-panel">
    <div class="cms-edit-panel-head">
      <div><span>正在编辑模板</span><h3>${esc(selected.label || selected.id || "未命名模板")}</h3></div>
      <button type="button" data-cms-close="templates">← 返回模板列表</button>
    </div>
    <form class="cms-editor-form cms-template-editor" data-cms-editor="templates">
      <input type="hidden" name="originalId" value="${esc(selected.id)}">
      <label>模板名称<input name="label" value="${esc(selected.label || "")}"></label>
      <label>模板 ID<input name="id" value="${esc(selected.id || "")}"></label>
      <label>适用范围<input name="scope" value="${esc(selected.scope || "")}"></label>
      <label>模板文件路径<input name="file" value="${esc(selected.file || "")}"></label>
      <label>可编辑字段<textarea name="controls" placeholder="每行一个可编辑字段">${esc(controlsText)}</textarea></label>
      <label>后台说明<textarea name="notes" placeholder="例如：控制产品详情页首屏、数据卡片和下载资源区域。">${esc(selected.notes || "")}</textarea></label>
      <button type="submit">保存模板</button>
    </form>
  </div>`;
}

function renderCmsProductRecords(products) {
  if (!products.length) return `<div class="cms-empty-state"><h3>暂无产品</h3><p>添加一个产品后，会在这个目录生成新的产品记录。</p></div>`;
  return `<div class="cms-record-list editable">
    ${products.map((product) => `<article class="${cmsEditing.products === product.id ? "is-selected" : ""}">
      <div class="cms-record-main">
        <img src="${esc(product.heroImage || `${ASSET}/tervona-products-home-banner-v2.png`)}" alt="">
        <div><span>${esc(product.title)}</span><p>${esc(product.path)}</p><small>${esc(product.summary || "")}</small></div>
      </div>
      <em class="cms-record-meta">${esc(product.categoryLabel || categoryForSlug(product.category).title)}</em>
      <b class="cms-record-status">${esc(cmsStatusLabel(product.status || "Published"))}</b>
      <footer class="cms-record-actions" aria-label="产品操作">
        <span><a href="${localHref(product.path)}">查看</a><a href="${localHref(`/cms/editor?type=products&id=${encodeURIComponent(product.id)}`)}">编辑</a><button type="button" class="danger" data-cms-delete="products" data-cms-id="${esc(product.id)}">删除</button></span>
      </footer>
    </article>`).join("")}
  </div>`;
}

function renderCmsNewsRecords(newsRecords) {
  if (!newsRecords.length) return `<div class="cms-empty-state"><h3>暂无新闻</h3><p>添加一篇新闻后，会在新闻目录生成新的文章记录。</p></div>`;
  return `<div class="cms-record-list editable">
    ${newsRecords.map((article) => `<article class="${cmsEditing.news === article.id ? "is-selected" : ""}">
      <div class="cms-record-main">
        <img src="${esc(article.coverImage || "/assets/tervona-downloads-hero-v2.png")}" alt="">
        <div><span>${esc(article.title)}</span><p>${esc(article.path)}</p><small>${esc(article.excerpt || "")}</small></div>
      </div>
      <em class="cms-record-meta">${esc(article.date || "草稿")}</em>
      <b class="cms-record-status">${esc(cmsStatusLabel(article.status || "Published"))}</b>
      <footer class="cms-record-actions" aria-label="新闻操作">
        <span><a href="${localHref(article.path)}">查看</a><button type="button" data-cms-edit="news" data-cms-id="${esc(article.id)}">编辑</button><button type="button" class="danger" data-cms-delete="news" data-cms-id="${esc(article.id)}">删除</button></span>
      </footer>
    </article>`).join("")}
  </div>`;
}

function renderCmsPageRecords(pages) {
  if (!pages.length) return `<div class="cms-empty-state"><h3>暂无页面</h3><p>当前没有可管理的独立页面。</p></div>`;
  return `<div class="cms-record-list editable cms-pages-list">
    ${pages.map((page) => `<article class="${cmsEditing.pages === page.id ? "is-selected" : ""}">
      <div class="cms-record-main">
        <img src="${esc(page.heroImage || "/assets/tervona-products/category-scene-tervona-v2.png")}" alt="">
        <div><span>${esc(cmsPageAdminTitle(page))}</span><p>${esc(page.path)}</p><small>${esc(page.summary || "")}</small></div>
      </div>
      <em class="cms-record-meta">${esc(page.template)}</em>
      <b class="cms-record-status">${esc(cmsStatusLabel(page.status || "Published"))}</b>
      <footer class="cms-record-actions" aria-label="页面操作">
        <span><a href="${localHref(page.path)}">查看</a><button type="button" class="visual" data-cms-visual-edit="${esc(page.id)}">可视化编辑</button><button type="button" data-cms-edit="pages" data-cms-id="${esc(page.id)}">表单编辑</button></span>
      </footer>
    </article>`).join("")}
  </div>`;
}

function renderCmsMediaLibrary(state = cmsAdminState()) {
  const folders = [
    ["products", "产品图片"],
    ["news", "新闻封面"],
    ["heroes", "页面首屏媒体"],
    ["brand", "品牌 / CTA"],
    ["downloads", "下载文件"],
  ];
  return `<div class="cms-media-layout ${cmsUploadOpen ? "with-upload" : ""}">
    ${cmsUploadOpen ? `<form class="cms-upload-panel" data-cms-upload>
      <div class="cms-upload-head"><h3>上传素材</h3><button type="button" data-cms-close-upload>收起</button></div>
      <label>素材标题<input name="title" placeholder="F Series 主图"></label>
      <label>存放目录<select name="folder">${folders.map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select></label>
      <label>使用位置<select name="usage">
        ${["产品详情首屏和产品卡片", "新闻卡片和新闻详情首屏", "首页首屏", "关于我们首屏", "底部 CTA 模板", "品牌素材", "未分配"].map((usage) => `<option value="${esc(usage)}">${esc(usage)}</option>`).join("")}
      </select></label>
      <label>选择文件<input name="file" type="file" accept="image/*,.pdf"></label>
      <label>或登记已有地址<input name="url" placeholder="/uploads/products/file.webp"></label>
      <button type="submit">添加到媒体库</button>
      <p>上传文件会保存到 /uploads/[目录]/，之后可以在产品、新闻和页面编辑器中复用。</p>
    </form>` : ""}
    <div class="cms-media-grid">
      ${state.media.map((asset) => `<article class="${cmsEditingMediaId === asset.id ? "is-selected" : ""}" data-cms-edit-media="${esc(asset.id)}" tabindex="0" role="button" aria-label="编辑 ${esc(asset.title)}">
        <div class="cms-media-thumb">${asset.type === "document" ? "<span>PDF</span>" : `<img src="${esc(asset.url)}" alt="">`}</div>
        <div><h3>${esc(asset.title)}</h3><p>${esc(asset.url)}</p><em>${esc(cmsUsageLabel(asset.usage))}</em>
          <dl><dt>大小</dt><dd>${esc(cmsFormatBytes(asset.size))}</dd><dt>类型</dt><dd>${esc(cmsMediaMimeLabel(asset))}</dd><dt>目录</dt><dd>${esc(asset.folder || "products")}</dd></dl>
        </div>
        <button type="button" data-cms-copy-media="${esc(asset.url)}">复制地址</button>
      </article>`).join("")}
    </div>
    ${renderCmsMediaEditor(state)}
  </div>`;
}

function renderCmsPageBlock(block, state = cmsAdminState(), editor = true) {
  const content = {
    heading: `<h2>${esc(block.title || "标题")}</h2>`,
    text: `<p>${esc(block.text || "正文内容")}</p>`,
    image: `<figure><img src="${esc(block.image || "/assets/tervona-products/category-scene-tervona-v2.png")}" alt="${esc(block.title || "")}">${block.title ? `<figcaption>${esc(block.title)}</figcaption>` : ""}</figure>`,
    button: `<a class="lpb-button" href="${hrefFor(block.href || "#")}">${esc(block.buttonText || "按钮")}</a>`,
    spacer: `<div class="lpb-spacer"><span>间距 ${Number(block.padding || 72)}px</span></div>`,
    columns: `<div class="lpb-columns"><div><h3>${esc(block.title || "双栏标题")}</h3><p>${esc(block.text || "左侧内容")}</p></div><div><p>${esc(block.secondaryText || "右侧内容")}</p></div></div>`,
    products: `<div class="lpb-dynamic"><h2>${esc(block.title || "产品推荐")}</h2><div>${state.products.slice(0, Number(block.count || 3)).map((item) => `<article><img src="${esc(item.heroImage || `${ASSET}/tervona-products-home-banner-v2.png`)}" alt=""><b>${esc(item.title)}</b></article>`).join("")}</div></div>`,
    news: `<div class="lpb-dynamic"><h2>${esc(block.title || "最新动态")}</h2><div>${state.news.slice(0, Number(block.count || 3)).map((item) => `<article><img src="${esc(item.coverImage || "/assets/tervona-downloads-hero-v2.png")}" alt=""><b>${esc(item.title)}</b></article>`).join("")}</div></div>`,
    cta: `<div class="lpb-cta"><h2>${esc(block.title || "准备好开始了吗？")}</h2><p>${esc(block.text || "")}</p><a href="${hrefFor(block.href || "/contact-us")}">${esc(block.buttonText || "联系我们")}</a></div>`,
  }[block.type] || "";
  return `<section class="lpb-block lpb-${esc(block.type)} ${editor && cmsPageBuilderSelectedId === block.id ? "selected" : ""}" style="--block-bg:${esc(block.background || "#ffffff")};--block-color:${esc(block.color || "#17131f")};--block-padding:${Number(block.padding || 0)}px" ${editor ? `draggable="true" data-page-block="${esc(block.id)}"` : ""}>
    ${editor ? `<div class="lpb-block-tools"><button type="button" data-page-block-move="${esc(block.id)}:-1" aria-label="上移">↑</button><button type="button" data-page-block-duplicate="${esc(block.id)}" aria-label="复制">⧉</button><button type="button" data-page-block-delete="${esc(block.id)}" aria-label="删除">×</button><span>拖拽排序</span></div>` : ""}
    ${content}
  </section>`;
}

function renderCmsPageBuilder(state = cmsAdminState()) {
  const page = state.pages.find((item) => item.id === cmsPageBuilderPageId) || state.pages[0];
  if (!page) return "";
  const blocks = Array.isArray(page.blocks) && page.blocks.length ? page.blocks : cmsDefaultPageBlocks();
  if (!page.blocks?.length) page.blocks = blocks;
  const selected = blocks.find((item) => item.id === cmsPageBuilderSelectedId) || blocks[0];
  cmsPageBuilderSelectedId = selected?.id || "";
  const field = (label, name, value, type = "input") => `<label><span>${label}</span>${type === "textarea" ? `<textarea name="${name}">${esc(value || "")}</textarea>` : `<input name="${name}" value="${esc(value ?? "")}">`}</label>`;
  const inspector = selected ? `<form class="lpb-inspector-form" data-page-block-form>
    <input type="hidden" name="id" value="${esc(selected.id)}">
    <div class="lpb-inspector-title"><span>Widget 设置</span><b>${esc(CMS_PAGE_WIDGETS.find(([type]) => type === selected.type)?.[1] || selected.type)}</b></div>
    ${["heading","image","columns","products","news","cta"].includes(selected.type) ? field("标题", "title", selected.title) : ""}
    ${["text","columns","cta"].includes(selected.type) ? field("正文", "text", selected.text, "textarea") : ""}
    ${selected.type === "columns" ? field("右栏内容", "secondaryText", selected.secondaryText, "textarea") : ""}
    ${selected.type === "image" ? field("图片地址", "image", selected.image) : ""}
    ${["button","cta"].includes(selected.type) ? `${field("按钮文字", "buttonText", selected.buttonText)}${field("链接", "href", selected.href)}` : ""}
    ${["products","news"].includes(selected.type) ? field("显示数量", "count", selected.count) : ""}
    ${field("上/下间距", "padding", selected.padding)}
    ${selected.type !== "image" ? `${field("背景颜色", "background", selected.background)}${field("文字颜色", "color", selected.color)}` : ""}
    <button type="submit">应用设置</button>
  </form>` : `<div class="lpb-empty">添加一个 Widget 开始编辑。</div>`;
  return `<div class="cms-page-builder" data-page-builder>
    <header class="lpb-toolbar">
      <div><button type="button" data-page-builder-exit>‹</button><b>${esc(page.title || "未命名页面")}</b><span>轻量页面构建器</span></div>
      <nav>${[["desktop","桌面"],["tablet","平板"],["mobile","手机"]].map(([id,label])=>`<button type="button" class="${cmsPageBuilderDevice===id?"active":""}" data-page-builder-device="${id}">${label}</button>`).join("")}</nav>
      <div><a href="${localHref(page.path)}" target="_blank">预览</a><button type="button" class="primary" data-page-builder-save>保存页面</button></div>
    </header>
    <div class="lpb-body">
      <aside class="lpb-widgets"><h3>Widgets</h3><p>点击添加到页面底部</p>${CMS_PAGE_WIDGETS.map(([type,label,iconText])=>`<button type="button" data-page-add-widget="${type}"><i>${iconText}</i><span>${label}</span></button>`).join("")}</aside>
      <main class="lpb-stage"><div class="lpb-canvas ${cmsPageBuilderDevice}" data-page-builder-canvas>
        <div class="lpb-page-header"><span>TERVONA</span><nav>Products　Company　Downloads</nav></div>
        ${blocks.map((block)=>renderCmsPageBlock(block,state,true)).join("")}
        <button type="button" class="lpb-add-empty" data-page-add-widget="text">＋ 添加 Widget</button>
      </div></main>
      <aside class="lpb-inspector">${inspector}<div class="lpb-layers"><h3>页面结构</h3>${blocks.map((block,index)=>`<button type="button" class="${block.id===selected?.id?"active":""}" data-page-select-block="${esc(block.id)}"><span>${index+1}. ${esc(CMS_PAGE_WIDGETS.find(([type])=>type===block.type)?.[1]||block.type)}</span><em>⋮</em></button>`).join("")}</div></aside>
    </div>
  </div>`;
}

function renderCmsMediaEditor(state = cmsAdminState()) {
  const media = state.media || [];
  const index = media.findIndex((asset) => asset.id === cmsEditingMediaId);
  if (index < 0) return "";
  const asset = media[index];
  const fileName = String(asset.url || "").split("/").pop()?.split("?")[0] || asset.title || "media-file";
  const uploadedAt = asset.createdAt || asset.updatedAt || "";
  return `<div class="cms-media-editor-backdrop" data-cms-close-media-editor>
    <section class="cms-media-editor-dialog" role="dialog" aria-modal="true" aria-label="媒体附件详情" data-cms-media-editor-dialog>
      <header>
        <h2>媒体附件详情</h2>
        <nav>
          <button type="button" data-cms-media-prev ${index === 0 ? "disabled" : ""} aria-label="上一个素材">‹</button>
          <button type="button" data-cms-media-next ${index === media.length - 1 ? "disabled" : ""} aria-label="下一个素材">›</button>
          <button type="button" data-cms-close-media-editor aria-label="关闭">×</button>
        </nav>
      </header>
      <div class="cms-media-editor-body">
        <div class="cms-media-editor-preview">
          ${asset.type === "document" ? `<div class="cms-media-file-preview"><span>PDF</span><b>${esc(fileName)}</b></div>` : asset.type === "video" ? `<video src="${esc(asset.url)}" controls></video>` : `<img src="${esc(asset.url)}" alt="${esc(asset.altText || "")}">`}
          <div class="cms-media-preview-actions">
            <a href="${esc(asset.url)}" target="_blank" rel="noopener">查看原文件</a>
            <button type="button" data-cms-copy-media="${esc(asset.url)}">复制文件地址</button>
          </div>
        </div>
        <form class="cms-media-detail-form" data-cms-media-detail>
          <input type="hidden" name="id" value="${esc(asset.id)}">
          <div class="cms-media-file-meta">
            ${uploadedAt ? `<p><span>上传时间</span><b>${esc(new Date(uploadedAt).toLocaleString("zh-CN"))}</b></p>` : ""}
            <p><span>文件名</span><b>${esc(fileName)}</b></p>
            <p><span>文件类型</span><b>${esc(cmsMediaMimeLabel(asset))}</b></p>
            <p><span>文件大小</span><b>${esc(cmsFormatBytes(asset.size))}</b></p>
            ${asset.size ? `<p><span>尺寸 / 信息</span><b>${esc(String(asset.size))}</b></p>` : ""}
          </div>
          <label>替代文本<textarea name="altText" rows="2" placeholder="描述图片的内容和用途">${esc(asset.altText || "")}</textarea><small>用于无障碍访问和图片无法显示时的替代说明。</small></label>
          <label>标题<input name="title" value="${esc(asset.title || "")}"></label>
          <label>说明文字<textarea name="caption" rows="2">${esc(asset.caption || "")}</textarea></label>
          <label>描述<textarea name="description" rows="3">${esc(asset.description || asset.usage || "")}</textarea></label>
          <label>文件地址<div class="cms-media-url-field"><input value="${esc(asset.url)}" readonly><button type="button" data-cms-copy-media="${esc(asset.url)}">复制</button></div></label>
          <label>目录<select name="folder">${foldersForMediaEditor(asset.folder).map(([value, label]) => `<option value="${value}" ${asset.folder === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
          <label>使用位置<input name="usage" value="${esc(asset.usage || "")}"></label>
          <footer><span data-cms-media-save-status></span><button type="submit">保存媒体信息</button></footer>
        </form>
      </div>
    </section>
  </div>`;
}

function foldersForMediaEditor(selected = "") {
  const folders = [["products", "产品图片"], ["news", "新闻封面"], ["heroes", "页面首屏媒体"], ["brand", "品牌 / CTA"], ["downloads", "下载文件"]];
  if (selected && !folders.some(([value]) => value === selected)) folders.push([selected, selected]);
  return folders;
}

function cmsSaveMediaDetails(form) {
  const state = cmsAdminState();
  const values = Object.fromEntries(new FormData(form).entries());
  const index = state.media.findIndex((asset) => asset.id === values.id);
  if (index < 0) return;
  state.media[index] = cmsStampRecord({
    ...state.media[index],
    title: values.title || state.media[index].title,
    altText: values.altText || "",
    caption: values.caption || "",
    description: values.description || "",
    folder: values.folder || state.media[index].folder,
    usage: values.usage || "未分配",
  }, state.media[index]);
  cmsSaveState(state);
  cmsEditingMediaId = state.media[index].id;
  render({ preserveScroll: true });
  requestAnimationFrame(() => {
    const status = document.querySelector("[data-cms-media-save-status]");
    if (status) status.textContent = "已保存";
  });
}

function renderCmsMenuManager(state = cmsAdminState()) {
  const menus = cmsMenus(state);
  return `<form class="cms-editor-form cms-menu-editor" data-cms-editor="menus">
    <div class="cms-menu-manager-toolbar">
      <div><b>Header 主导航</b><span>新增、删除或调整一级导航及其子菜单。</span></div>
      <button type="button" data-cms-add-menu>＋ 新增一级导航</button>
    </div>
    ${menus.length ? menus.map((item, index) => `<section class="cms-editor-box">
      <div class="cms-menu-box-head"><h2>${esc(item.label || `菜单 ${index + 1}`)}</h2><button type="button" class="danger" data-cms-delete-menu="${index}">删除导航</button></div>
      <div class="cms-inline-fields">
        <label>菜单名称<input name="menu${index}Label" value="${esc(item.label || "")}"></label>
        <label>链接<input name="menu${index}Href" value="${esc(item.href || "/")}"></label>
      </div>
      <label>说明<input name="menu${index}Intro" value="${esc(item.intro || "")}" placeholder="Mega 菜单说明文字"></label>
      <div class="cms-submenu-editor">
        <div class="cms-submenu-head"><b>子菜单</b><button type="button" data-cms-add-submenu="${index}">＋ 新增子菜单</button></div>
        ${(item.children || []).length ? (item.children || []).map((child, childIndex) => `<div class="cms-submenu-row">
          <input name="menu${index}Child${childIndex}Label" value="${esc(child.label || "")}" placeholder="名称">
          <input name="menu${index}Child${childIndex}Href" value="${esc(child.href || "")}" placeholder="/页面链接">
          <input name="menu${index}Child${childIndex}Icon" value="${esc(child.icon || "")}" placeholder="图标地址（可选）">
          <button type="button" class="danger" data-cms-delete-submenu="${index}:${childIndex}" aria-label="删除子菜单">删除</button>
        </div>`).join("") : `<p class="cms-submenu-empty">暂无子菜单，点击“新增子菜单”创建。</p>`}
      </div>
    </section>`).join("") : `<div class="cms-empty-state"><h3>暂无导航</h3><p>点击“新增一级导航”创建网站的第一个菜单。</p></div>`}
    <button type="submit">保存菜单</button>
  </form>`;
}

function renderCmsStyleManager(state = cmsAdminState()) {
  const settings = cmsSiteSettings(state);
  return `<form class="cms-editor-form cms-style-editor" data-cms-editor="settings">
    <section class="cms-editor-box">
      <h2>品牌 Logo</h2>
      <label>浅色 Logo 地址<input name="logoLight" value="${esc(settings.logoLight)}"></label>
      <label>深色 Logo 地址<input name="logoDark" value="${esc(settings.logoDark)}"></label>
    </section>
    <section class="cms-editor-box">
      <h2>颜色和按钮</h2>
      <div class="cms-inline-fields">
        <label>主色<input name="primaryColor" type="color" value="${esc(settings.primaryColor)}"></label>
        <label>按钮色<input name="buttonColor" type="color" value="${esc(settings.buttonColor)}"></label>
        <label>按钮文字<input name="buttonTextColor" type="color" value="${esc(settings.buttonTextColor)}"></label>
      </div>
      <label>按钮圆角<input name="buttonRadius" value="${esc(settings.buttonRadius)}" placeholder="999px"></label>
    </section>
    <section class="cms-editor-box">
      <h2>字体 / 字号 / 字重</h2>
      <p class="cms-help-text">这些设置会应用到前台正文、导航、按钮、Hero 大标题、板块标题和卡片标题。可以填写 px、rem 或 clamp()。</p>
      <div class="cms-inline-fields">
        <label>正文字体<input name="fontFamily" value="${esc(settings.fontFamily)}" placeholder="Poppins"></label>
        <label>标题字体<input name="headingFontFamily" value="${esc(settings.headingFontFamily)}" placeholder="Poppins"></label>
      </div>
      <div class="cms-inline-fields">
        <label>基础字号<input name="baseFontSize" value="${esc(settings.baseFontSize)}" placeholder="16px"></label>
        <label>正文字重<input name="bodyFontWeight" value="${esc(settings.bodyFontWeight)}" placeholder="400"></label>
        <label>正文行高<input name="bodyLineHeight" value="${esc(settings.bodyLineHeight)}" placeholder="1.55"></label>
      </div>
      <div class="cms-inline-fields">
        <label>导航字号<input name="navFontSize" value="${esc(settings.navFontSize)}" placeholder="20px"></label>
        <label>导航字重<input name="navFontWeight" value="${esc(settings.navFontWeight)}" placeholder="400"></label>
      </div>
      <div class="cms-inline-fields">
        <label>按钮字号<input name="buttonFontSize" value="${esc(settings.buttonFontSize)}" placeholder="16px"></label>
        <label>按钮字重<input name="buttonFontWeight" value="${esc(settings.buttonFontWeight)}" placeholder="700"></label>
      </div>
      <div class="cms-inline-fields">
        <label>Hero 标题字号<input name="heroTitleSize" value="${esc(settings.heroTitleSize)}" placeholder="clamp(48px, 5.8vw, 96px)"></label>
        <label>板块标题字号<input name="sectionTitleSize" value="${esc(settings.sectionTitleSize)}" placeholder="clamp(36px, 5vw, 64px)"></label>
        <label>标题字重<input name="headingFontWeight" value="${esc(settings.headingFontWeight)}" placeholder="600"></label>
      </div>
      <div class="cms-inline-fields">
        <label>卡片标题字号<input name="cardTitleSize" value="${esc(settings.cardTitleSize)}" placeholder="20px"></label>
        <label>卡片标题字重<input name="cardTitleWeight" value="${esc(settings.cardTitleWeight)}" placeholder="600"></label>
      </div>
    </section>
    <section class="cms-editor-box">
      <h2>Google 自动翻译</h2>
      <p class="cms-help-text">前台右上角语言菜单会调用 Google Translate，把当前页面自动翻译成访客选择的语言。语言列表格式为：语言代码 | 显示名称。</p>
      <div class="cms-inline-fields">
        <label>启用翻译<select name="translateEnabled">
          ${["yes", "no"].map((value) => `<option value="${value}" ${settings.translateEnabled === value ? "selected" : ""}>${value === "yes" ? "启用" : "关闭"}</option>`).join("")}
        </select></label>
        <label>网站源语言<input name="translateDefaultLanguage" value="${esc(settings.translateDefaultLanguage)}" placeholder="en"></label>
        <label>右上角默认文案<input name="regionLabel" value="${esc(settings.regionLabel)}" placeholder="Australia - English"></label>
      </div>
      <label>允许翻译的语言<textarea name="translateLanguages" rows="8" placeholder="zh-CN | 简体中文">${esc(settings.translateLanguages)}</textarea></label>
    </section>
    <section class="cms-editor-box">
      <h2>Header / Footer CTA</h2>
      <div class="cms-inline-fields">
        <label>Header 按钮文字<input name="headerContactText" value="${esc(settings.headerContactText)}"></label>
        <label>Header 按钮链接<input name="headerContactHref" value="${esc(settings.headerContactHref)}"></label>
      </div>
      <label>底部 CTA 标题<input name="footerCtaTitle" value="${esc(settings.footerCtaTitle)}"></label>
      <div class="cms-inline-fields">
        <label>CTA 按钮文字<input name="footerCtaButtonText" value="${esc(settings.footerCtaButtonText)}"></label>
        <label>CTA 按钮链接<input name="footerCtaButtonHref" value="${esc(settings.footerCtaButtonHref)}"></label>
      </div>
      ${renderCmsMediaPicker("footerCtaImage", settings.footerCtaImage, "底部 CTA 模板")}
      <label>底部 CTA 手机图<input name="footerCtaMobileImage" value="${esc(settings.footerCtaMobileImage)}"></label>
      <label>底部 CTA 视频<input name="footerCtaVideo" value="${esc(settings.footerCtaVideo)}"></label>
    </section>
    <button type="submit">保存全局样式</button>
  </form>`;
}

function renderCmsDownloadManager(state = cmsAdminState()) {
  const downloads = Array.isArray(state.downloads) ? state.downloads : cmsDefaultDownloads();
  const categories = downloadCategories(state);
  const selected = downloads.find((item) => item.id === cmsEditing.downloads) || null;
  const showEditor = cmsEditing.downloads === "new" || Boolean(selected);
  return `<div class="cms-download-manager">
    ${showEditor ? `<div class="cms-edit-panel">
      <div class="cms-edit-panel-head"><div><span>${selected ? "正在编辑" : "新建记录"}</span><h3>${esc(selected?.title || "新增下载文件")}</h3></div><button type="button" data-cms-close="downloads">← 返回文件列表</button></div>
      <form class="cms-editor-form" data-cms-editor="downloads">
      <input type="hidden" name="originalId" value="${esc(selected?.id || "")}">
      <section class="cms-editor-box">
        <h2>${selected ? "编辑下载文件" : "新增下载文件"}</h2>
        <div class="cms-inline-fields">
          <label>文件标题<input name="title" value="${esc(selected?.title || "")}" placeholder="F Series Datasheet"></label>
          <label>文件类型<select name="type">${categories.map(([slug, label]) => `<option value="${esc(slug)}" ${selected?.type === slug ? "selected" : ""}>${esc(label)}</option>`).join("")}</select></label>
        </div>
        <div class="cms-inline-fields">
          <label>关联产品<select name="product">${state.products.map((product) => `<option value="${esc(product.path)}" ${selected?.product === product.path || selected?.product === product.id ? "selected" : ""}>${esc(product.title)}</option>`).join("")}</select></label>
          <label>版本<input name="version" value="${esc(selected?.version || "")}" placeholder="V1.0"></label>
        </div>
        ${renderCmsMediaPicker("fileUrl", selected?.fileUrl || "", "下载文件")}
        <label>或粘贴文件地址<input name="fileUrlManual" value="${esc(selected?.fileUrl || "")}" placeholder="/uploads/downloads/file.pdf"></label>
        <label>状态<select name="status">${["Published", "Draft", "Hidden"].map((status) => `<option value="${status}" ${selected?.status === status ? "selected" : ""}>${cmsStatusLabel(status)}</option>`).join("")}</select></label>
        <button type="submit">保存下载文件</button>
      </section>
      </form>
    </div>` : ""}
    <div class="cms-record-list editable">
      ${downloads.map((item) => `<article>
        <div class="cms-record-main"><div class="cms-file-icon">PDF</div><div><span>${esc(item.title)}</span><p>${esc(item.fileUrl)}</p><small>${esc(item.productLabel || item.product || "")} · ${esc(categories.find(([slug]) => slug === item.type)?.[1] || item.type)}</small></div></div>
        <em class="cms-record-meta">${esc(item.version || "V1.0")}</em>
        <b class="cms-record-status">${esc(cmsStatusLabel(item.status || "Published"))}</b>
        <footer class="cms-record-actions"><span><a href="${esc(item.fileUrl || "#")}" target="_blank" rel="noopener">预览</a><a href="${esc(item.fileUrl || "#")}" download>下载</a><button type="button" data-cms-edit="downloads" data-cms-id="${esc(item.id)}">编辑</button><button type="button" class="danger" data-cms-delete="downloads" data-cms-id="${esc(item.id)}">删除</button></span></footer>
      </article>`).join("")}
    </div>
    ${cmsDownloadCategoriesOpen ? `<section class="cms-download-category-manager">
      <header><div><span>下载分类</span><h3>管理文件类型</h3></div><button type="button" data-cms-close-download-categories>关闭</button></header>
      <form data-cms-add-download-category>
        <label>分类名称<input name="label" placeholder="例如：技术白皮书" required></label>
        <label>分类标识<input name="slug" placeholder="例如：white-papers"></label>
        <button type="submit">新增分类</button>
      </form>
      <div class="cms-download-category-list">
        ${categories.map(([slug, label]) => {
          const count = downloads.filter((item) => item.type === slug).length;
          return `<article><div><b>${esc(label)}</b><code>${esc(slug)}</code></div><span>${count} 个文件</span><button type="button" class="danger" data-cms-delete-download-category="${esc(slug)}" ${count ? "disabled" : ""}>删除</button></article>`;
        }).join("")}
      </div>
      <p>正在使用的分类需要先移动或删除关联文件，之后才能删除分类。</p>
    </section>` : ""}
  </div>`;
}

function cmsNavIcon(name) {
  const icons = {
    overview: `<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>`,
    page: `<path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5v4h4M9.5 12h6M9.5 15.5h6"/>`,
    cube: `<path d="m12 3.5 8 4.5-8 4.5L4 8zM4 8v8l8 4.5 8-4.5V8M12 12.5v8"/>`,
    news: `<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M7 9h4v4H7zM14 9h3M14 12h3M7 16h10"/>`,
    folder: `<path d="M3.5 7.5h6l2-2h9v13h-17z"/>`,
    media: `<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m5.5 17 4-4 3 3 2.5-2.5 3.5 3.5"/>`,
    menu: `<path d="M5 6.5h14M5 12h14M5 17.5h14"/>`,
    seo: `<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/>`,
    download: `<path d="M12 3.5v11M8 10.5l4 4 4-4M4.5 19.5h15"/>`,
    inbox: `<path d="M4 6.5h16v11H4zM4 7l8 6 8-6"/>`,
    settings: `<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.5 1.5M16.5 16.5 18 18M18 6l-1.5 1.5M7.5 16.5 6 18"/>`,
    users: `<circle cx="9" cy="9" r="3"/><circle cx="16.5" cy="10" r="2.5"/><path d="M3.5 19c.6-3.2 2.4-5 5.5-5s4.9 1.8 5.5 5M14 15c3.4-.5 5.4.8 6.5 4"/>`,
  };
  return `<svg class="cms-nav-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.page}</svg>`;
}

function renderCmsAdmin(params = new URLSearchParams()) {
  cmsCheckSession();
  if (cmsAuthStatus === "checking") return renderCmsAuthLoading();
  if (!cmsAuthUser) return renderCmsLogin();
  cmsLoadBackendState();
  const requestedSection = params.get("section");
  if (requestedSection) {
    const allowedSection = CMS_SECTION_IDS.has(requestedSection) && cmsCanAccess(requestedSection) ? requestedSection : "dashboard";
    cmsSetActiveSection(allowedSection, false);
    if (allowedSection !== requestedSection) history.replaceState(null, "", cmsSectionPath(allowedSection));
  }
  if (!cmsCanAccess(cmsActiveSection)) cmsSetActiveSection("dashboard", false);
  if (cmsActiveSection === "users" && cmsUsersStatus === "idle") cmsLoadManagedUsers();
  if (cmsActiveSection === "submissions" && cmsSubmissionsStatus === "idle") cmsLoadSubmissions();
  if (cmsActiveSection === "submissions" && cmsIsSuperAdmin() && cmsMailSettingsStatus === "idle") cmsLoadMailSettings();
  const pages = cmsPages();
  const model = cmsModel();
  const state = cmsAdminState();
  if (cmsPageBuilderOpen) return renderCmsPageBuilder(state);
  if (cmsVisualEditorOpen) return renderCmsHomeVisualEditor(state);
  const productCount = cmsCollectionCount("products", state);
  const newsCount = cmsCollectionCount("news", state);
  const recentContent = cmsRecentContent(state);
  const categories = cmsCategoryRecords(state);
  const averageSeo = Math.round(recentContent.reduce((total, item) => total + cmsSeoScore(item), 0) / Math.max(1, recentContent.length));
  const productRows = cmsProductRows(state);
  const selectedProduct = state.products.find((product) => product.id === cmsEditing.products) || state.products[0] || cmsNewProductRecord();
  const selectedNews = state.news.find((article) => article.id === cmsEditing.news) || state.news[0] || cmsNewNewsRecord();
  const selectedPage = state.pages.find((page) => page.id === cmsEditing.pages) || state.pages[0];
  const templates = state.templates || model.templates;
  const selectedTemplate = templates.find((template) => template.id === cmsEditing.templates) || templates[0];
  const navItems = [
    ["dashboard", "overview", "总览"],
    ["pages", "page", "页面"],
    ["products", "cube", "产品"],
    ["news", "news", "新闻"],
    ["categories", "folder", "分类"],
    ["media", "media", "媒体"],
    ["menus", "menu", "导航"],
    ["seo", "seo", "SEO"],
    ["downloads", "download", "下载"],
    ["submissions", "inbox", "询盘"],
    ["settings", "settings", "设置"],
    ["users", "users", "人员与权限"],
  ].filter(([id]) => cmsCanAccess(id));
  return `<main class="inside-main cms-admin cms-admin-shell">
    <header class="cms-command-bar">
      <div class="cms-command-brand"><img class="cms-brand-logo" src="/assets/tervona-logo-transparent.png" alt="Tervona"></div>
      <div class="cms-command-actions">
        <span class="cms-connection ${cmsConnectionClass()}">${esc(cmsBackendStatusLabel(cmsBackendStatus))}</span>
        <a href="${localHref("/")}" target="_blank">预览网站</a>
        <button type="button" data-cms-publish-all>发布更改</button>
        <button type="button" class="cms-logout-button" data-cms-logout>退出</button>
      </div>
    </header>
    <section class="cms-layout">
      <aside class="cms-sidebar">
        <div class="cms-sidebar-label">内容</div>
        ${navItems.map(([id, iconName, label], i) => `<button type="button" data-cms-nav="${id}" data-icon="${iconName}" class="${(cmsActiveSection === id || (!cmsActiveSection && i === 0)) ? "active" : ""}">${cmsNavIcon(iconName)}<span>${label}</span>${id === "products" ? `<em>${productCount}</em>` : id === "news" ? `<em>${newsCount}</em>` : id === "submissions" && cmsSubmissions.length ? `<em>${cmsSubmissions.filter((item) => item.status === "new").length || cmsSubmissions.length}</em>` : ""}</button>`).join("")}
        <div class="cms-sidebar-account"><span>${esc((cmsAuthUser.displayName || cmsAuthUser.username).slice(0, 2).toUpperCase())}</span><div><b>${esc(cmsAuthUser.displayName || cmsAuthUser.username)}</b><small>当前登录 · ${cmsIsSuperAdmin() ? "超级管理员" : "内容人员"}</small></div></div>
      </aside>
      <div class="cms-workspace">
        <section class="cms-section ${cmsActiveSection === "dashboard" ? "active" : ""}" data-cms-section="dashboard">
          <div class="cms-dashboard-welcome">
            <h1>欢迎回来，${esc(cmsAuthUser.displayName || cmsAuthUser.username)}</h1>
            <p>请从左侧菜单选择需要管理的内容。</p>
          </div>
        </section>

        <section class="cms-section ${cmsActiveSection === "pages" ? "active" : ""}" data-cms-section="pages">
          <div class="cms-page-title">
            <span>页面管理</span>
            <h1>页面</h1>
            <p>首页、关于我们、创新研发、联系我们和项目案例等独立页面，会和产品、下载分开管理。</p>
          </div>
          <div class="cms-section-head">
            <div><span>站点页面</span><h2>页面拥有独立模板和媒体字段</h2></div>
            <div class="cms-actions"><button type="button" data-cms-add="pages">新增页面</button><a href="${localHref("/")}">查看网站</a></div>
          </div>
          ${cmsEditing.pages && selectedPage ? renderCmsPageEditor(selectedPage) : ""}
          ${renderCmsPageRecords(state.pages)}
        </section>

        <section class="cms-section ${cmsActiveSection === "menus" ? "active" : ""}" data-cms-section="menus">
          <div class="cms-page-title">
            <span>菜单管理</span>
            <h1>网站菜单</h1>
            <p>主导航、手机端抽屉菜单和 Mega 菜单子项共用同一套配置。</p>
          </div>
          <div class="cms-section-head">
            <div><span>Header 菜单</span><h2>修改菜单名称、链接和子菜单</h2></div>
            <div class="cms-actions"><a href="${localHref("/")}">查看前台菜单</a></div>
          </div>
          ${renderCmsMenuManager(state)}
        </section>

        <section class="cms-section ${cmsActiveSection === "products" ? "active" : ""}" data-cms-section="products">
          <div class="cms-page-title">
            <span>产品目录</span>
            <h1>产品</h1>
          </div>
          <div class="cms-section-head">
            <div><span>产品目录</span><h2>可以按分类新增、编辑、删除产品</h2></div>
            <div class="cms-actions"><button type="button" data-cms-add="products">新增产品</button><a href="${localHref("/products")}">查看产品中心</a></div>
          </div>
          ${cmsEditing.products ? renderCmsProductEditor(selectedProduct) : ""}
          <div class="cms-record-summary">
            ${productRows.map((cat) => `<span>${esc(cat.title)} <b>${cat.count}</b></span>`).join("")}
          </div>
          ${renderCmsProductRecords(state.products)}
        </section>

        <section class="cms-section ${cmsActiveSection === "categories" ? "active" : ""}" data-cms-section="categories">
          <div class="cms-page-title"><span>内容结构</span><h1>产品分类</h1><p>分类决定产品集合页、导航入口和产品详情页的 URL 结构。</p></div>
          <div class="cms-section-head"><div><span>分类目录</span><h2>一次定义，自动应用到所有产品模板</h2></div><div class="cms-actions"><button type="button" data-cms-nav-jump="products">新增产品</button><a href="${localHref("/products")}">查看产品中心</a></div></div>
          <div class="cms-category-list">
            ${categories.map((category) => `<article><div class="cms-category-order">${String(category.order).padStart(2, "0")}</div><div><b>${esc(category.title)}</b><small>/products/${esc(category.slug)}</small></div><p>${esc(category.intro || "统一管理该分类下的产品记录与集合页展示。")}</p><strong>${category.count} 个产品</strong><span class="cms-status-dot published">已发布</span><button type="button" data-cms-nav-jump="products">管理产品</button></article>`).join("")}
          </div>
        </section>

        <section class="cms-section ${cmsActiveSection === "news" ? "active" : ""}" data-cms-section="news">
          <div class="cms-page-title">
            <span>新闻管理</span>
            <h1>新闻</h1>
          </div>
          <div class="cms-section-head">
            <div><span>新闻管理</span><h2>新闻可以独立编辑、隐藏或删除</h2></div>
            <div class="cms-actions"><button type="button" data-cms-add="news">新增新闻</button><a href="${localHref("/news")}">查看新闻页</a></div>
          </div>
          ${cmsEditing.news ? renderCmsNewsEditor(selectedNews) : ""}
          ${renderCmsNewsRecords(state.news)}
        </section>

        <section class="cms-section ${cmsActiveSection === "downloads" ? "active" : ""}" data-cms-section="downloads">
          <div class="cms-page-title">
            <span>下载中心</span>
            <h1>下载文件</h1>
            <p>先在媒体库上传 PDF、说明书或证书，再在这里关联产品和下载分类。</p>
          </div>
          <div class="cms-section-head">
            <div><span>文件管理</span><h2>管理 Datasheets、Manual、Certificates 等下载资源</h2></div>
            <div class="cms-actions"><button type="button" data-cms-add="downloads">新增文件</button><button type="button" data-cms-manage-download-categories>管理分类</button><button type="button" data-cms-focus-upload>上传文件到媒体库</button><a href="${localHref("/download/datasheets")}">查看下载页</a></div>
          </div>
          ${renderCmsDownloadManager(state)}
        </section>

        <section class="cms-section ${cmsActiveSection === "submissions" ? "active" : ""}" data-cms-section="submissions">
          <div class="cms-page-title"><span>客户询盘</span><h1>询盘</h1><p>集中查看客户提交的时间、姓名、邮箱与询盘内容，点击任意记录可查看完整详情。</p></div>
          ${renderCmsSubmissionManager()}
        </section>

        <section class="cms-section ${cmsActiveSection === "seo" ? "active" : ""}" data-cms-section="seo">
          <div class="cms-page-title"><span>搜索优化</span><h1>SEO</h1><p>统一检查公开内容的标题、描述、路径和首图，不需要逐页翻找。</p></div>
          <div class="cms-section-head"><div><span>内容检查</span><h2>页面完整度与索引状态</h2></div><div class="cms-actions"><a href="${localHref("/")}">查看网站</a></div></div>
          <div class="cms-seo-overview"><div><strong>${averageSeo}%</strong><span>平均完整度</span><i><b style="width:${averageSeo}%"></b></i></div><p>标题、摘要、URL 与首图四项齐全即视为完整。产品详情编辑器还支持 SEO 标题、关键词、Canonical 和索引设置。</p></div>
          <div class="cms-content-table cms-seo-table">
            <div class="cms-content-row cms-table-head"><span>内容</span><span>类型</span><span>状态</span><span>完整度</span></div>
            ${recentContent.map((item) => `<article class="cms-content-row"><div><b>${esc(item.title)}</b><small>${esc(item.path)}</small></div><span>${item.contentType}</span><span class="cms-status-dot ${String(item.status).toLowerCase()}">${esc(cmsStatusLabel(item.status))}</span><span class="cms-score ${cmsSeoScore(item) === 100 ? "good" : "needs-work"}">${cmsSeoScore(item)}%</span></article>`).join("")}
          </div>
        </section>

        <section class="cms-section ${cmsActiveSection === "templates" ? "active" : ""}" data-cms-section="templates">
          <div class="cms-page-title">
            <span>模板管理</span>
            <h1>模板</h1>
          </div>
          <div class="cms-section-head">
            <div><span>模板管理</span><h2>Header、Footer、CTA、产品和新闻布局都在这里管理</h2></div>
            <div class="cms-actions"><button type="button" data-cms-add="templates">创建模板</button><a href="${localHref("/")}">查看网站</a></div>
          </div>
          ${cmsEditing.templates && selectedTemplate ? renderCmsTemplateEditor(selectedTemplate) : ""}
          <div class="cms-card-grid">
            ${templates.map((template) => `<article class="cms-manage-card ${cmsEditing.templates === template.id ? "is-selected" : ""}">
              <span>${esc(template.scope)}</span>
              <h3>${esc(template.label)}</h3>
              <p>${esc(template.file)}</p>
              ${renderCmsFieldTags(template.controls)}
              <footer><b>${esc(template.id)}</b><button type="button" data-cms-edit="templates" data-cms-id="${esc(template.id)}">编辑模板</button></footer>
            </article>`).join("")}
          </div>
        </section>

        <section class="cms-section ${cmsActiveSection === "media" ? "active" : ""}" data-cms-section="media">
          <div class="cms-page-title">
            <span>媒体库</span>
            <h1>媒体素材</h1>
            <p>产品图、新闻封面、页面首屏图和 CTA 素材都在这里上传，然后在编辑器里复用。</p>
          </div>
          <div class="cms-section-head">
            <div><span>素材目录</span><h2>上传一次，可在模板和内容记录中重复使用</h2></div>
            <div class="cms-actions"><button type="button" data-cms-focus-upload>上传素材</button><a href="${localHref("/products")}">查看网站</a></div>
          </div>
          ${renderCmsMediaLibrary(state)}
        </section>

        <section class="cms-section ${cmsActiveSection === "settings" ? "active" : ""}" data-cms-section="settings">
          <div class="cms-page-title">
            <span>网站设置</span>
            <h1>品牌与全局设置</h1>
            <p>集中维护 Logo、品牌色、字体、按钮、翻译和全站 Footer CTA。</p>
          </div>
          <div class="cms-section-head">
            <div><span>Theme Settings</span><h2>全站 Logo、按钮和 CTA 统一入口</h2></div>
            <div class="cms-actions"><a href="${localHref("/")}">预览网站</a></div>
          </div>
          ${renderCmsStyleManager(state)}
        </section>

        ${cmsIsSuperAdmin() ? `<section class="cms-section ${cmsActiveSection === "users" ? "active" : ""}" data-cms-section="users">
          <div class="cms-page-title">
            <span>访问控制</span>
            <h1>人员与权限</h1>
            <p>只有超级管理员可以创建、停用或删除后台账号，并决定每位人员能管理哪些内容板块。</p>
          </div>
          <div class="cms-section-head">
            <div><span>账号管理</span><h2>分配最少且必要的后台权限</h2></div>
          </div>
          ${renderCmsUserManager()}
        </section>` : ""}

        <section class="cms-section ${cmsActiveSection === "roadmap" ? "active" : ""}" data-cms-section="roadmap">
          <div class="cms-section-head">
            <div><span>下一阶段</span><h2>如何继续完善成真正的 Hostinger CMS</h2></div>
            ${renderCmsActionRow("导出 JSON 结构", "返回后台", "/cms")}
          </div>
          <ol class="cms-roadmap">
            ${model.implementationPlan.map((step) => `<li>${esc(step)}</li>`).join("")}
          </ol>
          <div class="cms-note"><b>推荐方案</b><p>Hostinger 自定义 PHP/HTML 网站 + 密码保护后台 + JSON 数据文件 + uploads 上传目录。这样前台仍然可以静态部署，同时后台具备接近 WordPress 的内容编辑能力。</p></div>
        </section>
      </div>
    </section>
  </main>`;
}

function renderGenericPage(path) {
  const page = pageFor(path);
  if (Array.isArray(page.blocks) && page.blocks.length) {
    const state = cmsAdminState();
    return `${renderHeader()}<main class="inside-main lpb-public-page">${page.blocks.map((block) => renderCmsPageBlock(block, state, false)).join("")}</main>${renderFooter()}`;
  }
  return `${renderHeader()}<main class="inside-main">${pageHero(page, "Tervona", "/assets/tervona-products/category-scene-tervona-v2.png")}<article class="article-page"><h2>${cleanTitle(page.title)}</h2><p>${esc(page.description)}</p></article>${renderFooterCta()}</main>${renderFooter()}`;
}

function renderFooterCta(homeVisual = null) {
  const settings = cmsSiteSettings(cmsAdminState());
  const visual = homeVisual || {};
  const footerVideo = visual.footerVideo || settings.footerCtaVideo;
  return `<section class="footer-cta" id="contact">
    <picture>
      <source media="(max-width: 767px)" srcset="${esc(visual.footerMobileImage || visual.footerImage || settings.footerCtaMobileImage)}">
      <img src="${esc(visual.footerImage || settings.footerCtaImage)}" alt="">
    </picture>
    ${footerVideo ? `<video autoplay muted loop playsinline poster="${esc(visual.footerImage || settings.footerCtaImage)}" src="${esc(footerVideo)}"></video>` : ""}
    <div><h2>${esc(visual.footerTitle || settings.footerCtaTitle)}</h2><a class="outline-cta" href="${hrefFor(settings.footerCtaButtonHref)}">${icon("arrow")} ${esc(visual.footerButtonText || settings.footerCtaButtonText)}</a></div>
  </section>`;
}

function footerProductCategories() {
  return productCategories().map((category) => {
    const taxonomy = productTaxonomy().find((item) =>
      item.slug === category.slug || (Array.isArray(item.aliases) && item.aliases.includes(category.slug))
    );
    return {
      href: taxonomy?.href || `/products/${category.slug}`,
      label: taxonomy?.label || category.navTitle || category.title,
    };
  });
}

function renderFooter() {
  const footerProducts = footerProductCategories();
  return `<footer class="footer tervona-footer">
    <div class="footer-brand">
      <a class="footer-brand-logo" href="${localHref("/")}" aria-label="Tervona home"><img src="/assets/tervona-logo-transparent.png?v=20260812-logo2" alt="Tervona"></a>
      <strong>Shenzhen Tervona Tech Co., Ltd.</strong>
      <p>Residential energy storage, inverter and integrated home energy solutions.</p>
      <a class="footer-contact-link" href="${localHref("/contact-us")}">${icon("arrow")} Contact Tervona</a>
    </div>
    <div class="footer-cols">
      <div class="footer-nav-group footer-products"><h4>Products</h4><nav class="footer-link-list" aria-label="Product categories">${footerProducts.map((item) => `<a href="${localHref(item.href)}">${esc(item.label)}</a>`).join("")}</nav></div>
      <div class="footer-nav-group footer-downloads"><h4>Downloads</h4><nav class="footer-link-list" aria-label="Downloads">${downloadCategories().slice(0, 5).map(([slug, label]) => `<a href="${localHref(`/download/${slug}`)}">${esc(label)}</a>`).join("")}</nav></div>
      <div class="footer-nav-group footer-company"><h4>Company</h4><nav class="footer-link-list" aria-label="Company and partner"><a href="${localHref("/company")}">About Tervona</a><a href="${localHref("/contact-us")}">Contact Us</a><a href="${localHref("/partner")}">Partner</a></nav></div>
    </div>
    <div class="footer-legal"><strong>© 2026 Shenzhen Tervona Tech Co., Ltd.</strong><span>Plant 401, Nangang No. 2 Industrial Park, No. 1026 Songbai Road, Yangguang Community, Xili Street, Nanshan District, Shenzhen, China</span></div>
  </footer>`;
}

function cmsNormalizeRecordPath(path, fallback) {
  const route = routePathOnly(path || fallback || "/cms-record");
  return route === "/" ? fallback : route;
}

function cmsReadFileDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}

function cmsAddMediaRecord(asset) {
  const state = cmsAdminState();
  const cleanAsset = {
    id: asset.id || asset.url,
    title: asset.title || asset.url,
    url: asset.url,
    folder: asset.folder || "products",
    type: asset.type || "image",
    usage: asset.usage || "未分配",
    size: asset.size || "",
    mimeType: asset.mimeType || "",
  };
  state.media = [cleanAsset, ...state.media.filter((item) => item.url !== cleanAsset.url)];
  cmsActiveSection = "media";
  cmsSaveState(state);
  render();
}

async function cmsUploadMedia(form) {
  const values = Object.fromEntries(new FormData(form).entries());
  const file = form.querySelector('input[type="file"]')?.files?.[0];
  if (!file && !values.url) return;
  if (values.url) {
    cmsAddMediaRecord({
      id: values.url,
      title: values.title || values.url.split("/").pop(),
      url: values.url,
      folder: values.folder,
      type: /\.pdf$/i.test(values.url) ? "document" : (/\.(mp4|webm|mov)$/i.test(values.url) ? "video" : "image"),
      usage: values.usage,
    });
    return;
  }
  cmsBackendStatus = "Saving";
  cmsBackendSource = "上传中";
  cmsRefreshAdminIfActive();
  const dataUrl = await cmsReadFileDataUrl(file);
  const response = await fetch(`${CMS_API_URL}?action=upload`, {
    method: "POST",
    headers: cmsAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      title: values.title || file.name,
      folder: values.folder,
      usage: values.usage,
      fileName: file.name,
      dataUrl,
    }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.error || "上传失败");
  cmsBackendStatus = "Connected";
  cmsBackendSource = payload.source || "cms-api";
  cmsAddMediaRecord(payload.asset);
}

function cmsLiveEditorRecordFromForm(form) {
  const values = Object.fromEntries(new FormData(form).entries());
  const cat = categoryForSlug(values.category);
  const path = cmsNormalizeRecordPath(values.path, `/products/${cat.slug}/new-product`);
  return {
    id: path,
    title: values.title || "未命名产品",
    category: cat.slug,
    categoryLabel: cat.title,
    path,
    heroImage: values.heroImageManual || values.heroImage || values.heroImagePicker || `${ASSET}/tervona-products-home-banner-v2.png`,
    summary: values.summary || "",
    status: values.status || "Draft",
    heroText: values.heroText || "",
    stats: [
      { label: values.stat0Label || "Metric 1", value: values.stat0Value || "" },
      { label: values.stat1Label || "Metric 2", value: values.stat1Value || "" },
    ],
    advantagesEyebrow: values.advantagesEyebrow || "Key Advantages",
    advantagesTitle: values.advantagesTitle || "Key Advantages",
    advantagesBody: values.advantagesBody || "",
    highlights: [0, 1, 2, 3].map((index) => ({
      title: values[`highlight${index}Title`] || `Highlight ${index + 1}`,
      body: values[`highlight${index}Body`] || "",
    })),
    seoTitle: values.seoTitle || `${values.title || "Product"}-Tervona`,
    seoDescription: values.seoDescription || values.summary || "",
    seoKeywords: values.seoKeywords || "",
    canonicalUrl: values.canonicalUrl || path,
    seoIndexing: values.seoIndexing || "index, follow",
  };
}

function cmsSaveLiveEditor(form) {
  const state = cmsAdminState();
  const type = form.dataset.cmsLiveEditor;
  if (type !== "products") return;
  const values = Object.fromEntries(new FormData(form).entries());
  const existing = state.products.find((item) => item.id === values.originalId || item.path === values.originalId) || {};
  const record = { ...existing, ...cmsLiveEditorRecordFromForm(form) };
  const index = state.products.findIndex((item) => item.id === values.originalId || item.path === values.originalId);
  if (index >= 0) state.products[index] = record;
  else state.products.unshift(record);
  cmsRemoteState = state;
  cmsSaveState(state);
  history.replaceState(null, "", localHref(`/cms/editor?type=products&id=${encodeURIComponent(record.id)}`));
  render();
}

function cmsUpdateLivePreview(form) {
  if (!form) return;
  const record = cmsLiveEditorRecordFromForm(form);
  const setText = (key, value) => {
    form.querySelectorAll(`[data-live-preview="${key}"]`).forEach((node) => {
      node.textContent = value || "";
    });
  };
  setText("title", record.title);
  setText("categoryLabel", record.categoryLabel.replace(/ies$/, "y").replace(/s$/, ""));
  setText("heroText", record.heroText);
  setText("advantagesEyebrow", record.advantagesEyebrow);
  setText("advantagesTitle", record.advantagesTitle);
  setText("advantagesBody", record.advantagesBody);
  setText("seoTitle", record.seoTitle);
  setText("seoDescription", record.seoDescription);
  record.stats.forEach((stat, index) => {
    setText(`stat${index}Label`, stat.label);
    setText(`stat${index}Value`, stat.value);
  });
  record.highlights.forEach((item, index) => {
    setText(`highlight${index}Title`, item.title);
    setText(`highlight${index}Body`, item.body);
  });
  const image = form.querySelector('[data-live-preview="heroImage"]');
  if (image) image.src = record.heroImage;
}

function cmsReadImagePixels(url, callback) {
  if (!url || /\.pdf$/i.test(url)) {
    callback("非图片文件");
    return;
  }
  const image = new Image();
  image.onload = () => callback(`${image.naturalWidth} x ${image.naturalHeight} px`);
  image.onerror = () => callback("无法读取");
  image.src = url;
}

function cmsUpdateMediaPixelLabels(root = document) {
  root.querySelectorAll(".cms-selected-media-details").forEach((details) => {
    const url = details.querySelector("[data-cms-selected-url]")?.textContent?.trim();
    const target = details.querySelector("[data-cms-selected-pixels]");
    if (!target) return;
    target.textContent = "读取中";
    cmsReadImagePixels(url, (text) => {
      target.textContent = text;
    });
  });
}

function cmsResizeLivePreview() {
  document.querySelectorAll("[data-cms-preview-stage]").forEach((stage) => {
    const frame = stage.querySelector("[data-cms-preview-frame]");
    if (!frame) return;
    const stageWidth = Math.max(320, stage.clientWidth - 32);
    const designWidth = 1440;
    const scale = Math.min(1, stageWidth / designWidth);
    stage.style.setProperty("--cms-preview-scale", scale.toFixed(4));
    stage.style.minHeight = `${Math.ceil(frame.scrollHeight * scale + 32)}px`;
  });
}

function updateCategoryHeroScroll() {
  if (window.SITE_NO_MOTION) return;
  document.querySelectorAll("[data-category-hero]").forEach((hero) => {
    const rect = hero.getBoundingClientRect();
    const range = Math.max(1, hero.offsetHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / range));
    const ease = (value) => value * value * (3 - 2 * value);
    const clipProgress = ease(Math.min(1, progress / 0.58));
    const mainProgress = ease(Math.min(1, progress / 0.58));
    const copyProgress = ease(Math.min(1, progress / 0.46));
    const caseProgress = ease(Math.min(1, Math.max(0, (progress - 0.30) / 0.42)));
    const inverse = 1 - mainProgress;
    hero.style.setProperty("--source-progress", progress.toFixed(4));
    hero.style.setProperty("--source-inverse", inverse.toFixed(4));
    hero.style.setProperty("--source-main-opacity", (1 - mainProgress).toFixed(4));
    hero.style.setProperty("--source-hot-opacity", mainProgress.toFixed(4));
    hero.style.setProperty("--source-copy-opacity", (1 - copyProgress).toFixed(4));
    hero.style.setProperty("--source-case-opacity", caseProgress.toFixed(4));
    hero.style.setProperty("--source-clip-top", `${(100 * clipProgress).toFixed(2)}px`);
    hero.style.setProperty("--source-clip-x", `${(60 * clipProgress).toFixed(2)}px`);
    hero.style.setProperty("--source-clip-bottom", `${(80 * clipProgress).toFixed(2)}px`);
    hero.style.setProperty("--source-clip-radius", `${(40 * clipProgress).toFixed(2)}px`);
    hero.style.setProperty("--source-hot-scale", (1.035 - mainProgress * 0.035).toFixed(4));
    hero.style.setProperty("--source-copy-y", `${(-34 * copyProgress).toFixed(2)}px`);
    hero.style.setProperty("--source-hot-y", `${(54 * (1 - caseProgress)).toFixed(2)}px`);
  });
}

function initSourceScrollReveal() {
  if (sourceRevealObserver) {
    sourceRevealObserver.disconnect();
    sourceRevealObserver = null;
  }
  sourceRevealNodes = Array.from(document.querySelectorAll([
    ".products",
    ".about-unbox",
    ".source-product-row",
    ".source-resource-band",
    ".news-featured-media",
    ".news-featured-copy",
    ".news-page-card",
    ".footer-cta",
    ".product-monitoring-copy > span",
    ".product-monitoring-copy > em",
    ".product-monitoring-copy > h2",
    ".product-monitoring-copy > p",
    ".product-monitoring-downloads article",
    ".product-monitoring-phone",
  ].join(", ")));
  if (!sourceRevealNodes.length) return;
  if (window.SITE_NO_MOTION) {
    sourceRevealNodes.forEach((row) => row.classList.add("in-view"));
    return;
  }
  if (!("IntersectionObserver" in window)) {
    sourceRevealNodes.forEach((row) => row.classList.add("in-view"));
    return;
  }
  sourceRevealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        sourceRevealObserver?.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.18 });
  sourceRevealNodes.forEach((row) => sourceRevealObserver.observe(row));
  syncSourceScrollReveal();
}

function syncSourceScrollReveal() {
  sourceRevealNodes.forEach((row) => {
    const rect = row.getBoundingClientRect();
    const isMonitoringNode = row.matches(".product-monitoring-copy > span, .product-monitoring-copy > em, .product-monitoring-copy > h2, .product-monitoring-copy > p, .product-monitoring-downloads article, .product-monitoring-phone");
    const triggerLine = isMonitoringNode ? window.innerHeight : window.innerHeight * 0.88;
    if (rect.top < triggerLine) row.classList.add("in-view");
  });
}

function runScrollEffects() {
  scrollRaf = 0;
  syncScrollEffects();
  updateCategoryHeroScroll();
  syncSourceScrollReveal();
}

function scheduleScrollEffects() {
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(runScrollEffects);
}

function cmsSaveEditor(form) {
  const state = cmsAdminState();
  const type = form.dataset.cmsEditor;
  const values = Object.fromEntries(new FormData(form).entries());
  if (type === "products") {
    const cat = categoryForSlug(values.category);
    const path = cmsNormalizeRecordPath(values.path, `/products/${cat.slug}/new-product`);
    const existing = state.products.find((item) => item.id === values.originalId) || {};
    const record = cmsStampRecord({
      ...existing,
      id: path,
      title: values.title || "未命名产品",
      category: cat.slug,
      categoryLabel: cat.title,
      path,
      heroImage: values.heroImageManual || values.heroImage || `${ASSET}/tervona-products-home-banner-v2.png`,
      summary: values.summary || "",
      status: values.status || "Draft",
    }, existing);
    const index = state.products.findIndex((item) => item.id === values.originalId);
    if (index >= 0) state.products[index] = record;
    else state.products.unshift(record);
    cmsEditing.products = record.id;
    cmsActiveSection = "products";
    cmsTrackActivity(state, index >= 0 ? "已更新" : "已创建", record, "产品");
  }
  if (type === "news") {
    const path = cmsNormalizeRecordPath(values.path, `/news/new-article`);
    const existing = state.news.find((item) => item.id === values.originalId) || {};
    const record = cmsStampRecord({
      ...existing,
      id: path,
      title: values.title || "未命名新闻",
      path,
      date: values.date || "Draft",
      coverImage: values.coverImage || "/assets/tervona-downloads-hero-v2.png",
      excerpt: values.excerpt || "",
      body: values.body || "",
      status: values.status || "Draft",
    }, existing);
    const index = state.news.findIndex((item) => item.id === values.originalId);
    if (index >= 0) state.news[index] = record;
    else state.news.unshift(record);
    cmsEditing.news = record.id;
    cmsActiveSection = "news";
    cmsTrackActivity(state, index >= 0 ? "已更新" : "已创建", record, "新闻");
  }
  if (type === "pages") {
    const path = cmsNormalizeRecordPath(values.path, values.originalId || "/page");
    const existing = state.pages.find((item) => item.id === values.originalId) || {};
    const record = cmsStampRecord({
      ...existing,
      id: path,
      title: values.title || "未命名页面",
      path,
      template: values.template || "templates/pages/default",
      heroImage: values.heroImageManual || values.heroImage || "/assets/tervona-products/category-scene-tervona-v2.png",
      summary: values.summary || "",
      status: values.status || "Draft",
    }, existing);
    const index = state.pages.findIndex((item) => item.id === values.originalId);
    if (index >= 0) state.pages[index] = record;
    else state.pages.unshift(record);
    cmsEditing.pages = record.id;
    cmsActiveSection = "pages";
    cmsTrackActivity(state, index >= 0 ? "已更新" : "已创建", record, "页面");
  }
  if (type === "templates") {
    const controls = String(values.controls || "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    const record = {
      id: values.id || values.originalId || `template-${Date.now()}`,
      label: values.label || "未命名模板",
      scope: values.scope || "",
      file: values.file || "",
      controls,
      notes: values.notes || "",
    };
    const index = state.templates.findIndex((item) => item.id === values.originalId);
    if (index >= 0) state.templates[index] = record;
    else state.templates.unshift(record);
    cmsEditing.templates = record.id;
    cmsActiveSection = "templates";
  }
  if (type === "menus") {
    state.menus = cmsMenus(state).map((item, index) => ({
      ...item,
      label: values[`menu${index}Label`] || item.label,
      href: values[`menu${index}Href`] || item.href || "/",
      intro: values[`menu${index}Intro`] || "",
      children: (item.children || []).map((child, childIndex) => ({
        label: values[`menu${index}Child${childIndex}Label`] || child.label || "",
        href: values[`menu${index}Child${childIndex}Href`] || child.href || "/",
        icon: values[`menu${index}Child${childIndex}Icon`] || "",
      })).filter((child) => child.label && child.href),
    }));
    cmsActiveSection = "menus";
  }
  if (type === "settings") {
    state.settings = { ...cmsSiteSettings(state), ...values };
    const pickedFooterImage = values.footerCtaImage || "";
    if (pickedFooterImage) state.settings.footerCtaImage = pickedFooterImage;
    cmsActiveSection = "settings";
  }
  if (type === "downloads") {
    const product = state.products.find((item) => item.path === values.product || item.id === values.product);
    const existing = (state.downloads || []).find((item) => item.id === values.originalId) || {};
    const record = {
      ...existing,
      id: existing.id || `download-${Date.now()}`,
      title: values.title || "未命名下载文件",
      type: values.type || "datasheets",
      product: values.product || "",
      productLabel: product?.title || values.product || "",
      fileUrl: values.fileUrlManual || values.fileUrl || "/uploads/downloads/file.pdf",
      version: values.version || "V1.0",
      status: values.status || "Draft",
    };
    const index = (state.downloads || []).findIndex((item) => item.id === values.originalId);
    if (index >= 0) state.downloads[index] = record;
    else state.downloads = [record, ...(state.downloads || [])];
    cmsEditing.downloads = "";
    cmsActiveSection = "downloads";
  }
  cmsSaveState(state);
  render();
}

function cmsAddRecord(type) {
  const state = cmsAdminState();
  if (type === "products") {
    const record = cmsNewProductRecord();
    state.products.unshift(record);
    cmsEditing.products = record.id;
    cmsActiveSection = "products";
  }
  if (type === "news") {
    const record = cmsNewNewsRecord();
    state.news.unshift(record);
    cmsEditing.news = record.id;
    cmsActiveSection = "news";
  }
  if (type === "pages") {
    const record = cmsNewPageRecord();
    state.pages.unshift(record);
    cmsEditing.pages = record.id;
    cmsActiveSection = "pages";
  }
  if (type === "templates") {
    const record = cmsNewTemplateRecord();
    state.templates.unshift(record);
    cmsEditing.templates = record.id;
    cmsActiveSection = "templates";
  }
  if (type === "downloads") {
    cmsEditing.downloads = "new";
    cmsActiveSection = "downloads";
  }
  cmsSaveState(state);
  render();
}

function cmsDeleteRecord(type, id) {
  const state = cmsAdminState();
  if (type === "products") {
    state.products = state.products.filter((item) => item.id !== id);
    if (cmsEditing.products === id) cmsEditing.products = state.products[0]?.id || "";
    cmsActiveSection = "products";
  }
  if (type === "news") {
    state.news = state.news.filter((item) => item.id !== id);
    if (cmsEditing.news === id) cmsEditing.news = state.news[0]?.id || "";
    cmsActiveSection = "news";
  }
  if (type === "downloads") {
    state.downloads = (state.downloads || []).filter((item) => item.id !== id);
    if (cmsEditing.downloads === id) cmsEditing.downloads = "";
    cmsActiveSection = "downloads";
  }
  cmsSaveState(state);
  render();
}

function cmsFocusEditor() {
  requestAnimationFrame(() => {
    document.querySelector(".cms-edit-panel")?.scrollIntoView({ block: "start", behavior: "smooth" });
  });
}

function cmsVisualFormValues(form) {
  const current = cmsHomeVisualSettings();
  const formData = new FormData(form);
  const value = (name, fallback) => formData.has(name) ? formData.get(name) : fallback;
  const next = {
    ...current,
    heroTitle: value("heroTitle", current.heroTitle),
    heroText: value("heroText", current.heroText),
    heroImage: value("heroImage", current.heroImage),
    heroVideo: value("heroVideo", current.heroVideo),
    heroTitleSize: Number(value("heroTitleSize", current.heroTitleSize)),
    heroTitleWeight: Number(value("heroTitleWeight", current.heroTitleWeight)),
    heroTitleLineHeight: Number(value("heroTitleLineHeight", current.heroTitleLineHeight)),
    heroTitleColor: value("heroTitleColor", current.heroTitleColor),
    heroTextSize: Number(value("heroTextSize", current.heroTextSize)),
    heroTextColor: value("heroTextColor", current.heroTextColor),
    sectionTop: Number(value("sectionTop", current.sectionTop)),
    sectionBottom: Number(value("sectionBottom", current.sectionBottom)),
    solutionsEyebrow: value("solutionsEyebrow", current.solutionsEyebrow),
    solutionsTitle: value("solutionsTitle", current.solutionsTitle),
    solutionsText: value("solutionsText", current.solutionsText),
    solutionsImage: value("solutionsImage", current.solutionsImage),
    solutionsVideo: value("solutionsVideo", current.solutionsVideo),
    productsEyebrow: value("productsEyebrow", current.productsEyebrow),
    productsTitle: value("productsTitle", current.productsTitle),
    productsImage: value("productsImage", current.productsImage),
    productsSource: value("productsSource", current.productsSource),
    aboutEyebrow: value("aboutEyebrow", current.aboutEyebrow),
    aboutTitle: value("aboutTitle", current.aboutTitle),
    aboutText: value("aboutText", current.aboutText),
    aboutImage: value("aboutImage", current.aboutImage),
    aboutVideo: value("aboutVideo", current.aboutVideo),
    innovationEyebrow: value("innovationEyebrow", current.innovationEyebrow),
    innovationTitle: value("innovationTitle", current.innovationTitle),
    innovationImage: value("innovationImage", current.innovationImage),
    innovationVideo: value("innovationVideo", current.innovationVideo),
    newsEyebrow: value("newsEyebrow", current.newsEyebrow),
    newsTitle: value("newsTitle", current.newsTitle),
    newsSource: value("newsSource", current.newsSource),
    newsCount: Number(value("newsCount", current.newsCount)),
    footerTitle: value("footerTitle", current.footerTitle),
    footerButtonText: value("footerButtonText", current.footerButtonText),
    footerImage: value("footerImage", current.footerImage),
    footerVideo: value("footerVideo", current.footerVideo),
  };
  next.sectionSpacing = {
    ...current.sectionSpacing,
    solutions: Number(value("solutionsSpacing", current.sectionSpacing.solutions)),
    products: Number(value("productsSpacing", current.sectionSpacing.products)),
    about: Number(value("aboutSpacing", current.sectionSpacing.about)),
    innovation: Number(value("innovationSpacing", current.sectionSpacing.innovation)),
    news: Number(value("newsSpacing", current.sectionSpacing.news)),
    footer: Number(value("footerSpacing", current.sectionSpacing.footer)),
  };
  next.sectionVisibility = { ...current.sectionVisibility };
  if (form.elements.sectionVisible && next.sectionVisibility[cmsVisualSelected] !== undefined) {
    next.sectionVisibility[cmsVisualSelected] = form.elements.sectionVisible.checked;
  }
  return next;
}

function cmsVisualUpdateCanvas(form) {
  const visual = cmsVisualFormValues(form);
  const canvas = document.querySelector("[data-visual-canvas]");
  if (!canvas) return;
  const title = canvas.querySelector("[data-visual-select='hero-title'] h1");
  const text = canvas.querySelector("[data-visual-select='hero-text'] p");
  const hero = canvas.querySelector(".cms-visual-hero");
  if (title) {
    title.textContent = visual.heroTitle;
    title.style.fontSize = `${visual.heroTitleSize}px`;
    title.style.fontWeight = visual.heroTitleWeight;
    title.style.lineHeight = visual.heroTitleLineHeight;
    title.style.color = visual.heroTitleColor;
  }
  if (text) {
    text.textContent = visual.heroText;
    text.style.fontSize = `${visual.heroTextSize}px`;
    text.style.color = visual.heroTextColor;
  }
  if (hero) {
    hero.style.backgroundImage = `url("${String(visual.heroImage).replaceAll('"', '%22')}")`;
    hero.style.paddingTop = `${visual.sectionTop}px`;
    hero.style.paddingBottom = `${visual.sectionBottom}px`;
  }
  const section = canvas.querySelector(`[data-visual-select='${cmsVisualSelected}']`);
  if (section) {
    if (visual.sectionVisibility[cmsVisualSelected] !== undefined) section.classList.toggle("is-hidden-section", !visual.sectionVisibility[cmsVisualSelected]);
    if (visual.sectionSpacing[cmsVisualSelected] !== undefined) {
      section.style.paddingTop = `${visual.sectionSpacing[cmsVisualSelected]}px`;
      section.style.paddingBottom = `${visual.sectionSpacing[cmsVisualSelected]}px`;
    }
    const set = (selector, text) => { const node = section.querySelector(selector); if (node) node.textContent = text; };
    if (cmsVisualSelected === "solutions") { set("span", visual.solutionsEyebrow); set("h2", visual.solutionsTitle); set("p", visual.solutionsText); const video=section.querySelector("video"); if(video) video.src=visual.solutionsVideo; }
    if (cmsVisualSelected === "products") { set("span", visual.productsEyebrow); set("h2", visual.productsTitle); const img=section.querySelector("img"); if(img) img.src=visual.productsImage; }
    if (cmsVisualSelected === "about") { set("span", visual.aboutEyebrow); set("h2", visual.aboutTitle); set("p", visual.aboutText); section.style.backgroundImage=`url("${visual.aboutImage}")`; const video=section.querySelector("video"); if(video) video.src=visual.aboutVideo; }
    if (cmsVisualSelected === "innovation") { set("span", visual.innovationEyebrow); set("h2", visual.innovationTitle); const video=section.querySelector("video"); if(video) video.src=visual.innovationVideo; }
    if (cmsVisualSelected === "news") { set("span", visual.newsEyebrow); set("h2", visual.newsTitle); set("em", `自动调用最新 ${visual.newsCount} 篇`); }
    if (cmsVisualSelected === "footer") { set("h2", visual.footerTitle); set("button", `${visual.footerButtonText} →`); const video=section.querySelector("video"); if(video) video.src=visual.footerVideo; }
  }
  form.querySelectorAll("input[type='range']").forEach((input) => {
    const output = input.parentElement?.querySelector("output");
    if (output) output.textContent = `${input.value}${["heroTitleSize", "heroTextSize", "sectionTop", "sectionBottom"].includes(input.name) ? "px" : ""}`;
  });
  form.querySelectorAll("input[type='color']").forEach((input) => {
    const code = input.parentElement?.querySelector("code");
    if (code) code.textContent = input.value;
  });
  const status = document.querySelector("[data-visual-save-status]");
  if (status) status.textContent = "有未发布更改";
}

function cmsVisualPublish(form) {
  const state = cmsAdminState();
  const home = state.pages.find((page) => routePathOnly(page.path) === "/");
  if (!home) return;
  home.visual = cmsVisualFormValues(form);
  home.heroImage = home.visual.heroImage;
  cmsSaveState(state);
  const status = document.querySelector("[data-visual-save-status]");
  if (status) status.textContent = "保存中…";
  setTimeout(() => {
    if (status) status.textContent = "✓ 已发布";
  }, 450);
}

function bindDownloadCenter() {
  const center = document.querySelector("[data-download-center]");
  const form = center?.querySelector("[data-download-filter]");
  if (!center || !form) return;
  const applyFilters = () => {
    const keyword = String(form.querySelector("[data-download-keyword]")?.value || "").trim().toLowerCase();
    const product = String(form.querySelector("[data-download-product]")?.value || "");
    const types = [...form.querySelectorAll("[data-download-type]:checked")].map((input) => input.value);
    let visible = 0;
    center.querySelectorAll("[data-download-row]").forEach((row) => {
      const matchesKeyword = !keyword || row.dataset.downloadSearch.includes(keyword);
      const matchesProduct = !product || row.dataset.downloadProductValue === product;
      const matchesType = !types.length || types.includes(row.dataset.downloadTypeValue);
      row.hidden = !(matchesKeyword && matchesProduct && matchesType);
      if (!row.hidden) visible += 1;
    });
    const counter = center.querySelector("[data-download-count]");
    const empty = center.querySelector("[data-download-empty]");
    if (counter) counter.textContent = String(visible);
    if (empty) empty.hidden = visible > 0;
  };
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    applyFilters();
  });
  form.addEventListener("reset", (event) => {
    event.preventDefault();
    const keyword = form.querySelector("[data-download-keyword]");
    const product = form.querySelector("[data-download-product]");
    if (keyword) keyword.value = "";
    if (product) product.value = "";
    form.querySelectorAll("[data-download-type]").forEach((input) => {
      input.checked = false;
    });
    applyFilters();
  });
}

function bind() {
  cmsApplySiteSettings();
  bindDownloadCenter();
  document.querySelectorAll("[data-public-form]").forEach((publicForm) => {
    if (publicForm.closest(".cms-form-preview")) {
      publicForm.addEventListener("submit", (event) => event.preventDefault());
      return;
    }
    publicForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = form.querySelector(".contact-form-status");
    const submit = form.querySelector('button[type="submit"]');
    const values = {};
    form.querySelectorAll("[name]").forEach((field) => {
      if (field.name === "website") return;
      if (field.type === "radio") {
        if (field.checked) values[field.name] = field.value;
        return;
      }
      values[field.name] = field.type === "checkbox" ? field.checked : field.value;
    });
    const website = form.querySelector('[name="website"]')?.value || "";
    if (status) { status.classList.remove("is-error"); status.textContent = "Sending your enquiry…"; }
    if (submit) submit.disabled = true;
    try {
      const response = await fetch(`${CMS_API_URL}?action=submission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website, formId: form.dataset.formId, formSlug: form.dataset.formSlug, values, source: `${location.pathname}${location.search}` }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to send your enquiry.");
      form.reset();
      if (status) status.textContent = payload.message || "Thank you. Your enquiry has been received.";
    } catch (error) {
      if (status) { status.classList.add("is-error"); status.textContent = error.message || "Unable to send your enquiry. Please try again."; }
    } finally {
      if (submit) submit.disabled = false;
    }
    });
  });
  const syncPartnerMode = (value) => {
    document.querySelectorAll("[data-partner-mode]").forEach((button) => {
      const active = button.dataset.partnerMode === value;
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  };
  document.querySelectorAll("[data-partner-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.querySelector(`input[name="partnershipModel"][value="${CSS.escape(button.dataset.partnerMode)}"]`);
      if (input) {
        input.checked = true;
        syncPartnerMode(input.value);
        document.querySelector("#partner-application")?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.setTimeout(() => input.focus({ preventScroll: true }), 450);
      }
    });
  });
  document.querySelectorAll('input[name="partnershipModel"]').forEach((input) => input.addEventListener("change", () => syncPartnerMode(input.value)));
  if (location.hash === "#partner-application") window.setTimeout(() => document.querySelector("#partner-application")?.scrollIntoView({ block: "start" }), 80);
  document.querySelector("[data-copy-article-url]")?.addEventListener("click", async (event) => {
    try {
      await navigator.clipboard.writeText(location.href);
      const button = event.currentTarget;
      button.classList.add("copied");
      button.setAttribute("aria-label", "Article link copied");
      window.setTimeout(() => button.classList.remove("copied"), 1600);
    } catch {
      // Clipboard permissions vary by browser; the share links remain usable.
    }
  });
  document.querySelector("[data-cms-login]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    if (button) { button.disabled = true; button.textContent = "正在登录…"; }
    try {
      await cmsLogin(form);
    } catch (error) {
      cmsAuthError = error.message || "登录失败";
      render();
    }
  });
  document.querySelector("[data-cms-logout]")?.addEventListener("click", () => cmsLogout());
  document.querySelector("[data-cms-refresh-users]")?.addEventListener("click", () => {
    cmsUsersStatus = "idle";
    cmsLoadManagedUsers(true);
    render();
  });
  document.querySelector("[data-cms-user-create]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      displayName: formData.get("displayName"), username: formData.get("username"), password: formData.get("password"),
      role: formData.get("role"), permissions: formData.getAll("permissions"),
    };
    try { await cmsUserAction("user-create", payload); } catch (error) { cmsUsersError = error.message || "新增人员失败"; render(); }
  });
  document.querySelectorAll("[data-cms-user-update]").forEach((form) => form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      id: formData.get("id"), displayName: formData.get("displayName"), username: formData.get("username"), password: formData.get("password"),
      role: formData.get("role"), active: formData.has("active"), permissions: formData.getAll("permissions"),
    };
    try { await cmsUserAction("user-update", payload); } catch (error) { cmsUsersError = error.message || "保存账号失败"; render(); }
  }));
  document.querySelectorAll("[data-cms-user-delete]").forEach((button) => button.addEventListener("click", async () => {
    if (!confirm("确定删除这个后台人员吗？删除后该账号将立即无法登录。")) return;
    try { await cmsUserAction("user-delete", { id: button.dataset.cmsUserDelete }); } catch (error) { cmsUsersError = error.message || "删除人员失败"; render(); }
  }));
  document.querySelectorAll("[data-cms-form-select]").forEach((button) => button.addEventListener("click", () => {
    cmsSyncActiveFormFromEditor();
    cmsActiveFormId = button.dataset.cmsFormSelect;
    cmsFormMessage = "";
    render({ preserveScroll: true });
  }));
  document.querySelector("[data-cms-form-new]")?.addEventListener("click", () => {
    cmsSyncActiveFormFromEditor();
    const id = `form-${Date.now()}`;
    cmsForms.unshift({ id, name: "New Form", slug: `new-form-${String(Date.now()).slice(-6)}`, title: "How can we help?", description: "Complete the form and our team will follow up.", submitLabel: "Submit", successMessage: "Thank you. Your submission has been received.", status: "draft", fields: [{ id: `field-${Date.now()}`, key: "name", label: "Name", type: "text", required: true, placeholder: "Your name", width: "half", includeInEmail: true, options: [] }] });
    cmsActiveFormId = id;
    cmsFormMessage = "新表单已创建为草稿，请配置字段后保存。";
    render({ preserveScroll: true });
  });
  document.querySelector("[data-cms-form-builder-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = cmsCollectFormEditor(event.currentTarget);
    cmsFormMessage = "正在保存表单…";
    cmsFormsError = "";
    try {
      await cmsFormAction("form-save", payload);
      cmsFormMessage = "表单已保存，前台和询盘邮件已同步更新。";
      await loadPublicForms(true);
      render({ preserveScroll: true });
    } catch (error) {
      cmsFormsError = error.message || "表单保存失败";
      cmsFormMessage = cmsFormsError;
      render({ preserveScroll: true });
    }
  });
  document.querySelector("[data-cms-form-delete]")?.addEventListener("click", async () => {
    const form = cmsCurrentForm();
    if (!form || !confirm(`确定删除表单“${form.name}”吗？已有询盘记录会保留。`)) return;
    try {
      await cmsFormAction("form-delete", { id: form.id });
      cmsActiveFormId = cmsForms[0]?.id || "";
      cmsFormMessage = "表单已删除。";
      await loadPublicForms(true);
      render({ preserveScroll: true });
    } catch (error) { cmsFormsError = error.message || "无法删除表单"; cmsFormMessage = cmsFormsError; render({ preserveScroll: true }); }
  });
  document.querySelector("[data-cms-form-field-add]")?.addEventListener("click", () => {
    const form = cmsSyncActiveFormFromEditor();
    const index = form.fields.length + 1;
    form.fields.push({ id: `field-${Date.now()}`, key: `field${index}`, label: `Field ${index}`, type: "text", required: false, placeholder: "", width: "half", includeInEmail: true, options: [] });
    render({ preserveScroll: true });
  });
  document.querySelectorAll("[data-cms-form-field-delete]").forEach((button) => button.addEventListener("click", () => {
    const form = cmsSyncActiveFormFromEditor();
    if (form.fields.length <= 1) { cmsFormMessage = "每张表单至少需要一个字段。"; render({ preserveScroll: true }); return; }
    form.fields.splice(Number(button.dataset.cmsFormFieldDelete), 1);
    render({ preserveScroll: true });
  }));
  document.querySelectorAll("[data-cms-form-field-up], [data-cms-form-field-down]").forEach((button) => button.addEventListener("click", () => {
    const form = cmsSyncActiveFormFromEditor();
    const from = Number(button.dataset.cmsFormFieldUp ?? button.dataset.cmsFormFieldDown);
    const to = button.hasAttribute("data-cms-form-field-up") ? from - 1 : from + 1;
    if (to < 0 || to >= form.fields.length) return;
    [form.fields[from], form.fields[to]] = [form.fields[to], form.fields[from]];
    render({ preserveScroll: true });
  }));
  document.querySelectorAll("[name^='fieldType']").forEach((select) => select.addEventListener("change", () => {
    cmsSyncActiveFormFromEditor();
    render({ preserveScroll: true });
  }));
  document.querySelectorAll("[data-cms-submission-open]").forEach((button) => button.addEventListener("click", () => {
    cmsViewingSubmissionId = button.dataset.cmsSubmissionOpen || "";
    render({ preserveScroll: true });
  }));
  document.querySelectorAll("[data-cms-submission-close]").forEach((button) => button.addEventListener("click", () => {
    cmsViewingSubmissionId = "";
    render({ preserveScroll: true });
  }));
  document.querySelector("[data-cms-submission-close-overlay]")?.addEventListener("click", (event) => {
    if (event.target !== event.currentTarget) return;
    cmsViewingSubmissionId = "";
    render({ preserveScroll: true });
  });
  if (!window.__cmsInquiryEscapeBound) {
    window.__cmsInquiryEscapeBound = true;
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !cmsViewingSubmissionId) return;
      cmsViewingSubmissionId = "";
      render({ preserveScroll: true });
    });
  }
  document.querySelectorAll("[data-cms-refresh-submissions]").forEach((button) => button.addEventListener("click", () => {
    cmsSubmissionsStatus = "idle";
    cmsLoadSubmissions(true);
    render();
  }));
  document.querySelectorAll("[data-cms-submission-status]").forEach((select) => select.addEventListener("change", async () => {
    try { await cmsSubmissionAction("submission-status", { id: select.dataset.cmsSubmissionStatus, status: select.value }); }
    catch (error) { cmsSubmissionsError = error.message || "无法更新询盘状态"; render(); }
  }));
  document.querySelectorAll("[data-cms-submission-delete]").forEach((button) => button.addEventListener("click", async () => {
    if (!confirm("确定永久删除这条询盘记录吗？")) return;
    try { await cmsSubmissionAction("submission-delete", { id: button.dataset.cmsSubmissionDelete }); }
    catch (error) { cmsSubmissionsError = error.message || "无法删除询盘"; render(); }
  }));
  document.querySelector("[data-cms-mail-settings]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    cmsMailSettingsMessage = "正在保存 SMTP 配置…";
    try { await cmsMailSettingsAction("mail-settings-save", values); }
    catch (error) { cmsMailSettingsStatus = "error"; cmsMailSettingsMessage = error.message || "SMTP 配置保存失败"; render(); }
  });
  document.querySelector("[data-cms-mail-test]")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    cmsMailSettingsMessage = "正在连接腾讯企业邮箱并发送测试邮件…";
    try { await cmsMailSettingsAction("mail-test"); }
    catch (error) { cmsMailSettingsStatus = "error"; cmsMailSettingsMessage = error.message || "测试邮件发送失败"; render(); }
  });
  ensureGoogleTranslate();
  cmsResizeLivePreview();
  updateCategoryHeroScroll();
  initSourceScrollReveal();
  scheduleScrollEffects();
  const topbar = document.querySelector(".topbar");
  const drawer = document.querySelector("[data-mobile-drawer]");
  const menuToggle = document.querySelector("[data-mobile-menu-toggle]");
  const setMobileMenu = (open) => {
    if (open) {
      document.querySelectorAll(".mobile-drawer-item.open").forEach((item) => item.classList.remove("open"));
      document.querySelectorAll("[data-mobile-submenu]").forEach((button) => button.setAttribute("aria-expanded", "false"));
    }
    topbar?.classList.toggle("mobile-open", open);
    document.body.classList.toggle("mobile-menu-lock", open);
    menuToggle?.setAttribute("aria-expanded", open ? "true" : "false");
  };
  menuToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    setMobileMenu(!topbar?.classList.contains("mobile-open"));
  });
  document.querySelector("[data-mobile-menu-close]")?.addEventListener("click", () => setMobileMenu(false));
  drawer?.addEventListener("click", (event) => {
    if (event.target === drawer) setMobileMenu(false);
  });
  document.querySelectorAll("[data-mobile-submenu]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".mobile-drawer-item");
      const open = !item?.classList.contains("open");
      item?.classList.toggle("open", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
  document.querySelectorAll("[data-product-mega]").forEach((mega) => {
    const activateCategory = (slug) => {
      mega.querySelectorAll("[data-product-category-tab]").forEach((tab) => {
        const active = tab.dataset.productCategoryTab === slug;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
      });
      mega.querySelectorAll("[data-product-category-panel]").forEach((panel) => {
        const active = panel.dataset.productCategoryPanel === slug;
        panel.classList.toggle("active", active);
        panel.hidden = !active;
      });
    };
    mega.querySelectorAll("[data-product-category-tab]").forEach((tab) => {
      tab.addEventListener("click", () => activateCategory(tab.dataset.productCategoryTab || ""));
    });
  });
  document.querySelectorAll(".mobile-product-category").forEach((details) => {
    details.addEventListener("toggle", () => {
      if (!details.open) return;
      details.parentElement?.querySelectorAll(".mobile-product-category[open]").forEach((other) => {
        if (other !== details) other.removeAttribute("open");
      });
    });
  });
  document.querySelectorAll(".mobile-drawer a").forEach((link) => {
    link.addEventListener("click", () => setMobileMenu(false));
  });
  document.querySelectorAll("[data-language-toggle]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const switcher = button.closest("[data-language-switcher]");
      const open = !switcher?.classList.contains("open");
      document.querySelectorAll("[data-language-switcher]").forEach((item) => item.classList.remove("open"));
      switcher?.classList.toggle("open", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
  document.querySelectorAll("[data-google-lang]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      applyGoogleLanguage(button.dataset.googleLang || "en");
    });
  });
  if (!window.__foxLanguageSwitcherBound) {
    window.__foxLanguageSwitcherBound = true;
    document.addEventListener("click", () => {
      document.querySelectorAll("[data-language-switcher]").forEach((item) => item.classList.remove("open"));
      document.querySelectorAll("[data-language-toggle]").forEach((button) => button.setAttribute("aria-expanded", "false"));
    });
  }
  document.querySelectorAll("[data-cms-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.cmsNav;
      if (!cmsCanAccess(target)) return;
      cmsSetActiveSection(target);
      document.querySelectorAll("[data-cms-nav]").forEach((item) => item.classList.toggle("active", item === button));
      document.querySelectorAll("[data-cms-section]").forEach((section) => section.classList.toggle("active", section.dataset.cmsSection === target));
    });
  });
  const openCmsSection = (target) => {
    if (!cmsCanAccess(target)) return;
    cmsSetActiveSection(target);
    document.querySelectorAll("[data-cms-nav]").forEach((item) => item.classList.toggle("active", item.dataset.cmsNav === target));
    document.querySelectorAll("[data-cms-section]").forEach((section) => section.classList.toggle("active", section.dataset.cmsSection === target));
    document.querySelector(".cms-workspace")?.scrollTo({ top: 0, behavior: "smooth" });
  };
  document.querySelectorAll("[data-cms-nav-jump]").forEach((button) => {
    button.addEventListener("click", () => openCmsSection(button.dataset.cmsNavJump));
  });
  document.querySelector("[data-cms-publish-all]")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    const state = cmsAdminState();
    const drafts = [...state.pages, ...state.products, ...state.news].filter((item) => item.status === "Draft").length;
    button.textContent = drafts ? `${drafts} 项草稿待审核` : "已全部发布";
    button.classList.add("is-confirmed");
    setTimeout(() => { button.textContent = "发布更改"; button.classList.remove("is-confirmed"); }, 1800);
  });
  document.querySelectorAll("[data-cms-visual-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      cmsEditing.pages = button.dataset.cmsVisualEdit || "/";
      if (routePathOnly(button.dataset.cmsVisualEdit || "/") === "/") {
        cmsVisualEditorOpen = true;
        cmsVisualSelected = "hero-title";
      } else {
        cmsPageBuilderOpen = true;
        cmsPageBuilderPageId = button.dataset.cmsVisualEdit;
        const page = cmsAdminState().pages.find((item) => item.id === cmsPageBuilderPageId);
        cmsPageBuilderSelectedId = page?.blocks?.[0]?.id || "";
      }
      render();
    });
  });
  const savePageBuilderState = (mutator) => {
    const state = cmsAdminState();
    const pageIndex = state.pages.findIndex((item) => item.id === cmsPageBuilderPageId);
    if (pageIndex < 0) return;
    if (!Array.isArray(state.pages[pageIndex].blocks)) state.pages[pageIndex].blocks = cmsDefaultPageBlocks();
    mutator(state.pages[pageIndex], state);
    state.pages[pageIndex].updatedAt = new Date().toISOString();
    cmsSaveState(state);
  };
  document.querySelector("[data-page-builder-exit]")?.addEventListener("click", () => {
    cmsPageBuilderOpen = false;
    cmsSetActiveSection("pages");
    render();
  });
  document.querySelectorAll("[data-page-builder-device]").forEach((button) => button.addEventListener("click", () => {
    cmsPageBuilderDevice = button.dataset.pageBuilderDevice;
    render();
  }));
  document.querySelectorAll("[data-page-add-widget]").forEach((button) => button.addEventListener("click", () => {
    const block = cmsCreatePageBlock(button.dataset.pageAddWidget);
    savePageBuilderState((page) => page.blocks.push(block));
    cmsPageBuilderSelectedId = block.id;
    render();
  }));
  document.querySelectorAll("[data-page-select-block], [data-page-block]").forEach((item) => item.addEventListener("click", (event) => {
    if (event.target.closest(".lpb-block-tools")) return;
    cmsPageBuilderSelectedId = item.dataset.pageSelectBlock || item.dataset.pageBlock;
    render();
  }));
  document.querySelector("[data-page-block-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    savePageBuilderState((page) => {
      const index = page.blocks.findIndex((block) => block.id === values.id);
      if (index >= 0) page.blocks[index] = { ...page.blocks[index], ...values, padding: Number(values.padding || page.blocks[index].padding), count: Number(values.count || page.blocks[index].count || 3) };
    });
    render();
  });
  document.querySelectorAll("[data-page-block-delete]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    savePageBuilderState((page) => { page.blocks = page.blocks.filter((block) => block.id !== button.dataset.pageBlockDelete); });
    cmsPageBuilderSelectedId = "";
    render();
  }));
  document.querySelectorAll("[data-page-block-duplicate]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    savePageBuilderState((page) => {
      const index = page.blocks.findIndex((block) => block.id === button.dataset.pageBlockDuplicate);
      if (index < 0) return;
      const copy = { ...page.blocks[index], id: `widget-${Date.now()}-copy` };
      page.blocks.splice(index + 1, 0, copy);
      cmsPageBuilderSelectedId = copy.id;
    });
    render();
  }));
  document.querySelectorAll("[data-page-block-move]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const [id, direction] = button.dataset.pageBlockMove.split(":");
    savePageBuilderState((page) => {
      const index = page.blocks.findIndex((block) => block.id === id);
      const next = Math.max(0, Math.min(page.blocks.length - 1, index + Number(direction)));
      if (index >= 0 && next !== index) page.blocks.splice(next, 0, page.blocks.splice(index, 1)[0]);
    });
    render();
  }));
  let draggedPageBlock = "";
  document.querySelectorAll("[data-page-block]").forEach((block) => {
    block.addEventListener("dragstart", () => { draggedPageBlock = block.dataset.pageBlock; block.classList.add("dragging"); });
    block.addEventListener("dragover", (event) => { event.preventDefault(); block.classList.add("drag-over"); });
    block.addEventListener("dragleave", () => block.classList.remove("drag-over"));
    block.addEventListener("drop", (event) => {
      event.preventDefault();
      const targetId = block.dataset.pageBlock;
      if (!draggedPageBlock || draggedPageBlock === targetId) return;
      savePageBuilderState((page) => {
        const from = page.blocks.findIndex((item) => item.id === draggedPageBlock);
        const to = page.blocks.findIndex((item) => item.id === targetId);
        if (from >= 0 && to >= 0) page.blocks.splice(to, 0, page.blocks.splice(from, 1)[0]);
      });
      render();
    });
  });
  document.querySelector("[data-page-builder-save]")?.addEventListener("click", (event) => {
    savePageBuilderState(() => {});
    event.currentTarget.textContent = "已保存";
  });
  document.querySelector("[data-visual-exit]")?.addEventListener("click", () => {
    cmsVisualEditorOpen = false;
    cmsSetActiveSection("pages");
    render();
  });
  document.querySelectorAll("[data-visual-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      cmsVisualTab = button.dataset.visualTab;
      render();
    });
  });
  document.querySelectorAll("[data-visual-device]").forEach((button) => {
    button.addEventListener("click", () => {
      cmsVisualDevice = button.dataset.visualDevice;
      document.querySelectorAll("[data-visual-device]").forEach((item) => item.classList.toggle("active", item === button));
      const canvas = document.querySelector("[data-visual-canvas]");
      if (canvas) canvas.className = `cms-visual-canvas ${cmsVisualDevice}`;
    });
  });
  document.querySelectorAll("[data-visual-select], [data-visual-layer]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const id = button.dataset.visualSelect || button.dataset.visualLayer;
      if (!["hero-section", "hero-title", "hero-text", "hero-image", "solutions", "products", "about", "innovation", "news", "footer"].includes(id)) return;
      cmsVisualSelected = id;
      render();
      requestAnimationFrame(() => document.querySelector(`[data-visual-canvas] [data-visual-select='${id}']`)?.scrollIntoView({ block: "center" }));
    });
  });
  const visualForm = document.querySelector("[data-visual-form]");
  visualForm?.addEventListener("input", () => cmsVisualUpdateCanvas(visualForm));
  visualForm?.addEventListener("change", () => cmsVisualUpdateCanvas(visualForm));
  document.querySelector("[data-visual-publish]")?.addEventListener("click", () => cmsVisualPublish(visualForm));
  document.querySelectorAll("[data-visual-open-media]").forEach((button) => button.addEventListener("click", () => {
    cmsVisualMediaOpen = true;
    document.querySelector("[data-visual-media-modal]")?.classList.add("open");
  }));
  document.querySelector("[data-visual-close-media]")?.addEventListener("click", () => {
    cmsVisualMediaOpen = false;
    document.querySelector("[data-visual-media-modal]")?.classList.remove("open");
  });
  let pendingVisualMedia = cmsHomeVisualSettings().heroImage;
  document.querySelectorAll("[data-visual-media]").forEach((button) => button.addEventListener("click", () => {
    pendingVisualMedia = button.dataset.visualMedia;
    document.querySelectorAll("[data-visual-media]").forEach((item) => item.classList.toggle("active", item === button));
  }));
  document.querySelector("[data-visual-insert-media]")?.addEventListener("click", () => {
    const field = visualForm?.querySelector("[data-visual-image-value]");
    if (field) field.value = pendingVisualMedia;
    cmsVisualUpdateCanvas(visualForm);
    cmsVisualMediaOpen = false;
    document.querySelector("[data-visual-media-modal]")?.classList.remove("open");
  });
  document.querySelectorAll("[data-visual-upload-trigger]").forEach((button) => button.addEventListener("click", () => {
    cmsVisualEditorOpen = false;
    cmsVisualMediaOpen = false;
    cmsUploadOpen = true;
    cmsActiveSection = "media";
    render();
  }));
  document.querySelectorAll("[data-cms-add]").forEach((button) => {
    button.addEventListener("click", () => {
      cmsAddRecord(button.dataset.cmsAdd);
      cmsFocusEditor();
    });
  });
  document.querySelectorAll("[data-cms-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.cmsEdit;
      cmsEditing[type] = button.dataset.cmsId;
      cmsActiveSection = type;
      render();
      cmsFocusEditor();
    });
  });
  document.querySelectorAll("[data-cms-close]").forEach((button) => {
    button.addEventListener("click", () => {
      cmsEditing[button.dataset.cmsClose] = "";
      render();
    });
  });
  document.querySelectorAll("[data-cms-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.cmsDelete;
      const label = type === "products" ? "产品" : (type === "downloads" ? "下载文件" : "新闻");
      if (window.confirm(`确定要从后台草稿中删除这个${label}吗？`)) cmsDeleteRecord(type, button.dataset.cmsId);
    });
  });
  document.querySelectorAll("[data-cms-editor]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      cmsSaveEditor(form);
    });
  });
  document.querySelectorAll("[data-cms-pick-media]").forEach((button) => {
    button.addEventListener("click", () => {
      const panel = button.closest(".cms-edit-panel") || button.closest(".cms-live-editor");
      const picker = button.closest("[data-cms-media-picker]");
      const value = button.dataset.cmsPickMedia || "";
      const hiddenFields = panel?.querySelectorAll("[data-cms-picked-media]");
      const img = panel?.querySelector(".cms-media-placement img");
      hiddenFields?.forEach((hidden) => {
        hidden.value = value;
      });
      if (img) img.src = value;
      picker?.querySelectorAll("[data-cms-pick-media]").forEach((item) => item.classList.toggle("active", item === button));
      const setText = (selector, text) => {
        const node = panel?.querySelector(selector);
        if (node) node.textContent = text || "";
      };
      setText("[data-cms-selected-title]", button.dataset.cmsTitle);
      setText("[data-cms-selected-url]", value);
      setText("[data-cms-selected-size]", button.dataset.cmsSize || "未知");
      setText("[data-cms-selected-mime]", button.dataset.cmsMime || "图片");
      setText("[data-cms-selected-usage]", button.dataset.cmsUsage || "未分配");
      const pixelNode = panel?.querySelector("[data-cms-selected-pixels]");
      if (pixelNode) {
        pixelNode.textContent = "读取中";
        cmsReadImagePixels(value, (text) => {
          pixelNode.textContent = text;
        });
      }
      cmsUpdateLivePreview(button.closest("[data-cms-live-editor]"));
    });
  });
  cmsUpdateMediaPixelLabels(document);
  document.querySelectorAll("[data-cms-live-editor]").forEach((form) => {
    form.addEventListener("input", () => {
      cmsUpdateLivePreview(form);
      cmsResizeLivePreview();
    });
    form.addEventListener("change", () => {
      cmsUpdateLivePreview(form);
      cmsResizeLivePreview();
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      cmsSaveLiveEditor(form);
    });
  });
  document.querySelectorAll("[data-cms-open-media]").forEach((button) => {
    button.addEventListener("click", () => {
      cmsUploadOpen = false;
      cmsActiveSection = "media";
      render();
    });
  });
  document.querySelectorAll("[data-cms-upload]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await cmsUploadMedia(form);
      } catch (error) {
        cmsBackendStatus = "Local fallback";
        cmsBackendSource = error.message || "上传失败";
        cmsRefreshAdminIfActive();
      }
    });
  });
  document.querySelectorAll("[data-cms-copy-media]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      const value = button.dataset.cmsCopyMedia;
      try {
        await navigator.clipboard.writeText(value);
        button.textContent = "已复制";
      } catch {
        button.textContent = value;
      }
    });
  });
  document.querySelector("[data-cms-manage-download-categories]")?.addEventListener("click", () => {
    cmsDownloadCategoriesOpen = true;
    render({ preserveScroll: true });
  });
  document.querySelector("[data-cms-close-download-categories]")?.addEventListener("click", () => {
    cmsDownloadCategoriesOpen = false;
    render({ preserveScroll: true });
  });
  document.querySelector("[data-cms-add-download-category]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const state = cmsAdminState();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const label = String(values.label || "").trim();
    const slug = String(values.slug || label).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!label || !slug) return;
    const categories = downloadCategories(state);
    if (!categories.some(([key]) => key === slug)) state.downloadCategories = [...categories, [slug, label]];
    cmsSaveState(state);
    cmsDownloadCategoriesOpen = true;
    render({ preserveScroll: true });
  });
  document.querySelectorAll("[data-cms-delete-download-category]").forEach((button) => {
    button.addEventListener("click", () => {
      const slug = button.dataset.cmsDeleteDownloadCategory;
      const state = cmsAdminState();
      if ((state.downloads || []).some((item) => item.type === slug)) return;
      state.downloadCategories = downloadCategories(state).filter(([key]) => key !== slug);
      cmsSaveState(state);
      cmsDownloadCategoriesOpen = true;
      render({ preserveScroll: true });
    });
  });
  document.querySelector("[data-cms-add-menu]")?.addEventListener("click", () => {
    const state = cmsAdminState();
    state.menus = [...cmsMenus(state), { label: "新导航", href: "/", intro: "", children: [] }];
    cmsSaveState(state);
    cmsActiveSection = "menus";
    render();
  });
  document.querySelectorAll("[data-cms-delete-menu]").forEach((button) => {
    button.addEventListener("click", () => {
      const state = cmsAdminState();
      state.menus = cmsMenus(state).filter((_, index) => index !== Number(button.dataset.cmsDeleteMenu));
      cmsSaveState(state);
      cmsActiveSection = "menus";
      render();
    });
  });
  document.querySelectorAll("[data-cms-add-submenu]").forEach((button) => {
    button.addEventListener("click", () => {
      const state = cmsAdminState();
      const menus = cmsMenus(state);
      const index = Number(button.dataset.cmsAddSubmenu);
      if (!menus[index]) return;
      menus[index] = { ...menus[index], children: [...(menus[index].children || []), { label: "新子菜单", href: "/", icon: "" }] };
      state.menus = menus;
      cmsSaveState(state);
      cmsActiveSection = "menus";
      render();
    });
  });
  document.querySelectorAll("[data-cms-delete-submenu]").forEach((button) => {
    button.addEventListener("click", () => {
      const [menuIndex, childIndex] = button.dataset.cmsDeleteSubmenu.split(":").map(Number);
      const state = cmsAdminState();
      const menus = cmsMenus(state);
      if (!menus[menuIndex]) return;
      menus[menuIndex] = { ...menus[menuIndex], children: (menus[menuIndex].children || []).filter((_, index) => index !== childIndex) };
      state.menus = menus;
      cmsSaveState(state);
      cmsActiveSection = "menus";
      render();
    });
  });
  document.querySelectorAll("[data-cms-edit-media]").forEach((card) => {
    const openEditor = (event) => {
      if (event.target.closest("[data-cms-copy-media]")) return;
      cmsEditingMediaId = card.dataset.cmsEditMedia;
      render({ preserveScroll: true });
    };
    card.addEventListener("click", openEditor);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openEditor(event);
      }
    });
  });
  document.querySelectorAll("[data-cms-close-media-editor]").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (event.target.closest("[data-cms-media-editor-dialog]") && !event.target.closest("button[data-cms-close-media-editor]")) return;
      cmsEditingMediaId = "";
      render({ preserveScroll: true });
    });
  });
  document.querySelector("[data-cms-media-prev]")?.addEventListener("click", () => {
    const media = cmsAdminState().media;
    const index = media.findIndex((asset) => asset.id === cmsEditingMediaId);
    if (index > 0) {
      cmsEditingMediaId = media[index - 1].id;
      render({ preserveScroll: true });
    }
  });
  document.querySelector("[data-cms-media-next]")?.addEventListener("click", () => {
    const media = cmsAdminState().media;
    const index = media.findIndex((asset) => asset.id === cmsEditingMediaId);
    if (index >= 0 && index < media.length - 1) {
      cmsEditingMediaId = media[index + 1].id;
      render({ preserveScroll: true });
    }
  });
  document.querySelector("[data-cms-media-detail]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    cmsSaveMediaDetails(event.currentTarget);
  });
  document.querySelectorAll("[data-cms-focus-upload]").forEach((button) => {
    button.addEventListener("click", () => {
      cmsUploadOpen = true;
      cmsActiveSection = "media";
      render();
      requestAnimationFrame(() => document.querySelector("[data-cms-upload]")?.scrollIntoView({ block: "start", behavior: "smooth" }));
    });
  });
  document.querySelectorAll("[data-cms-close-upload]").forEach((button) => {
    button.addEventListener("click", () => {
      cmsUploadOpen = false;
      render();
    });
  });
  document.querySelectorAll(".nav-item").forEach((item) => {
    const mega = item.querySelector(".mega");
    if (!mega) return;
    item.addEventListener("mouseenter", () => item.classList.add("open"));
    item.addEventListener("mouseleave", () => item.classList.remove("open"));
    item.addEventListener("focusin", () => item.classList.add("open"));
    item.addEventListener("focusout", () => item.classList.remove("open"));
  });
  const getHeroCount = () => document.querySelectorAll("[data-hero]").length || data.hero.length;
  const getActiveHeroIndex = () => Number(document.querySelector("[data-hero].active")?.dataset.hero ?? heroIndex);
  document.querySelectorAll("[data-hero]").forEach((button) => button.addEventListener("click", (event) => {
    event.preventDefault();
    markHeroInteraction();
    heroIndex = Number(button.dataset.hero);
    render();
  }));
  document.querySelector("[data-hero-prev]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    markHeroInteraction();
    const count = getHeroCount();
    const current = getActiveHeroIndex();
    heroIndex = (current + count - 1) % count;
    render();
  });
  document.querySelector("[data-hero-next]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    markHeroInteraction();
    const count = getHeroCount();
    const current = getActiveHeroIndex();
    heroIndex = (current + 1) % count;
    render();
  });
  document.querySelector("[data-case-prev]")?.addEventListener("click", () => {
    caseIndex = Math.max(0, caseIndex - 1);
    render();
  });
  document.querySelector("[data-case-next]")?.addEventListener("click", () => {
    caseIndex = Math.min(data.cases.length - 2, caseIndex + 1);
    render();
  });
  document.querySelector("[data-news-prev]")?.addEventListener("click", () => {
    newsIndex = Math.max(0, newsIndex - 1);
    render();
  });
  document.querySelector("[data-news-next]")?.addEventListener("click", () => {
    newsIndex = Math.min(data.news.length - 2, newsIndex + 1);
    render();
  });
  const referenceStage = document.querySelector("[data-product-reference-stage]");
  const setProductReference = (nextIndex, direction) => {
    if (!referenceStage) return;
    const cards = Array.from(referenceStage.querySelectorAll("[data-product-reference-card]"));
    const count = cards.length;
    if (!count) return;
    const activeIndex = ((nextIndex % count) + count) % count;
    const previousIndex = (activeIndex + count - 1) % count;
    const followingIndex = (activeIndex + 1) % count;
    const wrappedIndex = direction === "next" ? followingIndex : direction === "prev" ? previousIndex : -1;
    const wrappedCard = cards.find((card) => Number(card.dataset.productReferenceCard) === wrappedIndex);
    wrappedCard?.classList.add("is-resetting");
    cards.forEach((card) => {
      const index = Number(card.dataset.productReferenceCard);
      card.classList.toggle("is-active", index === activeIndex);
      card.classList.toggle("is-prev", index === previousIndex);
      card.classList.toggle("is-next", index === followingIndex);
      card.setAttribute("aria-hidden", index === activeIndex ? "false" : "true");
      if (index === activeIndex) card.removeAttribute("tabindex");
      else card.setAttribute("tabindex", "-1");
    });
    referenceStage.dataset.activeIndex = String(activeIndex);
    productReferenceIndex = activeIndex;
    requestAnimationFrame(() => requestAnimationFrame(() => wrappedCard?.classList.remove("is-resetting")));
  };
  document.querySelector("[data-product-reference-prev]")?.addEventListener("click", () => setProductReference(productReferenceIndex - 1, "prev"));
  document.querySelector("[data-product-reference-next]")?.addEventListener("click", () => setProductReference(productReferenceIndex + 1, "next"));
  bindPointerParallax();
}

window.addEventListener("resize", cmsResizeLivePreview);
window.addEventListener("resize", updateCategoryHeroScroll);
window.addEventListener("resize", syncSourceScrollReveal);

function bindPointerParallax() {
  if (window.SITE_NO_MOTION) return;
  document.querySelectorAll(".products, .series-hero").forEach((section) => {
    const isDetail = section.classList.contains("series-hero");
    const update = (event) => {
      const rect = section.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      section.style.setProperty(isDetail ? "--detail-mx" : "--product-mx", `${(px * (isDetail ? 24 : 18)).toFixed(2)}px`);
      section.style.setProperty(isDetail ? "--detail-my" : "--product-my", `${(py * (isDetail ? 18 : 12)).toFixed(2)}px`);
    };
    section.addEventListener("pointermove", update, { passive: true });
    section.addEventListener("mousemove", update, { passive: true });
    section.addEventListener("pointerleave", () => {
      section.style.setProperty(isDetail ? "--detail-mx" : "--product-mx", "0px");
      section.style.setProperty(isDetail ? "--detail-my" : "--product-my", "0px");
    }, { passive: true });
  });
}

window.addEventListener("hashchange", render);
window.addEventListener("popstate", render);
window.addEventListener("scroll", scheduleScrollEffects, { passive: true });
window.addEventListener("resize", () => {
  updateCategoryHeroScroll();
  syncSourceScrollReveal();
  syncScrollEffects();
});
setInterval(() => {
  if (window.SITE_NO_MOTION) return;
  if (getRoutePath() !== "/") return;
  if ((location.hash || "#home").startsWith("#detail")) return;
  if (window.scrollY > 40) return;
  if (document.querySelector(".nav-item.open, .nav-item:focus-within")) return;
  if (Date.now() - lastHeroInteractionAt < 8000) return;
  heroIndex = (heroIndex + 1) % data.hero.length;
  render();
}, 12000);

render();
cmsLoadBackendState();
loadPublicForms();


    if (cmsVisualSelected === "hero-section") { const video=section.querySelector("video"); if(video) video.src=visual.heroVideo; }
