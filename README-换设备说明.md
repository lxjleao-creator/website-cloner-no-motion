# 快速仿站项目换设备说明

这是当前 FOX ESS 澳大利亚站仿站的本地开发包。包内包含前端页面、CMS 数据模型、占位素材、产品详情素材和本地静态服务器脚本。

## 1. 解压

把压缩包解压到新设备上的任意目录，例如：

```powershell
D:\Codex App\快速仿站
```

建议路径不要太深，避免 Windows 路径过长。

## 2. 推荐启动方式

新设备如果已经安装 Node.js，在项目目录打开 PowerShell，运行：

```powershell
cd "D:\Codex App\快速仿站"
$env:PORT=8766
node .\serve-static.js
```

浏览器打开：

```text
http://127.0.0.1:8766/
```

如果 8766 被占用，可以换端口：

```powershell
$env:PORT=8770
node .\serve-static.js
```

然后打开：

```text
http://127.0.0.1:8770/
```

## 3. 没有 Node.js 时的临时启动方式

Windows 自带 PowerShell 也可以临时预览：

```powershell
cd "D:\Codex App\快速仿站"
$env:PORT=8765
powershell -ExecutionPolicy Bypass -File .\tools\static-server.ps1
```

打开：

```text
http://127.0.0.1:8765/
```

注意：推荐优先用 Node.js 的 `serve-static.js`，它对视频和大素材的支持更稳定。

## 4. 局域网给另一台设备访问

在运行服务器的电脑上查看局域网 IP：

```powershell
ipconfig
```

找到类似 `192.168.x.x` 的 IPv4 地址。如果服务器端口是 8766，另一台同局域网设备访问：

```text
http://192.168.x.x:8766/
```

如果打不开，检查 Windows 防火墙是否允许该端口。

## 5. 常用页面

```text
首页: http://127.0.0.1:8766/
产品集合页: http://127.0.0.1:8766/products
产品分类页: http://127.0.0.1:8766/products/pv-inverter
产品详情页示例: http://127.0.0.1:8766/products/pv-inverter/10
新闻列表: http://127.0.0.1:8766/news
新闻详情示例: http://127.0.0.1:8766/news/41
案例列表: http://127.0.0.1:8766/resource-support/references
下载页: http://127.0.0.1:8766/download/datasheets
CMS 管理页原型: http://127.0.0.1:8766/cms
```

## 6. 主要文件说明

```text
index.html              入口页面
styles.css              全站样式和响应式布局
app-v3.js               主前端逻辑、路由、首页动画、页面渲染
cms-pages-v3.js         爬取并整理后的 CMS 页面数据
clickable-pages.js      可点击页面/路由数据
clickable-routes.json   源站可点击路径检查清单
product-media.js        产品详情素材映射
serve-static.js         推荐本地静态服务器
tools/static-server.ps1 PowerShell 临时静态服务器
assets/fox-placeholder  当前占位图片、视频、Logo、产品素材
qa-screenshots          本地 QA 截图和检查结果
```

## 7. 替换素材和内容

当前素材是仿站占位素材，后续正式商用前请替换为自己的品牌素材。

常见替换位置：

```text
Logo: assets/fox-placeholder/logo-dark.svg, logo-light.svg, fox-mark.png
首页视频: assets/fox-placeholder/hero-video.mp4
家庭场景: assets/fox-placeholder/solution-home.jpg, solution-flow.mp4
产品组合图: assets/fox-placeholder/products.png
地球动画: assets/fox-placeholder/earth.mp4
Innovation 视频: assets/fox-placeholder/innovation-production.mp4
产品详情图: assets/fox-placeholder/product-detail/
```

内容数据主要在：

```text
cms-pages-v3.js
clickable-pages.js
product-media.js
app-v3.js
```

后续如果继续做傻瓜式后台，可以优先把这些 JS 数据迁移成 JSON 或数据库表。

## 8. 换设备后检查清单

1. 解压后先运行 `node .\serve-static.js`。
2. 打开首页，确认视频、Logo、导航下拉、滚动动画正常。
3. 点击 Products，确认可以进入 `/products`。
4. 点击任意产品分类和详情页，确认页面不是空白。
5. 打开 `/news`、`/resource-support/references`、`/download/datasheets`。
6. 打开手机尺寸或真实手机访问，确认没有文字遮挡和横向滚动。

## 9. 当前本地验证结果

打包前已检查：

```text
本地服务: http://127.0.0.1:8766/
116 个本地可点击路径: 全部 HTTP 200
桌面首页关键滚动节点: 无控制台错误
移动端抽查: 无横向溢出、无文字裁切
```

