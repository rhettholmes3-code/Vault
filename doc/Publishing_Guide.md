# Vault 发布至 Google Play 与 OTA 热更新实操指南

本指南将协助您将 Vault 个人记账应用部署并发布至 **Google Play 商店**，同时配置 **Expo Updates (OTA)** 热更新机制，以便在后续无需重复向应用商店提交审核即可更新应用。

---

## 1. 🌐 第一步：准备隐私政策网页（基于 GitHub Pages）

Google Play 要求所有上架应用必须提供一个公开访问的隐私政策网址（Privacy Policy URL）。由于 Vault 是 100% 离线、隐私优先的应用，您可以使用 GitHub 的静态网页托管服务（GitHub Pages）来放置此页面。

### 操作步骤：
1. 在 GitHub 上新建一个公开的仓库，命名为 `vault-privacy`。
2. 在该仓库根目录下，新建一个 `index.html` 文件，复制并贴入以下模板内容。
3. 提交代码后，进入仓库的 **Settings -> Pages**，将 Source 设置为 `Deploy from a branch` (通常是 `main` 分支的 `/root`)，保存。
4. 几分钟后即可获得形如 `https://rhettholmes3-code.github.io/Vault/` 的链接，将此链接填入 Google Play 控制台和 `app.json` 中。

### 📄 隐私政策 HTML 模板：
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vault 隐私政策</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
        h1 { color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        h2 { color: #2563eb; margin-top: 30px; }
        .highlight { background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 10px; margin: 15px 0; }
    </style>
</head>
<body>
    <h1>Vault 隐私政策</h1>
    <p>更新日期：2026年6月3日</p>
    
    <div class="highlight">
        <strong>🔒 隐私核心承诺：</strong><br>
        Vault 是一款<strong>隐私优先、完全离线</strong>的个人财务记账应用。我们<strong>不</strong>收集、<strong>不</strong>存储、<strong>不</strong>传输您的任何个人财务数据。所有数据均保存在您设备的本地 SQLite 数据库中。
    </div>

    <h2>1. 数据收集与使用</h2>
    <p>应用在运行期间无需连接网络，亦不提供任何账号注册功能：</p>
    <ul>
        <li><strong>财务记录</strong>：您记录的每一笔支出、收入、预算和类别均只保存在您本人的设备上。</li>
        <li><strong>网络权限</strong>：应用不要求网络连接权限，您的账单数据绝无泄漏到云端的可能。</li>
    </ul>

    <h2>2. 数据存储与安全</h2>
    <p>所有数据由 Expo SQLite 驱动存储于应用沙盒中。如果您卸载本应用，保存在本设备上的账单数据将被永久清除。建议您使用应用内提供的“CSV 导出”功能定期手动备份数据。</p>

    <h2>3. 隐私政策的变更</h2>
    <p>我们可能会不时更新本隐私政策。任何更改都将在此页面公布。</p>

    <h2>4. 联系我们</h2>
    <p>如果您对本隐私政策有任何疑问，请通过 GitHub 仓库向我们提交 Issue。</p>
</body>
</html>
```

---

## 2. 🔑 第二步：注册 Google 开发者账号并获取 API 密钥

要启用 EAS Submit 自动发布，您需要向 Expo 提供谷歌云端服务账号的 API 密钥。

### 2.1 注册 Google Play 开发者账号
1. 访问 [Google Play Console](https://play.google.com/console/signup)。
2. 使用您的 Google 账号登录，并支付一次性 **25 美元** 的注册费用。
3. 按照指引完成身份认证。

### 2.2 创建谷歌服务账号 API 密钥 (用于自动化发布)
1. 登录并进入 [Google Cloud Platform 控制台](https://console.cloud.google.com/)。
2. 确保选择了您与 Google Play 关联的 Google Cloud 项目。
3. 进入 **“IAM 和管理” -> “服务账号” (Service Accounts)**。
4. 点击 **“创建服务账号”**，赋予该账号 **“管理员”** 或 **“Release Manager”** 角色权限。
5. 创建完毕后，在服务账号列表页中点击该账号的 **“密钥” (Keys) -> “添加密钥” -> “创建新密钥”**，选择 **JSON** 格式。
6. 下载该 JSON 密钥文件，重命名为 `pc-api-key.json`，并将其移动到 Vault 项目根目录下。

> [!WARNING]
> 必须确保将 `pc-api-key.json` 写入到 `.gitignore` 中，绝对不能将其提交到公共代码仓库，以免遭受安全风险！目前项目根目录下的 `.gitignore` 已配置过滤防范。

---

## 3. 🚀 第三步：EAS 自动发布（EAS Submit）

当您在 Google Play 开发者后台创建好您的应用，并且关联了密钥后，即可通过命令行触发全自动打包与发布。

### 3.1 生成用于上架的 AAB 安装包
Google Play 要求必须上传 `.aab` 格式。运行以下命令启动云端生产构建：
```bash
eas build --platform android --profile production
```
*构建成功后，Expo 云端会为您保留生成的 AAB 包。*

### 3.2 一键自动上传至谷歌控制台
运行以下命令，EAS 会自动拉取刚才生成的 AAB 包，并通过您在 `eas.json` 中配置的 `pc-api-key.json` 安全密钥，将其直接推送至 Google Play 开发者后台的 **内部测试轨道 (Internal Test Track)**：
```bash
eas submit --platform android
```
*(如果您希望一步到位地编译并直接上传，可以使用命令：`eas build --platform android --profile production --auto-submit`)*

---

## 4. ⚡ 第四步：OTA 线上热更新配置与发布 (Expo Updates)

得益于我们在项目里集成的 `expo-updates`，当您修改了 JavaScript 代码、图表布局或多语言文案时，**不需要**重新打包 AAB 和提交谷歌审核，可以直接热更新至用户设备。

### 4.1 原理说明
*   **运行时版本 (Runtime Version)**：我们在 `app.json` 中设置了 `"runtimeVersion": { "policy": "appVersion" }`。这意味着只有具有相同原生版本号（如 `1.0.0`）的客户端，才能接收针对该原生版本的 OTA 更新，防范因原生插件不一致而导致崩溃。
*   **更新通道 (Channel)**：构建包指定了发布通道。由于我们在 `eas.json` 中的 `production` 构建里配置了 `"channel": "production"`，所以线上安装的包会自动监听 `production` 通道的更新。

### 4.2 发布热更新命令
当您修改了 JavaScript 业务层面的代码（非原生插件更改）后，在命令行中只需执行：
```bash
# 发布热更新到 production 通道，并填写更新备注
eas update --channel production --message "更新说明：修复了趋势图特定分辨率下的显示问题，并微调了翻译"
```

### 4.3 客户端加载逻辑
*   用户打开 Vault 记账应用时，`expo-updates` 会静默在后台检查最新更新。
*   如果有新更新，它会在后台默默下载。
*   **在下一次用户重新启动 App 时，最新的 OTA 补丁会直接生效**，带来无缝的静默升级体验。

---

## 5. 📱 Android 独立 APK 构建与覆盖更新规范 (Zero Data Loss Protocol)

为确保离线用户设备上的历史数据绝对安全，版本发布必须遵守：

### 5.1 覆盖升级与版本单调递增
1. **数据沙盒机制**：独立 APK 数据库位于 Android 私有沙盒 `/data/data/com.rhettholmes.vault/databases/vault.db`。系统覆盖升级（In-Place Upgrade）仅替换 bundle，Android 系统级保障私有数据目录不被擦除。**严禁卸载重装**。
2. **版本号递增**：每次发版，`package.json` 与 `app.json` 的 `version` 需语义化递增（如 `1.1.2` -> `1.2.0`），`android.versionCode` 必须严格单调递增（如 `8` -> `9`）。

### 5.2 发布前必过四大自动化门禁
任何构建触发前必须 100% 依次通过：
1. `npx tsc --noEmit`：0 错误 0 警告；
2. `node scripts/verify_i18n_keys.js`：0 漏翻死键；
3. `node scripts/run_v11_tests.js`：540+ 项测试（**含老版本数据库覆盖升级零数据损毁回归测试**）；
4. `npx expo export --platform android`：Hermes HBC 生产字节码编译预检。

### 5.3 EAS 独立 APK 构建命令
```bash
# 触发独立 APK 云端打包
eas build -p android --profile preview --non-interactive
```
构建产物生成后，Expo 会输出形如 `https://expo.dev/artifacts/eas/...apk` 的下载直链与二维码，支持用户在设备上扫码或点击直接覆盖升级。

### 5.4 客户端更新日志文案规范 (Release Notes Formatting Rule)
由于移动端原生弹窗 (Alert) 默认不支持 Markdown 语法解析（会把 `###`、`**加粗**` 等标记原样显示，造成视觉凌乱）：
1. **纯文本点状清单原则**：GitHub Release 的正文严禁使用多级标题、加粗符号或表格语法；
2. **极简清晰**：统一使用标准圆点符号 `• ` 罗列 3~5 项关键改进（如 `• 修复息屏休眠下定时提醒未准时唤醒的问题`）；
3. **一目了然**：让用户在原生系统弹窗中一眼看清更新核心价值，保持界面克制、体面与专业质感。
