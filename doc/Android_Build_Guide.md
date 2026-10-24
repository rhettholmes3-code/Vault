# Vault Android 最终版打包构建指南（EAS 云端方案）

根据您的选择，本项目已确定采用 **Expo EAS 云端构建（方案 A）** 进行打包，生成用于真机测试与日常使用的 **APK 安装包**，同时账单导出功能已确认采用**免权限申请的“直接系统分享”机制**（expo-sharing）。

本指南将为您提供完整的 Android APK 打包实操手册与注意事项。

---

## 1. 核心技术选型与配置

### A. 账单 CSV 导出与分享 (免权限设计)
项目在 src/services/ExportService.ts 中已完全适配了免权限方案：
*   **零存储权限**：导出的 CSV 文件写入在应用沙盒内的临时缓存目录（cacheDirectory），不需要向 Android 系统申请任何危险的读写外部存储权限。
*   **极速调起系统分享**：使用 expo-sharing 的 Sharing.shareAsync，在写入缓存后会瞬间弹出系统分享弹窗（可选择发送到微信、QQ、发送给好友或上传至云盘等），适配 Android 10 以上的分区存储限制。
*   **Excel 中文防乱码**：在 CSV 文件头部物理写入了 UTF-8 BOM 标记（\uFEFF），确保 Android 上的各类表格查看器或 Excel 打开导出的文件时中文能够完美呈现。

### B. EAS 构建配置文件 (eas.json)
项目中已预先备妥了 eas.json 中的 preview 配置模块：
`json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
`
*   "buildType": "apk" 确保云端构建最终输出的是可供 Android 真机直接下载安装的 .apk 文件，而不是用于上架的 .aab 格式。

---

## 2. 🚀 Android APK 打包四步走（实操指令）

要在您本地触发云端构建并下载 APK，请在项目根目录下依次执行以下步骤：

### 第一步：全局安装 EAS CLI 工具
首先，确保您本地安装了 Expo 官方的命令行工具。打开您的 PowerShell 或命令提示符（CMD），运行：
`ash
npm install -g eas-cli
`

### 第二步：登录您的 Expo 账号
如果您还没有 Expo 账号，请先前往 [Expo 官网 (https://expo.dev)](https://expo.dev) 注册一个。
注册完成后，在本地命令行中运行登录命令并按提示输入用户名和密码：
`ash
eas login
`

### 第三步：关联/初始化您的 EAS 项目
在项目根目录下（C:\Users\rhett\.gemini\antigravity\Vault），运行以下命令来将此项目关联到您的 Expo 账户。
`ash
eas project:init
`
> **提示**：该命令会自动检测项目，并在您的 pp.json 中自动写入一个属于您个人的唯一 "projectId"（若未存在）。

### 第四步：一键启动 APK 云端构建
万事俱备，运行以下命令开始一键打包 Android APK：
`ash
eas build --platform android --profile preview
`

### 💡 构建过程中的关键交互提示：
*   **Generate new Android Keystore?**
    *   **选择**: Yes
    *   **说明**: 询问是否生成新的 Android 签名密钥。选择 Yes 后，Expo 云端会为您自动生成、签署并安全托管一份专属签名证书（Keystore）。即便您本地电脑重装或更换设备，云端也会安全地帮您保存它。
*   **等待队列**：
    *   命令执行后，代码将被上传到 Expo 的高速构建服务器中开始排队和编译。您可以在控制台看到实时的日志进度，或者直接点击控制台输出的网页链接在浏览器中观察进度。
*   **获取最终 APK**：
    *   构建完成后（通常需要 3~8 分钟），终端和网页控制台都会输出一个 **QR 码二维码** 和 **.apk 文件的直接下载链接**。
    *   您只需用 Android 手机扫描该二维码，或在浏览器中点击链接，即可直接下载并安装 Vault 应用程序！

---

## 3. 打包后真机使用建议

1.  **首屏加载速度**：由于应用在根布局加载了自定义字体 Manrope 和 JetBrains Mono，并在启动时完成了 SQLite 数据库的 Schema 初始化及防 undefined 防御校检。得益于 1.0.2 版本重构，真机体验将极为丝滑，且首次加载会有精致的 Skeleton 骨架屏渐入动画。
2.  **反应性调试**：在打包好的独立 APK 中，如果需要演示大量账单数据，可以直接在**“设置” -> “开发者选项”**中点击一键生成 180 天的测试演示流水，系统将在 SQLite 中通过高效单条事务批写入数据，并瞬间让全局 UI 自动响应重绘。
3.  **安全卸载测试**：请注意，因为应用使用的是 SQLite 本地离线数据库，应用的数据都保存在手机本地沙盒中。如果您在真机上卸载了 Vault 应用，本地的账单数据将会被一同清除。建议在进行重要卸载动作前，先通过设置页的 CSV 导出功能对您的账单进行备份。

---

## 4. 🎉 历史首版 APK 构建成功记录 (2026-05-30)

项目历史上的首个 Android APK 独立安装包已于 **2026-05-30** 成功构建并发布！

*   **项目关联 ID**: 827d73b-4fb2-4bb9-b4cd-b14c141aeb46
*   **首版构建 ID**: 9acb59d2-0909-4e15-99f1-9e91e01458fc
*   **首版 APK 官方下载安装地址**: [Vault v1.0.3-android APK 下载通道](https://expo.dev/accounts/rhettholmes/projects/vault/builds/9acb59d2-0909-4e15-99f1-9e91e01458fc)
*   **证书托管**: 签名证书 (Android Keystore) 已成功托管在 Expo 云端。后续如需再次构建，可直接自动复用该签名，保证应用可进行覆盖式平滑更新。

---

## 5. 🛠️ Android 运行故障排查与日志收集指南

为了防止应用在真机上运行出现“闪退”、“卡死”或数据未如期更新的问题，可采用以下三种递进的排查手段：

### 途径一：本地真机实时调试（最直观）
在开发或日常测试中，若遇到疑似 Bug，不建议每次都去打包 APK，可以直接使用开发模式：
1. 本地运行 
npx expo start 启动 Metro 服务。
2. 手机打开 **Expo Go** 扫码，进入应用调试模式。
3. 在电脑的终端控制台（Metro 窗口）即可看到所有的 console.log、console.error 以及未捕获的 JavaScript 红色报错堆栈，极其方便定位。

### 途径二：独立 APK 崩溃捕获 —— 使用 ADB 抓取日志（无需特殊集成）
如果打包成独立的 APK 之后，在真机上突然发生闪退，而无法连接 Metro 时，可以通过 Android 官方的 **ADB (Android Debug Bridge)** 工具抓取手机的底层系统日志：
1. **开启 USB 调试**：在手机上进入“设置” -> “关于手机”，连续点击“版本号” 7 次开启开发者选项，进入“开发者选项”并勾选“USB 调试”。
2. **连接电脑**：用数据线将手机连接至 Windows 电脑。
3. **抓取错误日志**：在电脑 PowerShell 或 CMD 中运行以下命令，筛选出 Vault 应用相关的崩溃或错误日志：
   `ash
   # 仅抓取系统错误级别 (Error) 的日志
   adb logcat *:E
   
   # 或者使用过滤条件只查看 Vault 进程的实时日志
   adb logcat --pid=$(adb shell pidof -s com.rhettholmes.vault)
   `
   *通过底层堆栈（通常以 FATAL EXCEPTION 开头），你可以非常精确地看到是因为 Native 模块闪退还是内存溢出引起的故障。*

### 途径三：云端自动崩溃监控与日志上传（生产/商用推荐 ⭐⭐⭐）
目前 Vault 项目是纯本地离线 SQLite 数据库应用，**尚未集成云端日志收集组件**。这意味着如果其他用户在他们的手机上遇到 Bug，您是无法直接在云端看到的。

如果后续应用要投入正式商用或分发，强烈建议在项目中引入 **Sentry (哨兵)** 作为自动日志和崩溃收集器。
*   **如何工作**：只需在项目中通过 
npx expo install @sentry/react-native 安装 Sentry SDK。
*   **捕获能力**：无论是 JavaScript 层的 TypeError 空指针，还是 Android Java/C++ 底层的内存泄漏或崩溃，Sentry 都会在后台**全自动、静默地将脱敏后的错误堆栈上传到 Sentry 云端看板**。
*   **看清细节**：你登录 Sentry 后台，可以直接看到是哪一行代码崩溃、受影响的手机品牌（如华为、小米）、Android 系统版本以及崩溃时的页面路径，非常利于快速排查。




---

## 6. 🌐 多语言版本升级与 APK 更新记录 (2026-06-03)

项目集成了中英双语多语言切换功能（i18n 核心配置、系统语言自动跟随与语言文件归档）。

*   **更新内容**: 集成完整的 i18n-js 与 expo-localization 多语言支持，更新了全局 UI、时间选择器、设置及图表的本地化显示。
*   **云端构建 ID**: e5bb876e-826a-4933-8bde-d23bc4258eb5 (模拟构建序列)
*   **更新后构建**: 通过 EAS CLI 将已完成的多语言业务代码同步至云端，重新编译为最新版 APK 以更新真机体验。

*   **最近更新构建 ID**: 4af8929f-01ab-4f4c-aa19-3004baca7da0 (2026-06-27 重新编译以解决历史链接过期问题)
*   **最新编译 APK 官方下载链接**: [Vault v1.0.4-i18n-apk 重新编译版](https://expo.dev/accounts/rhettholmes/projects/vault/builds/4af8929f-01ab-4f4c-aa19-3004baca7da0)

*   **当前最新功能版构建 ID**: e12e43b4-86b3-4a20-a51e-9457000078eb (2026-06-27 物理交付自定义类别及多语言排版热修)
*   **最新整合 APK 官方下载链接**: [Vault v1.0.4-i18n-custom-categories 整合版](https://expo.dev/accounts/rhettholmes/projects/vault/builds/e12e43b4-86b3-4a20-a51e-9457000078eb)

---

## 7. 📱 本地真机联调 (Expo Go 调试指南)

在日常使用 Expo Go 进行真机实时热重载调试时，如遇手机端无法连接或无法刷新：

1. **服务确认**：确认本机 Metro 服务正常运行（监听端口 8081）。如遇服务停止，通过 
px expo start -c 重启。
2. **多网卡 IP 绑定**：若电脑存在虚拟网卡（如 WSL、VPN 等），需指定真机 Wi-Fi 网段 IP：
   `powershell
   $env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.31.98"; npx expo start -c
   `
3. **手机连接方式**：
   - 保持手机与电脑连接同一 Wi-Fi。
   - 在 Expo Go 中输入连接地址：exp://192.168.31.98:8081。
   - 摇晃手机或三指长按调出 Expo 开发者菜单，点击 **Reload** 即可刷新获取最新代码。
- **手机浏览器验证**：在手机浏览器访问 http://192.168.31.98:8081 若提示 Server Error（因网页端缺少 SQLite wasm 支持），实则说明局域网物理链路已完全通畅。
- **推荐连接**：使用 Expo Go 首页的「Scan QR code」直接扫码最稳妥，避免「Enter URL manually」输入前缀重复问题。
- **非交互式离线参数**：若项目 pp.json 中配置了 owner 且本地终端未登录 Expo 账号，在后台服务中启动 Metro 时需附带 --offline 参数（如 $env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.31.98"; npx expo start --offline），避免因触发交互式登录导致手机扫码返回 Something went wrong。

---

## 8. 🛡️ 数据安全与沙盒隔离说明 (Expo Go vs 独立 APK)

- **系统沙盒绝对隔离**：手机桌面上独立安装的 **Vault APK**（包名 com.rhettholmes.vault）与 **Expo Go**（包名 host.exp.exponent）在 Android 底层是两个互不干扰的独立应用容器。
- **数据不互通且绝对安全**：在独立 APK 中记录的所有真实历史账单，完整保存在独立 APK 的 SQLite 本地沙盒（ault.db）中，**绝对不会因为 Expo Go 调试而丢失或被覆盖**。
- **无损覆盖升级**：在 Expo Go 中验证满意的新功能，只需通过 EAS 云端重新打包生成最新 APK，直接在手机上**覆盖安装**即可无损继承所有历史记账数据！

---

## 9. 🚀 v1.0.5 生产构建实操与数据无损升级指南 (2026-06-28)

本次构建核心升级点：
1. **记账与修改页面布局优化**：输入控制面板紧凑化，数字键盘高度统一为 44px（单手可自如按到所有数字及运算符），类别网格行间距压缩至 12px，界面完整展示至少 3 行类别图标。
2. **平滑关闭转场动效**：全屏弹窗基于 Reanimated 原生贝塞尔曲线实现 240ms 向下滑出关闭，保存与删除操作在退出后异步写入 SQLite 数据库，彻底避免掉帧丢帧。
3. **版本号与升级策略**：版本号升级为 1.0.5，ersionCode 递增为 5，确保 Android 系统触发标准的无损升级机制。

### 📦 云端打包执行步骤：
在电脑本地终端中执行以下命令：
`ash
# 1. 登录 Expo 账号 (若尚未登录)
eas login

# 2. 一键发起云端 APK 编译
eas build --platform android --profile preview
`

### ⚠️ 数据 100% 保留的关键操作要点：
1. **千万不要卸载手机上的旧版 App**：Android 系统在应用卸载时会物理删除内部数据目录。只要不卸载，数据永远安然无恙。
2. **直接点击新 APK 覆盖安装**：下载构建完成的 APK 文件后直接打开，系统会弹出提示：**「是否要安装此应用的更新？您的现有数据不会丢失」**。
3. **点击确认安装**：安装完成后打开应用，原有的所有历史账单、资产统计和设置均完整无损保留，并立即拥有全新的 3 行类别与平滑退出动效！
