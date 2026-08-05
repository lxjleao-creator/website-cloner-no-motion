# CMS architecture

This clone should evolve into a WordPress-style content manager without forcing future content edits into `app-v3.js`.

## Content model

- `content/globals/header.json`: logo, top links, main nav, mega menus, contact button and region selector.
- `content/globals/footer.json`: footer logo, subscribe form, footer columns and legal/support links.
- `content/globals/footer-cta.json`: shared CTA headline, background image, video and button.
- `content/product-categories/*.json`: product category name, slug, icon, intro, hero media, sort order and SEO.
- `content/products/{category}/*.json`: product title, slug, route, hero image, summary, stats, highlights, gallery, downloads and SEO.
- `content/news/*.json`: article title, date, cover image, excerpt, rich text body, related news and SEO.
- `content/pages/*.json`: normal page hero, sections, media and SEO.
- `content/downloads/{type}/*.json`: downloadable file metadata and product relation.

## Templates

- `templates/global/header`: shared header for every public page.
- `templates/global/footer`: shared footer for every public page.
- `templates/products/product-hub`: `/products`.
- `templates/products/category-list`: `/products/{category}`.
- `templates/products/detail`: `/products/{category}/{productId}`.
- `templates/news/list`: `/news` and paginated news listing.
- `templates/news/detail`: `/news/{articleId}`.
- `templates/pages/default`: company, innovation, privacy and other normal pages.

## Admin modules

- Dashboard: record counts, content directories and route/template mapping.
- Header / Footer: edit global layout components independently.
- Products: add, delete, sort and edit product records by category.
- News: manage news articles separately from product pages.
- Templates: edit list/detail templates once and apply them to all matching records.
- Assets: upload product images, news covers, hero media, documents and brand assets.
- Build Plan: implementation sequence for Hostinger PHP/JSON persistence.

The current `/cms` screen is connected to `/admin/api.php`. In local development, `serve-static.js` simulates the same endpoint and writes to `content/cms-state.json`. On Hostinger, `admin/api.php` writes the same JSON file through PHP. The browser still keeps a `localStorage` fallback if the API is unavailable.

## Recommended Hostinger implementation

Use Hostinger `Custom PHP/HTML website`.

1. Keep the public site as static HTML/CSS/JS.
2. Add a password-protected `/admin` folder.
3. Store editable data as JSON files under `/content`.
4. Store uploaded files under `/uploads`.
5. Add PHP endpoints for login, read, save, upload and delete.
6. Make the public front-end render from JSON records, so content changes do not require code edits.

## Current connected endpoint

- `GET /admin/api.php?action=state`: returns the CMS JSON state.
- `POST /admin/api.php?action=save`: saves `{ "state": { "products": [], "news": [] } }` into `content/cms-state.json`.
- Local dev server support is implemented in `serve-static.js`.
- Hostinger PHP support is implemented in `admin/api.php`.
