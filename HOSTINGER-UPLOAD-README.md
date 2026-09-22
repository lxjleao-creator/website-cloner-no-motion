# Hostinger Upload Notes

Upload everything in this package to the website root, usually `public_html`.

Before using the CMS on a fresh installation, configure `CMS_ADMIN_USERNAME` and
`CMS_ADMIN_PASSWORD` in the server environment. The password must contain at
least 10 characters. The application no longer ships a fixed default account.

Required entry file:

```text
index.html
```

The `.htaccess` file is required for direct links such as:

```text
/products
/products/pv-inverter/10
/download/datasheets
/news
/contact-us
```

After uploading, open the temporary Hostinger domain or your connected domain and test:

```text
/
/products
/products/pv-inverter/10
/news
```
